<template>
  <!--
    Three groups, each with an uppercase micro-heading.

    It used to be five fields and a note explaining why they carried no headings:
    an eyebrow earns its space when the reader has to navigate back to a group,
    and there was nothing to navigate. Nine fields changed that premise — the run
    now has a shape (what you sell, how to reach you, anything else) and the
    headings are what make it readable as three short asks rather than one long
    interrogation. If this ever drops back to five, drop the headings with it.
  -->
  <div class="space-y-6">
    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ t('settings.credits.request.sections.shop') }}
      </h3>

      <div>
        <label :for="id('businessName')" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('settings.credits.request.fields.businessName') }} *
        </label>
        <input
          :id="id('businessName')"
          :value="modelValue.business_name"
          type="text"
          maxlength="120"
          autocomplete="organization"
          :placeholder="t('settings.credits.request.fields.businessNamePlaceholder')"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('business_name')"
          :aria-invalid="Boolean(errorFor('business_name'))"
          @input="patch('business_name', $event)"
        />
        <p v-if="errorFor('business_name')" class="mt-1 text-xs text-red-600">
          {{ errorFor('business_name') }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label :for="id('businessType')" class="mb-2 block text-sm font-medium text-slate-700">
            {{ t('settings.credits.request.fields.businessType') }}
          </label>
          <div class="relative">
            <select
              :id="id('businessType')"
              :value="modelValue.business_type ?? ''"
              class="w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-base focus:outline-none focus:ring-2 sm:text-sm"
              :class="inputClass('business_type')"
              @change="patch('business_type', $event)"
            >
              <option value="">
                {{ t('settings.credits.request.fields.businessTypeOptions.unspecified') }}
              </option>
              <option v-for="option in businessTypes" :key="option" :value="option">
                {{ t(`settings.credits.request.fields.businessTypeOptions.${option}`) }}
              </option>
            </select>
            <ChevronDown
              class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
        </div>

        <div>
          <label :for="id('basedIn')" class="mb-2 block text-sm font-medium text-slate-700">
            {{ t('settings.credits.request.fields.basedIn') }}
          </label>
          <input
            :id="id('basedIn')"
            :value="modelValue.based_in ?? ''"
            type="text"
            maxlength="120"
            :placeholder="t('settings.credits.request.fields.basedInPlaceholder')"
            class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
            :class="inputClass('based_in')"
            @input="patch('based_in', $event)"
          />
        </div>
      </div>

      <div>
        <label :for="id('invitationsToday')" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('settings.credits.request.fields.invitationsToday') }}
        </label>
        <div class="relative">
          <select
            :id="id('invitationsToday')"
            :value="modelValue.invitations_today ?? ''"
            class="w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-base focus:outline-none focus:ring-2 sm:text-sm"
            :class="inputClass('invitations_today')"
            @change="patch('invitations_today', $event)"
          >
            <option value="">
              {{ t('settings.credits.request.fields.invitationsTodayOptions.unspecified') }}
            </option>
            <option v-for="option in invitationsToday" :key="option" :value="option">
              {{ t(`settings.credits.request.fields.invitationsTodayOptions.${option}`) }}
            </option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </div>

      <div>
        <label :for="id('volume')" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('settings.credits.request.fields.volume') }}
        </label>
        <div class="relative">
          <select
            :id="id('volume')"
            :value="modelValue.expected_monthly_events ?? ''"
            class="w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-base focus:outline-none focus:ring-2 sm:text-sm"
            :class="inputClass('expected_monthly_events')"
            @change="patch('expected_monthly_events', $event)"
          >
            <option value="">
              {{ t('settings.credits.request.fields.volumeOptions.unspecified') }}
            </option>
            <option v-for="option in volumeOptions" :key="option" :value="option">
              {{ t(`settings.credits.request.fields.volumeOptions.${option}`) }}
            </option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
        <p class="mt-1 text-xs text-slate-500">
          {{ t('settings.credits.request.fields.volumeHint') }}
        </p>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ t('settings.credits.request.sections.contact') }}
      </h3>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label :for="id('phone')" class="mb-2 block text-sm font-medium text-slate-700">
            {{ t('settings.credits.request.fields.phone') }} *
          </label>
          <input
            :id="id('phone')"
            :value="modelValue.contact_phone"
            type="tel"
            maxlength="32"
            autocomplete="tel"
            class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
            :class="inputClass('contact_phone')"
            :aria-invalid="Boolean(errorFor('contact_phone'))"
            @input="patch('contact_phone', $event)"
          />
          <p v-if="errorFor('contact_phone')" class="mt-1 text-xs text-red-600">
            {{ errorFor('contact_phone') }}
          </p>
        </div>

        <div>
          <label :for="id('telegram')" class="mb-2 block text-sm font-medium text-slate-700">
            {{ t('settings.credits.request.fields.telegram') }}
          </label>
          <input
            :id="id('telegram')"
            :value="modelValue.contact_telegram ?? ''"
            type="text"
            maxlength="120"
            :placeholder="t('settings.credits.request.fields.telegramPlaceholder')"
            class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
            :class="inputClass('contact_telegram')"
            @input="patch('contact_telegram', $event)"
          />
          <p v-if="errorFor('contact_telegram')" class="mt-1 text-xs text-red-600">
            {{ errorFor('contact_telegram') }}
          </p>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ t('settings.credits.request.sections.extra') }}
      </h3>

      <div>
        <label :for="id('heardFrom')" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('settings.credits.request.fields.heardFrom') }}
        </label>
        <input
          :id="id('heardFrom')"
          :value="modelValue.heard_from ?? ''"
          type="text"
          maxlength="160"
          :placeholder="t('settings.credits.request.fields.heardFromPlaceholder')"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('heard_from')"
          @input="patch('heard_from', $event)"
        />
      </div>

      <div>
        <label :for="id('message')" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('settings.credits.request.fields.message') }}
        </label>
        <textarea
          :id="id('message')"
          :value="modelValue.message ?? ''"
          rows="3"
          :maxlength="noteMax"
          :placeholder="t('settings.credits.request.fields.messagePlaceholder')"
          class="w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-base leading-relaxed focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('message')"
          @input="patch('message', $event)"
        ></textarea>
        <p v-if="errorFor('message')" class="mt-1 text-xs text-red-600">
          {{ errorFor('message') }}
        </p>
        <!--
          Only once it matters. A counter sitting under an empty box is a limit
          announced to someone who was not going to reach it; appearing at the
          last quarter makes it a warning instead of furniture.
        -->
        <p v-else-if="noteRemaining <= noteMax / 4" class="mt-1 text-right text-xs text-slate-400">
          {{ noteRemaining }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * The partner application's questions, and nothing else.
 *
 * Extracted from `PartnerRequestDrawer` when `/partners/apply` was added, so
 * the signed-in drawer and the public page ask the same things in the same
 * order with the same validation. Two copies of a form is two copies of every
 * later change to it, and the one that is not being looked at is the one that
 * drifts.
 *
 * FIVE OF THESE NINE FIELDS DO NOT EXIST ON THE BACKEND. Business type, where
 * they are based, how their customers get invitations today, who referred them
 * and the free note are folded into the API's single `message` string by
 * `composeMessage` — see the note on `usePartnerRequestForm`. Nothing here needs
 * to know that; the component renders a draft and reports edits, and the shape
 * it renders (`PartnerRequestAnswers`) is the form's, not the wire's.
 *
 * It owns no submit, no API call and no local validation state — the surface
 * around it does, because "what happens when this is wrong" differs between the
 * two (a drawer footer banner; a page that may have to send you to sign in
 * first).
 *
 * `useId()` prefixes every `for`/`id` pair: the drawer can be mounted on a page
 * that also renders this form, and duplicate ids would point every label at
 * whichever input the browser found first.
 */
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'
import {
  BUSINESS_TYPES,
  INVITATIONS_TODAY,
  noteBudget,
  type PartnerRequestAnswers,
} from '@/composables/settings/usePartnerRequestForm'
import type { PartnerRequestVolume } from '@/services/api'

const props = defineProps<{
  modelValue: PartnerRequestAnswers
  /** Field-level errors from the server, keyed by field name. */
  fieldErrors?: Record<string, string[]> | null
  /** Client-side complaints, keyed the same way, owned by the surface. */
  localErrors?: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PartnerRequestAnswers]
}>()

const { t } = useI18n()
const uid = useId()

const volumeOptions: PartnerRequestVolume[] = ['1_5', '6_20', '21_50', '50_plus']
const businessTypes = BUSINESS_TYPES
const invitationsToday = INVITATIONS_TODAY

/**
 * What is left of the API's 1000-character `message` after the questions above
 * have taken their share — see `noteBudget`. Enforced here, at the keyboard,
 * rather than found out at submit.
 */
const noteMax = computed(() => noteBudget(props.modelValue))
const noteRemaining = computed(() =>
  Math.max(0, noteMax.value - (props.modelValue.message?.length ?? 0)),
)

const id = (field: string): string => `${uid}-${field}`

const errorFor = (field: string): string | null =>
  props.localErrors?.[field] ?? props.fieldErrors?.[field]?.[0] ?? null

const inputClass = (field: string): string =>
  errorFor(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'

const patch = (field: keyof PartnerRequestAnswers, event: Event): void => {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>
