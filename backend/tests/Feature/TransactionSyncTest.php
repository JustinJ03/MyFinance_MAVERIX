<?php

namespace Tests\Feature;

use App\Models\AsbFund;
use App\Models\BankAccount;
use App\Models\Budget;
use App\Models\BudgetPeriod;
use App\Models\Category;
use App\Models\User;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionSyncTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private BankAccount $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CategorySeeder::class);

        $this->user = User::factory()->create();
        $this->account = BankAccount::create([
            'user_id'         => $this->user->id,
            'nickname'        => 'Test Savings',
            'bank_name'       => 'Maybank',
            'account_type'    => 'savings',
            'initial_balance' => 1000.00,
            'current_balance' => 1000.00,
            'color'           => '#000000',
        ]);
    }

    public function test_creating_voluntary_epf_expense_syncs_to_epf_tracker(): void
    {
        $epfCategory = Category::where('name', 'EPF (Voluntary)')->firstOrFail();

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/transactions', [
                'type'               => 'expense',
                'name'               => 'Voluntary EPF Contribution',
                'amount'             => 200.00,
                'category_id'        => $epfCategory->id,
                'account_id'         => $this->account->id,
                'actual_date'        => now()->toDateString(),
                'status'             => 'confirmed',
                'epf_account_number' => 1,
            ]);

        $response->assertStatus(201);

        // Check bank account balance decreased
        $this->assertEquals(800.00, $this->account->fresh()->current_balance);

        // Check EPF transaction created
        $this->assertDatabaseHas('epf_transactions', [
            'user_id'            => $this->user->id,
            'epf_account_number' => 1,
            'transaction_type'   => 'contribution',
            'contribution_type'  => 'voluntary',
            'total_amount'       => 200.00,
        ]);
    }

    public function test_creating_asb_expense_syncs_to_asb_tracker(): void
    {
        $asbCategory = Category::where('name', 'ASB')->firstOrFail();

        // Register ASB Fund first
        $fund = AsbFund::create([
            'user_id'      => $this->user->id,
            'fund_name'    => 'ASB',
            'units_held'   => 0,
            'unit_ceiling' => 200000,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/transactions', [
                'type'        => 'expense',
                'name'        => 'ASB Deposit',
                'amount'      => 150.00,
                'category_id' => $asbCategory->id,
                'account_id'  => $this->account->id,
                'actual_date' => now()->toDateString(),
                'status'      => 'confirmed',
                'asb_fund_id' => $fund->id,
            ]);

        $response->assertStatus(201);

        // Check bank account balance decreased
        $this->assertEquals(850.00, $this->account->fresh()->current_balance);

        // Check ASB transaction created
        $this->assertDatabaseHas('asb_transactions', [
            'asb_fund_id'      => $fund->id,
            'user_id'          => $this->user->id,
            'transaction_type' => 'deposit',
            'amount'           => 150.00,
        ]);

        // Check units updated
        $this->assertEquals(150.00, $fund->fresh()->units_held);
    }

    public function test_deleting_synced_expense_removes_epf_or_asb_record(): void
    {
        $epfCategory = Category::where('name', 'EPF (Voluntary)')->firstOrFail();

        // Create transaction
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/transactions', [
                'type'               => 'expense',
                'name'               => 'Voluntary EPF Contribution',
                'amount'             => 200.00,
                'category_id'        => $epfCategory->id,
                'account_id'         => $this->account->id,
                'actual_date'        => now()->toDateString(),
                'status'             => 'confirmed',
                'epf_account_number' => 1,
            ]);

        $transactionId = $response->json('data.id');

        $this->assertDatabaseHas('epf_transactions', [
            'linked_transaction_id' => $transactionId,
        ]);

        // Delete transaction
        $this->actingAs($this->user)
            ->deleteJson("/api/v1/transactions/{$transactionId}")
            ->assertStatus(200);

        // Balance restored
        $this->assertEquals(1000.00, $this->account->fresh()->current_balance);

        // Synced record removed
        $this->assertDatabaseMissing('epf_transactions', [
            'linked_transaction_id' => $transactionId,
        ]);
    }

    public function test_budget_period_spending_is_updated_on_transaction(): void
    {
        $foodCategory = Category::where('name', 'Food')->firstOrFail();

        $budget = Budget::create([
            'user_id'      => $this->user->id,
            'category_id'  => $foodCategory->id,
            'period_type'  => 'monthly',
            'amount_limit' => 500.00,
            'is_active'    => true,
        ]);

        $period = BudgetPeriod::create([
            'budget_id'    => $budget->id,
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end'   => now()->endOfMonth()->toDateString(),
            'amount_limit' => 500.00,
            'amount_spent' => 0.00,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/transactions', [
                'type'        => 'expense',
                'name'        => 'Lunch',
                'amount'      => 30.00,
                'category_id' => $foodCategory->id,
                'account_id'  => $this->account->id,
                'actual_date' => now()->toDateString(),
                'status'      => 'confirmed',
            ]);

        $response->assertStatus(201);

        // Check budget period updated correctly (No stdClass increment bug!)
        $this->assertEquals(30.00, $period->fresh()->amount_spent);
    }
}
