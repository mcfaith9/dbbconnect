import { ref, computed, onMounted, onUnmounted } from 'vue'
import { SyncService } from '@/services/SyncService'
import { ActivityService } from '@/services/ActivityService'
import { useAuth } from './useAuth'

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const isSimulatedOffline = ref(false)
const isSyncing = ref(false)
const lastSyncedAt = ref<Date | null>(new Date())
const pendingCount = ref(0)
const syncMessage = ref<string | null>(null)

export function useOfflineSync() {
  const { currentUser } = useAuth()

  const effectiveOnline = computed(() => {
    return isOnline.value && !isSimulatedOffline.value
  })

  async function updatePendingCount() {
    try {
      pendingCount.value = await SyncService.getPendingCount()
    } catch {
      pendingCount.value = 0
    }
  }

  async function triggerSync(): Promise<{ syncedCount: number; errors: number }> {
    if (!effectiveOnline.value) {
      syncMessage.value = 'Cannot sync while offline.'
      setTimeout(() => (syncMessage.value = null), 3000)
      return { syncedCount: 0, errors: 0 }
    }

    isSyncing.value = true
    syncMessage.value = 'Synchronizing field data & comments...'

    try {
      const result = await SyncService.processSyncQueue()
      lastSyncedAt.value = new Date()
      await updatePendingCount()

      if (currentUser.value) {
        await ActivityService.logActivity({
          user: currentUser.value,
          type: 'offline_sync',
          actionTitle: 'PWA Data Synchronized',
          description: `Synchronized ${result.syncedCount} queued actions.`,
          targetName: 'Offline Sync Queue',
        })
      }

      syncMessage.value = `✓ Synchronized ${result.syncedCount} items successfully.`
      setTimeout(() => (syncMessage.value = null), 3000)
      return result
    } catch (err) {
      syncMessage.value = 'Sync failed. Will retry automatically.'
      setTimeout(() => (syncMessage.value = null), 4000)
      return { syncedCount: 0, errors: 1 }
    } finally {
      isSyncing.value = false
    }
  }

  function toggleSimulatedOffline() {
    isSimulatedOffline.value = !isSimulatedOffline.value
    if (effectiveOnline.value) {
      triggerSync()
    }
  }

  const lastSyncedFormatted = computed(() => {
    if (!lastSyncedAt.value) return 'Never'
    return lastSyncedAt.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })

  const handleOnlineEvent = () => {
    isOnline.value = true
    if (!isSimulatedOffline.value) {
      triggerSync()
    }
  }

  const handleOfflineEvent = () => {
    isOnline.value = false
  }

  onMounted(() => {
    window.addEventListener('online', handleOnlineEvent)
    window.addEventListener('offline', handleOfflineEvent)
    updatePendingCount()
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnlineEvent)
    window.removeEventListener('offline', handleOfflineEvent)
  })

  return {
    isOnline,
    isSimulatedOffline,
    effectiveOnline,
    isSyncing,
    lastSyncedAt,
    lastSyncedFormatted,
    pendingCount,
    syncMessage,
    updatePendingCount,
    triggerSync,
    toggleSimulatedOffline,
  }
}
