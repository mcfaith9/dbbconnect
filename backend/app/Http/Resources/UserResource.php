<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'name' => $this->name,
            'displayName' => $this->display_name ?? $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'position' => $this->position,
            'department' => $this->department,
            'phone' => $this->phone,
            'assignedProject' => $this->assigned_project,
            'avatar' => $this->avatar,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
