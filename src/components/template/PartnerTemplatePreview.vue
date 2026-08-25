<template>
  <!-- Two modes, one DOM. Full screen is a class on this root, NOT a teleport
       or a second component: moving an <iframe> to a different parent makes the
       browser re-navigate it, which would reload the whole showcase (and drop
       the draft pushed in over the bridge) on every toggle. Promoting this
       element to `position: fixed` leaves the frame exactly where it is in the
       tree, so the toggle costs nothing but a re-measure.

       Safe because nothing between here and the viewport carries a transform,
       filter or containment at rest — BrowseTemplateModal only transforms its
       panel during the open/close transition. -->
  <div
    class="tpl-preview"
    :class="{ 'is-fullscreen': fullscreen, 'is-idle': chromeIdle }"
    @pointerdown="wakeChrome"
    @focusin="wakeChrome"
  >
    <!-- Controls: which stage of the template, and in which language. Kept
         above the frame (not floating over it) — the frame column is only
         ~340px wide inside the templates modal, so anything overlaying the
         phone eats the very thing being judged. In full screen the same row
         becomes a floating bar instead, because there the frame is worth every
         pixel of height and the bar can dim itself out of the way.

         There is deliberately no event picker. This form is only ever reached
         from inside an event's manage page (BrowseTemplateModal's single call
         site is ShowcasePreviewTab), so the event being managed is already the
         obvious sample data — asking the partner to choose one was asking a
         question they had already answered by being here. -->
    <div class="tpl-preview__controls">
      <!-- Stage picker + language, in one glass pill (§5 segmented control).
           The stage list comes from the preview renderer keyed on the DRAFT's
           own assets, so switching the plan's background video on/off adds or
           drops the middle stage here exactly as it would for a real guest. -->
      <div class="tpl-preview__segments">
        <div v-if="visibleFrames.length > 1" class="tpl-preview__seg-group" role="group" :aria-label="t('management.partnerTemplatePreview.stageLabel')">
          <button
            v-for="frame in visibleFrames"
            :key="frame.id"
            type="button"
            class="tpl-preview__seg"
            :class="{ 'is-active': activeFrameId === frame.id }"
            @click="selectFrame(frame.id)"
          >
            {{ t(frame.labelKey) }}
          </button>
        </div>

        <div v-if="previewLanguages.length > 1" class="tpl-preview__seg-group" role="group" :aria-label="t('management.partnerTemplatePreview.languageLabel')">
          <button
            v-for="lang in previewLanguages"
            :key="lang"
            type="button"
            class="tpl-preview__seg tpl-preview__seg--lang"
            :class="{ 'is-active': previewLanguage === lang }"
            :disabled="languageSwitching"
            @click="selectLanguage(lang)"
          >
            {{ lang.toUpperCase() }}
          </button>
        </div>

        <!-- Always present, even when there is only one stage and one language
             to pick from — it is the control that answers "I can't see what I'm
             doing", which is exactly the situation where the other two rows are
             absent. -->
        <button
          type="button"
          class="tpl-preview__expand"
          :aria-pressed="fullscreen"
          :aria-label="fullscreenLabel"
          :title="fullscreenLabel"
          @click="setFullscreen(!fullscreen)"
        >
          <component :is="fullscreen ? Minimize2 : Maximize2" class="w-[0.9375rem] h-[0.9375rem]" />
        </button>
      </div>
    </div>

    <div ref="bodyRef" class="tpl-preview__body">
      <PreviewFrame
        v-if="activeFrame"
        ref="previewFrameRef"
        :label="t(activeFrame.labelKey)"
        :bottom-reserve="bottomReserve"
        :max-width="frameMaxWidth"
        :width-override="bodyWidth || undefined"
      >
        <InertIframe
          :key="frameKey"
          ref="frameRef"
          :src="frameSrc"
          :click-message="layoutEditActive ? undefined : activeFrame.clickMessage"
          :interactive="layoutEditActive"
          @ready="onFrameReady"
          @languages="onFrameLanguages"
          @cover-layout-change="(elements, commit) => emit('layout-change', elements, commit)"
          @cover-layout-select="(id) => emit('update:selectedElement', id)"
        />
      </PreviewFrame>

      <!-- Covers the reload a stage switch forces (that one does change the
           iframe's src, so the browser navigates it) and the content refetch a
           language switch triggers. Without it the partner watches the previous
           stage sit there stale, then jump. -->
      <Transition name="fade">
        <div v-if="frameLoading || languageSwitching" class="tpl-preview__loading-veil">
          <div class="w-6 h-6 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
        </div>
      </Transition>
    </div>

    <!-- In full screen this floats just above the control bar and dims with it,
         so the way back out is always written down somewhere without costing
         the frame any height. -->
    <p class="tpl-preview__hint">
      {{ layoutEditActive
        ? t('management.coverLayoutEditor.previewHint')
        : t('management.partnerTemplatePreview.hint') }}
      <span v-if="fullscreen" class="tpl-preview__hint-esc">
        {{ t('management.partnerTemplatePreview.escHint') }}
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Maximize2, Minimize2 } from 'lucide-vue-next'
import type { Event, PartnerTemplate } from '@/services/api'
import type { CoverElementBoxes, CoverElementId } from '@/services/api/types/template.types'
import PreviewFrame from '../showcase-preview/PreviewFrame.vue'
import InertIframe from '../showcase-preview/InertIframe.vue'
import {
  resolvePreviewRenderer,
  type PreviewFrameDescriptor,
} from '../showcase-preview/renderers/resolvePreviewRenderer'
import { partnerTemplateDraftToAssets, type PartnerTemplateDraft } from './partnerTemplateAssets'

interface Props {
  /** The template form's live state — unsaved files and all. */
  draft: PartnerTemplateDraft
  /**
   * The event being managed — the sample content the template is drawn around.
   * Always present: this form is only reachable from inside an event's manage
   * page, so there is nothing to choose and nothing to fetch.
   */
  eventId: string
  /**
   * That same event's record, for the frame-list decisions below (category and
   * event video). Optional only because the manage view's own copy can still be
   * in flight on first paint.
   */
  eventData?: Event | null
  /** The template as last persisted, for anything the draft hasn't touched. */
  savedTemplate?: PartnerTemplate | null
  /**
   * Which stage to show, driven from outside. The form's section rail sets it so
   * the pane always shows the stage the open section actually affects — editing
   * background decorations while staring at the cover was the old default.
   * Ignored when it names a stage this draft doesn't have.
   */
  stage?: string
  /**
   * Turn the cover's direct-manipulation layout overlay on. Only meaningful on
   * the cover stage, which is where the boxes live — the frame is told to drop
   * the mode whenever another stage is showing, so switching tabs mid-edit can't
   * leave an invisible overlay swallowing clicks.
   */
  layoutEditing?: boolean
  /** Which cover block the editor pane has selected; kept in step with the frame. */
  selectedElement?: CoverElementId | null
}

const props = withDefaults(defineProps<Props>(), {
  savedTemplate: null,
  eventData: null,
  stage: '',
  layoutEditing: false,
  selectedElement: null,
})

const emit = defineEmits<{
  'update:stage': [string]
  'update:selectedElement': [CoverElementId | null]
  'layout-change': [elements: CoverElementBoxes, commit: boolean]
}>()

const { t } = useI18n()

// ---------------------------------------------------------------------------
// The draft as showcase data. Unsaved File picks are previewed straight from
// blob URLs, so a decoration appears the moment it's chosen rather than after a
// save + reload round trip.
// ---------------------------------------------------------------------------
const objectUrls = new Map<File, string>()

const objectUrlFor = (file: File): string => {
  let url = objectUrls.get(file)
  if (!url) {
    url = URL.createObjectURL(file)
    objectUrls.set(file, url)
  }
  return url
}

onUnmounted(() => {
  for (const url of objectUrls.values()) URL.revokeObjectURL(url)
  objectUrls.clear()
})

const draftAssets = computed(() =>
  partnerTemplateDraftToAssets(props.draft, props.savedTemplate, objectUrlFor),
)

// ---------------------------------------------------------------------------
// Which stages this draft even has. Same registry the manage-page studio uses,
// fed the draft's own assets — so a template with a cover video shows the
// standard flow's Event Video stage, and one without shows the basic flow's
// Transition stage, without either being hardcoded here.
// ---------------------------------------------------------------------------
const rendererContext = computed(() => ({
  event: props.eventData ?? {},
  templateAssets: {
    standard_cover_video: draftAssets.value.assets?.standard_cover_video ?? null,
    standard_transition_video: draftAssets.value.assets?.standard_transition_video ?? null,
  },
  // Someone building a template wants to see every stage that template defines,
  // so the basic flow's Transition stage is always offered rather than gated on
  // the chosen event happening to have a featured photo — which the events list
  // response doesn't carry anyway (each frame fetches its own showcase data).
  hasFeaturedPhoto: true,
  // Not an event editor — no inline editing here, so no edit-mode-only frames.
  canEdit: false,
}))

const renderer = computed(() => resolvePreviewRenderer(rendererContext.value))

const visibleFrames = computed(() =>
  renderer.value.frames.filter((frame: PreviewFrameDescriptor) =>
    frame.isVisible ? frame.isVisible(rendererContext.value) : true,
  ),
)

const activeFrameId = ref<string>('cover')

const activeFrame = computed(
  () => visibleFrames.value.find((frame) => frame.id === activeFrameId.value) ?? visibleFrames.value[0] ?? null,
)

// A plan switch can remove the stage currently being looked at (basic's
// Transition ↔ standard's Event Video are mutually exclusive).
watch(visibleFrames, (frames) => {
  if (frames.length && !frames.some((frame) => frame.id === activeFrameId.value)) {
    activeFrameId.value = frames[0].id
  }
})

/** The stage tabs stay usable on their own; they just report where they landed. */
const selectFrame = (frameId: string): void => {
  activeFrameId.value = frameId
  emit('update:stage', frameId)
}

// Watches the frame list as well as the request, because a requested stage the
// draft doesn't render yet is *held*, not discarded: opening the Transition
// section on a template with no transition video asks for a frame that doesn't
// exist, and the whole point of that section is to upload the file that brings
// it into being. Re-checking when the list changes means the pane lands on the
// new stage the moment the partner picks the file, instead of stranding them on
// the cover with no sign their upload did anything.
watch(
  [() => props.stage, visibleFrames],
  ([stage]) => {
    if (!stage || stage === activeFrameId.value) return
    if (visibleFrames.value.some((frame) => frame.id === stage)) activeFrameId.value = stage
  },
  { immediate: true },
)

// Declared ahead of the language block below, which posts into the frame.
const frameRef = ref<InstanceType<typeof InertIframe> | null>(null)
const previewFrameRef = ref<InstanceType<typeof PreviewFrame> | null>(null)
const frameLoading = ref(true)

// ---------------------------------------------------------------------------
// Direct-manipulation cover layout.
//
// Only ever on the cover stage: the boxes are cover geometry, and an overlay
// left running on the Main Content stage would be an invisible sheet eating
// every click. Gating here rather than asking the parent to remember means the
// preview's own stage tabs can't desynchronise it either.
// ---------------------------------------------------------------------------
const layoutEditActive = computed(
  () => props.layoutEditing && activeFrame.value?.id === 'cover',
)

const syncLayoutEditMode = (): void => {
  frameRef.value?.post(layoutEditActive.value ? 'cover-layout-edit-on' : 'cover-layout-edit-off')
}

// The frame is replaced outright on a stage switch, so this covers both turning
// the mode on/off and carrying it across into a freshly mounted cover frame
// (the `ready` handshake calls the same function).
watch(layoutEditActive, () => {
  if (!frameLoading.value) syncLayoutEditMode()
})

// The editor pane's block list and the overlay's own selection are the same
// selection; whichever end changes it, the other follows.
watch(
  () => props.selectedElement,
  (id) => {
    if (!frameLoading.value && layoutEditActive.value) frameRef.value?.postCoverLayoutSelect(id)
  },
)

// ---------------------------------------------------------------------------
// Language. Two things depend on it: which of the event's texts render, and
// which of the template's fonts apply (fonts are declared per language, so
// switching is how a partner checks the Khmer font they just attached actually
// renders).
//
// The list is reported BY THE FRAME rather than derived here. It used to be
// built from the draft's own fonts, which was simply the wrong source: a
// partner who hadn't attached any fonts yet got a one-entry list, the switcher
// never rendered, and a Khmer-first event could only ever be previewed in
// English. What languages exist is a property of the event, and
// `available_languages` only comes back on the showcase response — which the
// frame has and this component does not.
//
// Font languages are still unioned in, so a font attached for a language the
// event has no texts in can still be selected and checked.
//
// One direction of authority, which is what keeps the toggle honest: the parent
// PROPOSES (`?lang=` on mount, `set-language` after) and the frame REPORTS what
// it could actually render. The highlighted segment always comes from the
// report. An earlier version instead let the frame load in whatever it liked
// and then corrected it to the app locale on the first report — which set the
// toggle to the requested language before knowing whether the frame would honour
// it, so a switch that no-op'd left EN lit up over Khmer content.
// ---------------------------------------------------------------------------
const frameLanguages = ref<string[]>([])

/**
 * The language the preview opens in. Khmer, deliberately — NOT the partner's own
 * app locale. A template is judged on how it renders the script its guests will
 * actually read, and Khmer is both the demanding case (taller glyphs, custom
 * fonts) and what the live showcase itself defaults to (`useEventShowcase`'s
 * `urlLang` fallback). Seeding from the app locale meant a partner working in
 * English opened every preview in English and never saw the layout that matters.
 *
 * It matters that this is non-empty from the very first render: it is what puts
 * `?lang=` on the frame's initial `src`.
 *
 * The parent only ever *proposes* a language this way. Whatever the frame
 * actually resolves — the event may not carry texts in this one — comes back on
 * the `languages` report below and wins.
 */
const previewLanguage = ref<string>('kh')

const previewLanguages = computed(() => {
  const langs = new Set<string>(frameLanguages.value)
  for (const font of props.draft.fonts) langs.add(font.language)
  if (previewLanguage.value) langs.add(previewLanguage.value)
  return [...langs]
})

/** The frame is refetching localized content; cleared when it reports back. */
const languageSwitching = ref(false)

const selectLanguage = (language: string) => {
  if (language === previewLanguage.value) return

  // Without a mounted frame there is nothing to post to, and `postSetLanguage`
  // would swallow that silently — leaving the toggle highlighting a language
  // nothing is rendering. Better to ignore the click than to lie about it.
  const frame = frameRef.value
  if (!frame) return

  // Optimistic: the segment lights up now and the veil covers the refetch. The
  // frame's own report reconciles it either way, so a switch the event can't
  // honour lands back on whatever it actually rendered.
  previewLanguage.value = language
  languageSwitching.value = true
  // In place, over the bridge — never by touching the iframe's `src`.
  frame.postSetLanguage(language)
}

/**
 * The frame finished loading (or finished a language switch) and reported where
 * it landed. This is the authority on what is on screen: the parent proposes a
 * language (via `?lang=` on mount, or `set-language` after), the frame decides
 * what it could actually render, and the toggle follows the frame.
 */
const onFrameLanguages = (languages: string[], current: string) => {
  frameLanguages.value = languages
  previewLanguage.value = current
  languageSwitching.value = false

  // A language switch refetches the showcase, and that response carries the
  // event's REAL template_assets/template_fonts — which updateLanguageContent
  // merges straight over whatever draft was staged. Without re-pushing here the
  // preview silently reverts to the saved template (or to no template at all)
  // the moment the language changes. Same reason ShowcasePreviewTab re-posts its
  // staged template after every `refresh`.
  pushDraft()
}

// ---------------------------------------------------------------------------
// The frame itself. `src` deliberately omits ?templateId — that param makes the
// frame backfill a *saved* template's public assets, which would race with (and
// briefly overwrite) the draft being pushed in over the bridge.
// ---------------------------------------------------------------------------

// PreviewFrame fits itself to the *viewport* height, which is right on the
// manage page where it sits in the page flow. Here it lives inside a centered
// modal that stops well short of the viewport bottom (and has a footer under
// it), so left alone the frame would size itself several hundred pixels taller
// than the column it's in and get clipped by the aside's `overflow: hidden`.
// Reserving exactly the distance from this body's bottom edge to the viewport
// bottom converts that viewport-relative fit into a container-relative one
// without PreviewFrame needing to know it's in a modal.
const bodyRef = ref<HTMLElement | null>(null)
const bottomReserve = ref(40)

/**
 * The width actually available to the frame, handed to PreviewFrame as
 * `widthOverride` rather than left to its own ResizeObserver.
 *
 * Its self-measurement reads the frame wrapper's `clientWidth`, and that wrapper
 * shrink-wraps to the phone mockup's *current* size — so the measurement is
 * downstream of the scale it feeds. That loop is harmless while the scale is
 * capped at 1 (the mockup can only ever be asked to get smaller), but full
 * screen asks it to grow past 1 and a shrink-wrapped measurement can never
 * report the room to do so: the frame would stay locked at whatever size it had
 * in the column. This element is the real container, so measuring it directly
 * breaks the loop.
 */
const bodyWidth = ref(0)

const measureBody = () => {
  if (!bodyRef.value) return
  const { bottom, width } = bodyRef.value.getBoundingClientRect()
  bottomReserve.value = Math.max(window.innerHeight - bottom, 0) + 8
  bodyWidth.value = width
}

let bodyResizeObserver: ResizeObserver | null = null

// ---------------------------------------------------------------------------
// Full screen.
//
// The preview column is ~340px wide and the modal caps at 90vh, which on a
// laptop leaves the phone rendering at about two thirds of its real size —
// legible enough to judge a colour, not enough to place a block on the cover by
// hand. Full screen hands the same frame the whole viewport, so it renders at
// or above 1:1 and every drag target grows with it.
// ---------------------------------------------------------------------------
const fullscreen = ref(false)

/**
 * Native phone width (PreviewFrame's own default) times the most the mockup is
 * allowed to be blown up past life size. Without a cap a tall display would
 * scale it to something that is no longer recognisably a phone; with it, height
 * governs on ordinary screens and this only ever bites on very tall ones.
 */
const FULLSCREEN_MAX_WIDTH = 390 * 1.5

const frameMaxWidth = computed(() => (fullscreen.value ? FULLSCREEN_MAX_WIDTH : 390))

const fullscreenLabel = computed(() =>
  t(
    fullscreen.value
      ? 'management.partnerTemplatePreview.exitFullscreen'
      : 'management.partnerTemplatePreview.enterFullscreen',
  ),
)

/**
 * The floating bar is the only way back out, so it can never disappear — but it
 * also sits on top of the invitation it exists to show. So it dims after a few
 * seconds and any press (or hover, via CSS) brings it straight back, same
 * treatment the showcase's own mobile preview sheet gives its controls.
 *
 * Most of the work in full screen happens *inside* the iframe, which delivers no
 * pointer events out here — so the bar correctly stays out of the way for as
 * long as someone is dragging blocks around, and wakes the moment they reach for
 * it.
 */
const IDLE_DELAY = 2800
const chromeIdle = ref(false)
let idleTimer: ReturnType<typeof setTimeout> | null = null

const clearIdleTimer = () => {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = null
}

const wakeChrome = () => {
  chromeIdle.value = false
  clearIdleTimer()
  if (fullscreen.value) idleTimer = setTimeout(() => (chromeIdle.value = true), IDLE_DELAY)
}

/**
 * Capture phase, and it stops the event: the templates modal closes itself on
 * Escape, and leaving full screen should never also throw away the form behind
 * it. (An Escape pressed while the *frame* has focus never reaches this document
 * at all — the cover layout overlay handles that one as "deselect".)
 */
const onFullscreenKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  event.stopPropagation()
  event.preventDefault()
  void setFullscreen(false)
}

const setFullscreen = async (on: boolean): Promise<void> => {
  if (fullscreen.value === on) return
  fullscreen.value = on

  if (on) {
    window.addEventListener('keydown', onFullscreenKeydown, true)
    wakeChrome()
  } else {
    window.removeEventListener('keydown', onFullscreenKeydown, true)
    clearIdleTimer()
    chromeIdle.value = false
  }

  // Both the room available and this body's distance from the viewport bottom
  // change wholesale here. The observers would catch up on their own, but only
  // after a frame of the phone at the wrong size.
  await nextTick()
  measureBody()
  previewFrameRef.value?.measure()
}

// What genuinely requires a new document: a different forced stage. The event
// never changes here, and language is deliberately absent — it's swapped in
// place over the bridge instead (see selectLanguage).
const frameKey = computed(() => (activeFrame.value ? `${props.eventId}|${activeFrame.value.id}` : ''))

// The language baked into `src`, captured only when the frame is about to mount
// anyway. `src` must not track `previewLanguage` directly: changing an iframe's
// src attribute at all navigates it, so a language switch would reload the
// whole frame — the exact refresh this is meant to avoid — even with the key
// held constant.
const srcLanguage = ref('')

watch(
  frameKey,
  () => {
    frameLoading.value = true
    // Any bridge language switch still in flight belonged to the frame being
    // replaced; its report will never arrive (that InertIframe unmounts with its
    // listener), so the flag would otherwise stay stuck until the *next* switch.
    languageSwitching.value = false
    srcLanguage.value = previewLanguage.value
  },
  { immediate: true },
)

const frameSrc = computed(() => {
  if (!frameKey.value || !activeFrame.value) return ''
  const params = new URLSearchParams({ stage: activeFrame.value.id })
  // Always present in practice — `previewLanguage` is seeded before the first
  // frame mounts, and reconciled to whatever the frame reports thereafter.
  if (srcLanguage.value) params.set('lang', srcLanguage.value)
  return `/events/${props.eventId}/showcase-preview-frame?${params.toString()}`
})

const onFrameReady = () => {
  frameLoading.value = false
  pushDraft()
  // A stage switch mounts a brand-new frame that knows nothing about the mode
  // or the selection, so both are re-established at the handshake rather than
  // only on change.
  syncLayoutEditMode()
  if (layoutEditActive.value) frameRef.value?.postCoverLayoutSelect(props.selectedElement)
  measureBody()
  previewFrameRef.value?.measure()
}

const pushDraft = () => {
  frameRef.value?.postTemplatePreview(draftAssets.value)
}

// Every edit repaints the frame in place — no save, no reload. Debounced
// because this runs on keystrokes in the layout number fields, and each push
// re-registers the template's @font-face rules on the frame side.
//
// `deep` is load-bearing, not belt-and-braces. Several config objects are
// passed through to the assets by REFERENCE (cover_stage_layout is literally
// the form's own reactive object), so editing a field inside one — every cover
// layout number, exactly the values that most need live feedback — leaves the
// enclosing object's identity untouched and never invalidates the computed. The
// deep traversal subscribes to those nested properties instead; the push then
// serializes the live proxies and picks the current values up regardless.
let pushTimer: ReturnType<typeof setTimeout> | null = null

watch(
  draftAssets,
  () => {
    if (frameLoading.value) return // the `ready` handshake will push instead
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(pushDraft, 200)
  },
  { deep: true },
)

onMounted(() => {
  measureBody()
  // The controls above the frame change height as stages/languages appear, and
  // the modal itself resizes with the window — both move this body's bottom
  // edge, and therefore how much room the frame actually has.
  if (bodyRef.value) {
    bodyResizeObserver = new ResizeObserver(measureBody)
    bodyResizeObserver.observe(bodyRef.value)
  }
  window.addEventListener('resize', measureBody)
})

onUnmounted(() => {
  if (pushTimer) clearTimeout(pushTimer)
  bodyResizeObserver?.disconnect()
  bodyResizeObserver = null
  window.removeEventListener('resize', measureBody)
  clearIdleTimer()
  // Closing the form unmounts this mid-full-screen; the window listener would
  // otherwise outlive it and swallow every later Escape in the app.
  window.removeEventListener('keydown', onFullscreenKeydown, true)
})
</script>

<style scoped>
.tpl-preview {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  height: 100%;
  min-height: 0;
}

.tpl-preview__controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tpl-preview__segments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

/* Glass pill segmented control (§5). Sized down from the app-wide recipe —
   this sits in a ~340px column beside a form, not in a page header. */
.tpl-preview__seg-group {
  display: flex;
  gap: 0.125rem;
  padding: 0.1875rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 9999px;
  min-width: 0;
}

.tpl-preview__seg {
  padding: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.25rem;
  color: rgb(71 85 105);
  border-radius: 9999px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
}

.tpl-preview__seg:hover {
  color: rgb(30 41 59);
}

.tpl-preview__seg.is-active {
  color: #fff;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.2);
}

.tpl-preview__seg--lang {
  letter-spacing: 0.05em;
}

.tpl-preview__seg:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sized to the segmented pills beside it (34px tall) rather than to the §17
   touch floor, so the row reads as one strip of controls instead of one button
   standing a head taller than the rest. */
.tpl-preview__expand {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.125rem;
  height: 2.125rem;
  color: rgb(71 85 105);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 9999px;
  transition: all 0.3s ease;
}

.tpl-preview__expand:hover {
  color: rgb(30 41 59);
  background: rgba(255, 255, 255, 0.9);
}

.tpl-preview__body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.tpl-preview__loading-veil {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 250, 252, 0.7);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  pointer-events: none;
}

.tpl-preview__hint {
  flex-shrink: 0;
  font-size: 0.6875rem;
  line-height: 1rem;
  color: rgb(148 163 184);
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ------------------------------------------------------------------------- */
/* Full screen                                                               */
/*                                                                           */
/* Same elements, repositioned: the frame takes the whole viewport and every  */
/* control floats over it, because a stacked header and caption would spend   */
/* ~90px of exactly the height this mode exists to hand the phone.            */
/* ------------------------------------------------------------------------- */
.tpl-preview.is-fullscreen {
  position: fixed;
  inset: 0;
  /* dvh, not vh: on mobile the URL bar makes 100vh taller than what is on
     screen, which would push the control bar past the bottom edge. */
  height: 100dvh;
  /* Local to the templates modal's own z-100 stacking context — this only has
     to clear the form and the modal's floating close button. */
  z-index: 50;
  padding: 0;
  /* A media-viewer surface, not app chrome: the black gives the one stage that
     doesn't paint a full-bleed background an edge rather than a seam. */
  background: rgba(2, 6, 23, 0.97);
}

.tpl-preview.is-fullscreen .tpl-preview__body {
  position: absolute;
  inset: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom));
}

/* The stage is already named on the segmented control below, and the label
   costs the frame its own height plus a gap. */
.tpl-preview.is-fullscreen :deep(.preview-frame__label) {
  display: none;
}

.tpl-preview.is-fullscreen .tpl-preview__controls {
  position: absolute;
  left: 50%;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 2;
  align-items: center;
  max-width: calc(100vw - 1.5rem);
  transition: opacity 0.3s ease;
}

.tpl-preview.is-fullscreen .tpl-preview__segments {
  justify-content: center;
}

/* Dimmed, never hidden: still the way out, still clickable, just no longer
   sitting on the artwork. */
.tpl-preview.is-fullscreen.is-idle .tpl-preview__controls,
.tpl-preview.is-fullscreen.is-idle .tpl-preview__hint {
  opacity: 0.35;
}

.tpl-preview.is-fullscreen .tpl-preview__controls:hover,
.tpl-preview.is-fullscreen .tpl-preview__controls:focus-within {
  opacity: 1;
}

.tpl-preview.is-fullscreen .tpl-preview__seg-group,
.tpl-preview.is-fullscreen .tpl-preview__expand {
  background: rgba(15, 23, 42, 0.82);
  border-color: rgba(148, 163, 184, 0.22);
  box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.55);
}

/* `:not(.is-active)` deliberately: these selectors outweigh the active pill's
   own rule, and without it the selected stage would lose its white-on-gradient
   label. */
.tpl-preview.is-fullscreen .tpl-preview__seg:not(.is-active),
.tpl-preview.is-fullscreen .tpl-preview__expand {
  color: rgb(203 213 225);
}

.tpl-preview.is-fullscreen .tpl-preview__seg:not(.is-active):hover,
.tpl-preview.is-fullscreen .tpl-preview__expand:hover {
  color: #fff;
  background: rgba(30, 41, 59, 0.95);
}

.tpl-preview.is-fullscreen .tpl-preview__hint {
  position: absolute;
  left: 50%;
  bottom: calc(4rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 2;
  max-width: min(30rem, calc(100vw - 2rem));
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  color: rgb(203 213 225);
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.tpl-preview__hint-esc {
  margin-left: 0.375rem;
  padding-left: 0.5rem;
  border-left: 1px solid rgba(148, 163, 184, 0.35);
  color: rgb(148 163 184);
}

.tpl-preview.is-fullscreen .tpl-preview__loading-veil {
  background: rgba(2, 6, 23, 0.7);
}

@media (prefers-reduced-motion: reduce) {
  .tpl-preview__seg,
  .tpl-preview__expand,
  .tpl-preview.is-fullscreen .tpl-preview__controls,
  .tpl-preview.is-fullscreen .tpl-preview__hint,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
