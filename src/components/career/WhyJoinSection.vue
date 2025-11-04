<template>
  <section
    id="why-join"
    class="py-12 sm:py-16 md:py-20 lg:py-24 bg-white relative overflow-hidden"
  >
    <!-- Background decoration -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-0 left-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-gradient-to-br from-emerald-100/40 to-sky-100/30 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-br from-sky-100/35 to-emerald-100/25 rounded-full blur-3xl"
      ></div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <!-- Section Header -->
      <div class="text-center mb-8 sm:mb-12 md:mb-16">
        <div
          class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
        >
          <Heart class="h-3 w-3 sm:h-4 sm:w-4" />
          Why Join Us
        </div>
        <h2
          class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight px-4"
        >
          {{ title || 'Why' }}
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
            GoEvent?
          </span>
        </h2>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <!-- Content Column -->
        <div class="space-y-6">
          <div
            v-if="content"
            class="prose prose-slate max-w-none text-base sm:text-lg text-slate-600 leading-relaxed"
            v-html="sanitizedContent"
          ></div>
          <div v-else class="space-y-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            <p>
              At GoEvent, we're building the next generation of AI-driven solutions that transform
              how businesses work, think, and grow.
            </p>
            <p>
              Join a team of innovators passionate about technology and the future. We believe in
              continuous learning, collaboration, and making a real impact.
            </p>
          </div>

          <!-- Key Points -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div class="flex items-start gap-3">
              <div
                class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-lg flex items-center justify-center"
              >
                <Check class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 mb-1">Innovation First</h3>
                <p class="text-sm text-slate-600">Cutting-edge tech stack and tools</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div
                class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-lg flex items-center justify-center"
              >
                <Check class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 mb-1">Work-Life Balance</h3>
                <p class="text-sm text-slate-600">Flexible hours and remote options</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div
                class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-lg flex items-center justify-center"
              >
                <Check class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 mb-1">Growth Opportunities</h3>
                <p class="text-sm text-slate-600">Learning budget and career development</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div
                class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-lg flex items-center justify-center"
              >
                <Check class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 mb-1">Impactful Work</h3>
                <p class="text-sm text-slate-600">Build products used by thousands</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Media Column -->
        <div class="relative">
          <!-- Video or Image -->
          <div
            v-if="video"
            class="relative bg-slate-100 rounded-2xl overflow-hidden shadow-2xl aspect-video"
          >
            <iframe
              :src="video"
              class="w-full h-full"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>

          <div
            v-else-if="image"
            class="relative bg-slate-100 rounded-2xl overflow-hidden shadow-2xl"
          >
            <img :src="image" alt="Why Join GoEvent" class="w-full h-auto object-cover" loading="lazy" />
          </div>

          <!-- Placeholder if no media -->
          <div
            v-else
            class="relative bg-gradient-to-br from-emerald-100 to-sky-100 rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center"
          >
            <div class="text-center p-8">
              <Users class="w-16 h-16 text-[#1e90ff] mx-auto mb-4" />
              <p class="text-slate-600 font-medium">Join Our Amazing Team</p>
            </div>
          </div>

          <!-- Floating Badge -->
          <div
            class="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 transform rotate-3 hover:rotate-6 transition-transform duration-300"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-xl flex items-center justify-center"
              >
                <Award class="w-6 h-6 text-white" />
              </div>
              <div>
                <div class="text-sm font-bold text-slate-900">Great Place to Work</div>
                <div class="text-xs text-slate-600">Certified 2024</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Heart, Check, Users, Award } from 'lucide-vue-next'
import DOMPurify from 'dompurify'

interface Props {
  title?: string
  content?: string
  image?: string | null
  video?: string | null
}

const props = defineProps<Props>()

const sanitizedContent = computed(() => {
  if (!props.content) return ''
  return DOMPurify.sanitize(props.content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h3', 'h4'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
})
</script>

<style scoped>
.prose {
  color: inherit;
}

.prose p {
  margin-bottom: 1rem;
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
