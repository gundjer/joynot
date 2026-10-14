<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Grown-ups play along: a kid's game is a "session"; grown-ups join it as members; messages go between them. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coop_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kid_id')->constrained()->cascadeOnDelete();
            $table->string('game', 40);
            $table->string('world', 60)->nullable();
            $table->string('host_token', 40);
            $table->mediumText('state')->nullable();
            $table->unsignedInteger('state_ver')->default(0);
            $table->timestamp('host_seen_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'host_seen_at']);
        });

        Schema::create('coop_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coop_session_id')->constrained()->cascadeOnDelete();
            $table->string('token', 40)->unique();
            $table->string('name', 30);
            $table->string('color', 16);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamps();
        });

        Schema::create('coop_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coop_session_id')->constrained()->cascadeOnDelete();
            $table->string('recipient', 40)->index(); // 'host', '*' (every grown-up) or a member token
            $table->string('sender', 40);
            $table->text('body');
            $table->timestamp('created_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coop_messages');
        Schema::dropIfExists('coop_members');
        Schema::dropIfExists('coop_sessions');
    }
};
