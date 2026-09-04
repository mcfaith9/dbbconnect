<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFolderRequest;
use App\Http\Resources\FolderResource;
use App\Models\Document;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FolderController extends Controller
{
    /**
     * List folders with optional owner/parent filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Folder::query();

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->query('owner_id'));
        }

        if ($request->has('parent_id')) {
            $parentId = $request->query('parent_id');
            if ($parentId === 'root' || $parentId === null || $parentId === '') {
                $query->whereNull('parent_id');
            } else {
                $query->where('parent_id', $parentId);
            }
        }

        $folders = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => FolderResource::collection($folders),
        ]);
    }

    /**
     * Create a new folder.
     */
    public function store(StoreFolderRequest $request): JsonResponse
    {
        $id = 'folder-' . time() . '-' . Str::random(5);

        $folder = Folder::create([
            'id' => $id,
            'name' => trim($request->input('name')),
            'parent_id' => $request->input('parentId'),
            'owner_id' => $request->input('ownerId'),
            'color' => $request->input('color', '#2563eb'),
            'is_system' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => new FolderResource($folder),
        ], 201);
    }

    /**
     * Show single folder.
     */
    public function show(string $id): JsonResponse
    {
        $folder = Folder::find($id);

        if (!$folder) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new FolderResource($folder),
        ]);
    }

    /**
     * Update folder (rename or move).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $folder = Folder::find($id);

        if (!$folder) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'parentId' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:50'],
        ]);

        if (isset($validated['name'])) {
            $folder->name = trim($validated['name']);
        }

        if (array_key_exists('parentId', $validated)) {
            // Prevent circular nesting
            if ($validated['parentId'] !== $folder->id) {
                $folder->parent_id = $validated['parentId'];
            }
        }

        if (isset($validated['color'])) {
            $folder->color = $validated['color'];
        }

        $folder->save();

        return response()->json([
            'success' => true,
            'data' => new FolderResource($folder),
        ]);
    }

    /**
     * Delete folder and nested folders.
     */
    public function destroy(string $id): JsonResponse
    {
        $folder = Folder::find($id);

        if (!$folder) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found.',
            ], 404);
        }

        // Recursive deletion of subfolders
        $toDelete = [$id];
        $allFolders = Folder::all();

        $foundNew = true;
        while ($foundNew) {
            $foundNew = false;
            foreach ($allFolders as $f) {
                if ($f->parent_id && in_array($f->parent_id, $toDelete) && !in_array($f->id, $toDelete)) {
                    $toDelete[] = $f->id;
                    $foundNew = true;
                }
            }
        }

        // Delete documents inside these folders or update them to root
        Document::whereIn('folder_id', $toDelete)->delete();
        Folder::whereIn('id', $toDelete)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Folder and contents deleted successfully.',
        ]);
    }
}
