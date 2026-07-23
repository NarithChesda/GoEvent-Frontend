<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-[1000] overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-md" @click.stop>
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 class="text-base font-semibold text-slate-900">
                  {{ t('management.showcasePreview.editors.eventDateTitle') }}
                </h3>
                <p class="text-xs sm:text-sm text-slate-500 mt-1">
                  {{ t('management.showcasePreview.editors.eventDateDescription') }}
                </p>
              </div>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                :aria-label="t('management.showcasePreview.editors.cancel')"
                @click="close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <input
              ref="dateInputRef"
              v-model="input"
              type="date"
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
            />

            <div class="flex items-center gap-2 sm:gap-3 mt-5">
              <button
                type="button"
                class="flex-1 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="saving || !input"
                @click="save"
              >
                {{ saving ? t('management.showcasePreview.editors.saving') : t('management.showcasePreview.editors.save') }}
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                @click="close"
              >
                {{ t('management.showcasePreview.editors.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { eventsService, type Event } from '@/services/api'

interface Props {
  modelValue: boolean
  eventId: string
  /** Current event start/end (ISO) — read fresh each time the modal opens. */
  startDate?: string | null
  endDate?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [event: Event]
}>()

const { t } = useAppLanguage()

const input = ref('')
const saving = ref(false)
const dateInputRef = ref<HTMLInputElement | null>(null)

// Same "slice the ISO string as if local" convention EventEditDrawer uses for
// its datetime-local inputs — start_date is re-parsed with `new Date(...)` on
// save, so the round trip is consistent even though it ignores true UTC offset.
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    input.value = props.startDate ? props.startDate.slice(0, 10) : ''
    await nextTick()
    dateInputRef.value?.focus()
  },
)

const close = () => emit('update:modelValue', false)

const save = async () => {
  if (!input.value || !props.startDate) return
  saving.value = true
  try {
    const oldTime = props.startDate.slice(11, 16) || '00:00'
    const newStart = new Date(`${input.value}T${oldTime}`)

    let newEndIso: string | null = null
    if (props.endDate) {
      const oldStart = new Date(props.startDate.slice(0, 16))
      const oldEnd = new Date(props.endDate.slice(0, 16))
      const duration = oldEnd.getTime() - oldStart.getTime()
      newEndIso = (duration > 0 ? new Date(newStart.getTime() + duration) : oldEnd).toISOString()
    }

    const response = await eventsService.patchEvent(props.eventId, {
      start_date: newStart.toISOString(),
      ...(newEndIso ? { end_date: newEndIso } : {}),
    })
    if (response.success && response.data) {
      emit('saved', response.data)
      close()
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div:last-child > div,
.modal-leave-active > div:last-child > div {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child > div,
.modal-leave-to > div:last-child > div {
  transform: scale(0.95);
}
</style>
