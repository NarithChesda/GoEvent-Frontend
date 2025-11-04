<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal Content -->
        <div
          class="relative bg-white w-full sm:max-w-3xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          @click.stop
        >
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between z-10">
            <div class="flex-1 pr-4">
              <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                {{ position.title }}
              </h2>
              <div class="flex flex-wrap gap-3">
                <span class="inline-flex items-center gap-1 text-sm font-medium text-slate-600">
                  <Briefcase class="w-4 h-4" />
                  {{ position.department.name }}
                </span>
                <span class="inline-flex items-center gap-1 text-sm font-medium text-slate-600">
                  <MapPin class="w-4 h-4" />
                  {{ position.location }}
                </span>
                <span class="inline-flex items-center gap-1 text-sm font-medium text-slate-600">
                  <Clock class="w-4 h-4" />
                  {{ position.employment_type_display }}
                </span>
              </div>
            </div>
            <button
              @click="$emit('close')"
              class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              <X class="w-6 h-6" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Featured Badge -->
            <div v-if="position.featured" class="inline-block">
              <span class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-bold px-4 py-2 rounded-full">
                FEATURED POSITION
              </span>
            </div>

            <!-- Description -->
            <div v-if="position.description">
              <h3 class="text-lg font-bold text-slate-900 mb-3">About the Role</h3>
              <div class="prose prose-slate max-w-none text-slate-600" v-html="sanitizedDescription"></div>
            </div>

            <!-- Responsibilities -->
            <div v-if="position.responsibilities">
              <h3 class="text-lg font-bold text-slate-900 mb-3">Responsibilities</h3>
              <div class="prose prose-slate max-w-none text-slate-600" v-html="sanitizedResponsibilities"></div>
            </div>

            <!-- Requirements -->
            <div v-if="position.requirements">
              <h3 class="text-lg font-bold text-slate-900 mb-3">Requirements</h3>
              <div class="prose prose-slate max-w-none text-slate-600" v-html="sanitizedRequirements"></div>
            </div>

            <!-- Nice to Have -->
            <div v-if="position.nice_to_have">
              <h3 class="text-lg font-bold text-slate-900 mb-3">Nice to Have</h3>
              <div class="prose prose-slate max-w-none text-slate-600" v-html="sanitizedNiceToHave"></div>
            </div>

            <!-- Salary Range -->
            <div v-if="position.salary_range_min && position.salary_range_max" class="bg-emerald-50 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <DollarSign class="w-5 h-5 text-emerald-600" />
                <h3 class="text-lg font-bold text-slate-900">Salary Range</h3>
              </div>
              <p class="text-emerald-700 font-semibold text-xl">
                {{ position.salary_currency }} {{ position.salary_range_min }} - {{ position.salary_range_max }}
              </p>
            </div>

            <!-- Benefits -->
            <div v-if="position.benefits">
              <h3 class="text-lg font-bold text-slate-900 mb-3">Benefits</h3>
              <div class="prose prose-slate max-w-none text-slate-600" v-html="sanitizedBenefits"></div>
            </div>

            <!-- Application Deadline -->
            <div v-if="position.application_deadline" class="bg-sky-50 rounded-xl p-4">
              <div class="flex items-center gap-2">
                <Calendar class="w-5 h-5 text-sky-600" />
                <span class="font-semibold text-slate-900">Application Deadline:</span>
                <span class="text-slate-600">{{ formatDate(position.application_deadline) }}</span>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-50 rounded-xl p-4">
                <div class="text-2xl font-bold text-[#1e90ff] mb-1">{{ position.applications_count }}</div>
                <div class="text-sm text-slate-600">Applications</div>
              </div>
              <div class="bg-slate-50 rounded-xl p-4">
                <div class="text-2xl font-bold text-emerald-600 mb-1">{{ position.views_count }}</div>
                <div class="text-sm text-slate-600">Views</div>
              </div>
            </div>
          </div>

          <!-- Footer with Apply Button -->
          <div class="sticky bottom-0 bg-white border-t border-slate-200 p-6">
            <button
              @click="$emit('apply', position.slug)"
              class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all text-base"
            >
              Apply for this Position
            </button>
            <p class="text-center text-xs text-slate-500 mt-3">
              You will be redirected to our application form
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X, Briefcase, MapPin, Clock, DollarSign, Calendar } from 'lucide-vue-next'
import DOMPurify from 'dompurify'
import type { CareerPosition } from '@/services/api'

interface Props {
  position: CareerPosition
  open: boolean
}

const props = defineProps<Props>()

defineEmits<{
  close: []
  apply: [positionSlug: string]
}>()

const sanitizeContent = (content: string | null | undefined) => {
  if (!content) return ''
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h3', 'h4'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

const sanitizedDescription = computed(() => sanitizeContent(props.position.description))
const sanitizedResponsibilities = computed(() => sanitizeContent(props.position.responsibilities))
const sanitizedRequirements = computed(() => sanitizeContent(props.position.requirements))
const sanitizedNiceToHave = computed(() => sanitizeContent(props.position.nice_to_have))
const sanitizedBenefits = computed(() => sanitizeContent(props.position.benefits))

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative {
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .modal-enter-from .relative {
    transform: scale(0.95);
  }

  .modal-leave-to .relative {
    transform: scale(0.95);
  }
}

.modal-leave-to .relative {
  transform: translateY(100%);
}

.prose {
  color: inherit;
}

.prose p {
  margin-bottom: 0.75rem;
}

.prose ul,
.prose ol {
  margin-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.prose li {
  margin-bottom: 0.5rem;
}

.prose strong {
  font-weight: 600;
  color: #0f172a;
}

.prose a {
  color: #1e90ff;
  text-decoration: underline;
}

.prose a:hover {
  color: #1873cc;
}
</style>
