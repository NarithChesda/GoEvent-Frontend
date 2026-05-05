<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
        @click="handleClose"
      />
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center w-full md:w-auto z-[71]"
        @click.self="handleClose"
      >
        <div
          class="relative w-full md:max-w-md bg-white md:rounded-3xl shadow-2xl overflow-hidden rounded-t-3xl md:rounded-b-3xl"
          @click.stop
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h2 class="text-base font-semibold text-slate-900">
              {{ t('events.tickets.order.refund.title') }}
            </h2>
            <button
              type="button"
              class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
              :aria-label="t('events.tickets.order.refund.cancel')"
              @click="handleClose"
            >
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div class="p-4 space-y-3">
            <p class="text-sm text-slate-600">
              {{ t('events.tickets.order.refund.subtitle') }}
            </p>

            <textarea
              v-model="reason"
              rows="4"
              maxlength="1000"
              :placeholder="t('events.tickets.order.refund.reasonPlaceholder')"
              class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-y"
              :class="fieldError ? 'border-red-300' : 'border-slate-300'"
            />
            <p v-if="fieldError" class="text-xs text-red-600">{{ fieldError }}</p>

            <div v-if="errorMessage" class="rounded-lg bg-red-50 border border-red-200 p-3">
              <p class="text-sm text-red-800">{{ errorMessage }}</p>
            </div>
          </div>

          <div class="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              :disabled="isSubmitting"
              @click="handleClose"
            >
              {{ t('events.tickets.order.refund.cancel') }}
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg"
              :disabled="isSubmitting"
              @click="submit"
            >
              {{ isSubmitting ? t('events.tickets.order.refund.submitting') : t('events.tickets.order.refund.submit') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  show: boolean
  isSubmitting: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  submit: [reason: string]
}>()

const { t } = useAppLanguage()

const reason = ref('')
const fieldError = ref('')
const errorMessage = ref('')

watch(
  () => props.show,
  (open) => {
    if (open) {
      reason.value = ''
      fieldError.value = ''
      errorMessage.value = ''
    }
  },
)

const handleClose = () => {
  if (props.isSubmitting) return
  emit('close')
}

const submit = () => {
  fieldError.value = ''
  const cleaned = reason.value.trim()
  if (cleaned.length < 5) {
    fieldError.value = t('events.tickets.order.refund.reasonRequired')
    return
  }
  emit('submit', cleaned)
}

const setErrorMessage = (msg: string) => {
  errorMessage.value = msg
}

defineExpose({ setErrorMessage })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
  }
  .slide-up-enter-from,
  .slide-up-leave-to {
    opacity: 0;
    transform: scale(0.92) translateY(0);
  }
}
</style>
