<template>
  <div class="rounded-xl border border-slate-200 bg-white/70">
    <button
      type="button"
      class="w-full flex items-center justify-between px-4 py-3"
      @click="$emit('update:contact-open', !contactOpen)"
      :aria-expanded="contactOpen ? 'true' : 'false'"
      aria-controls="contact-section"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-slate-700">Contact & Social Media</span>
        <span class="hidden sm:inline text-xs text-slate-500">{{ contactSummary }}</span>
      </div>
      <svg
        class="h-4 w-4 text-slate-500 transition-transform"
        :class="contactOpen ? 'rotate-180' : ''"
        viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <Transition name="collapse">
      <div v-show="contactOpen" id="contact-section" class="px-4 pb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5"> Email </label>
            <input
              :value="email"
              @input="$emit('update:email', ($event.target as HTMLInputElement).value)"
              @blur="$emit('validate-email')"
              type="email"
              :aria-invalid="emailError ? 'true' : 'false'"
              :aria-describedby="emailError ? 'email-error' : undefined"
              :class="[
                'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2',
                emailError
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400',
                'bg-white/90'
              ]"
              placeholder="email@example.com"
            />
            <div v-if="emailError" id="email-error" role="alert" class="mt-1">
              <p class="text-xs text-red-600">{{ emailError }}</p>
            </div>
          </div>

          <!-- LinkedIn -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              LinkedIn URL
            </label>
            <input
              :value="linkedinUrl"
              @input="$emit('update:linkedin-url', ($event.target as HTMLInputElement).value)"
              type="url"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          <!-- Twitter -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              Twitter URL
            </label>
            <input
              :value="twitterUrl"
              @input="$emit('update:twitter-url', ($event.target as HTMLInputElement).value)"
              type="url"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
              placeholder="https://twitter.com/username"
            />
          </div>

          <!-- Website -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              Website URL
            </label>
            <input
              :value="websiteUrl"
              @input="$emit('update:website-url', ($event.target as HTMLInputElement).value)"
              type="url"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  email: string
  linkedinUrl: string
  twitterUrl: string
  websiteUrl: string
  contactOpen: boolean
  emailError: string
}

interface Emits {
  'update:email': [value: string]
  'update:linkedin-url': [value: string]
  'update:twitter-url': [value: string]
  'update:website-url': [value: string]
  'update:contact-open': [value: boolean]
  'validate-email': []
}

const props = defineProps<Props>()
defineEmits<Emits>()

const contactSummary = computed(() => {
  const items = [props.email, props.linkedinUrl, props.twitterUrl, props.websiteUrl]
  const count = items.filter((v) => v && String(v).trim() !== '').length
  return count > 0 ? `${count} ${count === 1 ? 'link' : 'links'}` : 'No links'
})
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
