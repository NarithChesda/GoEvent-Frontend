<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">
      <!-- Main Content -->
      <section class="py-4 sm:py-6 lg:py-8">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header -->
          <div class="flex items-center justify-between mb-8 sm:mb-10">
            <div>
              <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                Event Services
              </h1>
              <p class="text-slate-600">
                Discover vendors and services for your events
              </p>
            </div>

            <!-- List Your Service Button (for vendors) -->
            <button
              v-if="authStore.isAuthenticated"
              @click="handleListServiceClick"
              class="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-sm"
            >
              <Plus class="w-4 h-4" />
              List Your Service
            </button>
          </div>

          <!-- Service Categories -->
          <div class="mb-8">
            <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button
                v-for="category in serviceCategories"
                :key="category.id"
                @click="selectedCategory = category.id"
                :class="[
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                ]"
              >
                {{ category.name }}
              </button>
            </div>
          </div>

          <!-- Coming Soon State -->
          <div class="text-center py-16 px-4">
            <div class="w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-4 lg:mb-6 bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 rounded-full flex items-center justify-center">
              <Briefcase class="w-12 h-12 lg:w-16 lg:h-16 text-[#2ecc71]" />
            </div>
            <h3 class="text-xl lg:text-2xl font-bold text-slate-900 mb-2 lg:mb-3">
              Coming Soon
            </h3>
            <p class="text-sm lg:text-base text-slate-600 mb-5 lg:mb-6 max-w-md mx-auto">
              We're building a marketplace for event vendors to showcase their services. Check back soon!
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                @click="handleNotifyClick"
                class="px-5 py-2.5 lg:px-6 lg:py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm lg:text-base rounded-xl font-medium transition-colors"
              >
                Notify Me When Ready
              </button>
              <RouterLink
                v-if="authStore.user?.is_partner"
                to="/commission"
                class="px-5 py-2.5 lg:px-6 lg:py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-sm lg:text-base rounded-xl font-medium transition-colors"
              >
                View My Commission
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <AppFooter />

      <!-- Contact Us FAB -->
      <ContactUsFAB :has-fab-below="authStore.isAuthenticated" />

      <!-- Mobile List Service FAB (only for authenticated users) -->
      <button
        v-if="authStore.isAuthenticated"
        @click="handleListServiceClick"
        class="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-110 flex items-center justify-center z-[60] group"
        aria-label="List Your Service"
      >
        <Plus class="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        <div
          class="absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
        >
          List Your Service
        </div>
      </button>

      <!-- Success Message -->
      <Transition name="slide-up">
        <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-6 z-50">
          <div
            :class="message.type === 'success' ? 'bg-green-500' : 'bg-blue-500'"
            class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
          >
            <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
            <Info v-else class="w-5 h-5 mr-2" />
            {{ message.text }}
          </div>
        </div>
      </Transition>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Briefcase, Plus, CheckCircle, Info } from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import AppFooter from '../components/AppFooter.vue'
import ContactUsFAB from '../components/ContactUsFAB.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Service categories
const serviceCategories = ref([
  { id: 'all', name: 'All Services' },
  { id: 'catering', name: 'Catering' },
  { id: 'photography', name: 'Photography' },
  { id: 'videography', name: 'Videography' },
  { id: 'decoration', name: 'Decoration' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'venue', name: 'Venues' },
  { id: 'planning', name: 'Event Planning' },
  { id: 'other', name: 'Other Services' }
])

const selectedCategory = ref('all')
const message = ref<{ type: 'success' | 'info'; text: string } | null>(null)

const showMessage = (type: 'success' | 'info', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const handleListServiceClick = () => {
  // TODO: Implement service listing modal
  showMessage('info', 'Service listing feature coming soon!')
}

const handleNotifyClick = () => {
  // TODO: Implement notification signup
  showMessage('success', 'We\'ll notify you when the services marketplace is ready!')
}
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

/* Hide scrollbar for horizontal scroll */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}
</style>
