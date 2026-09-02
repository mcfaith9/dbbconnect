<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  MessageSquare,
  FileText,
  Clock,
  ArrowRight,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import DocumentPreviewModal from '@/components/modals/DocumentPreviewModal.vue'
import { CommentService } from '@/services/CommentService'
import { DocumentService } from '@/services/DocumentService'
import type { DocumentComment, Document } from '@/types'

const allComments = ref<DocumentComment[]>([])
const allDocsMap = ref<Map<string, Document>>(new Map())
const activeDocument = ref<Document | null>(null)
const isPreviewModalOpen = ref(false)

const loadComments = async () => {
  const comments = await CommentService.getAllComments()
  allComments.value = comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const docs = await DocumentService.getAllDocuments()
  allDocsMap.value = new Map(docs.map((d) => [d.id, d]))
}

onMounted(loadComments)

const openDocument = (docId: string) => {
  const doc = allDocsMap.value.get(docId)
  if (doc) {
    activeDocument.value = doc
    isPreviewModalOpen.value = true
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-5 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare class="size-6 text-primary" />
            Field Discussions &amp; Updates
          </h1>
          <Badge variant="secondary">
            {{ allComments.length }} comments
          </Badge>
        </div>
        <p class="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Real-time and offline synchronized comments across all field blueprints and documents.
        </p>
      </div>
    </div>

    <!-- Comments Stream Feed -->
    <div v-if="allComments.length > 0" class="space-y-3">
      <Card
        v-for="comment in allComments"
        :key="comment.id"
        class="shadow-2xs hover:border-primary/50 transition-colors"
      >
        <CardContent class="p-4 sm:p-5 space-y-3">
          <!-- Author & Document Meta Header -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <Avatar class="size-9 border">
                <AvatarFallback class="bg-primary/10 text-primary font-bold text-xs">
                  {{ comment.authorName.split(' ').map((n) => n[0]).join('') }}
                </AvatarFallback>
              </Avatar>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sm text-foreground">{{ comment.authorName }}</span>
                  <Badge v-if="comment.authorRole === 'admin'" variant="secondary" class="text-[9px] px-1.5 py-0">
                    Admin
                  </Badge>
                  <Badge v-if="comment.isOfflinePending" variant="warning" class="text-[9px] px-1.5 py-0 gap-1">
                    <Clock class="size-2.5" /> Pending Sync
                  </Badge>
                </div>
                <span class="text-[11px] text-muted-foreground">
                  {{ new Date(comment.createdAt).toLocaleString() }}
                </span>
              </div>
            </div>

            <!-- Target Document Badge Button -->
            <Button
              v-if="allDocsMap.get(comment.documentId)"
              variant="outline"
              size="sm"
              class="h-7 text-xs gap-1.5 max-w-[200px] truncate"
              @click="openDocument(comment.documentId)"
            >
              <FileText class="size-3 text-primary shrink-0" />
              <span class="truncate">{{ allDocsMap.get(comment.documentId)?.name }}</span>
              <ArrowRight class="size-3 shrink-0" />
            </Button>
          </div>

          <!-- Comment Body -->
          <div class="pl-12 text-sm text-foreground/90 leading-relaxed whitespace-pre-line bg-muted/20 p-3 rounded-lg border">
            {{ comment.content }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-else class="p-12 text-center border-dashed">
      <div class="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
        <MessageSquare class="size-6" />
      </div>
      <h3 class="font-semibold text-base">No discussions yet</h3>
      <p class="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
        Leave questions, notes, or field instructions on any document in your workspace.
      </p>
    </Card>

    <!-- Document Preview Modal -->
    <DocumentPreviewModal
      :is-open="isPreviewModalOpen"
      :document="activeDocument"
      @close="isPreviewModalOpen = false"
    />
  </div>
</template>
