<?php

namespace Tests\Feature;

use App\Models\Kid;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RustyResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_clears_workshop_and_rejects_the_old_child_session_even_with_a_future_clock(): void
    {
        $user = User::factory()->create(['parent_pin' => '1234']);
        $kid = Kid::create(['user_id' => $user->id, 'name' => 'Tester', 'avatar' => '🐝', 'color' => '#3dd6a3', 'grade' => 'K']);
        $progress = $kid->progressFor('rustys-after-hours');
        $old = ['stage' => 1, 'night' => 4, 'tokens' => 90, 'bots' => [['name' => 'Old robot']], 'seenParentEditAt' => PHP_INT_MAX, 'settings' => ['scare' => 'gentle', 'video' => 'on']];
        $progress->update(['state' => $old]);

        $this->actingAs($user)->withSession(['grownups_unlocked_at' => time()])
            ->post(route('grownups.games.reset', [$kid->id, 'rustys-after-hours']), ['confirm' => 'RESET'])->assertRedirect();
        $state = $progress->fresh()->state;
        $this->assertNotEmpty($state['resetId']);
        $this->assertSame(0, $progress->fresh()->summary['stage']);
        $this->assertSame(1, $progress->fresh()->summary['night']);
        $this->assertSame('on', $state['settings']['video']);
        $this->assertArrayNotHasKey('bots', $state);

        $this->postJson(route('play.save', ['rustys-after-hours', $kid->id]), ['state' => $old])
            ->assertOk()->assertJsonPath('stale', true)->assertJsonPath('state.resetId', $state['resetId']);
        $this->assertSame($state, $progress->fresh()->state);

        $fresh = array_merge($state, ['stage' => 0, 'night' => 1, 'seenResetId' => $state['resetId'], 'seenParentEditAt' => $state['parentEditAt']]);
        $this->postJson(route('play.save', ['rustys-after-hours', $kid->id]), ['state' => $fresh])->assertOk()->assertJsonPath('ok', true);
    }
}
