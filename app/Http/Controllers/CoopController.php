<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FindsFamilyRecords;
use App\Models\ChatMessage;
use App\Models\CoopMember;
use App\Models\CoopSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Grown-ups play along with a kid, each on their own device.
 *  - The kid's game (the "host") opens a session and checks in every few seconds.
 *  - The Grown-ups pages show "Mia is playing Bee Smart · Join" while that session is live.
 *  - Each grown-up who joins gets a member token. Up to 4 at once.
 *  - Messages go through here (simple polling, works on any host). The game also tries a direct
 *    phone-to-tablet link (WebRTC) and only uses these routes to introduce the two devices.
 */
class CoopController extends Controller
{
    use FindsFamilyRecords;

    private const MAX_MEMBERS = 4;
    private const COLORS = ['#8b6cff', '#3dc2ff', '#ff6b9d', '#3dd6a3'];

    /** Kid's game opens (or reuses) its session. */
    public function host(Request $request, $game, $kid)
    {
        $game = $this->findGame($game);
        $kid = $this->familyKid($request, $kid);
        abort_unless($game->supportsCoop(), 404);
        $data = $request->validate(['world' => 'nullable|string|max:60', 'session' => 'nullable|integer', 'token' => 'nullable|string|max:40']);

        $session = null;
        if (! empty($data['session']) && ! empty($data['token'])) {
            $session = CoopSession::where('id', $data['session'])->where('user_id', $request->user()->id)
                ->where('kid_id', $kid->id)->where('host_token', $data['token'])->whereNull('ended_at')->first();
        }
        if (! $session) {
            // only one live session per kid + game
            CoopSession::where('user_id', $request->user()->id)->where('kid_id', $kid->id)->where('game', $game->key())
                ->whereNull('ended_at')->update(['ended_at' => now(), 'state' => null]);
            // the last game picture shared with helpers is never kept: wipe it from this family's old sessions
            CoopSession::where('user_id', $request->user()->id)->whereNotNull('state')
                ->where(fn ($q) => $q->whereNotNull('ended_at')->orWhere('updated_at', '<', now()->subHours(2)))->update(['state' => null]);
            $session = CoopSession::create([
                'user_id' => $request->user()->id, 'kid_id' => $kid->id, 'game' => $game->key(),
                'world' => $data['world'] ?? null, 'host_token' => Str::random(32), 'host_seen_at' => now(),
            ]);
        } else {
            $session->update(['world' => $data['world'] ?? $session->world, 'host_seen_at' => now()]);
        }

        return response()->json([
            'session' => $session->id,
            'token' => $session->host_token,
            'urls' => $this->urls($session),
            'features' => $this->features($session),
            'ice' => $this->ice(),
        ]);
    }

    /** Grown-ups pages: which kids are playing a join-able game right now. */
    public function live(Request $request)
    {
        $rows = CoopSession::with('kid')->where('user_id', $request->user()->id)->whereNull('ended_at')
            ->where('host_seen_at', '>=', now()->subSeconds(25))->latest('host_seen_at')->get()
            ->map(fn (CoopSession $s) => [
                'id' => $s->id,
                'kid' => ['name' => $s->kid->name, 'avatar' => $s->kid->avatar, 'color' => $s->kid->color],
                'game' => $this->gameTitle($s->game),
                'key' => $s->game,
                'world' => $s->world,
                'members' => $s->activeMembers()->count(),
                'join' => route('grownups.coop.join', $s->id),
            ]);

        return response()->json(['live' => $rows])->header('Cache-Control', 'no-store, private');
    }

    /** Grown-up's join page (PIN-unlocked area). */
    public function join(Request $request, $session)
    {
        $s = $this->familySession($request, $session);
        $s->load('kid');
        $game = $this->findGame($s->game);

        return response()->view('coop.guard', [
            'session' => $s,
            'game' => $game,
            'coop' => [
                'session' => $s->id,
                'live' => $s->isLive(),
                'game' => $game->key(),
                'title' => $game->title(),
                'kid' => ['name' => $s->kid->name, 'avatar' => $s->kid->avatar, 'color' => $s->kid->color],
                'urls' => $this->urls($s) + ['member' => route('grownups.coop.member', $s->id), 'back' => route('grownups.index')],
                'features' => $this->features($s),
                'ice' => $this->ice(),
            ],
        ])->header('Cache-Control', 'no-store, private');
    }

    /** A grown-up's phone joins with a name ("Grandma"). */
    public function member(Request $request, $session)
    {
        $s = $this->familySession($request, $session);
        $data = $request->validate(['name' => 'required|string|max:30', 'token' => 'nullable|string|max:40']);
        abort_unless($s->isLive(), 410, 'The game has ended.');

        // same phone re-joining (refresh) keeps its spot
        $m = ! empty($data['token']) ? $s->members()->where('token', $data['token'])->first() : null;
        if (! $m) {
            $active = $s->activeMembers()->get();
            if ($active->count() >= self::MAX_MEMBERS) {
                return response()->json(['message' => 'Up to '.self::MAX_MEMBERS.' grown-ups can play at once.'], 409);
            }
            $used = $active->pluck('color')->all();
            $color = collect(self::COLORS)->first(fn ($c) => ! in_array($c, $used, true)) ?? self::COLORS[0];
            $m = $s->members()->create(['token' => Str::random(32), 'name' => trim($data['name']), 'color' => $color, 'last_seen_at' => now()]);
        } else {
            $m->update(['name' => trim($data['name']), 'left_at' => null, 'last_seen_at' => now()]);
        }
        $this->push($s, 'host', $m->token, ['t' => 'join', 'name' => $m->name, 'color' => $m->color]);

        return response()->json(['token' => $m->token, 'name' => $m->name, 'color' => $m->color]);
    }

    /** Both sides: get new messages (+ the latest game picture for grown-ups). Also counts as "still here". */
    public function poll(Request $request, $session)
    {
        $s = $this->familySession($request, $session);
        $data = $request->validate(['token' => 'required|string|max:40', 'since' => 'nullable|integer', 'ver' => 'nullable|integer']);
        [$role, $member] = $this->who($s, $data['token']);
        $since = (int) ($data['since'] ?? 0);

        if ($role === 'host') {
            $s->forceFill(['host_seen_at' => now()])->save();
            $to = ['host'];
        } else {
            $member->forceFill(['last_seen_at' => now()])->save();
            $to = ['*', $member->token];
        }
        $msgs = DB::table('coop_messages')->where('coop_session_id', $s->id)->where('id', '>', $since)->whereIn('recipient', $to)
            ->orderBy('id')->limit(100)->get(['id', 'sender', 'body']);

        $out = [
            'ended' => (bool) $s->ended_at || ! $s->isLive(),
            'msgs' => $msgs->map(fn ($m) => ['id' => $m->id, 'from' => $m->sender, 'body' => json_decode($m->body, true)]),
            'last' => $msgs->max('id') ?? $since,
            'members' => $s->activeMembers()->get(['token', 'name', 'color'])->map(fn ($m) => ['token' => $m->token, 'name' => $m->name, 'color' => $m->color]),
            'features' => $this->features($s), // a grown-up can flip Talk & Chat / Video while the kid plays
        ];
        if ($role === 'member' && $s->state_ver > (int) ($data['ver'] ?? 0)) {
            $out['state'] = json_decode($s->state, true);
            $out['ver'] = $s->state_ver;
        }

        return response()->json($out)->header('Cache-Control', 'no-store, private');
    }

    /** Both sides: send messages. The host may also post the latest game picture. */
    public function send(Request $request, $session)
    {
        $s = $this->familySession($request, $session);
        $data = $request->validate([
            'token' => 'required|string|max:40',
            'msgs' => 'nullable|array|max:40',
            'msgs.*.to' => 'required|string|max:40',
            'msgs.*.body' => 'required|array',
            'state' => 'nullable|array',
        ]);
        [$role, $member] = $this->who($s, $data['token']);
        abort_if($s->ended_at, 410);

        foreach ($data['msgs'] ?? [] as $m) {
            $to = $role === 'host' ? $m['to'] : 'host'; // grown-ups only talk to the kid's game
            $this->push($s, $to, $data['token'], $m['body']);
        }
        if ($role === 'host') {
            $fill = ['host_seen_at' => now()];
            if (isset($data['state'])) {
                $fill['state'] = json_encode($data['state']);
                $fill['state_ver'] = $s->state_ver + 1;
            }
            $s->forceFill($fill)->save();
        } else {
            $member->forceFill(['last_seen_at' => now()])->save();
        }
        if (random_int(1, 20) === 1) {
            DB::table('coop_messages')->where('coop_session_id', $s->id)->where('created_at', '<', now()->subMinutes(2))->delete();
        }

        return response()->json(['ok' => true]);
    }

    /** Kid closes the game, or a grown-up leaves. */
    public function end(Request $request, $session)
    {
        $s = $this->familySession($request, $session);
        $data = $request->validate(['token' => 'required|string|max:40']);
        [$role, $member] = $this->who($s, $data['token']);
        if ($role === 'host') {
            $s->forceFill(['ended_at' => now(), 'state' => null])->save(); // the shared game picture is never kept
            Storage::disk('local')->deleteDirectory($this->voiceDir($s)); // voice is never kept
        } else {
            $member->forceFill(['left_at' => now()])->save();
            $this->push($s, 'host', $member->token, ['t' => 'leave']);
        }

        return response()->json(['ok' => true]);
    }

    /** Chat message (either side). Saved for grown-ups to read in the Grown-ups area. */
    public function chat(Request $request, $session)
    {
        $s = $this->familySession($request, $session);
        $data = $request->validate(['token' => 'required|string|max:40', 'text' => 'required|string|max:200']);
        [$role, $member] = $this->who($s, $data['token']);
        abort_if($s->ended_at, 410);
        abort_unless($this->features($s)['talk'], 403, 'Talk & Chat is off.');
        $text = trim(preg_replace('/\s+/u', ' ', strip_tags($data['text'])));
        abort_if($text === '', 422);
        $s->loadMissing('kid');

        $msg = ChatMessage::create([
            'user_id' => $s->user_id, 'kid_id' => $s->kid_id, 'game' => $s->game, 'coop_session_id' => $s->id,
            'from_kid' => $role === 'host', 'sender' => $role === 'host' ? mb_substr($s->kid->name, 0, 30) : $member->name,
            'color' => $role === 'host' ? $s->kid->color : $member->color, 'body' => mb_substr($text, 0, 300),
        ]);
        $body = ['t' => 'chat', 'id' => $msg->id, 'name' => $msg->sender, 'color' => $msg->color, 'kid' => $msg->from_kid, 'text' => $msg->body, 'at' => $msg->created_at->toIso8601String()];
        $this->toEveryone($s, $data['token'], $role, $body);

        return response()->json(['ok' => true, 'msg' => $body]);
    }

    /** A short voice message (used when the direct link can't connect). Deleted after 10 minutes and when the game ends. */
    public function voiceUpload(Request $request, $session)
    {
        $s = $this->familySession($request, $session);
        $data = $request->validate(['token' => 'required|string|max:40', 'clip' => 'required|file|max:2048']);
        [$role, $member] = $this->who($s, $data['token']);
        abort_if($s->ended_at, 410);
        abort_unless($this->features($s)['talk'], 403, 'Talk & Chat is off.');

        $mime = strtolower((string) $request->file('clip')->getMimeType());
        $ext = match (true) {
            str_contains($mime, 'webm') => 'webm',
            str_contains($mime, 'ogg') => 'ogg',
            str_contains($mime, 'mp4'), str_contains($mime, 'm4a'), str_contains($mime, 'aac'), str_contains($mime, 'mpeg') => 'mp4',
            default => null,
        };
        abort_unless($ext, 422, 'Unsupported audio.');

        $disk = Storage::disk('local');
        $dir = $this->voiceDir($s);
        foreach ($disk->files($dir) as $f) {
            if ($disk->lastModified($f) < now()->subMinutes(10)->getTimestamp()) {
                $disk->delete($f);
            }
        }
        $name = Str::random(20).'.'.$ext;
        $disk->putFileAs($dir, $request->file('clip'), $name);
        $s->loadMissing('kid');

        $this->toEveryone($s, $data['token'], $role, [
            't' => 'voice', 'url' => route('coop.voice.get', [$s->id, $name]),
            'name' => $role === 'host' ? $s->kid->name : $member->name, 'kid' => $role === 'host',
        ]);

        return response()->json(['ok' => true]);
    }

    public function voiceGet(Request $request, $session, $file)
    {
        $s = $this->familySession($request, $session);
        $path = $this->voiceDir($s).'/'.$file;
        $disk = Storage::disk('local');
        abort_unless($disk->exists($path), 404);
        $type = ['webm' => 'audio/webm', 'ogg' => 'audio/ogg', 'mp4' => 'audio/mp4', 'm4a' => 'audio/mp4'][pathinfo($file, PATHINFO_EXTENSION)] ?? 'application/octet-stream';

        return response()->file($disk->path($path), ['Content-Type' => $type, 'Cache-Control' => 'no-store, private']);
    }

    // ---------------------------------------------------------------- helpers

    /** Host's messages go to every grown-up; a grown-up's go to the kid and the other grown-ups. */
    private function toEveryone(CoopSession $s, string $fromToken, string $role, array $body): void
    {
        $this->push($s, '*', $fromToken, $body);
        if ($role !== 'host') {
            $this->push($s, 'host', $fromToken, $body);
        }
    }

    /** "Play together" switches for this kid + game (Grown-ups → game settings). Both are OFF until a grown-up turns them on. */
    private function features(CoopSession $s): array
    {
        static $cache = [];
        if (isset($cache[$s->id])) {
            return $cache[$s->id];
        }
        $off = ['talk' => false, 'video' => false];
        try {
            $game = $this->findGame($s->game);
            $s->loadMissing('kid');

            return $cache[$s->id] = $game->together($s->kid->progressFor($s->game));
        } catch (\Throwable $e) {
            return $off;
        }
    }

    /**
     * Servers that help two devices find each other: your own coturn (STUN + TURN). No Google servers.
     * With a shared secret (coturn "use-auth-secret") each login is made here and expires (config joynot.turn.ttl).
     */
    private function ice(): array
    {
        $t = config('joynot.turn', []);
        $ice = [];
        if (! empty($t['host'])) {
            $host = $t['host'];
            $port = (int) ($t['port'] ?? 3478);
            $tls = (int) ($t['tls_port'] ?? 5349);
            $ice[] = ['urls' => "stun:{$host}:{$port}"];
            if (! empty($t['secret'])) {
                $user = (time() + (int) ($t['ttl'] ?? 21600)).':joynot';
                $pass = base64_encode(hash_hmac('sha1', $user, (string) $t['secret'], true));
                $ice[] = ['urls' => ["turn:{$host}:{$port}?transport=udp", "turn:{$host}:{$port}?transport=tcp", "turns:{$host}:{$tls}?transport=tcp"], 'username' => $user, 'credential' => $pass];
            }
        }
        if (! empty($t['url'])) {
            $ice[] = ['urls' => $t['url'], 'username' => (string) ($t['username'] ?? ''), 'credential' => (string) ($t['password'] ?? '')];
        }

        return $ice;
    }

    private function voiceDir(CoopSession $s): string
    {
        return 'coop-voice/'.$s->id;
    }


    private function familySession(Request $request, $id): CoopSession
    {
        return CoopSession::where('id', (int) $id)->where('user_id', $request->user()->id)->firstOrFail();
    }

    /** ['host', null] or ['member', CoopMember] */
    private function who(CoopSession $s, string $token): array
    {
        if (hash_equals($s->host_token, $token)) {
            return ['host', null];
        }
        $m = $s->members()->where('token', $token)->first();
        abort_unless($m, 403);

        return ['member', $m];
    }

    private function push(CoopSession $s, string $to, string $from, array $body): void
    {
        DB::table('coop_messages')->insert(['coop_session_id' => $s->id, 'recipient' => $to, 'sender' => $from, 'body' => json_encode($body), 'created_at' => now()]);
    }

    private function urls(CoopSession $s): array
    {
        return [
            'poll' => route('coop.poll', $s->id),
            'send' => route('coop.send', $s->id),
            'end' => route('coop.end', $s->id),
            'chat' => route('coop.chat', $s->id),
            'voice' => route('coop.voice', $s->id),
        ];
    }

    private function gameTitle(string $key): string
    {
        try {
            return $this->findGame($key)->title();
        } catch (\Throwable $e) {
            return $key;
        }
    }
}
