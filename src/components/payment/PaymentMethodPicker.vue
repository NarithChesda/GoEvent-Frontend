<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm sm:text-base font-semibold text-slate-800">
        {{ t('management.templatePaymentTab.paymentDrawer.paymentMethod') }}
      </h3>
      <span v-if="modelValue" class="text-[0.6875rem] sm:text-xs text-slate-500">
        {{ modelValue.payment_type_display }}
      </span>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e90ff] mx-auto"></div>
      <p class="text-slate-500 text-xs sm:text-sm mt-3">
        {{ t('management.templatePaymentTab.paymentDrawer.loadingMethods') }}
      </p>
    </div>

    <div
      v-else-if="methods.length === 0"
      class="rounded-xl border border-slate-200 bg-white/80 p-4 text-center text-xs sm:text-sm text-slate-500"
    >
      {{ t('management.templatePaymentTab.paymentDrawer.noMethods') }}
    </div>

    <div v-else class="space-y-2">
      <label
        v-for="method in methods"
        :key="method.id"
        class="flex items-start justify-between gap-3 rounded-xl border px-4 py-3 sm:px-5 sm:py-4 cursor-pointer transition-all duration-200"
        :class="
          modelValue?.id === method.id
            ? 'border-[#1e90ff] bg-[#F1F8FF] ring-2 ring-[#D6EDFF]'
            : 'border-slate-200 hover:border-slate-300'
        "
        @click="emit('update:modelValue', method)"
      >
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="radio"
            class="mt-1.5 h-4 w-4 shrink-0 accent-[#1e90ff]"
            :name="groupName"
            :checked="modelValue?.id === method.id"
            @change="emit('update:modelValue', method)"
          />
          <div class="min-w-0">
            <p class="text-sm sm:text-base font-medium text-slate-900 truncate">
              {{ method.name }}
            </p>
            <p class="text-[0.6875rem] sm:text-xs text-slate-500 truncate">
              {{ method.payment_type_display }}
            </p>
          </div>
        </div>
        <CheckCircle
          v-if="modelValue?.id === method.id"
          class="w-4 h-4 text-[#1e90ff] flex-shrink-0 mt-1.5"
        />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * The list of GoEvent's own receiving accounts, as radio cards.
 *
 * Lifted verbatim out of PaymentDrawer once the partner credit-pack checkout
 * needed the identical list: two checkouts that pay the same company through the
 * same accounts should not be able to drift apart in how they ask.
 */
import { useI18n } from 'vue-i18n'
import { CheckCircle } from 'lucide-vue-next'
import type { PaymentMethod } from '@/types/payment'

withDefaults(
  defineProps<{
    methods: readonly PaymentMethod[]
    loading?: boolean
    modelValue: PaymentMethod | null
    /** Radio group name — distinct per drawer so two mounted lists don't merge. */
    groupName?: string
  }>(),
  { loading: false, groupName: 'payment-method' },
)

const emit = defineEmits<{
  'update:modelValue': [method: PaymentMethod]
}>()

const { t } = useI18n()
</script>
