<template>
  <!-- Teleported to body: the studio's own main column is a transformed,
       margin-animated flex child, and a `position: fixed` descendant of a
       transformed ancestor is positioned against that ancestor instead of the
       viewport — which is exactly the bug a full-screen sheet can't have. -->
  <Teleport to="body">
    <Transition name="preview-sheet">
      <div
        v-if="open"
        class="preview-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="t('management.showcasePreview.mobilePreview.title')"
      >
        <!-- The frame IS the sheet: edge-to-edge, at the device's own viewport
             size, with no chrome taking layout height from it. Every control
             floats on top instead, so the invitation renders at exactly the
             size a guest's phone gives it — no letterboxing, no scaling, and
             no "preview of a preview" mismatch. -->
        <div class="preview-sheet__stage">
          <div
            v-for="frame in frames"
            v-show="activeId === frame.id"
            :key="frame.id"
            class="preview-sheet__frame"
          >
            <InertIframe
              :ref="(el) => registerFrameInstance(frame.id, el)"
              :src="frameSrc(frame)"
              :interactive="frame.editable && canEdit"
              :click-message="frame.clickMessage"
              @ready="onFrameReady(frame.id)"
              @languages="(languages, current) => emit('languages', languages, current)"
            />
          </div>
        </div>

        <!-- The one thing worth floating chrome: that what's on screen is not
             what guests have. Status only — the remedy is Activate on the bar
             below, beside Templates, because choosing a design and paying for
             it are one flow and belong in one place. Recedes with the rest of
             the chrome so it never permanently sits on the cover artwork. -->
        <div
          v-if="showActivationBar"
          class="preview-sheet__notice"
          :class="{ 'is-idle': chromeIdle }"
          @pointerdown="wakeChrome"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span class="preview-sheet__notice-text">
            {{ t('management.showcasePreview.mobilePreview.previewOnly') }}
          </span>
        </div>

        <!-- Overlaid just above the bar it talks about, and self-dismissing, so
             it costs no frame height. -->
        <Transition name="preview-sheet-tip">
          <p v-if="tipKey" class="preview-sheet__tip">
            {{ t(`management.showcasePreview.mobilePreview.${tipKey}`) }}
          </p>
        </Transition>

        <!-- The tool rail: how the preview is looked at (language, edit
             highlights) and the event-wide settings no tap on the invitation can
             reach (music, the link preview) — neither has a place on the
             invitation to be tapped. A column at the right edge, so the bar
             below keeps its width for the one flow it carries.

             Centred on the height rather than stacked on the bar: it stays clear
             of the preview-only notice above and the tip over the bar below at
             any phone height, and mid-right is still under a right thumb. -->
        <div
          v-if="hasRail"
          class="preview-sheet__rail"
          :class="{ 'is-idle': barIdle }"
          role="group"
          :aria-label="t('management.showcasePreview.mobilePreview.tools')"
          @pointerdown="wakeChrome"
          @focusin="wakeChrome"
        >
          <button
            v-if="languages.length > 1"
            type="button"
            class="preview-sheet__btn preview-sheet__btn--lang"
            :aria-label="t('management.showcasePreview.switchLanguage')"
            @click="emit('cycle-language')"
          >
            {{ currentLanguage.toUpperCase() }}
            <span class="preview-sheet__tooltip preview-sheet__tooltip--side" aria-hidden="true">
              {{ t('management.showcasePreview.switchLanguage') }}
            </span>
          </button>

          <!-- A toggle, so its on-state is a quiet fill, not the gradient: hints
               are on by default, and a gradient here was one more on screen from
               the moment the sheet opened, beside the bar's two. -->
          <button
            v-if="canEdit"
            type="button"
            class="preview-sheet__btn"
            :class="{ 'is-on': hintsOn }"
            :aria-pressed="hintsOn"
            :aria-label="t('management.showcasePreview.mobilePreview.editHints')"
            @click="toggleHints"
          >
            <Pencil class="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
            <span class="preview-sheet__tooltip preview-sheet__tooltip--side" aria-hidden="true">
              {{ t('management.showcasePreview.mobilePreview.editHints') }}
            </span>
          </button>

          <!-- Looking | changing: the two above alter only this screen, the two
               below write to the event. Both halves exist exactly when the
               viewer can edit (the highlights toggle above, the link preview
               below). -->
          <span v-if="canEdit" class="preview-sheet__rail-divider" aria-hidden="true" />

          <button
            v-if="canEdit && showMusic"
            type="button"
            class="preview-sheet__btn"
            aria-haspopup="dialog"
            :aria-expanded="tool === 'music'"
            :aria-label="t('management.media.mediaUploads.music.title')"
            @click="openTool('music')"
          >
            <Music class="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
            <span class="preview-sheet__tooltip preview-sheet__tooltip--side" aria-hidden="true">
              {{ t('management.media.mediaUploads.music.title') }}
            </span>
          </button>

          <button
            v-if="canEdit"
            type="button"
            class="preview-sheet__btn"
            aria-haspopup="dialog"
            :aria-expanded="tool === 'link'"
            :aria-label="t('management.media.eventBanner.previewLabel')"
            @click="openTool('link')"
          >
            <Share2 class="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
            <span class="preview-sheet__tooltip preview-sheet__tooltip--side" aria-hidden="true">
              {{ t('management.media.eventBanner.previewLabel') }}
            </span>
          </button>
        </div>

        <!-- The bar: leaving, the stages, and the one flow this sheet exists
             for — choose a design, then pay for it. The public catalogue's phone
             bar (PartnerTemplateGalleryView's .tpl-bar) was built from this one
             and then refined; this is that refinement brought back. Keep the
             two in step.

             The dock spans the sheet so the pill can be centred in it and is
             click-through, so the strip either side of the pill belongs to the
             invitation behind it. It is also what the pill is fitted against
             (see fitBar). -->
        <div ref="dockRef" class="preview-sheet__dock">
          <nav
            ref="barRef"
            class="preview-sheet__bar"
            :class="{
              'is-idle': barIdle,
              'is-compact': compactLevel >= 1,
              'is-compact-all': compactLevel >= 2,
            }"
            :aria-label="t('management.showcasePreview.mobilePreview.controls')"
            @pointerdown="wakeChrome"
            @focusin="wakeChrome"
          >
            <!-- X, not the catalogue's arrow: that one leaves a page, this one
                 closes a sheet. -->
            <button
              type="button"
              class="preview-sheet__btn"
              :aria-label="t('management.showcasePreview.mobilePreview.close')"
              @click="emit('close')"
            >
              <X class="w-5 h-5" aria-hidden="true" />
              <span class="preview-sheet__tooltip" aria-hidden="true">
                {{ t('management.showcasePreview.mobilePreview.close') }}
              </span>
            </button>

            <!-- Stage picker. The desktop studio's vertical dot-timeline and the
                 previous horizontal text chips both need width this bar doesn't
                 have; icons in an inset track read as one control and keep the
                 stage labels one press-and-hold away. -->
            <div
              v-if="frames.length > 1"
              class="preview-sheet__seg"
              role="group"
              :aria-label="t('management.showcasePreview.layoutSwitchLabel')"
            >
              <button
                v-for="frame in frames"
                :key="frame.id"
                type="button"
                class="preview-sheet__btn preview-sheet__btn--seg"
                :class="{ 'is-active': activeId === frame.id }"
                :aria-pressed="activeId === frame.id"
                :aria-label="t(frame.labelKey)"
                @click="activeId = frame.id"
              >
                <component
                  :is="stageIcon(frame.id)"
                  class="w-[1.125rem] h-[1.125rem]"
                  aria-hidden="true"
                />
                <span class="preview-sheet__tooltip" aria-hidden="true">{{ t(frame.labelKey) }}</span>
              </button>
            </div>

            <!-- Templates: the studio's primary button, carried into the preview
                 so a design can be changed while looking at it instead of after
                 closing it. The label is also what keeps it from reading as a
                 fourth stage: the gradient means "you are here" in the track and
                 "this is the action" here, and a word is the difference. -->
            <button
              v-if="canEdit"
              type="button"
              class="preview-sheet__btn preview-sheet__btn--menu"
              aria-haspopup="dialog"
              :aria-expanded="templatesOpen"
              :aria-label="t('management.templatePaymentTab.browseBtn.templates')"
              @click="emit('open-templates')"
            >
              <Palette class="w-[1.125rem] h-[1.125rem] flex-none" aria-hidden="true" />
              <span class="preview-sheet__btn-label" aria-hidden="true">
                {{ t('management.templatePaymentTab.browseBtn.templates') }}
              </span>
              <span v-if="compactLevel >= 1" class="preview-sheet__tooltip" aria-hidden="true">
                {{ t('management.templatePaymentTab.browseBtn.templates') }}
              </span>
            </button>

            <!-- Activate: the second half of choosing a design, so it stands
                 beside Templates rather than in the notice at the top — and last,
                 under the thumb, because paying is the step that finishes the
                 flow. Solid amber rather than a second gradient: two gradients
                 side by side read as two competing primaries (the desktop
                 studio's header makes the same call). Only while unpaid — under
                 review there is nothing left to press. -->
            <button
              v-if="showActivate"
              type="button"
              class="preview-sheet__btn preview-sheet__btn--activate"
              :aria-label="t('management.activation.pill.activateCta')"
              @click="emit('activate')"
            >
              <Sparkles class="w-[1.125rem] h-[1.125rem] flex-none" aria-hidden="true" />
              <span class="preview-sheet__btn-label" aria-hidden="true">
                {{ t('management.activation.pill.activateCta') }}
              </span>
              <span v-if="compactLevel >= 2" class="preview-sheet__tooltip" aria-hidden="true">
                {{ t('management.activation.pill.activateCta') }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Music and the link preview, as sheets over the invitation — the
             forms' own sections, standalone. Contained, so they rise over this
             sheet rather than over the page it hides, and so nothing reaches
             past it to the page's scroll. Mounted only while shown, which is
             also what stops a track that was playing in here. -->
        <MobileBottomSheet
          contained
          :show="tool === 'music'"
          :aria-label="t('management.media.mediaUploads.music.title')"
          @close="closeTool"
        >
          <MediaUploadsSection
            only="music"
            :event-data="eventData"
            :can-edit="canEdit"
            @updated="(event) => emit('event-updated', event)"
          />
        </MobileBottomSheet>

        <MobileBottomSheet
          contained
          :show="tool === 'link'"
          :aria-label="t('management.media.eventBanner.previewLabel')"
          @close="closeTool"
        >
          <EventBannerSection
            standalone
            :event="eventData"
            :can-edit="canEdit"
            @updated="(event) => emit('event-updated', event)"
          />
        </MobileBottomSheet>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * The mobile face of the Design Studio's live preview.
 *
 * The desktop studio shows the edit forms and the preview side by side; a phone
 * can't, and the previous attempt at squeezing both in produced a phone-shaped
 * frame rendered at ~92% of a phone's own width — plus a hard scroll trap,
 * since a finger on a frame reaches the iframe (whose cover/transition stages
 * don't scroll) and never the page behind it.
 *
 * So on mobile the two halves separate: the page is the edit surface, and the
 * preview is this sheet, where the frame gets the entire screen and the only
 * scrollable thing on it is the invitation itself.
 *
 * Chrome is floating, not stacked: a header row plus an activation footer used
 * to spend ~100px of a ~740px screen, and the frame then had to be *scaled
 * down* to fit what was left, so the template was never shown at the size a
 * guest actually sees. Now the iframe fills the sheet at 1:1 and the controls
 * float over it, dimming themselves when idle: a bar at the foot for leaving,
 * the stages and the choose-then-pay flow, and a rail at the right edge for the
 * tools — how the preview is looked at, and the event-wide settings (music, the
 * link preview) that have no place on the invitation to be tapped.
 */
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { Music, Palette, Pencil, Share2, Sparkles, TriangleAlert, X } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { defineResilientAsyncComponent } from '@/utils/asyncComponent'
import MobileBottomSheet from '@/components/common/MobileBottomSheet.vue'
import InertIframe from './InertIframe.vue'
import { previewStageIcon as stageIcon } from './previewStageIcons'
import type { PreviewFrameDescriptor } from './renderers/resolvePreviewRenderer'
import type { Event } from '@/services/api'
import type { TemplateAssets } from '@/composables/useEventShowcase'
import type { ActivationState } from '@/composables/useTemplateActivation'

// The forms' own sections, code-split exactly as EventMediaTab splits them — so
// on a phone, where that tab is the page under this sheet, these are chunks the
// browser already has.
const MediaUploadsSection = defineResilientAsyncComponent(
  () => import('@/components/MediaUploadsSection.vue'),
)
const EventBannerSection = defineResilientAsyncComponent(
  () => import('@/components/EventBannerSection.vue'),
)

interface Props {
  open: boolean
  /** Already filtered to the frames this event actually has. */
  frames: PreviewFrameDescriptor[]
  /** Builds each frame's iframe src (stage/editable/templateId params). */
  frameUrl: (frame: PreviewFrameDescriptor) => string
  canEdit: boolean
  /** Language codes the event has, as reported by the frames themselves. */
  languages: string[]
  currentLanguage: string
  /** Drives the preview-only notice; undefined until the payment rows resolve. */
  activationState?: ActivationState
  /** A template being tried on but not yet applied — re-posted into each frame
   *  as it loads, since frames only exist while this sheet is open. */
  stagedTemplate?: TemplateAssets | null
  /** Lets the host tab keep its own frame registry (for `refresh` after a
   *  parent-side editor save) even though the frames live in here. */
  registerFrame?: (id: string, el: unknown) => void
  /** The templates modal is up over this sheet — the host owns it, since the
   *  same modal also opens from the page's own toolbar. */
  templatesOpen?: boolean
  /** The manage page's event record, for the music and link-preview sheets. */
  eventData?: Event
  /** Whether this event's category has showcase music at all — the same gate
   *  the forms put on their Brand Assets & Music section. */
  showMusic?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'cycle-language': []
  /** Pass-through of a frame's language report. Only the frames know which
   *  languages an event has (see postShowcaseLanguagesToParent), and on mobile
   *  the frames live in here, so the host tab hears it through this. */
  languages: [languages: string[], currentLanguage: string]
  /** Open checkout — the sheet has no drawer of its own. */
  activate: []
  /** Open the templates modal, over this sheet. */
  'open-templates': []
  /** The music or link-preview sheet saved the event — the same contract as
   *  EventMediaTab's own `event-updated`. */
  'event-updated': [event: Event]
  /** Which stage is on screen right now — the sheet shows exactly one frame
   *  at a time (unlike the desktop studio's "multiple" default), so the host
   *  tab needs this to know which frame(s) a post-save refresh can skip. */
  'active-frame-changed': [id: string]
}>()

const { t, locale } = useAppLanguage()

type InertIframeInstance = InstanceType<typeof InertIframe>

const frameInstances = new Map<string, InertIframeInstance>()

const registerFrameInstance = (id: string, el: unknown) => {
  if (el) frameInstances.set(id, el as InertIframeInstance)
  else frameInstances.delete(id)
  props.registerFrame?.(id, el)
}

// --- Active stage ----------------------------------------------------------
const activeId = ref<string>(props.frames[0]?.id ?? 'cover')

watch(
  () => props.frames,
  (frames) => {
    if (!frames.length) return
    if (!frames.some((f) => f.id === activeId.value)) activeId.value = frames[0].id
  },
  { immediate: true },
)

watch(activeId, (id) => emit('active-frame-changed', id), { immediate: true })

// --- Edit hints ------------------------------------------------------------
// On by default: this sheet is reached from the editing studio, and outlines
// are the only way a touch user can tell what's editable. The toggle exists so
// the same sheet can also answer "how does it actually look".
const hintsOn = ref(true)

// Hints-on is the frames' initial state, so it rides in on the URL rather than
// racing a postMessage against the frame attaching its listener. Deliberately
// NOT reactive to `hintsOn` — that would rewrite `src` and reload the whole
// frame on every toggle; toggling goes over the bridge instead.
const frameSrc = (frame: PreviewFrameDescriptor) => {
  const base = props.frameUrl(frame)
  if (!props.canEdit) return base
  return `${base}${base.includes('?') ? '&' : '?'}hints=1`
}

const toggleHints = () => {
  hintsOn.value = !hintsOn.value
  for (const frame of frameInstances.values()) {
    frame.post(hintsOn.value ? 'edit-hints-on' : 'edit-hints-off')
  }
  // Re-teach on the way on. The icon alone doesn't say what it does, and this
  // is the moment the user is asking.
  showTipFor(hintsOn.value ? 'editHintsTip' : 'editHintsOff')
}

// Frames mount only while the sheet is open, so a staged (tried-on but
// unapplied) template has to be re-pushed as each one comes up — on its bridge
// handshake, not the iframe's `load` event, which fires before anything in the
// frame is listening (see postFrameReadyToParent).
const onFrameReady = (id: string) => {
  const frame = frameInstances.get(id)
  if (!frame) return
  if (props.stagedTemplate) frame.postTemplatePreview(props.stagedTemplate)
}

// Try-on while the sheet is already open (the templates modal can be opened
// from in here) — push to whatever is mounted.
watch(
  () => props.stagedTemplate,
  (staged) => {
    if (!staged) return
    for (const frame of frameInstances.values()) frame.postTemplatePreview(staged)
  },
)

// --- Activation ------------------------------------------------------------
// The notice reports (preview only, or under review); the bar's Activate acts,
// and only while there is something to act on.
const showActivationBar = computed(
  () => props.activationState === 'unpaid' || props.activationState === 'pending',
)

const showActivate = computed(() => props.canEdit && props.activationState === 'unpaid')

// --- Tool rail ---------------------------------------------------------------
/** Nothing to put in it for a viewer of a one-language event. */
const hasRail = computed(() => props.canEdit || props.languages.length > 1)

type Tool = 'music' | 'link'

/** Which settings sheet is up over the invitation, if any. */
const tool = ref<Tool | null>(null)

const openTool = (next: Tool) => {
  tool.value = next
}

const closeTool = () => {
  tool.value = null
}

// --- Idle chrome -----------------------------------------------------------
// The bar is the only way out of the sheet, so it can never disappear — but it
// also sits on top of the invitation it's there to show. So it dims and sinks
// after a few seconds of not being touched, and any press (or hover/focus, via
// CSS) brings it straight back. It stays interactive while dimmed: the press
// that wakes it also does what it was pressed for.
const IDLE_DELAY = 3200

const chromeIdle = ref(false)
let idleTimer: ReturnType<typeof setTimeout> | null = null

const clearIdleTimer = () => {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = null
}

const wakeChrome = () => {
  chromeIdle.value = false
  clearIdleTimer()
  idleTimer = setTimeout(() => (chromeIdle.value = true), IDLE_DELAY)
}

/** Never dimmed under the templates modal or a settings sheet: the chrome would
 *  come back up having receded while nobody could see it. */
const barIdle = computed(() => chromeIdle.value && !props.templatesOpen && !tool.value)

// Put away by its close button, by applying a design or by a swipe, neither the
// modal nor a sheet touched the chrome — so without this it would drop straight
// to dim the moment they left it, with the change only just arriving above it.
watch(
  () => !!props.templatesOpen || !!tool.value,
  (covered) => {
    if (!covered && props.open) wakeChrome()
  },
)

// --- Fitting the bar ---------------------------------------------------------
// The labels are dropped only when the bar would otherwise not fit, and that is
// measured rather than set at a breakpoint: what the bar holds varies with the
// event (two or three stages, Activate or not) and with the app's language, and
// the gap between them is exactly the width in question — no single window width
// can say it.
//
// Templates goes first, Activate last: a gradient palette disc still reads as
// "designs", where an amber sparkle on its own says nothing about paying. The
// colour stays either way, and a dropped label moves to press-and-hold like
// every other control on the bar.
const dockRef = ref<HTMLElement | null>(null)
const barRef = ref<HTMLElement | null>(null)

/** 0: both labels · 1: Templates icon-only · 2: both icon-only. */
const compactLevel = ref(0)

const MAX_COMPACT_LEVEL = 2

const fitBar = async () => {
  // Widest first, stepping down until it fits. Each step is a render plus one
  // measurement, all inside this microtask run — nothing paints until the last,
  // so no label flashes in and back out.
  for (let level = 0; level <= MAX_COMPACT_LEVEL; level++) {
    compactLevel.value = level
    await nextTick()
    const dock = dockRef.value
    const bar = barRef.value
    if (!dock || !bar) return
    const { paddingLeft, paddingRight } = getComputedStyle(dock)
    const room = dock.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight)
    // `max-width: 100%` caps the pill at the room it has, so its own width can
    // never say it overflows; its content width is read with the cap lifted.
    bar.style.maxWidth = 'none'
    const needed = bar.offsetWidth
    bar.style.maxWidth = ''
    if (needed <= room) return
  }
}

let dockObserver: ResizeObserver | null = null

// The dock exists only while the sheet is open, so observing it is also what
// fits the bar on open (an observer reports once as it starts).
watch(dockRef, (dock) => {
  dockObserver?.disconnect()
  dockObserver = null
  if (!dock || typeof ResizeObserver === 'undefined') return
  dockObserver = new ResizeObserver(() => void fitBar())
  dockObserver.observe(dock)
})

watch(
  [() => props.frames.length, showActivate, () => props.canEdit, locale],
  () => void fitBar(),
)

// --- Tip -------------------------------------------------------------------
// An icon-only toggle can't say what it does, and a permanent caption would
// cost frame height forever to say something you need twice. So the tip
// narrates the hints state: once on open, and again whenever it's toggled.
const tipKey = ref<'editHintsTip' | 'editHintsOff' | null>(null)
let tipTimer: ReturnType<typeof setTimeout> | null = null

const clearTipTimer = () => {
  if (tipTimer) clearTimeout(tipTimer)
  tipTimer = null
}

const showTipFor = (key: 'editHintsTip' | 'editHintsOff') => {
  clearTipTimer()
  tipKey.value = key
  tipTimer = setTimeout(() => (tipKey.value = null), 3500)
}

// --- Open/close side effects ----------------------------------------------
// Escape takes down the top layer only. A settings sheet is this sheet's own
// (contained sheets leave Escape to their host), so it closes here; the
// templates modal answers Escape itself, and taking this sheet down under
// either would drop the user onto the forms. An Escape something inside has
// already answered (the link preview's inline title edit cancels on it) is not
// a second request to close.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || event.defaultPrevented) return
  if (tool.value) closeTool()
  else if (!props.templatesOpen) emit('close')
}

watch(
  () => props.open,
  (open) => {
    clearTipTimer()
    tipKey.value = null
    if (open) {
      // The sheet is the only scroll surface that should exist while it's up —
      // otherwise a drag that starts outside the frame scrolls the manage page
      // underneath it.
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKeydown)
      wakeChrome()
      if (props.canEdit && hintsOn.value) showTipFor('editHintsTip')
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeydown)
      clearIdleTimer()
      chromeIdle.value = false
      tool.value = null
      frameInstances.clear()
    }
  },
)

onUnmounted(() => {
  clearTipTimer()
  clearIdleTimer()
  dockObserver?.disconnect()
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.preview-sheet {
  position: fixed;
  inset: 0;
  /* dvh, not vh: on mobile Safari/Chrome `100vh` is the *expanded* viewport, so
     a vh-sized sheet runs under the URL bar and the floating bar at its bottom
     is unreachable. */
  height: 100dvh;
  /* Below the drawer/modal ladder (§14) on purpose — tapping an editable region
     in here opens one of PreviewEditorHost's drawers, which must land on top. */
  z-index: 900;
  /* Black rather than white behind the frame: this is a media viewer, and on the
     one frame that doesn't paint its own full-bleed background there should be
     an edge, not a seam. */
  background: #000;
  overscroll-behavior: contain;
}

/* Full-bleed: the frame gets the entire sheet, so the iframe's own viewport is
   the device's viewport and the showcase's vh/vw units resolve to exactly what
   a guest gets. Nothing to measure, nothing to scale. */
.preview-sheet__stage {
  position: absolute;
  inset: 0;
  /* The page never scrolls in here — the only scroll surface left is the
     invitation inside the iframe. That is the whole fix for the mobile scroll
     trap. */
  overflow: hidden;
}

.preview-sheet__frame {
  position: absolute;
  inset: 0;
}

/* ---------- floating control bar ---------- */
/* The public catalogue's phone bar (PartnerTemplateGalleryView's .tpl-bar-dock
   and .tpl-bar): same material, same geometry, same numbers — keep the two in
   step. */
.preview-sheet__dock {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  /* 12px up, plus the home indicator on the phones that have one. */
  padding: 0 0.75rem calc(0.75rem + env(safe-area-inset-bottom));
  pointer-events: none;
}

/* Deliberately NOT a scroll container: `overflow-x: auto` makes overflow-y
   compute to `auto` as well, which would clip every tooltip (they sit above the
   bar, outside its box). What keeps it inside a 320px screen is the Templates
   and Activate labels dropping out when they would not fit (see fitBar) — fully
   compact, with three stages and Activate, it is ~266px. A renderer that ever declares more stages than that
   frees needs an overflow popover (like the showcase's own V2FloatingActionBar
   "More"), not clipping. */
.preview-sheet__bar {
  /* How lit the bar is: 1 awake, 0.4 idle. Every alpha below is multiplied by
     it, so idle is 40% — just not applied to Templates. */
  --bar-lit: 1;
  pointer-events: auto;
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 9999px;
  background: rgb(15 23 42 / calc(0.82 * var(--bar-lit)));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgb(148 163 184 / calc(0.22 * var(--bar-lit)));
  box-shadow: 0 12px 30px -8px rgb(0 0 0 / calc(0.55 * var(--bar-lit)));
  transition:
    background-color 300ms ease,
    border-color 300ms ease,
    box-shadow 300ms ease,
    transform 300ms ease;
}

/* Dimmed, not hidden: still the way out, still tappable, just out of the way.

   The pill's material and every control on it recede EXCEPT Templates and
   Activate. One `opacity` on the pill would be inherited by everything inside
   it, and the flow this bar exists for fading to a 40% ghost after three
   seconds is the opposite of what it is for.

   A mouse or a keyboard brings it back without a press; `wakeChrome` covers a
   finger. Keyboard focus only (`:focus-visible`), because a tapped button keeps
   plain focus on Android and would hold the bar lit until the next tap
   elsewhere. */
.preview-sheet__bar > :not(.preview-sheet__btn--menu, .preview-sheet__btn--activate),
.preview-sheet__rail > * {
  opacity: var(--bar-lit);
}

/* Each sinks toward the edge it is anchored to. */
.preview-sheet__bar.is-idle {
  --bar-lit: 0.4;
  transform: translateY(0.25rem) scale(0.97);
}

.preview-sheet__rail.is-idle {
  --bar-lit: 0.4;
  transform: translateY(-50%) translateX(0.25rem) scale(0.97);
}

.preview-sheet__bar.is-idle:has(:focus-visible) {
  --bar-lit: 1;
  transform: none;
}

.preview-sheet__rail.is-idle:has(:focus-visible) {
  --bar-lit: 1;
  transform: translateY(-50%);
}

@media (hover: hover) and (pointer: fine) {
  .preview-sheet__bar.is-idle:hover {
    --bar-lit: 1;
    transform: none;
  }

  .preview-sheet__rail.is-idle:hover {
    --bar-lit: 1;
    transform: translateY(-50%);
  }
}

/* ---------- tool rail ---------- */
/* The bar's material turned on end: same pill, same 40px buttons, same idle
   rule. Clear of the right edge by the bar's own 12px, plus the notch side on a
   phone held landscape. */
.preview-sheet__rail {
  --bar-lit: 1;
  position: absolute;
  top: 50%;
  right: calc(0.75rem + env(safe-area-inset-right));
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 9999px;
  background: rgb(15 23 42 / calc(0.82 * var(--bar-lit)));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgb(148 163 184 / calc(0.22 * var(--bar-lit)));
  box-shadow: 0 12px 30px -8px rgb(0 0 0 / calc(0.55 * var(--bar-lit)));
  transform: translateY(-50%);
  transition:
    background-color 300ms ease,
    border-color 300ms ease,
    box-shadow 300ms ease,
    transform 300ms ease;
}

/* A column is a fixed width: the language code sits in the same 40px disc as
   the icons rather than widening the rail around two letters. */
.preview-sheet__rail .preview-sheet__btn--lang {
  width: 2.5rem;
  padding: 0;
}

.preview-sheet__rail-divider {
  flex: none;
  width: 1.25rem;
  height: 1px;
  margin: 0.125rem 0;
  background: rgba(148, 163, 184, 0.35);
  transition: opacity 300ms ease;
}

.preview-sheet__btn {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 40px, the §17 touch-target floor. */
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  color: rgb(226 232 240);
  background: transparent;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    opacity 300ms ease,
    background-color 200ms ease,
    color 200ms ease,
    box-shadow 200ms ease,
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* A finger has no hover, and on touch a sticky :hover would leave the last
   tapped button lit. */
@media (hover: hover) and (pointer: fine) {
  .preview-sheet__btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

/* Inset: the pill clips nothing, but an outset ring would run into the
   neighbouring button at a 4px gap. */
.preview-sheet__btn:focus-visible {
  outline: none;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

/* Feedback on the press itself, not on release. */
.preview-sheet__btn:active {
  background: rgba(255, 255, 255, 0.18);
  transform: scale(0.95);
}

.preview-sheet__btn--lang {
  width: auto;
  min-width: 2.5rem;
  padding: 0 0.625rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* Edit hints on: pressed into the pill rather than lit up. After the hover,
   focus and press fills so it keeps its own; the focus ring is added to it. */
.preview-sheet__btn.is-on {
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.preview-sheet__btn.is-on:focus-visible {
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

/* Templates — the studio's primary button (.showcase-preview-tab__templates-btn)
   at the bar's height: the brand gradient, white type, the soft green lift, and
   the same deeper gradient under a press. Written against both classes so it
   outranks the plain button's hover, press and focus fills declared above. */
.preview-sheet__btn.preview-sheet__btn--menu {
  width: auto;
  gap: 0.375rem;
  padding: 0 0.875rem 0 0.75rem;
  color: #fff;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 4px 10px -2px rgba(46, 204, 113, 0.35);
  font-size: 0.8125rem;
  font-weight: 700;
  white-space: nowrap;
}

@media (hover: hover) and (pointer: fine) {
  .preview-sheet__btn.preview-sheet__btn--menu:hover {
    background: linear-gradient(to right, #27ae60, #1873cc);
  }
}

.preview-sheet__btn.preview-sheet__btn--menu:active {
  background: linear-gradient(to right, #27ae60, #1873cc);
}

.preview-sheet__btn.preview-sheet__btn--menu:focus-visible {
  box-shadow:
    inset 0 0 0 2px rgb(56 189 248),
    0 4px 10px -2px rgba(46, 204, 113, 0.35);
}

/* Activate — the activation pill's own CTA (ActivationStatusPill's
   .activation-pill__cta) at the bar's height: solid amber, white type, an amber
   lift, and the deeper amber under a press. The same shape as Templates beside
   it, so the two read as one flow in two steps. */
.preview-sheet__btn.preview-sheet__btn--activate {
  width: auto;
  gap: 0.375rem;
  padding: 0 0.875rem 0 0.75rem;
  color: #fff;
  background: rgb(180 83 9);
  box-shadow: 0 4px 10px -2px rgba(180, 83, 9, 0.4);
  font-size: 0.8125rem;
  font-weight: 700;
  white-space: nowrap;
}

@media (hover: hover) and (pointer: fine) {
  .preview-sheet__btn.preview-sheet__btn--activate:hover {
    background: rgb(146 64 14);
  }
}

.preview-sheet__btn.preview-sheet__btn--activate:active {
  background: rgb(146 64 14);
}

.preview-sheet__btn.preview-sheet__btn--activate:focus-visible {
  box-shadow:
    inset 0 0 0 2px rgb(56 189 248),
    0 4px 10px -2px rgba(180, 83, 9, 0.4);
}

/* Short of room (fitBar), the word goes and the colour stays — Templates
   first, then Activate. Its name is then one press-and-hold away, like every
   other control on the bar. */
.preview-sheet__bar.is-compact .preview-sheet__btn--menu,
.preview-sheet__bar.is-compact-all .preview-sheet__btn--activate {
  width: 2.5rem;
  padding: 0;
}

.preview-sheet__bar.is-compact .preview-sheet__btn--menu .preview-sheet__btn-label,
.preview-sheet__bar.is-compact-all .preview-sheet__btn--activate .preview-sheet__btn-label {
  display: none;
}

/* Stage picker: an inset track so the three stages read as one segmented
   control rather than three loose icons among the global actions. */
.preview-sheet__seg {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.1875rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  transition: opacity 300ms ease;
}

.preview-sheet__btn--seg {
  width: 2.375rem;
  height: 2.375rem;
}

/* After :active, so a press on the stage already on screen keeps its fill. */
.preview-sheet__btn--seg.is-active {
  color: #fff;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 2px 6px -1px rgba(46, 204, 113, 0.45);
}

/* Hold-to-see-text. Hidden until hover (a mouse), keyboard focus, or a held
   press — the delayed :active rule below — and never pointer-events, so it
   cannot take the tap meant for the button under it. The catalogue's bar and
   the showcase's own V2FloatingActionBar work the same way. */
.preview-sheet__tooltip {
  position: absolute;
  bottom: calc(100% + 0.625rem);
  left: 50%;
  transform: translateX(-50%) translateY(0.25rem);
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;
  background: rgb(15 23 42);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: rgb(226 232 240);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: normal;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .preview-sheet__btn:hover .preview-sheet__tooltip {
    opacity: 1;
    transform: translateX(-50%);
  }
}

.preview-sheet__btn:focus-visible .preview-sheet__tooltip {
  opacity: 1;
  transform: translateX(-50%);
}

/* Touch long-press: the reveal only starts after ~450ms of :active. A quick tap
   releases :active well before that, so the pending transition never runs and
   no label flashes on an ordinary tap. The press scale is undone on the label
   itself, so a held button's name is not drawn shrunken. */
.preview-sheet__btn:active .preview-sheet__tooltip {
  opacity: 1;
  transform: translateX(-50%) scale(1.0526);
  transition-delay: 0.45s;
}

/* The rail's labels open to the left, into the screen — above a button in a
   column they would sit on the button over it. Each state is restated at the
   specificity of the rule it answers, after it, so the vertical centring wins. */
.preview-sheet__tooltip--side {
  bottom: auto;
  left: auto;
  top: 50%;
  right: calc(100% + 0.625rem);
  transform: translateY(-50%) translateX(0.25rem);
}

@media (hover: hover) and (pointer: fine) {
  .preview-sheet__btn:hover .preview-sheet__tooltip--side {
    transform: translateY(-50%);
  }
}

.preview-sheet__btn:focus-visible .preview-sheet__tooltip--side {
  transform: translateY(-50%);
}

.preview-sheet__btn:active .preview-sheet__tooltip--side {
  transform: translateY(-50%) scale(1.0526);
}

/* ---------- floating activation notice ---------- */
.preview-sheet__notice {
  position: absolute;
  left: 50%;
  top: calc(0.75rem + env(safe-area-inset-top));
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: calc(100vw - 1.5rem);
  /* Even now that the CTA it used to end in has moved to the bar. */
  padding: 0.4375rem 0.875rem 0.4375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.35;
  color: rgb(254 243 199);
  background: rgba(120, 53, 15, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(252, 211, 77, 0.32);
  box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.preview-sheet__notice.is-idle {
  opacity: 0.4;
  transform: translateX(-50%) translateY(-0.25rem) scale(0.97);
}

.preview-sheet__notice.is-idle:hover,
.preview-sheet__notice.is-idle:focus-within {
  opacity: 1;
  transform: translateX(-50%);
}

/* Khmer runs longer than English — let the sentence wrap inside the pill
   rather than truncating a warning. */
.preview-sheet__notice-text {
  min-width: 0;
}

/* ---------- tip ---------- */
/* Centred over the bar: clear of the activation notice at the top and of the
   rail, which is centred on the height, at any phone size. It narrates the
   rail's highlights toggle, but a label beside a 40px column would have no
   width left to say it in. */
.preview-sheet__tip {
  position: absolute;
  left: 50%;
  bottom: calc(4.5rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 2;
  max-width: calc(100vw - 2rem);
  padding: 0.4375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  color: rgb(226 232 240);
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.25);
  pointer-events: none;
}

/* Sheet motion follows §10's bottom-sheet curve — this rises from the bottom
   like one, it just happens to travel the full height. */
.preview-sheet-enter-active {
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.32s ease;
}

.preview-sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.25s ease;
}

.preview-sheet-enter-from,
.preview-sheet-leave-to {
  transform: translateY(100%);
  opacity: 0.6;
}

.preview-sheet-tip-enter-active,
.preview-sheet-tip-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.preview-sheet-tip-enter-from,
.preview-sheet-tip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .preview-sheet-enter-active,
  .preview-sheet-leave-active,
  .preview-sheet-tip-enter-active,
  .preview-sheet-tip-leave-active,
  .preview-sheet__notice {
    transition: none;
  }

  .preview-sheet-enter-from,
  .preview-sheet-leave-to {
    transform: none;
  }

  /* The bar and the rail still dim when idle — a pure fade now, no sink, and
     no press scale. */
  .preview-sheet__bar,
  .preview-sheet__rail {
    transition-property: background-color, border-color, box-shadow;
  }

  .preview-sheet__bar.is-idle,
  .preview-sheet__btn:active {
    transform: none;
  }

  .preview-sheet__rail.is-idle {
    transform: translateY(-50%);
  }

  .preview-sheet__tooltip,
  .preview-sheet__btn:active .preview-sheet__tooltip {
    transform: translateX(-50%);
  }

  .preview-sheet__tooltip--side,
  .preview-sheet__btn:active .preview-sheet__tooltip--side {
    transform: translateY(-50%);
  }

  .preview-sheet__notice.is-idle {
    transform: translateX(-50%);
  }
}
</style>
