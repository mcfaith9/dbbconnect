<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'original_name',
        'mime_type',
        'type',
        'size',
        'size_formatted',
        'folder_id',
        'owner_id',
        'uploaded_by_id',
        'uploaded_by_name',
        'uploaded_by_role',
        'version',
        'is_shared',
        'tags',
        'offline_cached',
        'offline_cached_at',
        'preview_url',
        'thumbnail_url',
        'file_path',
        'text_content',
        'docx_html',
        'data_url',
        'page_count',
    ];

    protected $casts = [
        'is_shared' => 'boolean',
        'offline_cached' => 'boolean',
        'offline_cached_at' => 'datetime',
        'tags' => 'array',
        'size' => 'integer',
        'page_count' => 'integer',
    ];

    public function folder()
    {
        return $this->belongsTo(Folder::class, 'folder_id', 'id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id', 'id');
    }

    public function assignments()
    {
        return $this->hasMany(DocumentAssignment::class, 'document_id', 'id');
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(
            User::class,
            'document_assignments',
            'document_id',
            'user_id'
        );
    }

    public function comments()
    {
        return $this->hasMany(DocumentComment::class, 'document_id', 'id')->orderBy('created_at', 'asc');
    }
}
