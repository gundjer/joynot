<?php

namespace Tests\Feature;

use App\Games\GameRegistry;
use App\Models\Kid;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_registered_game_renders_and_loads_progress(): void
    {
        $user = User::factory()->create();
        $kid = Kid::create(['user_id' => $user->id, 'name' => 'Tester', 'avatar' => '🐝', 'color' => '#3dd6a3', 'grade' => 'K']);

        foreach (app(GameRegistry::class)->all() as $game) {
            $this->actingAs($user)->get(route('play', [$game->key(), $kid->id]))
                ->assertOk()->assertSee('window.JOYNOT', false);
            $this->getJson(route('play.progress', [$game->key(), $kid->id]))
                ->assertOk()->assertJsonPath('kid.id', $kid->id);
        }
    }

    public function test_coop_signals_are_delivered_to_the_parent_and_isolated_from_other_families(): void
    {
        $user = User::factory()->create(['parent_pin' => '1234']);
        $kid = Kid::create(['user_id' => $user->id, 'name' => 'Tester', 'avatar' => '🐝', 'color' => '#3dd6a3', 'grade' => 'K']);
        $host = $this->actingAs($user)->postJson(route('coop.host', ['bee-smart', $kid->id]))->assertOk()->json();
        $member = $this->withSession(['grownups_unlocked_at' => time()])
            ->postJson(route('grownups.coop.member', $host['session']), ['name' => 'Parent'])->assertOk()->json();
        $this->postJson($host['urls']['send'], ['token' => $host['token'], 'msgs' => [
            ['to' => $member['token'], 'body' => ['t' => 'rtc-offer', 'sdp' => ['type' => 'offer', 'sdp' => "v=0\r\n"]]],
        ]])->assertOk();
        $this->getJson($host['urls']['poll'].'?token='.$member['token'])
            ->assertOk()->assertJsonPath('msgs.0.body.t', 'rtc-offer');
        $this->actingAs(User::factory()->create())->getJson($host['urls']['poll'].'?token='.$member['token'])->assertNotFound();
    }
}
