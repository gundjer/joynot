<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kid_id')->constrained()->cascadeOnDelete();
            $table->string('game', 60);                 // game key from config/joynot.php
            $table->longText('state')->nullable();      // the game's full save (JSON)
            $table->text('summary')->nullable();        // small numbers for cards/reports (JSON)
            $table->boolean('hidden')->default(false);  // grown-up hid this game for this kid
            $table->unsignedInteger('plays')->default(0);
            $table->timestamp('last_played_at')->nullable();
            $table->timestamps();
            $table->unique(['kid_id', 'game']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_progress');
    }
};
