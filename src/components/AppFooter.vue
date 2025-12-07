<template>
  <footer class="mt-16 mb-20 lg:mb-0">
    <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="border-t border-slate-200 pt-6 pb-6">
      <!-- Top Row: Logo and Social Icons -->
      <div class="flex items-center justify-between mb-4">
        <!-- Left: Logo -->
        <button
          @click="handleLogoClick"
          class="flex items-center"
          aria-label="Go to home page"
        >
          <!-- Mobile: logo.png, Desktop: icon.svg -->
          <img
            :src="LogoPng"
            alt="GoEvent Logo"
            class="h-5 w-auto sm:hidden"
          />
          <img
            :src="IconSvg"
            alt="GoEvent Logo"
            class="h-5 w-auto hidden sm:block"
          />
        </button>

        <!-- Desktop Navigation (inline with logo) -->
        <nav class="hidden sm:flex items-center space-x-4 flex-1 ml-6">
          <RouterLink
            to="/home"
            class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/about"
            class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            About Us
          </RouterLink>
          <RouterLink
            to="/home#pricing"
            class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Pricing
          </RouterLink>
          <RouterLink
            to="/explore"
            class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Discover
          </RouterLink>
        </nav>

        <!-- Right: Social Icons -->
        <div class="flex items-center">
          <a
            href="https://t.me/goeventkh"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 text-slate-400 hover:text-[#2ecc71] transition-colors"
            aria-label="Telegram"
          >
            <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61581851850221"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 text-slate-400 hover:text-[#1e90ff] transition-colors"
            aria-label="Facebook"
          >
            <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
            </svg>
          </a>
          <a
            href="https://www.instagram.com/goevent.online/"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 text-slate-400 hover:text-[#e4405f] transition-colors"
            aria-label="Instagram"
          >
            <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a
            href="https://www.tiktok.com/@goevent.online"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 text-slate-400 hover:text-slate-900 transition-colors"
            aria-label="TikTok"
          >
            <svg class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Mobile Navigation Row -->
      <nav class="flex sm:hidden items-center space-x-4 mb-4">
        <RouterLink
          to="/home"
          class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Home
        </RouterLink>
        <RouterLink
          to="/home#pricing"
          class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Pricing
        </RouterLink>
        <RouterLink
          to="/about"
          class="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          About Us
        </RouterLink>
      </nav>

      <!-- Bottom Row: CTA -->
      <div class="sm:text-center">
        <RouterLink
          to="/events?createEvent=true"
          class="inline-flex items-center text-sm font-medium text-[#2ecc71] hover:text-[#27ae60] transition-colors"
        >
          Host your event with GoEvent
          <svg class="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </RouterLink>
      </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import IconSvg from '@/assets/icon.svg'
import LogoPng from '@/assets/logo.png'

const router = useRouter()

const handleLogoClick = () => {
  router.push('/events')
}
</script>
