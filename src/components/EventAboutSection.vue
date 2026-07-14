<template>
  <div class="space-y-4 sm:space-y-5 pb-8">
    <!-- ============ 1. HERO ============ -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
      <!-- Banner Image (1200x630 ratio) -->
      <div v-if="event.banner_image" class="relative w-full aspect-[1.9/1] bg-slate-100">
        <img
          :src="bannerUrl"
          :alt="event.title"
          class="w-full h-full object-cover"
          fetchpriority="high"
        />
      </div>

      <div class="p-4 sm:p-6 space-y-4">
        <!-- Title, organizer & category -->
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {{ event.title }}
          </h1>
          <div class="mt-2 flex items-center justify-between gap-3">
            <!-- Organizer -->
            <div v-if="event.organizer_details" class="flex items-center gap-2 min-w-0 text-sm text-slate-600">
              <img
                v-if="event.organizer_details.profile_picture && !organizerAvatarError"
                :src="getProfileUrl(event.organizer_details.profile_picture)"
                :alt="organizerName"
                class="w-7 h-7 rounded-full object-cover flex-shrink-0"
                @error="handleOrganizerAvatarError"
              />
              <div v-else class="w-7 h-7 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {{ getInitials(organizerName) }}
              </div>
              <span class="font-medium truncate">{{ organizerName }}</span>
            </div>

            <!-- Category Badge -->
            <span v-if="event.category_details" class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full flex-shrink-0">
              <span class="text-slate-400">#</span>
              {{ event.category_details.name }}
            </span>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl flex-shrink-0 shadow-md shadow-emerald-900/10 overflow-hidden ring-1 ring-black/5">
            <div class="h-[38%] bg-gradient-to-r from-emerald-500 to-sky-500 flex items-center justify-center">
              <span class="text-[8px] font-bold text-white uppercase tracking-wider">{{ getMonthAbbr(event.start_date) }}</span>
            </div>
            <div class="h-[62%] bg-white flex items-center justify-center">
              <span class="text-lg font-bold text-slate-800 leading-none">{{ getDayOfMonth(event.start_date) }}</span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-900 text-sm sm:text-base">{{ getFormattedDate(event.start_date) }}</p>
            <p class="text-xs sm:text-sm text-slate-600">{{ getTimeRange(event.start_date, event.end_date) }}</p>
          </div>
        </div>

        <!-- Location -->
        <div v-if="event.location || event.is_virtual" class="flex items-center gap-3">
          <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Video v-if="event.is_virtual" class="w-5 h-5 text-slate-600" />
            <MapPin v-else class="w-5 h-5 text-slate-600" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-900 text-sm sm:text-base truncate">
              {{ event.is_virtual ? t('management.overview.location.virtual') : (event.location || t('management.overview.location.tbd')) }}
            </p>
            <p v-if="event.is_virtual && event.virtual_link" class="text-xs sm:text-sm text-slate-600 truncate">
              {{ event.virtual_link }}
            </p>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <button
            @click="showCalendarSheet = true"
            class="flex items-center gap-1.5 px-3 py-2 min-h-[40px] bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <CalendarPlus class="w-4 h-4 text-slate-500" />
            {{ t('management.overview.calendar.addToCalendar') }}
          </button>
          <button
            v-if="!event.is_virtual && event.location"
            @click="openMap"
            class="flex items-center gap-1.5 px-3 py-2 min-h-[40px] bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <ExternalLink class="w-4 h-4 text-slate-500" />
            {{ t('management.overview.location.viewOnMap') }}
          </button>
          <button
            v-if="event.is_virtual && event.virtual_link"
            @click="$emit('join-virtual')"
            class="flex items-center gap-1.5 px-3 py-2 min-h-[40px] bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <ExternalLink class="w-4 h-4 text-slate-500" />
            {{ t('management.overview.location.joinVirtual') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ 2. AT A GLANCE (organizer dashboard) ============ -->
    <div v-if="event.can_edit" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-slate-900">{{ t('management.overview.glance.title') }}</h2>
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
          :class="countdownPillClass"
        >
          <span v-if="countdown.state === 'today'" class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <Clock v-else class="w-3.5 h-3.5" />
          {{ countdownLabel }}
        </span>
      </div>

      <!-- Tappable stat tiles -->
      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          v-for="tile in glanceTiles"
          :key="tile.key"
          @click="$emit('navigate', tile.tab)"
          class="group text-left rounded-xl bg-slate-50 ring-1 ring-slate-100 hover:ring-slate-200 hover:bg-slate-100/70 active:scale-95 transition-all p-3"
        >
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
              <component :is="tile.icon" class="h-3 w-3 text-slate-500" aria-hidden="true" />
            </span>
            <span class="truncate text-[10px] sm:text-xs font-medium text-slate-500">{{ tile.label }}</span>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <span
              v-if="tile.loading"
              class="inline-block h-5 w-8 animate-pulse rounded bg-slate-200"
              aria-hidden="true"
            />
            <span v-else class="text-lg sm:text-xl font-bold leading-none text-slate-900 tabular-nums">
              {{ tile.count === null ? '–' : tile.count }}
            </span>
            <ChevronRight class="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
        </button>
      </div>

      <!-- Invitation progress -->
      <button
        v-if="hasTemplatePayment"
        @click="$emit('navigate', 'guest-management')"
        class="w-full text-left space-y-2 rounded-xl p-3 -m-1 hover:bg-slate-50 active:bg-slate-100 transition-colors"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('management.overview.glance.invitations') }}</span>
          <span class="flex items-center gap-0.5 text-xs font-medium text-[#1e90ff]">
            {{ t('management.overview.glance.manageGuests') }}
            <ChevronRight class="w-3.5 h-3.5" />
          </span>
        </div>
        <div
          class="flex w-full h-2 overflow-hidden rounded-full bg-slate-100"
          :class="{ 'animate-pulse': loadingStats }"
          aria-hidden="true"
        >
          <template v-if="!loadingStats">
            <div class="h-full bg-emerald-500 transition-all duration-700 ease-out" :style="{ width: segmentWidth(invitationViewed) }" />
            <div class="h-full bg-sky-500 transition-all duration-700 ease-out" :style="{ width: segmentWidth(invitationSent - invitationViewed) }" />
          </template>
        </div>
        <p class="text-xs text-slate-500">
          {{ t('management.overview.glance.invitationProgress', { sent: invitationSent, total: invitationTotal, viewed: invitationViewed }) }}
        </p>
      </button>

      <!-- Populate from Template (only while the event still looks empty) -->
      <div v-if="showPopulateTool" class="space-y-2">
        <div class="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-100 rounded-xl">
          <div class="flex items-center gap-2 min-w-0">
            <Wand2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span class="text-sm font-medium text-slate-700 truncate">{{ t('management.overview.populate.label') }}</span>
          </div>
          <button
            @click="handlePopulateClick"
            :disabled="populateLoading"
            class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="populateLoading" class="w-3.5 h-3.5 animate-spin" />
            <Wand2 v-else class="w-3.5 h-3.5" />
            {{ populateLoading ? t('management.overview.populate.loading') : t('management.overview.populate.btn') }}
          </button>
        </div>
      </div>
      <!-- Populate feedback message -->
      <Transition name="fade">
        <div
          v-if="populateMessage"
          :class="populateMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'"
          class="text-xs px-3 py-2 rounded-lg border"
        >
          {{ populateMessage.text }}
        </div>
      </Transition>
    </div>

    <!-- ============ 3. ABOUT ============ -->
    <div v-if="event.description || event.can_edit" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h2 class="text-base font-semibold text-slate-900">{{ t('management.overview.sections.aboutEvent') }}</h2>
        <button
          v-if="event.can_edit && event.description"
          @click="$emit('edit-event')"
          class="p-1.5 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
          :aria-label="t('management.overview.summary.editAria')"
        >
          <Pencil class="w-4 h-4" />
        </button>
      </div>
      <div v-if="event.description" class="prose prose-sm max-w-none text-slate-700" v-html="sanitizedDescription" />
      <button
        v-else
        @click="$emit('edit-event')"
        class="w-full border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 rounded-2xl p-6 text-center transition-colors group"
      >
        <FileText class="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-500 transition-colors" />
        <p class="mt-2 text-sm font-medium text-slate-700">{{ t('management.overview.summary.addDescriptionTitle') }}</p>
        <p class="mt-0.5 text-xs text-slate-500">{{ t('management.overview.summary.addDescriptionDesc') }}</p>
      </button>
    </div>

    <!-- ============ 4. LOCATION MAP ============ -->
    <div v-if="googleMapEmbedUrl" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
      <div class="flex items-center justify-between gap-3 mb-3">
        <h2 class="text-base font-semibold text-slate-900">{{ t('management.overview.sections.location') }}</h2>
        <button
          v-if="!event.is_virtual && event.location"
          @click="openMap"
          class="flex items-center gap-0.5 text-xs font-medium text-[#1e90ff] hover:text-[#1873cc] transition-colors"
        >
          {{ t('management.overview.location.viewOnMap') }}
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
      <p v-if="event.location" class="text-sm text-slate-600 mb-3 truncate">{{ event.location }}</p>
      <div class="rounded-xl overflow-hidden border border-slate-200">
        <iframe
          :src="googleMapEmbedUrl"
          width="100%"
          height="250"
          style="border: 0"
          allowfullscreen
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          class="w-full"
        />
      </div>
    </div>

    <!-- ============ 5. AGENDA SUMMARY ============ -->
    <div v-if="totalAgendaItems > 0 || event.can_edit" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
      <div class="flex items-center gap-2 mb-3">
        <h2 class="text-base font-semibold text-slate-900">{{ t('management.overview.sections.agenda') }}</h2>
        <span v-if="totalAgendaItems > 0" class="text-sm font-normal text-slate-400">· {{ totalAgendaItems }}</span>
      </div>

      <template v-if="totalAgendaItems > 0">
        <div class="divide-y divide-slate-100">
          <div
            v-for="row in agendaPreview"
            :key="row.item.id"
            class="flex items-start justify-between gap-3 py-2.5"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-900 truncate">{{ row.item.title }}</p>
              <p v-if="row.dayLabel" class="text-xs text-slate-400 mt-0.5">{{ row.dayLabel }}</p>
            </div>
            <p v-if="formatAgendaTime(row.item)" class="text-xs sm:text-sm text-slate-500 whitespace-nowrap flex-shrink-0 pt-0.5">
              {{ formatAgendaTime(row.item) }}
            </p>
          </div>
        </div>
        <button
          @click="$emit('navigate', 'agenda')"
          class="mt-2 w-full flex items-center justify-center gap-1 py-2.5 min-h-[40px] text-sm font-medium text-[#1e90ff] hover:bg-sky-50 active:bg-sky-100 rounded-xl transition-colors"
        >
          {{ t('management.overview.summary.manageAgenda') }}
          <ChevronRight class="w-4 h-4" />
        </button>
      </template>
      <button
        v-else
        @click="$emit('navigate', 'agenda')"
        class="w-full border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 rounded-2xl p-6 text-center transition-colors group"
      >
        <CalendarDays class="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-500 transition-colors" />
        <p class="mt-2 text-sm font-medium text-slate-700">{{ t('management.overview.summary.addAgendaTitle') }}</p>
        <p class="mt-0.5 text-xs text-slate-500">{{ t('management.overview.summary.addAgendaDesc') }}</p>
      </button>
    </div>

    <!-- ============ 6. HOSTS SUMMARY ============ -->
    <div v-if="(event.hosts && event.hosts.length > 0) || event.can_edit" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
      <div class="flex items-center gap-2 mb-3">
        <h2 class="text-base font-semibold text-slate-900">{{ t('management.overview.sections.hostedBy') }}</h2>
        <span v-if="event.hosts && event.hosts.length > 0" class="text-sm font-normal text-slate-400">· {{ event.hosts.length }}</span>
      </div>

      <template v-if="event.hosts && event.hosts.length > 0">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div
            v-for="host in hostsPreview"
            :key="host.id"
            class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
          >
            <img
              v-if="host.profile_image && !hostAvatarErrors[host.id]"
              :src="getProfileUrl(host.profile_image)"
              :alt="host.name"
              class="w-11 h-11 rounded-full object-cover flex-shrink-0"
              loading="lazy"
              @error="() => handleHostAvatarError(host.id)"
            />
            <div v-else class="w-11 h-11 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {{ getInitials(host.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-slate-900 truncate">{{ host.name }}</p>
              <p v-if="host.title" class="text-xs sm:text-sm text-slate-500 truncate">{{ host.title }}</p>
            </div>
          </div>
        </div>
        <button
          @click="$emit('navigate', 'hosts')"
          class="mt-2 w-full flex items-center justify-center gap-1 py-2.5 min-h-[40px] text-sm font-medium text-[#1e90ff] hover:bg-sky-50 active:bg-sky-100 rounded-xl transition-colors"
        >
          {{ t('management.overview.summary.manageHosts') }}
          <ChevronRight class="w-4 h-4" />
        </button>
      </template>
      <button
        v-else
        @click="$emit('navigate', 'hosts')"
        class="w-full border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 rounded-2xl p-6 text-center transition-colors group"
      >
        <Mic class="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-500 transition-colors" />
        <p class="mt-2 text-sm font-medium text-slate-700">{{ t('management.overview.summary.addHostsTitle') }}</p>
        <p class="mt-0.5 text-xs text-slate-500">{{ t('management.overview.summary.addHostsDesc') }}</p>
      </button>
    </div>

    <!-- ============ 7. SOCIAL MEDIA PREVIEW (collapsed) ============ -->
    <div v-if="event.can_edit" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
      <button
        @click="showSocialPreview = !showSocialPreview"
        class="w-full flex items-center justify-between gap-3 p-4 sm:p-6 text-left hover:bg-slate-50/50 transition-colors"
        :aria-expanded="showSocialPreview"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Share2 class="w-4 h-4 text-slate-600" />
          </div>
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-slate-900">{{ t('management.overview.sections.socialPreview') }}</h2>
            <p class="text-xs text-slate-500 line-clamp-1">{{ t('management.overview.sections.socialPreviewDesc') }}</p>
          </div>
        </div>
        <ChevronDown
          class="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200"
          :class="{ 'rotate-180': showSocialPreview }"
        />
      </button>

      <div v-show="showSocialPreview" class="px-4 pb-4 sm:px-6 sm:pb-6">
        <!-- Facebook Preview Card -->
        <div class="border border-slate-300 rounded-xl overflow-hidden bg-white">
          <div class="aspect-[1.91/1] relative overflow-hidden bg-slate-200">
            <img
              v-if="previewImage"
              :src="previewImage"
              :alt="event.title || 'Event Preview'"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <ImageIcon class="w-16 h-16 text-slate-400" />
            </div>
          </div>
          <div class="p-4">
            <div class="text-sm text-slate-600 uppercase tracking-wide mb-1">{{ hostname }}</div>
            <div class="text-lg font-semibold text-slate-900 mb-1 line-clamp-2">{{ metaTitle }}</div>
            <div class="text-sm text-slate-600 line-clamp-3">{{ metaDescription }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 8. TEAM ============ -->
    <EventCollaboratorsTab
      v-if="event.can_edit"
      :event-id="event.id"
      :event-title="event.title"
      :can-edit="event.can_edit || false"
      :organizer-details="event.organizer_details"
    />

    <!-- ============ 9. REVIEW ============ -->
    <EventReviewTab
      v-if="event.can_edit"
      :event-id="event.id"
      :can-edit="event.can_edit || false"
    />
  </div>

  <!-- Add to Calendar bottom sheet -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showCalendarSheet"
        class="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
        @click="showCalendarSheet = false"
      />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showCalendarSheet"
        class="fixed inset-x-0 bottom-0 z-[999] bg-white rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)]"
        role="dialog"
        :aria-label="t('management.overview.calendar.addToCalendar')"
      >
        <div class="flex justify-center pt-3">
          <div class="w-10 h-1 rounded-full bg-slate-300" />
        </div>
        <p class="px-5 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {{ t('management.overview.calendar.addToCalendar') }}
        </p>
        <div class="max-h-[60vh] overflow-y-auto overscroll-contain">
          <button
            @click="addToGoogleCalendar"
            class="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 active:bg-slate-50 transition-colors"
          >
            <Calendar class="w-4 h-4 text-slate-500" />
            {{ t('management.overview.calendar.google') }}
          </button>
          <button
            @click="addToOutlookCalendar"
            class="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 active:bg-slate-50 transition-colors"
          >
            <Calendar class="w-4 h-4 text-slate-500" />
            {{ t('management.overview.calendar.outlook') }}
          </button>
          <button
            @click="downloadICSFile"
            class="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 active:bg-slate-50 transition-colors"
          >
            <Download class="w-4 h-4 text-slate-500" />
            {{ t('management.overview.calendar.downloadIcs') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Populate from Template Dialog -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="populateDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="populateDialog = null" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle class="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">{{ t('management.overview.dialog.title') }}</h3>
              <p class="text-sm text-slate-600 mt-1">
                {{ t('management.overview.dialog.contains') }}
              </p>
              <ul class="text-sm text-slate-700 mt-2 space-y-0.5">
                <li v-if="populateDialog.existing_data.texts">{{ t('management.overview.dialog.texts') }} <strong>{{ populateDialog.existing_data.texts }}</strong></li>
                <li v-if="populateDialog.existing_data.hosts">{{ t('management.overview.dialog.hosts') }} <strong>{{ populateDialog.existing_data.hosts }}</strong></li>
                <li v-if="populateDialog.existing_data.agenda">{{ t('management.overview.dialog.agendaItems') }} <strong>{{ populateDialog.existing_data.agenda }}</strong></li>
              </ul>
              <p class="text-sm text-slate-600 mt-3">{{ t('management.overview.dialog.howToProceed') }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-2 pt-2">
            <button
              @click="runPopulate('skip')"
              :disabled="populateLoading"
              class="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-60"
            >
              {{ t('management.overview.dialog.skipExisting') }}
            </button>
            <button
              @click="runPopulate('overwrite')"
              :disabled="populateLoading"
              class="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60"
            >
              {{ t('management.overview.dialog.overwriteAll') }}
            </button>
            <button
              @click="populateDialog = null"
              class="w-full px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              {{ t('common.actions.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import DOMPurify from 'dompurify'
import {
  MapPin,
  Video,
  Calendar,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Mic,
  Pencil,
  Share2,
  Users,
  Wand2,
  Loader2,
  AlertTriangle,
} from 'lucide-vue-next'
import { type Event, guestService, type GuestStats, eventsService } from '../services/api'
import { apiClient } from '../services/api'
import { extractGoogleMapsEmbedUrl } from '../utils/embedExtractor'
import type { EventAgendaItem } from '../services/api/types/event.types'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useAppLanguage } from '../composables/useAppLanguage'
import { isImageKitEnabled } from '../composables/useImageKitConfig'

const EventCollaboratorsTab = defineAsyncComponent(() => import('./EventCollaboratorsTab.vue'))
const EventReviewTab = defineAsyncComponent(() => import('./EventReviewTab.vue'))

interface Props {
  event: Event
}

interface Emits {
  (e: 'join-virtual'): void
  (e: 'navigate', tab: string): void
  (e: 'edit-event'): void
}

const props = defineProps<Props>()
const { t } = useAppLanguage()
defineEmits<Emits>()

// Use payment template integration composable
const { isTemplateActivated, loadPayments } = usePaymentTemplateIntegration(props.event)

// Guest statistics state
const guestStats = ref<GuestStats | null>(null)
const loadingStats = ref(false)

// Check if event has template payment enabled (required for guest management)
const hasTemplatePayment = computed(() => {
  if (!props.event?.event_template) return false
  return isTemplateActivated.value
})

// Load guest stats
const loadGuestData = async () => {
  if (!props.event?.id || !props.event.can_edit || !hasTemplatePayment.value) return

  loadingStats.value = true
  try {
    const statsResponse = await guestService.getGuestStats(props.event.id)
    if (statsResponse.success && statsResponse.data) {
      guestStats.value = statsResponse.data
    }
  } catch (error) {
    console.error('Error loading guest data:', error)
  } finally {
    loadingStats.value = false
  }
}

// Load data on mount and when event/template payment status changes
onMounted(async () => {
  await loadPayments()
  loadGuestData()
})

watch(() => props.event?.id, async () => {
  await loadPayments()
  loadGuestData()
})

watch(hasTemplatePayment, (isActivated) => {
  if (isActivated) {
    loadGuestData()
  }
})

// UI state
const showCalendarSheet = ref(false)
const showSocialPreview = ref(false)

// Lock page scroll while the calendar sheet is open
watch(showCalendarSheet, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

const onKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return
  if (showCalendarSheet.value) {
    showCalendarSheet.value = false
  } else if (populateDialog.value) {
    populateDialog.value = null
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

// Populate from template state
type PopulateCheckData = {
  category: string
  template_available: boolean
  existing_data: { texts: number; hosts: number; agenda: number; has_data: boolean }
}
const populateLoading = ref(false)
const populateDialog = ref<PopulateCheckData | null>(null)
const populateMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Only surface the populate tool while the event still looks empty
const showPopulateTool = computed(() => {
  if (!props.event.can_edit) return false
  const agendaCount = props.event.agenda_items?.length ?? 0
  const hostsCount = props.event.hosts?.length ?? 0
  return agendaCount === 0 || hostsCount === 0
})

const handlePopulateClick = async () => {
  populateLoading.value = true
  populateMessage.value = null
  try {
    const response = await eventsService.checkPopulateTemplate(props.event.id)
    if (!response.success || !response.data) {
      populateMessage.value = { type: 'error', text: response.message || t('management.overview.populate.errorCheck') }
      return
    }
    const check = response.data
    if (!check.template_available) {
      populateMessage.value = { type: 'error', text: t('management.overview.populate.errorNoTemplate', { category: check.category }) }
      return
    }
    if (!check.existing_data.has_data) {
      await runPopulate('skip')
    } else {
      populateDialog.value = check
    }
  } catch {
    populateMessage.value = { type: 'error', text: t('management.overview.populate.errorCheck') }
  } finally {
    populateLoading.value = false
  }
}

const runPopulate = async (mode: 'skip' | 'overwrite') => {
  populateLoading.value = true
  populateDialog.value = null
  try {
    const response = await eventsService.populateTemplate(props.event.id, mode)
    if (!response.success || !response.data) {
      populateMessage.value = { type: 'error', text: response.message || t('management.overview.populate.errorGeneric') }
      return
    }
    const { texts, hosts, agenda } = response.data.results
    const total = texts.created + hosts.created + agenda.created
    populateMessage.value = {
      type: 'success',
      text: t('management.overview.populate.success', {
        total,
        texts: texts.created,
        hosts: hosts.created,
        agenda: agenda.created,
      }),
    }
    setTimeout(() => { populateMessage.value = null }, 5000)
  } catch {
    populateMessage.value = { type: 'error', text: t('management.overview.populate.errorGeneric') }
  } finally {
    populateLoading.value = false
  }
}

// Avatar error states
const organizerAvatarError = ref(false)
const hostAvatarErrors = ref<Record<number, boolean>>({})

const handleOrganizerAvatarError = () => {
  organizerAvatarError.value = true
}

const handleHostAvatarError = (hostId: number) => {
  hostAvatarErrors.value[hostId] = true
}

// Countdown to event start
const countdown = computed<{ state: 'ended' | 'today' | 'upcoming'; days: number }>(() => {
  const now = new Date()
  const end = new Date(props.event.end_date || props.event.start_date)
  if (now > end) return { state: 'ended', days: 0 }

  const startDay = new Date(props.event.start_date)
  startDay.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const days = Math.round((startDay.getTime() - today.getTime()) / 86400000)
  if (days <= 0) return { state: 'today', days: 0 }
  return { state: 'upcoming', days }
})

const countdownLabel = computed(() => {
  const c = countdown.value
  if (c.state === 'ended') return t('management.overview.glance.ended')
  if (c.state === 'today') return t('management.overview.glance.today')
  return c.days === 1
    ? t('management.overview.glance.dayToGo')
    : t('management.overview.glance.daysToGo', { n: c.days })
})

const countdownPillClass = computed(() => {
  switch (countdown.value.state) {
    case 'today':
      return 'bg-emerald-50 text-emerald-600'
    case 'ended':
      return 'bg-slate-100 text-slate-500'
    default:
      return 'bg-sky-50 text-sky-600'
  }
})

// At-a-glance tiles (all tappable, deep-link into their tabs)
const glanceTiles = computed(() => [
  {
    key: 'guests',
    tab: 'guest-management',
    icon: Users,
    label: t('management.overview.glance.guests'),
    count: guestStats.value ? guestStats.value.total_guests : null,
    loading: loadingStats.value,
  },
  {
    key: 'agenda',
    tab: 'agenda',
    icon: CalendarDays,
    label: t('management.overview.glance.agendaItems'),
    count: props.event.agenda_items?.length ?? 0,
    loading: false,
  },
  {
    key: 'hosts',
    tab: 'hosts',
    icon: Mic,
    label: t('management.overview.glance.hosts'),
    count: props.event.hosts?.length ?? 0,
    loading: false,
  },
])

// Invitation progress
const invitationTotal = computed(() => guestStats.value?.total_guests ?? 0)
const invitationSent = computed(() => guestStats.value?.sent ?? 0)
const invitationViewed = computed(() => guestStats.value?.viewed ?? 0)

const segmentWidth = (count: number) => {
  if (invitationTotal.value === 0) return '0%'
  const pct = (Math.min(Math.max(count, 0), invitationTotal.value) / invitationTotal.value) * 100
  return `${pct.toFixed(1)}%`
}

const hostname = computed(() => {
  return window.location.hostname
})

const metaTitle = computed(() => {
  if (!props.event?.title) return 'សូមគោរពអញ្ជើញ ភ្ញៀវកិត្តិយស'
  return `${props.event.title} - សូមគោរពអញ្ជើញ ភ្ញៀវកិត្តិយស`
})

const metaDescription = computed(() => {
  if (!props.event) return 'Event description will appear here.'
  return props.event.short_description?.trim() || 'Event description will appear here.'
})

// Get organizer name
const organizerName = computed(() => {
  if (!props.event.organizer_details) return 'GoEvent'
  const { first_name, last_name, username } = props.event.organizer_details
  if (first_name && last_name) return `${first_name} ${last_name}`
  return first_name || username || 'GoEvent'
})

// Sanitize HTML description
const sanitizedDescription = computed(() => {
  if (!props.event.description) return ''
  return DOMPurify.sanitize(props.event.description, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
  })
})

// Google Map embed URL
const googleMapEmbedUrl = computed(() => {
  if (!props.event.google_map_embed_link) return ''
  return extractGoogleMapsEmbedUrl(props.event.google_map_embed_link)
})

// Grouped agenda items
interface AgendaGroup {
  date: string
  displayDate: string
  items: EventAgendaItem[]
}

const groupedAgendaItems = computed(() => {
  if (!props.event.agenda_items) return {} as Record<string, AgendaGroup>

  const sorted = [...props.event.agenda_items].sort((a, b) => a.order - b.order)
  const groups: Record<string, AgendaGroup> = {}

  sorted.forEach((item) => {
    const dateKey = item.date_text || item.date || props.event.start_date || 'unknown'
    const dateForDisplay = item.date || props.event.start_date || new Date().toISOString()

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateForDisplay,
        displayDate: item.date_text || getFormattedDate(dateForDisplay),
        items: []
      }
    }
    groups[dateKey].items.push(item)
  })

  return groups
})

// Flat preview of the first few agenda items (day label only shown for multi-day events)
const totalAgendaItems = computed(() => props.event.agenda_items?.length ?? 0)

const agendaPreview = computed(() => {
  const groups = groupedAgendaItems.value
  const keys = Object.keys(groups)
  const rows: { item: EventAgendaItem; dayLabel: string }[] = []
  keys.forEach((key) => {
    groups[key].items.forEach((item) => {
      rows.push({ item, dayLabel: keys.length > 1 ? groups[key].displayDate : '' })
    })
  })
  return rows.slice(0, 4)
})

// Hosts preview (first 4)
const hostsPreview = computed(() => (props.event.hosts ?? []).slice(0, 4))

// URL helpers
const resolveMediaUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return path.startsWith('/') ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/media/${path}`
}

// Route media through the ImageKit proxy with a sized transform (same convention as EventCard)
const optimizeImage = (url: string, transform: string): string => {
  if (!isImageKitEnabled()) return url
  let out = url
  if (out.includes('api.goevent.online/media/')) {
    out = out.replace('https://api.goevent.online/media/', 'https://ik.imagekit.io/goevent/media/')
  }
  if (out.includes('ik.imagekit.io')) {
    const match = out.match(/(https:\/\/ik\.imagekit\.io\/[^/]+)(\/.*)/)
    if (match) {
      return `${match[1]}/tr:${transform}${match[2]}`
    }
  }
  return out
}

const bannerUrl = computed(() => {
  if (!props.event.banner_image) return ''
  return optimizeImage(resolveMediaUrl(props.event.banner_image), 'w-1080,h-567')
})

const previewImage = computed(() => {
  if (!props.event?.banner_image) return null
  return optimizeImage(resolveMediaUrl(props.event.banner_image), 'w-640,h-335')
})

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

const openMap = () => {
  if (!props.event.location) return
  const encoded = encodeURIComponent(props.event.location)
  window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank')
}

// Calendar functions
const addToGoogleCalendar = () => {
  const startDate = new Date(props.event.start_date)
  const endDate = new Date(props.event.end_date)

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

  const title = sanitizeText(props.event.title, 200)
  const description = sanitizeText(
    props.event.description || props.event.short_description || '',
    500
  )

  let location = ''
  if (props.event.is_virtual) {
    location = props.event.virtual_link || 'Virtual Event'
  } else {
    location = sanitizeText(props.event.location || '', 200)
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
  showCalendarSheet.value = false
}

const addToOutlookCalendar = () => {
  const startDate = new Date(props.event.start_date)
  const endDate = new Date(props.event.end_date)

  const params = new URLSearchParams({
    subject: props.event.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: props.event.description || props.event.short_description || '',
    location: props.event.is_virtual
      ? props.event.virtual_link || 'Virtual Event'
      : props.event.location || '',
  })

  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank')
  showCalendarSheet.value = false
}

const downloadICSFile = () => {
  const startDate = new Date(props.event.start_date)
  const endDate = new Date(props.event.end_date)

  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GoEvent//Event Calendar//EN
BEGIN:VEVENT
UID:${props.event.id}@goevent.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${props.event.title}
DESCRIPTION:${props.event.description || props.event.short_description || ''}
LOCATION:${
    props.event.is_virtual
      ? props.event.virtual_link || 'Virtual Event'
      : props.event.location || ''
  }
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  showCalendarSheet.value = false
}
</script>

<style scoped>
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

.prose :deep(h1) {
  @apply text-xl font-bold text-slate-900 mb-3 mt-4;
}

.prose :deep(h2) {
  @apply text-lg font-bold text-slate-900 mb-2 mt-3;
}

.prose :deep(h3) {
  @apply text-base font-semibold text-slate-900 mb-2 mt-3;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active {
    transition: none;
  }
}
</style>
