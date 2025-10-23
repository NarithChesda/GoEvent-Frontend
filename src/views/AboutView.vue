<template>
  <MainLayout>
    <div class="min-h-screen">

    <!-- Hero Section -->
    <section
      id="hero"
      class="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 overflow-hidden -mt-20"
    >
      <!-- Enhanced Background Elements -->
      <div class="absolute inset-0 pointer-events-none">
        <!-- Primary gradient overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-green-500/5 to-emerald-500/5"
        ></div>

        <!-- Animated background shapes -->
        <div
          class="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-emerald-400/30 to-green-500/30 rounded-full mix-blend-multiply filter blur-2xl animate-pulse"
        ></div>
        <div
          class="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-green-400/25 to-emerald-400/25 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-1000"
        ></div>
        <div
          class="absolute -bottom-8 left-20 w-80 h-80 bg-gradient-to-br from-emerald-300/30 to-green-400/30 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-500"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-200/10 to-green-300/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"
        ></div>

        <!-- Geometric patterns -->
        <div
          class="absolute top-32 right-32 w-4 h-4 bg-emerald-500/30 rounded-full animate-pulse delay-300"
        ></div>
        <div
          class="absolute bottom-32 left-32 w-6 h-6 bg-purple-500/30 rounded-full animate-pulse delay-900"
        ></div>
        <div
          class="absolute top-64 left-64 w-3 h-3 bg-indigo-500/40 rounded-full animate-pulse delay-1200"
        ></div>
      </div>

      <div
        class="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pt-20 sm:pt-28 lg:pt-32"
      >
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          <div class="lg:col-span-7 space-y-6 sm:space-y-8 animate-slide-in-left text-center lg:text-left">
            <div class="space-y-4 sm:space-y-6">
              <div
                class="inline-flex items-center bg-gradient-to-r from-emerald-500/20 to-sky-500/20 backdrop-blur-sm border border-white/30 text-[#1873cc] text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full animate-fade-in animation-delay-100 shadow-lg shadow-[#87CEEB]/30"
              >
                <Heart class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Our Story
              </div>
              <h1
                class="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold leading-tight tracking-tight text-slate-900 animate-fade-in animation-delay-500"
              >
                <span class="typing-text-about">{{ aboutText }}</span
                ><span v-if="aboutComplete" class="typing-text-goevent">{{ goEventText }}</span
                ><span
                  v-if="!aboutComplete || (aboutComplete && !goEventComplete)"
                  class="typing-cursor"
                  >|</span
                >
              </h1>
              <p
                class="text-base sm:text-lg lg:text-lg xl:text-xl text-slate-700 leading-relaxed max-w-prose animate-fade-in animation-delay-1000"
              >
                We are on a mission to Build intelligent, tech-driven solutions that redefine how
                businesses manage and deliver
                <span class="text-[#1e90ff] font-semibold"> experiences</span>.
              </p>
            </div>

            <div
              class="flex flex-row gap-2 sm:gap-4 lg:gap-4 xl:gap-6 animate-fade-in animation-delay-1200"
            >
              <RouterLink
                to="/events"
                class="group bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold px-4 py-3 sm:px-8 sm:py-4 rounded-lg shadow-lg shadow-emerald-500/25 text-sm sm:text-base transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:shadow-md text-center flex-1 sm:flex-none"
              >
                <span class="hidden sm:inline">Explore Our Events</span><span class="sm:hidden">Explore Events</span>
                <ArrowRight
                  class="inline w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform duration-300"
                />
              </RouterLink>
              <RouterLink
                to="/"
                class="flex items-center justify-center bg-white text-[#1e90ff] font-semibold px-4 py-3 sm:px-8 sm:py-4 rounded-lg border-2 border-[#87CEEB] text-sm sm:text-base shadow-sm transition-all duration-200 hover:bg-[#E6F4FF] hover:border-[#5eb3f6] hover:shadow-md hover:scale-[1.02] active:bg-[#B0E0E6] active:scale-[0.98] group flex-1 sm:flex-none"
              >
                <Heart
                  class="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 group-hover:scale-110 transition-transform duration-300"
                />
                <span class="hidden sm:inline">Learn More</span><span class="sm:hidden">Learn</span>
              </RouterLink>
            </div>

            <div
              class="hidden lg:flex flex-col sm:flex-row gap-4 sm:gap-6 justify-start items-start sm:items-center animate-fade-in animation-delay-1400"
            >
              <div class="flex -space-x-2">
                <div
                  class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-full border-3 sm:border-4 border-white flex items-center justify-center text-white font-bold text-sm sm:text-base"
                >
                  A
                </div>
                <div
                  class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-[#1e90ff] rounded-full border-3 sm:border-4 border-white flex items-center justify-center text-white font-bold text-sm sm:text-base"
                >
                  S
                </div>
                <div
                  class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#1e90ff] to-[#2ecc71] rounded-full border-3 sm:border-4 border-white flex items-center justify-center text-white font-bold text-sm sm:text-base"
                >
                  M
                </div>
                <div
                  class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-full border-3 sm:border-4 border-white flex items-center justify-center text-white font-bold text-sm sm:text-base"
                >
                  +
                </div>
              </div>
              <span class="text-slate-600 font-medium text-sm sm:text-base"
                >Meet the team behind the magic</span
              >
            </div>
          </div>

          <div class="hidden lg:block lg:col-span-5 relative animate-slide-in-right animation-delay-200">
            <div class="relative max-w-lg lg:max-w-full mx-auto">
              <!-- Main About Card -->
              <div
                class="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#1e90ff]/20 p-4 sm:p-6 lg:p-6 xl:p-8 border border-white/50"
              >
                <div class="flex items-center justify-between mb-4 sm:mb-6 lg:mb-6 xl:mb-8">
                  <h3 class="text-lg sm:text-xl lg:text-xl xl:text-2xl font-bold text-gray-900">
                    Our Journey
                  </h3>
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"
                    ></div>
                    <span class="text-xs sm:text-sm text-gray-600 font-medium">Since 2023</span>
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
                      50K+
                    </div>
                    <div class="text-xs sm:text-sm text-[#1873cc] font-medium">Events Created</div>
                    <div class="text-xs text-green-600 font-medium mt-1">↗ Growing daily</div>
                  </div>
                  <div
                    class="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-4 xl:p-6 border border-emerald-200/50"
                  >
                    <div
                      class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-emerald-600 mb-1 sm:mb-2"
                    >
                      150+
                    </div>
                    <div class="text-xs sm:text-sm text-emerald-700 font-medium">Countries</div>
                    <div class="text-xs text-green-600 font-medium mt-1">↗ Global reach</div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">Mission Progress</span>
                    <span class="text-sm font-bold text-gray-900">92%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div
                      class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] h-3 rounded-full transition-all duration-1000"
                      style="width: 92%"
                    ></div>
                  </div>

                  <div class="flex justify-between items-center pt-4">
                    <span class="text-xs text-gray-500">Transforming event management</span>
                    <div class="flex space-x-1">
                      <div class="w-2 h-2 bg-[#4fa3d9] rounded-full"></div>
                      <div class="w-2 h-2 bg-[#5eb3f6] rounded-full"></div>
                      <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
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
                    <Award class="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <div>
                    <div class="text-xs font-medium text-gray-900">Award Winner</div>
                    <div class="text-xs text-gray-500">Best Event Platform</div>
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
                    <Users class="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                  </div>
                  <div>
                    <div class="text-xs font-medium text-gray-900">Growing Team</div>
                    <div class="text-xs text-gray-500">20+ members</div>
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

    <!-- Mission & Vision -->
    <section
      ref="missionSection"
      class="py-12 sm:py-16 md:py-20 lg:py-24 bg-white relative overflow-hidden scroll-animate"
      :class="{ 'animate-fade-in-up': isVisible.mission }"
    >
      <!-- Background decoration -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute top-0 left-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-gradient-to-br from-emerald-100/40 to-sky-100/30 rounded-full blur-3xl"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-br from-sky-100/35 to-emerald-100/25 rounded-full blur-3xl"
        ></div>
      </div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <!-- Section Header -->
        <div class="text-center mb-8 sm:mb-12 md:mb-16">
          <div
            class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
          >
            <Target class="h-3 w-3 sm:h-4 sm:w-4" />
            Our Purpose
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight px-4"
          >
            Mission &
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
              >Vision</span
            >
          </h2>
          <p
            class="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4"
          >
            The driving forces behind everything we do at GoEvent
          </p>
        </div>

        <!-- Mission & Vision Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
          <!-- Mission Card -->
          <div class="group relative">
            <div
              class="bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-8 xl:p-10 shadow-2xl shadow-[#1e90ff]/20 backdrop-blur-sm border border-white/10 hover:scale-105 transition-all duration-500"
            >
              <!-- Floating icon -->
              <div class="absolute -top-4 sm:-top-6 left-6 sm:left-8">
                <div
                  class="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300"
                >
                  <Target class="w-6 h-6 sm:w-8 sm:h-8 text-[#1e90ff]" />
                </div>
              </div>

              <div class="pt-6 sm:pt-8">
                <h3
                  class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-white mb-4 sm:mb-6"
                >
                  Our Mission
                </h3>
                <p class="text-sm sm:text-base lg:text-lg text-[#B0E0E6] leading-relaxed">
                  To become a leading force in transforming businesses through AI-driven innovation
                  — starting with event management and expanding into broader industries — by
                  empowering people and organizations to unlock the full potential of artificial
                  intelligence.
                </p>
              </div>

              <!-- Decorative elements -->
              <div
                class="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full"
              ></div>
              <div
                class="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-full"
              ></div>
            </div>
          </div>

          <!-- Vision Card -->
          <div class="group relative">
            <div
              class="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-8 xl:p-10 shadow-2xl shadow-slate-500/10 border border-slate-200 hover:scale-105 transition-all duration-500"
            >
              <!-- Floating icon -->
              <div class="absolute -top-4 sm:-top-6 left-6 sm:left-8">
                <div
                  class="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300"
                >
                  <Eye class="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>

              <div class="pt-6 sm:pt-8">
                <h3
                  class="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-slate-900 mb-4 sm:mb-6"
                >
                  Our Vision
                </h3>
                <p class="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed">
                  Train and nurture the next generation of AI engineers, creating a sustainable
                  ecosystem of innovation. Maximize the value of AI for businesses by bridging
                  cutting-edge technology with real-world impact. Drive digital transformation with
                  scalable, human-centered, AI-powered solutions.
                </p>
              </div>

              <!-- Decorative elements -->
              <div
                class="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-100/50 to-sky-100/50 rounded-full"
              ></div>
              <div
                class="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-100/30 to-sky-100/30 rounded-full"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-12 sm:py-16 md:py-20 relative overflow-hidden stats-bg">
      <!-- Background elements -->
      <div class="absolute inset-0 pointer-events-none">
        <div
          class="absolute top-0 left-1/2 transform -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-[#E6F4FF]0/10 rounded-full blur-3xl"
        ></div>
        <div class="absolute bottom-0 right-0 w-56 sm:w-72 h-56 sm:h-72 bg-[#E6F4FF]0/10 rounded-full blur-3xl"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="text-center mb-8 sm:mb-12 md:mb-16">
          <div
            class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
          >
            <BarChart3 class="h-3 w-3 sm:h-4 sm:w-4" />
            Our Impact
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight px-4"
          >
            GoEvent by the
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
              >Numbers</span
            >
          </h2>
          <p class="text-base sm:text-lg md:text-xl text-slate-300 px-4 max-w-3xl mx-auto">
            Our impact on the event management industry
          </p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="relative bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-center hover:bg-white/30 transition-all duration-300 group hover:shadow-xl"
          >
            <div
              class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 group-hover:scale-105 transition-transform duration-300"
            >
              {{ stat.value }}
            </div>
            <div class="text-[#B0E0E6] text-sm sm:text-base lg:text-lg font-medium">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section
      ref="valuesSection"
      class="py-12 sm:py-16 md:py-20 scroll-animate features-bg"
      :class="{ 'animate-fade-in-up': isVisible.values }"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16 md:mb-20">
          <div
            class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
          >
            <Star class="h-3 w-3 sm:h-4 sm:w-4" />
            Our Core Values
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight px-4"
          >
            What Drives Us to
            <span
              class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] bg-clip-text text-transparent"
            >
              Succeed</span
            >
          </h2>
          <p class="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
            These core principles guide everything we do and shape our company culture, driving us
            to create exceptional experiences.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          <div
            v-for="(value, index) in values"
            :key="value.title"
            class="group relative bg-white rounded-xl border border-slate-200 p-6 sm:p-7 md:p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2"
            :class="index === 1 ? 'md:scale-105 md:z-10 border-[#B0E0E6]' : ''"
          >
            <!-- Top accent bar -->
            <div
              class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-t-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
            ></div>

            <div class="relative">
              <!-- Icon with design guide styling -->
              <div class="relative mb-4 sm:mb-5 md:mb-6">
                <div
                  class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  :class="value.bgColor"
                >
                  <component
                    :is="value.icon"
                    class="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-all duration-300"
                    :class="value.iconColor"
                  />
                </div>
                <!-- Floating accent -->
                <div
                  class="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100"
                ></div>
              </div>

              <!-- Content with design guide typography -->
              <div class="space-y-3 sm:space-y-3.5 md:space-y-4">
                <h3
                  class="text-lg sm:text-xl md:text-xl font-bold text-slate-900 leading-snug group-hover:bg-gradient-to-r group-hover:from-[#2ecc71] group-hover:to-[#1e90ff] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
                >
                  {{ value.title }}
                </h3>
                <p class="text-sm sm:text-base md:text-base text-slate-700 leading-relaxed">
                  {{ value.description }}
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

    <!-- Team Section -->
    <section
      ref="teamSection"
      class="py-12 sm:py-16 md:py-20 relative overflow-hidden scroll-animate team-bg"
      :class="{ 'animate-fade-in-up': isVisible.team }"
    >
      <!-- Background decoration -->
      <div class="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-[#5eb3f6]/20 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-white/40 rounded-full blur-3xl"></div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20">
          <div
            class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-[#B0E0E6] text-[#1873cc] mb-4 sm:mb-6"
          >
            <Users class="h-3 w-3 sm:h-4 sm:w-4" />
            Our Amazing Team
          </div>
          <h2
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight px-4"
          >
            Meet the
            <span class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] bg-clip-text text-transparent"
              >Innovators</span
            >
          </h2>
          <p
            class="text-base sm:text-lg md:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed px-4"
          >
            Passionate professionals dedicated to transforming event management and creating
            exceptional experiences
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="teamLoading" class="flex justify-center items-center py-12 sm:py-16">
          <div class="flex items-center space-x-3 sm:space-x-4 text-[#1e90ff]">
            <Loader class="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
            <span class="text-sm sm:text-base lg:text-lg font-medium"
              >Loading our amazing team...</span
            >
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="teamError" class="text-center py-12 sm:py-16">
          <div
            class="bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md mx-auto"
          >
            <p class="text-red-600 font-medium text-sm sm:text-base">{{ teamError }}</p>
            <button
              @click="fetchTeamMembers"
              class="mt-4 bg-red-600 text-white px-4 sm:px-6 py-2 rounded-xl hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        </div>

        <!-- Team Members Grid -->
        <div v-else :class="teamGridClasses">
          <div
            v-for="(member, index) in teamMembers"
            :key="member.id"
            class="group relative w-full bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
            :class="index === 1 ? 'md:scale-105 md:z-10' : ''"
          >
            <!-- Avatar -->
            <div class="relative mb-6 sm:mb-8 flex justify-center">
              <div class="relative">
                <!-- Profile Picture or Initials -->
                <div
                  class="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full shadow-xl group-hover:scale-110 transition-transform duration-300 overflow-hidden"
                >
                  <img
                    v-if="member.profile_picture"
                    :src="apiService.getProfilePictureUrl(member.profile_picture) || ''"
                    :alt="member.name"
                    class="w-full h-full object-cover"
                    @error="($event.target as HTMLImageElement).style.display = 'none'"
                  />
                  <div
                    v-else
                    class="w-full h-full bg-gradient-to-br flex items-center justify-center text-white text-lg sm:text-xl lg:text-2xl font-bold"
                    :class="getAvatarGradient(member.id)"
                  >
                    {{
                      member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                    }}
                  </div>
                </div>
                <!-- Online indicator -->
                <div
                  class="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-400 border-3 sm:border-4 border-white rounded-full flex items-center justify-center"
                >
                  <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="text-center space-y-3 sm:space-y-4">
              <h3 class="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                {{ member.name }}
              </h3>
              <p class="text-[#1e90ff] font-semibold text-base sm:text-lg">{{ member.role }}</p>
              <p class="text-slate-600 leading-relaxed text-sm sm:text-base">
                {{ member.bio || `${member.name} is a valuable member of our team at GoEvent.` }}
              </p>

              <!-- Social links -->
              <div class="flex justify-center space-x-3 sm:space-x-4 pt-3 sm:pt-4">
                <a
                  v-if="member.linkedin_url"
                  :href="member.linkedin_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-8 h-8 sm:w-10 sm:h-10 bg-[#B0E0E6] hover:bg-[#87CEEB] rounded-full flex items-center justify-center text-[#1e90ff] hover:scale-110 transition-all duration-200"
                >
                  <Linkedin class="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a
                  v-if="member.twitter_url"
                  :href="member.twitter_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-8 h-8 sm:w-10 sm:h-10 bg-[#B0E0E6] hover:bg-[#87CEEB] rounded-full flex items-center justify-center text-[#1e90ff] hover:scale-110 transition-all duration-200"
                >
                  <Twitter class="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a
                  v-if="member.github_url"
                  :href="member.github_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-8 h-8 sm:w-10 sm:h-10 bg-[#B0E0E6] hover:bg-[#87CEEB] rounded-full flex items-center justify-center text-[#1e90ff] hover:scale-110 transition-all duration-200"
                >
                  <Github class="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>

            <!-- Hover effect background -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-sky-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
            ></div>
          </div>
        </div>

        <!-- Join team CTA -->
        <div class="text-center mt-12 sm:mt-16 lg:mt-20">
          <div
            class="inline-flex flex-col sm:flex-row items-center bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6"
          >
            <div class="flex -space-x-2">
              <div
                class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-full border-2 border-white"
              ></div>
              <div
                class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-[#1e90ff] rounded-full border-2 border-white"
              ></div>
              <div
                class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#1e90ff] to-[#2ecc71] rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs sm:text-sm"
              >
                ?
              </div>
            </div>
            <span class="text-slate-700 font-medium text-sm sm:text-base text-center sm:text-left"
              >We're hiring! Join our growing team</span
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Join Us CTA -->
    <section class="py-12 sm:py-16 md:py-20 lg:py-32 bg-white relative overflow-hidden">
      <!-- Background decoration -->
      <div class="absolute inset-0 pointer-events-none">
        <!-- Subtle gradient orbs -->
        <div
          class="absolute top-0 left-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-gradient-to-br from-emerald-100/40 to-sky-100/30 rounded-full blur-3xl"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-br from-sky-100/35 to-emerald-100/25 rounded-full blur-3xl"
        ></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <!-- Floating Box Container -->
        <div
          class="bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl shadow-[#1e90ff]/20 backdrop-blur-sm border border-white/10"
        >
          <div class="text-center max-w-4xl mx-auto">
            <div
              class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 text-white mb-4 sm:mb-6"
            >
              <Users class="h-3 w-3 sm:h-4 sm:w-4" />
              Join Our Team
            </div>

            <h2
              class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 leading-tight tracking-tight"
            >
              Shape the Future with
              <span
                class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-sky-200"
              >
                AI</span
              >
            </h2>

            <p
              class="text-base sm:text-lg md:text-xl text-[#B0E0E6] mb-6 sm:mb-8 leading-relaxed max-w-3xl mx-auto px-4"
            >
              We’re a team of innovators building the next generation of AI-driven solutions that transform how businesses work, think, and grow. If you’re passionate about technology and the future, you belong here.
            </p>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-10 max-w-lg mx-auto">
              <div class="text-center">
                <div class="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1">
                  10+
                </div>
                <div class="text-xs sm:text-sm text-white">Team Members</div>
              </div>
              <div class="text-center">
                <div class="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1">
                  5+
                </div>
                <div class="text-xs sm:text-sm text-white">Open Roles</div>
              </div>
              <div class="text-center">
                <div class="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1">
                  100%
                </div>
                <div class="text-xs sm:text-sm text-white">Remote OK</div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="https://t.me/goevent_careers"
                target="_blank"
                rel="noopener noreferrer"
                class="group bg-white hover:bg-[#E6F4FF] text-[#1e90ff] hover:text-[#1873cc] font-bold px-5 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-black/10 flex items-center justify-center"
              >
                View Open Positions
                <Users
                  class="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform duration-300"
                />
              </a>
              <RouterLink
                to="/"
                class="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 font-bold px-5 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base lg:text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                Back to Home
              </RouterLink>
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
        class="fixed bottom-28 lg:bottom-8 right-6 w-14 h-14 z-50 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2 flex items-center justify-center"
      >
        <ArrowUp class="w-6 h-6" />
      </button>
    </Transition>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'
import Footer from '../components/Footer.vue'
import { useScrollAnimations, useScrollToTop } from '../composables/useScrollAnimations'
import { useDelayedTypingAnimation } from '../composables/useDelayedTypingAnimation'
import { teamMembersService, type TeamMember, apiService } from '../services/api'
import {
  Target,
  Eye,
  Heart,
  Users,
  Lightbulb,
  Shield,
  Zap,
  Award,
  BarChart3,
  Linkedin,
  Twitter,
  ArrowUp,
  ArrowRight,
  Github,
  Loader,
  Star,
} from 'lucide-vue-next'

const values = [
  {
    icon: Heart,
    title: 'Customer First',
    description: "Every decision we make starts with our customers' needs and success in mind.",
    bgColor: 'bg-gradient-to-br from-red-100 to-red-200',
    iconColor: 'text-red-600',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description:
      'We constantly push boundaries to deliver cutting-edge solutions that exceed expectations.',
    bgColor: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
    iconColor: 'text-yellow-600',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description:
      'We believe the best results come from diverse teams working together towards common goals.',
    bgColor: 'bg-gradient-to-br from-emerald-100 to-sky-200',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Shield,
    title: 'Reliability',
    description:
      'Our platform is built to be dependable, secure, and always available when you need it most.',
    bgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Zap,
    title: 'Efficiency',
    description:
      'We streamline complex processes to help you achieve more with less effort and time.',
    bgColor: 'bg-gradient-to-br from-[#B0E0E6] to-[#87CEEB]',
    iconColor: 'text-[#1e90ff]',
  },
  {
    icon: Award,
    title: 'Excellence',
    description:
      'We maintain the highest standards in everything we do, from code quality to customer service.',
    bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200',
    iconColor: 'text-orange-600',
  },
]

// Team members state
const teamMembers = ref<TeamMember[]>([])
const teamLoading = ref(false)
const teamError = ref<string | null>(null)

const teamGridClasses = computed(() => {
  const classes = ['grid', 'grid-cols-1', 'gap-6', 'sm:gap-8', 'lg:gap-10']
  const count = teamMembers.value.length

  if (count <= 1) {
    classes.push('md:grid-cols-1', 'xl:grid-cols-1', 'max-w-xl', 'mx-auto', 'justify-items-center')
  } else if (count === 2) {
    classes.push('md:grid-cols-2', 'xl:grid-cols-2', 'max-w-5xl', 'mx-auto', 'justify-items-center')
  } else {
    classes.push('md:grid-cols-2', 'xl:grid-cols-3')
  }

  return classes
})

// Avatar gradient options for fallback when no profile picture
const avatarGradients = [
  'from-[#2ecc71] to-[#1e90ff]',
  'from-emerald-500 to-[#1e90ff]',
  'from-[#1e90ff] to-[#2ecc71]',
  'from-[#2ecc71] to-[#1e90ff]',
  'from-orange-500 to-red-500',
  'from-emerald-500 to-[#1e90ff]',
  'from-[#2ecc71] to-[#1e90ff]',
  'from-[#1e90ff] to-[#2ecc71]',
]

// Function to get avatar gradient based on member ID
const getAvatarGradient = (id: number): string => {
  return avatarGradients[id % avatarGradients.length]
}

// Function to fetch team members
const fetchTeamMembers = async () => {
  teamLoading.value = true
  teamError.value = null

  try {
    const response = await teamMembersService.getTeamMembers()

    if (response.success && response.data) {
      // Sort by order field and filter only active members
      teamMembers.value = response.data.results
        .filter((member) => member.is_active)
        .sort((a, b) => a.order - b.order)
    } else {
      teamError.value = response.message || 'Failed to load team members'
    }
  } catch (error) {
    teamError.value = 'Network error while loading team members'
    console.error('Error fetching team members:', error)
  } finally {
    teamLoading.value = false
  }
}

// Scroll animations
const { isVisible, observeElement } = useScrollAnimations()
const { showScrollTop, scrollToTop } = useScrollToTop()

// Typing animation for hero text - split into two parts
const { displayText: aboutText, isComplete: aboutComplete } = useDelayedTypingAnimation(
  'About ',
  30,
  800,
)
const { displayText: goEventText, isComplete: goEventComplete } = useDelayedTypingAnimation(
  'GoEvent',
  30,
  1100,
)

// Refs for sections
const missionSection = ref<HTMLElement>()
const valuesSection = ref<HTMLElement>()
const teamSection = ref<HTMLElement>()

onMounted(() => {
  // Fetch team members data
  fetchTeamMembers()

  // Observe sections for scroll animations
  if (missionSection.value) {
    observeElement(missionSection.value, 'mission')
  }
  if (valuesSection.value) {
    observeElement(valuesSection.value, 'values')
  }
  if (teamSection.value) {
    observeElement(teamSection.value, 'team')
  }
})

const stats = [
  { value: '50K+', label: 'Events Created' },
  { value: '2M+', label: 'Attendees Managed' },
  { value: '150+', label: 'Countries Served' },
  { value: '99.9%', label: 'Uptime' },
]
</script>

<style scoped>
/* Unified gradient system for positive, user-friendly feel */
.features-bg {
  background: linear-gradient(to bottom, #ffffff, #f8fafc, #ffffff);
}

.values-bg {
  background: linear-gradient(to bottom, #f8fafc, #ffffff, #faf5ff);
}

.team-bg {
  background: linear-gradient(to bottom right, #f8fafc, #ffffff, #f8fafc);
}

.stats-bg {
  background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a);
}

/* Hero animations */
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
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

.animation-delay-300 {
  animation-delay: 0.3s;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

.animation-delay-800 {
  animation-delay: 0.8s;
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
.typing-text-about {
  color: #0f172a;
}

.typing-text-goevent {
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
