<template>
  <div class="absolute inset-0 z-10">
    <!-- Background handled by CoverStage - transparent div maintains z-index stacking -->
    <div class="absolute inset-0 w-full h-full object-cover bg-transparent"></div>

    <!-- The falling particle field is owned by CoverStage, which outlives every
         individual stage, so one continuous field spans cover → transition →
         here. It draws in FRONT of this whole stage — decorations, content card
         and floating menu alike — because CoverStage renders this stage inside a
         `z-20` stacking context, leaving no z-index that sits between these
         layers. See `fallingEffectZIndex` in CoverStage.vue. -->

    <!-- Decoration Images (optimized via ImageKit for viewport size) -->
    <!-- Z-indexes are dynamic via mainStageLayout prop (defaults: left/right=24, top/bottom=25) -->
    <!-- `max-w-none` on the side pieces is load-bearing: Tailwind's preflight
         applies `img { max-width: 100% }`, and on phones taller than 9:16 the
         stage frame is flex-shrunk narrower than its 1080/1920 width, so that
         clamp squeezed the width while `h-full` held the height — the artwork
         rendered ~20% narrow. They now scale off height at their true ratio and
         let the surplus width clip against the frame. -->
    <img
      v-if="leftDecorationUrl"
      :src="leftDecorationUrl"
      alt="Left decoration"
      class="absolute top-0 bottom-0 left-0 w-auto h-full max-w-none pointer-events-none"
      :class="decorationAnimationClasses.left"
      :style="{ zIndex: decorationZIndexes.left }"
      loading="eager"
      v-bind="protectionAttrs"
    />
    <img
      v-if="rightDecorationUrl"
      :src="rightDecorationUrl"
      alt="Right decoration"
      class="absolute top-0 bottom-0 right-0 w-auto h-full max-w-none pointer-events-none"
      :class="decorationAnimationClasses.right"
      :style="{ zIndex: decorationZIndexes.right }"
      loading="eager"
      v-bind="protectionAttrs"
    />
    <img
      v-if="topDecorationUrl"
      :src="topDecorationUrl"
      alt="Top decoration"
      class="absolute top-0 left-0 right-0 w-full h-auto pointer-events-none"
      :class="decorationAnimationClasses.top"
      :style="{ zIndex: decorationZIndexes.top }"
      loading="eager"
      v-bind="protectionAttrs"
    />
    <img
      v-if="bottomDecorationUrl"
      :src="bottomDecorationUrl"
      alt="Bottom decoration"
      class="absolute bottom-0 left-0 right-0 w-full h-auto pointer-events-none"
      :class="decorationAnimationClasses.bottom"
      :style="{ zIndex: decorationZIndexes.bottom }"
      loading="eager"
      v-bind="protectionAttrs"
    />

    <!-- Content Loading Overlay -->
    <Transition name="fade">
      <div v-if="contentLoading" class="absolute inset-0 z-40 flex items-center justify-center">
        <div
          class="backdrop-blur-sm bg-black bg-opacity-20 rounded-2xl px-6 py-4 flex items-center space-x-3"
          :style="contentLoadingStyle"
        >
          <div
            class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-80"
            :style="{ color: primaryColor }"
          ></div>
          <span
            class="text-white font-medium text-sm"
            :style="{ fontFamily: primaryFont || currentFont }"
          >
            Updating content...
          </span>
        </div>
      </div>
    </Transition>

    <!-- Floating Action Menu -->
    <FloatingActionMenu
      class="z-30"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :background-color="backgroundColor"
      :current-language="currentLanguage"
      :available-languages="availableLanguages"
      :is-music-playing="isMusicPlaying"
      :has-location="!!event.google_map_embed_link"
      :has-video="!!event.youtube_embed_link"
      :has-gallery="eventPhotos.length > 0"
      :has-payment="paymentMethods.length > 0"
      :has-rsvp="event.rsvp_enabled !== false"
      :has-comments="event.comments_enabled !== false"
      :event-type="eventType"
      @language-change="handleLanguageChange"
      @music-toggle="handleMusicToggle"
      @rsvp="handleRSVP"
      @reminder="handleReminder"
      @gift="handleGift"
      @agenda="handleAgenda"
      @location="handleLocation"
      @video="handleVideo"
      @gallery="handleGallery"
      @comment="handleComment"
    />

    <!-- Liquid Glass Floating Box Container -->
    <div class="absolute inset-0 overflow-hidden z-20">
      <div class="absolute inset-0 overflow-y-auto custom-scrollbar z-20">
        <div :class="containerClasses">
          <!-- Liquid Glass Card -->
          <div class="liquid-glass-card" :class="[cardAnimationClass, cardWidthClass]">
            <!-- Glass Background Effects -->
            <div v-if="showLiquidGlass" class="glass-background"></div>

            <!-- Content Container with Scroll.
                 `overscroll-contain` matters here: this scroller is nested
                 inside another overflow-y-auto (the card centering wrapper),
                 which is itself scrollable by the container's vertical padding.
                 Without it, reaching the end of the invitation chains scroll to
                 the outer container and the whole glass card slides — a visible
                 break in the middle of the primary gesture. -->
            <div
              class="stage-scroll relative z-10 h-full overflow-y-auto overscroll-contain custom-scrollbar"
            >
              <div :class="contentPaddingClasses">
                <!-- Host Information (now includes welcome header) -->
                <div ref="hostInfoRef" class="animate-reveal">
                  <HostInfo
                    :hosts="hosts"
                    :logo-url="logoUrl"
                    :event-initial="event.title?.charAt(0) || 'E'"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor"
                    :accent-color="accentColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                    :welcome-message="getWelcomeMessage()"
                    :instruction-text="getInstructionText()"
                    :current-language="currentLanguage"
                    :event-type="eventType"
                    :show-welcome-header-text="showWelcomeHeaderText"
                    :show-host-name-under-logo="showHostNameUnderLogo"
                    :sample-logo-one="templateAssets?.sample_logo_1"
                    :sample-logo-two="templateAssets?.sample_logo_2"
                    :first-host-image="firstHostImage"
                    :first-host-name="firstHostName"
                    :first-host-id="firstHostId"
                    :host-clip-style="hostClipStyle"
                    :design-type="hostInfoDesign?.type"
                    :frame-style="hostInfoDesign?.frame_style"
                    :couple-ornament="hostInfoDesign?.couple_ornament"
                  />
                </div>

                <!-- Event Information with Integrated RSVP -->
                <div
                  ref="eventInfoRef"
                  :class="[
                    eventType === 'Birthday'
                      ? 'mt-3 sm:mt-4 laptop-sm:mt-4 laptop-md:mt-5 laptop-lg:mt-6 desktop:mt-5'
                      : 'mt-6 sm:mt-8 laptop-sm:mt-8 laptop-md:mt-10 laptop-lg:mt-12 desktop:mt-10',
                    // Engraved drops the bow-tie below (see the divider's
                    // v-if): the sheet closes itself with its own bottom rule,
                    // so the bow-tie would be that boundary drawn twice — the
                    // doubled line joins-date-mark already removes at the top
                    // seam. The divider's air moves here so the gap to the next
                    // section survives its removal.
                    infoCardDesign?.type === 'engraved'
                      ? 'mb-12 sm:mb-14 laptop-sm:mb-14 laptop-md:mb-16 laptop-lg:mb-20 desktop:mb-16'
                      : 'mb-6 sm:mb-8 laptop-sm:mb-8 laptop-md:mb-10 laptop-lg:mb-12 desktop:mb-10',
                    'animate-reveal',
                  ]"
                >
                  <EventInfo
                    :description-title="getDescriptionTitle()"
                    :description-text="getDescriptionText()"
                    :date-text="getDateText()"
                    :time-text="getTimeText()"
                    :location-text="getLocationText()"
                    :has-google-map="!!event.google_map_embed_link"
                    :google-map-embed-link="event.google_map_embed_link"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor || undefined"
                    :accent-color="accentColor"
                    :background-color="backgroundColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                    :current-language="currentLanguage"
                    :show-rsvp="event.rsvp_enabled !== false"
                    :show-countdown="event.countdown_enabled !== false"
                    :event-start-date="event.start_date"
                    :info-card-design="infoCardDesign?.type"
                    :details-design="eventDetailsDesign?.type"
                    :details-marker-color-source="eventDetailsDesign?.marker_color_source"
                    :details-marker-custom-color="eventDetailsDesign?.marker_custom_color"
                    @open-map="$emit('openMap')"
                  >
                    <template #rsvp>
                      <div id="rsvp-section" ref="rsvpSectionRef">
                        <!-- Private events: guest-shortcode based questionnaire -->
                        <GuestRSVPSection
                          v-if="event.privacy === 'private'"
                          :event-id="event.id"
                          :guest-shortcode="guestShortcode"
                          :guest-name="guestName"
                          :event-start-date="event.start_date"
                          :event-end-date="event.end_date"
                          :primary-color="primaryColor"
                          :secondary-color="secondaryColor"
                          :accent-color="accentColor"
                          :background-color="backgroundColor"
                          :event-texts="eventTexts"
                          :current-language="currentLanguage"
                          :event-type="eventType"
                          :current-font="currentFont"
                          :primary-font="primaryFont"
                          :secondary-font="secondaryFont"
                        />
                        <!-- Public events: JWT / account-based RSVP -->
                        <RSVPSection
                          v-else
                          :event-id="event.id"
                          :event-start-date="event.start_date"
                          :event-end-date="event.end_date"
                          :primary-color="primaryColor"
                          :secondary-color="secondaryColor"
                          @show-auth-modal="$emit('showAuthModal')"
                          :accent-color="accentColor"
                          :background-color="backgroundColor"
                          :is-event-past="isEventPast"
                          :event-texts="eventTexts"
                          :current-language="currentLanguage"
                          :event-type="eventType"
                          :current-font="currentFont"
                          :primary-font="primaryFont"
                          :secondary-font="secondaryFont"
                        />
                      </div>
                    </template>
                  </EventInfo>

                  <!-- Event Info + RSVP Section Divider. Engraved has none:
                       the sheet's own bottom rule is already this boundary,
                       and a bow-tie under a hairline sheet is the material
                       clash the engraved set exists to avoid. -->
                  <WeddingSectionDivider
                    v-if="infoCardDesign?.type !== 'engraved'"
                    :primary-color="primaryColor"
                  />
                </div>

                <!-- Dress Code Section. Also rendered when empty inside any
                     preview frame: in the editable manage-page one so the first
                     dress code can be added from there, and in the partner
                     catalogue's so a design is judged on every section it
                     draws. Neither context is provided on the public showcase,
                     where a guest must not see an empty section. -->
                <div
                  v-if="dressCodes.length > 0 || editIntentCtx || previewFrameCtx"
                  id="dress-code-section"
                  ref="dressCodeSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <DressCodeSection
                    :dress-codes="dressCodes"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor"
                    :accent-color="accentColor"
                    :background-color="backgroundColor"
                    :event-texts="eventTexts"
                    :current-language="currentLanguage"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                    :get-media-url="getMediaUrl"
                  />

                  <!-- Dress Code Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <!-- Agenda Section (also rendered when empty inside the
                     editable manage-page preview, so the first agenda item
                     can be added from there — editIntentCtx is never provided
                     on the public showcase) -->
                <div
                  v-if="agendaItems.length > 0 || editIntentCtx"
                  id="agenda-section"
                  ref="agendaSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <AgendaSection
                    :agenda-items="agendaItems"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor"
                    :accent-color="accentColor"
                    :background-color="backgroundColor"
                    :event-texts="eventTexts"
                    :current-language="currentLanguage"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                    :event-type="eventType"
                  />

                  <!-- Agenda Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <!-- Host Message Section (Thank You / Sorry Message) -->
                <div
                  v-if="showHostMessage"
                  id="host-message-section"
                  ref="hostMessageSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <HostMessageSection
                    :event-texts="eventTexts"
                    :current-language="currentLanguage"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor"
                    :accent-color="accentColor"
                    :background-color="backgroundColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                  />

                  <!-- Host Message Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <!-- YouTube Video Section (also rendered when empty inside
                     the editable manage-page preview, so a video link can be
                     added from there — editIntentCtx is never provided on
                     the public showcase) -->
                <div
                  v-if="event.youtube_embed_link || editIntentCtx"
                  id="video-section"
                  ref="videoSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <EditableRegion
                    v-if="event.youtube_embed_link"
                    :intent="{ kind: 'youtubeEmbed' }"
                  >
                    <YouTubeVideoSection
                      :youtube-embed-link="event.youtube_embed_link"
                      :primary-color="primaryColor"
                      :secondary-color="secondaryColor || undefined"
                      :accent-color="accentColor"
                      :current-font="currentFont"
                      :primary-font="primaryFont"
                      :secondary-font="secondaryFont"
                      :event-texts="eventTexts"
                      :current-language="currentLanguage"
                      :is-music-playing="isMusicPlaying"
                      @video-state-change="handleVideoStateChange"
                    />
                  </EditableRegion>
                  <div v-else-if="editIntentCtx" class="add-video-row">
                    <button
                      type="button"
                      class="edit-region-control add-video-btn"
                      @click.stop.prevent="editIntentCtx.requestEdit({ kind: 'youtubeEmbed' })"
                    >
                      ＋ {{ tApp('management.showcasePreview.editors.addVideo') }}
                    </button>
                  </div>

                  <!-- Video Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <!-- Photo Gallery Section -->
                <div
                  v-if="eventPhotos.length > 0"
                  id="gallery-section"
                  ref="gallerySectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <EditableRegion :intent="{ kind: 'photos' }">
                    <PhotoGallery
                      :photos="eventPhotos"
                      :primary-color="primaryColor"
                      :secondary-color="secondaryColor"
                      :accent-color="accentColor"
                      :get-media-url="getMediaUrl"
                      :current-font="currentFont"
                      :primary-font="primaryFont"
                      :secondary-font="secondaryFont"
                      :event-texts="eventTexts"
                      :current-language="currentLanguage"
                      @open-photo="$emit('openPhoto', $event)"
                    />
                  </EditableRegion>

                  <!-- Gallery Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <!-- Payment Section. Empty-but-rendered in a preview frame for
                     the same two reasons as the dress code above: somewhere to
                     add the first method from, and a section a partner has to
                     be able to see their design render. -->
                <div
                  v-if="paymentMethods.length > 0 || editIntentCtx || previewFrameCtx"
                  id="payment-section"
                  ref="paymentSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <PaymentSection
                    ref="paymentComponentRef"
                    :payment-methods="paymentMethods"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor || undefined"
                    :accent-color="accentColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont || currentFont"
                    :secondary-font="secondaryFont || currentFont"
                    :get-media-url="getMediaUrl"
                    :event-category="event.category"
                    :event-category-name="event.category_name || undefined"
                    :event-category-details="event.category_details"
                    :event-texts="eventTexts"
                    :current-language="currentLanguage"
                    :payment-locked="event.payment_lock"
                  />

                  <!-- Payment Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <!-- Comment Section (also rendered when disabled inside the
                     editable manage-page preview, so the toggle stays
                     reachable and the organizer can still preview the
                     content — editIntentCtx is never provided on the public
                     showcase) -->
                <div
                  v-if="event.comments_enabled !== false || editIntentCtx"
                  id="comment-section"
                  ref="commentSectionRef"
                  class="mb-10 sm:mb-12 laptop-sm:mb-12 laptop-md:mb-14 laptop-lg:mb-16 desktop:mb-14 animate-reveal comment-section-toggle-container"
                  :class="{ 'has-display-toggle': editIntentCtx }"
                >
                  <SectionDisplayToggle
                    field="comments_enabled"
                    :active="event.comments_enabled !== false"
                    :label="tApp('management.showcasePreview.editors.commentsLabel')"
                  />
                  <CommentSection
                    :event-id="event.id"
                    :event-privacy="event.privacy"
                    :guest-name="guestName as string"
                    :guest-shortcode="guestShortcode"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor"
                    :accent-color="accentColor"
                    :background-color="backgroundColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                    :event-texts="eventTexts"
                    :current-language="currentLanguage"
                    :event-type="eventType"
                    @comment-submitted="(comment: any) => handleCommentSubmitted(comment)"
                  />

                  <!-- Comment Section Divider: the invitation's closing mark. Every
                       other boundary in this card carries one, and the comments were
                       the only section that ended into nothing - so the footer's
                       blank page below read as content that had failed to load
                       rather than as the end of the invitation. -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <!-- Registration Button -->
                <div v-if="event.registration_required && !isEventPast" class="mb-6">
                  <button
                    @click="$emit('register')"
                    class="w-full py-3 rounded-xl font-semibold text-white transform hover:scale-[1.02] transition-all shadow-lg"
                    :style="{
                      background: primaryColor,
                    }"
                  >
                    Register Now
                  </button>
                </div>

                <!-- Footer Section - its own page, so that at the bottom of the
                     scroll the mark is alone and centred. Two things make that true.

                     The height is the card's own 85dvh less 2rem. The block's bottom
                     edge is pinned by the content container's bottom padding rather
                     than by the scrollport, so subtracting a little over one padding
                     is what lands the lockup on the scrollport's centre line - a hair
                     above it across the padding breakpoints, which is where a logo
                     wants to sit. It must also stay SHORTER than the scrollport: at a
                     flat 85dvh (plus mt-8, plus the container's padding) it was taller
                     than the box it sits in, and a page taller than its own page has
                     no scroll position at which it is the only thing on screen.

                     The other is the snap below. Height alone cannot stop a reader
                     resting halfway up this block's blank upper half with the tail of
                     the comments still hanging at the top of the frame - that is what
                     made the ending read as broken. `scroll-snap-align: center` is
                     what turns the block from space you wade through into a page you
                     land on. -->
                <div
                  class="footer-page min-h-[calc(85dvh-2rem)] flex flex-col items-center justify-center"
                  :class="footerMarginClasses"
                >
                  <!-- Footer Card with Conditional Styling -->
                  <div
                    class="footer-card-container relative w-full overflow-hidden rounded-none px-6 py-6 text-center transition-all duration-300"
                    :class="{ 'backdrop-blur-16': showLiquidGlass }"
                    :style="
                      showLiquidGlass
                        ? {
                            background: `${backgroundColor || primaryColor}90`,
                            boxShadow: `
                        0 12px 36px -6px ${backgroundColor || primaryColor}25,
                        0 6px 24px -3px ${backgroundColor || primaryColor}20,
                        0 3px 12px -1px ${backgroundColor || primaryColor}15,
                        inset 0 1px 2px rgba(255, 255, 255, 0.2)
                      `,
                          }
                        : {
                            background: 'none',
                          }
                    "
                  >
                    <!-- Top Highlight Line - only show when liquid glass is enabled -->
                    <div
                      v-if="showLiquidGlass"
                      class="absolute top-0 left-0 right-0 h-px"
                      :style="{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
                      }"
                    ></div>

                    <!-- One centred group: the marks, the social row and the address
                         read as a single object rather than three stacked bands. Every
                         gap is vh-clamped so a short phone tightens the whole lockup
                         together instead of one band collapsing before the others. -->
                    <div
                      ref="footerLockupRef"
                      class="footer-lockup flex flex-col items-center justify-center gap-[clamp(14px,2.6vh,22px)]"
                    >
                      <!-- The marks: partner above the collaboration sign above ours.
                           Every row is --fm-w wide — the social row's own width — so the
                           lockup has one measure and one centre line top to bottom.
                           Gaps here are tighter than the group's, so the rows bind into
                           one lockup instead of reading as three. -->
                      <div class="flex flex-col items-center gap-[clamp(5px,1vh,10px)]">
                        <!-- Partner mark: the box is ours, the ratio is theirs -->
                        <div v-if="hasPartnerLogo" class="footer-mark partner-mark">
                          <img
                            :src="getMediaUrl(event.referrer_details!.logo!)"
                            :alt="event.referrer_details!.first_name || 'Partner'"
                            :class="showLiquidGlass ? 'brightness-110' : ''"
                            :style="{
                              filter: showLiquidGlass
                                ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
                                : `drop-shadow(0 2px 8px ${primaryColor}40)`,
                            }"
                          />
                        </div>

                        <!-- ...or the slot that mark will fill. A shop reading a
                             preview is being sold this exact spot, so it has to be on
                             screen before they have uploaded anything - but a guest
                             opening a real invitation must never meet a placeholder,
                             so the empty state is preview-only. -->
                        <div v-else-if="showPartnerLogoSlot" class="partner-mark">
                          <svg
                            class="partner-slot-mark"
                            viewBox="0 0 200 44"
                            :style="{ fill: showLiquidGlass ? '#ffffff' : primaryColor }"
                          >
                            <text
                              x="100"
                              y="33"
                              text-anchor="middle"
                              font-size="42"
                              lengthAdjust="spacing"
                              :textLength="appLocale === 'kh' ? undefined : 200"
                              :style="{ fontFamily: secondaryFont || currentFont }"
                            >
                              {{ tApp('management.showcasePreview.editors.partnerLogoSlot') }}
                            </text>
                          </svg>
                        </div>

                        <!-- The mark that joins the two. Drawn, not typed: the font
                             here is template-driven, and a display or Khmer face
                             renders a glyph at an unpredictable size and baseline
                             offset, so it would sit off-centre in its row under some
                             templates and not others. Geometry centres on itself. -->
                        <div
                          v-if="showPartnerRow"
                          class="collab-ornament"
                          :style="{ color: showLiquidGlass ? '#ffffff' : primaryColor }"
                          aria-hidden="true"
                        >
                          <span class="collab-rule collab-rule--left"></span>
                          <span class="collab-gem"></span>
                          <span class="collab-rule collab-rule--right"></span>
                        </div>

                        <!-- GoEvent mark -->
                        <a
                          href="/"
                          class="footer-mark inline-flex max-w-full items-center justify-center"
                        >
                          <svg
                            viewBox="0 0 222.09 69.13"
                            class="goevent-mark"
                            :style="{
                              fill: showLiquidGlass ? '#ffffff' : primaryColor,
                              filter: showLiquidGlass
                                ? 'drop-shadow(0 2px 8px rgba(255,255,255,0.25))'
                                : `drop-shadow(0 2px 8px ${primaryColor}40)`,
                            }"
                          >
                            <g>
                              <g>
                                <path
                                  d="m22.12,44.61l-1.97,5.42c.1.01,8.13.02,16.93.03v.02c-2.32,5.37-8.06,8.94-14.44,7.93-6.32-1-11.27-6.28-11.78-12.66-.68-8.24,5.84-15.16,13.94-15.16h22.63c3.37,0,6.39-2.08,7.58-5.23l2.1-5.56H24.8C10.68,19.4-.73,31.26.04,45.55c.63,11.63,9.48,21.38,20.99,23.14,13.09,2,24.65-6.62,27.31-18.55h0s.02-.07.02-.07c2.2,0,4.23,0,5.95,0,3.36,0,6.38-2.09,7.57-5.24l2.11-5.56H29.73c-3.41,0-6.45,2.14-7.61,5.34Z"
                                />
                                <path
                                  d="m54.3,10.8c3.37,0,6.39-2.08,7.58-5.24l2.11-5.57H29.74c-3.41,0-6.45,2.13-7.62,5.34l-1.97,5.43c.19.03.39.04.58.04h33.58Z"
                                />
                              </g>
                              <path
                                d="m126.05,42.59c-1.44-1.1-3.4-1.8-5.87-2.13-1.06-.15-2.22-.21-3.47-.21-4.17,0-7.29.77-9.35,2.34-2.06,1.55-3.1,3.74-3.1,6.53v1.02c0,1.66,1.34,3,3,3h5.33s0,0,0,0h1.56c.85,0,1.61-.53,1.9-1.33h0s.4-1.11.4-1.11l.84-2.33h-4.67c.1-.76.43-1.36.97-1.83.68-.57,1.72-.86,3.1-.86.56,0,1.07.05,1.52.14.65.14,1.18.38,1.58.72.67.57,1.01,1.37,1.01,2.4v1.19c0,1.66,1.34,3,3,3h5.33v-4.03c0-2.79-1.04-4.98-3.11-6.53Zm-13.45,6.95h0s0-.59,0-.59c0-.01,0-.02,0-.03v.62Z"
                              />
                              <path
                                d="m125.46,56.22h-4.65v4.2c0,1.02-.33,1.82-1.01,2.39-.67.58-1.71.86-3.09.86s-2.42-.28-3.1-.86c-.68-.57-1.01-1.37-1.01-2.39v-.51c0-2.05-1.66-3.7-3.7-3.7h-4.64v4.03c0,2.8,1.04,4.98,3.1,6.54,2.06,1.55,5.18,2.34,9.35,2.34s7.28-.78,9.35-2.34c2.06-1.56,3.1-3.74,3.1-6.54v-.33c0-2.05-1.66-3.7-3.7-3.7Z"
                              />
                              <path
                                d="m154.22,60.63v8.49h4.7c2.43,0,4.41-1.97,4.41-4.41v-8.49h-4.7c-2.43,0-4.41,1.97-4.41,4.41Z"
                              />
                              <path
                                d="m159.37,5.6h-2.79v5.09h-.25c-.7-.94-1.6-1.8-2.7-2.58-1.1-.76-2.38-1.38-3.82-1.83-1.44-.45-3.06-.68-4.84-.68-3.03,0-5.36.71-7.02,2.1-1.65,1.4-2.48,3.2-2.48,5.41,0,2.05.72,3.58,2.17,4.59,1.45,1.01,3.58,1.51,6.39,1.51h20v-8.95c0-2.58-2.09-4.66-4.66-4.66Zm-12.73,9.65c-.83,0-1.44-.15-1.83-.44-.39-.3-.6-.7-.6-1.22,0-.56.22-.98.65-1.3.43-.32,1.18-.48,2.21-.48s2.05.17,3.16.5c1.13.34,2.17.77,3.17,1.27,1,.52,1.76,1.06,2.3,1.66h-9.07Z"
                              />
                              <path
                                d="m187.1,19.21v-1.84c0-1.85-.57-3.67-1.67-5.16,0,0-.02-.02-.02-.03-.78-1.07-1.76-2.10-2.93-3.11-1.18-1.01-2.5-1.84-3.96-2.48-1.47-.65-3.07-.98-4.80-.98-2.55,0-4.45.73-5.69,2.19-1.24,1.46-1.87,3.25-1.87,5.39,0,2.01.53,3.52,1.59,4.53,1.05,1.01,2.63,1.51,4.69,1.51h14.66Zm-13.51-7.07c.32-.34.76-.5,1.3-.5.51,0,1.06.1,1.66.29.6.2,1.18.47,1.76.81.58.33,1.12.72,1.63,1.15.51.43.93.87,1.27,1.30h-6.48c-.52,0-.91-.15-1.2-.48-.29-.31-.43-.72-.43-1.24,0-.55.16-.99.48-1.33Z"
                              />
                              <path
                                d="m196.47,39.93c1.63,1,3.61,1.84,5.91,2.51,2.31.67,4.9,1.22,7.78,1.65v2.13c0,.94-.34,1.68-1.01,2.21-.63.51-1.43.76-2.4.8h-5.18c0-.29-.04-.58-.1-.85-.1-.54-.31-1.04-.58-1.5h0c-.22-.39-.48-.72-.78-1.02-.16-.17-.35-.33-.54-.48-.19-.15-.39-.27-.61-.39-.14-.07-.3-.14-.44-.21-.15-.06-.31-.12-.47-.17-.47-.14-.97-.23-1.49-.23h-4.45v7.42c0,2.11,1.71,3.83,3.83,3.83h5.64s4.21,0,4.21,0c0,0,0,0,0,0h8.49c1.2-.37,2.23-.93,3.09-1.66,1.39-1.18,2.25-2.75,2.54-4.70.09-.53.13-1.10.13-1.68v-8.58c-3.71-.39-6.96-.86-9.76-1.39-2.8-.53-4.99-1.32-6.56-2.37-1.58-1.05-2.37-2.49-2.37-4.35,0-1.5.46-2.66,1.38-3.49.93-.83,2.16-1.25,3.7-1.25,1.3,0,2.31.24,3.04.72.27.18.51.38.68.6.28.35.42.77.42,1.22s-.16.86-.48,1.16c-.07.06-.14.12-.21.17-.65.43-1.07,1.13-1.34,1.87l-1.11,3.06v.02s.02,0,.02,0c.43.15,1.05.29,1.84.41.81.11,1.63.18,2.45.18,1.55,0,2.89-.2,4.05-.59.87-.29,1.63-.68,2.28-1.19,1.55-1.18,2.31-2.98,2.31-5.38,0-3-1.23-5.29-3.7-6.86-1.08-.69-2.34-1.23-3.8-1.62-1.88-.5-4.07-.75-6.59-.75-4.45,0-8.05.93-10.79,2.78-2.74,1.85-4.11,4.75-4.11,8.70,0,2.13.43,3.95,1.30,5.47.87,1.52,2.12,2.78,3.76,3.79Z"
                              />
                              <path
                                d="m113.67,29.22c3.05,0,5.1,1.55,5.1,3.86,0,2,1.38,3.79,3.34,4.18,2.42.48,4.41,1.33,6.04,2.56.23.17.45.35.66.54v-7.28c0-7.92-6.51-13.9-15.14-13.9h-8.3c-7.68,0-13.9,6.23-13.9,13.9v19.07c0,1.57-1.28,2.85-2.85,2.85h-5.49c-1.57,0-2.85-1.28-2.85-2.85v-27.83c0-2.77-2.25-5.02-5.02-5.02h-5.02v32.85c0,7.12,5.77,12.89,12.89,12.89h5.49c5.63,0,10.43-3.63,12.18-8.67.46-1.32.71-2.74.71-4.22v-19.08c0-2.13,1.73-3.86,3.86-3.86h8.3Z"
                              />
                              <path
                                d="m145.57,27.42c0-2.77-2.25-5.02-5.02-5.02h-5.03v42.39c.78.18,1.64.27,2.6.27,2.8,0,4.74-.36,5.82-1.09,1.09-.73,1.63-1.7,1.63-2.93v-15.29h2.96c1.33,0,2.51-.83,2.96-2.08l2.47-6.81h-8.4s0-5.26,0-9.44Z"
                              />
                              <path
                                d="m159.01,22.4h-5.04v14.45h0v6.15h0v9.88c.78.18,1.64.27,2.6.27,2.92,0,4.89-.38,5.92-1.15,1.02-.77,1.54-1.72,1.54-2.87v-19.92s0-.76,0-1.78c0-2.77-2.25-5.02-5.02-5.02Z"
                              />
                              <path
                                d="m185.09,41.1c0-1.38-.45-2.51-1.36-3.4-.91-.89-2.31-1.57-4.20-2.04v-1.69c0-.71.32-1.06.95-1.06h.36l2.49.59h.53c1.02,0,1.82-.27,2.4-.8.57-.53.86-1.33.86-2.4v-2.88c0-2.77-2.25-5.02-5.02-5.02h-3.5v3.11h-3.85c-2.25,0-3.37,1.32-3.37,3.96v7.9c.75.16,1.4.38,1.95.68.55.3.98.67,1.27,1.13.30.45.45,1.01.45,1.69v5.24c-2.86,0-5.17,2.36-5.09,5.25.08,2.79,2.51,4.93,5.30,4.93h3.42c4.28-.14,6.42-1.47,6.42-4.02v-11.16Z"
                              />
                              <path
                                d="m173.05,63.68h1.92c.5,0,.94-.31,1.12-.77l.28-.74h-3.39c-2.11,0-3.79,1.89-3.43,4.07.23,1.4,1.33,2.54,2.72,2.83,2.18.44,4.1-1.22,4.1-3.32v-.78h-2.79c-.5,0-.94.31-1.12.77l-.27.71s.01.02.02.04h2.49c-.29.67-.95,1.14-1.73,1.14-1.13,0-2.04-.95-1.96-2.10.07-1.04.98-1.83,2.03-1.83Z"
                              />
                              <path
                                d="m184.78,65.76c.07.36.41.61.77.61h2.81c.47,0,.9-.3,1.06-.74l.28-.78h-4.18c-.47,0-.84.42-.74.91Z"
                              />
                              <path
                                d="m190.4,62.94l.28-.78h-5.15c-.47,0-.84.42-.74.91.07.36.41.61.77.61h3.78c.47,0,.9-.3,1.06-.74Z"
                              />
                              <path
                                d="m185.53,67.61c-.47,0-.84.43-.74.91.07.36.41.61.77.61h4.27c.47,0,.89-.29,1.06-.73l.28-.76s-.01-.02-.02-.03h-5.62Z"
                              />
                              <path
                                d="m180.57,62.16c-.06,0-.14,0-.20,0-1.10.06-2.08.64-2.67,1.51-.39.56-.61,1.23-.61,1.96,0,1.92,1.56,3.48,3.48,3.48s3.49-1.56,3.49-3.48-1.56-3.49-3.49-3.49Zm0,5.45c-1.08,0-1.96-.89-1.96-1.96s.88-1.96,1.96-1.96,1.97.88,1.97,1.96-.89,1.96-1.97,1.96Z"
                              />
                              <path
                                d="m200.53,65.76c.07.36.41.61.77.61h2.81c.47,0,.9-.3,1.06-.74l.28-.78h-4.18c-.47,0-.84.42-.74.91Z"
                              />
                              <path
                                d="m206.14,62.94l.28-.78h-5.15c-.47,0-.84.42-.74.91.07.36.41.61.77.61h3.78c.47,0,.9-.3,1.06-.74Z"
                              />
                              <path
                                d="m201.27,67.61c-.47,0-.84.43-.74.91.07.36.41.61.77.61h4.27c.47,0,.89-.29,1.06-.73l.28-.76s-.01-.02-.02-.03h-5.62Z"
                              />
                              <path
                                d="m198.58,62.15c-.45,0-.85.25-1.05.65l-1.3,2.6-.64,1.27-1.93-3.87c-.2-.4-.61-.65-1.05-.65h-.97v.02s.56,1.10.56,1.10l2.72,5.43c.13.26.39.42.68.42,0,0,0,0,0,0,.03,0,.06,0,.08,0,.26-.03.48-.19.6-.42l3.22-6.44s-.03-.05-.06-.09h-.86Z"
                              />
                              <path
                                d="m222.06,62.16h-5.03c-.49,0-.93.31-1.10.77l-.27.75s0,0,0,0h2.47v4.66c0,.37.25.70.61.77.48.09.91-.28.91-.74v-4.69h.95c.57,0,1.08-.36,1.28-.90l.21-.57s-.02-.03-.04-.05Z"
                              />
                              <path
                                d="m213.45,63.43c0,1.29,0,3.11,0,3.11l-1.99-1.99h0s-2.15-2.15-2.15-2.15c-.15-.15-.34-.23-.54-.23-.11,0-.22.02-.33.07-.28.13-.44.43-.44.74v6.14s0,0,0,0h.24c.71,0,1.28-.57,1.28-1.28v-3.10l2.13,2.13,2.02,2.02c.15.14.34.22.53.22.14,0,.27-.04.40-.11.24-.14.37-.41.37-.69v-6.17h-.24c-.71,0-1.28.57-1.28,1.28Z"
                              />
                            </g>
                          </svg>
                        </a>
                      </div>

                      <!-- Social Media Buttons -->
                      <div class="social-row flex flex-wrap items-center justify-center">
                        <a
                          href="https://t.me/goeventkh"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="social-btn flex items-center justify-center rounded-full"
                          :class="
                            showLiquidGlass ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : ''
                          "
                          :style="showLiquidGlass ? {} : { backgroundColor: `${primaryColor}20` }"
                          aria-label="Telegram"
                        >
                          <svg
                            :class="showLiquidGlass ? 'text-white' : ''"
                            :style="{ fill: showLiquidGlass ? undefined : primaryColor }"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
                            />
                          </svg>
                        </a>
                        <a
                          href="https://www.facebook.com/profile.php?id=61581851850221"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="social-btn flex items-center justify-center rounded-full"
                          :class="
                            showLiquidGlass ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : ''
                          "
                          :style="showLiquidGlass ? {} : { backgroundColor: `${primaryColor}20` }"
                          aria-label="Facebook"
                        >
                          <svg
                            :class="showLiquidGlass ? 'text-white' : ''"
                            :style="{ fill: showLiquidGlass ? undefined : primaryColor }"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                            />
                          </svg>
                        </a>
                        <a
                          href="https://www.instagram.com/goevent.online/"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="social-btn flex items-center justify-center rounded-full"
                          :class="
                            showLiquidGlass ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : ''
                          "
                          :style="showLiquidGlass ? {} : { backgroundColor: `${primaryColor}20` }"
                          aria-label="Instagram"
                        >
                          <svg
                            :class="showLiquidGlass ? 'text-white' : ''"
                            :style="{ fill: showLiquidGlass ? undefined : primaryColor }"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                            />
                          </svg>
                        </a>
                        <a
                          href="https://www.tiktok.com/@goevent.online"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="social-btn flex items-center justify-center rounded-full"
                          :class="
                            showLiquidGlass ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : ''
                          "
                          :style="showLiquidGlass ? {} : { backgroundColor: `${primaryColor}20` }"
                          aria-label="TikTok"
                        >
                          <svg
                            :class="showLiquidGlass ? 'text-white' : ''"
                            :style="{ fill: showLiquidGlass ? undefined : primaryColor }"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                            />
                          </svg>
                        </a>
                      </div>

                      <!-- Address -->
                      <div
                        class="footer-address inline-flex items-center justify-center px-2 leading-none opacity-90"
                        :class="showLiquidGlass ? 'text-white' : ''"
                        :style="{
                          fontFamily: secondaryFont || currentFont,
                          fontSize: 'clamp(12px, 1.9vh, 16px)',
                          color: showLiquidGlass ? undefined : primaryColor,
                        }"
                      >
                        www.goevent.online
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick, inject } from 'vue'
import type {
  EventData,
  EventText,
  Host,
  AgendaItem,
  EventPhoto,
} from '../../composables/useEventShowcase'
import type { EventComment, DressCode } from '../../types/showcase'
import type { EventPaymentMethod } from '../../services/api'
import type {} from '../../utils/translations'
import { showcaseRevealObserverInit } from '@/composables/showcase/useScrollProgress'
import { useOptimizedDecorations } from '../../composables/showcase/useOptimizedDecorations'
import { useAssetProtection } from '../../composables/showcase/useAssetProtection'
import { useCoverStageLayout } from '../../composables/showcase/useCoverStageLayout'
import type {
  CoverStageLayout,
  EventDetailsDesignConfig,
  HostInfoDesignConfig,
  InfoCardDesignConfig,
} from '../../services/api/types/template.types'

// Asset protection (production-only)
const { protectionAttrs } = useAssetProtection()

// Component imports
import HostInfo from './HostInfo.vue'
import EventInfo from './EventInfo.vue'
import RSVPSection from './RSVPSection.vue'
import GuestRSVPSection from './GuestRSVPSection.vue'
import AgendaSection from './AgendaSection.vue'
import HostMessageSection from './HostMessageSection.vue'
import DressCodeSection from './DressCodeSection.vue'
import YouTubeVideoSection from './YouTubeVideoSection.vue'
import PhotoGallery from './PhotoGallery.vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import SectionDisplayToggle from '@/components/showcase-preview/edit/SectionDisplayToggle.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { PreviewFrameKey } from '@/components/showcase-preview/previewContext'
import { useAppLanguage } from '@/composables/useAppLanguage'
import CommentSection from './CommentSection.vue'
import PaymentSection from './PaymentSection.vue'
import FloatingActionMenu from './FloatingActionMenu.vue'
import WeddingSectionDivider from './WeddingSectionDivider.vue'

// Types
interface TemplateAssets {
  standard_background_video?: string
  display_liquid_glass_background?: boolean
  /** Base sample logo forwarded to host-layout variants that render the cover-stage sample-logo overlay. */
  sample_logo_1?: string | null
  /** Overlay sample logo — its opaque shape clips the first host image. */
  sample_logo_2?: string | null
}

interface VideoResourceManager {
  cleanup: () => void
  stats: () => { managedVideos: number; totalListeners: number }
}

type SectionRef = { value?: HTMLElement }

interface Props {
  templateAssets?: TemplateAssets | null
  event: EventData
  eventTexts: EventText[]
  hosts: Host[]
  agendaItems: AgendaItem[]
  eventPhotos: EventPhoto[]
  paymentMethods: EventPaymentMethod[]
  dressCodes: DressCode[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  templateColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  isEventPast: boolean
  getMediaUrl: (url: string) => string
  availableLanguages?: Array<{ id: number; language: string; language_display: string }>
  currentLanguage?: string
  guestName?: string
  /** Guest shortcode from `?g=...` — credential for commenting on private events. */
  guestShortcode?: string | null
  isMusicPlaying?: boolean
  contentLoading?: boolean
  topDecoration?: string | null
  bottomDecoration?: string | null
  leftDecoration?: string | null
  rightDecoration?: string | null
  /** Showcase animation type from template_assets.showcase_animation_type */
  animationType?: 'decoration' | 'door'
  /** Main stage layout configuration for decoration z-indexes */
  mainStageLayout?: CoverStageLayout
  /** Date + location block design from template (panel | calendar) */
  eventDetailsDesign?: EventDetailsDesignConfig | null
  /** Host info block design from template (standard | simple) */
  hostInfoDesign?: HostInfoDesignConfig | null
  /** Info card (venue/map/countdown/RSVP) design from template (glass | engraved) */
  infoCardDesign?: InfoCardDesignConfig | null
}

const props = defineProps<Props>()

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the empty-agenda add affordance can never leak there.
const editIntentCtx = inject(EditIntentKey, undefined)

// Provided by every preview frame, editable or not — see previewContext.ts. The
// wider of the two gates: "show a section that has no content yet", which is
// true of the read-only partner catalogue preview as much as of the studio.
const previewFrameCtx = inject(PreviewFrameKey, undefined)
const { t: tApp, locale: appLocale } = useAppLanguage()

// Main stage layout configuration (decoration z-indexes + welcome header visibility)
const { decorationZIndexes, layout: mainStageLayoutResolved } = useCoverStageLayout(
  computed(() => props.mainStageLayout),
  computed(() => undefined),
)

// Template-controlled: whether HostInfo renders the welcome header row
const showWelcomeHeaderText = computed(() => mainStageLayoutResolved.value.showWelcomeHeaderText)

// Template-controlled: render the first host's name beneath the sample-logo avatar
const showHostNameUnderLogo = computed(() => mainStageLayoutResolved.value.showHostNameUnderLogo)

// CSS vars that pan the host photo inside sample_logo_2's clip shape (shared with cover stage)
const hostClipStyle = computed<Record<string, string>>(() => ({
  '--host-clip-offset-x': `${mainStageLayoutResolved.value.hostClipOffsetX}%`,
  '--host-clip-offset-y': `${mainStageLayoutResolved.value.hostClipOffsetY}%`,
}))

// First host info forwarded to layouts that render the sample-logo avatar overlay
const firstHost = computed(() => props.hosts[0])
const firstHostImage = computed(() => firstHost.value?.profile_image ?? null)
const firstHostName = computed(() => firstHost.value?.name ?? '')
const firstHostId = computed(() => firstHost.value?.id ?? null)

// Animation type from prop with fallback to 'decoration'
const currentAnimationType = computed(() => props.animationType || 'decoration')
const isDoorAnimation = computed(() => currentAnimationType.value === 'door')

// Animation classes for decorations based on animation type
const decorationAnimationClasses = computed(() => ({
  left: isDoorAnimation.value ? 'animate-fadeIn' : 'animate-slideInFromLeft',
  right: isDoorAnimation.value ? 'animate-fadeIn' : 'animate-slideInFromRight',
  top: isDoorAnimation.value ? 'animate-fadeIn' : 'animate-slideInFromTop',
  bottom: isDoorAnimation.value ? 'animate-fadeIn' : 'animate-slideInFromBottom',
}))

// Animation class for main card based on animation type
const cardAnimationClass = computed(() =>
  isDoorAnimation.value ? 'animate-fadeInUp' : 'animate-slideUp',
)

// Optimized decoration image URLs using reactive window dimensions
const { leftDecorationUrl, rightDecorationUrl, topDecorationUrl, bottomDecorationUrl } =
  useOptimizedDecorations(props)

// Extract event type from category for layout detection
const eventType = computed(() => {
  // Try category_details.name first (showcase API), then category_name (events list API)
  return props.event.category_details?.name || props.event.category_name || 'default'
})

// Computed property to control liquid glass background visibility
const showLiquidGlass = computed(() => {
  const value = props.templateAssets?.display_liquid_glass_background
  // Show liquid glass by default (true or undefined), hide only when explicitly false
  return value !== false
})

// "Wide content" mode: backed by template_assets.cover_stage_layout.contentWidth.
// Falls back to the VITE_SHOWCASE_CONTENT_WIDTH env var for local visual testing
// when a template hasn't set the field yet (mirrors `showcaseAnimationType`'s override pattern).
const isWideContent = computed(() => {
  const backendValue = props.mainStageLayout?.contentWidth
  if (backendValue === 'wide' || backendValue === 'standard') {
    return backendValue === 'wide'
  }
  return import.meta.env.VITE_SHOWCASE_CONTENT_WIDTH === 'wide'
})

// Card grows toward the viewport edges in wide mode (see .liquid-glass-card--wide below)
const cardWidthClass = computed(() => (isWideContent.value ? 'liquid-glass-card--wide' : ''))

// Horizontal padding shrinks in wide mode to hand more of the card's width to the content;
// vertical rhythm is unchanged. Footer uses the negative-margin counterpart to stay flush.
const contentPaddingClasses = computed(() =>
  isWideContent.value
    ? 'py-6 sm:py-6 md:py-4 laptop-sm:py-5 laptop-md:py-5 laptop-lg:py-6 desktop:py-5 px-3 sm:px-3 md:px-2 laptop-sm:px-3 laptop-md:px-3 laptop-lg:px-4 desktop:px-3'
    : 'p-6 sm:p-6 md:p-4 laptop-sm:p-5 laptop-md:p-5 laptop-lg:p-6 desktop:p-5',
)
const footerMarginClasses = computed(() =>
  isWideContent.value
    ? '-mx-3 sm:-mx-3 md:-mx-2 laptop-sm:-mx-3 laptop-md:-mx-3 laptop-lg:-mx-4 desktop:-mx-3'
    : '-mx-6 sm:-mx-6 md:-mx-4 laptop-sm:-mx-5 laptop-md:-mx-5 laptop-lg:-mx-6 desktop:-mx-5',
)

// The footer stacks the partner's mark above ours; both the stack and our own
// logo's size depend on whether there is a partner mark to sit under.
const hasPartnerLogo = computed(() =>
  Boolean(props.event.referrer_details?.is_partner && props.event.referrer_details?.logo),
)

// A partner with no logo yet is a normal steady state, and on a real invitation
// it simply draws nothing: a guest must never meet a placeholder. In a preview
// it draws the slot instead, because the shop reading that preview is being sold
// this exact spot and cannot be sold a gap.
//
// PreviewFrameKey, not EditIntentKey. The partner-template preview IS a preview
// but cannot edit (`canEdit: false`), so gating on the edit context would hide
// the slot from the one audience it exists for - the trap the host avatar row
// fell into. See previewContext.ts.
const showPartnerLogoSlot = computed(
  () => !hasPartnerLogo.value && Boolean(previewFrameCtx || editIntentCtx),
)

// The ornament joins two marks, so it needs a mark above it to join to.
const showPartnerRow = computed(() => hasPartnerLogo.value || showPartnerLogoSlot.value)

// Computed property for language-aware logo selection
const logoUrl = computed(() => {
  // For Khmer language (kh), use primary logo (logo_one)
  if (props.currentLanguage === 'kh') {
    return props.event.logo_one ? props.getMediaUrl(props.event.logo_one) : undefined
  }

  // For all other languages, use secondary logo (logo_two) with fallback to primary logo
  if (props.event.logo_two) {
    return props.getMediaUrl(props.event.logo_two)
  }

  // Fallback to primary logo if secondary logo doesn't exist
  if (props.event.logo_one) {
    return props.getMediaUrl(props.event.logo_one)
  }

  // No logo available, will show fallback SVG
  return undefined
})

// Computed properties for dynamic styling and components
const containerClasses = computed(() => [
  'min-h-full',
  'py-10 sm:py-6',
  'md:py-8',
  'laptop-sm:py-6 laptop-sm:px-6',
  'laptop-md:py-8 laptop-md:px-8',
  'laptop-lg:py-10 laptop-lg:px-10',
  'desktop:py-12 desktop:px-12',
  'flex items-center justify-center',
])

// Inject video resource manager from parent showcase using Vue's provide/inject
// Must be called at top level of setup, not inside lifecycle hooks
const injectedVideoResourceManager = inject<VideoResourceManager | null>(
  'videoResourceManager',
  null,
)

const videoResourceManager = ref<VideoResourceManager | null>(null)

// Create IntersectionObserver ref
const revealObserver = ref<IntersectionObserver | null>(null)

// Track observed elements for proper cleanup
const observedElements = ref<Set<Element>>(new Set())

// Simplified mounting - no video management needed
onMounted(async () => {
  await nextTick()

  // Use the injected video resource manager for other operations if needed
  if (injectedVideoResourceManager) {
    videoResourceManager.value = injectedVideoResourceManager
  }

  // Shared config — see showcaseRevealObserverInit(). All scrolling happens
  // inside the liquid-glass card's own container, so that is the observer root
  // on every screen size; root:null would report every section as intersecting
  // at mount and fire them all at once instead of on scroll.
  const observerConfig = showcaseRevealObserverInit()

  // Create the IntersectionObserver directly
  revealObserver.value = new IntersectionObserver((entries) => {
    // IntersectionObserver does NOT guarantee entries in document order, so a
    // batch has to be sorted before it can be staggered — otherwise the cascade
    // can run bottom-to-top on first paint.
    const intersecting = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) =>
        a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      )

    intersecting.forEach((entry, i) => {
      const el = entry.target as HTMLElement
      // Stagger when multiple sections fire in the same batch (initial load).
      // Single scroll-triggered reveals get no delay so they feel instant.
      // transition-delay rather than setTimeout: it rides the compositor's
      // clock, retargets if the reveal is re-triggered, and can't drift or
      // fire late under main-thread load the way a timer does.
      const staggerDelay = intersecting.length > 1 ? i * REVEAL_STAGGER_MS : 0
      revealSection(el, staggerDelay)

      if (revealObserver.value) {
        revealObserver.value.unobserve(entry.target)
        observedElements.value.delete(entry.target)
      }
    })
  }, observerConfig)

  // Initialize animations with the properly configured observer
  initializeRevealAnimations()

  // Emit that main content has been viewed
  emit('mainContentViewed')
})

// Cleanup observer on unmount - properly unobserve all elements before disconnect
onUnmounted(() => {
  if (revealObserver.value) {
    // Unobserve all tracked elements before disconnecting
    observedElements.value.forEach((element) => {
      revealObserver.value?.unobserve(element)
    })
    observedElements.value.clear()

    // Disconnect and cleanup the observer
    revealObserver.value.disconnect()
    revealObserver.value = null
  }
})

const emit = defineEmits<{
  openMap: []
  openPhoto: [EventPhoto]
  register: []
  changeLanguage: [string]
  commentSubmitted: [EventComment]
  musicToggle: []
  mainContentViewed: []
  showAuthModal: []
  videoStateChange: [isPlaying: boolean]
}>()

// Stagger between sections that become visible in the same observer batch.
// 60ms sits in the 30–80ms band; the previous 150ms meant a four-section batch
// took 450ms just to *start* its last reveal.
const REVEAL_STAGGER_MS = 60

// Template refs for animated sections
const sectionRefs = {
  welcomeHeader: ref<HTMLElement>(),
  hostInfo: ref<HTMLElement>(),
  eventInfo: ref<HTMLElement>(),
  rsvpSection: ref<HTMLElement>(),
  dressCodeSection: ref<HTMLElement>(),
  agendaSection: ref<HTMLElement>(),
  hostMessageSection: ref<HTMLElement>(),
  videoSection: ref<HTMLElement>(),
  gallerySection: ref<HTMLElement>(),
  paymentSection: ref<HTMLElement>(),
  paymentComponent: ref<InstanceType<typeof PaymentSection> | null>(null),
  commentSection: ref<HTMLElement>(),
  footerLockup: ref<HTMLElement>(),
}

// Extract individual refs for template usage
const {
  welcomeHeader: welcomeHeaderRef,
  hostInfo: hostInfoRef,
  eventInfo: eventInfoRef,
  rsvpSection: rsvpSectionRef,
  dressCodeSection: dressCodeSectionRef,
  agendaSection: agendaSectionRef,
  hostMessageSection: hostMessageSectionRef,
  videoSection: videoSectionRef,
  gallerySection: gallerySectionRef,
  paymentSection: paymentSectionRef,
  paymentComponent: paymentComponentRef,
  commentSection: commentSectionRef,
  footerLockup: footerLockupRef,
} = sectionRefs

/**
 * Reveal one section, optionally offset within a staggered batch.
 *
 * `will-change` is applied for the duration of the transition and dropped on
 * completion. Leaving it in the stylesheet promoted all 12 sections to their own
 * compositor layer for the whole session, on top of the card's backdrop-filter.
 */
const revealSection = (el: HTMLElement, staggerDelay: number) => {
  el.style.willChange = 'opacity, transform'
  el.style.transitionDelay = staggerDelay > 0 ? `${staggerDelay}ms` : ''

  const done = (event: TransitionEvent) => {
    // Only the element's own transition ends the reveal, not a child's.
    if (event.target !== el) return
    el.style.willChange = ''
    el.style.transitionDelay = ''
    el.removeEventListener('transitionend', done)
  }
  el.addEventListener('transitionend', done)

  el.classList.add('is-visible')
}

/**
 * Initialize reveal animations
 * All sections must be observed to add .is-visible class, otherwise they remain hidden
 *
 * Safe to call repeatedly: elements already revealed or already observed are
 * skipped. It has to be re-runnable because nearly every section is v-if'd on
 * data (dressCodes, agendaItems, showHostMessage, photos, paymentMethods) — a
 * section that first renders after mount would otherwise never be observed and
 * would sit at opacity 0 forever.
 */
const initializeRevealAnimations = () => {
  const animationConfig: Array<[SectionRef, string]> = [
    [welcomeHeaderRef, 'welcome-header'],
    [hostInfoRef, 'host-info'],
    [eventInfoRef, 'event-info'],
    [rsvpSectionRef, 'rsvp-section'],
    [dressCodeSectionRef, 'dress-code-section'],
    [agendaSectionRef, 'agenda-section'],
    [hostMessageSectionRef, 'host-message-section'],
    [videoSectionRef, 'video-section'],
    [gallerySectionRef, 'gallery-section'],
    [paymentSectionRef, 'payment-section'],
    [commentSectionRef, 'comment-section'],
    [footerLockupRef, 'footer-lockup'],
  ]

  animationConfig.forEach(([elementRef, elementId]) => {
    const el = elementRef.value
    if (!el || !revealObserver.value) return
    if (observedElements.value.has(el) || el.classList.contains('is-visible')) return

    // Set the data-reveal-id attribute for CSS selectors
    el.setAttribute('data-reveal-id', elementId)
    // Observe the element and track it for cleanup
    revealObserver.value.observe(el)
    observedElements.value.add(el)
  })
}

// Pick up sections that mount later than this component (data arriving after
// the stage is shown, or a language switch changing which texts exist).
// Watches the raw props rather than the derived `showHostMessage` computed,
// which is declared further down this file and would be in its TDZ when the
// watcher runs its getter for the first time.
watch(
  () => [
    props.dressCodes?.length,
    props.agendaItems?.length,
    props.eventPhotos?.length,
    props.paymentMethods?.length,
    props.eventTexts?.length,
    props.currentLanguage,
  ],
  async () => {
    await nextTick()
    initializeRevealAnimations()
  },
)

// Memoized event text object lookup map for O(1) access
const eventTextMap = computed(() => {
  const map = new Map<string, EventText>()
  if (props.eventTexts?.length && props.currentLanguage) {
    props.eventTexts.forEach((text) => {
      if (text.language === props.currentLanguage) {
        map.set(text.text_type, text)
      }
    })
  }
  return map
})

/**
 * Find event text by type - optimized with O(1) map lookup
 */
const findEventText = (textType: string): EventText | undefined => {
  return eventTextMap.value.get(textType)
}

// Reactive getter functions for event text content - more efficient than computed for simple lookups
const getWelcomeMessage = (): string | undefined => findEventText('welcome_message')?.content
const getDateText = (): string | undefined => findEventText('date_text')?.content
const getTimeText = (): string | undefined => findEventText('time_text')?.content
const getLocationText = (): string | undefined => findEventText('location_text')?.content
const getDescriptionText = (): string | undefined => findEventText('description')?.content
const getDescriptionTitle = (): string | undefined => findEventText('description')?.title
const getInstructionText = (): string | undefined => findEventText('instructions')?.content

// Computed property to check if host message section should be displayed
// Checks for messages in ANY language to ensure section shows with fallback content
const showHostMessage = computed(() => {
  if (!props.eventTexts?.length) {
    return false
  }

  // Check if thank you message or sorry message exists in ANY language
  // This ensures the section shows even when switching to a language without messages
  const hasThankYouMessage = props.eventTexts.some((text) => text.text_type === 'thank_you_message')

  const hasSorryMessage = props.eventTexts.some((text) => text.text_type === 'sorry_message')

  return hasThankYouMessage || hasSorryMessage
})

// Computed styles to avoid recalculation on every render
const contentLoadingStyle = computed(() => ({
  boxShadow: `0 8px 32px ${props.primaryColor}20`,
}))

/**
 * Smooth scroll to section by ID
 */
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Floating Action Menu Handlers
const handleLanguageChange = (language: string) => emit('changeLanguage', language)
const handleMusicToggle = () => emit('musicToggle')
const handleCommentSubmitted = (comment: EventComment) => emit('commentSubmitted', comment)
const handleVideoStateChange = (isPlaying: boolean) => emit('videoStateChange', isPlaying)

// Section navigation handlers
const handleRSVP = () => scrollToSection('rsvp-section')
const handleGift = () => {
  scrollToSection('payment-section')
  // Expand the first payment card after scrolling
  nextTick(() => {
    paymentComponentRef.value?.expandFirstCard()
  })
}
const handleAgenda = () => scrollToSection('agenda-section')
const handleLocation = () => {
  // Scroll to event info section since map is now embedded there
  const element = eventInfoRef.value
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
const handleGallery = () => {
  // Scroll to the first photo in the gallery instead of the section header
  const firstPhoto = document.querySelector('.photo-item')
  if (firstPhoto) {
    // Trigger the visibility class immediately to show the photo
    firstPhoto.classList.add('photo-visible')
    // Scroll with more offset to ensure photo is fully visible
    firstPhoto.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    // Fallback to section if no photos are available
    scrollToSection('gallery-section')
  }
}
const handleComment = () => scrollToSection('comment-section')
const handleVideo = () => scrollToSection('video-section')

const handleReminder = () => {
  // Add event to Google Calendar (mobile-friendly)
  if (!props.event) return

  const startDate = new Date(props.event.start_date)
  const endDate = new Date(props.event.end_date)

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  // Sanitize text for Google Calendar (mobile-friendly)
  const sanitizeText = (text: string, maxLength = 1000): string => {
    if (!text) return ''

    // Remove HTML tags
    let cleaned = text.replace(/<[^>]*>/g, '')

    // Replace problematic characters
    cleaned = cleaned
      .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remove non-printable chars
      .trim()

    // Truncate if too long (prevents URL length issues on mobile)
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...'
    }

    return cleaned
  }

  const title = sanitizeText(props.event.title, 200)
  const description = sanitizeText(
    props.event.description || props.event.short_description || '',
    500, // Shorter limit for description to prevent mobile URL issues
  )

  // Sanitize location
  let location = ''
  if (props.event.is_virtual) {
    location = props.event.virtual_link || 'Virtual Event'
  } else {
    location = sanitizeText(props.event.location || '', 200)
  }

  // Build URL manually to ensure proper encoding for mobile
  const baseUrl = 'https://calendar.google.com/calendar/render'
  const params = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(title)}`,
    `dates=${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
    `details=${encodeURIComponent(description)}`,
    `location=${encodeURIComponent(location)}`,
    'trp=false',
  ].join('&')

  window.open(`${baseUrl}?${params}`, '_blank')
}

// Cleanup on component unmount
onUnmounted(() => {
  // Clear local references
  videoResourceManager.value = null
})
</script>

<style scoped>
/* Manage-page preview edit chrome: add-video affordance shown when the event
   has no YouTube embed yet. Rendered only when the edit-intent context
   exists, never in production. */
.add-video-row {
  display: flex;
  justify-content: center;
  margin: 0.25rem 0 1rem;
}

.add-video-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25em;
  width: 100%;
  max-width: 20rem;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px dashed rgba(30, 144, 255, 0.5);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

/* Gated: touch devices fire a sticky false hover on tap, leaving the button
   stuck in its hover treatment after the press. */
@media (hover: hover) and (pointer: fine) {
  .add-video-btn:hover {
    border-color: rgba(30, 144, 255, 0.9);
    background: rgba(30, 144, 255, 0.08);
  }
}

.comment-section-toggle-container {
  position: relative;
}

/* Manage-page preview edit chrome: reserves clearance above the comment
   section's own heading so the top-right corner toggle never overlaps it.
   Never applied on the public showcase (editIntentCtx is undefined there, so
   the class is never added). */
.comment-section-toggle-container.has-display-toggle {
  padding-top: 2.25rem;
}

/* ===================
   ANIMATIONS
   =================== */

/* Slide up animation for main card */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Decoration slide-in animations */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ===================
   LAYOUT COMPONENTS
   =================== */

/* Main slide animation */
.animate-slideUp {
  animation: slideUp 0.8s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)) forwards;
}

/* ===================
   DOOR ANIMATION STYLES
   =================== */

/* Fade in animation for door animation decorations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Fade in without movement for door animation card - content is revealed as doors open */
@keyframes fadeInUp {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fadeIn {
  animation: fadeIn 0.6s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)) forwards;
}

.animate-fadeInUp {
  animation: fadeInUp 0.8s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)) forwards;
}

/* Decoration slide-in animation classes with staggered timing */
/* Order: left → right → top → bottom — the exact mirror of the cover's
   slide-out (CoverDecorations.vue), down to the 0.8s and the 0.1/0.2/0.3/0.4
   stagger, so the frame returns the way it left. Keep the two in sync; they
   read as one gesture only because they share every value including the curve. */
.animate-slideInFromLeft {
  animation: slideInFromLeft 0.8s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)) forwards;
  animation-delay: 0.1s;
  opacity: 0;
}

.animate-slideInFromRight {
  animation: slideInFromRight 0.8s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)) forwards;
  animation-delay: 0.2s;
  opacity: 0;
}

.animate-slideInFromTop {
  animation: slideInFromTop 0.8s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)) forwards;
  animation-delay: 0.3s;
  opacity: 0;
}

.animate-slideInFromBottom {
  animation: slideInFromBottom 0.8s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)) forwards;
  animation-delay: 0.4s;
  opacity: 0;
}

/* Liquid Glass Card - Consolidated styles */
/* `dvh` (with a `vh` fallback) so the card is 85% of the *visible* height rather
   than 85% of the chrome-hidden height — the latter pushed its lower edge, and
   the last section of content with it, below the fold on mobile. */
.liquid-glass-card {
  position: relative;
  border-radius: 1.5rem;
  overflow: hidden;
  width: 85vw;
  height: 85vh;
  height: 85dvh;
  max-width: 85vw;
  max-height: 85vh;
  max-height: 85dvh;
}

/* Responsive width adjustments for laptop views with padding */
@media (min-width: 1024px) {
  .liquid-glass-card {
    max-width: calc(100vw - 3rem);
  }
}

@media (min-width: 1366px) {
  .liquid-glass-card {
    max-width: calc(100vw - 4rem);
  }
}

@media (min-width: 1536px) {
  .liquid-glass-card {
    max-width: calc(100vw - 5rem);
  }
}

/* Wide content mode (temporary VITE_SHOWCASE_CONTENT_WIDTH=wide toggle) - card grows closer to viewport edges */
.liquid-glass-card--wide {
  width: 94vw;
  max-width: 94vw;
}

@media (min-width: 1024px) {
  .liquid-glass-card--wide {
    max-width: calc(100vw - 1.5rem);
  }
}

@media (min-width: 1366px) {
  .liquid-glass-card--wide {
    max-width: calc(100vw - 2rem);
  }
}

@media (min-width: 1536px) {
  .liquid-glass-card--wide {
    max-width: calc(100vw - 2.5rem);
  }
}

.liquid-glass-card:hover {
  transform: translateY(-2px);
}

/* Glass background with iOS Safari fix */
.glass-background {
  position: absolute;
  inset: 0;
  isolation: isolate;
  pointer-events: none;
  /* Force stable compositing layer on iOS Safari */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: backdrop-filter;
}

/* Backdrop layer - isolated from transforms */
.glass-background::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.3) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: inherit;
  /* Ensure this layer is promoted and stable */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

/* Border layer - separate from backdrop for iOS Safari compatibility */
.glass-background::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.61),
    0 8px 32px -8px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

/* Fallback for browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(20px)) {
  .glass-background::before {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.85) 0%,
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0.85) 100%
    );
  }
}

/* ===================
   UTILITY CLASSES
   =================== */

/* Hidden scrollbar styles */
.custom-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: transparent;
}

/* ===================
   REVEAL ANIMATIONS
   =================== */

/* Base reveal animation styles */
/* The curve is expo-out: ~85% of the distance lands in the first third of the
   duration. At 0.9s the remaining ~600ms was the section creeping its last two
   pixels — it read as unresolved rather than luxurious. Shorter duration, same
   curve, and the motion resolves while the eye is still on it.
   will-change is applied by revealSection() for the duration of the
   transition and removed on transitionend, rather than living here and pinning
   a compositor layer per section for the whole session. */
.animate-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.48s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ===================
   RESPONSIVE DESIGN
   =================== */

/* Mobile-specific reveal animation adjustments */
@media (max-width: 640px) {
  .animate-reveal {
    transform: translateY(16px);
  }
}

/* The invitation is one long scroll with exactly one snap target: the footer
   page. `proximity` leaves every other section scrolling freely and only catches
   a gesture that comes to rest near the mark; `mandatory` would fight the long
   scroll through the gallery and the comments and make the whole invitation feel
   sticky. One target, so nothing else on the page changes behaviour. */
.stage-scroll {
  scroll-snap-type: y proximity;
}

.footer-page {
  scroll-snap-align: center;
}

/* The lockup fades in as one object while its rows rise in a wave.

   Why the lockup carries this and not the page it sits on. The footer page is
   now a full scrollport tall with its content centred, so an observer watching
   the PAGE fires the moment the page's top edge crosses in - roughly half a
   screen before the mark is on screen at all. The reveal was finishing while
   the reader still had empty space in front of them, and by the time they
   reached the mark it had simply always been there. Watching the lockup puts
   this where every other section's reveal is: 60px of the thing being revealed
   is showing, and then it arrives.

   Curve and durations are `.animate-reveal`'s, to the millisecond. This is the
   last section of the same document and it should land the way the eleven
   before it did.

   Opacity belongs to the lockup, transform to the rows. That split is what
   keeps the reveal from fighting the lockup's existing model: the ornament
   rests at 0.55 and the address at 0.9, so a per-row opacity would have to know
   each row's resting value, and both `.footer-mark` rows already own
   `transform` for their hover lift. Moving only the inner elements - the image,
   the svg, the rows that carry no hover of their own - leaves both alone. */
.footer-lockup {
  --rv-y: 18px;
  opacity: 0;
  transition: opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-lockup.is-visible {
  opacity: 1;
}

.footer-lockup .partner-mark > *,
.footer-lockup .collab-ornament,
.footer-lockup .goevent-mark,
.footer-lockup .social-row,
.footer-lockup .footer-address {
  transform: translateY(var(--rv-y));
  transition: transform 0.48s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-lockup.is-visible .partner-mark > *,
.footer-lockup.is-visible .collab-ornament,
.footer-lockup.is-visible .goevent-mark,
.footer-lockup.is-visible .social-row,
.footer-lockup.is-visible .footer-address {
  transform: translateY(0);
}

/* The wave, in reading order. 70ms apart: close enough that five rows read as
   one gesture rather than five events, which is what the lockup's own
   construction is for. */
.footer-lockup .collab-ornament {
  transition-delay: 70ms;
}

/* Our mark travels further than anything around it, so it settles where the
   others slide - the one place in this reveal where the brand gets more
   presence than the furniture. A beat of its own would have been too much. */
.footer-lockup .goevent-mark {
  --rv-y: 26px;
  transition-delay: 140ms;
}

.footer-lockup .social-row {
  transition-delay: 210ms;
}

.footer-lockup .footer-address {
  transition-delay: 260ms;
}

@media (max-width: 640px) {
  .footer-lockup {
    --rv-y: 12px;
  }

  .footer-lockup .goevent-mark {
    --rv-y: 18px;
  }
}

/* The footer lockup has one width, and the social row is what sets it: four
   buttons and three gaps. Our mark is then set to exactly that width rather
   than to a height of its own, so the two can never drift apart — every value
   below falls out of the same two tokens. The vh clamps only bite on short
   screens, so the lockup is one size on every desktop. */
.footer-lockup {
  --fm-btn: clamp(28px, 4.2vh, 34px);
  --fm-gap: clamp(8px, 1.2vh, 10px);
  --fm-w: calc(4 * var(--fm-btn) + 3 * var(--fm-gap));
  /* Our wordmark's height falls out of its own aspect at that width. */
  --fm-mark-h: calc(var(--fm-w) / 3.2127);
  /* A partner's mark can be stacked or square where ours is a wide wordmark,
     so it gets half again the height to work with — otherwise a square logo
     reads as a third the size of ours at the same height. */
  --fm-partner-h: calc(var(--fm-mark-h) * 1.5);
}

.footer-lockup .goevent-mark {
  width: var(--fm-w);
  height: auto;
  /* Belt and braces for the intrinsic height Safari derives from the viewBox. */
  aspect-ratio: 222.09 / 69.13;
}

/* The partner's mark is theirs — a stacked badge, a square, a wide wordmark —
   so only the box is ours. Both axes are auto so it keeps its own ratio, and it
   shrinks to fit whichever cap it meets first. The wrapper is the full measure
   and centres it, so a mark narrower than the box still sits on the lockup's
   axis rather than wherever its own width happens to leave it. */
.footer-lockup .partner-mark {
  display: flex;
  justify-content: center;
  width: var(--fm-w);
}

.footer-lockup .partner-mark img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: var(--fm-partner-h);
}

/* The slot the partner's mark will fill, drawn only inside a preview: our own
   mark's colour, our own mark's width, and nothing else. No box - nothing else
   in this lockup has one, and a dashed rectangle is admin-panel vocabulary in
   the middle of a gold-leaf invitation.

   It is SVG rather than styled text because the width has to be OUR mark's
   width exactly, and the font here is template-driven: any font-size that fills
   the measure in one face overshoots or falls short in the next. `textLength`
   over a viewBox scaled to --fm-w pins the span at the measure whatever the
   face - the same reason the ornament below is drawn geometry and not a glyph.
   42 units in a 200-unit box sits close to the natural width of a normal serif,
   so the adjustment is usually a few units of tracking; at a smaller size the
   stretch needed to reach the measure scatters the letters and "Your Logo"
   stops reading as two words. */
.footer-lockup .partner-slot-mark {
  display: block;
  width: var(--fm-w);
  height: auto;
}

/* The mark that joins the two logos. It was a drawn "x" - the fashion-
   collaboration sign, which is a register this footer does not sit in: it
   prints on funeral and memorial invitations too, and at this size two crossed
   strokes are also the web's most common "dismiss" glyph.

   This is instead the ornament the invitation already uses for a soft break -
   the rule under the comment section's heading - so the footer says the same
   thing in the same voice, on every event type. Its hairlines fade outward
   rather than ending, because these rows are meant to bind into one object and
   a rule that terminates cuts them into two; and it is narrower than --fm-w for
   the same reason, so it joins the marks rather than underlining one of them. */
.footer-lockup .collab-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--fm-btn) * 0.26);
  width: calc(var(--fm-w) * 0.62);
  opacity: 0.55;
}

.footer-lockup .collab-rule {
  flex: 1;
  height: 1px;
  background: currentColor;
}

.footer-lockup .collab-rule--left {
  -webkit-mask-image: linear-gradient(90deg, transparent, #000);
  mask-image: linear-gradient(90deg, transparent, #000);
}

.footer-lockup .collab-rule--right {
  -webkit-mask-image: linear-gradient(90deg, #000, transparent);
  mask-image: linear-gradient(90deg, #000, transparent);
}

/* A square on its corner, sized off the button so it holds its proportion to
   the lockup at every viewport height. */
.footer-lockup .collab-gem {
  width: calc(var(--fm-btn) * 0.16);
  height: calc(var(--fm-btn) * 0.16);
  flex-shrink: 0;
  background: currentColor;
  transform: rotate(45deg);
}

.footer-lockup .social-row {
  gap: var(--fm-gap);
}

.footer-lockup .social-btn {
  width: var(--fm-btn);
  height: var(--fm-btn);
  transition:
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.footer-lockup .social-btn svg {
  width: calc(var(--fm-btn) * 0.5);
  height: calc(var(--fm-btn) * 0.5);
}

/* The footer marks lift under a real pointer only. On touch, :hover fires on
   tap and stays stuck after the finger lifts, which leaves the logo sitting
   5% large for the rest of the visit. */
.footer-mark {
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (hover: hover) and (pointer: fine) {
  .footer-mark:hover {
    transform: scale(1.05);
  }

  .footer-lockup .social-btn:hover {
    transform: scale(1.1);
  }
}

/* After the hover block on purpose: a press fires :hover and :active together
   on a mouse, and these two rules tie on specificity, so the press has to come
   last to win. */
.footer-lockup .social-btn:active {
  transform: scale(0.95);
}

/* The anchor only: the partner's mark is not a link, and a press response on
   something that does not respond to a press is a false affordance. */
a.footer-mark:active {
  transform: scale(0.97);
}

/* ===================
   TRANSITION EFFECTS
   =================== */

/* Fade transition for loading overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===================
   ACCESSIBILITY
   =================== */

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-reveal {
    transition: opacity 0.25s ease;
    transform: none !important;
  }

  /* The lockup keeps its fade - it still says "this arrived" - but nothing
     travels and nothing waits its turn. */
  .footer-lockup {
    transition: opacity 0.25s ease;
  }

  .footer-lockup .partner-mark > *,
  .footer-lockup .collab-ornament,
  .footer-lockup .goevent-mark,
  .footer-lockup .social-row,
  .footer-lockup .footer-address {
    transform: none !important;
    transition: none;
    transition-delay: 0ms !important;
  }

  .animate-slideUp {
    animation: none;
  }

  .animate-fadeIn,
  .animate-fadeInUp {
    animation: none;
  }

  /* These four were missed: they carry `opacity: 0` as a base, so `animation:
     none` would leave the ornaments invisible rather than still. They fade in
     together instead — the shorthand also clears their stagger delay. */
  .animate-slideInFromLeft,
  .animate-slideInFromRight,
  .animate-slideInFromTop,
  .animate-slideInFromBottom {
    animation: fadeIn 0.5s ease forwards;
  }

  .glass-background::before {
    animation: none;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
}
</style>
