<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['expense', 'income', 'transfer']);
            $table->string('name', 200);
            $table->decimal('amount', 12, 2);
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $table->foreignId('to_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->foreignId('recurring_template_id')->nullable()->constrained('recurring_templates')->nullOnDelete();
            $table->foreignId('asb_fund_id')->nullable()->constrained('asb_funds')->nullOnDelete();
            $table->date('scheduled_date')->nullable();
            $table->date('actual_date');
            $table->enum('status', ['pending', 'confirmed', 'skipped'])->default('confirmed');
            $table->text('remarks')->nullable();
            $table->string('attachment_path', 500)->nullable();
            $table->tinyInteger('epf_account_number')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
