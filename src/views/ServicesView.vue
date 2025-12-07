<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">
      <!-- Mobile Top Bar -->
      <MobileTopBar />

      <!-- Main Content -->
      <section class="py-4 sm:py-6 lg:py-8">
        <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              Services
            </h1>
          </div>

          <!-- Mobile Category Toggle -->
          <ServicesCategoryToggle
            v-model="selectedCategory"
            :categories="serviceCategories"
          />

          <!-- Featured Vendors Section -->
          <FeaturedVendors
            :vendors="featuredVendors"
            @vendor-click="openVendorProfile"
          />

          <!-- Service Listings Grid -->
          <ServiceListingsGrid
            :listings="filteredListings"
            :categories="serviceCategories"
            :selected-category="selectedCategory"
            :sort-by="sortBy"
            :sort-options="sortOptions"
            @listing-click="openListingDetail"
            @load-more="loadMore"
            @category-change="selectedCategory = $event"
            @sort-change="sortBy = $event"
          />

          <!-- Become a Vendor CTA -->
          <VendorCTA
            @list-service="handleListService"
            @learn-more="handleLearnMore"
          />
        </div>
      </section>

      <!-- Footer -->
      <AppFooter />

      <!-- Contact Us FAB -->
      <ContactUsFAB :has-fab-below="authStore.isAuthenticated" />

      <!-- List Service FAB -->
      <button
        v-if="authStore.isAuthenticated"
        @click="handleListService"
        class="fixed bottom-20 lg:bottom-4 right-4 lg:right-6 w-14 h-14 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 hover:scale-110 flex items-center justify-center z-[60] group"
        aria-label="List Your Service"
      >
        <Plus class="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        <div
          class="absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
        >
          List Your Service
        </div>
      </button>

      <!-- Listing Detail Drawer -->
      <ListingDetailDrawer
        v-model="showListingDrawer"
        :listing="selectedListing"
        @contact="handleContactVendor"
      />

      <!-- Vendor Profile Drawer -->
      <VendorProfileDrawer
        v-model="showVendorDrawer"
        :vendor="selectedVendor"
        :listings="vendorListings"
        @listing-click="handleVendorListingClick"
      />

      <!-- Success/Info Messages -->
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

      <!-- Listing Form Drawer (Create/Edit) -->
      <ListingFormDrawer
        v-model="showListingFormDrawer"
        :listing="editingListing"
        :listing-id="editingListing?.id"
        @created="handleListingCreated"
        @updated="handleListingUpdated"
        @deleted="handleListingDeleted"
      />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, CheckCircle, Info } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import AppFooter from '@/components/AppFooter.vue'
import ContactUsFAB from '@/components/ContactUsFAB.vue'
import { MobileTopBar } from '@/components/events'
import {
  FeaturedVendors,
  ServiceListingsGrid,
  VendorCTA,
  ListingDetailDrawer,
  VendorProfileDrawer,
  ListingFormDrawer,
  ServicesCategoryToggle,
  type Vendor,
  type Listing
} from '@/components/services'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// UI State
const selectedCategory = ref('all')
const sortBy = ref('featured')
const showListingDrawer = ref(false)
const showVendorDrawer = ref(false)
const showListingFormDrawer = ref(false)
const editingListing = ref<Listing | null>(null)

// Message state
const message = ref<{ type: 'success' | 'info'; text: string } | null>(null)

// Selected items
const selectedListing = ref<Listing | null>(null)
const selectedVendor = ref<Vendor | null>(null)

// Service categories
const serviceCategories = ref([
  { id: 'all', name: 'All' },
  { id: 'photography', name: 'Photography' },
  { id: 'videography', name: 'Videography' },
  { id: 'catering', name: 'Catering' },
  { id: 'venue', name: 'Venue' },
  { id: 'music', name: 'Music' },
  { id: 'decoration', name: 'Decoration' },
  { id: 'florist', name: 'Florist' },
  { id: 'planning', name: 'Planning' },
  { id: 'rentals', name: 'Rentals' },
  { id: 'makeup', name: 'Makeup' },
  { id: 'transport', name: 'Transport' },
  { id: 'mc', name: 'MC & Host' },
  { id: 'printing', name: 'Printing' },
  { id: 'security', name: 'Security' },
])

// Sort options
const sortOptions = [
  { value: 'featured', label: 'Featured First' },
  { value: '-created_at', label: 'Newest First' },
  { value: 'price_min', label: 'Price: Low to High' },
  { value: '-price_min', label: 'Price: High to Low' },
  { value: 'title', label: 'A to Z' },
]

// Mock featured vendors
const featuredVendors = ref<Vendor[]>([
  {
    id: '1',
    name: 'Elite Photography',
    logo: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=200&h=200&fit=crop',
    tagline: 'Capturing magical moments',
    description: 'Professional event photography services with over 10 years of experience. We specialize in weddings, corporate events, and special occasions.',
    city: 'Bangkok',
    country: 'Thailand',
    email: 'contact@elitephoto.com',
    phone: '+66 81 234 5678',
    listingsCount: 5
  },
  {
    id: '2',
    name: 'Gourmet Catering Co.',
    logo: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=200&h=200&fit=crop',
    tagline: 'Exquisite flavors for your events',
    description: 'Premium catering services for all types of events. From intimate gatherings to large corporate functions.',
    city: 'Bangkok',
    country: 'Thailand',
    email: 'hello@gourmetcatering.com',
    phone: '+66 82 345 6789',
    listingsCount: 3
  },
  {
    id: '3',
    name: 'Dream Decor Studio',
    logo: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200&h=200&fit=crop',
    tagline: 'Transform your venue',
    description: 'Creative event decoration and styling. We bring your vision to life with stunning designs.',
    city: 'Chiang Mai',
    country: 'Thailand',
    email: 'info@dreamdecor.com',
    phone: '+66 83 456 7890',
    listingsCount: 4
  },
  {
    id: '4',
    name: 'Harmony Music Events',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop',
    tagline: 'Sound that moves you',
    description: 'Live bands, DJs, and entertainment for every occasion. Making your event unforgettable.',
    city: 'Phuket',
    country: 'Thailand',
    email: 'book@harmonymusic.com',
    phone: '+66 84 567 8901',
    listingsCount: 2
  }
])

// Mock service listings
const mockListings = ref<Listing[]>([
  {
    id: '1',
    title: 'Wedding Photography Package',
    tagline: 'Complete coverage from preparation to reception with artistic storytelling',
    description: 'Our comprehensive wedding photography package includes full-day coverage starting from bridal preparation through to the last dance. We capture every precious moment with a blend of photojournalistic and artistic styles. Package includes a lead photographer and assistant, 500+ edited photos, online gallery, and a beautiful photo album.',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
    category: 'Photography',
    priceDisplay: 'From $500',
    vendorName: 'Elite Photography',
    vendorLogo: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=200&h=200&fit=crop',
    vendorVerified: true,
    tags: ['wedding', 'photography', 'portrait', 'candid'],
    serviceArea: 'Bangkok, Thailand',
    views: 1250,
    contactClicks: 87,
    isFeatured: true,
    gallery: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1529636798458-92182e662485?w=400&h=400&fit=crop'
    ]
  },
  {
    id: '2',
    title: 'Corporate Event Catering',
    tagline: 'Premium dining experiences for business events and conferences',
    description: 'Elevate your corporate events with our professional catering service. We offer customizable menus ranging from elegant plated dinners to casual buffets. Our experienced team handles everything from setup to cleanup, ensuring a seamless dining experience.',
    coverImage: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop',
    category: 'Catering',
    priceDisplay: '$25-50/person',
    vendorName: 'Gourmet Catering Co.',
    vendorLogo: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=200&h=200&fit=crop',
    vendorVerified: true,
    tags: ['catering', 'corporate', 'buffet', 'thai cuisine'],
    serviceArea: 'Bangkok Metropolitan',
    views: 892,
    contactClicks: 54,
    isFeatured: true,
    gallery: [
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop'
    ]
  },
  {
    id: '3',
    title: 'Luxury Wedding Venue',
    tagline: 'Stunning riverside location with panoramic city views',
    description: 'Our exclusive venue offers breathtaking views of the Chao Phraya River and Bangkok skyline. Perfect for intimate ceremonies or grand celebrations up to 500 guests. Includes dedicated event coordinator, customizable lighting, and premium sound system.',
    coverImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop',
    category: 'Venue',
    priceDisplay: 'From $2,000',
    vendorName: 'Grand Riverside Events',
    vendorLogo: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200&h=200&fit=crop',
    vendorVerified: true,
    tags: ['venue', 'wedding', 'riverside', 'luxury'],
    serviceArea: 'Bangkok',
    views: 2341,
    contactClicks: 156,
    isFeatured: false,
    gallery: [
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=400&fit=crop'
    ]
  },
  {
    id: '4',
    title: 'Live Band Entertainment',
    tagline: 'Professional musicians for weddings and parties',
    description: 'Our versatile 6-piece band brings energy and elegance to any event. We perform a wide range of genres from classic jazz to modern pop hits. All equipment included with professional sound engineering.',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop',
    category: 'Music',
    priceDisplay: '$800-1,500',
    vendorName: 'Harmony Music Events',
    vendorLogo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop',
    vendorVerified: true,
    tags: ['music', 'band', 'wedding', 'entertainment'],
    serviceArea: 'All Thailand',
    views: 567,
    contactClicks: 32,
    isFeatured: false,
    gallery: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop'
    ]
  },
  {
    id: '5',
    title: 'Floral Design & Arrangements',
    tagline: 'Beautiful blooms for your special day',
    description: 'From bridal bouquets to venue centerpieces, we create stunning floral arrangements tailored to your style and color palette. Fresh flowers sourced daily with eco-friendly options available.',
    coverImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop',
    category: 'Florist',
    priceDisplay: 'From $150',
    vendorName: 'Bloom & Blossom',
    vendorLogo: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=200&h=200&fit=crop',
    vendorVerified: false,
    tags: ['flowers', 'wedding', 'decoration', 'bouquet'],
    serviceArea: 'Bangkok, Nonthaburi',
    views: 423,
    contactClicks: 28,
    isFeatured: false,
    gallery: [
      'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400&h=400&fit=crop'
    ]
  },
  {
    id: '6',
    title: 'Event Videography',
    tagline: 'Cinematic wedding films that tell your story',
    description: 'We create beautiful, cinematic wedding films that capture the emotion and joy of your special day. Full-day coverage with multiple cameras, drone footage, and professional editing.',
    coverImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop',
    category: 'Videography',
    priceDisplay: 'From $800',
    vendorName: 'Cinematic Stories',
    vendorLogo: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&h=200&fit=crop',
    vendorVerified: true,
    tags: ['video', 'wedding', 'cinematic', 'drone'],
    serviceArea: 'Thailand Wide',
    views: 789,
    contactClicks: 45,
    isFeatured: false,
    gallery: [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=400&fit=crop'
    ]
  }
])

// Vendor listings for profile view
const vendorListings = computed(() => {
  if (!selectedVendor.value) return []
  return mockListings.value.filter(l => l.vendorName === selectedVendor.value?.name)
})

// Filtered listings
const filteredListings = computed(() => {
  let listings = [...mockListings.value]

  // Filter by category
  if (selectedCategory.value !== 'all') {
    const categoryName = serviceCategories.value.find(c => c.id === selectedCategory.value)?.name
    listings = listings.filter(l => l.category.toLowerCase() === categoryName?.toLowerCase())
  }

  // Sort
  if (sortBy.value === 'featured') {
    listings.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
  }

  return listings
})

// Methods
const showMessage = (type: 'success' | 'info', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const openListingDetail = (listing: Listing) => {
  selectedListing.value = listing
  showListingDrawer.value = true
}

const openVendorProfile = (vendor: Vendor) => {
  selectedVendor.value = vendor
  showVendorDrawer.value = true
}

const handleVendorListingClick = (listing: Listing) => {
  showVendorDrawer.value = false
  openListingDetail(listing)
}

const handleListService = () => {
  editingListing.value = null
  showListingFormDrawer.value = true
}

const handleListingCreated = (listing: Listing) => {
  showMessage('success', `Listing "${listing.title}" created successfully!`)
}

const handleListingUpdated = (listing: Listing) => {
  showMessage('success', `Listing "${listing.title}" updated successfully!`)
}

const handleListingDeleted = () => {
  showMessage('info', `Listing deleted successfully`)
}

const handleLearnMore = () => {
  showMessage('info', 'Vendor information page coming soon!')
}

const handleContactVendor = (type: string) => {
  showMessage('success', `Contact via ${type} - Feature coming soon!`)
}

const loadMore = () => {
  showMessage('info', 'Loading more services...')
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
</style>
