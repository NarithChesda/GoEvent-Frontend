<template>
  <!-- Desktop: the editor's identity and its commit actions take over the
       modal's own header row rather than opening a second one under it.
       Nothing else belongs there while you're editing, so there's no
       competition for the space.

       A root-level sibling of the slide transition below, not a child of it, so
       that closing the editor pulls these out of the header at once. Nested
       inside, they would outlive the close by the length of the leave
       transition and briefly share the row with the Browse/Mine controls
       reappearing behind them. -->
  <Teleport v-if="isOpen && isDesktop && headerSlot" :to="headerSlot">
      <button
        type="button"
        @click="emit('close')"
        :class="[BTN_ICON, 'w-10 h-10']"
        :aria-label="t('management.partnerTemplateForm.header.goBack')"
      >
        <ArrowLeft class="w-[1.125rem] h-[1.125rem]" />
      </button>

      <div class="min-w-0 flex-1">
        <h3 class="text-base font-semibold tracking-tight text-slate-900 truncate leading-tight">
          {{ isEditing ? t('management.partnerTemplateForm.header.edit') : t('management.partnerTemplateForm.header.create') }}
        </h3>
        <p class="text-xs text-slate-500 truncate leading-tight">
          {{ form.name.trim() || t('management.partnerTemplateForm.header.untitled') }}
        </p>
      </div>

      <!-- The blocking requirement reads next to the button it blocks, which
           is where someone looks when that button won't work. -->
      <p v-if="!canSave" class="flex items-center gap-1.5 text-xs text-amber-600 flex-shrink-0">
        <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
        {{ t('management.partnerTemplateForm.footer.missingRequired') }}
      </p>

      <!-- No Cancel button.
           It ran `emit('close')` — byte-identical to the back arrow at the
           leading edge of this same row — so the bar offered the one action
           twice under two names, and the modal's own ✕ sits immediately after
           it, making three dismissals in one strip for two actual outcomes
           (back to the list, close the modal). The mobile header has always
           shipped the arrow alone, so removing this is also what makes the two
           agree about where "get out" lives (apple-design §16.4: the same thing
           behaves the same way and lives in the same place).

           Bar variant: this row is the modal's header and everything else in it
           is a 40px pill. See BTN_PRIMARY_BAR. -->
      <button type="button" @click="handleSave" :disabled="saving || !canSave" :class="BTN_PRIMARY_BAR">
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        {{ saving ? t('management.partnerTemplateForm.footer.saving') : (isEditing ? t('management.partnerTemplateForm.footer.saveChanges') : t('management.partnerTemplateForm.footer.createTemplate')) }}
      </button>
  </Teleport>

  <!-- Slide-over form panel -->
  <Transition name="slide">
    <!-- A three-column workspace: what to edit (rail), the editor, and the live
         result. From `lg` that is the whole thing — one row, three columns,
         with the header teleported into the modal's own bar above. Below `lg`
         the same element stacks into header / rail / pane / footer rows, which
         is why it is a grid rather than nested flex columns: one of the two
         panes is `hidden` there and the rows still line up without a second
         wrapper element.

         The preview column widens with the window because the phone in it is
         fitted to the height it has: a 9:16 frame needs ~0.56px of width per
         px of column height, so a fixed 24rem pane on a tall display drew the
         phone small and left the rest of the column empty. The editor column
         is what gives up the room, and only on screens that have it to give —
         at `lg` the two are unchanged. -->
    <div
      v-if="isOpen"
      class="absolute inset-0 z-10 grid bg-slate-50 overflow-hidden grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] lg:grid-cols-[13rem_minmax(0,1fr)_minmax(20rem,24rem)] xl:grid-cols-[13rem_minmax(0,1fr)_minmax(24rem,28rem)] 2xl:grid-cols-[13rem_minmax(0,1fr)_minmax(26rem,31rem)] lg:grid-rows-[minmax(0,1fr)]"
    >
      <!-- Below `lg` the modal is a full-screen sheet with no room for a phone
           frame beside the form, so the two swap places instead of sitting side
           by side — and the header stays local, since the modal's own row has
           no width to spare. -->
      <div v-if="!isDesktop" class="col-span-full flex items-center gap-3 px-3 sm:px-4 py-3 bg-white border-b border-slate-200/70">
        <button
          type="button"
          @click="emit('close')"
          :class="BTN_ICON"
          :aria-label="t('management.partnerTemplateForm.header.goBack')"
        >
          <ArrowLeft class="w-[1.125rem] h-[1.125rem]" />
        </button>

        <h3 class="min-w-0 flex-1 text-base font-semibold tracking-tight text-slate-900 truncate">
          {{ isEditing ? t('management.partnerTemplateForm.header.edit') : t('management.partnerTemplateForm.header.create') }}
        </h3>

        <!-- Which of the two panes am I looking at — the same question
             Browse/Mine asks, so the same control answers it. It used to be a
             `bg-slate-900` pill that snapped between states. -->
        <TemplateSegmented
          v-model="mobilePane"
          :options="paneOptions"
          :aria-label="t('management.partnerTemplateForm.header.paneSwitch')"
          size="sm"
        />
      </div>

      <!-- Section rail. One vertical list from `lg`; a horizontally scrolling
           chip strip below that, where it stays visible in BOTH mobile panes —
           in preview mode the chips are the stage switcher, since picking a
           section is what drives which stage the frame shows. -->
      <nav
        class="lg:row-start-1 lg:col-start-1 bg-white lg:border-r border-b lg:border-b-0 border-slate-200/70 lg:overflow-y-auto custom-scrollbar"
        :aria-label="t('management.partnerTemplateForm.sections.navLabel')"
      >
        <div
          ref="railRef"
          class="flex lg:flex-col gap-1 p-2 lg:p-3 overflow-x-auto lg:overflow-x-visible scrollbar-hide"
        >
          <button
            v-for="section in sections"
            :key="section.id"
            :ref="(el) => setRailButtonRef(section.id, el)"
            type="button"
            :aria-current="activeSection === section.id ? 'true' : undefined"
            class="group flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 rounded-lg text-left"
            :class="[
              OPTION_BASE,
              activeSection === section.id ? OPTION_SELECTED : OPTION_IDLE_RAIL,
            ]"
            @click="selectSection(section.id)"
          >
            <component
              :is="section.icon"
              class="w-4 h-4 flex-shrink-0 transition-colors duration-200"
              :class="optionIconClass(activeSection === section.id)"
            />
            <span class="text-[0.8125rem] font-medium whitespace-nowrap lg:truncate">{{ section.label }}</span>
            <span
              v-if="section.badge"
              class="ml-auto flex-shrink-0 min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[0.625rem] font-semibold text-center"
              :class="section.badgeWarn ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 group-hover:bg-white'"
            >{{ section.badge }}</span>
          </button>
        </div>
      </nav>

      <!-- Editor pane: one section at a time, so nine stacked accordions no
           longer bury the option someone is actually looking for. -->
      <div
        class="lg:row-start-1 lg:col-start-2 overflow-y-auto custom-scrollbar"
        :class="{ 'hidden lg:block': mobilePane === 'preview' }"
      >
        <div class="p-4 sm:p-5 space-y-5 max-w-3xl">
          <!-- Error Banner -->
          <div v-if="error" class="flex items-start gap-2 p-3 bg-red-50 ring-1 ring-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>

          <!-- Section heading -->
          <div>
            <h4 class="text-sm font-semibold text-slate-900">{{ activeSectionMeta.label }}</h4>
            <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ activeSectionMeta.description }}</p>
          </div>

          <!-- ============================ BASICS ============================ -->
          <!-- Carded like every other section. It used to sit bare on the
               slate-50 pane while Brand, Cover, Transition, Effects and Main
               Content were all white panels — so the first screen a partner
               lands on was the one that looked least like the rest of the
               editor. -->
          <BasicsSection v-if="activeSection === 'basics'" :plans="plans" />

          <!-- ======================= COLORS & FONTS ======================== -->
          <BrandSection
            v-else-if="activeSection === 'brand'"
            :brand="brand"
            :resolved-cover-text="resolvedCoverText"
          />

          <!-- ==================== COVER STAGE & LAYOUT ===================== -->
          <!-- Three questions, in the order a cover is designed: what it is made
               of (the artwork, and the light on it), what it says (every block,
               each carrying everything about how it looks), and where each block
               sits. The rare geometry is one tap deeper, last.

               It used to be sorted by where things are stored rather than by
               what they draw. The guest name alone was set up in four panels —
               its frame at the top, its font in a Text styles table, its colour
               inside Block placement, its switch at the very bottom — and the
               list of what the cover shows was cut in two, the names, date and
               venue above that table and the header, logo, invite line and guest
               name below the placement panel. -->
          <CoverSection v-else-if="activeSection === 'cover'" :cover="cover" />

          <!-- =========================== TRANSITION ========================= -->
          <!-- The beat between the cover and the invitation: tapping the cover
               plays a film, and the invitation appears over the background video
               when it ends. Its own rail entry rather than a group inside Cover,
               for the reason the rail exists at all — it is a stage of its own,
               so opening it points the preview at that stage instead of leaving
               the partner editing one screen while looking at another.

               What this stage *is* — a Save the Date card over the event's
               featured photo, or a film — is the mode control below, on every
               plan. -->
          <TransitionSection v-else-if="activeSection === 'transition'" />

          <!-- ============================= EFFECTS ========================== -->
          <!-- The three ambient decorations, gathered off the two stage tabs they
               used to be split across. Each is an independent field with its own
               switch, so which stage happens to render it is a property of the
               effect rather than a reason to bury its controls in that stage's tab.
               None is plan-gated: unlike the decoration slots, they do not depend
               on which package plan is chosen. Each block says where it shows,
               since the tab it sat in is no longer carrying that information. -->
          <EffectsSection v-else-if="activeSection === 'effects'" />

          <!-- ======================== MAIN CONTENT ========================= -->
          <!-- Everything the main content stage is made of, in the order it
               stacks on screen: the backdrop behind the card, then the card
               itself, then the blocks inside it. The backdrop used to be its own
               "Background" rail entry, which put the image and the thing it sits
               behind two clicks apart even though both only ever show on this
               one stage. -->
          <ContentSection v-else-if="activeSection === 'content'" />

        </div>
      </div>

      <!-- Live preview of the draft, fed over the same bridge the manage-page
           studio uses to try templates on — so unsaved edits (files included)
           show up without a save or a reload. Its stage follows the section
           being edited, so the pane always shows the thing under the cursor. -->
      <aside
        class="lg:row-start-1 lg:col-start-3 flex-col border-l border-slate-200/70 bg-white p-3 overflow-hidden"
        :class="mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'"
      >
        <PartnerTemplatePreview
          v-model:stage="previewStage"
          v-model:selected-element="selectedCoverElement"
          :draft="previewDraft"
          :language="previewLanguageRequest"
          :event-id="eventId"
          :event-data="eventData"
          :saved-template="existingTemplate"
          :layout-editing="coverLayoutEditing"
          @layout-change="onCoverLayoutChange"
          @text-change="onCoverTextChange"
        />
      </aside>

      <!-- Footer, mobile only: the desktop actions live in the modal's header
           row now, so keeping a bar down here just to restate the hint would be
           the exact wasted row this redesign removed. -->
      <div class="lg:hidden col-span-full px-3 sm:px-4 py-2.5 border-t border-slate-200/70 bg-white flex items-center gap-3">
        <p class="flex-1 min-w-0 text-[0.6875rem] sm:text-xs truncate" :class="canSave ? 'text-slate-400' : 'text-amber-600'">
          <span v-if="!canSave" class="inline-flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
            {{ t('management.partnerTemplateForm.footer.missingRequired') }}
          </span>
          <span v-else>{{ t('management.partnerTemplateForm.footer.autosaveHint') }}</span>
        </p>
        <button
          type="button"
          @click="handleSave"
          :disabled="saving || !canSave"
          :class="BTN_PRIMARY_BAR"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          {{ saving ? t('management.partnerTemplateForm.footer.saving') : (isEditing ? t('management.partnerTemplateForm.footer.saveChangesShort') : t('management.partnerTemplateForm.footer.createShort')) }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, inject, nextTick, onMounted } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Info,
  Palette,
  Image as ImageIcon,
  AlignLeft,
  Wand2,
  Clapperboard,
  type LucideIcon,
} from 'lucide-vue-next'
import { partnerTemplateService } from '../../services/api'
import type {
  // Aliased: this file's file-input handlers take the DOM `Event`, which an
  // unaliased import would shadow.
  Event as EventRecord,
  PartnerTemplate,
  PartnerTemplateCreatePayload,
  TransitionStageMode,
} from '../../services/api'
import PartnerTemplatePreview from './PartnerTemplatePreview.vue'
import TemplateSegmented, { type TemplateSegmentedOption } from './TemplateSegmented.vue'
import {
  BTN_ICON,
  BTN_PRIMARY_BAR,
  OPTION_BASE,
  OPTION_IDLE_RAIL,
  OPTION_SELECTED,
  optionIconClass,
} from './templateUi'
import { TEMPLATES_HEADER_SLOT } from './templatesHeaderSlot'
import { useMediaQuery } from '../../composables/useMediaQuery'
import { useTemplateAssets } from './useTemplateAssets'
import { provideTemplateEditor, type SectionId } from './templateEditorContext'
import { useTemplatePlans } from './useTemplatePlans'
import { useCoverEditor } from './useCoverEditor'
import BasicsSection from './sections/BasicsSection.vue'
import CoverSection from './sections/CoverSection.vue'
import TransitionSection from './sections/TransitionSection.vue'
import EffectsSection from './sections/EffectsSection.vue'
import ContentSection from './sections/ContentSection.vue'
import { useTemplateBrand } from './useTemplateBrand'
import BrandSection from './sections/BrandSection.vue'
import {
  PARTNER_TEMPLATE_ASSET_FIELDS,
  type PartnerTemplateAssetField,
  type PartnerTemplateDraft,
} from './partnerTemplateAssets'
// Every config's default, hydration and serialization, one module each. See
// config/index.ts for what adding a new option costs.
import {
  buildConfigPayload,
  defaultForm,
  hydrateForm,
  type FormState,
} from './config'

const { t } = useI18n()


// From `lg` up the editor's title and save actions take over the modal's own
// header row instead of opening a second one beneath it. Below that they stay
// local — the modal's row has no width to spare on a phone.
const headerSlot = inject(TEMPLATES_HEADER_SLOT, ref(null))
const isDesktop = useMediaQuery('(min-width: 1024px)')

interface Props {
  isOpen: boolean
  existingTemplate?: PartnerTemplate | null
  /** The event this form was opened from — the live preview's sample content. */
  eventId: string
  /** That event's record, for the preview's frame-list decisions. */
  eventData?: EventRecord | null
}

const props = withDefaults(defineProps<Props>(), { existingTemplate: null, eventData: null })

const emit = defineEmits<{
  close: []
  saved: [template: PartnerTemplate]
}>()

const isEditing = computed(() => !!props.existingTemplate)


const form = reactive<FormState>(defaultForm())
const saving = ref(false)
const error = ref<string | null>(null)

// Pending picks, staged removals and the preview thumbnails for both. Every
// section panel uses these and none of them owns it, so it lives outside the
// component — see useTemplateAssets.ts.
const assets = useTemplateAssets(
  form,
  computed(() => props.existingTemplate),
)
const { clearedAssets, clearedPreviewFiles, resetPreviews } = assets

// The pricing shelf this template sits on. The editor owns it because it
// decides when to load it; the Basics panel draws the picker.
const plans = useTemplatePlans(computed(() => props.existingTemplate))

// The palette and the typefaces. Child records with endpoints of their own, so
// unlike every other field here they are saved one at a time while editing and
// replayed after creation — see useTemplateBrand.ts.
const brand = useTemplateBrand(
  computed(() => props.existingTemplate),
  isEditing,
  error,
)

const canSave = computed(() => !!form.name.trim() && !!form.package_plan_id)


// ---------------------------------------------------------------------------
// Sections. The form used to be one long scroll of nine same-looking <details>
// accordions; it's now one section at a time, chosen from a rail. Each section
// also names the showcase stage it affects, so selecting it points the live
// preview at the thing being edited instead of leaving that to the partner.
// ---------------------------------------------------------------------------
// One entry per *stage* of the showcase rather than per kind of setting, so
// anything that only shows on one stage is edited from that stage's section with
// the preview already pointing at it. Hence no 'background' entry (the main
// content backdrop sits in 'content', beside the card it goes behind) and no
// 'effects' entry: falling particles render in the main content stage while
// ambient creatures only ever render over the cover, so a single Effects tab
// could only point the preview at one of its two halves.
// Cover artwork and cover layout are one entry, not two: both only ever change
// the cover stage, and placing a block is done by looking at the artwork it
// moves, so splitting them just meant switching tabs to see the effect.

interface SectionDescriptor {
  id: SectionId
  icon: LucideIcon
  /**
   * Preview frame id (see resolvePreviewRenderer) this section's edits show up
   * on. A function where the answer depends on the plan — the two flows draw
   * their middle stage from different sources, so they are two different frames.
   */
  stage: string | ((transition: TransitionStageMode) => string)
}

const SECTION_DESCRIPTORS: SectionDescriptor[] = [
  { id: 'basics', icon: Info, stage: 'cover' },
  { id: 'brand', icon: Palette, stage: 'cover' },
  { id: 'cover', icon: ImageIcon, stage: 'cover' },
  // The middle stage, in whichever shape this template declared: a film
  // (`event_video` frame) or the featured photo composed under a title card
  // (`transition` frame). A template with no middle stage points at the cover
  // instead — the tab still owns the opening animation, which governs the
  // cover's exit whichever shape is picked, and there is no middle frame left
  // for the preview to land on.
  {
    id: 'transition',
    icon: Clapperboard,
    stage: (transition) => {
      if (transition === 'none') return 'cover'
      return transition === 'video' ? 'event_video' : 'transition'
    },
  },
  { id: 'content', icon: AlignLeft, stage: 'main' },
  // Last, and pointed at the cover: the effects sit on top of both stages, and
  // two of the three (creatures, sparks) show there. The preview's own stage
  // tabs still move it to main for the falling particles.
  { id: 'effects', icon: Wand2, stage: 'cover' },
]

const activeSection = ref<SectionId>('basics')

/**
 * The cover panel's whole state. Held here rather than inside CoverSection
 * because three of its values are shared with the live preview frame — the
 * selected block, and the two handlers a drag and a resize report back through
 * — and `resolvedCoverText` is read by the Brand panel as well.
 */
const cover = useCoverEditor(form, assets, activeSection, brand.previewFonts)
const {
  selectedCoverElement,
  resolvedCoverText,
  coverLayoutEditing,
  onCoverLayoutChange,
  onCoverTextChange,
} = cover

/**
 * The rail strip and its chips, keyed by section id.
 *
 * A Map keyed by id rather than the array a `ref` inside `v-for` produces —
 * that array holds mount order, not list order, and TemplateSegmented carries
 * the long version of why.
 */
const railRef = ref<HTMLElement | null>(null)
const railButtonEls = new Map<SectionId, HTMLElement>()

function setRailButtonRef(id: SectionId, el: Element | ComponentPublicInstance | null): void {
  if (el instanceof HTMLElement) railButtonEls.set(id, el)
  else railButtonEls.delete(id)
}


const COVER_ASSET_FIELDS: PartnerTemplateAssetField[] = [
  'basic_decoration_photo',
  'standard_cover_video',
  'cover_top_decoration',
  'cover_bottom_decoration',
  'cover_left_decoration',
  'cover_right_decoration',
  'guest_title_frame_left',
  'guest_title_frame_mid',
  'guest_title_frame_right',
  'sample_logo_1',
  'sample_logo_2',
  'header_text_image',
  'cover_host_separator_image',
]

const TRANSITION_ASSET_FIELDS: PartnerTemplateAssetField[] = ['standard_transition_video']

const BACKGROUND_ASSET_FIELDS: PartnerTemplateAssetField[] = [
  'basic_background_photo',
  'standard_background_video',
  'top_decoration',
  'bottom_decoration',
  'left_decoration',
  'right_decoration',
]

/** An asset counts as present whether it was just picked or is already saved. */
function countAssets(fields: PartnerTemplateAssetField[]): number {
  return fields.filter((field) => form[field] instanceof File || !!props.existingTemplate?.[field]).length
}

/** Fixed for every section but the middle stage, whose frame follows its mode. */
function resolveStage(section: SectionDescriptor): string {
  return typeof section.stage === 'function'
    ? section.stage(form.stage_mode_transition)
    : section.stage
}

const sections = computed(() =>
  SECTION_DESCRIPTORS.map((section) => {
    let badge = ''
    let badgeWarn = false
    switch (section.id) {
      case 'basics':
        if (!canSave.value) {
          badge = '!'
          badgeWarn = true
        }
        break
      case 'brand': {
        const count = brand.pendingColors.value.length + brand.pendingFonts.value.length
        if (count) badge = String(count)
        break
      }
      // A stage's badge counts the assets configured on that stage. The effect
      // toggles used to be added in here because the effects lived in these two
      // tabs; they are counted in their own tab now, so adding them here as well
      // would report the same switch twice in the rail.
      case 'cover': {
        const count = countAssets(COVER_ASSET_FIELDS)
        if (count) badge = String(count)
        break
      }
      case 'transition': {
        // Only the film is countable, and only a filmed beat has one. A
        // template switched back to the animated beat keeps the uploaded file
        // on the server, so count it only where the tab offers the slot.
        const count =
          form.stage_mode_transition === 'video' ? countAssets(TRANSITION_ASSET_FIELDS) : 0
        if (count) badge = String(count)
        break
      }
      case 'content': {
        const count = countAssets(BACKGROUND_ASSET_FIELDS)
        if (count) badge = String(count)
        break
      }
      case 'effects': {
        const count =
          Number(form.ambient_creatures_enabled) +
          Number(form.falling_effect_enabled) +
          Number(form.sparks_enabled)
        if (count) badge = String(count)
        break
      }
    }
    return {
      ...section,
      stage: resolveStage(section),
      label: t(`management.partnerTemplateForm.sections.${section.id}.label`),
      description: t(`management.partnerTemplateForm.sections.${section.id}.description`),
      badge,
      badgeWarn,
    }
  }),
)

const activeSectionMeta = computed(
  () => sections.value.find((section) => section.id === activeSection.value) ?? sections.value[0],
)

/**
 * Two-way with the preview: the section drives which stage is shown, but the
 * preview's own stage tabs still work — clicking one writes back here, so a
 * later section pick is what re-points it rather than the tab click being undone.
 */
const previewStage = ref<string>('cover')

/**
 * The only way to change section. Deliberately not a `watch(activeSection)`:
 * picking a section has to re-point the preview even when that section is
 * already open. Otherwise, after moving the preview to another stage with its
 * own tabs, clicking the section you were already on — the obvious way to get
 * back — did nothing at all, because `activeSection` never changed.
 */
function selectSection(id: SectionId): void {
  activeSection.value = id
  const descriptor = SECTION_DESCRIPTORS.find((entry) => entry.id === id)
  if (descriptor) previewStage.value = resolveStage(descriptor)
  void nextTick(revealRailSection)
}

/**
 * Scroll the chosen section's chip into view on the phone rail.
 *
 * Below `lg` the rail is a horizontally scrolling strip of six chips with its
 * scrollbar hidden, and roughly three fit at a time — so a section chosen by
 * anything other than a tap on the chip itself could land entirely off-screen.
 * `PlanRequiredNotice` does exactly that: its "choose a plan" button jumps to
 * Basics, which is the first chip, from Cover or Content, which are not — so
 * the pane changed under the partner while the rail went on showing the section
 * they had left, with no highlighted chip anywhere on screen.
 *
 * Arithmetic on the strip's own `scrollLeft` rather than `scrollIntoView()`,
 * which walks up and scrolls every scrollable ancestor it needs to — here that
 * is the editor pane and the modal body. Same reason TemplateSegmented does it
 * this way. A no-op at `lg`, where the rail is a vertical list that does not
 * scroll horizontally.
 */
function revealRailSection(): void {
  const rail = railRef.value
  const el = railButtonEls.get(activeSection.value)
  if (!rail || !el || rail.scrollWidth <= rail.clientWidth) return

  const left = el.offsetLeft
  const right = left + el.offsetWidth
  const viewLeft = rail.scrollLeft
  const viewRight = viewLeft + rail.clientWidth

  // The strip's own 8px padding, so a revealed chip doesn't sit flush.
  if (left < viewLeft) rail.scrollLeft = Math.max(left - 8, 0)
  else if (right > viewRight) rail.scrollLeft = right - rail.clientWidth + 8
}

// Everything a section panel needs and none of them owns. Provided rather than
// prop-drilled — see templateEditorContext.ts.
provideTemplateEditor({
  form,
  existingTemplate: computed(() => props.existingTemplate),
  isEditing,
  assets,
  selectSection,
})

/**
 * Switching the middle stage's mode moves its preview frame — `transition` and
 * `event_video` are different frames — and the preview would otherwise sit on
 * a frame this template no longer renders.
 */
watch(
  () => form.stage_mode_transition,
  () => {
    if (activeSection.value === 'transition') selectSection('transition')
  },
)

// Reset form when template changes
watch(
  () => props.existingTemplate,
  (template) => {
    // One assignment for the whole editable state. Every config module returns
    // a complete slice (see config/index.ts), so this is a total overwrite —
    // there is no way for a value to survive from the previously opened
    // template through a field somebody forgot to reset.
    Object.assign(form, hydrateForm(template))
    resetPreviews()
    // Staged removals belong to the template they were staged against.
    clearedAssets.value = new Set()
    error.value = null
    // Colours and fonts are records of their own rather than template fields,
    // so they are fetched and edited separately from the form state.
    brand.colors.value = template?.template_colors ?? []
    brand.fonts.value = template?.template_fonts ?? []
    brand.localColors.value = []
    brand.localFonts.value = []
  },
  { immediate: true },
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      mobilePane.value = 'edit'
      activeSection.value = 'basics'
      previewStage.value = 'cover'
      plans.fetchPlans()
      brand.fetchCustomFonts()
      clearedAssets.value = new Set()
      if (!props.existingTemplate) {
        Object.assign(form, defaultForm())
        resetPreviews()
        error.value = null
        brand.colors.value = []
        brand.fonts.value = []
        brand.localColors.value = []
        brand.localFonts.value = []
      } else {
        // If opening in edit mode, fetch the latest colours and fonts
        brand.fetchColors()
        brand.fetchFonts()
      }
    }
    if (!open) {
      error.value = null
      brand.cancelEditColor()
      brand.cancelEditFont()
    }
  },
)

async function handleSave(): Promise<void> {
  if (!canSave.value || !form.package_plan_id) return
  saving.value = true
  error.value = null

  try {
    const payload: PartnerTemplateCreatePayload = {
      name: form.name,
      order: form.order,
      package_plan_id: form.package_plan_id,
      youtube_preview_url: form.youtube_preview_url || undefined,
      display_liquid_glass_background: form.display_liquid_glass_background,
      // Every JSON config, built by the same function the live preview draft
      // uses — which is what makes the preview a promise about the save rather
      // than a second opinion on it.
      ...buildConfigPayload(form),
    }

    // Add file fields that have been set. The asset list is shared with the
    // live preview (see partnerTemplateAssets.ts) so the two can't drift;
    // `preview_image` is the gallery thumbnail, which no stage renders and the
    // preview therefore doesn't carry.
    //
    // An empty string is the delete instruction, matching the convention
    // `falling_effect_custom_image` already used. Untouched fields are simply
    // absent, which is what leaves the saved file alone — so "no file here" and
    // "remove the file that is here" stay distinguishable on the wire.
    const fileFields = ['preview_image', ...PARTNER_TEMPLATE_ASSET_FIELDS] as const
    for (const field of fileFields) {
      const file = form[field]
      if (file instanceof File) {
        ;(payload as unknown as Record<string, unknown>)[field] = file
      } else if (clearedAssets.value.has(field)) {
        ;(payload as unknown as Record<string, unknown>)[field] = ''
      }
    }

    // Falling effect custom image: upload new file, clear existing, or leave as-is
    if (form.falling_effect_custom_image instanceof File) {
      payload.falling_effect_custom_image = form.falling_effect_custom_image
    } else if (form.clear_falling_effect_custom_image) {
      payload.falling_effect_custom_image = ''
    }

    // Custom spark image: same three states as the falling effect's.
    if (form.spark_custom_image instanceof File) {
      payload.spark_custom_image = form.spark_custom_image
    } else if (form.clear_spark_custom_image) {
      payload.spark_custom_image = ''
    }

    let response
    if (isEditing.value && props.existingTemplate) {
      response = await partnerTemplateService.updateTemplate(props.existingTemplate.id, payload)
    } else {
      response = await partnerTemplateService.createTemplate(payload)
    }

    if (response.success && response.data) {
      let finalTemplate = response.data

      // If creating a new template, save pending colours and fonts
      if (!isEditing.value && (brand.localColors.value.length > 0 || brand.localFonts.value.length > 0)) {
        let colorErrors = 0
        let fontErrors = 0

        // Create colours
        for (const color of brand.localColors.value) {
          try {
            const colorRes = await partnerTemplateService.createColor(finalTemplate.id, color)
            if (!colorRes.success) {
              colorErrors++
              console.warn('[PartnerTemplateForm] Failed to create color:', color.name, colorRes.message)
            }
          } catch (err) {
            colorErrors++
            console.error('[PartnerTemplateForm] Error creating color:', color.name, err)
          }
        }

        // Create fonts
        for (const font of brand.localFonts.value) {
          try {
            const fontRes = await partnerTemplateService.createFont(finalTemplate.id, font)
            if (!fontRes.success) {
              fontErrors++
              console.warn('[PartnerTemplateForm] Failed to create font:', font.language, fontRes.message)
            }
          } catch (err) {
            fontErrors++
            console.error('[PartnerTemplateForm] Error creating font:', font.language, err)
          }
        }

        // Show warning if some colours/fonts failed
        if (colorErrors > 0 || fontErrors > 0) {
          const warnings: string[] = []
          if (colorErrors > 0) warnings.push(t('management.partnerTemplateForm.errors.colorsCount', { count: colorErrors }))
          if (fontErrors > 0) warnings.push(t('management.partnerTemplateForm.errors.fontsCount', { count: fontErrors }))
          error.value = t('management.partnerTemplateForm.errors.partialSave', {
            warnings: warnings.join(t('management.partnerTemplateForm.errors.warningsJoin')),
          })
        }

        // Re-fetch the complete template with all colours and fonts
        try {
          const completeTemplateResponse = await partnerTemplateService.getTemplate(finalTemplate.id)
          if (completeTemplateResponse.success && completeTemplateResponse.data) {
            finalTemplate = completeTemplateResponse.data
          }
        } catch (err) {
          console.error('[PartnerTemplateForm] Failed to re-fetch template:', err)
        }
      }

      emit('saved', finalTemplate)
    } else {
      error.value = response.message || t('management.partnerTemplateForm.errors.saveFailed')
    }
  } catch {
    error.value = t('management.partnerTemplateForm.errors.connectionFailed')
  } finally {
    saving.value = false
  }
}

// ---------------------------------------------------------------------------
// Live preview. The draft is handed to PartnerTemplatePreview, which converts it
// to the `TemplateAssets` shape the showcase frames already understand and
// pushes it into a real frame over the preview bridge — the same mechanism the
// manage-page studio uses to try a template on before applying it. Nothing here
// touches the backend; unsaved Files preview from blob URLs.
// ---------------------------------------------------------------------------

/** Below `lg`, the form and the preview take turns (see the header switch). */
const mobilePane = ref<string>('edit')

const paneOptions = computed((): TemplateSegmentedOption[] => [
  { value: 'edit', label: t('management.partnerTemplateForm.header.pane.edit') },
  { value: 'preview', label: t('management.partnerTemplateForm.header.pane.preview') },
])


/**
 * Which language the preview should be showing, proposed whenever the font being
 * picked belongs to another one.
 *
 * Fonts are declared per language and only apply to that language's text, so
 * choosing a Khmer font while the pane renders English changes nothing on
 * screen — the pick reads as broken when it is merely being previewed in the
 * wrong script. Editing an existing row proposes its language too, since
 * startEditFont loads it into the same field.
 *
 * Only re-proposed when the in-progress row's *language* changes, never on every
 * edit: after that, moving the pane's own language segments is a deliberate act,
 * and pulling it back would be fighting the partner. It deliberately isn't
 * cleared when the selection is committed either — the pane should stay on the
 * language whose font was just added, not snap back as the fields reset.
 */
const previewLanguageRequest = ref('')

watch(
  () => (brand.fontForm.font ? brand.fontForm.language : ''),
  (language) => {
    if (language) previewLanguageRequest.value = language
  },
)

const previewDraft = computed<PartnerTemplateDraft>(() => {
  const files: Partial<Record<PartnerTemplateAssetField, File | null>> = {}
  for (const field of PARTNER_TEMPLATE_ASSET_FIELDS) {
    files[field] = form[field]
  }

  return {
    name: form.name,
    display_liquid_glass_background: form.display_liquid_glass_background,
    // The exact same configs the save path sends, from the same function — so
    // the preview cannot drift from what actually gets persisted. Three of
    // these used to be inline literals duplicated across the two call sites.
    ...buildConfigPayload(form),
    colors: brand.previewColors.value,
    fonts: brand.previewFonts.value,
    files,
    // A staged removal has to reach the preview too, or the frame keeps
    // rendering the saved asset and the partner can't see what they just
    // removed until after a save.
    clearedFiles: clearedPreviewFiles.value,
    fallingEffectCustomImage: form.falling_effect_custom_image,
    clearFallingEffectCustomImage: form.clear_falling_effect_custom_image,
    sparkCustomImage: form.spark_custom_image,
    clearSparkCustomImage: form.clear_spark_custom_image,
  }
})

onMounted(() => {
  if (props.isOpen) {
    plans.fetchPlans()
    brand.fetchCustomFonts()
  }
})
</script>

<!-- The row anatomy for switch groups and the editor's one disclosure row.
     Imported rather than restated so the editor and the event drawers cannot
     disagree about how far a switch knob travels or what a pressed row looks
     like; Vue compiles a separate scoped copy per component, which is what
     keeps every selector reachable here. -->
<style scoped src="../common/groupedList.css"></style>

<style scoped>
.slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-leave-active {
  transition: transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* The §15 expand/collapse rules that lived here moved to
   TemplateFormDisclosure, which is now the only thing in this editor that
   expands. */

/* Thin scrollbar so the modal's rounded corners stay clean */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(203 213 225 / 0.9);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

@media (prefers-reduced-motion: reduce) {
  .slide-enter-active,
  .slide-leave-active {
    transition: none;
  }
}
</style>
