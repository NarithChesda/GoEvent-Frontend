<template>
  <!--
    No top bar and no tab bar. Everything the app's chrome carries — the nav,
    the search, the account menu — belongs to a product the reader of this page
    does not have an account for yet, and what it costs is the first screen,
    which is the only one a sales page is guaranteed to get. MainLayout stays
    for the ground it paints and for the bottom-chrome vars the contact button
    positions against.
  -->
  <MainLayout hide-top-nav hide-mobile-tab-bar>
    <div ref="pageRef" class="partner-page min-h-screen">
      <!--
        The language toggle, in the FAB lane above the contact button.

        It exists here and on no other page because this page hides both the top
        bar and the tab pill, and the app's only language controls live in them —
        so a Khmer-reading shop owner who lands on /partners has, without this,
        no way to read it in Khmer at all. Every other page still carries its
        chrome, where a second control would be a duplicate.

        `--fab-stack-2` is the shared slot above the contact FAB, defined in
        MainLayout against the tab pill's real footprint; the offset is never
        restated here. Everything else is ContactUsFAB's — the circle's two
        sizes, the shadow, the hover lift, the desktop-only tooltip — so the two
        read as one stack rather than as a button and a stray control beside it.
        The brand gradient rather than that one's Telegram blue: the blue is the
        destination's own colour and means "this opens Telegram".

        The face carries the language code, not an icon, because the code is the
        one thing a glance needs — which language you are reading now — and the
        tooltip names the one the press switches *to*.

        First in the DOM, not last: language is the choice that precedes reading
        the page, so it should be the first thing a keyboard reaches. Being
        `fixed`, its position in the flow costs the layout nothing.
      -->
      <button
        type="button"
        class="fab-lang group fixed bottom-[var(--fab-stack-2)] right-4 z-[55] flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-lg shadow-emerald-500/25 hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-emerald-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 lg:right-6 lg:h-14 lg:w-14"
        :aria-label="switchLanguageLabel"
        @click="toggleLanguage"
      >
        <span class="text-xs font-semibold tracking-wide lg:text-base">
          {{ locale.toUpperCase() }}
        </span>
        <span
          class="pointer-events-none absolute right-full mr-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 lg:block"
        >
          {{ switchLanguageLabel }}
        </span>
      </button>

      <!--
        1. HERO — split. The one gradient object here is the primary CTA, so the
        headline gets its emphasis from the slate ladder instead (500 → 900)
        rather than from gradient text, which would put a second gradient object
        in the same viewport.

        Note what the headline does NOT claim: the invitation is hosted on
        goevent.online and always will be. What the partner gets is their logo
        beside ours in the footer (MainContentStage renders `referrer_details`
        that way) and a price they set themselves — so the promise here is
        wholesale and margin, never white-label.

        The headline is a ladder rather than a price: free to start, better
        the more you commit. It opens on the free events because cost is the
        first objection a shop raises, and lands on the pack because that is
        the upside — which is also the order the pricing rail is built in.
        Everything else the old headline carried (your own price, your logo,
        no account for the customer) is one step down, in the subtitle and in
        "What you get".

        Each of the two spans has to fit on ONE line, or the hero reads as a
        paragraph in display type. The budget is ~18 characters, not ~22: the
        narrowest the headline column ever gets is `lg`, where it is 6/12 of
        max-w-6xl (~456px) — narrower than the whole of a 375px phone — which
        is why the 5xl step waits for `xl` and its 7/12 of a wider container.
      -->
      <section class="relative overflow-hidden pt-8 sm:pt-12 lg:pt-16">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div class="lg:col-span-6 xl:col-span-7">
              <!--
                The way off the page and the badge that names it share one row.
                The link takes the corner the app's logo held before the bar came
                off, and the eyebrow — already the hero's first line — keeps its
                place beside it, so losing the bar costs the hero no height.

                The link alone has no `data-reveal`: everything else here is
                content and may arrive, but the one way out is chrome and is
                never worth waiting for. It wraps only below ~320px, where a
                second line beats a row that overflows.
              -->
              <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                <RouterLink
                  to="/events"
                  class="group inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3.5 py-2 text-[0.8125rem] font-medium text-slate-700 backdrop-blur transition-[color,border-color,background-color,transform] duration-200 ease-out hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:text-sm"
                >
                  <ArrowLeft
                    class="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                  {{ t('partners.backToEvents') }}
                </RouterLink>

                <p
                  data-reveal
                  class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 ring-1 ring-slate-900/5 sm:text-[0.8125rem]"
                >
                  <Store class="h-3.5 w-3.5" aria-hidden="true" />
                  {{ t('partners.hero.eyebrow') }}
                </p>
              </div>

              <!-- Two blocks, not two inline spans: an inline space between
                   them is collapsed away by Vue's whitespace handling, and the
                   accent reads stronger on its own line anyway. -->
              <h1
                data-reveal
                style="--reveal-delay: calc(var(--stagger) * 1)"
                class="type-display mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl xl:text-5xl 2xl:text-6xl"
              >
                <span class="block text-slate-500">{{ t('partners.hero.titleLead') }}</span>
                <span class="block text-slate-900">{{ t('partners.hero.titleAccent') }}</span>
              </h1>

              <p
                data-reveal
                style="--reveal-delay: calc(var(--stagger) * 2)"
                class="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
              >
                {{ t('partners.hero.subtitle') }}
              </p>

              <div
                data-reveal
                style="--reveal-delay: calc(var(--stagger) * 3)"
                class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <RouterLink
                  to="/credits"
                  class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-[transform,box-shadow,background-image] duration-200 ease-out hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 sm:text-base"
                >
                  {{ t('partners.hero.ctaPrimary') }}
                  <ArrowRight
                    class="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </RouterLink>

                <button
                  type="button"
                  class="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-3.5 text-sm font-medium text-slate-700 transition-[transform,background-color] duration-200 ease-out hover:bg-slate-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:text-base"
                  @click="scrollToPricing"
                >
                  {{ t('partners.hero.ctaSecondary') }}
                  <ArrowDown class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <!-- The three objections a shop owner raises before reading on,
                   answered in one line each. A list, not chips: chips would be
                   a fourth shape in a viewport that already has two buttons. -->
              <ul
                data-reveal
                style="--reveal-delay: calc(var(--stagger) * 4)"
                class="mt-8 max-w-xl space-y-2.5 border-t border-slate-200 pt-6"
              >
                <li
                  v-for="key in HERO_PROOF"
                  :key="key"
                  class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
                >
                  <Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2ecc71]" aria-hidden="true" />
                  {{ t(`partners.hero.proof.${key}`) }}
                </li>
              </ul>
            </div>

            <!--
              Three real invitations, not a stock device render.

              The page's whole claim is that a shop can charge $60–85 for this,
              and a shop owner settles that by looking. The mockup that stood
              here showed the frame the product arrives in and none of the
              product; three covers show what it is *and* that it comes in more
              than one look, which is the second thing every shop asks.

              The lead card is in normal flow and therefore sets the block's
              height; the two behind it are absolute, so swapping a design in or
              out never moves the hero's baseline.

              It is also the one element that travels further than the rest on
              reveal — 24px against the copy's 14 — because it is the near thing
              in the frame, and it is last in the ladder, so the hero assembles
              as a sentence and then the picture lands under it.
            -->
            <div
              data-reveal
              style="--reveal-delay: calc(var(--stagger) * 5); --reveal-lift: 24px"
              class="lg:col-span-6 xl:col-span-5"
            >
              <div class="hero-fan">
                <img
                  :src="HeroFanLeftImg"
                  alt=""
                  aria-hidden="true"
                  class="hero-fan__card hero-fan__card--left"
                  loading="eager"
                  decoding="async"
                />
                <img
                  :src="HeroFanRightImg"
                  alt=""
                  aria-hidden="true"
                  class="hero-fan__card hero-fan__card--right"
                  loading="eager"
                  decoding="async"
                />
                <!-- One alt for the set. Three alts describing three covers of
                     the same invitation is three ways of saying the same thing
                     to anyone listening rather than looking. -->
                <img
                  :src="HeroFanLeadImg"
                  :alt="t('partners.hero.imageAlt')"
                  class="hero-fan__card hero-fan__card--lead"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!--
        2. STEPS — three columns, no cards. Nothing here is a separable object,
        so a card would be chrome; the oversized slate-200 numerals and a single
        hairline carry the sequence instead.
      -->
      <section id="how-it-works" class="scroll-mt-20 py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="max-w-2xl">
            <h2
              class="type-display-sm text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.steps.title') }}
            </h2>
            <p class="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.steps.subtitle') }}
            </p>
          </header>

          <div class="relative mt-12 sm:mt-14">
            <!-- The thread the three steps hang from — a sibling of the list, not
               a member of it: an empty <li> here is announced as a fourth step.
               Faded at both ends rather than inset by a computed percentage, so
               it needs no arithmetic against the column and gap widths and
               still never hard-stops in mid-air. It passes *behind* the
               markers, which are opaque. Desktop only; stacked, the steps
               already read as a sequence. -->
            <div
              class="pointer-events-none absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent md:block"
              aria-hidden="true"
            ></div>

            <ol class="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
              <li
                v-for="(key, i) in STEPS"
                :key="key"
                data-reveal
                :style="{ '--reveal-delay': `calc(var(--stagger) * ${i})` }"
                class="relative"
              >
                <!-- The numeral is the step label. A "Step one" eyebrow beside a
                   "1" restates it, and it collided with the thread. -->
                <span
                  class="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-bold tabular-nums text-slate-300 ring-1 ring-slate-200"
                >
                  {{ i + 1 }}
                </span>

                <!-- Heading and, on the one step that has one, how long it
                   takes — on the same line, because the number *is* the claim
                   about that step and reading the paragraph should not be the
                   price of finding it.

                   Inverted to `bg-slate-900` rather than tinted: this section
                   has no colour at all, and the pricing grid below already uses
                   the dark fill to mean "look here" (see its comment). A pill
                   is the loudest thing available here and it is spent once on
                   the page's best fact about the work.

                   `flex-wrap` + `gap-y-2` because the row is two languages
                   wide: at `md` the column is ~260px and the Khmer heading and
                   label are both longer, so the pill drops under the heading
                   instead of squeezing it. `whitespace-nowrap` keeps the pill
                   itself from ever breaking across two lines. -->
                <div class="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h3 class="text-lg font-semibold text-slate-900 sm:text-xl">
                    {{ t(`partners.steps.${key}.title`) }}
                  </h3>
                  <span
                    v-if="stepTimingKey(key)"
                    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold leading-5 tabular-nums text-white"
                  >
                    <Clock class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {{ t(stepTimingKey(key)) }}
                  </span>
                </div>

                <p class="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {{ t(`partners.steps.${key}.body`) }}
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <!--
        3. PRICING — the centrepiece, and the only section built from cards,
        because a pack genuinely is a separable, buyable object.

        The featured tier inverts to `bg-slate-900` rather than taking the brand
        gradient: the section's one gradient object is the CTA below the grid,
        and a dark card is a stronger, quieter way to say "this one" than a
        fourth gradient on the page.
      -->
      <section
        id="pricing"
        ref="pricingRef"
        class="scroll-mt-20 border-y border-slate-200 bg-white/60 py-16 sm:py-20 lg:py-28"
      >
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('partners.pricing.eyebrow') }}
            </p>
            <h2
              class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.pricing.title') }}
            </h2>
            <p class="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.pricing.subtitle') }}
            </p>
          </header>

          <!--
            The rail. Always a horizontal scroller, never a grid: the catalogue
            decides how many packs there are, and a grid that has to re-guess its
            track count for every possible N ends up with an orphan on a second
            row the moment the backend adds a pack. A rail has one behaviour for
            two cards and for ten.

            It bleeds to the viewport edge with a negative margin and pays the
            padding back inside, so the first card lines up with the heading
            while the last one can scroll past the container's right edge —
            without that, cards stop short of the edge and the row reads as
            clipped rather than continuing.

            `scroll-pl-*` matches that padding so a snapped card lands on the
            heading's left edge rather than under the fade.
          -->
          <div data-reveal class="relative mt-10 sm:mt-12">
            <div
              ref="railRef"
              class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 pb-2 sm:-mx-6 sm:gap-5 sm:scroll-pl-6 sm:px-6 lg:-mx-8 lg:scroll-pl-8 lg:px-8"
              :class="{ 'rail-fade-start': canScrollBack, 'rail-fade-end': canScrollOn }"
              tabindex="0"
              role="region"
              :aria-label="t('partners.pricing.scrollLabel')"
              @scroll.passive="updateRailEdges"
            >
              <article
                v-for="(tier, i) in tiers"
                :key="tier.key"
                data-reveal
                :style="{ '--reveal-delay': `calc(var(--stagger) * ${Math.min(i, 4)})` }"
                class="flex w-[17.5rem] flex-none snap-start flex-col rounded-2xl p-6 sm:w-[19.5rem] sm:p-7"
                :class="
                  tier.featured
                    ? 'bg-slate-900 shadow-xl shadow-slate-900/10'
                    : 'border border-slate-200/60 bg-white shadow-sm'
                "
              >
                <!--
                  Why this card is worth a second look, said once per card in
                  one slot. The wrapper is always rendered and holds the line's
                  height, so a tier with nothing to claim — the middle of a long
                  wholesale ladder — leaves a gap rather than pulling its figure
                  a line above its neighbours'.

                  Only the recommendation is emerald. A green label on every
                  card would read as a row of "success" markers and spend the
                  one saturated colour the system has on a qualifier; slate
                  everywhere else is what makes the featured one look chosen.
                -->
                <div class="mb-4 min-h-4">
                  <p
                    v-if="tier.badge"
                    class="text-xs font-semibold uppercase tracking-wider"
                    :class="tier.featured ? 'text-emerald-300' : 'text-slate-500'"
                  >
                    {{ tier.badge }}
                  </p>
                </div>

                <div class="min-w-0">
                  <h3
                    class="text-sm font-semibold"
                    :class="tier.featured ? 'text-white' : 'text-slate-900'"
                  >
                    {{ tier.name }}
                  </h3>
                  <p
                    class="mt-1 text-sm"
                    :class="tier.featured ? 'text-slate-400' : 'text-slate-500'"
                  >
                    {{ tier.credits }}
                  </p>
                  <!--
                    Which packages the credits unlock. Two packs can be the same
                    size at the same price and still be different products — "25
                    Basic" and "25 Basic Plus" are — so without this line those
                    two cards differ by one word in the title and read as a bug.

                    A step smaller than the count above it and allowed to wrap:
                    a pack spanning several plans has a genuinely long label, and
                    truncating it would hide the very thing the line is here to
                    show.
                  -->
                  <p
                    v-if="tier.plans"
                    class="mt-1.5 text-xs leading-relaxed"
                    :class="tier.featured ? 'text-slate-500' : 'text-slate-400'"
                  >
                    {{ t('partners.pricing.forPlan', { plan: tier.plans }) }}
                  </p>
                </div>

                <!--
                  The figure the page exists to show: what the whole pack is
                  worth once it is sold through. It used to be the per-invitation
                  cost, which is the honest unit but the wrong headline — "$27"
                  is a price, and a shop owner is deciding whether this is a
                  business. "$825–1,450" answers that. The unit economics keep
                  their place in the rows below, one type step down.

                  `whitespace-nowrap` because these are ranges, and a break after
                  the dash reads as two unrelated numbers.
                -->
                <div class="mt-6">
                  <p
                    class="text-xs font-medium uppercase tracking-wider"
                    :class="tier.featured ? 'text-emerald-300' : 'text-slate-500'"
                  >
                    {{ t('partners.pricing.profitLabel') }}
                  </p>
                  <p
                    class="mt-1.5 whitespace-nowrap text-3xl font-bold leading-none tabular-nums sm:text-4xl"
                    :class="tier.featured ? 'text-white' : 'text-slate-900'"
                  >
                    {{ tier.profit }}
                  </p>
                  <p
                    class="mt-2 text-xs leading-relaxed"
                    :class="tier.featured ? 'text-slate-400' : 'text-slate-500'"
                  >
                    {{ tier.profitCaption }}
                  </p>
                </div>

                <!-- The unit economics behind the figure, as rows. Rows rather
                     than a nested card: nothing here is separable from the pack
                     it describes. "Pay up front" leads because it is the one
                     axis on which the trial and pay-as-you-go beat every pack,
                     and the reason they exist. -->
                <dl
                  class="mt-6 divide-y border-t text-sm"
                  :class="
                    tier.featured
                      ? 'divide-white/10 border-white/10'
                      : 'divide-slate-100 border-slate-100'
                  "
                >
                  <div
                    v-for="row in tierRows(tier)"
                    :key="row.label"
                    class="flex items-baseline justify-between gap-3 py-2.5"
                  >
                    <dt
                      class="min-w-0 truncate"
                      :class="tier.featured ? 'text-slate-400' : 'text-slate-500'"
                    >
                      {{ row.label }}
                    </dt>
                    <dd
                      class="whitespace-nowrap font-medium tabular-nums"
                      :class="tier.featured ? 'text-slate-200' : 'text-slate-700'"
                    >
                      {{ row.value }}
                    </dd>
                  </div>
                </dl>

                <!-- `mt-auto` on the wrapper, not on the note, so a live pack
                     with an empty `description` still pushes nothing around: the
                     spacer holds the card's bottom alignment whether or not
                     there is a sentence to print. -->
                <div class="mt-auto">
                  <p
                    v-if="tier.note"
                    class="pt-5 text-xs leading-relaxed"
                    :class="tier.featured ? 'text-slate-400' : 'text-slate-500'"
                  >
                    {{ tier.note }}
                  </p>
                </div>
              </article>
            </div>

            <!--
              Arrows are a pointer affordance only: a touch device already has
              the gesture, and a control floating over a card the thumb is about
              to swipe is in the way. They sit outside the scroller so they never
              scroll away from the reader, and the whole layer is dropped when
              everything already fits — an arrow that cannot move anything is
              worse than no arrow.

              `tabindex="-1"` and `aria-hidden` because the scroll container
              itself is focusable and arrow-key scrollable: a keyboard user
              already has a better path than tabbing through two buttons, and
              announcing them would only add noise.
            -->
            <div
              v-if="railOverflows"
              class="rail-arrows pointer-events-none absolute inset-y-0 left-0 right-0 items-center justify-between"
              aria-hidden="true"
            >
              <button
                v-for="dir in RAIL_DIRECTIONS"
                :key="dir"
                type="button"
                tabindex="-1"
                :disabled="dir < 0 ? !canScrollBack : !canScrollOn"
                class="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-600 shadow-lg backdrop-blur-sm transition-[transform,opacity,background-color] duration-200 ease-out hover:bg-white hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :class="dir < 0 ? '-ml-5' : '-mr-5'"
                @click="scrollRail(dir)"
              >
                <ChevronLeft v-if="dir < 0" class="h-5 w-5" />
                <ChevronRight v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div data-reveal class="mt-10 flex flex-col items-start gap-6 sm:mt-12">
            <RouterLink
              to="/credits"
              class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-[transform,box-shadow,background-image] duration-200 ease-out hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 sm:text-base"
            >
              {{ t('partners.pricing.cta') }}
              <ArrowRight
                class="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </RouterLink>

            <p class="max-w-3xl text-xs leading-relaxed text-slate-500">
              {{ t('partners.pricing.footnote') }}
            </p>
          </div>
        </div>
      </section>

      <!--
        4. PRODUCT — what the partner is actually reselling, and therefore the
        justification for the retail column above.

        This section used to be eight icons in gradient discs with a paragraph
        under each: about 170 words describing an invitation, on a page whose
        one job is to make someone want to sell that invitation. A drawing of a
        film reel is a placeholder for a picture of the thing. So the argument
        is now made by three real screenshots of a real invitation, and the
        features are demoted to the checklist under them — their existing
        titles, which were already short, with the paragraphs deleted. Show,
        then list; never list what you have just shown.

        Only one screenshot is on screen at a time, in one phone, rather than
        three phones side by side: three phones make the reader compare three
        designs, and these are three parts of the *same* invitation.
      -->
      <section class="bg-slate-50 py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <!--
            Three blocks, placed explicitly, so the desktop grid and the mobile
            stack can want different orders without fighting each other.

            A phone is 2.16 times taller than it is wide, so the picture is
            ~570px tall while three picker rows are ~190px. Beside the picker
            alone that left roughly 400px of nothing next to the invitation, and
            the section read as a screenshot with a little text stranded beside
            it. The fix is to give that column more to hold rather than to
            shrink the phone: header, picker and the feature list stack down
            the left in two grid rows while the phone spans both on the right,
            which brings the two sides within a few pixels of each other.

            **DOM order is the mobile order, and it is header → phone → picker.**
            Stacked, the desktop source order would put the picker under the
            feature list — 230px below the thing it controls, so pressing
            "The day" changes nothing you can see. Explicit `col-start` /
            `row-start` at `lg` means the source can be ordered for the phone
            without `order` utilities having to undo it.
          -->
          <div class="grid items-start gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
            <header data-reveal class="lg:col-span-6 lg:col-start-1 lg:row-start-1">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {{ t('partners.product.eyebrow') }}
              </p>
              <h2
                class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
              >
                {{ t('partners.product.title') }}
              </h2>
              <p class="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
                {{ t('partners.product.subtitle') }}
              </p>
            </header>

            <!--
              All three screenshots are mounted and crossfaded rather than one
              image element whose source is swapped: swapping the source shows
              white until the new file decodes, and the first press of every
              button would flash. Blur carries the fade because without it the
              eye sees two invitations overlapping rather than one changing.
            -->
            <div data-reveal class="lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1">
              <div class="device mx-auto">
                <div class="device__screen">
                  <img
                    v-for="screen in SCREENS"
                    :key="screen.key"
                    :src="screen.src"
                    :alt="
                      activeScreen === screen.key
                        ? t(`partners.product.screens.${screen.key}.body`)
                        : ''
                    "
                    :aria-hidden="activeScreen !== screen.key ? 'true' : undefined"
                    class="device__shot"
                    :class="{ 'is-active': activeScreen === screen.key }"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            <div class="lg:col-span-6 lg:col-start-1 lg:row-start-2">
              <!--
                The picker, and the caption for whatever is on the glass.

                Buttons with `aria-pressed`, not a tablist: a tablist owes the
                reader roving arrow-key focus and a labelled panel, and this is
                three toggles over one picture — Tab reaches each of them, the
                pressed state is announced, and nothing is hidden behind a key
                nobody thinks to press. The row's own body line changes with the
                choice, so the picker never becomes three words with no answer.

                `data-reveal` is on the list, not on each button. Three rows
                stacked 10px apart cascading one after another is motion nobody
                can read as a sequence, and the reveal is the wrong thing to
                hang off an element whose class Vue rewrites on every press.
              -->
              <ul
                data-reveal
                style="--reveal-delay: calc(var(--stagger) * 1)"
                class="space-y-2"
                :aria-label="t('partners.product.screensLabel')"
              >
                <li v-for="screen in SCREENS" :key="screen.key">
                  <button
                    type="button"
                    class="group w-full rounded-xl border px-4 py-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                    :class="
                      activeScreen === screen.key
                        ? 'border-slate-900 bg-white shadow-sm shadow-slate-900/5'
                        : 'border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-white'
                    "
                    :aria-pressed="activeScreen === screen.key"
                    @click="activeScreen = screen.key"
                  >
                    <span class="flex items-center gap-2.5">
                      <!-- The marker is a filled disc rather than a tick: a tick
                           says "done", and nothing here is completed — one of
                           three is simply the one on the glass. -->
                      <span
                        class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color] duration-200 ease-out"
                        :class="
                          activeScreen === screen.key
                            ? 'border-slate-900 bg-slate-900'
                            : 'border-slate-300 bg-white'
                        "
                        aria-hidden="true"
                      >
                        <component
                          :is="screen.icon"
                          class="h-2.5 w-2.5"
                          :class="activeScreen === screen.key ? 'text-white' : 'text-slate-400'"
                        />
                      </span>
                      <span class="text-[0.9375rem] font-semibold text-slate-900">
                        {{ t(`partners.product.screens.${screen.key}.label`) }}
                      </span>
                    </span>
                    <span
                      class="mt-1 block pl-[1.875rem] text-[0.8125rem] leading-snug text-slate-600"
                    >
                      {{ t(`partners.product.screens.${screen.key}.body`) }}
                    </span>
                  </button>
                </li>
              </ul>

              <!--
                The nine features, as a list under the picker rather than nine
                tiles of their own. No gradient discs: the page's gradient
                objects are its three "Request partner access" CTAs, and nine
                more in one grid spent the brand's one saturated colour on a
                caption.
              -->
              <ul
                data-reveal
                style="--reveal-delay: calc(var(--stagger) * 2)"
                class="mt-8 grid gap-x-6 gap-y-2.5 border-t border-slate-200 pt-6 sm:grid-cols-2"
              >
                <li
                  v-for="item in PRODUCT_FEATURES"
                  :key="item.key"
                  class="flex items-start gap-2 text-[0.8125rem] leading-relaxed text-slate-700"
                >
                  <component
                    :is="item.icon"
                    class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  {{ t(`partners.product.${item.key}.title`) }}
                </li>
              </ul>
            </div>
          </div>

          <!--
            THE CODA — the way to see all of them rather than these three.

            A link, not a section: the live preview is a catalogue column plus
            three phone frames, which is a screen's worth of furniture and three
            boots of the whole app — too much to put in the middle of a page
            whose job is to make an argument, and it earns its own page instead
            (/partners/templates).

            IT IS CENTRED, AND IT HAS NO RULE ACROSS THE CONTAINER. It had one,
            and that was the whole problem: a full-bleed hairline is the
            strongest "new topic" signal a page owns, so the rule said "this is
            a section" while the shared slate ground said "this is the same
            one" — and a reader resolves that contradiction as one badly-centred
            section. It is not a section, so it does not get a section's
            furniture. Space separates it, and it resolves on the container's
            own centre line, which is an axis the two-column grid above never
            uses. A change of alignment is what makes a coda read as a coda, and
            it costs no ink.

            Nor does it get an eyebrow or a heading of its own. One band, one
            heading; a second one here would be the same claim to sectionhood in
            words rather than in a line.

            EVIDENCE → LINE → ACTION, which is the order the whole band already
            reads in (show, then say, then do). Four covers, because "browse
            every design" is a claim and four visibly different designs are the
            evidence; then what pressing does; then the press. Ending the band
            on the button rather than on its caption leaves the last thing in
            the section as the thing to do.

            Slate on the button, not the brand gradient: the gradient object in
            this neighbourhood is the CTA in the next section. Centring it gives
            it prominence by position, which is the cheaper of the two ways to
            promote a control and the one that does not spend the brand colour.
          -->
          <div
            data-reveal
            class="catalogue mt-14 flex flex-col items-center gap-5 text-center sm:mt-16 lg:mt-20"
          >
            <ul class="flex items-center justify-center gap-2 sm:gap-2.5" aria-hidden="true">
              <li v-for="cover in COVER_STRIP" :key="cover.src">
                <img :src="cover.src" alt="" class="cover-chip" loading="lazy" decoding="async" />
              </li>
            </ul>

            <p class="max-w-md text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
              {{ t('partners.product.previewHint') }}
            </p>

            <RouterLink
              to="/partners/templates"
              class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-[transform,background-color] duration-200 ease-out hover:bg-slate-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 sm:text-base"
            >
              <Eye class="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {{ t('partners.product.previewCta') }}
              <ArrowRight
                class="h-4 w-4 flex-shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </RouterLink>
          </div>
        </div>
      </section>

      <!--
        5. THE DAY ITSELF — the other half of what a credit buys, and the half
        no screenshot of an invitation can carry.

        Pictures, not sentences. A shop owner selling a wedding does not want to
        read that there is guest management; they want to see whether it looks
        like something they could hand to a customer's family, and a real screen
        answers that faster than the seven sentences that used to be scattered
        through "What you get".

        Cards, not screenshots. Every capture here is one panel of the app —
        `#guests-panel`, the RSVP card, the cash gift card — lifted out of its
        page with the sidebar, the tab bar and the page heading left behind. A
        full-window screenshot spends most of its pixels on furniture the reader
        is not buying, and next to a cropped card it reads as the untidy one. It
        also retires the drawn browser frame: that chrome existed to say "this
        one is a desk thing" around a full window, and there is no longer a
        window to frame.

        TWO BEATS, NOT THREE PICTURES. The heading promises two things — the
        whole list, and what it adds up to — so the section delivers them in
        that order, each with its own claim beside its own evidence. Stacked
        full-bleed instead, the guest panel arrived at almost native size and
        took a whole screen before the reader had been told what they were
        looking at, and the two analytics cards under it read as two more
        pictures rather than as the answer to the first one. Four ticks in a row
        underneath were then the only words in the section, arriving after all
        the evidence they were meant to introduce.

        The text column stays on the LEFT in both beats rather than alternating.
        Zig-zag rows are the reflex here and they are wrong for two beats: with
        no third row there is no rhythm to establish, only a crossing the eye has
        to make. A fixed left rail lets someone read claim, then claim, straight
        down while the evidence changes beside them — one argument in two steps,
        which is what this is.

        THE DETAIL THAT MAKES IT LOOK DESIGNED: every capture is taken at a
        width proportional to the width it is displayed at, so the app's own
        14px type renders at the same physical size in all three cards. The
        guest panel is shot at 960px CSS and shown across `col-span-8`; the
        analytics are shot at 488 and shown two-up inside that same span. From
        `lg` up those land within ~4% of each other (0.74 against 0.71), and
        below `lg` the panel goes full width at 0.75 — so moving it out of
        full bleed and into a column costs it almost nothing. Capture them all
        at one width instead and the wide card's text comes out half the size of
        its neighbours', which is the thing that makes a set of screenshots look
        thrown together even when the grid is perfect.
      -->
      <section class="py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('partners.runday.eyebrow') }}
            </p>
            <h2
              class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.runday.title') }}
            </h2>
            <p class="mt-4 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.runday.subtitle') }}
            </p>
          </header>

          <!--
            BEAT ONE — the list. EVIDENCE LEFT, WORDS RIGHT.

            This is the beat that turns, and which one turns is decided by the
            section above it, not inside this one. "What you are selling" ends
            with its phone on the right; a guest panel on the right immediately
            after would be the third picture in a row on the same side. So the
            list goes left, the totals return to the right, and the page
            alternates on every row from the product section through to the
            full-width band in "What you get" — where the two-column machine
            stops entirely.

            Leading with the picture also suits this beat specifically: the
            guest panel is the widest, most legible screenshot on the page, and
            in a left-to-right read it now arrives before its caption rather
            than after it.

            Done with `lg:col-start` + `lg:row-start`, NOT by reordering the
            markup — the same technique the product section uses. DOM order
            stays words-then-picture because that is the order below `lg`, where
            the grid collapses to one column and the claim has to arrive before
            the evidence it introduces. Both children need an explicit
            `lg:row-start-1`: grid auto-placement never backtracks, so the
            second child asking for column 1 would otherwise be pushed to a
            second row instead of sliding in beside the first.

            The copy stays LEFT-aligned in a right-hand column. Ragged-right is
            for the margin, not the reading edge — right-aligning a paragraph
            plus a tick list would hang every tick off a different x and cost
            more than the symmetry is worth.

            `data-reveal` on the column, not on each claim: three rows stacked
            10px apart cascading one after another is motion nobody can read as
            a sequence.

            THE CASCADE FOLLOWS THE EYE, WHICH MEANS IT MIRRORS WITH THE SIDES.
            The rule for both beats is "leading column at 0, trailing column one
            `--stagger` behind" — so here, with the picture on the left, the
            picture leads and the words follow; in beat two, with the words on
            the left, the words lead. Keeping a fixed words-then-evidence order
            through the flip would have played this row right-to-left, which is
            a ripple against the reading direction and the one thing a 60ms
            stagger is guaranteed to make visible.

            Below `lg` the two stack and the delay stops mattering rather than
            becoming wrong: a stagger only reads as a cascade when both elements
            cross the reveal line in the same frame, and stacked they are ~250px
            of scroll apart on a phone. The value is therefore tuned for the
            two-column case and is inert in the one-column one — which is why it
            needs no media query.

            `lg:gap-10 xl:gap-14`: the tighter gutter exists for the one
            breakpoint that needs it. At `lg` exactly, the container is 960px
            and every pixel of gutter is a pixel the guest panel does not have;
            the page's usual 56px rhythm returns at `xl`, where there is room to
            pay for it.

            `lg:items-start`, not centred. Centring a 260px column against a
            620px picture floats the words in the middle of nowhere and opens a
            second, larger gap under the section heading than the one the
            heading's own margin set. Top-aligned, each beat's words start on
            the same line as its evidence — which is what holds the two beats
            together once they no longer share a side.

            `max-w-lg` below `lg`, where the column is the container: the body
            is `text-sm`, and at the 720px of a tablet that is a 95-character
            measure. Released at `lg`, where `col-span-4` is already narrower
            than the cap.
          -->
          <div
            class="mt-12 grid gap-8 sm:mt-14 lg:mt-16 lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-14"
          >
            <div
              data-reveal
              style="--reveal-delay: calc(var(--stagger) * 1)"
              class="max-w-lg lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:max-w-none"
            >
              <h3 class="text-lg font-semibold tracking-tight text-slate-900">
                {{ t('partners.runday.beats.list.label') }}
              </h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-600">
                {{ t('partners.runday.beats.list.body') }}
              </p>
              <ul class="mt-5 space-y-2.5">
                <li
                  v-for="key in RUN_DAY_LIST_POINTS"
                  :key="key"
                  class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
                >
                  <Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2ecc71]" aria-hidden="true" />
                  {{ t(`partners.runday.points.${key}`) }}
                </li>
              </ul>
            </div>

            <!--
              The guest panel, and the breakpoint that picks its capture.

              Below `sm` the page shows the app's own phone layout: the 960px
              capture rendered into a 358px column puts its guest names at about
              five pixels, and on a page read mostly on phones — this is
              Cambodia, and the reader is a shop owner between customers — that
              would be the whole audience getting the unreadable picture.

              `<picture>` rather than a pair of plain images and `sm:hidden`,
              which is what this was: a lazily-loaded image inside a
              `display: none` box is still fetched, so every reader was
              downloading both captures and using one. A `<source>` with a media
              query is resolved before the fetch, so exactly one crosses the
              wire.

              `width`/`height` on the source and the image rather than a CSS
              `aspect-ratio`: the browser derives the box from the attributes of
              whichever one it picked, so a lazy image reserves its own space
              before it decodes and the two captures can have different shapes
              without either one needing a rule. Update them with the captures —
              a stale pair reserves the wrong height and the row below jumps.
            -->
            <figure
              data-reveal
              style="--reveal-lift: 20px"
              class="app-card app-card--continues lg:col-span-8 lg:col-start-1 lg:row-start-1"
            >
              <picture>
                <source
                  :srcset="DashboardGuestsImg"
                  media="(min-width: 640px)"
                  width="1500"
                  height="1052"
                />
                <img
                  :src="DashboardGuestsPhoneImg"
                  :alt="t('partners.runday.imageAlt')"
                  width="796"
                  height="1726"
                  class="block w-full"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </figure>
          </div>

          <!--
            BEAT TWO — what the list comes to.

            Ruled off from the first beat rather than only spaced apart: the
            page already uses a hairline to mean "same argument, next part" (the
            benefits list, the browse-designs footer), and a long page separated
            only by whitespace loses its joints.

            `md:grid-cols-2` rather than `sm:`: at `sm` the two analytics cards
            side by side are 288px each, which renders the app's 14px type at
            about 8px. One card per row up to `md` is bigger, not smaller — the
            pair only splits once the row is wide enough to keep both legible.

            `items-start`: the two captures are a few percent apart in aspect
            ratio, and a stretched grid item would pad the shorter card with a
            strip of empty white below its image.

            Words left, evidence right — the page's default handedness, which
            this beat returns to after the first one turns it (see BEAT ONE).
            The alternation is what the two beats have instead of a repeat.
          -->
          <div
            class="mt-12 grid gap-8 border-t border-slate-200 pt-12 sm:mt-14 sm:pt-14 lg:mt-16 lg:grid-cols-12 lg:items-start lg:gap-10 lg:pt-16 xl:gap-14"
          >
            <div data-reveal class="max-w-lg lg:col-span-4 lg:max-w-none">
              <h3 class="text-lg font-semibold tracking-tight text-slate-900">
                {{ t('partners.runday.beats.totals.label') }}
              </h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-600">
                {{ t('partners.runday.beats.totals.body') }}
              </p>
              <ul class="mt-5 space-y-2.5">
                <li
                  v-for="key in RUN_DAY_TOTAL_POINTS"
                  :key="key"
                  class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
                >
                  <Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2ecc71]" aria-hidden="true" />
                  {{ t(`partners.runday.points.${key}`) }}
                </li>
              </ul>
            </div>

            <div class="grid items-start gap-3 sm:gap-4 md:grid-cols-2 lg:col-span-8">
              <figure
                v-for="(shot, i) in RUN_DAY_SHOTS"
                :key="shot.key"
                data-reveal
                :style="{
                  '--reveal-delay': `calc(var(--stagger) * ${i + 1})`,
                  '--reveal-lift': '20px',
                }"
                class="app-card"
              >
                <img
                  :src="shot.src"
                  :alt="t(`partners.runday.shots.${shot.key}`)"
                  :width="shot.w"
                  :height="shot.h"
                  class="block w-full"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        </div>
      </section>
      <!--
        6. PARTNER BENEFITS — a spec sheet, not a feature grid: each item is
        ruled off at the top and carries no icon disc, so it reads as terms
        rather than as marketing, which is the register a business audience
        trusts at this point in the page.

        FULL WIDTH, NOT A LEFT RAIL. This was a `col-span-4` heading beside a
        `col-span-8` list, and it was the fourth consecutive row on the page to
        put words on the left and content on the right — after the product
        section and both beats of the guest list. That run is what made the
        page feel like one layout repeated rather than seven sections.

        Handedness was not the thing to fix, though. Measured at 1440x900, the
        left column here was 248px wide and 29% full: an eyebrow, a three-line
        heading, and then 71% of the row's height as white. The page has no
        subtitle to put under that heading, so the column had nothing left to
        say. What the eye tracked down the second half of the page was not a
        repeating layout but a repeating *hole* — which is why alternating the
        sides would have mirrored the problem rather than solved it.

        Full width costs the heading nothing (it was never wider than
        `max-w-2xl` anyway) and pays the list: at two columns of the whole
        container the items go from ~251px to ~393px, so no title wraps any
        more, and five items land as 2 + 2 + 1. Three columns would have fitted
        the width too, and returned the items to their old 251px measure for
        nothing.
      -->
      <section class="py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('partners.partner.eyebrow') }}
            </p>
            <h2
              class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.partner.title') }}
            </h2>
          </header>

          <ul class="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:mt-12 lg:gap-x-16">
            <li
              v-for="(item, i) in PARTNER_BENEFITS"
              :key="item.key"
              data-reveal
              :style="{ '--reveal-delay': `calc(var(--stagger) * ${i % 2})` }"
              class="border-t border-slate-200 pt-5"
            >
              <div class="flex items-center gap-2.5">
                <component
                  :is="item.icon"
                  class="h-4 w-4 flex-shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <h3 class="text-base font-semibold text-slate-900">
                  {{ t(`partners.partner.${item.key}.title`) }}
                </h3>
              </div>
              <p class="mt-2 text-sm leading-relaxed text-slate-600">
                {{ t(`partners.partner.${item.key}.body`) }}
              </p>
            </li>
          </ul>
        </div>
      </section>

      <!--
        7. FAQ — the last informative section and the only interactive one, so
        it earns a shape of its own: a single panel lifted off the page's tinted
        ground, with full-bleed rows inside it.

        One card, not seven. The set is one object — a reader opens it, works
        down it and leaves — so the panel is the card and the questions are its
        contents. Seven bordered boxes would be seven objects to separate from
        each other before reading any of them, which is chrome charged for
        nothing. The panel clips its own corners (`overflow-hidden`) so a row's
        hover ground and focus ring can run edge to edge without any row having
        to know whether it is the first or the last.

        Rows open independently, and the first is open on arrival.

        Independently, because single-open moved the row out from under the
        reader's own cursor: opening the fifth question while the first was open
        collapses ~90px above it, so the row they just pressed slid upward as
        its answer arrived. With every row its own toggle the pressed row never
        moves — only what is below it does, which is what a reader expects. The
        wall of text single-open was guarding against is now the reader's own
        choice, which on a page whose job is to inform is the right place for it.

        Open on arrival, because eight headings over an empty section reads as a
        section with nothing in it. One open row gives the section its body and
        teaches that the rows open, without spending a line of copy saying so.
      -->
      <section class="border-t border-slate-200 py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header data-reveal class="text-center">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('partners.faq.eyebrow') }}
            </p>
            <h2
              class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.faq.title') }}
            </h2>
          </header>

          <div
            class="mt-10 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 sm:mt-12"
          >
            <div
              v-for="(key, i) in FAQ_KEYS"
              :key="key"
              data-reveal
              :style="{ '--reveal-delay': `calc(var(--stagger) * ${Math.min(i, 5)})` }"
            >
              <h3>
                <!--
                  The row's hover had nothing to land on before: the button set
                  `hover:text-slate-600`, and both of its children — the question
                  at `text-slate-900`, the chevron at `text-slate-400` — set
                  their own colour, so the hover inherited onto nothing and the
                  only interactive section on the page answered the pointer with
                  silence. The ground moves now, and the marker with it.
                -->
                <button
                  type="button"
                  class="group flex min-h-[64px] w-full items-center justify-between gap-5 px-5 py-4 text-left transition-colors duration-200 ease-out hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 sm:px-6"
                  :aria-expanded="isFaqOpen(key)"
                  :aria-controls="`faq-panel-${key}`"
                  @click="toggleFaq(key)"
                >
                  <span
                    class="text-base font-semibold text-slate-900 transition-colors duration-200 ease-out sm:text-lg"
                  >
                    {{ t(`partners.faq.${key}.q`) }}
                  </span>

                  <!--
                    The marker is a disc rather than a bare chevron so the open
                    state can be read from across the panel — an inverted circle
                    is visible in peripheral vision, a rotated 16px glyph is
                    not. It is also the row's only moving part on press: scaling
                    a full-bleed row would deform the panel, scaling the disc
                    says the same thing inside 32px.
                  -->
                  <span
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-200 ease-out group-active:scale-90"
                    :class="
                      isFaqOpen(key)
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600'
                    "
                  >
                    <ChevronDown
                      class="h-4 w-4 transition-transform duration-200 ease-out"
                      :class="{ 'rotate-180': isFaqOpen(key) }"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </h3>

              <Transition name="collapse">
                <div v-if="isFaqOpen(key)" :id="`faq-panel-${key}`" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <!-- The right inset only clears the disc column from `sm` up.
                         On a phone the answer takes the full measure instead: the
                         disc column is 56px of a 390px screen, and paying that for
                         symmetry with the question above cuts the answer to about
                         thirty characters a line. Nothing sits to the right of the
                         answer to align with anyway. -->
                    <p
                      class="pb-5 pl-5 pr-6 text-sm leading-relaxed text-slate-600 sm:pb-6 sm:pl-6 sm:pr-20 sm:text-base"
                    >
                      {{ t(`partners.faq.${key}.a`) }}
                    </p>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </section>

      <!--
        8. CLOSING — the page's third and last gradient object, and now also its
        end. `AppFooter` is gone from here for the reason the top bar is: its
        nav, its social row and its "explore the app" link all belong to a
        product this reader has no account for, and on a page that is a pitch
        they are five ways to leave before the ask. So everything the reader
        still needs lands in this section or nowhere — the ask, a person to talk
        to, and the way back.
      -->
      <section class="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div class="mx-auto max-w-4xl lg:max-w-6xl 2xl:max-w-7xl">
          <div
            data-reveal
            class="relative isolate overflow-hidden rounded-3xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-6 py-14 text-center shadow-xl shadow-slate-900/10 sm:px-10 sm:py-16 lg:py-20"
          >
            <!-- Light inside the one gradient object rather than a second one:
                 two soft radial washes give the band a lit corner and a shaded
                 one, so at this size it reads as a surface and not a swatch. -->
            <div class="cta-sheen pointer-events-none absolute inset-0" aria-hidden="true"></div>

            <div class="relative">
              <h2
                class="type-display-sm mx-auto max-w-2xl text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl"
              >
                {{ t('partners.closing.title') }}
              </h2>
              <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                {{ t('partners.closing.subtitle') }}
              </p>

              <div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <RouterLink
                  to="/credits"
                  class="group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10 transition-[transform,background-color] duration-200 ease-out hover:bg-slate-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:text-base"
                >
                  {{ t('partners.closing.cta') }}
                  <ArrowRight
                    class="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </RouterLink>

                <!--
                  Given a shape, because it was a ghost: white-on-gradient text
                  with no edge is the weakest thing in the panel, and this is
                  the one control for a shop owner who would rather ask a person
                  than fill in a form. It stays quieter than the primary by fill
                  — a translucent wash against solid white — rather than by
                  having no outline at all.
                -->
                <a
                  :href="TELEGRAM_URL"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-[transform,background-color,border-color] duration-200 ease-out hover:border-white/60 hover:bg-white/20 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:text-base"
                >
                  <MessageCircle class="h-4 w-4" aria-hidden="true" />
                  {{ t('partners.closing.telegram') }}
                </a>
              </div>
            </div>
          </div>

          <!--
            The way back, at the end of the page rather than in a footer. The
            hero's copy of this link is the escape a reader takes on arrival;
            this one is for the reader who has finished and now has to decide.
            One link on the page's own ground, deliberately not a bar with a
            rule over it — that would be the footer again, rebuilt by hand.
          -->
          <div data-reveal class="mt-8 flex justify-center sm:mt-10">
            <RouterLink
              to="/events"
              class="group inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-500 transition-colors duration-200 ease-out hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            >
              <ArrowLeft
                class="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              {{ t('partners.backToEvents') }}
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * The partner offer, as a page a salesperson can send or present.
 *
 * Why this is authored content and not the live catalogue: every endpoint under
 * `/api/payment/` answers 403 without `is_partner`, deliberately — wholesale
 * pricing is confidential — so a page whose whole job is to be opened by
 * someone who is *not* a partner yet cannot fetch a single figure. The numbers
 * therefore live in `partners.json`, in one `pricing.tiers` block, so changing
 * the offer is an edit to two locale files and nothing else.
 *
 * Every CTA points at `/credits`. The router already bounces an unauthenticated
 * visitor to `/signin?redirect=/credits`, and `CreditsTab` already renders the
 * partner application for a signed-in non-partner — so one link serves the
 * signed-out prospect, the applicant and the approved partner without this page
 * knowing which it is talking to.
 */
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Eye,
  Film,
  Gift,
  Images,
  Languages,
  Link2,
  MessageCircle,
  Palette,
  QrCode,
  Sparkles,
  Store,
  UserCheck,
  Users,
} from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  usePartnerPricingTiers,
  type PartnerPricingTier,
} from '@/composables/usePartnerPricingTiers'
/**
 * Real screenshots of a real invitation and a real guest list, captured from
 * the app itself rather than drawn. They are checked in rather than fetched
 * because this page must make its argument for a reader with no account and
 * possibly no network to spare: every endpoint that could produce them live is
 * either behind `is_partner` or three full app boots away (see
 * /partners/templates, which is where the live version lives).
 *
 * Regenerating them is documented in docs/guides/PARTNER_PAGE_SCREENSHOTS.md.
 */
import HeroFanLeftImg from '@/assets/partners/invite-cover-khmer.webp'
import HeroFanLeadImg from '@/assets/partners/invite-cover-blush.webp'
import HeroFanRightImg from '@/assets/partners/invite-cover-crimson.webp'
import CoverRoyalImg from '@/assets/partners/invite-cover-royal.webp'
import ScreenOpeningImg from '@/assets/partners/the-opening.webp'
import ScreenRsvpImg from '@/assets/partners/invite-rsvp.webp'
import ScreenWishImg from '@/assets/partners/invite-wish.webp'
import DashboardGuestsImg from '@/assets/partners/dashboard-guests.webp'
import DashboardGuestsPhoneImg from '@/assets/partners/dashboard-guests-phone.webp'
import DashboardRsvpImg from '@/assets/partners/dashboard-rsvp.webp'
import DashboardGiftsImg from '@/assets/partners/dashboard-gifts.webp'

const { t, locale, setLocale, availableLocales } = useAppLanguage()

/**
 * Two locales today, so pressing the button is a swap — but written as a cycle
 * so a third one added to `availableLocales` needs nothing here. The label
 * names the language being switched *to*, which is the only unambiguous way to
 * read a control whose face shows the current one.
 */
const nextLocale = computed(() => {
  const options = availableLocales.value
  const i = options.findIndex((option) => option.code === locale.value)
  return options[(i + 1) % options.length]
})

const switchLanguageLabel = computed(() =>
  t('partners.switchLanguage', { lang: nextLocale.value.name }),
)

const toggleLanguage = () => setLocale(nextLocale.value.code)

const TELEGRAM_URL = 'https://t.me/goeventkh'

const HERO_PROOF = ['payg', 'fee', 'review'] as const
const STEPS = ['open', 'build', 'sell'] as const

/**
 * How long a step takes, where that is worth saying — which is exactly one of
 * them. A shop owner weighing this up is really asking how much of their day
 * each customer costs, and the honest answer to that is the middle step's:
 * setting an invitation up is a quarter of an hour's work, an hour for a big
 * wedding with a long guest list. The other two have no useful number — step 1
 * waits on our review, step 3 is a click — so they carry none rather than a
 * padded one. That is also what lets the badge be loud: one dark pill in the
 * row is a fact, three would be a label pattern and would say nothing.
 */
const STEP_TIMINGS: Partial<Record<(typeof STEPS)[number], string>> = {
  build: 'partners.steps.build.time',
}

const stepTimingKey = (key: (typeof STEPS)[number]) => STEP_TIMINGS[key] ?? ''

const FAQ_KEYS = [
  'unsold',
  'price',
  'domain',
  'plans',
  'payment',
  'customer',
  'names',
  'apply',
] as const

/**
 * The pricing row: the live credit-pack catalogue where it can be read, the
 * authored copy where it cannot. Pay-as-you-go always leads — it is the entry
 * with nothing to commit, and answers the objection the packs beside it would
 * otherwise raise. See the composable for why the live path is gated.
 */
const { tiers } = usePartnerPricingTiers()

/** The three unit-economics rows under each card's headline figure. */
const tierRows = (tier: PartnerPricingTier) => [
  { label: t('partners.pricing.payUpfront'), value: tier.upfront },
  { label: t('partners.pricing.costEach'), value: tier.costEach },
  { label: t('partners.pricing.keepEach'), value: tier.keepEach },
]

/**
 * The pricing rail's own state.
 *
 * `canScrollBack` / `canScrollOn` drive both the arrows' disabled state and the
 * edge fades, so a fade never sits over an edge there is nothing beyond — the
 * detail that separates a rail that looks scrollable from one that looks
 * clipped. `railOverflows` drops the arrow layer entirely when every card fits.
 *
 * The 1px tolerance is not superstition: a scroller at its end reports
 * `scrollLeft` as a fractional value on fractional device pixel ratios, so an
 * exact comparison leaves the "next" arrow enabled forever at the right edge.
 */
const RAIL_DIRECTIONS = [-1, 1] as const
const railRef = ref<HTMLElement | null>(null)
const canScrollBack = ref(false)
const canScrollOn = ref(false)
const railOverflows = ref(false)

function updateRailEdges() {
  const el = railRef.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  railOverflows.value = max > 1
  canScrollBack.value = el.scrollLeft > 1
  canScrollOn.value = el.scrollLeft < max - 1
}

/**
 * One card plus its gap per press, so a click always lands the next card on the
 * snap line rather than half of it. Measured from the DOM instead of the class,
 * because the card's width is in `rem` and the app rescales its root font on
 * laptop viewports — a hardcoded pixel step would be 25% out there.
 */
function scrollRail(direction: -1 | 1) {
  const el = railRef.value
  const card = el?.querySelector('article')
  if (!el || !card) return

  const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0
  el.scrollBy({
    left: direction * (card.getBoundingClientRect().width + gap),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

// The rail's extent changes when the live catalogue swaps the cards in and when
// the viewport resizes; neither fires a scroll event, so neither would update
// the fades on its own.
watch(tiers, () => nextTick(updateRailEdges))
onMounted(() => {
  updateRailEdges()
  window.addEventListener('resize', updateRailEdges, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('resize', updateRailEdges))

/**
 * The three screens the invitation is judged on, in the order a guest meets
 * them: the link they are sent, the reply it asks for, the wish they leave
 * afterwards. The arc is the guest's, not the product's — it starts before the
 * invitation is open and ends after it is answered.
 *
 * The opening is deliberately a *messaging app*, not the cover itself. The
 * cover is already the hero's fan and the design strip below; showing it a
 * third time argues nothing new, whereas the thread does the one job neither
 * can — it answers "how does this reach my customer's guests?" with the
 * ordinary chat they already send everything else through, no app to install.
 *
 * Three and not eight. Every extra screen costs a file the reader downloads and
 * a decision they have to make, and the fourth-best screenshot of an invitation
 * argues less well than the third-best one does on its own.
 */
const SCREENS = [
  { key: 'cover', icon: Sparkles, src: ScreenOpeningImg },
  { key: 'rsvp', icon: ClipboardCheck, src: ScreenRsvpImg },
  { key: 'wishes', icon: MessageCircle, src: ScreenWishImg },
] as const

const activeScreen = ref<(typeof SCREENS)[number]['key']>('cover')

/**
 * Evidence for "browse every design", not decoration: four covers that share
 * nothing but the product — ivory Khmer gold, blush rose, deep crimson, royal
 * blue. Three of them are already the hero's fan, which is deliberate; a
 * visitor who scrolled past the hero recognises them, and recognising them is
 * what makes the fourth one read as "and more where those came from".
 */
const COVER_STRIP = [
  { src: HeroFanLeadImg },
  { src: HeroFanLeftImg },
  { src: HeroFanRightImg },
  { src: CoverRoyalImg },
] as const

/**
 * The claims, split between the two beats and sitting beside the picture that
 * proves each one, rather than pooled into one strip under all three pictures.
 * A tick under a screenshot is a caption; a tick beside it is a claim with its
 * evidence in view, which is the only reason to write one.
 *
 * Four and three, not five and two. `gifts` belongs to the list — a cash gift
 * is recorded against a name, on a row — and the totals beat needed a second
 * and third line of its own, which the analytics cards were already showing and
 * the page had never said out loud.
 *
 * `share` is the one claim here whose evidence is NOT in view, and it is a
 * deliberate exception rather than a lapse: `dashboard-guests.webp` predates
 * the Share control, so the capture shows the list but not the handing over of
 * it. It closes the list beat because the first objection a shop owner raises
 * to running somebody else's guest list is that they would have to type it —
 * so the answer belongs beside the list, not three sections later. Re-capture
 * the guest panel with the Share button in frame and this becomes an ordinary
 * tick again (docs/guides/PARTNER_PAGE_SCREENSHOTS.md).
 */
const RUN_DAY_LIST_POINTS = ['replies', 'seating', 'gifts', 'share'] as const
const RUN_DAY_TOTAL_POINTS = ['totals', 'chase', 'bygroup'] as const

/**
 * RSVP first, gifts second — the order the two questions actually arrive in.
 * A shop owner is asked "how many are coming?" weeks before anyone asks "how
 * much came in?". (The app's own Analytics tab happens to stack them the other
 * way round; that is a screen being managed, this is an argument being made.)
 *
 * The intrinsic size travels with the file so the image element can reserve
 * its box before it decodes. Update both numbers together with the capture —
 * a stale pair reserves the wrong height and the row below it jumps.
 */
const RUN_DAY_SHOTS = [
  { key: 'rsvp', src: DashboardRsvpImg, w: 976, h: 1318 },
  { key: 'gifts', src: DashboardGiftsImg, w: 976, h: 1386 },
] as const

/**
 * `personal` leads, because it is the one thing on this list a customer cannot
 * approximate with a poster and a group chat: the guest list issues a link per
 * guest, the name is already written on the invitation when it opens, and the
 * reply that comes back is attached to that guest rather than to a stranger who
 * typed a name into a form. The screenshot above it has always shown this —
 * two chat messages, two links, two different names — and until now nothing
 * said so.
 *
 * Nine and not ten: the wishes line is gone, because the wishes are already
 * the third screenshot on the glass beside this list — a tick that repeats a
 * picture in view argues nothing the picture has not already made. `agenda`
 * stays; it is a real part of the invitation the list had never mentioned.
 */
const PRODUCT_FEATURES = [
  { key: 'personal', icon: UserCheck },
  { key: 'cinematic', icon: Film },
  { key: 'bilingual', icon: Languages },
  { key: 'rsvp', icon: ClipboardCheck },
  { key: 'notify', icon: BellRing },
  { key: 'guests', icon: Users },
  { key: 'checkin', icon: QrCode },
  { key: 'agenda', icon: CalendarDays },
  { key: 'media', icon: Images },
] as const

/**
 * Order is load-bearing at `sm`, where the grid fills row-wise in pairs: the
 * first row is what the partner's own name gets out of this, the second pairs
 * the job they hand back to the customer with the one they can take on
 * themselves. Five is deliberately odd — `freeStart` is left alone on the last
 * row, where an orphan reads as the offer the closing section repeats rather
 * than as a gap.
 */
const PARTNER_BENEFITS = [
  { key: 'branding', icon: BadgeCheck },
  { key: 'listing', icon: Store },
  { key: 'share', icon: Link2 },
  { key: 'studio', icon: Palette },
  { key: 'freeStart', icon: Gift },
] as const

/**
 * Which answers are open. A set rather than one key, and seeded with the first
 * question rather than empty — see the section's own comment for both reasons;
 * the short version is that single-open slid the pressed row out from under the
 * pointer, and an all-closed accordion opens on a section with no body in it.
 *
 * Replaced rather than mutated on toggle: a `ref` holding a Set does track its
 * own mutations through Vue's collection handlers, but every read here is a
 * `.has()` inside a `v-for`, and a fresh Set makes the dependency unambiguous
 * at the cost of seven pointer copies.
 */
const openFaqs = ref<ReadonlySet<string>>(new Set([FAQ_KEYS[0]]))
const isFaqOpen = (key: string) => openFaqs.value.has(key)
const toggleFaq = (key: string) => {
  const next = new Set(openFaqs.value)
  if (!next.delete(key)) next.add(key)
  openFaqs.value = next
}

const pricingRef = ref<HTMLElement | null>(null)
const scrollToPricing = () => {
  pricingRef.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

/**
 * Scroll reveal: the transition is CSS, the trigger is one rAF-throttled sweep.
 *
 * The repo's `useRevealAnimations` was not reused: it writes `opacity: 0` from
 * JS *after* the element has already intersected, which flashes the content in
 * before hiding it again, and it animates `transition: all` off a `setTimeout`
 * chain. Here the initial state is CSS, so it is correct on the first paint,
 * the transition names its two properties, and the stagger is a per-element
 * custom property rather than a timer.
 *
 * ---------------------------------------------------------------------------
 * Why not IntersectionObserver
 * ---------------------------------------------------------------------------
 * It was one, and it left content permanently invisible. An observer only
 * delivers an entry when an element's intersection state *changes between two
 * samples*. A single-frame jump — the "See the numbers" button, an anchor
 * landing, a scrollbar drag — moves a whole section from "below the viewport,
 * not intersecting" to "above the viewport, not intersecting". `isIntersecting`
 * was false before and false after, so no entry is ever delivered, and since
 * `[data-reveal]` starts at `opacity: 0` in CSS the section stays blank until
 * the reader happens to scroll back over it. Pressing the hero's own CTA left
 * eighteen elements hidden.
 *
 * A position check has no such blind spot: whatever the scroll did, anything at
 * or above the fold line is revealed on the next frame. `pending` shrinks as
 * the page is read and the listeners detach when it empties, so the cost falls
 * to nothing by the time the reader reaches the bottom.
 *
 * `scanReveals()` is also re-runnable rather than a one-shot pass on mount,
 * because not every `[data-reveal]` exists at mount: the pricing cards are
 * replaced when the live catalogue arrives, and a mount-time snapshot missed
 * the replacements entirely — a partner saw one card and two holes.
 */
const pageRef = ref<HTMLElement | null>(null)
const seen = new WeakSet<Element>()
let pending: Element[] = []
let frame = 0

/**
 * Two lines, not one.
 *
 * `REVEAL_LINE` is where an element animates — the old observer's `-10%`
 * bottom margin, so it starts just before its top edge lands.
 *
 * `ARM_LINE` is where it is *told* it is about to, one viewport earlier, and
 * exists only to place `will-change` (see the CSS for why that must not sit in
 * the base state). One sweep resolves both, so the second line costs a
 * comparison rather than a second listener — and an element scrolled past in a
 * single jump skips the arming and reveals anyway, because the promotion is an
 * optimisation and never a step the reveal depends on.
 */
const REVEAL_LINE = 0.9
const ARM_LINE = 1.9

function sweep() {
  frame = 0
  const viewport = window.innerHeight
  const revealAt = viewport * REVEAL_LINE
  const armAt = viewport * ARM_LINE
  pending = pending.filter((el) => {
    const { top } = el.getBoundingClientRect()
    if (top > armAt) return true
    if (top > revealAt) {
      el.setAttribute('data-reveal', 'arm')
      return true
    }
    // Once only — a section that re-animates on every pass is ambient motion,
    // which spends attention and returns nothing.
    el.setAttribute('data-reveal', 'in')
    return false
  })
  if (!pending.length) stopSweeping()
}

function schedule() {
  frame ||= requestAnimationFrame(sweep)
}

function stopSweeping() {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

function scanReveals() {
  const root = pageRef.value
  if (!root) return

  const fresh = Array.from(root.querySelectorAll('[data-reveal]')).filter((el) => !seen.has(el))
  if (!fresh.length) return
  fresh.forEach((el) => seen.add(el))

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fresh.forEach((el) => el.setAttribute('data-reveal', 'in'))
    return
  }

  const wasIdle = pending.length === 0
  pending.push(...fresh)
  if (wasIdle) {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
  }
  schedule()
}

onMounted(scanReveals)

// The live catalogue lands after mount and swaps the cards out, so the new ones
// have to be picked up once Vue has patched the DOM.
watch(tiers, () => nextTick(scanReveals))

onBeforeUnmount(stopSweeping)
</script>

<style scoped>
/*
  ---------------------------------------------------------------------------
  The page's motion vocabulary, in four numbers
  ---------------------------------------------------------------------------
  Declared once and read by everything below, because a landing page is one
  performance and eight sections each cascading at their own rate read as eight
  pages stapled together. That was literally true here: 80ms between two steps,
  70ms between two pricing cards, 60ms between two feature tiles, 45ms between
  two questions, and no reader could have recovered a reason for any of it. One
  constant now, so the page keeps one pulse and changing that pulse is one edit.

  `--stagger` is 60ms. A cascade reads as a cascade between roughly 30ms and
  80ms and as a queue outside that; 60 puts a three-item row 120ms end to end,
  which is a sequence nobody has to wait for.

  `--reveal-duration` is 600ms against the 300ms ceiling that governs every
  other transition on this page, and the gap between them is the point: 300ms is
  the budget for *interface*, where someone is waiting on the result of their
  own press. Nothing waits on a reveal. Under `--ease-reveal` the element is
  90% of the way home inside 180ms anyway — the remaining 420ms is settle, and
  settle is what keeps eight sections in a row from reading as a slideshow.

  `--reveal-lift` is a variable rather than a fixed 14px so one element can
  travel further than its neighbours. The hero image does, at 24px: near things
  move more, and that is the whole of the parallax on this page.
*/
.partner-page {
  /*
    One curve, two names. `--ease-out` is the page's UI easing — anything a
    reader is waiting on the result of. `--ease-reveal` is an alias rather than
    a second value, because a scroll reveal wants exactly the same shape and a
    page with two nearly-identical curves is a page whose motion nobody can
    keep in tune. Extend this pair; never write a fourth cubic-bezier inline.
  */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-reveal: var(--ease-out);
  --reveal-duration: 600ms;
  --reveal-lift: 14px;
  --stagger: 60ms;
}

/*
  Reveal. Enters from a small offset rather than from nothing, because an
  element that appears out of nothing has no real-world equivalent. Ease-out, so
  the movement is over before the reader has decided to look at it.
*/
[data-reveal] {
  opacity: 0;
  transform: translateY(var(--reveal-lift));
  transition:
    opacity var(--reveal-duration) var(--ease-reveal),
    transform var(--reveal-duration) var(--ease-reveal);
  transition-delay: var(--reveal-delay, 0ms);
}

/*
  ---------------------------------------------------------------------------
  The reveal's two states live in `data-reveal`'s own value, NOT in a class
  ---------------------------------------------------------------------------
  They were classes, added with `classList.add()`, and that is a trap in a Vue
  template. Vue patches a dynamic `:class` by writing the whole `class`
  attribute, so the moment any `[data-reveal]` element's class binding changed,
  every class added from outside Vue was wiped with it. On this page the screen
  picker's three buttons carry both `data-reveal` and a `:class` that flips on
  click: pressing one dropped `reveal-in` from it and from the previously
  selected one, putting both back to `opacity: 0` — and because `seen` already
  held them, no later sweep ever revealed them again. Two of the three tabs
  vanished on the first press and never returned.

  A static attribute is not patched (the vnode's patch flag names class and
  style only), so writing the state into `data-reveal` itself survives every
  re-render. It also means the trap cannot come back: there is no longer a way
  to put a `[data-reveal]` next to a `:class` and get it wrong.

  All three selectors have the same specificity, so ORDER decides — `'in'` must
  stay last, and the reduced-motion override after that.

  On `will-change`: it is a promise the browser keeps by handing the element its
  own compositor layer, and it holds that layer for as long as the declaration
  stands. In the base state that meant all forty `[data-reveal]` elements were
  promoted at first paint — most of them screens below the fold, several never
  reached at all. That is the case DESIGN.md §7 names when it says to add
  `will-change` only to elements that actually animate. Armed one viewport out
  instead, and released in the very rule that hands the transition over.
*/
[data-reveal='arm'] {
  will-change: opacity, transform;
}

[data-reveal='in'] {
  opacity: 1;
  transform: none;
  will-change: auto;
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/*
  The rail's edge fades.

  `mask-image`, not a gradient overlay: the section sits on a tinted ground
  (`bg-white/60` over the page's own gradient), so an opaque white fade would be
  a pale bar over a coloured background rather than a fade. A mask dissolves the
  content itself and is correct on any ground.

  Applied per edge and only when there is something beyond it — a fade over an
  edge with nothing past it reads as clipping rather than as more to come. The
  32px band is deliberately short: enough to say "continues", not enough to make
  a card's price unreadable.

  The fade appears and disappears without a transition, and should stay that
  way: `mask-image` does not interpolate on the compositor, and the one frame
  where a transition would show is the frame in which the reader has just
  started dragging a rail of cards across — the edge is the least moving thing
  on screen. An earlier version of this comment claimed a transition that was
  never actually declared.
*/
/*
  Pointer-only, written as a media query rather than a Tailwind arbitrary
  variant: `[@media(hover:hover)and(pointer:fine)]:flex` compiles the condition
  verbatim, without the space `and (pointer:fine)` requires, so the rule was
  invalid CSS and the arrows never appeared at all.
*/
.rail-arrows {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .rail-arrows {
    display: flex;
  }
}

/*
  The language FAB's transform states.

  In scoped CSS rather than Tailwind because the hover lift has to be gated on a
  real pointer — a touch device fires `:hover` on tap, so an ungated
  `hover:scale-110` leaves the button sitting 10% large under the reader's
  finger until they tap elsewhere. The press feedback is deliberately NOT gated:
  `:active` is for everybody, and it is the whole reason the control feels heard.

  This replaces a `transition-all duration-300`, which animated every property
  the element has (and every one it might gain) on Tailwind's default
  ease-in-out, at 300ms, against a page where every other control answers in
  200ms on `--ease-out`. Naming the three properties also stops the transition
  from firing on `bottom`, which is a `var(--fab-stack-2)` that changes with the
  viewport.

  `:active` sits after the media query so it wins the tie on source order — the
  two selectors have identical specificity, and a press must override a hover.
*/
.fab-lang {
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out),
    background-image 200ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .fab-lang:hover {
    transform: scale(1.1);
  }
}

.fab-lang:active {
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .fab-lang {
    transition: box-shadow 200ms var(--ease-out);
  }

  .fab-lang:hover,
  .fab-lang:active {
    transform: none;
  }
}

.rail-fade-start {
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 3rem);
  mask-image: linear-gradient(to right, transparent 0, #000 3rem);
}

.rail-fade-end {
  -webkit-mask-image: linear-gradient(to left, transparent 0, #000 3rem);
  mask-image: linear-gradient(to left, transparent 0, #000 3rem);
}

.rail-fade-start.rail-fade-end {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 32px,
    #000 calc(100% - 3rem),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 32px,
    #000 calc(100% - 3rem),
    transparent 100%
  );
}

/*
  The closing panel's inner light. Two radial washes over the brand gradient,
  not a second gradient object: white at low alpha, so whatever the band's own
  colour is underneath, this only lifts it. Authored here rather than as two
  arbitrary `bg-[radial-gradient(...)]` values because the commas and spaces a
  two-stop radial needs are exactly what Tailwind's arbitrary-value parser
  makes unreadable.

  Painted, not blurred: a `blur-3xl` disc would be the same picture at the cost
  of a 64px filter pass over a full-width panel on every paint.
*/
.cta-sheen {
  background:
    radial-gradient(58% 78% at 12% 0%, rgb(255 255 255 / 0.22), transparent 68%),
    radial-gradient(52% 72% at 92% 100%, rgb(255 255 255 / 0.14), transparent 70%);
}

/*
  ---------------------------------------------------------------------------
  The hero's fan of covers
  ---------------------------------------------------------------------------
  The lead card is the only one in normal flow, so it alone sets the block's
  height and the two behind it can be swapped, added to or removed without
  moving the hero's baseline by a pixel.

  The spread is a percentage of each card's own width (`--fan-x`) rather than a
  pixel count, so the footprint scales with the container.

  What the footprint actually is, though, is NOT lead + 2 × spread: rotating a
  card 8° adds `height × sin(8°)` to its horizontal extent, and these cards are
  2.16 times taller than they are wide, so the rotation contributes more width
  than the translate does. Measured, the fan ends up about 1.93 times the lead's
  width. Sizing it by eye from the translate alone put a 371px fan in a 288px
  column on a 320px phone, and the only reason that did not scroll the page
  sideways was the section's `overflow-hidden` quietly cutting a card in half.

  Hence the `min(<rem>, 48%)` at every breakpoint. The percentage resolves
  against the grid column the fan sits in, so capping the lead at 48% of it
  keeps the ~1.93× footprint inside that column BY CONSTRUCTION, at any viewport
  and either root font size. The `rem` half is the size we actually want; the
  percentage is the guard that stops it.

  A per-breakpoint `rem` alone could not do this, and the tell was a viewport
  nobody thinks to check: at exactly 1024px the grid becomes two columns, the
  container is still viewport-bound rather than at its 72rem cap, and the
  column is only 480px — so a 16rem lead put a 494px fan in it and the right
  card hung 12px off the screen. The same trap sits at 1280–1535 on a window
  tall enough (>1100px) to miss the 75% root-font rule. One percentage closes
  both without anyone having to enumerate them.

  `overflow-hidden` on the section is for the ground, and nothing here leans on
  it — which is the point, because it hides this class of mistake by cutting a
  card in half rather than scrolling the page.

  The cards start stacked and spread on reveal. It is the one piece of motion on
  the page that is decoration rather than orientation, and it is affordable for
  exactly one reason: a reader sees it once. A deck that opens says "these are
  designs, and there are more" in a way three static overlapping pictures do
  not. It is a sibling of the reveal rather than part of it — the wrapper does
  opacity and lift, the cards do the spread — because `[data-reveal]` already
  owns `transform` on the element it is placed on.
*/
.hero-fan {
  --fan-x: 30%;
  --fan-r: 8deg;

  position: relative;
  width: 100%;
  max-width: min(12rem, 48%);
  margin-inline: auto;
  /*
    Room for the cards' own shadow inside the clip.

    The lead card is in normal flow, so it sets this box's height and its bottom
    edge WAS this box's bottom edge — which, because the hero section is
    `overflow-hidden`, is a clip boundary. The result was all three cards sliced
    off flat: no rounded bottom corners, no shadow, the fan ending on a hard
    horizontal line against the next section.

    3rem covers the 2.75rem the shadow reaches below the card. It belongs here
    rather than on the section because it is the fan's own requirement — the
    section's padding is about the page's rhythm, and the two should not have to
    be kept in sync by hand.
  */
  padding-bottom: 3rem;
}

@media (min-width: 640px) {
  .hero-fan {
    --fan-x: 38%;
    --fan-r: 9deg;

    max-width: min(14.5rem, 48%);
  }
}

@media (min-width: 1024px) {
  .hero-fan {
    max-width: min(16rem, 48%);
  }
}

/* At `xl` the fan drops to 5/12 of the container, so it gives back the width it
   just gained by closing a degree of spread rather than by shrinking a card. */
@media (min-width: 1280px) {
  .hero-fan {
    --fan-x: 36%;

    max-width: min(16.5rem, 48%);
  }
}

.hero-fan__card {
  display: block;
  width: 100%;
  border-radius: 1.25rem;
  /* An outline rather than a border: a border would be inside the element's own
     box and eat 1px of a photograph whose edges are its artwork. */
  outline: 1px solid rgb(15 23 42 / 0.08);
  outline-offset: -1px;
  /*
    In `rem`, not `px`, and that is not a style preference here.

    The app drops the root font to 75% on laptop viewports (main.css), so the
    card itself is 25% smaller there. A pixel shadow would not shrink with it —
    it would read as a heavier, lower shadow on exactly the screens where the
    card is smallest, and it would no longer fit the padding reserved for it
    below. In `rem` the shadow is part of the card and scales with it, so the
    clearance `.hero-fan`'s padding provides is correct at every root size.

    Reach below the card: 1.25 + 2.5 − 1 = 2.75rem. That number is what
    `.hero-fan`'s `padding-bottom` has to cover.
  */
  box-shadow:
    0 1.25rem 2.5rem -1rem rgb(15 23 42 / 0.4),
    0 0.125rem 0.5rem rgb(15 23 42 / 0.08);
}

.hero-fan__card--lead {
  position: relative;
  z-index: 2;
}

.hero-fan__card--left,
.hero-fan__card--right {
  position: absolute;
  inset-block-start: 5%;
  z-index: 1;
  width: 88%;
  transition: transform 700ms var(--ease-reveal);
}

/* Rotating about a point low on the *inner* edge is what makes the two read as
   one deck opening rather than as two cards pivoting on their own centres. */
.hero-fan__card--left {
  inset-inline-start: 0;
  transform-origin: 100% 80%;
  transform: translateX(6%);
}

.hero-fan__card--right {
  inset-inline-end: 0;
  transform-origin: 0 80%;
  transform: translateX(-6%);
}

[data-reveal='in'] .hero-fan__card--left {
  transform: translateX(calc(var(--fan-x) * -1)) rotate(calc(var(--fan-r) * -1));
}

[data-reveal='in'] .hero-fan__card--right {
  transform: translateX(var(--fan-x)) rotate(var(--fan-r));
}

@media (prefers-reduced-motion: reduce) {
  .hero-fan__card--left,
  .hero-fan__card--right {
    transition: none;
  }
}

/*
  ---------------------------------------------------------------------------
  The phone, and the screen inside it
  ---------------------------------------------------------------------------
  A drawn bezel rather than a photographed device: a photographed one dates the
  page the year its model is replaced, and it is another company's industrial
  design sitting inside our brand. Two radii and a dark gradient are enough to
  say "phone"; a notch and a speaker grille would be a costume.

  `aspect-ratio` on the screen holds the box at the size the captures were taken
  (390 x 844), so the section does not jump when a lazily-loaded shot decodes.
*/
.device {
  position: relative;
  width: 100%;
  max-width: 16rem;
  padding: 0.5rem;
  border-radius: 2.25rem;
  background: linear-gradient(160deg, #334155, #0f172a 55%, #1e293b);
  box-shadow:
    0 30px 60px -25px rgb(15 23 42 / 0.5),
    0 0 0 1px rgb(15 23 42 / 0.06);
}

@media (min-width: 640px) {
  .device {
    max-width: 18rem;
    border-radius: 2.5rem;
  }
}

/* From `lg` the phone shares the row with a column that now carries the
   header, the picker and the feature list. 17rem is the size at which its own
   height lands within ~50px of that column's — big enough to read the
   invitation, small enough that neither side is waiting for the other. */
@media (min-width: 1024px) {
  .device {
    max-width: 17rem;
  }
}

.device__screen {
  position: relative;
  overflow: hidden;
  border-radius: 1.75rem;
  background: #fff;
  aspect-ratio: 390 / 844;
}

@media (min-width: 640px) {
  .device__screen {
    border-radius: 2rem;
  }
}

/*
  All three shots are stacked and crossfaded. Blur is what makes it read as one
  invitation changing rather than two invitations overlapping — without it the
  eye resolves both images for the length of the fade and sees a double
  exposure. 6px, well under the 20px where the filter starts costing real time
  on a full-width element in Safari.

  Transitions, not keyframes: the three buttons can be pressed as fast as
  someone can move a finger, and a transition retargets from wherever it is
  while a keyframe animation restarts from zero.

  `width`/`height` are set explicitly alongside `object-fit` because Tailwind's
  preflight puts `max-width: 100%` on every `img`, which silently distorts an
  image sized any other way inside a fixed-ratio box.
*/
.device__shot {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.015);
  filter: blur(6px);
  transition:
    opacity 260ms ease,
    transform 260ms ease,
    filter 260ms ease;
}

.device__shot.is-active {
  opacity: 1;
  transform: none;
  filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .device__shot {
    transform: none;
    filter: none;
    transition: opacity 160ms ease;
  }
}

/*
  The frame every back-office capture sits in. One class for all three, because
  they are three panels of one app and anything that framed them differently
  would be saying they are not.

  Not a device bezel and not a browser chrome. The reader is holding the bezel,
  and the drawn browser bar that used to sit here existed to frame a full-window
  screenshot; the captures are cropped to the panel now, so the frame's whole
  job is to give the picture an edge and lift it off the page.

  The captures themselves are taken with their own radius, border, ring and
  shadow switched off (see docs/guides/PARTNER_PAGE_SCREENSHOTS.md), so this
  rounding is the only one in play — a baked-in corner would show the app's
  background as four tinted nubs just inside this border.
*/
.app-card {
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  box-shadow:
    0 18px 40px -22px rgb(15 23 42 / 0.35),
    0 2px 6px rgb(15 23 42 / 0.05);
}

@media (min-width: 640px) {
  .app-card {
    border-radius: 1.25rem;
  }
}

/*
  The guest capture ends part-way through a row, because a guest list does. Left
  hard, that crop is the one genuinely untidy edge in the section — a name
  sliced through the middle by a card border, which reads as a mistake rather
  than as a list that carries on past the frame. The fade turns it into the
  claim the heading is already making: this is *the whole* guest list, and it
  does not stop at eight.

  A mask, not a white overlay, for the reason the rail's edge fades give: the
  capture's own ground is near-white but not white, so an opaque wash would be a
  pale bar sitting on top of it rather than a dissolve. A mask takes the pixels
  out.

  The band is a percentage so it holds its proportion across both captures and
  every column width — the cut row is ~7% of the desktop capture's height, so
  10% covers it with a little feather and never eats the row above. Only on the
  card that continues: a fade over an edge with nothing past it reads as
  clipping, and both analytics captures end on their own last line.
*/
.app-card--continues img {
  -webkit-mask-image: linear-gradient(to bottom, #000 90%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 90%, transparent 100%);
}

/*
  The four covers over "Browse every design".

  They were 44px and hung at the left edge of the band, where four thumbnails
  that size read as noise beside a dark pill. Centred, they are the coda's
  anchor — the object that holds the axis and stands in for the section rule
  that used to be here — so they are sized to be looked at: ~52px, ~64px from
  `sm`. Still a sample, not a gallery; the gallery is a page away.
*/
.cover-chip {
  display: block;
  width: 3.25rem;
  border-radius: 0.5rem;
  outline: 1px solid rgb(15 23 42 / 0.08);
  outline-offset: -1px;
  box-shadow: 0 6px 14px -8px rgb(15 23 42 / 0.4);
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out);
}

@media (min-width: 640px) {
  .cover-chip {
    width: 4rem;
    border-radius: 0.625rem;
  }
}

/*
  The covers answer the button, because they are what is behind it.

  `:has()` rather than a `group` on the wrapper: the wrapper is the full
  container width, so hovering it would mean hovering the empty air either side
  of a centred object — motion with no cause. Keyed off the link itself, the
  lift only ever fires when the reader is actually over the thing that opens the
  catalogue, and it says "these four are what is through here" without a word.

  Pointer-only, because a touch device fires `:hover` on tap and would leave
  four covers held 3px up until the reader pressed somewhere else. Seen once per
  visit, so it is allowed to be decorative — but the ripple is 30ms a step, not
  60: four covers 12px apart are one object, and the page's `--stagger` is
  tuned for rows of cards a reader's eye travels between.
*/
@media (hover: hover) and (pointer: fine) {
  .catalogue:has(a:hover) .cover-chip {
    transform: translateY(-3px);
    box-shadow: 0 12px 22px -10px rgb(15 23 42 / 0.45);
  }

  .catalogue li:nth-child(2) .cover-chip {
    transition-delay: 30ms;
  }

  .catalogue li:nth-child(3) .cover-chip {
    transition-delay: 60ms;
  }

  .catalogue li:nth-child(4) .cover-chip {
    transition-delay: 90ms;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-chip {
    transition: box-shadow 200ms var(--ease-out);
  }

  .catalogue:has(a:hover) .cover-chip {
    transform: none;
  }
}

/*
  The sanctioned collapse: grid-template-rows 0fr↔1fr, never max-height.

  The curve was `cubic-bezier(0.4, 0, 0.2, 1)` — Material's standard easing,
  inlined here and nowhere else on the page, which is the exact shape of the
  "familiar-looking curve typed from memory" mistake. It is also an ease-in-out,
  and an answer opening is an entrance: it should start fast.

  Faster out than in. 250ms to open is the reader's own press being answered;
  180ms to close is the page getting out of the way of the next question, and a
  panel that takes as long to leave as to arrive reads as reluctant. Both sit
  under the 300ms ceiling the rest of the page's interface keeps.
*/
.collapse-enter-active {
  transition:
    grid-template-rows 250ms var(--ease-out),
    opacity 200ms var(--ease-out);
}

.collapse-leave-active {
  transition:
    grid-template-rows 180ms var(--ease-out),
    opacity 120ms var(--ease-out);
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
  }
}
</style>
