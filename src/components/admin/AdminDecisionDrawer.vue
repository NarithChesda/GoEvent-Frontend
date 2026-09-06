<template>
  <CheckoutDrawer :open="open" :title="title" :eyebrow="eyebrow" @close="requestClose">
    <!-- Decided: the code, the confirmation, whatever the queue needs the admin
         to read *after* the fact. Only credit orders have one, and it is the
         reason this state exists at all — the minted code is not recoverable
         from anywhere else in this UI. -->
    <template v-if="result">
      <div
        class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
        role="status"
        aria-live="polite"
      >
        <div class="flex items-start gap-3">
          <CircleCheck class="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" aria-hidden="true" />
          <p class="text-sm font-medium text-emerald-800">{{ result }}</p>
        </div>
      </div>
      <slot name="result" />
    </template>

    <template v-else>
      <slot />

      <!-- Already decided. The row still opens — an admin has to be able to see
           what a colleague did — but there is nothing left to press. -->
      <div
        v-if="!decidable"
        class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        <Lock class="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
        <p class="text-sm text-slate-600">{{ t('admin.decision.alreadyDecided') }}</p>
      </div>

      <div v-else class="space-y-4">
        <div>
          <label
            for="adminDecisionNote"
            class="mb-2 block text-sm font-medium text-slate-700"
          >
            {{ t('admin.decision.noteLabel') }}
          </label>
          <textarea
            id="adminDecisionNote"
            ref="noteField"
            v-model="note"
            rows="4"
            maxlength="2000"
            :placeholder="t('admin.decision.notePlaceholder')"
            class="w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-base leading-relaxed focus:outline-none focus:ring-2 sm:text-sm"
            :class="
              noteError
                ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'
            "
            :aria-invalid="Boolean(noteError)"
            :aria-describedby="noteError ? 'adminDecisionNoteError' : 'adminDecisionNoteHint'"
          ></textarea>
          <p v-if="noteError" id="adminDecisionNoteError" class="mt-1 text-xs text-red-600">
            {{ noteError }}
          </p>
          <p v-else id="adminDecisionNoteHint" class="mt-1 text-xs text-slate-500">
            {{ t('admin.decision.noteHint') }}
          </p>
        </div>

        <!-- Anything else the decision needs. Only partner requests use it, for
             the reapplication window their reject takes. -->
        <slot name="decision-extra" />
      </div>
    </template>

    <template #footer>
      <div v-if="result" class="pb-1">
        <button
          type="button"
          class="min-h-[44px] w-full rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
          @click="emit('close')"
        >
          {{ t('admin.decision.done') }}
        </button>
      </div>

      <div v-else-if="decidable" class="flex items-center gap-2 pb-1">
        <button
          type="button"
          :disabled="busy"
          class="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
          @click="submit('approve')"
        >
          <Loader
            v-if="busy && pending === 'approve'"
            class="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
          <Check v-else class="h-4 w-4" aria-hidden="true" />
          {{ approveLabel ?? t('admin.decision.approve') }}
        </button>

        <button
          type="button"
          :disabled="busy"
          class="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
          @click="submit('reject')"
        >
          <Loader
            v-if="busy && pending === 'reject'"
            class="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
          <X v-else class="h-4 w-4" aria-hidden="true" />
          {{ t('admin.decision.reject') }}
        </button>
      </div>

      <div v-else class="pb-1">
        <button
          type="button"
          class="min-h-[44px] w-full rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-200"
          @click="emit('close')"
        >
          {{ t('common.actions.close') }}
        </button>
      </div>
    </template>
  </CheckoutDrawer>
</template>

<script setup lang="ts">
/**
 * The one review drawer, for all six queues.
 *
 * Every decision goes through here rather than through a button on a list row,
 * which is the API docs' own interaction rule and the right one: the evidence a
 * decision rests on — a payment proof, a design preview, an application's own
 * words — does not fit on a row, and a bare row button invites deciding without
 * looking at it.
 *
 * **Both actions share one note field**, and the hint says which is which: it is
 * optional when approving and required when rejecting, because on a reject that
 * text is the *only* thing the applicant is shown. The requirement is enforced
 * here as well as server-side — letting a `400` be the first thing that says no
 * costs a round trip and puts the complaint further from the field than it
 * needs to be.
 *
 * The shell is `CheckoutDrawer`, which is the app's floating right-hand panel
 * (safe areas, scroll lock, focus, Escape) and is already used by a
 * non-checkout form for the same reason — see PartnerRequestDrawer.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, CircleCheck, Loader, Lock, X } from 'lucide-vue-next'
import CheckoutDrawer from '@/components/payment/CheckoutDrawer.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    eyebrow?: string | null
    /**
     * Whether this row can still be acted on. Derived from its status, not from
     * whether the API would accept the call — a decided row still opens, so a
     * colleague's decision can be read.
     */
    decidable?: boolean
    busy?: boolean
    /** Server complaint about the note, surfaced under the field. */
    noteFieldError?: string | null
    /** Set once a decision has landed and there is something left to read. */
    result?: string | null
    /** `approve` is a uniform verb; the queues name it differently. */
    approveLabel?: string | null
  }>(),
  { decidable: true, busy: false, noteFieldError: null, result: null, approveLabel: null },
)

const emit = defineEmits<{
  close: []
  approve: [note: string]
  reject: [note: string]
}>()

const { t } = useI18n()

const note = ref('')
const localNoteError = ref<string | null>(null)
const pending = ref<'approve' | 'reject' | null>(null)
const noteField = ref<HTMLTextAreaElement | null>(null)

/**
 * The client-side complaint wins over the server's: it is the newer of the two,
 * and it is the one the admin just triggered. A computed rather than a watched
 * ref, so a server error that is already set when the drawer opens is shown on
 * the first render instead of on the first change.
 */
const noteError = computed(() => localNoteError.value ?? props.noteFieldError ?? null)

const submit = async (action: 'approve' | 'reject'): Promise<void> => {
  if (props.busy) return

  if (action === 'reject' && !note.value.trim()) {
    localNoteError.value = t('admin.decision.reasonRequired')
    await nextTick()
    noteField.value?.focus()
    return
  }

  localNoteError.value = null
  pending.value = action
  if (action === 'approve') emit('approve', note.value)
  else emit('reject', note.value)
}

/** A decision in flight must not be interrupted — it is not a safe thing to abandon. */
const requestClose = (): void => {
  if (props.busy) return
  emit('close')
}

// Typing is the admin correcting the complaint, so the complaint goes away.
watch(note, () => {
  if (note.value.trim()) localNoteError.value = null
})

// A fresh row is a fresh decision: never carry one row's reason onto the next.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    note.value = ''
    localNoteError.value = null
    pending.value = null
  },
)
</script>
