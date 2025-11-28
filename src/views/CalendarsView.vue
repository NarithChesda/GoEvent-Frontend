<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-br from-violet-50/30 via-white to-violet-50/30">
      <section class="py-8 sm:py-12 lg:py-16">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header -->
          <div class="mb-8 sm:mb-10">
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
              Calendars
            </h1>
          </div>

          <!-- Coming Soon State -->
          <div class="text-center py-16 px-4">
            <div class="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center">
              <Calendar class="w-16 h-16 text-violet-400" />
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-3">
              Coming Soon
            </h3>
            <p class="text-slate-600 mb-6 max-w-md mx-auto">
              Calendar view is coming soon. You'll be able to see all your events in a beautiful calendar format.
            </p>
            <RouterLink
              to="/events"
              class="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
            >
              <ArrowLeft class="w-4 h-4" />
              Back to Events
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { Calendar, ArrowLeft } from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
</script>
