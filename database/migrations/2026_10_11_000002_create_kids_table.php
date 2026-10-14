<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 40);
            $table->string('avatar', 16)->default('🦊');
            $table->string('color', 16)->default('#ff9d3d');
            $table->unsignedSmallInteger('sort')->default(0);
            $table->unsignedBigInteger('legacy_player_id')->nullable(); // set when imported from the old Rusty's players table
            $table->timestamps();
            $table->index(['user_id', 'sort']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kids');
    }
};
