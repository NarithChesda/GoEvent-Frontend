<template>
  <div class="min-h-screen">
    <Navigation />

    <!-- Hero Section -->
    <section
      id="hero"
      class="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 overflow-hidden -mt-20"
    >
      <!-- Optimized Background Elements -->
      <div class="absolute inset-0">
        <!-- Primary gradient overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-green-500/5 to-emerald-500/5"
        ></div>

        <!-- Reduced animated background shapes for better performance -->
        <div
          class="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-full mix-blend-multiply hero-blur-shape animate-float"
        ></div>
        <div
          class="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-green-400/15 to-emerald-400/15 rounded-full mix-blend-multiply hero-blur-shape animate-float-delayed"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/8 to-green-300/8 rounded-full mix-blend-multiply hero-blur-large"
        ></div>
      </div>

      <div
        class="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pt-20 sm:pt-28 lg:pt-32"
      >
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          <div class="lg:col-span-7 space-y-6 sm:space-y-8 animate-slide-in-left">
            <div class="space-y-4 sm:space-y-6">
              <div
                class="inline-flex items-center bg-gradient-to-r from-emerald-500/20 to-sky-500/20 backdrop-blur-sm border border-white/30 text-[#1873cc] text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full animate-fade-in animation-delay-100 shadow-lg shadow-[#87CEEB]/30"
              >
                <Sparkles class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                #1 Event Management Platform
              </div>
              <h1
                class="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold leading-tight tracking-tight text-slate-900 animate-fade-in animation-delay-500"
              >
                <span class="typing-text">
                  {{ displayText }}<span v-if="!isComplete" class="typing-cursor">|</span>
                </span>
              </h1>
              <p
                class="text-base sm:text-lg lg:text-lg xl:text-xl text-slate-700 leading-relaxed max-w-prose animate-fade-in animation-delay-1000"
              >
                Transform your event planning experience with our cutting-edge platform. From
                intimate gatherings to large-scale conferences, we make event management effortless
                and engaging.
              </p>
            </div>

            <div
              class="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-4 xl:gap-6 animate-fade-in animation-delay-1200"
            >
              <button
                @click="handleStartCreatingEvents"
                class="group bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold px-8 py-4 rounded-lg shadow-lg shadow-emerald-500/25 text-base transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:shadow-md text-center"
              >
                Start Creating Events
                <ArrowRight
                  class="inline w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform duration-300"
                />
              </button>
              <button
                @click="scrollToDemo"
                class="flex items-center justify-center bg-white text-[#1e90ff] font-semibold px-8 py-4 rounded-lg border-2 border-[#87CEEB] text-base shadow-sm transition-all duration-200 hover:bg-[#E6F4FF] hover:border-[#5eb3f6] hover:shadow-md hover:scale-[1.02] active:bg-[#B0E0E6] active:scale-[0.98] group"
              >
                <Play
                  class="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 group-hover:scale-110 transition-transform duration-300"
                />
                Watch Demo
              </button>
            </div>

            <div
              class="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 lg:gap-8 text-xs sm:text-sm animate-fade-in animation-delay-1400"
            >
              <div class="flex items-center space-x-2 text-gray-600">
                <div
                  class="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check class="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
                <span class="font-medium">Free 14-day trial</span>
              </div>
              <div class="flex items-center space-x-2 text-gray-600">
                <div
                  class="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check class="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
                <span class="font-medium">No credit card required</span>
              </div>
              <div class="flex items-center space-x-2 text-gray-600">
                <div
                  class="w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check class="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
                <span class="font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5 relative animate-slide-in-right animation-delay-200">
            <div class="relative max-w-lg lg:max-w-full mx-auto">
              <!-- Main Dashboard Card -->
              <div
                class="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#1e90ff]/20 p-4 sm:p-6 lg:p-6 xl:p-8 border border-white/50"
              >
                <div class="flex items-center justify-between mb-4 sm:mb-6 lg:mb-6 xl:mb-8">
                  <h3 class="text-lg sm:text-xl lg:text-xl xl:text-2xl font-bold text-gray-900">
                    Event Dashboard
                  </h3>
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"
                    ></div>
                    <span class="text-xs sm:text-sm text-gray-600 font-medium">Live</span>
                  </div>
                </div>

                <div
                  class="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-4 xl:gap-6 mb-4 sm:mb-6 lg:mb-6 xl:mb-8"
                >
                  <div
                    class="bg-gradient-to-br from-[#E6F4FF] to-[#B0E0E6] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-4 xl:p-6 border border-[#87CEEB]/50"
                  >
                    <div
                      class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-[#1e90ff] mb-1 sm:mb-2"
                    >
                      1,247
                    </div>
                    <div class="text-xs sm:text-sm text-[#1873cc] font-medium">Total Attendees</div>
                    <div class="text-xs text-green-600 font-medium mt-1">↗ +23% this week</div>
                  </div>
                  <div
                    class="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-4 xl:p-6 border border-emerald-200/50"
                  >
                    <div
                      class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-emerald-600 mb-1 sm:mb-2"
                    >
                      98.5%
                    </div>
                    <div class="text-xs sm:text-sm text-emerald-700 font-medium">Satisfaction</div>
                    <div class="text-xs text-green-600 font-medium mt-1">↗ +5.2% this month</div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">Event Progress</span>
                    <span class="text-sm font-bold text-gray-900">87%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div
                      class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] h-3 rounded-full transition-all duration-1000"
                      style="width: 87%"
                    ></div>
                  </div>

                  <div class="flex justify-between items-center pt-4">
                    <span class="text-xs text-gray-500">Next milestone in 3 days</span>
                    <div class="flex space-x-1">
                      <div class="w-2 h-2 bg-[#4fa3d9] rounded-full"></div>
                      <div class="w-2 h-2 bg-[#5eb3f6] rounded-full"></div>
                      <div class="w-2 h-2 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Floating Cards -->
              <div
                class="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-white rounded-xl sm:rounded-2xl shadow-lg shadow-purple-100/50 p-3 sm:p-4 border border-purple-100/50 transform rotate-3 hover:rotate-6 transition-transform duration-300 hidden xl:block"
              >
                <div class="flex items-center space-x-2">
                  <div
                    class="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center"
                  >
                    <Bell class="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <div>
                    <div class="text-xs font-medium text-gray-900">New RSVP</div>
                    <div class="text-xs text-gray-500">Sarah joined your event</div>
                  </div>
                </div>
              </div>

              <div
                class="absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 bg-white rounded-xl sm:rounded-2xl shadow-lg shadow-orange-100/50 p-3 sm:p-4 border border-orange-100/50 transform -rotate-3 hover:-rotate-6 transition-transform duration-300 hidden xl:block"
              >
                <div class="flex items-center space-x-2">
                  <div
                    class="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center"
                  >
                    <Calendar class="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                  </div>
                  <div>
                    <div class="text-xs font-medium text-gray-900">Event Starting</div>
                    <div class="text-xs text-gray-500">In 2 hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div class="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div class="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section
      id="features"
      ref="featuresSection"
      class="py-16 scroll-animate features-bg"
      :class="{ 'animate-fade-in-up': isVisible.features }"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4"
          >
            <Star class="w-4 h-4" />
            Features That Matter
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-slate-900 mb-4 leading-tight tracking-tight"
          >
            Everything You Need to
            <span
              class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] bg-clip-text text-transparent"
            >
              Succeed</span
            >
          </h2>
          <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Powerful features designed to make event planning effortless, engaging, and memorable
            for both organizers and attendees.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          <div
            v-for="(feature, index) in features"
            :key="feature.title"
            class="group relative bg-white rounded-xl border border-slate-200 p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2"
            :class="index === 1 ? 'md:scale-105 md:z-10 border-[#B0E0E6]' : ''"
          >
            <!-- Top accent bar -->
            <div
              class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-t-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
            ></div>

            <div class="relative">
              <!-- Icon with design guide styling -->
              <div class="relative mb-6">
                <div
                  class="w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  :class="feature.bgColor"
                >
                  <component
                    :is="feature.icon"
                    class="w-8 h-8 transition-all duration-300"
                    :class="feature.iconColor"
                  />
                </div>
                <!-- Floating accent -->
                <div
                  class="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100"
                ></div>
              </div>

              <!-- Content with design guide typography -->
              <div class="space-y-4">
                <h3
                  class="text-xl font-bold text-slate-900 leading-snug group-hover:bg-gradient-to-r group-hover:from-[#2ecc71] group-hover:to-[#1e90ff] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
                >
                  {{ feature.title }}
                </h3>
                <p class="text-base text-slate-700 leading-relaxed">
                  {{ feature.description }}
                </p>
              </div>
            </div>

            <!-- Hover effect background -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-sky-50/0 group-hover:from-emerald-50/30 group-hover:to-sky-50/30 rounded-xl transition-all duration-300 -z-10"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section
      id="testimonials"
      ref="testimonialsSection"
      class="py-16 relative overflow-hidden scroll-animate"
      :class="{ 'animate-fade-in-up': isVisible.testimonials }"
    >
      <!-- Background gradient -->
      <div class="absolute inset-0 testimonials-bg"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="text-center mb-16">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4"
          >
            <MessageCircle class="h-4 w-4" />
            Client Success Stories
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-slate-900 mb-4 leading-tight tracking-tight"
          >
            Loved by
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
              >10,000+</span
            >
            organizers
          </h2>
          <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            From intimate gatherings to large-scale conferences, see how GoEvent transforms event
            planning
          </p>
        </div>

        <!-- Testimonials Grid -->
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
          <div
            v-for="(testimonial, index) in testimonials"
            :key="testimonial.name"
            class="group relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
            :class="index === 1 ? 'md:scale-105 md:z-10' : ''"
          >
            <!-- Quote icon -->
            <div
              class="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-full flex items-center justify-center text-white text-sm sm:text-lg font-bold"
            >
              "
            </div>

            <!-- Rating stars -->
            <div class="flex text-yellow-400 mb-4 sm:mb-6">
              <Star v-for="i in 5" :key="i" class="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            </div>

            <!-- Testimonial content -->
            <blockquote
              class="text-slate-700 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 sm:mb-8 font-medium"
            >
              "{{ testimonial.content }}"
            </blockquote>

            <!-- Author info -->
            <div class="flex items-center">
              <div
                class="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 group-hover:scale-110 transition-transform duration-300"
              >
                <span class="text-[#1e90ff] font-bold text-sm sm:text-base lg:text-lg">{{
                  testimonial.name.charAt(0)
                }}</span>
              </div>
              <div>
                <h4 class="font-bold text-slate-900 text-sm sm:text-base lg:text-lg">
                  {{ testimonial.name }}
                </h4>
                <p class="text-[#1e90ff] font-medium text-xs sm:text-sm lg:text-base">
                  {{ testimonial.role }}
                </p>
              </div>
            </div>

            <!-- Hover effect background -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-sky-50/50 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
            ></div>
          </div>
        </div>

        <!-- Trust indicators -->
        <div class="text-center">
          <div
            class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-8 bg-white/60 backdrop-blur-sm rounded-2xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border border-white/20"
          >
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-slate-700 font-medium text-sm sm:text-base">99.9% Uptime</span>
            </div>
            <div class="hidden sm:block w-px h-6 bg-slate-300"></div>
            <div class="flex items-center space-x-2">
              <Shield class="h-4 w-4 sm:h-5 sm:w-5 text-[#1e90ff]" />
              <span class="text-slate-700 font-medium text-sm sm:text-base"
                >Enterprise Security</span
              >
            </div>
            <div class="hidden sm:block w-px h-6 bg-slate-300"></div>
            <div class="flex items-center space-x-2">
              <Award class="h-4 w-4 sm:h-5 sm:w-5 text-[#1e90ff]" />
              <span class="text-slate-700 font-medium text-sm sm:text-base">Award Winning</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section
      id="faq"
      ref="faqSection"
      class="py-16 scroll-animate faq-bg"
      :class="{ 'animate-fade-in-up': isVisible.faq }"
    >
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header Section -->
        <div class="text-center mb-16">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4"
          >
            <HelpCircle class="h-4 w-4" />
            Frequently Asked Questions
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-slate-900 mb-4 leading-tight tracking-tight"
          >
            Got Questions? We've Got
            <span
              class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
            >
              Answers</span
            >
          </h2>
          <p class="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Everything you need to know about GoEvent and how it can transform your event planning
            experience.
          </p>
        </div>

        <!-- FAQ Items - Redesigned with Better Spacing and Typography -->
        <div class="space-y-6">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="group bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg hover:border-[#87CEEB]/50 transition-all duration-300 overflow-hidden"
          >
            <button
              @click="toggleFaq(index)"
              class="w-full px-8 py-6 text-left flex items-start justify-between font-medium text-slate-900 hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-sky-50/30 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2 group"
            >
              <div class="flex-1 pr-6">
                <h3
                  class="text-xl font-bold text-slate-900 leading-tight tracking-tight group-hover:bg-gradient-to-r group-hover:from-[#2ecc71] group-hover:to-[#1e90ff] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
                >
                  {{ faq.question }}
                </h3>
              </div>
              <div class="flex-shrink-0 ml-4">
                <div
                  class="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-gradient-to-br group-hover:from-emerald-100 group-hover:to-sky-100 flex items-center justify-center transition-all duration-300"
                >
                  <ChevronDown
                    class="w-5 h-5 text-slate-500 group-hover:text-[#1e90ff] transition-all duration-300"
                    :class="{ 'rotate-180': openFaq === index }"
                  />
                </div>
              </div>
            </button>
            <Transition
              enter-active-class="transition-all duration-400 ease-out"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-[500px] opacity-100"
              leave-active-class="transition-all duration-300 ease-in"
              leave-from-class="max-h-[500px] opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-show="openFaq === index" class="overflow-hidden">
                <div class="px-8 pb-8 pt-2">
                  <!-- Visual separator -->
                  <div
                    class="w-16 h-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full mb-6"
                  ></div>
                  <!-- Answer content with better typography -->
                  <div class="prose prose-slate max-w-none">
                    <p class="text-lg text-slate-700 leading-relaxed font-medium">
                      {{ faq.answer }}
                    </p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <PricingSection
      ref="pricingSection"
      class="scroll-animate pricing-bg"
      :class="{ 'animate-fade-in-up': isVisible.pricing }"
    />

    <!-- CTA Section -->
    <section class="py-16 bg-white relative overflow-hidden">
      <!-- Background decoration -->
      <div class="absolute inset-0">
        <!-- Subtle gradient orbs -->
        <div
          class="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-emerald-100/40 to-sky-100/30 rounded-full blur-3xl"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-sky-100/35 to-emerald-100/25 rounded-full blur-3xl"
        ></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <!-- Floating Box Container -->
        <div
          class="bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-3xl p-8 lg:p-10 xl:p-12 shadow-2xl shadow-[#1e90ff]/20 backdrop-blur-sm border border-white/10"
        >
          <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
            <!-- Left side - Content -->
            <div class="text-left">
              <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-6"
              >
                <Sparkles class="w-4 h-4" />
                Start Your Journey Today
              </div>

              <h2
                class="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight tracking-tight"
              >
                Ready to Transform Your
                <span
                  class="text-white bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400"

                >
                  Event Management?</span
                >
              </h2>

              <p class="text-lg text-white mb-6 leading-relaxed">
                Join thousands of event organizers who trust GoEvent to deliver exceptional
                experiences. Start your free trial today and see the difference.
              </p>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-4 lg:gap-6 mb-8">
                <div class="text-center lg:text-left">
                  <div
                    class="text-lg sm:text-xl lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-white mb-1"
                  >
                    10K+
                  </div>
                  <div class="text-xs sm:text-sm text-white">Events Created</div>
                </div>
                <div class="text-center lg:text-left">
                  <div
                    class="text-lg sm:text-xl lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-white mb-1"
                  >
                    99.9%
                  </div>
                  <div class="text-xs sm:text-sm text-white">Uptime</div>
                </div>
                <div class="text-center lg:text-left">
                  <div
                    class="text-lg sm:text-xl lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-white mb-1"
                  >
                    24/7
                  </div>
                  <div class="text-xs sm:text-sm text-white">Support</div>
                </div>
              </div>

              <!-- Buttons -->
              <div class="flex flex-col sm:flex-row gap-4">
                <RouterLink
                  to="/signup"
                  class="group bg-white hover:bg-[#E6F4FF] text-[#1e90ff] hover:text-[#1873cc] font-semibold px-8 py-4 rounded-lg text-base transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-black/10 flex items-center justify-center"
                >
                  Start Your Free Trial
                  <ArrowRight
                    class="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform duration-300"
                  />
                </RouterLink>
                <RouterLink
                  to="/contact"
                  class="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 font-semibold px-8 py-4 rounded-lg text-base transition-all duration-200 hover:scale-[1.02] flex items-center justify-center"
                >
                  Talk to Sales
                </RouterLink>
              </div>
            </div>

            <!-- Right side - Visual Element -->
            <div class="relative lg:pl-8">
              <div class="relative">
                <!-- Main feature card -->
                <div
                  class="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-6 xl:p-8 shadow-2xl border border-white/50 transform hover:scale-105 transition-all duration-500"
                >
                  <div class="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 class="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                      GoEvent Dashboard
                    </h3>
                    <div class="flex items-center space-x-2">
                      <div
                        class="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"
                      ></div>
                      <span class="text-xs sm:text-sm text-slate-600 font-medium">Live</span>
                    </div>
                  </div>

                  <!-- Mock analytics -->
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-slate-600">Active Events</span>
                      <span class="font-bold text-slate-900">47</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-slate-600">Total Attendees</span>
                      <span class="font-bold text-slate-900">2,847</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-slate-600">Success Rate</span>
                      <span class="font-bold text-green-600">98.5%</span>
                    </div>

                    <!-- Progress bar -->
                    <div class="mt-6">
                      <div class="flex justify-between text-sm mb-2">
                        <span class="text-slate-600">Monthly Goal</span>
                        <span class="text-slate-900 font-medium">87%</span>
                      </div>
                      <div class="w-full bg-slate-200 rounded-full h-3">
                        <div
                          class="bg-gradient-to-r from-[#1e90ff] to-cyan-400 h-3 rounded-full transition-all duration-1000"
                          style="width: 87%"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Floating elements -->
                <div
                  class="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-gradient-to-br from-[#1e90ff] to-cyan-400 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300 hidden xl:block"
                >
                  <Star class="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>

                <div
                  class="absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 bg-gradient-to-br from-emerald-500 to-sky-400 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg transform -rotate-3 hover:-rotate-6 transition-transform duration-300 hidden xl:block"
                >
                  <Bell class="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Footer />

    <!-- Scroll to Top Button -->
    <Transition name="fade">
      <button
        v-show="showScrollTop"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white p-4 rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2"
      >
        <ArrowUp class="w-6 h-6" />
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Navigation from '../components/Navigation.vue'
import Footer from '../components/Footer.vue'
import PricingSection from '../components/PricingSection.vue'
import { useScrollAnimations, useScrollToTop } from '../composables/useScrollAnimations'
import { useTypingAnimation } from '../composables/useTypingAnimation'
import {
  Calendar,
  Users,
  BarChart3,
  MessageSquare,
  MapPin,
  Camera,
  Bell,
  Check,
  Star,
  Sparkles,
  ArrowRight,
  Play,
  MessageCircle,
  Shield,
  Award,
  ArrowUp,
  HelpCircle,
  ChevronDown,
} from 'lucide-vue-next'

// Scroll animations
const { isVisible, observeElement } = useScrollAnimations()
const { showScrollTop, scrollToTop } = useScrollToTop()

// Router and auth
const router = useRouter()
import { useAuthStore } from '../stores/auth'
const authStore = useAuthStore()

// Typing animation for hero text
const { displayText, isComplete } = useTypingAnimation('Create Unforgettable Events', 30)

// Refs for sections
const featuresSection = ref<HTMLElement>()
const testimonialsSection = ref<HTMLElement>()
const pricingSection = ref<HTMLElement>()
const faqSection = ref<HTMLElement>()

// FAQ functionality
const openFaq = ref<number | null>(null)

const toggleFaq = (index: number) => {
  openFaq.value = openFaq.value === index ? null : index
}

const scrollToDemo = () => {
  const features = document.getElementById('features')
  if (features) {
    features.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleStartCreatingEvents = () => {
  if (authStore.isAuthenticated) {
    router.push('/events')
  } else {
    router.push('/signin?redirect=/events')
  }
}

onMounted(() => {
  // Observe sections for scroll animations
  if (featuresSection.value) {
    observeElement(featuresSection.value, 'features')
  }
  if (testimonialsSection.value) {
    observeElement(testimonialsSection.value, 'testimonials')
  }
  if (pricingSection.value) {
    observeElement(pricingSection.value, 'pricing')
  }
  if (faqSection.value) {
    observeElement(faqSection.value, 'faq')
  }
})

// Computed properties for static data to optimize memory usage
const features = computed(() => [
  {
    icon: Calendar,
    title: 'Smart Event Planning',
    description:
      'Create and manage events with our intuitive planning tools. Set dates, venues, and track progress effortlessly with AI-powered suggestions.',
    bgColor: 'bg-gradient-to-br from-[#B0E0E6] to-[#87CEEB]',
    iconColor: 'text-[#1e90ff]',
  },
  {
    icon: Users,
    title: 'Advanced Guest Management',
    description:
      'Manage attendee lists, send personalized invitations, and track RSVPs with automated follow-ups and custom registration forms.',
    bgColor: 'bg-gradient-to-br from-[#B0E0E6] to-[#87CEEB]',
    iconColor: 'text-[#1e90ff]',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description:
      'Get detailed insights into event performance, attendance rates, and engagement metrics with beautiful interactive dashboards.',
    bgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
    iconColor: 'text-emerald-600',
  },
  {
    icon: MessageSquare,
    title: 'Communication Hub',
    description:
      'Keep attendees engaged with automated emails, push notifications, announcements, and real-time chat features.',
    bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200',
    iconColor: 'text-orange-600',
  },
  {
    icon: MapPin,
    title: 'Venue & Location',
    description:
      'Seamlessly integrate with venue booking systems, display interactive maps, and provide detailed location information.',
    bgColor: 'bg-gradient-to-br from-red-100 to-red-200',
    iconColor: 'text-red-600',
  },
  {
    icon: Camera,
    title: 'Media & Content',
    description:
      'Upload and share event photos, videos, documents, and create stunning event galleries with automatic organization.',
    bgColor: 'bg-gradient-to-br from-teal-100 to-teal-200',
    iconColor: 'text-teal-600',
  },
])

const testimonials = computed(() => [
  {
    name: 'Sarah Johnson',
    role: 'Corporate Event Manager',
    content:
      'GoEvent transformed how we manage our company conferences. The analytics feature helped us increase attendance by 40%.',
  },
  {
    name: 'Michael Chen',
    role: 'Wedding Planner',
    content:
      'The guest management system is incredible. My clients love how easy it is to track RSVPs and communicate with guests.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Non-profit Director',
    content:
      "We've organized 50+ charity events using GoEvent. The platform scales beautifully and saves us countless hours.",
  },
])

const faqs = computed(() => [
  {
    question: 'How much does GoEvent cost?',
    answer:
      'GoEvent offers flexible pricing plans to suit different needs. We have a free tier for small events, and paid plans starting at $300/event for customize design. Business solutions are available with custom pricing.',
  },
  {
    question: 'Is my event data secure and private?',
    answer:
      'Absolutely. We take security seriously with enterprise-grade encryption, SOC 2 compliance, and GDPR compliance. Your data is stored securely with regular backups, and we never share your information with third parties. You maintain full ownership and control of your event data.',
  },
  {
    question: 'What types of events can I manage with GoEvent?',
    answer:
      "GoEvent is versatile and supports all types of events including conferences, workshops, webinars, weddings, corporate meetings, trade shows, festivals, and more. Whether it's a 10-person workshop or a 10,000-person conference, our platform scales to meet your needs.",
  },
  {
    question: 'Do you offer customer support?',
    answer:
      'Yes! We provide comprehensive support including 24/7 chat support, email support, extensive documentation, video tutorials, and webinar training sessions. Premium plans include dedicated account managers and priority support with guaranteed response times.',
  },
  {
    question: 'Can I customize the registration forms and event pages?',
    answer:
      "Definitely! GoEvent offers extensive customization options including custom registration forms, branded event pages, personalized email templates, and white-label solutions. You can match your organization's branding and create a seamless experience for your attendees.",
  },
])
</script>

<style scoped>
/* Unified gradient system for positive, user-friendly feel */
.features-bg {
  background: linear-gradient(to bottom, #ffffff, #f8fafc, #ffffff);
}

.testimonials-bg {
  background: linear-gradient(to bottom right, #f8fafc, #ffffff, #faf5ff);
}

.faq-bg {
  background: linear-gradient(to bottom right, #f8fafc, #ffffff, #f8fafc);
}

.pricing-bg {
  background: linear-gradient(to bottom, #ffffff, #dbeafe1a, #ffffff);
}

/* Optimized hero blur effects using will-change for better performance */
.hero-blur-shape {
  filter: blur(40px);
  will-change: transform;
  backface-visibility: hidden;
}

.hero-blur-large {
  filter: blur(80px);
  will-change: auto;
}

/* Optimized animations using transform3d for GPU acceleration */
@keyframes float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(10px, -20px, 0) scale(1.05);
  }
}

@keyframes float-delayed {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-15px, 15px, 0) scale(0.95);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 8s ease-in-out infinite;
  animation-delay: -2s;
}

/* Hero animations using transform3d for GPU acceleration */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translate3d(-50px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translate3d(50px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 30px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

/* Animation classes */
.animate-fade-in {
  animation: fadeIn 1s ease-out forwards;
}

.animate-slide-in-left {
  animation: slideInLeft 1s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 1s ease-out forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

/* Animation delays */
.animation-delay-100 {
  animation-delay: 0.1s;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

.animation-delay-1200 {
  animation-delay: 1.2s;
}

.animation-delay-1400 {
  animation-delay: 1.4s;
}

/* Typing animation */
.typing-text {
  position: relative;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
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
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Scroll animations */
.scroll-animate {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out;
}

.scroll-animate.animate-fade-in-up {
  opacity: 1;
  transform: translateY(0);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
