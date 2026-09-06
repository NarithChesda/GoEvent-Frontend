<template>
  <AdminQueueShell
    queue-name="events"
    :title="t('admin.events.title')"
    :description="t('admin.events.description')"
    :search-placeholder="t('admin.events.search')"
    :empty-title="t('admin.events.emptyTitle')"
    :empty-body="t('admin.events.emptyBody')"
    :status-options="statusOptions"
    :ordering-options="orderingOptions"
    :extra-params="extraParams"
    :row-title="(row: AdminEventRow) => row.title"
    :row-eyebrow="(row: AdminEventRow) => describeActor(row.organizer)"
    :approve-label="t('admin.events.approve')"
    :decision-status="(row: AdminEventRow) => row.moderation_status"
  >
    <template #filters>
      <div class="relative">
        <select
          v-model="lifecycle"
          class="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          :aria-label="t('admin.events.lifecycleFilter')"
        >
          <option value="">{{ t('admin.events.lifecycles.any') }}</option>
          <option v-for="value in LIFECYCLES" :key="value" :value="value">
            {{ t(`admin.events.lifecycles.${value}`) }}
          </option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </template>

    <template #row="{ row }">
      <!-- 1.9:1, the banner's own ratio — an event is recognised by its banner
           the way a template is by its cover. -->
      <span
        class="flex h-10 w-[3.1875rem] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
      >
        <AdminImage :src="row.banner_image" alt="" img-class="h-full w-full object-cover">
          <template #fallback>
            <CalendarDays class="h-4 w-4 text-slate-400" aria-hidden="true" />
          </template>
        </AdminImage>
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="min-w-0 truncate text-sm font-medium text-slate-900">{{ row.title }}</span>
          <!-- The moderation state is the one being decided, so it is the badge.
               The organizer's lifecycle is context and sits in the meta line. -->
          <AdminStatusBadge
            :status="row.moderation_status"
            :status-display="row.moderation_status_display"
          />
          <!-- A draft is waiting on its organizer, not on us. Worth a mark of
               its own: reviewing one is usually premature, and a queue that
               does not say so wastes the reviewer's attention on it.

               It says "with organizer", not "draft" — the lifecycle word is
               already the first thing in the meta line below, and a chip that
               repeats it is a second piece of furniture carrying no second
               fact. What the chip adds is whose move it is. -->
          <span
            v-if="isWaitingOnOrganizer(row)"
            class="flex-shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
          >
            {{ t('admin.events.waitingOnOrganizer') }}
          </span>
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ row.status_display }}
          <template v-if="describeActor(row.organizer)">
            · {{ describeActor(row.organizer) }}
          </template>
          <template v-if="row.category_name"> · {{ row.category_name }}</template>
          <template v-if="row.start_date"> · {{ formatDate(row.start_date) }}</template>
        </span>
      </span>
    </template>

    <template #detail="{ row }">
      <div
        v-if="row.banner_image"
        class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
      >
        <AdminImage
          :src="row.banner_image"
          :alt="t('admin.events.bannerAlt', { title: row.title })"
          img-class="w-full"
          eager
        />
      </div>

      <!-- The title is already the drawer's own header, so this block is the
           organizer's pitch and nothing else — and it does not render at all
           when there is no pitch to read. -->
      <p
        v-if="row.short_description"
        class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600"
      >
        {{ row.short_description }}
      </p>

      <!--
        The single most important thing on this screen. Approval gates public
        discovery and nothing else: a rejected event keeps its own page, its
        share links, its registration and its invitations. A reviewer who
        believes they are taking an event down will reject far more cautiously
        than the decision actually warrants.
      -->
      <div class="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
        <Compass class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1e90ff]" aria-hidden="true" />
        <p class="text-sm text-slate-700">{{ t('admin.events.gatesDiscovery') }}</p>
      </div>

      <div
        v-if="isWaitingOnOrganizer(row)"
        class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        <Hourglass class="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
        <p class="text-sm text-slate-600">{{ t('admin.events.draftHint') }}</p>
      </div>

      <a
        :href="`/events/${row.id}`"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e90ff] hover:underline"
      >
        <ExternalLink class="h-4 w-4" aria-hidden="true" />
        {{ t('admin.events.openEvent') }}
      </a>

      <AdminFacts :facts="factsFor(row)" />

      <!-- `moderation_note` is the organizer's copy of the last decision. There
           is no internal note on this queue, so nothing here is staff-only. -->
      <AdminNote :label="t('admin.events.moderationNote')" :note="row.moderation_note" />
    </template>
  </AdminQueueShell>
</template>

<script setup lang="ts">
/**
 * Public events awaiting moderation.
 *
 * **Two statuses, two owners, and the queue decides only one of them.**
 * `status` is the organizer's lifecycle (draft → published → cancelled /
 * completed); `moderation_status` is staff's (pending → approved / rejected).
 * The backend split them so that "a reviewer said no" could never be confused
 * with "the organizer hasn't finished", and this view has to hold that line:
 * the moderation state is the badge and what `decision-status` reads, the
 * lifecycle is context in the meta line and its own `?event_status=` filter.
 *
 * **Approving gates discovery, not delivery.** An unapproved public event is
 * absent from `GET /api/events/` and nothing else changes — its own page, its
 * share links, registration and invitations all keep working. The drawer says
 * so in as many words, because a reviewer who thinks rejection takes an event
 * down is a reviewer who will not reject a bad one.
 *
 * The queue is scoped to `privacy='public'` server-side, so there is no privacy
 * filter here: a private event is an invitation, not something GoEvent lists,
 * and it never enters this queue.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CalendarDays,
  ChevronDown,
  Compass,
  ExternalLink,
  Hourglass,
} from 'lucide-vue-next'
import AdminQueueShell from '@/components/admin/AdminQueueShell.vue'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge.vue'
import AdminFacts from '@/components/admin/AdminFacts.vue'
import AdminImage from '@/components/admin/AdminImage.vue'
import AdminNote from '@/components/admin/AdminNote.vue'
import {
  describeActor,
  formatDate,
  formatDateTime,
  type AdminFact,
} from '@/components/admin/adminDisplay'
import type { AdminEventLifecycle, AdminEventRow } from '@/services/api'

const LIFECYCLES: AdminEventLifecycle[] = ['draft', 'published', 'cancelled', 'completed']

const { t } = useI18n()

const lifecycle = ref('')
const extraParams = computed(() => ({ event_status: lifecycle.value || undefined }))

/**
 * `pending` moderation on a `draft` event: the organizer has not published it,
 * so there is nothing for the public to discover yet and a decision now is
 * being made about a page that may still change.
 */
const isWaitingOnOrganizer = (row: AdminEventRow): boolean =>
  row.status === 'draft' && row.moderation_status === 'pending'

/**
 * These are **moderation** statuses. The organizer's lifecycle has its own
 * select, because `?status=` on this queue means the same thing it means on
 * every other one.
 */
const statusOptions = computed(() => [
  { value: '', label: t('admin.status.pending') },
  { value: 'approved', label: t('admin.status.approved') },
  { value: 'rejected', label: t('admin.status.rejected') },
  { value: 'all', label: t('admin.status.all') },
])

const orderingOptions = computed(() => [
  { value: '-created_at', label: t('admin.ordering.newest') },
  { value: 'created_at', label: t('admin.ordering.oldest') },
  { value: 'start_date', label: t('admin.events.orderingSoonest') },
  { value: 'title', label: t('admin.ordering.title') },
])

const factsFor = (row: AdminEventRow): AdminFact[] => [
  { label: t('admin.events.organizer'), value: describeActor(row.organizer), strong: true },
  { label: t('admin.events.organizerEmail'), value: row.organizer?.email },
  { label: t('admin.events.lifecycle'), value: row.status_display, strong: true },
  { label: t('admin.events.category'), value: row.category_name },
  { label: t('admin.events.starts'), value: formatDateTime(row.start_date) },
  {
    label: t('admin.events.ends'),
    value: row.end_date ? formatDateTime(row.end_date) : null,
  },
  { label: t('admin.events.location'), value: row.location },
  { label: t('admin.submitted'), value: formatDateTime(row.created_at) },
  { label: t('admin.events.moderatedBy'), value: describeActor(row.moderated_by) },
  {
    label: t('admin.events.moderatedAt'),
    value: row.moderated_at ? formatDateTime(row.moderated_at) : null,
  },
]
</script>
