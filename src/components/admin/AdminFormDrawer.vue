<template>
  <CheckoutDrawer :open="open" :title="title" :eyebrow="eyebrow" @close="requestClose">
    <slot />

    <p
      v-if="formError"
      class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {{ formError }}
    </p>

    <!--
      Delete lives at the foot of the form, not in the header, and it is not the
      drawer's close button in disguise. §10 puts item-delete in the header for
      the event drawers; here the thing that has to be read before pressing it
      is the usage count, which is content — so the control sits with it.
    -->
    <div v-if="editing && deletable" class="border-t border-slate-200 pt-4">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ t('admin.catalogue.dangerTitle') }}
      </p>
      <p class="mt-1.5 text-sm text-slate-600">{{ deleteWarning }}</p>
      <button
        type="button"
        :disabled="busy"
        class="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="emit('delete')"
      >
        <Trash2 class="h-4 w-4" aria-hidden="true" />
        {{ deleteLabel ?? t('admin.catalogue.delete') }}
      </button>
    </div>

    <template #footer>
      <div class="flex items-center gap-2 pb-1">
        <button
          type="button"
          :disabled="busy"
          class="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
          @click="emit('submit')"
        >
          <Loader v-if="busy" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ busy ? t('admin.catalogue.saving') : (submitLabel ?? t('admin.catalogue.save')) }}
        </button>
        <button
          type="button"
          :disabled="busy"
          class="min-h-[44px] rounded-xl px-4 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 disabled:opacity-50"
          @click="requestClose"
        >
          {{ t('common.actions.cancel') }}
        </button>
      </div>
    </template>
  </CheckoutDrawer>
</template>

<script setup lang="ts">
/**
 * The create/edit shell every managed catalogue pours its form into.
 *
 * Same panel as the review drawer, deliberately — a staff member who has
 * learned one has learned both — but a different footer, because this one saves
 * rather than decides. Where the review drawer has approve and reject, this has
 * save and cancel, and the destructive action is inside the body next to the
 * usage count that argues against pressing it.
 *
 * The form itself is a slot: six catalogues share these verbs and share almost
 * no fields, and a declarative field-schema would be a form builder standing
 * between the developer and six short templates.
 */
import { useI18n } from 'vue-i18n'
import { Loader, Trash2 } from 'lucide-vue-next'
import CheckoutDrawer from '@/components/payment/CheckoutDrawer.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    eyebrow?: string | null
    /** Editing an existing row rather than creating one — gates delete. */
    editing?: boolean
    deletable?: boolean
    /** What would be orphaned. Rendered above the delete button. */
    deleteWarning?: string
    deleteLabel?: string | null
    submitLabel?: string | null
    busy?: boolean
    /** A non-field complaint from the server, above the footer. */
    formError?: string | null
  }>(),
  {
    eyebrow: null,
    editing: false,
    deletable: true,
    deleteWarning: '',
    deleteLabel: null,
    submitLabel: null,
    busy: false,
    formError: null,
  },
)

const emit = defineEmits<{ close: []; submit: []; delete: [] }>()

const { t } = useI18n()

/** A save in flight is not a safe thing to abandon. */
const requestClose = (): void => {
  if (props.busy) return
  emit('close')
}
</script>
