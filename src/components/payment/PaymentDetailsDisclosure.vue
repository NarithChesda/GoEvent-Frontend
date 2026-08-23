<template>
  <div>
    <button
      type="button"
      class="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
      :aria-expanded="expanded"
      :aria-controls="`${idPrefix}-details`"
      @click="expanded = !expanded"
    >
      <span class="text-sm font-medium text-slate-700">
        {{ t('management.templatePaymentTab.paymentDrawer.additionalDetails') }}
        <span class="font-normal text-slate-400">
          ({{ t('management.templatePaymentTab.paymentDrawer.optional') }})
        </span>
      </span>
      <ChevronDown
        class="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200"
        :class="{ 'rotate-180': expanded }"
        aria-hidden="true"
      />
    </button>

    <Transition name="collapse">
      <div v-if="expanded" :id="`${idPrefix}-details`" class="grid grid-rows-[1fr]">
        <div class="min-h-0 overflow-hidden">
          <div class="space-y-3 pt-2">
            <div>
              <label :for="`${idPrefix}-reference`" :class="labelClass">
                {{ t('management.templatePaymentTab.paymentDrawer.transactionRef') }}
              </label>
              <input
                :id="`${idPrefix}-reference`"
                :value="reference"
                type="text"
                :class="fieldClass"
                :placeholder="
                  t('management.templatePaymentTab.paymentDrawer.transactionRefPlaceholder')
                "
                @input="emit('update:reference', ($event.target as HTMLInputElement).value)"
              />
            </div>

            <div v-if="showNotes">
              <label :for="`${idPrefix}-notes`" :class="labelClass">
                {{ t('management.templatePaymentTab.paymentDrawer.notes') }}
              </label>
              <textarea
                :id="`${idPrefix}-notes`"
                :value="notes"
                rows="2"
                :class="`${fieldClass} resize-none`"
                :placeholder="notesPlaceholder"
                @input="emit('update:notes', ($event.target as HTMLTextAreaElement).value)"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * Transaction reference and a note to the reviewer — the two fields nobody
 * fills in, kept out of the way of the two things everybody does.
 *
 * A bare disclosure row rather than a bordered card: it holds optional fields
 * inside a drawer that already has a summary region and a method list, and a
 * third box for the least important content inverts the drawer's own
 * hierarchy (goevent-taste §3).
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'
import { fieldClass, labelClass } from '@/components/settings/settingsFormChrome'

withDefaults(
  defineProps<{
    reference: string
    notes: string
    /** Ids are prefixed per drawer so two mounted copies don't collide. */
    idPrefix: string
    showNotes?: boolean
    notesPlaceholder?: string
  }>(),
  { showNotes: true, notesPlaceholder: '' },
)

const emit = defineEmits<{
  'update:reference': [value: string]
  'update:notes': [value: string]
}>()

const { t } = useI18n()

const expanded = ref(false)

/** A drawer resetting its form collapses this too, rather than reopening with
    the section hanging open over two fields it just emptied. */
defineExpose({
  collapse: () => {
    expanded.value = false
  },
})
</script>

<style scoped>
/* Expand/collapse via grid rows — never max-height (§15). */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
