<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="show"
        class="fixed bottom-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[580px] lg:w-[640px] md:max-w-[calc(100vw-32px)] max-h-[85vh] md:max-h-none bg-white rounded-t-3xl md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="$emit('close')"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-semibold text-white">Invite Collaborator</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="p-4 space-y-5 pb-24">
            <!-- Info Card -->
            <div class="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-slate-600">
              <UserPlus class="w-4 h-4 inline-block mr-1.5 text-sky-600" />
              Invite team members to help manage your event. They'll receive an email invitation.
            </div>

            <!-- Email Input -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="collaboratorEmail" class="block text-sm font-medium text-slate-700">
                  Email Address <span class="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  @click="askAdminHelp"
                  class="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <LifeBuoy class="w-3 h-3" />
                  Ask Admin Help
                </button>
              </div>
              <input
                id="collaboratorEmail"
                ref="emailInput"
                v-model="localEmail"
                type="email"
                required
                @blur="validateEmail"
                :aria-invalid="!!emailError"
                placeholder="collaborator@example.com"
                :class="[
                  'w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200',
                  emailError
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-emerald-300'
                ]"
              />
              <p v-if="emailError" class="mt-1.5 text-xs text-red-600 flex items-center">
                <AlertCircle class="w-3 h-3 mr-1" />
                {{ emailError }}
              </p>
            </div>

            <!-- Role Selection -->
            <div>
              <label for="collaboratorRole" class="block text-sm font-medium text-slate-700 mb-2">
                Role <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <select
                  id="collaboratorRole"
                  v-model="localRole"
                  class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-emerald-300 transition-all duration-200 appearance-none bg-white pr-10"
                >
                  <option value="viewer">Viewer - Read-only access</option>
                  <option value="editor">Editor - Can edit event details</option>
                  <option value="admin">Admin - Full permissions</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <!-- Message -->
            <div>
              <label for="collaboratorMessage" class="block text-sm font-medium text-slate-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                id="collaboratorMessage"
                v-model="localMessage"
                rows="3"
                class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-emerald-300 transition-all duration-200 resize-none"
                placeholder="Add a personal message to your invitation..."
              ></textarea>
              <p class="text-xs text-slate-400 mt-1">{{ localMessage.length }}/500 characters</p>
            </div>
          </div>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!canSubmit || isInviting"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                v-if="isInviting"
                class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
              ></span>
              <Send v-else class="w-4 h-4" />
              <span>{{ isInviting ? 'Sending...' : 'Send Invitation' }}</span>
            </button>

            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
              :disabled="isInviting"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { UserPlus, ArrowRight, AlertCircle, ChevronDown, Send, LifeBuoy } from 'lucide-vue-next'
import { inputValidator } from '@/utils/inputValidation'

// Props
const props = defineProps<{
  show: boolean
  isInviting: boolean
  eventTitle?: string
}>()

// Emits
const emit = defineEmits<{
  'close': []
  'invite': [data: { email: string; role: 'admin' | 'editor' | 'viewer'; message?: string }]
}>()

// Local state
const localEmail = ref('')
const localRole = ref<'admin' | 'editor' | 'viewer'>('editor')
const localMessage = ref('')
const emailError = ref<string | null>(null)
const emailInput = ref<HTMLInputElement | null>(null)

// Computed
const canSubmit = computed(() => {
  return localEmail.value.trim() && !emailError.value
})

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for show changes
watch(() => props.show, (newVal) => {
  if (newVal) {
    // Reset form
    localEmail.value = ''
    localRole.value = 'editor'
    localMessage.value = ''
    emailError.value = null
    // Lock body scroll when drawer opens
    const scrollbarWidth = getScrollbarWidth()
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    // Focus email input after drawer opens
    nextTick(() => {
      emailInput.value?.focus()
    })
  } else {
    // Restore body scroll when drawer closes
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
})

// Methods
const validateEmail = () => {
  if (!localEmail.value) {
    emailError.value = null
    return
  }

  const validation = inputValidator.validateEmail(localEmail.value)
  emailError.value = validation.isValid ? null : validation.errors[0]
}

const askAdminHelp = () => {
  localEmail.value = 'admin@goevent.com'
  localRole.value = 'admin'
  localMessage.value = props.eventTitle
    ? `${props.eventTitle} asks admin for help`
    : 'Event asks admin for help'
  emailError.value = null
}

const handleSubmit = () => {
  // Validate email
  validateEmail()
  if (emailError.value || !localEmail.value.trim()) {
    return
  }

  // Check message length
  if (localMessage.value.length > 500) {
    return
  }

  emit('invite', {
    email: localEmail.value.trim(),
    role: localRole.value,
    message: localMessage.value.trim() || undefined,
  })
}
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
