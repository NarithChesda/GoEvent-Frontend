<template>
  <div class="mb-8">
    <h2 
      class="text-xl font-semibold mb-4 text-center" 
      :style="{ 
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }"
    >
      Comments & Wishes
    </h2>
    
    <!-- Comment Form -->
    <div class="mb-4 p-4 rounded-xl bg-black/30 backdrop-blur-sm border border-white/20">
      <form @submit.prevent="submitComment">
        <!-- Guest Name Input (if not provided) -->
        <div v-if="!guestName" class="mb-3">
          <input
            v-model="newComment.guestName"
            type="text"
            placeholder="Your name"
            maxlength="50"
            class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/40 text-white placeholder-white/80 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            :style="{ '--tw-ring-color': primaryColor + '60' }"
            required
          />
        </div>

        <!-- Comment Textarea -->
        <div class="mb-3">
          <textarea
            v-model="newComment.message"
            placeholder="Share your thoughts, wishes, or congratulations..."
            rows="3"
            maxlength="500"
            class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/40 text-white placeholder-white/80 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
            :style="{ '--tw-ring-color': primaryColor + '60' }"
            required
          />
          <div class="text-xs text-right mt-1" :style="{ color: primaryColor, opacity: '0.9' }">
            {{ newComment.message.length }}/500
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isSubmittingComment || !newComment.message.trim()"
          class="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          :style="{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`
          }"
        >
          {{ isSubmittingComment ? 'Posting...' : 'Post Comment' }}
        </button>
      </form>
    </div>

    <!-- Comments List -->
    <div class="relative">
      <div 
        ref="commentsContainer"
        class="h-[26rem] overflow-y-auto space-y-3 comments-scrollbar"
        @scroll="handleScroll"
      >
        <!-- Loading State -->
        <div v-if="loadingComments" class="text-center py-8">
          <div class="inline-flex items-center gap-2 text-white">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm">Loading comments...</span>
          </div>
        </div>

        <!-- No Comments State -->
        <div v-else-if="comments.length === 0" class="text-center py-8">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-white/20">
            <MessageCircle class="w-6 h-6 text-white/80" />
          </div>
          <p class="text-sm text-white/80">
            Be the first to leave a comment!
          </p>
        </div>

        <!-- Comments -->
        <div v-else>
          <div 
            v-for="comment in comments" 
            :key="comment.id"
            class="p-4 rounded-xl bg-black/30 backdrop-blur-sm border border-white/20 mb-3 last:mb-0"
          >
            <!-- Comment Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div 
                  class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                  :style="{ backgroundColor: primaryColor }"
                >
                  {{ comment.guest_name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-medium text-white">
                    {{ comment.guest_name }}
                  </p>
                  <p class="text-xs text-white/70">
                    {{ formatCommentDate(comment.created_at) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Comment Message -->
            <p class="text-sm text-white leading-relaxed">
              {{ comment.message }}
            </p>
          </div>

          <!-- Loading More Indicator -->
          <div v-if="loadingMoreComments" class="text-center py-4 mt-2">
            <div class="inline-flex items-center gap-2 text-white/70">
              <div class="w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-xs">Loading more comments...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Comment Section Endline -->
    <div class="flex justify-center mt-6">
      <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { MessageCircle } from 'lucide-vue-next'

interface Comment {
  id: number
  event_id: string
  guest_name: string
  message: string
  created_at: string
}

interface Props {
  eventId: string
  guestName?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  commentSubmitted: [Comment]
}>()

// Comment form state
const newComment = ref({
  guestName: props.guestName || '',
  message: ''
})

// Comments state
const comments = ref<Comment[]>([])
const loadingComments = ref(false)
const isSubmittingComment = ref(false)
const loadingMoreComments = ref(false)
const totalComments = ref(0)
const currentPage = ref(1)
const commentsPerPage = 5
const commentsContainer = ref<HTMLElement | null>(null)
const hasMoreComments = ref(true)

// Computed
const canLoadMore = computed(() => hasMoreComments.value && !loadingMoreComments.value)

// Methods
const formatCommentDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes} min ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
      } else {
        return date.toLocaleDateString()
      }
    }
  } catch (error) {
    return 'Recently'
  }
}

const submitComment = async () => {
  if (!newComment.value.message.trim()) return

  isSubmittingComment.value = true
  
  try {
    // Mock API call - in real implementation, this would call the API
    const mockComment: Comment = {
      id: Date.now(),
      event_id: props.eventId,
      guest_name: newComment.value.guestName || props.guestName || 'Anonymous',
      message: newComment.value.message.trim(),
      created_at: new Date().toISOString()
    }

    // Add to beginning of comments array
    comments.value.unshift(mockComment)
    totalComments.value++
    
    // Reset form
    newComment.value.message = ''
    if (!props.guestName) {
      newComment.value.guestName = ''
    }

    emit('commentSubmitted', mockComment)

    // In real implementation, you would call the API here:
    // await commentsService.createComment(props.eventId, {
    //   guest_name: newComment.value.guestName || props.guestName,
    //   message: newComment.value.message
    // })

  } catch (error) {
    console.error('Failed to submit comment:', error)
    // In real implementation, show error message
  } finally {
    isSubmittingComment.value = false
  }
}

const loadComments = async () => {
  loadingComments.value = true
  
  try {
    // Mock API call - in real implementation, this would call the API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock comments data
    const mockComments: Comment[] = [
      {
        id: 1,
        event_id: props.eventId,
        guest_name: 'Sarah Johnson',
        message: 'Congratulations! Wishing you both a lifetime of happiness and love. Can\'t wait to celebrate with you! 💕',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: 2,
        event_id: props.eventId,
        guest_name: 'Michael Chen',
        message: 'So excited for your special day! You two are perfect for each other. See you there! 🎉',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
      },
      {
        id: 3,
        event_id: props.eventId,
        guest_name: 'Emily Rodriguez',
        message: 'What a beautiful invitation! Looking forward to celebrating this amazing milestone with you both.',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ]
    
    comments.value = mockComments
    totalComments.value = 8 // Mock total count

    // In real implementation:
    // const response = await commentsService.getComments(props.eventId, { page: 1, limit: commentsPerPage })
    // comments.value = response.data
    // totalComments.value = response.total


  } catch (error) {
    console.error('Failed to load comments:', error)
  } finally {
    loadingComments.value = false
  }
}

const loadMoreComments = async () => {
  if (!canLoadMore.value) return
  
  loadingMoreComments.value = true
  currentPage.value++
  
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock additional comments with more variety
    const additionalComments: Comment[] = [
      {
        id: Date.now() + 1,
        event_id: props.eventId,
        guest_name: 'David Wilson',
        message: 'Congratulations to the happy couple! Wishing you endless joy and beautiful memories. May your love story continue to inspire everyone around you.',
        created_at: new Date(Date.now() - (currentPage.value * 24 * 60 * 60 * 1000)).toISOString()
      },
      {
        id: Date.now() + 2,
        event_id: props.eventId,
        guest_name: 'Lisa Thompson',
        message: 'So happy for you both! Can\'t wait to dance the night away at your celebration! The venue looks absolutely stunning in the photos. 💃✨',
        created_at: new Date(Date.now() - (currentPage.value * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)).toISOString()
      },
      {
        id: Date.now() + 3,
        event_id: props.eventId,
        guest_name: 'James Rodriguez',
        message: 'What an amazing couple! Your love shines through every photo. Looking forward to celebrating this special milestone with you both!',
        created_at: new Date(Date.now() - (currentPage.value * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)).toISOString()
      }
    ]
    
    // Simulate reaching end of comments after a few loads
    if (currentPage.value >= 4) {
      hasMoreComments.value = false
    }
    
    comments.value.push(...additionalComments)
    totalComments.value += additionalComments.length


  } catch (error) {
    console.error('Failed to load more comments:', error)
  } finally {
    loadingMoreComments.value = false
  }
}

// Handle infinite scroll
const handleScroll = () => {
  if (!commentsContainer.value) return
  
  // Only trigger load more if we can load more
  if (canLoadMore.value) {
    const container = commentsContainer.value
    const scrollPosition = container.scrollTop + container.clientHeight
    const scrollHeight = container.scrollHeight
    
    // Load more when user is within 100px of bottom
    if (scrollPosition >= scrollHeight - 100) {
      loadMoreComments()
    }
  }
}

// Lifecycle
onMounted(async () => {
  await loadComments()
  // Ensure container is scrollable if there's not much content
  await nextTick()
  if (commentsContainer.value) {
    // Add scroll listener regardless of initial comment count
    commentsContainer.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (commentsContainer.value) {
    commentsContainer.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
/* Focus ring color */
input:focus,
textarea:focus {
  --tw-ring-opacity: 0.5;
  box-shadow: 0 0 0 2px rgba(var(--tw-ring-color), var(--tw-ring-opacity));
}

/* Hidden scrollbar for comments container */
.comments-scrollbar::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.comments-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.comments-scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
}

.comments-scrollbar::-webkit-scrollbar-thumb:hover {
  background: transparent;
}

/* For Firefox - hide scrollbar */
.comments-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Custom scrollbar for textarea */
textarea::-webkit-scrollbar {
  width: 4px;
}

textarea::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 2px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.6);
}
</style>