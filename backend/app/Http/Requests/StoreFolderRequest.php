<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFolderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('parentId') === '' || $this->input('parentId') === 'root') {
            $this->merge(['parentId' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'parentId' => ['nullable', 'string', 'exists:folders,id'],
            'ownerId' => ['required', 'string', function ($attribute, $value, $fail) {
                if ($value !== 'shared' && !\App\Models\User::where('id', $value)->exists()) {
                    $fail('The selected employee workspace owner does not exist.');
                }
            }],
            'color' => ['nullable', 'string', 'max:50'],
        ];
    }
}
