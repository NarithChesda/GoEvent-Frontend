<template>
  <!--
    One listing's numbers.

    Read-only, one object deep, dismissed as soon as it is read — a modal rather
    than a drawer (design §11), which is the shape reserved for a form.

    Every figure here used to sit in a coloured tile: views on sky-50, contacts
    on emerald-50, the conversion bar on the brand gradient. That spends the
    system's loudest asset on a metric and makes two numbers look like two
    *kinds* of thing when they are the two ends of one funnel. They are large
    slate type on the panel instead, split by a hairline — the size is the
    emphasis, and the only colour left is the trend arrow, where up and down
    genuinely mean something.
  -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[1000] overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="emit('close')" />

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl sm:p-6"
            role="dialog"
            aria-modal="true"
            :aria-label="t('settings.listings.analyticsModal.title')"
            @click.stop
          >
            <!-- The listing names the panel; "Listing analytics" is what the
                 eyebrow above it is for. Which listing you opened matters more
                 than the fact that these are analytics — you just pressed the
                 chart button to get here. -->
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {{ t('settings.listings.analyticsModal.title') }}
                </p>
                <h3 class="mt-1 truncate text-lg font-semibold text-slate-900">
                  {{ listing?.title }}
                </h3>
              </div>

              <button
                type="button"
                class="-mr-1 -mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :aria-label="t('common.actions.close')"
                @click="emit('close')"
              >
                <X class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <!-- Loading. The figure row's own shape, so the panel does not
                 resize under the cursor when the numbers land. -->
            <div v-if="isLoading" class="mt-6 animate-pulse" aria-hidden="true">
              <div class="grid grid-cols-2 gap-4">
                <div v-for="n in 2" :key="n">
                  <div class="h-9 w-16 rounded bg-slate-200"></div>
                  <div class="mt-2 h-3 w-24 rounded bg-slate-100"></div>
                </div>
              </div>
              <div class="mt-6 h-px bg-slate-100"></div>
              <div class="mt-5 h-3 w-full rounded bg-slate-100"></div>
            </div>

            <div v-else-if="analytics" class="mt-6">
              <!-- The funnel, in its own order: how many arrived, how many
                   reached out. Divided rather than boxed. -->
              <div class="grid grid-cols-2 divide-x divide-slate-100">
                <div class="pr-4">
                  <p class="text-3xl font-semibold tabular-nums text-slate-900">
                    {{ analytics.total_views }}
                  </p>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ t('settings.listings.analyticsModal.totalViews') }}
                  </p>
                </div>
                <div class="pl-4">
                  <p class="text-3xl font-semibold tabular-nums text-slate-900">
                    {{ analytics.total_contact_clicks }}
                  </p>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ t('settings.listings.analyticsModal.contactClicks') }}
                  </p>
                </div>
              </div>

              <!-- Conversion, as the ratio between the two figures above it —
                   so it sits directly under them, with the bar reading as the
                   distance between the pair rather than as a third statistic. -->
              <div class="mt-6 border-t border-slate-100 pt-5">
                <div class="flex items-baseline justify-between gap-3">
                  <span class="text-sm text-slate-600">
                    {{ t('settings.listings.analyticsModal.conversionRate') }}
                  </span>
                  <span class="text-sm font-semibold tabular-nums text-slate-900">
                    {{ conversionPercent.toFixed(1) }}%
                  </span>
                </div>
                <div class="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full bg-slate-900 transition-[width] duration-500"
                    :style="{ width: `${Math.min(conversionPercent, 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- Trend. The one place colour is doing semantic work here. -->
              <div
                v-if="analytics.trends"
                class="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5"
              >
                <span class="min-w-0 text-sm text-slate-600">
                  {{
                    t('settings.listings.analyticsModal.viewTrend', {
                      days: analytics.trends.period_days,
                    })
                  }}
                </span>
                <span
                  class="inline-flex flex-shrink-0 items-center gap-1 text-sm font-semibold tabular-nums"
                  :class="trendUp ? 'text-emerald-600' : 'text-red-600'"
                >
                  <TrendingUp v-if="trendUp" class="h-4 w-4" aria-hidden="true" />
                  <TrendingDown v-else class="h-4 w-4" aria-hidden="true" />
                  {{ trendUp ? '+' : '' }}{{ analytics.trends.view_change_percent.toFixed(1) }}%
                </span>
              </div>

              <!-- How they reached out. A list, so it renders as a list — rows
                   on a divider rather than a stack of filled pills. -->
              <div v-if="contactBreakdown.length" class="mt-5 border-t border-slate-100 pt-5">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {{ t('settings.listings.analyticsModal.contactBreakdown') }}
                </p>
                <div class="mt-2 divide-y divide-slate-100">
                  <div
                    v-for="entry in contactBreakdown"
                    :key="entry.type"
                    class="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span class="min-w-0 truncate text-sm capitalize text-slate-600">
                      {{ entry.type }}
                    </span>
                    <span class="flex-shrink-0 text-sm font-medium tabular-nums text-slate-900">
                      {{ entry.count }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p v-else class="mt-6 py-6 text-center text-sm text-slate-500">
              {{ t('settings.listings.analyticsModal.noData') }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { TrendingDown, TrendingUp, X } from 'lucide-vue-next'
import {
  serviceListingsService,
  type ServiceListing,
  type ServiceListingAnalytics,
} from '@/services/api'

const props = defineProps<{
  show: boolean
  listing: ServiceListing | null
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const analytics = ref<ServiceListingAnalytics | null>(null)
const isLoading = ref(false)

const conversionPercent = computed(() => (analytics.value?.conversion_rate ?? 0) * 100)
const trendUp = computed(() => (analytics.value?.trends?.view_change_percent ?? 0) >= 0)

/**
 * `contact_clicks_by_type` arrives keyed by channel with no order of its own, so
 * it is sorted by volume — a breakdown is read to find the channel that works.
 */
const contactBreakdown = computed(() =>
  Object.entries(analytics.value?.contact_clicks_by_type ?? {})
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count),
)

// The fetch belongs to the panel that displays it: the tab opens the modal with
// a listing and never has to hold a result it does not render.
const loadAnalytics = async (listingId: string) => {
  isLoading.value = true
  analytics.value = null
  try {
    const response = await serviceListingsService.getAnalytics(listingId, {
      period: 'daily',
      days: 30,
    })
    if (response.success && response.data) {
      analytics.value = response.data
    }
  } catch (err) {
    console.error('Error loading listing analytics:', err)
  } finally {
    isLoading.value = false
  }
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

// Not `immediate`: this component stays mounted for the life of the tab, and a
// first run with `show` false would release a body scroll lock it never took —
// the listing drawer's, if one happened to be open when the tab rendered.
watch(
  () => [props.show, props.listing?.id] as const,
  ([show, listingId]) => {
    if (show && listingId) {
      loadAnalytics(listingId)
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
    }
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active .relative,
  .modal-leave-active .relative {
    transition: none;
  }
}
</style>
