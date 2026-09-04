<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Primary key is a string (e.g. admin-001, employee-001)
     */
    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'username',
        'name',
        'display_name',
        'email',
        'password',
        'role',
        'position',
        'department',
        'phone',
        'assigned_project',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    /**
     * Folders owned by this user
     */
    public function folders()
    {
        return $this->hasMany(Folder::class, 'owner_id', 'id');
    }

    /**
     * Documents owned by this user
     */
    public function documents()
    {
        return $this->hasMany(Document::class, 'owner_id', 'id');
    }

    /**
     * Documents assigned to this user
     */
    public function assignedDocuments()
    {
        return $this->belongsToMany(
            Document::class,
            'document_assignments',
            'user_id',
            'document_id'
        );
    }

    /**
     * Comments written by this user
     */
    public function comments()
    {
        return $this->hasMany(DocumentComment::class, 'author_id', 'id');
    }

    /**
     * Check if user is administrator
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
