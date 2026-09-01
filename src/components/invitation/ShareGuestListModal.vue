<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[70] overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <Link2 class="w-5 h-5" />
                  </div>
                  <div class="min-w-0">
                    <h2 class="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                      {{ t('management.shareGuestList.title') }}
                    </h2>
                    <p class="text-xs text-slate-500 mt-0.5">{{ t('management.shareGuestList.subtitle') }}</p>
                  </div>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
                  :aria-label="t('management.shareGuestList.close')"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="p-6 space-y-6 max-h-[calc(100vh-13rem)] overflow-y-auto">
              <!-- Mint a link -->
              <section class="space-y-4">
                <!--
                  Access first, and as two described choices rather than a
                  select: it is the only decision on this form that cannot be
                  undone by deleting a row afterwards, and the difference
                  between the two is worth a sentence each.
                -->
                <fieldset>
                  <legend class="text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.shareGuestList.accessLabel') }}
                  </legend>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      v-for="option in ACCESS_OPTIONS"
                      :key="option.value"
                      type="button"
                      @click="draftAccess = option.value"
                      class="text-left rounded-2xl border p-3 transition-all duration-150"
                      :class="draftAccess === option.value
                        ? 'border-transparent ring-2 ring-sky-300 bg-sky-50/60'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
                      :aria-pressed="draftAccess === option.value"
                    >
                      <span class="flex items-center gap-2">
                        <component
                          :is="option.icon"
                          class="w-4 h-4 flex-shrink-0"
                          :class="draftAccess === option.value ? 'text-sky-600' : 'text-slate-400'"
                        />
                        <span class="text-sm font-semibold text-slate-900">{{ t(option.labelKey) }}</span>
                      </span>
                      <span class="block text-xs text-slate-500 mt-1">{{ t(option.descKey) }}</span>
                    </button>
                  </div>
                </fieldset>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Label. Optional, and only worth anything once there are
                       several links; the placeholder says what it is for. -->
                  <div>
                    <label for="shareLabel" class="block text-sm font-medium text-slate-700 mb-2">
                      {{ t('management.shareGuestList.labelLabel') }}
                    </label>
                    <input
                      id="shareLabel"
                      v-model="draftLabel"
                      type="text"
                      maxlength="60"
                      :placeholder="t('management.shareGuestList.labelPlaceholder')"
                      class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label for="shareExpiry" class="block text-sm font-medium text-slate-700 mb-2">
                      {{ t('management.shareGuestList.expiryLabel') }}
                    </label>
                    <select
                      id="shareExpiry"
                      v-model="draftExpiry"
                      class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                    >
                      <option value="never">{{ t('management.shareGuestList.expiry.never') }}</option>
                      <option value="7d">{{ t('management.shareGuestList.expiry.week') }}</option>
                      <option value="30d">{{ t('management.shareGuestList.expiry.month') }}</option>
                    </select>
                  </div>
                </div>

                <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

                <button
                  type="button"
                  @click="handleCreate"
                  :disabled="creating"
                  class="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-[opacity,transform] duration-150 ease-out"
                >
                  <span
                    v-if="creating"
                    class="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"
                  ></span>
                  <Plus v-else class="w-4 h-4" />
                  {{ t('management.shareGuestList.createCta') }}
                </button>
              </section>

              <!-- Existing links -->
              <section>
                <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  {{ t('management.shareGuestList.existingHeader') }}
                </h3>

                <div v-if="loading" class="flex justify-center py-8">
                  <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>

                <p v-else-if="shares.length === 0" class="text-sm text-slate-500 py-4 text-center">
                  {{ t('management.shareGuestList.empty') }}
                </p>

                <ul v-else class="space-y-2">
                  <li
                    v-for="share in shares"
                    :key="share.id"
                    class="rounded-2xl ring-1 p-3 transition-colors"
                    :class="share.is_usable ? 'bg-white ring-slate-900/5' : 'bg-slate-50 ring-slate-200'"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0"
                        :class="share.access === 'edit'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'"
                      >
                        <component :is="share.access === 'edit' ? Pencil : Eye" class="w-3 h-3" />
                        {{ share.access === 'edit'
                          ? t('management.shareGuestList.access.edit.label')
                          : t('management.shareGuestList.access.view.label') }}
                      </span>

                      <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                        {{ share.label || t('management.shareGuestList.untitled') }}
                      </span>

                      <template v-if="share.is_usable">
                        <button
                          type="button"
                          @click="handleCopy(share)"
                          class="flex items-center justify-center w-9 h-9 rounded-xl transition-colors flex-shrink-0"
                          :class="copiedShareId === share.id
                            ? 'text-green-600 bg-green-50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'"
                          :title="t('management.shareGuestList.copyLink')"
                          :aria-label="t('management.shareGuestList.copyLink')"
                        >
                          <Check v-if="copiedShareId === share.id" class="w-4 h-4" />
                          <Copy v-else class="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          @click="$emit('revoke', share)"
                          :disabled="busyShareId === share.id"
                          class="flex items-center justify-center w-9 h-9 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0 disabled:opacity-50"
                          :title="t('management.shareGuestList.revoke')"
                          :aria-label="t('management.shareGuestList.revoke')"
                        >
                          <Ban class="w-4 h-4" />
                        </button>
                      </template>
                      <button
                        v-else
                        type="button"
                        @click="$emit('delete', share)"
                        :disabled="busyShareId === share.id"
                        class="flex items-center justify-center w-9 h-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0 disabled:opacity-50"
                        :title="t('management.shareGuestList.deleteLink')"
                        :aria-label="t('management.shareGuestList.deleteLink')"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>

                    <!-- The link itself, and what has happened to it. Shown in
                         full rather than as a code: a link people paste into
                         chat is checked by eye before it is sent. -->
                    <p
                      v-if="share.is_usable"
                      class="mt-2 text-[11px] font-mono text-slate-500 break-all"
                    >{{ share.url }}</p>
                    <p class="mt-1.5 text-[11px] text-slate-400">
                      <span v-if="!share.is_active">{{ t('management.shareGuestList.status.revoked') }}</span>
                      <span v-else-if="share.is_expired">{{ t('management.shareGuestList.status.expired') }}</span>
                      <span v-else-if="share.expires_at">
                        {{ t('management.shareGuestList.status.expiresOn', { date: formatDate(share.expires_at) }) }}
                      </span>
                      <span v-else>{{ t('management.shareGuestList.status.noExpiry') }}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{{ t('management.shareGuestList.status.opened', { count: share.access_count }) }}</span>
                    </p>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Ban, Check, Copy, Eye, Link2, Pencil, Plus, Trash2, X } from 'lucide-vue-next'
import type { GuestListShare, GuestShareAccess } from '@/services/api'
import type { ShareExpiryPreset } from '@/composables/invitation/useGuestListShares'

const props = defineProps<{
  show: boolean
  shares: GuestListShare[]
  loading: boolean
  creating: boolean
  busyShareId: number | null
  errorMessage: string
}>()

const emit = defineEmits<{
  close: []
  create: [access: GuestShareAccess, label: string, expiry: ShareExpiryPreset]
  revoke: [share: GuestListShare]
  delete: [share: GuestListShare]
  copied: [share: GuestListShare]
  'copy-failed': []
}>()

const { t, locale } = useI18n()

const ACCESS_OPTIONS = [
  {
    value: 'view' as GuestShareAccess,
    icon: Eye,
    labelKey: 'management.shareGuestList.access.view.label',
    descKey: 'management.shareGuestList.access.view.description',
  },
  {
    value: 'edit' as GuestShareAccess,
    icon: Pencil,
    labelKey: 'management.shareGuestList.access.edit.label',
    descKey: 'management.shareGuestList.access.edit.description',
  },
]

/**
 * `view` is the default because it is the reversible one. Handing out edit by
 * accident is the mistake with consequences, and the person minting the link is
 * usually doing it in a hurry on a phone.
 */
const draftAccess = ref<GuestShareAccess>('view')
const draftLabel = ref('')
const draftExpiry = ref<ShareExpiryPreset>('never')
const copiedShareId = ref<number | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | undefined

// Fresh form on each open — the previous link's label is never the next one's.
watch(
  () => props.show,
  (open) => {
    if (!open) return
    draftAccess.value = 'view'
    draftLabel.value = ''
    draftExpiry.value = 'never'
    copiedShareId.value = null
  },
)

const handleCreate = () => {
  emit('create', draftAccess.value, draftLabel.value.trim(), draftExpiry.value)
}

/**
 * The tick lands on the button that was pressed rather than in a toast — this
 * modal is a list of near-identical rows, and a toast could not say which one
 * went to the clipboard.
 */
const handleCopy = async (share: GuestListShare) => {
  try {
    await navigator.clipboard.writeText(share.url)
    copiedShareId.value = share.id
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedShareId.value = null
    }, 1500)
    emit('copied', share)
  } catch {
    emit('copy-failed')
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'kh' ? 'km-KH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
