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
        <!-- One 48px bar, not a header block: every pixel spent on chrome is a
             pixel the invitation doesn't get, and at this size the frame is
             the entire point. -->
        <div class="preview-sheet__bar">
          <button
            type="button"
            class="preview-sheet__icon-btn"
            :aria-label="t('management.showcasePreview.mobilePreview.close')"
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
          </button>

          <!-- Stage picker. Horizontal chips rather than the desktop's vertical
               dot-timeline: on a phone the stages are the primary navigation,
               and a vertical control would take a column this layout has none
               of. Scrolls rather than wrapping so the bar stays one row. -->
          <div
            v-if="frames.length > 1"
            class="preview-sheet__stages"
            role="group"
            :aria-label="t('management.showcasePreview.layoutSwitchLabel')"
          >
            <button
              v-for="frame in frames"
              :key="frame.id"
              type="button"
              class="preview-sheet__chip"
              :class="{ 'is-active': activeId === frame.id }"
              :aria-pressed="activeId === frame.id"
              @click="activeId = frame.id"
            >
              {{ t(frame.labelKey) }}
            </button>
          </div>
          <div v-else class="preview-sheet__stages preview-sheet__stages--single">
            {{ frames.length ? t(frames[0].labelKey) : '' }}
          </div>

          <button
            v-if="languages.length > 1"
            type="button"
            class="preview-sheet__icon-btn preview-sheet__icon-btn--lang"
            :aria-label="t('management.showcasePreview.switchLanguage')"
            @click="emit('cycle-language')"
          >
            {{ currentLanguage.toUpperCase() }}
          </button>

          <button
            v-if="canEdit"
            type="button"
            class="preview-sheet__icon-btn"
            :class="{ 'is-on': hintsOn }"
            :aria-pressed="hintsOn"
            :aria-label="t('management.showcasePreview.mobilePreview.editHints')"
            :title="t('management.showcasePreview.mobilePreview.editHints')"
            @click="toggleHints"
          >
            <Pencil class="w-4 h-4" />
          </button>
        </div>

        <!-- Stage: sized by its own ResizeObserver, never by window.innerHeight.
             Mobile browsers fire `resize` on every URL-bar collapse, so a
             viewport-derived scale makes the frame visibly jump while you use
             it; the sheet's own box (100dvh, handled in CSS) doesn't. -->
        <div ref="stageRef" class="preview-sheet__stage">
          <div class="preview-sheet__scaler" :style="scalerStyle">
            <div class="preview-sheet__native" :style="nativeStyle">
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
                  @loaded="onFrameLoaded(frame.id)"
                />
              </div>
            </div>
          </div>

          <!-- Overlaid and self-dismissing, so it costs no frame height. -->
          <Transition name="preview-sheet-tip">
            <p v-if="tipKey" class="preview-sheet__tip">
              {{ t(`management.showcasePreview.mobilePreview.${tipKey}`) }}
            </p>
          </Transition>
        </div>

        <!-- The one thing worth permanent space: that what's on screen is not
             what guests have. Placed here rather than in the bar because it
             carries the fix, and a CTA belongs at thumb height. -->
        <div v-if="showActivationBar" class="preview-sheet__activation">
          <span class="preview-sheet__activation-text">
            {{ t('management.showcasePreview.mobilePreview.previewOnly') }}
          </span>
          <button
            v-if="canEdit"
            type="button"
            class="preview-sheet__activation-cta"
            @click="emit('activate')"
          >
            <Sparkles class="w-3.5 h-3.5 flex-shrink-0" />
            <span>{{ t('management.activation.pill.activateCta') }}</span>
          </button>
        </div>
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
 * preview is this full-screen sheet, where the frame renders at very close to
 * 1:1 and the only scrollable thing on screen is the invitation itself.
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { Pencil, Sparkles, X } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import InertIframe from './InertIframe.vue'
import type { PreviewFrameDescriptor } from './renderers/resolvePreviewRenderer'
import type { TemplateAssets } from '@/composables/useEventShowcase'
import type { ActivationState } from '@/composables/useTemplateActivation'

// Native frame size — a real iPhone 12/13/14 viewport, matching PreviewFrame's
// own constant. The showcase components lay out against real vh/vw, so the
// frame has to be a genuine phone-sized browsing context that we then scale,
// not a box we resize to fit.
const NATIVE_WIDTH = 390
const NATIVE_HEIGHT = 844

interface Props {
  open: boolean
  /** Already filtered to the frames this event actually has. */
  frames: PreviewFrameDescriptor[]
  /** Builds each frame's iframe src (stage/lang/editable/templateId params). */
  frameUrl: (frame: PreviewFrameDescriptor) => string
  canEdit: boolean
  languages: { language: string }[]
  currentLanguage: string
  /** Drives the preview-only bar; undefined until the payment rows resolve. */
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
// unapplied) template has to be re-pushed as each one loads.
const onFrameLoaded = (id: string) => {
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

// --- Fit-to-sheet scaling --------------------------------------------------
const stageRef = ref<HTMLElement | null>(null)
const stageWidth = ref(NATIVE_WIDTH)
const stageHeight = ref(NATIVE_HEIGHT)

let stageObserver: ResizeObserver | null = null

const observeStage = (el: HTMLElement | null) => {
  stageObserver?.disconnect()
  stageObserver = null
  if (!el) return
  const read = () => {
    stageWidth.value = el.clientWidth
    stageHeight.value = el.clientHeight
  }
  read()
  stageObserver = new ResizeObserver(read)
  stageObserver.observe(el)
}

watch(stageRef, observeStage)
onUnmounted(() => stageObserver?.disconnect())

const scale = computed(() =>
  Math.min(stageWidth.value / NATIVE_WIDTH, stageHeight.value / NATIVE_HEIGHT),
)

const scalerStyle = computed(() => ({
  width: `${NATIVE_WIDTH * scale.value}px`,
  height: `${NATIVE_HEIGHT * scale.value}px`,
}))

const nativeStyle = computed(() => ({
  width: `${NATIVE_WIDTH}px`,
  height: `${NATIVE_HEIGHT}px`,
  transform: `scale(${scale.value})`,
}))

// --- Activation bar --------------------------------------------------------
const showActivationBar = computed(
  () => props.activationState === 'unpaid' || props.activationState === 'pending',
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
      if (props.canEdit && hintsOn.value) showTipFor('editHintsTip')
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeydown)
      frameInstances.clear()
    }
  },
)

onUnmounted(() => {
  clearTipTimer()
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* Deliberately dark, in a light-mode-only app: this is a media viewer, and a
   white chrome around a white invitation gives the frame no edge at all. Same
   reasoning as the black backing behind the desktop frames. */
.preview-sheet {
  position: fixed;
  inset: 0;
  /* dvh, not vh: on mobile Safari/Chrome `100vh` is the *expanded* viewport, so
     a vh-sized sheet runs under the URL bar and the activation bar at its
     bottom is unreachable. */
  height: 100dvh;
  /* Below the drawer/modal ladder (§14) on purpose — tapping an editable region
     in here opens one of PreviewEditorHost's drawers, which must land on top. */
  z-index: 900;
  display: flex;
  flex-direction: column;
  background: rgb(15 23 42);
  overscroll-behavior: contain;
}

.preview-sheet__bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  height: 3rem;
  padding: 0 0.5rem;
  padding-top: env(safe-area-inset-top);
  box-sizing: content-box;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.preview-sheet__icon-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 44px: the platform minimum. The desktop studio's 24px-wide chevron handle
     is the control this replaces. */
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  color: rgb(226 232 240);
  background: transparent;
  transition: background 0.2s ease, color 0.2s ease;
}

.preview-sheet__icon-btn:active {
  background: rgba(255, 255, 255, 0.12);
}

.preview-sheet__icon-btn--lang {
  width: auto;
  min-width: 2.75rem;
  padding: 0 0.625rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.preview-sheet__icon-btn.is-on {
  color: white;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
}

.preview-sheet__stages {
  flex: 1 1 auto;
  /* Must be allowed to shrink below its content: the chips scroll, the bar
     doesn't grow, and the buttons either side keep their 44px. */
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.preview-sheet__stages::-webkit-scrollbar {
  display: none;
}

.preview-sheet__stages--single {
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgb(148 163 184);
}

.preview-sheet__chip {
  flex-shrink: 0;
  height: 2rem;
  padding: 0 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  color: rgb(203 213 225);
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}

.preview-sheet__chip.is-active {
  color: white;
  font-weight: 700;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 2px 6px -1px rgba(46, 204, 113, 0.4);
}

.preview-sheet__stage {
  position: relative;
  flex: 1 1 auto;
  /* The page never scrolls in here — the frame is fitted to this box, so the
     only scroll surface left is the invitation inside the iframe. That is the
     whole fix for the mobile scroll trap. */
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}

.preview-sheet__scaler {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  background: #000;
  box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.6);
}

.preview-sheet__native {
  position: relative;
  transform-origin: top left;
  overflow: hidden;
}

.preview-sheet__frame {
  position: absolute;
  inset: 0;
}

.preview-sheet__tip {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 2rem);
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

.preview-sheet__activation {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.875rem;
  padding-bottom: max(env(safe-area-inset-bottom), 0.5rem);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(253 230 138);
  background: rgba(120, 53, 15, 0.55);
  border-top: 1px solid rgba(252, 211, 77, 0.3);
}

.preview-sheet__activation-text {
  min-width: 0;
}

.preview-sheet__activation-cta {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  background: rgb(180 83 9);
  box-shadow: 0 2px 4px -1px rgba(120, 53, 15, 0.45);
}

.preview-sheet__activation-cta:active {
  background: rgb(146 64 14);
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
  transform: translateX(-50%) translateY(-0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .preview-sheet-enter-active,
  .preview-sheet-leave-active,
  .preview-sheet-tip-enter-active,
  .preview-sheet-tip-leave-active {
    transition: none;
  }

  .preview-sheet-enter-from,
  .preview-sheet-leave-to {
    transform: none;
  }
}
</style>
