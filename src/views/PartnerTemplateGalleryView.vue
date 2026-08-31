<template>
  <!--
    No app shell. This page is one thing — a catalogue you look through — and
    the top bar, the mobile tab bar and the footer all belong to a product a
    visitor here does not have an account for. What they cost is height, and
    height is exactly what a phone-shaped frame wants. The back link is the only
    navigation the page needs.
  -->
  <div class="tpl-page">
    <header class="tpl-page__head">
      <RouterLink to="/partners" class="tpl-back">
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        {{ t('partners.templates.back') }}
      </RouterLink>

      <div class="tpl-page__headline">
        <h1 class="tpl-page__title type-display-sm">{{ t('partners.templates.title') }}</h1>
        <p class="tpl-page__subtitle">{{ t('partners.templates.subtitle') }}</p>
      </div>

      <!--
        How you are looking at it: how many screens, and in which language. Page
        chrome, not stage furniture — it changes the whole view rather than
        anything about the design on screen — so it sits in the header's trailing
        corner where view controls are looked for, and leaves the space above the
        frames to the one caption that IS about them.

        The layout half is desktop-only: three phone frames never fit a phone.
      -->
      <div
        v-if="hasViewControls"
        class="tpl-seg"
        role="group"
        :aria-label="t('partners.templates.viewControlsLabel')"
      >
        <!-- `v-if`, not a `hidden lg:inline-flex` class pair. A scoped style
             carries the component's data attribute and so outranks Tailwind's
             single-class `.hidden`, which left these two on screen at every
             width — where `isSingleView` is forced true anyway, so the grid
             segment lit up as chosen and then changed nothing. -->
        <template v-if="showLayoutSegments">
          <button
            v-for="option in VIEW_MODES"
            :key="option.value"
            type="button"
            class="tpl-seg__btn"
            :class="{ 'is-active': viewMode === option.value }"
            :title="t(option.labelKey)"
            :aria-label="t(option.labelKey)"
            :aria-pressed="viewMode === option.value"
            @click="setViewMode(option.value)"
          >
            <component :is="option.icon" class="h-4 w-4" aria-hidden="true" />
          </button>
          <span v-if="frameLanguages.length > 1" class="tpl-seg__divider" aria-hidden="true" />
        </template>

        <button
          v-if="frameLanguages.length > 1"
          type="button"
          class="tpl-seg__btn tpl-seg__btn--lang"
          :title="t('partners.templates.switchLanguage')"
          :aria-label="t('partners.templates.switchLanguage')"
          @click="cycleLanguage"
        >
          <Languages class="h-3.5 w-3.5" aria-hidden="true" />
          <span>{{ previewLanguage.toUpperCase() }}</span>
        </button>
      </div>
    </header>

    <!-- Loading: the two halves, in outline. -->
    <div v-if="loading" class="tpl-studio">
      <div class="tpl-studio__stage">
        <div class="tpl-skeleton-frame" />
      </div>
      <div class="tpl-studio__menu">
        <div class="tpl-card-grid">
          <div v-for="n in 6" :key="n" class="tpl-skeleton-card" />
        </div>
      </div>
    </div>

    <!-- Nothing to show: the catalogue is unreachable or empty. Same block for
         both, because the visitor's next move is the same either way. -->
    <div v-else-if="!templates.length" class="tpl-empty">
      <span class="tpl-empty__disc">
        <Palette class="h-7 w-7 text-[#2ecc71]" aria-hidden="true" />
      </span>
      <p class="mt-4 text-base font-semibold text-slate-900">
        {{ t('partners.templates.empty.title') }}
      </p>
      <p class="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600">
        {{ t('partners.templates.empty.body') }}
      </p>
      <a :href="TELEGRAM_URL" target="_blank" rel="noopener" class="tpl-empty__cta">
        {{ t('partners.templates.empty.cta') }}
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </a>
    </div>

    <div v-else ref="studioRef" class="tpl-studio" :style="studioStyle">
      <!--
        The invitation, first in the DOM and on the left: it is the payload, and
        on a phone that means you land on it rather than scrolling a catalogue to
        reach it.
      -->
      <div class="tpl-studio__stage">
        <!--
          Stage picker BESIDE the frame, not above it. Above, it was a row of
          chrome that only one of the two views paid for, so the single frame
          rendered shorter than the three beside it — the same phone, two
          different sizes depending on how you were looking at it. Moved into
          the row, it costs width (of which the single view has plenty, having
          just given up two frames) instead of height, and `framesTop` is now
          identical in both views.

          Vertical suits it anyway: three moments of one flow, read top to
          bottom, which is also the direction a guest moves through them.
        -->
        <div class="tpl-stage-row">
          <div
            v-if="showStagePicker"
            class="tpl-steps"
            role="group"
            aria-orientation="vertical"
            :aria-label="t('partners.templates.stageLabel')"
          >
            <button
              v-for="(frame, index) in visibleFrames"
              :key="frame.id"
              type="button"
              class="tpl-step"
              :class="{ 'is-active': activeFrameId === frame.id }"
              :aria-pressed="activeFrameId === frame.id"
              @click="activeFrameId = frame.id"
            >
              <span class="tpl-step__track" aria-hidden="true">
                <span class="tpl-step__dot" />
                <span v-if="index < visibleFrames.length - 1" class="tpl-step__line" />
              </span>
              <span class="tpl-step__label">{{ t(frame.labelKey) }}</span>
            </button>
          </div>

          <div ref="framesRef" class="tpl-frames" :class="framesLayoutClass">
            <PreviewFrame
              v-for="frame in visibleFrames"
              :key="frame.id"
              v-show="isSingleView ? activeFrameId === frame.id : true"
              :ref="(el) => setPreviewFrameRef(frame.id, el)"
              :label="t(frame.labelKey)"
              :fit-height="false"
              :max-width="frameMaxWidth"
              :width-override="sharedColumnWidth"
            >
              <InertIframe
                v-if="mountedFrameIds.has(frame.id)"
                :ref="(el) => setFrameRef(frame.id, el)"
                :src="frameUrl(frame)"
                :click-message="frame.clickMessage"
                @ready="onFrameReady(frame.id)"
                @languages="onFrameLanguages"
              />
              <div v-else class="tpl-frame-pending">
                <div class="tpl-spinner" />
              </div>
            </PreviewFrame>
          </div>
        </div>

        <!--
          The one thing a still screenshot cannot say, and the reason this is a
          live preview at all: the invitation is the partner's product, with the
          partner's mark on it.
        -->
        <p class="tpl-note">{{ t('partners.templates.note') }}</p>
      </div>

      <!--
        The catalogue, on the right and made of artwork. A column of names told a
        visitor nothing they could judge — a design is chosen by looking at it,
        which is why the browse-templates modal has always been a grid of preview
        images, and why this is the same card in the same 9:16 proportions.

        Two axes, both from the template's plan: event type is the filter (there
        can be eight, and one matches the customer in front of you), the plan is
        the grouping (there are two or three, and a partner wants the cheap shelf
        and the expensive shelf visible at once).
      -->
      <aside class="tpl-studio__menu">
        <div class="tpl-menu__head">
          <p class="tpl-menu__label">
            {{ t('partners.templates.menuLabel') }}
            <span class="text-slate-400">· {{ filteredTemplates.length }}</span>
          </p>

          <!-- Event-type filter (§9 dropdown). Rendered only when the catalogue
               actually spans more than one type. -->
          <div v-if="categories.length > 1" class="tpl-filter">
            <button
              type="button"
              class="tpl-filter__trigger"
              :aria-expanded="categoryMenuOpen"
              aria-haspopup="listbox"
              @click="categoryMenuOpen = !categoryMenuOpen"
            >
              <Filter class="h-3.5 w-3.5 flex-none text-slate-400" aria-hidden="true" />
              <span class="flex-1 truncate text-left">{{ activeCategoryLabel }}</span>
              <ChevronDown
                class="h-4 w-4 flex-none text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180': categoryMenuOpen }"
                aria-hidden="true"
              />
            </button>

            <div
              v-if="categoryMenuOpen"
              class="tpl-filter__scrim"
              @click="categoryMenuOpen = false"
            />
            <Transition name="tpl-dropdown">
              <div
                v-if="categoryMenuOpen"
                class="tpl-filter__menu"
                role="listbox"
                :aria-label="t('partners.templates.filterLabel')"
              >
                <button
                  v-for="option in categoryOptions"
                  :key="option.value"
                  type="button"
                  role="option"
                  :aria-selected="option.value === activeCategory"
                  class="tpl-filter__item"
                  :class="{ 'is-active': option.value === activeCategory }"
                  @click="selectCategory(option.value)"
                >
                  <span
                    class="tpl-filter__dot"
                    :style="{ backgroundColor: option.color }"
                    aria-hidden="true"
                  />
                  <span class="flex-1 truncate text-left">{{ option.label }}</span>
                  <span class="tpl-filter__count">{{ option.count }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <div class="tpl-menu__scroll">
          <section
            v-for="group in groupedTemplates"
            :key="group.key"
            class="tpl-menu-group"
            :aria-label="group.label"
          >
            <h2 class="tpl-menu-group__head">
              {{ group.label }}
              <span class="text-slate-400">· {{ group.templates.length }}</span>
            </h2>

            <div class="tpl-card-grid" role="listbox" :aria-label="group.label">
              <button
                v-for="template in group.templates"
                :key="template.id"
                type="button"
                role="option"
                :aria-selected="template.id === activeTemplateId"
                class="tpl-card"
                :class="{ 'is-active': template.id === activeTemplateId }"
                @click="selectTemplate(template.id)"
              >
                <!-- 9:16, the proportion the artwork is authored at (1080x1920)
                     and the same one the browse modal uses. -->
                <span class="tpl-card__art">
                  <img
                    v-if="thumbnailFor(template)"
                    :src="thumbnailFor(template)!"
                    :alt="template.name"
                    loading="lazy"
                    class="tpl-card__img"
                    @error="onThumbnailError(template.id)"
                  />
                  <span v-else class="tpl-card__fallback" aria-hidden="true">
                    <ImageOff class="h-7 w-7" />
                  </span>

                  <!-- Chosen. A tick disc rather than a filled card: the artwork
                       is the thing being judged and must not be tinted. -->
                  <span
                    v-if="template.id === activeTemplateId"
                    class="tpl-card__tick"
                    aria-hidden="true"
                  >
                    <Check class="h-3.5 w-3.5" />
                  </span>

                  <!-- Name over a scrim on artwork, on a light strip where there
                       is none — so the label is legible either way. -->
                  <span class="tpl-card__label" :class="{ 'is-plain': !thumbnailFor(template) }">
                    <span class="tpl-card__name">{{ template.name }}</span>
                    <span v-if="!activeCategory && categoryNameFor(template)" class="tpl-card__meta">
                      {{ categoryNameFor(template) }}
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The public design catalogue.
 *
 * The Design Studio's live preview with the event and the editing taken out:
 * this page's audience is people with no account, so there is nothing to sign
 * in to and nothing of theirs to render. It embeds the same
 * <PreviewFrame>/<InertIframe> pair against a route that draws a bundled sample
 * invitation instead (TemplateShowcasePreviewFrameView + useDemoShowcase), and
 * resolves which stages exist through the same renderer registry — so a stage
 * shown here is a stage a guest gets.
 *
 * A page rather than a section on `/partners`, which is where it started: three
 * phone frames plus a catalogue is a full screen's worth of furniture, and it
 * was squeezing both into the middle of a page whose job is to make an argument.
 * The offer links here instead.
 *
 * It renders WITHOUT `MainLayout`, deliberately. The top bar, the mobile tab bar
 * and the contact FAB all belong to a product a visitor here has no account for,
 * and what they cost is vertical space — which is the one thing a page of
 * phone-shaped frames is short of. A single back link to `/partners` is all the
 * navigation it needs. `MainLayout` is pure chrome (no provides, no side
 * effects), so dropping it costs nothing else.
 *
 * Switching templates never reloads a frame. The page fetches the chosen
 * template's public assets ONCE and pushes them into every mounted frame over
 * the preview bridge (`preview-template`), which is the same live try-on the
 * templates modal uses. Changing an <iframe>'s `src` would re-navigate it, and
 * with three frames that is three full app boots per click.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Filter,
  ImageOff,
  LayoutGrid,
  Languages,
  Palette,
  Smartphone,
} from 'lucide-vue-next'
import PreviewFrame from '@/components/showcase-preview/PreviewFrame.vue'
import InertIframe from '@/components/showcase-preview/InertIframe.vue'
import {
  resolvePreviewRenderer,
  type PreviewFrameDescriptor,
} from '@/components/showcase-preview/renderers/resolvePreviewRenderer'
import { eventTemplateService, packagePlanService } from '@/services/api'
import type { PackagePlan, PublicEventTemplate } from '@/services/api'
// The showcase's own TemplateAssets, not the API types' flat one: this is the
// shape the preview bridge and the renderer registry both speak.
import type { TemplateAssets } from '@/composables/useEventShowcase'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t, locale } = useAppLanguage()

const TELEGRAM_URL = 'https://t.me/goeventkh'

// ---------------------------------------------------------------------------
// The catalogue
// ---------------------------------------------------------------------------

const loading = ref(true)
const templates = ref<PublicEventTemplate[]>([])
const plans = ref<PackagePlan[]>([])
const activeTemplateId = ref<number | null>(null)

/** Enough pages to cover a catalogue that has grown, without an unbounded walk. */
const MAX_CATALOGUE_PAGES = 4

/**
 * Approved, and V1.
 *
 * The preview renderer registry is V1-only today (see resolvePreviewRenderer),
 * so a V2 scroll-story template drawn through V1's cover/transition/main frames
 * would be a misrepresentation, not a preview. Absent means V1 — the field is
 * new, and every template that predates it is one.
 */
const isPreviewable = (template: PublicEventTemplate): boolean =>
  template.status === 'approved' && template.showcase_template_version !== 'v2'

const loadCatalogue = async () => {
  try {
    const collected: PublicEventTemplate[] = []
    for (let page = 1; page <= MAX_CATALOGUE_PAGES; page++) {
      const response = await eventTemplateService.listPublicTemplates({ page })
      if (!response.success || !response.data) break
      collected.push(...(response.data.results ?? []))
      if (!response.data.next) break
    }
    templates.value = collected.filter(isPreviewable)
  } catch {
    templates.value = []
  } finally {
    loading.value = false
  }
}

/**
 * The plans, which is where both of the catalogue's axes come from: a template
 * points at a plan, and a plan carries the event category and the tier name.
 * Best-effort — without them the list still renders, ungrouped.
 */
const loadPlans = async () => {
  try {
    const response = await packagePlanService.listPlans()
    if (!response.success || !response.data) return
    const data = response.data as PackagePlan[] | { results?: PackagePlan[] }
    plans.value = Array.isArray(data) ? data : (data.results ?? [])
  } catch {
    plans.value = []
  }
}

const planFor = (template: PublicEventTemplate): PackagePlan | undefined =>
  plans.value.find((plan) => plan.id === template.package_plan)

const categoryNameFor = (template: PublicEventTemplate): string =>
  planFor(template)?.category?.name ?? ''

// ---------------------------------------------------------------------------
// Axis 1 — event type, as a filter
// ---------------------------------------------------------------------------

const activeCategory = ref('')
const categoryMenuOpen = ref(false)

interface CategoryOption {
  value: string
  label: string
  count: number
  color: string
}

/** Built from the templates, not from the plan list: a category nobody has a
 *  design for is a filter that can only ever empty the page. */
const categories = computed<CategoryOption[]>(() => {
  const byName = new Map<string, CategoryOption>()
  for (const template of templates.value) {
    const category = planFor(template)?.category
    if (!category?.name) continue
    const existing = byName.get(category.name)
    if (existing) existing.count += 1
    else
      byName.set(category.name, {
        value: category.name,
        label: category.name,
        count: 1,
        color: category.color || '#94a3b8',
      })
  }
  return [...byName.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const categoryOptions = computed<CategoryOption[]>(() => [
  {
    value: '',
    label: t('partners.templates.allCategories'),
    count: templates.value.length,
    color: '#cbd5e1',
  },
  ...categories.value,
])

const activeCategoryLabel = computed(
  () =>
    categoryOptions.value.find((option) => option.value === activeCategory.value)?.label ??
    t('partners.templates.allCategories'),
)

const filteredTemplates = computed(() =>
  activeCategory.value
    ? templates.value.filter((template) => categoryNameFor(template) === activeCategory.value)
    : templates.value,
)

const selectCategory = (value: string) => {
  activeCategory.value = value
  categoryMenuOpen.value = false
}

// ---------------------------------------------------------------------------
// Axis 2 — plan, as the grouping
// ---------------------------------------------------------------------------

/**
 * Group by the plan's own NAME, never by a normalised "basic/standard" tier.
 * Credits are plan-scoped and not interchangeable, so "Free Basic" and "Basic"
 * are different products at different prices; folding them into one heading
 * would tell a partner they can spend one on the other.
 */
const planRank = (name: string): number => {
  const lower = name.toLowerCase()
  if (lower.includes('free')) return 0
  if (lower.includes('basic')) return 1
  if (lower.includes('standard')) return 2
  return 3
}

interface TemplateGroup {
  key: string
  label: string
  templates: PublicEventTemplate[]
}

const groupedTemplates = computed<TemplateGroup[]>(() => {
  const byPlan = new Map<string, TemplateGroup>()
  for (const template of filteredTemplates.value) {
    const label = planFor(template)?.name || t('partners.templates.otherPlan')
    const group = byPlan.get(label)
    if (group) group.templates.push(template)
    else byPlan.set(label, { key: label, label, templates: [template] })
  }
  return [...byPlan.values()].sort(
    (a, b) => planRank(a.label) - planRank(b.label) || a.label.localeCompare(b.label),
  )
})

/**
 * The catalogue in the order it is actually shown — grouped by plan, not in the
 * order the API returned it.
 *
 * This is what "the first design" means to a visitor, and the two are not the
 * same list: the API's first template belongs to the Standard group, which sits
 * three shelves down. Seeding the selection from the API order opened the page
 * previewing a design whose card was scrolled far out of sight, with no visible
 * tick anywhere in the catalogue.
 */
const orderedTemplates = computed(() => groupedTemplates.value.flatMap((group) => group.templates))

// Filtering can retire the design on screen; land on the first one that survived
// rather than previewing something no longer in the list.
watch(orderedTemplates, (list) => {
  if (!list.length) return
  if (!list.some((template) => template.id === activeTemplateId.value)) {
    selectTemplate(list[0].id)
  }
})

// ---------------------------------------------------------------------------
// Thumbnails
// ---------------------------------------------------------------------------

/**
 * A stored `preview_image` is not a promise that the file is still there — the
 * gradient placeholder beside it is already the right answer for a template
 * with none, so a broken one falls back to it rather than leaving the browser's
 * broken-image glyph in a list of designs.
 */
const brokenThumbnails = ref(new Set<number>())

const thumbnailFor = (template: PublicEventTemplate): string | null =>
  template.preview_image && !brokenThumbnails.value.has(template.id)
    ? template.preview_image
    : null

const onThumbnailError = (templateId: number) => {
  brokenThumbnails.value = new Set(brokenThumbnails.value).add(templateId)
}

// ---------------------------------------------------------------------------
// The selected template's own assets — fetched once here, pushed to every frame
// ---------------------------------------------------------------------------

const activeTemplateData = ref<TemplateAssets | null>(null)
const templateDataCache = new Map<number, TemplateAssets>()

const loadTemplateData = async (templateId: number) => {
  const cached = templateDataCache.get(templateId)
  if (cached) {
    activeTemplateData.value = cached
    pushTemplateToFrames()
    return
  }
  try {
    const response = await eventTemplateService.getPublicTemplateAssets(templateId)
    // Wire shape is `{ template_data: {...} }`, not the flat TemplateAssets the
    // service's type declares — same as every other caller of this endpoint.
    const templateData = (response.data as unknown as { template_data?: TemplateAssets } | null)
      ?.template_data
    if (!response.success || !templateData) return
    templateDataCache.set(templateId, templateData)
    // A slow response for a design the visitor has already clicked past must not
    // overwrite the one they are looking at now.
    if (activeTemplateId.value !== templateId) return
    activeTemplateData.value = templateData
    pushTemplateToFrames()
  } catch {
    // Non-fatal — the frames keep showing whatever they last had.
  }
}

const selectTemplate = (templateId: number) => {
  if (templateId === activeTemplateId.value) return
  activeTemplateId.value = templateId
  void loadTemplateData(templateId)
}

// ---------------------------------------------------------------------------
// Which stages this template has — the same registry the studio resolves from,
// fed the template's own assets and stage modes.
// ---------------------------------------------------------------------------

const rendererContext = computed(() => {
  const assets = activeTemplateData.value?.assets
  return {
    // The sample invitation ships no film of its own, so a filmed middle beat is
    // the template's to provide.
    event: { event_video: null },
    templateAssets: {
      standard_cover_video: assets?.standard_cover_video ?? null,
      standard_transition_video: assets?.standard_transition_video ?? null,
      standard_background_video: assets?.standard_background_video ?? null,
      stage_modes: activeTemplateData.value?.stage_modes ?? null,
    },
    // Someone judging a template wants to see every stage it defines; the sample
    // does carry a featured photograph, so this is simply true.
    hasFeaturedPhoto: true,
    canEdit: false,
  }
})

const renderer = computed(() => resolvePreviewRenderer(rendererContext.value))

const visibleFrames = computed(() =>
  renderer.value.frames.filter((frame: PreviewFrameDescriptor) =>
    frame.isVisible ? frame.isVisible(rendererContext.value) : true,
  ),
)

const activeFrameId = ref<string>('cover')

// A template swap can retire the stage being looked at (an animated middle beat
// and a filmed one are mutually exclusive).
watch(visibleFrames, (frames) => {
  if (frames.length && !frames.some((frame) => frame.id === activeFrameId.value)) {
    activeFrameId.value = frames[0].id
  }
})

// ---------------------------------------------------------------------------
// View mode
// ---------------------------------------------------------------------------

const VIEW_MODES = [
  { value: 'single' as const, icon: Smartphone, labelKey: 'partners.templates.viewSingle' },
  { value: 'multiple' as const, icon: LayoutGrid, labelKey: 'partners.templates.viewAll' },
]

const viewMode = ref<'single' | 'multiple'>('multiple')

// Below `lg` there is only ever one frame: three phones side by side on a phone
// would each be ~100px wide, which previews nothing. Tracked as media state
// rather than a CSS-only hide, so the frames that aren't shown are never mounted.
const isNarrow = ref(false)
let narrowQuery: MediaQueryList | null = null
const onNarrowChange = (event: MediaQueryListEvent | MediaQueryList) => {
  isNarrow.value = event.matches
}

const isSingleView = computed(() => isNarrow.value || viewMode.value === 'single')

const setViewMode = (mode: 'single' | 'multiple') => {
  viewMode.value = mode
}

const framesLayoutClass = computed(() =>
  isSingleView.value ? 'tpl-frames--single' : `tpl-frames--cols-${visibleFrames.value.length}`,
)

/**
 * Whether one-vs-all is a choice worth offering. Never on a narrow screen,
 * where `isSingleView` is forced regardless of what the segment says — a
 * control that highlights and then does nothing is worse than no control.
 */
const showLayoutSegments = computed(() => !isNarrow.value && visibleFrames.value.length > 1)

/** Only one frame on screen, and somewhere else to go from it. */
const showStagePicker = computed(() => isSingleView.value && visibleFrames.value.length > 1)

/** The pill is a container: with nothing to put in it, it is a stray blob. */
const hasViewControls = computed(
  () =>
    !loading.value &&
    templates.value.length > 0 &&
    (showLayoutSegments.value || frameLanguages.value.length > 1),
)

// ---------------------------------------------------------------------------
// Frame sizing
// ---------------------------------------------------------------------------

/** Room kept below the phones for the sample-content note. */
const FRAME_BOTTOM_RESERVE = 72
const FRAME_ASPECT = 390 / 844
const NATIVE_FRAME_WIDTH = 390
/** Never so small that the invitation stops being readable; the page scrolls. */
const MIN_FRAME_WIDTH = 240

const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 900)
/** Where the phones start, in DOCUMENT coordinates — see frameMaxWidth. */
const framesTop = ref(320)

/**
 * How large a frame may render: as tall as fits between the page header and the
 * bottom of the window, capped at the phone's native size.
 *
 * Deliberately not `PreviewFrame`'s own height fit, which measures the frame's
 * distance from the top of the *viewport* at the moment it mounts — a property
 * of where the visitor happened to have scrolled, stable enough inside a fixed
 * tab panel but not on a page. Measuring in document coordinates instead gives
 * the same answer at any scroll position, and this page opens at the top, which
 * is where the fit has to be right.
 */
const frameMaxWidth = computed(() =>
  Math.max(
    MIN_FRAME_WIDTH,
    Math.min(
      NATIVE_FRAME_WIDTH,
      Math.round((viewportHeight.value - framesTop.value - FRAME_BOTTOM_RESERVE) * FRAME_ASPECT),
    ),
  ),
)

const FRAMES_GAP_PX = 24

const framesRef = ref<HTMLElement | null>(null)
const framesWidth = ref(0)
let framesObserver: ResizeObserver | null = null

/**
 * Where the studio starts, in document coordinates.
 *
 * Published to CSS so the catalogue column can be exactly as tall as the space
 * below the header. `100vh` alone is too tall by the header's own height, which
 * left the page 96px longer than the window at rest — for a screen whose whole
 * point is that everything is visible at once, that is a scrollbar bought for
 * nothing. The header's height is not a constant either: it wraps to two lines
 * below `lg` and the subtitle re-wraps with the window.
 */
const studioRef = ref<HTMLElement | null>(null)
const studioTop = ref(96)

const studioStyle = computed(() => ({
  '--tpl-studio-top': `${studioTop.value}px`,
  // Published so the single-frame row can be exactly as wide as the phone in
  // it — see .tpl-frames--single. Safe to feed back into layout because
  // `frameMaxWidth` is derived from the window's height, never from this width,
  // so there is no measurement loop.
  '--tpl-frame-w': `${frameMaxWidth.value}px`,
}))

/** Both measurements the frames need, taken from the container that holds them. */
const measureFrameBox = (element: HTMLElement) => {
  framesWidth.value = element.clientWidth
  framesTop.value = element.getBoundingClientRect().top + window.scrollY
  if (studioRef.value) {
    studioTop.value = studioRef.value.getBoundingClientRect().top + window.scrollY
  }
}

watch(framesRef, (element) => {
  framesObserver?.disconnect()
  framesObserver = null
  if (!element) return
  measureFrameBox(element)
  framesObserver = new ResizeObserver(() => measureFrameBox(element))
  framesObserver.observe(element)
})

/**
 * How much width one frame gets, measured once here and handed to every frame.
 *
 * Passed in single view too, not only in the row. `PreviewFrame` otherwise
 * measures its own wrapper, and this grid centres its items (`justify-items`),
 * which means a frame is shrink-wrapped around its own content — so measuring it
 * asks the frame how wide it is in order to decide how wide it should be, and it
 * stays at whatever width it happened to have.
 */
const sharedColumnWidth = computed(() => {
  const cols = isSingleView.value ? 1 : Math.max(visibleFrames.value.length, 1)
  return Math.max((framesWidth.value - FRAMES_GAP_PX * (cols - 1)) / cols, 0)
})

type PreviewFrameInstance = InstanceType<typeof PreviewFrame>
const previewFrameRefs = new Map<string, PreviewFrameInstance>()

const setPreviewFrameRef = (id: string, el: unknown) => {
  if (el) previewFrameRefs.set(id, el as PreviewFrameInstance)
  else previewFrameRefs.delete(id)
}

// A frame can't observe a layout change its parent makes, so re-fit on the ones
// that change how much room each frame has.
//
// `nextTick`, not `requestAnimationFrame`: switching views changes `maxWidth`
// too, and a frame re-measuring before Vue has patched that prop caps itself at
// the width it was allowed in the *previous* view and stays there.
const remeasure = () => {
  void nextTick(() => {
    for (const instance of previewFrameRefs.values()) instance.measure()
  })
}
watch([isSingleView, activeFrameId, frameMaxWidth], remeasure)

const onWindowResize = () => {
  viewportHeight.value = window.innerHeight
  if (framesRef.value) measureFrameBox(framesRef.value)
  remeasure()
}

// ---------------------------------------------------------------------------
// Frames: mounted one at a time
//
// Each frame is a full boot of the app in its own browsing context. Three at
// once race each other for the network and the main thread and NONE of them
// appears; in order, the first is up in a fraction of the time and the rest are
// cheaper for following it.
// ---------------------------------------------------------------------------

const mountedFrameIds = ref(new Set<string>())
const FRAME_HANDSHAKE_TIMEOUT_MS = 4000
let frameMountTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Which frames are worth booting.
 *
 * On a wide screen, all of them: even in single view the other two are one dot
 * click away, and having them warm is what makes that click instant. On a phone,
 * only the one on screen — the others are hidden behind the same dots, and two
 * extra boots of the whole app is not a cost to put on a visitor who may never
 * tap them. They come up on demand instead.
 */
const mountQueue = computed(() =>
  isNarrow.value
    ? visibleFrames.value.filter((frame) => frame.id === activeFrameId.value)
    : visibleFrames.value,
)

const mountNextFrame = () => {
  if (frameMountTimer) clearTimeout(frameMountTimer)
  frameMountTimer = null

  const pending = mountQueue.value.filter((frame) => !mountedFrameIds.value.has(frame.id))
  if (!pending.length) return

  const next = pending.find((frame) => frame.id === activeFrameId.value) ?? pending[0]
  mountedFrameIds.value = new Set(mountedFrameIds.value).add(next.id)
  // Only a safety valve: a frame that fails before its handshake must not stall
  // the queue for good.
  frameMountTimer = setTimeout(mountNextFrame, FRAME_HANDSHAKE_TIMEOUT_MS)
}

// A template swap can bring a stage into being (a filmed middle beat appearing
// where an animated one was), and on a phone a dot tap asks for a frame that was
// never booted. Either way the queue has something new to do.
watch(mountQueue, () => mountNextFrame())

const frameRefs = new Map<string, InstanceType<typeof InertIframe>>()

const setFrameRef = (id: string, el: unknown) => {
  if (el) {
    frameRefs.set(id, el as InstanceType<typeof InertIframe>)
    return
  }
  frameRefs.delete(id)
  // A stage can be retired by a template swap and come back on the next one.
  // Forget both the frozen URL and the fact it was mounted, so it comes back
  // built from the language currently on screen rather than the one it left in.
  frameSrcCache.delete(id)
  const next = new Set(mountedFrameIds.value)
  if (next.delete(id)) mountedFrameIds.value = next
}

/**
 * A frame's `src`, computed once and then frozen for that frame's lifetime.
 *
 * Two things vary here that must NOT reach the URL after the fact: the template
 * (pushed over the bridge) and the language (`set-language`, likewise). The
 * language is seeded into the first URL because a frame that mounts already
 * knowing it paints correctly without waiting for a message — but re-deriving
 * the URL when it changes would alter an `<iframe>`'s `src`, and that always
 * re-navigates it. The template is left out entirely: it is the one thing a
 * visitor changes repeatedly, and the bridge handles a push that lands before
 * the frame's own data (see pendingStagedPreview).
 */
const frameSrcCache = new Map<string, string>()

const frameUrl = (frame: PreviewFrameDescriptor): string => {
  const cached = frameSrcCache.get(frame.id)
  if (cached) return cached
  const params = new URLSearchParams({ stage: frame.id, lang: previewLanguage.value })
  const url = `/template-showcase-preview-frame?${params.toString()}`
  frameSrcCache.set(frame.id, url)
  return url
}

const pushTemplateToFrames = () => {
  const templateData = activeTemplateData.value
  if (!templateData) return
  for (const frame of frameRefs.values()) frame.postTemplatePreview(templateData)
}

/**
 * A frame's listener is now live — the only safe moment to hand it anything,
 * since postMessage does not queue. It gets the current template, and the queue
 * moves on to the next frame.
 */
const onFrameReady = (frameId: string) => {
  const templateData = activeTemplateData.value
  if (templateData) frameRefs.get(frameId)?.postTemplatePreview(templateData)
  mountNextFrame()
}

// ---------------------------------------------------------------------------
// Language. The page proposes; the frames report what they could render, and the
// toggle follows the report — see PartnerTemplatePreview for the same rule.
// ---------------------------------------------------------------------------

const previewLanguage = ref<string>(locale.value)
const frameLanguages = ref<string[]>([])

const onFrameLanguages = (languages: string[], current: string) => {
  if (languages.length) frameLanguages.value = languages
  if (current) previewLanguage.value = current
}

const cycleLanguage = () => {
  if (frameLanguages.value.length < 2) return
  const index = frameLanguages.value.indexOf(previewLanguage.value)
  const next = frameLanguages.value[(index + 1) % frameLanguages.value.length]
  previewLanguage.value = next
  // In place, over the bridge — never by touching an iframe's `src`. The frames
  // re-report, and a frame that cannot honour it puts the toggle back.
  for (const frame of frameRefs.values()) frame.postSetLanguage(next)
}

// ---------------------------------------------------------------------------

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') categoryMenuOpen.value = false
}

onMounted(() => {
  narrowQuery = window.matchMedia('(max-width: 1023px)')
  onNarrowChange(narrowQuery)
  narrowQuery.addEventListener('change', onNarrowChange)
  window.addEventListener('resize', onWindowResize)
  document.addEventListener('keydown', onKeydown)

  void loadPlans()
  void loadCatalogue().then(() => {
    // The first CARD, not the first row of the response — see orderedTemplates.
    const first = orderedTemplates.value[0]
    if (first) selectTemplate(first.id)
    mountNextFrame()
  })
})

onUnmounted(() => {
  if (frameMountTimer) clearTimeout(frameMountTimer)
  framesObserver?.disconnect()
  narrowQuery?.removeEventListener('change', onNarrowChange)
  window.removeEventListener('resize', onWindowResize)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* One curve for everything that enters, one for everything that moves. The
   built-in CSS easings are too weak to read as intentional at these durations. */
.tpl-page {
  --tpl-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  /* The catalogue column. In px, not rem: the app runs a reduced root font at
     laptop widths, and this column holding two 9:16 cards is exactly where that
     shrink is least welcome. */
  --tpl-menu-w: 356px;

  min-height: 100vh;
  /* The page paints its own ground now that it has no app shell around it. */
  background: linear-gradient(
    to right,
    rgba(46, 204, 113, 0.03),
    #fff 45%,
    rgba(30, 144, 255, 0.03)
  );
  padding: 1rem 1rem 2rem;
}

@media (min-width: 640px) {
  .tpl-page {
    padding: 1.25rem 1.5rem 2.5rem;
  }
}

@media (min-width: 1024px) {
  .tpl-page {
    /* Full bleed. The frames are the review surface, so every pixel not spent
       on chrome goes to them — including the bottom pad, which a page that
       fits its window has no scroll runway to need. */
    padding: 1.25rem 1.75rem 1rem;
  }
}

/* --------------------------------------------------------------------------
   Header — a back link and a title, and nothing else
   -------------------------------------------------------------------------- */

/* One bar: navigation at the leading edge, view controls at the trailing one,
   the headline between them. On a phone the headline wraps to a second line and
   the two controls keep the first — which is the row people reach for, and the
   only one that has to survive a 390px screen. */
.tpl-page__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

@media (min-width: 1024px) {
  .tpl-page__head {
    /* The headline sits beside the back link rather than under it: two stacked
       blocks cost ~40px of height that the phones want, and there is width to
       spare now that the page is full bleed. */
    flex-wrap: nowrap;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
  }
}

.tpl-back {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  padding: 0.4375rem 0.875rem 0.4375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  transition:
    color 200ms var(--tpl-ease-out),
    border-color 200ms var(--tpl-ease-out),
    background-color 200ms var(--tpl-ease-out),
    transform 160ms var(--tpl-ease-out);
}

.tpl-back:hover {
  color: rgb(15 23 42);
  border-color: rgb(203 213 225);
  background: rgb(248 250 252);
}

.tpl-back:active {
  transform: scale(0.97);
}

.tpl-back:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgb(186 230 253);
}

.tpl-page__headline {
  /* Second row on a phone: `order` moves it past the two controls, and a full
     basis makes it claim a line of its own. */
  order: 3;
  flex-basis: 100%;
  min-width: 0;
}

@media (min-width: 1024px) {
  .tpl-page__headline {
    order: 0;
    flex: 1 1 auto;
    flex-basis: auto;
    display: flex;
    align-items: baseline;
    gap: 0.875rem;
  }
}

.tpl-page__title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgb(15 23 42);
  text-wrap: balance;
}

@media (min-width: 640px) {
  .tpl-page__title {
    font-size: 1.5rem;
  }
}

/* Desktop only. Stacked on a phone it runs to three lines, and every one of
   them pushes the invitation further below the fold — on a screen where the
   catalogue already has to be seen above it. The title carries the idea, and
   the note under the frames carries the caveat. */
.tpl-page__subtitle {
  display: none;
}

@media (min-width: 1024px) {
  .tpl-page__subtitle {
    display: block;
    /* Beside a heading it is a caption, and a caption that runs the width of a
       1900px screen is unreadable. */
    max-width: 34rem;
    border-left: 1px solid rgb(226 232 240);
    padding-left: 0.875rem;
    font-size: 0.875rem;
    line-height: 1.6;
    color: rgb(100 116 139);
  }
}

/* --------------------------------------------------------------------------
   The studio
   -------------------------------------------------------------------------- */

.tpl-studio {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .tpl-studio {
    /* Catalogue first, then the frames, which take everything it does not. */
    grid-template-columns: minmax(0, var(--tpl-menu-w)) minmax(0, 1fr);
    gap: 1.75rem;
    align-items: start;
  }
}

.tpl-studio__stage {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  /* Second when stacked. The catalogue is bounded to ~250px, so putting it
     first leaves the top of the invitation on screen underneath it — tap a card
     and you watch it change. Frames first would put the catalogue an entire
     phone-height below, so every choice would be made blind. */
  order: 2;
}

.tpl-studio__menu {
  min-width: 0;
  order: 1;
}

@media (min-width: 1024px) {
  /* Side by side, the same order as stacked: choose on the left, look on the
     right. Keeping one reading direction across both layouts is what stops the
     page feeling like two different screens. */
  .tpl-studio__stage {
    order: 2;
  }

  .tpl-studio__menu {
    order: 1;
    position: sticky;
    top: 1rem;
    /* Its own top, measured — see studioTop. Falls back to a guess for the
       frame before the measurement lands. */
    max-height: calc(100vh - var(--tpl-studio-top, 6rem) - 1rem);
    display: flex;
    flex-direction: column;
  }
}

.tpl-menu__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.tpl-menu__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

/* --- Event-type filter (§9) ---------------------------------------------- */

.tpl-filter {
  position: relative;
}

.tpl-filter__trigger {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  max-width: 11rem;
  transition:
    border-color 200ms var(--tpl-ease-out),
    background-color 200ms var(--tpl-ease-out),
    transform 160ms var(--tpl-ease-out);
}

.tpl-filter__trigger:hover {
  border-color: rgb(110 231 183);
  background: rgb(236 253 245);
}

.tpl-filter__trigger:active {
  transform: scale(0.97);
}

.tpl-filter__scrim {
  position: fixed;
  inset: 0;
  z-index: 90;
}

.tpl-filter__menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 100;
  min-width: 13rem;
  max-height: 22rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 0.75rem;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  box-shadow:
    0 20px 25px -5px rgba(15, 23, 42, 0.12),
    0 8px 10px -6px rgba(15, 23, 42, 0.08);
  /* Anchored under its trigger's trailing edge, so it scales out of the control
     that opened it rather than out of its own middle. */
  transform-origin: top right;
}

.tpl-dropdown-enter-active,
.tpl-dropdown-leave-active {
  transition:
    opacity 180ms var(--tpl-ease-out),
    transform 180ms var(--tpl-ease-out);
}

/* Never from scale(0): nothing in the real world appears out of nothing. */
.tpl-dropdown-enter-from,
.tpl-dropdown-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}

.tpl-filter__item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  transition: background-color 200ms var(--tpl-ease-out);
}

.tpl-filter__item:hover {
  background: rgb(248 250 252);
}

.tpl-filter__item.is-active {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: #fff;
}

.tpl-filter__dot {
  height: 0.5rem;
  width: 0.5rem;
  flex: none;
  border-radius: 9999px;
}

.tpl-filter__item.is-active .tpl-filter__dot {
  background: rgba(255, 255, 255, 0.85) !important;
}

.tpl-filter__count {
  font-size: 0.6875rem;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

/* --- The catalogue -------------------------------------------------------- */

.tpl-menu__scroll {
  /* Bounded on a phone so the catalogue cannot bury the invitation under it;
     on desktop it fills the sticky column instead (below). */
  max-height: 21rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
  /* Inset, not a negative margin paying itself back: a scroll container clips
     to its padding box, so any card sitting flush against the edge loses its
     selection ring and hover lift to the clip. Symmetric, so the two columns
     are the same width. */
  padding: 0.25rem 0.5rem;
}

@media (min-width: 1024px) {
  .tpl-menu__scroll {
    flex: 1;
    min-height: 0;
    max-height: none;
  }
}

.tpl-menu__scroll::-webkit-scrollbar {
  width: 6px;
}

.tpl-menu__scroll::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 3px;
}

.tpl-menu__scroll::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

.tpl-menu-group + .tpl-menu-group {
  margin-top: 1.25rem;
}

.tpl-menu-group__head {
  position: sticky;
  top: -0.25rem;
  z-index: 2;
  margin-bottom: 0.5rem;
  padding: 0.375rem 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(100 116 139);
  /* Opaque enough that cards do not read through it as they pass under. */
  background: rgba(252, 253, 254, 0.94);
  backdrop-filter: blur(8px);
}

.tpl-card-grid {
  display: grid;
  /* Three up on a phone, four once there is room, and the two the sidebar was
     designed around from `lg`. */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.625rem;
}

@media (min-width: 640px) {
  .tpl-card-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }
}

@media (min-width: 1024px) {
  .tpl-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* --- The card ------------------------------------------------------------- */

.tpl-card {
  display: block;
  width: 100%;
  border-radius: 0.875rem;
  background: #fff;
  transition:
    box-shadow 200ms var(--tpl-ease-out),
    transform 200ms var(--tpl-ease-out);
  /* A ring, not a border: it does not participate in layout, so the artwork
     stays exactly the same size selected or not. */
  box-shadow: 0 0 0 1px rgba(203, 213, 225, 0.8);
}

/* Hover-lift only where there is a real pointer. On touch, :hover fires on tap
   and sticks. */
@media (hover: hover) and (pointer: fine) {
  .tpl-card:hover {
    box-shadow:
      0 0 0 1px rgb(203 213 225),
      0 12px 20px -8px rgba(15, 23, 42, 0.18);
    transform: translateY(-2px);
  }
}

.tpl-card:active {
  transform: scale(0.985);
}

.tpl-card:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 4px rgb(56 189 248);
}

.tpl-card.is-active {
  box-shadow:
    0 0 0 2px #1e90ff,
    0 10px 20px -8px rgba(30, 144, 255, 0.35);
}

.tpl-card__art {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 0.875rem;
  /* The proportion the artwork is authored at: 1080x1920. */
  aspect-ratio: 9 / 16;
  background: linear-gradient(to bottom right, rgb(241 245 249), rgb(226 232 240));
}

.tpl-card__img {
  height: 100%;
  width: 100%;
  object-fit: cover;
  transition: transform 500ms var(--tpl-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .tpl-card:hover .tpl-card__img {
    transform: scale(1.04);
  }
}

.tpl-card__fallback {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  color: rgb(203 213 225);
}

.tpl-card__tick {
  position: absolute;
  top: 0.375rem;
  left: 0.375rem;
  z-index: 2;
  display: flex;
  height: 1.375rem;
  width: 1.375rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #1e90ff;
  color: #fff;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.9),
    0 4px 6px -1px rgba(15, 23, 42, 0.2);
}

.tpl-card__label {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 1;
  padding: 1.75rem 0.5rem 0.4375rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.35) 55%, transparent);
  color: #fff;
  text-align: left;
}

/* No artwork to sit over — a scrim on a pale placeholder is a grey smear, so
   the strip becomes a light one with dark type instead. */
.tpl-card__label.is-plain {
  padding-top: 0.4375rem;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  color: rgb(15 23 42);
}

.tpl-card__name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.6875rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.tpl-card__label.is-plain .tpl-card__name {
  text-shadow: none;
}

.tpl-card__meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.625rem;
  opacity: 0.8;
}

/* --- The stage ------------------------------------------------------------ */

/* §5 segmented control: one glass pill, gradient on the chosen segment.
   `margin-left: auto` is what pins it to the header's trailing corner — on a
   phone against the back link, on desktop against the headline that grew into
   the space between them. */
.tpl-seg {
  display: inline-flex;
  flex: none;
  margin-left: auto;
  align-items: center;
  gap: 0.125rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.75);
  padding: 0.25rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.tpl-seg__btn {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(71 85 105);
  transition:
    background-color 250ms var(--tpl-ease-out),
    color 250ms var(--tpl-ease-out),
    box-shadow 250ms var(--tpl-ease-out),
    transform 160ms var(--tpl-ease-out);
}

.tpl-seg__btn:hover {
  color: rgb(30 41 59);
}

.tpl-seg__btn:active {
  transform: scale(0.97);
}

.tpl-seg__btn.is-active {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.2);
}

.tpl-seg__btn--lang {
  letter-spacing: 0.05em;
}

.tpl-seg__divider {
  width: 1px;
  height: 1.25rem;
  background: rgb(226 232 240);
}

/* The row the picker and the frame share. Centred, so the picker reads as a
   small index alongside the phone rather than a heading stranded at its top. */
.tpl-stage-row {
  display: flex;
  width: 100%;
  min-width: 0;
  /* Top-aligned while the frame is taller than the window: centred on a phone
     put the picker halfway down a 520px phone, which is below the fold — you
     would scroll past the thing you were choosing to reach the chooser. */
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
}

@media (min-width: 640px) {
  .tpl-stage-row {
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  /* Here the whole frame is on screen, so the picker reads best as a small
     index level with the middle of it rather than clinging to its top edge. */
  .tpl-stage-row {
    align-items: center;
  }
}

/* Three up, the frames claim the whole row and space themselves across it. */
.tpl-stage-row > .tpl-frames {
  flex: 1 1 auto;
  min-width: 0;
}

/* One up, they do not. The picker and the phone are a single object and are
   centred together — left to claim the row, the frames box centred its one
   phone inside ~1100px and stranded the picker a third of a screen away from
   the thing it controls. Sized to the phone instead (see --tpl-frame-w). */
.tpl-stage-row > .tpl-frames--single {
  flex: 0 0 auto;
  width: var(--tpl-frame-w, 340px);
  max-width: 100%;
}

.tpl-steps {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: stretch;
  /* No gap: the rows' own padding does the spacing, which is what lets each
     connector run exactly from one dot's centre to the next one's. */
  gap: 0;
}

.tpl-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0;
  text-align: left;
}

.tpl-step__track {
  position: relative;
  display: flex;
  flex: none;
  /* Stretched to the row, so a connector pinned at 50% and one row tall lands
     dead on the next dot whatever the label's line height turns out to be. */
  align-self: stretch;
  width: 0.75rem;
  align-items: center;
  justify-content: center;
}

.tpl-step__dot {
  position: relative;
  z-index: 1;
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 9999px;
  background: rgb(203 213 225);
  transition:
    height 250ms var(--tpl-ease-out),
    width 250ms var(--tpl-ease-out),
    background 250ms var(--tpl-ease-out),
    box-shadow 250ms var(--tpl-ease-out);
}

.tpl-step.is-active .tpl-step__dot {
  height: 0.625rem;
  width: 0.625rem;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.15);
}

.tpl-step__line {
  position: absolute;
  left: 50%;
  top: 50%;
  height: 100%;
  width: 1px;
  transform: translateX(-50%);
  background: rgb(226 232 240);
}

.tpl-step__label {
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
  color: rgb(100 116 139);
  transition: color 200ms var(--tpl-ease-out);
}

.tpl-step.is-active .tpl-step__label {
  color: rgb(15 23 42);
  font-weight: 600;
}

.tpl-frames {
  display: grid;
  width: 100%;
  gap: 1.5rem;
  justify-items: center;
}

.tpl-frames--single {
  grid-template-columns: minmax(0, 1fr);
}

.tpl-frames--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tpl-frames--cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tpl-frame-pending {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  background: rgb(15 23 42);
}

.tpl-spinner {
  height: 1.5rem;
  width: 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: rgba(255, 255, 255, 0.85);
  border-radius: 9999px;
  /* Fast: a quicker spinner makes the wait feel shorter than a slow one does,
     for the identical wait. */
  animation: tpl-spin 0.7s linear infinite;
}

@keyframes tpl-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Wide and small, so it costs one or two lines rather than three. Everything it
   takes vertically comes straight off the height of the phones above it. */
.tpl-note {
  max-width: min(100%, 60rem);
  text-align: center;
  font-size: 0.75rem;
  line-height: 1.55;
  color: rgb(100 116 139);
}

/* --- Loading + empty ------------------------------------------------------ */

.tpl-skeleton-frame {
  height: 30rem;
  width: 100%;
  max-width: 320px;
  border-radius: 1.5rem;
  background: rgba(226, 232, 240, 0.7);
  animation: tpl-pulse 1.6s ease-in-out infinite;
}

.tpl-skeleton-card {
  aspect-ratio: 9 / 16;
  border-radius: 0.875rem;
  background: rgba(226, 232, 240, 0.7);
  animation: tpl-pulse 1.6s ease-in-out infinite;
}

@keyframes tpl-pulse {
  50% {
    opacity: 0.55;
  }
}

.tpl-empty {
  margin: 0 auto;
  max-width: 32rem;
  padding: 4rem 1.5rem;
  text-align: center;
}

.tpl-empty__disc {
  margin: 0 auto;
  display: flex;
  height: 4rem;
  width: 4rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: linear-gradient(to bottom right, rgba(46, 204, 113, 0.2), rgba(30, 144, 255, 0.2));
}

.tpl-empty__cta {
  margin-top: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  background: rgb(15 23 42);
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  transition:
    background-color 200ms var(--tpl-ease-out),
    transform 160ms var(--tpl-ease-out);
}

.tpl-empty__cta:hover {
  background: rgb(30 41 59);
}

.tpl-empty__cta:active {
  transform: scale(0.97);
}

/* Reduced motion keeps the opacity changes that aid comprehension and drops the
   movement — not every animation, just the ones that move. */
@media (prefers-reduced-motion: reduce) {
  .tpl-spinner {
    animation-duration: 2s;
  }

  .tpl-skeleton-frame,
  .tpl-skeleton-card {
    animation: none;
  }

  .tpl-dropdown-enter-active,
  .tpl-dropdown-leave-active {
    transition: opacity 120ms linear;
  }

  .tpl-dropdown-enter-from,
  .tpl-dropdown-leave-to {
    transform: none;
  }

  .tpl-card,
  .tpl-card__img {
    transition-property: box-shadow;
  }

  .tpl-card:hover,
  .tpl-card:active,
  .tpl-card:hover .tpl-card__img {
    transform: none;
  }

  .tpl-back:active,
  .tpl-filter__trigger:active,
  .tpl-seg__btn:active,
  .tpl-empty__cta:active {
    transform: none;
  }
}
</style>
