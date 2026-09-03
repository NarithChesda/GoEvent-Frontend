<template>
  <!--
    The gift page.

    Not a checkout. A guest opens this to send a gift to the couple, and what
    they actually need is three facts — which bank, which account, and a code
    to scan — so this is a page of details, not a list of payment products.

    One glass sheet, tinted in the template's own colour, exactly the material
    the guestbook is drawn on; methods are separated by a hairline rather than
    each boxed in glass of its own.

    What that replaced, and why: every method used to be its own bordered card
    running its own `backdrop-filter: blur(16px)`, holding a second translucent
    panel, holding translucent pills — three blurred layers deep, which is where
    legibility collapses and where a phone starts paying a compositor pass per
    method. The account number was masked to its last four digits *and* the copy
    it wrote to the clipboard was the full one, so a guest could neither read
    what they had nor check what they were about to paste into a banking app.
  -->
  <div class="pay" :style="payVars">
    <!-- ══ Heading ══════════════════════════════════════════════════════
         A sibling of the Agenda and guestbook headings: same size ladder, same
         ornament, same face (the template's primary, bound inline). -->
    <header v-if="paymentSectionTitle" class="pay-head">
      <h2
        class="pay-title"
        :class="{ 'khmer-text-fix': currentLanguage === 'kh' }"
        :style="{ fontFamily: primaryFont || currentFont }"
      >
        {{ paymentSectionTitle }}
      </h2>
      <span class="pay-orn" aria-hidden="true">
        <span class="pay-orn__rule"></span>
        <span class="pay-orn__gem"></span>
        <span class="pay-orn__rule"></span>
      </span>
    </header>

    <!-- ══ The sheet ════════════════════════════════════════════════════
         One surface, blurred once, holding every method. -->
    <div v-if="paymentMethods.length > 0" class="pay-sheet">
      <component
        :is="canEditPayments ? EditableRegion : 'div'"
        v-for="method in paymentMethods"
        :key="method.id"
        v-bind="
          canEditPayments ? { intent: { kind: 'paymentItem', paymentMethodId: method.id } } : {}
        "
        class="pay-method"
      >
        <!--
          The disclosure row exists only when there is something to disclose.
          With a single method the section heading already names the bank, the
          card is open on arrival and can never usefully be closed — so the row
          would be a control over nothing, printed under its own caption.
        -->
        <button
          v-if="isCollapsible"
          type="button"
          class="pay-row"
          :aria-expanded="isCardExpanded(method)"
          :aria-controls="panelId(method)"
          @click="toggleCard(method)"
        >
          <span class="pay-row__mark" aria-hidden="true">
            <Landmark class="pay-row__mark-icon" :stroke-width="1.5" />
          </span>
          <span class="pay-row__id">
            <span class="pay-row__name" :style="{ fontFamily: secondaryFont || currentFont }">
              {{ method.bank_name || method.name }}
            </span>
            <span v-if="method.currency" class="pay-row__cur">{{ method.currency }}</span>
          </span>
          <ChevronDown class="pay-row__chev" aria-hidden="true" :stroke-width="2" />
        </button>

        <!--
          Height, not a guessed maximum. This used to animate `max-height: 0 →
          800px` over 500ms; a real method is ~320px tall, so the motion was
          over in the first 40% and the remaining 300ms was the card sitting
          still while the transition ran out. A `0fr → 1fr` grid row animates
          the height the content actually has, which also means opening and
          closing travel the same path at the same rate.
        -->
        <div
          :id="panelId(method)"
          class="pay-reveal"
          :class="{ 'is-open': isCardExpanded(method) }"
          :inert="isCardExpanded(method) ? undefined : true"
        >
          <div class="pay-reveal__inner">
            <div class="pay-body">
              <!-- ── The code ──────────────────────────────────────────── -->
              <div v-if="showsQr(method)" class="pay-qr">
                <div v-if="method.qr_code_image" class="pay-qr__plate">
                  <img
                    :src="getMediaUrl(method.qr_code_image)"
                    :alt="`${method.bank_name || method.name} QR`"
                    class="pay-qr__img"
                    loading="lazy"
                    decoding="async"
                    @error="onImageError"
                  />
                </div>
                <div v-else class="pay-qr__plate pay-qr__plate--empty">
                  <QrCode class="pay-qr__glyph" :stroke-width="1.25" aria-hidden="true" />
                </div>
                <p class="pay-qr__cap">
                  {{ method.qr_code_image ? scanToPayText : qrPendingText }}
                </p>
              </div>

              <!-- ── The details ───────────────────────────────────────── -->
              <div v-if="hasVisibleBankInfo(method)" class="pay-facts">
                <p
                  v-if="method.account_name"
                  class="pay-fact"
                  :style="{ fontFamily: secondaryFont || currentFont }"
                >
                  {{ method.account_name }}
                </p>

                <!--
                  The whole number, in the order the organizer typed it. It was
                  masked to `•••• 1234`, which helps nobody: this is an account
                  published on an invitation so that guests can pay into it, and
                  the one thing a guest does with it is read it across into a
                  banking app. No regrouping either — a digit group is part of
                  how an account is written, and inventing one misquotes it.
                -->
                <button
                  v-if="method.account_number"
                  type="button"
                  class="pay-copy"
                  :class="{ 'is-copied': copiedId === String(method.id) }"
                  :aria-label="`${method.account_number} — ${copyAccountText}`"
                  @click.stop="copyToClipboard(method)"
                >
                  <span class="pay-copy__num">{{ method.account_number }}</span>
                  <span class="pay-copy__icon" aria-hidden="true">
                    <Check v-if="copiedId === String(method.id)" :stroke-width="2.25" />
                    <Copy v-else :stroke-width="1.75" />
                  </span>
                </button>

                <!-- Announced, not drawn: the tick above already says it to
                     anyone who can see the button. -->
                <p class="pay-live" role="status" aria-live="polite">
                  {{ copiedId === String(method.id) ? copiedText : '' }}
                </p>
              </div>

              <!-- ── The one action ────────────────────────────────────── -->
              <a
                v-if="method.payment_url"
                :href="method.payment_url"
                target="_blank"
                rel="noopener noreferrer"
                class="pay-cta"
                :style="{ fontFamily: secondaryFont || currentFont }"
              >
                {{ paymentButtonLabel }}
              </a>

              <p
                v-if="method.description"
                class="pay-note"
                :style="{ fontFamily: secondaryFont || currentFont }"
              >
                {{ method.description }}
              </p>
            </div>
          </div>
        </div>
      </component>
    </div>

    <!-- ══ Nothing to show ══════════════════════════════════════════════
         One line on the same sheet, not a bordered box around an icon: an
         empty state that is bigger than a filled one reads as an error. -->
    <div v-else class="pay-sheet pay-sheet--empty">
      <p class="pay-empty" :style="{ fontFamily: secondaryFont || currentFont }">
        {{
          paymentLocked ? tApp('management.showcasePreview.editors.paymentLocked') : noPaymentText
        }}
      </p>
    </div>

    <!-- Add-payment-method affordance — only inside the editable manage-page
         preview (editIntentCtx is never provided on the public showcase) and
         only when payments aren't locked (mirrors the forms tab's own
         payment_lock gate). Always shown in edit mode, including when there
         are already payment methods, so more can be added from here. -->
    <div v-if="canEditPayments" class="add-payment-row">
      <button
        type="button"
        class="edit-region-control add-payment-btn"
        @click.stop.prevent="editIntentCtx?.requestEdit({ kind: 'paymentAdd' })"
      >
        ＋ {{ tApp('management.showcasePreview.editors.addPaymentMethod') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, inject, onUnmounted } from 'vue'
import { Landmark, ChevronDown, QrCode, Copy, Check } from 'lucide-vue-next'
import type { EventPaymentMethod } from '../../services/api'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  paymentMethods: EventPaymentMethod[]
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  /** The template's own background colour — what the sheet is tinted in, so
   *  this section and the guestbook are cut from the same material. Falls back
   *  to the primary, as it does there. */
  backgroundColor?: string
  currentFont: string
  primaryFont: string
  secondaryFont: string
  getMediaUrl: (url: string) => string
  eventCategory?: string | number | null
  eventCategoryName?: string | null
  eventCategoryDetails?: {
    id: number
    name: string
    description: string
    color: string
    icon: string
  } | null
  eventTexts?: EventText[]
  currentLanguage?: string
  /** Mirrors event.payment_lock — when true, payment methods can't be added
   *  or edited even from the manage-page preview (same restriction the forms
   *  tab enforces). */
  paymentLocked?: boolean
}

const props = defineProps<Props>()

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so these edit affordances can never leak there.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()
const canEditPayments = computed(() => !!editIntentCtx && !props.paymentLocked)

// State
const expandedCards = ref<Set<string>>(new Set())
const copiedId = ref<string | null>(null)
let copiedTimer: number | null = null

/**
 * The three colours the whole sheet is drawn from, published once on the root
 * rather than bound inline on every node.
 *
 * Same contract as the guestbook's `--wb-*`: every surface below is a
 * `color-mix` of `--pay-tone` so the glass carries the template rather than a
 * neutral grey, and every piece of copy is a mix of `--pay-ink`. Binding those
 * per element is what produced ~40 inline style objects in this file.
 */
const payVars = computed<Record<string, string>>(() => ({
  '--pay-ink': props.primaryColor,
  '--pay-tone': props.backgroundColor || props.primaryColor,
  '--pay-accent': props.accentColor || props.primaryColor,
}))

const lang = computed<SupportedLanguage>(() => (props.currentLanguage as SupportedLanguage) || 'en')

const scanToPayText = computed(() => translateRSVP('payment_scan_to_pay', lang.value))
const qrPendingText = computed(() => translateRSVP('payment_qr_pending', lang.value))
const copyAccountText = computed(() => translateRSVP('payment_copy_account', lang.value))
const copiedText = computed(() => translateRSVP('payment_copied', lang.value))
const noPaymentText = computed(() => translateRSVP('payment_none', lang.value))

/** Generic, user-friendly payment button label (translated, same for every method) */
const paymentButtonLabel = computed(() => translateRSVP('payment_pay_now', lang.value))

/**
 * The section heading.
 *
 * With one method it stays `"{Bank} QR"` — what every live event with a single
 * payment method already reads, and an accurate label for a page that holds
 * exactly that bank's code.
 *
 * With more than one it can't be: naming the section after whichever method
 * happens to sort first tells a guest the other banks are something else. The
 * category's own gift wording takes over there — copy that already existed in
 * the translation table and had no caller.
 */
const paymentSectionTitle = computed(() => {
  const methods = props.paymentMethods
  if (methods.length === 0) return giftLabel.value
  if (methods.length === 1) {
    const bankName = methods[0].bank_name || methods[0].name
    return bankName ? `${bankName} QR` : 'QR'
  }
  return giftLabel.value
})

const giftLabel = computed(() => {
  const category = (props.eventCategoryName || props.eventCategoryDetails?.name || '').toLowerCase()
  if (category.includes('wedding')) return translateRSVP('payment_wedding_gift', lang.value)
  if (category.includes('birthday')) return translateRSVP('payment_birthday_gift', lang.value)
  if (category.includes('funeral')) return translateRSVP('payment_funeral_gift', lang.value)
  return translateRSVP('payment_gift', lang.value)
})

/** A lone method is always open, so it needs no disclosure row. */
const isCollapsible = computed(() => props.paymentMethods.length > 1)

/**
 * The first method is open on arrival, however many there are.
 *
 * Closed-by-default left the section as two named rows and a chevron: a guest
 * who scrolled to the gift page saw no code, no account and no button, and had
 * to guess that tapping a bank name would produce one. Opening the first shows
 * what the section is for while the rest stay one tap away — and it is the same
 * thing the quick menu's Gift action already does through `expandFirstCard`.
 */
watch(
  () => props.paymentMethods,
  (methods) => {
    if (methods.length === 0) return
    const ids = methods.map((m) => String(m.id))
    // Re-seed only when the guest has no live choice — the array identity
    // changes on every refetch inside the manage-page preview, and collapsing a
    // panel someone had just opened is the section rearranging itself under them.
    const stillOpen = [...expandedCards.value].some((id) => ids.includes(id))
    if (!stillOpen) expandedCards.value = new Set([ids[0]])
  },
  { immediate: true },
)

// Methods
const panelId = (method: EventPaymentMethod): string => `pay-panel-${method.id}`

const isCardExpanded = (method: EventPaymentMethod): boolean =>
  !isCollapsible.value || expandedCards.value.has(String(method.id))

const toggleCard = (method: EventPaymentMethod) => {
  const id = String(method.id)
  if (expandedCards.value.has(id)) {
    // If clicking on already expanded card, just collapse it
    expandedCards.value.delete(id)
  } else {
    // Clear all expanded cards first (only one can be expanded at a time)
    expandedCards.value.clear()
    // Then expand the clicked card
    expandedCards.value.add(id)
  }
}

const hasVisibleBankInfo = (method: EventPaymentMethod): boolean => {
  return !!(method.bank_name || method.account_name || method.account_number)
}

/**
 * Whether to draw the code slot at all.
 *
 * A method that carries a payment link and no QR is not a method whose QR is
 * missing — it is a link. Drawing the "QR coming soon" plate for it spends the
 * tallest element in the panel on a promise nobody made, directly above the
 * button that is the actual way to pay.
 *
 * The placeholder survives for the one case it was for: a method with no code
 * AND no link, where the slot is the only thing saying a code is on its way
 * rather than the section being broken.
 */
const showsQr = (method: EventPaymentMethod): boolean =>
  !!method.qr_code_image || !method.payment_url

/**
 * A copy with nothing to show for it is a copy the guest has to test by
 * pasting. The button holds the confirmed state itself — the icon becomes a
 * tick and the pill lights in the accent — for long enough to be read, and the
 * live region says the same thing for a screen reader.
 */
const copyToClipboard = async (method: EventPaymentMethod) => {
  const value = method.account_number
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    // Clipboard blocked (insecure context, permission denied): say nothing
    // rather than claim a copy that did not happen.
    return
  }
  copiedId.value = String(method.id)
  if (copiedTimer !== null) clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => {
    copiedId.value = null
    copiedTimer = null
  }, 1800)
}

const onImageError = () => {
  // QR code image failed to load - could set fallback here
}

// Expose method to expand first card (the quick-menu's "gift" action)
const expandFirstCard = () => {
  if (props.paymentMethods.length > 0) {
    expandedCards.value.clear()
    expandedCards.value.add(String(props.paymentMethods[0].id))
  }
}

defineExpose({ expandFirstCard })

onUnmounted(() => {
  if (copiedTimer !== null) clearTimeout(copiedTimer)
})
</script>

<style scoped>
/* ===========================================================================
 * The gift page
 *
 * One glass sheet, tinted in the template's own colour, with the payment
 * details written on it. Three custom properties come in from the component
 * (`--pay-ink`, `--pay-tone`, `--pay-accent`) and everything below is a mix of
 * them, so a template's palette reaches every surface without a single inline
 * style.
 *
 * Sizing is mobile-first and scaled by ONE number, `--pay-s`, matching the
 * guestbook's `--wb-s`. The showcase card is 85vh, so on a 13–15" laptop every
 * section has to render at roughly two-thirds size; that used to be ~500 lines
 * of `!important` overrides here — several of them redefining bare Tailwind
 * utility names (`.text-xs`, `.w-32`, `.space-y-3`) and one redefining `h2`.
 * Now the two laptop media queries set `--pay-s` and nothing else.
 * ======================================================================== */

.pay {
  --pay-s: 1;
  --pay-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --pay-hair: color-mix(in srgb, var(--pay-tone) 24%, transparent);
  --pay-hair-soft: color-mix(in srgb, var(--pay-tone) 13%, transparent);

  color: var(--pay-ink);
  margin-bottom: calc(1.5rem * var(--pay-s));
}

/* ---------------------------------------------------------------------------
 * Heading
 * ------------------------------------------------------------------------ */

.pay-head {
  text-align: center;
  margin-bottom: calc(1.125rem * var(--pay-s));
}

.pay-title {
  font-size: calc(1.5rem * var(--pay-s));
  line-height: 1.25;
  font-weight: 400;
  /* Tracking is size-specific: at display size the letters read too far apart,
     so the heading tightens where the body copy below stays at 0. */
  letter-spacing: -0.01em;
  text-transform: uppercase;
  padding-block: calc(0.25rem * var(--pay-s));
  color: var(--pay-ink);
}

/* The section's one ornament — the guestbook's, at the same weight, so the two
   sheets read as pages of the same book. */
.pay-orn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.pay-orn__rule {
  height: 1px;
  width: calc(2.5rem * var(--pay-s));
  background: linear-gradient(90deg, transparent, var(--pay-hair));
}

.pay-orn__rule:last-child {
  background: linear-gradient(90deg, var(--pay-hair), transparent);
}

.pay-orn__gem {
  flex: 0 0 auto;
  width: calc(0.375rem * var(--pay-s));
  height: calc(0.375rem * var(--pay-s));
  transform: rotate(45deg);
  background: color-mix(in srgb, var(--pay-tone) 45%, transparent);
}

/* ---------------------------------------------------------------------------
 * The sheet
 *
 * The one element in this section that is really glass — same recipe as the
 * guestbook's `.wb-panel`, deliberately identical rather than merely similar:
 * they sit two sections apart in the same scroller and any drift between them
 * reads as one of the two being wrong.
 *
 * The blur is not decorative: when a template turns the card's own glass off
 * (`display_liquid_glass_background: false`), this sheet is all that stands
 * between an account number and a playing background video.
 * ------------------------------------------------------------------------ */

.pay-sheet {
  position: relative;
  overflow: hidden;
  border-radius: 1.25rem;
  padding: calc(0.875rem * var(--pay-s)) calc(1rem * var(--pay-s));
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--pay-tone) 9%, transparent),
    color-mix(in srgb, var(--pay-tone) 4%, transparent)
  );
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--pay-tone) 14%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 10px 30px -20px color-mix(in srgb, var(--pay-tone) 70%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  backdrop-filter: blur(14px) saturate(150%);
  contain: layout style paint;
}

/* ---------------------------------------------------------------------------
 * Seams between methods
 *
 * A hairline that fades out at both ends, exactly as the guestbook separates
 * one wish from the next — never a border box per method.
 * ------------------------------------------------------------------------ */

.pay-method + .pay-method {
  position: relative;
  margin-top: calc(0.25rem * var(--pay-s));
  padding-top: calc(0.25rem * var(--pay-s));
}

.pay-method + .pay-method::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--pay-hair-soft) 18%,
    var(--pay-hair-soft) 82%,
    transparent
  );
}

/* ---------------------------------------------------------------------------
 * The disclosure row
 * ------------------------------------------------------------------------ */

.pay-row {
  display: flex;
  align-items: center;
  gap: calc(0.625rem * var(--pay-s));
  width: 100%;
  /* 44px on a phone: this row is the only way into a method, so it is a touch
     target before it is a label. */
  min-height: calc(2.75rem * var(--pay-s));
  padding: calc(0.375rem * var(--pay-s)) 0;
  background: none;
  border: 0;
  text-align: left;
  color: inherit;
  cursor: pointer;
  /* The press is answered on pointer-down, not on the click that follows —
     the panel below takes ~340ms to open and the row cannot be silent for it. */
  transition: transform 140ms var(--pay-ease);
}

.pay-row:active {
  transform: scale(0.99);
}

.pay-row:focus-visible {
  outline: 2px solid var(--pay-ink);
  outline-offset: 3px;
  border-radius: 0.75rem;
}

.pay-row__mark {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(1.875rem * var(--pay-s));
  height: calc(1.875rem * var(--pay-s));
  border-radius: 999px;
  background: color-mix(in srgb, var(--pay-tone) 12%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pay-tone) 20%, transparent);
}

.pay-row__mark-icon {
  width: calc(0.875rem * var(--pay-s));
  height: calc(0.875rem * var(--pay-s));
  opacity: 0.75;
}

.pay-row__id {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: calc(0.5rem * var(--pay-s));
}

.pay-row__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: calc(0.875rem * var(--pay-s));
  font-weight: 500;
  color: var(--pay-ink);
}

.pay-row__cur {
  flex: 0 0 auto;
  font-size: calc(0.6875rem * var(--pay-s));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--pay-ink) 52%, transparent);
}

.pay-row__chev {
  flex: 0 0 auto;
  width: calc(1rem * var(--pay-s));
  height: calc(1rem * var(--pay-s));
  color: color-mix(in srgb, var(--pay-ink) 55%, transparent);
  transition: transform 340ms var(--pay-ease);
}

.pay-row[aria-expanded='true'] .pay-row__chev {
  transform: rotate(180deg);
}

/* Every hover state in this file is gated on a real pointer. On a touch screen
   :hover latches after a tap and does not release until something else is
   tapped, so an ungated one leaves a control lit for as long as the guest
   keeps reading. */
@media (hover: hover) and (pointer: fine) {
  .pay-row:hover .pay-row__chev {
    color: var(--pay-ink);
  }
}

/* ---------------------------------------------------------------------------
 * The reveal
 * ------------------------------------------------------------------------ */

.pay-reveal {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 340ms var(--pay-ease),
    opacity 220ms ease;
}

.pay-reveal.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}

/* `min-height: 0` is what lets the 0fr row actually collapse — without it the
   track floors at the content's min-content height and the panel never closes. */
.pay-reveal__inner {
  min-height: 0;
  overflow: hidden;
}

.pay-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(0.875rem * var(--pay-s));
  padding-block: calc(0.75rem * var(--pay-s)) calc(0.5rem * var(--pay-s));
}

/* ---------------------------------------------------------------------------
 * The code
 *
 * A plate, not a third pane of glass. A QR has to be read by a camera through
 * whatever the phone's screen is doing, so the one surface in this section that
 * must not be translucent is this one.
 * ------------------------------------------------------------------------ */

.pay-qr {
  text-align: center;
}

.pay-qr__plate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: calc(0.625rem * var(--pay-s));
  border-radius: calc(1rem * var(--pay-s));
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--pay-tone) 12%, transparent),
    0 8px 24px -16px color-mix(in srgb, var(--pay-tone) 80%, transparent);
}

.pay-qr__img {
  display: block;
  width: calc(9rem * var(--pay-s));
  height: calc(9rem * var(--pay-s));
  border-radius: calc(0.375rem * var(--pay-s));
}

.pay-qr__plate--empty {
  background: color-mix(in srgb, var(--pay-tone) 5%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pay-tone) 16%, transparent);
}

.pay-qr__glyph {
  width: calc(9rem * var(--pay-s));
  height: calc(9rem * var(--pay-s));
  color: color-mix(in srgb, var(--pay-ink) 22%, transparent);
}

/* Micro-caption: small type wants slightly positive tracking, the inverse of
   what the heading above wants. */
.pay-qr__cap {
  margin-top: calc(0.5rem * var(--pay-s));
  font-size: calc(0.6875rem * var(--pay-s));
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--pay-ink) 55%, transparent);
}

/* ---------------------------------------------------------------------------
 * The details
 * ------------------------------------------------------------------------ */

.pay-facts {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(0.5rem * var(--pay-s));
}

.pay-fact {
  max-width: 100%;
  font-size: calc(0.875rem * var(--pay-s));
  line-height: 1.6;
  text-align: center;
  overflow-wrap: break-word;
  color: color-mix(in srgb, var(--pay-ink) 82%, transparent);
}

/* The one interactive detail, so the one that gets a pill. */
.pay-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: calc(0.5rem * var(--pay-s));
  max-width: 100%;
  min-height: calc(2.75rem * var(--pay-s));
  padding: calc(0.5rem * var(--pay-s)) calc(0.875rem * var(--pay-s));
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  color: var(--pay-ink);
  background: color-mix(in srgb, var(--pay-tone) 10%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pay-tone) 20%, transparent);
  transition:
    transform 140ms var(--pay-ease),
    background-color 200ms ease,
    box-shadow 200ms ease,
    color 200ms ease;
}

.pay-copy:active {
  transform: scale(0.98);
}

.pay-copy:focus-visible {
  outline: 2px solid var(--pay-ink);
  outline-offset: 3px;
}

.pay-copy__num {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: calc(0.9375rem * var(--pay-s));
  font-weight: 500;
  /* Digits of equal width, and a touch of tracking: this is the one string on
     the page a guest reads across character by character into another app. */
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.pay-copy__icon {
  flex: 0 0 auto;
  display: inline-flex;
}

.pay-copy__icon :deep(svg) {
  width: calc(0.9375rem * var(--pay-s));
  height: calc(0.9375rem * var(--pay-s));
}

/* Confirmed. This is the only place the accent is spent in the section — a
   confirmation the guest has to hunt for is the same as no confirmation. */
.pay-copy.is-copied {
  color: var(--pay-accent);
  background: color-mix(in srgb, var(--pay-accent) 12%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pay-accent) 42%, transparent);
}

@media (hover: hover) and (pointer: fine) {
  .pay-copy:hover:not(.is-copied) {
    background: color-mix(in srgb, var(--pay-tone) 16%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pay-tone) 32%, transparent);
  }
}

/* Screen-reader only: the visible tick already carries this. */
.pay-live {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* ---------------------------------------------------------------------------
 * The one action
 * ------------------------------------------------------------------------ */

.pay-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: calc(2.75rem * var(--pay-s));
  padding: calc(0.625rem * var(--pay-s)) 1rem;
  border-radius: 999px;
  background: var(--pay-tone);
  color: #ffffff;
  font-size: calc(0.875rem * var(--pay-s));
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 8px 20px -12px color-mix(in srgb, var(--pay-tone) 90%, transparent);
  transition: transform 140ms var(--pay-ease);
}

.pay-cta:active {
  transform: scale(0.98);
}

.pay-cta:focus-visible {
  outline: 2px solid var(--pay-ink);
  outline-offset: 3px;
}

.pay-note {
  font-size: calc(0.75rem * var(--pay-s));
  line-height: 1.7;
  text-align: center;
  color: color-mix(in srgb, var(--pay-ink) 58%, transparent);
}

/* ---------------------------------------------------------------------------
 * Nothing to show
 * ------------------------------------------------------------------------ */

.pay-empty {
  padding-block: calc(0.75rem * var(--pay-s));
  font-size: calc(0.8125rem * var(--pay-s));
  line-height: 1.7;
  text-align: center;
  color: color-mix(in srgb, var(--pay-ink) 62%, transparent);
}

/* ---------------------------------------------------------------------------
 * Manage-page preview edit chrome: add-payment-method affordance. Rendered
 * only when the edit-intent context exists (and payments aren't locked),
 * never in production.
 * ------------------------------------------------------------------------ */

.add-payment-row {
  display: flex;
  justify-content: center;
  margin: 0.75rem 0 0.25rem;
}

.add-payment-btn {
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

.add-payment-btn:hover {
  border-color: rgba(30, 144, 255, 0.9);
  background: rgba(30, 144, 255, 0.08);
}

/* ---------------------------------------------------------------------------
 * Larger phones and tablets
 * ------------------------------------------------------------------------ */

@media (min-width: 640px) {
  .pay-title {
    font-size: calc(1.875rem * var(--pay-s));
  }

  .pay-orn__rule {
    width: calc(3.5rem * var(--pay-s));
  }

  .pay-sheet {
    padding: calc(1.125rem * var(--pay-s)) calc(1.375rem * var(--pay-s));
  }

  .pay-qr__img,
  .pay-qr__glyph {
    width: calc(10rem * var(--pay-s));
    height: calc(10rem * var(--pay-s));
  }
}

@media (min-width: 1024px) {
  /* Matches the event info card's shell radius above 1024px, so the sheet
     reads as part of the same card system. */
  .pay-sheet {
    border-radius: 1.5rem;
  }
}

/* ---------------------------------------------------------------------------
 * Laptops — the whole section on one number
 *
 * The showcase card is 85vh, so on a short laptop screen every section renders
 * at roughly two-thirds size. These are the two values the rest of the showcase
 * uses (the guestbook, the agenda, RSVP); at 1536px and above `--pay-s` stays 1.
 * ------------------------------------------------------------------------ */

@media (min-width: 1024px) and (max-width: 1365px) {
  .pay {
    --pay-s: 0.68;
  }
}

@media (min-width: 1366px) and (max-width: 1535px) {
  .pay {
    --pay-s: 0.76;
  }
}

/* ---------------------------------------------------------------------------
 * Accessibility
 * ------------------------------------------------------------------------ */

/* The panel still opens and closes — that is the whole interaction — but it
   cross-fades in place instead of growing, and nothing scales under a press. */
@media (prefers-reduced-motion: reduce) {
  .pay-reveal {
    transition: opacity 180ms ease;
  }

  .pay-row__chev {
    transition: none;
  }

  .pay-row:active,
  .pay-copy:active,
  .pay-cta:active {
    transform: none;
  }
}

/* Frostier, not blurrier: the sheet keeps the template's colour but stops
   being a window. */
@media (prefers-reduced-transparency: reduce) {
  .pay-sheet {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: color-mix(in srgb, var(--pay-tone) 12%, #ffffff);
  }
}

@media (prefers-contrast: more) {
  .pay-sheet {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pay-tone) 55%, transparent);
  }

  .pay-fact,
  .pay-note,
  .pay-empty,
  .pay-qr__cap,
  .pay-row__cur {
    color: var(--pay-ink);
  }
}

/* Khmer text fix now defined globally in src/assets/main.css */
</style>
