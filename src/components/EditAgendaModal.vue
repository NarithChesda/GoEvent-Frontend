<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header (neutral style) -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Edit2 v-if="isEditMode" class="w-4.5 h-4.5" />
                    <Calendar v-else class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">
                    {{ isEditMode ? 'Edit Agenda Item' : 'Create Agenda Item' }}
                  </h2>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="submitAgendaItem" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <!-- Error Banner -->
              <Transition name="slide-down">
                <div v-if="showError" class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <div class="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <svg class="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-red-800">{{ showError }}</p>
                  </div>
                  <button
                    type="button"
                    @click="showError = null"
                    class="flex-shrink-0 text-red-400 hover:text-red-600"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </Transition>
              <!-- Language Tabs Section -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <Languages class="w-4 h-4 mr-2" />
                    Language
                  </h4>
                  <button
                    type="button"
                    @click="showAddTranslation = true"
                    class="text-[#1e90ff] hover:text-[#1873cc] text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus class="w-4 h-4" />
                    <span>Add Language</span>
                  </button>
                </div>

                <!-- Language Tab Headers -->
                <div role="tablist" aria-label="Agenda item languages" class="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
                  <!-- English Tab (Always first) -->
                  <button
                    type="button"
                    role="tab"
                    :id="'tab-en'"
                    :aria-selected="activeTab === 'en'"
                    :aria-controls="'tabpanel-en'"
                    :tabindex="activeTab === 'en' ? 0 : -1"
                    @click="activeTab = 'en'"
                    @keydown.right="focusNextTab"
                    @keydown.left="focusPreviousTab"
                    :class="[
                      'flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative',
                      activeTab === 'en'
                        ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    ]"
                  >
                    <span class="flex items-center gap-2">
                      <span>English</span>
                      <span class="text-xs text-slate-500">(Default)</span>
                    </span>
                  </button>

                  <!-- Other Language Tabs -->
                  <button
                    v-for="(translation, index) in formData.translations"
                    :key="translation.id || index"
                    type="button"
                    role="tab"
                    :id="'tab-' + translation.language"
                    :aria-selected="activeTab === translation.language"
                    :aria-controls="'tabpanel-' + translation.language"
                    :tabindex="activeTab === translation.language ? 0 : -1"
                    @click="activeTab = translation.language"
                    @keydown.right="focusNextTab"
                    @keydown.left="focusPreviousTab"
                    :class="[
                      'flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative group',
                      activeTab === translation.language
                        ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    ]"
                  >
                    <span class="flex items-center gap-2">
                      <span>{{ getLanguageName(translation.language) }}</span>
                      <button
                        type="button"
                        @click.stop="removeTranslation(index)"
                        :aria-label="'Remove ' + getLanguageName(translation.language) + ' translation'"
                        class="opacity-0 group-hover:opacity-100 transition-opacity"
                        :class="activeTab === translation.language ? 'opacity-100' : ''"
                      >
                        <X class="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                      </button>
                      <span
                        v-if="translation.id"
                        class="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full font-medium"
                      >
                        Saved
                      </span>
                    </span>
                  </button>
                </div>

                <!-- Add Translation Modal -->
                <div
                  v-if="showAddTranslation"
                  class="bg-[#E6F4FF] border border-[#87CEEB] rounded-xl p-4"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium text-slate-900">Add Language</h5>
                    <button
                      type="button"
                      @click="closeAddTranslation"
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>

                  <div class="space-y-3">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Select Language
                      </label>
                      <select
                        v-model="newTranslation.language"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                      >
                        <option value="">Choose a language...</option>
                        <option
                          v-for="lang in availableLanguagesForAdd"
                          :key="lang.code"
                          :value="lang.code"
                        >
                          {{ lang.name }}
                        </option>
                      </select>
                    </div>

                    <div class="flex space-x-2">
                      <button
                        type="button"
                        @click="addTranslation"
                        :disabled="!newTranslation.language"
                        class="px-4 py-2 bg-[#1e90ff] text-white rounded-lg hover:bg-[#1873cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Add Language
                      </button>
                      <button
                        type="button"
                        @click="closeAddTranslation"
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-5">
                <!-- English Content (Default Language) -->
                <div
                  v-if="activeTab === 'en'"
                  role="tabpanel"
                  :id="'tabpanel-en'"
                  :aria-labelledby="'tab-en'"
                  tabindex="0"
                  class="space-y-5"
                >
                  <div class="space-y-3">
                    <!-- Title -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Title <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.title"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="Enter agenda item title"
                      />
                    </div>

                    <!-- Start Time and End Time -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          Start Time
                        </label>
                        <input
                          v-model="formData.start_time_text"
                          type="text"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                          placeholder="e.g., 9:00 AM"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          End Time
                        </label>
                        <input
                          v-model="formData.end_time_text"
                          type="text"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                          placeholder="e.g., 10:00 AM"
                        />
                      </div>
                    </div>

                    <!-- Description (collapsible) -->
                    <div class="rounded-xl border border-slate-200 bg-white/70">
                      <button
                        type="button"
                        class="w-full flex items-center justify-between px-4 py-3"
                        @click="descriptionOpen = !descriptionOpen"
                        :aria-expanded="descriptionOpen ? 'true' : 'false'"
                        aria-controls="description-section"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-slate-700">Description</span>
                          <span class="hidden sm:inline text-xs text-slate-500">{{ descriptionSummary }}</span>
                        </div>
                        <svg
                          class="h-4 w-4 text-slate-500 transition-transform"
                          :class="descriptionOpen ? 'rotate-180' : ''"
                          viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      <Transition name="collapse">
                        <div v-show="descriptionOpen" id="description-section" class="px-4 pb-4">
                          <textarea
                            v-model="formData.description"
                            rows="3"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                            placeholder="Describe this agenda item"
                          ></textarea>
                        </div>
                      </Transition>
                    </div>

                    <!-- Speaker (collapsible) -->
                    <div class="rounded-xl border border-slate-200 bg-white/70">
                      <button
                        type="button"
                        class="w-full flex items-center justify-between px-4 py-3"
                        @click="speakerOpen = !speakerOpen"
                        :aria-expanded="speakerOpen ? 'true' : 'false'"
                        aria-controls="speaker-section"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-slate-700">Speaker(s)</span>
                          <span class="hidden sm:inline text-xs text-slate-500">{{ speakerSummary }}</span>
                        </div>
                        <svg
                          class="h-4 w-4 text-slate-500 transition-transform"
                          :class="speakerOpen ? 'rotate-180' : ''"
                          viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      <Transition name="collapse">
                        <div v-show="speakerOpen" id="speaker-section" class="px-4 pb-4">
                          <input
                            v-model="formData.speaker"
                            type="text"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            placeholder="e.g., Dr. Jane Smith, CEO of TechCorp"
                          />
                        </div>
                      </Transition>
                    </div>
                  </div>
                </div>

                <!-- Other Language Tabs Content -->
                <div
                  v-for="(translation, index) in formData.translations"
                  :key="translation.id || index"
                  v-show="activeTab === translation.language"
                  role="tabpanel"
                  :id="'tabpanel-' + translation.language"
                  :aria-labelledby="'tab-' + translation.language"
                  tabindex="0"
                  class="space-y-5"
                >
                  <div class="space-y-3">
                    <!-- Title -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Title
                      </label>
                      <input
                        v-model="translation.title"
                        type="text"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        :placeholder="`Enter title in ${getLanguageName(translation.language)}`"
                      />
                    </div>

                    <!-- Start Time and End Time -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          Start Time
                        </label>
                        <input
                          v-model="translation.start_time_text"
                          type="text"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                          :placeholder="`Translated start time in ${getLanguageName(translation.language)}`"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          End Time
                        </label>
                        <input
                          v-model="translation.end_time_text"
                          type="text"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                          :placeholder="`Translated end time in ${getLanguageName(translation.language)}`"
                        />
                      </div>
                    </div>

                    <!-- Description (collapsible) -->
                    <div class="rounded-xl border border-slate-200 bg-white/70">
                      <button
                        type="button"
                        class="w-full flex items-center justify-between px-4 py-3"
                        @click="descriptionOpen = !descriptionOpen"
                        :aria-expanded="descriptionOpen ? 'true' : 'false'"
                        :aria-controls="`description-section-${translation.language}`"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-slate-700">Description</span>
                          <span class="hidden sm:inline text-xs text-slate-500">
                            {{ translation.description && translation.description.trim()
                              ? (translation.description.length > 60 ? translation.description.slice(0, 60) + '…' : translation.description)
                              : 'No description' }}
                          </span>
                        </div>
                        <svg
                          class="h-4 w-4 text-slate-500 transition-transform"
                          :class="descriptionOpen ? 'rotate-180' : ''"
                          viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      <Transition name="collapse">
                        <div v-show="descriptionOpen" :id="`description-section-${translation.language}`" class="px-4 pb-4">
                          <textarea
                            v-model="translation.description"
                            rows="3"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                            :placeholder="`Translated description in ${getLanguageName(translation.language)}`"
                          ></textarea>
                        </div>
                      </Transition>
                    </div>

                    <!-- Speaker (collapsible) -->
                    <div class="rounded-xl border border-slate-200 bg-white/70">
                      <button
                        type="button"
                        class="w-full flex items-center justify-between px-4 py-3"
                        @click="speakerOpen = !speakerOpen"
                        :aria-expanded="speakerOpen ? 'true' : 'false'"
                        :aria-controls="`speaker-section-${translation.language}`"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-slate-700">Speaker(s)</span>
                          <span class="hidden sm:inline text-xs text-slate-500">
                            {{ translation.speaker && translation.speaker.trim()
                              ? (translation.speaker.length > 60 ? translation.speaker.slice(0, 60) + '…' : translation.speaker)
                              : 'No speaker' }}
                          </span>
                        </div>
                        <svg
                          class="h-4 w-4 text-slate-500 transition-transform"
                          :class="speakerOpen ? 'rotate-180' : ''"
                          viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      <Transition name="collapse">
                        <div v-show="speakerOpen" :id="`speaker-section-${translation.language}`" class="px-4 pb-4">
                          <input
                            v-model="translation.speaker"
                            type="text"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            :placeholder="`Translated speaker name(s) in ${getLanguageName(translation.language)}`"
                          />
                        </div>
                      </Transition>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Non-translatable fields -->
              <div class="space-y-5">
                <!-- Schedule Information -->
                <div class="space-y-3 sm:space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <Clock class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Schedule
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <!-- Date -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2"> Date </label>
                      <input
                        v-model="formData.date"
                        type="date"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      />
                    </div>

                    <!-- Agenda Type -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Type
                      </label>
                      <div class="relative">
                        <select
                          v-model="formData.agenda_type"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                        >
                          <option value="session">Session</option>
                          <option value="keynote">Keynote</option>
                          <option value="workshop">Workshop</option>
                          <option value="panel">Panel Discussion</option>
                          <option value="break">Break</option>
                          <option value="networking">Networking</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Location (collapsible) -->
                <div class="rounded-xl border border-slate-200 bg-white/70">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-4 py-3"
                    @click="locationOpen = !locationOpen"
                    :aria-expanded="locationOpen ? 'true' : 'false'"
                    aria-controls="location-section"
                  >
                    <div class="flex items-center gap-2">
                      <MapPin class="w-3.5 h-3.5 mr-1.5" />
                      <span class="text-sm font-medium text-slate-700">Location</span>
                      <span class="hidden sm:inline text-xs text-slate-500">{{ locationSummary }}</span>
                    </div>
                    <svg
                      class="h-4 w-4 text-slate-500 transition-transform"
                      :class="locationOpen ? 'rotate-180' : ''"
                      viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <Transition name="collapse">
                    <div v-show="locationOpen" id="location-section" class="px-4 pb-4 space-y-3">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <!-- Physical Location -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            Physical Location
                          </label>
                          <input
                            v-model="formData.location"
                            type="text"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            placeholder="e.g., Conference Room A"
                          />
                        </div>

                        <!-- Virtual Link -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            Virtual Link
                          </label>
                          <input
                            v-model="formData.virtual_link"
                            type="url"
                            :class="[
                              'w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white/90',
                              errors.virtual_link || urlValidationError
                                ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400'
                            ]"
                            placeholder="https://zoom.us/j/..."
                          />
                          <p v-if="errors.virtual_link || urlValidationError" class="mt-1 text-xs text-red-600">
                            {{ errors.virtual_link || urlValidationError }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Display Options (collapsible) -->
                <div class="rounded-xl border border-slate-200 bg-white/70">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-4 py-3"
                    @click="displayOpen = !displayOpen"
                    :aria-expanded="displayOpen ? 'true' : 'false'"
                    aria-controls="display-section"
                  >
                    <div class="flex items-center gap-2">
                      <Palette class="w-3.5 h-3.5 mr-1.5" />
                      <span class="text-sm font-medium text-slate-700">Display Options</span>
                    </div>
                    <svg
                      class="h-4 w-4 text-slate-500 transition-transform"
                      :class="displayOpen ? 'rotate-180' : ''"
                      viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <Transition name="collapse">
                    <div v-show="displayOpen" id="display-section" class="px-4 pb-4 space-y-3">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <!-- Color -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            Theme Color
                          </label>
                          <div class="flex items-center gap-3">
                            <input
                              v-model="formData.color"
                              type="color"
                              class="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer"
                            />
                            <input
                              v-model="formData.color"
                              type="text"
                              class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                              placeholder="#3498db"
                            />
                          </div>
                        </div>

                        <!-- Icon Selection -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2"> Icon </label>
                          <button
                            type="button"
                            @click="showIconPicker = true"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200 flex items-center justify-between bg-white/90"
                          >
                            <div class="flex items-center gap-3">
                              <div
                                v-if="getSelectedIcon()"
                                class="w-7 h-7 flex items-center justify-center"
                                v-html="getSanitizedIconSvg(getSelectedIcon())"
                              ></div>
                              <Sparkles v-else class="w-5 h-5 text-slate-400" />
                              <span class="text-slate-700">{{
                                getSelectedIcon()?.name || 'Select an icon'
                              }}</span>
                            </div>
                            <ChevronDown class="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </div>

                      <!-- Featured Checkbox -->
                      <div class="flex items-center gap-3">
                        <input
                          v-model="formData.is_featured"
                          type="checkbox"
                          id="is_featured"
                          class="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-200"
                        />
                        <label for="is_featured" class="text-sm font-medium text-slate-700">
                          Mark as featured item
                        </label>
                      </div>

                      <!-- Icon Picker Modal -->
                      <div
                        v-if="showIconPicker"
                        class="bg-slate-50 border border-slate-200 rounded-xl p-4"
                      >
                        <div class="flex items-center justify-between mb-4">
                          <h5 class="font-medium text-slate-900">Select Icon</h5>
                          <button
                            type="button"
                            @click="showIconPicker = false"
                            class="text-slate-400 hover:text-slate-600"
                          >
                            <X class="w-4 h-4" />
                          </button>
                        </div>

                        <div class="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                          <!-- No Icon Option -->
                          <button
                            type="button"
                            @click="selectIcon(null)"
                            class="p-3 rounded-lg border-2 transition-all duration-200"
                            :class="
                              formData.icon_id === null
                                ? 'border-sky-500 bg-sky-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            "
                          >
                            <X class="w-6 h-6 mx-auto text-slate-400" />
                            <p class="text-xs mt-1 text-slate-600">None</p>
                          </button>

                          <!-- Available Icons -->
                          <button
                            v-for="icon in availableIcons"
                            :key="icon.id"
                            type="button"
                            @click="selectIcon(icon.id)"
                            class="p-3 rounded-lg border-2 transition-all duration-200"
                            :class="
                              formData.icon_id === icon.id
                                ? 'border-sky-500 bg-sky-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            "
                            :title="icon.name"
                          >
                            <div class="w-6 h-6 mx-auto" v-html="getSanitizedIconSvg(icon)"></div>
                            <p class="text-xs mt-1 text-slate-600 truncate">{{ icon.name }}</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading || !formData.title"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="loading"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Agenda Item' : 'Create Agenda Item') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  X,
  Clock,
  MapPin,
  Palette,
  Languages,
  Plus,
  Sparkles,
  ChevronDown,
  Edit2,
  Calendar,
} from 'lucide-vue-next'
import {
  agendaService,
  coreDataService,
  type EventAgendaItem,
  type AgendaTranslation,
  type AgendaIcon,
} from '../services/api'
import { sanitizeSvg, sanitizePlainText, validateUrl } from '@/utils/sanitize'

interface Props {
  eventId: string
  item?: EventAgendaItem  // Make optional for create mode
  existingAgendaItems?: EventAgendaItem[]  // For auto-filling in create mode
}

interface Emits {
  close: []
  updated: [item: EventAgendaItem]
  created: [item: EventAgendaItem]  // Add created event
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed: Check if we're in edit mode (has item prop) or create mode (no item prop)
const isEditMode = computed(() => !!props.item)

// Helper function to get the latest agenda item (most recent by order or date)
const getLatestAgendaItem = (): EventAgendaItem | null => {
  if (!props.existingAgendaItems || props.existingAgendaItems.length === 0) {
    return null
  }

  // Sort by order descending to get the last item
  const sorted = [...props.existingAgendaItems].sort((a, b) => b.order - a.order)
  return sorted[0]
}

// Helper function to get unique languages from existing agenda items
const getExistingLanguages = (): Set<string> => {
  const languages = new Set<string>()

  if (!props.existingAgendaItems || props.existingAgendaItems.length === 0) {
    return languages
  }

  // Collect all unique languages from all agenda items
  props.existingAgendaItems.forEach(item => {
    item.translations.forEach(translation => {
      if (translation.language && translation.language.trim() !== '') {
        languages.add(translation.language)
      }
    })
  })

  return languages
}

// State
const loading = ref(false)
const showAddTranslation = ref(false)
const availableIcons = ref<AgendaIcon[]>([])
const showIconPicker = ref(false)
const locationOpen = ref(false)
const displayOpen = ref(false)
const descriptionOpen = ref(false)
const speakerOpen = ref(false)
const activeTab = ref<string>('en') // Default to English tab
const errors = ref<Record<string, string>>({})
const showError = ref<string | null>(null)
const urlValidationError = ref<string | null>(null)

// Available languages (matching API documentation)
const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'kh', name: 'Khmer' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'th', name: 'Thai' },
  { code: 'vn', name: 'Vietnamese' },
]

// Get auto-fill data from latest agenda item in create mode
const latestAgendaItem = !isEditMode.value ? getLatestAgendaItem() : null

// Form data - initialize with item data (edit mode) or auto-filled values from latest agenda (create mode)
const formData = reactive({
  title: props.item?.title || '',
  description: props.item?.description || '',
  agenda_type: props.item?.agenda_type || 'session',
  date: props.item?.date || latestAgendaItem?.date || '',
  date_text: props.item?.date_text || latestAgendaItem?.date_text || '',
  start_time_text: props.item?.start_time_text || '',
  end_time_text: props.item?.end_time_text || '',
  speaker: props.item?.speaker || '',
  location: props.item?.location || '',
  virtual_link: props.item?.virtual_link || '',
  order: props.item?.order || 0,
  is_featured: props.item?.is_featured || false,
  color: props.item?.color || '#3498db',
  icon_id: props.item?.icon?.id || null,
  translations: props.item ? [...props.item.translations] : [], // Create a copy if editing, will be populated in onMounted for create mode
})

// New translation
const newTranslation = reactive<
  Omit<AgendaTranslation, 'id' | 'agenda' | 'created_at' | 'updated_at'>
>({
  language: '',
  title: '',
  description: '',
  date_text: '',
  start_time_text: '',
  end_time_text: '',
  speaker: '',
})

// Computed
const availableLanguagesForAdd = computed(() => {
  return availableLanguages.filter(
    (lang) => lang.code !== 'en' && !formData.translations.some((t) => t.language === lang.code),
  )
})

const descriptionSummary = computed(() => {
  const text = (formData.description || '').trim()
  if (!text) return 'No description'
  return text.length > 60 ? text.slice(0, 60) + '…' : text
})

const speakerSummary = computed(() => {
  const text = (formData.speaker || '').trim()
  if (!text) return 'No speaker'
  return text.length > 60 ? text.slice(0, 60) + '…' : text
})

const locationSummary = computed(() => {
  const items = [formData.location, formData.virtual_link]
  const count = items.filter((v) => v && String(v).trim() !== '').length
  return count > 0 ? `${count} ${count === 1 ? 'location' : 'locations'}` : 'No locations'
})

// Methods
const focusNextTab = () => {
  const tabs = ['en', ...formData.translations.map(t => t.language)]
  const currentIndex = tabs.indexOf(activeTab.value)
  const nextIndex = (currentIndex + 1) % tabs.length
  activeTab.value = tabs[nextIndex]
}

const focusPreviousTab = () => {
  const tabs = ['en', ...formData.translations.map(t => t.language)]
  const currentIndex = tabs.indexOf(activeTab.value)
  const previousIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
  activeTab.value = tabs[previousIndex]
}

const addTranslation = () => {
  if (!newTranslation.language) return

  // Check if translation for this language already exists
  if (formData.translations.some((t) => t.language === newTranslation.language)) {
    showError.value = 'Translation for this language already exists'
    setTimeout(() => {
      showError.value = null
    }, 3000)
    return
  }

  const languageCode = newTranslation.language
  formData.translations.push({ ...newTranslation })

  // Switch to the newly added language tab
  activeTab.value = languageCode

  // Reset form
  Object.assign(newTranslation, {
    language: '',
    title: '',
    description: '',
    start_time_text: '',
    end_time_text: '',
    speaker: '',
  })

  showAddTranslation.value = false
}
const fetchIcons = async () => {
  try {
    const response = await coreDataService.getIcons()
    if (response.success && response.data) {
      availableIcons.value = response.data
    }
  } catch (error) {
    console.error('Error fetching icons:', error)
  }
}

const getSelectedIcon = () => {
  return availableIcons.value.find((icon) => icon.id === formData.icon_id)
}

/**
 * Sanitizes icon SVG code before rendering
 * Prevents XSS attacks from malicious SVG content
 */
const getSanitizedIconSvg = (icon: AgendaIcon | null | undefined): string => {
  if (!icon || !icon.svg_code) {
    return ''
  }
  return sanitizeSvg(icon.svg_code)
}

const selectIcon = (iconId: number | null) => {
  formData.icon_id = iconId
  showIconPicker.value = false
}

const getLanguageName = (code: string) => {
  return availableLanguages.find((lang) => lang.code === code)?.name || code
}

const closeAddTranslation = () => {
  newTranslation.language = ''
  showAddTranslation.value = false
}

const removeTranslation = (index: number) => {
  const removedLanguage = formData.translations[index].language
  formData.translations.splice(index, 1)

  // If we're removing the currently active tab, switch to English
  if (activeTab.value === removedLanguage) {
    activeTab.value = 'en'
  }
}

/**
 * Sanitizes all user input fields before submission
 * Returns sanitized data object ready for API submission
 */
const sanitizeFormData = () => {
  // Clear previous errors
  errors.value = {}
  urlValidationError.value = null

  // Validate and sanitize virtual_link if provided
  if (formData.virtual_link && formData.virtual_link.trim() !== '') {
    const urlValidation = validateUrl(formData.virtual_link)
    if (!urlValidation.isValid) {
      urlValidationError.value = urlValidation.errors[0] || 'Invalid URL'
      errors.value.virtual_link = urlValidation.errors[0] || 'Invalid URL'
      return null
    }
    formData.virtual_link = urlValidation.sanitized
  }

  // Sanitize text fields with appropriate length limits
  const sanitizedData = {
    title: sanitizePlainText(formData.title, 200),
    description: sanitizePlainText(formData.description, 2000),
    speaker: sanitizePlainText(formData.speaker, 200),
    location: sanitizePlainText(formData.location, 200),
    start_time_text: sanitizePlainText(formData.start_time_text, 50),
    end_time_text: sanitizePlainText(formData.end_time_text, 50),
    date_text: sanitizePlainText(formData.date_text, 100),
    virtual_link: formData.virtual_link,
    date: formData.date,
    agenda_type: formData.agenda_type,
    order: formData.order,
    is_featured: formData.is_featured,
    color: formData.color,
    icon_id: formData.icon_id,
  }

  // Sanitize translation fields
  const sanitizedTranslations = formData.translations.map((translation) => ({
    language: translation.language,
    title: sanitizePlainText(translation.title || '', 200),
    description: sanitizePlainText(translation.description || '', 2000),
    date_text: sanitizePlainText(translation.date_text || '', 100),
    start_time_text: sanitizePlainText(translation.start_time_text || '', 50),
    end_time_text: sanitizePlainText(translation.end_time_text || '', 50),
    speaker: sanitizePlainText(translation.speaker || '', 200),
  }))

  return {
    ...sanitizedData,
    translations: sanitizedTranslations.filter((t) => t.language && t.language.trim() !== ''),
  }
}

/**
 * Displays error message to user
 */
const displayError = (message: string, fieldErrors?: Record<string, string[]>) => {
  showError.value = message

  // Process field-specific errors
  if (fieldErrors) {
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      errors.value[field] = messages[0] || 'Invalid input'
    })
  }

  // Auto-hide general error after 5 seconds
  setTimeout(() => {
    showError.value = null
  }, 5000)
}

// Unified submit handler - delegates to create or update based on mode
const submitAgendaItem = async () => {
  if (isEditMode.value) {
    await updateAgendaItem()
  } else {
    await createAgendaItem()
  }
}

// Create new agenda item
const createAgendaItem = async () => {
  loading.value = true

  try {
    // Sanitize and validate all form data
    const sanitizedData = sanitizeFormData()
    if (!sanitizedData) {
      // Validation failed, errors are already set
      loading.value = false
      return
    }

    const response = await agendaService.createAgendaItem(props.eventId, sanitizedData)
    if (response.success && response.data) {
      emit('created', response.data)
    } else {
      displayError(response.message || 'Failed to create agenda item', response.errors)
    }
  } catch (error) {
    displayError('Network error while creating agenda item')
    console.error('Error creating agenda item:', error)
  } finally {
    loading.value = false
  }
}

// Update existing agenda item
const updateAgendaItem = async () => {
  loading.value = true

  try {
    // Sanitize and validate all form data
    const sanitizedData = sanitizeFormData()
    if (!sanitizedData) {
      // Validation failed, errors are already set
      loading.value = false
      return
    }

    const response = await agendaService.updateAgendaItem(props.eventId, props.item!.id, sanitizedData)
    if (response.success && response.data) {
      emit('updated', response.data)
    } else {
      displayError(response.message || 'Failed to update agenda item', response.errors)
    }
  } catch (error) {
    displayError('Network error while updating agenda item')
    console.error('Error updating agenda item:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Fetch available icons
  fetchIcons()

  // In create mode, auto-populate translation tabs based on existing agenda items
  if (!isEditMode.value && props.existingAgendaItems && props.existingAgendaItems.length > 0) {
    const existingLanguages = getExistingLanguages()

    // Create empty translation objects for each existing language
    existingLanguages.forEach(langCode => {
      // Skip English as it's the default
      if (langCode !== 'en' && !formData.translations.some(t => t.language === langCode)) {
        formData.translations.push({
          language: langCode,
          title: '',
          description: '',
          date_text: '',
          start_time_text: '',
          end_time_text: '',
          speaker: '',
        })
      }
    })
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Custom scrollbar for tab headers */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

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

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
