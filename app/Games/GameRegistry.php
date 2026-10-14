<?php

namespace App\Games;

use Illuminate\Support\Collection;

/** Reads the games list in config/joynot.php. */
class GameRegistry
{
    /** @var Collection<string, Game> */
    protected Collection $games;

    public function __construct()
    {
        $this->games = collect(config('joynot.games', []))
            ->map(fn (array $cfg, string $key) => new ($cfg['class'])($key, $cfg));
    }

    /** @return Collection<string, Game> */
    public function all(): Collection
    {
        return $this->games;
    }

    public function find(string $key): ?Game
    {
        return $this->games->get($key);
    }

    public function findOrFail(string $key): Game
    {
        return $this->find($key) ?? abort(404);
    }

    public function comingSoon(): array
    {
        return config('joynot.coming_soon', []);
    }
}
