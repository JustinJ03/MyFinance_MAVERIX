<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('recurring_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['expense', 'income']);
            $table->string('name', 200);
            $table->decimal('default_amount', 12, 2);
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'yearly']);
            $table->tinyInteger('scheduled_day')->nullable();
            $table->date('next_due_date');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->enum('status', ['active', 'paused', 'ended'])->default('active');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_templates');
    }
};
