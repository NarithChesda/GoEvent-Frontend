<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">

    <!-- Main Content -->
    <section class="py-4 sm:py-6 lg:py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header with Tabs -->
        <div class="mb-8 sm:mb-10">
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            Settings
          </h1>

          <!-- Tab Navigation -->
          <div class="flex border-b border-slate-200 bg-slate-50/50">
            <button
              @click="activeTab = 'account'"
              :class="[
                'px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === 'account'
                  ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              ]"
            >
              Account
            </button>
            <button
              @click="activeTab = 'security'"
              :class="[
                'px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === 'security'
                  ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              ]"
            >
              Security
            </button>
            <button
              @click="activeTab = 'payment'"
              :class="[
                'px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === 'payment'
                  ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              ]"
            >
              Payment
            </button>
          </div>
        </div>

        <!-- Profile Settings (Account Tab) -->
        <div v-if="activeTab === 'account'">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Your Profile</h2>
            <p class="text-sm text-gray-500 mb-8">Choose how you are displayed as a host or guest.</p>

            <form @submit.prevent="handleProfileUpdate" class="space-y-6">
              <!-- Success/Error Messages -->
              <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <div class="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="font-medium">{{ successMessage }}</span>
              </div>
              <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <div class="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span class="font-medium">{{ errorMessage }}</span>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Mobile Profile Section - Shows first on mobile -->
                <div class="lg:hidden order-first">
                  <div :class="authStore.user?.is_partner ? 'grid grid-cols-2 gap-4' : 'flex justify-center'">
                    <!-- Profile Picture for Mobile -->
                    <div class="flex flex-col items-center">
                      <label class="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
                      <div class="relative w-28 h-28 mx-auto mb-2">
                        <!-- Partner Badge Ring -->
                        <div
                          v-if="authStore.user?.is_partner"
                          class="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 animate-pulse"
                        ></div>

                        <div
                          v-if="profilePictureUrl"
                          class="relative w-28 h-28 rounded-full overflow-hidden bg-orange-100 border-4 border-white shadow-lg"
                        >
                          <img
                            :src="profilePictureUrl"
                            :key="profilePictureUrl"
                            alt="Profile"
                            class="w-full h-full object-cover"
                            @error="handleImageError"
                            @load="handleImageLoad"
                          />
                        </div>
                        <div
                          v-else
                          class="relative w-28 h-28 bg-orange-400 rounded-full flex items-center justify-center text-gray-800 font-medium text-3xl border-4 border-white shadow-lg"
                        >
                          {{ authStore.userInitials }}
                        </div>

                        <!-- Upload button overlay -->
                        <button
                          type="button"
                          @click="triggerFileUpload"
                          class="absolute bottom-0 right-0 w-9 h-9 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Partner Logo for Mobile (only for partners) -->
                    <div v-if="authStore.user?.is_partner" class="flex flex-col items-center">
                      <label class="block text-sm font-medium text-gray-700 mb-3">Partner Logo</label>
                      <div class="relative w-28 h-28 mx-auto mb-2">
                        <div
                          v-if="logoUrl"
                          class="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-300 shadow-lg"
                        >
                          <img
                            :src="logoUrl"
                            :key="logoUrl"
                            alt="Logo"
                            class="w-full h-full object-contain p-2"
                            @error="handleLogoImageError"
                            @load="handleLogoImageLoad"
                          />
                        </div>
                        <div
                          v-else
                          class="relative w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium text-xs border-2 border-gray-300 shadow-lg"
                        >
                          No Logo
                        </div>

                        <!-- Upload button overlay -->
                        <button
                          type="button"
                          @click="triggerLogoUpload"
                          :disabled="logoUploadLoading"
                          class="absolute bottom-0 right-0 w-9 h-9 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Left Column - Form Fields (2/3 width) -->
                <div class="lg:col-span-2 space-y-6 order-2 lg:order-1">
                  <!-- Name Fields -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        v-model="profileForm.first_name"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="Narith"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        v-model="profileForm.last_name"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="Chesda"
                      />
                    </div>
                  </div>

                  <!-- Email Field -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                    <input
                      v-model="profileForm.email"
                      type="email"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Enter your email"
                    />
                  </div>

                  <!-- Username Field -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                      <input
                        v-model="profileForm.username"
                        type="text"
                        class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <!-- Bio Field -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      v-model="profileForm.bio"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                      placeholder="Share a little about your background and interests."
                    ></textarea>
                  </div>

                  <!-- Phone Number Field -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      v-model="profileForm.phone_number"
                      type="tel"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <!-- Telegram URL Field -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Telegram URL</label>
                    <input
                      v-model="profileForm.telegram_link"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="t.me/yourusername or @yourusername"
                    />
                  </div>

                  <!-- Payment URL Field (only for partners) -->
                  <div v-if="authStore.user?.is_partner">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Payment URL</label>
                    <input
                      v-model="profileForm.payment_link"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="your-payment-platform.com/username"
                    />
                  </div>
                </div>

                <!-- Right Column - Profile Picture (1/3 width) - Desktop only -->
                <div class="hidden lg:block lg:col-span-1 order-3 lg:order-2">
                  <div class="sticky top-8 space-y-8">
                    <!-- Profile Picture Section -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-3 text-center">Profile Picture</label>

                      <!-- Current Profile Picture -->
                      <div class="relative w-32 h-32 mx-auto mb-4">
                        <!-- Partner Badge Ring -->
                        <div
                          v-if="authStore.user?.is_partner"
                          class="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 animate-pulse"
                        ></div>

                        <div
                          v-if="profilePictureUrl"
                          class="relative w-32 h-32 rounded-full overflow-hidden bg-orange-100 border-4 border-white shadow-lg"
                        >
                          <img
                            :src="profilePictureUrl"
                            :key="profilePictureUrl"
                            alt="Profile"
                            class="w-full h-full object-cover"
                            @error="handleImageError"
                            @load="handleImageLoad"
                          />
                        </div>
                        <div
                          v-else
                          class="relative w-32 h-32 bg-orange-400 rounded-full flex items-center justify-center text-gray-800 font-medium text-4xl border-4 border-white shadow-lg"
                        >
                          {{ authStore.userInitials }}
                        </div>

                        <!-- Upload button overlay -->
                        <button
                          type="button"
                          @click="triggerFileUpload"
                          class="absolute bottom-0 right-0 w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                          </svg>
                        </button>
                      </div>

                      <input
                        ref="fileInput"
                        type="file"
                        accept="image/*"
                        @change="handleFileSelect"
                        class="hidden"
                      />
                    </div>

                    <!-- Partner Logo Section (only for partners) -->
                    <div v-if="authStore.user?.is_partner">
                      <label class="block text-sm font-medium text-gray-700 mb-3 text-center">Partner Logo</label>

                      <!-- Current Logo -->
                      <div class="relative w-32 h-32 mx-auto mb-4">
                        <div
                          v-if="logoUrl"
                          class="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-300 shadow-lg"
                        >
                          <img
                            :src="logoUrl"
                            :key="logoUrl"
                            alt="Logo"
                            class="w-full h-full object-contain p-2"
                            @error="handleLogoImageError"
                            @load="handleLogoImageLoad"
                          />
                        </div>
                        <div
                          v-else
                          class="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium text-xs border-2 border-gray-300 shadow-lg"
                        >
                          No Logo
                        </div>

                        <!-- Upload button overlay -->
                        <button
                          type="button"
                          @click="triggerLogoUpload"
                          :disabled="logoUploadLoading"
                          class="absolute bottom-0 right-0 w-10 h-10 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                          </svg>
                        </button>
                      </div>

                      <input
                        ref="logoFileInput"
                        type="file"
                        accept="image/*"
                        @change="handleLogoFileSelect"
                        class="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Save Changes Button -->
              <div class="flex justify-start pt-4">
                <button
                  type="submit"
                  :disabled="uploadLoading"
                  class="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow flex items-center gap-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ uploadLoading ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>

            </form>
        </div>

        <!-- Security Tab -->
        <div v-if="activeTab === 'security'">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
          <p class="text-sm text-gray-500 mb-8">Update your password to keep your account secure.</p>

          <form @submit.prevent="handlePasswordChange" class="space-y-6 max-w-2xl">
            <!-- Current Password -->
            <div>
              <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div class="relative">
                <input
                  id="currentPassword"
                  v-model="passwordForm.old_password"
                  :type="showPasswords.current ? 'text' : 'password'"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent pr-12',
                    fieldErrors.old_password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500',
                  ]"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  @click="showPasswords.current = !showPasswords.current"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg v-if="!showPasswords.current" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <div v-if="fieldErrors.old_password" class="mt-1">
                <p v-for="error in fieldErrors.old_password" :key="error" class="text-sm text-red-600">
                  {{ error }}
                </p>
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div class="relative">
                <input
                  id="newPassword"
                  v-model="passwordForm.new_password"
                  :type="showPasswords.new ? 'text' : 'password'"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent pr-12',
                    fieldErrors.new_password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500',
                  ]"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  @click="showPasswords.new = !showPasswords.new"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg v-if="!showPasswords.new" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <div v-if="fieldErrors.new_password" class="mt-1">
                <p v-for="error in fieldErrors.new_password" :key="error" class="text-sm text-red-600">
                  {{ error }}
                </p>
              </div>
            </div>

            <!-- Confirm New Password -->
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  v-model="passwordForm.new_password_confirm"
                  :type="showPasswords.confirm ? 'text' : 'password'"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent pr-12',
                    fieldErrors.new_password_confirm
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500',
                  ]"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  @click="showPasswords.confirm = !showPasswords.confirm"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg v-if="!showPasswords.confirm" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              <div v-if="fieldErrors.new_password_confirm" class="mt-1">
                <p v-for="error in fieldErrors.new_password_confirm" :key="error" class="text-sm text-red-600">
                  {{ error }}
                </p>
              </div>
            </div>

            <!-- Password Strength Indicator -->
            <div v-if="passwordForm.new_password" class="space-y-3">
              <div class="flex items-center space-x-2 text-sm">
                <div class="flex space-x-1">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="w-3 h-3 rounded-full transition-colors duration-300"
                    :class="passwordStrength >= i ? passwordStrengthColor : 'bg-gray-200'"
                  ></div>
                </div>
                <span class="font-medium" :class="passwordStrength >= 3 ? 'text-green-600' : 'text-orange-600'">
                  {{ passwordStrengthText }}
                </span>
                <span v-if="passwordStrength >= 3" class="text-green-600 text-xs">✓ Strong enough</span>
                <span v-else class="text-orange-600 text-xs">⚠ Too weak</span>
              </div>

              <!-- Password Requirements Feedback -->
              <div v-if="passwordStrengthData.feedback.length > 0" class="text-xs space-y-1">
                <p class="font-medium text-gray-600">Requirements:</p>
                <ul class="list-disc list-inside space-y-1 text-gray-500">
                  <li v-for="tip in passwordStrengthData.feedback" :key="tip">{{ tip }}</li>
                </ul>
              </div>

              <!-- Minimum strength warning -->
              <div v-if="passwordForm.new_password && !isPasswordStrongEnough" class="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <p class="text-sm text-orange-800">
                  <strong>Security Notice:</strong> Password must be at least "Good" strength (3/5) for account security.
                </p>
              </div>
            </div>

            <!-- Success/Error Messages -->
            <div v-if="passwordSuccessMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <div class="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="font-medium">{{ passwordSuccessMessage }}</span>
            </div>

            <div v-if="passwordErrorMessage" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <div class="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span class="font-medium">{{ passwordErrorMessage }}</span>
            </div>

            <!-- Change Password Button -->
            <div class="flex justify-start pt-4">
              <button
                type="submit"
                :disabled="!passwordsMatch || !isPasswordStrongEnough || !passwordForm.old_password"
                class="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </button>
            </div>
          </form>
        </div>

        <!-- Payment Tab -->
        <BaseCard v-if="activeTab === 'payment'" class="p-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Payment</h2>
          <p class="text-sm text-gray-500 mb-8">Manage your payment methods and billing information.</p>
          <p class="text-gray-600">Payment settings coming soon...</p>
        </BaseCard>
      </div> <!-- Close max-w-4xl container -->
    </section> <!-- Close py-4 section -->
    </div> <!-- Close gradient background -->
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import { useAuthStore } from '../stores/auth'
import { uploadService } from '../services/upload'
import { apiService } from '../services/api'
import type { User } from '../services/auth'
import { authService } from '../services/auth'
import { inputValidator, validationRules } from '../utils/inputValidation'

const router = useRouter()
const authStore = useAuthStore()

// Active tab state
const activeTab = ref<'account' | 'security' | 'payment'>('account')

// Profile form
const profileForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  bio: '',
  phone_number: '',
  telegram_link: '',
  payment_link: '',
})

// Password form
const passwordForm = ref({
  old_password: '',
  new_password: '',
  new_password_confirm: '',
})

// UI state
const successMessage = ref('')
const errorMessage = ref('')
const uploadLoading = ref(false)
const fileInput = ref<HTMLInputElement>()
const profilePicturePreview = ref<string>('')
const fieldErrors = ref<Record<string, string[]>>({})
const profilePictureTimestamp = ref(Date.now()) // Track when profile picture changes

// Password UI state
const passwordSuccessMessage = ref('')
const passwordErrorMessage = ref('')

const showPasswords = ref({
  current: false,
  new: false,
  confirm: false,
})

// Logo upload state
const logoUploadLoading = ref(false)
const logoFileInput = ref<HTMLInputElement>()
const logoPreview = ref<string>('')
const logoTimestamp = ref(Date.now()) // Track when logo changes

// Computed properties
// Profile picture URL with cache busting to force browser refresh
const profilePictureUrl = computed(() => {
  if (profilePicturePreview.value) {
    return profilePicturePreview.value
  }

  if (authStore.user?.profile_picture) {
    const baseUrl = apiService.getProfilePictureUrl(authStore.user.profile_picture)
    if (baseUrl) {
      // Add timestamp to bust browser cache when image changes
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}t=${profilePictureTimestamp.value}`
    }
  }

  return null
})

// Logo URL with cache busting to force browser refresh
const logoUrl = computed(() => {
  if (logoPreview.value) {
    return logoPreview.value
  }

  if (authStore.user?.logo) {
    const baseUrl = apiService.getProfilePictureUrl(authStore.user.logo)
    if (baseUrl) {
      // Add timestamp to bust browser cache when image changes
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}t=${logoTimestamp.value}`
    }
  }

  return null
})

// Sync profileForm with authStore.user whenever it changes
const syncFormWithStore = () => {
  if (authStore.user) {
    profileForm.value = {
      first_name: authStore.user.first_name || '',
      last_name: authStore.user.last_name || '',
      email: authStore.user.email || '',
      username: authStore.user.username || '',
      bio: authStore.user.bio || '',
      phone_number: authStore.user.phone_number || '',
      telegram_link: authStore.user.telegram_link || '',
      payment_link: authStore.user.payment_link || '',
    }
  }
}

// Initialize form with user data
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/signin')
    return
  }

  syncFormWithStore()
})

// Watch for changes to authStore.user and sync the form
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) {
      syncFormWithStore()
    }
  },
  { deep: true }
)

// Profile update handler
const handleProfileUpdate = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  fieldErrors.value = {}

  try {
    // Build update data - send all fields
    const updateData: Record<string, string> = {
      first_name: profileForm.value.first_name?.trim() || '',
      last_name: profileForm.value.last_name?.trim() || '',
      email: profileForm.value.email?.trim() || '',
      username: profileForm.value.username?.trim() || '',
      bio: profileForm.value.bio?.trim() || '',
      phone_number: profileForm.value.phone_number?.trim() || '',
    }

    // Handle telegram link formatting
    if (profileForm.value.telegram_link) {
      let telegramLink = profileForm.value.telegram_link.trim()
      if (telegramLink) {
        // Auto-format telegram links
        if (!telegramLink.startsWith('http')) {
          if (telegramLink.startsWith('t.me/') || telegramLink.startsWith('telegram.me/')) {
            telegramLink = 'https://' + telegramLink
          } else if (telegramLink.startsWith('@')) {
            telegramLink = 'https://t.me/' + telegramLink.substring(1)
          } else if (!telegramLink.includes('/')) {
            telegramLink = 'https://t.me/' + telegramLink
          }
        }
        updateData.telegram_link = telegramLink
      } else {
        updateData.telegram_link = ''
      }
    } else {
      updateData.telegram_link = ''
    }

    // Handle payment link for partners
    if (authStore.user?.is_partner) {
      if (profileForm.value.payment_link) {
        let paymentLink = profileForm.value.payment_link.trim()
        if (paymentLink && !paymentLink.startsWith('http')) {
          paymentLink = 'https://' + paymentLink
        }
        updateData.payment_link = paymentLink || ''
      } else {
        updateData.payment_link = ''
      }
    }

    const result = await authStore.updateProfile(updateData)

    if (result.success) {
      successMessage.value = 'Profile updated successfully!'
      fieldErrors.value = {}

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.error || 'Failed to update profile'
    }
  } catch (error) {
    console.error('Profile update error:', error)
    errorMessage.value = 'An unexpected error occurred'
  }
}


// Profile picture upload handlers
const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    uploadLoading.value = true
    errorMessage.value = ''

    // Enhanced file validation (will be done by uploadService)
    // Create preview first for better UX
    const reader = new FileReader()
    reader.onload = (e) => {
      profilePicturePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Upload file with enhanced security validation
    const response = await uploadService.uploadProfilePicture(file)

    if (response.success && response.data) {
      // The API can return the user object in different formats:
      // Format 1: { user: {...} } - nested user object
      // Format 2: { id, email, ... } - direct user object
      let userData: User | null = null

      if (response.data.user && response.data.user.id) {
        // Nested user object
        userData = response.data.user
      } else if (response.data.id && response.data.email) {
        // Direct user object - construct proper User type
        userData = {
          id: response.data.id,
          email: response.data.email,
          username: response.data.username || authStore.user?.username || '',
          first_name: response.data.first_name || authStore.user?.first_name,
          last_name: response.data.last_name || authStore.user?.last_name,
          profile_picture: response.data.profile_picture || authStore.user?.profile_picture,
          logo: response.data.logo || authStore.user?.logo,
          bio: response.data.bio || authStore.user?.bio,
          date_joined: response.data.date_joined || authStore.user?.date_joined || new Date().toISOString(),
          is_active: response.data.is_active ?? authStore.user?.is_active ?? true,
          is_verified: response.data.is_verified ?? authStore.user?.is_verified,
          is_partner: response.data.is_partner ?? authStore.user?.is_partner,
          phone_number: response.data.phone_number || authStore.user?.phone_number,
          telegram_link: response.data.telegram_link || authStore.user?.telegram_link,
          payment_link: response.data.payment_link || authStore.user?.payment_link,
        }
      }

      if (userData) {
        // Update the entire user in the store
        authStore.setUser(userData)
      } else {
        // Fallback: just update profile_picture field
        const profilePictureUrl = response.data.profile_picture || response.data.url
        await authStore.updateProfile({ profile_picture: profilePictureUrl })
      }

      // Wait for Vue to update the DOM, then update timestamp and clear preview
      await nextTick()

      // Update timestamp to force image reload
      profilePictureTimestamp.value = Date.now()

      // Clear preview AFTER store is updated
      profilePicturePreview.value = ''

      successMessage.value = 'Profile picture updated successfully!'

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = response.message || 'Failed to upload profile picture'
      profilePicturePreview.value = ''
    }
  } catch (error) {
    console.error('File upload error:', error)
    errorMessage.value = 'Failed to upload profile picture'
    profilePicturePreview.value = ''
  } finally {
    uploadLoading.value = false
    // Clear the input
    if (target) target.value = ''
  }
}

// Image error handler
const handleImageError = (event: Event) => {
  console.error('Image failed to load:', (event.target as HTMLImageElement)?.src)
  errorMessage.value = 'Failed to load profile picture. Please try refreshing the page.'
}

// Image load handler - Silent success, no logging needed
const handleImageLoad = () => {
  // Image loaded successfully
}

// Logo upload handlers
const triggerLogoUpload = () => {
  logoFileInput.value?.click()
}

const handleLogoFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    logoUploadLoading.value = true
    errorMessage.value = ''

    // Create preview first for better UX
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Upload file with enhanced security validation
    const response = await uploadService.uploadLogo(file)

    if (response.success && response.data) {
      // The API can return the user object in different formats
      let userData: User | null = null

      if (response.data.user && response.data.user.id) {
        userData = response.data.user
      } else if (response.data.id && response.data.email) {
        // Direct user object - construct proper User type
        userData = {
          id: response.data.id,
          email: response.data.email,
          username: response.data.username || authStore.user?.username || '',
          first_name: response.data.first_name || authStore.user?.first_name,
          last_name: response.data.last_name || authStore.user?.last_name,
          profile_picture: response.data.profile_picture || authStore.user?.profile_picture,
          logo: response.data.logo || authStore.user?.logo,
          bio: response.data.bio || authStore.user?.bio,
          date_joined: response.data.date_joined || authStore.user?.date_joined || new Date().toISOString(),
          is_active: response.data.is_active ?? authStore.user?.is_active ?? true,
          is_verified: response.data.is_verified ?? authStore.user?.is_verified,
          is_partner: response.data.is_partner ?? authStore.user?.is_partner,
          phone_number: response.data.phone_number || authStore.user?.phone_number,
          telegram_link: response.data.telegram_link || authStore.user?.telegram_link,
          payment_link: response.data.payment_link || authStore.user?.payment_link,
        }
      }

      if (userData) {
        authStore.setUser(userData)
      } else {
        const logoUrl = response.data.logo || response.data.url
        await authStore.updateProfile({ logo: logoUrl })
      }

      await nextTick()
      logoTimestamp.value = Date.now()
      logoPreview.value = ''

      successMessage.value = 'Logo updated successfully!'

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = response.message || 'Failed to upload logo'
      logoPreview.value = ''
    }
  } catch (error) {
    console.error('Logo upload error:', error)
    errorMessage.value = 'Failed to upload logo'
    logoPreview.value = ''
  } finally {
    logoUploadLoading.value = false
    if (target) target.value = ''
  }
}

// Logo image error handler
const handleLogoImageError = (event: Event) => {
  console.error('Logo failed to load:', (event.target as HTMLImageElement)?.src)
  errorMessage.value = 'Failed to load logo. Please try refreshing the page.'
}

// Logo image load handler
const handleLogoImageLoad = () => {
  // Logo loaded successfully
}

// Password strength validation
const passwordStrengthData = computed(() => {
  const password = passwordForm.value.new_password
  if (!password) return { score: 0, feedback: [] }
  return inputValidator.calculatePasswordStrength(password)
})

const passwordStrength = computed(() => passwordStrengthData.value.score)

const passwordStrengthText = computed(() => {
  const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  return texts[passwordStrength.value] || 'Very Weak'
})

const passwordStrengthColor = computed(() => {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  return colors[passwordStrength.value] || 'bg-gray-200'
})

const passwordsMatch = computed(() => {
  return passwordForm.value.new_password === passwordForm.value.new_password_confirm
})

const isPasswordStrongEnough = computed(() => {
  return passwordStrength.value >= 3
})

// Password change handler
const handlePasswordChange = async () => {
  passwordSuccessMessage.value = ''
  passwordErrorMessage.value = ''
  fieldErrors.value = {}

  // Rate limiting
  const clientId = navigator.userAgent + window.location.hostname
  if (inputValidator.isRateLimited(`password_change_${clientId}`, 3, 60 * 60 * 1000)) {
    passwordErrorMessage.value = 'Too many password change attempts. Please try again in 1 hour.'
    return
  }

  // Validation
  const validation = inputValidator.validateForm(passwordForm.value, {
    old_password: { required: true, sanitize: false },
    new_password: { ...validationRules.newPassword, required: true },
    new_password_confirm: { required: true, sanitize: false },
  })

  // Additional validations
  if (passwordForm.value.new_password && passwordForm.value.new_password_confirm) {
    if (passwordForm.value.new_password !== passwordForm.value.new_password_confirm) {
      validation.errors.new_password_confirm = ['Passwords do not match']
      validation.isValid = false
    }

    if (passwordForm.value.old_password === passwordForm.value.new_password) {
      validation.errors.new_password = ['New password must be different from current password']
      validation.isValid = false
    }

    if (!isPasswordStrongEnough.value) {
      validation.errors.new_password = [
        ...(validation.errors.new_password || []),
        'Password must be at least "Good" strength (score 3/5)',
        ...passwordStrengthData.value.feedback,
      ]
      validation.isValid = false
    }
  }

  if (!validation.isValid) {
    fieldErrors.value = validation.errors
    passwordErrorMessage.value = 'Please fix the validation errors below'
    return
  }

  try {
    const response = await authService.changePassword({
      old_password: validation.sanitizedData.old_password,
      new_password: validation.sanitizedData.new_password,
      new_password_confirm: validation.sanitizedData.new_password_confirm,
    })

    if (response.success) {
      inputValidator.clearRateLimit(`password_change_${clientId}`)

      passwordSuccessMessage.value = 'Password changed successfully!'
      fieldErrors.value = {}
      passwordForm.value = {
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      }

      setTimeout(() => {
        passwordSuccessMessage.value = ''
      }, 5000)
    } else {
      passwordErrorMessage.value = response.message || 'Failed to change password'
    }
  } catch (error) {
    console.error('Password change error:', error)
    passwordErrorMessage.value = 'An unexpected error occurred'
  }
}
</script>