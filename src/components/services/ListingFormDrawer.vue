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

    **It does not announce every group.** It used to carry five uppercase
    eyebrows, two of them over a single field — "Service Area" above one text
    input, "Tags" above one more. An eyebrow is earned when the user has to
    navigate back to a group in a form they scroll (taste §4); over one field it
    is a caption pretending to be a section. Three remain, each over a region a
    vendor genuinely scrolls back to.

    **It does not colour its controls to mark selection.** The price-type picker
    was three tall bordered tiles that turned emerald when chosen, which made the
    loudest object in the drawer a radio group. It is a segmented control on a
    slate track now: the selected segment lifts onto white, and the two saturated
    objects in here stay the header and the button that saves.

    **It does not hide the photo controls behind hover.** Set-cover and remove
    lived in a `group-hover` overlay, so on a phone — where most of these photos
    are taken and uploaded — there was no way to reach either. They are always
    on the tile now, as glass discs, and the grid drops to two columns below `sm`
    so a 40px target fits without covering the photo it acts on.

    **It does not report failure only at the bottom.** Missing-field errors were
    a single message near the footer naming one field at a time; the field
    causing it could be three screens up. They render under their own inputs
    now, and the first one is scrolled to.
  -->
  <Teleport to="body">
    <!-- The backdrop does not close this. Deliberate, and the one place this
         drawer departs from §10: it holds a long form with unsaved photo
         uploads, and a stray click on the dimmed page should not discard it.
         Escape still closes — that is a decision, not a slip of the mouse. -->
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm" />
    </Transition>

    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 z-[999] flex w-full flex-col overflow-hidden bg-white shadow-2xl will-change-transform md:bottom-4 md:right-4 md:top-4 md:w-[32.5rem] md:max-w-[calc(100vw-32px)] md:rounded-2xl laptop-sm:w-[35rem] laptop-md:w-[38.75rem] desktop:w-[42.5rem]"
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
                class="rounded-lg p-1.5 transition-colors duration-200 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                :aria-label="t('services.listingForm.close')"
                :title="t('services.listingForm.close')"
                @click="closeDrawer"
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
              :disabled="isSubmitting"
              class="rounded-lg p-1.5 transition-colors duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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

          <form v-else class="space-y-6 p-4 pb-24" novalidate @submit.prevent="handleSubmit">
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
              <h3 :class="sectionHeadingClass">{{ t('services.listingForm.sections.photos') }}</h3>

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
                  :key="index"
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

              <p :class="hintClass">{{ t('services.listingForm.gallery.hint') }}</p>
            </section>

            <!-- Basics ---------------------------------------------------- -->
            <section class="space-y-3 border-t border-slate-100 pt-5">
              <h3 :class="sectionHeadingClass">{{ t('services.listingForm.sections.basics') }}</h3>

              <div>
                <label :class="labelClass" for="listing-title">
                  {{ t('services.listingForm.fields.title') }} *
                </label>
                <input
                  id="listing-title"
                  v-model="form.title"
                  type="text"
                  :placeholder="t('services.listingForm.fields.titlePlaceholder')"
                  :class="[fieldClass, errors.title ? invalidFieldClass : '']"
                  :aria-invalid="!!errors.title"
                  data-field="title"
                  @input="clearError('title')"
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
                    @change="clearError('category')"
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
                ></textarea>
                <p v-if="errors.description" :class="errorTextClass">{{ errors.description }}</p>
              </div>
            </section>

            <!-- Pricing --------------------------------------------------- -->
            <section class="space-y-3 border-t border-slate-100 pt-5">
              <h3 :class="sectionHeadingClass">{{ t('services.listingForm.sections.pricing') }}</h3>

              <!-- Segmented control on a slate track. Same geometry as the app's
                   pill toggles; the flat fill instead of the brand gradient is
                   deliberate — see the header note. -->
              <div>
                <span :class="labelClass">{{ t('services.listingForm.fields.priceType') }}</span>
                <div
                  class="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
                  role="radiogroup"
                  :aria-label="t('services.listingForm.fields.priceType')"
                >
                  <button
                    v-for="option in priceTypeOptions"
                    :key="option.value"
                    type="button"
                    role="radio"
                    :aria-checked="form.priceType === option.value"
                    class="flex min-h-[40px] items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                    :class="
                      form.priceType === option.value
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    "
                    @click="selectPriceType(option.value)"
                  >
                    <component
                      :is="option.icon"
                      class="h-3.5 w-3.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span class="truncate">{{ option.label }}</span>
                  </button>
                </div>
              </div>

              <div v-if="form.priceType === 'fixed'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label :class="labelClass" for="listing-price">
                    {{ t('services.listingForm.fields.price') }} *
                  </label>
                  <div class="relative">
                    <DollarSign
                      class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="listing-price"
                      v-model.number="form.priceMin"
                      type="number"
                      min="0"
                      placeholder="0"
                      :class="[prefixedFieldClass, errors.priceMin ? invalidFieldClass : '']"
                      :aria-invalid="!!errors.priceMin"
                      data-field="priceMin"
                      @input="clearError('priceMin')"
                    />
                  </div>
                  <p v-if="errors.priceMin" :class="errorTextClass">{{ errors.priceMin }}</p>
                </div>

                <div>
                  <label :class="labelClass" for="listing-currency-fixed">
                    {{ t('services.listingForm.fields.currency') }}
                  </label>
                  <div class="relative">
                    <select
                      id="listing-currency-fixed"
                      v-model="form.currency"
                      :class="[fieldClass, 'appearance-none pr-10']"
                    >
                      <option v-for="c in CURRENCIES" :key="c.value" :value="c.value">
                        {{ c.label }}
                      </option>
                    </select>
                    <ChevronDown
                      class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>

              <div v-else-if="form.priceType === 'range'" class="space-y-3">
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label :class="labelClass" for="listing-price-min">
                      {{ t('services.listingForm.fields.minPrice') }} *
                    </label>
                    <div class="relative">
                      <DollarSign
                        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="listing-price-min"
                        v-model.number="form.priceMin"
                        type="number"
                        min="0"
                        placeholder="0"
                        :class="[prefixedFieldClass, errors.priceMin ? invalidFieldClass : '']"
                        :aria-invalid="!!errors.priceMin"
                        data-field="priceMin"
                        @input="clearError('priceMin')"
                      />
                    </div>
                    <p v-if="errors.priceMin" :class="errorTextClass">{{ errors.priceMin }}</p>
                  </div>

                  <div>
                    <label :class="labelClass" for="listing-price-max">
                      {{ t('services.listingForm.fields.maxPrice') }} *
                    </label>
                    <div class="relative">
                      <DollarSign
                        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="listing-price-max"
                        v-model.number="form.priceMax"
                        type="number"
                        min="0"
                        placeholder="0"
                        :class="[prefixedFieldClass, errors.priceMax ? invalidFieldClass : '']"
                        :aria-invalid="!!errors.priceMax"
                        data-field="priceMax"
                        @input="clearError('priceMax')"
                      />
                    </div>
                    <p v-if="errors.priceMax" :class="errorTextClass">{{ errors.priceMax }}</p>
                  </div>
                </div>

                <div>
                  <label :class="labelClass" for="listing-currency-range">
                    {{ t('services.listingForm.fields.currency') }}
                  </label>
                  <div class="relative">
                    <select
                      id="listing-currency-range"
                      v-model="form.currency"
                      :class="[fieldClass, 'appearance-none pr-10']"
                    >
                      <option v-for="c in CURRENCIES" :key="c.value" :value="c.value">
                        {{ c.label }}
                      </option>
                    </select>
                    <ChevronDown
                      class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>
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

              <Transition name="collapse">
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
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between gap-3">
            <button
              type="button"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#2ecc71]/20 transition-all duration-200 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              @click="handleSubmit"
            >
              <Loader v-if="isSubmitting" class="h-4 w-4 animate-spin" aria-hidden="true" />
              <Save v-else class="h-4 w-4" aria-hidden="true" />
              {{ submitLabel }}
            </button>

            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              @click="closeDrawer"
            >
              {{ t('services.listingForm.actions.cancel') }}
            </button>
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
import ServiceCard from './ServiceCard.vue'
import type { Listing, PriceType } from './types'
import { useToast } from '@/composables/useToast'
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

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'KHR', label: 'KHR (៛)' },
  { value: 'EUR', label: 'EUR (€)' },
] as const

/* ------------------------------------------------------------------ chrome --

  The §8 form recipe, named once so fourteen inputs cannot drift apart inside
  one file. Same values `settingsFormChrome` holds for the settings tabs; kept
  local because that module is the settings page's own contract and this drawer
  opens from more than one place.
*/
const FIELD_BASE =
  'w-full py-2.5 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg transition-colors duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400'
const fieldClass = `${FIELD_BASE} pl-3.5`
const prefixedFieldClass = `${FIELD_BASE} pl-9`
const invalidFieldClass = 'border-red-300 focus:border-red-400 focus:ring-red-200'
const labelClass = 'block text-sm font-medium text-slate-700 mb-2'
const hintClass = 'mt-1.5 text-xs text-slate-500'
const errorTextClass = 'mt-1.5 text-xs text-red-600'
const sectionHeadingClass = 'text-xs font-semibold uppercase tracking-wider text-slate-500'
const tileButtonClass =
  'flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm transition-colors duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'

/* ------------------------------------------------------------------- state -- */

const isEditMode = computed(() => !!props.listingId)

const scroller = ref<HTMLElement | null>(null)
const loading = ref(false)
const isSubmitting = ref(false)
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

const galleryFileInput = ref<HTMLInputElement | null>(null)
const newTag = ref('')

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

const priceTypeOptions = computed(() => [
  { value: 'fixed' as const, label: t('services.listingForm.priceTypes.fixed'), icon: DollarSign },
  { value: 'range' as const, label: t('services.listingForm.priceTypes.range'), icon: TrendingUp },
  {
    value: 'quote' as const,
    label: t('services.listingForm.priceTypes.quote'),
    icon: MessageSquare,
  },
])

const submitLabel = computed(() => {
  if (isSubmitting.value) {
    return isEditMode.value
      ? t('services.listingForm.actions.saving')
      : t('services.listingForm.actions.creating')
  }
  return isEditMode.value
    ? t('services.listingForm.actions.save')
    : t('services.listingForm.actions.create')
})

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

const removeGalleryImage = (index: number) => {
  form.gallery.splice(index, 1)
  if (form.coverIndex === index) {
    form.coverIndex = form.gallery.length > 0 ? 0 : -1
    if (form.gallery.length > 0) form.gallery[0].is_cover = true
  } else if (form.coverIndex > index) {
    form.coverIndex--
  }
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

  const symbol = form.currency === 'USD' ? '$' : form.currency === 'EUR' ? '€' : '៛'

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

  if (!form.title.trim()) errors.title = t('services.listingForm.errors.title')
  if (!form.description.trim()) errors.description = t('services.listingForm.errors.description')
  if (!form.category) errors.category = t('services.listingForm.errors.category')

  if (form.priceType === 'fixed' && !form.priceMin) {
    errors.priceMin = t('services.listingForm.errors.price')
  }

  if (form.priceType === 'range') {
    if (!form.priceMin) errors.priceMin = t('services.listingForm.errors.minPrice')
    if (!form.priceMax) errors.priceMax = t('services.listingForm.errors.maxPrice')
    if (form.priceMin && form.priceMax && form.priceMax <= form.priceMin) {
      errors.priceMax = t('services.listingForm.errors.rangeOrder')
    }
  }

  const order: FieldKey[] = ['title', 'description', 'category', 'priceMin', 'priceMax']
  return order.find((key) => errors[key]) ?? null
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
      showSuccess(t('services.listingForm.messages.updated'))
      closeDrawer()
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
    showSuccess(t('services.listingForm.messages.created'))
    closeDrawer()
  } catch (err) {
    console.error('Error saving listing:', err)
    showError(t('services.listingForm.errors.saveFailed'))
  } finally {
    isSubmitting.value = false
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

// Escape closes the drawer — but only when the confirm modal stacked above it
// is not the thing on screen, which owns Escape while it is open.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (showDeleteConfirm.value) {
    showDeleteConfirm.value = false
    return
  }
  closeDrawer()
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
      if (!props.listingId) resetForm()

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
      }
    } else {
      document.removeEventListener('keydown', onKeydown)
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
    if (newListingId && props.modelValue) await fetchListing(newListingId)
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Up from the bottom on a phone, in from the right on a desktop. */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%) translateZ(0);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%) translateZ(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: opacity 0.2s ease;
  }

  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: none;
    opacity: 0;
  }
}

/* Expand/collapse via grid rows, never max-height — §15. Padding lives on the
   innermost layer so it collapses with the content. */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
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
