<?php

namespace Tests\Feature;

use App\Models\Kid;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GizmoGarageAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_workshop_settings_use_school_grade_and_do_not_offer_quiz_controls(): void
    {
        $user = User::factory()->create(['parent_pin' => '1234']);
        $kid = Kid::create(['user_id' => $user->id, 'name' => 'Builder', 'grade' => '3', 'avatar' => '🐝', 'color' => '#3dd6a3']);
        $game = app(\App\Games\GameRegistry::class)->findOrFail('gizmo-garage');
        $progress = $kid->progressFor('gizmo-garage');
        $game->saveSettings($progress, ['level' => 9, 'voice' => 'off', 'sfx' => 'off']);
        $this->assertSame(4, data_get($progress->fresh()->state, 'extra.garage2.grade'));
        $this->assertFalse(data_get($progress->fresh()->state, 'extra.garage2.voice'));
        $this->assertArrayNotHasKey('autoLevel', $game->settingsSchema());
        $this->assertArrayNotHasKey('round', $game->settingsSchema());
        $this->actingAs($user)->withSession(['grownups_unlocked_at' => time()])
            ->get(route('grownups.kids.edit', $kid->id))->assertOk()->assertSee('Workshop progress');
    }

    public function test_workshop_requires_unlocked_family_access_and_limits_three_guests(): void
    {
        $user = User::factory()->create(['parent_pin' => '1234']);
        $kid = Kid::create(['user_id' => $user->id, 'name' => 'Builder', 'grade' => '2', 'avatar' => '🐝', 'color' => '#3dd6a3']);
        $host = $this->actingAs($user)->postJson(route('coop.host', ['gizmo-garage', $kid->id]), [])->assertOk()->json();
        $join = route('grownups.coop.member', $host['session']);
        $this->postJson($join, ['name' => 'Grandma'])->assertRedirect();
        $this->withSession(['grownups_unlocked_at' => time()]);
        $grandma = $this->postJson($join, ['name' => 'Grandma'])->assertOk()->json();
        $this->postJson($join, ['name' => 'Grandpa'])->assertOk();
        $this->postJson($join, ['name' => 'Mom'])->assertOk();
        $this->postJson($join, ['name' => 'Fourth guest'])->assertStatus(409);
        $this->postJson($join, ['name' => 'Grandma', 'token' => $grandma['token']])->assertOk();
        $other = User::factory()->create(['parent_pin' => '5678']);
        $this->actingAs($other)->withSession(['grownups_unlocked_at' => time()])->postJson($join, ['name' => 'Other family'])->assertNotFound();
    }
}
