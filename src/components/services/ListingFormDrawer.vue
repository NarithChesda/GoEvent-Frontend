<template>
  <!--
    Create or edit one service listing.

    A drawer rather than a modal, because it is a form (design §10), and the
    same drawer for both modes: what changes between them is the title, the
    delete control in the header, and whether the fields arrive filled. A wizard
    was considered and rejected — over ten fields it adds navigation and saves
    no typing, and it would need a second, non-wizard path for editing, which is
    the far more frequent visit.

    ─── What this form deliberately does *not* do ───

    **It does not open on a wall of text inputs.** The order used to be Basics →
    Pricing → Details → Photos, which put the field that decides whether anyone
    clicks the listing — the cover photo — last, after nine text inputs. It now
    opens on the card itself, then the photos that fill it, and only then the
    words. The form did not get shorter so much as it stopped burying its point.

    **It does not weight optional fields like required ones.** Tagline, service
    area and tags carried the same visual weight as the four fields that gate
    publishing, which is most of why ten fields read as a long form. They are
    behind one disclosure now; five controls are visible at rest.

    **It does not announce any group.** It used to carry five uppercase
    eyebrows, two of them over a single field — "Service Area" above one text
    input, "Tags" above one more. The last three went the way the event drawers'
    nine did: "Pricing" sat directly over a label reading *How you price this*,
    "Basics" over a field named *Service title*, and "Photos" over a grid of
    photographs. An eyebrow that repeats the control beneath it is not a section
    heading (taste §4), and the hairline rules that separated those groups
    separate them still.

    **It does not keep private copies of shared controls.** The price-type
    picker, the figures under it and the button that saves are SegmentedField,
    groupedList.css and actionButton.css — the same three the event create and
    edit drawers are built from. A local reimplementation of a segmented control
    is right on the day it is written and a near-miss of the real one a release
    later.

    **It does not colour its controls to mark selection.** The price-type picker
    was three tall bordered tiles that turned emerald when chosen, which made the
    loudest object in the drawer a radio group. It is a segmented control on a
    slate track now: the selected cap slides onto white, and the two saturated
    objects in here stay the header and the button that saves.

    **It does not hide the photo controls behind hover.** Set-cover and remove
    lived in a `group-hover` overlay, so on a phone — where most of these photos
    are taken and uploaded — there was no way to reach either. They are always
    on the tile now, as glass discs, and the grid drops to two columns below `sm`
    so a 40px target fits without covering the photo it acts on.

    **It does not report failure only at the bottom.** Missing-field errors were
    a single message near the footer naming one field at a time; the field
    causing it could be three screens up. They render under their own inputs
    now, and the first one is scrolled to — and a field complains when the
    vendor *leaves* it, not when they press Create, so the first news that a
    description is required is not a scroll three screens backwards.

    **It does not lose work to a single keystroke.** The backdrop was made
    inert for that reason and then Escape and Cancel discarded the same draft
    silently — one door closed on a risk and two left open. Both now ask, in
    the footer they were pressed in rather than in a dialog stacked over a
    dialog, and only when there is something to lose. Removing a photo is the
    same problem one tap wide: the X sits four pixels from the star, on a tile
    the vendor may have shot a minute ago. It offers an undo rather than a
    confirmation, because a confirmation on every tap is what teaches people to
    tap through them (apple-design §16.2).
  -->
  <Teleport to="body">
    <!-- The backdrop does not close this. Deliberate, and the one place this
         drawer departs from §10: it holds a long form with unsaved photo
         uploads, and a stray click on the dimmed page should not discard it.
         Escape still closes — that is a decision, not a slip of the mouse. -->
    <Transition name="drawer-backdrop">
      <div v-if="modelValue" class="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm" />
    </Transition>

    <Transition name="drawer-panel">
      <div
        v-if="modelValue"
        ref="panel"
        tabindex="-1"
        class="fixed inset-y-0 right-0 z-[999] flex w-full flex-col overflow-hidden bg-white shadow-2xl focus:outline-none will-change-transform md:bottom-4 md:right-4 md:top-4 md:w-[32.5rem] md:max-w-[calc(100vw-32px)] md:rounded-2xl laptop-sm:w-[35rem] laptop-md:w-[38.75rem] desktop:w-[42.5rem]"
        role="dialog"
        aria-modal="true"
        :aria-label="
          isEditMode ? t('services.listingForm.editTitle') : t('services.listingForm.createTitle')
        "
        @click.stop
      >
        <!-- Header -->
        <div class="sticky top-0 z-10 flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
          <div class="flex items-center justify-between gap-2 px-3 py-2.5">
            <div class="flex min-w-0 items-center gap-2">
              <button
                type="button"
                :disabled="isBusy"
                class="drawer-close rounded-lg p-1.5 hover:bg-white/20 active:bg-white/30 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                :aria-label="t('services.listingForm.close')"
                :title="t('services.listingForm.close')"
                @click="requestClose"
              >
                <ArrowRight class="h-5 w-5 text-white" aria-hidden="true" />
              </button>
              <h2 class="truncate text-base font-semibold text-white">
                {{
                  isEditMode
                    ? t('services.listingForm.editTitle')
                    : t('services.listingForm.createTitle')
                }}
              </h2>
            </div>

            <button
              v-if="isEditMode"
              type="button"
              :disabled="isBusy"
              class="drawer-close rounded-lg p-1.5 hover:bg-white/20 active:bg-white/30 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              :aria-label="t('services.listingForm.delete')"
              :title="t('services.listingForm.delete')"
              @click="showDeleteConfirm = true"
            >
              <Trash2 class="h-5 w-5 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Body -->
        <div ref="scroller" class="flex-1 overflow-y-auto overscroll-contain">
          <div v-if="loading" class="space-y-5 p-4" aria-hidden="true">
            <div class="animate-pulse space-y-5">
              <div class="h-10 rounded-lg bg-slate-200"></div>
              <div class="h-24 rounded-lg bg-slate-200"></div>
              <div class="h-10 rounded-lg bg-slate-200"></div>
              <div class="grid grid-cols-2 gap-3">
                <div class="h-10 rounded-lg bg-slate-200"></div>
                <div class="h-10 rounded-lg bg-slate-200"></div>
              </div>
            </div>
          </div>

          <form
            v-else
            class="space-y-6 p-4 pb-24"
            :class="isBusy ? 'form-busy' : ''"
            :inert="isBusy"
            novalidate
            @submit.prevent="handleSubmit"
          >
            <!--
              Why it came back, at the top of the thing that fixes it. The note
              only exists on a listing a reviewer sent back, and it is the first
              thing the vendor needs before they change a word.
            -->
            <div
              v-if="reviewNote"
              class="rounded-xl border border-red-200 bg-red-50 p-3"
              role="status"
            >
              <p class="text-xs font-semibold uppercase tracking-wider text-red-700">
                {{ t('services.listingForm.reviewNoteTitle') }}
              </p>
              <p class="mt-1 text-sm leading-relaxed text-red-700">{{ reviewNote }}</p>
            </div>

            <!-- The card being assembled.

                 A listing form is a questionnaire about something abstract
                 until you can see the object. This is the real catalogue card —
                 the same `ServiceCard` the services grid and the listings tab
                 render — bound to the form state, so the cover crop, the length
                 of the title against its two-line clamp, and the price string
                 are all answered while there is still something to do about
                 them. It is `preview`, so it takes no focus and announces
                 nothing: every value in it is one line away in a field that
                 announces itself.

                 On a phone it renders the card's compact row (~120px); in the
                 wider drawer it renders the poster. Both are what a client will
                 actually get at that width. -->
            <figure class="m-0">
              <ServiceCard preview hide-vendor :listing="previewListing" />
              <figcaption class="mt-2 text-center text-xs text-slate-500">
                {{ t('services.listingForm.preview.caption') }}
              </figcaption>
            </figure>

            <!-- Photos ---------------------------------------------------- -->
            <section class="space-y-3 border-t border-slate-100 pt-5">
              <input
                ref="galleryFileInput"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change.stop="handleGalleryFileSelect"
              />

              <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div
                  v-for="(image, index) in form.gallery"
                  :key="image.key"
                  class="relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                  :class="form.coverIndex === index ? 'ring-2 ring-[#2ecc71] ring-offset-1' : ''"
                >
                  <img :src="image.url" alt="" class="h-full w-full object-cover" />

                  <span
                    v-if="form.coverIndex === index"
                    class="absolute left-1.5 top-1.5 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-slate-900 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm"
                  >
                    {{ t('services.listingForm.gallery.cover') }}
                  </span>

                  <!-- Always on the tile, never on hover — the phone that took
                       the photo has no pointer to reveal them with. -->
                  <div class="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                    <button
                      v-if="form.coverIndex !== index"
                      type="button"
                      :class="tileButtonClass"
                      :aria-label="t('services.listingForm.gallery.setCover')"
                      :title="t('services.listingForm.gallery.setCover')"
                      @click="setCoverImage(index)"
                    >
                      <Star class="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      :class="[tileButtonClass, 'hover:text-red-600']"
                      :aria-label="t('services.listingForm.gallery.remove')"
                      :title="t('services.listingForm.gallery.remove')"
                      @click="removeGalleryImage(index)"
                    >
                      <X class="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <button
                  v-if="form.gallery.length < MAX_GALLERY"
                  type="button"
                  class="group flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 transition-colors duration-200 hover:border-[#2ecc71] hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  @click.stop.prevent="triggerGalleryUpload"
                >
                  <Plus
                    class="h-6 w-6 text-slate-400 transition-colors duration-200 group-hover:text-[#2ecc71]"
                    aria-hidden="true"
                  />
                  <span
                    class="text-xs text-slate-400 transition-colors duration-200 group-hover:text-[#2ecc71]"
                  >
                    {{ t('services.listingForm.gallery.add') }}
                  </span>
                </button>
              </div>

              <!-- Undo, not a confirmation. Removing a photo costs nothing to
                   reverse — the server delete does not happen until save — so
                   the cheap slip gets a way back rather than every deliberate
                   tap getting a gate in front of it. -->
              <Transition name="drawer-reveal">
                <div v-if="removedPhoto" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div
                      class="flex items-center justify-between gap-3 rounded-lg bg-slate-100 py-1.5 pl-3 pr-1.5"
                      role="status"
                    >
                      <span class="text-sm text-slate-600">
                        {{ t('services.listingForm.gallery.removed') }}
                      </span>
                      <button
                        type="button"
                        class="drawer-action inline-flex min-h-[2.5rem] items-center rounded-lg px-3 text-sm font-semibold text-sky-600 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                        @click="undoRemoveGalleryImage"
                      >
                        {{ t('services.listingForm.gallery.undo') }}
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>

              <p :class="hintClass">{{ t('services.listingForm.gallery.hint') }}</p>
            </section>

            <!-- Basics ---------------------------------------------------- -->
            <section class="space-y-3 border-t border-slate-100 pt-5">
              <div>
                <label :class="labelClass" for="listing-title">
                  {{ t('services.listingForm.fields.title') }} *
                </label>
                <input
                  id="listing-title"
                  ref="titleInput"
                  v-model="form.title"
                  type="text"
                  :placeholder="t('services.listingForm.fields.titlePlaceholder')"
                  :class="[fieldClass, errors.title ? invalidFieldClass : '']"
                  :aria-invalid="!!errors.title"
                  data-field="title"
                  @input="clearError('title')"
                  @blur="touchField('title')"
                />
                <p v-if="errors.title" :class="errorTextClass">{{ errors.title }}</p>
              </div>

              <div>
                <label :class="labelClass" for="listing-category">
                  {{ t('services.listingForm.fields.category') }} *
                </label>
                <div class="relative">
                  <select
                    id="listing-category"
                    v-model.number="form.category"
                    :class="[
                      fieldClass,
                      'appearance-none pr-10',
                      errors.category ? invalidFieldClass : '',
                    ]"
                    :aria-invalid="!!errors.category"
                    data-field="category"
                    @change="touchField('category')"
                  >
                    <option :value="null">
                      {{ t('services.listingForm.fields.categoryPlaceholder') }}
                    </option>
                    <option
                      v-for="category in categories"
                      :key="category.id"
                      :value="Number(category.id)"
                    >
                      {{ translateServiceCategory(category.name) }}
                    </option>
                  </select>
                  <ChevronDown
                    class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
                <p v-if="errors.category" :class="errorTextClass">{{ errors.category }}</p>
              </div>

              <div>
                <label :class="labelClass" for="listing-description">
                  {{ t('services.listingForm.fields.description') }} *
                </label>
                <textarea
                  id="listing-description"
                  v-model="form.description"
                  rows="4"
                  :placeholder="t('services.listingForm.fields.descriptionPlaceholder')"
                  :class="[fieldClass, 'resize-none', errors.description ? invalidFieldClass : '']"
                  :aria-invalid="!!errors.description"
                  data-field="description"
                  @input="clearError('description')"
                  @blur="touchField('description')"
                ></textarea>
                <p v-if="errors.description" :class="errorTextClass">{{ errors.description }}</p>
              </div>
            </section>

            <!-- Pricing ------------------------------------------------------

                 How a service is priced is a choice between three named things,
                 so all three are named — and by `SegmentedField`, the control
                 the event drawers use, rather than a local copy of its geometry
                 that drifts from it a release later.

                 The figures under it are a grouped inset list: label on the
                 left, a bare right-aligned number on the right, currency as its
                 own row. That row is what retires the `$` glyph that used to sit
                 inside the price input — it was drawn for every currency, so a
                 listing priced in riel showed a dollar sign against the number
                 the vendor was typing. The symbol still appears, once, in the
                 preview card at the top of the drawer, where it is the real
                 price string a client will read.                           -->
            <section class="space-y-3 border-t border-slate-100 pt-5">
              <div>
                <span :class="labelClass">{{ t('services.listingForm.fields.priceType') }}</span>
                <SegmentedField
                  :model-value="form.priceType"
                  :options="priceTypeOptions"
                  :aria-label="t('services.listingForm.fields.priceType')"
                  @update:model-value="selectPriceType($event as PriceTypeValue)"
                />
              </div>

              <div v-if="form.priceType !== 'quote'" class="space-y-1.5">
                <div class="list-group" :class="hasPriceError ? 'is-invalid' : ''">
                  <div v-if="form.priceType === 'fixed'" class="list-row">
                    <label for="listing-price" class="list-row__label">
                      {{ t('services.listingForm.fields.price') }} *
                    </label>
                    <input
                      id="listing-price"
                      v-model.number="form.priceMin"
                      type="number"
                      inputmode="decimal"
                      min="0"
                      placeholder="0"
                      class="list-input"
                      :aria-invalid="!!errors.priceMin"
                      data-field="priceMin"
                      @input="clearError('priceMin')"
                      @blur="touchField('priceMin')"
                    />
                  </div>

                  <template v-else>
                    <div class="list-row">
                      <label for="listing-price-min" class="list-row__label">
                        {{ t('services.listingForm.fields.minPrice') }} *
                      </label>
                      <input
                        id="listing-price-min"
                        v-model.number="form.priceMin"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        placeholder="0"
                        class="list-input"
                        :aria-invalid="!!errors.priceMin"
                        data-field="priceMin"
                        @input="clearError('priceMin')"
                        @blur="touchField('priceMin')"
                      />
                    </div>

                    <div class="list-row">
                      <label for="listing-price-max" class="list-row__label">
                        {{ t('services.listingForm.fields.maxPrice') }} *
                      </label>
                      <input
                        id="listing-price-max"
                        v-model.number="form.priceMax"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        placeholder="0"
                        class="list-input"
                        :aria-invalid="!!errors.priceMax"
                        data-field="priceMax"
                        @input="clearError('priceMax')"
                        @blur="touchField('priceMax')"
                      />
                    </div>
                  </template>

                  <div class="list-row">
                    <span class="list-row__label">
                      {{ t('services.listingForm.fields.currency') }}
                    </span>
                    <SegmentedField
                      class="w-[11.25rem] flex-shrink-0"
                      :model-value="form.currency"
                      :options="currencyOptions"
                      :aria-label="t('services.listingForm.fields.currency')"
                      @update:model-value="form.currency = $event"
                    />
                  </div>
                </div>

                <!-- Under the group rather than under the row, because the row
                     has no room beside a right-aligned figure and a message
                     wedged into one would move the rows below it as it appears. -->
                <p v-if="errors.priceMin" class="px-1 text-xs text-red-600">
                  {{ errors.priceMin }}
                </p>
                <p v-if="errors.priceMax" class="px-1 text-xs text-red-600">
                  {{ errors.priceMax }}
                </p>
              </div>

              <p v-else class="text-sm leading-relaxed text-slate-500">
                {{ t('services.listingForm.quoteHint') }}
              </p>
            </section>

            <!-- More details -------------------------------------------------

                 Everything a listing works without. Three fields is not much,
                 but they sat at the same weight as the four that actually gate
                 publishing, which is what made a ten-field form read as a long
                 one. Collapsed, the always-visible form is what you must answer;
                 open, nothing has moved or changed shape.

                 It opens itself when a listing already has any of them, so
                 editing never looks like the data was dropped.            -->
            <section class="border-t border-slate-100 pt-5">
              <button
                type="button"
                class="-ml-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :aria-expanded="showOptional"
                aria-controls="listing-optional-fields"
                @click="showOptional = !showOptional"
              >
                <ChevronRight
                  class="h-4 w-4 flex-shrink-0 transition-transform duration-200"
                  :class="showOptional ? 'rotate-90' : ''"
                  aria-hidden="true"
                />
                {{ t('services.listingForm.moreDetails') }}
              </button>

              <Transition name="drawer-reveal">
                <div v-if="showOptional" id="listing-optional-fields" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="space-y-3 pt-4">
                      <div>
                        <label :class="labelClass" for="listing-tagline">
                          {{ t('services.listingForm.fields.tagline') }}
                        </label>
                        <input
                          id="listing-tagline"
                          v-model="form.tagline"
                          type="text"
                          maxlength="150"
                          :placeholder="t('services.listingForm.fields.taglinePlaceholder')"
                          :class="fieldClass"
                        />
                        <p :class="hintClass">
                          {{
                            t('services.listingForm.fields.taglineCount', {
                              count: form.tagline.length,
                            })
                          }}
                        </p>
                      </div>

                      <div>
                        <label :class="labelClass" for="listing-area">
                          {{ t('services.listingForm.fields.serviceArea') }}
                        </label>
                        <div class="relative">
                          <MapPin
                            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <input
                            id="listing-area"
                            v-model="form.serviceArea"
                            type="text"
                            :placeholder="t('services.listingForm.fields.serviceAreaPlaceholder')"
                            :class="prefixedFieldClass"
                          />
                        </div>
                      </div>

                      <div>
                        <label :class="labelClass" for="listing-tag">
                          {{ t('services.listingForm.fields.tags') }}
                        </label>

                        <div v-if="form.tags.length" class="mb-2 flex flex-wrap gap-2">
                          <span
                            v-for="(tag, index) in form.tags"
                            :key="`${tag}-${index}`"
                            class="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1 text-sm text-slate-700"
                          >
                            <span class="max-w-[12rem] truncate">{{ tag }}</span>
                            <button
                              type="button"
                              class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                              :aria-label="t('services.listingForm.fields.removeTag', { tag })"
                              @click="removeTag(index)"
                            >
                              <X class="h-3 w-3" aria-hidden="true" />
                            </button>
                          </span>
                        </div>

                        <div class="flex gap-2">
                          <input
                            id="listing-tag"
                            v-model="newTag"
                            type="text"
                            :placeholder="t('services.listingForm.fields.tagsPlaceholder')"
                            :class="[fieldClass, 'flex-1']"
                            @keydown.enter.prevent="addTag"
                          />
                          <button
                            type="button"
                            :disabled="!newTag.trim()"
                            class="flex-shrink-0 rounded-lg bg-slate-100 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                            @click="addTag"
                          >
                            {{ t('services.listingForm.fields.addTag') }}
                          </button>
                        </div>
                        <p :class="hintClass">{{ t('services.listingForm.fields.tagsHint') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </section>
          </form>
        </div>

        <!-- Footer -->
        <div
          class="flex-shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
        >
          <!--
            Two strips in one grid cell, cross-fading. The question "discard
            this?" is asked in the footer the vendor pressed rather than in a
            modal stacked over the drawer — a sheet at z-[1001] over a drawer at
            z-[999] is a modal over a modal, with a second scrim and a second
            Escape target, and this one has exactly two answers. Both strips are
            one row of buttons at one height, so the footer never jogs.

            The safe answer keeps the primary position and the solid cap; the
            destructive one is quiet red text where Cancel was. A red slab here
            would be the loudest object on screen, for the outcome nobody wants.
          -->
          <div class="grid">
            <Transition name="footer-strip">
              <div
                v-if="confirmingDiscard"
                class="footer-strip flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  class="drawer-action rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  @click="confirmingDiscard = false"
                >
                  {{ t('services.listingForm.actions.keepEditing') }}
                </button>

                <button
                  type="button"
                  class="drawer-action rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                  @click="discardAndClose"
                >
                  {{ t('services.listingForm.actions.discard') }}
                </button>
              </div>

              <div v-else class="footer-strip flex items-center justify-between gap-3">
                <!-- The three states share one grid cell, so the button measures
                     to the widest of them once and never resizes as they swap —
                     the same face swap the event drawers run, from the same
                     stylesheet, so publishing a listing and creating an event
                     feel like one kind of act. The tick is also why nothing is
                     toasted on the way out: the control answers for itself, and
                     the row it wrote is on screen behind the drawer as it
                     leaves. -->
                <button
                  type="button"
                  :disabled="isBusy"
                  :class="['action-btn', isComplete ? 'is-complete' : '']"
                  class="grid rounded-lg bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#2ecc71]/20 hover:opacity-90"
                  @click="handleSubmit"
                >
                  <span class="action-face" :data-on="!isSubmitting && !isComplete">
                    <Save class="h-4 w-4" aria-hidden="true" />
                    <span>{{ idleLabel }}</span>
                  </span>
                  <span class="action-face" :data-on="isSubmitting">
                    <Loader class="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{{ workingLabel }}</span>
                  </span>
                  <span class="action-face" :data-on="isComplete" aria-live="polite">
                    <Check class="h-4 w-4" aria-hidden="true" />
                    <span>{{ doneLabel }}</span>
                  </span>
                </button>

                <button
                  type="button"
                  :disabled="isBusy"
                  class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-slate-100 active:scale-95 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  @click="requestClose"
                >
                  {{ t('services.listingForm.actions.cancel') }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <DeleteConfirmModal
    :show="showDeleteConfirm"
    :loading="isDeleting"
    :title="t('services.listingForm.delete')"
    :item-name="form.title"
    @confirm="handleDelete"
    @cancel="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Loader,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Star,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-vue-next'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import SegmentedField, { type SegmentedOption } from '@/components/common/SegmentedField.vue'
import ServiceCard from './ServiceCard.vue'
import type { Listing, PriceType } from './types'
import { useToast } from '@/composables/useToast'
import { useActionConfirmation } from '@/composables/useActionConfirmation'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import {
  serviceCategoriesService,
  serviceListingsService,
  apiClient,
  type ServiceCategory,
  type ServiceListing,
  type CreateServiceListingData,
  type UpdateServiceListingData,
} from '@/services/api'

interface GalleryImage {
  /*
    Stable identity for the tile, independent of position and of whether the
    photo exists on the server yet. `:key="index"` made removing one repaint
    every tile after it into its neighbour's slot instead of moving them, and
    left the dirty check with no cheap way to compare two galleries — a
    freshly picked photo's only other identifier is a base64 data URL.
  */
  key: number
  id?: number // From the API when editing an existing listing
  url: string
  file?: File // Newly picked, not yet uploaded
  is_cover: boolean
}

interface Props {
  modelValue: boolean
  listingId?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', listing: ServiceListing): void
  (e: 'updated', listing: ServiceListing): void
  (e: 'deleted', listingId: string): void
}

const props = withDefaults(defineProps<Props>(), { listingId: null })
const emit = defineEmits<Emits>()

const { t } = useI18n()
const { showSuccess, showError, showWarning } = useToast()
const { translateServiceCategory } = useCategoryTranslation()

const MAX_GALLERY = 10

/*
  One table, two readers: the segmented picker below and `buildPriceDisplayText`,
  which used to carry its own `USD ? '$' : EUR ? '€' : '៛'` ternary — a second
  place to forget a currency.
*/
const CURRENCIES = [
  { value: 'USD', symbol: '$' },
  { value: 'KHR', symbol: '៛' },
  { value: 'EUR', symbol: '€' },
] as const

/* ------------------------------------------------------------------ chrome --

  The §8 form recipe, named once so fourteen inputs cannot drift apart inside
  one file. Same values `settingsFormChrome` holds for the settings tabs; kept
  local because that module is the settings page's own contract and this drawer
  opens from more than one place.
*/
// `text-base sm:text-sm`: Mobile Safari zooms the whole page when a focused
// input measures under 16px, and inside a drawer there is no way back out.
// Desktop keeps the 14px the §8 recipe specifies.
const FIELD_BASE =
  'w-full py-2.5 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg transition-colors duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400'
const fieldClass = `${FIELD_BASE} pl-3.5`
const prefixedFieldClass = `${FIELD_BASE} pl-9`
const invalidFieldClass = 'border-red-300 focus:border-red-400 focus:ring-red-200'
const labelClass = 'block text-sm font-medium text-slate-700 mb-2'
const hintClass = 'mt-1.5 text-xs text-slate-500'
const errorTextClass = 'mt-1.5 text-xs text-red-600'
// `drawer-action` rather than `transition-colors`: a 40px disc is small enough
// that a scale reads as a press, which `hover:bg-white` alone cannot do on the
// phone these photos were taken with.
const tileButtonClass =
  'drawer-action flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'

/* ------------------------------------------------------------------- state -- */

const isEditMode = computed(() => !!props.listingId)

const panel = ref<HTMLElement>()
const titleInput = ref<HTMLInputElement>()
const scroller = ref<HTMLElement | null>(null)
const loading = ref(false)
const isSubmitting = ref(false)
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

/*
  Held on screen after a successful save, long enough to be seen: the face swap
  alone costs ~280ms, so a shorter hold would close on a tick that never
  finished arriving. Same 900ms the event drawers hold.
*/
const {
  confirmed: isComplete,
  confirm: holdConfirmation,
  reset: resetConfirmation,
} = useActionConfirmation(900)
const isBusy = computed(() => isSubmitting.value || isComplete.value)

const galleryFileInput = ref<HTMLInputElement | null>(null)
const newTag = ref('')

/** Whether the footer is asking the discard question rather than offering to save. */
const confirmingDiscard = ref(false)

let nextGalleryKey = 0

/**
 * The last photo removed, and enough state to put it back exactly where it was.
 *
 * Held rather than deleted because the server delete does not happen until
 * save: until then a removal is entirely local and costs nothing to reverse.
 */
const removedPhoto = ref<{ image: GalleryImage; index: number; coverIndex: number } | null>(null)
let undoTimer: ReturnType<typeof setTimeout> | undefined

const clearRemovedPhoto = () => {
  if (undoTimer) clearTimeout(undoTimer)
  undoTimer = undefined
  removedPhoto.value = null
}

/**
 * Whether the optional group is open. Closed for a new listing, open whenever
 * the one being edited already has something in it — a collapsed group holding
 * a tagline the vendor wrote last month reads as the tagline being gone.
 */
const showOptional = ref(false)

const categories = ref<ServiceCategory[]>([])
const currentListing = ref<ServiceListing | null>(null)

type PriceTypeValue = 'fixed' | 'range' | 'quote'
type FieldKey = 'title' | 'description' | 'category' | 'priceMin' | 'priceMax'

const form = reactive({
  title: '',
  tagline: '',
  description: '',
  category: null as number | null, // API uses numeric ids
  priceType: 'fixed' as PriceTypeValue,
  priceMin: null as number | null,
  priceMax: null as number | null,
  currency: 'USD',
  priceDisplayText: '', // Custom display string, when the backend supplied one
  serviceArea: '',
  tags: [] as string[],
  gallery: [] as GalleryImage[],
  coverIndex: 0,
})

const errors = reactive<Partial<Record<FieldKey, string>>>({})

/*
  Which fields the vendor has actually left, so a form they are halfway through
  is never covered in complaints about the parts they have not reached yet.
  Deliberately a plain Set: it is only ever read inside an event handler, and a
  reactive one would re-run `errors` consumers for a fact they do not display.
*/
const FIELD_ORDER: FieldKey[] = ['title', 'description', 'category', 'priceMin', 'priceMax']
const touched = new Set<FieldKey>()

/*
  What the form looked like when it was handed to the vendor — an empty create,
  or the listing as it was loaded. Comparing against it is what lets Escape and
  Cancel close instantly when there is nothing to lose: a confirmation on every
  exit is what teaches people to click through the one that mattered.

  The gallery reduces to its keys, so the comparison never carries a base64
  data URL, and `priceDisplayText` is left out because nothing in this form can
  change it.
*/
const snapshotForm = (): string =>
  JSON.stringify({
    title: form.title,
    tagline: form.tagline,
    description: form.description,
    category: form.category,
    priceType: form.priceType,
    priceMin: form.priceMin,
    priceMax: form.priceMax,
    currency: form.currency,
    serviceArea: form.serviceArea,
    tags: form.tags,
    gallery: form.gallery.map((image) => image.key),
    coverIndex: form.coverIndex,
  })

const baseline = ref('')
const isDirty = computed(() => snapshotForm() !== baseline.value)

const priceTypeOptions = computed<SegmentedOption[]>(() => [
  { value: 'fixed', label: t('services.listingForm.priceTypes.fixed'), icon: DollarSign },
  { value: 'range', label: t('services.listingForm.priceTypes.range'), icon: TrendingUp },
  { value: 'quote', label: t('services.listingForm.priceTypes.quote'), icon: MessageSquare },
])

/*
  Codes, not "USD ($)": three segments share the trailing half of a list row, so
  the label has to survive a Khmer "រូបិយប័ណ្ណ" beside it on a 375px phone. The
  symbol is not lost — it is in the preview card at the top of the drawer, in
  the price string a client will actually read.
*/
const currencyOptions: SegmentedOption[] = CURRENCIES.map((c) => ({
  value: c.value,
  label: c.value,
}))

/** Either figure being wrong reddens the group's border; the messages sit under it. */
const hasPriceError = computed(() => !!(errors.priceMin || errors.priceMax))

/*
  Three labels, written to roughly one length so the button that never resizes
  never looks half-empty (see actionButton.css). "Listing created" and "Listing
  updated" are the strings that used to be toasted; the control says them now.
*/
const idleLabel = computed(() =>
  isEditMode.value
    ? t('services.listingForm.actions.save')
    : t('services.listingForm.actions.create'),
)
const workingLabel = computed(() =>
  isEditMode.value
    ? t('services.listingForm.actions.saving')
    : t('services.listingForm.actions.creating'),
)
const doneLabel = computed(() =>
  isEditMode.value
    ? t('services.listingForm.messages.updated')
    : t('services.listingForm.messages.created'),
)

/** Only shown for a listing a reviewer actually sent back — see the card's note. */
const reviewNote = computed(() => {
  const listing = currentListing.value
  if (!listing) return ''
  return listing.status === 'rejected' || listing.status === 'suspended'
    ? listing.admin_notes?.trim() || ''
    : ''
})

/* -------------------------------------------------------------------- form -- */

const clearError = (field: FieldKey) => {
  delete errors[field]
}

const clearAllErrors = () => {
  for (const key of Object.keys(errors) as FieldKey[]) delete errors[key]
}

/**
 * One field's complaint, or '' if it has none. The single source of truth for
 * both the blur pass and the submit sweep, so the two can never disagree about
 * what "valid" means.
 */
const fieldError = (field: FieldKey): string => {
  switch (field) {
    case 'title':
      return form.title.trim() ? '' : t('services.listingForm.errors.title')
    case 'description':
      return form.description.trim() ? '' : t('services.listingForm.errors.description')
    case 'category':
      return form.category ? '' : t('services.listingForm.errors.category')
    case 'priceMin':
      if (form.priceType === 'fixed') {
        return form.priceMin ? '' : t('services.listingForm.errors.price')
      }
      if (form.priceType === 'range') {
        return form.priceMin ? '' : t('services.listingForm.errors.minPrice')
      }
      return ''
    case 'priceMax':
      if (form.priceType !== 'range') return ''
      if (!form.priceMax) return t('services.listingForm.errors.maxPrice')
      return form.priceMin && form.priceMax <= form.priceMin
        ? t('services.listingForm.errors.rangeOrder')
        : ''
  }
}

/** Re-run every field the vendor has already left, and only those. */
const refreshTouchedErrors = () => {
  for (const key of FIELD_ORDER) {
    if (!touched.has(key)) continue
    const message = fieldError(key)
    if (message) errors[key] = message
    else delete errors[key]
  }
}

/**
 * A field the vendor has finished with. Called on blur — and on `change` for
 * the category, where the commit *is* the change and waiting for blur would
 * leave a complaint standing over an answered question.
 *
 * Every touched field is re-checked, not just this one: the range rule spans
 * both prices, so leaving the lower one has to be able to clear a complaint
 * sitting on the upper.
 */
const touchField = (field: FieldKey) => {
  touched.add(field)
  refreshTouchedErrors()
}

const selectPriceType = (value: PriceTypeValue) => {
  form.priceType = value
  clearError('priceMin')
  clearError('priceMax')
}

const resetForm = () => {
  form.title = ''
  form.tagline = ''
  form.description = ''
  form.category = null
  form.priceType = 'fixed'
  form.priceMin = null
  form.priceMax = null
  form.currency = 'USD'
  form.priceDisplayText = ''
  form.serviceArea = ''
  form.tags = []
  form.gallery = []
  form.coverIndex = 0
  currentListing.value = null
  newTag.value = ''
  showOptional.value = false
  touched.clear()
  clearRemovedPhoto()
  clearAllErrors()
}

const fetchCategories = async () => {
  if (categories.value.length > 0) return
  try {
    const response = await serviceCategoriesService.listCategories()
    if (response.success && response.data) {
      categories.value = response.data.results
    }
  } catch (err) {
    console.error('Failed to fetch service categories:', err)
  }
}

const populateFormFromListing = (listing: ServiceListing) => {
  form.title = listing.title || ''
  form.tagline = listing.short_tagline || ''
  form.description = listing.description || ''
  // Number, so the select's numeric option values bind
  form.category = listing.category != null ? Number(listing.category) : null

  const priceMin = parseFloat(listing.price_min) || 0
  const priceMax = parseFloat(listing.price_max) || 0

  if (priceMin === 0 && priceMax === 0) {
    form.priceType = 'quote'
    form.priceMin = null
    form.priceMax = null
  } else if (priceMin === priceMax || priceMax === 0) {
    form.priceType = 'fixed'
    form.priceMin = priceMin
    form.priceMax = null
  } else {
    form.priceType = 'range'
    form.priceMin = priceMin
    form.priceMax = priceMax
  }

  form.currency = listing.currency || 'USD'
  form.priceDisplayText = listing.price_display_text || ''
  form.serviceArea = listing.service_area || ''
  form.tags = listing.tags_list || []
  showOptional.value = !!(form.tagline || form.serviceArea || form.tags.length)

  form.gallery = (listing.media || []).map((media) => ({
    key: nextGalleryKey++,
    id: media.id,
    url: apiClient.getProfilePictureUrl(media.image) || media.image,
    is_cover: media.is_cover,
  }))

  const coverIdx = form.gallery.findIndex((img) => img.is_cover)
  form.coverIndex = coverIdx >= 0 ? coverIdx : 0
}

const fetchListing = async (listingId: string) => {
  loading.value = true
  clearAllErrors()
  try {
    const response = await serviceListingsService.getListing(listingId)
    if (response.success && response.data) {
      currentListing.value = response.data
      populateFormFromListing(response.data)
    } else {
      showError(response.message || t('services.listingForm.errors.loadFailed'))
    }
  } catch (err) {
    console.error('Failed to fetch listing:', err)
    showError(t('services.listingForm.errors.loadFailed'))
  } finally {
    loading.value = false
  }
}

/* ----------------------------------------------------------------- gallery -- */

const triggerGalleryUpload = () => {
  galleryFileInput.value?.click()
}

const handleGalleryFileSelect = (e: Event) => {
  e.stopPropagation()
  e.preventDefault()

  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) {
    target.value = ''
    return
  }

  const remainingSlots = MAX_GALLERY - form.gallery.length
  const filesToAdd = Array.from(files).slice(0, remainingSlots)
  const isFirstImage = form.gallery.length === 0

  filesToAdd.forEach((file, idx) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      form.gallery.push({
        key: nextGalleryKey++,
        url: ev.target?.result as string,
        file,
        is_cover: isFirstImage && idx === 0, // First photo becomes the cover
      })
    }
    reader.readAsDataURL(file)
  })

  // Cleared so the same file can be picked again after a removal
  target.value = ''
}

const UNDO_WINDOW_MS = 8000

const removeGalleryImage = (index: number) => {
  const [image] = form.gallery.splice(index, 1)
  if (!image) return

  // Stashed before the cover is reshuffled, so undo restores the arrangement
  // rather than reconstructing it.
  if (undoTimer) clearTimeout(undoTimer)
  removedPhoto.value = { image, index, coverIndex: form.coverIndex }
  undoTimer = setTimeout(clearRemovedPhoto, UNDO_WINDOW_MS)

  if (form.coverIndex === index) {
    form.coverIndex = form.gallery.length > 0 ? 0 : -1
    if (form.gallery.length > 0) form.gallery[0].is_cover = true
  } else if (form.coverIndex > index) {
    form.coverIndex--
  }
}

const undoRemoveGalleryImage = () => {
  const stash = removedPhoto.value
  if (!stash) return

  form.gallery.splice(stash.index, 0, stash.image)
  // Reasserted from the stashed index rather than nudged back: the removal may
  // have moved the cover onto a different photo, and flipping one flag would
  // leave two of them claiming it.
  form.coverIndex = stash.coverIndex
  form.gallery.forEach((img, idx) => {
    img.is_cover = idx === stash.coverIndex
  })
  clearRemovedPhoto()
}

const setCoverImage = (index: number) => {
  form.gallery.forEach((img, idx) => {
    img.is_cover = idx === index
  })
  form.coverIndex = index
}

/* -------------------------------------------------------------------- tags -- */

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  form.tags.splice(index, 1)
}

/* ------------------------------------------------------------------ submit -- */

const buildPriceDisplayText = (): string => {
  if (form.priceDisplayText) return form.priceDisplayText

  const symbol = CURRENCIES.find((c) => c.value === form.currency)?.symbol ?? '$'

  if (form.priceType === 'quote') return 'Contact for Quote'
  if (form.priceType === 'fixed') return `${symbol}${form.priceMin || 0}`
  return `${symbol}${form.priceMin || 0} - ${symbol}${form.priceMax || 0}`
}

/**
 * The form state, in the shape the catalogue card reads.
 *
 * Placeholders stand in for the fields that are still empty, because a card
 * rendered from a blank form would look broken rather than unfinished. The
 * price is the one worth explaining: an unpriced listing borrows the quote
 * type's muted styling for its "Add a price" stand-in, so a real figure is
 * always the only price-shaped thing rendered at full weight.
 *
 * The cover comes straight from the gallery — a freshly picked photo is a
 * `data:` URL and renders as-is, so the crop is answered before upload rather
 * than after saving.
 */
const previewListing = computed<Listing>(() => {
  const category =
    categories.value.find((c) => Number(c.id) === form.category)?.name ||
    t('services.listingForm.preview.noCategory')

  const hasFigure =
    form.priceType === 'fixed'
      ? !!form.priceMin
      : form.priceType === 'range'
        ? !!form.priceMin && !!form.priceMax
        : false

  const priceType: PriceType =
    form.priceType === 'quote' || !hasFigure ? 'quote' : (form.priceType as PriceType)
  const priceDisplay =
    form.priceType === 'quote'
      ? buildPriceDisplayText()
      : hasFigure
        ? buildPriceDisplayText()
        : t('services.listingForm.preview.noPrice')

  return {
    id: props.listingId || 'preview',
    title: form.title.trim() || t('services.listingForm.preview.untitled'),
    tagline: form.tagline.trim(),
    description: form.description.trim(),
    coverImage: form.gallery[form.coverIndex]?.url || '',
    category,
    priceType,
    priceMin: form.priceMin,
    priceMax: form.priceMax,
    currency: form.currency as Listing['currency'],
    priceUnit: '',
    priceDisplay,
    vendorId: '',
    vendorName: '',
    vendorLogo: '',
    vendorVerified: false,
    tags: form.tags,
    serviceArea: form.serviceArea,
    gallery: [],
    telegramUsername: '',
    phone: '',
    website: '',
    views: currentListing.value?.views_count ?? 0,
    contactClicks: currentListing.value?.contact_clicks_count ?? 0,
    isFeatured: currentListing.value?.is_featured ?? false,
  }
})

/**
 * Validate, and put every complaint under the field that caused it. Returns the
 * first invalid field so the caller can bring it into view — in a form this
 * long, an error three screens above the button reads as nothing happening.
 */
const validate = (): FieldKey | null => {
  clearAllErrors()
  // Everything counts as left once Create has been pressed, so a field the
  // vendor then fixes clears on its own blur rather than waiting for a second
  // press to tell it the news.
  for (const key of FIELD_ORDER) {
    touched.add(key)
    const message = fieldError(key)
    if (message) errors[key] = message
  }
  return FIELD_ORDER.find((key) => errors[key]) ?? null
}

const focusField = async (field: FieldKey) => {
  await nextTick()
  const el = scroller.value?.querySelector<HTMLElement>(`[data-field="${field}"]`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
}

/**
 * Upload the photos picked in this session and return the cover's new media id,
 * if the cover is one of them. Failure here is not fatal — the listing itself
 * saved — so it warns rather than throwing the save away.
 */
const uploadPendingMedia = async (listingId: string): Promise<number | null> => {
  const newImageIndices: number[] = []
  const filesToUpload: File[] = []

  form.gallery.forEach((img, idx) => {
    if (img.file) {
      newImageIndices.push(idx)
      filesToUpload.push(img.file)
    }
  })

  if (filesToUpload.length === 0) return null

  try {
    const response = await serviceListingsService.bulkUploadMedia(listingId, filesToUpload)

    // A rejected upload used to fall straight through to `return null`: the
    // listing saved, the photos did not, and the only thing the vendor was told
    // was "Listing created". `apiClient` resolves HTTP failures as
    // `{ success: false, message }` rather than throwing, so the catch below
    // never saw them — a 400 on the file, an expired token, a 413 on the size
    // all looked identical to having nothing to upload.
    if (!response.success || !response.data?.media) {
      console.error('Listing media upload rejected:', response)
      showWarning(response.message || t('services.listingForm.errors.mediaFailed'))
      return null
    }

    response.data.media.forEach((media, uploadIdx) => {
      const galleryIdx = newImageIndices[uploadIdx]
      if (galleryIdx !== undefined) form.gallery[galleryIdx].id = media.id
    })

    // A partial accept is a failure the vendor has to know about too — the
    // gallery on screen will not match the listing that was saved.
    if (response.data.media.length < filesToUpload.length) {
      showWarning(t('services.listingForm.errors.mediaPartial'))
    }

    const coverImage = form.gallery[form.coverIndex]
    return coverImage?.id ?? null
  } catch (err) {
    console.error('Failed to upload listing media:', err)
    showWarning(t('services.listingForm.errors.mediaFailed'))
    return null
  }
}

const handleSubmit = async () => {
  if (isBusy.value) return

  const firstInvalid = validate()
  if (firstInvalid) {
    focusField(firstInvalid)
    return
  }

  isSubmitting.value = true

  try {
    const priceMin = form.priceType === 'quote' ? '0' : String(form.priceMin || 0)
    const priceMax =
      form.priceType === 'quote'
        ? '0'
        : form.priceType === 'fixed'
          ? priceMin
          : String(form.priceMax || 0)

    const payload: CreateServiceListingData & UpdateServiceListingData = {
      category: form.category!,
      title: form.title.trim(),
      description: form.description.trim(),
      short_tagline: form.tagline.trim(),
      price_min: priceMin,
      price_max: priceMax,
      price_display_text: buildPriceDisplayText(),
      currency: form.currency,
      service_area: form.serviceArea.trim(),
      tags: form.tags.join(', '),
    }

    if (isEditMode.value && props.listingId) {
      const response = await serviceListingsService.updateListing(props.listingId, payload)
      if (!response.success || !response.data) {
        showError(response.message || t('services.listingForm.errors.saveFailed'))
        return
      }

      if (form.gallery.some((img) => img.file)) {
        await uploadPendingMedia(props.listingId)
      }

      // Media removed in this session has to be deleted server-side too
      if (currentListing.value) {
        const existingIds = currentListing.value.media.map((m) => m.id)
        const currentIds = form.gallery.filter((img) => img.id).map((img) => img.id!)
        const deletedIds = existingIds.filter((id) => !currentIds.includes(id))
        for (const mediaId of deletedIds) {
          await serviceListingsService.deleteMedia(props.listingId, mediaId)
        }
      }

      const coverImage = form.gallery[form.coverIndex]
      if (coverImage?.id) {
        await serviceListingsService.setCoverImage(props.listingId, coverImage.id)
      }

      // Re-read so the parent gets the media changes, not just the field changes
      const refreshed = await serviceListingsService.getListing(props.listingId)
      emit('updated', refreshed.success && refreshed.data ? refreshed.data : response.data)

      // Let the parent's merge and re-render land before the swap starts: it
      // rebuilds the listing behind the drawer, and a 280ms face swap sharing a
      // tick with that work drops its opening frames.
      await nextTick()

      isSubmitting.value = false
      holdConfirmation(() => closeDrawer())
      return
    }

    const response = await serviceListingsService.createListing(payload)
    if (!response.success || !response.data) {
      showError(response.message || t('services.listingForm.errors.saveFailed'))
      return
    }

    const listingId = response.data.id

    if (form.gallery.length > 0) {
      await uploadPendingMedia(listingId)
      const coverImage = form.gallery[form.coverIndex]
      if (coverImage?.id) {
        await serviceListingsService.setCoverImage(listingId, coverImage.id)
      }
    }

    const refreshed = await serviceListingsService.getListing(listingId)
    emit('created', refreshed.success && refreshed.data ? refreshed.data : response.data)
    await nextTick()
    isSubmitting.value = false
    holdConfirmation(() => closeDrawer())
  } catch (err) {
    console.error('Error saving listing:', err)
    showError(t('services.listingForm.errors.saveFailed'))
  } finally {
    // The confirmed hold owns the button from here; clearing the working face
    // under it would flash the idle label between the spinner and the tick.
    if (!isComplete.value) isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!props.listingId) return

  isDeleting.value = true
  try {
    const response = await serviceListingsService.deleteListing(props.listingId)
    if (response.success) {
      showDeleteConfirm.value = false
      emit('deleted', props.listingId)
      showSuccess(t('services.listingForm.messages.deleted'))
      closeDrawer()
    } else {
      showError(response.message || t('services.listingForm.errors.deleteFailed'))
    }
  } catch (err) {
    console.error('Error deleting listing:', err)
    showError(t('services.listingForm.errors.deleteFailed'))
  } finally {
    isDeleting.value = false
  }
}

/* ------------------------------------------------------------- open/close -- */

const closeDrawer = () => {
  emit('update:modelValue', false)
}

/**
 * The exit every dismissal that is not a completed save goes through.
 *
 * A clean form closes on the spot — asking "discard?" of someone who has
 * changed nothing is the confirmation that teaches people to click through the
 * one that mattered. A dirty one turns the footer into the question.
 */
const requestClose = () => {
  if (isBusy.value) return
  if (isDirty.value) {
    confirmingDiscard.value = true
    return
  }
  closeDrawer()
}

const discardAndClose = () => {
  confirmingDiscard.value = false
  closeDrawer()
}

/**
 * Move focus into the dialog this declares itself to be. Without it focus stays
 * on the trigger behind the backdrop: a screen reader announces nothing, and
 * the first Tab has to be rescued by the focus trap.
 *
 * The title field only on a pointer, because focusing an input on a phone
 * throws the keyboard over the sheet before the vendor has seen it. Touch gets
 * the panel itself — enough to move the AT cursor and announce the dialog,
 * with no keyboard.
 */
const focusOnOpen = async () => {
  await nextTick()
  if (!props.modelValue) return
  // The open sequence awaits two requests, so this can land seconds after the
  // drawer appeared — by which time the vendor may already be typing in it.
  // Moving focus is for a dialog nobody is inside yet.
  if (panel.value?.contains(document.activeElement)) return
  // Guarded: an unhandled rejection in here would take the open sequence with
  // it, and a drawer that fails to finish opening is worse than one that opens
  // without moving focus.
  const usesPointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const target = usesPointer ? titleInput.value : undefined
  ;(target ?? panel.value)?.focus({ preventScroll: true })
}

// Keep Tab inside the drawer — without this the user tabs straight out into the
// page behind the backdrop, which they can neither see nor click, and the only
// way back is a mouse.
const { trapFocus } = useFocusTrap(panel)

// Escape closes the drawer — but only when the confirm modal stacked above it
// is not the thing on screen, which owns Escape while it is open.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    // The confirm modal is a sibling of the drawer, not a descendant of it, so
    // while it is up it owns focus and the trap must stand down — otherwise Tab
    // bounces back into a drawer the vendor cannot act on.
    if (!showDeleteConfirm.value) trapFocus(event)
    return
  }
  if (event.key !== 'Escape') return
  if (showDeleteConfirm.value) {
    if (!isDeleting.value) showDeleteConfirm.value = false
    return
  }
  // Escape backs out of the discard question rather than answering it. The key
  // that dismisses things must never be the key that destroys work — pressing
  // it again simply asks once more.
  if (confirmingDiscard.value) {
    confirmingDiscard.value = false
    return
  }
  // A save in flight is not something Escape may cancel: the request is already
  // out, and closing here would leave the vendor unsure whether it landed.
  if (!isBusy.value) requestClose()
}

// The page behind must not scroll, and it must not shift sideways when its
// scrollbar is taken away.
const getScrollbarWidth = (): number => window.innerWidth - document.documentElement.clientWidth

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      /*
        Everything that must be true the moment the drawer is on screen happens
        first, synchronously, before anything is awaited.

        The reset used to sit *behind* `await fetchCategories()`. In edit mode
        that gap is invisible — `fetchListing` raises `loading` and the form is
        not rendered until it resolves — but a create opens on live, empty
        fields, so the vendor could attach a photo while the category request
        was still in flight and have it wiped by the reset landing behind them.
        The listing then saved with no media, which is exactly the shape of the
        bug: the first create of a session loses its photo (cold category
        fetch), and the edit that follows keeps it (`fetchCategories` returns
        early once loaded).

        The body lock and the Escape listener were behind the same await, so
        until the categories arrived the page behind still scrolled and Escape
        did nothing.
      */
      if (!props.listingId) {
        resetForm()
        baseline.value = snapshotForm()
      }
      confirmingDiscard.value = false

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
      document.addEventListener('keydown', onKeydown)

      await fetchCategories()

      // Only ever fills the form it was opened on: a drawer closed and reopened
      // on a different listing while this was in flight must not be overwritten
      // by the answer to the previous question.
      if (props.listingId && props.modelValue) {
        await fetchListing(props.listingId)
        // Re-taken once the fields are filled, so "dirty" means the vendor
        // changed something and never means "the form finished loading".
        baseline.value = snapshotForm()
      }

      focusOnOpen()
    } else {
      document.removeEventListener('keydown', onKeydown)
      // Dismissed mid-confirmation (Escape, the cancel button): drop the held
      // state without running its follow-up, so reopening does not start on a
      // stale tick.
      resetConfirmation()
      isSubmitting.value = false
      confirmingDiscard.value = false
      clearRemovedPhoto()
      // Deferred past the leave transition (350ms) so the page behind does not
      // reflow mid-slide.
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 350)
    }
  },
)

watch(
  () => props.listingId,
  async (newListingId) => {
    if (!newListingId || !props.modelValue) return
    await fetchListing(newListingId)
    // A different listing is a different form: what counted as unsaved work a
    // moment ago belongs to a listing this drawer is no longer showing.
    touched.clear()
    clearRemovedPhoto()
    baseline.value = snapshotForm()
  },
)

onUnmounted(() => {
  if (undoTimer) clearTimeout(undoTimer)
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})
</script>

<style scoped src="../common/actionButton.css"></style>
<style scoped src="../common/groupedList.css"></style>

<style scoped>
/* The form stays visible but stops accepting edits while the save is in flight,
   so nothing the vendor types can be silently dropped. */
.form-busy {
  pointer-events: none;
  opacity: 0.6;
  transition: opacity 0.2s ease-out;
}

/*
  The two footer strips share one grid cell and cross-fade. No `mode`: with
  `out-in` the cell empties for a frame and the footer collapses to nothing,
  which is the one thing a strip of buttons under a form must never do. Both
  are `grid-area: 1 / 1`, so the footer measures the taller of them — they are
  the same height — and never jogs.
*/
.footer-strip {
  grid-area: 1 / 1;
  transition: opacity 0.18s ease-out;
}

.footer-strip-enter-from,
.footer-strip-leave-to {
  opacity: 0;
}

/* The outgoing strip is still on screen for 180ms and must not be clickable:
   its buttons sit exactly on top of the ones replacing them. */
.footer-strip-leave-active {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .footer-strip {
    transition-duration: 0.01ms;
  }
}

/* An invalid figure reddens the group's own border. The rows inside keep their
   hairlines: it is the pair of prices that is wrong, and the message under the
   group says which. */
.list-group.is-invalid {
  border-color: rgb(252 165 165); /* red-300 */
}

/* Thin scrollbar, per §10 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
