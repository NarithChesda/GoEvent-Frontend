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
      <!--
        The catalogue's column, and everything that steers it. The header bar is
        divided by the same two columns as the body below, so each side's chrome
        sits over the side it belongs to: leaving this track to the back link
        alone put one round arrow in 356px of nothing, while the catalogue
        underneath carried a second row of chrome of its own.
      -->
      <div class="tpl-page__nav">
        <!--
          The label is allowed to be empty — in English it is, and the link is
          then the arrow alone, in a circle. An empty label is not an empty
          name, though: with the icon hidden from the tree there would be
          nothing left to announce, so the accessible name falls back to the
          generic one.
        -->
        <RouterLink
          to="/partners"
          class="tpl-back"
          :class="{ 'is-icon': !backLabel }"
          :aria-label="backLabel || t('common.actions.back')"
        >
          <ArrowLeft class="h-4 w-4 flex-none" aria-hidden="true" />
          <!-- In a span so a phone can drop it: up there the title names the
               page a step to the right, the arrow's own accessible name still
               says where it goes, and in Khmer the label is a 110px pill that
               pushed the language and info controls onto a second row. -->
          <span v-if="backLabel" class="tpl-back__label">{{ backLabel }}</span>
        </RouterLink>

        <!--
          Event-type filter (§9 dropdown), over the column it filters and wide
          enough to fill it — a control that spans its list reads as belonging
          to it, where a 167px pill floating beside a label read as a leftover.
          It carries the running count itself, so the separate "Designs · 47"
          heading is gone: the number belongs on the control that changes it,
          and the shelf headings below already count their own.

          Only when there is more than one type to choose between, and never on
          a phone — there the shelf tabs carry both jobs this row was doing, and
          a visitor browses every type and reads the type off each card. The
          shelves are short enough to flick through that it is a fair trade; if
          it stops being one, the place to put the filter back is inside the tab
          strip, not above it.
        -->
        <div v-if="showCategoryFilter" class="tpl-filter">
          <button
            type="button"
            class="tpl-filter__trigger"
            :aria-expanded="categoryMenuOpen"
            aria-haspopup="listbox"
            @click="categoryMenuOpen = !categoryMenuOpen"
          >
            <Filter class="h-3.5 w-3.5 flex-none text-slate-400" aria-hidden="true" />
            <span class="flex-1 truncate text-left">{{ activeCategoryLabel }}</span>
            <span class="tpl-filter__count">{{ filteredTemplates.length }}</span>
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

        <!-- One event type, nothing to filter: the count still names the
             column, which is what the heading did before it moved. -->
        <p v-else-if="!isNarrow" class="tpl-menu__label">
          {{ t('partners.templates.menuLabel') }}
          <span class="text-slate-400">· {{ filteredTemplates.length }}</span>
        </p>
      </div>

      <div class="tpl-page__headline">
        <h1 class="tpl-page__title type-display-sm">{{ t('partners.templates.title') }}</h1>
        <p class="tpl-page__subtitle">{{ t('partners.templates.subtitle') }}</p>
      </div>

      <!--
        The caveat about whose invitation this is — the one thing up here that
        is about the sample rather than about the preview's own controls, which
        live together over the frame instead.

        A button because on a phone it was three lines of prose under the frame,
        costing more height than a sentence read once is worth. Held behind a
        mark it costs a disc, and stays one tap away for as long as it is wanted.
      -->
      <div v-if="isNarrow" class="tpl-topbar">
        <div class="tpl-info">
          <button
            type="button"
            class="tpl-icon-btn"
            :class="{ 'is-open': noteOpen }"
            :aria-expanded="noteOpen"
            :aria-label="t('partners.templates.noteLabel')"
            @click="toggleNote"
          >
            <Info class="h-4 w-4" aria-hidden="true" />
          </button>

          <div v-if="noteOpen" class="tpl-filter__scrim" @click="noteOpen = false" />
          <Transition name="tpl-dropdown">
            <p v-if="noteOpen" class="tpl-info__panel" role="status">
              {{ t('partners.templates.note') }}
            </p>
          </Transition>
        </div>
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

    <!-- Loading: the two halves, in outline. On a phone only the stage — the
         catalogue is behind a button down there, so a shelf of grey cards would
         be a placeholder for something that is not on screen. -->
    <div v-if="loading" class="tpl-studio">
      <div class="tpl-studio__stage">
        <div class="tpl-stage">
          <div class="tpl-frames tpl-frames--single">
            <div class="tpl-skeleton-frame" />
          </div>
        </div>
      </div>
      <div v-if="!isNarrow" class="tpl-studio__menu">
        <div class="tpl-menu__scroll">
          <div class="tpl-card-grid">
            <div v-for="n in 6" :key="n" class="tpl-skeleton-card" />
          </div>
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
          Stage picker ABOVE the frame, centred on it: three moments of one
          flow, and the phone they belong to directly under them. One row,
          never two — it wraps to nothing and scrolls sideways instead, because
          a second row would come straight off the height of the phone below.

          It costs nothing net, because the frame's own caption comes off when
          the picker is up (see :label below): the picker already names the
          stage, and two labels for one screen is one too many.

          Desktop only. On a phone the same three stages are the dock's tabs,
          where they cost the invitation nothing at all — over the frame they
          were a band of chrome that, once the page scrolled, sat on top of the
          screen it was labelling.
        -->
        <div class="tpl-stage">
          <div v-if="showStagePicker" class="tpl-stagebar">
            <div class="tpl-steps" role="group" :aria-label="t('partners.templates.stageLabel')">
              <button
                v-for="frame in visibleFrames"
                :key="frame.id"
                type="button"
                class="tpl-step"
                :class="{ 'is-active': activeFrameId === frame.id }"
                :aria-pressed="activeFrameId === frame.id"
                @click="activeFrameId = frame.id"
              >
                {{ t(frame.labelKey) }}
              </button>
            </div>
          </div>

          <div ref="framesRef" class="tpl-frames" :class="framesLayoutClass">
            <PreviewFrame
              v-for="frame in visibleFrames"
              :key="frame.id"
              v-show="isSingleView ? activeFrameId === frame.id : true"
              :ref="(el) => setPreviewFrameRef(frame.id, el)"
              :label="frameLabel(frame)"
              :fit-height="false"
              :max-width="frameMaxWidth"
              :width-override="sharedColumnWidth"
            >
              <!-- Swipeable on a phone only, where the frame is most of the
                   screen and the three stages are the page's main navigation:
                   the biggest thing on screen becomes the way through them,
                   and the pill above turns into the map rather than the only
                   road. Nothing to swipe to in the three-up row. -->
              <InertIframe
                v-if="mountedFrameIds.has(frame.id)"
                :ref="(el) => setFrameRef(frame.id, el)"
                :src="frameUrl(frame)"
                :click-message="frame.clickMessage"
                :swipeable="isNarrow && visibleFrames.length > 1"
                @ready="onFrameReady(frame.id)"
                @loaded="onFrameLoaded"
                @languages="onFrameLanguages"
                @swipe="onFrameSwipe"
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

      <!-- Anywhere else on the screen closes it. The sheet stands over the
           invitation, and reaching past it for the design you can already see
           is the most natural way to put it away. -->
      <div v-if="isNarrow && browseOpen" class="tpl-sheet__scrim" @click="browseOpen = false" />

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
      <!-- Named by the heading that used to sit inside it: the landmark keeps
           its name in the accessibility tree now that the visible row has moved
           into the header. -->
      <aside
        class="tpl-studio__menu"
        :class="{ 'is-open': browseOpen }"
        :aria-label="t('partners.templates.menuLabel')"
      >
        <!--
          The sheet's own header, phone only: what this card is, and the way out
          of it. The dock's browse button toggles it too, but a sheet that can
          only be dismissed by the control that opened it asks the visitor to
          remember where that control was.
        -->
        <div v-if="isNarrow" class="tpl-sheet__head">
          <p class="tpl-sheet__title">
            {{ t('partners.templates.menuLabel') }}
            <span class="tpl-sheet__count">{{ filteredTemplates.length }}</span>
          </p>
          <button
            type="button"
            class="tpl-sheet__close"
            :aria-label="t('common.actions.close')"
            @click="browseOpen = false"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <!--
          On a phone the shelves are tabs and only one is open. The sheet is a
          temporary overlay rather than a permanent band, so it can afford the
          full grid of artwork underneath them — three rows of designs seen at
          once, where the dock this replaces could only ever show one.

          Not rendered above `lg`, where the column is tall and narrow and the
          shelves read better all at once, under their own headings.
        -->
        <div
          v-if="isNarrow && groupedTemplates.length > 1"
          class="tpl-plans"
          role="tablist"
          :aria-label="t('partners.templates.planLabel')"
        >
          <button
            v-for="group in groupedTemplates"
            :key="group.key"
            type="button"
            role="tab"
            class="tpl-plan"
            :class="{ 'is-active': group.key === visibleGroupKey }"
            :aria-selected="group.key === visibleGroupKey"
            @click="selectGroup(group.key, $event)"
          >
            <span class="tpl-plan__name">{{ group.label }}</span>
            <span class="tpl-plan__count">{{ group.templates.length }}</span>
          </button>
        </div>

        <div class="tpl-menu__scroll">
          <section
            v-for="group in groupedTemplates"
            v-show="!isNarrow || group.key === visibleGroupKey"
            :key="group.key"
            class="tpl-menu-group"
            :aria-label="group.label"
          >
            <h2 v-if="!isNarrow" class="tpl-menu-group__head">
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
                    <span
                      v-if="!activeCategory && categoryNameFor(template)"
                      class="tpl-card__meta"
                    >
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

    <!--
      The phone's tab bar: every control that changes what is on the screen
      above it, in one floating pill at the bottom of the window.

      It is the app's own MobileTabBar, borrowed — the same glass pill, the same
      travelling gradient, the same rule that only the tab you are on carries a
      label. That is not decoration: it is the shape a thumb already knows on
      this product, and this page's controls do exactly what that bar's do.

      What it replaces is a stage picker and a language pill stuck over the
      invitation, and a catalogue welded across the bottom third of the window —
      two bands of chrome that between them left the phone taller than the space
      that was left for it, so the page scrolled and both bands rode over the
      thing they were controlling. Down here they cost one row, once, and the
      catalogue is behind the last button rather than permanently on screen.
    -->
    <div v-if="showDock" ref="dockRef" class="tpl-dock">
      <div class="tpl-dock__pill glass-pill">
        <!-- No padding on the row itself, so a tab's offset within it is also
             the indicator's offset — no constant to keep the two in step. -->
        <div
          ref="dockRowRef"
          class="tpl-dock__row"
          role="group"
          :aria-label="t('partners.templates.stageLabel')"
        >
          <!--
            One gradient pill that travels, rather than each tab painting and
            un-painting its own: a background-image cannot be interpolated, so
            the per-tab version could only pop the fill on and then slide the
            width out from under it. Its geometry is measured, never declared —
            the width is the active label's, which changes with the locale and
            with the webfont's arrival.
          -->
          <span
            v-show="indicator.visible"
            class="tpl-dock__indicator"
            :style="{ width: `${indicator.w}px`, transform: `translateX(${indicator.x}px)` }"
            aria-hidden="true"
          />

          <button
            v-for="frame in visibleFrames"
            :key="frame.id"
            type="button"
            class="tpl-dock__tab"
            :class="{ 'is-active': activeFrameId === frame.id }"
            :data-active="activeFrameId === frame.id ? 'true' : undefined"
            :aria-pressed="activeFrameId === frame.id"
            :aria-label="t(frame.labelKey)"
            @click="activeFrameId = frame.id"
          >
            <component :is="stageIcon(frame.id)" class="h-5 w-5 flex-none" aria-hidden="true" />
            <!-- Width opens through a grid column rather than a max-width, so
                 the open and the close ease identically. Clipped, not
                 ellipsised: the column opens from zero, and an ellipsis would
                 show through most of the reveal. -->
            <span class="tpl-dock__label">
              <span class="tpl-dock__label-text">{{ t(frame.labelKey) }}</span>
            </span>
          </button>

          <span class="tpl-dock__divider" aria-hidden="true" />

          <button
            v-if="frameLanguages.length > 1"
            type="button"
            class="tpl-dock__btn tpl-dock__btn--lang"
            :aria-label="t('partners.templates.switchLanguage')"
            @click="cycleLanguage"
          >
            <Languages class="h-4 w-4 flex-none" aria-hidden="true" />
            <span>{{ previewLanguage.toUpperCase() }}</span>
          </button>

          <!-- The catalogue, on a switch. Held lit for as long as the sheet it
               opened is up, so the sheet is never a card with nothing pointing
               at it. -->
          <button
            type="button"
            class="tpl-dock__btn"
            :class="{ 'is-open': browseOpen }"
            :aria-expanded="browseOpen"
            :aria-label="t('partners.templates.browseLabel')"
            @click="toggleBrowse"
          >
            <LayoutGrid class="h-5 w-5 flex-none" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The public design catalogue.
 *
 * The Design Studio's live preview with the editing taken out: this page's
 * audience is people with no account, so there is nothing to sign in to and
 * nothing of theirs to render. It embeds the same <PreviewFrame>/<InertIframe>
 * pair against a route that draws somebody else's invitation instead
 * (TemplateShowcasePreviewFrameView), and resolves which stages exist through
 * the same renderer registry — so a stage shown here is a stage a guest gets.
 *
 * The invitation is a real published event, flagged for the job on the backend
 * and picked to MATCH the design's own event type — a funeral design has to be
 * judged on a funeral. The page picks one per category and hands the same id to
 * every frame (useTemplatePreviewEvents); three frames choosing for themselves
 * would show three different weddings, which reads as three different designs.
 * Nothing published for a category falls back to the bundled sample, so the
 * catalogue is never empty.
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Filter,
  ImageOff,
  Info,
  LayoutGrid,
  Languages,
  Mail,
  Palette,
  Play,
  ScrollText,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-vue-next'
import PreviewFrame from '@/components/showcase-preview/PreviewFrame.vue'
import InertIframe from '@/components/showcase-preview/InertIframe.vue'
import {
  resolvePreviewRenderer,
  type PreviewFrameDescriptor,
} from '@/components/showcase-preview/renderers/resolvePreviewRenderer'
import { eventTemplateService, packagePlanService } from '@/services/api'
import { useTemplatePreviewEvents } from '@/composables/showcase-preview/useTemplatePreviewEvents'
import type { PackagePlan, PublicEventTemplate } from '@/services/api'
// The showcase's own TemplateAssets, not the API types' flat one: this is the
// shape the preview bridge and the renderer registry both speak.
import type { TemplateAssets } from '@/composables/useEventShowcase'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t, locale } = useAppLanguage()

const TELEGRAM_URL = 'https://t.me/goeventkh'

/**
 * The back link's label, which a locale is allowed to leave empty — English
 * does, and the link is then the arrow alone. Read once because three separate
 * things turn on it: what it says, what it is called in the accessibility tree,
 * and what shape it is.
 */
const backLabel = computed(() => t('partners.templates.back'))

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

/** The roster of real events the frames may be drawn through. See the composable. */
const { loadTemplatePreviewEvents, previewEventFor } = useTemplatePreviewEvents()

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

/**
 * The filter is desktop-only chrome AND only earns its place when there is more
 * than one event type in the catalogue — one condition, asked in two places
 * (the control, and the heading that stands in for it).
 */
const showCategoryFilter = computed(() => !isNarrow.value && categories.value.length > 1)

const filteredTemplates = computed(() =>
  activeCategory.value
    ? templates.value.filter((template) => categoryNameFor(template) === activeCategory.value)
    : templates.value,
)

const selectCategory = (value: string) => {
  activeCategory.value = value
  categoryMenuOpen.value = false
  // The shelves are rebuilt from the survivors, so an earlier tap is a claim
  // about a list that no longer exists. Fall back to following the selection.
  activeGroupKey.value = ''
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

/**
 * Which shelf is open, on the phone layout where only one is.
 *
 * Derived from the selected design rather than stored outright, so the tab and
 * the tick can never disagree: whatever the catalogue lands on — first load, a
 * filter change, a template retired by one — the shelf holding it is the shelf
 * that opens. An explicit tap wins while it still names a shelf that exists.
 */
const activeGroupKey = ref('')

/**
 * Opening a shelf also brings its tab fully into the strip.
 *
 * The strip scrolls sideways, so the tab you just chose is often the one half
 * off the edge — tapping it and watching it stay clipped reads as the tap not
 * having landed, even though the rail below it changed.
 */
const selectGroup = (key: string, event: MouseEvent) => {
  activeGroupKey.value = key
  ;(event.currentTarget as HTMLElement | null)?.scrollIntoView({
    inline: 'center',
    block: 'nearest',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

const visibleGroupKey = computed(() => {
  const groups = groupedTemplates.value
  if (!groups.length) return ''
  if (groups.some((group) => group.key === activeGroupKey.value)) return activeGroupKey.value
  const holding = groups.find((group) =>
    group.templates.some((template) => template.id === activeTemplateId.value),
  )
  return (holding ?? groups[0]).key
})

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
  template.preview_image && !brokenThumbnails.value.has(template.id) ? template.preview_image : null

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
  // Before the early return, and so it also fires for the design already on
  // screen: on a phone the catalogue is a sheet standing over the invitation,
  // so picking is the end of browsing and the sheet's job is to get out of the
  // way. Tapping the ticked card is "yes, this one" — a tap that does
  // nothing at all, not even dismiss, reads as a tap that did not land.
  browseOpen.value = false
  if (templateId === activeTemplateId.value) return
  activeTemplateId.value = templateId
  void loadTemplateData(templateId)
}

// ---------------------------------------------------------------------------
// Which invitation the design is drawn through
// ---------------------------------------------------------------------------

const activeTemplate = computed(
  () => templates.value.find((template) => template.id === activeTemplateId.value) ?? null,
)

/**
 * The event every frame draws, chosen for the design on screen.
 *
 * The category comes from the same place both of the catalogue's axes do — the
 * template's package plan — so a design filed under Funeral is previewed on a
 * funeral, not on the wedding that used to stand in for everything. `null` is a
 * normal answer (nothing published for that type, or the backend flag not live
 * yet) and means "the bundled sample", which is what the frames did before.
 */
const previewEventId = computed(() => {
  const template = activeTemplate.value
  if (!template) return null
  return previewEventFor(planFor(template)?.category?.id ?? null)
})

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

/**
 * Only one frame on screen, somewhere else to go from it, and room above it to
 * say so.
 *
 * Desktop only now. A phone's stages are the dock's tabs — the same three
 * choices, in the one band of chrome the layout already pays for, instead of a
 * second one directly over the invitation.
 */
const showStagePicker = computed(
  () => !isNarrow.value && isSingleView.value && visibleFrames.value.length > 1,
)

/**
 * The dock: the phone's whole control surface, and the only chrome below the
 * frame. It waits for the catalogue, because until then there is neither a
 * stage worth switching nor a design worth browsing.
 */
const showDock = computed(() => isNarrow.value && !loading.value && templates.value.length > 0)

/** Which stage each tab draws. Ordered by the flow, not by the vocabulary. */
const STAGE_ICONS: Record<string, Component> = {
  cover: Mail,
  transition: Sparkles,
  event_video: Play,
  main: ScrollText,
}

const stageIcon = (id: string): Component => STAGE_ICONS[id] ?? Smartphone

/**
 * The catalogue, on a phone: a sheet over the invitation rather than a band
 * permanently across the bottom of it.
 *
 * Which is the whole reason the phone fits its window again. The dock it
 * replaced was ~200px of fixed chrome — the height of every card in it, plus a
 * row of plan tabs — and the frame was fitted to what was left, which on a
 * short screen was not enough to draw an invitation in.
 */
const browseOpen = ref(false)

const toggleBrowse = () => {
  browseOpen.value = !browseOpen.value
  // Two overlays over one invitation is one too many.
  if (browseOpen.value) noteOpen.value = false
}

/**
 * The sample-invitation caveat, held behind a mark on a phone.
 *
 * It reads once and matters once, and in the flow under the frame it was three
 * lines of prose permanently occupying a band the preview wanted. Desktop keeps
 * it in place, where the room exists and there is nothing to trade it against.
 */
const noteOpen = ref(false)

const toggleNote = () => {
  noteOpen.value = !noteOpen.value
  // The other half of toggleBrowse's rule: two overlays over one invitation is
  // one too many, and this one opens from the bar the sheet does not cover.
  if (noteOpen.value) browseOpen.value = false
}

/**
 * A swipe across the phone moves one stage, in the direction the finger went —
 * dragging left brings the next screen in from the right, which is the way a
 * pager has always read. It stops at the ends rather than wrapping: three
 * stages are a sequence with a beginning and an end, not a carousel, and
 * looping from Main Content back to Cover would undo the picker's own story.
 */
const onFrameSwipe = (direction: 'left' | 'right') => {
  const frames = visibleFrames.value
  const index = frames.findIndex((frame) => frame.id === activeFrameId.value)
  if (index === -1) return
  const next = frames[index + (direction === 'left' ? 1 : -1)]
  if (next) activeFrameId.value = next.id
}

/**
 * The caption above a frame — blank while the stage picker is up, because the
 * picker sits directly over the phone and already says which screen this is.
 * Two labels for one screen is one too many, and the row it gives back is
 * roughly what the picker costs, so the phone renders the same size either way.
 */
const frameLabel = (frame: PreviewFrameDescriptor): string =>
  showStagePicker.value || isNarrow.value ? '' : t(frame.labelKey)

/**
 * The pill is a container: with nothing to put in it, it is a stray blob. On a
 * phone it is always empty — the layout segments never show there and the
 * language toggle has moved down to the frame — so the header keeps only the
 * back link and the title.
 */
const hasViewControls = computed(
  () =>
    !loading.value &&
    templates.value.length > 0 &&
    !isNarrow.value &&
    (showLayoutSegments.value || frameLanguages.value.length > 1),
)

// ---------------------------------------------------------------------------
// Frame sizing
// ---------------------------------------------------------------------------

/**
 * Room kept below the phones for the sample-content note — desktop's reserve,
 * and the only one there is now. A phone's is the dock's measured height, and
 * it is spent in CSS as the stage's own bottom padding rather than subtracted
 * here: the frames box is then already the right size to measure.
 */
const FRAME_BOTTOM_RESERVE = 72
const FRAME_ASPECT = 390 / 844
const NATIVE_FRAME_WIDTH = 390
/** Never so small that the invitation stops being readable; the page scrolls. */
const MIN_FRAME_WIDTH = 240
/**
 * The floor on a phone, where the page CANNOT scroll: the frame is fitted to
 * the space between the top bar and the dock, and whatever that space is, the
 * whole invitation has to be inside it. So this is a guard against a degenerate
 * zero, not a minimum readable size — a floor the available height cannot
 * honour draws the invitation past the edges of a window with no way to reach
 * the rest of it. Set below what even a landscape phone asks for (a 393px-tall
 * window leaves ~253px of stage, which wants 116px of frame), so in practice it
 * never binds and the fit is always exact.
 */
const MIN_NARROW_FRAME_WIDTH = 96

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
/**
 * How large a frame may render.
 *
 * Two different questions, because the two layouts answer to different things.
 *
 * On a phone the page is exactly one window tall and does not scroll, so the
 * frames box is a flex child with a real, settled height — and the honest
 * answer is simply "as tall as that box". Measuring the box rather than
 * predicting it is what makes the fit correct at every size: the top bar wraps
 * in Khmer, the dock grows by a safe-area inset, and neither has to be known
 * here. There is no feedback loop — the box's height is the space left over
 * after the header and the dock's reserve, which nothing about the frame's own
 * size can move.
 *
 * On desktop the page may scroll, so the frame is fitted to the window from the
 * frames box's position in DOCUMENT coordinates instead — see framesTop.
 */
const frameMaxWidth = computed(() => {
  if (isNarrow.value) {
    return Math.max(
      MIN_NARROW_FRAME_WIDTH,
      Math.min(NATIVE_FRAME_WIDTH, Math.floor(framesHeight.value * FRAME_ASPECT)),
    )
  }
  return Math.max(
    MIN_FRAME_WIDTH,
    Math.min(
      NATIVE_FRAME_WIDTH,
      Math.round((viewportHeight.value - framesTop.value - FRAME_BOTTOM_RESERVE) * FRAME_ASPECT),
    ),
  )
})

const FRAMES_GAP_PX = 24

const framesRef = ref<HTMLElement | null>(null)
const framesWidth = ref(0)
/** The frames box's own height — the phone layout's whole sizing input. */
const framesHeight = ref(0)
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

/**
 * How tall the dock is, published to CSS so the stage reserves exactly it and
 * the sheet can sit directly on top of it.
 *
 * Measured rather than assumed because it is not a constant: it carries a
 * safe-area inset on the phones that have one, and its row is a line of text
 * whose height follows the locale's own font. The seed is a fair guess at the
 * pill, used only for the first frame before the observer reports.
 */
const dockHeight = ref(76)

const studioStyle = computed(() => ({
  '--tpl-studio-top': `${studioTop.value}px`,
  '--tpl-dock-h': `${dockHeight.value}px`,
}))

/** Every measurement the frames need, taken from the container that holds them. */
const measureFrameBox = (element: HTMLElement) => {
  framesWidth.value = element.clientWidth
  framesHeight.value = element.clientHeight
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
 * The dock's height, watched rather than read once.
 *
 * It changes under the page's feet — a safe-area inset arriving, a locale
 * relabelling the active tab — and it is the floor the phone is fitted to, so
 * `refit` has to run when it moves.
 */
const dockRef = ref<HTMLElement | null>(null)
let dockObserver: ResizeObserver | null = null

/** Watch the element, publish its height, re-fit. */
const observeHeight = (
  element: HTMLElement,
  target: typeof dockHeight,
  onChange?: () => void,
): ResizeObserver => {
  const measure = () => {
    const next = Math.round(element.getBoundingClientRect().height)
    if (next && next !== target.value) {
      target.value = next
      onChange?.()
    }
  }
  measure()
  const observer = new ResizeObserver(measure)
  observer.observe(element)
  return observer
}

watch(dockRef, (element) => {
  dockObserver?.disconnect()
  dockObserver = element ? observeHeight(element, dockHeight, refit) : null
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

/**
 * The box measurement AND the frames' own, in that order.
 *
 * `framesObserver` catches the frames box changing *size*; nothing catches it
 * changing *position*, which is what every one of these does — the catalogue
 * arriving under a skeleton, a shelf of five swapped for a shelf of one, the
 * picker appearing. `framesTop` then keeps the value it had when the page was
 * still empty, `frameMaxWidth` is computed from a top that is hundreds of
 * pixels too high, and the phone is drawn too large to fit the window it was
 * supposed to fit — which is the whole point of measuring.
 *
 * It settles in one pass: `framesTop` is where the frames box *starts*, and
 * nothing above it is sized from the frame, so re-measuring cannot move it.
 */
const refit = () => {
  void nextTick(() => {
    if (framesRef.value) measureFrameBox(framesRef.value)
    for (const instance of previewFrameRefs.values()) instance.measure()
  })
}

watch([isSingleView, activeFrameId, frameMaxWidth], remeasure)
watch([loading, isNarrow, showStagePicker, groupedTemplates, visibleGroupKey], refit)

// ---------------------------------------------------------------------------
// The dock's travelling indicator
//
// Lifted from MobileTabBar, for the same reason it exists there: the pill's
// geometry cannot be declared, because its width is the active tab's width and
// that depends on the label, the locale and whether the webfont has arrived.
// So it is measured off the tab the template has already marked active.
// ---------------------------------------------------------------------------

const dockRowRef = ref<HTMLElement | null>(null)
const indicator = ref({ x: 0, w: 0, visible: false })

/** Matches the tabs' own transition: the glide lands on the layout they settle
 *  into, and one ending first would stop short of the final width. */
const GLIDE_MS = 380

let glideFrame = 0

const measureIndicator = () => {
  const row = dockRowRef.value
  const tab = row?.querySelector<HTMLElement>('[data-active="true"]')
  if (!row || !tab) return null
  const rowBox = row.getBoundingClientRect()
  const tabBox = tab.getBoundingClientRect()
  return { x: tabBox.left - rowBox.left, w: tabBox.width }
}

const cancelGlide = () => {
  if (glideFrame) cancelAnimationFrame(glideFrame)
  glideFrame = 0
}

/** Jump straight to the current geometry — mount, resize, locale change. */
const settleIndicator = () => {
  cancelGlide()
  const target = measureIndicator()
  indicator.value = target ? { ...target, visible: true } : { ...indicator.value, visible: false }
}

/**
 * Travel to the newly active tab.
 *
 * The destination is still moving while we go: the old tab is giving up its
 * label and the new one taking one, so everything to the right of the change is
 * sliding too. Measuring once at the start would aim at the old layout and land
 * short, so the target is re-read every frame and the eased fraction applied to
 * wherever it has got to.
 */
const glideIndicator = () => {
  const from = indicator.value.visible ? { x: indicator.value.x, w: indicator.value.w } : null
  if (!from || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    settleIndicator()
    return
  }
  if (!measureIndicator()) {
    cancelGlide()
    indicator.value = { ...indicator.value, visible: false }
    return
  }

  cancelGlide()
  const start = performance.now()
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / GLIDE_MS)
    const eased = 1 - Math.pow(1 - progress, 3)
    const target = measureIndicator()
    if (!target) {
      settleIndicator()
      return
    }
    indicator.value = {
      x: from.x + (target.x - from.x) * eased,
      w: from.w + (target.w - from.w) * eased,
      visible: true,
    }
    if (progress < 1) glideFrame = requestAnimationFrame(step)
    else settleIndicator() // land on the measured value, not the interpolated one
  }
  glideFrame = requestAnimationFrame(step)
}

// Switching stage is the only thing that should animate — by tab or by swipe,
// both of which land here. Everything else that moves the tabs (a locale
// relabelling them, the dock appearing, the row resizing) jumps.
watch(activeFrameId, () => void nextTick(glideIndicator))
watch([locale, visibleFrames, showDock], () => void nextTick(settleIndicator))

let dockRowObserver: ResizeObserver | null = null
watch(dockRowRef, (element) => {
  dockRowObserver?.disconnect()
  dockRowObserver = null
  if (!element) {
    indicator.value = { ...indicator.value, visible: false }
    return
  }
  void nextTick(settleIndicator)
  dockRowObserver = new ResizeObserver(settleIndicator)
  dockRowObserver.observe(element)
})

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
/**
 * Only a safety valve, so it is sized as one.
 *
 * The queue advances on `frame-loaded` — a frame with an invitation actually on
 * screen — not on the mount-time handshake, and on a slow connection that can
 * legitimately take many seconds. At the old 4s this timer, not the frame,
 * decided when the next boot began, which reintroduced exactly the contention
 * the queue exists to prevent on exactly the connections that need it most. It
 * has one job: stop a frame that died before reporting from stalling the queue
 * for good.
 */
const FRAME_HANDSHAKE_TIMEOUT_MS = 20000
let frameMountTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Which frames are worth booting: all of them, but not all at once.
 *
 * On a wide screen they can start together (in the queue's own order) — every
 * frame is on screen or one click away, and having them warm is what makes that
 * click instant. On a phone the first one is on its own until it is up, so the
 * invitation the visitor is actually looking at never races two hidden app
 * boots for the network and the main thread.
 *
 * Afterwards the phone warms the rest too, which it deliberately did not before.
 * Booting on demand made every first tap of a stage — and every swipe — turn the
 * page's whole payload black for as long as an app takes to start, which on a
 * phone connection is seconds. That is the worst possible moment to spend them:
 * the visitor has just asked for something. Two boots of a page whose entire
 * purpose is previewing is the cheaper half of that trade, and by then they cost
 * nothing visible.
 */
const framesWarmed = ref(false)

const mountQueue = computed(() =>
  isNarrow.value && !framesWarmed.value
    ? visibleFrames.value.filter((frame) => frame.id === activeFrameId.value)
    : visibleFrames.value,
)

/**
 * Nothing boots until the catalogue, the plans AND the preview roster are in.
 *
 * Selecting a design is enough to change which stages exist, which wakes the
 * mount queue — so without this a frame could come up before the plans named
 * its design's category, be seeded with the wrong invitation, and reload to
 * correct itself in front of the visitor.
 */
const studioReady = ref(false)

const mountNextFrame = () => {
  if (!studioReady.value) return
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
  // Seeded for the same reason the language is: a frame that mounts already
  // knowing its event paints once instead of painting the sample and reloading.
  // It is left to the bridge from then on — see pushPreviewEventToFrames.
  if (previewEventId.value) params.set('eventId', previewEventId.value)
  const url = `/template-showcase-preview-frame?${params.toString()}`
  frameSrcCache.set(frame.id, url)
  return url
}

/**
 * Push the chosen design into every mounted frame, immediately — including the
 * ones held off screen by `v-show` in single view.
 *
 * Deferring the off-screen ones was tried and reverted. It does save real work
 * — a template push re-keys the video pipeline, so each frame that receives one
 * remounts its stage and re-downloads — but `v-show` reveals a frame on the
 * same tick the tab is tapped, while the deferred push, the remount and the
 * video load all land after it. So switching stages showed the PREVIOUS
 * design's video first and swapped it out a moment later, which on the Event
 * Video frame is the entire screen changing under the visitor. A catalogue may
 * not show the wrong design for even a moment; that is the one thing it is for.
 */
const pushTemplateToFrames = () => {
  const templateData = activeTemplateData.value
  if (!templateData) return
  for (const frame of frameRefs.values()) frame.postTemplatePreview(templateData)
}

/**
 * Every mounted frame draws the same invitation, always.
 *
 * Over the bridge rather than through the URL, because changing an iframe's
 * `src` re-navigates it — three designs into a browse that is nine full app
 * boots. A frame that is already on this event ignores the message.
 */
const pushPreviewEventToFrames = () => {
  for (const frame of frameRefs.values()) frame.postPreviewEvent(previewEventId.value)
}

watch(previewEventId, pushPreviewEventToFrames)

/**
 * A frame's listener is now live — the only safe moment to hand it anything,
 * since postMessage does not queue.
 *
 * State delivery only. This fires at the frame's MOUNT, while its showcase
 * fetch and stage chunk are still in flight, so it says nothing about whether
 * the frame is up; advancing the boot queue from here started every frame
 * within a few milliseconds of the last and made the staggering ornamental.
 * That is `onFrameLoaded`'s job now.
 */
const onFrameReady = (frameId: string) => {
  const frame = frameRefs.get(frameId)
  const templateData = activeTemplateData.value
  if (templateData) frame?.postTemplatePreview(templateData)
  // Unconditional, and cheap: a frame booted on this event ignores it. It
  // covers the one ordering the seeded URL cannot — a frame still mounting
  // while the visitor moves to a design of another category.
  frame?.postPreviewEvent(previewEventId.value)
}

/**
 * A frame has an invitation on screen. Only now is the connection free enough
 * to be worth handing to the next one.
 */
const onFrameLoaded = () => {
  // The first frame is up, so the phone may now warm the rest behind it — see
  // mountQueue. Latched rather than recomputed: once a stage has been booted it
  // stays booted, and a later frame reporting in must not reopen the question.
  framesWarmed.value = true
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
  if (event.key !== 'Escape') return
  categoryMenuOpen.value = false
  noteOpen.value = false
  browseOpen.value = false
}

onMounted(() => {
  narrowQuery = window.matchMedia('(max-width: 1023px)')
  onNarrowChange(narrowQuery)
  narrowQuery.addEventListener('change', onNarrowChange)
  window.addEventListener('resize', onWindowResize)
  document.addEventListener('keydown', onKeydown)

  // All three before the first frame boots, and the plans are no longer
  // fire-and-forget: a frame's `src` is frozen at mount, and the plan is what
  // names the design's category — so a frame that comes up before the plans do
  // is seeded with the wrong invitation and has to reload to correct itself.
  void Promise.all([loadCatalogue(), loadPlans(), loadTemplatePreviewEvents()]).then(() => {
    // The first CARD, not the first row of the response — see orderedTemplates.
    const first = orderedTemplates.value[0]
    if (first) selectTemplate(first.id)
    studioReady.value = true
    mountNextFrame()
  })
})

onUnmounted(() => {
  if (frameMountTimer) clearTimeout(frameMountTimer)
  cancelGlide()
  framesObserver?.disconnect()
  dockObserver?.disconnect()
  dockRowObserver?.disconnect()
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
  /* One duration for every hover on the page. Three near-identical numbers
     (200 / 220 / 250) for the same kind of feedback is not a decision anyone
     made; it is drift, and side by side the pills read as slightly out of
     step with each other. Presses stay faster — feedback should land under
     the finger, not after it. */
  --tpl-dur: 200ms;
  --tpl-press: 160ms;
  /* Every control's focus ring, defined once. The white inner band is what
     keeps it legible against a card's own artwork; on the page's white ground
     it simply reads as a ring floating clear of the control. */
  --tpl-focus: 0 0 0 2px #fff, 0 0 0 4px rgb(56 189 248);
  /* One control height for the whole page: the back link, the view pill, the
     stage picker, the filter and the action all land on 40px, which is also a
     touch target that survives a thumb. */
  --tpl-control-h: 2.5rem;
  /* One material for every floating control on the page. The view pill and the
     stage picker were glass; the back link and the event-type filter were
     bordered white stationery — two families on one row, which is what read as
     "the dropdown belongs to another page". Defined here rather than written
     out at each of the four, so a fifth control cannot quietly start a third
     family, and so the four can never drift apart by a hundredth of an alpha. */
  --tpl-glass: rgba(255, 255, 255, 0.75);
  /* Hover tints toward slate rather than toward opaque white: over a ground
     that is already near-white, going whiter is no feedback at all. Still
     translucent and still blurred, so the control answers without leaving the
     material — which is what the old solid slate-50 fill could not do. */
  --tpl-glass-hover: rgba(248, 250, 252, 0.95);
  --tpl-glass-edge: rgba(255, 255, 255, 0.6);
  --tpl-glass-lift: 0 1px 2px rgba(15, 23, 42, 0.06);
  /* The catalogue column. In px, not rem: the app runs a reduced root font at
     laptop widths, and this column holding two 9:16 cards is exactly where that
     shrink is least welcome. */
  --tpl-menu-w: 356px;
  /* What the page paints under the catalogue column, as a flat colour. The
     ground is a horizontal gradient, but across the 356px this column occupies
     it moves by under two levels out of 255 — so a solid stand-in is
     indistinguishable, and it is the only thing a sticky band can be cut from. */
  --tpl-ground: #fafdfb;
  /* The page's own side inset, named so the two horizontal rails below can pay
     it back and run to the screen's edge. Kept in step with `padding` by hand,
     which is why they sit together. */
  --tpl-pad: 1rem;

  /* `dvh`, not `vh`: on a phone `100vh` is the tallest the viewport ever gets,
     so with the URL bar showing the page claims more height than the window
     has and adds a scrollbar to a screen that would otherwise have none. */
  min-height: 100vh;
  min-height: 100dvh;
  /* The page paints its own ground now that it has no app shell around it. */
  background: linear-gradient(
    to right,
    rgba(46, 204, 113, 0.03),
    #fff 45%,
    rgba(30, 144, 255, 0.03)
  );
  /* No bottom runway on a phone: the dock is fixed over the last 200px of the
     window, so anything the page reserved down there was scroll the visitor
     could take and see nothing for. The stage reserves what the dock needs
     itself, in its own padding. */
  padding: 0.75rem var(--tpl-pad) 0;
}

@media (min-width: 640px) {
  .tpl-page {
    --tpl-pad: 1.5rem;
    padding: 1.25rem var(--tpl-pad) 0;
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

/*
  One bar: navigation at the leading edge, controls at the trailing one, the
  headline between them.

  On a phone it is the viewer's top chrome and stays put — the page can still
  scroll on a short screen, and the two things this bar holds (what language the
  invitation is in, and whose invitation it is) are asked from wherever the
  visitor has got to. Full bleed, so the band it paints reaches the glass rather
  than stopping at the page's own inset with content sliding through the strip
  either side of it.
*/
.tpl-page__head {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
  margin: -0.75rem calc(var(--tpl-pad) * -1) 0.375rem;
  padding: 0.75rem var(--tpl-pad) 0.5rem;
  /* Near-solid rather than blurred glass, deliberately: `backdrop-filter` makes
     an element the containing block for every fixed descendant, and the note's
     full-window scrim is one — under a blurred bar it would cover the bar and
     nothing else, so a tap anywhere on the page would fall straight through to
     what is behind the panel. Little passes under this band in any case. */
  background: #fff;
}

@media (min-width: 1024px) {
  .tpl-page__head {
    /* Four tracks, and the first is the catalogue column, repeated from the
       studio below with the same width and the same gutter. That is what makes
       the header look aligned rather than merely centred: the back link lands
       directly over the catalogue's own heading, and the remaining three tracks
       divide exactly the region the frames occupy — so the headline sits on the
       same centre line as the three phones, their labels and the caption under
       them. Centring on the *page* instead put it over the seam between the two
       columns, which is aligned to nothing.

       The two `1fr` gutters are what centre it. They are equal by definition,
       and the column gaps fall on both sides of the middle track and cancel, so
       the pill on the right never pushes the title off centre however wide it
       grows. The trailing gutter is floored at `max-content` so that pill is
       never squeezed into wrapping; the leading one is empty, so its floor is
       zero and it simply mirrors whatever the trailing one takes.

       Every item is placed by hand. Grid items stretch to their track by
       default, and `flex: none` stops meaning anything the moment the parent is
       not a flex container — left to itself the back link inflates to the full
       width of the catalogue column, and auto-placement drops the view pill
       into the leading gutter. */
    /* Back to an ordinary header: nothing scrolls under it up here, and the
       band it painted on a phone would cut across the catalogue column. */
    position: static;
    background: none;
    backdrop-filter: none;
    display: grid;
    grid-template-columns:
      minmax(0, var(--tpl-menu-w))
      minmax(max-content, 1fr)
      auto
      minmax(max-content, 1fr);
    column-gap: 1.75rem;
    padding: 0;
    margin: 0 0 1.25rem;
  }

  .tpl-page__nav {
    grid-column: 1;
    /* Inset to the catalogue's own edges, not to the column box. The scroller
       below pads itself by 8px so a card's selection ring and hover lift are
       not clipped away, so every card, shelf heading and count in that column
       starts 8px in — and a bordered pill sitting flush to the column box
       instead is 8px adrift of all of them. */
    padding-inline: 0.5rem;
  }

  .tpl-seg {
    grid-column: 4;
    justify-self: end;
  }
}

/* The back link and the catalogue's filter, in one row. On a phone it is only
   the back link — down there the filter belongs to a catalogue that has become
   a sideways rail — so the row shrink-wraps and the view pill keeps the far end
   of the bar. */
.tpl-page__nav {
  display: flex;
  flex: none;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}

.tpl-back {
  display: inline-flex;
  flex: none;
  min-height: var(--tpl-control-h);
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid var(--tpl-glass-edge);
  background: var(--tpl-glass);
  box-shadow: var(--tpl-glass-lift);
  backdrop-filter: blur(12px);
  padding: 0 0.9375rem 0 0.8125rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  transition:
    color var(--tpl-dur) var(--tpl-ease-out),
    background-color var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

/* No label, no reason for the lopsided pill the label's padding makes: the
   arrow gets a circle of the page's own control height and sits dead centre of
   it, rather than 1px right of centre in a 46x40 lozenge. On a phone that is
   every locale — the label is hidden there, see the span. */
.tpl-back.is-icon,
.tpl-back {
  width: var(--tpl-control-h);
  padding: 0;
}

.tpl-back__label {
  display: none;
}

@media (min-width: 1024px) {
  .tpl-back:not(.is-icon) {
    width: auto;
    padding: 0 0.9375rem 0 0.8125rem;
  }

  .tpl-back__label {
    display: inline;
  }
}

/* The glass goes more opaque and the ink darkens. Hardening the border to slate
   instead would put the stationery outline back on hover — the control would
   change family under the cursor. */
.tpl-back:hover {
  color: rgb(15 23 42);
  background: var(--tpl-glass-hover);
}

.tpl-back:active {
  transform: scale(0.97);
}

.tpl-back:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

/* Between the back link and the controls, on the one row a phone's top bar
   gets. It shrinks before either of them does — they are fixed-size targets and
   this is text, which can take a second line when a locale needs one (Khmer's
   title is twice English's). Wrapping costs the bar 20px; giving the title a
   row of its own cost it 36 and left a lone arrow on the line above. */
.tpl-page__headline {
  /* Basis zero, not `auto`: the title must never *ask* for the width its text
     wants, or a long locale claims the row and pushes the two controls onto a
     second one — which is what Khmer did, at 110px of header for a page whose
     scarce dimension is height. With a zero basis it takes what the fixed-size
     targets leave and wraps inside that. */
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
}

@media (min-width: 1024px) {
  .tpl-page__headline {
    /* Stacked, not side by side. Centred over the stage, a caption hung off the
       title's right-hand baseline reads as two objects that happen to be near
       each other; over and under reads as one lockup. It is also why the
       divider that once sat between them could never be aligned — under
       baseline alignment the caption's box starts well below the title's cap,
       so the rule drew a short line down the middle of the heading.

       Stacking usually costs ~40px of header height, which the phones
       underneath pay for. Here it costs about six, because the caption is given
       the width to stay on one line. */
    flex: none;
    order: 0;
    grid-column: 3;
  }
}

/* Smaller on a phone than the 1.25rem it was, because it now shares the row
   with three controls rather than owning a line. It is a name, not a headline —
   the page's argument is made on `/partners`, and by the time a visitor is here
   they came to look at designs. */
.tpl-page__title {
  /* Two lines at most. Khmer's title is a sentence where English's is a name,
     and left alone it ran to three — every one of them taken off the height the
     invitation below is fitted into. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: rgb(15 23 42);
  text-wrap: balance;
}

@media (min-width: 640px) {
  .tpl-page__title {
    font-size: 1.1875rem;
  }
}

@media (min-width: 1024px) {
  .tpl-page__title {
    /* Unclamped: the header has a whole track to itself here, and a heading
       that can silently lose its last word is only worth it where height is
       the scarce thing. */
    display: block;
    overflow: visible;
    font-size: 1.5rem;
    line-height: 1.2;
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
    /* Under the title it is a caption, and a caption that runs the width of a
       1900px screen is unreadable. Wide enough to hold this string on one line
       at desktop widths and fall to two at the narrow end of them — never the
       four it ran to at 34rem, which is a paragraph that has wandered into a
       header. `balance` is what keeps that second line from being two words
       long, which is loud under a centred title; and the box needs centring in
       its own right, since `text-align` centres the lines inside it but leaves
       a 32rem box sitting wherever it was placed. */
    max-width: 32rem;
    margin: 0.125rem auto 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: rgb(100 116 139);
    text-wrap: balance;
  }
}

/* --------------------------------------------------------------------------
   The studio
   -------------------------------------------------------------------------- */

/* Stacked, the gap is between the catalogue and the invitation it chooses, and
   every pixel of it comes off the phone's own height further down the column —
   so it is the smallest gap that still separates two bands. Side by side it is
   a column gutter and can afford to be generous (below). */
.tpl-studio {
  display: grid;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .tpl-studio {
    /* Catalogue first, then the frames, which take everything it does not. */
    grid-template-columns: minmax(0, var(--tpl-menu-w)) minmax(0, 1fr);
    gap: 1.75rem;
    align-items: start;
  }
}

/*
  The phone, and nothing else on the screen with it.

  It used to sit under a catalogue in the flow above, and then under a catalogue
  welded across the bottom third of the window — ~200px of fixed chrome, plus a
  control bar over the frame, with the invitation fitted into what was left.
  Both are gone: the controls are one dock at the foot of the window and the
  catalogue is behind a button on it, so the stage owns the entire band between
  the top bar and that dock.

  The padding is the dock's measured height handed back to the document, which
  is what keeps the phone clear of it rather than tucked underneath.
*/
.tpl-studio__stage {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  order: 1;
  padding-bottom: var(--tpl-dock-h, 76px);
}

/*
  The catalogue as a sheet — a card that stands on the dock while you are
  choosing, and is not there when you are not.

  It used to be the dock itself: a permanent band across the bottom of the
  window, as tall as the cards in it plus a row of plan tabs, with the
  invitation fitted into whatever remained. That is an expensive way to hold
  something a visitor uses in bursts — and what it cost came out of the one
  thing the page exists to show.

  Held in the DOM and hidden rather than mounted on demand, so a transition can
  be interrupted and retargeted: a sheet is toggled in bursts too, and keyframes
  restart from zero. `visibility` is what takes it out of the tab order and the
  accessibility tree while it is closed, and it flips at the end of the way out
  so the card can be seen leaving.
*/
.tpl-studio__menu {
  position: fixed;
  inset-inline: 0.75rem;
  bottom: calc(var(--tpl-dock-h, 76px) + 0.25rem);
  z-index: 60;
  display: flex;
  flex-direction: column;
  min-width: 0;
  order: 2;
  max-height: min(60dvh, 30rem);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow:
    0 18px 40px -12px rgba(15, 23, 42, 0.3),
    0 4px 12px rgba(30, 144, 255, 0.08);
  padding: 0.75rem 0.5rem 0.5rem;
  opacity: 0;
  visibility: hidden;
  /* Never from nothing: it is a card that comes up off the dock, not one that
     materialises out of the middle of the screen. */
  transform: translateY(10px) scale(0.98);
  transform-origin: bottom center;
  /* Out faster than in — the way out is the system responding, and the visitor
     has already decided. */
  transition:
    opacity 160ms var(--tpl-ease-out),
    transform 160ms var(--tpl-ease-out),
    visibility 0s linear 160ms;
}

.tpl-studio__menu.is-open {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition:
    opacity 220ms var(--tpl-ease-out),
    transform 220ms var(--tpl-ease-out),
    visibility 0s;
}

/*
  Anywhere else on the screen puts it away.

  Barely tinted, deliberately: the sheet carries its own shadow and its own
  material, and a dark wash over an invitation being judged is a lie about that
  invitation's colours.
*/
.tpl-sheet__scrim {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 23, 42, 0.12);
  animation: tpl-fade-in 200ms var(--tpl-ease-out);
}

@keyframes tpl-fade-in {
  from {
    opacity: 0;
  }
}

/* What the card is, and the way out of it. */
.tpl-sheet__head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  /* Lands the title on the same line as the cards below it: the scroller under
     this pays its own 0.5rem on top of the sheet's. */
  padding: 0 0.5rem 0.5rem;
}

.tpl-sheet__title {
  display: inline-flex;
  align-items: baseline;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(15 23 42);
}

.tpl-sheet__count {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(148 163 184);
  font-variant-numeric: tabular-nums;
}

.tpl-sheet__close {
  display: inline-flex;
  flex: none;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: rgb(100 116 139);
  transition:
    background-color var(--tpl-dur) var(--tpl-ease-out),
    color var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .tpl-sheet__close:hover {
    background: rgb(241 245 249);
    color: rgb(15 23 42);
  }
}

.tpl-sheet__close:active {
  transform: scale(0.94);
}

.tpl-sheet__close:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

@media (min-width: 1024px) {
  /* Side by side, and the reading direction flips back: choose on the left,
     look on the right. A column, not a dock — there is height here to spend. */
  .tpl-studio__stage {
    order: 2;
    padding-bottom: 0;
  }

  /* Not a sheet up here: a column that is simply always there, so every one of
     the sheet's own properties has to be handed back. */
  .tpl-studio__menu {
    order: 1;
    position: sticky;
    inset-inline: auto;
    bottom: auto;
    z-index: auto;
    padding: 0;
    background: none;
    backdrop-filter: none;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    opacity: 1;
    visibility: visible;
    transform: none;
    transition: none;
    top: 1rem;
    /* Its own top, measured — see studioTop. Falls back to a guess for the
       frame before the measurement lands. */
    max-height: calc(100vh - var(--tpl-studio-top, 6rem) - 1rem);
    display: flex;
    flex-direction: column;
  }
}

/* --- The phone's top-bar controls ---------------------------------------- */

/* Pinned to the trailing edge the way the view pill is on a desktop, so the
   bar reads the same either way: navigation left, name centred, controls right. */
.tpl-topbar {
  display: inline-flex;
  flex: none;
  margin-left: auto;
  align-items: center;
  gap: 0.375rem;
}

/* The same glass, the same round, one control height narrower than a labelled
   pill because it holds a single glyph. */
.tpl-icon-btn {
  position: relative;
  display: inline-flex;
  flex: none;
  height: var(--tpl-control-h);
  width: var(--tpl-control-h);
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid var(--tpl-glass-edge);
  background: var(--tpl-glass);
  box-shadow: var(--tpl-glass-lift);
  backdrop-filter: blur(12px);
  color: rgb(71 85 105);
  transition:
    color var(--tpl-dur) var(--tpl-ease-out),
    background-color var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .tpl-icon-btn:hover {
    color: rgb(15 23 42);
    background: var(--tpl-glass-hover);
  }
}

.tpl-icon-btn:active {
  transform: scale(0.94);
}

.tpl-icon-btn:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

/* Held open: the mark stays lit for as long as the panel it opened is up, so
   there is never a floating paragraph with nothing pointing at it. */
.tpl-icon-btn.is-open {
  border-color: transparent;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: #fff;
}

.tpl-info {
  position: relative;
}

/*
  The caveat, on demand.

  Anchored under the mark and to the screen's trailing edge rather than the
  button's, because at 40px wide the button has no width to hang a paragraph
  from — a popover narrower than its own first word is not a popover. It scales
  out of the corner it belongs to all the same.
*/
.tpl-info__panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 100;
  width: max-content;
  max-width: min(20rem, calc(100vw - 2 * var(--tpl-pad)));
  border-radius: 0.75rem;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  box-shadow:
    0 20px 25px -5px rgba(15, 23, 42, 0.12),
    0 8px 10px -6px rgba(15, 23, 42, 0.08);
  padding: 0.75rem 0.875rem;
  font-size: 0.75rem;
  line-height: 1.6;
  color: rgb(71 85 105);
  text-align: left;
  transform-origin: top right;
}

/* Only the single-event-type fallback still renders this — see the header. */
.tpl-menu__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

/* --- Event-type filter (§9) ---------------------------------------------- */

/* Fills whatever the back link leaves of the catalogue column, so the row has
   a flush trailing edge over a column of flush-edged cards. */
.tpl-filter {
  position: relative;
  flex: 1;
  min-width: 0;
}

.tpl-filter__trigger {
  display: flex;
  min-height: var(--tpl-control-h);
  align-items: center;
  gap: 0.5rem;
  /* Full-round, like the back link to its left, the view pill across the row
     and the stage picker below. An 8px radius on a 40px control is the shape of
     a form field, and one form field among four pills is the loudest single
     thing about this bar. */
  border-radius: 9999px;
  border: 1px solid var(--tpl-glass-edge);
  background: var(--tpl-glass);
  box-shadow: var(--tpl-glass-lift);
  backdrop-filter: blur(12px);
  /* Round ends eat their own inline space, so the pill needs more of it than
     the rounded rectangle did. The trailing side gets a shade less, the chevron
     carrying whitespace of its own. */
  padding: 0 0.6875rem 0 0.8125rem;
  width: 100%;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  transition:
    color var(--tpl-dur) var(--tpl-ease-out),
    background-color var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

/* Not §9's mint hover, which is the recipe for a dropdown standing on a white
   list page inside the app. This one stands in a toolbar over a stage, between
   a back link and a glass pill, on a page that deliberately ships without the
   app shell — so it takes §5's toggle-group material and hovers the way the
   back link beside it does. The mint was the one colour on this bar that
   appeared nowhere else on the page, and it arrived on the control furthest
   from anything else green.

   The menu it opens is still §9 to the letter — white, rounded-xl, gradient on
   the selected row. A popover is a popover, and it was never the part that
   looked borrowed. */
.tpl-filter__trigger:hover {
  color: rgb(15 23 42);
  background: var(--tpl-glass-hover);
}

.tpl-filter__trigger:active {
  transform: scale(0.97);
}

.tpl-filter__trigger:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

.tpl-filter__scrim {
  position: fixed;
  inset: 0;
  z-index: 90;
}

/*
  Never narrower than the control it opened from, and never wider than it needs
  to be. It used to be a flat 13rem against an 11rem trigger and anchored to the
  right, so it hung a third of an inch past the trigger's leading edge with
  nothing above that overhang — a popover that does not line up with its own
  trigger reads as belonging to something else on the page.

  `min-width: 100%` resolves against .tpl-filter, which is exactly the trigger's
  box; `max-content` then grows it for a long event-type name, and `max-width`
  hands it straight back — the trigger now spans its whole column, so matching
  it is both the floor and the ceiling, and a long name truncates in the row
  rather than pushing the popover wider than the control it belongs to.
*/
.tpl-filter__menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 100;
  min-width: 100%;
  width: max-content;
  max-width: 100%;
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
  min-height: var(--tpl-control-h);
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  transition: background-color var(--tpl-dur) var(--tpl-ease-out);
}

.tpl-filter__item:hover {
  background: rgb(248 250 252);
}

/* Inset, because the row runs the full width of a clipping scroller — an
   outset ring would be cut off on both sides and read as two stray marks. */
.tpl-filter__item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
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

/* In the menu, `opacity` is right — it is what turns the count translucent
   white on the gradient-filled selected row. In the trigger there is no such
   row to inherit from, and a dimmed number beside a truncating label reads as
   the tail of that label rather than as its own value. Colour it outright. */
.tpl-filter__trigger .tpl-filter__count {
  opacity: 1;
  color: rgb(148 163 184);
}

/* --- The catalogue -------------------------------------------------------- */

.tpl-menu__scroll {
  /* Fills its container in both layouts — the sticky column on desktop, the
     sheet on a phone — and each of those caps its own height. It used to carry
     a 21rem cap of its own, from when the catalogue was stacked in the page
     flow above the invitation and the cap was all that kept it from burying it. */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
  /* Inset, not a negative margin paying itself back: a scroll container clips
     to its padding box, so any card sitting flush against the edge loses its
     selection ring and hover lift to the clip. Symmetric, so the two columns
     are the same width. */
  padding: 0.25rem 0.5rem;
  /*
    The list ends where its container does, and it ended on a hard horizontal
    cut through whatever card was there — which reads as a rendering fault
    rather than as "there is more below". Dissolving instead is the cheapest
    possible scroll affordance: no gradient overlay to keep in sync with the
    ground it stands on, and nothing to position. The desktop column's top edge
    already does it (the sticky heading's masked band); this is the same idea at
    the other end, and it is as true of the phone's sheet as of that column.

    Vertical only, so a card's selection ring and hover lift still reach the
    full width of the scroller.
  */
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 2rem), transparent 100%);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 2rem), transparent 100%);
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

/* --- The shelves, as tabs (phone only) ------------------------------------ */

/* Runs to the sheet's own edges, so a tab leaves the row the way a card
   leaves the grid below it — and starts on the same line the cards do, which
   is the sheet's inset plus the scroller's own. Escaping the sheet's padding
   and paying it back as padding is what buys both at once. */
.tpl-plans {
  display: flex;
  flex: none;
  gap: 0.375rem;
  overflow-x: auto;
  scrollbar-width: none;
  margin-inline: -0.5rem;
  padding-inline: 1rem;
  scroll-padding-inline: 1rem;
  padding-bottom: 0.125rem;
  margin-bottom: 0.5rem;
}

.tpl-plans::-webkit-scrollbar {
  display: none;
}

/* Not uppercased. These are product names — "Free Basic", "Standard" — and
   credits are plan-scoped, so the name is the thing a partner has to read
   exactly; setting it in caps restyles a name into a label. It also buys the
   legibility back that lets the row sit at a thumb-sized 36px instead of the
   23px it was, which on the one layout where these ARE the navigation was the
   smallest tap target on the page. */
.tpl-plan {
  display: inline-flex;
  flex: none;
  min-height: 2rem;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  padding: 0 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  color: rgb(71 85 105);
  transition:
    background-color var(--tpl-dur) var(--tpl-ease-out),
    border-color var(--tpl-dur) var(--tpl-ease-out),
    color var(--tpl-dur) var(--tpl-ease-out),
    box-shadow var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

/* Pointer only: on touch, :hover latches on tap and the unchosen shelf is left
   looking half-chosen next to the one that actually is. */
@media (hover: hover) and (pointer: fine) {
  .tpl-plan:hover:not(.is-active) {
    border-color: rgb(203 213 225);
    background: rgb(248 250 252);
    color: rgb(15 23 42);
  }
}

.tpl-plan:active {
  transform: scale(0.97);
}

.tpl-plan:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

.tpl-plan.is-active {
  border-color: transparent;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.2);
}

.tpl-plan__count {
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}

/*
  Air between two shelves — which only the desktop column has.

  Scoped to it, because the sibling combinator reads the DOM and not `display`:
  on a phone the shelves are tabs and exactly one is ever on screen, but the
  hidden sections before it still qualify it as an adjacent sibling. So every
  shelf but the FIRST would open 20px down from the sheet's own tabs, for no
  reason a visitor could see.
*/
@media (min-width: 1024px) {
  .tpl-menu-group + .tpl-menu-group {
    margin-top: 1.25rem;
  }
}

/*
  Sentence case, and a step up in size and colour from the "Designs" label
  above it.

  Two uppercase micro-labels stacked directly on top of one another — DESIGNS
  · 12, then FREE BASIC · 3 — is an eyebrow over an eyebrow: at the same size,
  weight and colour neither one separates anything, and the column opens on
  two rows of the same texture before a single design is visible. One eyebrow
  names the column; the shelves under it are named the way their plan is
  actually written, which is also the only form a partner can match against
  what they are buying.
*/
.tpl-menu-group__head {
  position: sticky;
  top: -0.25rem;
  z-index: 2;
  margin-bottom: 0.375rem;
  padding: 0.5rem 0 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: rgb(30 41 59);
}

/*
  The band the heading rides on, and the reason it is a pseudo-element.

  It used to be the heading's own background: a 94%-opaque strip with a hard
  bottom edge, which is two visible faults at once — the artwork ghosts through
  it, and a card sliding under it is cut off by a straight line across the
  design. Both are the kind of thing you see without being able to name.

  Solid where the words are, dissolving below them: a card fades out as it
  reaches the heading instead of meeting an edge. The fade is a mask rather
  than a gradient in `background`, because it also has to take the band's own
  bottom edge with it — and it bleeds sideways into the scroller's padding, so
  a card's selection ring has nowhere to peek out.
*/
.tpl-menu-group__head::before {
  content: '';
  position: absolute;
  inset: -0.5rem -0.5rem 0;
  z-index: -1;
  background: var(--tpl-ground);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%);
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
  box-shadow: var(--tpl-focus);
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

/*
  §5 segmented control: one glass pill, gradient on the chosen segment.

  Padded to land on the page's control height, so it and the back link across
  the row are the same object seen twice rather than a 42px pill beside a 32px
  one — a ten-pixel difference between two things sitting on the same centre
  line is the kind of fault that is seen long before it is named.

  `margin-left: auto` is what pins it to the trailing corner — on a phone
  against the back link, on desktop against the headline that grew into the
  space between them.
*/
.tpl-seg {
  display: inline-flex;
  flex: none;
  margin-left: auto;
  align-items: center;
  gap: 0.125rem;
  border-radius: 9999px;
  border: 1px solid var(--tpl-glass-edge);
  background: var(--tpl-glass);
  padding: 0.1875rem;
  backdrop-filter: blur(12px);
  box-shadow: var(--tpl-glass-lift);
}

.tpl-seg__btn {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: 9999px;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(71 85 105);
  transition:
    background-color var(--tpl-dur) var(--tpl-ease-out),
    color var(--tpl-dur) var(--tpl-ease-out),
    box-shadow var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

.tpl-seg__btn:hover {
  color: rgb(30 41 59);
}

.tpl-seg__btn:active {
  transform: scale(0.97);
}

/* Inset: the pill clips its segments to a 3px pad, so an outset ring would be
   drawn half underneath its own container. */
.tpl-seg__btn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
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

/* The stage: the controls, then the phone they act on, on one centre line. */
.tpl-stage {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/*
  Which screen — asked in one row directly over the phone it is about.

  Desktop only, and so is everything it holds. It used to be sticky under the
  top bar, with the language toggle beside it, because on a phone the page
  scrolled and the row would otherwise scroll away from the stage it steered.
  A phone has neither now: the page is exactly one window tall, and these two
  controls are tabs on the dock at the foot of it.
*/
.tpl-stagebar {
  display: flex;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
}

/*
  §5 segmented control, the same pill as the view controls in the header —
  because it is the same kind of question asked about the same thing.

  One row, always. `nowrap` plus a sideways scroll rather than a wrap: a second
  row of chrome comes straight off the height of the phone under it, and the
  three Khmer labels are within ~30px of fitting a 390px screen as it is.
*/
.tpl-steps {
  display: flex;
  flex: none;
  max-width: 100%;
  align-items: center;
  gap: 0.125rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  border-radius: 9999px;
  border: 1px solid var(--tpl-glass-edge);
  background: var(--tpl-glass);
  padding: 0.1875rem;
  backdrop-filter: blur(12px);
  box-shadow: var(--tpl-glass-lift);
}

/* The scroller clips to its padding box, so a step's ring has to be drawn
   inside it — and no step can grow a hit area past the pill's own edge, which
   is why the height below is honest rather than extended by a pseudo-element. */

.tpl-steps::-webkit-scrollbar {
  display: none;
}

.tpl-step {
  display: inline-flex;
  flex: none;
  min-height: 2rem;
  align-items: center;
  border-radius: 9999px;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  color: rgb(71 85 105);
  transition:
    background-color var(--tpl-dur) var(--tpl-ease-out),
    color var(--tpl-dur) var(--tpl-ease-out),
    box-shadow var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

.tpl-step:hover {
  color: rgb(15 23 42);
}

.tpl-step:active {
  transform: scale(0.97);
}

.tpl-step:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

.tpl-step.is-active {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.2);
}

/* --- The dock: the phone's own tab bar ------------------------------------ */

/*
  The app's MobileTabBar, on a page that ships without the app shell.

  Same pill, same material (`.glass-pill`, shared from main.css so the two
  cannot drift), same rule that only the tab you are on carries a label — which
  is what lets five controls hug their content and leave real air at both edges
  instead of spanning the screen as a bar.

  The wrapper is click-through: it spans the window so the pill can be centred
  in it, but the strip either side of the pill belongs to the invitation behind.
*/
.tpl-dock {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 70;
  display: flex;
  justify-content: center;
  padding: 0 0.75rem max(0.75rem, env(safe-area-inset-bottom));
  pointer-events: none;
}

.tpl-dock__pill {
  pointer-events: auto;
  max-width: 100%;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 0.375rem;
}

/* No padding of its own, so a tab's offset within the row is also the
   indicator's offset. It scrolls rather than wraps: a second row of chrome
   comes straight off the height of the phone above it, and Khmer's labels are
   within ~30px of fitting a 360px screen as they are. */
.tpl-dock__row {
  position: relative;
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 0.125rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.tpl-dock__row::-webkit-scrollbar {
  display: none;
}

/* Moved, never repainted: one gradient that travels between the tabs. Its
   geometry is set from JS every frame of the move — see the indicator. */
.tpl-dock__indicator {
  position: absolute;
  inset-block: 0;
  left: 0;
  z-index: 0;
  border-radius: 9999px;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.25);
  pointer-events: none;
  will-change: transform;
}

.tpl-dock__tab {
  position: relative;
  z-index: 1;
  display: inline-flex;
  flex: none;
  /* The page's own control height, which is also a target that survives a
     thumb. */
  height: var(--tpl-control-h);
  align-items: center;
  border-radius: 9999px;
  padding: 0 0.5rem;
  color: rgb(100 116 139);
  transition:
    color 200ms var(--tpl-ease-out),
    padding 380ms cubic-bezier(0.32, 0.72, 0, 1),
    transform var(--tpl-press) var(--tpl-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .tpl-dock__tab:hover {
    color: rgb(51 65 85);
  }
}

.tpl-dock__tab:active {
  transform: scale(0.95);
}

/* Inset: the row clips to the pill's 6px pad, so an outset ring would be drawn
   half underneath its own container. */
.tpl-dock__tab:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

.tpl-dock__tab.is-active {
  color: #fff;
  padding: 0 0.75rem;
}

/* Width opens through a grid column rather than a max-width, so the open and
   the close ease identically. */
.tpl-dock__label {
  display: grid;
  grid-template-columns: 0fr;
  margin-left: 0;
  transition:
    grid-template-columns 380ms cubic-bezier(0.32, 0.72, 0, 1),
    margin 380ms cubic-bezier(0.32, 0.72, 0, 1);
}

.tpl-dock__tab.is-active .tpl-dock__label {
  grid-template-columns: 1fr;
  margin-left: 0.375rem;
}

/*
  Held back until the travelling pill is most of the way here: it can only lag
  the layout it is chasing, so a label that appeared with the layout would spend
  the first half of the move sitting outside it. Leaving is quicker and
  undelayed for the same reason from the other side — the outgoing text has to
  be gone before the pill arrives over it.

  Clipped rather than ellipsised, because the column opens from zero and an
  ellipsis would show through most of the reveal; the cap is what keeps Khmer's
  longer labels from pushing the row into a scroll.
*/
.tpl-dock__label-text {
  overflow: hidden;
  white-space: nowrap;
  max-width: 5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  opacity: 0;
  transition: opacity 100ms var(--tpl-ease-out);
}

.tpl-dock__tab.is-active .tpl-dock__label-text {
  opacity: 1;
  transition-duration: 200ms;
  transition-delay: 200ms;
}

/* Between what is on the screen and how it is being shown. */
.tpl-dock__divider {
  flex: none;
  width: 1px;
  height: 1.25rem;
  margin-inline: 0.25rem;
  background: rgba(148, 163, 184, 0.45);
}

.tpl-dock__btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  flex: none;
  height: var(--tpl-control-h);
  min-width: var(--tpl-control-h);
  align-items: center;
  justify-content: center;
  gap: 0.3125rem;
  border-radius: 9999px;
  padding: 0 0.4375rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgb(71 85 105);
  transition:
    background-color 200ms var(--tpl-ease-out),
    color 200ms var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .tpl-dock__btn:hover {
    color: rgb(15 23 42);
    background: rgba(15, 23, 42, 0.04);
  }
}

.tpl-dock__btn:active {
  transform: scale(0.95);
}

.tpl-dock__btn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

/* Held lit while the sheet it opened is up — the same slate tint the app's own
   tab bar uses for its open profile menu, rather than the brand gradient, which
   belongs to the tab you are on and would read as a fourth stage. */
.tpl-dock__btn.is-open {
  background: rgba(15, 23, 42, 0.07);
  color: rgb(15 23 42);
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

/*
  Wide and small, so it costs one or two lines rather than three. Everything it
  takes vertically comes straight off the height of the phones above it — which
  on a phone is the whole argument for not showing it here at all: three lines
  of prose that reads once, standing permanently in the band the invitation
  wants. Up there it is behind the mark in the top bar instead.
*/
.tpl-note {
  display: none;
}

@media (min-width: 1024px) {
  .tpl-note {
    display: block;
    max-width: min(100%, 60rem);
    text-align: center;
    font-size: 0.75rem;
    line-height: 1.55;
    color: rgb(100 116 139);
  }
}

/* --- Loading + empty ------------------------------------------------------ */

/* 390x844, the phone the frame actually is — not the 2:3 box this used to be.
   A skeleton in the wrong proportion means the page settles into a different
   shape the moment it loads, which is the one thing a skeleton exists to
   prevent. */
.tpl-skeleton-frame {
  width: 100%;
  max-width: 300px;
  aspect-ratio: 390 / 844;
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

.tpl-empty__cta:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

/* --------------------------------------------------------------------------
   Phone: exactly the window, and nothing spills out of it

   Last in the file on purpose. Every rule here overrides a base declared above
   it at the same specificity, so it has to come after them — the first draft of
   this block sat next to `.tpl-page` at the top and `.tpl-studio { display:
   grid }` two hundred lines below quietly won.
   -------------------------------------------------------------------------- */

/*
  The page is three things — a top bar, one phone, one dock — and all three have
  to be visible at once, which is only true when the middle one is fitted to
  what the other two leave. Letting the page scroll instead is precisely how the
  invitation ended up underneath its own controls: the frame was sized from a
  guess, came out taller than the space it had, and the two bands of chrome
  fixed over it then rode across the thing they were labelling.

  So the column is locked to the window and the frame is measured off the box it
  actually gets (see frameMaxWidth). Nothing here can scroll, and nothing needs
  to.
*/
@media (max-width: 1023px) {
  .tpl-page {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /*
    A fixed band at the top, and not a sticky one: nothing scrolls under it any
    more, and sticky was actively wrong here. A sticky box may not leave its
    containing block's padding box, so the negative top margin that pulls this
    band to the top of the page moved it in layout and not on screen — it was
    painted 12px lower than the 60px slot it occupied, and the stage's first
    6px were drawn underneath it. Static, the two agree.
  */
  .tpl-page__head {
    position: static;
    flex: none;
  }

  .tpl-studio {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    /* The catalogue is an overlay down here, so there is no second band to
       separate the stage from. */
    gap: 0;
  }

  .tpl-studio__stage,
  .tpl-stage,
  .tpl-frames {
    flex: 1;
    min-height: 0;
  }

  .tpl-frames {
    /* The phone sits in the middle of whatever height is left, and the frame is
       fitted to that height — so this clips nothing in practice. It is the
       guard for the one case that can exceed it: a window short enough to hit
       the frame's floor, where clipping beats handing the page a scrollbar it
       has no room to use. */
    align-items: center;
    overflow: hidden;
  }

  /* The one block on the page that can be taller than the window it is in. */
  .tpl-empty {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  /* Fitted to the box like the frame it stands in for, or the page visibly
     resettles the moment it loads. */
  .tpl-skeleton-frame {
    height: 100%;
    width: auto;
    max-width: 100%;
  }
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
  .tpl-step:active,
  .tpl-icon-btn:active,
  .tpl-plan:active,
  .tpl-dock__tab:active,
  .tpl-dock__btn:active,
  .tpl-sheet__close:active,
  .tpl-empty__cta:active {
    transform: none;
  }

  /* The dock keeps its colour changes and drops the movement: the label stops
     sliding open and the indicator stops travelling (the glide checks the same
     preference and jumps instead), but which tab is lit still reads. */
  .tpl-dock__tab,
  .tpl-dock__label {
    transition-property: color;
  }

  .tpl-dock__label-text {
    transition: none;
  }

  /* The sheet still fades — that is what says it arrived — but it no longer
     rises into place. */
  .tpl-studio__menu,
  .tpl-studio__menu.is-open {
    transition-property: opacity, visibility;
  }

  .tpl-sheet__scrim {
    animation: none;
  }
}
</style>
