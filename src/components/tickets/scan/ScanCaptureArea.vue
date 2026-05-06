<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
    <!-- Mode toggle pills -->
    <div class="flex gap-1 p-1 bg-slate-100 border-b border-slate-200">
      <button
        type="button"
        class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
        :class="
          mode === 'qr'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
        "
        :aria-pressed="mode === 'qr'"
        @click="setMode('qr')"
      >
        <Camera class="w-4 h-4" />
        {{ t('management.tickets.scan.modes.qr') }}
      </button>
      <button
        type="button"
        class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
        :class="
          mode === 'manual'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
        "
        :aria-pressed="mode === 'manual'"
        @click="setMode('manual')"
      >
        <KeyRound class="w-4 h-4" />
        {{ t('management.tickets.scan.modes.manual') }}
      </button>
    </div>

    <!-- Capture body -->
    <div class="p-3 sm:p-4">
      <div v-if="mode === 'qr'">
        <QRCodeScanner
          :continuous="true"
          :dedupe-window-ms="1800"
          :global-cooldown-ms="500"
          @scan-success="onQrScan"
          @scan-error="onQrError"
        />
        <div class="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-slate-600 flex items-start gap-2">
          <UserCheck class="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
          <span>{{ t('management.tickets.scan.subtitle') }}</span>
        </div>
      </div>

      <form
        v-else
        class="space-y-3"
        @submit.prevent="onManualSubmit"
      >
        <div>
          <label
            for="scan-manual-code"
            class="block text-sm font-medium text-slate-700 mb-2"
          >
            {{ t('management.tickets.scan.manualEntry.label') }}
          </label>
          <input
            id="scan-manual-code"
            ref="inputRef"
            v-model="manualCode"
            type="text"
            inputmode="text"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            maxlength="12"
            class="w-full px-4 py-3 text-center text-xl font-mono tracking-[0.2em] uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-emerald-300 transition-colors disabled:bg-slate-50 disabled:text-slate-400"
            :placeholder="t('management.tickets.scan.manualEntry.placeholder')"
            :disabled="disabled"
            @input="onManualInput"
          />
          <p class="text-xs text-slate-500 mt-2">
            {{ t('management.tickets.scan.manualEntry.helper') }}
          </p>
          <p v-if="warning" class="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5" />
            {{ warning }}
          </p>
        </div>
        <button
          type="submit"
          class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!canSubmit || disabled"
        >
          <span
            v-if="disabled"
            class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
          ></span>
          <UserCheck v-else class="w-4 h-4" />
          <span>{{ t('management.tickets.scan.manualEntry.submit') }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { AlertCircle, Camera, KeyRound, UserCheck } from 'lucide-vue-next'
import QRCodeScanner from '@/components/QRCodeScanner.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  mode: 'qr' | 'manual'
  /** True while a scan is in flight — disables submit + greys the input. */
  disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:mode': [mode: 'qr' | 'manual']
  qrScan: [code: string]
  qrError: [message: string]
  manualSubmit: [code: string]
}>()

const { t } = useAppLanguage()

// 0/O/I/L/1 are reserved-out by backend's check-in code generator. Warn the
// user instead of silently stripping so they don't think the system ate their
// keystroke.
const FORBIDDEN_MANUAL_CHARS = /[01OIL]/i

const manualCode = ref('')
const warning = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const canSubmit = computed(
  () => manualCode.value.trim().length >= 4 && !FORBIDDEN_MANUAL_CHARS.test(manualCode.value),
)

function setMode(next: 'qr' | 'manual') {
  if (next === props.mode) return
  emit('update:mode', next)
}

function onManualInput() {
  const upper = manualCode.value.toUpperCase()
  if (upper !== manualCode.value) manualCode.value = upper
  warning.value = FORBIDDEN_MANUAL_CHARS.test(manualCode.value)
    ? t('management.tickets.scan.manualEntry.invalidChar')
    : ''
}

function onManualSubmit() {
  if (!canSubmit.value || props.disabled) return
  const code = manualCode.value.trim()
  emit('manualSubmit', code)
  manualCode.value = ''
  warning.value = ''
}

function onQrScan(code: string) {
  emit('qrScan', code)
}

function onQrError(message: string) {
  emit('qrError', message)
}

// Auto-focus the manual input on mode flip so staff don't have to tap again
// after toggling.
watch(
  () => props.mode,
  (next) => {
    if (next === 'manual') {
      void nextTick(() => inputRef.value?.focus())
    }
  },
)

defineExpose({
  /** Imperative focus + clear, called by parent after rearm. */
  focus() {
    inputRef.value?.focus()
  },
  clear() {
    manualCode.value = ''
    warning.value = ''
  },
})
</script>
