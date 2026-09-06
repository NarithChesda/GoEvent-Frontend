<template>
  <div>
    <label :for="inputId" class="mb-2 block text-sm font-medium text-slate-700">
      {{ label }}<span v-if="required"> *</span>
    </label>

    <!-- Chosen: the account, not the search that found it. Searching again is a
         deliberate act, because clearing this on a credit code is what drops
         the account lock on credits somebody paid for. -->
    <div
      v-if="selected"
      class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
      :class="disabled ? 'opacity-60' : ''"
    >
      <span
        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700"
        aria-hidden="true"
      >
        {{ initial }}
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-medium text-slate-900">{{ selectedName }}</span>
        <span class="block truncate text-xs text-slate-500">{{ selected.email }}</span>
      </span>
      <button
        v-if="!disabled"
        type="button"
        class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        :aria-label="t('admin.partnerPicker.clear')"
        @click="clear"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <template v-else>
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          :id="inputId"
          v-model="query"
          type="search"
          autocomplete="off"
          :disabled="disabled"
          :placeholder="t('admin.partnerPicker.placeholder')"
          class="w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-base focus:outline-none focus:ring-2 disabled:bg-slate-50 sm:text-sm"
          :class="
            errorText
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'
          "
        />
      </div>

      <div v-if="searching" class="mt-2 space-y-2">
        <div v-for="n in 2" :key="n" class="h-12 animate-pulse rounded-xl bg-slate-100" />
      </div>

      <ul
        v-else-if="results.length"
        class="list-group mt-2 max-h-60 overflow-y-auto"
        :aria-label="t('admin.partnerPicker.results')"
      >
        <li v-for="user in results" :key="user.id">
          <button type="button" class="list-row" @click="choose(user)">
            <span class="list-row__text min-w-0 flex-1">
              <span class="list-row__label truncate">{{ displayName(user) }}</span>
              <span class="list-row__hint truncate">{{ user.email }}</span>
            </span>
            <span
              v-if="!user.is_partner"
              class="flex-shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700"
            >
              {{ t('admin.partnerPicker.notPartner') }}
            </span>
          </button>
        </li>
      </ul>

      <p v-else-if="query.trim().length >= MIN_QUERY" class="mt-2 text-xs text-slate-500">
        {{ t('admin.partnerPicker.noMatches') }}
      </p>
      <p v-else class="mt-1.5 text-xs text-slate-500">{{ hint || t('admin.partnerPicker.hint') }}</p>
    </template>

    <p v-if="errorText" class="mt-1 text-xs text-red-600">{{ errorText }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * The account a partner-credit code belongs to.
 *
 * A search rather than a select: `/api/admin/users/` is paginated at twenty
 * with no override, and the account list is every account on the platform — a
 * dropdown of it is not a control, it is a scroll. The API's own `?search=`
 * over email, username, name and phone is what staff would use anyway, since
 * what they have in front of them is an email address from a support
 * conversation.
 *
 * **Non-partners are shown, and marked.** Filtering to `is_partner: true` would
 * hide the account staff are actually looking for in the ordinary case where
 * the flag has not been granted yet, and give no hint that it existed. The
 * server accepts any user here; the badge is what says the flag still needs
 * setting on the users screen.
 *
 * `owner_partner` is not decoration on a credit code — with no owner, anyone
 * holding the string can spend it, which is why the API answers `400`. The
 * disabled state exists for the opposite case: on a code minted by a credit
 * pack order, changing the owner is refused, because those credits were bought
 * by that partner.
 */
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, X } from 'lucide-vue-next'
import { adminService } from '@/services/api'
import type { AdminUserRow } from '@/services/api'

/** Below this, the search would return most of the platform. */
const MIN_QUERY = 2
const SEARCH_DEBOUNCE_MS = 300

const props = withDefaults(
  defineProps<{
    /** The chosen account's id, or null. */
    modelValue: number | null
    /** The row for that id, when the parent already has it — avoids a lookup. */
    selected: AdminUserRow | { id: number; email: string; full_name?: string } | null
    label: string
    required?: boolean
    /** Locked by the server: a code issued by a credit pack order. */
    disabled?: boolean
    hint?: string
    errorText?: string | null
  }>(),
  { required: false, disabled: false, hint: '', errorText: null },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'update:selected': [value: AdminUserRow | null]
}>()

const { t } = useI18n()
const inputId = useId()

const query = ref('')
const results = ref<AdminUserRow[]>([])
const searching = ref(false)

const displayName = (user: { full_name?: string; first_name?: string; last_name?: string; username?: string; email: string }): string =>
  user.full_name?.trim() ||
  [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
  user.username ||
  user.email

const selectedName = computed(() => (props.selected ? displayName(props.selected) : ''))
const initial = computed(() => (selectedName.value.trim()[0] ?? '?').toUpperCase())

/** Only the newest search may write to `results`; typing fires several. */
let requestToken = 0
let timer: ReturnType<typeof setTimeout> | undefined

const runSearch = async (term: string): Promise<void> => {
  const token = ++requestToken
  searching.value = true

  const response = await adminService.listUsers({ search: term, ordering: '-date_joined' })
  if (token !== requestToken) return

  results.value = response.success && response.data ? response.data.results : []
  searching.value = false
}

watch(query, (value) => {
  clearTimeout(timer)
  const term = value.trim()
  if (term.length < MIN_QUERY) {
    results.value = []
    searching.value = false
    requestToken += 1
    return
  }
  timer = setTimeout(() => void runSearch(term), SEARCH_DEBOUNCE_MS)
})

const choose = (user: AdminUserRow): void => {
  emit('update:modelValue', user.id)
  emit('update:selected', user)
  query.value = ''
  results.value = []
}

const clear = (): void => {
  emit('update:modelValue', null)
  emit('update:selected', null)
}
</script>

<style scoped src="@/components/common/groupedList.css"></style>
