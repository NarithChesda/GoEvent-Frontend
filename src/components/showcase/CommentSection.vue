<template>
  <div id="comment-section" class="mb-8">
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
      <!-- Sign In Prompt for Unauthenticated Users -->
      <div v-if="!isUserAuthenticated" class="text-center py-4">
        <p class="text-sm mb-3" :style="{ color: 'white', opacity: 0.8 }">
          Please sign in to leave a comment
        </p>
        <button
          @click="handleSignInClick"
          class="w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-all hover:scale-[1.02]"
          :style="{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`
          }"
        >
          Sign In to Comment
        </button>
      </div>

      <!-- Already Commented Message -->
      <div v-else-if="hasAlreadyCommented" class="text-center py-4">
        <p class="text-sm mb-2" :style="{ color: 'white', opacity: 0.8 }">
          You have already left a comment for this event
        </p>
        <p class="text-xs" :style="{ color: primaryColor, opacity: 0.7 }">
          Each user can only comment once per event
        </p>
      </div>

      <!-- Comment Form for Authenticated Users -->
      <form v-else @submit.prevent="submitComment">
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
            class="p-4 rounded-xl backdrop-blur-sm mb-3 last:mb-0"
            :class="[
              isUserCommentOwner(comment) 
                ? 'bg-black/40 border-2' 
                : 'bg-black/30 border border-white/20'
            ]"
            :style="isUserCommentOwner(comment) ? { 
              borderColor: primaryColor + '60'
            } : {}"
          >
            <!-- Comment Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <!-- User Avatar -->
                <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center relative">
                  <img 
                    v-if="getCommentAvatarUrl(comment) && !isAvatarError(comment.id)" 
                    :src="getCommentAvatarUrl(comment)!" 
                    :alt="getCommentDisplayName(comment)"
                    class="w-full h-full object-cover"
                    @error="() => setAvatarError(comment.id)"
                  />
                  <div 
                    v-else
                    class="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                    :style="{ backgroundColor: primaryColor }"
                  >
                    {{ getCommentInitial(comment) }}
                  </div>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-white">
                      {{ getCommentDisplayName(comment) }}
                    </p>
                    <span 
                      v-if="isUserCommentOwner(comment)"
                      class="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      :style="{ backgroundColor: primaryColor + '80' }"
                    >
                      You
                    </span>
                  </div>
                  <p class="text-xs text-white/70">
                    {{ formatCommentDate(comment.created_at) }}
                  </p>
                </div>
              </div>
              
              <!-- Action Buttons (only for comment owner) -->
              <div v-if="isUserCommentOwner(comment)" class="flex items-center gap-1">
                <button
                  @click="startEditComment(comment)"
                  class="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all"
                  title="Edit comment"
                >
                  <Edit class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="deleteComment(comment.id)"
                  class="p-1.5 rounded-lg bg-black/20 hover:bg-red-600/80 text-white/70 hover:text-white transition-all"
                  title="Delete comment"
                  :disabled="isDeletingComment === comment.id"
                >
                  <Trash2 v-if="isDeletingComment !== comment.id" class="w-3.5 h-3.5" />
                  <div v-else class="w-3.5 h-3.5 border border-white/50 border-t-white rounded-full animate-spin"></div>
                </button>
              </div>
            </div>

            <!-- Comment Message (Read Mode) -->
            <p v-if="editingCommentId !== comment.id" class="text-sm text-white leading-relaxed">
              {{ comment.comment_text }}
            </p>
            
            <!-- Comment Message (Edit Mode) -->
            <div v-else class="space-y-3">
              <textarea
                v-model="editCommentText"
                class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/40 text-white placeholder-white/80 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                :style="{ '--tw-ring-color': primaryColor + '60' }"
                rows="3"
                maxlength="500"
                placeholder="Edit your comment..."
              />
              <div class="flex items-center justify-between">
                <div class="text-xs" :style="{ color: primaryColor, opacity: '0.7' }">
                  {{ editCommentText.length }}/500
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="cancelEditComment"
                    class="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
                    :disabled="isUpdatingComment"
                  >
                    Cancel
                  </button>
                  <button
                    @click="updateComment(comment.id)"
                    :disabled="isUpdatingComment || !editCommentText.trim() || editCommentText === comment.comment_text"
                    class="px-3 py-1.5 text-xs rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    :style="{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`
                    }"
                  >
                    <span v-if="!isUpdatingComment">Save</span>
                    <span v-else class="flex items-center gap-1">
                      <div class="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  </button>
                </div>
              </div>
            </div>
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

    <!-- Error Message -->
    <div v-if="errorMessage" class="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-500/40">
      <p class="text-sm text-red-300">{{ errorMessage }}</p>
    </div>
    
    <!-- Comment Section Endline -->
    <div class="flex justify-center mt-6">
      <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { MessageCircle, Edit, Trash2 } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { commentsService, type EventComment, apiService } from '../../services/api'

interface Props {
  eventId: string
  guestName?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  commentSubmitted: [EventComment]
}>()

// Router and Auth
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Comment form state
const newComment = ref({
  guestName: props.guestName || '',
  message: ''
})

// Comments state
const comments = ref<EventComment[]>([])
const loadingComments = ref(false)
const isSubmittingComment = ref(false)
const loadingMoreComments = ref(false)
const totalComments = ref(0)
const currentPage = ref(1)
const commentsPerPage = 20 // Match API default
const commentsContainer = ref<HTMLElement | null>(null)
const hasMoreComments = ref(true)
const errorMessage = ref('')
const hasAlreadyCommented = ref(false)

// Edit/Delete state
const editingCommentId = ref<number | null>(null)
const editCommentText = ref('')
const isUpdatingComment = ref(false)
const isDeletingComment = ref<number | null>(null)

// Avatar error tracking
const avatarErrors = ref<Set<number>>(new Set())

// Computed
const canLoadMore = computed(() => hasMoreComments.value && !loadingMoreComments.value)

// Helper function to process comments (simplified since backend now provides user_info)
const processComments = (comments: EventComment[]): EventComment[] => {
  const processedComments = comments.map(comment => {
    // Backend now provides user_info, so we just return the comment as is
    // If for some reason user_info is missing, we can add minimal fallback
    if (!comment.user_info) {
      comment.user_info = {
        id: comment.user,
        username: `user_${comment.user}`,
        first_name: '',
        last_name: '',
        profile_picture: ''
      }
    }
    return comment
  })
  
  // Sort comments to show user's own comment at the top
  return sortCommentsWithUserFirst(processedComments)
}

// Helper function to sort comments with user's own comment at the top
const sortCommentsWithUserFirst = (comments: EventComment[]): EventComment[] => {
  if (!authStore.isAuthenticated || !authStore.user) {
    return comments
  }
  
  const currentUserId = authStore.user.id
  const userComment = comments.find(comment => comment.user === currentUserId)
  const otherComments = comments.filter(comment => comment.user !== currentUserId)
  
  // If user has a comment, put it first, otherwise return original order
  if (userComment) {
    return [userComment, ...otherComments]
  }
  
  return comments
}

const isUserAuthenticated = computed(() => {
  return authStore.isAuthenticated
})

// Methods
const handleSignInClick = () => {
  // Store the current route with hash for comment section
  const currentPath = route.fullPath + '#comment-section'
  
  // Navigate to sign-in with redirect parameter
  router.push({
    path: '/signin',
    query: { 
      redirect: currentPath,
      scrollTo: 'comment-section' // Extra parameter to ensure we scroll to comments
    }
  })
}

const getCommentDisplayName = (comment: EventComment): string => {
  // If this is the current user's comment and we have auth store data, use it
  if (authStore.isAuthenticated && authStore.user && comment.user === authStore.user.id) {
    if (authStore.user.first_name && authStore.user.last_name) {
      return `${authStore.user.first_name} ${authStore.user.last_name}`
    }
    if (authStore.user.username) {
      return authStore.user.username
    }
  }
  
  // Use user_info from the API response (updated backend)
  if (comment.user_info?.first_name && comment.user_info?.last_name) {
    return `${comment.user_info.first_name} ${comment.user_info.last_name}`
  }
  
  if (comment.user_info?.username) {
    return comment.user_info.username
  }
  
  // Fallback for cases where user_info is missing
  return `Guest User ${comment.user}`
}

const getCommentInitial = (comment: EventComment): string => {
  const displayName = getCommentDisplayName(comment)
  return displayName.charAt(0).toUpperCase()
}

const getCommentAvatarUrl = (comment: EventComment): string | null => {
  // If this is the current user's comment, try to use auth store profile picture
  if (authStore.isAuthenticated && authStore.user && comment.user === authStore.user.id) {
    if (authStore.user.profile_picture) {
      return apiService.getProfilePictureUrl(authStore.user.profile_picture)
    }
  }
  
  // Use user_info profile picture if available (backend now provides full URLs)
  if (comment.user_info?.profile_picture) {
    return comment.user_info.profile_picture
  }
  
  return null
}

const isAvatarError = (commentId: number): boolean => {
  return avatarErrors.value.has(commentId)
}

const setAvatarError = (commentId: number) => {
  avatarErrors.value.add(commentId)
}

const isUserCommentOwner = (comment: EventComment): boolean => {
  if (!authStore.isAuthenticated || !authStore.user) return false
  return comment.user === authStore.user.id
}

const startEditComment = (comment: EventComment) => {
  editingCommentId.value = comment.id
  editCommentText.value = comment.comment_text
  errorMessage.value = ''
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editCommentText.value = ''
  errorMessage.value = ''
}

const updateComment = async (commentId: number) => {
  if (!editCommentText.value.trim()) return

  isUpdatingComment.value = true
  errorMessage.value = ''

  try {
    const response = await commentsService.updateComment(commentId, editCommentText.value.trim())

    if (response.success && response.data) {
      // Update the comment in the local array
      const commentIndex = comments.value.findIndex(c => c.id === commentId)
      if (commentIndex !== -1) {
        comments.value[commentIndex] = {
          ...comments.value[commentIndex],
          ...response.data
        }
      }
      
      // Exit edit mode
      cancelEditComment()
    } else {
      errorMessage.value = response.message || 'Failed to update comment. Please try again.'
    }
  } catch (error) {
    console.error('Failed to update comment:', error)
    errorMessage.value = 'An error occurred while updating your comment. Please try again.'
  } finally {
    isUpdatingComment.value = false
  }
}

const deleteComment = async (commentId: number) => {
  if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
    return
  }

  isDeletingComment.value = commentId
  errorMessage.value = ''

  try {
    const response = await commentsService.deleteComment(commentId)

    if (response.success) {
      // Remove comment from local array
      comments.value = comments.value.filter(c => c.id !== commentId)
      totalComments.value--
      
      // Reset already commented state if this was the user's comment
      if (authStore.isAuthenticated) {
        hasAlreadyCommented.value = false
      }
    } else {
      errorMessage.value = response.message || 'Failed to delete comment. Please try again.'
    }
  } catch (error) {
    console.error('Failed to delete comment:', error)
    errorMessage.value = 'An error occurred while deleting your comment. Please try again.'
  } finally {
    isDeletingComment.value = null
  }
}

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
  
  // Double-check authentication
  if (!authStore.isAuthenticated) {
    handleSignInClick()
    return
  }

  // Check if user has already commented (API constraint: one comment per user per event)
  if (hasAlreadyCommented.value) {
    errorMessage.value = 'You have already commented on this event.'
    setTimeout(() => { errorMessage.value = '' }, 5000)
    return
  }

  isSubmittingComment.value = true
  errorMessage.value = ''
  
  try {
    // Call the actual API
    const response = await commentsService.createComment(
      props.eventId,
      newComment.value.message.trim()
    )

    if (response.success && response.data) {
      // Add user info to the comment for display (if not provided by backend)
      const commentWithUserInfo: EventComment = {
        ...response.data,
        user_info: response.data.user_info || {
          id: authStore.user?.id || response.data.user,
          username: authStore.user?.username || '',
          first_name: authStore.user?.first_name || '',
          last_name: authStore.user?.last_name || '',
          profile_picture: authStore.user?.profile_picture || ''
        }
      }
      
      // Since user can only comment once per event, just add to beginning
      // The backend constraint ensures there won't be duplicates
      comments.value.unshift(commentWithUserInfo)
      totalComments.value++
      hasAlreadyCommented.value = true
      
      // Reset form
      newComment.value.message = ''
      
      emit('commentSubmitted', commentWithUserInfo)
    } else {
      // Handle API errors
      if (response.message?.includes('unique')) {
        errorMessage.value = 'You have already commented on this event.'
        hasAlreadyCommented.value = true
      } else {
        errorMessage.value = response.message || 'Failed to post comment. Please try again.'
      }
    }
  } catch (error) {
    console.error('Failed to submit comment:', error)
    errorMessage.value = 'An error occurred while posting your comment. Please try again.'
  } finally {
    isSubmittingComment.value = false
  }
}

const loadComments = async () => {
  loadingComments.value = true
  errorMessage.value = ''
  // Clear avatar errors when loading fresh comments
  avatarErrors.value.clear()
  
  try {
    // Load comments from API
    const response = await commentsService.getEventComments(
      props.eventId,
      1,
      commentsPerPage
    )
    
    if (response.success && response.data) {
      // Process comments (backend now provides user_info directly)
      comments.value = processComments(response.data.results)
      
      totalComments.value = response.data.count
      hasMoreComments.value = response.data.next !== null
      currentPage.value = 1
      
      // Check if current user has already commented
      if (authStore.isAuthenticated) {
        hasAlreadyCommented.value = await commentsService.hasUserCommented(props.eventId)
      }
    } else {
      comments.value = []
      totalComments.value = 0
      hasMoreComments.value = false
    }
  } catch (error) {
    console.error('Failed to load comments:', error)
    comments.value = []
    totalComments.value = 0
    hasMoreComments.value = false
  } finally {
    loadingComments.value = false
  }
}

const loadMoreComments = async () => {
  if (!canLoadMore.value) return
  
  loadingMoreComments.value = true
  const nextPage = currentPage.value + 1
  
  try {
    // Load more comments from API
    const response = await commentsService.getEventComments(
      props.eventId,
      nextPage,
      commentsPerPage
    )
    
    if (response.success && response.data) {
      // Process new comments (backend now provides user_info directly)  
      const processedNewComments = response.data.results.map(comment => {
        // Backend now provides user_info, so we just return the comment as is
        // If for some reason user_info is missing, we can add minimal fallback
        if (!comment.user_info) {
          comment.user_info = {
            id: comment.user,
            username: `user_${comment.user}`,
            first_name: '',
            last_name: '',
            profile_picture: ''
          }
        }
        return comment
      })
      
      // For pagination, we don't want to re-sort everything, just append
      // But we need to make sure user's comment stays at the top if it exists
      const currentUserId = authStore.user?.id
      if (currentUserId) {
        // Check if any of the new comments belongs to current user
        const userCommentFromNewPage = processedNewComments.find(comment => comment.user === currentUserId)
        const otherNewComments = processedNewComments.filter(comment => comment.user !== currentUserId)
        
        if (userCommentFromNewPage) {
          // Remove user's comment from existing comments if it exists there
          const existingCommentsWithoutUser = comments.value.filter(comment => comment.user !== currentUserId)
          // Put user comment at the top, then existing comments, then other new comments
          comments.value = [userCommentFromNewPage, ...existingCommentsWithoutUser, ...otherNewComments]
        } else {
          // No user comment in new batch, just append normally
          comments.value.push(...processedNewComments)
        }
      } else {
        // User not authenticated, just append normally
        comments.value.push(...processedNewComments)
      }
      
      hasMoreComments.value = response.data.next !== null
      currentPage.value = nextPage
    } else {
      hasMoreComments.value = false
    }
  } catch (error) {
    console.error('Failed to load more comments:', error)
    hasMoreComments.value = false
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

// Watchers
watch(() => authStore.isAuthenticated, async (isAuth, wasAuth) => {
  if (isAuth && !wasAuth) {
    // User just logged in, check if they have already commented
    hasAlreadyCommented.value = await commentsService.hasUserCommented(props.eventId)
    
    // Reload comments to get proper sorting with user's comment at top
    await loadComments()
    
    // Check if we should scroll to comment section (after login redirect)
    checkForCommentRedirect()
  } else if (!isAuth) {
    // User logged out, reset comment state
    hasAlreadyCommented.value = false
    newComment.value.message = ''
    errorMessage.value = ''
    
    // Cancel any ongoing edit
    cancelEditComment()
  }
})

// Function to scroll to comment section
const scrollToCommentSection = () => {
  const commentSection = document.getElementById('comment-section')
  if (commentSection) {
    commentSection.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center'
    })
    
    // Add a gentle highlight animation using the event's primary color
    commentSection.style.boxShadow = `0 0 20px ${props.primaryColor}40`
    commentSection.style.transition = 'box-shadow 0.5s ease-out'
    
    // Remove the highlight after animation
    setTimeout(() => {
      commentSection.style.boxShadow = 'none'
    }, 2000)
  }
}

// Check if user should be redirected to comment section after login
const checkForCommentRedirect = () => {
  const hash = window.location.hash
  const queryParams = new URLSearchParams(window.location.search)
  
  if (hash === '#comment-section' || queryParams.get('scrollTo') === 'comment-section') {
    // Small delay to ensure DOM is ready and comments are loaded
    setTimeout(() => {
      scrollToCommentSection()
      // Remove the hash and scrollTo parameter from URL after scrolling
      const url = new URL(window.location.href)
      url.hash = ''
      url.searchParams.delete('scrollTo')
      window.history.replaceState(null, '', url.toString())
    }, 200)
  }
}

// Lifecycle
onMounted(async () => {
  await loadComments()
  // Check if user should be redirected to comment section (after login)
  checkForCommentRedirect()
  
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