<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->index()->after('password');
            $table->boolean('active')->default(true)->index()->after('role');
            $table->timestamp('disabled_at')->nullable()->after('active');
            $table->foreignId('created_by')->nullable()->after('disabled_at')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['active']);
            $table->dropForeign(['created_by']);
            $table->dropColumn(['role', 'active', 'disabled_at', 'created_by']);
        });
    }
};
