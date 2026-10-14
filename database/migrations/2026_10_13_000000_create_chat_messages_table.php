<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Chat between a kid and grown-ups playing along. Saved so parents can read it; parents can delete it in Grown-ups. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kid_id')->constrained()->cascadeOnDelete();
            $table->string('game', 40);
            $table->foreignId('coop_session_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('from_kid')->default(false);
            $table->string('sender', 30);
            $table->string('color', 16)->nullable();
            $table->string('body', 300);
            $table->timestamps();
            $table->index(['kid_id', 'game', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
