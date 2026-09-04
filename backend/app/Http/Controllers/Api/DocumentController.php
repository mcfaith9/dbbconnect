<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\DocumentAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * Helper to format bytes to human readable format.
     */
    private function formatBytes(int $bytes, int $precision = 1): string
    {
        if ($bytes <= 0) return '0 B';
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $base = log($bytes) / log(1024);
        $floor = floor($base);
        return round(pow(1024, $base - $floor), $precision) . ' ' . ($units[$floor] ?? 'B');
    }

    /**
     * Helper to detect file type.
     */
    private function detectType(string $filename, ?string $mime): string
    {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if ($ext === 'pdf' || $mime === 'application/pdf') return 'pdf';
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg']) || str_starts_with($mime ?? '', 'image/')) return 'image';
        if (in_array($ext, ['doc', 'docx'])) return 'word';
        if (in_array($ext, ['xls', 'xlsx', 'csv'])) return 'excel';
        if (in_array($ext, ['ppt', 'pptx'])) return 'powerpoint';
        return 'other';
    }

    /**
     * List documents with flexible filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Document::with(['assignedUsers']);

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->query('owner_id'));
        }

        if ($request->has('folder_id')) {
            $folderId = $request->query('folder_id');
            if ($folderId === 'root' || $folderId === null || $folderId === '') {
                $query->whereNull('folder_id');
            } else {
                $query->where('folder_id', $folderId);
            }
        }

        if ($request->filled('is_shared')) {
            $query->where('is_shared', filter_var($request->query('is_shared'), FILTER_VALIDATE_BOOLEAN));
        }

        // Filter assigned documents for a specific employee
        if ($request->filled('employee_id')) {
            $empId = $request->query('employee_id');
            $query->where(function ($q) use ($empId) {
                $q->where('owner_id', $empId)
                  ->orWhere('owner_id', 'shared')
                  ->orWhere('is_shared', true)
                  ->orWhereHas('assignedUsers', function ($sub) use ($empId) {
                      $sub->where('users.id', $empId);
                  });
            });
        }

        // Search query
        if ($request->filled('search')) {
            $s = trim($request->query('search'));
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('original_name', 'like', "%{$s}%")
                  ->orWhere('text_content', 'like', "%{$s}%");
            });
        }

        $documents = $query->orderBy('updated_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => DocumentResource::collection($documents),
        ]);
    }

    /**
     * Upload and store a new document.
     */
    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $id = 'doc-' . time() . '-' . Str::random(5);
        $name = trim($request->input('name'));
        $originalName = $request->input('originalName', $name);

        $size = 0;
        $mimeType = $request->input('mimeType', 'application/octet-stream');
        $filePath = null;

        // Handle direct file upload if present
        if ($request->hasFile('file')) {
            $uploadedFile = $request->file('file');
            $size = $uploadedFile->getSize();
            $mimeType = $uploadedFile->getMimeType() ?: $mimeType;
            $originalName = $uploadedFile->getClientOriginalName() ?: $originalName;
            $filePath = $uploadedFile->store('documents', 'public');
        } else {
            $size = (int) $request->input('size', 0);
        }

        $type = $this->detectType($name, $mimeType);
        $sizeFormatted = $this->formatBytes($size);

        $ownerId = $request->input('ownerId');
        $isShared = ($ownerId === 'shared') || $request->boolean('isShared');

        // Extract user or request uploader info
        $user = $request->user();
        $uploaderId = $user ? $user->id : ($request->input('uploadedBy.id') ?? 'admin-001');
        $uploaderName = $user ? $user->name : ($request->input('uploadedBy.name') ?? 'System Admin');
        $uploaderRole = $user ? $user->role : ($request->input('uploadedBy.role') ?? 'admin');

        $doc = Document::create([
            'id' => $id,
            'name' => $name,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'type' => $type,
            'size' => $size,
            'size_formatted' => $sizeFormatted,
            'folder_id' => $request->input('folderId'),
            'owner_id' => $ownerId,
            'uploaded_by_id' => $uploaderId,
            'uploaded_by_name' => $uploaderName,
            'uploaded_by_role' => $uploaderRole,
            'version' => 'v1.0',
            'is_shared' => $isShared,
            'tags' => $request->input('tags', $type === 'image' ? ['Site Photo'] : ['Field Document']),
            'offline_cached' => true,
            'offline_cached_at' => now(),
            'preview_url' => $request->input('previewUrl'),
            'thumbnail_url' => $request->input('thumbnailUrl'),
            'file_path' => $filePath,
            'text_content' => $request->input('textContent'),
            'docx_html' => $request->input('docxHtml'),
            'data_url' => $request->input('dataUrl'),
            'page_count' => $request->input('pageCount'),
        ]);

        // Auto assign owner and requested assignees
        $assignedIds = (array) $request->input('assignedTo', []);
        if ($ownerId !== 'shared' && !in_array($ownerId, $assignedIds)) {
            $assignedIds[] = $ownerId;
        }

        foreach (array_unique($assignedIds) as $empId) {
            if (User::where('id', $empId)->exists()) {
                DocumentAssignment::firstOrCreate([
                    'document_id' => $doc->id,
                    'user_id' => $empId,
                ]);
            }
        }

        $doc->load('assignedUsers');

        return response()->json([
            'success' => true,
            'data' => new DocumentResource($doc),
        ], 201);
    }

    /**
     * Show single document.
     */
    public function show(string $id): JsonResponse
    {
        $doc = Document::with(['assignedUsers', 'comments'])->find($id);

        if (!$doc) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new DocumentResource($doc),
        ]);
    }

    /**
     * Update document (rename, move, tags).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $doc = Document::with(['assignedUsers'])->find($id);

        if (!$doc) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'folderId' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'offlineCached' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['name'])) {
            $doc->name = trim($validated['name']);
        }

        if (array_key_exists('folderId', $validated)) {
            $doc->folder_id = $validated['folderId'];
        }

        if (isset($validated['tags'])) {
            $doc->tags = $validated['tags'];
        }

        if (isset($validated['offlineCached'])) {
            $doc->offline_cached = $validated['offlineCached'];
            $doc->offline_cached_at = $validated['offlineCached'] ? now() : null;
        }

        $doc->save();

        return response()->json([
            'success' => true,
            'data' => new DocumentResource($doc),
        ]);
    }

    /**
     * Assign employees to a document.
     */
    public function assign(Request $request, string $id): JsonResponse
    {
        $doc = Document::find($id);

        if (!$doc) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $request->validate([
            'employeeIds' => ['required', 'array'],
            'employeeIds.*' => ['string'],
        ]);

        $employeeIds = array_unique($request->input('employeeIds'));

        // Sync assignments
        DocumentAssignment::where('document_id', $doc->id)->delete();
        foreach ($employeeIds as $empId) {
            if (User::where('id', $empId)->exists()) {
                DocumentAssignment::create([
                    'document_id' => $doc->id,
                    'user_id' => $empId,
                ]);
            }
        }

        $doc->load('assignedUsers');

        return response()->json([
            'success' => true,
            'data' => new DocumentResource($doc),
        ]);
    }

    /**
     * Delete document and cleanup stored file.
     */
    public function destroy(string $id): JsonResponse
    {
        $doc = Document::find($id);

        if (!$doc) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        if ($doc->file_path && Storage::disk('public')->exists($doc->file_path)) {
            Storage::disk('public')->delete($doc->file_path);
        }

        DocumentAssignment::where('document_id', $doc->id)->delete();
        $doc->comments()->delete();
        $doc->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully.',
        ]);
    }

    /**
     * Download document file.
     */
    public function download(string $id)
    {
        $doc = Document::find($id);

        if (!$doc || !$doc->file_path || !Storage::disk('public')->exists($doc->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found on server.',
            ], 404);
        }

        return Storage::disk('public')->download($doc->file_path, $doc->name);
    }
}
