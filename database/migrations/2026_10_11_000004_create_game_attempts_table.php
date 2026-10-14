<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kid_id')->constrained()->cascadeOnDelete();
            $table->string('game', 60);
            $table->string('track', 20);                 // e.g. reading | math
            $table->unsignedSmallInteger('level')->default(1);
            $table->text('prompt');
            $table->string('expected');
            $table->string('heard')->nullable();
            $table->boolean('correct')->default(false);
            $table->boolean('first_try')->default(false);
            $table->boolean('helped')->default(false);
            $table->boolean('review')->default(false);
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();
            $table->index(['kid_id', 'game', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_attempts');
    }
};
