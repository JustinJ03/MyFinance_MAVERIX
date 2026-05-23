<?php

namespace Tests\Feature;

use App\Models\EpfTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EpfTrackerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_get_epf_overview(): void
    {
        EpfTransaction::create([
            'user_id'            => $this->user->id,
            'epf_account_number' => 1,
            'transaction_type'   => 'contribution',
            'contribution_type'  => 'voluntary',
            'date'               => '2026-05-01',
            'employee_amount'    => 500.00,
            'employer_amount'    => 0,
            'total_amount'       => 500.00,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/epf');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 500)
            ->assertJsonPath('data.balances.1', 500);
    }

    public function test_user_can_get_epf_analytics(): void
    {
        EpfTransaction::create([
            'user_id'            => $this->user->id,
            'epf_account_number' => 1,
            'transaction_type'   => 'contribution',
            'date'               => '2026-05-01',
            'total_amount'       => 1000.00,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/v1/epf/analytics');

        $response->assertStatus(200);
    }
}
