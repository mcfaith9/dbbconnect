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
        $user = $request->user();
        $query = Folder::query();

        if ($user && $user->role === 'employee') {
            // Employees may only view their own folders or shared company folders
            $query->where(function ($q) use ($user) {
                $q->where('owner_id', $user->id)
                  ->orWhere('owner_id', 'shared');
            });
        } elseif ($request->filled('owner_id')) {
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
        $user = $request->user();
        $ownerId = $request->input('ownerId');

        // Security: Employees can only create folders for themselves
        if ($user && $user->role === 'employee' && $ownerId !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Employees cannot create folders in another workspace.',
            ], 403);
        }

        // Validate parent folder belongs to the same owner if specified
        $parentId = $request->input('parentId');
        if ($parentId) {
            $parentFolder = Folder::find($parentId);
            if (!$parentFolder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent folder does not exist.',
                ], 422);
            }
            if ($parentFolder->owner_id !== $ownerId && $parentFolder->owner_id !== 'shared') {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent folder belongs to a different workspace.',
                ], 422);
            }
        }

        $id = 'folder-' . time() . '-' . Str::random(5);

        $folder = Folder::create([
            'id' => $id,
            'name' => trim($request->input('name')),
            'parent_id' => $parentId,
            'owner_id' => $ownerId,
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
    public function show(Request $request, string $id): JsonResponse
    {
        $folder = Folder::find($id);

        if (!$folder) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found.',
            ], 404);
        }

        $user = $request->user();
        if ($user && $user->role === 'employee' && $folder->owner_id !== $user->id && $folder->owner_id !== 'shared') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to this folder.',
            ], 403);
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

        $user = $request->user();
        if ($user && $user->role === 'employee' && $folder->owner_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to modify this folder.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'parentId' => ['nullable', 'string', 'exists:folders,id'],
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
    public function destroy(Request $request, string $id): JsonResponse
    {
        $folder = Folder::find($id);

        if (!$folder) {
            return response()->json([
                'success' => false,
                'message' => 'Folder not found.',
            ], 404);
        }

        $user = $request->user();
        if ($user && $user->role === 'employee' && $folder->owner_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to delete this folder.',
            ], 403);
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
