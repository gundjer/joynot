<?php

namespace App\Console\Commands;

use App\Games\GameRegistry;
use App\Models\Kid;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Moves the old Rusty's After Hours players (and all their answers) into one JoyNot parent account.
 *
 * Same database:      php artisan joynot:import-rustys you@example.com
 * Different database: php artisan joynot:import-rustys you@example.com --database=old_db --username=old_user --password
 */
class ImportRustysPlayers extends Command
{
    protected $signature = 'joynot:import-rustys
        {email : Email of the JoyNot parent account that gets the kids}
        {--players= : Only these old player ids, comma separated (default: all)}
        {--host=127.0.0.1 : Old database host (only with --database)}
        {--port=3306 : Old database port}
        {--database= : Old database name, if it is NOT the same database JoyNot uses}
        {--username= : Old database user}
        {--password : Ask for the old database password}
        {--dry-run : Show what would happen without saving}';

    protected $description = "Move Rusty's After Hours players + progress + answers into a JoyNot parent account";

    private const GAME = 'rustys-after-hours';

    public function handle(GameRegistry $registry): int
    {
        $user = User::where('email', strtolower($this->argument('email')))->first();
        if (! $user) {
            $this->error('No JoyNot account with that email. Register on the site first.');

            return self::FAILURE;
        }

        $conn = $this->oldConnection();
        $schema = Schema::connection($conn);
        if (! $schema->hasTable('players')) {
            $this->error('No "players" table found in the old database.');

            return self::FAILURE;
        }
        $hasAttempts = $schema->hasTable('attempts');
        $hasAvatar = $schema->hasColumn('players', 'avatar');
        $hasColor = $schema->hasColumn('players', 'color');

        $query = DB::connection($conn)->table('players')->orderBy('id');
        if ($ids = $this->option('players')) {
            $query->whereIn('id', array_map('intval', explode(',', $ids)));
        }
        $players = $query->get();
        if ($players->isEmpty()) {
            $this->warn('No players found.');

            return self::SUCCESS;
        }

        $game = $registry->findOrFail(self::GAME);
        $dry = (bool) $this->option('dry-run');
        $rows = [];
        $sort = $user->kids()->count();

        foreach ($players as $p) {
            $answers = $hasAttempts ? DB::connection($conn)->table('attempts')->where('player_id', $p->id)->count() : 0;

            if (Kid::where('user_id', $user->id)->where('legacy_player_id', $p->id)->exists()) {
                $rows[] = [$p->id, $p->name, 'already imported — skipped', $answers];

                continue;
            }
            if ($user->kids()->count() >= config('joynot.max_kids')) {
                $rows[] = [$p->id, $p->name, 'family is full — skipped', $answers];

                continue;
            }
            if ($dry) {
                $rows[] = [$p->id, $p->name, 'would import', $answers];

                continue;
            }

            DB::transaction(function () use ($user, $p, $game, $conn, $hasAttempts, $hasAvatar, $hasColor, &$sort) {
                $kid = $user->kids()->create([
                    'name' => mb_substr((string) $p->name, 0, 40) ?: 'Player',
                    'avatar' => Kid::cleanAvatar($hasAvatar ? $p->avatar : null, $sort),
                    'color' => Kid::cleanColor($hasColor ? $p->color : null, $sort),
                    'sort' => $sort++,
                    'legacy_player_id' => $p->id,
                ]);

                $state = is_string($p->state) ? json_decode($p->state, true) : null;
                if (is_array($state)) {
                    $state['name'] = $kid->name;
                }
                $kid->progress()->create([
                    'game' => self::GAME,
                    'state' => $state,
                    'summary' => $game->summarize($state ?? []),
                    'last_played_at' => $p->updated_at,
                ]);

                if ($hasAttempts) {
                    DB::connection($conn)->table('attempts')->where('player_id', $p->id)->orderBy('id')
                        ->chunk(500, function ($chunk) use ($kid) {
                            DB::table('game_attempts')->insert($chunk->map(fn ($a) => [
                                'kid_id' => $kid->id,
                                'game' => self::GAME,
                                'track' => $a->track,
                                'level' => $a->level,
                                'prompt' => $a->prompt,
                                'expected' => $a->expected,
                                'heard' => $a->heard,
                                'correct' => $a->correct,
                                'first_try' => $a->first_try,
                                'helped' => $a->helped,
                                'review' => $a->review,
                                'answered_at' => $a->answered_at,
                                'created_at' => $a->created_at,
                                'updated_at' => $a->updated_at,
                            ])->all());
                        });
                }
            });

            $rows[] = [$p->id, $p->name, 'imported ✔', $answers];
        }

        $this->table(['Old id', 'Name', 'Result', 'Answers'], $rows);
        $this->info($dry ? 'Dry run — nothing saved.' : "Done. Open the Grown-ups area as {$user->email} to see them.");

        return self::SUCCESS;
    }

    /** The default connection, or a temporary one pointing at the old Rusty's database. */
    private function oldConnection(): string
    {
        if (! $this->option('database')) {
            return config('database.default');
        }

        config(['database.connections.rustys_import' => [
            'driver' => 'mysql',
            'host' => $this->option('host'),
            'port' => $this->option('port'),
            'database' => $this->option('database'),
            'username' => $this->option('username'),
            'password' => $this->option('password') ? $this->secret('Old database password') : '',
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
        ]]);

        return 'rustys_import';
    }
}
