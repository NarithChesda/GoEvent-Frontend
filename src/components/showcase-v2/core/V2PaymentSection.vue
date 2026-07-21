<template>
  <V2ChapterShell
    section-id="payment-section"
    :chapter-number="chapterNumber"
    :title="title"
    :current-language="currentLanguage"
  >
    <div class="v2-form-card v2-gift-card">
      <!-- One tab per payment method, switching which method's QR/account is shown below -->
      <div v-if="paymentMethods.length > 1" class="v2-gift-tabs" role="tablist">
        <button
          v-for="(method, i) in paymentMethods"
          :key="method.id"
          type="button"
          role="tab"
          class="v2-gift-tab"
          :class="{ 'v2-gift-tab--active': i === activeIndex }"
          :aria-selected="i === activeIndex"
          @click="activeIndex = i"
        >
          {{ tabLabel(method) }}
        </button>
      </div>

      <div v-if="activeMethod" class="v2-gift-body">
        <div class="v2-gift-qr-wrap">
          <div class="v2-gift-qr-box">
            <img
              v-if="activeMethod.qr_code_image"
              :src="getMediaUrl(activeMethod.qr_code_image)"
              :alt="`QR code for ${tabLabel(activeMethod)}`"
            />
            <QrCode v-else class="v2-gift-qr-placeholder" aria-hidden="true" />
          </div>
          <p class="v2-gift-scan">
            {{ activeMethod.qr_code_image ? t('scan_to_pay') : t('qr_coming_soon') }}
          </p>
        </div>

        <div v-if="activeMethod.account_number" class="v2-gift-acct-row">
          <span class="v2-gift-acct-num">{{ activeMethod.account_number }}</span>
          <button type="button" class="v2-gift-copy" @click="copyAccountNumber">
            {{ copied ? t('copied_action') : t('copy_action') }}
          </button>
        </div>
        <p v-if="captionText" class="v2-gift-caption">{{ captionText }}</p>

        <a
          v-if="activeMethod.payment_url"
          :href="activeMethod.payment_url"
          target="_blank"
          rel="noopener"
          class="v2-btn v2-btn--primary v2-gift-pay-btn"
        >
          {{ payNowLabel }}
        </a>

        <p v-if="activeMethod.description" class="v2-gift-desc">{{ activeMethod.description }}</p>
      </div>

      <p v-else class="v2-gift-empty">{{ t('no_payment_methods') }}</p>

      <p v-if="activeMethod" class="v2-gift-note">{{ t('gift_note') }}</p>
    </div>
  </V2ChapterShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { QrCode } from 'lucide-vue-next'
import V2ChapterShell from './V2ChapterShell.vue'
import { translateV2, type V2TranslationKey } from '../../../composables/showcase-v2/v2Translations'
import { translateRSVP, type SupportedLanguage } from '../../../utils/translations'
import type { EventPaymentMethod } from '../../../services/api'

interface Props {
  chapterNumber: number
  title: string
  paymentMethods: EventPaymentMethod[]
  getMediaUrl: (url: string) => string
  currentLanguage?: string
}

const props = defineProps<Props>()

const t = (key: V2TranslationKey) => translateV2(key, props.currentLanguage)
const payNowLabel = computed(() =>
  translateRSVP('payment_pay_now', (props.currentLanguage as SupportedLanguage) || 'en'),
)

const activeIndex = ref(0)
watch(
  () => props.paymentMethods,
  () => {
    activeIndex.value = 0
  },
)

const activeMethod = computed<EventPaymentMethod | undefined>(
  () => props.paymentMethods[activeIndex.value],
)

const tabLabel = (method: EventPaymentMethod) => method.bank_name || method.name

const captionText = computed(() => {
  const method = activeMethod.value
  if (!method) return ''
  return [method.account_name, tabLabel(method)].filter(Boolean).join(' · ')
})

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
const copyAccountNumber = async () => {
  const number = activeMethod.value?.account_number
  if (!number) return
  try {
    await navigator.clipboard.writeText(number)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    // Clipboard unavailable — nothing to fall back to, just skip the feedback
  }
}
</script>

<style scoped src="./v2-forms.css"></style>

<style scoped>
.v2-gift-card {
  text-align: center;
}

.v2-gift-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.v2-gift-tabs::-webkit-scrollbar {
  display: none;
}

.v2-gift-tab {
  flex: 1 0 auto;
  min-width: 84px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #d9d2c7;
  border-radius: 999px;
  background: #fff;
  font-family: var(--v2-body);
  font-size: 13px;
  color: var(--v2-charcoal);
  cursor: pointer;
  transition: all 0.25s;
}

.v2-gift-tab--active {
  background: var(--v2-charcoal);
  border-color: var(--v2-charcoal);
  color: var(--v2-ivory);
}

.v2-gift-tab:focus-visible {
  outline: 2px solid var(--v2-blush);
}

.v2-gift-qr-wrap {
  margin-bottom: 16px;
}

.v2-gift-qr-box {
  width: 180px;
  height: 180px;
  margin: 0 auto 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #d9d2c7;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.v2-gift-qr-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.v2-gift-qr-placeholder {
  width: 56px;
  height: 56px;
  color: var(--v2-sage-deep);
  opacity: 0.5;
}

.v2-gift-scan {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--v2-sage-deep);
}

.v2-gift-acct-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.v2-gift-acct-num {
  font-family: var(--v2-display);
  font-weight: 600;
  font-size: 18px;
  letter-spacing: 0.06em;
  color: var(--v2-charcoal);
}

.v2-gift-copy {
  min-height: 36px;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  background: var(--v2-sage);
  color: #fff;
  font-family: var(--v2-body);
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.v2-gift-copy:hover,
.v2-gift-copy:focus-visible {
  opacity: 0.85;
}

.v2-gift-caption {
  font-size: 13px;
  color: var(--v2-sage-deep);
}

.v2-gift-pay-btn {
  margin-top: 16px;
}

.v2-gift-desc {
  margin-top: 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--v2-ink-soft);
}

.v2-gift-empty {
  font-size: 14px;
  color: var(--v2-ink-soft);
  padding: 12px 0;
}

.v2-gift-note {
  margin-top: 18px;
  font-size: 13px;
  font-style: italic;
  color: var(--v2-ink-soft);
}

@media (prefers-reduced-motion: reduce) {
  .v2-gift-tab,
  .v2-gift-copy {
    transition: none;
  }
}
</style>
