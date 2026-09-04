<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
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
            'documentId' => $this->document_id,
            'authorId' => $this->author_id,
            'authorName' => $this->author_name,
            'authorRole' => $this->author_role,
            'authorAvatar' => $this->author_avatar,
            'content' => $this->content,
            'createdAt' => $this->created_at?->toIso8601String(),
            'isOfflinePending' => false,
        ];
    }
}
