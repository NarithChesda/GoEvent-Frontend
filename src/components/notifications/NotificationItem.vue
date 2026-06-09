<template>
  <div
    class="group relative flex items-start gap-3 px-4 py-3.5 transition-colors"
    :class="[
      notification.is_read
        ? 'hover:bg-slate-50'
        : 'bg-[#2ecc71]/[0.05] hover:bg-[#2ecc71]/[0.08]',
    ]"
  >
    <!-- Type icon -->
    <div
      class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
      :class="iconBg"
    >
      <component :is="iconComponent" class="w-4 h-4" :class="iconColor" aria-hidden="true" />
    </div>

    <!-- Content (clickable area for navigate) -->
    <button
      type="button"
      class="min-w-0 flex-1 text-left"
      @click="handleActivate"
    >
      <div
        class="text-sm truncate"
        :class="notification.is_read ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'"
      >
        {{ notification.title }}
      </div>
      <div
        class="text-sm line-clamp-2 mt-0.5"
        :class="notification.is_read ? 'text-slate-400' : 'text-slate-500'"
      >
        {{ notification.message }}
      </div>
      <div class="text-xs text-slate-400 mt-1.5">{{ relativeTime }}</div>
    </button>

    <!-- Right slot: unread dot by default, delete on hover -->
    <div class="relative flex-shrink-0 w-6 flex justify-center pt-1">
      <span
        v-if="!notification.is_read"
        class="mt-1 w-2 h-2 rounded-full bg-[#2ecc71] transition-opacity group-hover:opacity-0"
        aria-hidden="true"
      ></span>
      <button
        type="button"
        class="absolute right-0 top-0 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
        :aria-label="t('common.notifications.actions.delete')"
        @click.stop="$emit('delete', notification.id)"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  X,
  Bell,
  UserPlus,
  MessageSquare,
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  LogIn,
  Gift,
  ClipboardCheck,
} from 'lucide-vue-next'
import type { NotificationItem, NotificationType } from '@/services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  notification: NotificationItem
}>()

const emit = defineEmits<{
  (e: 'activate', id: string, actionUrl: string): void
  (e: 'delete', id: string): void
}>()

const { t, locale } = useAppLanguage()

const iconMap: Record<NotificationType, { icon: Component; bg: string; color: string }> = {
  event_registration: { icon: UserPlus, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  rsvp_response: { icon: ClipboardCheck, bg: 'bg-sky-100', color: 'text-sky-600' },
  event_comment: { icon: MessageSquare, bg: 'bg-violet-100', color: 'text-violet-600' },
  collaborator_invite: { icon: Users, bg: 'bg-amber-100', color: 'text-amber-600' },
  collaborator_added: { icon: Users, bg: 'bg-amber-100', color: 'text-amber-600' },
  payment_confirmed: { icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  payment_rejected: { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
  event_reminder: { icon: Calendar, bg: 'bg-blue-100', color: 'text-blue-600' },
  check_in: { icon: LogIn, bg: 'bg-teal-100', color: 'text-teal-600' },
  guest_cash_gift: { icon: Gift, bg: 'bg-pink-100', color: 'text-pink-600' },
}

const visual = computed(
  () => iconMap[props.notification.notification_type] ?? {
    icon: Bell,
    bg: 'bg-slate-100',
    color: 'text-slate-600',
  },
)
const iconComponent = computed(() => visual.value.icon)
const iconBg = computed(() => visual.value.bg)
const iconColor = computed(() => visual.value.color)

const relativeTime = computed(() => formatRelative(props.notification.created_at, locale.value))

function handleActivate() {
  emit('activate', props.notification.id, props.notification.action_url)
}

function formatRelative(iso: string, lang: string): string {
  const created = new Date(iso).getTime()
  if (Number.isNaN(created)) return ''
  const diffMs = Date.now() - created
  const diffSec = Math.round(diffMs / 1000)
  const isKh = lang === 'kh'

  if (diffSec < 60) return isKh ? 'ឥឡូវនេះ' : 'just now'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return isKh ? `${diffMin} នាទីមុន` : `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return isKh ? `${diffHr} ម៉ោងមុន` : `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return isKh ? `${diffDay} ថ្ងៃមុន` : `${diffDay}d ago`
  const diffWeek = Math.round(diffDay / 7)
  if (diffWeek < 5) return isKh ? `${diffWeek} សប្តាហ៍មុន` : `${diffWeek}w ago`
  return new Date(iso).toLocaleDateString(isKh ? 'km' : 'en', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
