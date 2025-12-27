<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] lg:w-[580px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-white border-b border-slate-100 z-10">
          <div class="flex items-center justify-between px-4 py-3">
            <!-- Left Actions -->
            <div class="flex items-center gap-2">
              <button
                @click="closeDrawer"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close"
              >
                <ChevronDown class="w-5 h-5 text-slate-600 md:hidden" />
                <ChevronRight class="w-5 h-5 text-slate-600 hidden md:block" />
              </button>
            </div>

            <!-- Right Actions -->
            <div class="flex items-center gap-1">
              <button
                @click="navigatePrev"
                :disabled="!hasPrev"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp class="w-5 h-5 text-slate-600" />
              </button>
              <button
                @click="navigateNext"
                :disabled="!hasNext"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown class="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- Donation Form (Inline) -->
          <div v-if="showDonationForm && event" class="p-4">
            <PublicDonationForm
              :event-id="event.id"
              :currency="event.fundraising_currency || 'USD'"
              @back="showDonationForm = false"
              @donated="handleDonationComplete"
            />
          </div>

          <!-- Loading State -->
          <div v-else-if="loading" class="p-6">
            <div class="animate-pulse space-y-4">
              <div class="h-48 bg-slate-200 rounded-xl"></div>
              <div class="h-6 bg-slate-200 rounded w-3/4"></div>
              <div class="h-4 bg-slate-200 rounded w-1/2"></div>
              <div class="space-y-2">
                <div class="h-4 bg-slate-200 rounded"></div>
                <div class="h-4 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="!showDonationForm && error" class="p-6 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle class="w-8 h-8 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Unable to Load Event</h3>
            <p class="text-slate-600 mb-4">{{ error }}</p>
            <button
              @click="loadEvent"
              class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>

          <!-- Event Content -->
          <div v-else-if="!showDonationForm && event" class="pb-24">
            <!-- Banner Image - Unified design with overlay for all events -->
            <div class="relative">
              <!-- Banner Image (1200x630 ratio = 1.905:1 for non-fundraising, 16:9 for fundraising) -->
              <div class="relative w-full" :style="isFundraisingEnabled ? 'aspect-ratio: 16/9;' : 'aspect-ratio: 1200 / 630;'">
                <img
                  v-if="!fallbackBannerError"
                  :src="currentBannerSrc"
                  :alt="event.title"
                  class="w-full h-full object-cover"
                  @error="handleBannerImageError"
                />
                <!-- Fallback when both primary and fallback images fail -->
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 flex flex-col items-center justify-center"
                >
                  <CalendarDays class="w-12 h-12 text-[#2ecc71]/40 mb-2" />
                  <span class="text-sm text-slate-400">{{ event.category_details?.name || 'Event' }}</span>
                </div>

                <!-- Gradient overlay for all events -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                <!-- Category/Fundraiser Badge (Top Left) -->
                <div class="absolute top-4 left-4">
                  <span
                    v-if="isFundraisingEnabled"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-700 shadow-lg"
                  >
                    <Heart class="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                    Fundraiser
                  </span>
                  <span
                    v-else-if="event.category_details"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-slate-700 shadow-lg"
                  >
                    <span class="text-slate-400">#</span>
                    {{ event.category_details.name }}
                  </span>
                </div>

                <!-- Title & Organizer Overlay (Bottom with spacing for fundraising card) -->
                <div class="absolute bottom-0 left-0 right-0 p-5" :class="isFundraisingEnabled ? 'pb-8' : 'pb-5'">
                  <h1 class="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
                    {{ event.title }}
                  </h1>
                  <div class="flex items-center gap-2 text-white/90 text-sm">
                    <div class="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span class="text-xs font-medium">{{ getInitials(organizerName) }}</span>
                    </div>
                    <span>by {{ organizerName }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Donation/Fundraising Section - Floating Card Above Content -->
            <div v-if="isFundraisingEnabled" class="px-4 -mt-6 mb-6 relative z-10">
              <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <!-- Progress Stats -->
                <div class="p-5">
                  <!-- Amount Raised -->
                  <div class="flex items-baseline gap-2 mb-1">
                    <span class="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                      {{ formatCurrency(parseFloat(fundraisingProgress?.total_raised || '0'), fundraisingProgress?.currency || event.fundraising_currency || 'USD') }}
                    </span>
                    <span class="text-slate-500 text-sm">
                      raised of {{ formatCurrency(parseFloat(fundraisingProgress?.goal || event.fundraising_goal || '0'), fundraisingProgress?.currency || event.fundraising_currency || 'USD') }}
                    </span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="relative h-3 bg-slate-100 rounded-full overflow-hidden mt-4 mb-4">
                    <div
                      class="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out"
                      :style="{ width: `${Math.min(fundraisingProgressPercentage, 100)}%` }"
                    />
                    <!-- Animated shimmer -->
                    <div
                      class="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-shimmer"
                      :style="{ width: `${Math.min(fundraisingProgressPercentage, 100)}%` }"
                    />
                  </div>

                  <!-- Stats Row -->
                  <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-4">
                      <div class="flex items-center gap-1.5 text-slate-600">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                        </svg>
                        <span class="font-medium">{{ fundraisingProgress?.total_donors || 0 }}</span>
                        <span class="text-slate-400">donors</span>
                      </div>
                      <div v-if="fundraisingDaysLeft !== null" class="flex items-center gap-1.5 text-slate-600">
                        <Clock class="w-4 h-4 text-slate-400" />
                        <span class="font-medium">{{ fundraisingDaysLeft }}</span>
                        <span class="text-slate-400">days left</span>
                      </div>
                    </div>
                    <span class="text-emerald-600 font-semibold">{{ fundraisingProgressPercentage }}%</span>
                  </div>
                </div>

                <!-- Donate CTA -->
                <div class="px-5 pb-5">
                  <button
                    @click="showDonationForm = true"
                    class="w-full relative overflow-hidden group bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                  >
                    <span class="relative z-10 flex items-center justify-center gap-2">
                      <Heart class="w-5 h-5" />
                      Donate Now
                    </span>
                    <!-- Hover glow effect -->
                    <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </button>
                </div>

                <!-- Recent Donors -->
                <div v-if="fundraisingProgress?.recent_donations && fundraisingProgress.recent_donations.length > 0" class="border-t border-slate-100 px-5 py-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Supporters</h3>
                  </div>
                  <div class="space-y-3">
                    <div
                      v-for="donation in fundraisingProgress.recent_donations.slice(0, 3)"
                      :key="donation.id"
                      class="flex items-center gap-3"
                    >
                      <div
                        class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                        :style="{ background: getDonorGradient(donation.display_name || 'Anonymous') }"
                      >
                        {{ getInitials(donation.display_name || 'Anonymous') }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-slate-900 text-sm truncate">{{ donation.display_name || 'Anonymous' }}</p>
                        <p class="text-xs text-slate-400">{{ formatRelativeTime(donation.created_at) }}</p>
                      </div>
                      <span v-if="donation.amount" class="text-sm font-semibold text-slate-700">
                        {{ formatCurrency(parseFloat(donation.amount), donation.currency) }}
                      </span>
                      <span v-else-if="donation.item_quantity" class="text-sm font-semibold text-slate-700">
                        {{ donation.item_quantity }} {{ donation.item_unit }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Event Info -->
            <div class="px-4 space-y-5" :class="isFundraisingEnabled ? 'pt-0' : 'pt-5'">
              <!-- Date & Time -->
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl flex-shrink-0 shadow-md shadow-emerald-900/10 overflow-hidden ring-1 ring-black/5">
                  <!-- Month Header -->
                  <div class="h-[38%] bg-gradient-to-r from-emerald-500 to-sky-500 flex items-center justify-center">
                    <span class="text-[8px] font-bold text-white uppercase tracking-wider">{{ getMonthAbbr(event.start_date) }}</span>
                  </div>
                  <!-- Day Number -->
                  <div class="h-[62%] bg-white flex items-center justify-center">
                    <span class="text-lg font-bold text-slate-800 leading-none">{{ getDayOfMonth(event.start_date) }}</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900">{{ getFormattedDate(event.start_date) }}</p>
                  <p class="text-sm text-slate-600">{{ getTimeRange(event.start_date, event.end_date) }}</p>

                  <!-- Calendar Options Dropdown -->
                  <div v-if="showCalendarOptions" class="mt-2 flex flex-wrap gap-2">
                    <button
                      @click="addToGoogleCalendar"
                      class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Google
                    </button>
                    <button
                      @click="addToOutlookCalendar"
                      class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Outlook
                    </button>
                    <button
                      @click="downloadICSFile"
                      class="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Download .ics
                    </button>
                  </div>
                </div>
              </div>

              <!-- Location -->
              <div v-if="event.location || event.is_virtual" class="flex items-start gap-4">
                <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Video v-if="event.is_virtual" class="w-5 h-5 text-slate-600" />
                  <MapPin v-else class="w-5 h-5 text-slate-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900">
                    {{ event.is_virtual ? 'Virtual Event' : event.location }}
                  </p>
                  <button
                    v-if="!event.is_virtual && event.location"
                    @click="openMap"
                    class="mt-1.5 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <ExternalLink class="w-4 h-4" />
                    View on Map
                  </button>
                </div>
              </div>

              <!-- Registration Section - Already Registered (You're In) -->
              <div v-if="event.registration_required && isUserRegistered" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <!-- Header with avatar and status -->
                <div class="p-4 pb-3">
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-medium shadow-md">
                      {{ getInitials(currentUser?.first_name || currentUser?.username || 'U') }}
                    </div>
                    <!-- Status Badge -->
                    <span :class="registrationStatusBadgeClass" class="px-2.5 py-1 text-xs font-medium rounded-full">
                      {{ registrationStatusLabel }}
                    </span>
                  </div>
                  <h3 class="text-xl font-bold text-slate-900">You're In</h3>
                </div>

                <!-- Event countdown -->
                <div v-if="timeUntilEvent || event.is_ongoing" class="mx-4 mb-3 bg-slate-50 rounded-lg p-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-slate-600">
                      <Clock class="w-4 h-4" />
                      <span class="text-sm">{{ event.is_ongoing ? 'Event is happening now' : 'Event starting in' }}</span>
                    </div>
                    <span v-if="timeUntilEvent" class="text-sm font-semibold text-orange-500">{{ timeUntilEvent }}</span>
                  </div>
                  <p v-if="event.is_virtual && event.virtual_link" class="text-xs text-slate-500 mt-1.5 border-t border-slate-200 pt-2">
                    The join button will be shown when the event is about to start.
                  </p>
                </div>

                <!-- Action buttons -->
                <div class="px-4 pb-3 flex gap-2">
                  <button
                    @click="showCalendarOptions = !showCalendarOptions"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <CalendarPlus class="w-4 h-4" />
                    Add to Calendar
                  </button>
                  <button
                    @click="shareEvent"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Share2 class="w-4 h-4" />
                    Invite a Friend
                  </button>
                </div>

                <!-- Calendar Options Dropdown -->
                <div v-if="showCalendarOptions" class="px-4 pb-3 flex flex-wrap gap-2">
                  <button
                    @click="addToGoogleCalendar"
                    class="px-3 py-1.5 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Google
                  </button>
                  <button
                    @click="addToOutlookCalendar"
                    class="px-3 py-1.5 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Outlook
                  </button>
                  <button
                    @click="downloadICSFile"
                    class="px-3 py-1.5 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Download .ics
                  </button>
                </div>

                <!-- Cancel registration link -->
                <div class="px-4 pb-4 text-sm text-slate-600">
                  No longer able to attend? Notify the host by
                  <button
                    @click="handleCancelRegistration"
                    :disabled="isCancelling"
                    class="text-pink-500 hover:text-pink-600 underline underline-offset-2 disabled:opacity-50"
                  >
                    {{ isCancelling ? 'cancelling...' : 'canceling your registration' }}
                  </button>.
                </div>

                <!-- Confirmation code (if available) -->
                <div v-if="userRegistration?.confirmation_code" class="border-t border-slate-100 px-4 py-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs text-slate-500 mb-0.5">Confirmation Code</p>
                      <p class="font-mono font-semibold text-slate-900">{{ userRegistration.confirmation_code }}</p>
                    </div>
                    <button
                      @click="showQRModal = true"
                      class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Show QR Code"
                    >
                      <QrCode class="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Registration Section - Not Registered -->
              <div v-else-if="event.registration_required" class="bg-slate-50 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-slate-700 mb-3">Registration</h3>
                <p class="text-sm text-slate-600 mb-4">
                  {{ registrationMessage }}
                </p>

                <!-- User Info (if logged in) -->
                <div v-if="currentUser" class="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-slate-200">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                    {{ getInitials(currentUser.first_name || currentUser.username || 'U') }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-slate-900 truncate">{{ currentUser.first_name || currentUser.username }}</p>
                    <p class="text-sm text-slate-500 truncate">{{ currentUser.email }}</p>
                  </div>
                </div>

                <!-- Register Button -->
                <button
                  v-if="canRegister"
                  @click="handleRegister"
                  :disabled="isRegistering"
                  class="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isRegistering ? 'Registering...' : 'Register' }}
                </button>

                <!-- Login to Register -->
                <button
                  v-else-if="!currentUser"
                  @click="handleLoginToRegister"
                  class="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Login to Register
                </button>

                <!-- Registration Closed/Full/Past -->
                <div
                  v-else
                  class="w-full bg-slate-100 text-slate-500 font-semibold py-3 px-4 rounded-xl text-center"
                >
                  <template v-if="isEventFull">Event is Full</template>
                  <template v-else-if="isRegistrationClosed">Registration Closed</template>
                  <template v-else-if="event && event.is_past">Event Has Ended</template>
                  <template v-else>Registration Unavailable</template>
                </div>
              </div>

              <!-- About Event -->
              <div class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">About Event</h3>
                <div
                  v-if="event.description"
                  class="prose prose-sm max-w-none text-slate-700"
                  v-html="sanitizedDescription"
                />
                <p v-else-if="event.short_description" class="text-slate-700 leading-relaxed">
                  {{ event.short_description }}
                </p>
                <p v-else class="text-slate-500 italic">No description provided.</p>
              </div>

              <!-- Agenda -->
              <div v-if="event.agenda_items && event.agenda_items.length > 0" class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Agenda</h3>
                <div class="space-y-3">
                  <div
                    v-for="(group, dateKey) in groupedAgendaItems"
                    :key="dateKey"
                    class="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <!-- Date Group Header -->
                    <button
                      @click="toggleAgendaGroup(dateKey)"
                      class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white rounded-lg flex flex-col items-center justify-center border border-slate-200">
                          <span class="text-[9px] font-semibold text-slate-500 uppercase leading-none">{{ getMonthAbbr(group.date) }}</span>
                          <span class="text-sm font-bold text-slate-900 leading-tight">{{ getDayOfMonth(group.date) }}</span>
                        </div>
                        <div class="text-left">
                          <p class="font-medium text-slate-900 text-sm">{{ group.displayDate }}</p>
                          <p class="text-xs text-slate-500">{{ group.items.length }} {{ group.items.length === 1 ? 'item' : 'items' }}</p>
                        </div>
                      </div>
                      <ChevronDown
                        class="w-5 h-5 text-slate-400 transition-transform duration-200"
                        :class="{ 'rotate-180': expandedAgendaGroups[dateKey] }"
                      />
                    </button>

                    <!-- Agenda Items -->
                    <div
                      v-show="expandedAgendaGroups[dateKey]"
                      class="divide-y divide-slate-100"
                    >
                      <div
                        v-for="item in group.items"
                        :key="item.id"
                        class="flex items-center justify-between gap-3 px-4 py-2.5"
                      >
                        <p class="font-medium text-slate-900 truncate">{{ item.title }}</p>
                        <p v-if="item.start_time_text || item.end_time_text" class="text-sm text-slate-500 flex-shrink-0">
                          {{ formatAgendaTime(item) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Location Map -->
              <div v-if="googleMapEmbedUrl" class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Location</h3>
                <div class="rounded-xl overflow-hidden border border-slate-200">
                  <iframe
                    :src="googleMapEmbedUrl"
                    width="100%"
                    height="200"
                    style="border:0;"
                    allowfullscreen
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Hosts - Unified Card Style for All Events -->
              <div v-if="event.hosts && event.hosts.length > 0" class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {{ isFundraisingEnabled ? 'Campaign Organizer' : 'Hosted By' }}
                </h3>
                <div class="bg-slate-50 rounded-xl p-4">
                  <div class="flex items-center gap-3">
                    <div
                      v-if="event.hosts[0].profile_image"
                      class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold overflow-hidden"
                    >
                      <img
                        :src="getProfileUrl(event.hosts[0].profile_image)"
                        :alt="event.hosts[0].name"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div v-else class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                      {{ getInitials(event.hosts[0].name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-slate-900 truncate">{{ event.hosts[0].name }}</p>
                      <p class="text-sm text-slate-500">{{ isFundraisingEnabled ? 'Campaign Organizer' : 'Event Organizer' }}</p>
                    </div>
                    <button
                      v-if="event.hosts[0].title"
                      class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>

              <!-- Share Banner - Unified CTA Footer for All Events -->
              <div class="border-t border-slate-100 pt-5">
                <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="font-semibold mb-1">Help spread the word</h4>
                      <p class="text-slate-400 text-sm">{{ isFundraisingEnabled ? 'Share this campaign with friends' : 'Share this event with friends' }}</p>
                    </div>
                    <button
                      @click="shareEvent"
                      class="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 rounded-xl font-medium text-sm hover:bg-slate-100 transition-colors"
                    >
                      <Share2 class="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- QR Code Modal -->
    <Transition name="fade">
      <div
        v-if="showQRModal && userRegistration?.confirmation_code"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]"
        @click="showQRModal = false"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-xs w-full"
          @click.stop
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900">Check-in QR Code</h3>
            <button
              @click="showQRModal = false"
              class="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div class="flex flex-col items-center">
            <div class="bg-white p-3 rounded-xl border border-slate-200 mb-4">
              <img
                :src="qrCodeUrl"
                :alt="userRegistration.confirmation_code"
                class="w-48 h-48"
              />
            </div>
            <p class="text-xs text-slate-500 mb-1">Confirmation Code</p>
            <p class="font-mono font-bold text-lg text-slate-900">{{ userRegistration.confirmation_code }}</p>
            <p class="text-xs text-slate-500 mt-3 text-center">Show this QR code at the event for quick check-in</p>
          </div>
        </div>
      </div>
    </Transition>

    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Video,
  AlertCircle,
  CalendarPlus,
  ExternalLink,
  CalendarDays,
  Clock,
  Share2,
  QrCode,
  X,
  Heart,
} from 'lucide-vue-next'
import { eventsService, donationService, type Event, type EventRegistration } from '../services/api'
import type { FundraisingProgress } from '../services/api/types/donation.types'
import { getEventFallbackImage } from '@/composables/useEventFormatters'
import { useAuthStore } from '../stores/auth'
import { apiClient } from '../services/api'
import { extractGoogleMapsEmbedUrl } from '../utils/embedExtractor'
import PublicDonationForm from './PublicDonationForm.vue'

interface Props {
  modelValue: boolean
  eventId: string | null
  hasPrev?: boolean
  hasNext?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'navigate-prev'): void
  (e: 'navigate-next'): void
  (e: 'registered'): void
  (e: 'login-required'): void
}

const props = withDefaults(defineProps<Props>(), {
  hasPrev: false,
  hasNext: false,
})

const emit = defineEmits<Emits>()

const router = useRouter()
const authStore = useAuthStore()

// State
const event = ref<Event | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const isRegistering = ref(false)
const isCancelling = ref(false)
const showCalendarOptions = ref(false)
const expandedAgendaGroups = ref<Record<string, boolean>>({})
const userRegistration = ref<EventRegistration | null>(null)
const showQRModal = ref(false)

// Donation state
const showDonationForm = ref(false)
const fundraisingProgress = ref<FundraisingProgress | null>(null)

// Banner image fallback state
const primaryBannerError = ref(false)
const fallbackBannerError = ref(false)

// Handle banner image load error - try fallback first, then show placeholder
const handleBannerImageError = () => {
  if (!primaryBannerError.value) {
    primaryBannerError.value = true
  } else {
    fallbackBannerError.value = true
  }
}

// Reset banner error states when event changes
const resetBannerErrors = () => {
  primaryBannerError.value = false
  fallbackBannerError.value = false
}

// Computed
const currentUser = computed(() => authStore.user)

const organizerName = computed(() => {
  if (!event.value?.organizer_details) return 'GoEvent'
  const { first_name, last_name, username } = event.value.organizer_details
  if (first_name && last_name) return `${first_name} ${last_name}`
  return first_name || username || 'GoEvent'
})

const sanitizedDescription = computed(() => {
  if (!event.value?.description) return ''
  return DOMPurify.sanitize(event.value.description, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
  })
})

const isEventFull = computed(() => {
  if (!event.value || !event.value.max_attendees) return false
  return event.value.registrations_count >= event.value.max_attendees
})

const isRegistrationClosed = computed(() => {
  if (!event.value?.registration_deadline) return false
  return new Date(event.value.registration_deadline) < new Date()
})

// Track if registration was explicitly checked (to differentiate from initial state)
const registrationChecked = ref(false)

// Statuses that mean user is NOT actively registered/attending (lowercase for comparison)
const NON_ATTENDING_STATUSES = ['not_coming', 'declined', 'cancelled', 'withdrawn', 'no']

// Registration status label for display
const registrationStatusLabel = computed(() => {
  const status = userRegistration.value?.status || ''
  // Capitalize first letter of each word
  return status.replace(/\b\w/g, (c) => c.toUpperCase())
})

// Registration status badge styling
const registrationStatusBadgeClass = computed(() => {
  const status = userRegistration.value?.status?.toLowerCase() || ''
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-700'
    case 'checked in':
    case 'checked_in':
      return 'bg-blue-100 text-blue-700'
    case 'registered':
      return 'bg-amber-100 text-amber-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
})

// Check if user is registered and attending - combine event data and separate registration check
const isUserRegistered = computed(() => {
  // If we explicitly checked registration status, use that as source of truth
  if (registrationChecked.value) {
    if (!userRegistration.value) {
      // User has no registration or registration was deleted
      return false
    }
    // User is only considered "registered" if status indicates active attendance
    // Backend returns: 'Registered', 'Confirmed', 'Checked In', 'Cancelled'
    const status = userRegistration.value.status?.toLowerCase() || ''
    if (NON_ATTENDING_STATUSES.includes(status)) {
      return false
    }
    return true
  }
  // Fallback to event data before registration is checked
  if (event.value?.is_registered) return true
  return false
})

const canRegister = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  if (isUserRegistered.value || event.value.is_past) return false
  if (!event.value.registration_required) return false
  if (isEventFull.value || isRegistrationClosed.value) return false
  return true
})

const registrationMessage = computed(() => {
  if (!event.value?.registration_required) return ''
  if (isUserRegistered.value) return 'You are registered for this event.'
  if (isEventFull.value) return 'This event has reached capacity.'
  if (isRegistrationClosed.value) return 'Registration for this event has closed.'
  return 'Welcome! To join the event, please register below.'
})

const googleMapEmbedUrl = computed(() => {
  if (!event.value?.google_map_embed_link) return ''
  return extractGoogleMapsEmbedUrl(event.value.google_map_embed_link)
})

// Check if event has fundraising enabled
const isFundraisingEnabled = computed(() => {
  return event.value?.is_fundraising === true
})

// Fundraising progress percentage
const fundraisingProgressPercentage = computed(() => {
  if (!fundraisingProgress.value) return 0
  // Use the percentage from API if available
  if (fundraisingProgress.value.percentage !== undefined) {
    return Math.round(fundraisingProgress.value.percentage)
  }
  // Otherwise calculate it
  const current = parseFloat(fundraisingProgress.value.total_raised || '0')
  const goal = parseFloat(fundraisingProgress.value.goal || event.value?.fundraising_goal || '1')
  return Math.round((current / goal) * 100)
})

// Calculate days remaining for fundraising
const fundraisingDaysLeft = computed(() => {
  if (!event.value?.fundraising_deadline) return null
  const deadline = new Date(event.value.fundraising_deadline)
  const now = new Date()
  const diffTime = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
})

// Generate QR code URL for confirmation code
const qrCodeUrl = computed(() => {
  if (!userRegistration.value?.confirmation_code) return ''
  const code = encodeURIComponent(userRegistration.value.confirmation_code)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${code}`
})

// Calculate time until event starts
const timeUntilEvent = computed(() => {
  if (!event.value?.start_date) return null

  const now = new Date()
  const eventStart = new Date(event.value.start_date)
  const diff = eventStart.getTime() - now.getTime()

  if (diff <= 0) return null // Event has started or passed

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return `${days}d ${hours}h`
  }

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
})

// Current banner image source - primary first, then fallback
const currentBannerSrc = computed(() => {
  if (!event.value) return ''
  if (!primaryBannerError.value && event.value.banner_image) {
    return getBannerUrl(event.value.banner_image)
  }
  return getEventFallbackImage(event.value)
})

import type { EventAgendaItem } from '../services/api/types/event.types'

interface AgendaGroup {
  date: string
  displayDate: string
  items: EventAgendaItem[]
}

const groupedAgendaItems = computed(() => {
  if (!event.value?.agenda_items) return {} as Record<string, AgendaGroup>

  const sorted = [...event.value.agenda_items].sort((a, b) => a.order - b.order)
  const groups: Record<string, AgendaGroup> = {}

  sorted.forEach((item) => {
    // Use date_text as primary, fallback to date field, then event start_date
    const dateKey = item.date_text || item.date || event.value?.start_date || 'unknown'
    const dateForDisplay = item.date || event.value?.start_date || new Date().toISOString()

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateForDisplay,
        displayDate: item.date_text || getFormattedDate(dateForDisplay),
        items: []
      }
      // Auto-expand first group
      if (Object.keys(groups).length === 1 && expandedAgendaGroups.value[dateKey] === undefined) {
        expandedAgendaGroups.value[dateKey] = true
      }
    }
    groups[dateKey].items.push(item)
  })

  return groups
})

const toggleAgendaGroup = (dateKey: string) => {
  expandedAgendaGroups.value[dateKey] = !expandedAgendaGroups.value[dateKey]
}

// Methods
const loadEvent = async () => {
  if (!props.eventId) return

  loading.value = true
  error.value = null
  resetBannerErrors()
  userRegistration.value = null
  registrationChecked.value = false

  try {
    // Fetch event data and user's registration status in parallel
    const eventPromise = eventsService.getEvent(props.eventId)
    const registrationPromise = authStore.isAuthenticated
      ? eventsService.getMyRegistration(props.eventId)
      : Promise.resolve(null)

    const [eventResponse, registrationResponse] = await Promise.all([
      eventPromise,
      registrationPromise,
    ])

    if (eventResponse.success && eventResponse.data) {
      event.value = eventResponse.data

      // Mark that we've checked registration status
      if (authStore.isAuthenticated) {
        registrationChecked.value = true
      }

      // Store the full registration data if user is registered
      // If registrationResponse is null/error/empty, userRegistration stays null
      // which means isUserRegistered will return false
      if (registrationResponse && registrationResponse.success && registrationResponse.data) {
        userRegistration.value = registrationResponse.data
      }

      // Load fundraising progress if fundraising is enabled
      if (event.value.is_fundraising) {
        try {
          const progressResponse = await donationService.getFundraisingProgress(props.eventId!)
          if (progressResponse.success && progressResponse.data) {
            fundraisingProgress.value = progressResponse.data
          }
        } catch (err) {
          console.warn('Could not load fundraising progress:', err)
        }
      }
    } else {
      error.value = eventResponse.message || 'Event not found'
    }
  } catch (err) {
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

const closeDrawer = () => {
  emit('update:modelValue', false)
}

const navigatePrev = () => {
  emit('navigate-prev')
}

const navigateNext = () => {
  emit('navigate-next')
}

const handleRegister = async () => {
  if (!event.value || !authStore.isAuthenticated) return

  isRegistering.value = true

  try {
    const response = await eventsService.registerForEvent(event.value.id, {
      guest_count: 0,
      notes: '',
    })

    if (response.success && response.data) {
      // Update local registration state with the returned registration data
      userRegistration.value = response.data
      emit('registered')
      await loadEvent()
    }
  } catch (err) {
    console.error('Registration failed:', err)
  } finally {
    isRegistering.value = false
  }
}

const handleLoginToRegister = () => {
  emit('login-required')
  closeDrawer()
  router.push(`/signin?redirect=${encodeURIComponent(`/events/${props.eventId}`)}`)
}

const handleDonationComplete = async () => {
  // Close the donation form
  showDonationForm.value = false

  // Refresh fundraising progress after a donation
  if (event.value?.is_fundraising && props.eventId) {
    try {
      const progressResponse = await donationService.getFundraisingProgress(props.eventId)
      if (progressResponse.success && progressResponse.data) {
        fundraisingProgress.value = progressResponse.data
      }
    } catch (err) {
      console.warn('Could not refresh fundraising progress:', err)
    }
  }
}

const handleCancelRegistration = async () => {
  if (!event.value || !authStore.isAuthenticated) return

  isCancelling.value = true

  try {
    // Use unregister endpoint to cancel registration (same as RSVPSection)
    const response = await eventsService.unregisterFromEvent(event.value.id)

    console.log('Unregister response:', response)

    if (response.success) {
      // Handle the response - backend may return updated registration or nothing
      if (response.data) {
        // Backend returns wrapped response { registration } or direct registration object
        const registrationData = (response.data as { registration?: EventRegistration }).registration || response.data

        console.log('Registration data after cancel:', registrationData)
        console.log('Registration status:', registrationData.status)

        // Store the updated registration data
        userRegistration.value = registrationData
      } else {
        console.log('No registration data returned - registration deleted')
        // No registration data returned - registration was deleted
        userRegistration.value = null
      }

      // Ensure registrationChecked is true so isUserRegistered uses our updated state
      registrationChecked.value = true
      console.log('isUserRegistered after cancel:', isUserRegistered.value)
    }
  } catch (err) {
    console.error('Cancel registration failed:', err)
  } finally {
    isCancelling.value = false
  }
}

const shareEvent = async () => {
  if (!event.value) return

  // Use SSR redirect URL for proper meta tags when shared
  const shareUrl = `https://goevent.online/e/${event.value.id}`
  const shareData = {
    title: event.value.title,
    text: event.value.short_description || event.value.title,
    url: shareUrl,
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(shareUrl)
      // Could show a toast here
    }
  } catch {
    // User cancelled or share failed
  }
}

const openMap = () => {
  if (!event.value?.location) return
  const encoded = encodeURIComponent(event.value.location)
  window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank')
}

// URL helpers
const getBannerUrl = (bannerImage: string): string => {
  if (bannerImage.startsWith('http://') || bannerImage.startsWith('https://')) {
    return bannerImage
  }
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (bannerImage.startsWith('/')) {
    return `${API_BASE_URL}${bannerImage}`
  }
  return `${API_BASE_URL}/media/${bannerImage}`
}

const getProfileUrl = (profileImage: string): string => {
  return apiClient.getProfilePictureUrl(profileImage) || ''
}

// Date/time helpers
const getMonthAbbr = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

const getDayOfMonth = (dateStr: string): string => {
  return new Date(dateStr).getDate().toString()
}

const getFormattedDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

const getTimeRange = (startStr: string, endStr: string): string => {
  const start = new Date(startStr)
  const end = new Date(endStr)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return `${formatTime(start)} - ${formatTime(end)}`
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const formatAgendaTime = (item: { start_time_text?: string; end_time_text?: string }): string => {
  const start = item.start_time_text || ''
  const end = item.end_time_text || ''
  if (start && end) {
    return `${start} - ${end}`
  }
  return start || end
}

// Calendar functions
const addToGoogleCalendar = () => {
  if (!event.value) return

  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const sanitizeText = (text: string, maxLength = 1000): string => {
    if (!text) return ''
    let cleaned = text.replace(/<[^>]*>/g, '')
    cleaned = cleaned
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
      .trim()
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...'
    }
    return cleaned
  }

  const title = sanitizeText(event.value.title, 200)
  const description = sanitizeText(
    event.value.description || event.value.short_description || '',
    500
  )

  let location = ''
  if (event.value.is_virtual) {
    location = event.value.virtual_link || 'Virtual Event'
  } else {
    location = sanitizeText(event.value.location || '', 200)
  }

  const baseUrl = 'https://calendar.google.com/calendar/render'
  const params = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(title)}`,
    `dates=${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
    `details=${encodeURIComponent(description)}`,
    `location=${encodeURIComponent(location)}`,
    'trp=false'
  ].join('&')

  window.open(`${baseUrl}?${params}`, '_blank')
  showCalendarOptions.value = false
}

const addToOutlookCalendar = () => {
  if (!event.value) return

  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)

  const params = new URLSearchParams({
    subject: event.value.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: event.value.description || event.value.short_description || '',
    location: event.value.is_virtual
      ? event.value.virtual_link || 'Virtual Event'
      : event.value.location || '',
  })

  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank')
  showCalendarOptions.value = false
}

const downloadICSFile = () => {
  if (!event.value) return

  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)

  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GoEvent//Event Calendar//EN
BEGIN:VEVENT
UID:${event.value.id}@goevent.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${event.value.title}
DESCRIPTION:${event.value.description || event.value.short_description || ''}
LOCATION:${
    event.value.is_virtual
      ? event.value.virtual_link || 'Virtual Event'
      : event.value.location || ''
  }
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.value.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  showCalendarOptions.value = false
}

// Fundraising helper functions
const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getDonorGradient = (name: string): string => {
  const gradients = [
    'linear-gradient(135deg, #10b981, #0d9488)', // emerald to teal
    'linear-gradient(135deg, #0ea5e9, #0284c7)', // sky to blue
    'linear-gradient(135deg, #8b5cf6, #7c3aed)', // violet to purple
    'linear-gradient(135deg, #f59e0b, #d97706)', // amber to orange
    'linear-gradient(135deg, #ec4899, #db2777)', // pink to rose
    'linear-gradient(135deg, #06b6d4, #0891b2)', // cyan
  ]
  // Simple hash to pick consistent gradient for same name
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`

  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
}

// Watchers
watch(
  () => props.eventId,
  (newId) => {
    if (newId && props.modelValue) {
      loadEvent()
    }
  },
  { immediate: true }
)

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.eventId) {
      loadEvent()
    }
    // Prevent body scroll when drawer is open, compensate for scrollbar width
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      // Add padding to prevent layout shift when scrollbar disappears
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // Defer body style resets until after transition completes (350ms)
      // to prevent layout recalculation during animation
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 350)
    }
  }
)

onMounted(() => {
  if (props.modelValue && props.eventId) {
    loadEvent()
  }
})
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%) translateZ(0);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%) translateZ(0);
  }
}

/* Shimmer animation for progress bar */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

/* Prose styling for description */
.prose :deep(p) {
  @apply mb-3 leading-relaxed;
}

.prose :deep(strong) {
  @apply font-semibold text-slate-900;
}

.prose :deep(a) {
  @apply text-blue-600 hover:text-blue-700 underline;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply ml-4 mb-3 space-y-1;
}

.prose :deep(li) {
  @apply leading-relaxed;
}
</style>
