{{-- Learning games — progress report for one kid. $part = 'summary' (level card) or 'details' (practice + answers) --}}
@if (($part ?? 'summary') === 'summary')
<div class="stack">
    <div class="card">
        <h3>{{ $skill[0] }} {{ $skill[1] }}</h3>
        <div class="big-num">Level {{ $level }} <span class="muted small">/ {{ count($levels) }}</span></div>
        <div>{{ $levels[$level][0] ?? '' }} <span class="tag">Grade {{ $levels[$level][1] ?? '' }}</span></div>
        <div class="meter"><div style="width: {{ round($level / max(1, count($levels)) * 100) }}%"></div></div>
        @if ($goal)
            <div class="small"><b>🎯 Goal ({{ \App\Models\Kid::gradeName($goalGrade) }}):</b> Level {{ $goal }} {!! $level >= $goal ? '<span class="ok">✔ reached!</span>' : '· '.($goal - $level).' to go' !!}</div>
        @endif
        <div class="small muted">This week: {{ $summary['week'] }} answers · {{ $summary['week_first_try'] ?? '—' }}% right on first try (no help) · Today: {{ $summary['today'] }}</div>
        <div class="small muted">{{ $token[0] }} {{ $state['stars'] ?? 0 }} {{ $token[1] }} · {{ $stats['rounds'] ?? 0 }} rounds · {{ $stats['perfect'] ?? 0 }} three-star rounds · best streak {{ $state['bestStreak'] ?? 0 }}</div>
        <div class="small" style="margin-top:6px"><b>🎓 Grade badges:</b> {{ $badges ? \App\Games\LearningGame::badgeNames($badges) : 'none yet — earned when '.$kid->name.' finishes a grade\'s levels' }} · 📘 lessons seen: {{ $lessonsSeen }}</div>
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
        @if ($tough->isEmpty())
            <p class="muted">Nothing yet — play a few rounds!</p>
        @else
            <div class="table-wrap"><table>
                <tr><th>Answer</th><th>Lvl</th><th>Missed or needed help</th></tr>
                @foreach ($tough as $t)
                    <tr><td>{{ \Illuminate\Support\Str::limit($t->expected, 60) }}</td><td>{{ $t->level > 100 ? 'M'.($t->level - 100) : $t->level }}</td><td>{{ $t->misses }}×</td></tr>
                @endforeach
            </table></div>
        @endif
    </div>
    <div class="card">
        <h3>📊 How each level is going (last 30 days)</h3>
        @if ($byLevel->isEmpty())
            <p class="muted">No answers yet.</p>
        @else
            <div class="table-wrap"><table>
                <tr><th>Level</th><th>Answers</th><th>First try, no help</th></tr>
                @foreach ($byLevel as $b)
                    <tr><td>{{ $b->level > 100 ? 'M'.($b->level - 100) : $b->level }}. {{ ($levelNames ?? $levels)[$b->level][0] ?? '' }}</td><td>{{ $b->total }}</td><td>{{ $b->total ? round($b->clean / $b->total * 100) : 0 }}%</td></tr>
                @endforeach
            </table></div>
        @endif
    </div>
</div>

<div class="card" style="margin-top:16px">
    <h3>🕘 {{ $kid->name }}'s recent answers</h3>
    <div class="table-wrap">
        <table>
            <tr><th>When</th><th>Lvl</th><th>Question</th><th>Right answer</th><th>{{ $kid->name }} picked</th><th>Result</th></tr>
            @forelse ($recent as $a)
                <tr>
                    <td class="muted">{{ $a->created_at->diffForHumans() }}</td>
                    <td>{{ $a->level > 100 ? 'M'.($a->level - 100) : $a->level }}</td>
                    <td>{{ \Illuminate\Support\Str::limit($a->prompt, 90) }}</td>
                    <td>{{ \Illuminate\Support\Str::limit($a->expected, 50) }}</td>
                    <td class="muted">{{ \Illuminate\Support\Str::limit($a->heard, 40) }}</td>
                    <td>
                        @if ($a->correct && $a->first_try && ! $a->helped) <span class="ok">✔ first try</span>
                        @elseif ($a->correct) <span class="ok">✔</span> <span class="muted">{{ $a->helped ? 'with help' : 'second try' }}</span>
                        @else <span class="no">✖ learned it</span> @endif
                        @if ($a->review) <span class="tag">review</span> @endif
                    </td>
                </tr>
            @empty
                <tr><td colspan="6" class="muted">No answers yet.</td></tr>
            @endforelse
        </table>
    </div>
</div>
@endif
