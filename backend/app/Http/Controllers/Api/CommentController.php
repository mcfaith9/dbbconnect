<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Document;
use App\Models\DocumentComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CommentController extends Controller
{
    /**
     * List comments (optionally by document_id).
     */
    public function index(Request $request): JsonResponse
    {
        $query = DocumentComment::query();

        if ($request->filled('document_id')) {
            $query->where('document_id', $request->query('document_id'));
        }

        $comments = $query->orderBy('created_at', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => CommentResource::collection($comments),
        ]);
    }

    /**
     * Post a comment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'documentId' => ['required', 'string', 'exists:documents,id'],
            'content' => ['required', 'string'],
        ]);

        $user = $request->user();
        $id = 'comment-' . time() . '-' . Str::random(5);

        $comment = DocumentComment::create([
            'id' => $id,
            'document_id' => $validated['documentId'],
            'author_id' => $user ? $user->id : ($request->input('authorId') ?? 'user-guest'),
            'author_name' => $user ? $user->name : ($request->input('authorName') ?? 'Field Personnel'),
            'author_role' => $user ? $user->role : ($request->input('authorRole') ?? 'employee'),
            'author_avatar' => $user ? $user->avatar : $request->input('authorAvatar'),
            'content' => trim($validated['content']),
        ]);

        return response()->json([
            'success' => true,
            'data' => new CommentResource($comment),
        ], 201);
    }

    /**
     * Delete a comment.
     */
    public function destroy(string $id): JsonResponse
    {
        $comment = DocumentComment::find($id);

        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'Comment not found.',
            ], 404);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully.',
        ]);
    }
}
