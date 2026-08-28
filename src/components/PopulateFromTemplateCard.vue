<template>
  <!--
    Icon variant: the trigger alone, for hosts that already have a toolbar to
    put it in (the Design Studio's mobile bar). The card's heading and sentence
    are not lost — the confirm dialog below, which this button can never bypass,
    says the same thing before anything is written, and it is the only screen
    where the wording actually matters.
  -->
  <template v-if="visible && variant === 'icon'">
    <button
      type="button"
      class="populate-icon-btn"
      :disabled="loading"
      :title="t('management.media.populate.label')"
      :aria-label="t('management.media.populate.label')"
      @click="handlePopulateClick"
    >
      <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
      <Wand2 v-else class="w-4 h-4" />
    </button>

    <!-- Absolutely positioned so a result never changes the toolbar's height:
         this bar is sticky chrome, and a line appearing inside it would shove
         the whole page down for the few seconds the message is up. -->
    <Transition name="fade">
      <div
        v-if="message"
        class="populate-icon-msg"
        :class="message.type === 'success' ? 'is-success' : 'is-error'"
        role="status"
      >
        {{ message.text }}
      </div>
    </Transition>
  </template>

  <div v-else-if="visible" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
    <div class="flex items-start gap-3">
      <span
        class="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center flex-shrink-0"
        aria-hidden="true"
      >
        <Wand2 class="w-4 h-4 text-[#2ecc71]" />
      </span>
      <div class="min-w-0 flex-1">
        <h5 class="font-semibold text-slate-900">{{ t('management.media.populate.label') }}</h5>
        <p class="text-sm text-slate-600">{{ t('management.media.populate.description') }}</p>
      </div>
    </div>

    <button
      type="button"
      @click="handlePopulateClick"
      :disabled="loading"
      class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] text-sm font-semibold text-white bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-lg shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
      <Wand2 v-else class="w-4 h-4" />
      {{ loading ? t('management.media.populate.loading') : t('management.media.populate.btn') }}
    </button>

    <Transition name="fade">
      <div
        v-if="message"
        :class="
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        "
        class="mt-3 text-xs px-3 py-2 rounded-lg border"
      >
        {{ message.text }}
      </div>
    </Transition>
  </div>

  <!-- Confirm dialog. Populating always goes through here — it writes real
       content into the event, so a single stray tap on the card's button must
       never be enough to do it. When the event already has content the same
       dialog escalates: the choice becomes skip-vs-overwrite rather than a
       plain yes, since overwrite genuinely destroys what's there. -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="dialog" class="fixed inset-0 z-[1000] overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="closeDialog" />
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-4 sm:p-6 space-y-4" @click.stop>
            <div class="flex items-start gap-3">
              <div
                v-if="hasExistingData"
                class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <AlertTriangle class="w-6 h-6 text-amber-600" />
              </div>
              <div
                v-else
                class="w-12 h-12 rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center flex-shrink-0"
              >
                <Wand2 class="w-6 h-6 text-[#2ecc71]" />
              </div>

              <!-- Event already has content: name exactly what's at stake. -->
              <div v-if="hasExistingData" class="min-w-0">
                <h3 class="font-semibold text-slate-900">{{ t('management.media.populate.dialog.title') }}</h3>
                <p class="text-sm text-slate-600 mt-1">
                  {{ t('management.media.populate.dialog.contains') }}
                </p>
                <ul class="text-sm text-slate-700 mt-2 space-y-0.5">
                  <li v-if="dialog.existing_data.texts">
                    {{ t('management.media.populate.dialog.texts') }}
                    <strong>{{ dialog.existing_data.texts }}</strong>
                  </li>
                  <li v-if="dialog.existing_data.hosts">
                    {{ t('management.media.populate.dialog.hosts') }}
                    <strong>{{ dialog.existing_data.hosts }}</strong>
                  </li>
                  <li v-if="dialog.existing_data.agenda">
                    {{ t('management.media.populate.dialog.agendaItems') }}
                    <strong>{{ dialog.existing_data.agenda }}</strong>
                  </li>
                </ul>
                <p class="text-sm text-slate-600 mt-3">{{ t('management.media.populate.dialog.howToProceed') }}</p>
              </div>

              <!-- Empty event: nothing to lose, so a plain confirm. -->
              <div v-else class="min-w-0">
                <h3 class="font-semibold text-slate-900">{{ t('management.media.populate.confirm.title') }}</h3>
                <p class="text-sm text-slate-600 mt-1">
                  {{ t('management.media.populate.confirm.body', { category: dialog.category }) }}
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-2 pt-2">
              <template v-if="hasExistingData">
                <button
                  type="button"
                  @click="runPopulate('skip')"
                  :disabled="loading"
                  class="w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ t('management.media.populate.dialog.skipExisting') }}
                </button>
                <button
                  type="button"
                  @click="runPopulate('overwrite')"
                  :disabled="loading"
                  class="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ t('management.media.populate.dialog.overwriteAll') }}
                </button>
              </template>
              <button
                v-else
                type="button"
                @click="runPopulate('skip')"
                :disabled="loading"
                class="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-xl shadow-md hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ t('management.media.populate.confirm.action') }}
              </button>
              <button
                type="button"
                @click="closeDialog"
                class="w-full px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200"
              >
                {{ t('common.actions.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Auto-fill the showcase content (texts, hosts, agenda) from the event
 * category's template. Lives at the top of the Showcase tab's content stack —
 * right above the very sections it fills — rather than on the Overview tab,
 * which only *summarizes* that content.
 */
import { ref, computed, onUnmounted } from 'vue'
import { Wand2, Loader2, AlertTriangle } from 'lucide-vue-next'
import { eventsService, type Event } from '../services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  event?: Event
  canEdit: boolean
  /**
   * `card` — the standalone card at the top of the content stack (default).
   * `icon` — the trigger only, for a host toolbar that supplies its own
   * surface and sizing (it reads `--studio-control-h` for its dimensions).
   */
  variant?: 'card' | 'icon'
}

const props = withDefaults(defineProps<Props>(), { variant: 'card' })

const emit = defineEmits<{
  /** Content was created — the sections below need to refetch. */
  (e: 'populated'): void
}>()

const { t } = useAppLanguage()

type PopulateCheckData = {
  category: string
  template_available: boolean
  existing_data: { texts: number; hosts: number; agenda: number; has_data: boolean }
}

const loading = ref(false)
const dialog = ref<PopulateCheckData | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Stays available for as long as the user can edit — including after a
// successful run. Populating isn't a one-time onboarding step: people re-run it
// to restart from the template after experimenting, or to fill gaps left by a
// skip-mode run. The confirm dialog, not hiding the button, is what protects
// the event's data.
const visible = computed(() => props.canEdit && !!props.event)

// Drives the dialog's two shapes: a plain confirm when there's nothing to lose,
// and the skip-vs-overwrite choice when the event already has content.
const hasExistingData = computed(() => !!dialog.value?.existing_data.has_data)

let messageTimer: ReturnType<typeof setTimeout> | null = null

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') dialog.value = null
}

const openDialog = (check: PopulateCheckData) => {
  dialog.value = check
  document.addEventListener('keydown', onKeydown)
}

const closeDialog = () => {
  dialog.value = null
  document.removeEventListener('keydown', onKeydown)
}

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (messageTimer) clearTimeout(messageTimer)
})

const handlePopulateClick = async () => {
  if (!props.event) return
  loading.value = true
  message.value = null
  try {
    const response = await eventsService.checkPopulateTemplate(props.event.id)
    if (!response.success || !response.data) {
      message.value = { type: 'error', text: response.message || t('management.media.populate.errorCheck') }
      return
    }
    const check = response.data
    if (!check.template_available) {
      message.value = {
        type: 'error',
        text: t('management.media.populate.errorNoTemplate', { category: check.category }),
      }
      return
    }
    // Never runs straight off the click — the dialog is the only path in.
    openDialog(check)
  } catch {
    message.value = { type: 'error', text: t('management.media.populate.errorCheck') }
  } finally {
    loading.value = false
  }
}

const runPopulate = async (mode: 'skip' | 'overwrite') => {
  if (!props.event) return
  loading.value = true
  closeDialog()
  try {
    const response = await eventsService.populateTemplate(props.event.id, mode)
    if (!response.success || !response.data) {
      message.value = { type: 'error', text: response.message || t('management.media.populate.errorGeneric') }
      return
    }
    const { texts, hosts, agenda } = response.data.results
    const total = texts.created + hosts.created + agenda.created
    message.value = {
      type: 'success',
      text: t('management.media.populate.success', {
        total,
        texts: texts.created,
        hosts: hosts.created,
        agenda: agenda.created,
      }),
    }
    emit('populated')
    // Clear the result line once it's been read; the card itself stays put so
    // the action can be repeated.
    if (messageTimer) clearTimeout(messageTimer)
    messageTimer = setTimeout(() => {
      message.value = null
    }, 5000)
  } catch {
    message.value = { type: 'error', text: t('management.media.populate.errorGeneric') }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Icon variant. Sized off the host toolbar's shared control height so it lines
   up exactly with the Preview and Templates buttons beside it, and painted in
   the same glass as Preview — auto-fill and preview are both secondary tools
   next to Templates, so they should look like siblings. */
.populate-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--studio-control-h, 2.75rem);
  height: var(--studio-control-h, 2.75rem);
  color: rgb(51 65 85);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 9999px;
  transition:
    transform 0.16s cubic-bezier(0.23, 1, 0.32, 1),
    background-color 0.16s ease;
}

.populate-icon-btn:active {
  transform: scale(0.97);
  background: rgba(255, 255, 255, 0.95);
}

.populate-icon-btn:disabled {
  opacity: 0.5;
}

.populate-icon-msg {
  position: absolute;
  top: calc(100% + 0.375rem);
  left: 1rem;
  right: 1rem;
  z-index: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.5rem;
  border: 1px solid;
  box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.12);
}

.populate-icon-msg.is-success {
  color: rgb(4 108 78);
  background: rgb(236 253 245);
  border-color: rgb(167 243 208);
}

.populate-icon-msg.is-error {
  color: rgb(185 28 28);
  background: rgb(254 242 242);
  border-color: rgb(254 202 202);
}

@media (prefers-reduced-motion: reduce) {
  .populate-icon-btn {
    transition: none;
  }

  .populate-icon-btn:active {
    transform: none;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
