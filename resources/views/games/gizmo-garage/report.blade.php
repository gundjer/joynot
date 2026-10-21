@php
    $completed = $garage['completed'] ?? [];
    $saved = $garage['blueprints'] ?? [];
    $trophies = $garage['trophies'] ?? [];
@endphp
<div class="card" style="margin-top:16px">
    <h3>Workshop progress</h3>
    <p>{{ count($trophies) }} optional trophies earned · {{ count($saved) }} saved inventions</p>
    <p class="small muted">Children choose parts, invent and test freely. Completing challenges is optional. Each part has a ? with a picture, explanation and steps to try.</p>
    @foreach ($trophies as $trophy)
        <p>🏆 {{ $trophy['trophy'] ?? 'Inventor trophy' }}</p>
    @endforeach
    @if ($completed)
        <div class="table-wrap"><table>
            <tr><th>Job</th><th>Test time</th><th>Input energy</th><th>Tests in session</th></tr>
            @foreach ($completed as $id => $result)
                <tr><td>{{ ucwords(str_replace('-', ' ', $id)) }}</td><td>{{ round($result['seconds'] ?? 0, 1) }} s</td><td>{{ round($result['joules'] ?? 0, 1) }} J</td><td>{{ $result['tests'] ?? 1 }}</td></tr>
            @endforeach
        </table></div>
    @else
        @if (! $trophies)<p class="muted">No trophies yet. Children can explore freely or try an optional challenge. Show me a seesaw offers an easy starting example.</p>@endif
    @endif
</div>
