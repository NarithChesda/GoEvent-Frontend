<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-[1000] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" @click="closeModal"></div>

        <div class="flex min-h-full items-center justify-center p-4" @click.self="closeModal">
          <!-- Over a dark backdrop the card's glass would read grey, so raise its opacity -->
          <div class="relative w-full max-w-[26rem]" style="--auth-card-alpha: 0.96">
            <SignInCard
              dismissible
              hide-google-on-mobile
              @close="closeModal"
              @authenticated="handleAuthenticated"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * AuthModal
 *
 * Modal shell around [SignInCard.vue](src/components/auth/SignInCard.vue) — the
 * same card the /signin page renders, so both stay in sync. Used wherever a
 * guest action needs an account (showcase RSVP, comments, …).
 */
import { onMounted, onUnmounted } from 'vue'
import SignInCard, { type SignInMethod } from './auth/SignInCard.vue'
import { isMessagingAppBrowser } from '../utils/browserDetection'

interface Props {
  isVisible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  authenticated: []
}>()

const closeModal = () => {
  emit('close')
}

const handleAuthenticated = (method: SignInMethod) => {
  // Coming back from Telegram's in-app browser, the page state is stale —
  // reload so the authenticated session is picked up everywhere.
  if (method === 'telegram-bot' && isMessagingAppBrowser()) {
    window.location.reload()
    return
  }

  emit('authenticated')
  closeModal()
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isVisible) {
    closeModal()
  }
}

onMounted(() => document.addEventListener('keydown', handleEscapeKey))
onUnmounted(() => document.removeEventListener('keydown', handleEscapeKey))
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
