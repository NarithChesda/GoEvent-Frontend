<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Payment Management
        </h2>
        <p class="text-sm text-slate-600 mt-1">
          Manage payment packages and transactions for your event
        </p>
      </div>
    </div>

    <!-- Template-Based Package Selection -->
    <div
      v-if="!hasSelectedTemplate"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center"
    >
      <FileText class="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-slate-900 mb-2">Select a Template First</h3>
      <p class="text-slate-600 mb-6 max-w-md mx-auto">
        You need to select an event template before you can view payment packages. Templates
        determine the available pricing plans for your event.
      </p>
      <button
        @click="redirectToTemplateTab"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 inline-flex items-center"
      >
        <FileText class="w-4 h-4 mr-2" />
        Select Template
      </button>
    </div>

    <!-- Template Selected - Show Template Pricing Info -->
    <div v-else-if="hasSelectedTemplate" class="space-y-6">
      <!-- Current Template Info -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
        <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <FileText class="w-5 h-5 text-blue-600 mr-2" />
          Selected Template Package
        </h3>
        <div
          class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200/50"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="font-semibold text-slate-900">{{ templateName }}</h4>
              <p class="text-sm text-slate-700">
                {{ templatePackageDetails?.name || 'Standard Package' }}
              </p>
            </div>
            <div class="text-right">
              <span class="text-2xl font-bold text-slate-900"
                >${{ templatePackageDetails?.price || '0.00' }}</span
              >
              <p class="text-xs text-slate-600">USD</p>
            </div>
          </div>

          <!-- Package Features -->
          <div
            v-if="templatePackageDetails?.features && templatePackageDetails.features.length > 0"
            class="mt-4 pt-4 border-t border-blue-200/50"
          >
            <p class="text-sm font-medium text-slate-800 mb-2">Included Features:</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="feature in templatePackageDetails.features"
                :key="feature"
                class="flex items-center text-sm text-slate-700"
              >
                <CheckCircle class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                {{ feature }}
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Action Button -->
        <div class="mt-6 text-center">
          <button
            @click="showPaymentModal = true"
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-blue-500/25 hover:shadow-blue-600/30 inline-flex items-center text-lg"
          >
            <CreditCard class="w-6 h-6 mr-3" />
            {{ currentPayment ? 'Make New Payment' : 'Make Payment' }}
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
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"
          >
            <DollarSign class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
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
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
      <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center">
        <History class="w-5 h-5 text-blue-600 mr-2" />
        Payment History
      </h3>

      <div v-if="loadingPayments" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-slate-600 mt-2">Loading payment history...</p>
      </div>

      <div v-else-if="existingPayments.length === 0 && !loadingPayments" class="text-center py-8">
        <History class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-slate-500">No payments found for this event.</p>
      </div>

      <div v-else-if="existingPayments.length > 0" class="space-y-4">
        <div
          v-for="payment in existingPayments"
          :key="payment.id"
          class="p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-100/50 transition-colors duration-200"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="font-semibold text-slate-900">{{ payment.plan_name }}</h4>
              <p class="text-sm text-slate-600">{{ formatDate(payment.created_at) }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-slate-900">${{ payment.amount }}</p>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                :class="getStatusBadgeClass(payment.status)"
              >
                {{ getStatusDisplay(payment.status) }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <p class="text-slate-600">
              <span class="font-medium">Reference:</span> {{ payment.transaction_reference }}
            </p>
            <p class="text-slate-600">
              <span class="font-medium">Method:</span> {{ payment.payment_method_name }}
            </p>
            <p v-if="payment.template_name" class="text-slate-600 sm:col-span-2">
              <span class="font-medium">Template:</span> {{ payment.template_name }}
            </p>
          </div>

          <!-- Update Payment (if pending) -->
          <div v-if="payment.status === 'pending'" class="mt-3 pt-3 border-t border-slate-200">
            <button
              @click="startUpdatePayment(payment)"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
            >
              <Pencil class="w-3 h-3 mr-1" />
              Update Payment Details
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
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click="closePaymentModal"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            @click.stop
          >
            <!-- Step 1: Payment Summary & Method Selection -->
            <div v-if="paymentStep === 1">
              <!-- Header -->
              <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                    >
                      <CreditCard class="w-5 h-5" />
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold">Make Payment</h2>
                      <p class="text-white/80 text-sm mt-1">{{ templateName }}</p>
                    </div>
                  </div>
                  <button
                    @click="closePaymentModal"
                    class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Content -->
              <div class="p-8">
                <!-- Current Payment Status (if exists) -->
                <div
                  v-if="currentPayment"
                  class="mb-6 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 backdrop-blur-sm"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-slate-700">Current Payment</p>
                      <p class="text-xs text-slate-500">{{ currentPayment.plan_name }}</p>
                    </div>
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      :class="getStatusBadgeClass(currentPayment.status)"
                    >
                      {{ getStatusDisplay(currentPayment.status) }}
                    </span>
                  </div>
                </div>

                <!-- Amount Display -->
                <div
                  class="text-center mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl"
                >
                  <p class="text-sm text-slate-600 mb-2">Amount to Pay</p>
                  <p class="text-3xl font-bold text-slate-900">
                    ${{ templatePackageDetails?.price || '0.00' }}
                  </p>
                  <p class="text-sm text-slate-500 mt-1">
                    {{ templatePackageDetails?.name || 'Standard Package' }}
                  </p>
                </div>

                <!-- Payment Methods -->
                <div class="mb-6">
                  <p class="text-sm font-medium text-slate-700 mb-3">Choose Payment Method</p>

                  <div v-if="loadingMethods" class="text-center py-8">
                    <div
                      class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"
                    ></div>
                    <p class="text-slate-500 mt-2 text-sm">Loading...</p>
                  </div>

                  <div v-else-if="paymentMethods.length > 0" class="space-y-2">
                    <div
                      v-for="method in paymentMethods"
                      :key="method.id"
                      class="p-4 rounded-xl border cursor-pointer transition-all duration-200"
                      :class="{
                        'border-blue-500 bg-blue-50/50 backdrop-blur-sm':
                          selectedMethod?.id === method.id,
                        'border-slate-200 hover:border-slate-300 bg-white/50':
                          selectedMethod?.id !== method.id,
                      }"
                      @click="selectMethod(method)"
                    >
                      <div class="flex items-center">
                        <input
                          type="radio"
                          :checked="selectedMethod?.id === method.id"
                          class="h-4 w-4 text-blue-600 mr-3"
                          readonly
                        />
                        <div class="flex-1">
                          <p class="font-medium text-slate-900 text-sm">{{ method.name }}</p>
                          <p class="text-xs text-slate-500">{{ method.payment_type_display }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="text-center py-6">
                    <p class="text-slate-500 text-sm">No payment methods available</p>
                  </div>
                </div>

                <!-- Continue Button -->
                <button
                  @click="nextStep"
                  :disabled="!selectedMethod"
                  class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                >
                  Continue
                </button>
              </div>
            </div>

            <!-- Step 2: Payment Instructions -->
            <div v-if="paymentStep === 2">
              <!-- Header -->
              <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-white">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <button
                      @click="previousStep"
                      class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 mr-2"
                    >
                      <ChevronLeft class="w-4 h-4" />
                    </button>
                    <div
                      class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                    >
                      <FileSignature class="w-5 h-5" />
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold">Payment Instructions</h2>
                      <p class="text-white/80 text-sm mt-1">{{ selectedMethod?.name }}</p>
                    </div>
                  </div>
                  <button
                    @click="closePaymentModal"
                    class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Content -->
              <div class="p-8">
                <!-- Amount Reminder -->
                <div class="text-center mb-6 p-4 bg-blue-50 rounded-xl">
                  <p class="text-sm text-blue-700 mb-1">Transfer Amount</p>
                  <p class="text-2xl font-bold text-blue-900">
                    ${{ templatePackageDetails?.price }}
                  </p>
                </div>

                <!-- Payment Details -->
                <div v-if="selectedMethod" class="mb-6">
                  <div
                    v-if="selectedMethod.bank_name || selectedMethod.account_number"
                    class="mb-4 p-4 bg-slate-50 rounded-xl"
                  >
                    <p class="text-sm font-medium text-slate-700 mb-2">Payment Details</p>
                    <div class="space-y-1 text-sm">
                      <p v-if="selectedMethod.bank_name" class="text-slate-600">
                        <span class="font-medium">Bank:</span> {{ selectedMethod.bank_name }}
                      </p>
                      <p v-if="selectedMethod.account_number" class="text-slate-600">
                        <span class="font-medium">Account:</span>
                        {{ selectedMethod.account_number }}
                      </p>
                      <p v-if="selectedMethod.account_name" class="text-slate-600">
                        <span class="font-medium">Name:</span> {{ selectedMethod.account_name }}
                      </p>
                    </div>
                  </div>

                  <!-- QR Code -->
                  <div v-if="selectedMethod.qr_code_image" class="text-center mb-4">
                    <div class="inline-block p-4 bg-white rounded-xl shadow-sm border">
                      <img
                        :src="selectedMethod.qr_code_image"
                        :alt="`QR Code for ${selectedMethod.name}`"
                        class="w-32 h-32 object-contain mx-auto"
                        loading="lazy"
                        @error="handleImageError"
                      />
                    </div>
                    <p class="text-xs text-slate-500 mt-2">Scan with your banking app</p>
                  </div>

                  <!-- Payment Link -->
                  <div v-if="selectedMethod.payment_link" class="mb-4">
                    <button
                      @click="openPaymentLink(selectedMethod.payment_link)"
                      class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <ExternalLink class="w-4 h-4 mr-2" />
                      Open {{ selectedMethod.name }}
                    </button>
                  </div>
                </div>

                <!-- Next Step Button -->
                <button
                  @click="nextStep"
                  class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                >
                  I've Made the Payment
                </button>
              </div>
            </div>

            <!-- Step 3: Upload Proof -->
            <div v-if="paymentStep === 3">
              <!-- Header -->
              <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 text-white">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <button
                      @click="previousStep"
                      class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 mr-2"
                    >
                      <ChevronLeft class="w-4 h-4" />
                    </button>
                    <div
                      class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle class="w-5 h-5" />
                    </div>
                    <div>
                      <h2 class="text-2xl font-bold">Upload Receipt</h2>
                      <p class="text-white/80 text-sm mt-1">Almost done!</p>
                    </div>
                  </div>
                  <button
                    @click="closePaymentModal"
                    class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Content -->
              <div class="p-8">
                <!-- Form -->
                <form @submit.prevent="submitPaymentWithSync" class="space-y-6">
                  <!-- Transaction Reference -->
                  <div>
                    <label
                      for="transactionRef"
                      class="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Transaction Reference <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="transactionRef"
                      v-model="paymentForm.transaction_reference"
                      type="text"
                      required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      placeholder="Enter transaction ID"
                    />
                    <p class="text-xs text-slate-500 mt-1">From your payment confirmation</p>
                  </div>

                  <!-- File Upload -->
                  <div>
                    <label for="paymentProof" class="block text-sm font-medium text-slate-700 mb-2">
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700"
                      />
                      <p class="text-xs text-slate-500 mt-1">JPG, PNG, PDF (Max 10MB)</p>
                    </div>
                  </div>

                  <!-- Notes (Optional) -->
                  <div>
                    <label for="paymentNotes" class="block text-sm font-medium text-slate-700 mb-2">
                      Notes <span class="text-slate-400">(Optional)</span>
                    </label>
                    <textarea
                      id="paymentNotes"
                      v-model="paymentForm.user_notes"
                      rows="2"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                      placeholder="Any additional notes..."
                    ></textarea>
                  </div>

                  <!-- Submit Button -->
                  <button
                    type="submit"
                    :disabled="submittingPayment || !isFormValid"
                    class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 inline-flex items-center justify-center"
                  >
                    <span v-if="submittingPayment" class="flex items-center">
                      <div
                        class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                      ></div>
                      Submitting...
                    </span>
                    <span v-else class="flex items-center">
                      <CheckCircle class="w-4 h-4 mr-2" />
                      Submit Payment
                    </span>
                  </button>
                </form>
              </div>
            </div>

            <!-- Step Indicator -->
            <div class="px-8 pb-6">
              <div class="flex items-center justify-center space-x-2">
                <div
                  v-for="step in 3"
                  :key="step"
                  class="w-3 h-3 rounded-full transition-all duration-200"
                  :class="
                    step <= paymentStep
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600'
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
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click="cancelUpdate"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            @click.stop
          >
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Pencil class="w-5 h-5" />
                  </div>
                  <h2 class="text-2xl font-bold">Update Payment</h2>
                </div>
                <button
                  @click="cancelUpdate"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="p-8">
              <form @submit.prevent="updatePayment" class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Transaction Reference <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="updateForm.transaction_reference"
                    type="text"
                    required
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Payment Notes
                  </label>
                  <textarea
                    v-model="updateForm.user_notes"
                    rows="3"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Payment Proof <span class="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    ref="updateFileInput"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    @change="handleUpdateFileSelect"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div class="flex space-x-4 pt-6">
                  <button
                    type="button"
                    @click="cancelUpdate"
                    class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="updatingPayment"
                    class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
