<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('asb_funds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('fund_name', ['ASB', 'ASB2', 'ASM', 'ASM2_Wawasan', 'ASM3']);
            $table->decimal('units_held', 12, 2)->default(0);
            $table->decimal('unit_ceiling', 12, 2);
            $table->timestamps();
            $table->unique(['user_id', 'fund_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asb_funds');
    }
};
