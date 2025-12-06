<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">
      <!-- Main Content -->
      <section class="py-4 sm:py-6 lg:py-8">
        <div class="max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
              Services
            </h1>
          </div>

          <!-- Mobile Category Pills -->
          <div class="sm:hidden -mx-4 px-4 mb-4 overflow-x-auto scrollbar-hide">
            <div class="flex items-center gap-2 pb-1">
              <button
                v-for="category in serviceCategories"
                :key="category.id"
                @click="selectedCategory = category.id"
                :class="[
                  'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap',
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
                    : 'glass-pill text-slate-600'
                ]"
              >
                {{ category.name }}
              </button>
            </div>
          </div>

          <!-- Featured Vendors Section -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles class="w-5 h-5 text-amber-500" />
                Featured Vendors
              </h2>
              <button class="text-sm text-[#2ecc71] hover:text-[#27ae60] font-medium">
                View All
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                v-for="vendor in featuredVendors"
                :key="vendor.id"
                @click="openVendorProfile(vendor)"
                class="group cursor-pointer bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:border-[#2ecc71]/30 transition-all duration-300"
              >
                <div class="aspect-[4/3] relative overflow-hidden bg-slate-100">
                  <img
                    :src="vendor.logo"
                    :alt="vendor.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div class="absolute top-2 right-2">
                    <div class="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Star class="w-3 h-3 fill-current" />
                      Verified
                    </div>
                  </div>
                </div>
                <div class="p-2.5 lg:p-3">
                  <h3 class="font-medium text-slate-900 text-xs lg:text-sm truncate">{{ vendor.name }}</h3>
                  <p class="text-[10px] lg:text-xs text-slate-500 truncate">{{ vendor.tagline }}</p>
                  <div class="flex items-center gap-1 mt-1.5 lg:mt-2">
                    <MapPin class="w-2.5 h-2.5 lg:w-3 lg:h-3 text-slate-400" />
                    <span class="text-[10px] lg:text-xs text-slate-500">{{ vendor.city }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Service Listings Grid -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-slate-900">
                {{ selectedCategoryName }} Services
                <span class="text-slate-400 font-normal text-sm ml-2">({{ filteredListings.length }})</span>
              </h2>

              <!-- Filter Controls -->
              <div class="flex items-center gap-2">
                <!-- Category Filter Dropdown -->
                <div class="relative category-filter-container hidden sm:block">
                  <button
                    @click.stop="showCategoryMenu = !showCategoryMenu"
                    class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Filter class="w-4 h-4" />
                    <span>{{ selectedCategoryName }}</span>
                  </button>
                  <Transition name="fade">
                    <div
                      v-if="showCategoryMenu"
                      class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 max-h-[60vh] overflow-y-auto"
                    >
                      <button
                        v-for="category in serviceCategories"
                        :key="category.id"
                        @click="selectCategory(category.id)"
                        class="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                        :class="selectedCategory === category.id
                          ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5'
                          : 'text-slate-700'"
                      >
                        {{ category.name }}
                      </button>
                    </div>
                  </Transition>
                </div>

                <!-- Sort Dropdown -->
                <div class="relative">
                  <button
                    @click="showSortMenu = !showSortMenu"
                    class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ArrowUpDown class="w-4 h-4" />
                    <span class="hidden sm:inline">{{ sortOptions.find(o => o.value === sortBy)?.label }}</span>
                  </button>
                  <Transition name="fade">
                    <div
                      v-if="showSortMenu"
                      class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
                    >
                      <button
                        v-for="option in sortOptions"
                        :key="option.value"
                        @click="sortBy = option.value; showSortMenu = false"
                        :class="[
                          'w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors',
                          sortBy === option.value ? 'text-[#2ecc71] font-medium' : 'text-slate-700'
                        ]"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <!-- Listings Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="listing in filteredListings"
                :key="listing.id"
                @click="openListingDetail(listing)"
                class="group cursor-pointer bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:border-[#2ecc71]/30 transition-all duration-300"
              >
                <!-- Cover Image -->
                <div class="aspect-[16/9] relative overflow-hidden bg-slate-100">
                  <img
                    :src="listing.coverImage"
                    :alt="listing.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <!-- Featured Badge -->
                  <div v-if="listing.isFeatured" class="absolute top-2 left-2">
                    <div class="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-medium rounded-full flex items-center gap-1">
                      <Sparkles class="w-2.5 h-2.5" />
                      Featured
                    </div>
                  </div>
                  <!-- Category Badge -->
                  <div class="absolute top-2 right-2">
                    <div class="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium rounded-full">
                      {{ listing.category }}
                    </div>
                  </div>
                  <!-- Price Tag -->
                  <div class="absolute bottom-2 right-2">
                    <div class="px-2 py-1 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-semibold rounded-md shadow-sm">
                      {{ listing.priceDisplay }}
                    </div>
                  </div>
                </div>

                <!-- Content -->
                <div class="p-3 lg:p-4">
                  <!-- Vendor Info -->
                  <div class="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
                    <img
                      :src="listing.vendorLogo"
                      :alt="listing.vendorName"
                      class="w-5 h-5 lg:w-6 lg:h-6 rounded-full object-cover border border-slate-200"
                    />
                    <span class="text-[10px] lg:text-xs text-slate-500 truncate">{{ listing.vendorName }}</span>
                    <BadgeCheck v-if="listing.vendorVerified" class="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#2ecc71] flex-shrink-0" />
                  </div>

                  <!-- Title & Tagline -->
                  <h3 class="font-semibold text-slate-900 text-sm lg:text-base mb-0.5 lg:mb-1 line-clamp-1 group-hover:text-[#2ecc71] transition-colors">
                    {{ listing.title }}
                  </h3>
                  <p class="text-xs lg:text-sm text-slate-500 line-clamp-2 mb-2 lg:mb-3">
                    {{ listing.tagline }}
                  </p>

                  <!-- Tags -->
                  <div class="flex flex-wrap gap-1 lg:gap-1.5 mb-2 lg:mb-3">
                    <span
                      v-for="tag in listing.tags.slice(0, 3)"
                      :key="tag"
                      class="px-1.5 lg:px-2 py-0.5 lg:py-1 bg-slate-100 text-slate-600 text-[10px] lg:text-xs rounded-full"
                    >
                      {{ tag }}
                    </span>
                    <span
                      v-if="listing.tags.length > 3"
                      class="px-1.5 lg:px-2 py-0.5 lg:py-1 bg-slate-100 text-slate-500 text-[10px] lg:text-xs rounded-full"
                    >
                      +{{ listing.tags.length - 3 }}
                    </span>
                  </div>

                  <!-- Footer -->
                  <div class="flex items-center justify-between pt-2 lg:pt-3 border-t border-slate-100">
                    <div class="flex items-center gap-1 text-slate-400">
                      <MapPin class="w-3 h-3 lg:w-4 lg:h-4" />
                      <span class="text-[10px] lg:text-xs">{{ listing.serviceArea }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-[10px] lg:text-xs text-slate-400">
                      <span class="flex items-center gap-0.5">
                        <Eye class="w-3 h-3 lg:w-4 lg:h-4" />
                        {{ listing.views }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Load More Button -->
            <div class="flex justify-center mt-8">
              <button
                @click="loadMore"
                class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <span>Load More Services</span>
                <ChevronDown class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Become a Vendor CTA -->
          <div class="mt-12 bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 rounded-3xl p-6 sm:p-8 border border-[#2ecc71]/20">
            <div class="flex flex-col md:flex-row items-center gap-6">
              <div class="flex-shrink-0">
                <div class="w-20 h-20 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-2xl flex items-center justify-center">
                  <Store class="w-10 h-10 text-white" />
                </div>
              </div>
              <div class="flex-1 text-center md:text-left">
                <h3 class="text-xl font-bold text-slate-900 mb-2">
                  Are you an event vendor?
                </h3>
                <p class="text-slate-600 mb-4">
                  List your services on GoEvent and reach thousands of event organizers. Get verified, showcase your work, and grow your business.
                </p>
                <div class="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
                  <button
                    @click="handleListService"
                    class="px-6 py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30"
                  >
                    List Your Service
                  </button>
                  <button
                    @click="handleLearnMore"
                    class="px-6 py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-medium transition-colors"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
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
      <Transition name="drawer">
        <div
          v-if="showListingDrawer"
          class="fixed inset-0 z-[100]"
          @click.self="showListingDrawer = false"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showListingDrawer = false"></div>

          <!-- Drawer Content -->
          <div class="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <!-- Header -->
            <div class="sticky top-0 bg-white/80 backdrop-blur-lg z-10 border-b border-slate-200/50">
              <div class="flex items-center justify-between p-4">
                <button
                  @click="showListingDrawer = false"
                  class="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X class="w-5 h-5 text-slate-600" />
                </button>
                <div class="flex items-center gap-2">
                  <button class="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <Heart class="w-5 h-5 text-slate-600" />
                  </button>
                  <button class="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <Share2 class="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Listing Content -->
            <div v-if="selectedListing" class="pb-32">
              <!-- Cover Image Gallery -->
              <div class="aspect-[16/9] relative overflow-hidden bg-slate-100">
                <img
                  :src="selectedListing.coverImage"
                  :alt="selectedListing.title"
                  class="w-full h-full object-cover"
                />
                <div v-if="selectedListing.isFeatured" class="absolute top-4 left-4">
                  <div class="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-full flex items-center gap-1">
                    <Sparkles class="w-4 h-4" />
                    Featured
                  </div>
                </div>
              </div>

              <div class="p-6">
                <!-- Vendor Info -->
                <div class="flex items-center gap-3 mb-4">
                  <img
                    :src="selectedListing.vendorLogo"
                    :alt="selectedListing.vendorName"
                    class="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-slate-900">{{ selectedListing.vendorName }}</span>
                      <BadgeCheck v-if="selectedListing.vendorVerified" class="w-5 h-5 text-[#2ecc71]" />
                    </div>
                    <span class="text-sm text-slate-500">{{ selectedListing.category }}</span>
                  </div>
                </div>

                <!-- Title & Price -->
                <h2 class="text-2xl font-bold text-slate-900 mb-2">
                  {{ selectedListing.title }}
                </h2>
                <div class="text-xl font-semibold text-[#2ecc71] mb-4">
                  {{ selectedListing.priceDisplay }}
                </div>

                <!-- Tagline -->
                <p class="text-slate-600 mb-6">
                  {{ selectedListing.tagline }}
                </p>

                <!-- Description -->
                <div class="mb-6">
                  <h3 class="font-semibold text-slate-900 mb-2">About this service</h3>
                  <p class="text-slate-600 text-sm leading-relaxed">
                    {{ selectedListing.description }}
                  </p>
                </div>

                <!-- Service Area -->
                <div class="mb-6">
                  <h3 class="font-semibold text-slate-900 mb-2">Service Area</h3>
                  <div class="flex items-center gap-2 text-slate-600">
                    <MapPin class="w-4 h-4 text-slate-400" />
                    <span class="text-sm">{{ selectedListing.serviceArea }}</span>
                  </div>
                </div>

                <!-- Tags -->
                <div class="mb-6">
                  <h3 class="font-semibold text-slate-900 mb-2">Tags</h3>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in selectedListing.tags"
                      :key="tag"
                      class="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>

                <!-- Gallery Preview -->
                <div class="mb-6">
                  <h3 class="font-semibold text-slate-900 mb-2">Gallery</h3>
                  <div class="grid grid-cols-3 gap-2">
                    <div
                      v-for="(image, index) in selectedListing.gallery"
                      :key="index"
                      class="aspect-square rounded-lg overflow-hidden bg-slate-100"
                    >
                      <img :src="image" alt="Gallery" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-slate-50 rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-slate-900">{{ selectedListing.views }}</div>
                    <div class="text-sm text-slate-500">Views</div>
                  </div>
                  <div class="bg-slate-50 rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-slate-900">{{ selectedListing.contactClicks }}</div>
                    <div class="text-sm text-slate-500">Inquiries</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fixed Bottom CTA -->
            <div class="fixed bottom-0 left-0 right-0 max-w-lg ml-auto bg-white border-t border-slate-200 p-4">
              <div class="flex gap-3">
                <button
                  @click="handleContactVendor('telegram')"
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl font-medium transition-colors"
                >
                  <Send class="w-5 h-5" />
                  <span>Telegram</span>
                </button>
                <button
                  @click="handleContactVendor('phone')"
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-xl font-medium transition-all"
                >
                  <Phone class="w-5 h-5" />
                  <span>Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Vendor Profile Drawer -->
      <Transition name="drawer">
        <div
          v-if="showVendorDrawer"
          class="fixed inset-0 z-[100]"
          @click.self="showVendorDrawer = false"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showVendorDrawer = false"></div>

          <!-- Drawer Content -->
          <div class="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <!-- Header -->
            <div class="sticky top-0 bg-white/80 backdrop-blur-lg z-10 border-b border-slate-200/50">
              <div class="flex items-center justify-between p-4">
                <button
                  @click="showVendorDrawer = false"
                  class="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X class="w-5 h-5 text-slate-600" />
                </button>
                <span class="font-medium text-slate-900">Vendor Profile</span>
                <div class="w-9"></div>
              </div>
            </div>

            <!-- Vendor Content -->
            <div v-if="selectedVendor" class="pb-8">
              <!-- Cover & Logo -->
              <div class="h-32 bg-gradient-to-r from-[#2ecc71]/20 to-[#1e90ff]/20 relative">
                <div class="absolute -bottom-10 left-6">
                  <img
                    :src="selectedVendor.logo"
                    :alt="selectedVendor.name"
                    class="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-lg"
                  />
                </div>
              </div>

              <div class="pt-14 px-6">
                <!-- Name & Verification -->
                <div class="flex items-center gap-2 mb-1">
                  <h2 class="text-xl font-bold text-slate-900">{{ selectedVendor.name }}</h2>
                  <BadgeCheck class="w-5 h-5 text-[#2ecc71]" />
                </div>
                <p class="text-slate-500 mb-4">{{ selectedVendor.tagline }}</p>

                <!-- Contact Buttons -->
                <div class="flex gap-3 mb-6">
                  <button class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0088cc] text-white rounded-xl text-sm font-medium">
                    <Send class="w-4 h-4" />
                    Telegram
                  </button>
                  <button class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">
                    <Globe class="w-4 h-4" />
                    Website
                  </button>
                </div>

                <!-- Info -->
                <div class="space-y-3 mb-6">
                  <div class="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin class="w-4 h-4 text-slate-400" />
                    <span>{{ selectedVendor.city }}, {{ selectedVendor.country }}</span>
                  </div>
                  <div class="flex items-center gap-3 text-sm text-slate-600">
                    <Mail class="w-4 h-4 text-slate-400" />
                    <span>{{ selectedVendor.email }}</span>
                  </div>
                  <div class="flex items-center gap-3 text-sm text-slate-600">
                    <Phone class="w-4 h-4 text-slate-400" />
                    <span>{{ selectedVendor.phone }}</span>
                  </div>
                </div>

                <!-- About -->
                <div class="mb-6">
                  <h3 class="font-semibold text-slate-900 mb-2">About</h3>
                  <p class="text-sm text-slate-600 leading-relaxed">
                    {{ selectedVendor.description }}
                  </p>
                </div>

                <!-- Listings -->
                <div>
                  <h3 class="font-semibold text-slate-900 mb-3">
                    Services ({{ selectedVendor.listingsCount }})
                  </h3>
                  <div class="space-y-3">
                    <div
                      v-for="listing in vendorListings"
                      :key="listing.id"
                      @click="openListingDetail(listing); showVendorDrawer = false"
                      class="flex gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <img
                        :src="listing.coverImage"
                        :alt="listing.title"
                        class="w-16 h-16 rounded-lg object-cover"
                      />
                      <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-slate-900 text-sm truncate">{{ listing.title }}</h4>
                        <p class="text-xs text-slate-500 truncate">{{ listing.tagline }}</p>
                        <div class="text-sm font-semibold text-[#2ecc71] mt-1">{{ listing.priceDisplay }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Sparkles,
  Star,
  MapPin,
  ArrowUpDown,
  Filter,
  Eye,
  ChevronDown,
  Store,
  Plus,
  X,
  Heart,
  Share2,
  BadgeCheck,
  Send,
  Phone,
  Globe,
  Mail,
  CheckCircle,
  Info
} from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import AppFooter from '../components/AppFooter.vue'
import ContactUsFAB from '../components/ContactUsFAB.vue'
import ListingFormDrawer from '../components/services/ListingFormDrawer.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// UI State
const selectedCategory = ref('all')
const showCategoryMenu = ref(false)
const showSortMenu = ref(false)
const sortBy = ref('featured')
const showListingDrawer = ref(false)
const showVendorDrawer = ref(false)
const showListingFormDrawer = ref(false)
const editingListing = ref<Listing | null>(null)

// Message state
const message = ref<{ type: 'success' | 'info'; text: string } | null>(null)

// Mock Data Types
interface Vendor {
  id: string
  name: string
  logo: string
  tagline: string
  description: string
  city: string
  country: string
  email: string
  phone: string
  listingsCount: number
}

interface Listing {
  id: string
  title: string
  tagline: string
  description: string
  coverImage: string
  category: string
  priceDisplay: string
  vendorName: string
  vendorLogo: string
  vendorVerified: boolean
  tags: string[]
  serviceArea: string
  views: number
  contactClicks: number
  isFeatured: boolean
  gallery: string[]
}

// Selected items
const selectedListing = ref<Listing | null>(null)
const selectedVendor = ref<Vendor | null>(null)

// Service categories with icons
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

// Computed
const selectedCategoryName = computed(() => {
  const cat = serviceCategories.value.find(c => c.id === selectedCategory.value)
  return cat?.id === 'all' ? 'All' : cat?.name || 'All'
})

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
const selectCategory = (id: string) => {
  selectedCategory.value = id
  showCategoryMenu.value = false
}

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

const handleListService = () => {
  editingListing.value = null
  showListingFormDrawer.value = true
}

const handleEditListing = (listing: Listing) => {
  // Convert to form-compatible format
  editingListing.value = {
    ...listing,
    priceType: 'fixed',
    priceMin: null,
    priceMax: null,
    currency: 'THB',
    priceUnit: '',
    telegramUsername: '',
    phone: '',
    website: '',
  } as any
  showListingFormDrawer.value = true
}

const handleListingCreated = (listing: any) => {
  showMessage('success', `Listing "${listing.title}" created successfully!`)
  // In real implementation, would refresh the listings
}

const handleListingUpdated = (listing: any) => {
  showMessage('success', `Listing "${listing.title}" updated successfully!`)
  // In real implementation, would refresh the listings
}

const handleListingDeleted = (listingId: string) => {
  showMessage('info', `Listing deleted successfully`)
  // In real implementation, would refresh the listings
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

// Handle click outside to close category menu
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showCategoryMenu.value && !target.closest('.category-filter-container')) {
    showCategoryMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from > div:last-child,
.drawer-leave-to > div:last-child {
  transform: translateX(100%);
}

/* Hide scrollbar for horizontal scroll */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Line clamp utilities */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Glass effect styles to match Discover page */
.glass-pill {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.glass-pill:hover {
  background: rgba(255, 255, 255, 0.8);
}

.glass-button {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.75);
}

.glass-dropdown {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.1),
    0 4px 12px rgba(30, 144, 255, 0.08);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
