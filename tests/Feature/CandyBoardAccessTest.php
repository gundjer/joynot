<?php

namespace Tests\Feature;

use App\Models\Kid;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CandyBoardAccessTest extends TestCase
{
    use RefreshDatabase;

    private function family(): array
    {
        $user = User::factory()->create(['parent_pin' => '1234']);
        $kid = Kid::create(['user_id' => $user->id, 'name' => 'Traveler', 'avatar' => '🐝', 'color' => '#3dd6a3', 'grade' => 'K']);

        return [$user, $kid];
    }

    public function test_only_an_unlocked_grownup_can_join_the_board(): void
    {
        [$user, $kid] = $this->family();
        $host = $this->actingAs($user)->postJson(route('coop.host', ['sparkles-rainbow-journey', $kid->id]), ['world' => 'Candy Cloud Trail'])->assertOk()->json();
        $join = route('grownups.coop.join', $host['session']);
        $member = route('grownups.coop.member', $host['session']);
        $this->get($join)->assertRedirect();
        $this->postJson($member, ['name' => 'Grandma'])->assertRedirect();
        $this->withSession(['grownups_unlocked_at' => time()])->get($join)->assertOk();
        $this->postJson($member, ['name' => 'Grandma'])->assertOk()->assertJsonStructure(['token', 'name']);
    }

    public function test_an_unlocked_user_from_another_family_cannot_join(): void
    {
        [$user, $kid] = $this->family();
        $host = $this->actingAs($user)->postJson(route('coop.host', ['sparkles-rainbow-journey', $kid->id]), [])->assertOk()->json();
        $other = User::factory()->create(['parent_pin' => '5678']);
        $this->actingAs($other)->withSession(['grownups_unlocked_at' => time()])
            ->get(route('grownups.coop.join', $host['session']))->assertNotFound();
        $this->postJson(route('grownups.coop.member', $host['session']), ['name' => 'Other family'])->assertNotFound();
    }
}
