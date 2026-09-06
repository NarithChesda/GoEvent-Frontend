<template>
  <CheckoutDrawer
    :open="open"
    :title="detail?.full_name?.trim() || detail?.email || t('admin.users.drawerTitle')"
    :eyebrow="detail ? detail.email : t('admin.users.eyebrow')"
    @close="requestClose"
  >
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 4" :key="n" class="h-14 animate-pulse rounded-xl bg-slate-100" />
    </div>

    <p
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      role="alert"
    >
      {{ error }}
    </p>

    <template v-else-if="detail">
      <AdminFacts :facts="facts" />

      <!-- The three flags, and only those three. `is_staff` is shown as a fact
           above and is deliberately not a control: holding it is what grants
           access to this entire dashboard, so granting it stays a superuser act
           in Django admin. The API answers 400 if we send it. -->
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {{ t('admin.users.flagsTitle') }}
        </p>
        <div class="list-group">
          <button
            v-for="flag in FLAGS"
            :key="flag"
            type="button"
            role="switch"
            :aria-checked="draft[flag]"
            class="list-row"
            @click="draft[flag] = !draft[flag]"
          >
            <span class="list-row__text">
              <span class="list-row__label">{{ t(`admin.users.flags.${flag}.label`) }}</span>
              <span class="list-row__hint">{{ t(`admin.users.flags.${flag}.hint`) }}</span>
            </span>
            <span aria-hidden="true" class="switch-track" :class="draft[flag] ? 'is-on' : ''">
              <span class="switch-knob" />
            </span>
          </button>
        </div>
      </div>

      <div>
        <label for="adminFlagNote" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.users.noteLabel') }}
        </label>
        <textarea
          id="adminFlagNote"
          v-model="note"
          rows="2"
          maxlength="2000"
          :placeholder="t('admin.users.notePlaceholder')"
          class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base leading-relaxed focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
        ></textarea>
      </div>

      <!-- What this account has already been through here. Read-only, like the
           log it comes from. -->
      <div v-if="actions.length">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {{ t('admin.users.historyTitle') }}
        </p>
        <ul class="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          <li v-for="action in actions" :key="action.id" class="px-3 py-2.5">
            <p class="text-sm text-slate-700">
              <span class="font-medium">{{ action.action_display }}</span>
              · {{ action.target_label || action.target_type_display }}
            </p>
            <p class="mt-0.5 text-xs text-slate-500">
              {{ action.actor_email }} · {{ formatDateTime(action.created_at) }}
            </p>
          </li>
        </ul>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center gap-2 pb-1">
        <button
          type="button"
          :disabled="!detail || saving || !isDirty"
          class="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
          @click="save"
        >
          <Loader v-if="saving" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ saving ? t('admin.users.saving') : t('admin.users.save') }}
        </button>
        <button
          type="button"
          :disabled="saving"
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
 * One account: what it is, the three flags staff may change, and what has
 * already been done to it here.
 *
 * **There is no `PATCH` on users.** Names, emails and passwords are not
 * editable through this API by design, so this drawer is a flag panel and a
 * record — not a user editor. `is_staff` appears as a fact and never as a
 * control: it is the key to this whole dashboard, and granting it stays a
 * superuser act in Django admin. Sending it is a `400`.
 *
 * A no-op save answers `200` with an empty `changed` and writes no audit row.
 * That is reported as "no change" rather than as success — the save button
 * being disabled until something is actually different means it should not
 * normally be reachable, but two admins on one account can make it so.
 */
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader } from 'lucide-vue-next'
import CheckoutDrawer from '@/components/payment/CheckoutDrawer.vue'
import AdminFacts from './AdminFacts.vue'
import { formatDateTime, type AdminFact } from './adminDisplay'
import { adminService } from '@/services/api'
import type { AdminActionRow, AdminUserDetail, AdminUserFlagsPayload } from '@/services/api'
import { useToast } from '@/composables/useToast'

/** The only three the API accepts. Anything else — `is_staff` included — is a 400. */
const FLAGS = ['is_partner', 'is_verified', 'is_active'] as const
type AdminFlag = (typeof FLAGS)[number]

const props = defineProps<{
  open: boolean
  userId: number | null
}>()

const emit = defineEmits<{
  close: []
  /** A flag actually changed, so the list behind this drawer is now stale. */
  updated: [user: AdminUserDetail]
}>()

const { t } = useI18n()
const { showSuccess, showInfo, showError } = useToast()

const detail = ref<AdminUserDetail | null>(null)
const actions = ref<AdminActionRow[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const note = ref('')

const draft = reactive<Record<AdminFlag, boolean>>({
  is_partner: false,
  is_verified: false,
  is_active: false,
})

const isDirty = computed(
  () => Boolean(detail.value) && FLAGS.some((flag) => draft[flag] !== detail.value![flag]),
)

const facts = computed<AdminFact[]>(() => {
  const user = detail.value
  if (!user) return []
  return [
    { label: t('admin.users.email'), value: user.email, strong: true },
    { label: t('admin.users.username'), value: user.username },
    { label: t('admin.users.phone'), value: user.phone_number },
    { label: t('admin.users.telegram'), value: user.telegram_link },
    { label: t('admin.users.events'), value: user.events_count },
    { label: t('admin.users.payments'), value: user.payments_count },
    { label: t('admin.users.confirmedPayments'), value: user.confirmed_payments_count },
    { label: t('admin.users.joined'), value: formatDateTime(user.date_joined) },
    {
      label: t('admin.users.lastLogin'),
      value: user.last_login ? formatDateTime(user.last_login) : t('admin.users.never'),
    },
    { label: t('admin.users.staff'), value: user.is_staff ? t('admin.yes') : null },
  ]
})

const hydrate = (user: AdminUserDetail): void => {
  detail.value = user
  FLAGS.forEach((flag) => {
    draft[flag] = user[flag]
  })
}

const load = async (id: number): Promise<void> => {
  loading.value = true
  error.value = null
  note.value = ''
  actions.value = []

  const [userResponse, actionsResponse] = await Promise.all([
    adminService.getUser(id),
    adminService.listUserActions(id),
  ])

  if (userResponse.success && userResponse.data) {
    hydrate(userResponse.data)
  } else {
    detail.value = null
    error.value = userResponse.message ?? t('admin.states.errorTitle')
  }

  // The history is context, not the point of the drawer — a failure to load it
  // leaves the flags perfectly usable, so it does not become the error state.
  if (actionsResponse.success && actionsResponse.data) {
    actions.value = actionsResponse.data.results
  }

  loading.value = false
}

const save = async (): Promise<void> => {
  if (!detail.value || saving.value) return
  saving.value = true

  const payload: AdminUserFlagsPayload = {
    is_partner: draft.is_partner,
    is_verified: draft.is_verified,
    is_active: draft.is_active,
    note: note.value.trim() || undefined,
  }

  const response = await adminService.setUserFlags(detail.value.id, payload)

  if (response.success && response.data) {
    const result = response.data
    hydrate(result.item)
    if (result.changed.length === 0) {
      showInfo(t('admin.users.noChange'))
    } else {
      showSuccess(result.message || t('admin.users.saved'))
      emit('updated', result.item)
      emit('close')
    }
  } else {
    showError(response.message ?? t('admin.users.saveFailed'))
  }

  saving.value = false
}

const requestClose = (): void => {
  if (saving.value) return
  emit('close')
}

watch(
  () => [props.open, props.userId] as const,
  ([isOpen, id]) => {
    if (isOpen && id) void load(id)
  },
  { immediate: true },
)
</script>

<style scoped src="@/components/common/groupedList.css"></style>
