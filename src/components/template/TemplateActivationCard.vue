<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
    <!-- Where this event stands: template → payment → live. Held back until the
         payment rows are in — see `resolved`. -->
    <div v-if="resolved" class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/40">
      <ActivationStepper :state="state" />
    </div>

    <div class="grid grid-cols-[auto_1fr] gap-x-3.5 sm:gap-x-6 gap-y-4 p-4 sm:p-6">
      <!-- Preview column: the real cover screen, rendered by the same frame the
           Design Studio uses, rather than the template's marketing
           `preview_image`. The organizer has already watched this render live —
           paying against a different, static picture of it reads as a
           downgrade, and it can't show their own content.

           Width comes from one JS value rather than responsive classes: the
           frame renders a real 390px-wide phone viewport and scales it down, so
           its intrinsic content is far wider than this column. An `auto` track
           sized against that (and `min-width: auto` on the grid item) blew the
           column out to the frame's un-scaled width on phones, pushing the
           template name off the card — `min-w-0` plus a measured
           `width-override` keeps the track and the frame agreeing exactly. -->
      <div class="min-w-0 row-span-2 self-start" :style="{ width: `${previewWidth}px` }">
        <div v-if="canPreview" class="activation-card__preview">
          <PreviewFrame
            ref="previewFrameRef"
            :label="t('management.showcasePreview.coverLabel')"
            :max-width="208"
            :width-override="previewWidth"
            :fit-height="false"
          >
            <InertIframe :src="coverFrameUrl" />
          </PreviewFrame>
          <button
            type="button"
            class="activation-card__studio-link"
            @click="emit('open-studio')"
          >
            <Wand2 class="w-3.5 h-3.5 flex-shrink-0" />
            <span class="hidden lg:inline">{{ t('management.activation.card.openStudio') }}</span>
            <span class="lg:hidden">{{ t('management.activation.card.openStudioShort') }}</span>
          </button>
        </div>

        <!-- No live preview for this category (or no template yet): fall back
             to the template's own artwork. -->
        <div
          v-else-if="template?.preview_image"
          class="relative bg-slate-100 rounded-xl lg:rounded-2xl overflow-hidden shadow-md ring-1 ring-slate-900/5 aspect-[9/16]"
        >
          <img
            :src="template.preview_image"
            :alt="template.name"
            loading="lazy"
            class="w-full h-full object-cover"
          />
          <button
            v-if="template.youtube_preview_url"
            @click="emit('preview-video', template.youtube_preview_url)"
            :aria-label="t('management.templateDisplayCard.watchPreviewBtn')"
            class="absolute inset-0 flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e90ff] focus-visible:ring-offset-2 rounded-xl lg:rounded-2xl"
          >
            <div
              class="w-10 h-10 lg:w-12 lg:h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200"
            >
              <PlayCircle class="w-6 h-6 lg:w-7 lg:h-7 text-slate-800" />
            </div>
          </button>
        </div>
        <div
          v-else
          class="bg-slate-100 rounded-xl lg:rounded-2xl flex items-center justify-center aspect-[9/16]"
        >
          <Palette class="w-8 h-8 lg:w-10 lg:h-10 text-slate-400" />
        </div>
      </div>

      <!-- Identity + price -->
      <div class="min-w-0 self-start">
        <h3 class="text-lg sm:text-2xl font-bold text-slate-900 break-words leading-snug">
          {{ template?.name || t('management.activation.card.untitledTemplate') }}
        </h3>

        <div class="mt-2 flex items-center flex-wrap gap-1.5">
          <span
            v-if="template?.package_plan?.name"
            :class="[
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
              planPillClass,
            ]"
          >
            <component :is="planIcon" class="w-3 h-3" />
            {{ template.package_plan.name }}
          </span>
          <!-- Status badges only once the payment rows are known — see `resolved`. -->
          <template v-if="resolved">
          <span
            v-if="state === 'active'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            {{ t('management.activation.card.badgeLive') }}
          </span>
          <span
            v-else-if="state === 'pending'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200"
          >
            <Clock class="w-3.5 h-3.5" />
            {{ t('management.activation.card.badgePending') }}
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200"
          >
            <Eye class="w-3.5 h-3.5" />
            {{ t('management.activation.card.badgePreviewOnly') }}
          </span>
          </template>
        </div>

        <div
          v-if="state !== 'active' && template?.package_plan?.price"
          class="mt-2.5 flex items-baseline gap-1.5 flex-wrap"
        >
          <span class="text-xl sm:text-3xl font-bold text-slate-900">
            {{ formatCurrency(template.package_plan.price, 'USD') }}
          </span>
          <span class="text-sm text-slate-500">{{ t('management.templateDisplayCard.oneTime') }}</span>
        </div>
      </div>

      <!-- Features + the single primary action.
           On phones the action comes first: the plan's feature chips are a
           paragraph of reassurance, and pushing the one button this tab exists
           for below them puts it off-screen. Wide layouts keep the reading
           order (features, then the action anchored under them). -->
      <div
        class="col-span-2 lg:col-span-1 lg:col-start-2 min-w-0 flex flex-col border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0"
      >
        <div
          v-if="template?.package_plan?.features?.length"
          class="order-2 lg:order-1 flex-1 pt-4 lg:pt-0"
        >
          <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            {{ t('management.templateDisplayCard.features') }}
            <span class="text-slate-400">· {{ template.package_plan.features.length }}</span>
          </h4>
          <ul class="flex flex-wrap gap-1.5 sm:gap-2">
            <li
              v-for="feature in template.package_plan.features"
              :key="feature"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 ring-1 ring-slate-200/70 text-xs sm:text-[0.8125rem] font-medium text-slate-700"
            >
              <Check class="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span>{{ feature }}</span>
            </li>
          </ul>
        </div>

        <div
          v-if="resolved"
          class="order-1 pb-4 border-b border-slate-100 lg:order-2 lg:pb-0 lg:border-b-0 lg:mt-6 lg:pt-4 lg:border-t lg:border-slate-200"
        >
          <!-- Unpaid: the whole reason this tab exists. -->
          <template v-if="state === 'unpaid' && canEdit">
            <button
              @click="emit('activate')"
              class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3.5 sm:py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center justify-center text-sm sm:text-base"
            >
              <Sparkles class="w-5 h-5 mr-2" />
              {{ t('management.activation.card.activateBtn') }}
            </button>
            <p class="text-xs sm:text-sm text-slate-500 text-center mt-2">
              {{ t('management.activation.card.activateHint') }}
            </p>
          </template>

          <!-- Pending: nothing to do but wait — say so plainly. -->
          <div
            v-else-if="state === 'pending'"
            class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3"
          >
            <Clock class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-amber-800">
                {{ t('management.activation.card.pendingTitle') }}
              </p>
              <p class="text-xs text-amber-700/80 mt-0.5">
                {{ t('management.activation.card.pendingHint') }}
              </p>
            </div>
          </div>

          <!-- Active: confirm it, then get out of the way. -->
          <div
            v-else-if="state === 'active'"
            class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3"
          >
            <CheckCircle class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-emerald-800">
                {{ t('management.activation.card.activeTitle') }}
              </p>
              <p class="text-xs text-emerald-700/80 mt-0.5">
                {{ t('management.activation.card.activeHint') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The activation tab's header card: what you selected, what it costs, how far
 * along activation is, and the one button that moves it forward.
 *
 * Replaces TemplateDisplayCard's active/preview split — that component had to
 * guess at a status from two booleans and showed the template's marketing
 * artwork. Here the status is the shared ActivationState and the artwork is the
 * organizer's own cover screen, rendered by the same preview frame the studio
 * uses.
 */
import { computed, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Check,
  CheckCircle,
  Clock,
  Crown,
  Eye,
  Palette,
  PlayCircle,
  Sparkles,
  Wand2,
} from 'lucide-vue-next'
import { formatCurrency } from '../../utils/currency'
import { useMediaQuery } from '../../composables/useMediaQuery'
import PreviewFrame from '../showcase-preview/PreviewFrame.vue'
import InertIframe from '../showcase-preview/InertIframe.vue'
import ActivationStepper from './ActivationStepper.vue'
import type { EventTemplate } from '../../services/api'
import type { ActivationState } from '../../composables/useTemplateActivation'

interface Props {
  eventId: string
  state: ActivationState
  /** Whether `state` reflects fetched payment data yet — status badges, the
   *  stepper and the action block stay hidden until it does, rather than
   *  briefly asserting "preview only" about an already-live showcase. */
  resolved?: boolean
  template?: EventTemplate | null
  /** Selected template id — needed by the frame's unpaid-assets fallback. */
  templateId?: number | string | null
  /** Whether this event's category renders the showcase preview frames at all. */
  canPreview?: boolean
  canEdit?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Open the payment checkout. */
  activate: []
  /** Take the organizer to the Design Studio to keep editing/swapping. */
  'open-studio': []
  /** Fallback path only (no live preview) — open the template's video. */
  'preview-video': [url: string]
}>()

const { t } = useI18n()

const previewFrameRef = ref<InstanceType<typeof PreviewFrame> | null>(null)

// The preview column's width, in one place, driven off the same breakpoints the
// rest of the card uses. Given to both the column element and the frame so the
// grid track can never disagree with what the frame scales itself to.
const isDesktop = useMediaQuery('(min-width: 1024px)')
const isTablet = useMediaQuery('(min-width: 640px)')
const previewWidth = computed(() => (isDesktop.value ? 208 : isTablet.value ? 160 : 104))

const coverFrameUrl = computed(() => {
  const params = new URLSearchParams({ stage: 'cover' })
  // Always pass the selected template id: the showcase endpoint withholds
  // template_assets until payment is confirmed, and the frame backfills them
  // from the public assets when it sees this param — without it, an unpaid
  // template previews as an unstyled showcase, which is exactly the state this
  // card is asking the organizer to pay their way out of.
  if (props.templateId) params.set('templateId', String(props.templateId))
  return `/events/${props.eventId}/showcase-preview-frame?${params.toString()}`
})

// The frame measures its own column on mount, but this card's grid settles a
// tick later (and the stepper above it can change height with the state), so
// nudge it once the layout is final.
watch(
  () => [props.canPreview, props.state],
  () => nextTick(() => previewFrameRef.value?.measure()),
)

// Same package → color mapping as TemplateCard in the browse grid
const planPillClass = computed(() => {
  const planName = props.template?.package_plan?.name?.toLowerCase() ?? ''
  if (planName.includes('basic')) return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
  if (planName.includes('standard')) return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
})

const planIcon = computed(() => {
  const planName = props.template?.package_plan?.name?.toLowerCase() ?? ''
  return planName.includes('standard') ? Crown : Sparkles
})
</script>

<style scoped>
.activation-card__preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* PreviewFrame's own uppercase label is redundant here (there's only one
   frame, and the card's heading already names the template). */
.activation-card__preview :deep(.preview-frame__label) {
  display: none;
}

.activation-card__studio-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  /* Roomier vertically on phones — it's the only other tap target in this
     column, and 28px of pill is an easy thing to miss with a thumb. */
  padding: 0.5rem 0.75rem;
  max-width: 100%;
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(71 85 105);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 9999px;
  transition: all 0.2s ease;
}

@media (min-width: 1024px) {
  .activation-card__studio-link {
    padding: 0.375rem 0.75rem;
  }
}

.activation-card__studio-link:hover {
  color: rgb(15 23 42);
  border-color: rgba(46, 204, 113, 0.4);
  background: white;
}
</style>
