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
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] laptop-sm:w-[560px] laptop-md:w-[620px] desktop:w-[680px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white">
                {{ isEditMode ? 'Edit Listing' : 'Create Listing' }}
              </h2>
            </div>
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

          <!-- Form -->
          <div v-else class="p-3 laptop-sm:p-4 space-y-4 laptop-sm:space-y-5 pb-24">
            <!-- Cover Image Upload -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cover Image</h3>
                <!-- Options button when image exists -->
                <div v-if="form.coverImage" class="relative">
                  <button
                    @click.stop="showCoverDropdown = !showCoverDropdown"
                    class="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                  >
                    <MoreHorizontal class="w-4 h-4" />
                  </button>
                  <!-- Dropdown menu -->
                  <div
                    v-if="showCoverDropdown"
                    @click.stop
                    class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 min-w-[120px]"
                  >
                    <button
                      @click="triggerCoverUpload(); showCoverDropdown = false"
                      class="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Upload class="w-4 h-4" />
                      <span>Replace</span>
                    </button>
                    <button
                      @click="form.coverImage = ''; form.coverImageFile = null; showCoverDropdown = false"
                      class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <X class="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Hidden file input -->
              <input
                ref="coverFileInput"
                type="file"
                accept="image/*"
                @change="handleCoverFileSelect"
                class="hidden"
              />

              <!-- Cover Preview or Upload Area -->
              <div
                v-if="form.coverImage"
                class="relative rounded-lg overflow-hidden"
                style="padding-bottom: 56.25%;"
              >
                <img
                  :src="form.coverImage"
                  alt="Cover Image"
                  class="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                @click="triggerCoverUpload"
                class="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#2ecc71] hover:bg-slate-50 transition-all group"
              >
                <div class="flex flex-col items-center gap-1.5">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                    <ImageIcon class="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div>
                    <p class="text-xs font-medium text-slate-600 group-hover:text-slate-900">Click to upload cover image</p>
                    <p class="text-[10px] text-slate-400">16:9 ratio recommended</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Basic Information -->
            <div class="space-y-3 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Basic Information</h3>

              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Service Title *</label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  placeholder="Enter service title"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
              </div>

              <!-- Tagline -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Tagline</label>
                <input
                  v-model="form.tagline"
                  type="text"
                  maxlength="150"
                  placeholder="Brief catchy description"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
                <p class="text-xs text-slate-500 mt-1">
                  {{ form.tagline?.length || 0 }}/150 characters
                </p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Full Description *</label>
                <textarea
                  v-model="form.description"
                  rows="4"
                  placeholder="Detailed service description"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white resize-none"
                ></textarea>
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                <div class="relative">
                  <select
                    v-model="form.category"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                  >
                    <option value="">Select a category</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <!-- Pricing -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pricing</h3>

              <!-- Price Type -->
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="form.priceType = 'fixed'"
                  :class="[
                    'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all text-center',
                    form.priceType === 'fixed'
                      ? 'border-[#2ecc71] bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <DollarSign :class="['w-4 h-4', form.priceType === 'fixed' ? 'text-[#2ecc71]' : 'text-slate-400']" />
                  <span :class="['text-xs font-medium', form.priceType === 'fixed' ? 'text-slate-900' : 'text-slate-600']">Fixed</span>
                </button>

                <button
                  type="button"
                  @click="form.priceType = 'range'"
                  :class="[
                    'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all text-center',
                    form.priceType === 'range'
                      ? 'border-[#2ecc71] bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <TrendingUp :class="['w-4 h-4', form.priceType === 'range' ? 'text-[#2ecc71]' : 'text-slate-400']" />
                  <span :class="['text-xs font-medium', form.priceType === 'range' ? 'text-slate-900' : 'text-slate-600']">Range</span>
                </button>

                <button
                  type="button"
                  @click="form.priceType = 'quote'"
                  :class="[
                    'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all text-center',
                    form.priceType === 'quote'
                      ? 'border-[#2ecc71] bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  ]"
                >
                  <MessageSquare :class="['w-4 h-4', form.priceType === 'quote' ? 'text-[#2ecc71]' : 'text-slate-400']" />
                  <span :class="['text-xs font-medium', form.priceType === 'quote' ? 'text-slate-900' : 'text-slate-600']">Quote</span>
                </button>
              </div>

              <!-- Price Inputs -->
              <div v-if="form.priceType === 'fixed'" class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Price *</label>
                  <div class="relative">
                    <DollarSign class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      v-model.number="form.priceMin"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                  <div class="relative">
                    <select
                      v-model="form.currency"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KHR">KHR (៛)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div v-else-if="form.priceType === 'range'" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Min Price *</label>
                    <div class="relative">
                      <DollarSign class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        v-model.number="form.priceMin"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Max Price *</label>
                    <div class="relative">
                      <DollarSign class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        v-model.number="form.priceMax"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                  <div class="relative">
                    <select
                      v-model="form.currency"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KHR">KHR (៛)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div v-else class="bg-slate-50 rounded-lg p-3">
                <p class="text-sm text-slate-600">
                  Price will be displayed as "Contact for Quote"
                </p>
              </div>

              <!-- Price Unit -->
              <div v-if="form.priceType !== 'quote'">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Price Unit</label>
                <div class="relative">
                  <select
                    v-model="form.priceUnit"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                  >
                    <option value="">No unit</option>
                    <option value="per_event">Per Event</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_day">Per Day</option>
                    <option value="per_person">Per Person</option>
                    <option value="per_item">Per Item</option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <!-- Service Area -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Area</h3>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Locations Served</label>
                <div class="relative">
                  <MapPin class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.serviceArea"
                    type="text"
                    placeholder="e.g., Phnom Penh, Cambodia or Nationwide"
                    class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags</h3>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Service Tags</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="(tag, index) in form.tags"
                    :key="index"
                    class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                  >
                    {{ tag }}
                    <button
                      type="button"
                      @click="removeTag(index)"
                      class="w-4 h-4 rounded-full bg-slate-300 hover:bg-slate-400 flex items-center justify-center transition-colors"
                    >
                      <X class="w-2.5 h-2.5 text-slate-600" />
                    </button>
                  </span>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newTag"
                    type="text"
                    placeholder="Add a tag"
                    @keydown.enter.prevent="addTag"
                    class="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                  <button
                    type="button"
                    @click="addTag"
                    :disabled="!newTag.trim()"
                    class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  Press Enter or click Add to add a tag
                </p>
              </div>
            </div>

            <!-- Gallery -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gallery</h3>

              <!-- Hidden file input for gallery -->
              <input
                ref="galleryFileInput"
                type="file"
                accept="image/*"
                multiple
                @change="handleGalleryFileSelect"
                class="hidden"
              />

              <!-- Gallery Grid -->
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="(image, index) in form.gallery"
                  :key="index"
                  class="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group"
                >
                  <img :src="image" alt="Gallery" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    @click="removeGalleryImage(index)"
                    class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </div>

                <!-- Add More Button -->
                <div
                  @click="triggerGalleryUpload"
                  class="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#2ecc71] hover:bg-slate-50 transition-all group"
                >
                  <Plus class="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  <span class="text-xs text-slate-400 group-hover:text-emerald-600 mt-1">Add</span>
                </div>
              </div>
              <p class="text-xs text-slate-500">
                Add up to 10 images to showcase your work
              </p>
            </div>

            <!-- Contact Information -->
            <div class="space-y-3 laptop-sm:space-y-4 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Information</h3>

              <!-- Telegram -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Telegram Username</label>
                <div class="relative">
                  <Send class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.telegramUsername"
                    type="text"
                    placeholder="@username"
                    class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
              </div>

              <!-- Phone -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                <div class="relative">
                  <Phone class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.phone"
                    type="tel"
                    placeholder="+855 12 345 678"
                    class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
              </div>

              <!-- Website -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                <div class="relative">
                  <Globe class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="form.website"
                    type="url"
                    placeholder="https://example.com"
                    class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with Save and Delete Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              @click="handleSubmit"
              :disabled="isSubmitting"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Listing' : 'Create Listing') }}</span>
            </button>

            <button
              v-if="isEditMode"
              @click="showDeleteConfirm = true"
              :disabled="isSubmitting"
              class="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 class="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
        <Transition name="slide-up">
          <div v-if="message" class="absolute bottom-16 left-4 right-4 z-10">
            <div
              :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
              class="text-white px-3 py-2.5 rounded-lg shadow-lg flex items-center"
            >
              <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 mr-2 flex-shrink-0" />
              <AlertCircle v-else class="w-4 h-4 mr-2 flex-shrink-0" />
              <span class="text-xs">{{ message.text }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Delete Confirmation Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
          <div class="text-center">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 class="w-6 h-6 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Delete Listing</h3>
            <p class="text-sm text-slate-600 mb-6">
              Are you sure you want to delete "{{ form.title }}"? This action cannot be undone.
            </p>
            <div class="flex gap-3">
              <button
                @click="showDeleteConfirm = false"
                class="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                @click="handleDelete"
                class="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import {
  X,
  Loader,
  AlertCircle,
  CheckCircle,
  MapPin,
  Save,
  ImageIcon,
  Upload,
  MoreHorizontal,
  ArrowRight,
  Trash2,
  ChevronDown,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Plus,
  Send,
  Phone,
  Globe,
} from 'lucide-vue-next'

interface Category {
  id: string
  name: string
}

interface Listing {
  id: string
  title: string
  tagline: string
  description: string
  coverImage: string
  category: string
  priceType: 'fixed' | 'range' | 'quote'
  priceMin: number | null
  priceMax: number | null
  currency: string
  priceUnit: string
  serviceArea: string
  tags: string[]
  gallery: string[]
  telegramUsername: string
  phone: string
  website: string
}

interface Props {
  modelValue: boolean
  listingId?: string | null
  listing?: Listing | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', listing: Listing): void
  (e: 'updated', listing: Listing): void
  (e: 'deleted', listingId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  listingId: null,
  listing: null,
})

const emit = defineEmits<Emits>()

// Computed
const isEditMode = computed(() => !!props.listingId || !!props.listing)

// State
const loading = ref(false)
const isSubmitting = ref(false)
const showDeleteConfirm = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Cover upload state
const coverFileInput = ref<HTMLInputElement | null>(null)
const showCoverDropdown = ref(false)

// Gallery upload state
const galleryFileInput = ref<HTMLInputElement | null>(null)

// Tag input
const newTag = ref('')

// Mock categories
const categories = ref<Category[]>([
  { id: 'photography', name: 'Photography' },
  { id: 'videography', name: 'Videography' },
  { id: 'catering', name: 'Catering' },
  { id: 'venue', name: 'Venue' },
  { id: 'music', name: 'Music & Entertainment' },
  { id: 'decoration', name: 'Decoration' },
  { id: 'florist', name: 'Florist' },
  { id: 'planning', name: 'Event Planning' },
  { id: 'rentals', name: 'Rentals' },
  { id: 'makeup', name: 'Makeup & Styling' },
  { id: 'transport', name: 'Transportation' },
  { id: 'mc', name: 'MC & Host' },
  { id: 'printing', name: 'Printing & Stationery' },
  { id: 'security', name: 'Security' },
  { id: 'other', name: 'Other Services' },
])

// Form data
const form = reactive({
  title: '',
  tagline: '',
  description: '',
  coverImage: '',
  coverImageFile: null as File | null,
  category: '',
  priceType: 'fixed' as 'fixed' | 'range' | 'quote',
  priceMin: null as number | null,
  priceMax: null as number | null,
  currency: 'USD',
  priceUnit: '',
  serviceArea: '',
  tags: [] as string[],
  gallery: [] as string[],
  galleryFiles: [] as File[],
  telegramUsername: '',
  phone: '',
  website: '',
})

// Methods
const resetForm = () => {
  form.title = ''
  form.tagline = ''
  form.description = ''
  form.coverImage = ''
  form.coverImageFile = null
  form.category = ''
  form.priceType = 'fixed'
  form.priceMin = null
  form.priceMax = null
  form.currency = 'THB'
  form.priceUnit = ''
  form.serviceArea = ''
  form.tags = []
  form.gallery = []
  form.galleryFiles = []
  form.telegramUsername = ''
  form.phone = ''
  form.website = ''
}

const populateForm = (listing: Listing) => {
  form.title = listing.title || ''
  form.tagline = listing.tagline || ''
  form.description = listing.description || ''
  form.coverImage = listing.coverImage || ''
  form.category = listing.category || ''
  form.priceType = listing.priceType || 'fixed'
  form.priceMin = listing.priceMin
  form.priceMax = listing.priceMax
  form.currency = listing.currency || 'THB'
  form.priceUnit = listing.priceUnit || ''
  form.serviceArea = listing.serviceArea || ''
  form.tags = [...(listing.tags || [])]
  form.gallery = [...(listing.gallery || [])]
  form.telegramUsername = listing.telegramUsername || ''
  form.phone = listing.phone || ''
  form.website = listing.website || ''
}

const triggerCoverUpload = () => {
  coverFileInput.value?.click()
}

const handleCoverFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''

  if (!file) return

  if (!file.type.startsWith('image/')) {
    showMessage('error', 'Please select an image file')
    return
  }

  form.coverImageFile = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    form.coverImage = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}

const triggerGalleryUpload = () => {
  galleryFileInput.value?.click()
}

const handleGalleryFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  target.value = ''

  if (!files || files.length === 0) return

  const remainingSlots = 10 - form.gallery.length
  const filesToAdd = Array.from(files).slice(0, remainingSlots)

  filesToAdd.forEach((file) => {
    if (!file.type.startsWith('image/')) return

    form.galleryFiles.push(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      form.gallery.push(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  })
}

const removeGalleryImage = (index: number) => {
  form.gallery.splice(index, 1)
  form.galleryFiles.splice(index, 1)
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  form.tags.splice(index, 1)
}

const handleSubmit = async () => {
  // Validation
  if (!form.title.trim()) {
    showMessage('error', 'Service title is required')
    return
  }

  if (!form.description.trim()) {
    showMessage('error', 'Description is required')
    return
  }

  if (!form.category) {
    showMessage('error', 'Please select a category')
    return
  }

  if (form.priceType === 'fixed' && !form.priceMin) {
    showMessage('error', 'Please enter a price')
    return
  }

  if (form.priceType === 'range' && (!form.priceMin || !form.priceMax)) {
    showMessage('error', 'Please enter both min and max prices')
    return
  }

  isSubmitting.value = true

  try {
    // Mock API call - simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const listingData: Listing = {
      id: props.listingId || `listing-${Date.now()}`,
      title: form.title.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      coverImage: form.coverImage,
      category: form.category,
      priceType: form.priceType,
      priceMin: form.priceMin,
      priceMax: form.priceMax,
      currency: form.currency,
      priceUnit: form.priceUnit,
      serviceArea: form.serviceArea.trim(),
      tags: form.tags,
      gallery: form.gallery,
      telegramUsername: form.telegramUsername.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
    }

    if (isEditMode.value) {
      showMessage('success', 'Listing updated successfully!')
      emit('updated', listingData)
    } else {
      showMessage('success', 'Listing created successfully!')
      emit('created', listingData)
    }

    setTimeout(() => {
      closeDrawer()
    }, 1000)
  } catch (err) {
    console.error('Error saving listing:', err)
    showMessage('error', 'An error occurred while saving')
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!props.listingId && !props.listing?.id) return

  try {
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    showDeleteConfirm.value = false
    emit('deleted', props.listingId || props.listing?.id || '')
    closeDrawer()
  } catch (err) {
    console.error('Error deleting listing:', err)
    showMessage('error', 'Failed to delete listing')
  }
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 4000)
}

const closeDrawer = () => {
  emit('update:modelValue', false)
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.listing) {
        populateForm(props.listing)
      } else {
        resetForm()
      }

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }
)

// Watch for listing prop changes
watch(
  () => props.listing,
  (newListing) => {
    if (newListing && props.modelValue) {
      populateForm(newListing)
    }
  }
)
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
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

/* Slide up transition for toast */
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
