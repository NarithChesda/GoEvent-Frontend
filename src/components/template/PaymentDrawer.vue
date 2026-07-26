<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="emit('close')"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] laptop-sm:w-[560px] laptop-md:w-[620px] desktop:w-[680px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <div class="flex items-center gap-2 flex-1">
              <button
                @click="emit('close')"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                :title="t('management.templatePaymentTab.paymentDrawer.close')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="min-w-0">
                <p v-if="templateName" class="text-[10px] uppercase tracking-wide text-white/80">
                  {{ templateName }}
                </p>
                <h2 class="text-base font-semibold text-white leading-tight">
                  {{ t('management.templatePaymentTab.paymentDrawer.title') }}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="p-3 laptop-sm:p-4 space-y-3 laptop-sm:space-y-4">
            <div
              v-if="currentPayment"
              class="rounded-xl border border-slate-200 bg-white/80 p-3 laptop-sm:p-4 flex items-start justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="text-xs sm:text-sm font-medium text-slate-700">
                  {{ t('management.templatePaymentTab.paymentDrawer.currentPayment') }}
                </p>
                <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                  {{ currentPayment.plan_name }}
                </p>
              </div>
              <span
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                :class="statusBadgeClass(currentPayment.status)"
              >
                {{ statusDisplay(currentPayment.status) }}
              </span>
            </div>

            <!-- Order Summary & Promo Code - Combined Row -->
            <section class="rounded-xl border border-slate-200 bg-white/80 p-3 laptop-sm:p-4">
              <div class="flex flex-row items-center gap-2 sm:gap-3">
                <!-- Amount Display -->
                <div class="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                  <div>
                    <p class="text-[10px] sm:text-[11px] text-slate-500 uppercase tracking-wide">
                      {{ templatePackage?.name || t('management.templatePaymentTab.paymentDrawer.total') }}
                    </p>
                    <div class="flex items-baseline gap-1">
                      <p class="text-base sm:text-xl font-bold text-slate-900">${{ finalAmount }}</p>
                      <p v-if="promoDiscount" class="text-[10px] sm:text-xs text-slate-400 line-through">
                        ${{ promoDiscount.original }}
                      </p>
                    </div>
                  </div>
                  <div
                    v-if="promoDiscount"
                    class="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-[11px] font-medium whitespace-nowrap"
                  >
                    -${{ promoDiscount.discount }}
                  </div>
                </div>

                <div class="w-px h-8 sm:h-10 bg-slate-200 flex-shrink-0"></div>

                <!-- Promo Code Input/Display -->
                <div class="flex-1 min-w-0">
                  <div
                    v-if="appliedPromoCode"
                    class="flex items-center justify-between gap-1.5 sm:gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2 sm:px-2.5 py-1.5 sm:py-2"
                  >
                    <div class="flex items-center gap-1 sm:gap-2 min-w-0">
                      <CheckCircle class="w-3 sm:w-4 h-3 sm:h-4 text-emerald-500 flex-shrink-0" />
                      <span class="text-xs sm:text-sm font-medium text-emerald-700 truncate">
                        {{ appliedPromoCode.code }}
                      </span>
                      <span class="text-[10px] sm:text-[11px] text-emerald-600 flex-shrink-0">
                        ({{
                          appliedPromoCode.discount_type === 'percentage'
                            ? `${appliedPromoCode.discount_value}%`
                            : `$${appliedPromoCode.discount_value}`
                        }})
                      </span>
                    </div>
                    <button
                      type="button"
                      @click="removePromoCode"
                      class="p-0.5 sm:p-1 hover:bg-emerald-100 rounded-md transition-colors flex-shrink-0"
                      :title="t('management.templatePaymentTab.paymentDrawer.removePromoTitle')"
                    >
                      <X class="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-600" />
                    </button>
                  </div>

                  <div v-else class="space-y-1">
                    <div class="flex gap-1.5 sm:gap-2">
                      <div class="relative flex-1 min-w-0">
                        <Tag
                          class="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400"
                        />
                        <input
                          v-model="promoCodeInput"
                          type="text"
                          class="w-full pl-6 sm:pl-8 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] bg-white/90 uppercase placeholder:normal-case"
                          :placeholder="t('management.templatePaymentTab.paymentDrawer.promoPlaceholder')"
                          @keyup.enter="validatePromoCode"
                        />
                      </div>
                      <button
                        type="button"
                        @click="validatePromoCode"
                        :disabled="validatingPromoCode || !promoCodeInput.trim()"
                        class="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5 flex-shrink-0"
                      >
                        <Loader v-if="validatingPromoCode" class="w-3 sm:w-3.5 h-3 sm:h-3.5 animate-spin" />
                        <span>{{
                          validatingPromoCode
                            ? t('management.templatePaymentTab.paymentDrawer.applyingPromo')
                            : t('management.templatePaymentTab.paymentDrawer.applyPromo')
                        }}</span>
                      </button>
                    </div>
                    <p v-if="promoCodeError" class="text-[10px] sm:text-[11px] text-red-600 pl-1">
                      {{ promoCodeError }}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm sm:text-base font-semibold text-slate-800">
                  {{ t('management.templatePaymentTab.paymentDrawer.paymentMethod') }}
                </h3>
                <span v-if="selectedMethod" class="text-[11px] sm:text-xs text-slate-500">
                  {{ selectedMethod.payment_type_display }}
                </span>
              </div>

              <div v-if="loadingMethods" class="text-center py-8">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e90ff] mx-auto"></div>
                <p class="text-slate-500 text-xs sm:text-sm mt-3">
                  {{ t('management.templatePaymentTab.paymentDrawer.loadingMethods') }}
                </p>
              </div>

              <div
                v-else-if="paymentMethods.length === 0"
                class="rounded-xl border border-slate-200 bg-white/80 p-4 text-center text-xs sm:text-sm text-slate-500"
              >
                {{ t('management.templatePaymentTab.paymentDrawer.noMethods') }}
              </div>

              <div v-else class="space-y-2">
                <label
                  v-for="method in paymentMethods"
                  :key="method.id"
                  class="flex items-start justify-between gap-3 rounded-xl border px-4 py-3 sm:px-5 sm:py-4 cursor-pointer transition-all duration-200"
                  :class="
                    selectedMethod?.id === method.id
                      ? 'border-[#1e90ff] bg-[#F1F8FF] ring-2 ring-[#D6EDFF]'
                      : 'border-slate-200 hover:border-slate-300'
                  "
                  @click="selectedMethod = method"
                >
                  <div class="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="radio"
                      class="mt-1.5 h-4 w-4 shrink-0 accent-[#1e90ff]"
                      name="payment-method"
                      :checked="selectedMethod?.id === method.id"
                      @change="selectedMethod = method"
                    />
                    <div class="min-w-0">
                      <p class="text-sm sm:text-base font-medium text-slate-900 truncate">
                        {{ method.name }}
                      </p>
                      <p class="text-[11px] sm:text-xs text-slate-500 truncate">
                        {{ method.payment_type_display }}
                      </p>
                    </div>
                  </div>
                  <CheckCircle
                    v-if="selectedMethod?.id === method.id"
                    class="w-4 h-4 text-[#1e90ff] flex-shrink-0 mt-1.5"
                  />
                </label>
              </div>
            </section>

            <!-- Step-by-Step Payment Guide -->
            <section
              v-if="selectedMethod"
              class="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 laptop-sm:p-4 space-y-4"
            >
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-[#1e90ff]/10 flex items-center justify-center">
                  <Banknote class="w-4 h-4 text-[#1e90ff]" />
                </div>
                <div>
                  <h3 class="text-sm sm:text-base font-semibold text-slate-800">
                    {{ t('management.templatePaymentTab.paymentDrawer.howToPay') }}
                  </h3>
                  <p class="text-[11px] text-slate-500">{{ selectedMethod.name }}</p>
                </div>
              </div>

              <!-- Step 1: Copy Amount -->
              <div class="flex gap-3">
                <div class="flex flex-col items-center">
                  <div
                    class="w-6 h-6 rounded-full bg-[#1e90ff] text-white text-xs font-bold flex items-center justify-center"
                  >
                    1
                  </div>
                  <div class="w-0.5 flex-1 bg-slate-200 mt-1"></div>
                </div>
                <div class="flex-1 pb-4">
                  <p class="text-sm font-medium text-slate-800 mb-2">
                    {{ t('management.templatePaymentTab.paymentDrawer.step1.title') }}
                  </p>
                  <div class="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2">
                    <span class="text-lg font-semibold text-slate-900">${{ finalAmount }}</span>
                    <button
                      type="button"
                      @click="copyToClipboard(finalAmount, 'amount')"
                      class="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                      :class="
                        copiedField === 'amount'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      "
                    >
                      <Check v-if="copiedField === 'amount'" class="w-3.5 h-3.5" />
                      <Copy v-else class="w-3.5 h-3.5" />
                      {{
                        copiedField === 'amount'
                          ? t('management.templatePaymentTab.paymentDrawer.copied')
                          : t('management.templatePaymentTab.paymentDrawer.copy')
                      }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Step 2: Transfer Payment -->
              <div class="flex gap-3">
                <div class="flex flex-col items-center">
                  <div
                    class="w-6 h-6 rounded-full bg-[#1e90ff] text-white text-xs font-bold flex items-center justify-center"
                  >
                    2
                  </div>
                  <div class="w-0.5 flex-1 bg-slate-200 mt-1"></div>
                </div>
                <div class="flex-1 pb-4">
                  <p class="text-sm font-medium text-slate-800 mb-2">
                    {{ t('management.templatePaymentTab.paymentDrawer.step2.title') }}
                  </p>

                  <div
                    v-if="selectedMethod.qr_code_image"
                    class="rounded-xl border border-slate-200 bg-white p-4 text-center"
                  >
                    <img
                      :src="selectedMethod.qr_code_image"
                      :alt="`QR Code for ${selectedMethod.name}`"
                      class="mx-auto h-40 w-40 laptop-sm:h-44 laptop-sm:w-44 object-contain rounded-lg"
                      loading="lazy"
                      @error="handleImageError"
                    />
                    <p class="text-xs text-slate-500 mt-2">
                      {{ t('management.templatePaymentTab.paymentDrawer.step2.scanQr') }}
                    </p>
                  </div>

                  <!-- Payment Link Button - Only show on mobile devices with bank apps -->
                  <button
                    v-if="selectedMethod.payment_link && isMobileDevice"
                    type="button"
                    @click="openPaymentLink(selectedMethod.payment_link)"
                    class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e90ff] to-[#2ecc71] hover:from-[#1873cc] hover:to-[#27ae60] text-white font-semibold px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm mt-3"
                  >
                    <Smartphone class="w-4 h-4" />
                    {{ t('management.templatePaymentTab.paymentDrawer.step2.openBankApp') }}
                    <ExternalLink class="w-3.5 h-3.5 ml-1" />
                  </button>

                  <div
                    v-if="selectedMethod.bank_name || selectedMethod.account_number || selectedMethod.account_name"
                    class="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <p class="text-xs text-slate-500 font-medium uppercase tracking-wide">
                      {{ t('management.templatePaymentTab.paymentDrawer.step2.bankDetails') }}
                    </p>
                    <div v-if="selectedMethod.bank_name" class="text-sm text-slate-700">
                      <span class="text-slate-500">{{
                        t('management.templatePaymentTab.paymentDrawer.step2.bank')
                      }}</span>
                      {{ selectedMethod.bank_name }}
                    </div>
                    <div v-if="selectedMethod.account_number" class="flex items-center justify-between gap-2">
                      <div class="text-sm">
                        <span class="text-slate-500">{{
                          t('management.templatePaymentTab.paymentDrawer.step2.account')
                        }}</span>
                        <span class="font-mono font-medium text-slate-800 ml-1">{{
                          selectedMethod.account_number
                        }}</span>
                      </div>
                      <button
                        type="button"
                        @click="copyToClipboard(selectedMethod.account_number, 'account')"
                        class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all"
                        :class="
                          copiedField === 'account'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        "
                      >
                        <Check v-if="copiedField === 'account'" class="w-3 h-3" />
                        <Copy v-else class="w-3 h-3" />
                        {{
                          copiedField === 'account'
                            ? t('management.templatePaymentTab.paymentDrawer.copied')
                            : t('management.templatePaymentTab.paymentDrawer.copy')
                        }}
                      </button>
                    </div>
                    <div v-if="selectedMethod.account_name" class="flex items-center justify-between gap-2">
                      <div class="text-sm">
                        <span class="text-slate-500">{{
                          t('management.templatePaymentTab.paymentDrawer.step2.name')
                        }}</span>
                        <span class="font-medium text-slate-800 ml-1">{{ selectedMethod.account_name }}</span>
                      </div>
                      <button
                        type="button"
                        @click="copyToClipboard(selectedMethod.account_name, 'name')"
                        class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all"
                        :class="
                          copiedField === 'name'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        "
                      >
                        <Check v-if="copiedField === 'name'" class="w-3 h-3" />
                        <Copy v-else class="w-3 h-3" />
                        {{
                          copiedField === 'name'
                            ? t('management.templatePaymentTab.paymentDrawer.copied')
                            : t('management.templatePaymentTab.paymentDrawer.copy')
                        }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Step 3: Upload Receipt -->
              <div class="flex gap-3">
                <div class="flex flex-col items-center">
                  <div
                    class="w-6 h-6 rounded-full bg-[#1e90ff] text-white text-xs font-bold flex items-center justify-center"
                  >
                    3
                  </div>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-slate-800 mb-1">
                    {{ t('management.templatePaymentTab.paymentDrawer.step3.title') }}
                  </p>
                  <p class="text-[11px] text-slate-500 mb-2">
                    {{ t('management.templatePaymentTab.paymentDrawer.step3.hint') }}
                  </p>
                  <div class="relative">
                    <input
                      id="paymentProof"
                      ref="fileInput"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                      @change="handleFileSelect"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                      class="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-colors"
                      :class="
                        paymentForm.payment_proof
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-[#1e90ff] hover:bg-[#F1F8FF]'
                      "
                    >
                      <div
                        class="w-10 h-10 rounded-lg flex items-center justify-center"
                        :class="paymentForm.payment_proof ? 'bg-emerald-100' : 'bg-slate-100'"
                      >
                        <Check v-if="paymentForm.payment_proof" class="w-5 h-5 text-emerald-600" />
                        <Upload v-else class="w-5 h-5 text-slate-400" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p
                          class="text-sm font-medium truncate"
                          :class="paymentForm.payment_proof ? 'text-emerald-700' : 'text-slate-700'"
                        >
                          {{
                            paymentForm.payment_proof
                              ? paymentForm.payment_proof.name
                              : t('management.templatePaymentTab.paymentDrawer.step3.chooseFile')
                          }}
                        </p>
                        <p class="text-[11px] text-slate-500">
                          {{ t('management.templatePaymentTab.paymentDrawer.step3.fileTypes') }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Error Display -->
            <div
              v-if="error"
              class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-600"
            >
              {{ error }}
            </div>

            <!-- Placeholder when no method selected -->
            <div
              v-if="!selectedMethod"
              class="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center"
            >
              <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <CreditCard class="w-6 h-6 text-slate-400" />
              </div>
              <p class="text-sm font-medium text-slate-600">
                {{ t('management.templatePaymentTab.paymentDrawer.noMethodSelected.title') }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ t('management.templatePaymentTab.paymentDrawer.noMethodSelected.hint') }}
              </p>
            </div>

            <!-- Additional Details (Collapsible) -->
            <div v-if="selectedMethod" class="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                @click="showAdditionalDetails = !showAdditionalDetails"
                class="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
              >
                <span class="text-xs sm:text-sm font-medium text-slate-700">
                  {{ t('management.templatePaymentTab.paymentDrawer.additionalDetails') }}
                  <span class="text-slate-400"
                    >({{ t('management.templatePaymentTab.paymentDrawer.optional') }})</span
                  >
                </span>
                <ChevronDown
                  class="w-4 h-4 text-slate-500 transition-transform duration-200"
                  :class="{ 'rotate-180': showAdditionalDetails }"
                />
              </button>
              <div
                v-show="showAdditionalDetails"
                class="px-3 py-3 space-y-3 border-t border-slate-200 bg-white/90"
              >
                <div class="space-y-1.5">
                  <label for="transactionRef" class="text-xs sm:text-sm font-medium text-slate-600">
                    {{ t('management.templatePaymentTab.paymentDrawer.transactionRef') }}
                  </label>
                  <input
                    id="transactionRef"
                    v-model="paymentForm.transaction_reference"
                    type="text"
                    class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] bg-white"
                    :placeholder="t('management.templatePaymentTab.paymentDrawer.transactionRefPlaceholder')"
                  />
                </div>

                <div class="space-y-1.5">
                  <label for="paymentNotes" class="text-xs sm:text-sm font-medium text-slate-600">
                    {{ t('management.templatePaymentTab.paymentDrawer.notes') }}
                  </label>
                  <textarea
                    id="paymentNotes"
                    v-model="paymentForm.user_notes"
                    rows="2"
                    class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] bg-white resize-none"
                    :placeholder="t('management.templatePaymentTab.paymentDrawer.notesPlaceholder')"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with Submit Button -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <button
            @click="submitPayment"
            :disabled="submittingPayment || !isFormValid"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e90ff] to-[#2ecc71] hover:from-[#1873cc] hover:to-[#27ae60] text-white text-sm font-semibold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[#1e90ff] disabled:hover:to-[#2ecc71]"
          >
            <Loader v-if="submittingPayment" class="w-4 h-4 animate-spin" />
            <CheckCircle v-else class="w-4 h-4" />
            <span>{{
              submittingPayment
                ? t('management.templatePaymentTab.paymentDrawer.submitting')
                : t('management.templatePaymentTab.paymentDrawer.submitBtn')
            }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * The template activation checkout: pick a method, transfer, upload the
 * receipt.
 *
 * Extracted verbatim out of EventTemplatePaymentTab.vue so the Design Studio
 * can open the *same* checkout inline from its activation pill — the buy moment
 * belongs where the organizer is admiring the live preview, not one tab away.
 * Both mount this component; neither owns the flow.
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowRight,
  Banknote,
  Check,
  CheckCircle,
  ChevronDown,
  Copy,
  CreditCard,
  ExternalLink,
  Loader,
  Smartphone,
  Tag,
  Upload,
  X,
} from 'lucide-vue-next'
import { apiService } from '../../services/api'
import { useNotifications } from '../../composables/useNotifications'
import type { Payment, PaymentMethod, PaymentFormData, PaymentStatus } from '../../types/payment'

interface PricingPlan {
  id: number
  name: string
  price: string
}

interface PromoCodeValidation {
  valid: boolean
  promo_code?: {
    id: string
    code: string
    description: string
    discount_type: 'percentage' | 'fixed'
    discount_value: string
    max_discount_amount: string | null
    minimum_purchase_amount: string
    valid_until: string | null
  }
  calculation?: {
    original_amount: string
    discount_amount: string
    final_amount: string
  }
  error?: string
}

interface Props {
  open: boolean
  eventId: string
  /** The template's pricing plan — what's actually being purchased. */
  templatePackage?: PricingPlan | null
  /** Selected template id, sent alongside the payment so the backend can link them. */
  templateId?: number | string | null
  templateName?: string | null
  /** An already-open (pending/confirmed) payment for this template, if any. */
  currentPayment?: Payment | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  /** A payment row was created — the parent should refresh its payment list. */
  submitted: []
}>()

const { t } = useI18n()
const { success: showSuccess, error: showError } = useNotifications()

const paymentMethods = ref<readonly PaymentMethod[]>([])
const selectedMethod = ref<PaymentMethod | null>(null)
const loadingMethods = ref(false)
const submittingPayment = ref(false)
const error = ref<string | null>(null)
const showAdditionalDetails = ref(false)
const copiedField = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const paymentForm = ref<PaymentFormData>({
  transaction_reference: '',
  user_notes: '',
  payment_proof: null,
})

// Promo code state
const promoCodeInput = ref('')
const validatingPromoCode = ref(false)
const appliedPromoCode = ref<PromoCodeValidation['promo_code'] | null>(null)
const promoDiscount = ref<{ original: string; discount: string; final: string } | null>(null)
const promoCodeError = ref<string | null>(null)

const isMobileDevice = computed(() => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

const finalAmount = computed(
  () => promoDiscount.value?.final ?? props.templatePackage?.price ?? '0.00',
)

const isFormValid = computed(() => Boolean(selectedMethod.value && props.templatePackage))

let abortController: AbortController | null = null

const sanitizeInput = (input: string): string =>
  input.trim().replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    }
    return entities[match] || match
  })

/** Kept identical to PaymentHistoryList's badges — same statuses, same recipe. */
const statusBadgeClass = (status?: PaymentStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'failed':
      return 'bg-red-50 text-red-700 ring-1 ring-red-200'
    case 'refunded':
      return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
    default:
      return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
  }
}

const statusDisplay = (status?: PaymentStatus) =>
  status
    ? t(`management.paymentHistoryList.status.${status}`)
    : t('management.paymentHistoryList.status.unknown')

const copyToClipboard = async (text: string, fieldName: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = fieldName
    setTimeout(() => {
      copiedField.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    showError('Error', 'Failed to copy to clipboard')
  }
}

const loadPaymentMethods = async (): Promise<void> => {
  if (loadingMethods.value) return

  abortController?.abort()
  abortController = new AbortController()

  loadingMethods.value = true
  error.value = null

  try {
    const response = await apiService.get<{ results: PaymentMethod[] }>(
      '/api/payment/payment-methods/',
      undefined,
    )

    if (response.success && response.data) {
      paymentMethods.value = Object.freeze(response.data.results || [])
    } else {
      throw new Error(response.message || 'Failed to load payment methods')
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Error loading payment methods:', err)
      error.value = 'Failed to load payment methods. Please try again.'
    }
  } finally {
    loadingMethods.value = false
    abortController = null
  }
}

const openPaymentLink = (paymentLink: string): void => {
  if (!paymentLink || typeof paymentLink !== 'string') return
  try {
    const url = new URL(paymentLink)
    if (!url.protocol) return
    window.location.href = paymentLink
  } catch (err) {
    console.error('Invalid payment link format:', err)
  }
}

const handleImageError = (event: globalThis.Event): void => {
  const img = event.target as HTMLImageElement
  if (img?.src) {
    console.error('Failed to load QR code image:', img.src)
    img.style.display = 'none'
  }
}

const validatePromoCode = async (): Promise<void> => {
  const code = promoCodeInput.value.trim().toUpperCase()
  if (!code) {
    promoCodeError.value = 'Please enter a promo code'
    return
  }
  if (!props.templatePackage) {
    promoCodeError.value = 'Please select a template first'
    return
  }

  validatingPromoCode.value = true
  promoCodeError.value = null

  try {
    const response = await apiService.post<PromoCodeValidation>(
      '/api/payment/promo-codes/validate/',
      {
        code,
        pricing_plan_id: props.templatePackage.id,
        amount: props.templatePackage.price,
      },
    )

    if (response.success && response.data?.valid) {
      appliedPromoCode.value = response.data.promo_code || null
      if (response.data.calculation) {
        promoDiscount.value = {
          original: response.data.calculation.original_amount,
          discount: response.data.calculation.discount_amount,
          final: response.data.calculation.final_amount,
        }
      }
      promoCodeInput.value = ''
      showSuccess('Promo Code Applied', `Promo code "${code}" applied successfully!`)
    } else {
      promoCodeError.value = response.data?.error || response.message || 'Invalid promo code'
    }
  } catch (err: unknown) {
    console.error('Error validating promo code:', err)
    // Backend returns 400 with { valid: false, error: "..." }
    if (err && typeof err === 'object' && 'response' in err) {
      const errorResponse = err as { response?: { data?: { error?: string } } }
      if (errorResponse.response?.data?.error) {
        promoCodeError.value = errorResponse.response.data.error
        return
      }
    }
    promoCodeError.value = err instanceof Error ? err.message : 'Failed to validate promo code'
  } finally {
    validatingPromoCode.value = false
  }
}

const removePromoCode = (): void => {
  appliedPromoCode.value = null
  promoDiscount.value = null
  promoCodeError.value = null
  promoCodeInput.value = ''
}

const validateTransactionReference = (reference: string): string | null => {
  const sanitized = sanitizeInput(reference)
  if (!sanitized || sanitized.length < 3) {
    return 'Transaction reference must be at least 3 characters long'
  }
  if (sanitized.length > 100) {
    return 'Transaction reference must be less than 100 characters'
  }
  if (!/^[a-zA-Z0-9\-_\s]+$/.test(sanitized)) {
    return 'Transaction reference can only contain letters, numbers, dashes, underscores, and spaces'
  }
  return null
}

const validateFile = (file: File): string | null => {
  const maxSize = 10 * 1024 * 1024
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ]

  if (file.size > maxSize) return 'File size must be less than 10MB'
  if (!allowedTypes.includes(file.type)) {
    return 'File type not allowed. Please use JPG, PNG, GIF, WebP, or PDF files'
  }
  return null
}

const handleFileSelect = (event: globalThis.Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null

  if (file) {
    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      showError('Error', validationError)
      target.value = ''
      return
    }
  }

  paymentForm.value.payment_proof = file
  error.value = null
}

const resetForm = (): void => {
  paymentForm.value = { transaction_reference: '', user_notes: '', payment_proof: null }
  if (fileInput.value) fileInput.value.value = ''
  error.value = null
  removePromoCode()
}

const submitPayment = async (): Promise<void> => {
  if (submittingPayment.value) return

  const templatePackage = props.templatePackage
  if (!isFormValid.value || !templatePackage) {
    error.value = 'Please select a payment method.'
    showError('Error', 'Please select a payment method')
    return
  }

  if (paymentForm.value.transaction_reference.trim()) {
    const transactionRefError = validateTransactionReference(paymentForm.value.transaction_reference)
    if (transactionRefError) {
      error.value = transactionRefError
      showError('Error', transactionRefError)
      return
    }
  }

  if (paymentForm.value.payment_proof) {
    const fileError = validateFile(paymentForm.value.payment_proof)
    if (fileError) {
      error.value = fileError
      showError('Error', fileError)
      return
    }
  }

  submittingPayment.value = true
  error.value = null

  try {
    const formData = new FormData()

    formData.append('event', sanitizeInput(props.eventId))
    formData.append('pricing_plan', templatePackage.id.toString())
    formData.append('payment_method', selectedMethod.value!.id.toString())

    if (promoDiscount.value) {
      formData.append('amount', promoDiscount.value.final)
      formData.append('original_price', promoDiscount.value.original)
      formData.append('promo_discount', promoDiscount.value.discount)
    } else {
      formData.append('amount', templatePackage.price)
      formData.append('original_price', templatePackage.price)
    }

    // Backend expects the code itself, not the promo code's UUID
    if (appliedPromoCode.value?.code) {
      formData.append('promo_code_string', appliedPromoCode.value.code)
    }

    if (paymentForm.value.transaction_reference.trim()) {
      formData.append(
        'transaction_reference',
        sanitizeInput(paymentForm.value.transaction_reference),
      )
    }

    if (paymentForm.value.user_notes.trim()) {
      formData.append('user_notes', sanitizeInput(paymentForm.value.user_notes))
    }

    if (paymentForm.value.payment_proof) {
      formData.append('payment_proof', paymentForm.value.payment_proof)
    }

    if (props.templateId) {
      formData.append('event_template', String(props.templateId))
    }

    const response = await apiService.postFormData<Payment>('/api/payment/payments/', formData)

    if (!response.success) {
      throw new Error(response.message || 'Failed to submit payment')
    }

    resetForm()
    showSuccess(
      'Payment Submitted',
      'Your payment has been submitted successfully and is pending review.',
    )
    emit('submitted')
    emit('close')
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Error submitting payment. Please try again.'
    console.error('Error submitting payment:', err)
    error.value = errorMessage
    showError('Payment Failed', errorMessage)
  } finally {
    submittingPayment.value = false
  }
}

// Methods are fetched on first open rather than on mount — the drawer is
// mounted (closed) by both the studio and the activation tab, and neither
// should pay for a request the organizer may never need.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (paymentMethods.value.length === 0) loadPaymentMethods()
    } else {
      resetForm()
    }
  },
)

// Prevent body scroll while the drawer is open, compensating for the
// scrollbar's own width so the page behind doesn't visibly shift.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  },
)
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}
</style>
