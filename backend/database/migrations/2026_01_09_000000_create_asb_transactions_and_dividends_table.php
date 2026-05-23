<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('asb_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asb_fund_id')->constrained('asb_funds')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('transaction_type', ['deposit', 'withdrawal']);
            $table->date('date');
            $table->decimal('amount', 12, 2);
            $table->foreignId('linked_transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('asb_dividends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asb_fund_id')->constrained('asb_funds')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->year('year');
            $table->decimal('dividend_rate', 5, 4);
            $table->decimal('dividend_amount', 12, 2);
            $table->decimal('bonus_rate', 5, 4)->nullable();
            $table->decimal('bonus_amount', 12, 2)->nullable();
            $table->decimal('total_payout', 12, 2);
            $table->timestamps();
            $table->unique(['asb_fund_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asb_dividends');
        Schema::dropIfExists('asb_transactions');
    }
};
