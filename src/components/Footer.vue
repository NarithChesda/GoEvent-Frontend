<template>
  <footer class="bg-gradient-to-br from-emerald-50 to-green-50 border-t border-emerald-100">
    <div class="max-w-7xl mx-auto py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-7 md:gap-8">
        <!-- Company Info -->
        <div class="col-span-1 sm:col-span-2">
          <div class="flex items-center space-x-2 mb-3 sm:mb-4">
            <img
              :src="LogoPng"
              alt="GoEvent Logo"
              class="h-16 sm:h-20 md:h-24 w-auto"
            />
          </div>
          <p class="text-sm sm:text-base text-slate-600 mb-4 sm:mb-5 md:mb-6 max-w-md leading-relaxed">
            Streamline your event management with our comprehensive platform. From planning to
            execution, we've got you covered.
          </p>
          <div class="flex space-x-3 sm:space-x-4">
            <a href="#" class="text-slate-400 hover:text-[#2ecc71] transition-colors duration-200">
              <Facebook class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </a>
            <a href="#" class="text-slate-400 hover:text-[#1e90ff] transition-colors duration-200">
              <Twitter class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </a>
            <a href="#" class="text-slate-400 hover:text-[#2ecc71] transition-colors duration-200">
              <Instagram class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </a>
            <a href="#" class="text-slate-400 hover:text-[#1e90ff] transition-colors duration-200">
              <Linkedin class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-xs sm:text-sm md:text-base font-semibold text-slate-900 tracking-wider uppercase mb-3 sm:mb-4">
            Product
          </h3>
          <ul class="space-y-2 sm:space-y-2.5 md:space-y-3">
            <li>
              <a href="#features" class="text-xs sm:text-sm md:text-base text-slate-600 hover:text-[#2ecc71] transition-colors duration-200 inline-block py-1"
                >Features</a
              >
            </li>
            <li>
              <a href="#pricing" class="text-xs sm:text-sm md:text-base text-slate-600 hover:text-[#2ecc71] transition-colors duration-200 inline-block py-1"
                >Pricing</a
              >
            </li>
            <li>
              <a href="#" class="text-xs sm:text-sm md:text-base text-slate-600 hover:text-[#2ecc71] transition-colors duration-200 inline-block py-1">Templates</a>
            </li>
            <li>
              <a href="#" class="text-xs sm:text-sm md:text-base text-slate-600 hover:text-[#2ecc71] transition-colors duration-200 inline-block py-1"
                >Integrations</a
              >
            </li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h3 class="text-xs sm:text-sm md:text-base font-semibold text-slate-900 tracking-wider uppercase mb-3 sm:mb-4">
            Support
          </h3>
          <ul class="space-y-2 sm:space-y-2.5 md:space-y-3">
            <li>
              <RouterLink to="/about" class="text-xs sm:text-sm md:text-base text-slate-600 hover:text-[#2ecc71] transition-colors duration-200 inline-block py-1"
                >About Us</RouterLink
              >
            </li>
            <li>
              <a href="#" class="text-xs sm:text-sm md:text-base text-slate-600 hover:text-[#2ecc71] transition-colors duration-200 inline-block py-1"
                >Help Center</a
              >
            </li>
            <li>
              <a href="#" class="text-xs sm:text-sm md:text-base text-slate-600 hover:text-[#2ecc71] transition-colors duration-200 inline-block py-1">Contact</a>
            </li>
            <li>
              <a href="#" class="text-xs sm:text-sm md:text-base text-slate-600 hover:text-[#2ecc71] transition-colors duration-200 inline-block py-1"
                >Privacy Policy</a
              >
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-6 sm:mt-7 md:mt-8 pt-6 sm:pt-7 md:pt-8 border-t border-gray-200">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <p class="text-xs sm:text-sm text-gray-500 text-center sm:text-left">© {{ currentYear }} GoEvent. All rights reserved.</p>
          <div class="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-5 md:gap-6">
            <a href="#" class="text-xs sm:text-sm text-gray-500 hover:text-[#1e90ff] transition-colors duration-200 whitespace-nowrap"
              >Terms of Service</a
            >
            <a href="#" class="text-xs sm:text-sm text-gray-500 hover:text-[#1e90ff] transition-colors duration-200 whitespace-nowrap"
              >Privacy Policy</a
            >
            <a href="#" class="text-xs sm:text-sm text-gray-500 hover:text-[#1e90ff] transition-colors duration-200 whitespace-nowrap"
              >Cookie Policy</a
            >
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-vue-next'
import LogoPng from '@/assets/logo.png'

const currentYear = computed(() => new Date().getFullYear())
</script>
