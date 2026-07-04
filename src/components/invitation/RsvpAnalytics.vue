<template>
  <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
          {{ t('management.rsvpAnalytics.title') }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ t('management.rsvpAnalytics.subtitle') }}
        </p>
      </div>
      <button
        type="button"
        class="flex-shrink-0 rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="loading"
        :aria-label="t('management.rsvpAnalytics.refresh')"
        :title="t('management.rsvpAnalytics.refresh')"
        @click="loadSummary"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Loading skeleton (first load only — refreshes keep content visible) -->
    <div v-if="loading && !summary" class="animate-pulse space-y-8" aria-hidden="true">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-28 rounded-2xl bg-slate-100" />
      </div>
      <div class="space-y-3">
        <div class="h-3 w-44 rounded bg-slate-100" />
        <div class="h-3 w-full rounded-full bg-slate-100" />
        <div class="h-3 w-64 max-w-full rounded bg-slate-100" />
      </div>
      <div class="space-y-3">
        <div v-for="i in 2" :key="i" class="h-16 rounded-2xl bg-slate-100" />
      </div>
    </div>

    <!-- Empty: no summary or zero invited -->
    <div
      v-else-if="!summary || summary.total_invited === 0"
      class="py-12 text-center"
    >
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20"
      >
        <ClipboardList class="h-7 w-7 text-[#2ecc71]" />
      </div>
      <p class="text-base font-semibold text-slate-900">
        {{ t('management.rsvpAnalytics.empty.title') }}
      </p>
      <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {{ t('management.rsvpAnalytics.empty.description') }}
      </p>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-8">
      <!-- ================================================================
        Section 1 · KPI tiles
        Response rate is the single hero figure; the other three tiles are
        quiet supporting stats. Colors stay on marks (meter), not text.
      ================================================================= -->
      <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <!-- Hero: response rate -->
        <div
          class="col-span-2 rounded-2xl border border-emerald-100/70 bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 p-4 sm:p-5 lg:col-span-1"
        >
          <p class="text-xs font-medium text-slate-500">
            {{ t('management.rsvpAnalytics.metrics.responseRate') }}
          </p>
          <p class="mt-1.5 text-3xl sm:text-4xl font-bold leading-none text-slate-900">
            {{ respondedPercent }}%
          </p>
          <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/10">
            <div
              class="h-full rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] transition-all duration-500"
              :style="{ width: `${respondedPercent}%` }"
            />
          </div>
          <p class="mt-2 text-[11px] leading-snug text-slate-500">
            {{
              t('management.rsvpAnalytics.metrics.responseRateDesc', {
                responded: respondedCount,
                invited: summary.total_invited,
              })
            }}
          </p>
        </div>

        <!-- Going -->
        <div class="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 sm:p-5">
          <p class="text-xs font-medium text-slate-500">
            {{ t('management.rsvpAnalytics.metrics.going') }}
          </p>
          <p class="mt-1.5 text-2xl sm:text-3xl font-semibold leading-none text-slate-900">
            {{ summary.status_counts.attending }}
          </p>
          <p class="mt-2 text-[11px] leading-snug text-slate-500">
            {{ t('management.rsvpAnalytics.metrics.goingDesc', { percent: attendingPercent }) }}
          </p>
        </div>

        <!-- Expected attendees (incl. plus-ones) -->
        <div class="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 sm:p-5">
          <p class="text-xs font-medium text-slate-500">
            {{ t('management.rsvpAnalytics.hero.expectedLabel') }}
          </p>
          <p class="mt-1.5 text-2xl sm:text-3xl font-semibold leading-none text-slate-900">
            {{ summary.total_expected_attendees }}
          </p>
          <p class="mt-2 text-[11px] leading-snug text-slate-500">
            {{
              t('management.rsvpAnalytics.metrics.expectedDesc', {
                attending: summary.status_counts.attending,
                plusOnes: plusOnesCount,
              })
            }}
          </p>
        </div>

        <!-- Awaiting reply -->
        <div class="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 sm:p-5">
          <p class="text-xs font-medium text-slate-500">
            {{ t('management.rsvpAnalytics.metrics.pending') }}
          </p>
          <p class="mt-1.5 text-2xl sm:text-3xl font-semibold leading-none text-slate-900">
            {{ summary.status_counts.pending }}
          </p>
          <p class="mt-2 text-[11px] leading-snug text-slate-500">
            {{ t('management.rsvpAnalytics.metrics.pendingDesc') }}
          </p>
        </div>
      </section>

      <!-- ================================================================
        Section 2 · Response distribution
        Segmented bar with 2px surface gaps; hover reveals a tooltip per
        segment. Legend below always carries labels + counts, so color is
        never the only identity channel.
      ================================================================= -->
      <section>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {{ t('management.rsvpAnalytics.distribution.title') }}
        </p>

        <div class="mt-3 flex h-3 w-full gap-[3px]">
          <div
            v-for="row in visibleSegments"
            :key="row.key"
            class="group relative h-full"
            :style="{ flexGrow: row.count, flexBasis: '0%' }"
          >
            <div
              class="h-full w-full rounded-full transition-all duration-500"
              :style="{ backgroundColor: row.color }"
            />
            <div
              class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block"
            >
              {{ row.label }} · {{ row.count }} ({{ row.percent }}%)
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-6">
          <div
            v-for="row in distributionRows"
            :key="row.key"
            class="flex items-baseline gap-2"
          >
            <span
              class="h-2 w-2 flex-shrink-0 self-center rounded-full"
              :style="{ backgroundColor: row.color }"
            />
            <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {{ row.label }}
            </p>
            <p class="text-sm font-semibold tabular-nums text-slate-900">
              {{ row.count }}
            </p>
            <p class="text-[11px] tabular-nums text-slate-400">
              {{ row.percent }}%
            </p>
          </div>
        </div>
      </section>

      <!-- ================================================================
        Section 3 · Follow-up
        Soft amber task panel listing guests who haven't replied. Dot color
        encodes invitation progress, explained by the mini legend below.
      ================================================================= -->
      <section
        v-if="summary.status_counts.pending > 0"
        class="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 sm:p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-start gap-3">
            <div
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100"
            >
              <BellRing class="h-4 w-4 text-amber-600" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900">
                {{ t('management.rsvpAnalytics.chase.title') }}
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ t('management.rsvpAnalytics.chase.description') }}
              </p>
            </div>
          </div>
          <span
            class="flex-shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-amber-700"
          >
            {{ summary.status_counts.pending }}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="guest in visiblePendingGuests"
            :key="guest.id"
            class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700"
            :title="guest.email || ''"
          >
            <span
              class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              :class="pendingDotClass(guest.invitation_status)"
            />
            <span class="max-w-[180px] truncate font-medium">
              {{ guest.name || t('management.rsvpAnalytics.chase.unnamedGuest') }}
            </span>
          </span>

          <!-- Collapsed: one button stands in for everything beyond the preview -->
          <button
            v-if="!showAllPending && collapsedPendingRemainder > 0"
            type="button"
            class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100/60 px-2.5 py-1 text-[11px] font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100"
            @click="showAllPending = true"
          >
            +{{ collapsedPendingRemainder }} {{ t('management.rsvpAnalytics.chase.moreShort') }}
          </button>
          <button
            v-else-if="showAllPending && summary.pending_guests.length > PENDING_PREVIEW_COUNT"
            type="button"
            class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100/60 px-2.5 py-1 text-[11px] font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100"
            @click="showAllPending = false"
          >
            {{ t('management.rsvpAnalytics.showLess') }}
          </button>
        </div>

        <!-- Backend only returns the first N pending guests inline -->
        <p
          v-if="showAllPending && hiddenPendingCount > 0"
          class="mt-2 text-[10px] text-amber-700/70"
        >
          {{ t('management.rsvpAnalytics.chase.moreHidden', { count: hiddenPendingCount }, hiddenPendingCount) }}
        </p>

        <!-- Invitation-status dot legend -->
        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span
            v-for="item in invitationLegend"
            :key="item.key"
            class="inline-flex items-center gap-1.5 text-[10px] text-slate-500"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="item.dotClass" />
            {{ item.label }}
          </span>
        </div>
      </section>

      <!-- No pending (only when data exists) -->
      <section
        v-else-if="summary.total_invited > 0"
        class="-mt-2 flex items-center gap-2 text-sm text-emerald-700"
      >
        <PartyPopper class="h-4 w-4" />
        <p>{{ t('management.rsvpAnalytics.chase.allResponded') }}</p>
      </section>

      <!-- ================================================================
        Section 4 · Per-question breakdowns
        Each question is a clickable card. Expanding loads drill-through,
        offers an RSVP-status filter, and renders guest chips inline under
        each bar (no duplicate list).
      ================================================================= -->
      <section>
        <div class="mb-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {{ t('management.rsvpAnalytics.questions.title') }}
          </p>
          <p class="mt-1 text-sm text-slate-500">
            {{ t('management.rsvpAnalytics.questions.description') }}
          </p>
        </div>

        <!-- No questions yet -->
        <div
          v-if="summary.question_breakdowns.length === 0"
          class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-6 text-center"
        >
          <MessageSquareText class="mx-auto mb-2 h-10 w-10 text-slate-300" />
          <p class="text-sm font-medium text-slate-600">
            {{ t('management.rsvpAnalytics.questions.emptyState.title') }}
          </p>
          <p class="mx-auto mt-1 max-w-md text-xs text-slate-400">
            {{ t('management.rsvpAnalytics.questions.emptyState.description') }}
          </p>
        </div>

        <!-- Question list -->
        <div v-else class="space-y-3">
          <article
            v-for="(q, qIdx) in summary.question_breakdowns"
            :key="q.question_id"
            class="rounded-2xl border bg-white transition-all duration-200"
            :class="
              isExpanded(q.question_id)
                ? 'border-slate-300 shadow-sm'
                : 'border-slate-200/80 hover:border-slate-300'
            "
          >
            <!-- Header (clickable) -->
            <button
              type="button"
              class="flex w-full items-start justify-between gap-4 rounded-2xl p-4 text-left sm:p-5"
              :aria-expanded="isExpanded(q.question_id)"
              @click="toggleQuestion(q.question_id)"
            >
              <div class="min-w-0 flex-1">
                <p class="break-words text-sm font-semibold text-slate-900">
                  <span class="mr-1.5 font-normal tabular-nums text-slate-300">Q{{ qIdx + 1 }}.</span>
                  {{ localizeQuestionText(q.question_id, q.question_text) }}
                </p>
                <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                  <span>{{ getTypeLabel(q.question_type) }}</span>
                  <span v-if="q.is_required" class="text-rose-600">
                    · {{ t('management.guestGroupsView.rsvpQuestions.requiredBadge') }}
                  </span>
                  <span>
                    · {{ t('management.rsvpAnalytics.questions.answersCount', { count: q.total_answers }, q.total_answers) }}
                  </span>
                </div>
              </div>
              <ChevronDown
                class="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180': isExpanded(q.question_id) }"
              />
            </button>

            <!-- Body — collapsed cards only render a body when there's a
              chart preview to show (choice bars); free-text and unanswered
              questions collapse to just the header, whose meta line already
              carries the answer count. -->
            <div
              v-if="isExpanded(q.question_id) || hasCollapsedPreview(q)"
              class="-mt-1 px-4 pb-4 sm:px-5 sm:pb-5"
            >
              <!-- Drill status filter (only when expanded, with answers) -->
              <div
                v-if="isExpanded(q.question_id) && q.total_answers > 0"
                class="mb-3 flex flex-wrap items-center gap-1.5"
                :title="t('management.rsvpAnalytics.drill.filterHint')"
              >
                <button
                  v-for="option in drillFilterOptions"
                  :key="option.key"
                  type="button"
                  class="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-200"
                  :class="
                    drillFilter === option.value
                      ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  "
                  @click="setDrillFilter(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>

              <!-- No answers yet -->
              <div
                v-if="q.total_answers === 0"
                class="rounded-lg bg-slate-50 p-3 text-center"
              >
                <p class="text-xs text-slate-400">
                  {{ t('management.rsvpAnalytics.questions.noAnswers') }}
                </p>
              </div>

              <!-- Choice breakdown: bars + inline guests when expanded -->
              <div
                v-else-if="q.breakdown && Object.keys(q.breakdown).length > 0"
                class="space-y-3.5"
              >
                <div
                  v-for="row in getVisibleBreakdown(q)"
                  :key="row.label"
                >
                  <div class="flex items-baseline justify-between gap-3">
                    <p
                      class="min-w-0 truncate text-xs font-medium text-slate-700"
                      :title="localizeChoice(q.question_id, row.label)"
                    >
                      {{ localizeChoice(q.question_id, row.label) }}
                    </p>
                    <p class="flex-shrink-0 text-xs tabular-nums">
                      <span class="font-semibold text-slate-900">{{ row.count }}</span>
                      <span class="text-slate-400"> · {{ row.percentOfTotal }}%</span>
                    </p>
                  </div>
                  <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-r-full bg-[#1e90ff] transition-all duration-500"
                      :style="{ width: `${Math.max(row.percentOfTotal, 2)}%` }"
                    />
                  </div>

                  <!-- Inline guest chips for this bar (only when expanded + loaded) -->
                  <div
                    v-if="isExpanded(q.question_id) && getBucketGuests(row.label).length > 0"
                    class="mt-2 flex flex-wrap gap-1"
                  >
                    <span
                      v-for="guest in getVisibleBucketGuests(row.label)"
                      :key="guest.id"
                      class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
                    >
                      <span
                        v-if="guest.group_color"
                        class="h-1 w-1 flex-shrink-0 rounded-full"
                        :style="{ backgroundColor: guest.group_color }"
                      />
                      {{ guest.name }}
                      <span
                        v-if="(guest.plus_ones_count ?? 0) > 0"
                        class="text-slate-400"
                      >+{{ guest.plus_ones_count }}</span>
                    </span>

                    <button
                      v-if="!isBucketExpanded(row.label) && bucketRemainder(row.label) > 0"
                      type="button"
                      class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-200"
                      @click="toggleBucket(row.label)"
                    >
                      +{{ bucketRemainder(row.label) }} {{ t('management.rsvpAnalytics.chase.moreShort') }}
                    </button>
                    <button
                      v-else-if="isBucketExpanded(row.label) && getBucketGuests(row.label).length > BUCKET_PREVIEW_COUNT"
                      type="button"
                      class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-200"
                      @click="toggleBucket(row.label)"
                    >
                      {{ t('management.rsvpAnalytics.showLess') }}
                    </button>
                  </div>
                </div>

                <!-- Collapsed cards cap the option list -->
                <p
                  v-if="!isExpanded(q.question_id) && hiddenChoiceCount(q) > 0"
                  class="text-[11px] text-slate-400"
                >
                  {{ t('management.rsvpAnalytics.questions.moreOptions', { count: hiddenChoiceCount(q) }, hiddenChoiceCount(q)) }}
                </p>
              </div>

              <!-- Free-text: the body only renders when expanded, so this is
                always the drill-through list -->
              <div v-else>
                <div
                  v-if="drillData?.free_text_answers?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="entry in visibleFreeTextAnswers"
                    :key="entry.id"
                    class="rounded-lg bg-slate-50 p-3"
                  >
                    <div class="mb-1 flex items-center justify-between gap-2">
                      <div class="flex min-w-0 items-center gap-1.5">
                        <span
                          v-if="entry.group_color"
                          class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          :style="{ backgroundColor: entry.group_color }"
                        />
                        <p class="truncate text-xs font-semibold text-slate-900">
                          {{ entry.name }}
                        </p>
                        <span
                          v-if="entry.group_name"
                          class="truncate text-[10px] text-slate-400"
                        >· {{ entry.group_name }}</span>
                      </div>
                      <p class="flex-shrink-0 text-[10px] text-slate-400">
                        {{ formatRelativeDate(entry.updated_at) }}
                      </p>
                    </div>
                    <p class="whitespace-pre-line break-words text-sm text-slate-700">
                      {{ entry.answer_text }}
                    </p>
                  </div>

                  <button
                    v-if="!showAllFreeText && freeTextRemainder > 0"
                    type="button"
                    class="text-xs font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
                    @click="showAllFreeText = true"
                  >
                    {{ t('management.rsvpAnalytics.showAll', { count: drillData.free_text_answers.length }) }}
                  </button>
                  <button
                    v-else-if="showAllFreeText && drillData.free_text_answers.length > FREE_TEXT_PREVIEW_COUNT"
                    type="button"
                    class="text-xs font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
                    @click="showAllFreeText = false"
                  >
                    {{ t('management.rsvpAnalytics.showLess') }}
                  </button>
                </div>

                <!-- Expanded but no answers -->
                <div
                  v-else-if="isExpanded(q.question_id) && !drillLoading && !drillError"
                  class="rounded-lg bg-slate-50 p-3 text-center"
                >
                  <p class="text-xs text-slate-400">
                    {{ t('management.rsvpAnalytics.drill.noFreeText') }}
                  </p>
                </div>
              </div>

              <!-- Drill-through loading / error (shared across types) -->
              <div
                v-if="isExpanded(q.question_id) && drillLoading"
                class="mt-3 flex items-center justify-center py-3"
              >
                <div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-emerald-600" />
                <span class="ml-2 text-xs text-slate-500">
                  {{ t('management.rsvpAnalytics.drill.loading') }}
                </span>
              </div>
              <div
                v-else-if="isExpanded(q.question_id) && drillError"
                class="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                {{ drillError }}
              </div>

              <!-- Still-expected list -->
              <div
                v-if="
                  isExpanded(q.question_id) &&
                  drillData &&
                  drillData.guests_without_answer.length > 0
                "
                class="mt-4 border-t border-dashed border-amber-200 pt-3"
              >
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                    {{ t('management.rsvpAnalytics.drill.missingTitle') }}
                  </p>
                  <span class="text-[10px] tabular-nums text-amber-700/70">
                    {{ drillData.guests_without_answer.length }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="guest in visibleMissingGuests"
                    :key="guest.id"
                    class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800"
                  >
                    <span
                      v-if="guest.group_color"
                      class="h-1 w-1 flex-shrink-0 rounded-full"
                      :style="{ backgroundColor: guest.group_color }"
                    />
                    {{ guest.name }}
                  </span>

                  <button
                    v-if="!showAllMissing && collapsedMissingRemainder > 0"
                    type="button"
                    class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100/60 px-2 py-0.5 text-[10px] font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100"
                    @click="showAllMissing = true"
                  >
                    +{{ collapsedMissingRemainder }} {{ t('management.rsvpAnalytics.chase.moreShort') }}
                  </button>
                  <button
                    v-else-if="
                      showAllMissing &&
                      drillData.guests_without_answer.length > MISSING_PREVIEW_COUNT
                    "
                    type="button"
                    class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100/60 px-2 py-0.5 text-[10px] font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100"
                    @click="showAllMissing = false"
                  >
                    {{ t('management.rsvpAnalytics.showLess') }}
                  </button>
                </div>
                <p
                  v-if="showAllMissing && drillData.guests_without_answer_truncated"
                  class="mt-2 text-[10px] text-amber-700/70"
                >
                  {{ t('management.rsvpAnalytics.drill.missingTruncated') }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  BellRing,
  ChevronDown,
  ClipboardList,
  MessageSquareText,
  PartyPopper,
  RefreshCw,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { guestService, rsvpQuestionsService } from '../../services/api'
import type {
  EventRsvpQuestion,
  EventRsvpQuestionType,
  GuestRsvpQuestionBreakdown,
  GuestRsvpStatus,
  GuestRsvpSummary,
  RsvpQuestionResponses,
} from '../../services/api'

const { t, locale } = useAppLanguage()

const props = defineProps<{
  eventId: string
}>()

const loading = ref(false)
const summary = ref<GuestRsvpSummary | null>(null)
// Full question list (with translations) — the `rsvp-summary/` endpoint
// only echoes the base-language `question_text`, so we fetch the question
// list in parallel to get the `translations[]` array for localised labels.
const questions = ref<EventRsvpQuestion[]>([])

const loadSummary = async () => {
  loading.value = true
  try {
    const [summaryRes, questionsRes] = await Promise.all([
      guestService.getGuestsRsvpSummary(props.eventId),
      rsvpQuestionsService.listQuestions(props.eventId),
    ])
    if (summaryRes.success && summaryRes.data) {
      summary.value = summaryRes.data
    }
    if (questionsRes.success && questionsRes.data) {
      questions.value = questionsRes.data
    }
  } finally {
    loading.value = false
  }
}

// Map question_id → full question record (with translations) for quick
// lookup during render. Rebuilt whenever the questions array changes.
const questionsById = computed(() => {
  const map = new Map<number, EventRsvpQuestion>()
  for (const q of questions.value) map.set(q.id, q)
  return map
})

const localizeQuestionText = (
  questionId: number,
  fallback: string,
): string => {
  if (locale.value === 'en') return fallback
  const q = questionsById.value.get(questionId)
  if (!q?.translations) return fallback
  const match = q.translations.find((tr) => tr.language === locale.value)
  return match?.question_text?.trim() || fallback
}

const localizeChoice = (
  questionId: number,
  baseChoice: string,
): string => {
  if (locale.value === 'en') return baseChoice
  const q = questionsById.value.get(questionId)
  if (!q?.choices || !q.translations) return baseChoice
  const idx = q.choices.indexOf(baseChoice)
  if (idx === -1) return baseChoice
  const match = q.translations.find((tr) => tr.language === locale.value)
  const translated = match?.choices?.[idx]?.trim()
  return translated || baseChoice
}

// ---- Metrics -------------------------------------------------------------
const respondedCount = computed(() => {
  if (!summary.value) return 0
  const { attending, maybe, not_attending } = summary.value.status_counts
  return attending + maybe + not_attending
})

const respondedPercent = computed(() => {
  if (!summary.value || summary.value.total_invited === 0) return 0
  return Math.round((respondedCount.value / summary.value.total_invited) * 100)
})

const attendingPercent = computed(() => {
  if (!summary.value || summary.value.total_invited === 0) return 0
  return Math.round(
    (summary.value.status_counts.attending / summary.value.total_invited) * 100,
  )
})

// Plus-ones = expected - attending guests themselves. `total_expected_attendees`
// counts guest + their plus-ones for attendees only, so subtracting the
// attending head count yields just the plus-ones subtotal.
const plusOnesCount = computed(() => {
  if (!summary.value) return 0
  const diff = summary.value.total_expected_attendees - summary.value.status_counts.attending
  return Math.max(0, diff)
})

// The summary only returns the first N pending guests inline. If there
// are more than what's shown, surface the remainder as a "+N more" chip.
const hiddenPendingCount = computed(() => {
  if (!summary.value) return 0
  const listed = summary.value.pending_guests.length
  return Math.max(0, summary.value.status_counts.pending - listed)
})

// Chip walls don't scale — collapse long guest lists to a short preview
// with a "+N more" expander (progressive disclosure).
const PENDING_PREVIEW_COUNT = 8
const showAllPending = ref(false)

const visiblePendingGuests = computed(() => {
  if (!summary.value) return []
  return showAllPending.value
    ? summary.value.pending_guests
    : summary.value.pending_guests.slice(0, PENDING_PREVIEW_COUNT)
})

// Everyone not in the collapsed preview, including guests the backend
// didn't return inline — one number so the button matches the header count.
const collapsedPendingRemainder = computed(() => {
  if (!summary.value) return 0
  return Math.max(0, summary.value.status_counts.pending - PENDING_PREVIEW_COUNT)
})

// Dot color for pending guest chips encodes invitation progression:
// viewed (green) > sent (blue) > not_sent (grey).
const pendingDotClass = (status: 'not_sent' | 'sent' | 'viewed'): string => {
  switch (status) {
    case 'viewed':
      return 'bg-emerald-500'
    case 'sent':
      return 'bg-sky-500'
    default:
      return 'bg-slate-300'
  }
}

// Mini legend explaining the pending-chip dot colors.
const invitationLegend = computed(() => [
  {
    key: 'viewed',
    label: t('management.rsvpAnalytics.chase.status.viewed'),
    dotClass: 'bg-emerald-500',
  },
  {
    key: 'sent',
    label: t('management.rsvpAnalytics.chase.status.sent'),
    dotClass: 'bg-sky-500',
  },
  {
    key: 'not_sent',
    label: t('management.rsvpAnalytics.chase.status.not_sent'),
    dotClass: 'bg-slate-300',
  },
])

// ---- Distribution --------------------------------------------------------
// Responded hues are one step deeper than the usual 500s so every mark
// clears 3:1 contrast on white (validated); pending stays a quiet neutral
// remainder — the legend always carries its label + count.
const statusColors = {
  attending: '#059669', // emerald-600
  maybe: '#d97706', // amber-600
  not_attending: '#e11d48', // rose-600
  pending: '#cbd5e1', // slate-300
}

interface DistributionRow {
  key: 'attending' | 'maybe' | 'not_attending' | 'pending'
  label: string
  count: number
  percent: number
  color: string
}

const distributionRows = computed<DistributionRow[]>(() => {
  if (!summary.value) return []
  const total = summary.value.total_invited || 1
  const c = summary.value.status_counts
  const pct = (n: number) => Math.round((n / total) * 100)

  return [
    {
      key: 'attending',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.going'),
      count: c.attending,
      percent: pct(c.attending),
      color: statusColors.attending,
    },
    {
      key: 'maybe',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.maybe'),
      count: c.maybe,
      percent: pct(c.maybe),
      color: statusColors.maybe,
    },
    {
      key: 'not_attending',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.declined'),
      count: c.not_attending,
      percent: pct(c.not_attending),
      color: statusColors.not_attending,
    },
    {
      key: 'pending',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.pending'),
      count: c.pending,
      percent: pct(c.pending),
      color: statusColors.pending,
    },
  ]
})

// Zero-count segments are dropped from the bar (they'd only add stray gaps)
// but stay in the legend below with an explicit 0.
const visibleSegments = computed(() =>
  distributionRows.value.filter((row) => row.count > 0),
)

// ---- Question breakdowns -------------------------------------------------
const typeLabels: Record<EventRsvpQuestionType, string> = {
  text: 'text',
  long_text: 'long_text',
  yes_no: 'yes_no',
  single_choice: 'single_choice',
  multi_choice: 'multi_choice',
}

const getTypeLabel = (type: string) => {
  const key = typeLabels[type as EventRsvpQuestionType] ?? 'text'
  return t(`management.guestGroupsView.rsvpQuestions.types.${key}`)
}

interface BreakdownRow {
  label: string
  count: number
  percentOfTotal: number
}

const getSortedBreakdown = (q: GuestRsvpQuestionBreakdown): BreakdownRow[] => {
  if (!q.breakdown) return []
  const entries = Object.entries(q.breakdown)
  if (entries.length === 0) return []
  const total = q.total_answers || 1
  return entries
    .map(([label, count]) => ({
      label,
      count,
      percentOfTotal: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

// Collapsed cards only preview the top choice rows; expanding shows all.
const CHOICE_ROWS_PREVIEW_COUNT = 5

const getVisibleBreakdown = (q: GuestRsvpQuestionBreakdown): BreakdownRow[] => {
  const rows = getSortedBreakdown(q)
  return isExpanded(q.question_id) ? rows : rows.slice(0, CHOICE_ROWS_PREVIEW_COUNT)
}

const hiddenChoiceCount = (q: GuestRsvpQuestionBreakdown): number => {
  if (isExpanded(q.question_id)) return 0
  return Math.max(0, getSortedBreakdown(q).length - CHOICE_ROWS_PREVIEW_COUNT)
}

// A collapsed card only renders a body when there are choice bars to
// preview; free-text and unanswered questions collapse to the header alone.
const hasCollapsedPreview = (q: GuestRsvpQuestionBreakdown): boolean =>
  q.total_answers > 0 && !!q.breakdown && Object.keys(q.breakdown).length > 0

// ---- Drill-through -------------------------------------------------------
// Clicking a question expands it and lazy-loads the per-question drill-through
// from `rsvpQuestionsService.getQuestionResponses`. Results are cached by
// question id + status filter so re-expanding or re-filtering is free.
const expandedQuestionId = ref<number | null>(null)
const drillFilter = ref<GuestRsvpStatus | null>(null)
const drillLoading = ref(false)
const drillError = ref<string | null>(null)
const drillData = ref<RsvpQuestionResponses | null>(null)
const drillCache = new Map<string, RsvpQuestionResponses>()

const drillFilterOptions = computed<
  Array<{ key: string; value: GuestRsvpStatus | null; label: string }>
>(() => [
  {
    key: 'all',
    value: null,
    label: t('management.rsvpAnalytics.drill.filterAll'),
  },
  {
    key: 'attending',
    value: 'attending',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.going'),
  },
  {
    key: 'maybe',
    value: 'maybe',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.maybe'),
  },
  {
    key: 'not_attending',
    value: 'not_attending',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.declined'),
  },
])

const isExpanded = (questionId: number) => expandedQuestionId.value === questionId

// Same progressive-disclosure treatment for the "still expected to answer"
// list inside an expanded question. Resets whenever the drill target changes.
const MISSING_PREVIEW_COUNT = 8
const showAllMissing = ref(false)

const visibleMissingGuests = computed(() => {
  const guests = drillData.value?.guests_without_answer ?? []
  return showAllMissing.value ? guests : guests.slice(0, MISSING_PREVIEW_COUNT)
})

const collapsedMissingRemainder = computed(() => {
  const guests = drillData.value?.guests_without_answer ?? []
  return Math.max(0, guests.length - MISSING_PREVIEW_COUNT)
})

// Per-bucket guest chips also collapse to a preview; each choice bucket
// expands independently (keyed by its answer label).
const BUCKET_PREVIEW_COUNT = 8
const expandedBuckets = ref(new Set<string>())

const isBucketExpanded = (label: string) => expandedBuckets.value.has(label)

const toggleBucket = (label: string) => {
  const next = new Set(expandedBuckets.value)
  if (next.has(label)) {
    next.delete(label)
  } else {
    next.add(label)
  }
  expandedBuckets.value = next
}

const getVisibleBucketGuests = (label: string) => {
  const guests = getBucketGuests(label)
  return isBucketExpanded(label) ? guests : guests.slice(0, BUCKET_PREVIEW_COUNT)
}

const bucketRemainder = (label: string) =>
  Math.max(0, getBucketGuests(label).length - BUCKET_PREVIEW_COUNT)

// Free-text answers preview the most recent few, with a show-all toggle.
const FREE_TEXT_PREVIEW_COUNT = 5
const showAllFreeText = ref(false)

const visibleFreeTextAnswers = computed(() => {
  const answers = drillData.value?.free_text_answers ?? []
  return showAllFreeText.value ? answers : answers.slice(0, FREE_TEXT_PREVIEW_COUNT)
})

const freeTextRemainder = computed(() => {
  const answers = drillData.value?.free_text_answers ?? []
  return Math.max(0, answers.length - FREE_TEXT_PREVIEW_COUNT)
})

const loadDrill = async (
  questionId: number,
  filter: GuestRsvpStatus | null,
) => {
  drillError.value = null

  const cacheKey = `${questionId}|${filter ?? 'all'}`
  const cached = drillCache.get(cacheKey)
  if (cached) {
    drillData.value = cached
    return
  }

  drillData.value = null
  drillLoading.value = true
  try {
    const response = await rsvpQuestionsService.getQuestionResponses(
      props.eventId,
      questionId,
      filter ? { rsvp_status: filter } : undefined,
    )
    if (response.success && response.data) {
      drillCache.set(cacheKey, response.data)
      if (
        expandedQuestionId.value === questionId &&
        drillFilter.value === filter
      ) {
        drillData.value = response.data
      }
    } else {
      drillError.value =
        response.message || t('management.rsvpAnalytics.drill.loadError')
    }
  } catch {
    drillError.value = t('management.rsvpAnalytics.drill.loadError')
  } finally {
    drillLoading.value = false
  }
}

const toggleQuestion = (questionId: number) => {
  if (expandedQuestionId.value === questionId) {
    expandedQuestionId.value = null
    drillData.value = null
    drillError.value = null
    return
  }

  expandedQuestionId.value = questionId
  drillFilter.value = null
  showAllMissing.value = false
  showAllFreeText.value = false
  expandedBuckets.value = new Set()
  loadDrill(questionId, null)
}

const setDrillFilter = (filter: GuestRsvpStatus | null) => {
  if (drillFilter.value === filter) return
  drillFilter.value = filter
  showAllMissing.value = false
  showAllFreeText.value = false
  expandedBuckets.value = new Set()
  if (expandedQuestionId.value !== null) {
    loadDrill(expandedQuestionId.value, filter)
  }
}

/**
 * Return the guest list for a given choice bucket in the currently-expanded
 * question's drill-through. Returns an empty array if drill data isn't
 * loaded yet or if this bucket isn't in `grouped_by_answer`. Used to
 * render guest chips inline under each breakdown bar.
 */
const getBucketGuests = (answerLabel: string) => {
  const buckets = drillData.value?.grouped_by_answer
  if (!buckets) return []
  const bucket = buckets.find((b) => b.answer === answerLabel)
  return bucket?.guests ?? []
}

const formatRelativeDate = (iso: string): string => {
  try {
    const date = new Date(iso)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

// ---- Lifecycle -----------------------------------------------------------
onMounted(() => {
  loadSummary()
})

watch(
  () => props.eventId,
  () => {
    drillCache.clear()
    expandedQuestionId.value = null
    drillFilter.value = null
    drillData.value = null
    showAllPending.value = false
    showAllMissing.value = false
    showAllFreeText.value = false
    expandedBuckets.value = new Set()
    loadSummary()
  },
)

defineExpose({ reload: loadSummary })
</script>
