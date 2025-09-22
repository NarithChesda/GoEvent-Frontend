<template>
  <div>
    <!-- Template Selected But Not Enabled (Preview Mode) -->
    <div
      v-if="showPreviewMode"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
    >
      <div class="relative">
        <!-- Preview Image -->
        <div v-if="selectedTemplate?.preview_image" class="relative h-48 overflow-hidden">
          <img
            :src="selectedTemplate.preview_image"
            :alt="selectedTemplate.name"
            class="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
          ></div>
          <div class="absolute bottom-4 left-6 right-6">
            <h3 class="text-xl font-bold text-white mb-2">{{ selectedTemplate.name }}</h3>
            <div class="flex items-center space-x-3">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
              >
                <Package class="w-3 h-3 mr-1" />
                {{ selectedTemplate.package_plan?.name || 'Standard Plan' }}
              </span>
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
              >
                <DollarSign class="w-3 h-3 mr-1" />
                ${{ selectedTemplate.package_plan?.price || '0.00' }}
              </span>
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-[#E6F4FF]0 text-white"
              >
                Preview Mode
              </span>
            </div>
          </div>
        </div>

        <!-- Template Details -->
        <div class="p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex-1">
              <p class="text-slate-600 mb-3">
                You've selected this template for your event. Complete payment to activate all
                features.
              </p>

              <!-- Features Preview -->
              <div v-if="selectedTemplate?.package_plan?.features" class="space-y-1">
                <h4 class="text-sm font-semibold text-slate-900 mb-2">Included Features:</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-1">
                  <div
                    v-for="(feature, index) in selectedTemplate.package_plan.features.slice(0, 4)"
                    :key="index"
                    class="flex items-center text-sm text-slate-700"
                  >
                    <CheckCircle class="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                    {{ feature }}
                  </div>
                </div>
                <p
                  v-if="selectedTemplate.package_plan.features.length > 4"
                  class="text-sm text-[#1e90ff] font-medium mt-2"
                >
                  +{{ selectedTemplate.package_plan.features.length - 4 }} more features
                </p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <button
                @click="$emit('change-template')"
                class="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 px-4 rounded-xl transition-all duration-200"
              >
                Change Template
              </button>
              <button
                @click="$emit('initiate-payment')"
                class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-green-500/25 hover:shadow-green-600/30"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Simple Template Selected (Fallback) -->
    <div
      v-else-if="showSimpleSelection"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6"
    >
      <div class="text-center">
        <div
          class="w-16 h-16 bg-[#B0E0E6] rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Package class="w-8 h-8 text-[#1e90ff]" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Template Selected</h3>
        <p class="text-slate-600 mb-4">
          A template has been selected for your event. Complete payment to enable advanced
          customization features.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            @click="$emit('change-template')"
            class="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 px-4 rounded-xl transition-all duration-200"
          >
            Change Template
          </button>
          <button
            @click="$emit('initiate-payment')"
            class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-green-500/25 hover:shadow-green-600/30"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>

    <!-- No Template Selected -->
    <div
      v-else-if="showNoTemplate"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center"
    >
      <div
        class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Palette class="w-10 h-10 text-slate-400" />
      </div>
      <h3 class="text-xl font-semibold text-slate-900 mb-3">No Template Selected</h3>
      <p class="text-slate-600 mb-6 max-w-md mx-auto">
        Choose from our collection of professional templates to enhance your event's visual appeal
        and user experience.
      </p>
      <button
        v-if="canEdit"
        @click="$emit('browse-templates')"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30"
      >
        Browse Templates
      </button>
    </div>

    <!-- Payment Status Cards -->
    <div v-if="showPaymentStatus">
      <!-- Payment Pending Status -->
      <div
        v-if="paymentStatus === 'pending'"
        class="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6"
      >
        <div class="flex items-start space-x-4">
          <div
            class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Clock class="w-6 h-6 text-yellow-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Payment Pending</h3>
            <p class="text-slate-700 mb-4">
              Your payment is being processed. We'll notify you once it's confirmed and your
              template is activated.
            </p>
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                @click="$emit('view-payment-details')"
                class="bg-white hover:bg-yellow-50 text-slate-700 border border-yellow-200 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                View Payment Details
              </button>
              <button
                @click="$emit('refresh-status')"
                class="text-yellow-700 hover:text-yellow-800 font-medium"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Failed Status -->
      <div
        v-else-if="paymentStatus === 'failed'"
        class="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6"
      >
        <div class="flex items-start space-x-4">
          <div
            class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <AlertCircle class="w-6 h-6 text-red-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Payment Failed</h3>
            <p class="text-slate-700 mb-4">
              There was an issue with your payment. Please try again or contact support for
              assistance.
            </p>
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                @click="$emit('retry-payment')"
                class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                @click="$emit('view-payment-details')"
                class="bg-white hover:bg-red-50 text-slate-700 border border-red-200 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Template Activated Status -->
      <div
        v-else-if="paymentStatus === 'confirmed'"
        class="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6"
      >
        <div class="flex items-start space-x-4">
          <div
            class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <CheckCircle class="w-6 h-6 text-green-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Template Activated!</h3>
            <p class="text-slate-700 mb-4">
              Your payment has been confirmed and your template is now active. All premium features
              are available.
            </p>
            <button
              @click="$emit('view-template-details')"
              class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              View Template Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Package, DollarSign, CheckCircle, Palette, Clock, AlertCircle } from 'lucide-vue-next'
import type { Event, EventTemplate } from '@/services/api'

interface Props {
  event: Event
  selectedTemplate?: EventTemplate | null
  canEdit: boolean
  paymentStatus?: string | null
}

const props = defineProps<Props>()

defineEmits<{
  'change-template': []
  'initiate-payment': []
  'browse-templates': []
  'view-payment-details': []
  'refresh-status': []
  'retry-payment': []
  'view-template-details': []
}>()

// Computed properties for showing different states
const showPreviewMode = computed(() => {
  return props.event.event_template && !props.event.event_template_enabled && props.selectedTemplate
})

const showSimpleSelection = computed(() => {
  return (
    props.event.event_template && !props.event.event_template_enabled && !props.selectedTemplate
  )
})

const showNoTemplate = computed(() => {
  return !props.event.event_template
})

const showPaymentStatus = computed(() => {
  return props.paymentStatus && ['pending', 'failed', 'confirmed'].includes(props.paymentStatus)
})
</script>
