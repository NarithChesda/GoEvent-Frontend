<template>
  <!-- Desktop: a labelled column, not the manage page's 88px icon rail. Nine
       destinations whose names run to two words each ("Partner requests",
       "Credit orders") do not survive a 10.5px label under an icon, and the
       pending counts are the reason to look at this list at all — they need
       room to sit beside the name rather than as a dot on a glyph. -->
  <nav class="hidden lg:block" :aria-label="t('admin.nav.label')">
    <ul class="sticky top-20 space-y-0.5">
      <li v-for="item in ADMIN_NAV_ITEMS" :key="item.name">
        <RouterLink
          :to="{ name: item.name }"
          class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200"
          :class="
            isActive(item.name)
              ? 'bg-slate-900/[0.055] font-medium text-slate-900'
              : 'text-slate-600 hover:bg-slate-900/[0.035] hover:text-slate-900'
          "
          :aria-current="isActive(item.name) ? 'page' : undefined"
        >
          <component
            :is="item.icon"
            class="h-4 w-4 flex-shrink-0"
            :class="isActive(item.name) ? 'text-[#2ecc71]' : 'text-slate-400'"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate">{{ t(`admin.nav.${item.labelKey}`) }}</span>
          <span
            v-if="badgeFor(item)"
            class="flex-shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-700"
          >
            {{ badgeFor(item) }}
          </span>
        </RouterLink>
      </li>
    </ul>
  </nav>

  <!-- Below `lg` the same list becomes a scrolling strip. Same order, same
       badges — an admin who learns the sidebar on a laptop finds the queues in
       the same sequence on a phone. -->
  <nav class="lg:hidden" :aria-label="t('admin.nav.label')">
    <div class="admin-nav-strip -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
      <ul class="flex w-max items-center gap-1.5 pb-1">
        <li v-for="item in ADMIN_NAV_ITEMS" :key="item.name">
          <RouterLink
            :to="{ name: item.name }"
            class="flex min-h-[40px] items-center gap-2 rounded-full border px-3 text-sm transition-colors duration-200"
            :class="
              isActive(item.name)
                ? 'border-slate-300 bg-white font-medium text-slate-900 shadow-sm'
                : 'border-slate-200 bg-white/70 text-slate-600'
            "
            :aria-current="isActive(item.name) ? 'page' : undefined"
          >
            <component
              :is="item.icon"
              class="h-4 w-4 flex-shrink-0"
              :class="isActive(item.name) ? 'text-[#2ecc71]' : 'text-slate-400'"
              aria-hidden="true"
            />
            <span class="whitespace-nowrap">{{ t(`admin.nav.${item.labelKey}`) }}</span>
            <span
              v-if="badgeFor(item)"
              class="rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold tabular-nums text-amber-700"
            >
              {{ badgeFor(item) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
/**
 * The dashboard's own navigation, in both of its shapes.
 *
 * The badge is the point of it. Six of the nine destinations are queues with a
 * pending count, and a staff member's first question on arriving is which of
 * them has work in it — so the counts come from the shared summary store rather
 * than from each queue's own list response, which would only know its own.
 *
 * A zero is drawn as *nothing*, not as a `0` chip: an empty queue is the normal
 * state and a row of grey zeroes is nine pieces of furniture saying there is
 * nothing to do.
 */
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { ADMIN_NAV_ITEMS, type AdminNavItem } from './adminNav'
import { useAdminStore } from '@/stores/admin'

const { t } = useI18n()
const route = useRoute()
const adminStore = useAdminStore()

const isActive = (name: string): boolean => route.name === name

const badgeFor = (item: AdminNavItem): number | null => {
  if (!item.queue) return null
  const count = adminStore.pendingFor(item.queue)
  return count && count > 0 ? count : null
}
</script>

<style scoped>
/* No visible scrollbar under the strip — it is a row of pills, and a track
   drawn beneath them reads as a second divider. */
.admin-nav-strip {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.admin-nav-strip::-webkit-scrollbar {
  display: none;
}
</style>
