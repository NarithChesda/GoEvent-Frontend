<template>
  <!--
    No app shell. This page is one thing — a catalogue you look through — and
    the top bar, the mobile tab bar and the footer all belong to a product a
    visitor here does not have an account for. What they cost is height, and
    height is exactly what a phone-shaped frame wants. The back link is the only
    navigation the page needs.
  -->
  <div class="tpl-page" :class="{ 'is-viewer': isViewer }">
    <!-- On a phone the page is the studio's mobile preview: the invitation is the
         whole screen and every control lives in the bar at its foot, so the
         header is not drawn at all. The page still needs its name. -->
    <h1 v-if="isViewer" class="sr-only">{{ t('partners.templates.title') }}</h1>

    <header v-else class="tpl-page__head">
      <!--
        The catalogue's column, and everything that steers it. The header bar is
        divided by the same two columns as the body below, so each side's chrome
        sits over the side it belongs to: leaving this track to the back link
        alone put one round arrow in 356px of nothing, while the catalogue
        underneath carried a second row of chrome of its own.
      -->
      <div class="tpl-page__nav">
        <!--
          The label is allowed to be empty — in English it is, and the link is
          then the arrow alone, in a circle. An empty label is not an empty
          name, though: with the icon hidden from the tree there would be
          nothing left to announce, so the accessible name falls back to the
          generic one.
        -->
        <RouterLink
          to="/partners"
          class="tpl-back"
          :class="{ 'is-icon': !backLabel }"
          :aria-label="backName"
        >
          <ArrowLeft class="h-4 w-4 flex-none" aria-hidden="true" />
          <!-- In a span so a phone can drop it: up there the title names the
               page a step to the right, the arrow's own accessible name still
               says where it goes, and in Khmer the label is a 110px pill that
               pushed the language and info controls onto a second row. -->
          <span v-if="backLabel" class="tpl-back__label">{{ backLabel }}</span>
        </RouterLink>

        <!--
          Event-type filter (§9 dropdown), over the column it filters and wide
          enough to fill it — a control that spans its list reads as belonging
          to it, where a 167px pill floating beside a label read as a leftover.
          It carries the running count itself, so the separate "Designs · 47"
          heading is gone: the number belongs on the control that changes it,
          and the shelf headings below already count their own.

          Only when there is more than one type to choose between, and never on
          a phone — there the shelf tabs carry both jobs this row was doing, and
          a visitor browses every type and reads the type off each card. The
          shelves are short enough to flick through that it is a fair trade; if
          it stops being one, the place to put the filter back is inside the tab
          strip, not above it.
        -->
        <div v-if="showCategoryFilter" class="tpl-filter">
          <button
            type="button"
            class="tpl-filter__trigger"
            :aria-expanded="categoryMenuOpen"
            aria-haspopup="listbox"
            @click="categoryMenuOpen = !categoryMenuOpen"
          >
            <Filter class="h-3.5 w-3.5 flex-none text-slate-400" aria-hidden="true" />
            <span class="flex-1 truncate text-left">{{ activeCategoryLabel }}</span>
            <span class="tpl-filter__count">{{ filteredTemplates.length }}</span>
            <ChevronDown
              class="h-4 w-4 flex-none text-slate-400 transition-transform duration-200"
              :class="{ 'rotate-180': categoryMenuOpen }"
              aria-hidden="true"
            />
          </button>

          <div
            v-if="categoryMenuOpen"
            class="tpl-filter__scrim"
            @click="categoryMenuOpen = false"
          />
          <Transition name="tpl-dropdown">
            <div
              v-if="categoryMenuOpen"
              class="tpl-filter__menu"
              role="listbox"
              :aria-label="t('partners.templates.filterLabel')"
            >
              <button
                v-for="option in categoryOptions"
                :key="option.value"
                type="button"
                role="option"
                :aria-selected="option.value === activeCategory"
                class="tpl-filter__item"
                :class="{ 'is-active': option.value === activeCategory }"
                @click="selectCategory(option.value)"
              >
                <span
                  class="tpl-filter__dot"
                  :style="{ backgroundColor: option.color }"
                  aria-hidden="true"
                />
                <span class="flex-1 truncate text-left">{{ option.label }}</span>
                <span class="tpl-filter__count">{{ option.count }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- One event type, nothing to filter: the count still names the
             column, which is what the heading did before it moved. -->
        <p v-else-if="!isNarrow" class="tpl-menu__label">
          {{ t('partners.templates.menuLabel') }}
          <span class="text-slate-400">· {{ filteredTemplates.length }}</span>
        </p>
      </div>

      <div class="tpl-page__headline">
        <h1 class="tpl-page__title type-display-sm">{{ t('partners.templates.title') }}</h1>
        <p class="tpl-page__subtitle">{{ t('partners.templates.subtitle') }}</p>
      </div>

      <!--
        How you are looking at it: how many screens, and in which language. Page
        chrome, not stage furniture — it changes the whole view rather than
        anything about the design on screen — so it sits in the header's trailing
        corner where view controls are looked for, and leaves the space above the
        frames to the one caption that IS about them.

        The layout half is desktop-only: three phone frames never fit a phone.
      -->
      <div
        v-if="hasViewControls"
        class="tpl-seg"
        role="group"
        :aria-label="t('partners.templates.viewControlsLabel')"
      >
        <!-- `v-if`, not a `hidden lg:inline-flex` class pair. A scoped style
             carries the component's data attribute and so outranks Tailwind's
             single-class `.hidden`, which left these two on screen at every
             width — where `isSingleView` is forced true anyway, so the grid
             segment lit up as chosen and then changed nothing. -->
        <template v-if="showLayoutSegments">
          <button
            v-for="option in VIEW_MODES"
            :key="option.value"
            type="button"
            class="tpl-seg__btn"
            :class="{ 'is-active': viewMode === option.value }"
            :title="t(option.labelKey)"
            :aria-label="t(option.labelKey)"
            :aria-pressed="viewMode === option.value"
            @click="setViewMode(option.value)"
          >
            <component :is="option.icon" class="h-4 w-4" aria-hidden="true" />
          </button>
          <span v-if="frameLanguages.length > 1" class="tpl-seg__divider" aria-hidden="true" />
        </template>

        <button
          v-if="frameLanguages.length > 1"
          type="button"
          class="tpl-seg__btn tpl-seg__btn--lang"
          :title="t('partners.templates.switchLanguage')"
          :aria-label="t('partners.templates.switchLanguage')"
          @click="cycleLanguage"
        >
          <Languages class="h-3.5 w-3.5" aria-hidden="true" />
          <span>{{ previewLanguage.toUpperCase() }}</span>
        </button>
      </div>
    </header>

    <!-- Loading, on a phone: the viewer's own black screen with the frame's
         spinner in it. The invitation arrives into exactly this box, so there
         is no outline for the page to resettle from — and the bar is already
         up, so the way back is there from the first frame. -->
    <div v-if="loading && isViewer" class="tpl-viewer">
      <div class="tpl-frame-pending">
        <div class="tpl-spinner" />
      </div>
    </div>

    <!-- Loading: the two halves, in outline. -->
    <div v-else-if="loading" class="tpl-studio">
      <div class="tpl-studio__stage">
        <div class="tpl-stage">
          <div class="tpl-frames tpl-frames--single">
            <div class="tpl-skeleton-frame" />
          </div>
        </div>
      </div>
      <div class="tpl-studio__menu">
        <div class="tpl-menu__scroll">
          <div class="tpl-card-grid">
            <div v-for="n in 6" :key="n" class="tpl-skeleton-card" />
          </div>
        </div>
      </div>
    </div>

    <!-- Nothing to show: the catalogue is unreachable or empty. Same block for
         both, because the visitor's next move is the same either way. -->
    <div v-else-if="!templates.length" class="tpl-empty">
      <span class="tpl-empty__disc">
        <Palette class="h-7 w-7 text-[#2ecc71]" aria-hidden="true" />
      </span>
      <p class="mt-4 text-base font-semibold text-slate-900">
        {{ t('partners.templates.empty.title') }}
      </p>
      <p class="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600">
        {{ t('partners.templates.empty.body') }}
      </p>
      <a :href="TELEGRAM_URL" target="_blank" rel="noopener" class="tpl-empty__cta">
        {{ t('partners.templates.empty.cta') }}
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </a>
    </div>

    <div v-else ref="studioRef" class="tpl-studio" :style="studioStyle">
      <!--
        The phone: the Design Studio's mobile preview, the same screen seen from
        the other side of the counter (MobilePreviewSheet).

        The frame IS the page — edge to edge, at the device's own viewport size,
        with nothing taking layout height from it. So the invitation renders at
        exactly the size a guest's phone gives it: no bezel, no letterbox, no
        scaling, and the showcase's vh/vw units resolve to what a guest gets.
        The last version drew a phone inside the phone, fitted between a top bar
        and a dock, and a 393px screen previewed a 332px invitation.

        One frame on screen at a time, the others held by `v-show` so a stage
        switch is instant once the queue has warmed them. Swipeable, because the
        frame is the whole screen and the stages are a sequence.
      -->
      <div v-if="isViewer" class="tpl-viewer">
        <div
          v-for="frame in visibleFrames"
          v-show="activeFrameId === frame.id"
          :key="frame.id"
          class="tpl-viewer__frame"
        >
          <InertIframe
            v-if="mountedFrameIds.has(frame.id)"
            :ref="(el) => setFrameRef(frame.id, el)"
            :src="frameUrl(frame)"
            :click-message="frame.clickMessage"
            :swipeable="visibleFrames.length > 1"
            @ready="onFrameReady(frame.id)"
            @loaded="onFrameLoaded"
            @languages="onFrameLanguages"
            @swipe="onFrameSwipe"
          />
          <div v-else class="tpl-frame-pending">
            <div class="tpl-spinner" />
          </div>
        </div>
      </div>

      <!--
        The invitation, first in the DOM and on the left: it is the payload.
      -->
      <div v-else class="tpl-studio__stage">
        <!--
          Stage picker ABOVE the frame, centred on it: three moments of one
          flow, and the phone they belong to directly under them. One row,
          never two — it wraps to nothing and scrolls sideways instead, because
          a second row would come straight off the height of the phone below.

          It costs nothing net, because the frame's own caption comes off when
          the picker is up (see :label below): the picker already names the
          stage, and two labels for one screen is one too many.
        -->
        <div class="tpl-stage">
          <div v-if="showStagePicker" class="tpl-stagebar">
            <div class="tpl-steps" role="group" :aria-label="t('partners.templates.stageLabel')">
              <button
                v-for="frame in visibleFrames"
                :key="frame.id"
                type="button"
                class="tpl-step"
                :class="{ 'is-active': activeFrameId === frame.id }"
                :aria-pressed="activeFrameId === frame.id"
                @click="activeFrameId = frame.id"
              >
                {{ t(frame.labelKey) }}
              </button>
            </div>
          </div>

          <div ref="framesRef" class="tpl-frames" :class="framesLayoutClass">
            <PreviewFrame
              v-for="frame in visibleFrames"
              :key="frame.id"
              v-show="isSingleView ? activeFrameId === frame.id : true"
              :ref="(el) => setPreviewFrameRef(frame.id, el)"
              :label="frameLabel(frame)"
              :fit-height="false"
              :max-width="frameMaxWidth"
              :width-override="sharedColumnWidth"
            >
              <InertIframe
                v-if="mountedFrameIds.has(frame.id)"
                :ref="(el) => setFrameRef(frame.id, el)"
                :src="frameUrl(frame)"
                :click-message="frame.clickMessage"
                @ready="onFrameReady(frame.id)"
                @loaded="onFrameLoaded"
                @languages="onFrameLanguages"
              />
              <div v-else class="tpl-frame-pending">
                <div class="tpl-spinner" />
              </div>
            </PreviewFrame>
          </div>
        </div>

        <!--
          The one thing a still screenshot cannot say, and the reason this is a
          live preview at all: the invitation is the partner's product, with the
          partner's mark on it.
        -->
        <p class="tpl-note">{{ t('partners.templates.note') }}</p>
      </div>

      <!--
        The catalogue, on the right and made of artwork. A column of names told a
        visitor nothing they could judge — a design is chosen by looking at it,
        which is why the browse-templates modal has always been a grid of preview
        images, and why this is the same card in the same 9:16 proportions.

        Two axes, both from the template's plan: event type is the filter (there
        can be eight, and one matches the customer in front of you), the plan is
        the grouping (there are two or three, and a partner wants the cheap shelf
        and the expensive shelf visible at once).

        Desktop only. A phone gets the studio's own menu, below.
      -->
      <!-- Named by the heading that used to sit inside it: the landmark keeps
           its name in the accessibility tree now that the visible row has moved
           into the header. -->
      <aside v-if="!isViewer" class="tpl-studio__menu" :aria-label="t('partners.templates.menuLabel')">
        <div class="tpl-menu__scroll">
          <section
            v-for="group in groupedTemplates"
            :key="group.key"
            class="tpl-menu-group"
            :aria-label="group.label"
          >
            <h2 class="tpl-menu-group__head">
              {{ group.label }}
              <span class="text-slate-400">· {{ group.templates.length }}</span>
            </h2>

            <div class="tpl-card-grid" role="listbox" :aria-label="group.label">
              <button
                v-for="template in group.templates"
                :key="template.id"
                type="button"
                role="option"
                :aria-selected="template.id === activeTemplateId"
                class="tpl-card"
                :class="{ 'is-active': template.id === activeTemplateId }"
                @click="selectTemplate(template.id)"
              >
                <!-- 9:16, the proportion the artwork is authored at (1080x1920)
                     and the same one the browse modal uses. -->
                <span class="tpl-card__art">
                  <img
                    v-if="thumbnailFor(template)"
                    :src="thumbnailFor(template)!"
                    :alt="template.name"
                    loading="lazy"
                    class="tpl-card__img"
                    @error="onThumbnailError(template.id)"
                  />
                  <span v-else class="tpl-card__fallback" aria-hidden="true">
                    <ImageOff class="h-7 w-7" />
                  </span>

                  <!-- Chosen. A tick disc rather than a filled card: the artwork
                       is the thing being judged and must not be tinted. -->
                  <span
                    v-if="template.id === activeTemplateId"
                    class="tpl-card__tick"
                    aria-hidden="true"
                  >
                    <Check class="h-3.5 w-3.5" />
                  </span>

                  <!-- Name over a scrim on artwork, on a light strip where there
                       is none — so the label is legible either way. -->
                  <span class="tpl-card__label" :class="{ 'is-plain': !thumbnailFor(template) }">
                    <span class="tpl-card__name">{{ template.name }}</span>
                    <span
                      v-if="!activeCategory && categoryNameFor(template)"
                      class="tpl-card__meta"
                    >
                      {{ categoryNameFor(template) }}
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </aside>

      <!--
        The phone's catalogue: the Design Studio's own template menu
        (BrowseTemplateModal's phone layout), so a partner meets one menu whether
        they are choosing a design for a customer's event or browsing them here.
        Same search pill, same package and category buttons opening the same
        bottom sheets, same cards — its classes come from the modal's shared
        vocabulary (templateUi.ts) and its cards are the modal's TemplateCard.

        It takes the whole screen, and the bar stays over its foot: the Templates
        button that opened it is also the way back, beside the stages it will
        return you to. Picking a design puts it away, because the design is what
        you came to see.

        Kept mounted and hidden rather than `v-if`, so a toggle in the middle of
        its entrance retargets instead of restarting — and so a visitor's search
        and scroll position are still there the next time they open it.
      -->
      <div
        v-else
        class="tpl-menu-sheet"
        :class="{ 'is-open': browseOpen }"
        role="dialog"
        :aria-label="t('management.browseTemplateModal.title')"
      >
        <!-- The modal's mobile search row: search, package, category, close. -->
        <div class="tpl-menu-sheet__head">
          <div class="relative flex-1">
            <Search
              class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <!-- `text-base`: at 16px iOS does not zoom the page on focus. -->
            <input
              v-model="menuQuery"
              type="text"
              enterkeyhint="search"
              :placeholder="t('management.browseTemplateModal.search.placeholder')"
              :aria-label="t('management.browseTemplateModal.search.ariaLabel')"
              :class="[SEARCH_FIELD, 'h-10 pl-11 pr-4 text-base']"
            />
          </div>

          <!-- Only when there is a choice: a filter over one option can only
               ever be "All", and an icon that does nothing is noise. -->
          <button
            v-if="groupedTemplates.length > 1"
            type="button"
            aria-haspopup="dialog"
            :aria-expanded="planSheetOpen"
            :aria-label="planChipLabel"
            :class="filterIconClass(menuPlan !== '')"
            @click="planSheetOpen = true"
          >
            <component :is="planIcon(menuPlan)" class="h-[1.125rem] w-[1.125rem]" />
          </button>

          <button
            v-if="categories.length > 1"
            type="button"
            aria-haspopup="dialog"
            :aria-expanded="categorySheetOpen"
            :aria-label="categoryChipLabel"
            :class="filterIconClass(activeCategory !== '')"
            @click="categorySheetOpen = true"
          >
            <component
              :is="activeCategory ? getCategoryIcon(activeCategory) : Sparkles"
              class="h-[1.125rem] w-[1.125rem]"
            />
          </button>

          <button
            type="button"
            :class="[BTN_ICON, 'h-10 w-10']"
            :aria-label="t('management.browseTemplateModal.closeModal')"
            @click="browseOpen = false"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="tpl-menu-sheet__body">
          <!--
            Whose invitation this is — desktop says it under the frames. On a
            phone there is no "under": the invitation is the whole screen, and a
            sentence floated over it would sit on the artwork being judged. Here
            it is read at the moment it matters, while choosing a design, and
            scrolls away with the first row.
          -->
          <p class="tpl-menu-sheet__note">{{ t('partners.templates.note') }}</p>

          <TemplateGrid
            v-if="menuCards.length"
            :templates="menuCards"
            :selected-template-id="activeTemplateId"
            hide-price
            @select-template="(template) => selectTemplate(template.id)"
          />

          <TemplateEmptyState v-else :has-filters="menuHasFilters" @clear-filters="clearMenuFilters" />
        </div>
      </div>

      <!-- Package sheet — the modal's, row for row. The one difference is what
           it lists: this catalogue groups by each plan's own name, never by a
           folded basic/standard tier, because credits are plan-scoped. -->
      <Transition name="tpl-fade">
        <div
          v-if="isViewer && planSheetOpen"
          class="tpl-filter-sheet__scrim"
          @click="planSheetOpen = false"
        />
      </Transition>
      <Transition name="tpl-bottom-sheet">
        <div
          v-if="isViewer && planSheetOpen"
          role="dialog"
          aria-modal="true"
          :aria-label="t('management.browseTemplateModal.sidebar.packageLabel')"
          class="tpl-filter-sheet"
        >
          <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-300" aria-hidden="true" />
          <h3 :class="[SECTION_HEADING, 'px-5 pb-1 pt-4']">
            {{ t('management.browseTemplateModal.sidebar.packageLabel') }}
          </h3>
          <div class="max-h-[60vh] overflow-y-auto overscroll-contain py-1">
            <button
              v-for="option in planOptions"
              :key="option.value || 'all'"
              type="button"
              :aria-pressed="menuPlan === option.value"
              class="flex w-full items-center gap-3 px-5 py-2.5 transition-colors active:bg-slate-50"
              @click="selectMenuPlan(option.value)"
            >
              <span
                :class="[
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors',
                  menuPlan === option.value
                    ? 'bg-gradient-to-br from-[#2ecc71]/15 to-[#1e90ff]/15 ring-1 ring-sky-300'
                    : 'bg-slate-100',
                ]"
              >
                <component
                  :is="planIcon(option.value)"
                  :class="['h-[1.125rem] w-[1.125rem]', optionIconClass(menuPlan === option.value)]"
                />
              </span>
              <span
                :class="[
                  'flex-1 truncate text-left text-sm',
                  menuPlan === option.value ? 'font-semibold text-slate-900' : 'font-medium text-slate-700',
                ]"
                >{{ option.label }}</span
              >
              <Check v-if="menuPlan === option.value" class="h-5 w-5 flex-shrink-0 text-[#1e90ff]" />
            </button>
          </div>
        </div>
      </Transition>

      <!-- Category sheet — the modal's, row for row. -->
      <Transition name="tpl-fade">
        <div
          v-if="isViewer && categorySheetOpen"
          class="tpl-filter-sheet__scrim"
          @click="categorySheetOpen = false"
        />
      </Transition>
      <Transition name="tpl-bottom-sheet">
        <div
          v-if="isViewer && categorySheetOpen"
          role="dialog"
          aria-modal="true"
          :aria-label="t('management.browseTemplateModal.sidebar.categoryLabel')"
          class="tpl-filter-sheet"
        >
          <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-slate-300" aria-hidden="true" />
          <h3 :class="[SECTION_HEADING, 'px-5 pb-1 pt-4']">
            {{ t('management.browseTemplateModal.sidebar.categoryLabel') }}
          </h3>
          <div class="max-h-[60vh] overflow-y-auto overscroll-contain py-1">
            <button
              type="button"
              :aria-pressed="activeCategory === ''"
              class="flex w-full items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
              @click="selectMenuCategory('')"
            >
              <span
                class="h-3 w-3 flex-shrink-0 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
                aria-hidden="true"
              />
              <span
                :class="[
                  'flex-1 text-left text-sm',
                  activeCategory === '' ? 'font-semibold text-slate-900' : 'font-medium text-slate-700',
                ]"
                >{{ t('management.browseTemplateModal.filters.all') }}</span
              >
              <Check v-if="activeCategory === ''" class="h-5 w-5 flex-shrink-0 text-[#1e90ff]" />
            </button>
            <button
              v-for="category in categories"
              :key="category.value"
              type="button"
              :aria-pressed="activeCategory === category.value"
              class="flex w-full items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
              @click="selectMenuCategory(category.value)"
            >
              <span
                class="h-3 w-3 flex-shrink-0 rounded-full"
                :style="{ backgroundColor: category.color }"
                aria-hidden="true"
              />
              <span
                :class="[
                  'flex-1 truncate text-left text-sm',
                  activeCategory === category.value
                    ? 'font-semibold text-slate-900'
                    : 'font-medium text-slate-700',
                ]"
                >{{ category.label }}</span
              >
              <Check
                v-if="activeCategory === category.value"
                class="h-5 w-5 flex-shrink-0 text-[#1e90ff]"
              />
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!--
      The phone's controls: the studio's mobile-preview bar (MobilePreviewSheet),
      so a partner sees one preview whether they are browsing designs here or
      editing their own in the studio.

      One icon-only pill floating over the foot of the invitation, so the whole
      control surface costs the invitation no layout height at all. Labels are
      one press-and-hold away, never permanent. The way out leads; the stages sit
      in an inset track so they read as one control rather than three loose
      icons among the others; the two ways of changing how you are looking —
      language and design — close it.

      It dims and sinks when left alone, because it sits on the artwork it exists
      to show — all of it but Templates, which stays lit, and none of it while
      the menu is open. Dimmed is not disabled: the press that wakes it also does
      what it was pressed for.
    -->
    <div v-if="isViewer" ref="dockRef" class="tpl-bar-dock">
      <nav
        class="tpl-bar"
        :class="{ 'is-idle': barIdle }"
        :aria-label="t('partners.templates.viewControlsLabel')"
        @pointerdown="wakeChrome"
        @focusin="wakeChrome"
      >
        <!-- An arrow, not the studio's X: that one closes a sheet, this one
             leaves the page. -->
        <RouterLink to="/partners" class="tpl-bar__btn" :aria-label="backName">
          <ArrowLeft class="h-5 w-5" aria-hidden="true" />
          <span class="tpl-bar__tooltip" aria-hidden="true">{{ backName }}</span>
        </RouterLink>

        <div
          v-if="!loading && visibleFrames.length > 1"
          class="tpl-bar__seg"
          role="group"
          :aria-label="t('partners.templates.stageLabel')"
        >
          <button
            v-for="frame in visibleFrames"
            :key="frame.id"
            type="button"
            class="tpl-bar__btn tpl-bar__btn--seg"
            :class="{ 'is-active': activeFrameId === frame.id }"
            :aria-pressed="activeFrameId === frame.id"
            :aria-label="t(frame.labelKey)"
            @click="selectStage(frame.id)"
          >
            <component :is="stageIcon(frame.id)" class="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
            <span class="tpl-bar__tooltip" aria-hidden="true">{{ t(frame.labelKey) }}</span>
          </button>
        </div>

        <button
          v-if="frameLanguages.length > 1"
          type="button"
          class="tpl-bar__btn tpl-bar__btn--lang"
          :aria-label="t('partners.templates.switchLanguage')"
          @click="cycleLanguage"
        >
          {{ previewLanguage.toUpperCase() }}
          <span class="tpl-bar__tooltip" aria-hidden="true">
            {{ t('partners.templates.switchLanguage') }}
          </span>
        </button>

        <!--
          Templates: the studio's primary button, carried over — the brand
          gradient, the palette, and the studio's own word for it. Choosing a
          design is what this page is for, so it is the one control on the bar
          that carries a label, and it sits last, under the thumb.

          The label is also what keeps it from reading as a fourth stage: the
          gradient means "you are here" in the track and "this is the action"
          here (templateUi's two sanctioned uses), and a word is the difference
          between the two. On the narrowest phones the word goes and the gradient
          stays, exactly as the studio's own button does when its row runs short.
        -->
        <button
          v-if="!loading"
          type="button"
          class="tpl-bar__btn tpl-bar__btn--menu"
          :aria-expanded="browseOpen"
          :aria-label="t('management.templatePaymentTab.browseBtn.templates')"
          @click="toggleBrowse"
        >
          <Palette class="h-[1.125rem] w-[1.125rem] flex-none" aria-hidden="true" />
          <span class="tpl-bar__menu-label" aria-hidden="true">
            {{ t('management.templatePaymentTab.browseBtn.templates') }}
          </span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The public design catalogue.
 *
 * The Design Studio's live preview with the editing taken out: this page's
 * audience is people with no account, so there is nothing to sign in to and
 * nothing of theirs to render. It embeds the same <PreviewFrame>/<InertIframe>
 * pair against a route that draws somebody else's invitation instead
 * (TemplateShowcasePreviewFrameView), and resolves which stages exist through
 * the same renderer registry — so a stage shown here is a stage a guest gets.
 *
 * The invitation is a real published event, flagged for the job on the backend
 * and picked to MATCH the design's own event type — a funeral design has to be
 * judged on a funeral. The page picks one per category and hands the same id to
 * every frame (useTemplatePreviewEvents); three frames choosing for themselves
 * would show three different weddings, which reads as three different designs.
 * Nothing published for a category falls back to the bundled sample, so the
 * catalogue is never empty.
 *
 * A page rather than a section on `/partners`, which is where it started: three
 * phone frames plus a catalogue is a full screen's worth of furniture, and it
 * was squeezing both into the middle of a page whose job is to make an argument.
 * The offer links here instead.
 *
 * It renders WITHOUT `MainLayout`, deliberately. The top bar, the mobile tab bar
 * and the contact FAB all belong to a product a visitor here has no account for,
 * and what they cost is vertical space — which is the one thing a page of
 * phone-shaped frames is short of. A single back link to `/partners` is all the
 * navigation it needs. `MainLayout` is pure chrome (no provides, no side
 * effects), so dropping it costs nothing else.
 *
 * Switching templates never reloads a frame. The page fetches the chosen
 * template's public assets ONCE and pushes them into every mounted frame over
 * the preview bridge (`preview-template`), which is the same live try-on the
 * templates modal uses. Changing an <iframe>'s `src` would re-navigate it, and
 * with three frames that is three full app boots per click.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Filter,
  ImageOff,
  Layers,
  LayoutGrid,
  Languages,
  Palette,
  Search,
  Smartphone,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-vue-next'
import PreviewFrame from '@/components/showcase-preview/PreviewFrame.vue'
import TemplateGrid from '@/components/template/TemplateGrid.vue'
import TemplateEmptyState from '@/components/template/TemplateEmptyState.vue'
import { getCategoryIcon } from '@/components/template/categoryIcons'
import {
  BTN_ICON,
  SEARCH_FIELD,
  SECTION_HEADING,
  filterIconClass,
  optionIconClass,
} from '@/components/template/templateUi'
import { previewStageIcon as stageIcon } from '@/components/showcase-preview/previewStageIcons'
import {
  PREVIEW_FRAME_MAX_WIDTH,
  usePreviewFrameAspect,
} from '@/components/showcase-preview/previewFrameSize'
import InertIframe from '@/components/showcase-preview/InertIframe.vue'
import {
  resolvePreviewRenderer,
  type PreviewFrameDescriptor,
} from '@/components/showcase-preview/renderers/resolvePreviewRenderer'
import { eventTemplateService, packagePlanService } from '@/services/api'
import { useTemplatePreviewEvents } from '@/composables/showcase-preview/useTemplatePreviewEvents'
import type { EventTemplate, PackagePlan, PublicEventTemplate } from '@/services/api'
// The showcase's own TemplateAssets, not the API types' flat one: this is the
// shape the preview bridge and the renderer registry both speak.
import type { TemplateAssets } from '@/composables/useEventShowcase'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t, locale } = useAppLanguage()

const TELEGRAM_URL = 'https://t.me/goeventkh'

/**
 * The back link's label, which a locale is allowed to leave empty — English
 * does, and the link is then the arrow alone. Read once because three separate
 * things turn on it: what it says, what it is called in the accessibility tree,
 * and what shape it is.
 */
const backLabel = computed(() => t('partners.templates.back'))

/** What the back link is called when its label is empty, and on the phone's
 *  bar, where it is an icon and nothing else. */
const backName = computed(() => backLabel.value || t('common.actions.back'))

// ---------------------------------------------------------------------------
// The catalogue
// ---------------------------------------------------------------------------

const loading = ref(true)
const templates = ref<PublicEventTemplate[]>([])
const plans = ref<PackagePlan[]>([])
const activeTemplateId = ref<number | null>(null)

/** Enough pages to cover a catalogue that has grown, without an unbounded walk. */
const MAX_CATALOGUE_PAGES = 4

/**
 * Approved, and V1.
 *
 * The preview renderer registry is V1-only today (see resolvePreviewRenderer),
 * so a V2 scroll-story template drawn through V1's cover/transition/main frames
 * would be a misrepresentation, not a preview. Absent means V1 — the field is
 * new, and every template that predates it is one.
 */
const isPreviewable = (template: PublicEventTemplate): boolean =>
  template.status === 'approved' && template.showcase_template_version !== 'v2'

const loadCatalogue = async () => {
  try {
    const collected: PublicEventTemplate[] = []
    for (let page = 1; page <= MAX_CATALOGUE_PAGES; page++) {
      const response = await eventTemplateService.listPublicTemplates({ page })
      if (!response.success || !response.data) break
      collected.push(...(response.data.results ?? []))
      if (!response.data.next) break
    }
    templates.value = collected.filter(isPreviewable)
  } catch {
    templates.value = []
  } finally {
    loading.value = false
  }
}

/**
 * The plans, which is where both of the catalogue's axes come from: a template
 * points at a plan, and a plan carries the event category and the tier name.
 * Best-effort — without them the list still renders, ungrouped.
 */
const loadPlans = async () => {
  try {
    const response = await packagePlanService.listPlans()
    if (!response.success || !response.data) return
    const data = response.data as PackagePlan[] | { results?: PackagePlan[] }
    plans.value = Array.isArray(data) ? data : (data.results ?? [])
  } catch {
    plans.value = []
  }
}

const planFor = (template: PublicEventTemplate): PackagePlan | undefined =>
  plans.value.find((plan) => plan.id === template.package_plan)

const categoryNameFor = (template: PublicEventTemplate): string =>
  planFor(template)?.category?.name ?? ''

/** The roster of real events the frames may be drawn through. See the composable. */
const { loadTemplatePreviewEvents, previewEventFor } = useTemplatePreviewEvents()

// ---------------------------------------------------------------------------
// Axis 1 — event type, as a filter
// ---------------------------------------------------------------------------

const activeCategory = ref('')
const categoryMenuOpen = ref(false)

interface CategoryOption {
  value: string
  label: string
  count: number
  color: string
}

/** Built from the templates, not from the plan list: a category nobody has a
 *  design for is a filter that can only ever empty the page. */
const categories = computed<CategoryOption[]>(() => {
  const byName = new Map<string, CategoryOption>()
  for (const template of templates.value) {
    const category = planFor(template)?.category
    if (!category?.name) continue
    const existing = byName.get(category.name)
    if (existing) existing.count += 1
    else
      byName.set(category.name, {
        value: category.name,
        label: category.name,
        count: 1,
        color: category.color || '#94a3b8',
      })
  }
  return [...byName.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const categoryOptions = computed<CategoryOption[]>(() => [
  {
    value: '',
    label: t('partners.templates.allCategories'),
    count: templates.value.length,
    color: '#cbd5e1',
  },
  ...categories.value,
])

const activeCategoryLabel = computed(
  () =>
    categoryOptions.value.find((option) => option.value === activeCategory.value)?.label ??
    t('partners.templates.allCategories'),
)

/**
 * The filter is desktop-only chrome AND only earns its place when there is more
 * than one event type in the catalogue — one condition, asked in two places
 * (the control, and the heading that stands in for it).
 */
const showCategoryFilter = computed(() => !isNarrow.value && categories.value.length > 1)

const filteredTemplates = computed(() =>
  activeCategory.value
    ? templates.value.filter((template) => categoryNameFor(template) === activeCategory.value)
    : templates.value,
)

const selectCategory = (value: string) => {
  activeCategory.value = value
  categoryMenuOpen.value = false
}

// ---------------------------------------------------------------------------
// Axis 2 — plan, as the grouping
// ---------------------------------------------------------------------------

/**
 * Group by the plan's own NAME, never by a normalised "basic/standard" tier.
 * Credits are plan-scoped and not interchangeable, so "Free Basic" and "Basic"
 * are different products at different prices; folding them into one heading
 * would tell a partner they can spend one on the other.
 */
const planRank = (name: string): number => {
  const lower = name.toLowerCase()
  if (lower.includes('free')) return 0
  if (lower.includes('basic')) return 1
  if (lower.includes('standard')) return 2
  return 3
}

interface TemplateGroup {
  key: string
  label: string
  templates: PublicEventTemplate[]
}

const groupedTemplates = computed<TemplateGroup[]>(() => {
  const byPlan = new Map<string, TemplateGroup>()
  for (const template of filteredTemplates.value) {
    const label = planFor(template)?.name || t('partners.templates.otherPlan')
    const group = byPlan.get(label)
    if (group) group.templates.push(template)
    else byPlan.set(label, { key: label, label, templates: [template] })
  }
  return [...byPlan.values()].sort(
    (a, b) => planRank(a.label) - planRank(b.label) || a.label.localeCompare(b.label),
  )
})

/**
 * The catalogue in the order it is actually shown — grouped by plan, not in the
 * order the API returned it.
 *
 * This is what "the first design" means to a visitor, and the two are not the
 * same list: the API's first template belongs to the Standard group, which sits
 * three shelves down. Seeding the selection from the API order opened the page
 * previewing a design whose card was scrolled far out of sight, with no visible
 * tick anywhere in the catalogue.
 */
const orderedTemplates = computed(() => groupedTemplates.value.flatMap((group) => group.templates))

// ---------------------------------------------------------------------------
// The phone's menu — the studio's template menu, on this catalogue's two axes
// ---------------------------------------------------------------------------

/** Free text, matched against a design's name and its event type. */
const menuQuery = ref('')

/**
 * The plan the phone's menu is narrowed to, by the plan's own name — the
 * shelves' key, for the reason planRank gives. '' is every plan. The studio's
 * package filter folds plans into Basic / Standard; this one cannot.
 */
const menuPlan = ref('')

const planSheetOpen = ref(false)
const categorySheetOpen = ref(false)

/** "All", then each plan the current event type offers, cheapest first. */
const planOptions = computed(() => [
  { value: '', label: t('management.browseTemplateModal.filters.all') },
  ...groupedTemplates.value.map((group) => ({ value: group.key, label: group.label })),
])

// A plan chosen under one event type may not be offered under the next, and a
// filter nobody can see or change must not keep emptying the grid.
watch(groupedTemplates, (groups) => {
  if (menuPlan.value && !groups.some((group) => group.key === menuPlan.value)) menuPlan.value = ''
})

/** The studio package filter's glyphs, and the card's: a crown for a standard
 *  tier, sparkles for the rest, layers for all of them. */
const planIcon = (plan: string): LucideIcon => {
  if (!plan) return Layers
  return plan.toLowerCase().includes('standard') ? Crown : Sparkles
}

// Each button is named for what it filters until something is chosen, then for
// the choice — the studio's rule, so neither ever reads a bare "All".
const planChipLabel = computed(
  () => menuPlan.value || t('management.browseTemplateModal.sidebar.packageLabel'),
)
const categoryChipLabel = computed(
  () => activeCategory.value || t('management.browseTemplateModal.sidebar.categoryLabel'),
)

const selectMenuPlan = (plan: string) => {
  menuPlan.value = plan
  planSheetOpen.value = false
}

const selectMenuCategory = (category: string) => {
  selectCategory(category)
  categorySheetOpen.value = false
}

/** The shelves in their own order, narrowed by the plan and the search. */
const menuTemplates = computed(() => {
  const query = menuQuery.value.trim().toLowerCase()
  return groupedTemplates.value
    .filter((group) => !menuPlan.value || group.key === menuPlan.value)
    .flatMap((group) => group.templates)
    .filter(
      (template) =>
        !query ||
        template.name.toLowerCase().includes(query) ||
        categoryNameFor(template).toLowerCase().includes(query),
    )
})

/**
 * Each design in the shape the studio's TemplateCard reads.
 *
 * The public list carries a plan id where the card wants the plan itself, so it
 * is joined here. Only what a card draws is filled in — colours, fonts and
 * assets are the frames' business and reach them over the bridge.
 * `youtube_preview_url` is left off on purpose: on the chosen card it turns
 * into a "Preview" button out to a recorded video, and on this page the live
 * invitation behind the menu IS the preview.
 */
const toCard = (template: PublicEventTemplate): EventTemplate => {
  const plan = planFor(template)
  return {
    id: template.id,
    name: template.name,
    preview_image: template.preview_image ?? '',
    template_colors: [],
    template_fonts: [],
    package_plan: {
      id: plan?.id ?? 0,
      name: plan?.name || t('partners.templates.otherPlan'),
      price: plan?.price ?? '0',
      commission: plan?.commission ?? '0',
      features: plan?.features ?? [],
      category: plan?.category,
    },
  }
}

const menuCards = computed(() => menuTemplates.value.map(toCard))

const menuHasFilters = computed(() =>
  Boolean(menuQuery.value.trim() || menuPlan.value || activeCategory.value),
)

const clearMenuFilters = () => {
  menuQuery.value = ''
  menuPlan.value = ''
  selectCategory('')
}

// Filtering can retire the design on screen; land on the first one that survived
// rather than previewing something no longer in the list.
watch(orderedTemplates, (list) => {
  if (!list.length) return
  if (!list.some((template) => template.id === activeTemplateId.value)) {
    selectTemplate(list[0].id)
  }
})

// ---------------------------------------------------------------------------
// Thumbnails
// ---------------------------------------------------------------------------

/**
 * A stored `preview_image` is not a promise that the file is still there — the
 * gradient placeholder beside it is already the right answer for a template
 * with none, so a broken one falls back to it rather than leaving the browser's
 * broken-image glyph in a list of designs.
 */
const brokenThumbnails = ref(new Set<number>())

const thumbnailFor = (template: PublicEventTemplate): string | null =>
  template.preview_image && !brokenThumbnails.value.has(template.id) ? template.preview_image : null

const onThumbnailError = (templateId: number) => {
  brokenThumbnails.value = new Set(brokenThumbnails.value).add(templateId)
}

// ---------------------------------------------------------------------------
// The selected template's own assets — fetched once here, pushed to every frame
// ---------------------------------------------------------------------------

const activeTemplateData = ref<TemplateAssets | null>(null)
const templateDataCache = new Map<number, TemplateAssets>()

const loadTemplateData = async (templateId: number) => {
  const cached = templateDataCache.get(templateId)
  if (cached) {
    activeTemplateData.value = cached
    pushTemplateToFrames()
    return
  }
  try {
    const response = await eventTemplateService.getPublicTemplateAssets(templateId)
    // Wire shape is `{ template_data: {...} }`, not the flat TemplateAssets the
    // service's type declares — same as every other caller of this endpoint.
    const templateData = (response.data as unknown as { template_data?: TemplateAssets } | null)
      ?.template_data
    if (!response.success || !templateData) return
    templateDataCache.set(templateId, templateData)
    // A slow response for a design the visitor has already clicked past must not
    // overwrite the one they are looking at now.
    if (activeTemplateId.value !== templateId) return
    activeTemplateData.value = templateData
    pushTemplateToFrames()
  } catch {
    // Non-fatal — the frames keep showing whatever they last had.
  }
}

const selectTemplate = (templateId: number) => {
  // Before the early return, and so it also fires for the design already on
  // screen: on a phone the catalogue is a sheet standing over the invitation,
  // so picking is the end of browsing and the sheet's job is to get out of the
  // way. Tapping the ticked card is "yes, this one" — a tap that does
  // nothing at all, not even dismiss, reads as a tap that did not land.
  browseOpen.value = false
  if (templateId === activeTemplateId.value) return
  activeTemplateId.value = templateId
  void loadTemplateData(templateId)
}

// ---------------------------------------------------------------------------
// Which invitation the design is drawn through
// ---------------------------------------------------------------------------

const activeTemplate = computed(
  () => templates.value.find((template) => template.id === activeTemplateId.value) ?? null,
)

/**
 * The event every frame draws, chosen for the design on screen.
 *
 * The category comes from the same place both of the catalogue's axes do — the
 * template's package plan — so a design filed under Funeral is previewed on a
 * funeral, not on the wedding that used to stand in for everything. `null` is a
 * normal answer (nothing published for that type, or the backend flag not live
 * yet) and means "the bundled sample", which is what the frames did before.
 */
const previewEventId = computed(() => {
  const template = activeTemplate.value
  if (!template) return null
  return previewEventFor(planFor(template)?.category?.id ?? null)
})

// ---------------------------------------------------------------------------
// Which stages this template has — the same registry the studio resolves from,
// fed the template's own assets and stage modes.
// ---------------------------------------------------------------------------

const rendererContext = computed(() => {
  const assets = activeTemplateData.value?.assets
  return {
    // The sample invitation ships no film of its own, so a filmed middle beat is
    // the template's to provide.
    event: { event_video: null },
    templateAssets: {
      standard_cover_video: assets?.standard_cover_video ?? null,
      standard_transition_video: assets?.standard_transition_video ?? null,
      standard_background_video: assets?.standard_background_video ?? null,
      stage_modes: activeTemplateData.value?.stage_modes ?? null,
    },
    // Someone judging a template wants to see every stage it defines; the sample
    // does carry a featured photograph, so this is simply true.
    hasFeaturedPhoto: true,
    canEdit: false,
  }
})

const renderer = computed(() => resolvePreviewRenderer(rendererContext.value))

const visibleFrames = computed(() =>
  renderer.value.frames.filter((frame: PreviewFrameDescriptor) =>
    frame.isVisible ? frame.isVisible(rendererContext.value) : true,
  ),
)

const activeFrameId = ref<string>('cover')

// A template swap can retire the stage being looked at (an animated middle beat
// and a filmed one are mutually exclusive).
watch(visibleFrames, (frames) => {
  if (frames.length && !frames.some((frame) => frame.id === activeFrameId.value)) {
    activeFrameId.value = frames[0].id
  }
})

// ---------------------------------------------------------------------------
// View mode
// ---------------------------------------------------------------------------

const VIEW_MODES = [
  { value: 'single' as const, icon: Smartphone, labelKey: 'partners.templates.viewSingle' },
  { value: 'multiple' as const, icon: LayoutGrid, labelKey: 'partners.templates.viewAll' },
]

const viewMode = ref<'single' | 'multiple'>('multiple')

// Below `lg` there is only ever one frame: three phones side by side on a phone
// would each be ~100px wide, which previews nothing. Tracked as media state
// rather than a CSS-only hide, so the frames that aren't shown are never mounted.
//
// Read at setup, not first in onMounted: the phone and desktop layouts are
// different trees now, and starting from `false` painted the desktop header and
// skeleton for a frame before swapping them out.
const NARROW_QUERY = '(max-width: 1023px)'
const isNarrow = ref(typeof window !== 'undefined' && window.matchMedia(NARROW_QUERY).matches)
let narrowQuery: MediaQueryList | null = null
const onNarrowChange = (event: MediaQueryListEvent | MediaQueryList) => {
  isNarrow.value = event.matches
}

/**
 * The phone layout proper: the studio's full-screen preview. While loading too,
 * so the page opens on the black screen the invitation will arrive into — but
 * not for an empty catalogue, where there is no invitation to be full-screen
 * and the page falls back to its header and an explanation.
 */
const isViewer = computed(() => isNarrow.value && (loading.value || templates.value.length > 0))

const isSingleView = computed(() => isNarrow.value || viewMode.value === 'single')

const setViewMode = (mode: 'single' | 'multiple') => {
  viewMode.value = mode
}

const framesLayoutClass = computed(() =>
  isSingleView.value ? 'tpl-frames--single' : `tpl-frames--cols-${visibleFrames.value.length}`,
)

/**
 * Whether one-vs-all is a choice worth offering. Never on a narrow screen,
 * where `isSingleView` is forced regardless of what the segment says — a
 * control that highlights and then does nothing is worse than no control.
 */
const showLayoutSegments = computed(() => !isNarrow.value && visibleFrames.value.length > 1)

/**
 * Only one frame on screen, somewhere else to go from it, and room above it to
 * say so.
 *
 * Desktop only. A phone's stages are the bar's inset track — the same three
 * choices, floating over the invitation instead of taking height above it.
 */
const showStagePicker = computed(
  () => !isNarrow.value && isSingleView.value && visibleFrames.value.length > 1,
)

/**
 * The catalogue, on a phone: the studio's template menu, over the invitation
 * rather than a band permanently across the bottom of it — the invitation is
 * the whole screen, and a design is chosen in bursts.
 */
const browseOpen = ref(false)

const toggleBrowse = () => {
  browseOpen.value = !browseOpen.value
}

/**
 * A stage tapped while the menu is up is a request to see that stage, so the
 * menu gets out of the way — otherwise the tap changes a screen nobody can see.
 */
const selectStage = (id: string) => {
  activeFrameId.value = id
  browseOpen.value = false
}

// ---------------------------------------------------------------------------
// The phone's bar: dims when left alone
//
// The same rule as the studio's mobile preview (MobilePreviewSheet), with the
// same numbers. The bar is the only way out, so it can never disappear — but it
// also sits on the invitation it is there to show, so after a few seconds
// untouched it dims and sinks. Any press on it (or hover / focus, via CSS)
// brings it straight back, and it stays interactive while dimmed.
// ---------------------------------------------------------------------------

const IDLE_DELAY = 3200

const chromeIdle = ref(false)
let idleTimer: ReturnType<typeof setTimeout> | null = null

const clearIdleTimer = () => {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = null
}

const wakeChrome = () => {
  chromeIdle.value = false
  clearIdleTimer()
  idleTimer = setTimeout(() => (chromeIdle.value = true), IDLE_DELAY)
}

/** Never dimmed under the open catalogue: the sheet stands on the bar, and its
 *  lit button is what says what the sheet is. */
const barIdle = computed(() => chromeIdle.value && !browseOpen.value)

// Put away by the scrim, the close button or a picked design, the sheet never
// touched the bar — so without this the bar would drop straight to dim the
// moment the sheet left it, with the new design only just arriving above it.
watch(browseOpen, (open) => {
  if (!open && isViewer.value) wakeChrome()
})

// Starts the clock the moment the bar exists, so it recedes on its own even if
// the visitor never touches it.
watch(isViewer, (viewer) => (viewer ? wakeChrome() : clearIdleTimer()), { immediate: true })

/**
 * A swipe across the phone moves one stage, in the direction the finger went —
 * dragging left brings the next screen in from the right, which is the way a
 * pager has always read. It stops at the ends rather than wrapping: three
 * stages are a sequence with a beginning and an end, not a carousel, and
 * looping from Main Content back to Cover would undo the picker's own story.
 *
 * It wakes the bar, too: the stage track is what confirms where the swipe
 * landed, and a dimmed one says it less clearly.
 */
const onFrameSwipe = (direction: 'left' | 'right') => {
  const frames = visibleFrames.value
  const index = frames.findIndex((frame) => frame.id === activeFrameId.value)
  if (index === -1) return
  const next = frames[index + (direction === 'left' ? 1 : -1)]
  if (!next) return
  activeFrameId.value = next.id
  wakeChrome()
}

/**
 * The caption above a frame — blank while the stage picker is up, because the
 * picker sits directly over the phone and already says which screen this is.
 * Two labels for one screen is one too many, and the row it gives back is
 * roughly what the picker costs, so the phone renders the same size either way.
 */
const frameLabel = (frame: PreviewFrameDescriptor): string =>
  showStagePicker.value ? '' : t(frame.labelKey)

/**
 * The pill is a container: with nothing to put in it, it is a stray blob. On a
 * phone it is always empty — the layout segments never show there and the
 * language toggle lives on the bar — so the header, where there is one at all
 * (an empty catalogue), keeps only the back link and the title.
 */
const hasViewControls = computed(
  () =>
    !loading.value &&
    templates.value.length > 0 &&
    !isNarrow.value &&
    (showLayoutSegments.value || frameLanguages.value.length > 1),
)

// ---------------------------------------------------------------------------
// Frame sizing
// ---------------------------------------------------------------------------

/**
 * Room kept below the phones for the sample-content note. Desktop only: on a
 * phone the frame is the whole screen and nothing is fitted at all.
 */
const FRAME_BOTTOM_RESERVE = 72
/**
 * The frame's own shape, which this page has to agree with because it fits the
 * phones itself (in document coordinates) instead of letting PreviewFrame do
 * it. Reactive, because the shape is 9:16 on a desktop and the full 19.5:9
 * phone below it — a fixed number here would fit every frame to the wrong
 * height on one side of that boundary.
 */
const frameAspect = usePreviewFrameAspect()
/**
 * The ceiling is the *drawn* one, not the native width: this page hands
 * PreviewFrame a width computed from the height it has, so capping at the
 * native 390 was what left a band of empty stage under every phone on a tall
 * window.
 */
const MAX_FRAME_WIDTH = PREVIEW_FRAME_MAX_WIDTH
/** Never so small that the invitation stops being readable; the page scrolls. */
const MIN_FRAME_WIDTH = 240

const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 900)
/** Where the phones start, in DOCUMENT coordinates — see frameMaxWidth. */
const framesTop = ref(320)

/**
 * How large a frame may render: as tall as fits between the page header and the
 * bottom of the window, capped at the phone's native size.
 *
 * Deliberately not `PreviewFrame`'s own height fit, which measures the frame's
 * distance from the top of the *viewport* at the moment it mounts — a property
 * of where the visitor happened to have scrolled, stable enough inside a fixed
 * tab panel but not on a page. Measuring in document coordinates instead gives
 * the same answer at any scroll position, and this page opens at the top, which
 * is where the fit has to be right.
 *
 * Desktop only. A phone draws no PreviewFrame: its invitation is the screen.
 */
const frameMaxWidth = computed(() =>
  Math.max(
    MIN_FRAME_WIDTH,
    Math.min(
      MAX_FRAME_WIDTH,
      Math.round((viewportHeight.value - framesTop.value - FRAME_BOTTOM_RESERVE) * frameAspect.value),
    ),
  ),
)

const FRAMES_GAP_PX = 24

const framesRef = ref<HTMLElement | null>(null)
const framesWidth = ref(0)
let framesObserver: ResizeObserver | null = null

/**
 * Where the studio starts, in document coordinates.
 *
 * Published to CSS so the catalogue column can be exactly as tall as the space
 * below the header. `100vh` alone is too tall by the header's own height, which
 * left the page 96px longer than the window at rest — for a screen whose whole
 * point is that everything is visible at once, that is a scrollbar bought for
 * nothing. The header's height is not a constant either: it wraps to two lines
 * below `lg` and the subtitle re-wraps with the window.
 */
const studioRef = ref<HTMLElement | null>(null)
const studioTop = ref(96)

/**
 * How far the phone's bar stands off the bottom of the window, published to CSS
 * so the catalogue sheet can stand directly on it.
 *
 * Measured rather than assumed because it is not a constant: it carries a
 * safe-area inset on the phones that have one. The seed is the bar's own
 * geometry (a 54px pill, 12px up), used only until the observer reports.
 */
const dockHeight = ref(66)

const studioStyle = computed(() => ({
  '--tpl-studio-top': `${studioTop.value}px`,
  '--tpl-dock-h': `${dockHeight.value}px`,
}))

/** Every measurement the frames need, taken from the container that holds them. */
const measureFrameBox = (element: HTMLElement) => {
  framesWidth.value = element.clientWidth
  framesTop.value = element.getBoundingClientRect().top + window.scrollY
  if (studioRef.value) {
    studioTop.value = studioRef.value.getBoundingClientRect().top + window.scrollY
  }
}

watch(framesRef, (element) => {
  framesObserver?.disconnect()
  framesObserver = null
  if (!element) return
  measureFrameBox(element)
  framesObserver = new ResizeObserver(() => measureFrameBox(element))
  framesObserver.observe(element)
})

/** The bar's height, watched rather than read once — a safe-area inset can
 *  arrive under the page's feet. */
const dockRef = ref<HTMLElement | null>(null)
let dockObserver: ResizeObserver | null = null

watch(dockRef, (element) => {
  dockObserver?.disconnect()
  dockObserver = null
  if (!element) return
  const measure = () => {
    const next = Math.round(element.getBoundingClientRect().height)
    if (next) dockHeight.value = next
  }
  measure()
  dockObserver = new ResizeObserver(measure)
  dockObserver.observe(element)
})

/**
 * How much width one frame gets, measured once here and handed to every frame.
 *
 * Passed in single view too, not only in the row. `PreviewFrame` otherwise
 * measures its own wrapper, and this grid centres its items (`justify-items`),
 * which means a frame is shrink-wrapped around its own content — so measuring it
 * asks the frame how wide it is in order to decide how wide it should be, and it
 * stays at whatever width it happened to have.
 */
const sharedColumnWidth = computed(() => {
  const cols = isSingleView.value ? 1 : Math.max(visibleFrames.value.length, 1)
  return Math.max((framesWidth.value - FRAMES_GAP_PX * (cols - 1)) / cols, 0)
})

type PreviewFrameInstance = InstanceType<typeof PreviewFrame>
const previewFrameRefs = new Map<string, PreviewFrameInstance>()

const setPreviewFrameRef = (id: string, el: unknown) => {
  if (el) previewFrameRefs.set(id, el as PreviewFrameInstance)
  else previewFrameRefs.delete(id)
}

// A frame can't observe a layout change its parent makes, so re-fit on the ones
// that change how much room each frame has.
//
// `nextTick`, not `requestAnimationFrame`: switching views changes `maxWidth`
// too, and a frame re-measuring before Vue has patched that prop caps itself at
// the width it was allowed in the *previous* view and stays there.
const remeasure = () => {
  void nextTick(() => {
    for (const instance of previewFrameRefs.values()) instance.measure()
  })
}

/**
 * The box measurement AND the frames' own, in that order.
 *
 * `framesObserver` catches the frames box changing *size*; nothing catches it
 * changing *position*, which is what every one of these does — the catalogue
 * arriving under a skeleton, a shelf of five swapped for a shelf of one, the
 * picker appearing. `framesTop` then keeps the value it had when the page was
 * still empty, `frameMaxWidth` is computed from a top that is hundreds of
 * pixels too high, and the phone is drawn too large to fit the window it was
 * supposed to fit — which is the whole point of measuring.
 *
 * It settles in one pass: `framesTop` is where the frames box *starts*, and
 * nothing above it is sized from the frame, so re-measuring cannot move it.
 */
const refit = () => {
  void nextTick(() => {
    if (framesRef.value) measureFrameBox(framesRef.value)
    for (const instance of previewFrameRefs.values()) instance.measure()
  })
}

watch([isSingleView, activeFrameId, frameMaxWidth], remeasure)
watch([loading, isNarrow, showStagePicker, groupedTemplates], refit)

const onWindowResize = () => {
  viewportHeight.value = window.innerHeight
  if (framesRef.value) measureFrameBox(framesRef.value)
  remeasure()
}

// ---------------------------------------------------------------------------
// Frames: mounted one at a time
//
// Each frame is a full boot of the app in its own browsing context. Three at
// once race each other for the network and the main thread and NONE of them
// appears; in order, the first is up in a fraction of the time and the rest are
// cheaper for following it.
// ---------------------------------------------------------------------------

const mountedFrameIds = ref(new Set<string>())
/**
 * Only a safety valve, so it is sized as one.
 *
 * The queue advances on `frame-loaded` — a frame with an invitation actually on
 * screen — not on the mount-time handshake, and on a slow connection that can
 * legitimately take many seconds. At the old 4s this timer, not the frame,
 * decided when the next boot began, which reintroduced exactly the contention
 * the queue exists to prevent on exactly the connections that need it most. It
 * has one job: stop a frame that died before reporting from stalling the queue
 * for good.
 */
const FRAME_HANDSHAKE_TIMEOUT_MS = 20000
let frameMountTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Which frames are worth booting: all of them, but not all at once.
 *
 * On a wide screen they can start together (in the queue's own order) — every
 * frame is on screen or one click away, and having them warm is what makes that
 * click instant. On a phone the first one is on its own until it is up, so the
 * invitation the visitor is actually looking at never races two hidden app
 * boots for the network and the main thread.
 *
 * Afterwards the phone warms the rest too, which it deliberately did not before.
 * Booting on demand made every first tap of a stage — and every swipe — turn the
 * page's whole payload black for as long as an app takes to start, which on a
 * phone connection is seconds. That is the worst possible moment to spend them:
 * the visitor has just asked for something. Two boots of a page whose entire
 * purpose is previewing is the cheaper half of that trade, and by then they cost
 * nothing visible.
 */
const framesWarmed = ref(false)

const mountQueue = computed(() =>
  isNarrow.value && !framesWarmed.value
    ? visibleFrames.value.filter((frame) => frame.id === activeFrameId.value)
    : visibleFrames.value,
)

/**
 * Nothing boots until the catalogue, the plans AND the preview roster are in.
 *
 * Selecting a design is enough to change which stages exist, which wakes the
 * mount queue — so without this a frame could come up before the plans named
 * its design's category, be seeded with the wrong invitation, and reload to
 * correct itself in front of the visitor.
 */
const studioReady = ref(false)

const mountNextFrame = () => {
  if (!studioReady.value) return
  if (frameMountTimer) clearTimeout(frameMountTimer)
  frameMountTimer = null

  const pending = mountQueue.value.filter((frame) => !mountedFrameIds.value.has(frame.id))
  if (!pending.length) return

  const next = pending.find((frame) => frame.id === activeFrameId.value) ?? pending[0]
  mountedFrameIds.value = new Set(mountedFrameIds.value).add(next.id)
  // Only a safety valve: a frame that fails before its handshake must not stall
  // the queue for good.
  frameMountTimer = setTimeout(mountNextFrame, FRAME_HANDSHAKE_TIMEOUT_MS)
}

// A template swap can bring a stage into being (a filmed middle beat appearing
// where an animated one was), and on a phone a dot tap asks for a frame that was
// never booted. Either way the queue has something new to do.
watch(mountQueue, () => mountNextFrame())

// Crossing the `lg` line swaps the phone's full-screen viewer for the desktop's
// PreviewFrames, which are different parents — so every frame unmounts and has
// to boot again in the other tree. The unmount is what forgets them (see
// setFrameRef), and it lands in the render AFTER a pre-flush watcher has run,
// so the queue is restarted post-flush, once there is something to restart.
watch(isViewer, () => mountNextFrame(), { flush: 'post' })

const frameRefs = new Map<string, InstanceType<typeof InertIframe>>()

const setFrameRef = (id: string, el: unknown) => {
  if (el) {
    frameRefs.set(id, el as InstanceType<typeof InertIframe>)
    return
  }
  frameRefs.delete(id)
  // A stage can be retired by a template swap and come back on the next one.
  // Forget both the frozen URL and the fact it was mounted, so it comes back
  // built from the language currently on screen rather than the one it left in.
  frameSrcCache.delete(id)
  const next = new Set(mountedFrameIds.value)
  if (next.delete(id)) mountedFrameIds.value = next
}

/**
 * A frame's `src`, computed once and then frozen for that frame's lifetime.
 *
 * Two things vary here that must NOT reach the URL after the fact: the template
 * (pushed over the bridge) and the language (`set-language`, likewise). The
 * language is seeded into the first URL because a frame that mounts already
 * knowing it paints correctly without waiting for a message — but re-deriving
 * the URL when it changes would alter an `<iframe>`'s `src`, and that always
 * re-navigates it. The template is left out entirely: it is the one thing a
 * visitor changes repeatedly, and the bridge handles a push that lands before
 * the frame's own data (see pendingStagedPreview).
 */
const frameSrcCache = new Map<string, string>()

const frameUrl = (frame: PreviewFrameDescriptor): string => {
  const cached = frameSrcCache.get(frame.id)
  if (cached) return cached
  const params = new URLSearchParams({ stage: frame.id, lang: previewLanguage.value })
  // Seeded for the same reason the language is: a frame that mounts already
  // knowing its event paints once instead of painting the sample and reloading.
  // It is left to the bridge from then on — see pushPreviewEventToFrames.
  if (previewEventId.value) params.set('eventId', previewEventId.value)
  const url = `/template-showcase-preview-frame?${params.toString()}`
  frameSrcCache.set(frame.id, url)
  return url
}

/**
 * Push the chosen design into every mounted frame, immediately — including the
 * ones held off screen by `v-show` in single view.
 *
 * Deferring the off-screen ones was tried and reverted. It does save real work
 * — a template push re-keys the video pipeline, so each frame that receives one
 * remounts its stage and re-downloads — but `v-show` reveals a frame on the
 * same tick the tab is tapped, while the deferred push, the remount and the
 * video load all land after it. So switching stages showed the PREVIOUS
 * design's video first and swapped it out a moment later, which on the Event
 * Video frame is the entire screen changing under the visitor. A catalogue may
 * not show the wrong design for even a moment; that is the one thing it is for.
 */
const pushTemplateToFrames = () => {
  const templateData = activeTemplateData.value
  if (!templateData) return
  for (const frame of frameRefs.values()) frame.postTemplatePreview(templateData)
}

/**
 * Every mounted frame draws the same invitation, always.
 *
 * Over the bridge rather than through the URL, because changing an iframe's
 * `src` re-navigates it — three designs into a browse that is nine full app
 * boots. A frame that is already on this event ignores the message.
 */
const pushPreviewEventToFrames = () => {
  for (const frame of frameRefs.values()) frame.postPreviewEvent(previewEventId.value)
}

watch(previewEventId, pushPreviewEventToFrames)

/**
 * A frame's listener is now live — the only safe moment to hand it anything,
 * since postMessage does not queue.
 *
 * State delivery only. This fires at the frame's MOUNT, while its showcase
 * fetch and stage chunk are still in flight, so it says nothing about whether
 * the frame is up; advancing the boot queue from here started every frame
 * within a few milliseconds of the last and made the staggering ornamental.
 * That is `onFrameLoaded`'s job now.
 */
const onFrameReady = (frameId: string) => {
  const frame = frameRefs.get(frameId)
  const templateData = activeTemplateData.value
  if (templateData) frame?.postTemplatePreview(templateData)
  // Unconditional, and cheap: a frame booted on this event ignores it. It
  // covers the one ordering the seeded URL cannot — a frame still mounting
  // while the visitor moves to a design of another category.
  frame?.postPreviewEvent(previewEventId.value)
}

/**
 * A frame has an invitation on screen. Only now is the connection free enough
 * to be worth handing to the next one.
 */
const onFrameLoaded = () => {
  // The first frame is up, so the phone may now warm the rest behind it — see
  // mountQueue. Latched rather than recomputed: once a stage has been booted it
  // stays booted, and a later frame reporting in must not reopen the question.
  framesWarmed.value = true
  mountNextFrame()
}

// ---------------------------------------------------------------------------
// Language. The page proposes; the frames report what they could render, and the
// toggle follows the report — see PartnerTemplatePreview for the same rule.
// ---------------------------------------------------------------------------

const previewLanguage = ref<string>(locale.value)
const frameLanguages = ref<string[]>([])

const onFrameLanguages = (languages: string[], current: string) => {
  if (languages.length) frameLanguages.value = languages
  if (current) previewLanguage.value = current
}

const cycleLanguage = () => {
  if (frameLanguages.value.length < 2) return
  const index = frameLanguages.value.indexOf(previewLanguage.value)
  const next = frameLanguages.value[(index + 1) % frameLanguages.value.length]
  previewLanguage.value = next
  // In place, over the bridge — never by touching an iframe's `src`. The frames
  // re-report, and a frame that cannot honour it puts the toggle back.
  for (const frame of frameRefs.values()) frame.postSetLanguage(next)
}

// ---------------------------------------------------------------------------

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  // Innermost first, as the studio's modal does: a filter sheet closes before
  // the menu it belongs to.
  if (planSheetOpen.value || categorySheetOpen.value) {
    planSheetOpen.value = false
    categorySheetOpen.value = false
    return
  }
  categoryMenuOpen.value = false
  browseOpen.value = false
}

onMounted(() => {
  narrowQuery = window.matchMedia(NARROW_QUERY)
  onNarrowChange(narrowQuery)
  narrowQuery.addEventListener('change', onNarrowChange)
  window.addEventListener('resize', onWindowResize)
  document.addEventListener('keydown', onKeydown)

  // All three before the first frame boots, and the plans are no longer
  // fire-and-forget: a frame's `src` is frozen at mount, and the plan is what
  // names the design's category — so a frame that comes up before the plans do
  // is seeded with the wrong invitation and has to reload to correct itself.
  void Promise.all([loadCatalogue(), loadPlans(), loadTemplatePreviewEvents()]).then(() => {
    // The first CARD, not the first row of the response — see orderedTemplates.
    const first = orderedTemplates.value[0]
    if (first) selectTemplate(first.id)
    studioReady.value = true
    mountNextFrame()
  })
})

onUnmounted(() => {
  if (frameMountTimer) clearTimeout(frameMountTimer)
  clearIdleTimer()
  framesObserver?.disconnect()
  dockObserver?.disconnect()
  narrowQuery?.removeEventListener('change', onNarrowChange)
  window.removeEventListener('resize', onWindowResize)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* One curve for everything that enters, one for everything that moves. The
   built-in CSS easings are too weak to read as intentional at these durations. */
.tpl-page {
  --tpl-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  /* One duration for every hover on the page. Three near-identical numbers
     (200 / 220 / 250) for the same kind of feedback is not a decision anyone
     made; it is drift, and side by side the pills read as slightly out of
     step with each other. Presses stay faster — feedback should land under
     the finger, not after it. */
  --tpl-dur: 200ms;
  --tpl-press: 160ms;
  /* Every control's focus ring, defined once. The white inner band is what
     keeps it legible against a card's own artwork; on the page's white ground
     it simply reads as a ring floating clear of the control. */
  --tpl-focus: 0 0 0 2px #fff, 0 0 0 4px rgb(56 189 248);
  /* One control height for the whole page: the back link, the view pill, the
     stage picker, the filter and the action all land on 40px, which is also a
     touch target that survives a thumb. */
  --tpl-control-h: 2.5rem;
  /* One material for every floating control on the page. The view pill and the
     stage picker were glass; the back link and the event-type filter were
     bordered white stationery — two families on one row, which is what read as
     "the dropdown belongs to another page". Defined here rather than written
     out at each of the four, so a fifth control cannot quietly start a third
     family, and so the four can never drift apart by a hundredth of an alpha. */
  --tpl-glass: rgba(255, 255, 255, 0.75);
  /* Hover tints toward slate rather than toward opaque white: over a ground
     that is already near-white, going whiter is no feedback at all. Still
     translucent and still blurred, so the control answers without leaving the
     material — which is what the old solid slate-50 fill could not do. */
  --tpl-glass-hover: rgba(248, 250, 252, 0.95);
  --tpl-glass-edge: rgba(255, 255, 255, 0.6);
  --tpl-glass-lift: 0 1px 2px rgba(15, 23, 42, 0.06);
  /* The catalogue column. In px, not rem: the app runs a reduced root font at
     laptop widths, and this column holding two 9:16 cards is exactly where that
     shrink is least welcome. */
  --tpl-menu-w: 356px;
  /* What the page paints under the catalogue column, as a flat colour. The
     ground is a horizontal gradient, but across the 356px this column occupies
     it moves by under two levels out of 255 — so a solid stand-in is
     indistinguishable, and it is the only thing a sticky band can be cut from. */
  --tpl-ground: #fafdfb;
  /* The page's own side inset, named so the two horizontal rails below can pay
     it back and run to the screen's edge. Kept in step with `padding` by hand,
     which is why they sit together. */
  --tpl-pad: 1rem;

  /* `dvh`, not `vh`: on a phone `100vh` is the tallest the viewport ever gets,
     so with the URL bar showing the page claims more height than the window
     has and adds a scrollbar to a screen that would otherwise have none. */
  min-height: 100vh;
  min-height: 100dvh;
  /* The page paints its own ground now that it has no app shell around it. */
  background: linear-gradient(
    to right,
    rgba(46, 204, 113, 0.03),
    #fff 45%,
    rgba(30, 144, 255, 0.03)
  );
  /* No bottom runway: a phone is the full-screen viewer (.is-viewer), and a
     page that fits its window has no scroll to pad. */
  padding: 0.75rem var(--tpl-pad) 0;
}

@media (min-width: 640px) {
  .tpl-page {
    --tpl-pad: 1.5rem;
    padding: 1.25rem var(--tpl-pad) 0;
  }
}

@media (min-width: 1024px) {
  .tpl-page {
    /* Full bleed. The frames are the review surface, so every pixel not spent
       on chrome goes to them — including the bottom pad, which a page that
       fits its window has no scroll runway to need. */
    padding: 1.25rem 1.75rem 1rem;
  }
}

/* --------------------------------------------------------------------------
   Header — a back link and a title, and nothing else
   -------------------------------------------------------------------------- */

/*
  One bar: navigation at the leading edge, controls at the trailing one, the
  headline between them.

  On a phone it is the viewer's top chrome and stays put — the page can still
  scroll on a short screen, and the two things this bar holds (what language the
  invitation is in, and whose invitation it is) are asked from wherever the
  visitor has got to. Full bleed, so the band it paints reaches the glass rather
  than stopping at the page's own inset with content sliding through the strip
  either side of it.
*/
.tpl-page__head {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
  margin: -0.75rem calc(var(--tpl-pad) * -1) 0.375rem;
  padding: 0.75rem var(--tpl-pad) 0.5rem;
  /* Near-solid rather than blurred glass, deliberately: `backdrop-filter` makes
     an element the containing block for every fixed descendant, and the note's
     full-window scrim is one — under a blurred bar it would cover the bar and
     nothing else, so a tap anywhere on the page would fall straight through to
     what is behind the panel. Little passes under this band in any case. */
  background: #fff;
}

@media (min-width: 1024px) {
  .tpl-page__head {
    /* Four tracks, and the first is the catalogue column, repeated from the
       studio below with the same width and the same gutter. That is what makes
       the header look aligned rather than merely centred: the back link lands
       directly over the catalogue's own heading, and the remaining three tracks
       divide exactly the region the frames occupy — so the headline sits on the
       same centre line as the three phones, their labels and the caption under
       them. Centring on the *page* instead put it over the seam between the two
       columns, which is aligned to nothing.

       The two `1fr` gutters are what centre it. They are equal by definition,
       and the column gaps fall on both sides of the middle track and cancel, so
       the pill on the right never pushes the title off centre however wide it
       grows. The trailing gutter is floored at `max-content` so that pill is
       never squeezed into wrapping; the leading one is empty, so its floor is
       zero and it simply mirrors whatever the trailing one takes.

       Every item is placed by hand. Grid items stretch to their track by
       default, and `flex: none` stops meaning anything the moment the parent is
       not a flex container — left to itself the back link inflates to the full
       width of the catalogue column, and auto-placement drops the view pill
       into the leading gutter. */
    /* Back to an ordinary header: nothing scrolls under it up here, and the
       band it painted on a phone would cut across the catalogue column. */
    position: static;
    background: none;
    backdrop-filter: none;
    display: grid;
    grid-template-columns:
      minmax(0, var(--tpl-menu-w))
      minmax(max-content, 1fr)
      auto
      minmax(max-content, 1fr);
    column-gap: 1.75rem;
    padding: 0;
    margin: 0 0 1.25rem;
  }

  .tpl-page__nav {
    grid-column: 1;
    /* Inset to the catalogue's own edges, not to the column box. The scroller
       below pads itself by 8px so a card's selection ring and hover lift are
       not clipped away, so every card, shelf heading and count in that column
       starts 8px in — and a bordered pill sitting flush to the column box
       instead is 8px adrift of all of them. */
    padding-inline: 0.5rem;
  }

  .tpl-seg {
    grid-column: 4;
    justify-self: end;
  }
}

/* The back link and the catalogue's filter, in one row. On a phone it is only
   the back link — down there the filter belongs to a catalogue that has become
   a sideways rail — so the row shrink-wraps and the view pill keeps the far end
   of the bar. */
.tpl-page__nav {
  display: flex;
  flex: none;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}

.tpl-back {
  display: inline-flex;
  flex: none;
  min-height: var(--tpl-control-h);
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid var(--tpl-glass-edge);
  background: var(--tpl-glass);
  box-shadow: var(--tpl-glass-lift);
  backdrop-filter: blur(12px);
  padding: 0 0.9375rem 0 0.8125rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  transition:
    color var(--tpl-dur) var(--tpl-ease-out),
    background-color var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

/* No label, no reason for the lopsided pill the label's padding makes: the
   arrow gets a circle of the page's own control height and sits dead centre of
   it, rather than 1px right of centre in a 46x40 lozenge. On a phone that is
   every locale — the label is hidden there, see the span. */
.tpl-back.is-icon,
.tpl-back {
  width: var(--tpl-control-h);
  padding: 0;
}

.tpl-back__label {
  display: none;
}

@media (min-width: 1024px) {
  .tpl-back:not(.is-icon) {
    width: auto;
    padding: 0 0.9375rem 0 0.8125rem;
  }

  .tpl-back__label {
    display: inline;
  }
}

/* The glass goes more opaque and the ink darkens. Hardening the border to slate
   instead would put the stationery outline back on hover — the control would
   change family under the cursor. */
.tpl-back:hover {
  color: rgb(15 23 42);
  background: var(--tpl-glass-hover);
}

.tpl-back:active {
  transform: scale(0.97);
}

.tpl-back:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

/* Between the back link and the controls, on the one row a narrow header
   gets. It shrinks before either of them does — they are fixed-size targets and
   this is text, which can take a second line when a locale needs one (Khmer's
   title is twice English's). Wrapping costs the bar 20px; giving the title a
   row of its own cost it 36 and left a lone arrow on the line above. */
.tpl-page__headline {
  /* Basis zero, not `auto`: the title must never *ask* for the width its text
     wants, or a long locale claims the row and pushes the two controls onto a
     second one — which is what Khmer did, at 110px of header for a page whose
     scarce dimension is height. With a zero basis it takes what the fixed-size
     targets leave and wraps inside that. */
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
}

@media (min-width: 1024px) {
  .tpl-page__headline {
    /* Stacked, not side by side. Centred over the stage, a caption hung off the
       title's right-hand baseline reads as two objects that happen to be near
       each other; over and under reads as one lockup. It is also why the
       divider that once sat between them could never be aligned — under
       baseline alignment the caption's box starts well below the title's cap,
       so the rule drew a short line down the middle of the heading.

       Stacking usually costs ~40px of header height, which the phones
       underneath pay for. Here it costs about six, because the caption is given
       the width to stay on one line. */
    flex: none;
    order: 0;
    grid-column: 3;
  }
}

/* Smaller on a phone than the 1.25rem it was, because it now shares the row
   with three controls rather than owning a line. It is a name, not a headline —
   the page's argument is made on `/partners`, and by the time a visitor is here
   they came to look at designs. */
.tpl-page__title {
  /* Two lines at most. Khmer's title is a sentence where English's is a name,
     and left alone it ran to three — every one of them taken off the height the
     invitation below is fitted into. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: rgb(15 23 42);
  text-wrap: balance;
}

@media (min-width: 640px) {
  .tpl-page__title {
    font-size: 1.1875rem;
  }
}

@media (min-width: 1024px) {
  .tpl-page__title {
    /* Unclamped: the header has a whole track to itself here, and a heading
       that can silently lose its last word is only worth it where height is
       the scarce thing. */
    display: block;
    overflow: visible;
    font-size: 1.5rem;
    line-height: 1.2;
  }
}

/* Desktop only. Stacked on a phone it runs to three lines, and every one of
   them pushes the invitation further below the fold — on a screen where the
   catalogue already has to be seen above it. The title carries the idea, and
   the note under the frames carries the caveat. */
.tpl-page__subtitle {
  display: none;
}

@media (min-width: 1024px) {
  .tpl-page__subtitle {
    display: block;
    /* Under the title it is a caption, and a caption that runs the width of a
       1900px screen is unreadable. Wide enough to hold this string on one line
       at desktop widths and fall to two at the narrow end of them — never the
       four it ran to at 34rem, which is a paragraph that has wandered into a
       header. `balance` is what keeps that second line from being two words
       long, which is loud under a centred title; and the box needs centring in
       its own right, since `text-align` centres the lines inside it but leaves
       a 32rem box sitting wherever it was placed. */
    max-width: 32rem;
    margin: 0.125rem auto 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: rgb(100 116 139);
    text-wrap: balance;
  }
}

/* --------------------------------------------------------------------------
   The studio
   -------------------------------------------------------------------------- */

/* Stacked, the gap is between the catalogue and the invitation it chooses, and
   every pixel of it comes off the phone's own height further down the column —
   so it is the smallest gap that still separates two bands. Side by side it is
   a column gutter and can afford to be generous (below). */
.tpl-studio {
  display: grid;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .tpl-studio {
    /* Catalogue first, then the frames, which take everything it does not. */
    grid-template-columns: minmax(0, var(--tpl-menu-w)) minmax(0, 1fr);
    gap: 1.75rem;
    align-items: start;
  }
}

/* The frames and the caption under them. Desktop's; a phone draws the
   full-screen viewer instead (.tpl-viewer). */
.tpl-studio__stage {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  order: 1;
}

/*
  The catalogue column — desktop only, and simply always there. A phone gets the
  studio's template menu instead (.tpl-menu-sheet).
*/
.tpl-studio__menu {
  order: 1;
  position: sticky;
  top: 1rem;
  display: flex;
  min-width: 0;
  flex-direction: column;
  /* Its own top, measured — see studioTop. Falls back to a guess for the
     frame before the measurement lands. */
  max-height: calc(100vh - var(--tpl-studio-top, 6rem) - 1rem);
}

@media (min-width: 1024px) {
  /* Side by side, and the reading direction flips back: choose on the left,
     look on the right. */
  .tpl-studio__stage {
    order: 2;
  }
}

/* --- The phone's menu: the studio's template menu ------------------------- */

/*
  BrowseTemplateModal's phone layout — a white search row over a slate-50 grid
  of its own cards — over the whole screen, with the bar floating over its foot.
  Every control in it takes its classes from templateUi in the markup; this only
  places it and moves it.

  Held in the DOM and hidden rather than mounted on demand, so a toggle in the
  middle of the way in retargets instead of restarting. `visibility` takes it
  out of the tab order and the accessibility tree while it is closed, and flips
  at the end of the way out so it can be seen leaving.

  It rises off the bar rather than scaling from the centre like the modal: what
  opened it is at the foot of the screen. Out faster than in — the way out is
  the system answering a decision the visitor has already made.
*/
.tpl-menu-sheet {
  position: fixed;
  inset: 0;
  height: 100dvh;
  z-index: 60;
  display: flex;
  flex-direction: column;
  background: #fff;
  opacity: 0;
  visibility: hidden;
  transform: translateY(12px) scale(0.985);
  transform-origin: bottom center;
  transition:
    opacity 180ms var(--tpl-ease-out),
    transform 180ms var(--tpl-ease-out),
    visibility 0s linear 180ms;
}

.tpl-menu-sheet.is-open {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition:
    opacity 260ms var(--tpl-ease-out),
    transform 260ms var(--tpl-ease-out),
    visibility 0s;
}

/* The modal's search row (`flex items-center gap-2 px-4 pt-4 pb-3`), plus the
   notch, which this — unlike the modal, laid out inside the app — sits under. */
.tpl-menu-sheet__head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.5rem;
  padding: max(1rem, env(safe-area-inset-top)) 1rem 0.75rem;
  background: #fff;
}

/* The modal's grid pane: slate-50, 1rem in. Its foot is the bar's measured
   height plus a gap, so the last row of cards clears the bar floating over it
   rather than scrolling to a stop underneath it. */
.tpl-menu-sheet__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: rgb(248 250 252);
  padding: 1rem 1rem calc(var(--tpl-dock-h, 66px) + 1rem);
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.tpl-menu-sheet__note {
  margin-bottom: 0.875rem;
  font-size: 0.75rem;
  line-height: 1.6;
  color: rgb(100 116 139);
  text-wrap: pretty;
}

/*
  The modal's filter sheets — `fixed inset-x-0 bottom-0 bg-white rounded-t-3xl
  shadow-2xl` over a black/40 blurred scrim, with the modal's own timings. Above
  the bar, which they cover while they are up: a sheet that ends at the bar
  would be a second, shorter menu.
*/
.tpl-filter-sheet__scrim {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.tpl-filter-sheet {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 90;
  border-radius: 1.5rem 1.5rem 0 0;
  background: #fff;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding-bottom: max(env(safe-area-inset-bottom), 0.75rem);
}

.tpl-fade-enter-active,
.tpl-fade-leave-active {
  transition: opacity 250ms ease;
}

.tpl-fade-enter-from,
.tpl-fade-leave-to {
  opacity: 0;
}

.tpl-bottom-sheet-enter-active {
  transition: transform 350ms cubic-bezier(0.32, 0.72, 0, 1);
}

.tpl-bottom-sheet-leave-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.6, 1);
}

.tpl-bottom-sheet-enter-from,
.tpl-bottom-sheet-leave-to {
  transform: translateY(100%);
}

/* Only the single-event-type fallback still renders this — see the header. */
.tpl-menu__label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

/* --- Event-type filter (§9) ---------------------------------------------- */

/* Fills whatever the back link leaves of the catalogue column, so the row has
   a flush trailing edge over a column of flush-edged cards. */
.tpl-filter {
  position: relative;
  flex: 1;
  min-width: 0;
}

.tpl-filter__trigger {
  display: flex;
  min-height: var(--tpl-control-h);
  align-items: center;
  gap: 0.5rem;
  /* Full-round, like the back link to its left, the view pill across the row
     and the stage picker below. An 8px radius on a 40px control is the shape of
     a form field, and one form field among four pills is the loudest single
     thing about this bar. */
  border-radius: 9999px;
  border: 1px solid var(--tpl-glass-edge);
  background: var(--tpl-glass);
  box-shadow: var(--tpl-glass-lift);
  backdrop-filter: blur(12px);
  /* Round ends eat their own inline space, so the pill needs more of it than
     the rounded rectangle did. The trailing side gets a shade less, the chevron
     carrying whitespace of its own. */
  padding: 0 0.6875rem 0 0.8125rem;
  width: 100%;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  transition:
    color var(--tpl-dur) var(--tpl-ease-out),
    background-color var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

/* Not §9's mint hover, which is the recipe for a dropdown standing on a white
   list page inside the app. This one stands in a toolbar over a stage, between
   a back link and a glass pill, on a page that deliberately ships without the
   app shell — so it takes §5's toggle-group material and hovers the way the
   back link beside it does. The mint was the one colour on this bar that
   appeared nowhere else on the page, and it arrived on the control furthest
   from anything else green.

   The menu it opens is still §9 to the letter — white, rounded-xl, gradient on
   the selected row. A popover is a popover, and it was never the part that
   looked borrowed. */
.tpl-filter__trigger:hover {
  color: rgb(15 23 42);
  background: var(--tpl-glass-hover);
}

.tpl-filter__trigger:active {
  transform: scale(0.97);
}

.tpl-filter__trigger:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

.tpl-filter__scrim {
  position: fixed;
  inset: 0;
  z-index: 90;
}

/*
  Never narrower than the control it opened from, and never wider than it needs
  to be. It used to be a flat 13rem against an 11rem trigger and anchored to the
  right, so it hung a third of an inch past the trigger's leading edge with
  nothing above that overhang — a popover that does not line up with its own
  trigger reads as belonging to something else on the page.

  `min-width: 100%` resolves against .tpl-filter, which is exactly the trigger's
  box; `max-content` then grows it for a long event-type name, and `max-width`
  hands it straight back — the trigger now spans its whole column, so matching
  it is both the floor and the ceiling, and a long name truncates in the row
  rather than pushing the popover wider than the control it belongs to.
*/
.tpl-filter__menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 100;
  min-width: 100%;
  width: max-content;
  max-width: 100%;
  max-height: 22rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 0.75rem;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  box-shadow:
    0 20px 25px -5px rgba(15, 23, 42, 0.12),
    0 8px 10px -6px rgba(15, 23, 42, 0.08);
  /* Anchored under its trigger's trailing edge, so it scales out of the control
     that opened it rather than out of its own middle. */
  transform-origin: top right;
}

.tpl-dropdown-enter-active,
.tpl-dropdown-leave-active {
  transition:
    opacity 180ms var(--tpl-ease-out),
    transform 180ms var(--tpl-ease-out);
}

/* Never from scale(0): nothing in the real world appears out of nothing. */
.tpl-dropdown-enter-from,
.tpl-dropdown-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}

.tpl-filter__item {
  display: flex;
  width: 100%;
  min-height: var(--tpl-control-h);
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgb(51 65 85);
  transition: background-color var(--tpl-dur) var(--tpl-ease-out);
}

.tpl-filter__item:hover {
  background: rgb(248 250 252);
}

/* Inset, because the row runs the full width of a clipping scroller — an
   outset ring would be cut off on both sides and read as two stray marks. */
.tpl-filter__item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

.tpl-filter__item.is-active {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: #fff;
}

.tpl-filter__dot {
  height: 0.5rem;
  width: 0.5rem;
  flex: none;
  border-radius: 9999px;
}

.tpl-filter__item.is-active .tpl-filter__dot {
  background: rgba(255, 255, 255, 0.85) !important;
}

.tpl-filter__count {
  font-size: 0.6875rem;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

/* In the menu, `opacity` is right — it is what turns the count translucent
   white on the gradient-filled selected row. In the trigger there is no such
   row to inherit from, and a dimmed number beside a truncating label reads as
   the tail of that label rather than as its own value. Colour it outright. */
.tpl-filter__trigger .tpl-filter__count {
  opacity: 1;
  color: rgb(148 163 184);
}

/* --- The catalogue -------------------------------------------------------- */

.tpl-menu__scroll {
  /* Fills its container in both layouts — the sticky column on desktop, the
     sheet on a phone — and each of those caps its own height. It used to carry
     a 21rem cap of its own, from when the catalogue was stacked in the page
     flow above the invitation and the cap was all that kept it from burying it. */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
  /* Inset, not a negative margin paying itself back: a scroll container clips
     to its padding box, so any card sitting flush against the edge loses its
     selection ring and hover lift to the clip. Symmetric, so the two columns
     are the same width. */
  padding: 0.25rem 0.5rem;
  /*
    The list ends where its container does, and it ended on a hard horizontal
    cut through whatever card was there — which reads as a rendering fault
    rather than as "there is more below". Dissolving instead is the cheapest
    possible scroll affordance: no gradient overlay to keep in sync with the
    ground it stands on, and nothing to position. The desktop column's top edge
    already does it (the sticky heading's masked band); this is the same idea at
    the other end, and it is as true of the phone's sheet as of that column.

    Vertical only, so a card's selection ring and hover lift still reach the
    full width of the scroller.
  */
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 2rem), transparent 100%);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 2rem), transparent 100%);
}

.tpl-menu__scroll::-webkit-scrollbar {
  width: 6px;
}

.tpl-menu__scroll::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 3px;
}

.tpl-menu__scroll::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

/* Air between two shelves. The column is desktop-only now, so no longer scoped
   to it: the phone's menu is the studio's flat grid, with no shelves at all. */
.tpl-menu-group + .tpl-menu-group {
  margin-top: 1.25rem;
}

/*
  Sentence case, and a step up in size and colour from the "Designs" label
  above it.

  Two uppercase micro-labels stacked directly on top of one another — DESIGNS
  · 12, then FREE BASIC · 3 — is an eyebrow over an eyebrow: at the same size,
  weight and colour neither one separates anything, and the column opens on
  two rows of the same texture before a single design is visible. One eyebrow
  names the column; the shelves under it are named the way their plan is
  actually written, which is also the only form a partner can match against
  what they are buying.
*/
.tpl-menu-group__head {
  position: sticky;
  top: -0.25rem;
  z-index: 2;
  margin-bottom: 0.375rem;
  padding: 0.5rem 0 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: rgb(30 41 59);
}

/*
  The band the heading rides on, and the reason it is a pseudo-element.

  It used to be the heading's own background: a 94%-opaque strip with a hard
  bottom edge, which is two visible faults at once — the artwork ghosts through
  it, and a card sliding under it is cut off by a straight line across the
  design. Both are the kind of thing you see without being able to name.

  Solid where the words are, dissolving below them: a card fades out as it
  reaches the heading instead of meeting an edge. The fade is a mask rather
  than a gradient in `background`, because it also has to take the band's own
  bottom edge with it — and it bleeds sideways into the scroller's padding, so
  a card's selection ring has nowhere to peek out.
*/
.tpl-menu-group__head::before {
  content: '';
  position: absolute;
  inset: -0.5rem -0.5rem 0;
  z-index: -1;
  background: var(--tpl-ground);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%);
}

.tpl-card-grid {
  display: grid;
  /* Three up on a phone, four once there is room, and the two the sidebar was
     designed around from `lg`. */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.625rem;
}

@media (min-width: 640px) {
  .tpl-card-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }
}

@media (min-width: 1024px) {
  .tpl-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* --- The card ------------------------------------------------------------- */

.tpl-card {
  display: block;
  width: 100%;
  border-radius: 0.875rem;
  background: #fff;
  transition:
    box-shadow 200ms var(--tpl-ease-out),
    transform 200ms var(--tpl-ease-out);
  /* A ring, not a border: it does not participate in layout, so the artwork
     stays exactly the same size selected or not. */
  box-shadow: 0 0 0 1px rgba(203, 213, 225, 0.8);
}

/* Hover-lift only where there is a real pointer. On touch, :hover fires on tap
   and sticks. */
@media (hover: hover) and (pointer: fine) {
  .tpl-card:hover {
    box-shadow:
      0 0 0 1px rgb(203 213 225),
      0 12px 20px -8px rgba(15, 23, 42, 0.18);
    transform: translateY(-2px);
  }
}

.tpl-card:active {
  transform: scale(0.985);
}

.tpl-card:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

.tpl-card.is-active {
  box-shadow:
    0 0 0 2px #1e90ff,
    0 10px 20px -8px rgba(30, 144, 255, 0.35);
}

.tpl-card__art {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 0.875rem;
  /* The proportion the artwork is authored at: 1080x1920. */
  aspect-ratio: 9 / 16;
  background: linear-gradient(to bottom right, rgb(241 245 249), rgb(226 232 240));
}

.tpl-card__img {
  height: 100%;
  width: 100%;
  object-fit: cover;
  transition: transform 500ms var(--tpl-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .tpl-card:hover .tpl-card__img {
    transform: scale(1.04);
  }
}

.tpl-card__fallback {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  color: rgb(203 213 225);
}

.tpl-card__tick {
  position: absolute;
  top: 0.375rem;
  left: 0.375rem;
  z-index: 2;
  display: flex;
  height: 1.375rem;
  width: 1.375rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #1e90ff;
  color: #fff;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.9),
    0 4px 6px -1px rgba(15, 23, 42, 0.2);
}

.tpl-card__label {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 1;
  padding: 1.75rem 0.5rem 0.4375rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.35) 55%, transparent);
  color: #fff;
  text-align: left;
}

/* No artwork to sit over — a scrim on a pale placeholder is a grey smear, so
   the strip becomes a light one with dark type instead. */
.tpl-card__label.is-plain {
  padding-top: 0.4375rem;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  color: rgb(15 23 42);
}

.tpl-card__name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.6875rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.tpl-card__label.is-plain .tpl-card__name {
  text-shadow: none;
}

.tpl-card__meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.625rem;
  opacity: 0.8;
}

/* --- The stage ------------------------------------------------------------ */

/*
  §5 segmented control: one glass pill, gradient on the chosen segment.

  Padded to land on the page's control height, so it and the back link across
  the row are the same object seen twice rather than a 42px pill beside a 32px
  one — a ten-pixel difference between two things sitting on the same centre
  line is the kind of fault that is seen long before it is named.

  `margin-left: auto` is what pins it to the trailing corner — on a phone
  against the back link, on desktop against the headline that grew into the
  space between them.
*/
.tpl-seg {
  display: inline-flex;
  flex: none;
  margin-left: auto;
  align-items: center;
  gap: 0.125rem;
  border-radius: 9999px;
  border: 1px solid var(--tpl-glass-edge);
  background: var(--tpl-glass);
  padding: 0.1875rem;
  backdrop-filter: blur(12px);
  box-shadow: var(--tpl-glass-lift);
}

.tpl-seg__btn {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: 9999px;
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(71 85 105);
  transition:
    background-color var(--tpl-dur) var(--tpl-ease-out),
    color var(--tpl-dur) var(--tpl-ease-out),
    box-shadow var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

.tpl-seg__btn:hover {
  color: rgb(30 41 59);
}

.tpl-seg__btn:active {
  transform: scale(0.97);
}

/* Inset: the pill clips its segments to a 3px pad, so an outset ring would be
   drawn half underneath its own container. */
.tpl-seg__btn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

.tpl-seg__btn.is-active {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.2);
}

.tpl-seg__btn--lang {
  letter-spacing: 0.05em;
}

.tpl-seg__divider {
  width: 1px;
  height: 1.25rem;
  background: rgb(226 232 240);
}

/* The stage: the controls, then the phone they act on, on one centre line. */
.tpl-stage {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/*
  Which screen — asked in one row directly over the phone it is about.

  Desktop only, and so is everything it holds. On a phone the same stages are
  the inset track on the bar floating over the invitation.
*/
.tpl-stagebar {
  display: flex;
  max-width: 100%;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
}

/*
  §5 segmented control, the same pill as the view controls in the header —
  because it is the same kind of question asked about the same thing.

  One row, always. `nowrap` plus a sideways scroll rather than a wrap: a second
  row of chrome comes straight off the height of the phone under it, and the
  three Khmer labels are within ~30px of fitting a 390px screen as it is.
*/
.tpl-steps {
  display: flex;
  flex: none;
  max-width: 100%;
  align-items: center;
  gap: 0.125rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  border-radius: 9999px;
  border: 1px solid var(--tpl-glass-edge);
  background: var(--tpl-glass);
  padding: 0.1875rem;
  backdrop-filter: blur(12px);
  box-shadow: var(--tpl-glass-lift);
}

/* The scroller clips to its padding box, so a step's ring has to be drawn
   inside it — and no step can grow a hit area past the pill's own edge, which
   is why the height below is honest rather than extended by a pseudo-element. */

.tpl-steps::-webkit-scrollbar {
  display: none;
}

.tpl-step {
  display: inline-flex;
  flex: none;
  min-height: 2rem;
  align-items: center;
  border-radius: 9999px;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  color: rgb(71 85 105);
  transition:
    background-color var(--tpl-dur) var(--tpl-ease-out),
    color var(--tpl-dur) var(--tpl-ease-out),
    box-shadow var(--tpl-dur) var(--tpl-ease-out),
    transform var(--tpl-press) var(--tpl-ease-out);
}

.tpl-step:hover {
  color: rgb(15 23 42);
}

.tpl-step:active {
  transform: scale(0.97);
}

.tpl-step:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

.tpl-step.is-active {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.2);
}

/* --- The phone's bar ----------------------------------------------------- */

/*
  The studio's mobile-preview bar (MobilePreviewSheet's .preview-sheet__bar),
  on a page that is that preview seen from the other side of the counter. Same
  material, same geometry, same numbers — keep the two in step.

  The wrapper spans the window so the pill can be centred in it, and is
  click-through, so the strip either side of the pill belongs to the invitation
  behind it. It is also what is measured (--tpl-dock-h) for the sheet to stand
  on, which is why it carries the bottom offset as padding rather than the pill
  carrying it as a position.
*/
.tpl-bar-dock {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 70;
  display: flex;
  justify-content: center;
  /* 12px up, plus the home indicator on the phones that have one — the
     studio's own offset. */
  padding: 0 0.75rem calc(0.75rem + env(safe-area-inset-bottom));
  pointer-events: none;
}

/*
  Deliberately NOT a scroll container: `overflow-x: auto` makes overflow-y
  compute to `auto` as well, which would clip every tooltip (they sit above
  the bar, outside its box). Back, three stages, language and browse measure
  ~264px, so it fits a 320px screen without scrolling.
*/
.tpl-bar {
  /* How lit the bar is: 1 awake, 0.4 idle. Every alpha below is multiplied by
     it, so idle is the studio's own 40% — just not applied to Templates. */
  --tpl-bar-lit: 1;
  pointer-events: auto;
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 9999px;
  background: rgb(15 23 42 / calc(0.82 * var(--tpl-bar-lit)));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgb(148 163 184 / calc(0.22 * var(--tpl-bar-lit)));
  box-shadow: 0 12px 30px -8px rgb(0 0 0 / calc(0.55 * var(--tpl-bar-lit)));
  transition:
    background-color 300ms ease,
    border-color 300ms ease,
    box-shadow 300ms ease,
    transform 300ms ease;
}

/*
  Dimmed, not hidden: still the way out, still tappable, just out of the way.

  The studio fades its whole bar with one `opacity`. This one fades the pill's
  material and every control on it EXCEPT Templates, because an opacity on the
  pill is inherited by everything inside it, and the page's primary action
  receding into a 40% ghost after three seconds is exactly the opposite of
  highlighting it. So while the rest of the bar gets out of the invitation's
  way, the one thing a visitor came here to do stays lit.

  A mouse or a keyboard brings it back without a press; `wakeChrome` covers a
  finger. Keyboard focus only (`:focus-visible`), because a tapped button keeps
  plain focus on Android and would hold the bar lit until the next tap
  elsewhere.
*/
.tpl-bar > :not(.tpl-bar__btn--menu) {
  opacity: var(--tpl-bar-lit);
}

.tpl-bar.is-idle {
  --tpl-bar-lit: 0.4;
  transform: translateY(0.25rem) scale(0.97);
}

.tpl-bar.is-idle:has(:focus-visible) {
  --tpl-bar-lit: 1;
  transform: none;
}

@media (hover: hover) and (pointer: fine) {
  .tpl-bar.is-idle:hover {
    --tpl-bar-lit: 1;
    transform: none;
  }
}

.tpl-bar__btn {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 40px, the §17 touch-target floor. */
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  color: rgb(226 232 240);
  background: transparent;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    opacity 300ms ease,
    background-color 200ms ease,
    color 200ms ease,
    transform var(--tpl-press) var(--tpl-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .tpl-bar__btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}

/* Inset: the pill clips nothing, but an outset ring would run into the
   neighbouring button at a 4px gap. */
.tpl-bar__btn:focus-visible {
  outline: none;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

.tpl-bar__btn:active {
  background: rgba(255, 255, 255, 0.18);
  transform: scale(0.95);
}

.tpl-bar__btn--lang {
  width: auto;
  min-width: 2.5rem;
  padding: 0 0.625rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/*
  Templates — the studio's primary button (.showcase-preview-tab__templates-btn)
  at the bar's height: the brand gradient, white type, the soft green lift, and
  the same deeper gradient under a mouse. Written against both classes so it
  outranks the plain button's hover, press and focus fills declared above.
*/
.tpl-bar__btn.tpl-bar__btn--menu {
  width: auto;
  gap: 0.375rem;
  padding: 0 0.875rem 0 0.75rem;
  color: #fff;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 4px 10px -2px rgba(46, 204, 113, 0.35);
  font-size: 0.8125rem;
  font-weight: 700;
  white-space: nowrap;
}

@media (hover: hover) and (pointer: fine) {
  .tpl-bar__btn.tpl-bar__btn--menu:hover {
    background: linear-gradient(to right, #27ae60, #1873cc);
  }
}

.tpl-bar__btn.tpl-bar__btn--menu:active {
  background: linear-gradient(to right, #27ae60, #1873cc);
}

.tpl-bar__btn.tpl-bar__btn--menu:focus-visible {
  box-shadow:
    inset 0 0 0 2px rgb(56 189 248),
    0 4px 10px -2px rgba(46, 204, 113, 0.35);
}

/* Short of room, the word goes and the gradient stays — the studio's own rule
   for this button. Measured in Chromium: the labelled bar is 327px in English
   (280px in Khmer), so with the dock's 12px gutters it needs a 351px window —
   a 360px Android keeps the word, a 320px iPhone SE does not. */
@media (max-width: 350px) {
  .tpl-bar__btn.tpl-bar__btn--menu {
    width: 2.5rem;
    padding: 0;
  }

  .tpl-bar__menu-label {
    display: none;
  }
}

/* The stages: an inset track so the three read as one segmented control
   rather than three loose icons among the page's other actions. */
.tpl-bar__seg {
  flex: none;
  display: flex;
  transition: opacity 300ms ease;
  align-items: center;
  gap: 0.125rem;
  padding: 0.1875rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
}

.tpl-bar__btn--seg {
  width: 2.375rem;
  height: 2.375rem;
}

/* After :active, so a press on the stage already on screen keeps its fill. */
.tpl-bar__btn--seg.is-active {
  color: #fff;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 2px 6px -1px rgba(46, 204, 113, 0.45);
}

/*
  Hold-to-see-text. Hidden until hover (a mouse), keyboard focus, or a held
  press — the delayed :active rule below — and never pointer-events, so it
  cannot take the tap meant for the button under it. The studio's bar and the
  showcase's own V2FloatingActionBar work the same way.
*/
.tpl-bar__tooltip {
  position: absolute;
  bottom: calc(100% + 0.625rem);
  left: 50%;
  transform: translateX(-50%) translateY(0.25rem);
  padding: 0.375rem 0.625rem;
  border-radius: 0.5rem;
  background: rgb(15 23 42);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: rgb(226 232 240);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: normal;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .tpl-bar__btn:hover .tpl-bar__tooltip {
    opacity: 1;
    transform: translateX(-50%);
  }
}

.tpl-bar__btn:focus-visible .tpl-bar__tooltip {
  opacity: 1;
  transform: translateX(-50%);
}

/* Touch long-press: the reveal only starts after ~450ms of :active. A quick tap
   releases :active well before that, so the pending transition never runs and
   no label flashes on an ordinary tap. The press scale is undone on the label
   itself, so a held button's name is not drawn shrunken. */
.tpl-bar__btn:active .tpl-bar__tooltip {
  opacity: 1;
  transform: translateX(-50%) scale(1.0526);
  transition-delay: 0.45s;
}

.tpl-frames {
  display: grid;
  width: 100%;
  gap: 1.5rem;
  justify-items: center;
}

.tpl-frames--single {
  grid-template-columns: minmax(0, 1fr);
}

.tpl-frames--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tpl-frames--cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tpl-frame-pending {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  background: rgb(15 23 42);
}

.tpl-spinner {
  height: 1.5rem;
  width: 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: rgba(255, 255, 255, 0.85);
  border-radius: 9999px;
  /* Fast: a quicker spinner makes the wait feel shorter than a slow one does,
     for the identical wait. */
  animation: tpl-spin 0.7s linear infinite;
}

@keyframes tpl-spin {
  to {
    transform: rotate(360deg);
  }
}

/*
  Wide and small, so it costs one or two lines rather than three. Everything it
  takes vertically comes straight off the height of the phones above it — which
  on a phone is the whole argument for not showing it here at all: three lines
  of prose that reads once, standing permanently in the band the invitation
  wants. There it heads the catalogue sheet instead.
*/
.tpl-note {
  display: none;
}

@media (min-width: 1024px) {
  .tpl-note {
    display: block;
    max-width: min(100%, 60rem);
    text-align: center;
    font-size: 0.75rem;
    line-height: 1.55;
    color: rgb(100 116 139);
  }
}

/* --- Loading + empty ------------------------------------------------------ */

/* The phone the frame actually is — not the 2:3 box this used to be. A
   skeleton in the wrong proportion means the page settles into a different
   shape the moment it loads, which is the one thing a skeleton exists to
   prevent. Which is why it follows the frame across the same 1024px boundary
   the frame's own shape does (previewFrameSize). */
.tpl-skeleton-frame {
  width: 100%;
  max-width: 300px;
  aspect-ratio: 390 / 844;
  border-radius: 1.5rem;
  background: rgba(226, 232, 240, 0.7);
  animation: tpl-pulse 1.6s ease-in-out infinite;
}

@media (min-width: 1024px) {
  .tpl-skeleton-frame {
    aspect-ratio: 9 / 16;
  }
}

.tpl-skeleton-card {
  aspect-ratio: 9 / 16;
  border-radius: 0.875rem;
  background: rgba(226, 232, 240, 0.7);
  animation: tpl-pulse 1.6s ease-in-out infinite;
}

@keyframes tpl-pulse {
  50% {
    opacity: 0.55;
  }
}

.tpl-empty {
  margin: 0 auto;
  max-width: 32rem;
  padding: 4rem 1.5rem;
  text-align: center;
}

.tpl-empty__disc {
  margin: 0 auto;
  display: flex;
  height: 4rem;
  width: 4rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: linear-gradient(to bottom right, rgba(46, 204, 113, 0.2), rgba(30, 144, 255, 0.2));
}

.tpl-empty__cta {
  margin-top: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  background: rgb(15 23 42);
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  transition:
    background-color 200ms var(--tpl-ease-out),
    transform 160ms var(--tpl-ease-out);
}

.tpl-empty__cta:hover {
  background: rgb(30 41 59);
}

.tpl-empty__cta:active {
  transform: scale(0.97);
}

.tpl-empty__cta:focus-visible {
  outline: none;
  box-shadow: var(--tpl-focus);
}

/* --------------------------------------------------------------------------
   Phone: the studio's full-screen preview

   Scoped to `.is-viewer` rather than to a width: an empty catalogue on a phone
   has no invitation to be full-screen, and keeps the ordinary page with its
   header and the explanation.
   -------------------------------------------------------------------------- */

/* A media viewer, so black rather than the page's ground — on a stage that does
   not paint its own full-bleed background there should be an edge, not a seam.
   Exactly the window, and nothing scrolls: the only scroll surface left is the
   invitation inside the frame. */
.tpl-page.is-viewer {
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  overscroll-behavior: none;
  background: #000;
}

/* The frame is the page: the iframe's own viewport is the device's, so the
   showcase's vh/vw units resolve to exactly what a guest gets. `dvh`, not
   `vh` — a vh-tall frame runs under the URL bar and takes the bar with it. */
.tpl-viewer {
  position: fixed;
  inset: 0;
  height: 100dvh;
  overflow: hidden;
  background: #000;
}

.tpl-viewer__frame {
  position: absolute;
  inset: 0;
}

/* The page's black, not the frame placeholder's slate: nothing here is a
   phone-shaped box waiting to be filled. */
.tpl-viewer .tpl-frame-pending {
  background: transparent;
}

/* Reduced motion keeps the opacity changes that aid comprehension and drops the
   movement — not every animation, just the ones that move. */
@media (prefers-reduced-motion: reduce) {
  .tpl-spinner {
    animation-duration: 2s;
  }

  .tpl-skeleton-frame,
  .tpl-skeleton-card {
    animation: none;
  }

  .tpl-dropdown-enter-active,
  .tpl-dropdown-leave-active {
    transition: opacity 120ms linear;
  }

  .tpl-dropdown-enter-from,
  .tpl-dropdown-leave-to {
    transform: none;
  }

  .tpl-card,
  .tpl-card__img {
    transition-property: box-shadow;
  }

  .tpl-card:hover,
  .tpl-card:active,
  .tpl-card:hover .tpl-card__img {
    transform: none;
  }

  .tpl-back:active,
  .tpl-filter__trigger:active,
  .tpl-seg__btn:active,
  .tpl-step:active,
  .tpl-bar__btn:active,
  .tpl-empty__cta:active {
    transform: none;
  }

  /* The bar still dims when idle — a pure fade now, no sink. */
  .tpl-bar {
    transition-property: background-color, border-color, box-shadow;
  }

  .tpl-bar.is-idle {
    transform: none;
  }

  .tpl-bar__tooltip,
  .tpl-bar__btn:active .tpl-bar__tooltip {
    transform: translateX(-50%);
  }

  /* The menu still fades — that is what says it arrived — but it no longer
     rises into place. */
  .tpl-menu-sheet,
  .tpl-menu-sheet.is-open {
    transition-property: opacity, visibility;
  }

  .tpl-menu-sheet {
    transform: none;
  }

  .tpl-fade-enter-active,
  .tpl-fade-leave-active,
  .tpl-bottom-sheet-enter-active,
  .tpl-bottom-sheet-leave-active {
    transition: none;
  }
}
</style>
