<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\Category;
use App\Models\RecurringTemplate;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class RecurringSchedulerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private BankAccount $account;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CategorySeeder::class);

        $this->user = User::factory()->create();
        $this->account = BankAccount::create([
            'user_id'         => $this->user->id,
            'nickname'        => 'Salary Account',
            'bank_name'       => 'CIMB',
            'account_type'    => 'savings',
            'initial_balance' => 5000.00,
            'current_balance' => 5000.00,
            'color'           => '#00FF00',
        ]);

        $this->category = Category::where('name', 'Electricity')->firstOrFail();
    }

    public function test_scheduler_generates_pending_transaction_for_due_templates(): void
    {
        $today = Carbon::today();

        // Create a recurring template due today
        $template = RecurringTemplate::create([
            'user_id'        => $this->user->id,
            'type'           => 'expense',
            'name'           => 'TNB Electric Bill',
            'default_amount' => 150.00,
            'category_id'    => $this->category->id,
            'account_id'     => $this->account->id,
            'frequency'      => 'monthly',
            'scheduled_day'  => 25,
            'next_due_date'  => $today->toDateString(),
            'start_date'     => $today->copy()->subMonth()->toDateString(),
            'status'         => 'active',
        ]);

        // Run scheduler command
        Artisan::call('recurring:generate');

        // Check pending transaction is created
        $transaction = \App\Models\Transaction::where('recurring_template_id', $template->id)->firstOrFail();
        $this->assertEquals($this->user->id, $transaction->user_id);
        $this->assertEquals('TNB Electric Bill', $transaction->name);
        $this->assertEquals(150.00, $transaction->amount);
        $this->assertEquals('pending', $transaction->status);
        $this->assertEquals($today->toDateString(), $transaction->scheduled_date->toDateString());

        // Check template next_due_date advanced (monthly)
        $expectedNextDueDate = $today->copy()->addMonthNoOverflow()->startOfMonth()->addDays(24); // TNB template scheduled day 25
        $this->assertEquals($expectedNextDueDate->toDateString(), $template->fresh()->next_due_date->toDateString());
    }

    public function test_scheduler_does_not_generate_transaction_for_future_templates(): void
    {
        $tomorrow = Carbon::tomorrow();

        $template = RecurringTemplate::create([
            'user_id'        => $this->user->id,
            'type'           => 'expense',
            'name'           => 'Rent',
            'default_amount' => 1200.00,
            'category_id'    => $this->category->id,
            'account_id'     => $this->account->id,
            'frequency'      => 'monthly',
            'scheduled_day'  => 1,
            'next_due_date'  => $tomorrow->toDateString(),
            'start_date'     => now()->toDateString(),
            'status'         => 'active',
        ]);

        // Run scheduler command
        Artisan::call('recurring:generate');

        // Check no pending transaction was created
        $this->assertDatabaseMissing('transactions', [
            'recurring_template_id' => $template->id,
        ]);

        // next_due_date is unchanged
        $this->assertEquals($tomorrow->toDateString(), $template->fresh()->next_due_date->toDateString());
    }
}
