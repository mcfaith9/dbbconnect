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
        Schema::create('documents', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('original_name');
            $table->string('mime_type');
            $table->string('type'); // pdf, image, word, excel, powerpoint, other
            $table->unsignedBigInteger('size')->default(0);
            $table->string('size_formatted')->default('0 B');
            $table->string('folder_id')->nullable()->index();
            $table->string('owner_id')->index(); // employee ID, or 'shared'
            $table->string('uploaded_by_id')->index();
            $table->string('uploaded_by_name');
            $table->string('uploaded_by_role');
            $table->string('version')->default('v1.0');
            $table->boolean('is_shared')->default(false);
            $table->json('tags')->nullable();
            $table->boolean('offline_cached')->default(false);
            $table->timestamp('offline_cached_at')->nullable();
            $table->text('preview_url')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->text('file_path')->nullable();
            $table->longText('text_content')->nullable();
            $table->longText('docx_html')->nullable();
            $table->longText('data_url')->nullable();
            $table->integer('page_count')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
