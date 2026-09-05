<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  X,
  Download,
  WifiOff,
  CheckCircle2,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Clock,
  Send,
  Users,
  HardDriveDownload,
  FileSpreadsheet,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import PdfViewer from '@/components/viewers/PdfViewer.vue'
import DocxViewer from '@/components/viewers/DocxViewer.vue'
import ImageViewer from '@/components/viewers/ImageViewer.vue'
import TextViewer from '@/components/viewers/TextViewer.vue'
import { CommentService } from '@/services/CommentService'
import { DocumentService } from '@/services/DocumentService'
import { ActivityService } from '@/services/ActivityService'
import { useAuth } from '@/composables/useAuth'
import { useOfflineSync } from '@/composables/useOfflineSync'
import type { Document, DocumentComment } from '@/types'

const props = defineProps<{
  isOpen: boolean
  document: Document | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', doc: Document): void
  (e: 'open-assign', doc: Document): void
}>()

const { currentUser, isAdmin } = useAuth()
const { effectiveOnline, updatePendingCount } = useOfflineSync()

const activeTab = ref<'preview' | 'comments'>('preview')
const comments = ref<DocumentComment[]>([])
const newCommentText = ref('')
const isPostingComment = ref(false)
const isTogglingOffline = ref(false)

const loadComments = async () => {
  if (!props.document) return
  comments.value = await CommentService.getCommentsByDocument(props.document.id)
}

watch(
  () => props.document,
  async (doc) => {
    if (doc) {
      activeTab.value = 'preview'
      await loadComments()
    }
  },
  { immediate: true },
)

const handleToggleOfflineCache = async () => {
  if (!props.document || isTogglingOffline.value) return
  isTogglingOffline.value = true

  const newStatus = !props.document.offlineCached
  const updated = await DocumentService.toggleOfflineCache(props.document.id, newStatus)

  if (updated) {
    if (currentUser.value) {
      await ActivityService.logActivity({
        user: currentUser.value,
        type: 'offline_sync',
        actionTitle: newStatus ? 'Made File Available Offline' : 'Removed from Offline Cache',
        description: `${props.document.name} ${newStatus ? 'saved to device IndexedDB storage.' : 'removed from device local storage.'}`,
        targetName: props.document.name,
        targetId: props.document.id,
      })
    }
    emit('updated', updated)
  }

  isTogglingOffline.value = false
}

const handlePostComment = async () => {
  if (!newCommentText.value.trim() || !props.document || !currentUser.value) return
  isPostingComment.value = true

  const isOffline = !effectiveOnline.value

  const newComment = await CommentService.addComment({
    documentId: props.document.id,
    user: currentUser.value,
    content: newCommentText.value.trim(),
    isOffline,
  })

  comments.value.push(newComment)
  newCommentText.value = ''

  await ActivityService.logActivity({
    user: currentUser.value,
    type: 'comment',
    actionTitle: 'Comment Added',
    description: `Commented on ${props.document.name}${isOffline ? ' (Queued Offline)' : ''}`,
    targetName: props.document.name,
    targetId: props.document.id,
  })

  await updatePendingCount()
  isPostingComment.value = false
}

const handleDownload = () => {
  if (!props.document) return
  const doc = props.document

  if (doc.downloadUrl) {
    const a = window.document.createElement('a')
    a.href = doc.downloadUrl
    a.download = doc.originalName || doc.name
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    return
  }

  if (doc.previewUrl) {
    const a = window.document.createElement('a')
    a.href = doc.previewUrl
    a.download = doc.originalName || doc.name
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    return
  }

  if (doc.dataUrl) {
    const a = window.document.createElement('a')
    a.href = doc.dataUrl
    a.download = doc.originalName || doc.name
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    return
  }

  const blob = new Blob([doc.textContent || doc.name], {
    type: doc.mimeType || 'text/plain',
  })
  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = doc.originalName || doc.name
  window.document.body.appendChild(a)
  a.click()
  window.document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div
    v-if="isOpen && document"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150"
    @click.self="emit('close')"
  >
    <div
      class="bg-card text-card-foreground border rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
    >
      <!-- Top Navigation Bar -->
      <header class="flex items-center justify-between border-b px-4 sm:px-6 py-3 bg-muted/20 shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <div class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText v-if="document.type === 'pdf'" class="size-4 text-red-500" />
            <ImageIcon v-else-if="document.type === 'image'" class="size-4 text-blue-500" />
            <FileText v-else-if="document.type === 'word'" class="size-4 text-blue-600" />
            <FileSpreadsheet v-else-if="document.type === 'excel'" class="size-4 text-emerald-600" />
            <FileText v-else class="size-4" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
                {{ document.name }}
              </h2>
              <Badge variant="outline" class="text-[10px] hidden sm:inline-flex">
                {{ document.version }}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground truncate">
              {{ document.sizeFormatted }} &bull; Uploaded by {{ document.uploadedBy.name }}
            </p>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <!-- Mobile tab switch -->
          <div class="flex md:hidden items-center gap-1 mr-1">
            <Button
              size="sm"
              :variant="activeTab === 'preview' ? 'secondary' : 'ghost'"
              class="h-7 text-xs px-2"
              @click="activeTab = 'preview'"
            >
              Preview
            </Button>
            <Button
              size="sm"
              :variant="activeTab === 'comments' ? 'secondary' : 'ghost'"
              class="h-7 text-xs px-2"
              @click="activeTab = 'comments'"
            >
              Comments ({{ comments.length }})
            </Button>
          </div>

          <!-- Offline Cache Toggle Button -->
          <Button
            size="sm"
            :variant="document.offlineCached ? 'secondary' : 'outline'"
            class="text-xs gap-1.5 h-8 font-medium"
            :class="document.offlineCached ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : ''"
            :disabled="isTogglingOffline"
            @click="handleToggleOfflineCache"
          >
            <CheckCircle2 v-if="document.offlineCached" class="size-3.5 text-emerald-500" />
            <HardDriveDownload v-else class="size-3.5" />
            <span class="hidden sm:inline">
              {{ document.offlineCached ? 'Available Offline' : 'Make Available Offline' }}
            </span>
            <span class="sm:hidden">
              {{ document.offlineCached ? 'Offline ✓' : 'Save Offline' }}
            </span>
          </Button>

          <!-- Download Button -->
          <Button
            variant="outline"
            size="sm"
            class="text-xs gap-1.5 h-8"
            title="Download document"
            @click="handleDownload"
          >
            <Download class="size-3.5" />
            <span class="hidden sm:inline">Download</span>
          </Button>

          <!-- Assign button (for admin) -->
          <Button
            v-if="isAdmin"
            variant="outline"
            size="sm"
            class="text-xs gap-1.5 h-8 hidden md:inline-flex"
            @click="emit('open-assign', document)"
          >
            <Users class="size-3.5" />
            <span>Assign</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="size-8"
            @click="emit('close')"
          >
            <X class="size-4" />
          </Button>
        </div>
      </header>

      <!-- Main Content Area: Split View on Desktop -->
      <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
        <!-- Center / Left: Document Viewer (Modular Viewers) -->
        <div
          class="flex-1 flex flex-col bg-muted/40 overflow-hidden relative"
          :class="activeTab === 'preview' ? 'flex' : 'hidden md:flex'"
        >
          <!-- PDF Viewer -->
          <PdfViewer
            v-if="document.type === 'pdf'"
            :data-url="document.dataUrl"
            :pdf-url="document.previewUrl"
            :initial-page="1"
          />

          <!-- DOCX Viewer -->
          <DocxViewer
            v-else-if="document.type === 'word'"
            :html-content="document.docxHtml"
            :text-content="document.textContent"
            :data-url="document.dataUrl"
            :document-name="document.name"
          />

          <!-- Image Viewer -->
          <ImageViewer
            v-else-if="document.type === 'image'"
            :image-url="document.previewUrl || document.downloadUrl || document.dataUrl || document.thumbnailUrl"
            :alt-text="document.name"
          />

          <!-- Text / CSV / Spreadsheet / Generic Viewer -->
          <TextViewer
            v-else
            :content="document.textContent"
            :mime-type="document.mimeType"
            :document-name="document.name"
            :data-url="document.dataUrl"
            @download="handleDownload"
          />
        </div>

        <!-- Right Side: Comments & Document Collaboration Panel -->
        <aside
          class="w-full md:w-80 lg:w-96 border-l bg-card flex flex-col shrink-0"
          :class="activeTab === 'comments' ? 'flex' : 'hidden md:flex'"
        >
          <!-- Panel Header -->
          <div class="p-4 border-b flex items-center justify-between">
            <div class="flex items-center gap-2">
              <MessageSquare class="size-4 text-primary" />
              <h3 class="font-semibold text-sm">Document Discussion</h3>
            </div>
            <Badge variant="secondary" class="text-xs">
              {{ comments.length }}
            </Badge>
          </div>

          <!-- Comments List -->
          <div class="flex-1 p-4 space-y-3.5 overflow-y-auto">
            <div v-if="comments.length === 0" class="text-center py-10 text-muted-foreground">
              <MessageSquare class="size-8 mx-auto mb-2 opacity-40" />
              <p class="text-xs">No comments on this document yet.</p>
              <p class="text-[11px] text-muted-foreground/80 mt-0.5">
                Leave field notes, questions, or updates below.
              </p>
            </div>

            <div
              v-for="comment in comments"
              :key="comment.id"
              class="space-y-1.5 p-3 rounded-lg bg-muted/40 border text-xs"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Avatar class="size-6 border">
                    <AvatarFallback class="bg-primary/10 text-primary text-[10px] font-bold">
                      {{ comment.authorName.split(' ').map((n) => n[0]).join('') }}
                    </AvatarFallback>
                  </Avatar>
                  <span class="font-medium text-foreground">{{ comment.authorName }}</span>
                  <Badge v-if="comment.authorRole === 'admin'" variant="secondary" class="text-[9px] px-1.5 py-0">
                    Admin
                  </Badge>
                </div>
                <span class="text-[10px] text-muted-foreground">
                  {{ new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>

              <p class="text-foreground/90 pl-8 leading-relaxed">
                {{ comment.content }}
              </p>

              <!-- Offline pending tag -->
              <div v-if="comment.isOfflinePending" class="pl-8 pt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                <Clock class="size-3" />
                <span>Pending Sync (Offline)</span>
              </div>
            </div>
          </div>

          <!-- New Comment Input Box -->
          <div class="p-3 border-t bg-muted/20 space-y-2">
            <div v-if="!effectiveOnline" class="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <WifiOff class="size-3" />
              <span>Offline: comment will sync when reconnected</span>
            </div>
            <div class="relative">
              <textarea
                v-model="newCommentText"
                rows="2"
                placeholder="Write a comment or field update..."
                class="w-full rounded-md border bg-background p-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                @keydown.enter.prevent="handlePostComment"
              />
              <div class="flex items-center justify-between pt-1">
                <span class="text-[10px] text-muted-foreground">Press Enter to send</span>
                <Button
                  size="sm"
                  class="h-7 text-xs gap-1"
                  :disabled="!newCommentText.trim() || isPostingComment"
                  @click="handlePostComment"
                >
                  <Send class="size-3" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
