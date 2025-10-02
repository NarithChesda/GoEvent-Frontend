<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Payment Management
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">
          Manage payment packages and transactions for your event
        </p>
      </div>
    </div>

    <!-- Template-Based Package Selection -->
    <div
      v-if="!hasSelectedTemplate"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <FileText class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">Select a Template First</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        You need to select an event template before you can view payment packages. Templates
        determine the available pricing plans for your event.
      </p>
      <button
        @click="redirectToTemplateTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <FileText class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Select Template
      </button>
    </div>

    <!-- Template Selected - Show Template Pricing Info -->
    <div v-else-if="hasSelectedTemplate" class="space-y-6">
      <!-- Current Template Info -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
        <h3 class="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center">
          <FileText class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
          Selected Template Package
        </h3>
        <div
          class="bg-gradient-to-br from-emerald-50 to-sky-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#87CEEB]/50"
        >
          <div class="flex items-center justify-between mb-2 sm:mb-3 gap-2">
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-slate-900 text-sm sm:text-base truncate">{{ templateName }}</h4>
              <p class="text-xs sm:text-sm text-slate-700 truncate">
                {{ templatePackageDetails?.name || 'Standard Package' }}
              </p>
            </div>
            <div class="text-right flex-shrink-0">
              <span class="text-xl sm:text-2xl font-bold text-slate-900"
                >${{ templatePackageDetails?.price || '0.00' }}</span
              >
              <p class="text-[10px] sm:text-xs text-slate-600">USD</p>
            </div>
          </div>

          <!-- Package Features -->
          <div
            v-if="templatePackageDetails?.features && templatePackageDetails.features.length > 0"
            class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#87CEEB]/50"
          >
            <p class="text-xs sm:text-sm font-medium text-slate-800 mb-1.5 sm:mb-2">Included Features:</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
              <div
                v-for="feature in templatePackageDetails.features"
                :key="feature"
                class="flex items-center text-xs sm:text-sm text-slate-700"
              >
                <CheckCircle class="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span class="truncate">{{ feature }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Action Button -->
        <div class="mt-4 sm:mt-6 text-center">
          <button
            @click="showPaymentModal = true"
            class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-base sm:text-lg"
          >
            <CreditCard class="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            <span class="hidden sm:inline">{{ currentPayment ? 'Make New Payment' : 'Make Payment' }}</span>
            <span class="sm:hidden">{{ currentPayment ? 'New Payment' : 'Make Payment' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Referrer Section -->
    <EventReferrerSection
      :event-id="eventId"
      :can-edit="canEdit"
      :referrer-details="event?.referrer_details"
      :organizer-email="event?.organizer_details?.email"
      @referrer-updated="handleReferrerUpdated"
    />

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4 sm:p-5 min-w-0"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-xl sm:text-2xl font-bold text-slate-900 truncate">
              {{ confirmedPaymentsCount }}
            </p>
            <p class="text-xs sm:text-sm text-slate-600 mt-1">Confirmed</p>
          </div>
          <div
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"
          >
            <CreditCard class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4 sm:p-5 min-w-0"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-xl sm:text-2xl font-bold text-slate-900 truncate">
              {{ pendingPaymentsCount }}
            </p>
            <p class="text-xs sm:text-sm text-slate-600 mt-1">Pending</p>
          </div>
          <div
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"
          >
            <Clock class="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4 sm:p-5 min-w-0"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-lg sm:text-2xl font-semibold text-slate-900 truncate">
              ${{ totalAmount }}
            </p>
            <p class="text-xs sm:text-sm text-slate-600 mt-1">Total Value</p>
          </div>
          <div
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#B0E0E6] flex items-center justify-center flex-shrink-0"
          >
            <DollarSign class="w-5 h-5 sm:w-6 sm:h-6 text-[#1e90ff]" />
          </div>
        </div>
      </div>

      <div
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4 sm:p-5 min-w-0"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-xl sm:text-2xl font-bold text-slate-900 truncate">
              {{ activePackage ? '1' : '0' }}
            </p>
            <p class="text-xs sm:text-sm text-slate-600 mt-1">Active</p>
          </div>
          <div
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"
          >
            <Package class="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Existing Payments -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
      <h3 class="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center">
        <History class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
        Payment History
      </h3>

      <div v-if="loadingPayments" class="text-center py-6 sm:py-8">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff] mx-auto"></div>
        <p class="text-xs sm:text-sm text-slate-600 mt-2">Loading payment history...</p>
      </div>

      <div v-else-if="existingPayments.length === 0 && !loadingPayments" class="text-center py-6 sm:py-8">
        <History class="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
        <p class="text-xs sm:text-sm text-slate-500">No payments found for this event.</p>
      </div>

      <div v-else-if="existingPayments.length > 0" class="space-y-3 sm:space-y-4">
        <div
          v-for="payment in existingPayments"
          :key="payment.id"
          class="p-3 sm:p-4 bg-slate-50/50 rounded-xl sm:rounded-2xl hover:bg-slate-100/50 transition-colors duration-200"
        >
          <div class="flex items-center justify-between mb-2 sm:mb-3 gap-2">
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-slate-900 text-sm sm:text-base truncate">{{ payment.plan_name }}</h4>
              <p class="text-xs sm:text-sm text-slate-600">{{ formatDate(payment.created_at) }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-base sm:text-lg font-bold text-slate-900">${{ payment.amount }}</p>
              <span
                class="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium"
                :class="getStatusBadgeClass(payment.status)"
              >
                {{ getStatusDisplay(payment.status) }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <p class="text-slate-600 truncate">
              <span class="font-medium">Reference:</span> {{ payment.transaction_reference }}
            </p>
            <p class="text-slate-600 truncate">
              <span class="font-medium">Method:</span> {{ payment.payment_method_name }}
            </p>
            <p v-if="payment.template_name" class="text-slate-600 sm:col-span-2 truncate">
              <span class="font-medium">Template:</span> {{ payment.template_name }}
            </p>
          </div>

          <!-- Update Payment (if pending) -->
          <div v-if="payment.status === 'pending'" class="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200">
            <button
              @click="startUpdatePayment(payment)"
              class="text-[#1e90ff] hover:text-[#1873cc] text-xs sm:text-sm font-medium inline-flex items-center"
            >
              <Pencil class="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
              <span class="hidden sm:inline">Update Payment Details</span>
              <span class="sm:hidden">Update Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showPaymentModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          @click="closePaymentModal"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
            @click.stop
          >
            <!-- Step 1: Payment Summary & Method Selection -->
            <div v-if="paymentStep === 1" class="flex flex-col h-full overflow-hidden">
              <!-- Header -->
              <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 py-4 sm:px-8 sm:py-6 text-white flex-shrink-0">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div
                      class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <CreditCard class="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div class="min-w-0">
                      <h2 class="text-lg sm:text-2xl font-bold truncate">Make Payment</h2>
                      <p class="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">{{ templateName }}</p>
                    </div>
                  </div>
                  <button
                    @click="closePaymentModal"
                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0 ml-2"
                  >
                    <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              <!-- Content -->
              <div class="p-4 sm:p-8 overflow-y-auto flex-1">
                <!-- Current Payment Status (if exists) -->
                <div
                  v-if="currentPayment"
                  class="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-50/50 rounded-lg sm:rounded-xl border border-slate-200/50 backdrop-blur-sm"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-xs sm:text-sm font-medium text-slate-700">Current Payment</p>
                      <p class="text-[10px] sm:text-xs text-slate-500 truncate">{{ currentPayment.plan_name }}</p>
                    </div>
                    <span
                      class="inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0"
                      :class="getStatusBadgeClass(currentPayment.status)"
                    >
                      {{ getStatusDisplay(currentPayment.status) }}
                    </span>
                  </div>
                </div>

                <!-- Amount Display -->
                <div
                  class="text-center mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-[#E6F4FF] to-indigo-50 rounded-lg sm:rounded-xl"
                >
                  <p class="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">Amount to Pay</p>
                  <p class="text-2xl sm:text-3xl font-bold text-slate-900">
                    ${{ templatePackageDetails?.price || '0.00' }}
                  </p>
                  <p class="text-xs sm:text-sm text-slate-500 mt-1 truncate">
                    {{ templatePackageDetails?.name || 'Standard Package' }}
                  </p>
                </div>

                <!-- Payment Methods -->
                <div class="mb-4 sm:mb-6">
                  <p class="text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Choose Payment Method</p>

                  <div v-if="loadingMethods" class="text-center py-6 sm:py-8">
                    <div
                      class="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-[#1e90ff] mx-auto"
                    ></div>
                    <p class="text-slate-500 mt-2 text-xs sm:text-sm">Loading...</p>
                  </div>

                  <div v-else-if="paymentMethods.length > 0" class="space-y-2">
                    <div
                      v-for="method in paymentMethods"
                      :key="method.id"
                      class="p-3 sm:p-4 rounded-lg sm:rounded-xl border cursor-pointer transition-all duration-200"
                      :class="{
                        'border-[#1e90ff] bg-[#E6F4FF]/50 backdrop-blur-sm':
                          selectedMethod?.id === method.id,
                        'border-slate-200 hover:border-slate-300 bg-white/50':
                          selectedMethod?.id !== method.id,
                      }"
                      @click="selectMethod(method)"
                    >
                      <div class="flex items-center gap-2 sm:gap-3">
                        <input
                          type="radio"
                          :checked="selectedMethod?.id === method.id"
                          class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#1e90ff] flex-shrink-0"
                          readonly
                        />
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-slate-900 text-xs sm:text-sm truncate">{{ method.name }}</p>
                          <p class="text-[10px] sm:text-xs text-slate-500 truncate">{{ method.payment_type_display }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="text-center py-4 sm:py-6">
                    <p class="text-slate-500 text-xs sm:text-sm">No payment methods available</p>
                  </div>
                </div>

                <!-- Continue Button -->
                <button
                  @click="nextStep"
                  :disabled="!selectedMethod"
                  class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 text-sm sm:text-base"
                >
                  Continue
                </button>
              </div>
            </div>

            <!-- Step 2: Payment Instructions -->
            <div v-if="paymentStep === 2" class="flex flex-col h-full overflow-hidden">
              <!-- Header -->
              <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-4 sm:px-8 sm:py-6 text-white flex-shrink-0">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <button
                      @click="previousStep"
                      class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0"
                    >
                      <ChevronLeft class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <div
                      class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <FileSignature class="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div class="min-w-0">
                      <h2 class="text-lg sm:text-2xl font-bold truncate">Payment Instructions</h2>
                      <p class="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">{{ selectedMethod?.name }}</p>
                    </div>
                  </div>
                  <button
                    @click="closePaymentModal"
                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0 ml-2"
                  >
                    <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              <!-- Content -->
              <div class="p-4 sm:p-8 overflow-y-auto flex-1">
                <!-- Amount Reminder -->
                <div class="text-center mb-4 sm:mb-6 p-3 sm:p-4 bg-[#E6F4FF] rounded-lg sm:rounded-xl">
                  <p class="text-xs sm:text-sm text-[#1873cc] mb-1">Transfer Amount</p>
                  <p class="text-xl sm:text-2xl font-bold text-[#1873cc]">
                    ${{ templatePackageDetails?.price }}
                  </p>
                </div>

                <!-- Payment Details -->
                <div v-if="selectedMethod" class="mb-4 sm:mb-6">
                  <div
                    v-if="selectedMethod.bank_name || selectedMethod.account_number"
                    class="mb-3 sm:mb-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl"
                  >
                    <p class="text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Payment Details</p>
                    <div class="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                      <p v-if="selectedMethod.bank_name" class="text-slate-600 truncate">
                        <span class="font-medium">Bank:</span> {{ selectedMethod.bank_name }}
                      </p>
                      <p v-if="selectedMethod.account_number" class="text-slate-600 truncate">
                        <span class="font-medium">Account:</span>
                        {{ selectedMethod.account_number }}
                      </p>
                      <p v-if="selectedMethod.account_name" class="text-slate-600 truncate">
                        <span class="font-medium">Name:</span> {{ selectedMethod.account_name }}
                      </p>
                    </div>
                  </div>

                  <!-- QR Code -->
                  <div v-if="selectedMethod.qr_code_image" class="text-center mb-3 sm:mb-4">
                    <div class="inline-block p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm border">
                      <img
                        :src="selectedMethod.qr_code_image"
                        :alt="`QR Code for ${selectedMethod.name}`"
                        class="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto"
                        loading="lazy"
                        @error="handleImageError"
                      />
                    </div>
                    <p class="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2">Scan with your banking app</p>
                  </div>

                  <!-- Payment Link -->
                  <div v-if="selectedMethod.payment_link" class="mb-3 sm:mb-4">
                    <button
                      @click="openPaymentLink(selectedMethod.payment_link)"
                      class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center text-sm sm:text-base"
                    >
                      <ExternalLink class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      <span class="hidden sm:inline">Open {{ selectedMethod.name }}</span>
                      <span class="sm:hidden">Open Payment Link</span>
                    </button>
                  </div>
                </div>

                <!-- Next Step Button -->
                <button
                  @click="nextStep"
                  class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 text-sm sm:text-base"
                >
                  I've Made the Payment
                </button>
              </div>
            </div>

            <!-- Step 3: Upload Proof -->
            <div v-if="paymentStep === 3" class="flex flex-col h-full overflow-hidden">
              <!-- Header -->
              <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 py-4 sm:px-8 sm:py-6 text-white flex-shrink-0">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <button
                      @click="previousStep"
                      class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0"
                    >
                      <ChevronLeft class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <div
                      class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <CheckCircle class="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div class="min-w-0">
                      <h2 class="text-lg sm:text-2xl font-bold truncate">Upload Receipt</h2>
                      <p class="text-white/80 text-xs sm:text-sm mt-0.5 sm:mt-1">Almost done!</p>
                    </div>
                  </div>
                  <button
                    @click="closePaymentModal"
                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0 ml-2"
                  >
                    <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              <!-- Content -->
              <div class="p-4 sm:p-8 overflow-y-auto flex-1">
                <!-- Form -->
                <form @submit.prevent="submitPaymentWithSync" class="space-y-4 sm:space-y-6">
                  <!-- Transaction Reference -->
                  <div>
                    <label
                      for="transactionRef"
                      class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2"
                    >
                      Transaction Reference <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="transactionRef"
                      v-model="paymentForm.transaction_reference"
                      type="text"
                      required
                      class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                      placeholder="Enter transaction ID"
                    />
                    <p class="text-[10px] sm:text-xs text-slate-500 mt-1">From your payment confirmation</p>
                  </div>

                  <!-- File Upload -->
                  <div>
                    <label for="paymentProof" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                      Payment Receipt <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <input
                        id="paymentProof"
                        ref="fileInput"
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                        @change="handleFileSelect"
                        class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-3 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-[#E6F4FF] file:text-[#1873cc] text-xs sm:text-base"
                      />
                      <p class="text-[10px] sm:text-xs text-slate-500 mt-1">JPG, PNG, PDF (Max 10MB)</p>
                    </div>
                  </div>

                  <!-- Notes (Optional) -->
                  <div>
                    <label for="paymentNotes" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                      Notes <span class="text-slate-400">(Optional)</span>
                    </label>
                    <textarea
                      id="paymentNotes"
                      v-model="paymentForm.user_notes"
                      rows="2"
                      class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none text-sm sm:text-base"
                      placeholder="Any additional notes..."
                    ></textarea>
                  </div>

                  <!-- Submit Button -->
                  <button
                    type="submit"
                    :disabled="submittingPayment || !isFormValid"
                    class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 inline-flex items-center justify-center text-sm sm:text-base"
                  >
                    <span v-if="submittingPayment" class="flex items-center">
                      <div
                        class="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"
                      ></div>
                      Submitting...
                    </span>
                    <span v-else class="flex items-center">
                      <CheckCircle class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Submit Payment
                    </span>
                  </button>
                </form>
              </div>
            </div>

            <!-- Step Indicator -->
            <div class="px-4 pb-4 sm:px-8 sm:pb-6 flex-shrink-0">
              <div class="flex items-center justify-center space-x-1.5 sm:space-x-2">
                <div
                  v-for="step in 3"
                  :key="step"
                  class="w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200"
                  :class="
                    step <= paymentStep
                      ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]'
                      : 'bg-slate-300'
                  "
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Update Payment Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showUpdateModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
                    Transaction Reference <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="updateForm.transaction_reference"
                    type="text"
                    required
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm text-sm sm:text-base"
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
      <div v-if="message" class="fixed bottom-8 right-8 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  CreditCard,
  Clock,
  DollarSign,
  Package,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  ExternalLink,
  FileSignature,
  History,
  Pencil,
  ChevronLeft,
} from 'lucide-vue-next'
import { apiService } from '../services/api'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useNotifications } from '../composables/useNotifications'
import EventReferrerSection from './EventReferrerSection.vue'

// Define emits
const emit = defineEmits<{
  'tab-change': [tabId: string]
  'event-updated': [event: Event]
}>()

// Proper TypeScript interfaces
interface Props {
  eventId: string
  canEdit?: boolean
  event?: Event
}

interface Event {
  id: string
  event_template?: number | null
  event_template_details?: {
    name: string
    package_plan: {
      id: number
      name: string
      description: string
      price: string
      features: string[]
    }
  } | null
  event_template_enabled?: boolean
  referrer?: number | null
  referrer_details?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  } | null
  organizer_details?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    profile_picture?: string | null
  } | null
}

interface PaymentMethod {
  readonly id: number
  readonly name: string
  readonly payment_type: string
  readonly payment_type_display: string
  readonly bank_name: string
  readonly account_number: string
  readonly account_name: string
  readonly qr_code_image: string | null
  readonly payment_link: string
  readonly currency: string
  readonly is_active: boolean
}

interface Payment {
  readonly id: string
  readonly payment_reference: string
  readonly user_email: string
  readonly event: string
  readonly event_title: string
  readonly template_name: string | null
  readonly plan_name: string
  readonly payment_method_name: string
  readonly amount: string
  readonly original_price: string
  readonly discount_amount: string
  readonly currency: string
  readonly status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'refunded'
  readonly status_display: string
  readonly transaction_reference: string
  readonly created_at: string
  readonly is_confirmed: boolean
  readonly is_upgrade: boolean
  readonly payment_proof?: string
  readonly user_notes?: string
  readonly updated_at?: string
}

interface PaymentFormData {
  transaction_reference: string
  user_notes: string
  payment_proof: File | null
}

interface UpdateFormData {
  transaction_reference: string
  user_notes: string
  payment_proof: File | null
}

const props = defineProps<Props>()

// API service is imported as singleton

// Use composables
const {
  payments: existingPayments,
  loadingPayments,
  refreshPayments,
  loadPayments: loadExistingPayments,
} = usePaymentTemplateIntegration(props.event as Event)

const { success: showSuccess, error: showError } = useNotifications()

// Local component state
const paymentMethods = ref<readonly PaymentMethod[]>([])
const selectedMethod = ref<PaymentMethod | null>(null)

// Loading states
const loadingMethods = ref(false)
const submittingPayment = ref(false)
const updatingPayment = ref(false)

// Error states
const error = ref<string | null>(null)

// Forms with proper typing
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

// Update modal
const showUpdateModal = ref(false)
const paymentToUpdate = ref<Payment | null>(null)

// Payment modal
const showPaymentModal = ref(false)
const paymentStep = ref(1)

// Message state
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// File inputs with proper refs
const fileInput = ref<HTMLInputElement | null>(null)
const updateFileInput = ref<HTMLInputElement | null>(null)

// AbortController for request cancellation
let abortController: AbortController | null = null

// Computed properties with proper typing and memoization
const currentPayment = computed(() => {
  return (
    existingPayments.value.find((p) => p.status === 'confirmed' || p.status === 'pending') || null
  )
})

const hasSelectedTemplate = computed(() => {
  return Boolean(props.event?.event_template)
})

// Memoized getters to prevent unnecessary re-renders
const templateName = computed(() => {
  if (props.event?.event_template_details?.name) {
    return props.event.event_template_details.name
  }
  return props.event?.event_template ? `Template ID: ${props.event.event_template}` : ''
})

const templatePackageDetails = computed(() => {
  return props.event?.event_template_details?.package_plan || null
})

const isFormValid = computed(() => {
  return Boolean(
    selectedMethod.value &&
      paymentForm.value.transaction_reference.trim() &&
      paymentForm.value.payment_proof &&
      templatePackageDetails.value,
  )
})

// Stats computed properties
const confirmedPaymentsCount = computed(
  () => existingPayments.value.filter((p) => p.status === 'confirmed').length,
)

const pendingPaymentsCount = computed(
  () => existingPayments.value.filter((p) => p.status === 'pending').length,
)

const totalAmount = computed(() =>
  existingPayments.value
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)
    .toFixed(2),
)

const activePackage = computed(() => currentPayment.value?.status === 'confirmed')

// Input sanitization helper
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

const redirectToTemplateTab = () => {
  emit('tab-change', 'template')
}

const closePaymentModal = () => {
  showPaymentModal.value = false
  paymentStep.value = 1
  // Reset form when closing modal
  paymentForm.value = {
    transaction_reference: '',
    user_notes: '',
    payment_proof: null,
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  error.value = null
}

const nextStep = () => {
  if (paymentStep.value < 3) {
    paymentStep.value++
  }
}

const previousStep = () => {
  if (paymentStep.value > 1) {
    paymentStep.value--
  }
}

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
  const maxSize = 10 * 1024 * 1024 // 10MB
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

const loadPaymentMethods = async (): Promise<void> => {
  if (loadingMethods.value) return

  // Cancel previous request if still pending
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

// Enhanced payment submission with better state synchronization
const submitPaymentWithSync = async (): Promise<void> => {
  await submitPayment()

  // Force refresh the payment integration state after successful submission
  if (!error.value) {
    await refreshPayments()
    // Close payment modal on successful submission
    closePaymentModal()
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

  // Validate URL format for security
  try {
    const url = new URL(paymentLink)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      console.warn('Invalid protocol in payment link')
      return
    }
    window.open(paymentLink, '_blank', 'noopener,noreferrer')
  } catch (err) {
    console.error('Invalid payment link format:', err)
  }
}

const handleImageError = (event: globalThis.Event): void => {
  const img = event.target as HTMLImageElement
  if (img?.src) {
    console.error('Failed to load QR code image:', img.src)
    // Hide the broken image
    img.style.display = 'none'
  }
}

const handleFileSelect = (event: globalThis.Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null

  if (file) {
    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      showMessage('error', validationError)
      target.value = '' // Clear the input
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
      target.value = '' // Clear the input
      return
    }
  }

  updateForm.value.payment_proof = file
  error.value = null
}

const submitPayment = async (): Promise<void> => {
  if (submittingPayment.value) return

  // Validate form data
  const templatePackage = templatePackageDetails.value
  if (!isFormValid.value || !templatePackage) {
    error.value = 'Please fill in all required fields including payment proof.'
    showMessage('error', 'Please fill in all required fields')
    return
  }

  // Validate transaction reference
  const transactionRefError = validateTransactionReference(paymentForm.value.transaction_reference)
  if (transactionRefError) {
    error.value = transactionRefError
    showMessage('error', transactionRefError)
    return
  }

  // Validate file
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

    // Sanitize and validate all form inputs
    formData.append('event', sanitizeInput(props.eventId))
    formData.append('pricing_plan', templatePackage.id.toString())
    formData.append('payment_method', selectedMethod.value!.id.toString())
    formData.append('amount', templatePackage.price)
    formData.append('original_price', templatePackage.price)
    formData.append('transaction_reference', sanitizeInput(paymentForm.value.transaction_reference))
    formData.append('user_notes', sanitizeInput(paymentForm.value.user_notes))
    formData.append('payment_proof', paymentForm.value.payment_proof!)

    // Include event_template if available
    if (props.event?.event_template) {
      formData.append('event_template', props.event.event_template.toString())
    }

    const response = await apiService.postFormData<Payment>('/api/payment/payments/', formData)

    if (!response.success) {
      throw new Error(response.message || 'Failed to submit payment')
    }

    // Reset form securely
    paymentForm.value = {
      transaction_reference: '',
      user_notes: '',
      payment_proof: null,
    }

    // Clear file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }

    // Refresh payments with composable
    await refreshPayments()

    showSuccess(
      'Payment Submitted',
      'Your payment has been submitted successfully and is pending review.',
    )
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

  // Validate transaction reference
  const transactionRefError = validateTransactionReference(updateForm.value.transaction_reference)
  if (transactionRefError) {
    error.value = transactionRefError
    showMessage('error', transactionRefError)
    return
  }

  // Validate file if provided
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
    formData.append('transaction_reference', sanitizeInput(updateForm.value.transaction_reference))
    formData.append('user_notes', sanitizeInput(updateForm.value.user_notes))

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const handleReferrerUpdated = (updatedEvent: unknown) => {
  // Update the event data with the new referrer information
  console.log('handleReferrerUpdated called with:', updatedEvent)

  if (props.event && updatedEvent && typeof updatedEvent === 'object') {
    const eventData = updatedEvent as Event
    console.log('Emitting event-updated with:', eventData)
    // Emit the updated event to parent component
    emit('event-updated', eventData)
  }
}

// Watchers for reactive updates
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

watch(
  () => props.eventId,
  (newEventId, oldEventId) => {
    if (newEventId && newEventId !== oldEventId) {
      loadExistingPayments()
    }
  },
  { immediate: true },
)

// Cleanup function
onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})

// Lifecycle
onMounted(async () => {
  await nextTick() // Ensure DOM is ready
  await loadExistingPayments()

  if (hasSelectedTemplate.value) {
    await loadPaymentMethods()
  }
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
