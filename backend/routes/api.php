<?php

use App\Http\Controllers\Api\AsbController;
use App\Http\Controllers\Api\BankStatementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EpfController;
use App\Http\Controllers\Api\RecurringTemplateController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // --- Auth ---
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login',    [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me',      [AuthController::class, 'me']);
            Route::put('me',      [AuthController::class, 'updateMe']);
        });
    });

    // --- Protected Routes ---
    Route::middleware('auth:sanctum')->group(function () {

        // Bank Accounts
        Route::prefix('accounts')->group(function () {
            Route::get('/',                            [BankAccountController::class, 'index']);
            Route::post('/',                           [BankAccountController::class, 'store']);
            Route::get('archived',                     [BankAccountController::class, 'archived']);
            Route::get('{account}',                    [BankAccountController::class, 'show']);
            Route::put('{account}',                    [BankAccountController::class, 'update']);
            Route::patch('{account}/archive',          [BankAccountController::class, 'archive']);
            Route::patch('{account}/restore',          [BankAccountController::class, 'restore']);
            Route::get('{account}/transactions',       [BankAccountController::class, 'transactions']);
            Route::get('{account}/statements',                          [BankStatementController::class, 'index']);
            Route::post('{account}/statements',                         [BankStatementController::class, 'store']);
            Route::get('{account}/statements/{statement}/download',     [BankStatementController::class, 'download']);
            Route::delete('{account}/statements/{statement}',           [BankStatementController::class, 'destroy']);
        });

        // Categories
        Route::prefix('categories')->group(function () {
            Route::get('/',              [CategoryController::class, 'index']);
            Route::get('parents',        [CategoryController::class, 'parents']);
            Route::get('{category}/children', [CategoryController::class, 'children']);
            Route::post('/',             [CategoryController::class, 'store']);
            Route::put('{category}',     [CategoryController::class, 'update']);
            Route::delete('{category}',  [CategoryController::class, 'destroy']);
        });

        // Transactions
        Route::prefix('transactions')->group(function () {
            Route::get('/',                        [TransactionController::class, 'index']);
            Route::post('/',                       [TransactionController::class, 'store']);
            Route::get('pending',                  [TransactionController::class, 'pending']);
            Route::get('summary',                  [TransactionController::class, 'summary']);
            Route::get('{transaction}',            [TransactionController::class, 'show']);
            Route::put('{transaction}',            [TransactionController::class, 'update']);
            Route::delete('{transaction}',         [TransactionController::class, 'destroy']);
            Route::patch('{transaction}/confirm',  [TransactionController::class, 'confirm']);
            Route::patch('{transaction}/skip',     [TransactionController::class, 'skip']);
            Route::get('{transaction}/receipt',     [TransactionController::class, 'receipt']);
            Route::post('{transaction}/receipt',    [TransactionController::class, 'updateReceipt']);
        });

        // Recurring Templates
        Route::prefix('recurring')->group(function () {
            Route::get('/',                              [RecurringTemplateController::class, 'index']);
            Route::post('/',                             [RecurringTemplateController::class, 'store']);
            Route::get('{recurringTemplate}',            [RecurringTemplateController::class, 'show']);
            Route::put('{recurringTemplate}',            [RecurringTemplateController::class, 'update']);
            Route::patch('{recurringTemplate}/pause',    [RecurringTemplateController::class, 'pause']);
            Route::patch('{recurringTemplate}/resume',   [RecurringTemplateController::class, 'resume']);
            Route::delete('{recurringTemplate}',         [RecurringTemplateController::class, 'destroy']);
        });

        // Budgets
        Route::prefix('budgets')->group(function () {
            Route::get('/',                  [BudgetController::class, 'index']);
            Route::post('/',                 [BudgetController::class, 'store']);
            Route::get('overview',           [BudgetController::class, 'overview']);
            Route::get('{budget}',           [BudgetController::class, 'show']);
            Route::put('{budget}',           [BudgetController::class, 'update']);
            Route::delete('{budget}',        [BudgetController::class, 'destroy']);
            Route::patch('{budget}/toggle',  [BudgetController::class, 'toggle']);
            Route::get('{budget}/history',   [BudgetController::class, 'history']);
        });

        // Dashboard
        Route::prefix('dashboard')->group(function () {
            Route::get('/',                  [DashboardController::class, 'index']);
            Route::get('net-worth',          [DashboardController::class, 'netWorth']);
            Route::get('cashflow',           [DashboardController::class, 'cashflow']);
            Route::get('spending-breakdown', [DashboardController::class, 'spendingBreakdown']);
        });

        // EPF Tracker
        Route::prefix('epf')->group(function () {
            Route::get('/',                         [EpfController::class, 'overview']);
            Route::get('transactions',              [EpfController::class, 'transactions']);
            Route::post('transactions',             [EpfController::class, 'store']);
            Route::put('transactions/{epfTransaction}',    [EpfController::class, 'update']);
            Route::delete('transactions/{epfTransaction}', [EpfController::class, 'destroy']);
            Route::get('analytics',                 [EpfController::class, 'analytics']);
            Route::get('calculator/retirement',     [EpfController::class, 'retirementCalculator']);
            Route::get('calculator/sustainability', [EpfController::class, 'sustainabilityCalculator']);
            Route::get('calculator/comfort',        [EpfController::class, 'comfortCalculator']);
        });

        // ASB / ASNB Tracker
        Route::prefix('asb')->group(function () {
            Route::get('/',        [AsbController::class, 'index']);
            Route::post('/',       [AsbController::class, 'store']);
            Route::get('{asbFund}',    [AsbController::class, 'showFund']);
            Route::delete('{asbFund}', [AsbController::class, 'destroyFund']);

            Route::get('{asbFund}/transactions',               [AsbController::class, 'transactions']);
            Route::post('{asbFund}/transactions',              [AsbController::class, 'storeTransaction']);
            Route::delete('{asbFund}/transactions/{asbTransaction}', [AsbController::class, 'destroyTransaction']);

            Route::get('{asbFund}/dividends',                  [AsbController::class, 'dividends']);
            Route::post('{asbFund}/dividends',                 [AsbController::class, 'storeDividend']);
            Route::delete('{asbFund}/dividends/{asbDividend}', [AsbController::class, 'destroyDividend']);

            Route::get('{asbFund}/analytics',   [AsbController::class, 'analytics']);
            Route::get('{asbFund}/calculator',  [AsbController::class, 'calculator']);
        });

    });
});
