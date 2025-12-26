<template>
  <div v-if="methods.length > 0" class="space-y-3">
    <label class="block text-sm font-medium text-slate-700">
      Payment Method
    </label>

    <!-- Payment Method Options -->
    <div class="space-y-2">
      <button
        v-for="method in methods"
        :key="method.id"
        type="button"
        @click="selectMethod(method)"
        :class="[
          'w-full p-3 text-left rounded-xl border-2 transition-all',
          modelValue === method.id
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-slate-200 hover:border-emerald-300'
        ]"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Building2 v-if="method.payment_method === 'bank_transfer'" class="w-4 h-4 text-slate-600" />
            <QrCode v-else-if="method.payment_method === 'qr_code'" class="w-4 h-4 text-slate-600" />
            <LinkIcon v-else class="w-4 h-4 text-slate-600" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900">{{ method.name }}</p>
            <p class="text-xs text-slate-500 truncate">
              <template v-if="method.payment_method === 'bank_transfer'">
                {{ method.bank_name }} - {{ method.account_number }}
              </template>
              <template v-else>
                {{ formatPaymentMethod(method.payment_method) }}
              </template>
            </p>
          </div>
          <ChevronRight
            v-if="modelValue !== method.id"
            class="w-4 h-4 text-slate-400"
          />
          <Check
            v-else
            class="w-4 h-4 text-emerald-600"
          />
        </div>
      </button>
    </div>

    <!-- Selected Payment Method Details -->
    <Transition name="slide-down">
      <div v-if="selectedMethod" class="bg-slate-50 rounded-xl p-4 space-y-3">
        <h4 class="text-sm font-medium text-slate-700">Payment Details</h4>

        <!-- Bank Transfer Details -->
        <div v-if="selectedMethod.payment_method === 'bank_transfer'" class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500">Bank</span>
            <span class="font-medium text-slate-900">{{ selectedMethod.bank_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Account Name</span>
            <span class="font-medium text-slate-900">{{ selectedMethod.account_name }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Account Number</span>
            <div class="flex items-center gap-2">
              <span class="font-mono font-medium text-slate-900">{{ selectedMethod.account_number }}</span>
              <button
                type="button"
                @click="copyAccountNumber"
                class="p-1 hover:bg-slate-200 rounded transition-colors"
                title="Copy account number"
              >
                <Copy class="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        <!-- QR Code -->
        <div v-if="selectedMethod.qr_code_image" class="flex justify-center pt-2">
          <img
            :src="getMediaUrl(selectedMethod.qr_code_image)"
            alt="Payment QR Code"
            class="w-36 h-36 rounded-lg border border-slate-200"
          />
        </div>

        <!-- Payment URL -->
        <div v-if="selectedMethod.payment_url" class="pt-2">
          <a
            :href="selectedMethod.payment_url"
            target="_blank"
            class="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ExternalLink class="w-4 h-4" />
            Open Payment Link
          </a>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Building2,
  QrCode,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  ChevronRight,
  Check,
} from 'lucide-vue-next'
import { apiClient } from '@/services/api'
import type { EventPaymentMethod } from '@/services/api/types/payment.types'

interface Props {
  modelValue?: number
  methods: EventPaymentMethod[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const selectedMethod = computed(() => {
  if (!props.modelValue) return null
  return props.methods.find(m => m.id === props.modelValue) || null
})

const selectMethod = (method: EventPaymentMethod) => {
  emit('update:modelValue', method.id)
}

const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case 'bank_transfer':
      return 'Bank Transfer'
    case 'qr_code':
      return 'QR Code Payment'
    case 'payment_url':
      return 'Online Payment'
    default:
      return method
  }
}

const getMediaUrl = (mediaUrl: string | null | undefined): string | undefined => {
  if (!mediaUrl) return undefined
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (mediaUrl.startsWith('/')) {
    return `${API_BASE_URL}${mediaUrl}`
  }
  return `${API_BASE_URL}/media/${mediaUrl}`
}

const copyAccountNumber = async () => {
  if (selectedMethod.value?.account_number) {
    try {
      await navigator.clipboard.writeText(selectedMethod.value.account_number)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
