<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Template</h2>
        <p class="text-sm text-slate-600 mt-1">
          {{ event.event_template_enabled ? 'Manage your event template and styling' : 'Select a template for your event' }}
        </p>
      </div>
      <div v-if="canEdit" class="flex items-center space-x-3">
        <button
          v-if="!showTemplateSelector && !event.event_template_enabled"
          @click="showTemplateSelector = true"
          class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center"
        >
          <Palette class="w-4 h-4 mr-2" />
          Browse Templates
        </button>
        <button
          v-if="event.event_template_enabled"
          @click="showTemplateSelector = true"
          class="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-2 hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] shadow-lg"
          title="Change Template"
        >
          <Shuffle class="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>

    <!-- Current Template Info - Show if template is enabled and has backend details -->
    <div v-if="event.event_template && event.event_template_enabled && event.event_template_details" class="space-y-6">
      <!-- Template Overview Card -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
        <div class="relative">
          <!-- Preview Image -->
          <div v-if="event.event_template_details?.preview_image" class="relative h-64 overflow-hidden">
            <img 
              :src="event.event_template_details?.preview_image" 
              :alt="event.event_template_details?.name"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div class="absolute bottom-4 left-6 right-6">
              <h3 class="text-2xl font-bold text-white mb-2">{{ event.event_template_details?.name || 'Selected Template' }}</h3>
              <div class="flex items-center space-x-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                  <Package class="w-4 h-4 mr-1" />
                  {{ event.event_template_details?.package_plan.name || 'Template Plan' }}
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                  <DollarSign class="w-4 h-4 mr-1" />
                  ${{ event.event_template_details?.package_plan.price || '0.00' }}
                </span>
                <span 
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                  :class="event.event_template_enabled 
                    ? 'bg-green-500 text-white' 
                    : 'bg-yellow-500 text-black'"
                >
                  {{ event.event_template_enabled ? 'Active' : 'Pending Payment' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Template Details -->
          <div class="p-6 space-y-6">
            <!-- Package Features -->
            <div>
              <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
                <Sparkles class="w-5 h-5 mr-2 text-purple-600" />
                Package Features
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div 
                  v-for="(feature, index) in event.event_template_details?.package_plan.features || []" 
                  :key="index"
                  class="flex items-center text-sm text-slate-700"
                >
                  <CheckCircle class="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                  {{ feature }}
                </div>
              </div>
            </div>

            <!-- Color Palette -->
            <div v-if="event.event_template_details?.template_colors && event.event_template_details.template_colors.length > 0">
              <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
                <Palette class="w-5 h-5 mr-2 text-purple-600" />
                Color Palette
              </h4>
              <div class="flex flex-wrap gap-3">
                <div 
                  v-for="color in event.event_template_details?.template_colors || []" 
                  :key="color.id"
                  class="group cursor-pointer"
                >
                  <div class="flex items-center space-x-2 bg-white rounded-lg border border-slate-200 p-2 hover:shadow-md transition-all">
                    <div 
                      class="w-10 h-10 rounded-lg shadow-inner"
                      :style="{ backgroundColor: color.hex_color_code }"
                    ></div>
                    <div class="text-xs">
                      <p class="font-medium text-slate-700">{{ color.name }}</p>
                      <p class="text-slate-500">{{ color.hex_color_code }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Template Assets -->
            <div>
              <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
                <Image class="w-5 h-5 mr-2 text-purple-600" />
                Template Assets
              </h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <!-- Background Photo -->
                <div v-if="event.event_template_details?.basic_background_photo" class="group cursor-pointer">
                  <div class="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                    <div class="aspect-video relative overflow-hidden bg-slate-100">
                      <img 
                        :src="event.event_template_details?.basic_background_photo" 
                        alt="Background"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div class="p-2">
                      <p class="text-xs font-medium text-slate-700">Background</p>
                    </div>
                  </div>
                </div>

                <!-- Decoration Photo -->
                <div v-if="event.event_template_details?.basic_decoration_photo" class="group cursor-pointer">
                  <div class="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                    <div class="aspect-video relative overflow-hidden bg-slate-100">
                      <img 
                        :src="event.event_template_details?.basic_decoration_photo" 
                        alt="Decoration"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div class="p-2">
                      <p class="text-xs font-medium text-slate-700">Decoration</p>
                    </div>
                  </div>
                </div>

                <!-- Cover Video -->
                <div v-if="event.event_template_details?.standard_cover_video" class="group cursor-pointer">
                  <div class="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                    <div class="aspect-video relative overflow-hidden bg-slate-100 flex items-center justify-center">
                      <Video class="w-8 h-8 text-slate-400" />
                    </div>
                    <div class="p-2">
                      <p class="text-xs font-medium text-slate-700">Cover Video</p>
                    </div>
                  </div>
                </div>

                <!-- Background Video -->
                <div v-if="event.event_template_details?.standard_background_video" class="group cursor-pointer">
                  <div class="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                    <div class="aspect-video relative overflow-hidden bg-slate-100 flex items-center justify-center">
                      <Video class="w-8 h-8 text-slate-400" />
                    </div>
                    <div class="p-2">
                      <p class="text-xs font-medium text-slate-700">BG Video</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fonts -->
            <div v-if="event.event_template_details?.template_fonts && event.event_template_details.template_fonts.length > 0">
              <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
                <Type class="w-5 h-5 mr-2 text-purple-600" />
                Typography
              </h4>
              <div class="space-y-2">
                <div 
                  v-for="fontItem in event.event_template_details?.template_fonts || []" 
                  :key="fontItem.id"
                  class="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                >
                  <div>
                    <p class="font-medium text-slate-900">{{ fontItem.font.name }}</p>
                    <p class="text-xs text-slate-600">{{ fontItem.language_display }}</p>
                  </div>
                  <span class="text-xs font-mono text-slate-500">{{ fontItem.language.toUpperCase() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Selected But Not Enabled (Preview Mode) - Show local template details -->
    <div v-else-if="event.event_template && !event.event_template_enabled && selectedTemplateDetails" class="space-y-6">
      <!-- Template Preview Card -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
        <div class="relative">
          <!-- Preview Image -->
          <div v-if="selectedTemplateDetails.preview_image" class="relative h-64 overflow-hidden">
            <img 
              :src="selectedTemplateDetails.preview_image" 
              :alt="selectedTemplateDetails.name"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div class="absolute bottom-4 left-6 right-6">
              <h3 class="text-2xl font-bold text-white mb-2">{{ selectedTemplateDetails.name }}</h3>
              <div class="flex items-center space-x-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                  <Package class="w-4 h-4 mr-1" />
                  {{ selectedTemplateDetails.package_plan.name }}
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                  <DollarSign class="w-4 h-4 mr-1" />
                  ${{ selectedTemplateDetails.package_plan.price }}
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                  Preview Mode
                </span>
              </div>
            </div>
          </div>

          <!-- Template Details -->
          <div class="p-6 space-y-6">
            <!-- Package Features -->
            <div>
              <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
                <Sparkles class="w-5 h-5 mr-2 text-purple-600" />
                Package Features
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div 
                  v-for="(feature, index) in selectedTemplateDetails.package_plan.features" 
                  :key="index"
                  class="flex items-center text-sm text-slate-700"
                >
                  <CheckCircle class="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                  {{ feature }}
                </div>
              </div>
            </div>

            <!-- Color Palette -->
            <div v-if="selectedTemplateDetails.template_colors.length > 0">
              <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
                <Palette class="w-5 h-5 mr-2 text-purple-600" />
                Color Palette
              </h4>
              <div class="flex flex-wrap gap-3">
                <div 
                  v-for="color in selectedTemplateDetails.template_colors" 
                  :key="color.id"
                  class="group cursor-pointer"
                >
                  <div class="flex items-center space-x-2 bg-white rounded-lg border border-slate-200 p-2 hover:shadow-md transition-all">
                    <div 
                      class="w-10 h-10 rounded-lg shadow-inner"
                      :style="{ backgroundColor: color.hex_color_code }"
                    ></div>
                    <div class="text-xs">
                      <p class="font-medium text-slate-700">{{ color.name }}</p>
                      <p class="text-slate-500">{{ color.hex_color_code }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Change Template Button -->
            <div v-if="canEdit" class="flex justify-center pt-4">
              <button
                @click="showTemplateSelector = true"
                class="bg-white/80 backdrop-blur-sm border border-slate-300 text-slate-700 hover:bg-white hover:text-slate-900 font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-sm flex items-center"
              >
                <Shuffle class="w-4 h-4 mr-2" />
                Change Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Simple Template Selected (Fallback for missing details) - Template ID only -->
    <div v-else-if="event.event_template && !event.event_template_enabled && !selectedTemplateDetails" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center">
      <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Palette class="w-10 h-10 text-blue-600" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 mb-2">Template Selected</h3>
      <p class="text-slate-600 mb-6 max-w-md mx-auto">
        You have selected template ID {{ event.event_template }}. You can change your selection or proceed with payment when ready.
      </p>
      <div class="flex justify-center space-x-4">
        <button
          v-if="canEdit"
          @click="showTemplateSelector = true"
          class="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-xl transition-all duration-200"
        >
          Change Template
        </button>
      </div>
    </div>

    <!-- No Template Selected -->
    <div v-else-if="!event.event_template && !showTemplateSelector" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center">
      <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Palette class="w-10 h-10 text-slate-400" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 mb-2">No Template Selected</h3>
      <p class="text-slate-600 mb-4 max-w-md mx-auto">
        Select a professional template to give your event a stunning visual appearance and enhanced functionality.
      </p>
      <div v-if="event.category" class="flex items-center justify-center space-x-2 mb-6">
        <div 
          class="w-4 h-4 rounded-full"
          :style="{ backgroundColor: event.category_color || '#6b7280' }"
        ></div>
        <span class="text-sm font-medium text-slate-700">
          We'll show templates that match your <strong>{{ event.category_name }}</strong> category
        </span>
      </div>
      <button
        v-if="canEdit"
        @click="showTemplateSelector = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30"
      >
        Browse Templates
      </button>
    </div>

    <!-- Template Selector Modal -->
    <div v-if="showTemplateSelector" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b">
          <div>
            <h3 class="text-2xl font-bold text-slate-900">Choose a Template</h3>
            <div class="flex items-center space-x-2 mt-1">
              <p class="text-sm text-slate-600">Select a professional template for your event</p>
              <div v-if="event.category" class="flex items-center space-x-2">
                <div 
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: event.category_color || '#6b7280' }"
                ></div>
                <span class="text-xs font-medium text-slate-700">{{ event.category_name }}</span>
              </div>
            </div>
          </div>
          <button
            @click="closeTemplateSelector"
            class="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Filter Controls -->
        <div v-if="event.category && allTemplates.length > 0" class="px-6 py-3 bg-slate-50 border-b">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <div 
                  class="w-4 h-4 rounded-full"
                  :style="{ backgroundColor: event.category_color || '#6b7280' }"
                ></div>
                <span class="text-sm font-medium">
                  {{ showingFilteredTemplates ? `${event.category_name} Templates` : 'All Templates' }}
                </span>
                <span class="text-xs text-slate-500">
                  ({{ availableTemplates.length }} available)
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="showCategoryTemplates"
                :class="showingFilteredTemplates 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'"
                class="px-3 py-1 rounded-lg text-sm font-medium transition-colors border"
              >
                {{ event.category_name }} Only
              </button>
              <button
                @click="showAllTemplates"
                :class="!showingFilteredTemplates 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'"
                class="px-3 py-1 rounded-lg text-sm font-medium transition-colors border"
              >
                All Templates
              </button>
            </div>
          </div>
        </div>

        <!-- Template Grid -->
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="loadingTemplates" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="availableTemplates.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="template in availableTemplates"
              :key="template.id"
              class="group cursor-pointer"
              @click="selectTemplate(template)"
            >
              <div class="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-blue-500 hover:shadow-xl transition-all duration-300"
                   :class="{ 'border-blue-500 ring-2 ring-blue-200': selectedTemplate?.id === template.id }">
                <!-- Preview Image -->
                <div class="aspect-video relative overflow-hidden bg-slate-100">
                  <img 
                    v-if="template.preview_image"
                    :src="template.preview_image" 
                    :alt="template.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Image class="w-12 h-12 text-slate-300" />
                  </div>
                  <!-- Category Badge -->
                  <div v-if="template.package_plan.category" class="absolute top-3 left-3">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg"
                          :style="{ backgroundColor: template.package_plan.category.color }">
                      {{ template.package_plan.category.name }}
                    </span>
                  </div>
                  <!-- Price Badge -->
                  <div class="absolute top-3 right-3">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-white/90 backdrop-blur-sm text-slate-900 shadow-lg">
                      ${{ template.package_plan.price }}
                    </span>
                  </div>
                </div>

                <!-- Template Info -->
                <div class="p-4">
                  <h4 class="font-semibold text-slate-900 mb-1">{{ template.name }}</h4>
                  <p class="text-sm text-slate-600 mb-3">{{ template.package_plan.name }}</p>
                  
                  <!-- Color Preview -->
                  <div v-if="template.template_colors.length > 0" class="flex items-center space-x-1 mb-3">
                    <div 
                      v-for="(color, idx) in template.template_colors.slice(0, 5)" 
                      :key="idx"
                      class="w-6 h-6 rounded-full shadow-inner"
                      :style="{ backgroundColor: color.hex_color_code }"
                      :title="color.name"
                    ></div>
                    <span v-if="template.template_colors.length > 5" class="text-xs text-slate-500">
                      +{{ template.template_colors.length - 5 }}
                    </span>
                  </div>

                  <!-- Features Preview -->
                  <div class="space-y-1">
                    <div 
                      v-for="(feature, idx) in template.package_plan.features.slice(0, 2)" 
                      :key="idx"
                      class="flex items-center text-xs text-slate-600"
                    >
                      <CheckCircle class="w-3 h-3 mr-1 text-green-600 flex-shrink-0" />
                      {{ feature }}
                    </div>
                    <p v-if="template.package_plan.features.length > 2" class="text-xs text-blue-600">
                      +{{ template.package_plan.features.length - 2 }} more features
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12">
            <p class="text-slate-600">No templates available at the moment.</p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between p-6 border-t bg-slate-50">
          <button
            @click="closeTemplateSelector"
            class="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="confirmTemplateSelection"
            :disabled="!selectedTemplate || isSelecting"
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <div v-if="isSelecting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {{ isSelecting ? 'Selecting...' : 'Select Template' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentModalDialog && paymentData" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div>
            <h3 class="text-xl font-bold">Complete Template Purchase</h3>
            <p class="text-sm opacity-90 mt-1">Secure payment processing</p>
          </div>
          <button
            @click="closePaymentModal"
            class="text-white/80 hover:text-white transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-6">
          <!-- Template Summary -->
          <div class="text-center">
            <h4 class="text-lg font-semibold text-slate-900">{{ (paymentData as any)?.pricing_info?.plan_name || 'Template Plan' }}</h4>
            <div class="text-3xl font-bold text-green-600 mt-2">
              ${{ (paymentData as any)?.pricing_info?.price || '0.00' }}
            </div>
            <p class="text-sm text-slate-600 mt-1">{{ (paymentData as any)?.pricing_info?.category || 'General' }} Template</p>
          </div>

          <!-- Features -->
          <div>
            <h5 class="font-semibold text-slate-900 mb-3">Included Features:</h5>
            <div class="space-y-2">
              <div 
                v-for="(feature, index) in (paymentData as any)?.pricing_info?.features || []" 
                :key="index"
                class="flex items-center text-sm text-slate-700"
              >
                <CheckCircle class="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                {{ feature }}
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle class="w-4 h-4 text-blue-600" />
              </div>
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">Payment & Activation Process</p>
                <p>After payment, your template will be reviewed and enabled within 24 hours. You'll receive an email confirmation once it's active.</p>
              </div>
            </div>
          </div>

          <!-- Commission Info -->
          <div v-if="(paymentData as any)?.pricing_info?.commission" class="text-xs text-slate-500 text-center">
            Platform fee: ${{ (paymentData as any)?.pricing_info?.commission }}
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="flex items-center gap-3 p-6 border-t bg-slate-50">
          <button
            @click="closePaymentModal"
            class="flex-1 px-4 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handlePayment"
            class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-green-500/25 hover:shadow-green-600/30"
          >
            Pay ${{ (paymentData as any)?.pricing_info?.price || '0.00' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Payment Section - Shows when template is selected but not paid -->
    <div v-if="event.event_template && !event.event_template_enabled && canEdit" class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <DollarSign class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Ready to Activate Your Template?</h3>
            <p class="text-sm text-slate-600">
              Complete payment to unlock all features and activate your template.
              <span v-if="selectedTemplateDetails">
                Price: <span class="font-semibold text-green-600">${{ selectedTemplateDetails.package_plan.price }}</span>
              </span>
            </p>
          </div>
        </div>
        <button
          @click="initiatePayment"
          class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-green-500/25 hover:shadow-green-600/30 flex items-center"
        >
          <DollarSign class="w-4 h-4 mr-2" />
          Pay Now
        </button>
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
import { ref, onMounted } from 'vue'
import {
  Palette,
  Package,
  DollarSign,
  Sparkles,
  CheckCircle,
  Image,
  Video,
  Type,
  X,
  Shuffle,
  AlertCircle
} from 'lucide-vue-next'
import { 
  type Event, 
  type EventTemplate, 
  eventTemplateService,
  eventsService 
} from '../services/api'

interface Props {
  event: Event
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'template-updated': [template: EventTemplate]
}>()

// State
const showTemplateSelector = ref(false)
const loadingTemplates = ref(false)
const availableTemplates = ref<EventTemplate[]>([])
const allTemplates = ref<EventTemplate[]>([])
const selectedTemplate = ref<EventTemplate | null>(null)
const selectedTemplateDetails = ref<EventTemplate | null>(null)
const isSelecting = ref(false)
const showPaymentModalDialog = ref(false)
const paymentData = ref<unknown>(null)
const showingFilteredTemplates = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Methods
const loadAvailableTemplates = async () => {
  loadingTemplates.value = true
  try {
    const response = await eventTemplateService.browseTemplates()
    
    if (response.success && response.data) {
      const allTemplatesData = response.data.templates || []
      allTemplates.value = allTemplatesData
      
      // Filter templates by event category if the event has a category
      if (props.event.category && allTemplatesData.length > 0) {
        const categoryFilteredTemplates = allTemplatesData.filter(template => 
          template.package_plan?.category?.id === props.event.category ||
          template.package_plan?.category?.name === props.event.category_name
        )
        
        // If we have category-matching templates, use them
        if (categoryFilteredTemplates.length > 0) {
          availableTemplates.value = categoryFilteredTemplates
          showingFilteredTemplates.value = true
          console.log(`Filtered ${categoryFilteredTemplates.length} templates for category: ${props.event.category_name}`)
        } else {
          // If no exact category match, show all templates but log the filtering attempt
          availableTemplates.value = allTemplatesData
          showingFilteredTemplates.value = false
          console.log(`No templates found for category: ${props.event.category_name}, showing all templates`)
        }
      } else {
        // No category or no templates, show all
        availableTemplates.value = allTemplatesData
        showingFilteredTemplates.value = false
      }
      
      if (availableTemplates.value.length === 0) {
        showMessage('error', 'No templates available')
      }
    } else {
      console.error('Failed to load templates:', response)
      if (response.message?.includes('Authentication')) {
        showMessage('error', 'Please log in to browse templates')
      } else {
        showMessage('error', response.message || 'Failed to load templates')
      }
    }
  } catch (error) {
    console.error('Error loading templates:', error)
    if (error.message?.includes('401') || error.message?.includes('Authentication')) {
      showMessage('error', 'Please log in to browse templates')
    } else {
      showMessage('error', 'An error occurred while loading templates')
    }
  } finally {
    loadingTemplates.value = false
  }
}

const selectTemplate = (template: EventTemplate) => {
  selectedTemplate.value = template
}

const confirmTemplateSelection = async () => {
  if (!selectedTemplate.value) return

  isSelecting.value = true
  try {
    // Just select the template without payment - store template details for preview
    const response = await eventsService.patchEvent(props.event.id, {
      event_template: selectedTemplate.value.id,
      event_template_enabled: false // Keep disabled until payment
    })
    
    if (response.success) {
      // Store template details for preview
      selectedTemplateDetails.value = selectedTemplate.value
      
      showMessage('success', 'Template selected! You can now proceed with payment when ready.')
      
      // Emit template updated event to parent
      emit('template-updated', selectedTemplate.value)
      closeTemplateSelector()
      
      // Force reactivity update by ensuring the component re-renders
      // The parent should update the event object, which will trigger reactivity
    } else {
      throw new Error(response.message || 'Failed to select template')
    }
  } catch (error: any) {
    console.error('Error selecting template:', error)
    showMessage('error', 'An error occurred while selecting the template')
  } finally {
    isSelecting.value = false
  }
}

const closeTemplateSelector = () => {
  showTemplateSelector.value = false
  selectedTemplate.value = null
}

const initiatePayment = () => {
  if (selectedTemplateDetails.value) {
    showPaymentModal({
      template: selectedTemplateDetails.value,
      pricing_info: {
        plan_name: selectedTemplateDetails.value.package_plan.name,
        price: selectedTemplateDetails.value.package_plan.price,
        commission: selectedTemplateDetails.value.package_plan.commission,
        features: selectedTemplateDetails.value.package_plan.features,
        category: selectedTemplateDetails.value.package_plan.category?.name || 'General'
      }
    })
  } else {
    // If we don't have template details, we can still try to show payment modal with basic info
    showMessage('error', 'Template details not available. Please reselect your template.')
  }
}

const showAllTemplates = () => {
  availableTemplates.value = allTemplates.value
  showingFilteredTemplates.value = false
}

const showCategoryTemplates = () => {
  if (props.event.category && allTemplates.value.length > 0) {
    const categoryFilteredTemplates = allTemplates.value.filter(template => 
      template.package_plan?.category?.id === props.event.category ||
      template.package_plan?.category?.name === props.event.category_name
    )
    
    if (categoryFilteredTemplates.length > 0) {
      availableTemplates.value = categoryFilteredTemplates
      showingFilteredTemplates.value = true
    }
  }
}

const showPaymentModal = (templateData: unknown) => {
  paymentData.value = templateData
  showPaymentModalDialog.value = true
}

const closePaymentModal = () => {
  showPaymentModalDialog.value = false
  paymentData.value = null as unknown
}

const handlePayment = async () => {
  if (!paymentData.value) return
  
  const data = paymentData.value as any
  
  // In a real implementation, this would integrate with a payment processor
  // For now, we'll just show a message that payment is required
  showMessage('success', 'Template selected! Payment processing would be handled by your payment system.')
  
  // Emit template updated event
  emit('template-updated', data.template)
  closePaymentModal()
  
  // In production, this would redirect to payment processor or open payment modal
  console.log('Payment would be processed for:', data.pricing_info)
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Load template details if template is selected but not enabled (for preview)
const loadSelectedTemplateDetails = async () => {
  console.log('loadSelectedTemplateDetails called', {
    event_template: props.event.event_template,
    event_template_enabled: props.event.event_template_enabled,
    hasSelectedTemplateDetails: !!selectedTemplateDetails.value,
    hasBackendDetails: !!props.event.event_template_details
  })
  
  // Only load details if we have a template selected but not enabled (preview mode)
  if (props.event.event_template && !props.event.event_template_enabled && !selectedTemplateDetails.value) {
    try {
      console.log('Loading template details for preview mode...')
      
      // Try multiple API approaches to get template details
      let template = null
      
      // Approach 1: Try browse_templates first (has full template info including pricing)
      try {
        console.log('Trying browse_templates API...')
        const browseResponse = await eventTemplateService.browseTemplates()
        if (browseResponse.success && browseResponse.data?.templates) {
          template = browseResponse.data.templates.find(t => t.id === props.event.event_template)
          if (template) {
            console.log('Found template in browse_templates:', template.name)
          }
        }
      } catch (browseError) {
        console.log('browse_templates failed:', browseError)
      }
      
      // Approach 2: If browse_templates didn't work, try public_template_assets (no auth required)
      if (!template) {
        try {
          console.log('Trying public_template_assets API...')
          const publicResponse = await eventTemplateService.getPublicTemplateAssets(props.event.event_template)
          if (publicResponse.success && publicResponse.data?.template_data) {
            // Convert public template data format to match our EventTemplate interface
            const publicData = publicResponse.data.template_data
            template = {
              id: publicData.id,
              name: publicData.name,
              preview_image: '', // Not available in public API
              template_colors: publicData.colors || [],
              template_fonts: publicData.fonts || [],
              basic_background_photo: publicData.assets?.basic_background_photo,
              basic_decoration_photo: publicData.assets?.basic_decoration_photo,
              standard_cover_video: publicData.assets?.standard_cover_video,
              standard_background_video: publicData.assets?.standard_background_video,
              open_envelope_button: publicData.assets?.open_envelope_button,
              package_plan: {
                id: 0,
                name: 'Selected Template',
                price: '0.00',
                features: ['Template styling', 'Custom colors', 'Custom fonts'],
                commission: '0.00',
                category: null
              }
            }
            console.log('Found template in public_template_assets:', template.name)
          }
        } catch (publicError) {
          console.log('public_template_assets failed:', publicError)
        }
      }
      
      if (template) {
        selectedTemplateDetails.value = template
      } else {
        console.log('Template not found in any API:', props.event.event_template)
        // Show fallback with just template ID
        selectedTemplateDetails.value = null
      }
      
    } catch (error: any) {
      console.error('Error loading selected template details:', error)
    }
  } else if (props.event.event_template_enabled) {
    // Clear local preview state if template is now enabled (backend has details)
    console.log('Template is enabled, clearing local preview state')
    selectedTemplateDetails.value = null
  } else if (!props.event.event_template) {
    // Clear state if no template selected
    selectedTemplateDetails.value = null
  }
}

// Lifecycle
onMounted(() => {
  console.log('EventTemplateTab mounted with event:', {
    id: props.event.id,
    event_template: props.event.event_template,
    event_template_enabled: props.event.event_template_enabled,
    has_event_template_details: !!props.event.event_template_details
  })
  
  if (showTemplateSelector.value) {
    loadAvailableTemplates()
  }
  
  // Always try to load template details on mount
  loadSelectedTemplateDetails()
})

// Watch for template selector opening and event changes
import { watch } from 'vue'
watch(showTemplateSelector, (newVal) => {
  if (newVal) {
    loadAvailableTemplates()
  }
})

// Watch for changes in the event's template and update local state
watch(
  () => props.event.event_template,
  (newTemplateId, oldTemplateId) => {
    if (newTemplateId !== oldTemplateId) {
      // If template changed, reload template details for preview
      loadSelectedTemplateDetails()
    }
  }
)

// Watch for changes in event template enabled status
watch(
  () => props.event.event_template_enabled,
  (newEnabled) => {
    if (newEnabled) {
      // If template was enabled, clear our local preview state
      // The event should now have event_template_details from backend
      selectedTemplateDetails.value = null
    }
  }
)
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