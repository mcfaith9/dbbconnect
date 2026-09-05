<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Load assigned user IDs
        $assignedTo = $this->assignedUsers->pluck('id')->toArray();
        if ($this->owner_id !== 'shared' && !in_array($this->owner_id, $assignedTo)) {
            $assignedTo[] = $this->owner_id;
        }

        $downloadUrl = $this->file_path 
            ? url('/api/documents/' . $this->id . '/download')
            : ($this->preview_url ?? null);

        $previewUrl = $this->file_path 
            ? url('/api/documents/' . $this->id . '/file')
            : ($this->preview_url ?? null);

        $thumbnailUrl = $this->file_path 
            ? url('/api/documents/' . $this->id . '/file')
            : ($this->thumbnail_url ?? null);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'originalName' => $this->original_name,
            'mimeType' => $this->mime_type,
            'type' => $this->type,
            'size' => (int) $this->size,
            'sizeFormatted' => $this->size_formatted,
            'folderId' => $this->folder_id,
            'ownerId' => $this->owner_id,
            'uploadedBy' => [
                'id' => $this->uploaded_by_id,
                'name' => $this->uploaded_by_name,
                'role' => $this->uploaded_by_role,
            ],
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'version' => $this->version ?? 'v1.0',
            'isShared' => (bool) $this->is_shared,
            'assignedTo' => array_values(array_unique($assignedTo)),
            'tags' => $this->tags ?? ($this->type === 'image' ? ['Site Photo'] : ['Field Document']),
            'offlineCached' => (bool) $this->offline_cached,
            'offlineCachedAt' => $this->offline_cached_at?->toIso8601String(),
            'previewUrl' => $previewUrl,
            'thumbnailUrl' => $thumbnailUrl,
            'textContent' => $this->text_content,
            'docxHtml' => $this->docx_html,
            'dataUrl' => $this->data_url,
            'pageCount' => $this->page_count,
            'downloadUrl' => $downloadUrl,
        ];
    }
}
