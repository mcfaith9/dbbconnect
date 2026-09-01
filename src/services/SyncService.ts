import { storage } from './storage'
import { CommentService } from './CommentService'
import type { SyncQueueItem } from '@/types'

export const SyncService = {
  async getPendingQueue(): Promise<SyncQueueItem[]> {
    return await storage.getAll<SyncQueueItem>(storage.STORES.SYNC_QUEUE)
  },

  async getPendingCount(): Promise<number> {
    const queue = await this.getPendingQueue()
    return queue.length
  },

  async processSyncQueue(): Promise<{ syncedCount: number; errors: number }> {
    const queue = await this.getPendingQueue()
    let syncedCount = 0
    let errors = 0

    for (const item of queue) {
      try {
        if (item.type === 'comment') {
          // Process comment sync
          await CommentService.markCommentSynced(item.payload.id)
        }
        // Remove item from queue
        await storage.delete(storage.STORES.SYNC_QUEUE, item.id)
        syncedCount++
      } catch (err) {
        console.error('Error processing sync item:', item, err)
        errors++
      }
    }

    return { syncedCount, errors }
  },

  async clearQueue(): Promise<void> {
    await storage.clearStore(storage.STORES.SYNC_QUEUE)
  },
}
