<template>
  <footer class="bg-gradient-to-br from-emerald-50 to-green-50 border-t border-emerald-100">
    <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
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
            <a href="https://t.me/goeventkh" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#2ecc71] transition-colors duration-200" aria-label="Telegram">
              <svg class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61581851850221" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#1e90ff] transition-colors duration-200" aria-label="Facebook">
              <Facebook class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </a>
            <a href="https://www.instagram.com/goevent.online/" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#e4405f] transition-colors duration-200" aria-label="Instagram">
              <Instagram class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </a>
            <a href="https://www.tiktok.com/@goevent.online" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-slate-900 transition-colors duration-200" aria-label="TikTok">
              <svg class="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
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
import { Facebook, Instagram } from 'lucide-vue-next'
import LogoPng from '@/assets/logo.png'

const currentYear = computed(() => new Date().getFullYear())
</script>
