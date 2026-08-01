<template>
  <div class="tpl-preview">
    <!-- Controls: which stage of the template, and in which language. Kept
         above the frame (not floating over it) — the frame column is only
         ~340px wide inside the templates modal, so anything overlaying the
         phone eats the very thing being judged.

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
            @click="activeFrameId = frame.id"
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
      </div>
    </div>

    <div ref="bodyRef" class="tpl-preview__body">
      <PreviewFrame
        v-if="activeFrame"
        ref="previewFrameRef"
        :label="t(activeFrame.labelKey)"
        :bottom-reserve="bottomReserve"
      >
        <InertIframe
          :key="frameKey"
          ref="frameRef"
          :src="frameSrc"
          :click-message="activeFrame.clickMessage"
          @ready="onFrameReady"
          @languages="onFrameLanguages"
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

    <p class="tpl-preview__hint">{{ t('management.partnerTemplatePreview.hint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { Event, PartnerTemplate } from '@/services/api'
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
}

const props = withDefaults(defineProps<Props>(), { savedTemplate: null, eventData: null })

const { t } = useI18n()
// The app's own locale — the language this partner is working in, and so the
// one the preview should open in when the event offers it.
const { locale } = useAppLanguage()

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
  templateAssets: { standard_cover_video: draftAssets.value.assets?.standard_cover_video ?? null },
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

// Declared ahead of the language block below, which posts into the frame.
const frameRef = ref<InstanceType<typeof InertIframe> | null>(null)
const previewFrameRef = ref<InstanceType<typeof PreviewFrame> | null>(null)
const frameLoading = ref(true)

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
// ---------------------------------------------------------------------------
const frameLanguages = ref<string[]>([])
const previewLanguage = ref('')

/** Stops the app-locale default from overriding a deliberate choice. */
const languageTouched = ref(false)

const previewLanguages = computed(() => {
  const langs = new Set<string>(frameLanguages.value)
  for (const font of props.draft.fonts) langs.add(font.language)
  if (previewLanguage.value) langs.add(previewLanguage.value)
  return [...langs]
})

/** The frame is refetching localized content; cleared when it reports back. */
const languageSwitching = ref(false)

const selectLanguage = (language: string) => {
  languageTouched.value = true
  if (language === previewLanguage.value) return
  previewLanguage.value = language
  languageSwitching.value = true
  // In place, over the bridge — never by touching the iframe's `src`.
  frameRef.value?.postSetLanguage(language)
}

/**
 * The frame finished loading (or finished a language switch) and reported where
 * it landed. On the first report, prefer the language the partner is actually
 * working in — the app's own locale — over whatever the event defaulted to,
 * since a Khmer-speaking vendor building a Khmer template shouldn't have to
 * switch the preview every single time it mounts.
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

  if (languageTouched.value) return
  languageTouched.value = true

  const preferred = locale.value
  if (preferred !== current && languages.includes(preferred)) selectLanguage(preferred)
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

const measureBottomReserve = () => {
  if (!bodyRef.value) return
  const { bottom } = bodyRef.value.getBoundingClientRect()
  bottomReserve.value = Math.max(window.innerHeight - bottom, 0) + 8
}

let bodyResizeObserver: ResizeObserver | null = null

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
    srcLanguage.value = previewLanguage.value
  },
  { immediate: true },
)

const frameSrc = computed(() => {
  if (!frameKey.value || !activeFrame.value) return ''
  const params = new URLSearchParams({ stage: activeFrame.value.id })
  // Omitted entirely until a language is known, so the frame picks the event's
  // own default rather than being forced to a guess.
  if (srcLanguage.value) params.set('lang', srcLanguage.value)
  return `/events/${props.eventId}/showcase-preview-frame?${params.toString()}`
})

const onFrameReady = () => {
  frameLoading.value = false
  pushDraft()
  measureBottomReserve()
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
  measureBottomReserve()
  // The controls above the frame change height as stages/languages appear, and
  // the modal itself resizes with the window — both move this body's bottom
  // edge, and therefore how much room the frame actually has.
  if (bodyRef.value) {
    bodyResizeObserver = new ResizeObserver(measureBottomReserve)
    bodyResizeObserver.observe(bodyRef.value)
  }
  window.addEventListener('resize', measureBottomReserve)
})

onUnmounted(() => {
  if (pushTimer) clearTimeout(pushTimer)
  bodyResizeObserver?.disconnect()
  bodyResizeObserver = null
  window.removeEventListener('resize', measureBottomReserve)
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

@media (prefers-reduced-motion: reduce) {
  .tpl-preview__seg,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
