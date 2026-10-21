{{-- Candy Cloud Trail — progress report for one kid. $part = 'summary' (level cards) or 'details' (practice + answers) --}}
@if (($part ?? 'summary') === 'summary')
<div class="stack">
    <div class="card">
        <h3>📖 Reading</h3>
        <div class="big-num">Level {{ $rl }} <span class="muted small">/ {{ count($readingLevels) }}</span></div>
        <div>{{ $readingLevels[$rl][0] ?? '' }} <span class="tag">Grade {{ $readingLevels[$rl][1] ?? '' }}</span></div>
        <div class="meter"><div style="width: {{ round($rl / count($readingLevels) * 100) }}%"></div></div>
        @if ($goal['reading'])<div class="small"><b>🎯 Goal ({{ \App\Models\Kid::gradeName($goalGrade) }}):</b> Level {{ $goal['reading'] }} {!! $rl >= $goal['reading'] ? '<span class="ok">✔ reached!</span>' : '· '.($goal['reading'] - $rl).' to go' !!}</div>@endif
        <div class="small muted">This week: {{ $summary['reading']['week'] }} reading questions · {{ $summary['reading']['week_first_try'] ?? '—' }}% right on first try (no help) · Today: {{ $summary['reading']['today'] }}</div>
    </div>
    <div class="card">
        <h3>🔢 Math</h3>
        <div class="big-num">Level {{ $ml }} <span class="muted small">/ {{ count($mathLevels) }}</span></div>
        <div>{{ $mathLevels[$ml][0] ?? '' }} <span class="tag">Grade {{ $mathLevels[$ml][1] ?? '' }}</span></div>
        <div class="meter"><div style="width: {{ round($ml / count($mathLevels) * 100) }}%"></div></div>
        @if ($goal['math'])<div class="small"><b>🎯 Goal ({{ \App\Models\Kid::gradeName($goalGrade) }}):</b> Level {{ $goal['math'] }} {!! $ml >= $goal['math'] ? '<span class="ok">✔ reached!</span>' : '· '.($goal['math'] - $ml).' to go' !!}</div>@endif
        <div class="small muted">This week: {{ $summary['math']['week'] }} math questions · {{ $summary['math']['week_first_try'] ?? '—' }}% right on first try (no help) · Today: {{ $summary['math']['today'] }}</div>
    </div>
    <div class="card">
        <h3>🎲 Candy Cloud Trail</h3>
        <div>Games completed: <b>{{ $stats['boardGames'] ?? 0 }}</b> · 🍬 <b>{{ $state['tokens'] ?? 0 }}</b> jelly beans</div>
        <p class="small muted">Only this child’s own turns count toward reading and math progress. Family and bot answers are separate.</p>
        <div class="small muted" style="margin-top:8px">Answers per day (last 14 days)</div>
        <div class="bars">
            @foreach ($days as $d)
                <div><span style="height: {{ max(2, round($d['count'] / $maxDay * 80)) }}px"></span>{{ $d['count'] }}<br>{{ $d['label'] }}</div>
            @endforeach
        </div>
    </div>
</div>
@else
<div class="grid" style="margin-top:16px">
    <div class="card">
        <h3>🧩 Needs more practice (last 30 days)</h3>
        @if ($tough->isEmpty()) <p class="muted">Nothing yet — play a few rounds!</p> @else
            <div class="table-wrap"><table>
                <tr><th></th><th>Word / answer</th><th>Missed or needed help</th></tr>
                @foreach ($tough as $t)
                    <tr><td>{{ $t->track === 'reading' ? '📖' : '🔢' }}</td><td>{{ $t->expected }}</td><td>{{ $t->misses }}×</td></tr>
                @endforeach
            </table></div>
        @endif
    </div>
    <div class="card">
        <h3>🎤 Stop the "allow microphone?" pop-ups</h3>
        <p class="small muted">Only the phone or tablet can turn the microphone on. Set it to <b>Allow</b> once on each device.</p>
        <p class="small"><b>iPhone / iPad (Safari):</b> tap <b>aA</b> in the address bar → Website Settings → Microphone → Allow. Also Settings → Apps → Safari → Microphone → Allow, and Settings → General → Keyboard → Enable Dictation: ON.</p>
        <p class="small"><b>Android (Chrome):</b> pick <b>"While visiting the site"</b> / Allow. Already picked "Only this time"? Tap the icon left of the address → Permissions → Microphone → Allow.</p>
    </div>
</div>

<div class="card" style="margin-top:16px">
    <h3>🕘 {{ $kid->name }}'s recent answers</h3>
    <p class="small muted" style="margin-top:0">"Heard" is what the speech recognizer thought was said. If it's too picky, set Talk checking to Easy.</p>
    <div class="table-wrap">
        <table>
            <tr><th>When</th><th></th><th>Lvl</th><th>Problem</th><th>Answer</th><th>Heard</th><th>Result</th></tr>
            @forelse ($recent as $a)
                <tr>
                    <td class="muted">{{ $a->created_at->diffForHumans() }}</td>
                    <td>{{ $a->track === 'reading' ? '📖' : '🔢' }}</td>
                    <td>{{ $a->level }}</td>
                    <td>{{ \Illuminate\Support\Str::limit($a->prompt, 80) }}</td>
                    <td>{{ $a->expected }}</td>
                    <td class="muted">{{ $a->heard }}</td>
                    <td>
                        @if ($a->correct && $a->first_try && ! $a->helped) <span class="ok">✔ first try</span>
                        @elseif ($a->correct) <span class="ok">✔</span> <span class="muted">{{ $a->helped ? 'with help' : 'after teaching' }}</span>
                        @else <span class="no">✖ practiced</span> @endif
                        @if ($a->review) <span class="tag">review</span> @endif
                    </td>
                </tr>
            @empty
                <tr><td colspan="7" class="muted">No answers yet.</td></tr>
            @endforelse
        </table>
    </div>
</div>
@endif
