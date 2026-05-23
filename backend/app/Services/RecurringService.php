<?php

namespace App\Services;

use App\Models\RecurringTemplate;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RecurringService
{
    /**
     * Called daily by the Laravel Scheduler.
     * Generates pending transactions for all due recurring templates.
     */
    public function generatePendingForToday(): void
    {
        $today = Carbon::today();

        RecurringTemplate::active()
            ->where('next_due_date', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            })
            ->each(function (RecurringTemplate $template) {
                try {
                    $this->generatePending($template);
                } catch (\Exception $e) {
                    Log::error("RecurringService: failed for template {$template->id}: " . $e->getMessage());
                }
            });
    }

    private function generatePending(RecurringTemplate $template): void
    {
        Transaction::create([
            'user_id'               => $template->user_id,
            'type'                  => $template->type,
            'name'                  => $template->name,
            'amount'                => $template->default_amount,
            'category_id'           => $template->category_id,
            'account_id'            => $template->account_id,
            'recurring_template_id' => $template->id,
            'scheduled_date'        => $template->next_due_date,
            'actual_date'           => $template->next_due_date,
            'status'                => 'pending',
            'remarks'               => $template->remarks,
        ]);

        $template->update(['next_due_date' => $this->nextDueDate($template)]);
    }

    private function nextDueDate(RecurringTemplate $template): Carbon
    {
        $current = Carbon::parse($template->next_due_date);

        return match ($template->frequency) {
            'daily'   => $current->addDay(),
            'weekly'  => $current->addWeek(),
            'monthly' => $template->scheduled_day
                ? $current->addMonthNoOverflow()->startOfMonth()->addDays($template->scheduled_day - 1)
                : $current->addMonthNoOverflow(),
            'yearly'  => $current->addYear(),
        };
    }

    /**
     * Flag pending transactions older than 30 days as "overdue" via a remarks flag.
     * (No separate status — we use the remarks or a future overdue column.)
     */
    public function flagOverdue(): void
    {
        $threshold = Carbon::today()->subDays(30);

        Transaction::where('status', 'pending')
            ->whereDate('scheduled_date', '<', $threshold)
            ->update(['remarks' => '[OVERDUE] ' . now()->toDateString()]);
    }
}
