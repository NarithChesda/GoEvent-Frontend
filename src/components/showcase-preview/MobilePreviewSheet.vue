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
            />
          </div>
        </div>

        <!-- The one thing worth floating chrome: that what's on screen is not
             what guests have. Recedes with the rest of the chrome so it never
             permanently sits on the cover artwork. -->
        <div
          v-if="showActivationBar"
          class="preview-sheet__notice"
          :class="{ 'is-idle': chromeIdle }"
          @pointerdown="wakeChrome"
        >
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0" />
          <span class="preview-sheet__notice-text">
            {{ t('management.showcasePreview.mobilePreview.previewOnly') }}
          </span>
          <button
            v-if="canEdit"
            type="button"
            class="preview-sheet__notice-cta"
            @click="emit('activate')"
          >
            <Sparkles class="w-3 h-3 flex-shrink-0" />
            <span>{{ t('management.activation.pill.activateCta') }}</span>
          </button>
        </div>

        <!-- Overlaid just above the bar it talks about, and self-dismissing, so
             it costs no frame height. -->
        <Transition name="preview-sheet-tip">
          <p v-if="tipKey" class="preview-sheet__tip">
            {{ t(`management.showcasePreview.mobilePreview.${tipKey}`) }}
          </p>
        </Transition>

        <!-- Floating control bar: icon-only so the whole editing toolbar costs
             one 54px pill instead of a header row plus a footer row, following
             the showcase's own V2FloatingActionBar (labels on hover / press-
             and-hold, never permanently). -->
        <nav
          class="preview-sheet__bar"
          :class="{ 'is-idle': chromeIdle }"
          :aria-label="t('management.showcasePreview.mobilePreview.controls')"
          @pointerdown="wakeChrome"
          @focusin="wakeChrome"
        >
          <button
            type="button"
            class="preview-sheet__btn"
            :aria-label="t('management.showcasePreview.mobilePreview.close')"
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
            <span class="preview-sheet__tooltip">
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
              <component :is="stageIcon(frame.id)" class="w-[1.125rem] h-[1.125rem]" />
              <span class="preview-sheet__tooltip">{{ t(frame.labelKey) }}</span>
            </button>
          </div>

          <button
            v-if="languages.length > 1"
            type="button"
            class="preview-sheet__btn preview-sheet__btn--lang"
            :aria-label="t('management.showcasePreview.switchLanguage')"
            @click="emit('cycle-language')"
          >
            {{ currentLanguage.toUpperCase() }}
            <span class="preview-sheet__tooltip">
              {{ t('management.showcasePreview.switchLanguage') }}
            </span>
          </button>

          <button
            v-if="canEdit"
            type="button"
            class="preview-sheet__btn"
            :class="{ 'is-on': hintsOn }"
            :aria-pressed="hintsOn"
            :aria-label="t('management.showcasePreview.mobilePreview.editHints')"
            @click="toggleHints"
          >
            <Pencil class="w-[1.125rem] h-[1.125rem]" />
            <span class="preview-sheet__tooltip">
              {{ t('management.showcasePreview.mobilePreview.editHints') }}
            </span>
          </button>
        </nav>
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
 * are one icon-only pill that dims itself when idle.
 */
import { computed, onUnmounted, ref, watch, type Component } from 'vue'
import { BookOpen, Clapperboard, DoorOpen, Layers, Pencil, ScrollText, Sparkles, TriangleAlert, X } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import InertIframe from './InertIframe.vue'
import type { PreviewFrameDescriptor } from './renderers/resolvePreviewRenderer'
import type { TemplateAssets } from '@/composables/useEventShowcase'
import type { ActivationState } from '@/composables/useTemplateActivation'

interface Props {
  open: boolean
  /** Already filtered to the frames this event actually has. */
  frames: PreviewFrameDescriptor[]
  /** Builds each frame's iframe src (stage/lang/editable/templateId params). */
  frameUrl: (frame: PreviewFrameDescriptor) => string
  canEdit: boolean
  languages: { language: string }[]
  currentLanguage: string
  /** Drives the preview-only notice; undefined until the payment rows resolve. */
  activationState?: ActivationState
  /** A template being tried on but not yet applied — re-posted into each frame
   *  as it loads, since frames only exist while this sheet is open. */
  stagedTemplate?: TemplateAssets | null
  /** Lets the host tab keep its own frame registry (for `refresh` after a
   *  parent-side editor save) even though the frames live in here. */
  registerFrame?: (id: string, el: unknown) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'cycle-language': []
  /** Open checkout — the sheet has no drawer of its own. */
  activate: []
  /** Which stage is on screen right now — the sheet shows exactly one frame
   *  at a time (unlike the desktop studio's "multiple" default), so the host
   *  tab needs this to know which frame(s) a post-save refresh can skip. */
  'active-frame-changed': [id: string]
}>()

const { t } = useAppLanguage()

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

// Frame ids are renderer-defined vocabulary (V1's cover/transition/main today,
// a V2 renderer will declare its own pages), so an unknown id has to degrade to
// a generic icon rather than render nothing — the labels still come from the
// descriptor's own labelKey, and press-and-hold reveals them.
const STAGE_ICONS: Record<string, Component> = {
  cover: BookOpen,
  transition: DoorOpen,
  event_video: Clapperboard,
  main: ScrollText,
}

const stageIcon = (id: string): Component => STAGE_ICONS[id] ?? Layers

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

// --- Activation notice -----------------------------------------------------
const showActivationBar = computed(
  () => props.activationState === 'unpaid' || props.activationState === 'pending',
)

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
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
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
      frameInstances.clear()
    }
  },
)

onUnmounted(() => {
  clearTipTimer()
  clearIdleTimer()
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
.preview-sheet__bar {
  position: absolute;
  left: 50%;
  bottom: calc(0.75rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  max-width: calc(100vw - 1.5rem);
  padding: 0.25rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.55);
  transition: opacity 0.3s ease, transform 0.3s ease;
  /* Deliberately NOT a scroll container: `overflow-x: auto` makes overflow-y
     compute to `auto` as well, which would clip every tooltip (they sit above
     the bar, outside its box). The current renderer's 3 stages + 3 global
     actions measure ~268px, so the bar fits without scrolling down to 320px;
     a renderer that ever declares more pages than fit needs an overflow
     popover (like the showcase's own V2FloatingActionBar "More"), not
     clipping. */
}

/* Dimmed, not hidden: still the way out, still tappable, just out of the way.
   Hover/focus-within covers mouse and keyboard; `wakeChrome` covers touch. */
.preview-sheet__bar.is-idle {
  opacity: 0.4;
  transform: translateX(-50%) translateY(0.25rem) scale(0.97);
}

.preview-sheet__bar.is-idle:hover,
.preview-sheet__bar.is-idle:focus-within {
  opacity: 1;
  transform: translateX(-50%);
}

.preview-sheet__btn {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 2.5rem = 40px, the §17 touch-target floor. The bar packs 6 of them plus
     padding into ~292px, so it still clears both edges at 375px. */
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  color: rgb(226 232 240);
  background: transparent;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s ease, color 0.2s ease;
}

.preview-sheet__btn:hover,
.preview-sheet__btn:focus-visible {
  background: rgba(255, 255, 255, 0.12);
}

.preview-sheet__btn:active {
  background: rgba(255, 255, 255, 0.18);
}

.preview-sheet__btn--lang {
  width: auto;
  min-width: 2.5rem;
  padding: 0 0.625rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.preview-sheet__btn.is-on {
  color: white;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
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
}

.preview-sheet__btn--seg {
  width: 2.375rem;
  height: 2.375rem;
}

.preview-sheet__btn--seg.is-active {
  color: white;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 2px 6px -1px rgba(46, 204, 113, 0.45);
}

/* Hold-to-see-text. Hidden until hover (mouse) or held (touch — the delayed
   :active rule below), and never pointer-events, so it can't intercept the tap
   meant for the button under it. Same mechanism as the showcase's own
   V2FloatingActionBar, so both bars behave identically. */
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
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.preview-sheet__btn:hover .preview-sheet__tooltip,
.preview-sheet__btn:focus-visible .preview-sheet__tooltip {
  opacity: 1;
  transform: translateX(-50%);
}

/* Touch long-press: opacity only starts transitioning after ~450ms of :active.
   A quick tap releases :active well before that, so the pending transition
   never runs and no tooltip flashes on a normal tap — holding the button down
   is what reveals it. */
.preview-sheet__btn:active .preview-sheet__tooltip {
  opacity: 1;
  transform: translateX(-50%);
  transition-delay: 0.45s;
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
  padding: 0.375rem 0.375rem 0.375rem 0.75rem;
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

.preview-sheet__notice-cta {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 1.75rem;
  padding: 0 0.625rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  background: rgb(180 83 9);
  box-shadow: 0 2px 4px -1px rgba(120, 53, 15, 0.45);
  touch-action: manipulation;
}

.preview-sheet__notice-cta:active {
  background: rgb(146 64 14);
}

/* ---------- tip ---------- */
/* Sits directly above the bar it explains (the pencil lives there), which also
   keeps it clear of the activation notice at the top. */
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
  .preview-sheet__bar,
  .preview-sheet__notice,
  .preview-sheet__tooltip {
    transition: none;
  }

  .preview-sheet-enter-from,
  .preview-sheet-leave-to {
    transform: none;
  }

  /* Keep the idle state a pure opacity change — no sink/scale. */
  .preview-sheet__bar.is-idle {
    transform: translateX(-50%);
  }

  .preview-sheet__notice.is-idle {
    transform: translateX(-50%);
  }
}
</style>
