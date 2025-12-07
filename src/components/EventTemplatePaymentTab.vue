<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Template & Payment
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">
          {{ headerDescription }}
        </p>
      </div>
      <button
        v-if="canEdit"
        @click="openTemplateSelector"
        class="flex bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 items-center text-sm sm:text-base"
      >
        <Palette class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        <span>Browse</span>
        <span class="hidden sm:inline ml-1">Templates</span>
      </button>
    </div>

    <!-- Active Template Display -->
    <TemplateDisplayCard
      v-if="event.event_template && isTemplateActivated && event.event_template_details"
      :template="event.event_template_details"
      status="active"
      @preview-video="openYoutubePreview"
    />

    <!-- Preview Template Display (selected but not paid) -->
    <TemplateDisplayCard
      v-else-if="selectedTemplateDetails && !isTemplateActivated"
      :template="selectedTemplateDetails"
      status="preview"
      :show-payment-button="true"
      @preview-video="openYoutubePreview"
      @make-payment="handleStartPayment"
    />

    <!-- No Template Selected State -->
    <div
      v-else-if="!event.event_template && !showTemplateSelector"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <div
        class="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
      >
        <Palette class="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
      </div>
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Template Selected</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        Choose a professional template to enhance your event's visual appeal and provide a better
        experience for your attendees.
      </p>
      <button
        v-if="canEdit"
        @click="openTemplateSelector"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center mx-auto text-sm sm:text-base"
      >
        <Palette class="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
        Browse Templates
      </button>
    </div>

    <!-- Template Selected But Not Enabled State (fallback) -->
    <div
      v-else-if="event.event_template && !isTemplateActivated && !selectedTemplateDetails"
      class="bg-gradient-to-r from-[#E6F4FF] to-indigo-50 border border-[#87CEEB] rounded-3xl p-4 sm:p-6"
    >
      <div class="flex items-start space-x-3 sm:space-x-4">
        <div
          class="w-10 h-10 sm:w-12 sm:h-12 bg-[#B0E0E6] rounded-full flex items-center justify-center flex-shrink-0"
        >
          <Package class="w-5 h-5 sm:w-6 sm:h-6 text-[#1e90ff]" />
        </div>
        <div class="flex-1">
          <h3 class="text-base sm:text-lg font-semibold text-slate-900">Template Selected</h3>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            You have selected template ID {{ event.event_template }}. Complete payment to activate it.
          </p>
          <button
            @click="handleStartPayment"
            class="mt-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm"
          >
            <CreditCard class="w-4 h-4 mr-2" />
            Make Payment
          </button>
        </div>
      </div>
    </div>

    <!-- Referrer Section -->
    <EventReferrerSection
      v-if="hasSelectedTemplate"
      :event-id="event.id"
      :can-edit="canEdit"
      :referrer-details="event?.referrer_details"
      :organizer-email="event?.organizer_details?.email"
      @referrer-updated="handleReferrerUpdated"
    />

    <!-- Current Payment Status (when template selected but not activated) -->
    <div
      v-if="hasSelectedTemplate && currentPayment && !isTemplateActivated"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
          <CreditCard class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
          Payment Status
        </h3>
        <button
          v-if="canStartNewPayment"
          @click="handleStartPayment"
          class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm"
        >
          <CreditCard class="w-4 h-4 mr-2" />
          <span class="hidden sm:inline">Make New Payment</span>
          <span class="sm:hidden">New Payment</span>
        </button>
      </div>

      <div
        v-if="currentPayment.status === 'confirmed'"
        class="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs sm:text-sm text-emerald-700"
      >
        <CheckCircle class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
        <span class="text-center">
          Payment confirmed for {{ currentPayment.plan_name || templatePackageDetails?.name || 'this package' }}. You're all set!
        </span>
      </div>
      <div
        v-else
        class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs sm:text-sm text-slate-600"
      >
        <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
        <span class="text-center">
          Your payment is awaiting review. You can update the existing payment instead of creating a new one.
        </span>
      </div>
    </div>

    <!-- Payment History -->
    <PaymentHistoryList
      v-if="hasSelectedTemplate"
      :payments="existingPayments"
      :loading="loadingPayments"
      @update-payment="startUpdatePayment"
    />

    <!-- Browse Template Modal -->
    <BrowseTemplateModal
      :is-open="showTemplateSelector"
      :event-id="event.id"
      :event-category="event.category || undefined"
      @close="closeTemplateSelector"
      @template-selected="handleTemplateSelected"
    />

    <!-- Payment Drawer -->
    <Teleport to="body">
      <!-- Backdrop -->
      <Transition name="fade">
        <div
          v-if="showPaymentModal"
          class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
          @click="closePaymentModal"
        />
      </Transition>

      <!-- Drawer Panel -->
      <Transition name="slide-right">
        <div
          v-if="showPaymentModal"
          class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] laptop-sm:w-[560px] laptop-md:w-[620px] desktop:w-[680px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
            <div class="flex items-center px-3 py-2.5">
              <!-- Left: Close button & Title -->
              <div class="flex items-center gap-2 flex-1">
                <button
                  @click="closePaymentModal"
                  class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Close"
                >
                  <ArrowRight class="w-5 h-5 text-white" />
                </button>
                <div class="min-w-0">
                  <p
                    v-if="templateName"
                    class="text-[10px] uppercase tracking-wide text-white/80"
                  >
                    {{ templateName }}
                  </p>
                  <h2 class="text-base font-semibold text-white leading-tight">Make Payment</h2>
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
                      <p class="text-xs sm:text-sm font-medium text-slate-700">Current payment</p>
                      <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                        {{ currentPayment.plan_name }}
                      </p>
                    </div>
                    <span
                      class="inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium"
                      :class="getStatusBadgeClass(currentPayment.status)"
                    >
                      {{ getStatusDisplay(currentPayment.status) }}
                    </span>
                  </div>

                  <section class="rounded-xl border border-slate-200 bg-white/80 p-3 laptop-sm:p-4">
                    <div class="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p class="text-xs sm:text-sm text-slate-600">Amount due</p>
                        <div class="flex items-baseline gap-2">
                          <p class="text-2xl sm:text-3xl font-semibold text-slate-900">
                            ${{ finalAmount }}
                          </p>
                          <p
                            v-if="promoDiscount"
                            class="text-sm sm:text-base text-slate-400 line-through"
                          >
                            ${{ promoDiscount.original }}
                          </p>
                        </div>
                        <p
                          v-if="promoDiscount"
                          class="text-xs text-emerald-600 font-medium mt-0.5"
                        >
                          You save ${{ promoDiscount.discount }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-xs sm:text-sm font-medium text-slate-700">
                          {{ templatePackageDetails?.name || 'Standard Package' }}
                        </p>
                        <p class="text-[11px] sm:text-xs text-slate-500">USD</p>
                      </div>
                    </div>
                  </section>

                  <!-- Promo Code Section -->
                  <section class="rounded-xl border border-slate-200 bg-white/80 p-3 laptop-sm:p-4 space-y-3">
                    <div class="flex items-center gap-2">
                      <Tag class="w-4 h-4 text-[#1e90ff]" />
                      <h3 class="text-sm sm:text-base font-semibold text-slate-800">Promo Code</h3>
                    </div>

                    <!-- Applied Promo Code Display -->
                    <div
                      v-if="appliedPromoCode"
                      class="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2.5"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <CheckCircle class="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-emerald-700 truncate">
                            {{ appliedPromoCode.code }}
                          </p>
                          <p class="text-[11px] text-emerald-600 truncate">
                            {{ appliedPromoCode.discount_type === 'percentage'
                              ? `${appliedPromoCode.discount_value}% off`
                              : `$${appliedPromoCode.discount_value} off` }}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        @click="removePromoCode"
                        class="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Remove promo code"
                      >
                        <Trash2 class="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>

                    <!-- Promo Code Input -->
                    <div v-else class="space-y-2">
                      <div class="flex gap-2">
                        <input
                          v-model="promoCodeInput"
                          type="text"
                          class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] bg-white/90 uppercase"
                          placeholder="Enter promo code"
                          @keyup.enter="validatePromoCode"
                        />
                        <button
                          type="button"
                          @click="validatePromoCode"
                          :disabled="validatingPromoCode || !promoCodeInput.trim()"
                          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          <Loader v-if="validatingPromoCode" class="w-3.5 h-3.5 animate-spin" />
                          <span>{{ validatingPromoCode ? 'Checking...' : 'Apply' }}</span>
                        </button>
                      </div>
                      <p
                        v-if="promoCodeError"
                        class="text-xs text-red-600"
                      >
                        {{ promoCodeError }}
                      </p>
                    </div>
                  </section>

                  <section class="space-y-3">
                    <div class="flex items-center justify-between">
                      <h3 class="text-sm sm:text-base font-semibold text-slate-800">Payment method</h3>
                      <span v-if="selectedMethod" class="text-[11px] sm:text-xs text-slate-500">
                        {{ selectedMethod.payment_type_display }}
                      </span>
                    </div>

                    <div v-if="loadingMethods" class="text-center py-8">
                      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e90ff] mx-auto"></div>
                      <p class="text-slate-500 text-xs sm:text-sm mt-3">Loading methods...</p>
                    </div>

                    <div
                      v-else-if="paymentMethods.length === 0"
                      class="rounded-xl border border-slate-200 bg-white/80 p-4 text-center text-xs sm:text-sm text-slate-500"
                    >
                      No payment methods available for this event yet.
                    </div>

                    <div v-else class="space-y-2">
                      <label
                        v-for="method in paymentMethods"
                        :key="method.id"
                        class="flex items-start justify-between gap-3 rounded-xl border px-4 py-3 sm:px-5 sm:py-4 cursor-pointer transition-all duration-200"
                        :class="selectedMethod?.id === method.id ? 'border-[#1e90ff] bg-[#F1F8FF] ring-2 ring-[#D6EDFF]' : 'border-slate-200 hover:border-slate-300'"
                        @click="selectMethod(method)"
                      >
                        <div class="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="radio"
                            class="mt-1.5 h-4 w-4 shrink-0 accent-[#1e90ff]"
                            name="payment-method"
                            :checked="selectedMethod?.id === method.id"
                            @change="selectMethod(method)"
                          />
                          <div class="min-w-0">
                            <p class="text-sm sm:text-base font-medium text-slate-900 truncate">{{ method.name }}</p>
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

                  <section
                    v-if="selectedMethod"
                    class="rounded-xl border border-slate-200 bg-slate-50/60 p-3 laptop-sm:p-4 space-y-3"
                  >
                    <div class="flex items-center justify-between">
                      <h3 class="text-sm sm:text-base font-semibold text-slate-800">Payment instructions</h3>
                      <span class="text-[11px] sm:text-xs text-slate-500">{{ selectedMethod.name }}</span>
                    </div>

                    <div class="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
                      <div
                        v-if="selectedMethod.bank_name || selectedMethod.account_number || selectedMethod.account_name"
                        class="flex-1 space-y-1.5 rounded-lg bg-white/70 px-3 py-2.5 text-xs sm:text-sm text-slate-600"
                      >
                        <p v-if="selectedMethod.bank_name">
                          <span class="font-medium text-slate-800">Bank:</span> {{ selectedMethod.bank_name }}
                        </p>
                        <p v-if="selectedMethod.account_number">
                          <span class="font-medium text-slate-800">Account:</span> {{ selectedMethod.account_number }}
                        </p>
                        <p v-if="selectedMethod.account_name">
                          <span class="font-medium text-slate-800">Name:</span> {{ selectedMethod.account_name }}
                        </p>
                      </div>

                      <div
                        v-if="selectedMethod.qr_code_image || selectedMethod.payment_link"
                        class="flex flex-col items-center gap-3 md:w-48 laptop-md:w-52 md:self-start"
                      >
                        <div
                          v-if="selectedMethod.qr_code_image"
                          class="w-full rounded-lg border border-slate-200 bg-white p-3 text-center"
                        >
                          <img
                            :src="selectedMethod.qr_code_image"
                            :alt="`QR Code for ${selectedMethod.name}`"
                            class="mx-auto h-24 w-24 laptop-sm:h-28 laptop-sm:w-28 laptop-md:h-32 laptop-md:w-32 object-contain"
                            loading="lazy"
                            @error="handleImageError"
                          />
                          <p class="text-[11px] sm:text-xs text-slate-500 mt-2">Scan with your banking app</p>
                        </div>

                        <button
                          v-if="selectedMethod.payment_link"
                          type="button"
                          @click="openPaymentLink(selectedMethod.payment_link)"
                          class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base"
                        >
                          Open Payment Link
                        </button>
                      </div>
                    </div>
                  </section>

                  <section class="space-y-3">
                    <h3 class="text-sm sm:text-base font-semibold text-slate-800">Payment details</h3>

                    <div
                      v-if="!selectedMethod"
                      class="rounded-lg border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-xs sm:text-sm text-slate-500"
                    >
                      Choose a payment method above to enable payment submission.
                    </div>

                    <div
                      v-if="error"
                      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-600"
                    >
                      {{ error }}
                    </div>

                    <!-- Payment Receipt (Primary) -->
                    <div class="space-y-1.5">
                      <label for="paymentProof" class="text-xs sm:text-sm font-medium text-slate-700">
                        Payment Receipt <span class="text-slate-400">(Optional)</span>
                      </label>
                      <input
                        id="paymentProof"
                        ref="fileInput"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                        @change="handleFileSelect"
                        class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] bg-white/90 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#E6F4FF] file:text-[#1873cc] file:text-xs file:font-semibold"
                      />
                      <p class="text-[11px] text-slate-500">JPG, PNG, PDF up to 10MB</p>
                    </div>

                    <!-- Additional Details (Collapsible) -->
                    <div class="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        @click="showAdditionalDetails = !showAdditionalDetails"
                        class="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
                      >
                        <span class="text-xs sm:text-sm font-medium text-slate-700">
                          Additional Details <span class="text-slate-400">(Optional)</span>
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
                            Transaction Reference
                          </label>
                          <input
                            id="transactionRef"
                            v-model="paymentForm.transaction_reference"
                            type="text"
                            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] bg-white"
                            placeholder="Enter transaction ID"
                          />
                        </div>

                        <div class="space-y-1.5">
                          <label for="paymentNotes" class="text-xs sm:text-sm font-medium text-slate-600">
                            Notes
                          </label>
                          <textarea
                            id="paymentNotes"
                            v-model="paymentForm.user_notes"
                            rows="2"
                            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] bg-white resize-none"
                            placeholder="Any additional notes for the host"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </section>
            </div>
          </div>

          <!-- Footer with Submit Button -->
          <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
            <button
              @click="submitPaymentWithSync"
              :disabled="submittingPayment || !isFormValid"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e90ff] to-[#2ecc71] hover:from-[#1873cc] hover:to-[#27ae60] text-white text-sm font-semibold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[#1e90ff] disabled:hover:to-[#2ecc71]"
            >
              <Loader v-if="submittingPayment" class="w-4 h-4 animate-spin" />
              <CheckCircle v-else class="w-4 h-4" />
              <span>{{ submittingPayment ? 'Submitting...' : 'Submit Payment' }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Update Payment Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showUpdateModal"
          class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          @click="cancelUpdate"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
            @click.stop
          >
            <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 py-4 sm:px-8 sm:py-6 text-white flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Pencil class="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h2 class="text-lg sm:text-2xl font-bold truncate">Update Payment</h2>
                </div>
                <button
                  @click="cancelUpdate"
                  class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0 ml-2"
                >
                  <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <div class="p-4 sm:p-8 overflow-y-auto flex-1">
              <form @submit.prevent="updatePayment" class="space-y-4 sm:space-y-6">
                <div>
                  <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    Transaction Reference <span class="text-slate-400">(Optional)</span>
                  </label>
                  <input
                    v-model="updateForm.transaction_reference"
                    type="text"
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                    placeholder="Enter transaction ID"
                  />
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    Payment Notes
                  </label>
                  <textarea
                    v-model="updateForm.user_notes"
                    rows="3"
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none text-sm sm:text-base"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    Payment Proof <span class="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    ref="updateFileInput"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    @change="handleUpdateFileSelect"
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-3 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-[#E6F4FF] file:text-[#1873cc] hover:file:bg-[#B0E0E6] text-xs sm:text-base"
                  />
                </div>

                <div class="flex space-x-3 sm:space-x-4 pt-4 sm:pt-6">
                  <button
                    type="button"
                    @click="cancelUpdate"
                    class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="updatingPayment"
                    class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {{ updatingPayment ? 'Updating...' : 'Update Payment' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 max-w-[calc(100vw-2rem)] sm:max-w-md">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl shadow-lg flex items-center text-sm sm:text-base"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span class="break-words">{{ message.text }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import {
  Palette,
  Package,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Clock,
  X,
  Pencil,
  ArrowRight,
  Loader,
  Tag,
  Trash2,
  ChevronDown,
} from 'lucide-vue-next'
import { type Event, type EventTemplate, apiService } from '../services/api'
import BrowseTemplateModal from './BrowseTemplateModal.vue'
import EventReferrerSection from './EventReferrerSection.vue'
import TemplateDisplayCard from './template/TemplateDisplayCard.vue'
import PaymentHistoryList from './template/PaymentHistoryList.vue'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useNotifications } from '../composables/useNotifications'
import { useTemplateLoader } from '../composables/useTemplateLoader'
import type { Payment, PaymentMethod, PaymentFormData, UpdateFormData } from '../types/payment'

// Promo code types
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

// Types
interface Props {
  event: Event
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'template-updated': [template: EventTemplate]
  'event-updated': [event: Event]
}>()

// Composables
const {
  payments: existingPayments,
  loadingPayments,
  isTemplateActivated,
  refreshPayments,
  loadPayments: loadExistingPayments,
} = usePaymentTemplateIntegration(props.event)

const { success: showSuccess, error: showError } = useNotifications()

const { selectedTemplateDetails, loadTemplateDetails, clearTemplate, setTemplateDetails } =
  useTemplateLoader()

// Local state
const showTemplateSelector = ref(false)
const showPaymentModal = ref(false)
const showUpdateModal = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Payment state
const paymentMethods = ref<readonly PaymentMethod[]>([])
const selectedMethod = ref<PaymentMethod | null>(null)
const loadingMethods = ref(false)
const submittingPayment = ref(false)
const updatingPayment = ref(false)
const error = ref<string | null>(null)
const paymentToUpdate = ref<Payment | null>(null)

// Forms
const paymentForm = ref<PaymentFormData>({
  transaction_reference: '',
  user_notes: '',
  payment_proof: null,
})

const updateForm = ref<UpdateFormData>({
  transaction_reference: '',
  user_notes: '',
  payment_proof: null,
})

// File inputs
const fileInput = ref<HTMLInputElement | null>(null)
const updateFileInput = ref<HTMLInputElement | null>(null)

// Promo code state
const promoCodeInput = ref('')
const validatingPromoCode = ref(false)
const appliedPromoCode = ref<PromoCodeValidation['promo_code'] | null>(null)
const promoDiscount = ref<{ original: string; discount: string; final: string } | null>(null)
const promoCodeError = ref<string | null>(null)

// Additional details collapse state
const showAdditionalDetails = ref(false)

// AbortController for request cancellation
let abortController: AbortController | null = null

// Computed properties
const headerDescription = computed((): string => {
  if (isTemplateActivated.value) {
    return 'Your template is active and ready to use'
  }
  if (props.event.event_template) {
    return 'Complete payment to activate your template'
  }
  return 'Select a template and complete payment'
})

const hasSelectedTemplate = computed(() => Boolean(props.event.event_template))

const templateName = computed(() => {
  if (props.event.event_template_details?.name) {
    return props.event.event_template_details.name
  }
  if (selectedTemplateDetails.value?.name) {
    return selectedTemplateDetails.value.name
  }
  return props.event.event_template ? `Template ID: ${props.event.event_template}` : ''
})

const templatePackageDetails = computed(() => {
  return (
    props.event.event_template_details?.package_plan ||
    selectedTemplateDetails.value?.package_plan ||
    null
  )
})

const templateIdAsString = computed((): string => {
  const id = props.event.event_template
  return typeof id === 'string' ? id : String(id || '')
})

const currentPayment = computed(() => {
  const normalize = (value?: string | null) =>
    value && typeof value === 'string' ? value.trim().toLowerCase() : null

  const currentTemplateName = normalize(props.event.event_template_details?.name || null)
  const currentPlanName = normalize(templatePackageDetails.value?.name || null)

  const fallbackPayment =
    existingPayments.value.find((p) => p.status === 'confirmed' || p.status === 'pending') || null

  if (!currentTemplateName && !currentPlanName) {
    return fallbackPayment
  }

  return (
    existingPayments.value.find((p) => {
      if (p.status !== 'confirmed' && p.status !== 'pending') {
        return false
      }

      const paymentTemplateName = normalize(p.template_name || null)
      const paymentPlanName = normalize(p.plan_name || null)

      if (currentTemplateName) {
        return paymentTemplateName === currentTemplateName
      }

      if (currentPlanName) {
        return paymentPlanName === currentPlanName
      }

      return false
    }) || null
  )
})

const canStartNewPayment = computed(() => !currentPayment.value)

const isFormValid = computed(() => {
  return Boolean(selectedMethod.value && templatePackageDetails.value)
})

// Helper functions
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    }
    return entities[match] || match
  })
}

const showMessage = (type: 'success' | 'error', text: string): void => {
  const sanitizedText = sanitizeInput(text)

  if (type === 'success') {
    showSuccess('Success', sanitizedText)
  } else {
    showError('Error', sanitizedText)
  }

  message.value = { type, text: sanitizedText }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Template management methods
const openTemplateSelector = (): void => {
  showTemplateSelector.value = true
}

const closeTemplateSelector = (): void => {
  showTemplateSelector.value = false
}

const handleTemplateSelected = async (template: EventTemplate): Promise<void> => {
  try {
    setTemplateDetails(template)
    emit('template-updated', template)
    await refreshPayments()
  } catch (err) {
    console.error('Error handling template selection:', err)
    showMessage('error', 'Failed to process template selection. Please try again.')
  }
}

const openYoutubePreview = (url: string): void => {
  if (!url) return

  let videoUrl = url

  if (url.includes('youtube.com/embed/')) {
    const videoId = url.split('embed/')[1]?.split('?')[0]
    if (videoId) {
      videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    }
  }

  window.open(videoUrl, '_blank', 'noopener,noreferrer')
}

const initializeTemplateData = async (): Promise<void> => {
  if (!props.event.event_template) {
    clearTemplate()
    return
  }

  try {
    await loadTemplateDetails({
      templateId: templateIdAsString.value,
      eventId: props.event.id,
      existingDetails: props.event.event_template_details,
    })
  } catch (err) {
    console.error('Error initializing template data:', err)
    showMessage('error', 'Failed to load template details. Please refresh the page.')
  }
}

// Payment methods
const handleStartPayment = () => {
  if (!canStartNewPayment.value) {
    showError(
      'Payment in progress',
      'Please wait for the current payment to be confirmed or rejected before submitting a new payment.',
    )
    return
  }
  showPaymentModal.value = true
}

const closePaymentModal = () => {
  showPaymentModal.value = false
  paymentForm.value = {
    transaction_reference: '',
    user_notes: '',
    payment_proof: null,
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  error.value = null
  // Reset promo code state
  removePromoCode()
}

const loadPaymentMethods = async (): Promise<void> => {
  if (loadingMethods.value) return

  if (abortController) {
    abortController.abort()
  }
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

const selectMethod = (method: PaymentMethod): void => {
  selectedMethod.value = method
}

const openPaymentLink = (paymentLink: string): void => {
  if (!paymentLink || typeof paymentLink !== 'string') {
    console.warn('Invalid payment link provided')
    return
  }

  try {
    // Replace amount parameter with actual payment amount using regex
    // This preserves the original URL structure for deep links
    const actualAmount = finalAmount.value
    const processedLink = paymentLink.replace(
      /([?&])amount=[^&]*/,
      `$1amount=${actualAmount}`
    )

    // For ABA pay short links, open in new window/tab to trigger app deep link
    // Using window.open with specific features helps trigger the OS app handler
    // rather than navigating within the current browser context
    const newWindow = window.open(processedLink, '_blank', 'noopener,noreferrer')

    // Fallback: if popup was blocked, try location change
    if (!newWindow) {
      window.location.href = processedLink
    }
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

// Promo code methods
const validatePromoCode = async (): Promise<void> => {
  const code = promoCodeInput.value.trim().toUpperCase()
  if (!code) {
    promoCodeError.value = 'Please enter a promo code'
    return
  }

  if (!templatePackageDetails.value) {
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
        pricing_plan_id: templatePackageDetails.value.id,
        amount: templatePackageDetails.value.price,
      },
    )

    // Check if the response contains valid promo code data
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
      // Handle validation failure - check for error in data or response message
      // Backend returns: { valid: false, error: "error message" }
      promoCodeError.value =
        response.data?.error || response.message || 'Invalid promo code'
    }
  } catch (err: unknown) {
    console.error('Error validating promo code:', err)
    // Try to extract error message from the API error response
    // The backend returns 400 with { valid: false, error: "..." }
    if (err && typeof err === 'object' && 'response' in err) {
      const errorResponse = err as { response?: { data?: { error?: string; valid?: boolean } } }
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

const finalAmount = computed(() => {
  if (promoDiscount.value) {
    return promoDiscount.value.final
  }
  return templatePackageDetails.value?.price || '0.00'
})

// Validation helpers
const validateTransactionReference = (ref: string): string | null => {
  const sanitized = sanitizeInput(ref)
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

  if (file.size > maxSize) {
    return 'File size must be less than 10MB'
  }

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
      showMessage('error', validationError)
      target.value = ''
      return
    }
  }

  paymentForm.value.payment_proof = file
  error.value = null
}

const handleUpdateFileSelect = (event: globalThis.Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null

  if (file) {
    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      showMessage('error', validationError)
      target.value = ''
      return
    }
  }

  updateForm.value.payment_proof = file
  error.value = null
}

const submitPaymentWithSync = async (): Promise<void> => {
  await submitPayment()

  if (!error.value) {
    await refreshPayments()
    closePaymentModal()
  }
}

const submitPayment = async (): Promise<void> => {
  if (submittingPayment.value) return

  const templatePackage = templatePackageDetails.value
  if (!isFormValid.value || !templatePackage) {
    error.value = 'Please select a payment method.'
    showMessage('error', 'Please select a payment method')
    return
  }

  // Only validate transaction reference if provided
  if (paymentForm.value.transaction_reference.trim()) {
    const transactionRefError = validateTransactionReference(paymentForm.value.transaction_reference)
    if (transactionRefError) {
      error.value = transactionRefError
      showMessage('error', transactionRefError)
      return
    }
  }

  if (paymentForm.value.payment_proof) {
    const fileError = validateFile(paymentForm.value.payment_proof)
    if (fileError) {
      error.value = fileError
      showMessage('error', fileError)
      return
    }
  }

  submittingPayment.value = true
  error.value = null

  try {
    const formData = new FormData()

    formData.append('event', sanitizeInput(props.event.id))
    formData.append('pricing_plan', templatePackage.id.toString())
    formData.append('payment_method', selectedMethod.value!.id.toString())

    // Use promo-discounted amount if available
    if (promoDiscount.value) {
      formData.append('amount', promoDiscount.value.final)
      formData.append('original_price', promoDiscount.value.original)
      formData.append('promo_discount', promoDiscount.value.discount)
    } else {
      formData.append('amount', templatePackage.price)
      formData.append('original_price', templatePackage.price)
    }

    // Include promo code string if applied (backend expects the code itself, not UUID)
    if (appliedPromoCode.value?.code) {
      formData.append('promo_code_string', appliedPromoCode.value.code)
    }

    // Only include transaction_reference if provided
    if (paymentForm.value.transaction_reference.trim()) {
      formData.append('transaction_reference', sanitizeInput(paymentForm.value.transaction_reference))
    }

    if (paymentForm.value.user_notes.trim()) {
      formData.append('user_notes', sanitizeInput(paymentForm.value.user_notes))
    }

    if (paymentForm.value.payment_proof) {
      formData.append('payment_proof', paymentForm.value.payment_proof)
    }

    if (props.event.event_template) {
      formData.append('event_template', props.event.event_template.toString())
    }

    const response = await apiService.postFormData<Payment>('/api/payment/payments/', formData)

    if (!response.success) {
      throw new Error(response.message || 'Failed to submit payment')
    }

    paymentForm.value = {
      transaction_reference: '',
      user_notes: '',
      payment_proof: null,
    }

    // Reset promo code state
    removePromoCode()

    if (fileInput.value) {
      fileInput.value.value = ''
    }

    await refreshPayments()

    showSuccess('Payment Submitted', 'Your payment has been submitted successfully and is pending review.')
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

const startUpdatePayment = (payment: Payment) => {
  paymentToUpdate.value = payment
  updateForm.value = {
    transaction_reference: payment.transaction_reference,
    user_notes: payment.user_notes || '',
    payment_proof: null,
  }
  showUpdateModal.value = true
}

const updatePayment = async (): Promise<void> => {
  if (!paymentToUpdate.value || updatingPayment.value) return

  // Only validate transaction reference if provided
  if (updateForm.value.transaction_reference.trim()) {
    const transactionRefError = validateTransactionReference(updateForm.value.transaction_reference)
    if (transactionRefError) {
      error.value = transactionRefError
      showMessage('error', transactionRefError)
      return
    }
  }

  if (updateForm.value.payment_proof) {
    const fileError = validateFile(updateForm.value.payment_proof)
    if (fileError) {
      error.value = fileError
      showMessage('error', fileError)
      return
    }
  }

  updatingPayment.value = true
  error.value = null

  try {
    const formData = new FormData()

    // Only include transaction_reference if provided
    if (updateForm.value.transaction_reference.trim()) {
      formData.append('transaction_reference', sanitizeInput(updateForm.value.transaction_reference))
    }

    if (updateForm.value.user_notes.trim()) {
      formData.append('user_notes', sanitizeInput(updateForm.value.user_notes))
    }

    if (updateForm.value.payment_proof) {
      formData.append('payment_proof', updateForm.value.payment_proof)
    }

    const response = await apiService.patchFormData<Payment>(
      `/api/payment/payments/${sanitizeInput(paymentToUpdate.value.id)}/`,
      formData,
    )

    if (!response.success) {
      throw new Error(response.message || 'Failed to update payment')
    }

    showUpdateModal.value = false
    paymentToUpdate.value = null
    await refreshPayments()

    showSuccess('Payment Updated', 'Your payment details have been updated successfully.')
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Error updating payment. Please try again.'
    console.error('Error updating payment:', err)
    error.value = errorMessage
    showError('Update Failed', errorMessage)
  } finally {
    updatingPayment.value = false
  }
}

const cancelUpdate = () => {
  showUpdateModal.value = false
  paymentToUpdate.value = null
  updateForm.value = {
    transaction_reference: '',
    user_notes: '',
    payment_proof: null,
  }
  if (updateFileInput.value) {
    updateFileInput.value.value = ''
  }
}

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'bg-orange-100 text-orange-700'
    case 'confirmed':
      return 'bg-green-100 text-green-700'
    case 'failed':
      return 'bg-red-100 text-red-700'
    case 'cancelled':
      return 'bg-slate-100 text-slate-700'
    case 'refunded':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getStatusDisplay = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'Pending Review'
    case 'confirmed':
      return 'Confirmed'
    case 'failed':
      return 'Rejected'
    case 'cancelled':
      return 'Cancelled'
    case 'refunded':
      return 'Refunded'
    default:
      return 'Unknown'
  }
}

const handleReferrerUpdated = (updatedEvent: unknown) => {
  if (props.event && updatedEvent && typeof updatedEvent === 'object') {
    const eventData = updatedEvent as Event
    emit('event-updated', eventData)
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watchers
watch(
  () => ({ templateId: props.event.event_template, eventId: props.event.id }),
  async (newData, oldData) => {
    if (newData.templateId !== oldData?.templateId || newData.eventId !== oldData?.eventId) {
      await initializeTemplateData()
    }
  },
  { immediate: true },
)

watch(
  () => showPaymentModal.value,
  (isOpen) => {
    // Prevent body scroll when drawer is open
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }
)

watch(
  () => props.event.event_template_details,
  (newDetails) => {
    if (newDetails && isTemplateActivated.value) {
      setTemplateDetails(newDetails)
    }
  },
  { immediate: true },
)

watch(
  () => hasSelectedTemplate.value,
  (newValue) => {
    if (newValue) {
      loadPaymentMethods()
    } else {
      paymentMethods.value = []
      selectedMethod.value = null
    }
  },
  { immediate: true },
)

// Lifecycle
onMounted(async () => {
  await nextTick()
  await Promise.allSettled([initializeTemplateData(), loadExistingPayments()])

  if (hasSelectedTemplate.value) {
    await loadPaymentMethods()
  }
})

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
  clearTemplate()
})

// Expose methods for parent component (Smart FAB)
defineExpose({
  openBrowseTemplates: () => {
    openTemplateSelector()
  },
  openPaymentModal: () => {
    handleStartPayment()
  },
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

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

/* Modal transition for Update Payment modal */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: all 0.3s ease;
  transform-origin: center;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}
</style>
