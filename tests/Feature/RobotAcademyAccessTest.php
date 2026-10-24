<?php

namespace Tests\Feature;

use App\Games\GameRegistry;
use App\Models\Kid;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RobotAcademyAccessTest extends TestCase
{
    use RefreshDatabase;

    private function family(): array
    {
        $user = User::factory()->create(['parent_pin' => '1234']);
        $kid = Kid::create(['user_id' => $user->id, 'name' => 'Teacher', 'avatar' => '🐝', 'color' => '#3dd6a3', 'grade' => 'K']);

        return [$user, $kid];
    }

    public function test_academy_replaces_the_quiz_page_and_reports_team_learning(): void
    {
        [$user, $kid] = $this->family();
        $this->actingAs($user)->get(route('play', ['robo-brain', $kid->id]))
            ->assertOk()->assertViewIs('games.robo-brain.play')->assertSee('robo-game')->assertDontSee('/games/_play/play.js');
        $game = app(GameRegistry::class)->findOrFail('robo-brain');
        $progress = $kid->progressFor('robo-brain');
        $progress->state = ['level' => 1, 'extra' => ['academyCompleted' => ['g0-m0'], 'academyMetrics' => ['labels' => 4, 'trains' => 2, 'tests' => 2]]];
        $progress->save();
        $html = view($game->reportView(), $game->reportData($kid, $progress) + ['part' => 'summary'])->render();
        $this->assertStringContainsString('1 missions completed', $html);
        $this->assertStringContainsString('4 examples labeled by the child', $html);
        $this->assertStringContainsString('not scored', $html);
        $this->assertArrayNotHasKey('autoLevel', $game->settingsSchema());
    }

    public function test_only_an_unlocked_family_member_can_join_the_academy(): void
    {
        [$user, $kid] = $this->family();
        $host = $this->actingAs($user)->postJson(route('coop.host', ['robo-brain', $kid->id]), ['world' => 'Robot Training Academy'])->assertOk()->json();
        $join = route('grownups.coop.join', $host['session']);
        $member = route('grownups.coop.member', $host['session']);
        $this->get($join)->assertRedirect();
        $this->postJson($member, ['name' => 'Grandparent'])->assertRedirect();
        $this->withSession(['grownups_unlocked_at' => time()])->get($join)->assertOk();
        $this->postJson($member, ['name' => 'Grandparent'])->assertOk()->assertJsonStructure(['token', 'name']);
        $other = User::factory()->create(['parent_pin' => '5678']);
        $this->actingAs($other)->withSession(['grownups_unlocked_at' => time()])->get($join)->assertNotFound();
        $this->postJson($member, ['name' => 'Other family'])->assertNotFound();
    }
}
