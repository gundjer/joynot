{{-- Saved chat between this kid and grown-ups who played along (games with "Play together"). Needs $kid, $game. --}}
@php
    $chats = \App\Models\ChatMessage::where('kid_id', $kid->id)->where('game', $game->key())->latest()->limit(300)->get()->reverse();
@endphp
<div class="card" id="chat-{{ $game->key() }}" style="margin-top:16px">
    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
        <h3 style="margin:0; flex:1">💬 Chat with {{ $kid->name }} ({{ $chats->count() }})</h3>
        @if ($chats->count())
            <form method="POST" action="{{ route('grownups.chats.destroyAll', [$kid->id, $game->key()]) }}" onsubmit="return window.confirm('Delete all {{ $chats->count() }} messages?')">
                @csrf @method('DELETE')
                <button class="btn danger sm" type="submit">🗑️ Delete all</button>
            </form>
        @endif
    </div>
    @if ($chats->isEmpty())
        <p class="muted small">No messages yet. Turn on <b>🎙️ Talk &amp; 💬 Chat</b> above, then join {{ $kid->name }}'s game from the Grown-ups page.</p>
    @else
        <div class="chat-log">
            @foreach ($chats as $c)
                <div class="chat-row {{ $c->from_kid ? 'kid' : '' }}">
                    <div class="bubble" style="--c: {{ $c->from_kid ? $kid->color : ($c->color ?: '#8b6cff') }}">
                        <b>{{ $c->from_kid ? $kid->avatar.' '.$kid->name : '👤 '.$c->sender }}</b> {{ $c->body }}
                        <span class="when">{{ $c->created_at->format('M j, g:i a') }}</span>
                    </div>
                    <form method="POST" action="{{ route('grownups.chats.destroy', [$kid->id, $c->id]) }}">
                        @csrf @method('DELETE')
                        <button class="chat-del" type="submit" title="Delete this message" aria-label="Delete this message">✖</button>
                    </form>
                </div>
            @endforeach
        </div>
    @endif
</div>
<style>
    .chat-log { display: grid; gap: 8px; max-height: 420px; overflow-y: auto; padding: 4px; }
    .chat-row { display: flex; gap: 6px; align-items: center; }
    .chat-row.kid { flex-direction: row-reverse; }
    .chat-row .bubble { max-width: 80%; background: #fff; border: 2px solid var(--c); border-radius: 14px; padding: 8px 12px; word-break: break-word; }
    .chat-row .bubble b { color: var(--c); }
    .chat-row .when { display: block; font-size: 12px; opacity: .6; margin-top: 2px; }
    .chat-del { border: 0; background: #ffe0dc; color: #c0392b; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-weight: 700; }
</style>
