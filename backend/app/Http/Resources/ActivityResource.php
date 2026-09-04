<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
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
            'userId' => $this->user_id,
            'userName' => $this->user_name,
            'userRole' => $this->user_role,
            'type' => $this->type,
            'actionTitle' => $this->action_title,
            'description' => $this->description,
            'targetName' => $this->target_name,
            'targetId' => $this->target_id,
            'employeeName' => $this->employee_name,
            'timestamp' => $this->timestamp?->toIso8601String(),
        ];
    }
}
