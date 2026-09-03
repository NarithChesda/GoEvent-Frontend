<template>
  <div
    class="dress-code-section mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6"
  >
    <!-- Header -->
    <div
      class="section-header text-center mb-5 sm:mb-6 laptop-sm:mb-3 laptop-md:mb-3 laptop-lg:mb-4 desktop:mb-4"
    >
      <h2
        :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }"
        class="leading-tight text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular mb-3 sm:mb-4 md:mb-6 laptop-sm:mb-2 laptop-md:mb-2 desktop:mb-2 capitalize dress-code-header"
        :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
      >
        {{ sectionTitle }}
      </h2>
      <p
        v-if="sectionDescription"
        :style="{ color: accentColor, fontFamily: secondaryFont || currentFont }"
        class="text-sm sm:text-base md:text-lg opacity-80 dress-code-subheader"
        :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
      >
        {{ sectionDescription }}
      </p>
    </div>

    <!-- One band per time period, stacked. Morning attire and evening attire
         both apply to the guest reading this, so neither is hidden behind the
         other: the period is a heading, not a control. -->
    <div class="dress-code-body" :style="{ '--primary-color': primaryColor }">
      <section v-for="period in timePeriodGroups" :key="period.timePeriod" class="dcd-band">
        <!-- Drawn only when there is more than one period. Over a single
             `All Day` band it would label the only thing on screen. -->
        <div v-if="timePeriodGroups.length > 1" class="dcd-band__head">
          <span class="dcd-band__rule" aria-hidden="true" />
          <span
            class="dcd-band__label"
            :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
          >
            {{ period.label }}
          </span>
          <span class="dcd-band__rule" aria-hidden="true" />
        </div>

        <component
          :is="designComponent"
          class="dcd"
          :style="contractStyle"
          :groups="period.genderGroups"
          :primary-color="primaryColor"
          :accent-color="accentColor"
          :current-font="currentFont"
          :primary-font="primaryFont"
          :secondary-font="secondaryFont"
          :current-language="currentLanguage"
          :get-media-url="getMediaUrl"
          :select-code="
            (gender: string, index: number) => selectCode(period.timePeriod, gender, index)
          "
        />
      </section>
    </div>

    <!-- Add-dress-code affordance — only inside the editable manage-page
         preview (editIntentCtx is never provided on the public showcase).
         Outside the design so every composition gets it, including when the
         event has no dress codes at all and nothing else renders. -->
    <div v-if="editIntentCtx" class="add-dress-code-row">
      <button
        type="button"
        class="edit-region-control add-dress-code-btn"
        @click.stop.prevent="editIntentCtx.requestEdit({ kind: 'dressCodeAdd' })"
      >
        ＋ {{ tApp('management.showcasePreview.editors.addDressCode') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, reactive } from 'vue'
import type { DressCode } from '../../types/showcase'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type {
  DressCodeDesignConfig,
  DressCodeDesignType,
} from '@/services/api/types/template.types'
import type { DressCodeDesignItem, DressCodeGenderGroup } from './dress-code-designs/types'

import DressCodePortrait from './dress-code-designs/DressCodePortrait.vue'
import DressCodeAtelier from './dress-code-designs/DressCodeAtelier.vue'
import DressCodeSpread from './dress-code-designs/DressCodeSpread.vue'
import DressCodePalette from './dress-code-designs/DressCodePalette.vue'
import DressCodeLedger from './dress-code-designs/DressCodeLedger.vue'

/**
 * The dress code section: the header, the time period bands, the grouping,
 * every translated string and the one piece of selection state. How the outfits
 * themselves are drawn is the template's call
 * (`template_assets.dress_code_design`), exactly as `agenda_design` picks an
 * agenda composition and `host_info_design` picks a host layout.
 *
 * ## The principle this is built on
 *
 * The block carries three axes and they are not the same kind of thing:
 *
 *   time period   morning AND evening — both apply to the guest reading it.
 *   gender        his AND hers — both apply, to different people at one table.
 *   the codes     black tie OR midnight blue — pick one, wear it.
 *
 * The first two are **conjunctive**; the third is **disjunctive**. Conjunctive
 * axes get laid out, the disjunctive one keeps a selector. That single rule is
 * what removed two thirds of this section's chrome.
 *
 * What was here before navigated all three: a segmented tray of time periods, a
 * second row of gender pills beneath it, and a row of colour dots beneath that.
 * Three levels of control sat on top of what is typically two to four facts,
 * and two of those levels hid information rather than offering a choice — a
 * guest who never noticed the gender pills simply never learned what half the
 * party was asked to wear. The tray is now a heading and the pills are captions.
 *
 * **What replaced the empty state.** A dress code carries a colour and an
 * *optional* photograph; with no photograph the block used to paint a 288px
 * square of flat colour with a generic person glyph at 30% white on it — a
 * failed-upload look on a dark colour, an empty rectangle on a pale one, and
 * the state most dress codes are actually in. Every design now draws a traced
 * garment — resolved by `dress-code-designs/garmentPaths.ts` — in the code's
 * own colour.
 *
 * **The category decides nothing here.** Unlike the agenda, the dress code has
 * no per-category copy to resolve, so this section never sees an event type at
 * all: a template that wants the birthday palette or the ceremony arch says so.
 */
interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  dressCodes: DressCode[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  getMediaUrl: (url: string) => string
  /** The template's chosen composition. Absent / unknown falls back to `portrait`. */
  dressCodeDesign?: DressCodeDesignConfig | null
}

const props = defineProps<Props>()

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the add-dress-code affordance can never leak there.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

// ---------------------------------------------------------------------------
// Design selection
// ---------------------------------------------------------------------------

const DESIGNS = {
  portrait: DressCodePortrait,
  atelier: DressCodeAtelier,
  spread: DressCodeSpread,
  palette: DressCodePalette,
  ledger: DressCodeLedger,
} as const

/**
 * `portrait` for anything absent or unrecognised — the most neutral of the five
 * and the one closest to what this block has always looked like, so a template
 * that has never set the field and one naming a design this build doesn't ship
 * both render something sensible rather than nothing.
 */
const designType = computed<DressCodeDesignType>(() => {
  const type = props.dressCodeDesign?.type
  return type && type in DESIGNS ? type : 'portrait'
})

const designComponent = computed(() => DESIGNS[designType.value])

/** The CSS contract documented at the top of dress-code-base.css. */
const contractStyle = computed(() => ({
  '--dcd-ink': props.primaryColor,
  '--dcd-accent': props.accentColor,
}))

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const findText = (textType: string): string | null => {
  const text = props.eventTexts?.find(
    (entry) => entry.text_type === textType && entry.language === props.currentLanguage,
  )
  return text?.content || null
}

const lang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')

const sectionTitle = computed(
  () => findText('dress_code_header') || translateRSVP('dress_code_header', lang.value),
)

const sectionDescription = computed(
  () => findText('dress_code_description') || translateRSVP('dress_code_description', lang.value),
)

type RsvpKey = keyof typeof import('../../utils/translations').rsvpTranslations.en

const DRESS_CODE_TYPE_KEYS: Record<string, RsvpKey> = {
  white_tie: 'dress_code_white_tie',
  black_tie: 'dress_code_black_tie',
  black_tie_optional: 'dress_code_black_tie_optional',
  formal: 'dress_code_formal',
  cocktail: 'dress_code_cocktail',
  semi_formal: 'dress_code_semi_formal',
  business_formal: 'dress_code_business_formal',
  business_casual: 'dress_code_business_casual',
  smart_casual: 'dress_code_smart_casual',
  casual: 'dress_code_casual',
  beach_formal: 'dress_code_beach_formal',
  beach_casual: 'dress_code_beach_casual',
  festive: 'dress_code_festive',
  traditional: 'dress_code_traditional',
  themed: 'dress_code_themed',
  custom: 'dress_code_custom',
}

const TIME_PERIOD_KEYS: Record<string, RsvpKey> = {
  all_day: 'time_period_all_day',
  morning: 'time_period_morning',
  afternoon: 'time_period_afternoon',
  evening: 'time_period_evening',
  night: 'time_period_night',
}

const GENDER_KEYS: Record<string, RsvpKey> = {
  all: 'gender_all',
  male: 'gender_male',
  female: 'gender_female',
}

/**
 * `dress_code_type_display` / `gender_display` from the API are the server's
 * English labels. They are used only where this build has no translation for
 * the value — a type the backend adds after this frontend ships then shows the
 * server's own words rather than a raw `beach_black_tie` slug.
 */
const translateOr = (map: Record<string, RsvpKey>, value: string, fallback: string): string => {
  const key = map[value]
  return key ? translateRSVP(key, lang.value) : fallback || value
}

// ---------------------------------------------------------------------------
// Grouping: time period → gender → codes
// ---------------------------------------------------------------------------

const TIME_PERIOD_ORDER: Record<string, number> = {
  all_day: 0,
  morning: 1,
  afternoon: 2,
  evening: 3,
  night: 4,
}

interface TimePeriodGroup {
  timePeriod: string
  label: string
  genderGroups: DressCodeGenderGroup[]
}

/**
 * The only selection state left in the section: which colour option each gender
 * group is showing.
 *
 * Keyed by *value* rather than by index, because the data changes underneath: a
 * guest switching language re-renders every label, an organizer editing in the
 * preview can delete the very code that was selected, and the manage-page
 * preview re-fetches the whole list on every save. Keyed by time period and
 * gender, a selection survives all three and simply clamps if the group got
 * shorter.
 */
const codeByGroup = reactive<Record<string, number>>({})

const groupKey = (timePeriod: string, gender: string) => `${timePeriod}::${gender}`

const timePeriodGroups = computed<TimePeriodGroup[]>(() => {
  const byPeriod = new Map<string, TimePeriodGroup>()

  props.dressCodes
    .filter((code) => code.is_active)
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((code) => {
      let period = byPeriod.get(code.time_period)
      if (!period) {
        period = {
          timePeriod: code.time_period,
          label: translateOr(TIME_PERIOD_KEYS, code.time_period, code.time_period_display),
          genderGroups: [],
        }
        byPeriod.set(code.time_period, period)
      }

      let group = period.genderGroups.find((entry) => entry.gender === code.gender)
      if (!group) {
        group = {
          gender: code.gender,
          genderLabel: translateOr(GENDER_KEYS, code.gender, code.gender_display),
          codes: [],
          activeIndex: 0,
        }
        period.genderGroups.push(group)
      }

      const typeLabel = translateOr(
        DRESS_CODE_TYPE_KEYS,
        code.dress_code_type,
        code.dress_code_type_display,
      )

      group.codes.push({
        id: code.id,
        // The organizer's own title wins; the translated type name is what a
        // dress code is called when they didn't name it.
        title: code.title || typeLabel,
        description: code.description || '',
        color: code.color || '',
        image: code.image || null,
        typeLabel,
        dressCodeType: code.dress_code_type,
      } satisfies DressCodeDesignItem)
    })

  // Resolve each group's selected index, clamped — the list can shrink under us
  // at any time.
  const periods = Array.from(byPeriod.values())
  periods.forEach((period) => {
    period.genderGroups.forEach((group) => {
      const stored = codeByGroup[groupKey(period.timePeriod, group.gender)] ?? 0
      group.activeIndex = Math.min(stored, Math.max(0, group.codes.length - 1))
    })
  })

  return periods.sort(
    (a, b) => (TIME_PERIOD_ORDER[a.timePeriod] ?? 999) - (TIME_PERIOD_ORDER[b.timePeriod] ?? 999),
  )
})

const selectCode = (timePeriod: string, gender: string, index: number) => {
  codeByGroup[groupKey(timePeriod, gender)] = index
}
</script>

<!-- Loaded unscoped, once, for the same reason agenda-base.css is: Vue rewrites
     @keyframes names inside a scoped block per component, so a scoped copy in
     each design would give five differently-mangled names and none would
     resolve. Every selector is under .dcd. -->
<style src="./dress-code-designs/dress-code-base.css"></style>

<style scoped>
.dress-code-section {
  width: 100%;
  max-width: 100%;
}

.dress-code-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* --------------------------------------------------------------------------
   The time period band
   --------------------------------------------------------------------------
   What the segmented tray became. A tracked label between two hairlines is a
   heading — it says "this part is for the evening" and moves on — where the
   tray was a control that hid the morning behind it. It is also the same
   stationery language the `atelier` design and the info-card `engraved` set
   already speak, rather than app chrome dropped onto an invitation. */

.dcd-band {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dcd-band__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dcd-band__rule {
  flex: 1;
  height: 1px;
  background: color-mix(in srgb, var(--primary-color, currentColor) 22%, transparent);
}

.dcd-band__label {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.72;
  white-space: nowrap;
}

/* Manage-page preview edit chrome: add-dress-code affordance. Rendered only
   when the edit-intent context exists, never in production. */
.add-dress-code-row {
  display: flex;
  justify-content: center;
  margin: 1.25rem 0 0.25rem;
}

.add-dress-code-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25em;
  width: 100%;
  max-width: 20rem;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px dashed rgba(30, 144, 255, 0.5);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.add-dress-code-btn:hover {
  border-color: rgba(30, 144, 255, 0.9);
  background: rgba(30, 144, 255, 0.08);
}

/* Khmer rendering. Kept on the section's own header only — a design's copy sets
   its Khmer leading against its own font size, and a shared value here would be
   silently outranked. */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
  /* Safari-specific: prevent breaking Khmer clusters mid-word */
  word-break: keep-all !important;
  overflow-wrap: anywhere !important;
  hyphens: none !important;
  -webkit-hyphens: none !important;
}

/* Laptop density — the main content stage is a phone-shaped column inside a
   much wider frame here, so every showcase section compacts rather than scales. */
@media (min-width: 1024px) and (max-width: 1535px) {
  .dress-code-header {
    font-size: 1.25rem !important;
    line-height: 1.25 !important;
    padding-top: 0 !important;
    padding-bottom: 0.34rem !important;
  }

  .dress-code-subheader {
    font-size: 0.75rem !important;
  }

  .dress-code-body {
    gap: 1rem;
  }

  .dcd-band {
    gap: 0.5rem;
  }

  .dcd-band__head {
    gap: 0.5rem;
  }

  .dcd-band__label {
    font-size: 0.5rem;
    letter-spacing: 0.16em;
  }

  .add-dress-code-row {
    margin-top: 0.75rem;
  }
}

@media (min-width: 1536px) {
  .dress-code-header {
    font-size: 1.875rem !important;
  }
}
</style>
