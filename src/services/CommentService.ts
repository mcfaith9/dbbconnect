import { storage } from './storage'
import { api } from './api'
import type { DocumentComment, User } from '@/types'

export const CommentService = {
  async getAllComments(): Promise<DocumentComment[]> {
    return await storage.getAll<DocumentComment>(storage.STORES.COMMENTS)
  },

  async getCommentsByDocument(documentId: string): Promise<DocumentComment[]> {
    try {
      const res = await api.get<DocumentComment[]>('/comments', { document_id: documentId })
      if (res.success && Array.isArray(res.data)) {
        for (const c of res.data) {
          await storage.put<DocumentComment>(storage.STORES.COMMENTS, c)
        }
        return res.data
      }
    } catch (e) {
      console.warn('API sync failed for comments, checking local cache:', e)
    }

    const all = await this.getAllComments()
    return all
      .filter((c) => c.documentId === documentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  },

  async addComment(params: {
    documentId: string
    user: User
    content: string
    isOffline?: boolean
  }): Promise<DocumentComment> {
    if (!params.isOffline) {
      const res = await api.post<DocumentComment>('/comments', {
        documentId: params.documentId,
        content: params.content.trim(),
        authorId: params.user.id,
        authorName: params.user.name,
        authorRole: params.user.role,
        authorAvatar: params.user.avatar,
      })

      if (res.success && res.data) {
        await storage.put<DocumentComment>(storage.STORES.COMMENTS, res.data)
        return res.data
      } else {
        throw new Error(res.error || 'Failed to post comment to server.')
      }
    }

    const newComment: DocumentComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      documentId: params.documentId,
      authorId: params.user.id,
      authorName: params.user.name,
      authorRole: params.user.role,
      authorAvatar: params.user.avatar,
      content: params.content.trim(),
      createdAt: new Date().toISOString(),
      isOfflinePending: true,
    }

    await storage.put<DocumentComment>(storage.STORES.COMMENTS, newComment)

    await storage.put(storage.STORES.SYNC_QUEUE, {
      id: `sync-comment-${newComment.id}`,
      type: 'comment',
      payload: newComment,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    })

    return newComment
  },

  async markCommentSynced(commentId: string): Promise<void> {
    const comment = await storage.getById<DocumentComment>(storage.STORES.COMMENTS, commentId)
    if (comment) {
      comment.isOfflinePending = false
      await storage.put<DocumentComment>(storage.STORES.COMMENTS, comment)
    }
  },

  async getRecentComments(limit = 10): Promise<DocumentComment[]> {
    const all = await this.getAllComments()
    return all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  },
}
