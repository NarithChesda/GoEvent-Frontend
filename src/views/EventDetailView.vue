<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <Navigation />
    
    <!-- Loading State -->
    <div v-if="loading" class="pt-24 pb-16">
      <div class="max-w-4xl mx-auto px-6 lg:px-8">
        <div class="animate-pulse">
          <div class="h-64 bg-slate-200 rounded-3xl mb-8"></div>
          <div class="h-8 bg-slate-200 rounded mb-4"></div>
          <div class="h-4 bg-slate-200 rounded mb-2"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Event Detail -->
    <div v-else-if="event">

      <!-- Streamlined Hero Banner Section -->
      <div class="relative h-[400px] sm:h-[450px] lg:h-[500px] flex items-end bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 overflow-hidden">
        <!-- Enhanced Background Elements -->
        <div class="absolute inset-0">
          <!-- Primary gradient overlay -->
          <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-500/5 to-blue-700/5"></div>
          
          <!-- Animated background shapes -->
          <div class="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-blue-600/30 rounded-full mix-blend-multiply filter blur-2xl animate-pulse"></div>
          <div class="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-purple-400/25 to-purple-600/25 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-1000"></div>
          <div class="absolute -bottom-8 left-20 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-500"></div>
          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
          
          <!-- Geometric patterns -->
          <div class="absolute top-32 right-32 w-4 h-4 bg-blue-500/30 rounded-full animate-pulse delay-300"></div>
          <div class="absolute bottom-32 left-32 w-6 h-6 bg-purple-500/30 rounded-full animate-pulse delay-900"></div>
          <div class="absolute top-64 left-64 w-3 h-3 bg-blue-600/40 rounded-full animate-pulse delay-1200"></div>
        </div>
        
        
        <!-- Streamlined Hero Content -->
        <div class="hero-content relative z-10 w-full pt-8 pb-8">
          <div class="w-full max-w-7xl mx-auto px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
              <!-- Left Column: Main Event Info -->
              <div class="lg:col-span-2">
                <!-- Category and Status -->
                <div class="flex flex-wrap items-center gap-4 mb-6">
                  <div v-if="event.category_name" class="flex items-center space-x-2">
                    <div 
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: event.category_color || '#8B5CF6' }"
                    ></div>
                    <span class="text-sm font-semibold text-slate-600 tracking-wide">
                      {{ event.category_name }}
                    </span>
                  </div>
                  
                  <span 
                    v-if="event.is_ongoing"
                    class="inline-flex items-center bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                  >
                    <div class="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    Live Now
                  </span>
                  <span 
                    v-else-if="event.is_upcoming"
                    class="inline-flex items-center bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                  >
                    Upcoming
                  </span>
                  <span 
                    v-else-if="event.is_past"
                    class="inline-flex items-center bg-slate-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                  >
                    Past Event
                  </span>
                </div>

                <!-- Title -->
                <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                  <span class="typing-text">
                    {{ displayText }}<span v-if="!isComplete" class="typing-cursor">|</span>
                  </span>
                </h1>

                <!-- Key Event Details -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <!-- Date & Time -->
                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Calendar class="w-5 h-5 text-blue-600" />
                    </div>
                    <div class="flex-1">
                      <p class="text-lg font-semibold text-slate-800 mb-1 leading-snug">{{ formatEventDate(event.start_date) }}</p>
                      <p class="text-base text-slate-600 leading-relaxed">{{ formatEventTime(event.start_date) }}</p>
                    </div>
                  </div>

                  <!-- Location -->
                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <MapPin v-if="!event.is_virtual" class="w-5 h-5 text-green-600" />
                      <Monitor v-else class="w-5 h-5 text-blue-600" />
                    </div>
                    <div class="flex-1">
                      <p class="text-lg font-semibold text-slate-800 mb-1 leading-snug">
                        {{ event.is_virtual ? 'Virtual Event' : (event.location || 'Location TBA') }}
                      </p>
                      <p class="text-base text-slate-600 leading-relaxed">
                        {{ event.is_virtual ? 'Join online' : 'In-person event' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Short Description -->
                <p class="text-lg text-slate-600 leading-relaxed max-w-prose mb-8">
                  {{ event.short_description || 'Join us for an exciting event experience!' }}
                </p>
              </div>

              <!-- Right Column: Action Area -->
              <div class="lg:col-span-1">
                <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-blue-500/25 border border-white/20">
                  <!-- Attendance Info -->
                  <div class="mb-6">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-semibold text-slate-700 uppercase tracking-wider">Attendance</span>
                      <span class="text-xl font-bold text-slate-900 leading-none">
                        {{ event.registrations_count }}
                        <span v-if="event.max_attendees" class="text-base text-slate-500">/ {{ event.max_attendees }}</span>
                      </span>
                    </div>
                    <div v-if="event.max_attendees" class="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${Math.min(100, (event.registrations_count / event.max_attendees) * 100)}%` }"
                      ></div>
                    </div>
                  </div>

                  <!-- Primary Action -->
                  <div class="space-y-4">
                    <!-- Main Action Button -->
                    <button
                      v-if="canRegister"
                      @click="registerForEvent"
                      :disabled="isRegistering"
                      class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:scale-[1.03] hover:-translate-y-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                      <UserPlus class="w-5 h-5 mr-3" />
                      {{ isRegistering ? 'Registering...' : 'Register Now' }}
                    </button>
                    
                    <div
                      v-if="event.is_registered"
                      class="w-full inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold shadow-xl shadow-green-500/30 text-lg"
                    >
                      <CheckCircle class="w-5 h-5 mr-3" />
                      You're Registered
                    </div>
                    
                    <!-- Virtual Event Access -->
                    <button
                      v-if="event.virtual_link && (event.is_ongoing || event.is_registered)"
                      @click="joinVirtualEvent"
                      class="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.02] flex items-center justify-center"
                    >
                      <ExternalLink class="w-4 h-4 mr-2" />
                      Join Virtual Event
                    </button>

                    <!-- Secondary Actions - Calendar Integration -->
                    <div class="pt-2 border-t border-slate-200">
                      <p class="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 text-center">Add to Calendar</p>
                      <div class="grid grid-cols-3 gap-2">
                        <button
                          @click="addToGoogleCalendar"
                          class="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center"
                        >
                          <Calendar class="w-3 h-3 mr-1" />
                          Google
                        </button>
                        <button
                          @click="addToOutlookCalendar"
                          class="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center"
                        >
                          <Calendar class="w-3 h-3 mr-1" />
                          Outlook
                        </button>
                        <button
                          @click="downloadICSFile"
                          class="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center"
                        >
                          <Download class="w-3 h-3 mr-1" />
                          .ics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Section with Settings-Style Navigation -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Mobile Horizontal Scrollable Navigation -->
          <div class="lg:hidden mb-6">
            <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-2">
              <div class="flex overflow-x-auto scrollbar-hide space-x-1" style="scrollbar-width: none; -ms-overflow-style: none;">
                <button
                  @click="activeTab = 'about'"
                  :class="[
                    'flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition-all duration-200 flex-shrink-0',
                    activeTab === 'about'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <Calendar class="w-4 h-4" />
                  <span>About</span>
                </button>
                
                <button
                  @click="activeTab = 'agenda'"
                  :class="[
                    'flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition-all duration-200 flex-shrink-0',
                    activeTab === 'agenda'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <FileText class="w-4 h-4" />
                  <span>Agenda</span>
                </button>
                
                <button
                  @click="activeTab = 'hosts'"
                  :class="[
                    'flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition-all duration-200 flex-shrink-0',
                    activeTab === 'hosts'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <Users class="w-4 h-4" />
                  <span>Hosts</span>
                </button>
                
                <button
                  v-if="canViewAttendees"
                  @click="activeTab = 'attendees'"
                  :class="[
                    'flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition-all duration-200 flex-shrink-0',
                    activeTab === 'attendees'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <UserPlus class="w-4 h-4" />
                  <span>Attendees</span>
                </button>
                
                <button
                  @click="activeTab = 'media'"
                  :class="[
                    'flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition-all duration-200 flex-shrink-0',
                    activeTab === 'media'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <ImageIcon class="w-4 h-4" />
                  <span>Media</span>
                </button>
                
                <button
                  @click="activeTab = 'collaborator'"
                  :class="[
                    'flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition-all duration-200 flex-shrink-0',
                    activeTab === 'collaborator'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <Users class="w-4 h-4" />
                  <span>Team</span>
                </button>
                
                <button
                  v-if="event.can_edit"
                  @click="activeTab = 'event-texts'"
                  :class="[
                    'flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition-all duration-200 flex-shrink-0',
                    activeTab === 'event-texts'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <FileText class="w-4 h-4" />
                  <span>Texts</span>
                </button>
                
                <button
                  @click="activeTab = 'template'"
                  :class="[
                    'flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition-all duration-200 flex-shrink-0',
                    activeTab === 'template'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                    <Monitor class="w-4 h-4" />
                    <span>Template</span>
                  </button>
              </div>
            </div>
          </div>

          <!-- Event Navigation - Sidebar (Settings Style) -->
          <div class="w-full lg:w-64 flex-shrink-0">
            <div class="p-6 sticky top-24">
              <!-- Event Details Title -->
              <div class="mb-8 hidden lg:block">
                <div class="flex items-center space-x-3">
                  <div class="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                  <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Details</h2>
                </div>
              </div>
              
              <nav class="space-y-1 hidden lg:block">
                <button
                  @click="activeTab = 'about'"
                  :class="[
                    'flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium text-sm',
                    activeTab === 'about'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <Calendar class="w-5 h-5" />
                  <span>About</span>
                </button>
                
                <button
                  @click="activeTab = 'agenda'"
                  :class="[
                    'flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium text-sm',
                    activeTab === 'agenda'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <FileText class="w-5 h-5" />
                  <span>Agenda</span>
                </button>
                
                <button
                  @click="activeTab = 'hosts'"
                  :class="[
                    'flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium text-sm',
                    activeTab === 'hosts'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <Users class="w-5 h-5" />
                  <span>Hosts & Speakers</span>
                </button>
                
                <button
                  v-if="canViewAttendees"
                  @click="activeTab = 'attendees'"
                  :class="[
                    'flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium text-sm',
                    activeTab === 'attendees'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <UserPlus class="w-5 h-5" />
                  <span>Attendees</span>
                </button>
                
                <button
                  @click="activeTab = 'media'"
                  :class="[
                    'flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium text-sm',
                    activeTab === 'media'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <ImageIcon class="w-5 h-5" />
                  <span>Media</span>
                </button>
                
                <button
                  @click="activeTab = 'collaborator'"
                  :class="[
                    'flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium text-sm',
                    activeTab === 'collaborator'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <Users class="w-5 h-5" />
                  <span>Collaborators</span>
                </button>
                
                <button
                  v-if="event.can_edit"
                  @click="activeTab = 'event-texts'"
                  :class="[
                    'flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium text-sm',
                    activeTab === 'event-texts'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <FileText class="w-5 h-5" />
                  <span>Event Texts</span>
                </button>
                
                <button
                  @click="activeTab = 'template'"
                  :class="[
                    'flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium text-sm',
                    activeTab === 'template'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  ]"
                >
                  <Monitor class="w-5 h-5" />
                  <span>Template</span>
                </button>
              </nav>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="flex-1 min-w-0">
            <!-- About Tab -->
            <div v-if="activeTab === 'about'" class="space-y-8">
              
              <!-- Event Description -->
              <div v-if="event.description" class="bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm border border-white/40 rounded-3xl shadow-xl p-8">
                <div class="flex items-center mb-6">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4">
                    <FileText class="w-6 h-6 text-white" />
                  </div>
                  <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">About This Event</h3>
                </div>
                <div class="prose prose-lg max-w-none text-slate-700 leading-relaxed">
                  <div :class="{ 'line-clamp-6': !isDescriptionExpanded && event.description.length > 300 }">
                    <p>{{ event.description }}</p>
                  </div>
                  <button
                    v-if="event.description.length > 300"
                    @click="isDescriptionExpanded = !isDescriptionExpanded"
                    class="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                  >
                    <span>{{ isDescriptionExpanded ? 'Show Less' : 'Show More' }}</span>
                    <ChevronDown 
                      class="w-4 h-4 ml-1 transition-transform duration-200"
                      :class="{ 'rotate-180': isDescriptionExpanded }"
                    />
                  </button>
                </div>
              </div>

              <!-- Event Schedule - Enhanced Design -->
              <div class="bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm border border-white/40 rounded-3xl shadow-xl p-8">
                <div class="flex items-center mb-8">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center mr-4">
                    <Calendar class="w-6 h-6 text-white" />
                  </div>
                  <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Schedule</h3>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <!-- Start Time -->
                  <div class="group relative bg-white/70 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-t-2xl"></div>
                    <div class="flex items-center mb-4">
                      <div class="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mr-4">
                        <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <p class="text-sm font-bold text-emerald-700 mb-1 uppercase tracking-wider">Event Starts</p>
                        <p class="text-xs text-slate-600">{{ event.timezone || 'UTC' }}</p>
                      </div>
                    </div>
                    <p class="text-2xl font-bold text-slate-900 mb-2 leading-tight">{{ formatEventDate(event.start_date) }}</p>
                    <p class="text-lg font-semibold text-emerald-600">{{ formatEventTime(event.start_date) }}</p>
                  </div>

                  <!-- End Time -->
                  <div class="group relative bg-white/70 backdrop-blur-sm border border-red-200/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl"></div>
                    <div class="flex items-center mb-4">
                      <div class="w-14 h-14 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mr-4">
                        <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                      <div>
                        <p class="text-sm font-bold text-red-700 mb-1 uppercase tracking-wider">Event Ends</p>
                        <p class="text-xs text-slate-600">{{ event.timezone || 'UTC' }}</p>
                      </div>
                    </div>
                    <p class="text-2xl font-bold text-slate-900 mb-2 leading-tight">{{ formatEventDate(event.end_date) }}</p>
                    <p class="text-lg font-semibold text-red-600">{{ formatEventTime(event.end_date) }}</p>
                  </div>
                </div>
              </div>

              <!-- Location & Access -->
              <div class="bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm border border-white/40 rounded-3xl shadow-xl p-8">
                <div class="flex items-center mb-8">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mr-4">
                    <MapPin v-if="!event.is_virtual" class="w-6 h-6 text-white" />
                    <Monitor v-else class="w-6 h-6 text-white" />
                  </div>
                  <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
                    {{ event.is_virtual ? 'Virtual Access' : 'Event Location' }}
                  </h3>
                </div>

                <div v-if="event.is_virtual" class="space-y-6">
                  <div class="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                          <Monitor class="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p class="font-semibold text-slate-900">Virtual Event</p>
                          <p class="text-sm text-slate-600">Join from anywhere</p>
                        </div>
                      </div>
                      <div v-if="event.is_ongoing" class="flex items-center">
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span class="text-sm font-semibold text-green-600">Live Now</span>
                      </div>
                    </div>
                    
                    <div v-if="event.virtual_link" class="space-y-4">
                      <div class="bg-slate-50 rounded-lg p-4">
                        <p class="text-sm text-slate-600 mb-2">Meeting Link:</p>
                        <p class="text-sm font-mono text-slate-800 break-all">{{ event.virtual_link }}</p>
                      </div>
                      <button
                        @click="joinVirtualEvent"
                        class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-purple-500/25 hover:shadow-purple-600/30 flex items-center justify-center"
                      >
                        <ExternalLink class="w-5 h-5 mr-2" />
                        Join Virtual Event
                      </button>
                    </div>
                    <div v-else class="text-center py-4">
                      <p class="text-slate-600">Virtual access link will be provided closer to the event date.</p>
                    </div>
                  </div>
                </div>

                <div v-else class="space-y-6">
                  <div class="bg-white/70 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6">
                    <div class="flex items-center mb-4">
                      <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <MapPin class="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p class="font-semibold text-slate-900">Physical Venue</p>
                        <p class="text-sm text-slate-600">In-person attendance</p>
                      </div>
                    </div>
                    
                    <div class="bg-slate-50 rounded-lg p-4">
                      <p class="text-lg font-semibold text-slate-900 mb-2">{{ event.location || 'Venue To Be Announced' }}</p>
                      <p class="text-sm text-slate-600">Please arrive 15 minutes before the event starts.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Event Information Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Status Card -->
                <div class="group bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                         :class="event.status === 'published' ? 'bg-green-100' : 
                                 event.status === 'draft' ? 'bg-yellow-100' : 'bg-red-100'">
                      <div class="w-4 h-4 rounded-full"
                           :class="event.status === 'published' ? 'bg-green-500' : 
                                   event.status === 'draft' ? 'bg-yellow-500' : 'bg-red-500'"></div>
                    </div>
                    <div>
                      <p class="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</p>
                      <p class="font-semibold text-slate-900 capitalize">{{ event.status || 'Draft' }}</p>
                    </div>
                  </div>
                </div>

                <!-- Privacy Card -->
                <div class="group bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                         :class="event.privacy === 'public' ? 'bg-green-100' : 'bg-purple-100'">
                      <Lock v-if="event.privacy === 'private'" class="w-5 h-5 text-purple-600" />
                      <Users v-else class="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p class="text-xs font-bold text-slate-600 uppercase tracking-wider">Privacy</p>
                      <p class="font-semibold text-slate-900 capitalize">{{ event.privacy || 'Public' }}</p>
                    </div>
                  </div>
                </div>

                <!-- Category Card -->
                <div v-if="event.category_name" class="group bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div class="flex items-center mb-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                         :style="{ backgroundColor: event.category_color + '20' || '#8B5CF620' }">
                      <div class="w-4 h-4 rounded-full"
                           :style="{ backgroundColor: event.category_color || '#8B5CF6' }"></div>
                    </div>
                    <div>
                      <p class="text-xs font-bold text-slate-600 uppercase tracking-wider">Category</p>
                      <p class="font-semibold text-slate-900">{{ event.category_name }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Registration Information -->
              <div v-if="event.registration_required" class="bg-gradient-to-br from-white to-orange-50/30 backdrop-blur-sm border border-white/40 rounded-3xl shadow-xl p-8">
                <div class="flex items-center mb-6">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mr-4">
                    <UserPlus class="w-6 h-6 text-white" />
                  </div>
                  <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Registration Required</h3>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="bg-white/70 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6">
                    <div class="flex items-center mb-3">
                      <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                        <Users class="w-4 h-4 text-orange-600" />
                      </div>
                      <p class="font-semibold text-slate-900">Current Registrations</p>
                    </div>
                    <p class="text-2xl font-bold text-orange-600">{{ event.registration_count || 0 }}</p>
                    <p class="text-sm text-slate-600 mt-1">
                      {{ event.max_attendees ? `of ${event.max_attendees} spots` : 'registered attendees' }}
                    </p>
                  </div>
                  
                  <div v-if="event.max_attendees" class="bg-white/70 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6">
                    <div class="flex items-center mb-3">
                      <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                        <CheckCircle class="w-4 h-4 text-orange-600" />
                      </div>
                      <p class="font-semibold text-slate-900">Availability</p>
                    </div>
                    <p class="text-2xl font-bold text-slate-900">{{ event.max_attendees - (event.registration_count || 0) }}</p>
                    <p class="text-sm text-slate-600 mt-1">spots remaining</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Agenda Tab -->
            <div v-if="activeTab === 'agenda'">
              <div v-if="!event?.id" class="space-y-6">
                <!-- Skeleton Header -->
                <div class="animate-pulse">
                  <div class="flex justify-between items-center mb-6">
                    <div>
                      <div class="h-8 bg-slate-200 rounded w-48 mb-2"></div>
                      <div class="h-4 bg-slate-200 rounded w-64"></div>
                    </div>
                    <div class="h-10 bg-slate-200 rounded-xl w-32"></div>
                  </div>
                </div>
                
                <!-- Skeleton Agenda Items -->
                <div v-for="i in 2" :key="i" class="animate-pulse">
                  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden mb-4">
                    <!-- Date Header Skeleton -->
                    <div class="p-6">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                          <div class="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                          <div>
                            <div class="h-6 bg-slate-200 rounded w-32 mb-2"></div>
                            <div class="h-4 bg-slate-200 rounded w-20"></div>
                          </div>
                        </div>
                        <div class="w-8 h-8 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>
                    
                    <!-- Agenda Items Skeleton -->
                    <div class="border-t border-white/20 p-6 pt-4 space-y-3">
                      <div v-for="j in 3" :key="j" class="bg-slate-50 rounded-2xl p-4">
                        <div class="flex items-center justify-between mb-3">
                          <div class="h-5 bg-slate-200 rounded w-48"></div>
                          <div class="h-4 bg-slate-200 rounded w-16"></div>
                        </div>
                        <div class="h-4 bg-slate-200 rounded w-full mb-2"></div>
                        <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <AgendaTab 
                v-else
                :event-id="event.id" 
                :can-edit="event.can_edit || false"
              />
            </div>

            <!-- Hosts Tab -->
            <div v-if="activeTab === 'hosts'">
              <div v-if="!event?.id" class="space-y-6">
                <!-- Skeleton Header -->
                <div class="animate-pulse">
                  <div class="flex justify-between items-center mb-6">
                    <div>
                      <div class="h-8 bg-slate-200 rounded w-56 mb-2"></div>
                      <div class="h-4 bg-slate-200 rounded w-72"></div>
                    </div>
                    <div class="h-10 bg-slate-200 rounded-xl w-36"></div>
                  </div>
                </div>
                
                <!-- Skeleton Host Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div v-for="i in 6" :key="i" class="animate-pulse">
                    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
                      <!-- Profile Image Skeleton -->
                      <div class="flex items-center space-x-4 mb-4">
                        <div class="w-16 h-16 bg-slate-200 rounded-full"></div>
                        <div class="flex-1">
                          <div class="h-5 bg-slate-200 rounded w-32 mb-2"></div>
                          <div class="h-4 bg-slate-200 rounded w-24"></div>
                        </div>
                      </div>
                      
                      <!-- Bio Skeleton -->
                      <div class="space-y-2 mb-4">
                        <div class="h-4 bg-slate-200 rounded w-full"></div>
                        <div class="h-4 bg-slate-200 rounded w-full"></div>
                        <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                      </div>
                      
                      <!-- Social Links Skeleton -->
                      <div class="flex space-x-2">
                        <div class="w-8 h-8 bg-slate-200 rounded-full"></div>
                        <div class="w-8 h-8 bg-slate-200 rounded-full"></div>
                        <div class="w-8 h-8 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <HostsTab 
                v-else
                :event-id="event.id" 
                :can-edit="event.can_edit || false"
              />
            </div>

            <!-- Event Texts Tab -->
            <div v-if="activeTab === 'event-texts'">
              <div v-if="!event?.can_edit || !event?.id" class="text-center py-8">
                <div v-if="!event?.id" class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <span class="text-lg text-slate-600 leading-relaxed">
                  {{ !event?.id ? 'Loading event data...' : 'You do not have permission to edit event texts.' }}
                </span>
              </div>
              <EventTextTab 
                v-else
                :event-id="event.id"
              />
            </div>

            <!-- Attendees Tab -->
            <div v-if="activeTab === 'attendees' && canViewAttendees" class="space-y-8">
              <div class="space-y-6">
                <div
                  v-for="registration in event.registrations_details"
                  :key="registration.id"
                  class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/25 p-6 hover:shadow-2xl hover:shadow-blue-600/30 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <div class="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {{ getInitials(registration.user_details.first_name || '', registration.user_details.last_name || '') }}
                      </div>
                      <div>
                        <h4 class="font-semibold text-slate-800 text-lg mb-1 leading-snug">
                          {{ registration.user_details.first_name }} {{ registration.user_details.last_name }}
                        </h4>
                        <p class="text-base text-slate-600 leading-relaxed">@{{ registration.user_details.username }}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-base font-semibold text-slate-800 mb-1 leading-tight">
                        {{ registration.total_attendees }} {{ registration.total_attendees === 1 ? 'person' : 'people' }}
                      </div>
                      <div class="text-sm font-medium text-slate-500 tracking-wide">{{ registration.confirmation_code }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Media Tab -->
            <div v-if="activeTab === 'media'">
              <div v-if="!event?.id" class="space-y-6">
                <!-- Skeleton Media Navigation Tabs -->
                <div class="animate-pulse">
                  <div class="flex space-x-1 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-2 mb-6">
                    <div class="h-10 bg-slate-200 rounded-xl w-32"></div>
                    <div class="h-10 bg-slate-200 rounded-xl w-36"></div>
                    <div class="h-10 bg-slate-200 rounded-xl w-40"></div>
                  </div>
                </div>
                
                <!-- Skeleton Media Grid -->
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div v-for="i in 8" :key="i" class="animate-pulse">
                    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-lg">
                      <!-- Image Skeleton -->
                      <div class="aspect-square bg-slate-200"></div>
                      <!-- Caption Skeleton -->
                      <div class="p-3">
                        <div class="h-4 bg-slate-200 rounded w-full mb-2"></div>
                        <div class="h-3 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Skeleton Upload Area -->
                <div class="animate-pulse">
                  <div class="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                    <div class="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4"></div>
                    <div class="h-6 bg-slate-200 rounded w-48 mx-auto mb-2"></div>
                    <div class="h-4 bg-slate-200 rounded w-64 mx-auto"></div>
                  </div>
                </div>
              </div>
              <EventMediaTab 
                v-else
                :event-id="event.id" 
                :can-edit="event.can_edit || false"
                :initial-media="event.photos || []"
                :event-data="event"
                @media-updated="handleMediaUpdated"
                @event-updated="handleEventUpdated"
              />
            </div>

            <!-- Collaborator Tab -->
            <div v-if="activeTab === 'collaborator'" class="space-y-8">
              <div class="space-y-6">
                <!-- Organizer -->
                <div v-if="event.organizer_details" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/25 p-6">
                  <h3 class="text-xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">Event Organizer</h3>
                  <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                      <img
                        v-if="event.organizer_details.profile_picture"
                        :src="getMediaUrl(event.organizer_details.profile_picture)"
                        :alt="event.organizer_details.first_name + ' ' + event.organizer_details.last_name"
                        class="w-full h-full object-cover"
                      />
                      <span v-else class="text-white text-xl font-bold">
                        {{ getInitials(event.organizer_details.first_name, event.organizer_details.last_name) }}
                      </span>
                    </div>
                    <div>
                      <h4 class="text-xl font-semibold text-slate-800 leading-snug">
                        {{ event.organizer_details.first_name }} {{ event.organizer_details.last_name }}
                      </h4>
                      <p class="text-base text-slate-600 leading-relaxed">@{{ event.organizer_details.username }}</p>
                      <p class="text-base text-slate-500 leading-relaxed">{{ event.organizer_details.email }}</p>
                      <span class="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Organizer</span>
                    </div>
                  </div>
                </div>

                <!-- Collaborators -->
                <div v-if="event.collaborators_details && event.collaborators_details.length > 0" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/25 p-6">
                  <h3 class="text-xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">Collaborators ({{ event.collaborators_details.length }})</h3>
                  <div class="space-y-4">
                    <div
                      v-for="collaborator in event.collaborators_details"
                      :key="collaborator.id"
                      class="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center text-white font-bold">
                          {{ getInitials(collaborator.user_details.first_name || '', collaborator.user_details.last_name || '') }}
                        </div>
                        <div>
                          <h4 class="font-semibold text-slate-800 text-lg leading-snug">
                            {{ collaborator.user_details.first_name }} {{ collaborator.user_details.last_name }}
                          </h4>
                          <p class="text-base text-slate-600 leading-relaxed">@{{ collaborator.user_details.username }}</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <span class="inline-block px-3 py-1 text-xs font-medium rounded-full"
                              :class="collaborator.role === 'admin' ? 'bg-red-100 text-red-700' : 
                                     collaborator.role === 'editor' ? 'bg-blue-100 text-blue-700' : 
                                     'bg-green-100 text-green-700'">
                          {{ collaborator.role }}
                        </span>
                        <p class="text-xs text-slate-500 mt-1">
                          {{ collaborator.is_accepted ? 'Accepted' : 'Pending' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Collaboration Stats -->
                <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/25 p-6">
                  <h3 class="text-xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">Collaboration Summary</h3>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="text-center p-4 bg-purple-50 rounded-lg">
                      <div class="text-3xl font-bold text-purple-600 leading-none">1</div>
                      <div class="text-base text-purple-600 font-medium">Organizer</div>
                    </div>
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                      <div class="text-3xl font-bold text-blue-600 leading-none">{{ event.collaborators_count || 0 }}</div>
                      <div class="text-base text-blue-600 font-medium">Collaborators</div>
                    </div>
                    <div class="text-center p-4 bg-emerald-50 rounded-lg">
                      <div class="text-3xl font-bold text-emerald-600 leading-none">{{ event.registrations_count || 0 }}</div>
                      <div class="text-base text-emerald-600 font-medium">Attendees</div>
                    </div>
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                      <div class="text-3xl font-bold text-blue-600 leading-none">{{ (event.hosts && event.hosts.length) || 0 }}</div>
                      <div class="text-base text-blue-600 font-medium">Speakers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Template Tab -->
            <div v-if="activeTab === 'template'" class="space-y-8">
              <div class="space-y-6">
                <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/25 p-6">
                  <h3 class="text-xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">Template Information</h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Template Enabled:</span>
                      <span class="font-semibold text-lg leading-tight" :class="event.event_template_enabled ? 'text-emerald-600' : 'text-slate-500'">
                        {{ event.event_template_enabled ? 'Yes' : 'No' }}
                      </span>
                    </div>
                    <div v-if="event.event_template" class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Template ID:</span>
                      <span class="font-semibold text-lg text-slate-800 leading-tight">{{ event.event_template }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Event Category:</span>
                      <div class="flex items-center space-x-2">
                        <div 
                          v-if="event.category_color"
                          class="w-3 h-3 rounded-full"
                          :style="{ backgroundColor: event.category_color }"
                        ></div>
                        <span class="font-semibold text-lg text-slate-800 leading-tight">{{ event.category_name || 'No Category' }}</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Event Status:</span>
                      <span class="font-semibold text-lg capitalize leading-tight" 
                            :class="event.status === 'published' ? 'text-emerald-600' : 
                                   event.status === 'draft' ? 'text-orange-600' : 
                                   'text-red-600'">
                        {{ event.status }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Privacy:</span>
                      <span class="font-semibold text-lg capitalize leading-tight"
                            :class="event.privacy === 'public' ? 'text-emerald-600' : 'text-purple-600'">
                        {{ event.privacy }}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <Footer />
      
      <!-- Floating Edit Button -->
      <div 
        v-if="event?.can_edit"
        class="fixed bottom-8 right-8 z-40 group"
      >
        <button
          @click="editEvent"
          class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center overflow-hidden h-14 w-14 group-hover:w-auto group-hover:pl-4 group-hover:pr-4"
        >
          <span class="whitespace-nowrap opacity-0 group-hover:opacity-100 mr-0 group-hover:mr-2 transition-all duration-300 font-medium max-w-0 group-hover:max-w-xs order-1">
            Edit Event
          </span>
          <Pencil class="w-6 h-6 flex-shrink-0 order-2" />
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="pt-24 pb-16">
      <div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/25 p-12">
          <AlertTriangle class="w-16 h-16 text-red-600 mx-auto mb-6" />
          <h1 class="text-2xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">Event Not Found</h1>
          <p class="text-lg text-slate-600 mb-8 leading-relaxed max-w-prose mx-auto">{{ error }}</p>
          <button
            @click="$router.push('/events')"
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30"
          >
            Back to Events
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-8 right-8 z-50">
        <div 
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Calendar,
  MapPin,
  Users,
  UserPlus,
  Monitor,
  Lock,
  Pencil,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Star,
  FileText,
  ImageIcon,
  ChevronRight,
  ChevronDown,
  Download
} from 'lucide-vue-next'
import Navigation from '../components/Navigation.vue'
import Footer from '../components/Footer.vue'
import AgendaTab from '../components/AgendaTab.vue'
import HostsTab from '../components/HostsTab.vue'
import EventTextTab from '../components/EventTextTab.vue'
import EventMediaTab from '../components/EventMediaTab.vue'
import { useAuthStore } from '../stores/auth'
import { eventsService, type Event, type EventPhoto } from '../services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const event = ref<Event | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const isRegistering = ref(false)
const activeTab = ref('about')
const isDescriptionExpanded = ref(false)

// Typing animation - will be initialized when event loads
const displayText = ref('')
const isComplete = ref(false)

// Computed properties
const canRegister = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  if (event.value.is_registered || event.value.is_past) return false
  if (!event.value.registration_required) return false
  if (isEventFull.value || isRegistrationClosed.value) return false
  return true
})

const isEventFull = computed(() => {
  if (!event.value || !event.value.max_attendees) return false
  return event.value.registrations_count >= event.value.max_attendees
})

const isRegistrationClosed = computed(() => {
  if (!event.value || !event.value.registration_deadline) return false
  return new Date(event.value.registration_deadline) < new Date()
})


const canViewAttendees = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  return event.value.can_edit || event.value.privacy === 'public'
})


// Removed unused daysUntilEvent computed property

// Methods
const loadEvent = async () => {
  const eventId = route.params.id as string
  if (!eventId) {
    error.value = 'Invalid event ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await eventsService.getEvent(eventId)
    
    if (response.success && response.data) {
      event.value = response.data
      // Initialize typing animation with event title
      startTypingAnimation(response.data.title)
    } else {
      error.value = response.message || 'Event not found'
    }
  } catch (err) {
    console.error('Error loading event:', err)
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

const registerForEvent = async () => {
  if (!event.value || !authStore.isAuthenticated) return

  isRegistering.value = true

  try {
    const response = await eventsService.registerForEvent(event.value.id, {
      guest_count: 0,
      notes: ''
    })

    if (response.success) {
      showMessage('success', 'Successfully registered for the event!')
      // Reload event to update registration status
      await loadEvent()
    } else {
      showMessage('error', response.message || 'Failed to register for event')
    }
  } catch (error) {
    console.error('Error registering for event:', error)
    showMessage('error', 'An error occurred while registering')
  } finally {
    isRegistering.value = false
  }
}

const editEvent = () => {
  if (event.value) {
    router.push(`/events/${event.value.id}/edit`)
  }
}

const joinVirtualEvent = () => {
  if (event.value?.virtual_link) {
    window.open(event.value.virtual_link, '_blank')
  }
}

const getBannerImageUrl = (bannerImage: string | null): string | undefined => {
  if (!bannerImage) return undefined
  
  // If it's already a full URL, return as is
  if (bannerImage.startsWith('http://') || bannerImage.startsWith('https://')) {
    return bannerImage
  }
  
  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (bannerImage.startsWith('/')) {
    return `${API_BASE_URL}${bannerImage}`
  }
  
  // If it doesn't start with /, assume it needs /media/ prefix
  return `${API_BASE_URL}/media/${bannerImage}`
}

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}


const getMediaUrl = (mediaUrl: string | null): string | undefined => {
  if (!mediaUrl) return undefined
  
  // If it's already a full URL, return as is
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }
  
  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (mediaUrl.startsWith('/')) {
    return `${API_BASE_URL}${mediaUrl}`
  }
  
  // If it doesn't start with /, assume it needs /media/ prefix
  return `${API_BASE_URL}/media/${mediaUrl}`
}


const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}


const handleMediaUpdated = (updatedMedia: EventPhoto[]) => {
  if (event.value) {
    event.value.photos = updatedMedia
  }
}

const handleEventUpdated = (updatedEvent: Event) => {
  console.log('Event updated called with:', updatedEvent)
  console.log('Current event before update:', event.value)
  
  if (event.value && updatedEvent) {
    // Ensure critical properties are preserved
    const mergedEvent: Event = {
      ...event.value,
      ...updatedEvent,
      // Always preserve these critical properties if they exist
      id: updatedEvent.id || event.value.id,
      title: updatedEvent.title || event.value.title,
      can_edit: updatedEvent.can_edit !== undefined ? updatedEvent.can_edit : event.value.can_edit,
      // Preserve existing nested arrays if they're not in the update
      hosts: updatedEvent.hosts || event.value.hosts || [],
      agenda_items: updatedEvent.agenda_items || event.value.agenda_items || [],
      photos: updatedEvent.photos || event.value.photos || [],
      // Add any event texts if they exist in the update
      ...(updatedEvent as any).event_texts && { event_texts: (updatedEvent as any).event_texts },
      collaborators_details: updatedEvent.collaborators_details || event.value.collaborators_details || [],
      registrations_details: updatedEvent.registrations_details || event.value.registrations_details || [],
      organizer_details: updatedEvent.organizer_details || event.value.organizer_details,
      category_details: updatedEvent.category_details || event.value.category_details
    }
    
    console.log('Merged event data:', mergedEvent)
    event.value = mergedEvent
  } else if (updatedEvent) {
    console.log('No existing event, setting new event data')
    event.value = updatedEvent
  } else {
    console.warn('handleEventUpdated called with invalid data:', updatedEvent)
  }
  
  console.log('Event after update:', event.value)
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const startTypingAnimation = (text: string) => {
  displayText.value = ''
  isComplete.value = false
  let currentIndex = 0
  
  const typeNextCharacter = () => {
    if (currentIndex < text.length) {
      displayText.value += text[currentIndex]
      currentIndex++
      setTimeout(typeNextCharacter, 30)
    } else {
      isComplete.value = true
    }
  }
  
  // Start typing after a short delay
  setTimeout(typeNextCharacter, 500)
}

// Calendar integration functions
const addToGoogleCalendar = () => {
  if (!event.value) return
  
  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)
  
  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.value.title,
    dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
    details: event.value.description || event.value.short_description || '',
    location: event.value.is_virtual 
      ? (event.value.virtual_link || 'Virtual Event') 
      : (event.value.location || ''),
    trp: 'false'
  })
  
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank')
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
      ? (event.value.virtual_link || 'Virtual Event') 
      : (event.value.location || '')
  })
  
  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank')
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
LOCATION:${event.value.is_virtual 
  ? (event.value.virtual_link || 'Virtual Event') 
  : (event.value.location || '')}
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
}


// Lifecycle
onMounted(() => {
  loadEvent()
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

.prose p {
  margin-bottom: 1rem;
}

.prose br {
  margin-bottom: 0.5rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Typing animation */
.typing-text {
  position: relative;
  background: linear-gradient(to right, #2563eb, #9333ea);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.typing-cursor {
  animation: blink 1s infinite;
  color: #3b82f6;
  font-weight: normal;
  -webkit-text-fill-color: #3b82f6;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* Mobile navigation scrolling */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Line clamp utility for progressive disclosure */
.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Improved mobile responsiveness */
@media (max-width: 768px) {
  .hero-content {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
  
  .hero-title {
    font-size: 2rem;
    line-height: 1.3;
  }
  
  /* Mobile navigation adjustments */
  .nav {
    padding: 1rem;
  }
  
  /* Mobile text adjustments */
  .text-lg {
    font-size: 1rem;
  }
  
  .text-base {
    font-size: 0.9rem;
  }
}
</style>