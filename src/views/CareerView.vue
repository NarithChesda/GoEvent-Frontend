<template>
  <MainLayout>
    <div class="min-h-screen">
      <!-- Hero Section -->
      <CareerHero
        v-if="!loading.critical && settings"
        :settings="settings"
        :stats="heroStats"
        :departments="departments"
      />

      <!-- Loading State for Critical Data -->
      <div
        v-if="loading.critical"
        class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100"
      >
        <div class="text-center">
          <Loader class="w-12 h-12 animate-spin text-[#1e90ff] mx-auto mb-4" />
          <p class="text-slate-600 font-medium">Loading career opportunities...</p>
        </div>
      </div>

      <!-- Why Join Section -->
      <WhyJoinSection
        v-if="!loading.critical && settings"
        :title="settings.about_title"
        :content="settings.about_content"
        :image="settings.hero_image"
        :video="settings.hero_video_url"
      />

      <!-- Benefits Section -->
      <BenefitsGrid v-if="!loading.critical && benefits.length > 0" :benefits="benefits" />

      <!-- Departments Section -->
      <DepartmentsSection
        v-if="!loading.critical && departments.length > 0"
        :departments="departments"
        :selected-department="filters.department[0]"
        @filter="handleDepartmentFilter"
      />

      <!-- Featured Positions -->
      <FeaturedPositions
        v-if="!loading.secondary && featuredPositions.length > 0"
        :positions="featuredPositions"
        @view="handleViewPosition"
      />

      <!-- All Positions Listing -->
      <PositionsListing
        id="positions-section"
        :positions="positions"
        :departments="departments"
        :filters="filters"
        :loading="loading.positions"
        :has-more="hasMorePositions"
        @update:filters="handleFilterUpdate"
        @search="handleSearch"
        @load-more="loadMorePositions"
        @view="handleViewPosition"
      />

      <!-- Testimonials -->
      <TestimonialsCarousel
        v-if="!loading.secondary && testimonials.length > 0"
        :testimonials="testimonials"
      />

      <!-- Final CTA -->
      <ApplicationCTA
        v-if="!loading.critical && settings"
        :settings="settings"
        :open-positions="totalPositions"
      />

      <!-- Footer -->
      <Footer />

      <!-- Position Detail Modal -->
      <PositionDetailModal
        v-if="selectedPosition"
        :position="selectedPosition"
        :open="showPositionModal"
        @close="closePositionModal"
        @apply="handleApply"
      />

      <!-- Scroll to Top Button -->
      <Transition name="fade">
        <button
          v-show="showScrollTop"
          @click="scrollToTop"
          class="fixed bottom-28 lg:bottom-8 right-6 w-14 h-14 z-50 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2 flex items-center justify-center"
        >
          <ArrowUp class="w-6 h-6" />
        </button>
      </Transition>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/components/MainLayout.vue'
import Footer from '@/components/Footer.vue'
import CareerHero from '@/components/career/CareerHero.vue'
import WhyJoinSection from '@/components/career/WhyJoinSection.vue'
import BenefitsGrid from '@/components/career/BenefitsGrid.vue'
import DepartmentsSection from '@/components/career/DepartmentsSection.vue'
import FeaturedPositions from '@/components/career/FeaturedPositions.vue'
import PositionsListing from '@/components/career/PositionsListing.vue'
import TestimonialsCarousel from '@/components/career/TestimonialsCarousel.vue'
import ApplicationCTA from '@/components/career/ApplicationCTA.vue'
import PositionDetailModal from '@/components/career/PositionDetailModal.vue'
import { useScrollToTop } from '@/composables/useScrollAnimations'
import { Loader, ArrowUp } from 'lucide-vue-next'
import {
  careerSettingsService,
  careerDepartmentsService,
  careerBenefitsService,
  careerTestimonialsService,
  careerPositionsService,
  type CareerPageSettings,
  type CareerDepartment,
  type CareerBenefit,
  type CareerTestimonial,
  type CareerPosition,
  type PositionFilters,
} from '@/services/api'

// State management
const settings = ref<CareerPageSettings | null>(null)
const departments = ref<CareerDepartment[]>([])
const benefits = ref<CareerBenefit[]>([])
const testimonials = ref<CareerTestimonial[]>([])
const featuredPositions = ref<CareerPosition[]>([])
const positions = ref<CareerPosition[]>([])
const selectedPosition = ref<CareerPosition | null>(null)
const showPositionModal = ref(false)

// Loading states
const loading = ref({
  critical: true,
  secondary: true,
  positions: false,
})

// Filters and pagination
const filters = ref<PositionFilters>({
  department: [],
  employment_type: [],
  experience_level: [],
  location_type: [],
  search: '',
  ordering: '-created_at',
})

const currentPage = ref(1)
const totalPositions = ref(0)
const hasMorePositions = ref(false)

// Computed stats for hero
const heroStats = computed(() => ({
  teamMembers: settings.value?.stat_employees_count || 20,
  openRoles: totalPositions.value || 5,
  remoteOk: '100%',
}))

// Scroll to top functionality
const { showScrollTop, scrollToTop } = useScrollToTop()

// Fetch critical data (blocks initial render)
const fetchCriticalData = async () => {
  try {
    const [settingsRes, deptRes, benefitsRes] = await Promise.all([
      careerSettingsService.getPublicSettings(),
      careerDepartmentsService.getDepartments({ is_active: true, ordering: 'order' }),
      careerBenefitsService.getBenefits({ is_active: true, ordering: 'order' }),
    ])

    if (settingsRes.success && settingsRes.data) {
      settings.value = settingsRes.data
    }

    if (deptRes.success && deptRes.data) {
      departments.value = deptRes.data.results
    }

    if (benefitsRes.success && benefitsRes.data) {
      benefits.value = benefitsRes.data.results
    }
  } catch (error) {
    console.error('Error fetching critical data:', error)
  } finally {
    loading.value.critical = false
  }
}

// Fetch secondary data (lazy loaded)
const fetchSecondaryData = async () => {
  try {
    const [testimonialsRes, featuredRes] = await Promise.all([
      careerTestimonialsService.getTestimonials({ is_active: true, ordering: 'order' }),
      careerPositionsService.getFeaturedPositions(),
    ])

    if (testimonialsRes.success && testimonialsRes.data) {
      testimonials.value = testimonialsRes.data.results
    }

    if (featuredRes.success && featuredRes.data) {
      featuredPositions.value = featuredRes.data
    }
  } catch (error) {
    console.error('Error fetching secondary data:', error)
  } finally {
    loading.value.secondary = false
  }
}

// Fetch positions with filters
const fetchPositions = async (page = 1, reset = false) => {
  loading.value.positions = true

  try {
    const response = await careerPositionsService.getPositions({
      ...filters.value,
      page,
      page_size: 20,
    })

    if (response.success && response.data) {
      if (reset || page === 1) {
        positions.value = response.data.results
      } else {
        positions.value.push(...response.data.results)
      }

      totalPositions.value = response.data.count
      hasMorePositions.value = !!response.data.next
      currentPage.value = page
    }
  } catch (error) {
    console.error('Error fetching positions:', error)
  } finally {
    loading.value.positions = false
  }
}

// Handle department filter from DepartmentsSection
const handleDepartmentFilter = (deptId: number | null) => {
  filters.value.department = deptId ? [deptId] : []
  currentPage.value = 1

  // Scroll to positions section
  setTimeout(() => {
    document.getElementById('positions-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, 100)

  fetchPositions(1, true)
}

// Handle filter updates from PositionsListing
const handleFilterUpdate = (newFilters: Partial<PositionFilters>) => {
  filters.value = { ...filters.value, ...newFilters }
  currentPage.value = 1
  fetchPositions(1, true)
}

// Handle search
const handleSearch = (query: string) => {
  filters.value.search = query
  currentPage.value = 1
  fetchPositions(1, true)
}

// Load more positions (infinite scroll / pagination)
const loadMorePositions = () => {
  if (!loading.value.positions && hasMorePositions.value) {
    fetchPositions(currentPage.value + 1, false)
  }
}

// Handle view position
const handleViewPosition = async (positionId: number) => {
  // Find position in current list or fetch if needed
  let position = [...positions.value, ...featuredPositions.value].find((p) => p.id === positionId)

  if (!position) {
    // Fetch the position details
    const response = await careerPositionsService.getPositions({ id: positionId })
    if (response.success && response.data && response.data.results.length > 0) {
      position = response.data.results[0]
    }
  }

  if (position) {
    // Fetch full details using slug
    const detailResponse = await careerPositionsService.getPosition(position.slug)
    if (detailResponse.success && detailResponse.data) {
      selectedPosition.value = detailResponse.data
      showPositionModal.value = true
    }
  }
}

// Close position modal
const closePositionModal = () => {
  showPositionModal.value = false
  setTimeout(() => {
    selectedPosition.value = null
  }, 300)
}

// Handle apply button
const handleApply = (positionSlug: string) => {
  // TODO: Navigate to application form or open application modal
  console.log('Apply to position:', positionSlug)
  // For now, just close the modal
  closePositionModal()
}

// Lifecycle
onMounted(async () => {
  // Fetch critical data first
  await fetchCriticalData()

  // Fetch secondary data (non-blocking)
  fetchSecondaryData()

  // Fetch initial positions
  await fetchPositions(1, true)
})
</script>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
