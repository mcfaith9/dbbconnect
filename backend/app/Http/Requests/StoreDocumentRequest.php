<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'originalName' => ['nullable', 'string', 'max:255'],
            'file' => ['nullable', 'file', 'max:102400'], // 100MB maximum file size
            'mimeType' => ['nullable', 'string', 'max:255'],
            'size' => ['nullable', 'numeric'],
            'folderId' => ['nullable', 'string'],
            'ownerId' => ['required', 'string'],
            'assignedTo' => ['nullable', 'array'],
            'assignedTo.*' => ['string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string'],
            'previewUrl' => ['nullable', 'string'],
            'thumbnailUrl' => ['nullable', 'string'],
            'textContent' => ['nullable', 'string'],
            'docxHtml' => ['nullable', 'string'],
            'dataUrl' => ['nullable', 'string'],
            'pageCount' => ['nullable', 'integer'],
        ];
    }
}
