<?php

namespace App\Console\Commands;

use App\Services\RecurringService;
use Illuminate\Console\Command;

class GeneratePendingTransactions extends Command
{
    protected $signature   = 'recurring:generate';
    protected $description = 'Generate pending transactions for all due recurring templates';

    public function handle(RecurringService $service): void
    {
        $this->info('Generating pending recurring transactions...');
        $service->generatePendingForToday();
        $this->info('Done.');
    }
}
