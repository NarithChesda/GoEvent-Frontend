<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="handleClose"
      />
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center w-full md:w-auto z-[999]"
        @click.self="handleClose"
      >
        <div
          class="relative w-full md:max-w-md bg-white md:rounded-3xl shadow-2xl rounded-t-3xl md:rounded-b-3xl flex flex-col max-h-[85vh] md:max-h-[calc(100vh-100px)] overflow-hidden"
          @click.stop
        >
          <!-- Header (gradient, mirrors canonical modal header) -->
          <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
            <div class="flex items-center justify-between gap-3 px-4 py-3">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div
                  class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center flex-shrink-0"
                >
                  <RotateCcw class="w-5 h-5" />
                </div>
                <h2 class="text-sm sm:text-base font-semibold text-white leading-tight truncate">
                  {{ t('events.tickets.order.refund.title') }}
                </h2>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
                :aria-label="t('events.tickets.order.refund.cancel')"
                @click="handleClose"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
            <p class="text-sm text-slate-600">
              {{ t('events.tickets.order.refund.subtitle') }}
            </p>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                {{ t('events.tickets.order.refund.title') }}
              </label>
              <textarea
                v-model="reason"
                rows="4"
                maxlength="1000"
                :placeholder="t('events.tickets.order.refund.reasonPlaceholder')"
                class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-y"
                :class="fieldError ? 'border-red-300' : 'border-slate-300'"
              />
              <p v-if="fieldError" class="mt-1 text-xs text-red-600">{{ fieldError }}</p>
            </div>

            <div v-if="errorMessage" class="rounded-xl bg-red-50 border border-red-200 p-3">
              <p class="text-sm text-red-800">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Sticky footer -->
          <div class="flex-shrink-0 border-t border-slate-200 bg-white">
            <div class="flex flex-col-reverse sm:flex-row gap-2 px-4 py-3">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50"
                :disabled="isSubmitting"
                @click="handleClose"
              >
                {{ t('events.tickets.order.refund.cancel') }}
              </button>
              <button
                type="button"
                class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-sm transition-colors"
                :disabled="isSubmitting"
                @click="submit"
              >
                <span
                  v-if="isSubmitting"
                  class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
                />
                {{ isSubmitting ? t('events.tickets.order.refund.submitting') : t('events.tickets.order.refund.submit') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, RotateCcw } from 'lucide-vue-next'
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
