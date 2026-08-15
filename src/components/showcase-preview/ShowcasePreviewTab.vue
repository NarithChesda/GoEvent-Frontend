<template>
  <div class="showcase-studio" :style="{ '--panel-left': panelLeft }">
    <!-- Content panel: a true extension of EventNavigationTabs.vue's own
         fixed icon sidebar — same top/height/glass background, docked right
         at its trailing edge with zero gap, sliding out in place (not a
         floating card).
         Desktop only. Below `lg` this used to become a full-screen drawer over
         the whole app (header included) opened by a 24px-wide chevron — two
         problems at once: an under-minimum tap target, and a modal covering
         the page you were meant to be editing *alongside*. On mobile the edit
         forms are the page itself instead (see .showcase-studio__mobile-body),
         so there's no drawer and no handle. -->
    <div
      v-if="canEdit && !isMobileStudio"
      class="showcase-studio__panel-shell"
      :class="{ 'is-open': panelMode === 'content' }"
    >
      <div class="showcase-studio__panel-inner">
        <!-- No header/close button here — the edge chevron toggle (below)
             already opens and closes this panel; a second, redundant control
             just duplicated it and ate vertical space. -->
        <div class="showcase-studio__panel-body">
          <!-- EventMediaTab reused wholesale — its own 10 section cards are
               coordinated into a single-open accordion (see
               useAccordionGroup.ts). -->
          <EventMediaTab
            v-if="panelMode === 'content'"
            :event-id="eventId"
            :can-edit="canEdit"
            :initial-media="eventData?.photos || []"
            :event-data="eventData"
            :show-category-specific-sections="showCategorySpecificSections"
            hide-header
            @media-updated="onMediaUpdated"
            @event-updated="onEditorSaved"
            @content-refreshed="onEditorSaved()"
          />
        </div>
      </div>
    </div>

    <button
      v-if="canEdit && !isMobileStudio"
      type="button"
      class="showcase-studio__panel-toggle"
      :class="{ 'is-open': panelMode === 'content' }"
      :aria-expanded="panelMode === 'content'"
      :aria-label="t('management.showcasePreview.panelContent')"
      @click="togglePanel"
    >
      <ChevronLeft v-if="panelMode === 'content'" class="w-4 h-4" />
      <ChevronRight v-else class="w-4 h-4" />
    </button>

    <div
      class="showcase-studio__main"
      :class="{ 'is-shrunk': !isMobileStudio && panelMode === 'content' }"
    >
      <div v-if="!isMobileStudio" class="showcase-preview-tab__header">
        <div>
          <h2 class="showcase-preview-tab__title">{{ t('management.showcasePreview.title') }}</h2>
          <p class="showcase-preview-tab__subtitle">{{ t('management.showcasePreview.subtitle') }}</p>
        </div>

        <div class="showcase-preview-tab__header-actions">
          <!-- Activation status: whether what's on screen is actually what
               guests get. The studio renders an unpaid template from the public
               template assets (see loadPreviewTemplateFallback), so without
               this the preview looks finished while guests still see nothing —
               and it carries the Activate CTA so buying happens right here
               instead of on another tab. -->
          <ActivationStatusPill
            v-if="activationResolved"
            :state="activationState"
            :price="activationPrice"
            :can-edit="canEdit"
            @activate="showPaymentDrawer = true"
            @view-payment="emit('open-activation')"
          />

          <!-- View controls: "how am I looking at this" — frame layout and
               preview language — as segments of ONE glass pill rather than two
               separate floating controls. They were previously styled alike but
               sized differently (the layout switch's 4px padding made it 8px
               taller than the language toggle), which read as two unrelated
               widgets that happened to share a colour. -->
          <div
            v-if="canViewLivePreview && (visibleFrames.length > 1 || availableLanguages.length > 1)"
            class="showcase-preview-tab__view-controls"
            role="group"
            :aria-label="t('management.showcasePreview.viewControlsLabel')"
          >
            <!-- Single-frame focus vs. every visible frame side by side (2 or 3,
                 however many this event actually has). Pointless with only one
                 frame, so the language segment can end up alone in the pill. -->
            <template v-if="visibleFrames.length > 1">
              <button
                v-for="opt in VIEW_MODE_OPTIONS"
                :key="opt.value"
                type="button"
                class="showcase-preview-tab__seg"
                :class="{ 'is-active': viewMode === opt.value }"
                :title="t(opt.labelKey)"
                :aria-label="t(opt.labelKey)"
                @click="viewMode = opt.value"
              >
                <component :is="opt.icon" class="w-4 h-4" />
              </button>
            </template>

            <span
              v-if="visibleFrames.length > 1 && availableLanguages.length > 1"
              class="showcase-preview-tab__seg-divider"
              aria-hidden="true"
            />

            <!-- Cycles through the languages the frames render in. -->
            <button
              v-if="availableLanguages.length > 1"
              type="button"
              class="showcase-preview-tab__seg showcase-preview-tab__seg--lang"
              :title="t('management.showcasePreview.switchLanguage')"
              :aria-label="t('management.showcasePreview.switchLanguage')"
              @click="cycleLanguage"
            >
              <Languages class="w-3.5 h-3.5" />
              <span>{{ currentLanguage.toUpperCase() }}</span>
            </button>
          </div>

          <!-- Templates: the same browse-templates modal used elsewhere, wired
               to broadcast a live non-destructive preview into the frames while
               browsing (see BrowseTemplateModal.vue's preview-stage/
               preview-clear emits) — Apply persists for real via its own
               existing confirm flow. The studio's primary action, so it keeps
               the brand gradient; the activation CTA beside it is deliberately
               amber instead, since two gradients 10px apart read as two
               competing primaries. -->
          <button
            v-if="canEdit"
            type="button"
            class="showcase-preview-tab__templates-btn"
            @click="showTemplatesModal = true"
          >
            <Palette class="w-4 h-4" />
            <span>{{ t('management.templatePaymentTab.browseBtn.templates') }}</span>
          </button>
        </div>
      </div>

      <!-- Mobile toolbar. The desktop header's title + subtitle are dropped
           rather than stacked: the mobile tab bar sitting directly above
           already names this tab, and those two lines cost ~90px of a ~730px
           usable fold to repeat what the user just tapped.
           Sticky, because the edit surface below it is ~10 accordion sections
           long and Preview has to stay one tap away from wherever you are in
           it. -->
      <div v-else class="studio-mobile-bar">
        <ActivationStatusPill
          v-if="activationResolved"
          :state="activationState"
          :price="activationPrice"
          :can-edit="canEdit"
          @activate="showPaymentDrawer = true"
          @view-payment="emit('open-activation')"
        />

        <span v-else class="studio-mobile-bar__spacer" />

        <button
          v-if="canEdit"
          type="button"
          class="showcase-preview-tab__templates-btn"
          :title="t('management.templatePaymentTab.browseBtn.templates')"
          :aria-label="t('management.templatePaymentTab.browseBtn.templates')"
          @click="showTemplatesModal = true"
        >
          <Palette class="w-4 h-4" />
          <span>{{ t('management.templatePaymentTab.browseBtn.templates') }}</span>
        </button>

        <!-- The mobile studio's primary action, and deliberately NOT a FAB:
             the bottom-right corner on mobile is already a coordinated stack
             (MobileTabBar's floating pill at z-70, the primary FAB slot at
             --fab-bottom, ContactUsFAB in --fab-stack-2 above it via its own
             hasFabBelow prop), so a fourth floating button there would either
             hide under the tab bar or force this tab to negotiate that stack
             from the inside. It also belongs here on the merits — it's a view
             control, next to the other view control. -->
        <button
          v-if="canViewLivePreview && event?.id && !loading"
          type="button"
          class="studio-preview-btn"
          @click="openMobilePreview"
        >
          <Eye class="w-4 h-4 flex-shrink-0" />
          <span>{{ t('management.showcasePreview.mobilePreview.open') }}</span>
        </button>
      </div>

      <!-- Mobile: the edit forms ARE the page, and the preview is a full-screen
           sheet reached from the toolbar above. The desktop side-by-side split
           can't survive here — there is no width for a phone-shaped frame
           beside a form column, and the previous fallback (stacking near
           full-width frames down the page) also created a hard scroll trap,
           since a finger on an editable frame reaches the iframe (whose
           cover/transition stages don't scroll) and never the page behind it.
           Running the forms full-width also drops the ~440px-panel
           compensations further down in <style> — labels, subtitles and
           section chevrons all come back. -->
      <template v-if="isMobileStudio">
        <div v-if="error" class="showcase-preview-tab__error">{{ error }}</div>

        <div v-if="canEdit" class="showcase-studio__mobile-body">
          <EventMediaTab
            :event-id="eventId"
            :can-edit="canEdit"
            :initial-media="eventData?.photos || []"
            :event-data="eventData"
            :show-category-specific-sections="showCategorySpecificSections"
            hide-header
            @media-updated="onMediaUpdated"
            @event-updated="onEditorSaved"
            @content-refreshed="onEditorSaved()"
          />
        </div>

        <p v-else class="showcase-preview-tab__no-preview">
          {{ t('management.showcasePreview.mobilePreview.readOnly') }}
        </p>
      </template>

      <div v-else-if="loading" class="showcase-preview-tab__loading">
        <div class="showcase-preview-tab__spinner" />
        <span>{{ t('management.media.loading') }}</span>
      </div>

      <div v-else-if="error" class="showcase-preview-tab__error">{{ error }}</div>

      <div v-else-if="event?.id && canViewLivePreview" class="showcase-preview-tab__viewer">
        <!-- Row: side controls (frame picker) beside the frames, as real flex
             siblings rather than floated inside whichever frame is "leading"
             — that used to position them with a small negative offset off a
             frame's own edge, which only reads correctly when the frame
             happens to sit right against the available space. In "multiple"
             view the frames grid starts flush at the row's left edge with no
             gutter at all, and even in "single" view the frame is centered
             in a much wider column, so that fixed offset either overlapped
             the frame's artwork or left a large unused gap instead of
             actually using it. Real flex siblings make the browser reserve
             genuine space for this column and hand the rest to the frames —
             no measuring/anchoring needed, and it now works identically in
             both view modes. (The language toggle that used to live here
             moved up to the header row, beside the layout switch.) -->
        <div class="showcase-preview-tab__frames-row">
          <!-- Frame picker: only meaningful in single-frame focus mode, where
               the other frames are hidden and need some way to switch to —
               a minimal progress-dot timeline instead of a boxed tab list. -->
          <div
            v-if="viewMode === 'single' && visibleFrames.length > 1"
            class="showcase-preview-tab__frame-timeline"
            role="group"
            :aria-label="t('management.showcasePreview.layoutSwitchLabel')"
          >
            <button
              v-for="(pickerFrame, index) in visibleFrames"
              :key="pickerFrame.id"
              type="button"
              class="showcase-preview-tab__frame-step"
              :class="{ 'is-active': activeFrameId === pickerFrame.id }"
              @click="activeFrameId = pickerFrame.id"
            >
              <span class="showcase-preview-tab__frame-step-track">
                <span class="showcase-preview-tab__frame-step-dot" />
                <span
                  v-if="index < visibleFrames.length - 1"
                  class="showcase-preview-tab__frame-step-line"
                />
              </span>
              <span class="showcase-preview-tab__frame-step-label">{{ t(pickerFrame.labelKey) }}</span>
            </button>
          </div>

          <!-- The frame list comes from the resolved preview renderer (V1's
               cover/transition/main today — a V2 renderer will declare its
               own pages). Editable frames are interactive when the user can
               edit: clicks go into the frame for click-to-edit text and
               edit-intent regions, while the frame page itself neutralizes
               live buttons/links (RSVP, envelope, music…). -->
          <div
            :ref="setFramesContainerRef"
            class="showcase-preview-tab__frames"
            :class="framesLayoutClass"
          >
            <template v-for="frame in renderer.frames" :key="frame.id">
              <PreviewFrame
                v-if="isFrameVisible(frame)"
                v-show="viewMode === 'single' ? activeFrameId === frame.id : true"
                :ref="(el) => setPreviewFrameRef(frame.id, el)"
                :label="t(frame.labelKey)"
                :width-override="viewMode === 'multiple' ? sharedColumnWidth : undefined"
              >
                <InertIframe
                  :ref="(el) => setFrameRef(frame.id, el)"
                  :src="frameUrl(frame)"
                  :interactive="frame.editable && canEdit"
                  :click-message="frame.clickMessage"
                  @ready="onFrameReady(frame.id)"
                />
              </PreviewFrame>
              <!-- Multiple mode: skip entirely rather than rendering this note —
                   it's a direct sibling of the PreviewFrames inside the grid, so
                   it would occupy its own grid cell and push the next real frame
                   into a wrapped second row (exactly the scroll-required bug this
                   view exists to avoid). Grid columns are already sized off
                   visibleFrames (which excludes this frame), so the remaining
                   frames simply sit side by side with nothing in between. -->
              <div
                v-else-if="viewMode === 'single' && shouldShowHiddenNote(frame)"
                class="showcase-preview-tab__transition-note"
              >
                {{ t(frame.hiddenNoteKey!) }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <p v-else-if="event?.id" class="showcase-preview-tab__no-preview">
        {{ t('management.showcasePreview.noLivePreview') }}
      </p>
    </div>

    <!-- Frames exist only while this is open, which also means mobile no longer
         keeps 2–3 showcase iframes (each with its own videos) mounted for the
         whole session just to sit off-screen. -->
    <MobilePreviewSheet
      v-if="isMobileStudio && canViewLivePreview && event?.id"
      :open="mobilePreviewOpen"
      :frames="visibleFrames"
      :frame-url="frameUrl"
      :can-edit="canEdit"
      :languages="availableLanguages"
      :current-language="currentLanguage"
      :activation-state="activationResolved ? activationState : undefined"
      :staged-template="stagedTemplateData"
      :register-frame="setFrameRef"
      @close="closeMobilePreview"
      @cycle-language="cycleLanguage"
      @activate="showPaymentDrawer = true"
      @active-frame-changed="onMobileActiveFrameChanged"
    />

    <!-- Parent-side editors for edit intents posted by the frames (logo
         replace, gmap embed, host image, photo uploads) — full-size here in
         the manage page, reusing the forms tab's own components. -->
    <PreviewEditorHost
      v-if="canEdit && event?.id"
      :event-id="eventId"
      :event-data="eventData"
      @saved="onEditorSaved"
    />

    <!-- Checkout, opened straight from the activation pill — the same drawer the
         activation tab mounts, so there's one payment flow, not two. -->
    <PaymentDrawer
      v-if="canEdit"
      :open="showPaymentDrawer"
      :event-id="eventId"
      :template-package="activationPackage"
      :template-id="eventData?.event_template ?? null"
      :template-name="activationTemplateName"
      :current-payment="activationPayment"
      @close="showPaymentDrawer = false"
      @submitted="refreshActivationPayments()"
    />

    <BrowseTemplateModal
      v-if="canEdit"
      :is-open="showTemplatesModal"
      :event-id="eventId"
      :event-category="eventData?.category ?? undefined"
      :event-data="eventData"
      :owned-template-names="ownedTemplateNames"
      @close="showTemplatesModal = false"
      @template-selected="handleTemplateAppliedFromModal"
      @preview-stage="handleTemplateStaged"
      @preview-clear="handleTemplateStageCleared"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, nextTick, watch, inject, type Ref } from 'vue'
import { Smartphone, LayoutGrid, ChevronLeft, ChevronRight, Palette, Languages, Eye } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useHistoryOverlay } from '@/composables/useHistoryOverlay'
import { useEventShowcase, type TemplateAssets } from '@/composables/useEventShowcase'
import type { Event, EventPhoto, EventTemplate } from '@/services/api'
import { eventTemplateService } from '@/services/api'
import { useTemplateActivation } from '@/composables/useTemplateActivation'
import {
  resolvePreviewSaveScope,
  type PreviewSaveScope,
} from '@/composables/showcase-preview/previewRefreshScope'
import PreviewFrame from './PreviewFrame.vue'
import InertIframe from './InertIframe.vue'
import MobilePreviewSheet from './MobilePreviewSheet.vue'
import PreviewEditorHost from './editors/PreviewEditorHost.vue'
import BrowseTemplateModal from '../BrowseTemplateModal.vue'
import EventMediaTab from '../EventMediaTab.vue'
import ActivationStatusPill from '../template/ActivationStatusPill.vue'
import PaymentDrawer from '../template/PaymentDrawer.vue'
import {
  resolvePreviewRenderer,
  type PreviewFrameDescriptor,
} from './renderers/resolvePreviewRenderer'

interface Props {
  eventId: string
  canEdit: boolean
  /** The manage page's event record, for the parent-side editors. */
  eventData?: Event
  /** Whether this event's category actually renders the V1
   *  cover/transition/main-content pipeline the live preview frames reuse
   *  (wedding/birthday/housewarming/funeral). Non-showcase categories (e.g.
   *  Conference) still get the Content panel/Templates modal — just no
   *  frames. */
  canViewLivePreview: boolean
  /** Passed straight through to the Content panel's EventMediaTab —
   *  controls visibility of category-specific sections (dress code, etc). */
  showCategorySpecificSections?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** A preview editor changed event-level data — lets EventManageView keep
   *  its copy (and the other tabs) fresh, same contract as EventMediaTab. */
  'event-updated': [event: Event]
  /** Pass-through of EventMediaTab's own media-updated (photo reorder/delete
   *  outside the full event payload). */
  'media-updated': [media: EventPhoto[]]
  /** A template was applied for real via the Templates modal — carries the
   *  same EventTemplate payload BrowseTemplateModal's own template-selected
   *  emits; EventManageView merges it with the same handler it already uses
   *  for the template-payment tab's own BrowseTemplateModal usage. */
  'template-applied': [template: EventTemplate]
  /** The organizer asked to see the payment record (pending review / receipt) —
   *  EventManageView switches to the activation tab. */
  'open-activation': []
}>()

const { t } = useAppLanguage()

// ---------------------------------------------------------------------------
// Activation status: shared with the activation tab so the studio pill and that
// tab's stepper can never disagree. Drives the header pill, the unpaid frame
// watermark, and which template/plan the inline checkout charges for.
// ---------------------------------------------------------------------------
const {
  state: activationState,
  isResolved: activationResolved,
  price: activationPrice,
  templateName: activationTemplateName,
  templatePackage: activationPackage,
  currentPayment: activationPayment,
  payments: activationPayments,
  loadPayments: loadActivationPayments,
  refreshPayments: refreshActivationPayments,
} = useTemplateActivation(() => props.eventData)

const showPaymentDrawer = ref(false)

/**
 * Templates already paid for, so the browser can mark them owned rather than
 * inviting a second purchase. Matched by name because payments carry no
 * template id (normalized, same as the activation composable does).
 */
const ownedTemplateNames = computed(() => {
  const names = new Set<string>()
  for (const payment of activationPayments.value) {
    if (payment.status === 'confirmed' && payment.template_name) {
      names.add(payment.template_name.trim().toLowerCase())
    }
  }
  return names
})

// Only used here to resolve the renderer/frame visibility and drive the
// language switcher/loading/error chrome — the actual stage rendering happens
// inside each <iframe>'s own ShowcasePreviewFrameView instance (each with a
// genuine mobile-viewport browsing context, since the showcase components
// rely on real vh/vw units that a plain scaled-down div can't satisfy).
const {
  loading,
  error,
  event,
  templateAssets,
  eventPhotos,
  availableLanguages,
  currentLanguage,
  loadShowcase,
  refreshShowcaseData,
  applyPreviewTemplateFallback,
} = useEventShowcase({ eventId: props.eventId, skipMetaTags: true })

// Preview-only fallback (mirrors ShowcasePreviewFrameView.vue's own): the
// showcase endpoint nulls `template_assets` until payment is confirmed, so a
// selected-but-unpaid template leaves THIS tab's `templateAssets` null — which
// gates the frame list (whether the Transition frame even shows for a basic
// wedding, see isBasicWeddingShowcase). The iframes each backfill this
// themselves, but the tab runs its own useEventShowcase instance, so without
// this the Transition frame silently vanishes for an unpaid basic-wedding
// template even though the frame's own iframe (and the paid guest showcase)
// render it. No-op once real (paid) assets are present. Keyed by the selected
// template id, same as frameUrl's templateId param.
const loadPreviewTemplateFallback = async () => {
  const templateId = props.eventData?.event_template
  if (!templateId || event.value?.template_assets) return
  try {
    const response = await eventTemplateService.getPublicTemplateAssets(Number(templateId))
    // Wire shape is `{ template_data: {...} }`, not the flat TemplateAssets the
    // service's type declares (same unwrap the frame view uses).
    const templateData = (response.data as unknown as { template_data?: TemplateAssets } | null)
      ?.template_data
    if (response.success && templateData) {
      applyPreviewTemplateFallback(templateData)
    }
  } catch {
    // Non-fatal — the frame list just reflects the paid-only stage layout.
  }
}

// Declared here (rather than down by the other template-staging logic) so it
// exists before rendererContext's computed below reads it — that computed is
// forced to evaluate during setup by the `immediate: true` watch(visibleFrames)
// further down, which runs before a later `const` in this same script would
// have initialized (a TDZ ReferenceError, not just a stale read).
const stagedTemplateData = ref<TemplateAssets | null>(null)

// While a candidate template is staged (browsing BrowseTemplateModal, before
// Apply), the frame LIST itself (which tabs — Cover/Transition/Main — even
// exist to look at) must reflect that candidate's stage layout, not whatever
// template is actually still applied to the event — otherwise trying on a
// basic-mode template never shows a "Transition" tab if the currently-applied
// real template happens to be standard-mode (has a cover video), even though
// every frame's own iframe content already updated via postTemplatePreview.
const rendererContext = computed(() => ({
  event: event.value,
  templateAssets: stagedTemplateData.value
    ? { standard_cover_video: stagedTemplateData.value.assets?.standard_cover_video ?? null }
    : templateAssets.value,
  hasFeaturedPhoto: eventPhotos.value?.some((p) => p.is_featured) ?? false,
  canEdit: props.canEdit,
}))

const renderer = computed(() => resolvePreviewRenderer(rendererContext.value))

const isFrameVisible = (frame: PreviewFrameDescriptor) =>
  frame.isVisible ? frame.isVisible(rendererContext.value) : true

const visibleFrames = computed(() => renderer.value.frames.filter(isFrameVisible))

// Gates the hidden-frame note separately from isFrameVisible: a frame can be
// hidden either because the template never had this stage at all (no note —
// nothing to explain) or because it's applicable but transiently unused
// (e.g. basic wedding with no featured photo yet — show the note).
const shouldShowHiddenNote = (frame: PreviewFrameDescriptor) =>
  !!frame.hiddenNoteKey &&
  (frame.isApplicable ? frame.isApplicable(rendererContext.value) : true)

// Language switch: a single button (see the leading-slot controls in the
// template) that steps through availableLanguages in order, wrapping around.
const cycleLanguage = () => {
  const langs = availableLanguages.value
  if (langs.length < 2) return
  const currentIndex = langs.findIndex((lang) => lang.language === currentLanguage.value)
  const nextIndex = (currentIndex + 1) % langs.length
  currentLanguage.value = langs[nextIndex].language
}

// ---------------------------------------------------------------------------
// Mobile studio: below `lg` the split-pane studio doesn't fit, and forcing it
// produced the layout this replaces — a fixed drawer of edit forms over the
// whole app, plus near-full-width phone frames stacked down the page that a
// finger couldn't scroll past. So the two halves separate below this boundary:
// the page becomes the edit surface, and the preview becomes a full-screen
// sheet (MobilePreviewSheet).
//
// `lg` and not the frames' old 768px: it's the same boundary the app's own
// chrome uses (EventNavigationTabs' icon rail hides here in favour of the
// mobile tab bar), and tablet portrait has no more room for a phone frame
// beside a form column than a phone does — 768 − 440 leaves ~300px.
// ---------------------------------------------------------------------------
const isMobileStudio = useMediaQuery('(max-width: 1023px)')

// The sheet is a full-screen surface, so it reads as a page — which makes the
// hardware back button read as "close it". Backing it with a history entry
// makes that true; otherwise back would tear down the whole manage page from
// under it. Also makes the open sheet survive a reload.
const {
  isOpen: mobilePreviewOpen,
  open: openMobilePreview,
  close: closeMobilePreview,
} = useHistoryOverlay('preview')

// Crossing back to desktop makes the sheet redundant (the frames are on the
// page again) and would otherwise leave `body { overflow: hidden }` behind.
// Immediate because the same is true of landing on desktop with the sheet's
// flag already in the URL — a link shared from a phone, or a rotated tablet.
watch(
  isMobileStudio,
  (mobile) => {
    if (!mobile) closeMobilePreview()
  },
  { immediate: true },
)

// ---------------------------------------------------------------------------
// Content panel positioning: the panel is a true extension of
// EventNavigationTabs.vue's own fixed icon sidebar (same left edge, right at
// its trailing 88px-wide rail), so it needs the exact same
// home-sidebar-overlay offset that component computes for itself, or the two
// would drift apart whenever that overlay is shown/collapsed.
// ---------------------------------------------------------------------------
const showHomeSidebarOverlay = inject<Ref<boolean>>('showHomeSidebarOverlay', ref(false))
const isCollapsed = inject<Ref<boolean>>('isCollapsed', ref(false))
const isHomeSidebarVisible = computed(() => showHomeSidebarOverlay?.value ?? false)
const sidebarLeftPosition = computed(() => {
  if (!isHomeSidebarVisible.value) return '0px'
  const homeSidebarWidth = isCollapsed?.value ? 96 : 256
  return `${homeSidebarWidth}px`
})
// EventNavigationTabs.vue's own icon rail is a fixed 88px wide (`w-[88px]`).
const panelLeft = computed(() => `calc(${sidebarLeftPosition.value} + 88px)`)

// ---------------------------------------------------------------------------
// Content panel: defaults open when the Design Studio tab first loads, so
// the edit sections are immediately visible rather than requiring a click
// on the edge toggle. When there's no live preview for this event's
// category, closing isn't offered at all (see togglePanel) — there's
// nothing else to fall back to — so the point is moot there anyway.
// ---------------------------------------------------------------------------
const panelMode = ref<'content' | null>('content')

const togglePanel = () => {
  if (panelMode.value === 'content') {
    panelMode.value = props.canViewLivePreview ? null : 'content'
    return
  }
  panelMode.value = 'content'
}

// Templates: opens the shared BrowseTemplateModal (see template for wiring).
const showTemplatesModal = ref(false)

// ---------------------------------------------------------------------------
// View mode: every visible frame (2 or 3, whatever this event actually has —
// never a fixed count) laid out side by side (default) vs. single-frame focus,
// which needs a picker to choose which frame is showing since the others are
// hidden.
// ---------------------------------------------------------------------------
const VIEW_MODE_OPTIONS = [
  { value: 'single' as const, icon: Smartphone, labelKey: 'management.showcasePreview.layoutSingle' },
  { value: 'multiple' as const, icon: LayoutGrid, labelKey: 'management.showcasePreview.layoutMultiple' },
]

const viewMode = ref<'single' | 'multiple'>('multiple')
const activeFrameId = ref<string>('cover')

watch(
  visibleFrames,
  (frames) => {
    if (!frames.length) return
    if (!frames.some((f) => f.id === activeFrameId.value)) activeFrameId.value = frames[0].id
  },
  { immediate: true },
)

const framesLayoutClass = computed(() =>
  viewMode.value === 'multiple' ? `showcase-preview-tab__frames--cols-${visibleFrames.value.length}` : '',
)

type PreviewFrameInstance = InstanceType<typeof PreviewFrame>

const previewFrameRefs = new Map<string, PreviewFrameInstance>()

const setPreviewFrameRef = (id: string, el: unknown) => {
  if (el) previewFrameRefs.set(id, el as PreviewFrameInstance)
  else previewFrameRefs.delete(id)
}

// Re-fit every mounted frame after a layout change — switching view modes
// (or which frame is focused) changes each frame's available width/height,
// which PreviewFrame can't detect on its own.
const remeasurePreviewFrames = () => {
  nextTick(() => {
    for (const inst of previewFrameRefs.values()) inst.measure()
  })
}

watch(viewMode, remeasurePreviewFrames)
watch(activeFrameId, remeasurePreviewFrames)
// The panel opening/closing changes the frames column's available width too
// (push layout on desktop), so remeasure once the width transition settles.
watch(panelMode, () => setTimeout(remeasurePreviewFrames, 320))

// ---------------------------------------------------------------------------
// Shared column width for "multiple" mode: each PreviewFrame used to
// self-measure its own DOM parent via its own ResizeObserver, and those N
// independent observers could settle at slightly different widths depending
// on timing (worst case, one frame mid-layout reads a stale/tiny value and
// gets stuck there) — so frames in the same row ended up visibly different
// sizes. Measuring the shared frames container once here and handing every
// frame the same computed column width keeps them pixel-identical. The
// column count always matches how many frames there are (2 or 3), so the
// grid never wraps to a second row.
// ---------------------------------------------------------------------------
const FRAMES_GRID_GAP_PX = 24 // matches the `gap: 1.5rem` on --cols-2/--cols-3

const framesContainerWidth = ref(0)
let framesResizeObserver: ResizeObserver | null = null

const setFramesContainerRef = (el: unknown) => {
  framesResizeObserver?.disconnect()
  framesResizeObserver = null
  const element = el as HTMLElement | null
  if (!element) return
  framesContainerWidth.value = element.clientWidth
  framesResizeObserver = new ResizeObserver(() => {
    framesContainerWidth.value = element.clientWidth
  })
  framesResizeObserver.observe(element)
}

// Only ever mounted on desktop now (the frames row is `!isMobileStudio`), so
// there's no narrow-viewport case left to stand down for — the grid always has
// room for one real phone-sized frame per column.
const sharedColumnWidth = computed(() => {
  if (viewMode.value !== 'multiple') return undefined
  const cols = Math.max(visibleFrames.value.length, 1)
  return Math.max((framesContainerWidth.value - FRAMES_GRID_GAP_PX * (cols - 1)) / cols, 0)
})

// Remembers the src last computed for each frame id, keyed by the parts that
// legitimately should force a real reload of an ALREADY-mounted frame
// (language, edit mode). `event_template` is deliberately NOT part of that
// key: applying a template now updates already-mounted frames live over the
// bridge (see handleTemplateAppliedFromModal) instead of by changing `src` —
// and changing an <iframe>'s `src` at all, even by one query param, always
// forces the browser to navigate/reload it, for zero visual gain when the
// frame is already showing the right thing. A frame id seen for the first
// time (nothing cached yet) still gets a fresh URL built from whatever
// `event_template` is current, so a newly-visible frame (e.g. the Transition
// stage appearing after a template swap) starts out correct. Entries are
// deleted in setFrameRef when a frame actually unmounts, so a frame that goes
// away and later comes back (a template swap can change which stages apply)
// recomputes fresh instead of reusing a stale cached URL.
const frameSrcCache = new Map<string, { key: string; url: string }>()

const frameUrl = (frame: PreviewFrameDescriptor) => {
  const reactiveKey = `${currentLanguage.value}|${props.canEdit && frame.editable ? '1' : '0'}`
  const cached = frameSrcCache.get(frame.id)
  if (cached && cached.key === reactiveKey) return cached.url

  const params = new URLSearchParams({ stage: frame.id, lang: currentLanguage.value })
  if (props.canEdit && frame.editable) params.set('editable', '1')
  // Always pass the selected template id when one exists — `event_template_enabled`
  // isn't a reliable predictor of whether the showcase endpoint will actually
  // include template_assets (it can be true with no confirmed Payment row yet),
  // so let the frame's own check of the real showcase response decide whether
  // the public-assets fallback is needed instead of gating it here.
  if (props.eventData?.event_template) {
    params.set('templateId', String(props.eventData.event_template))
  }
  const url = `/events/${props.eventId}/showcase-preview-frame?${params.toString()}`
  frameSrcCache.set(frame.id, { key: reactiveKey, url })
  return url
}

// ---------------------------------------------------------------------------
// Frame refs + post-save refresh: when a parent-side editor saves, every
// frame refetches its showcase data (bridge `refresh`), this tab refreshes
// its own copy (frame visibility, languages), and event-level updates
// propagate up to EventManageView.
// ---------------------------------------------------------------------------
type InertIframeInstance = InstanceType<typeof InertIframe>

const frameRefs = new Map<string, InertIframeInstance>()

const setFrameRef = (id: string, el: unknown) => {
  if (el) {
    frameRefs.set(id, el as InertIframeInstance)
  } else {
    frameRefs.delete(id)
    // A frame that's actually gone (not just v-show hidden — e.g. a template
    // swap dropped this stage) needs a fresh src if it ever comes back, not
    // the one cached from before — see frameUrl's cache above.
    frameSrcCache.delete(id)
  }
}

// ---------------------------------------------------------------------------
// Deferred refresh for frames the user isn't currently looking at. In
// "single" focus mode the other 1-2 applicable frames stay mounted (just
// `v-show`n away) so switching to them is instant — but that also means a
// naive "post refresh to every frame" on every save fires a full showcase
// re-fetch for frames nobody is looking at right now. Frames skipped this way
// are marked stale instead, and caught up the moment they actually become
// visible (switching focus in "single" mode, or switching to "multiple",
// where every applicable frame is visible at once).
// ---------------------------------------------------------------------------
const staleFrameIds = new Set<string>()

const refreshFrame = (id: string) => {
  const frame = frameRefs.get(id)
  if (!frame) return
  frame.post('refresh')
  if (stagedTemplateData.value) frame.postTemplatePreview(stagedTemplateData.value)
}

const catchUpFrame = (id: string) => {
  if (!staleFrameIds.delete(id)) return
  refreshFrame(id)
}

watch(activeFrameId, catchUpFrame)
watch(viewMode, (mode) => {
  if (mode === 'multiple') for (const frame of visibleFrames.value) catchUpFrame(frame.id)
})

// The mobile sheet shows exactly one stage at a time (there's no "multiple"
// layout there — no room for it on a real device viewport), so it's tracked
// the same way as desktop's "single" focus mode: whichever stage it reports
// as active is the only one that needs a live refresh right now.
const mobileActiveFrameId = ref<string | null>(null)

const onMobileActiveFrameChanged = (id: string) => {
  mobileActiveFrameId.value = id
  catchUpFrame(id)
}

// ---------------------------------------------------------------------------
// Template live try-on: staging a template broadcasts its assets into every
// mounted frame without touching the backend (stagedTemplateData itself is
// declared earlier, alongside rendererContext, which needs to read it) — any
// content save (below) re-broadcasts the current staged template afterward,
// since a `refresh` bridge message re-fetches real data and would otherwise
// silently cancel an in-progress preview.
// ---------------------------------------------------------------------------

// BrowseTemplateModal emits BOTH `template-selected` and `preview-clear` back
// to back on a successful Apply (its own resetModalState() fires preview-clear
// whenever a selection was active, which it still is right after applying) —
// so without this flag, handleTemplateStageCleared would run right after
// handleTemplateAppliedFromModal and revert the just-applied template's live
// preview back to whatever was staged/real before it (via
// clearStagedTemplatePreview's snapshot restore). handleTemplateAppliedFromModal
// sets this synchronously before either bridge message can go out, so it's
// already true by the time the modal's own close-triggered preview-clear fires.
let suppressNextStageClear = false

const handleTemplateStaged = (templateData: TemplateAssets) => {
  stagedTemplateData.value = templateData
  for (const frame of frameRefs.values()) frame.postTemplatePreview(templateData)
}

// Staging can make a frame appear that wasn't there a moment ago: the frame
// LIST is derived from the staged template's own stage layout (see
// rendererContext), so trying on a basic template while a standard one is
// applied adds the Transition frame — and trying on a standard template adds
// the Event Video frame. Those frames mount as a RESULT of the broadcast above,
// which iterated the frames that existed when it ran, so they never received
// the try-on and loaded the still-applied template's real data instead: the new
// frame rendered in the old template's colours and stayed that way until a full
// page reload. Catching them on their bridge handshake covers that — and it has
// to be the handshake rather than the iframe's `load` event, which fires too
// early to be heard (see postFrameReadyToParent). Harmless for frames that were
// already up: the frame side just re-applies the same staged data over itself.
const onFrameReady = (id: string) => {
  if (!stagedTemplateData.value) return
  frameRefs.get(id)?.postTemplatePreview(stagedTemplateData.value)
}

// Only the frame(s) actually on screen right now need the real data back
// immediately — the rest are marked stale and pick it up via catchUpFrame the
// moment they're actually shown (see the deferred-refresh block above). Mobile
// is always single-frame (see mobileActiveFrameId above); desktop only narrows
// to one frame in "single" focus mode — "multiple" shows every applicable
// frame side by side, so all of them are genuinely on screen at once there.
const refreshVisibleFrames = () => {
  const focusedId = isMobileStudio.value
    ? mobileActiveFrameId.value
    : viewMode.value === 'single'
      ? activeFrameId.value
      : null
  for (const id of frameRefs.keys()) {
    if (focusedId !== null && id !== focusedId) staleFrameIds.add(id)
    else refreshFrame(id)
  }
}

// Cancelling a try-on (closing the modal without confirming, or picking a
// different template while it's staged) never touched the backend, so it
// reverts every frame locally via `preview-template-clear` (see
// clearStagedTemplatePreview in useEventShowcase.ts) rather than the real
// `refresh` refetch onEditorSaved uses — no need to defer this to hidden
// frames either, since it's a free postMessage, not a network request.
// No-ops entirely when suppressed (see suppressNextStageClear above) — a
// real Apply owns clearing stagedTemplateData itself, on its own timing.
const handleTemplateStageCleared = () => {
  if (suppressNextStageClear) {
    suppressNextStageClear = false
    return
  }
  stagedTemplateData.value = null
  for (const frame of frameRefs.values()) frame.post('preview-template-clear')
}

// Confirming Apply used to force a hard iframe reload (frameUrl's templateId
// param changing `src`, which the browser always navigates on, however
// small the change): that was needed because the staged preview's public
// template-assets endpoint was missing the border/frame decoration fields
// the paid showcase endpoint had, so only a real reload (real data) showed
// the template completely. That backend gap is now closed — verified live
// against the running backend on 2026-07-27, see the "Optimistic saves,
// scoped refresh, local try-on revert" note in
// docs/features/SHOWCASE_PREVIEW_EDITOR_PLAN.md — so the already-staged
// preview (see stagePreview in BrowseTemplateModal.vue, which runs the
// instant a template card is picked, well before Apply is even clickable)
// IS the complete, correct look already. Applying for real now just:
//   1. Persists the change server-side (selectTemplateApi, already done by
//      the time this fires) and lets it propagate to the rest of the page.
//   2. Refreshes this tab's OWN bookkeeping (frame list/hidden-note/language
//      list all key off its own templateAssets) — awaited before dropping
//      the staged overlay, so the frame chrome never flashes back to the OLD
//      template for a render while that refetch is in flight.
//   3. Tells every frame to forget its try-on-revert snapshot (the staged
//      data is the real data now) — no visual change, since nothing about
//      showcaseData itself needs to change in the frames.
// frameUrl's cache (see above) separately makes sure the emitted
// `template-applied` — which does update `eventData.event_template` — never
// touches an already-mounted frame's `src` in the first place.
const handleTemplateAppliedFromModal = async (template: EventTemplate) => {
  showTemplatesModal.value = false
  suppressNextStageClear = true
  emit('template-applied', template)
  await refreshShowcaseData()
  await loadPreviewTemplateFallback()
  stagedTemplateData.value = null
  for (const frame of frameRefs.values()) frame.post('preview-template-commit')
  // A different template means a different plan/price and (almost always) an
  // unpaid state — re-read the payment rows so the pill stops advertising the
  // previous template's activation status.
  refreshActivationPayments()
}

const onMediaUpdated = (media: EventPhoto[]) => {
  emit('media-updated', media)
  onEditorSaved()
}

// Every save is propagated upward so EventManageView's copy — and therefore
// this panel's own cards — stay current. What the *frames* owe it varies (see
// previewRefreshScope.ts):
//
//   inert   nothing a frame paints (the link preview's og: text, the music
//           track): leave the frames alone entirely.
//   patch   one value the frames already bind (a replaced logo): push it over
//           the bridge, and Vue re-renders that node in place. No refetch, so
//           no re-mount and no blink. Free postMessage, so every mounted frame
//           gets it, on-screen or not — nothing to defer.
//   refresh anything else, including a payload-less save (photo reorder,
//           template auto-fill) that says nothing about what changed.
const onEditorSaved = (updated?: Event) => {
  const scope: PreviewSaveScope = updated
    ? resolvePreviewSaveScope(props.eventData, updated)
    : { kind: 'refresh' }

  if (scope.kind === 'patch') {
    for (const frame of frameRefs.values()) frame.postEventPatch(scope.fields)
  } else if (scope.kind === 'refresh') {
    refreshVisibleFrames()
    // Silent refresh: this tab's `loading` flag gates the whole frames block,
    // so a full loadShowcase() here would unmount and reload every iframe —
    // exactly the "page refresh" jank the silent path exists to avoid. Re-apply
    // the unpaid-template fallback afterward, since refreshShowcaseData re-fetches
    // real (payment-gated, possibly null) template_assets and would otherwise
    // drop the Transition frame again for a selected-but-unpaid template.
    refreshShowcaseData().then(loadPreviewTemplateFallback)
  }

  if (updated) emit('event-updated', updated)
}

onMounted(() => {
  loadShowcase().then(loadPreviewTemplateFallback)
  // The activation state gates the header pill and the frame watermark, so it
  // has to be real before the frames are worth looking at. (Explicit rather
  // than automatic: usePaymentTemplateIntegration only self-refreshes when the
  // selected template *changes*, and by the time it's constructed here the
  // event's template id is already in place.)
  loadActivationPayments()
})

// Lets the activation tab hand template-swapping back to the one place that can
// preview a candidate live (see its "Change template" action).
defineExpose({
  openTemplates: () => {
    showTemplatesModal.value = true
  },
})
</script>

<style scoped>
.showcase-studio {
  position: relative;

  /* Single source of truth for the content panel's desktop width — the shell's
     open width, the glass surface inside it, the room reserved for it by
     .main.is-shrunk, and the edge handle's resting position all derive from
     this. They must move together or the handle detaches from the panel edge
     and the frames slide under it.

     In `rem`, not `px`, so it follows the 13"-15" laptop root-font scale-down
     in src/assets/main.css like the rest of the UI. As a hard 440px it stayed
     put while everything around it shrank to 75%, so on a laptop it was
     claiming ~33% more of the width than it does on a desktop — the opposite
     of what a smaller screen needs. At 27.5rem it resolves to 440px at the
     normal root size and ~330px on a laptop, i.e. exactly the same proportion
     of the viewport on both, leaving the extra room to the live preview. */
  --studio-panel-w: 27.5rem;
}

/* Content panel: a true extension of EventNavigationTabs.vue's own fixed
   icon sidebar — docked flush at its trailing edge (--panel-left, computed
   in script to match that sidebar's own home-sidebar-overlay offset + its
   88px rail width), left edge pinned there permanently. Opens by growing
   `width` from 0, not by translating a full-width slab in from off-screen —
   a translateX slide has to sweep its start position across x:0 (behind/
   under the icon rail) before reaching its resting place past it, so for
   part of every open animation the panel visibly slid over the rail's
   icons despite ending up beside them. Growing width outward from a fixed
   left edge never occupies rail space at all, at any point in the
   animation — it reads as the panel *extending out of* the sidebar rather
   than a card sliding in over it. This shell is just the clipping mask
   (`overflow: hidden`); the actual glass surface (background/blur/border)
   lives on .panel-inner instead, sized to a constant --studio-panel-w on
   desktop (see the min-width:1024px block below) independent of the shell's
   own animating width, so the reveal looks like a curtain opening rather
   than text reflowing as the box narrows/widens. */
.showcase-studio__panel-shell {
  position: fixed;
  top: 4rem;
  left: var(--panel-left);
  width: 0;
  height: calc(100vh - 4rem);
  z-index: 45;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.showcase-studio__panel-shell.is-open {
  width: var(--studio-panel-w);
}

.showcase-studio__panel-inner {
  /* No explicit width here — defaults to auto (100% of the shell), which is
     exactly right on mobile (the shell already sits at its real, constant
     width there; see the max-width:1023px block). Desktop pins this to
     --studio-panel-w instead (min-width:1024px block below), decoupled from
     the shell's own animating width, so the reveal clips a fixed-size
     surface rather than reflowing its contents as the box grows. */
  height: 100%;
  border-right: 1px solid rgba(148, 163, 184, 0.3);
  /* No fill of its own — same reasoning as EventNavigationTabs' rail, which
     this panel docks onto: the page's `premium-bg` runs through the header, the
     rail, this panel and the frames beside it as one background, instead of
     each surface painting a near-white gradient that can't match the page's.
     Nothing scrolls behind it either — .showcase-studio__main reserves the
     panel's width with margin-left — so its own form cards are the only thing
     over the wash. The border is what marks the edge. */
  background: transparent;
  display: flex;
  flex-direction: column;
}

.showcase-studio__panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  /* Thin custom scrollbar (same recipe as the app's drawers, see §10 of the
     design skill) — the OS-default scrollbar this panel used to render is
     thick and flatly gray, clashing with the glass panel around it. */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.showcase-studio__panel-body::-webkit-scrollbar {
  width: 6px;
}

.showcase-studio__panel-body::-webkit-scrollbar-track {
  background: transparent;
}

.showcase-studio__panel-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.showcase-studio__panel-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* EventMediaTab's ~10 section cards were designed for a full-width tab body,
   where their subtitle/hint text has room to breathe. Reused here at a fixed
   440px, that same text wraps across many lines and reads badly — so clamp
   the subtitle to 2 lines with an ellipsis, and drop the secondary drag-hint
   line entirely (it's a `hidden sm:flex` viewport breakpoint, not a container
   query, so it stays visible at any desktop viewport width regardless of how
   narrow this panel itself is). Scoped to this panel only via :deep() — the
   same components read fine unclamped in their full-width tab context. */
.showcase-studio__panel-body :deep(h5.font-semibold + p.text-sm) {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.showcase-studio__panel-body :deep([class*='sm:flex'][class*='text-slate-400']) {
  display: none !important;
}

/* Section header action clusters (Add/Info/Lock pill(s) + the expand
   chevron) are `flex-shrink-0` — sized to their own content, never
   shrinking — which reads fine beside the title at the full-width tab's
   width, but crowded and misaligned squeezed into this fixed 440px panel
   (worst on Payment Methods, which stacks Add + Info + Lock + chevron
   beside the title). Rather than force the row to wrap (tried first — it
   just relocated the crowding to a second line and left a lone chevron
   looking oddly stranded when a section had no other header button),
   shrink the two space-hungry pieces in place:
   - The expand chevron button is dropped entirely in this panel — the
     title block underneath it is already the click target that toggles
     the section (see useCollapsibleSection.ts), so the icon was a visual
     affordance only, not the only way to trigger it. Full-width tab
     context (not this panel) keeps it, via svg.lucide-chevron-down — a
     class lucide-vue-next itself always adds to every ChevronDown icon
     (see Icon.js), stable regardless of the Tailwind utility classes each
     component happens to pass in.
   - "Add X" pills (Plus icon + label, identified by their shared
     border-dashed/rounded-full pill styling) collapse to icon-only; the
     label moves to a native `title` tooltip on hover (added alongside the
     visible label in each component, so it's inert everywhere else). */
.showcase-studio__panel-body :deep(button:has(> svg.lucide-chevron-down)) {
  display: none;
}

.showcase-studio__panel-body :deep(.border-dashed.border-slate-300.rounded-full) {
  gap: 0;
  padding: 0.5rem;
}

.showcase-studio__panel-body :deep(.border-dashed.border-slate-300.rounded-full > span) {
  display: none;
}

/* Payment Methods' Lock/Unlock button has the same viewport-not-container
   `hidden sm:inline` label bug as the drag-hints above — visible at any
   desktop window width no matter how narrow this panel is. */
.showcase-studio__panel-body :deep(button:has(> svg.lucide-lock) > [class*='sm:inline']),
.showcase-studio__panel-body :deep(button:has(> svg.lucide-lock-open) > [class*='sm:inline']) {
  display: none;
}

/* Toggle: a slim chevron handle riding right at the panel's trailing edge,
   tracking it via the same --panel-left + an is-open offset. Fixed at
   roughly viewport mid-height, independent of the panel's own top anchor.
   Styled as a continuation of the panel's own glass surface (same blur +
   translucent white + soft diffuse shadow as .showcase-studio__panel-shell)
   rather than a flat opaque chip with a hard offset shadow — reads as part
   of the same component instead of a disconnected sticker floating on the
   page background. */
.showcase-studio__panel-toggle {
  position: fixed;
  top: 42vh;
  left: var(--panel-left);
  z-index: 46;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 2.75rem;
  color: rgb(100 116 139);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-left: none;
  border-radius: 0 0.75rem 0.75rem 0;
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.1);
  /* Same duration + curve as the panel's own width transition — the handle
     rides exactly at the panel's growing/shrinking trailing edge, so any
     mismatch here would visibly detach it from that edge mid-animation. */
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease, background 0.2s ease;
}

.showcase-studio__panel-toggle.is-open {
  left: calc(var(--panel-left) + var(--studio-panel-w));
}

.showcase-studio__panel-toggle:hover {
  color: rgb(51 65 85);
  background: rgba(255, 255, 255, 0.95);
}

/* The panel and its handle are desktop-only (`!isMobileStudio`), so there's no
   below-`lg` variant of them any more — the mobile studio runs the same
   EventMediaTab inline at full width instead. See
   .showcase-studio__mobile-body. */

.showcase-preview-tab__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.showcase-preview-tab__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(15 23 42);
}

.showcase-preview-tab__subtitle {
  font-size: 0.875rem;
  color: rgb(100 116 139);
  margin-top: 0.25rem;
}

/* Short viewports — 13"-15" laptops, and any short window on a bigger screen.
   The header collapses to a single row so the frames the user actually came to
   look at aren't pushed below the fold.

   The subtitle is one-time orientation copy ("Edit your showcase and try
   templates…"); on a short screen it costs an entire row plus the header's
   bottom margin, every visit, forever. Dropping it leaves just the title, which
   the toolbar has ample room to sit beside even with the content panel open.

   `flex-wrap` stays `wrap` deliberately rather than being forced to `nowrap`:
   with the subtitle gone the two children fit on one line at any realistic
   width, so wrap never triggers — but it remains a safety valve that degrades
   to two rows instead of overflowing if a long translation of the title or a
   future toolbar control ever does run out of room. */
@media (min-width: 1024px) and (max-height: 1100px) {
  .showcase-preview-tab__header {
    align-items: center;
    margin-bottom: 1rem;
  }

  .showcase-preview-tab__subtitle {
    display: none;
  }
}

/* Studio toolbar.
   Every control in this row is locked to one height via --studio-control-h
   (inherited by ActivationStatusPill too, which reads the same var) and one
   radius. Before this they were 34px / 44px / 38px / 40px tall with three
   different corner radii and two competing brand gradients, which is why the
   row read as four unrelated widgets rather than one toolbar. */
.showcase-preview-tab__header-actions {
  --studio-control-h: 2.25rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  /* Not allowed to grow: the header's own `space-between` then puts this row to
     the right of the title when both fit on one line, and flush left on its own
     line when the studio's side panel squeezes it down — which is where it
     belongs, aligned with the title and the first preview frame rather than
     floating off at the right edge. */
  flex-shrink: 0;
}

/* Mobile toolbar: activation status, Templates, Preview — on one row, with the
   title/subtitle block dropped entirely (see the template). Controls are 44px
   here rather than the desktop 36px: this row is thumb input, not mouse input.

   Sticky below the app's own two fixed bars (the 4rem header +
   EventManageMobileTabBar, whose spacer sits in flow — see EventManageView),
   and bled out past .showcase-studio__main's 1rem gutters so scrolling form
   cards pass behind it rather than beside it. */
.studio-mobile-bar {
  --studio-control-h: 2.75rem;
  position: sticky;
  /* The tab bar's height is measured and published by EventManageMobileTabBar
     rather than assumed here — this used to hardcode 52px, which didn't match
     what that bar actually renders, so once this row was stuck there was a
     permanent band of page background between the two with scrolling content
     legible through it. The trailing -1px makes the two overlap by a pixel
     instead of risking a sub-pixel gap on fractional device pixel ratios (the
     same trick EventManageTopBar uses against this bar). */
  top: calc(4rem + var(--manage-tabbar-h, 52px) - 1px);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* Negative top margin cancels EventManageView's own `py-6` on the content
     section. Without it this row floated 24px below the fixed tab bar at rest —
     a band of page background between two pieces of header chrome — and that
     band is also where scrolling cards briefly showed through on their way
     behind the sticky row. Flush against the tab bar, the two read as one
     two-row header (the `md` bump below matches that padding's `md:py-8`). */
  margin: -1.5rem -1rem 1rem -1rem;
  padding: 0.5rem 1rem;
  /* Opaque, not glass: this is fixed chrome that scrolling form cards pass
     directly behind, and at 0.92 alpha their text read through it (and through
     the tab labels above). Same gradient as EventManageMobileTabBar's, so the
     two surfaces are one continuous header block. */
  background: linear-gradient(135deg, #f8fffe 0%, #f0fdf9 50%, #f0f9ff 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

@media (min-width: 768px) {
  .studio-mobile-bar {
    margin-top: -2rem;
  }
}

.studio-mobile-bar__spacer {
  flex: 1 1 auto;
  min-width: 0;
}

/* ActivationStatusPill's own ≤640px rule drops its wording, which is right in
   the desktop toolbar (four controls competing for one row) but here left a
   bare pulsing dot — a status indicator showing no status. This row has the
   slack, so the label comes back; the pill takes up the slack and ellipsizes
   on the widest state (unpaid, which also carries an Activate CTA) instead of
   pushing the buttons off the row. */
.studio-mobile-bar :deep(.activation-pill) {
  flex: 1 1 auto;
  min-width: 0;
}

.studio-mobile-bar :deep(.activation-pill__label) {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Templates steps down to a glass icon button here: Preview is this row's
   primary action (the edit forms are already the page), and two gradient
   buttons 8px apart read as two competing primaries — the same reasoning that
   makes the desktop activation CTA amber. */
.studio-mobile-bar .showcase-preview-tab__templates-btn {
  width: var(--studio-control-h);
  padding: 0;
  color: rgb(71 85 105);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: none;
}

.studio-mobile-bar .showcase-preview-tab__templates-btn span {
  display: none;
}

.studio-preview-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4375rem;
  height: var(--studio-control-h);
  padding: 0 1rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  border-radius: 9999px;
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.studio-preview-btn:active {
  transform: scale(0.97);
  box-shadow: 0 2px 4px -1px rgba(46, 204, 113, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .studio-preview-btn {
    transition: none;
  }

  .studio-preview-btn:active {
    transform: none;
  }
}

/* Full-width edit forms. Deliberately free of the `:deep()` compensations the
   440px panel needs above: at this width the section subtitles, "Add X" labels
   and expand chevrons all fit, and on touch those affordances matter more than
   they do under a mouse. Bottom padding clears MobileTabBar + the FAB stack
   above it. */
.showcase-studio__mobile-body {
  padding-bottom: 6rem;
}

/* One glass pill holding the layout segments and the language segment. */
.showcase-preview-tab__view-controls {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  height: var(--studio-control-h);
  padding: 0 0.1875rem;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.showcase-preview-tab__seg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3125rem;
  height: 1.75rem;
  min-width: 1.75rem;
  padding: 0 0.3125rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgb(71 85 105);
  transition: all 0.2s ease;
}

.showcase-preview-tab__seg:hover {
  color: rgb(15 23 42);
  background: rgba(255, 255, 255, 0.75);
}

.showcase-preview-tab__seg.is-active {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: white;
  box-shadow: 0 2px 4px -1px rgba(46, 204, 113, 0.3);
}

/* Language segment carries a text code, so it needs a little more side room
   than the square icon segments. */
.showcase-preview-tab__seg--lang {
  padding: 0 0.5rem;
}

.showcase-preview-tab__seg-divider {
  flex-shrink: 0;
  width: 1px;
  height: 1.125rem;
  margin: 0 0.125rem;
  background: rgba(148, 163, 184, 0.35);
}

.showcase-preview-tab__templates-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4375rem;
  height: var(--studio-control-h);
  padding: 0 0.9375rem;
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  border-radius: 9999px;
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.25);
  transition: all 0.2s ease;
}

.showcase-preview-tab__templates-btn:hover {
  background: linear-gradient(to right, #27ae60, #1873cc);
  box-shadow: 0 6px 10px -2px rgba(46, 204, 113, 0.32);
  transform: translateY(-1px);
}

.showcase-preview-tab__templates-btn:active {
  transform: translateY(0);
}

/* Narrow: the label goes, the palette icon stays — matching how the activation
   pill drops its own label at the same width, so the whole row shrinks as one
   thing instead of one control at a time. */
@media (max-width: 640px) {
  .showcase-preview-tab__templates-btn {
    padding: 0;
    width: var(--studio-control-h);
  }

  .showcase-preview-tab__templates-btn span {
    display: none;
  }
}

/* Frame picker: a minimal progress-dot timeline — dots joined by a thread,
   the active step filled with the brand gradient. No card chrome; it sits
   directly on the page background beside the frames. A real flex sibling of
   .frames (see .frames-row below) rather than absolutely positioned off one
   frame's own edge — that anchor point only read correctly when the frame
   happened to sit flush against the available space, which isn't true in
   "multiple" view (frames grid starts with no gutter at all) or even
   reliably in "single" view (the frame is centered in a much wider column,
   leaving unused space further left than the anchor). Being a genuine flex
   item instead reserves real column width for this control, which the
   frames get out of the way of automatically. */
.showcase-preview-tab__frame-timeline {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.showcase-preview-tab__frame-step {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  width: 100%;
  padding: 0;
  margin: 0;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}

.showcase-preview-tab__frame-step-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 0.625rem;
  flex-shrink: 0;
}

.showcase-preview-tab__frame-step-dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 9999px;
  background: white;
  border: 1.5px solid rgb(203 213 225);
  transition: all 0.2s ease;
}

.showcase-preview-tab__frame-step-line {
  width: 2px;
  flex: 1;
  min-height: 0.875rem;
  margin: 0.125rem 0;
  background: rgb(226 232 240);
}

.showcase-preview-tab__frame-step-label {
  padding: 0.375rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(148 163 184);
  white-space: nowrap;
  transition: color 0.2s ease;
}

.showcase-preview-tab__frame-step:hover .showcase-preview-tab__frame-step-label {
  color: rgb(71 85 105);
}

.showcase-preview-tab__frame-step.is-active .showcase-preview-tab__frame-step-dot {
  width: 0.625rem;
  height: 0.625rem;
  margin-top: calc(0.5rem - 1px);
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  border-color: transparent;
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.15);
}

.showcase-preview-tab__frame-step.is-active .showcase-preview-tab__frame-step-label {
  color: rgb(15 23 42);
  font-weight: 700;
}

.showcase-preview-tab__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 0;
  color: rgb(100 116 139);
  font-size: 0.875rem;
}

.showcase-preview-tab__spinner {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 2px solid rgba(30, 144, 255, 0.2);
  border-bottom-color: #1e90ff;
  animation: showcase-preview-spin 0.8s linear infinite;
}

@keyframes showcase-preview-spin {
  to {
    transform: rotate(360deg);
  }
}

.showcase-preview-tab__error {
  padding: 2rem;
  text-align: center;
  color: rgb(220 38 38);
  background: rgba(254, 226, 226, 0.5);
  border-radius: 1rem;
}

.showcase-preview-tab__no-preview {
  padding: 3rem 0;
  text-align: center;
  color: rgb(100 116 139);
  font-size: 0.875rem;
}

.showcase-studio__main {
  min-width: 0;
  padding: 0 1rem 1.5rem 1rem;
}

@media (min-width: 640px) {
  .showcase-studio__main {
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .showcase-studio__panel-inner {
    /* Fixed, independent of the shell's own animating width — see the
       comment on .panel-inner above. */
    width: var(--studio-panel-w);
  }

  .showcase-studio__main {
    padding-left: 1.5rem;
    padding-right: 2rem;
    /* The panel is `position: fixed` (out of flow) — margin-left reserves
       the room for it so it doesn't overlap the frames, and animates in sync
       so the studio visibly "shrinks" as the panel grows out, matching the
       panel's own width transition (same duration + curve, so both edges of
       the reserved gap move together). */
    margin-left: 0;
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .showcase-studio__main.is-shrunk {
    margin-left: var(--studio-panel-w);
  }
}

.showcase-preview-tab__viewer {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

/* Row: frame picker column + frames, as genuine flex siblings (see the
   .frame-timeline comment above for why this replaced absolute positioning).
   Desktop-only, so it has no narrow-viewport wrap case — below `lg` the whole
   frames row is replaced by MobilePreviewSheet. */
.showcase-preview-tab__frames-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.showcase-preview-tab__frames {
  display: flex;
  flex-direction: column;
  /* Takes the rest of .frames-row after the side controls column, and must
     be allowed to shrink below its content size (flex items default to
     min-width: auto) — otherwise it would refuse to narrow and force the
     side controls to overflow or get squeezed instead. */
  flex: 1 1 auto;
  min-width: 0;
  /* stretch, not center: a centered flex item shrink-wraps to its own
     content width, which is circular with PreviewFrame measuring that same
     width to decide how big to render its content — and locks onto a wrong,
     tiny size the first time a frame that mounted hidden (display: none)
     gets shown. Stretching gives each frame a stable, real width to measure;
     PreviewFrame's own internal `align-items: center` still centers the
     (narrower, max-width-capped) phone mockup within it. */
  align-items: stretch;
  gap: 3rem;
  padding-bottom: 2rem;
}

.showcase-preview-tab__frames--cols-2,
.showcase-preview-tab__frames--cols-3 {
  display: grid;
  align-items: start;
  gap: 1.5rem;
}

.showcase-preview-tab__frames--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.showcase-preview-tab__frames--cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.showcase-preview-tab__transition-note {
  font-size: 0.8125rem;
  color: rgb(148 163 184);
  padding: 1.5rem 0;
}
</style>
