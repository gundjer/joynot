{{-- Grown-ups tabs. Needs $kids; optional $kid (the open kid). --}}
<div class="gu-bar">
    <span class="gu-title">🔓 Grown-ups</span>
    <form class="gu-lock" method="POST" action="{{ route('grownups.lock') }}">@csrf<button class="pill-link" type="submit">🔒 Lock &amp; back to kids</button></form>
    @include('partials.donate', ['style' => 'ribbon'])
</div>
<nav class="gu-tabs" aria-label="Grown-ups">
    <a class="gu-tab {{ request()->routeIs('grownups.index') ? 'on' : '' }}" href="{{ route('grownups.index') }}"><span class="ic">👨‍👩‍👧</span>All kids</a>
    @foreach ($kids as $k)
        <a class="gu-tab {{ isset($kid) && $kid->id === $k->id ? 'on' : '' }}" style="--c: {{ $k->color }}" href="{{ route('grownups.kids.edit', $k->id) }}"><span class="av">{{ $k->avatar }}</span>{{ $k->name }}</a>
    @endforeach
    <a class="gu-tab add {{ request()->routeIs('grownups.kids.create') ? 'on' : '' }}" href="{{ route('grownups.kids.create') }}"><span class="ic">➕</span>Add kid</a>
    <a class="gu-tab {{ request()->routeIs('grownups.account') ? 'on' : '' }}" href="{{ route('grownups.account') }}"><span class="ic">⚙️</span>Account</a>
</nav>
@include('partials.coop-live')
@if ($errors->any()) <div class="alert err">{{ $errors->first() }}</div> @endif
