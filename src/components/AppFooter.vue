<template>
  <footer class="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Top Row: Navigation and Social -->
      <div class="flex items-center justify-between mb-4">
        <!-- Left: Logo and Navigation -->
        <div class="flex items-center space-x-6">
          <button
            @click="handleLogoClick"
            class="flex items-center"
            aria-label="Go to home page"
          >
            <img
              :src="IconSvg"
              alt="GoEvent Logo"
              class="h-5 w-auto"
            />
          </button>
          <nav class="flex items-center space-x-4">
            <RouterLink
              to="/explore"
              class="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Discover
            </RouterLink>
            <RouterLink
              to="/pricing"
              class="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Pricing
            </RouterLink>
            <RouterLink
              to="/help"
              class="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Help
            </RouterLink>
          </nav>
        </div>

        <!-- Right: Social Icons -->
        <div class="flex items-center space-x-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Facebook"
          >
            <Facebook class="w-5 h-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Twitter"
          >
            <Twitter class="w-5 h-5" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Instagram"
          >
            <Instagram class="w-5 h-5" />
          </a>
        </div>
      </div>

      <!-- Bottom Row: CTA -->
      <div class="text-center">
        <RouterLink
          to="/events?createEvent=true"
          class="inline-flex items-center text-sm font-medium text-[#2ecc71] hover:text-[#27ae60] transition-colors"
        >
          Host your event with GoEvent
          <ArrowUpRight class="w-4 h-4 ml-1" />
        </RouterLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { Facebook, Twitter, Instagram, ArrowUpRight } from 'lucide-vue-next'
import IconSvg from '@/assets/icon.svg'

const router = useRouter()

const handleLogoClick = () => {
  router.push('/events')
}
</script>
