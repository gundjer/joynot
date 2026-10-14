<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kids', function (Blueprint $table) {
            $table->string('grade', 4)->nullable()->after('color');          // grade they are in at school
            $table->string('reading_grade', 4)->nullable()->after('grade');  // grade they read at
            $table->string('math_grade', 4)->nullable()->after('reading_grade'); // grade they do math at
            $table->string('goal_grade', 4)->nullable()->after('math_grade');    // grade the parent wants them to reach
        });
    }

    public function down(): void
    {
        Schema::table('kids', function (Blueprint $table) {
            $table->dropColumn(['grade', 'reading_grade', 'math_grade', 'goal_grade']);
        });
    }
};
