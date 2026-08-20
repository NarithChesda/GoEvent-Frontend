<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
    <!-- Where this event stands: template → payment → live. Held back until the
         payment rows are in — see `resolved`. -->
    <div v-if="resolved" class="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/40">
      <ActivationStepper :state="state" />
    </div>

    <!-- Two shapes, one grid.

         Phones: the poster carries its own identity — name, plan and price sit
         in a scrim over its foot, the way the browse grid's cards do — with the
         feature list beside it and the action full-width underneath. Putting
         the identity *on* the artwork rather than under it is what buys the
         room for two columns on a 390px screen.

         From `lg`: the line-item shape instead — poster on the left, then
         name, features and the action in a left-aligned column beside it. -->
    <div
      class="grid grid-cols-[38%_minmax(0,1fr)] gap-x-3 gap-y-4 p-4 sm:gap-x-4 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-x-6"
    >
      <!-- Poster -->
      <div class="self-start lg:w-40 lg:row-span-3">
        <div
          class="relative bg-slate-100 rounded-2xl overflow-hidden shadow-md ring-1 ring-slate-900/5 aspect-[9/16]"
        >
          <img
            v-if="template?.preview_image && !artworkFailed"
            :src="template.preview_image"
            :alt="template.name"
            loading="lazy"
            class="w-full h-full object-cover"
            @error="artworkFailed = true"
          />
          <!-- No artwork, or a URL that would not load: a broken-image glyph
               with the template's name as alt text is worse than saying
               nothing. Centred in the tile's clear part rather than the whole
               tile — on phones the identity scrim covers the bottom third and
               would swallow it. -->
          <div
            v-else
            class="absolute inset-x-0 top-0 bottom-1/3 flex items-center justify-center lg:bottom-0"
          >
            <Palette class="w-9 h-9 lg:w-10 lg:h-10 text-slate-400" />
          </div>

          <button
            v-if="template?.youtube_preview_url"
            @click="emit('preview-video', template.youtube_preview_url)"
            :aria-label="t('management.templateDisplayCard.watchPreviewBtn')"
            class="absolute inset-x-0 top-0 bottom-1/3 flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1e90ff]"
          >
            <div
              class="w-10 h-10 lg:w-12 lg:h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-200"
            >
              <PlayCircle class="w-5 h-5 lg:w-7 lg:h-7 text-slate-800" />
            </div>
          </button>

          <!-- Identity, phone shape: over the poster's foot. Hidden rather than
               moved at `lg` — it differs from the wide layout's block in
               placement, type scale and colour, so two small renderings read
               more plainly than one covered in overrides. Only ever one of them
               is in the DOM's accessibility tree, since the other is
               `display: none`. -->
          <div
            class="absolute inset-x-0 bottom-0 px-2 pb-2 pt-8 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent lg:hidden"
          >
            <!-- Clamped, so the scrim can never eat the poster: `title` keeps a
                 long name readable. -->
            <h3
              :title="template?.name || undefined"
              class="text-sm font-bold text-white leading-snug line-clamp-2"
            >
              {{ template?.name || t('management.activation.card.untitledTemplate') }}
            </h3>

            <div v-if="badges.length" class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="badge in badges"
                :key="badge.key"
                :class="[
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[0.625rem] font-semibold ring-1',
                  badge.tone,
                ]"
              >
                <span
                  v-if="badge.dot"
                  class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"
                  aria-hidden="true"
                />
                <component :is="badge.icon" v-else-if="badge.icon" class="w-2.5 h-2.5" />
                {{ badge.label }}
              </span>
            </div>

            <p v-if="showPrice" class="mt-1.5 flex items-baseline flex-wrap gap-x-1">
              <span class="text-base font-bold text-white leading-none">
                {{ formatCurrency(template!.package_plan!.price, 'USD') }}
              </span>
              <span class="text-[0.625rem] text-white/70">
                {{ t('management.templateDisplayCard.oneTime') }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Identity, wide shape: its own column, left-aligned, where there is
           room for the full type scale. -->
      <div class="hidden lg:block lg:col-start-2 lg:row-start-1 lg:self-start min-w-0">
        <h3 class="min-w-0 text-2xl font-bold text-slate-900 break-words leading-snug">
          {{ template?.name || t('management.activation.card.untitledTemplate') }}
        </h3>

        <div v-if="badges.length" class="mt-2 flex items-center flex-wrap gap-1.5">
          <span
            v-for="badge in badges"
            :key="badge.key"
            :class="[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1',
              badge.tone,
            ]"
          >
            <span
              v-if="badge.dot"
              class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
              aria-hidden="true"
            />
            <component :is="badge.icon" v-else-if="badge.icon" class="w-3.5 h-3.5" />
            {{ badge.label }}
          </span>
        </div>

        <p v-if="showPrice" class="mt-2.5 flex items-baseline flex-wrap gap-1.5">
          <span class="text-3xl font-bold text-slate-900">
            {{ formatCurrency(template!.package_plan!.price, 'USD') }}
          </span>
          <span class="text-sm text-slate-500">
            {{ t('management.templateDisplayCard.oneTime') }}
          </span>
        </p>
      </div>

      <!-- What the plan includes — the poster's neighbour on phones, and the
           middle of the column at `lg`. -->
      <div
        v-if="template?.package_plan?.features?.length"
        class="col-start-2 min-w-0 lg:row-start-2"
      >
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {{ t('management.templateDisplayCard.features') }}
          <span class="text-slate-400">· {{ template.package_plan.features.length }}</span>
        </h4>
        <ul class="flex flex-col gap-1.5 lg:flex-row lg:flex-wrap lg:gap-2">
          <li
            v-for="feature in template.package_plan.features"
            :key="feature"
            class="flex items-start gap-1.5 text-xs text-slate-700 leading-snug lg:inline-flex lg:items-center lg:px-2.5 lg:py-1 lg:rounded-full lg:bg-slate-50 lg:ring-1 lg:ring-slate-200/70 lg:text-[0.8125rem] lg:font-medium"
          >
            <Check class="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span>{{ feature }}</span>
          </li>
        </ul>
      </div>

      <!-- The single primary action. Full width on phones — it is the one thing
           this tab exists for and the two columns above are too narrow for it. -->
      <div
        v-if="hasAction"
        class="col-span-2 pt-4 border-t border-slate-200 lg:col-span-1 lg:col-start-2 lg:row-start-3 lg:mt-2"
      >
        <!-- Unpaid: the whole reason this tab exists. -->
        <template v-if="state === 'unpaid'">
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

        <!-- Pending: nothing to do but wait, and that's worth saying — the
             stepper only reports the wait, not that it needs nothing. -->
        <div
          v-else
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
 * guess at a status from two booleans. Here the status is the shared
 * ActivationState, and the artwork is the template's own preview image, the
 * same picture the browse grid shows.
 */
import { computed, markRaw, ref, watch, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Check,
  Clock,
  Crown,
  Eye,
  Palette,
  PlayCircle,
  Sparkles,
} from 'lucide-vue-next'
import { formatCurrency } from '../../utils/currency'
import ActivationStepper from './ActivationStepper.vue'
import type { EventTemplate } from '../../services/api'
import type { ActivationState } from '../../composables/useTemplateActivation'

interface Props {
  state: ActivationState
  /** Whether `state` reflects fetched payment data yet — status badges, the
   *  stepper and the action block stay hidden until it does, rather than
   *  briefly asserting "preview only" about an already-live showcase. */
  resolved?: boolean
  template?: EventTemplate | null
  canEdit?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Open the payment checkout. */
  activate: []
  /** Open the template's video preview. */
  'preview-video': [url: string]
}>()

const { t } = useI18n()

/** Set when the artwork URL fails to load, so the placeholder takes over. */
const artworkFailed = ref(false)
watch(
  () => props.template?.preview_image,
  () => {
    artworkFailed.value = false
  },
)

const showPrice = computed(
  () => props.state !== 'active' && Boolean(props.template?.package_plan?.price),
)

/**
 * Whether the state block under the features has anything to say.
 *
 * Deliberately silent for `active`: the stepper's completed track and the green
 * `Live` badge beside the name already report it, and a third bordered box
 * repeating "guests can open your invitation" was the tallest thing on the
 * card. Silent too for an `unpaid` event the viewer cannot edit — there is no
 * button to offer them.
 */
const hasAction = computed(
  () =>
    Boolean(props.resolved) &&
    (props.state === 'pending' || (props.state === 'unpaid' && Boolean(props.canEdit))),
)

interface IdentityBadge {
  key: string
  label: string
  tone: string
  icon?: Component
  /** Pulsing dot instead of an icon — reserved for "live". */
  dot?: boolean
}

// Same package → color mapping as TemplateCard in the browse grid
const planTone = computed(() => {
  const planName = props.template?.package_plan?.name?.toLowerCase() ?? ''
  if (planName.includes('basic')) return 'bg-sky-50 text-sky-700 ring-sky-200'
  if (planName.includes('standard')) return 'bg-violet-50 text-violet-700 ring-violet-200'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
})

/**
 * Plan, then status — one list so the two layouts render the same badges from
 * the same source instead of keeping two copies of three `v-if` branches in
 * step. Status waits on `resolved`; see the prop's note.
 */
const badges = computed<IdentityBadge[]>(() => {
  const list: IdentityBadge[] = []
  const planName = props.template?.package_plan?.name

  if (planName) {
    list.push({
      key: 'plan',
      label: planName,
      tone: planTone.value,
      icon: markRaw(planName.toLowerCase().includes('standard') ? Crown : Sparkles),
    })
  }

  if (!props.resolved) return list

  if (props.state === 'active') {
    list.push({
      key: 'live',
      label: t('management.activation.card.badgeLive'),
      tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      dot: true,
    })
  } else if (props.state === 'pending') {
    list.push({
      key: 'pending',
      label: t('management.activation.card.badgePending'),
      tone: 'bg-amber-50 text-amber-700 ring-amber-200',
      icon: markRaw(Clock),
    })
  } else {
    list.push({
      key: 'preview',
      label: t('management.activation.card.badgePreviewOnly'),
      tone: 'bg-amber-50 text-amber-700 ring-amber-200',
      icon: markRaw(Eye),
    })
  }

  return list
})
</script>
