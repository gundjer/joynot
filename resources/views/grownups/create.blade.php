@extends('layouts.app')
@section('title', 'Add a kid')

@section('content')
@include('partials.grownups-bar')

<section class="card" style="max-width:760px">
    <h2>➕ Add a kid</h2>
    @if ($full)
        <p class="muted">You have the most kids allowed ({{ config('joynot.max_kids') }}).</p>
    @else
        <form method="POST" action="{{ route('grownups.kids.store') }}">
            @csrf
            <label class="field">Name <input type="text" name="name" value="{{ old('name') }}" maxlength="40" required placeholder="First name or nickname"></label>
            @include('partials.kid-pickers', ['avatars' => config('joynot.avatars'), 'colors' => config('joynot.colors')])

            <h3 style="margin-top:20px">📚 Grade levels</h3>
            <p class="small muted" style="margin-top:-4px">Games start at the "reads at" and "does math at" levels, then move up or down by themselves. You can fine-tune each game after saving.</p>
            @include('partials.grade-fields')

            <button class="btn mint block" type="submit">Add kid</button>
        </form>
    @endif
</section>
@endsection
