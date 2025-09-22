<template>
  <footer class="bg-gradient-to-br from-emerald-50 to-green-50 border-t border-emerald-100">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Company Info -->
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <img
              :src="LogoSvg"
              alt="GoEvent Logo"
              class="h-24 w-auto"
            />
          </div>
          <p class="text-slate-600 mb-4 max-w-md">
            Streamline your event management with our comprehensive platform. From planning to
            execution, we've got you covered.
          </p>
          <div class="flex space-x-4">
            <a href="#" class="text-slate-400 hover:text-emerald-600 transition-colors">
              <Facebook class="w-5 h-5" />
            </a>
            <a href="#" class="text-slate-400 hover:text-emerald-600 transition-colors">
              <Twitter class="w-5 h-5" />
            </a>
            <a href="#" class="text-slate-400 hover:text-emerald-600 transition-colors">
              <Instagram class="w-5 h-5" />
            </a>
            <a href="#" class="text-slate-400 hover:text-emerald-600 transition-colors">
              <Linkedin class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">
            Product
          </h3>
          <ul class="space-y-3">
            <li>
              <a href="#features" class="text-slate-600 hover:text-emerald-600 transition-colors"
                >Features</a
              >
            </li>
            <li>
              <a href="#pricing" class="text-slate-600 hover:text-emerald-600 transition-colors"
                >Pricing</a
              >
            </li>
            <li>
              <a href="#" class="text-slate-600 hover:text-emerald-600 transition-colors">Templates</a>
            </li>
            <li>
              <a href="#" class="text-slate-600 hover:text-emerald-600 transition-colors"
                >Integrations</a
              >
            </li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h3 class="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">
            Support
          </h3>
          <ul class="space-y-3">
            <li>
              <RouterLink to="/about" class="text-slate-600 hover:text-emerald-600 transition-colors"
                >About Us</RouterLink
              >
            </li>
            <li>
              <a href="#" class="text-slate-600 hover:text-emerald-600 transition-colors"
                >Help Center</a
              >
            </li>
            <li>
              <a href="#" class="text-slate-600 hover:text-emerald-600 transition-colors">Contact</a>
            </li>
            <li>
              <a href="#" class="text-slate-600 hover:text-emerald-600 transition-colors"
                >Privacy Policy</a
              >
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-8 pt-8 border-t border-gray-200">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-500 text-sm">© {{ currentYear }} GoEvent. All rights reserved.</p>
          <div class="flex space-x-6 mt-4 md:mt-0">
            <a href="#" class="text-gray-500 hover:text-emerald-600 text-sm transition-colors"
              >Terms of Service</a
            >
            <a href="#" class="text-gray-500 hover:text-emerald-600 text-sm transition-colors"
              >Privacy Policy</a
            >
            <a href="#" class="text-gray-500 hover:text-emerald-600 text-sm transition-colors"
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
import LogoSvg from '@/assets/logo.svg'

const currentYear = computed(() => new Date().getFullYear())
</script>
