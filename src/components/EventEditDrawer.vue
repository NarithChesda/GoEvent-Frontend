<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="requestClose()"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer-panel">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] laptop-sm:w-[35rem] laptop-md:w-[38.75rem] desktop:w-[42.5rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2 min-w-0">
              <button
                :disabled="isBusy"
                @click="requestClose"
                class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                :title="t('management.editEventDrawer.header.closeTitle')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white truncate">{{ t('management.editEventDrawer.header.title') }}</h2>
            </div>

            <!-- Right: Delete button -->
            <button
              v-if="event"
              @click="showDeleteConfirm = true"
              :disabled="isBusy || isDeleting"
              class="p-1.5 hover:bg-white/20 rounded-lg drawer-close disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              :title="t('management.editEventDrawer.header.deleteTitle')"
            >
              <Trash2 class="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- Loading State -->
          <div v-if="loading" class="p-6">
            <div class="animate-pulse space-y-6">
              <div class="h-10 bg-slate-200 rounded-xl"></div>
              <div class="h-24 bg-slate-200 rounded-xl"></div>
              <div class="h-10 bg-slate-200 rounded-xl"></div>
              <div class="grid grid-cols-2 gap-4">
                <div class="h-10 bg-slate-200 rounded-xl"></div>
                <div class="h-10 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="p-6 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle class="w-8 h-8 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ t('management.editEventDrawer.error.title') }}</h3>
            <p class="text-slate-600 mb-4">{{ error }}</p>
            <button
              @click="loadEvent"
              class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {{ t('management.editEventDrawer.error.tryAgain') }}
            </button>
          </div>

          <!-- Edit Form -->
          <div v-else class="p-3 laptop-sm:p-4 space-y-4 laptop-sm:space-y-5 pb-24">
            <!-- Basic Information -->
            <div class="space-y-3">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('management.editEventDrawer.basicInfo.heading') }}</h3>

              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.basicInfo.titleLabel') }}</label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  :placeholder="t('management.editEventDrawer.basicInfo.titlePlaceholder')"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
              </div>

              <!-- Short Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.basicInfo.shortDescLabel') }}</label>
                <input
                  v-model="form.short_description"
                  type="text"
                  maxlength="300"
                  :placeholder="t('management.editEventDrawer.basicInfo.shortDescPlaceholder')"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
                <p class="text-xs text-slate-500 mt-1">
                  {{ t('management.editEventDrawer.basicInfo.shortDescCount', { count: form.short_description?.length || 0 }) }}
                </p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.basicInfo.fullDescLabel') }}</label>
                <RichTextEditor
                  v-model="form.description"
                  :placeholder="t('management.editEventDrawer.basicInfo.fullDescPlaceholder')"
                  min-height="120px"
                />
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.basicInfo.categoryLabel') }}</label>
                <SelectField
                  :model-value="form.category ?? ''"
                  @update:model-value="form.category = $event"
                  :options="categoryOptions"
                  allow-empty
                  :placeholder="t('management.editEventDrawer.basicInfo.categoryPlaceholder')"
                  :title="t('management.editEventDrawer.basicInfo.categoryLabel')"
                />
              </div>
            </div>

            <!-- Date and Time -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('management.editEventDrawer.dateTime.heading') }}</h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Start Date & Time -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.dateTime.startDateTimeLabel') }}</label>
                  <DateTimePickerField
                    :model-value="form.start_date"
                    @update:model-value="onStartDateChange"
                    :title="t('management.editEventDrawer.dateTime.startDateTimeLabel')"
                  />
                </div>

                <!-- End Date & Time -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.dateTime.endDateTimeLabel') }}</label>
                  <DateTimePickerField
                    v-model="form.end_date"
                    :min="form.start_date"
                    :error="!!dateError"
                    :title="t('management.editEventDrawer.dateTime.endDateTimeLabel')"
                  />
                  <p v-if="dateError" class="text-xs text-red-600 mt-1">{{ dateError }}</p>
                </div>
              </div>

              <!-- Timezone -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.dateTime.timezoneLabel') }}</label>
                <SelectField
                  v-model="form.timezone"
                  :options="timezoneOptions"
                  :placeholder="t('management.editEventDrawer.dateTime.timezoneLabel')"
                  :title="t('management.editEventDrawer.dateTime.timezoneLabel')"
                />
              </div>
            </div>

            <!-- Location -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('management.editEventDrawer.location.heading') }}</h3>

              <!-- Virtual Event Toggle -->
              <div
                @click="form.is_virtual = !form.is_virtual"
                class="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-white rounded-lg shadow-sm">
                    <component :is="form.is_virtual ? Video : MapPin" class="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700">{{ form.is_virtual ? t('management.editEventDrawer.location.virtualLabel') : t('management.editEventDrawer.location.inPersonLabel') }}</p>
                    <p class="text-xs text-slate-500">{{ form.is_virtual ? t('management.editEventDrawer.location.virtualDesc') : t('management.editEventDrawer.location.inPersonDesc') }}</p>
                  </div>
                </div>
                <div
                  role="switch"
                  :aria-checked="form.is_virtual"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                    form.is_virtual ? 'bg-sky-500' : 'bg-slate-200'
                  ]"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                    :style="{ transform: form.is_virtual ? 'translateX(20px)' : 'translateX(0)' }"
                  />
                </div>
              </div>

              <!-- Location Input (In Person) -->
              <Transition name="drawer-reveal">
              <div v-if="!form.is_virtual" class="grid grid-rows-[1fr]">
                <div class="min-h-0 overflow-hidden">
                  <div class="space-y-3">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.location.addressLabel') }}</label>
                      <div class="relative">
                        <MapPin class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          v-model="form.location"
                          type="text"
                          :placeholder="t('management.editEventDrawer.location.addressPlaceholder')"
                          class="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                        />
                        <button
                          v-if="form.location"
                          type="button"
                          @click="form.location = ''"
                          class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center hover:bg-slate-300 transition-colors"
                        >
                          <X class="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                      <p class="text-xs text-slate-400 mt-1">
                        {{ t('management.editEventDrawer.location.mapMovedHint') }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </Transition>

              <!-- Virtual Link Input -->
              <Transition name="drawer-reveal">
              <div v-if="form.is_virtual" class="grid grid-rows-[1fr]">
                <div class="min-h-0 overflow-hidden">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.location.virtualLinkLabel') }}</label>
                    <div class="relative">
                      <Link2 class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        v-model="form.virtual_link"
                        type="url"
                        placeholder="https://zoom.us/meeting/..."
                        class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
              </Transition>
            </div>

            <!-- Privacy Settings -->
            <div class="space-y-3 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('management.editEventDrawer.privacy.heading') }}</h3>

              <div
                @click="form.privacy = form.privacy === 'public' ? 'private' : 'public'"
                class="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-white rounded-lg shadow-sm">
                    <component :is="form.privacy === 'public' ? Globe : Lock" class="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700">{{ form.privacy === 'public' ? t('management.editEventDrawer.privacy.publicLabel') : t('management.editEventDrawer.privacy.privateLabel') }}</p>
                    <p class="text-xs text-slate-500">{{ form.privacy === 'public' ? t('management.editEventDrawer.privacy.publicDesc') : t('management.editEventDrawer.privacy.privateDesc') }}</p>
                  </div>
                </div>
                <div
                  role="switch"
                  :aria-checked="form.privacy === 'public'"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                    form.privacy === 'public' ? 'bg-sky-500' : 'bg-slate-200'
                  ]"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                    :style="{ transform: form.privacy === 'public' ? 'translateX(20px)' : 'translateX(0)' }"
                  />
                </div>
              </div>
            </div>

            <!-- Registration Settings -->
            <div class="space-y-3 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('management.editEventDrawer.registration.heading') }}</h3>

              <!-- Require Registration Toggle -->
              <div
                @click="form.registration_required = !form.registration_required"
                class="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-white rounded-lg shadow-sm">
                    <ClipboardList class="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700">{{ t('management.editEventDrawer.registration.requireLabel') }}</p>
                    <p class="text-xs text-slate-500">{{ t('management.editEventDrawer.registration.requireDesc') }}</p>
                  </div>
                </div>
                <div
                  role="switch"
                  :aria-checked="form.registration_required"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                    form.registration_required ? 'bg-sky-500' : 'bg-slate-200'
                  ]"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                    :style="{ transform: form.registration_required ? 'translateX(20px)' : 'translateX(0)' }"
                  />
                </div>
              </div>

              <!-- Registration Details (shown when registration is required) -->
              <Transition name="drawer-reveal">
                <div v-if="form.registration_required" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <!-- Registration Deadline -->
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.registration.deadlineLabel') }}</label>
                        <DateTimePickerField
                          v-model="form.registration_deadline"
                          :max="form.start_date"
                          clearable
                          :title="t('management.editEventDrawer.registration.deadlineLabel')"
                          :placeholder="t('management.editEventDrawer.registration.deadlinePlaceholder')"
                        />
                        <p class="text-xs text-slate-500 mt-1">{{ t('management.editEventDrawer.registration.deadlineHint') }}</p>
                      </div>

                      <!-- Max Attendees -->
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.registration.maxAttendeesLabel') }}</label>
                        <input
                          v-model.number="form.max_attendees"
                          type="number"
                          min="1"
                          class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                          :placeholder="t('management.editEventDrawer.registration.maxAttendeesPlaceholder')"
                        />
                        <p class="text-xs text-slate-500 mt-1">{{ t('management.editEventDrawer.registration.maxAttendeesHint') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Showcase display settings (RSVP / Comments / Countdown) used to
                 live here. They now belong to the Design Studio live preview,
                 where each section carries its own on/off chip — see
                 components/showcase-preview/edit/SectionDisplayToggle.vue. -->

            <!-- Fundraising Settings -->
            <div class="space-y-3 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('management.editEventDrawer.fundraising.heading') }}</h3>

              <!-- Enable Fundraising Toggle -->
              <div
                @click="form.is_fundraising = !form.is_fundraising"
                class="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-white rounded-lg shadow-sm">
                    <Heart class="w-4 h-4 text-pink-500" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700">{{ t('management.editEventDrawer.fundraising.enableLabel') }}</p>
                    <p class="text-xs text-slate-500">{{ t('management.editEventDrawer.fundraising.enableDesc') }}</p>
                  </div>
                </div>
                <div
                  role="switch"
                  :aria-checked="form.is_fundraising"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                    form.is_fundraising ? 'bg-pink-500' : 'bg-slate-200'
                  ]"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                    :style="{ transform: form.is_fundraising ? 'translateX(20px)' : 'translateX(0)' }"
                  />
                </div>
              </div>

              <!-- Fundraising Details (shown when fundraising is enabled) -->
              <Transition name="drawer-reveal">
                <div v-if="form.is_fundraising" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="space-y-3">
                      <!-- Fundraising Goal and Currency -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <!-- Fundraising Goal -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-1.5">
                            <div class="flex items-center gap-1.5">
                              <Target class="w-3.5 h-3.5 text-slate-400" />
                              <span>{{ t('management.editEventDrawer.fundraising.goalLabel') }}</span>
                            </div>
                          </label>
                          <input
                            v-model.number="form.fundraising_goal"
                            type="number"
                            min="0"
                            step="0.01"
                            :placeholder="t('management.editEventDrawer.fundraising.goalPlaceholder')"
                            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 bg-white"
                          />
                          <p class="text-xs text-slate-500 mt-1">{{ t('management.editEventDrawer.fundraising.goalHint') }}</p>
                        </div>

                        <!-- Currency -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-1.5">{{ t('management.editEventDrawer.fundraising.currencyLabel') }}</label>
                          <SelectField
                            v-model="form.fundraising_currency"
                            :options="currencyOptions"
                            :placeholder="t('management.editEventDrawer.fundraising.currencyLabel')"
                            :title="t('management.editEventDrawer.fundraising.currencyLabel')"
                          />
                        </div>
                      </div>

                      <!-- Show Donation Progress Toggle -->
                      <div
                        @click="form.show_donation_progress = !form.show_donation_progress"
                        class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div class="flex items-center gap-3">
                          <TrendingUp class="w-4 h-4 text-slate-500" />
                          <div>
                            <p class="text-sm font-medium text-slate-700">{{ t('management.editEventDrawer.fundraising.progressLabel') }}</p>
                            <p class="text-xs text-slate-500">{{ t('management.editEventDrawer.fundraising.progressDesc') }}</p>
                          </div>
                        </div>
                        <div
                          role="switch"
                          :aria-checked="form.show_donation_progress"
                          :class="[
                            'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                            form.show_donation_progress ? 'bg-pink-500' : 'bg-slate-200'
                          ]"
                        >
                          <span
                            class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                            :style="{ transform: form.show_donation_progress ? 'translateX(16px)' : 'translateX(0)' }"
                          />
                        </div>
                      </div>

                      <!-- Show Donor List Toggle -->
                      <div
                        @click="form.show_donor_list = !form.show_donor_list"
                        class="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div class="flex items-center gap-3">
                          <Users class="w-4 h-4 text-slate-500" />
                          <div>
                            <p class="text-sm font-medium text-slate-700">{{ t('management.editEventDrawer.fundraising.donorsLabel') }}</p>
                            <p class="text-xs text-slate-500">{{ t('management.editEventDrawer.fundraising.donorsDesc') }}</p>
                          </div>
                        </div>
                        <div
                          role="switch"
                          :aria-checked="form.show_donor_list"
                          :class="[
                            'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                            form.show_donor_list ? 'bg-pink-500' : 'bg-slate-200'
                          ]"
                        >
                          <span
                            class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                            :style="{ transform: form.show_donor_list ? 'translateX(16px)' : 'translateX(0)' }"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <!-- The three states share one grid cell, so the button measures to
                 the widest of them once and never resizes as they swap. Same
                 face-swap the create drawer runs — one stylesheet, so saving an
                 event and creating one feel like the same act. -->
            <button
              @click="handleSubmit"
              :disabled="isBusy"
              :class="['action-btn', isComplete ? 'is-complete' : '']"
              class="grid px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md"
            >
              <span class="action-face" :data-on="!isSubmitting && !isComplete">
                <Save class="w-4 h-4" />
                <span>{{ t('management.editEventDrawer.footer.saveBtn') }}</span>
              </span>
              <span class="action-face" :data-on="isSubmitting">
                <Loader class="w-4 h-4 animate-spin" />
                <span>{{ t('management.editEventDrawer.footer.saving') }}</span>
              </span>
              <span class="action-face" :data-on="isComplete" aria-live="polite">
                <Check class="w-4 h-4" />
                <span>{{ t('management.editEventDrawer.footer.saved') }}</span>
              </span>
            </button>

            <button
              type="button"
              :disabled="isBusy"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {{ t('management.editEventDrawer.footer.cancel') }}
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
      </div>
    </Transition>

  </Teleport>

  <!-- Delete Confirmation Modal -->
  <DeleteConfirmModal
    :show="showDeleteConfirm"
    :loading="isDeleting"
    :title="t('management.editEventDrawer.deleteModal.title')"
    :item-name="event?.title"
    :message="t('management.editEventDrawer.deleteModal.message')"
    @confirm="handleDeleteConfirm"
    @cancel="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, nextTick, onUnmounted } from 'vue'
import {
  X,
  Loader,
  AlertCircle,
  MapPin,
  Video,
  Link2,
  Save,
  Check,
  ArrowRight,
  Trash2,
  Globe,
  Lock,
  ClipboardList,
  Heart,
  Target,
  Users,
  TrendingUp,
} from 'lucide-vue-next'
import RichTextEditor from './RichTextEditor.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import DateTimePickerField from '@/components/common/DateTimePickerField.vue'
import SelectField, { type SelectFieldOption } from '@/components/common/SelectField.vue'
import {
  eventsService,
  eventCategoriesService,
  type Event,
  type EventCategory,
} from '../services/api'
import { TIMEZONE_OPTIONS, getUserTimezone } from '../utils/timezones'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useToast } from '@/composables/useToast'
import { useActionConfirmation } from '@/composables/useActionConfirmation'

interface Props {
  modelValue: boolean
  eventId: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', event: Event): void
  (e: 'deleted', eventId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()
const { translateEventCategory } = useCategoryTranslation()

// State
const event = ref<Event | null>(null)
const categories = ref<EventCategory[]>([])
const loading = ref(false)
const isSubmitting = ref(false)
// Held on screen after a successful save, long enough to be seen: the face swap
// alone costs ~280ms, so a shorter hold would close on a tick that never
// finished arriving. Same figure as the create drawer's.
const { confirmed: isComplete, confirm: holdConfirmation, reset: resetConfirmation } =
  useActionConfirmation(900)
const isBusy = computed(() => isSubmitting.value || isComplete.value)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)
const error = ref<string | null>(null)

// Form data
const form = reactive({
  title: '',
  short_description: '',
  description: '',
  start_date: '',
  end_date: '',
  timezone: getUserTimezone(),
  location: '',
  google_map_embed_link: '',
  virtual_link: '',
  is_virtual: false,
  privacy: 'public' as 'public' | 'private',
  status: 'published' as 'draft' | 'published' | 'cancelled' | 'completed',
  category: '' as string | number | null,
  // Registration fields
  registration_required: false,
  registration_deadline: '',
  max_attendees: null as number | null,
  // Fundraising fields
  is_fundraising: false,
  fundraising_goal: null as number | null,
  fundraising_currency: 'USD' as 'USD' | 'KHR',
  show_donation_progress: true,
  show_donor_list: true,
})

// Original form values for dirty tracking
const originalForm = ref<typeof form | null>(null)

// Category options for the select field
const categoryOptions = computed<SelectFieldOption[]>(() =>
  categories.value.map((category) => ({
    value: category.id,
    label: translateEventCategory(category.name),
    color: category.color || '#3B82F6',
  })),
)

// Timezone options for the select field (all currently supported timezones are in Asia)
const timezoneOptions = computed<SelectFieldOption[]>(() =>
  TIMEZONE_OPTIONS.map((tz) => ({ value: tz.value, label: tz.label })),
)

const currencyOptions: SelectFieldOption[] = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'KHR', label: 'KHR - Cambodian Riel' },
]

// Live validation: end date must be after start date
const dateError = computed(() =>
  form.start_date && form.end_date && new Date(form.end_date) <= new Date(form.start_date)
    ? t('events.messages.endDateAfterStart')
    : '',
)

// When the user picks a new start, shift the end to preserve the chosen duration
const onStartDateChange = (value: string) => {
  const oldStart = form.start_date
  const oldEnd = form.end_date
  form.start_date = value
  if (!value || !oldEnd) return

  const start = new Date(value)
  if (oldStart) {
    const duration = new Date(oldEnd).getTime() - new Date(oldStart).getTime()
    if (duration > 0) {
      const shiftedEnd = new Date(start.getTime() + duration)
      const pad = (n: number) => String(n).padStart(2, '0')
      form.end_date = `${shiftedEnd.getFullYear()}-${pad(shiftedEnd.getMonth() + 1)}-${pad(shiftedEnd.getDate())}T${pad(shiftedEnd.getHours())}:${pad(shiftedEnd.getMinutes())}`
    }
  }
}

// Methods
const loadEvent = async () => {
  if (!props.eventId) return

  loading.value = true
  error.value = null

  try {
    const [eventResponse, categoriesResponse] = await Promise.all([
      eventsService.getEvent(props.eventId),
      eventCategoriesService.getCategories()
    ])

    if (eventResponse.success && eventResponse.data) {
      event.value = eventResponse.data
      populateForm(eventResponse.data)
    } else {
      error.value = eventResponse.message || 'Event not found'
    }

    if (categoriesResponse.success && categoriesResponse.data) {
      categories.value = categoriesResponse.data.results || []
    }
  } catch (err) {
    console.error('Error loading event:', err)
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

const populateForm = (eventData: Event) => {
  form.title = eventData.title || ''
  form.short_description = eventData.short_description || ''
  form.description = eventData.description || ''
  form.start_date = eventData.start_date.slice(0, 16)
  form.end_date = eventData.end_date.slice(0, 16)
  form.timezone = eventData.timezone || getUserTimezone()
  form.location = eventData.location || ''
  form.google_map_embed_link = eventData.google_map_embed_link || ''
  form.virtual_link = eventData.virtual_link || ''
  form.is_virtual = eventData.is_virtual
  form.privacy = eventData.privacy
  form.status = eventData.status
  form.category = eventData.category ? eventData.category.toString() : ''
  // Registration fields
  form.registration_required = eventData.registration_required || false
  form.registration_deadline = eventData.registration_deadline ? eventData.registration_deadline.slice(0, 16) : ''
  form.max_attendees = eventData.max_attendees || null
  // Fundraising fields
  form.is_fundraising = eventData.is_fundraising ?? false
  form.fundraising_goal = eventData.fundraising_goal ?? null
  form.fundraising_currency = eventData.fundraising_currency ?? 'USD'
  form.show_donation_progress = eventData.show_donation_progress ?? true
  form.show_donor_list = eventData.show_donor_list ?? true

  // Store original values for dirty tracking
  originalForm.value = { ...form }
}

const handleSubmit = async () => {
  if (!event.value || !originalForm.value) return

  // Validation
  if (!form.title.trim()) {
    showMessage('error', 'Event title is required')
    return
  }

  if (!form.start_date || !form.end_date || dateError.value) {
    showMessage('error', t('events.messages.endDateAfterStart'))
    return
  }

  // Build update payload with only changed fields (dirty tracking)
  const updateData: Record<string, unknown> = {}
  const original = originalForm.value

  // Check text fields
  if (form.title.trim() !== original.title) {
    updateData.title = form.title.trim()
  }
  if ((form.short_description?.trim() || '') !== (original.short_description || '')) {
    updateData.short_description = form.short_description?.trim() || ''
  }
  if (form.description.trim() !== original.description) {
    updateData.description = form.description.trim()
  }

  // Check date/time fields
  if (form.start_date !== original.start_date) {
    updateData.start_date = new Date(form.start_date).toISOString()
  }
  if (form.end_date !== original.end_date) {
    updateData.end_date = new Date(form.end_date).toISOString()
  }
  if (form.timezone !== original.timezone) {
    updateData.timezone = form.timezone || 'UTC'
  }

  // Check boolean/enum fields
  if (form.is_virtual !== original.is_virtual) {
    updateData.is_virtual = form.is_virtual
  }
  if (form.privacy !== original.privacy) {
    updateData.privacy = form.privacy
  }
  if (form.status !== original.status) {
    updateData.status = form.status
  }

  // Check category
  const currentCategory = form.category && form.category !== '' ? parseInt(form.category.toString(), 10) : null
  const originalCategory = original.category && original.category !== '' ? parseInt(original.category.toString(), 10) : null
  if (currentCategory !== originalCategory) {
    updateData.category = currentCategory
  }

  // Handle location fields based on is_virtual
  // If is_virtual changed, we need to update location fields accordingly
  if (form.is_virtual !== original.is_virtual || form.is_virtual) {
    // Virtual event - clear physical location fields if they had values
    if (form.is_virtual) {
      if (original.location) {
        updateData.location = ''
      }
      if (original.google_map_embed_link) {
        updateData.google_map_embed_link = null
      }
      if ((form.virtual_link?.trim() || '') !== (original.virtual_link || '')) {
        updateData.virtual_link = form.virtual_link?.trim() || ''
      }
    }
  }

  if (!form.is_virtual) {
    // In-person event - check location fields
    if ((form.location?.trim() || '') !== (original.location || '')) {
      updateData.location = form.location?.trim() || ''
    }
    if ((form.google_map_embed_link?.trim() || '') !== (original.google_map_embed_link || '')) {
      updateData.google_map_embed_link = form.google_map_embed_link?.trim() || null
    }
    // Clear virtual_link if it had a value
    if (original.virtual_link) {
      updateData.virtual_link = ''
    }
  }

  // Check registration fields
  if (form.registration_required !== original.registration_required) {
    updateData.registration_required = form.registration_required
  }

  // Handle registration deadline - convert to ISO or null
  if (form.registration_required) {
    const currentDeadline = form.registration_deadline ? new Date(form.registration_deadline).toISOString() : null
    const originalDeadline = original.registration_deadline ? new Date(original.registration_deadline).toISOString() : null
    if (currentDeadline !== originalDeadline) {
      updateData.registration_deadline = currentDeadline
    }

    // Handle max attendees
    if (form.max_attendees !== original.max_attendees) {
      updateData.max_attendees = form.max_attendees
    }
  } else if (original.registration_required) {
    // If registration was disabled, clear the fields
    if (original.registration_deadline) {
      updateData.registration_deadline = null
    }
    if (original.max_attendees) {
      updateData.max_attendees = null
    }
  }

  // Check fundraising fields
  if (form.is_fundraising !== original.is_fundraising) {
    updateData.is_fundraising = form.is_fundraising
  }

  // Handle fundraising-specific fields when fundraising is enabled
  if (form.is_fundraising) {
    if (form.fundraising_goal !== original.fundraising_goal) {
      updateData.fundraising_goal = form.fundraising_goal
    }
    if (form.fundraising_currency !== original.fundraising_currency) {
      updateData.fundraising_currency = form.fundraising_currency
    }
    if (form.show_donation_progress !== original.show_donation_progress) {
      updateData.show_donation_progress = form.show_donation_progress
    }
    if (form.show_donor_list !== original.show_donor_list) {
      updateData.show_donor_list = form.show_donor_list
    }
  } else if (original.is_fundraising) {
    // If fundraising was disabled, reset the fields to defaults
    if (original.fundraising_goal) {
      updateData.fundraising_goal = null
    }
  }

  // Nothing changed: the answer to "save this" is still "it's saved", so the
  // button says so and the drawer closes exactly as it would have. A green
  // toast reading "No changes to save" was reporting a non-event as a success.
  if (Object.keys(updateData).length === 0) {
    holdConfirmation(() => closeDrawer())
    return
  }

  isSubmitting.value = true

  try {
    const response = await eventsService.patchEvent(event.value.id, updateData)

    if (response.success && response.data) {
      emit('updated', response.data)
      // Update original form to reflect saved state
      originalForm.value = { ...form }

      // Let the parent's merge and re-render land before the swap starts. That
      // merge rebuilds the whole event object behind the drawer, and starting a
      // 280ms transition in the same tick means its opening frames compete with
      // that work — the create drawer refreshes its list before handing back for
      // the same reason.
      await nextTick()

      // The button then holds its own tick and closes, where this used to toast
      // and sit for a second with the button back on "Update Event", as if the
      // press had been forgotten.
      isSubmitting.value = false
      holdConfirmation(() => closeDrawer())
      return
    }

    showMessage('error', response.message || 'Failed to update event')
  } catch (err) {
    console.error('Error updating event:', err)
    showMessage('error', 'An error occurred while updating the event')
  }

  // Every failing path lands here: the drawer stays open with the user's edits
  // intact, and the error toast is something they can act on.
  isSubmitting.value = false
}

const { showToast } = useToast()

const showMessage = (type: 'success' | 'error', text: string) => {
  showToast(type, text)
}

const closeDrawer = () => {
  emit('update:modelValue', false)
}

/**
 * The dismissal affordances (backdrop, header close, Escape) go through this;
 * the confirmation follow-up calls `closeDrawer` directly. A save in flight, or
 * a tick still being read, is not a moment to yank the drawer away.
 */
const requestClose = () => {
  if (isBusy.value) return
  closeDrawer()
}

// Handle delete confirmation
const handleDeleteConfirm = async () => {
  if (!event.value) return

  isDeleting.value = true

  try {
    const response = await eventsService.deleteEvent(event.value.id)
    if (response.success) {
      showDeleteConfirm.value = false
      emit('deleted', event.value.id)
      closeDrawer()
    } else {
      showMessage('error', response.message || 'Failed to delete event')
    }
  } catch (err) {
    console.error('Error deleting event:', err)
    showMessage('error', 'An error occurred while deleting the event')
  } finally {
    isDeleting.value = false
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && !isBusy.value) closeDrawer()
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.eventId) {
      loadEvent()
    }
    // Prevent body scroll when drawer is open
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      document.addEventListener('keydown', handleKeydown)
    } else {
      // Dismissed mid-confirmation (backdrop, Esc): drop the held state without
      // running its follow-up, so reopening doesn't start on a stale tick.
      resetConfirmation()
      isSubmitting.value = false
      // Defer body style resets until after transition completes (350ms)
      // to prevent layout recalculation during animation
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 350)
      document.removeEventListener('keydown', handleKeydown)
    }
  }
)

// Watch for eventId changes
watch(
  () => props.eventId,
  (newId) => {
    if (newId && props.modelValue) {
      loadEvent()
    }
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped src="./common/actionButton.css"></style>
