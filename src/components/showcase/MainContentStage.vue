<template>
  <!-- A tap anywhere on this stage plays the invitation: see useCinematicScroll. -->
  <div ref="stageRootRef" class="absolute inset-0 z-10">
    <!-- Background handled by CoverStage - transparent div maintains z-index stacking -->
    <div class="absolute inset-0 w-full h-full object-cover bg-transparent"></div>

    <!-- The screen backdrop (`contentBackdrop` blur, frost or smoke; stageBackdrop.ts):
         the whole backdrop behind the invitation, softened edge to edge instead
         of a pane on the card. It is the first thing in this stage, so it takes
         what CoverStage draws underneath (the backdrop photo or video, and the
         sparks) and nothing of this stage's own: the frame decorations and the
         menu stay sharp over it, because they are the design's frame rather than
         what the text sits on. -->
    <div
      v-if="screenBackdrop"
      class="stage-backdrop"
      :style="screenBackdropVars"
      aria-hidden="true"
    ></div>

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
      :has-gallery="galleryPhotos.length > 0"
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
          <!-- Under a screen backdrop the card runs the stage's full height
               (`--full`): with no pane there is no box to stop at, and an
               85%-tall card cut the text off along a line in mid-air, top and
               bottom. The text now scrolls to the stage's own edges, under the
               frame decorations, and the spacers on the content below keep the
               first screen exactly where the card put it. -->
          <div
            class="liquid-glass-card"
            :class="[
              cardAnimationClass,
              cardWidthClass,
              { 'liquid-glass-card--full': screenBackdrop },
            ]"
          >
            <!-- Glass Background Effects: the legacy card pane. A screen
                 backdrop replaces it rather than stacking with it — two blurs
                 would double the cost, and the pane's edge would draw the box
                 the screen backdrop exists to get rid of. -->
            <div
              v-if="showLiquidGlass && !screenBackdrop"
              class="glass-background"
              :class="{ 'glass-background--clear': glassTone === 'clear' }"
            ></div>

            <!-- Content Container with Scroll.
                 `overscroll-contain` matters here: this scroller is nested
                 inside another overflow-y-auto (the card centering wrapper),
                 which is itself scrollable by the container's vertical padding.
                 Without it, reaching the end of the invitation chains scroll to
                 the outer container and the whole glass card slides — a visible
                 break in the middle of the primary gesture. -->
            <!-- `story` + its tone: the scroll story (scroll-story.css), the
                 invitation assembling as it is read. -->
            <div
              ref="stageScrollRef"
              class="stage-scroll story relative z-10 h-full overflow-y-auto overscroll-contain custom-scrollbar"
              :class="{
                'stage-scroll--playing': isAutoScrolling,
                'stage-scroll--ink-edge': inkEdge,
              }"
              :data-story-tone="storyTone"
            >
              <div
                :class="[contentPaddingClasses, { 'stage-scroll__content--full': screenBackdrop }]"
              >
                <!-- Photo bands sit in a PhotoBandSlot after every section, in
                     the invitation's own order, rendered whether or not the
                     section before it is — so a band placed after a section
                     this event doesn't have still draws, between its
                     neighbours. None has a divider after it: the fade already
                     is that boundary, and a bow-tie under it would draw it
                     twice. -->
                <PhotoBandSlot
                  :bands="bandsAt.top"
                  :bleed-class="bleedMarginClasses"
                  :class="BAND_SLOT_CLASS"
                />

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
                    :divider-style="hostInfoDesign?.divider_style"
                    :divider-image="templateAssets?.host_divider_image"
                    :divider-scale="hostInfoDesign?.divider_scale"
                    :logo-scale="hostInfoDesign?.logo_scale"
                    :top-offset="hostInfoDesign?.top_offset"
                    :cover-host-names="coverHostNames"
                    :description-title="hostBlockOwnsDescription ? getDescriptionTitle() : undefined"
                    :description-text="hostBlockOwnsDescription ? getDescriptionText() : undefined"
                  />
                </div>

                <PhotoBandSlot
                  :bands="bandsAt.after_hosts"
                  :bleed-class="bleedMarginClasses"
                  :class="['mt-6 sm:mt-8', BAND_SLOT_CLASS]"
                />

                <!-- Guest dedication: the invite text and the name of the
                     guest this link was sent to. Here, between who is
                     inviting and what they are inviting to, because that is
                     where a Khmer wedding card writes the guest — the block
                     reads as the middle of one sentence, not as a second
                     greeting under the welcome header. After the hosts' band
                     slot, so a band placed "after the hosts" stays directly
                     under them.

                     Only when the template chose a design (absent = none, the
                     cover already greets the guest) and there is someone to
                     address: a public link carries no guest, and previews
                     fill in "Honored Guest". No divider after it — it is the
                     hinge between two sections, and a bow-tie would cut the
                     sentence in half. -->
                <div
                  v-if="guestInviteDesign && guestName"
                  ref="guestInviteRef"
                  class="mt-6 sm:mt-8 laptop-sm:mt-8 laptop-md:mt-10 laptop-lg:mt-12 desktop:mt-10 animate-reveal"
                >
                  <GuestInviteSection
                    :guest-name="guestName"
                    :event-texts="eventTexts"
                    :current-language="currentLanguage"
                    :primary-color="primaryColor"
                    :accent-color="accentColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                    :guest-invite-design="guestInviteDesign"
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
                    :description-title="hostBlockOwnsDescription ? undefined : getDescriptionTitle()"
                    :description-text="hostBlockOwnsDescription ? undefined : getDescriptionText()"
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
                    :details-calendar-style="eventDetailsDesign?.calendar_style"
                    :details-calendar-card-radius="eventDetailsDesign?.calendar_card_radius"
                    :details-calendar-card-color="eventDetailsDesign?.calendar_card_color"
                    :countdown-rsvp-in-section="!!countdownRsvp"
                    :map-style="infoCardDesign?.map_style"
                    :stationery="stationery"
                    @open-map="$emit('openMap')"
                  >
                    <!-- The form, in the card, while the card still holds it. Once the
                         template gives the countdown and the reply a section of
                         their own it is drawn there instead (below), and the
                         card becomes the venue card. -->
                    <template v-if="!countdownRsvp" #rsvp>
                      <div id="rsvp-section" ref="rsvpSectionRef">
                        <component :is="rsvpForm.component" v-bind="rsvpForm.props" v-on="rsvpForm.listeners" />
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

                <!-- The countdown and the reply in a section of their own, when
                     the template chose one (countdown_rsvp_design; absent keeps
                     both in the info card above, as every template drew them).
                     Straight after the card and before its band slot, so a band
                     placed "after the date & venue" still lands after the
                     RSVP, which is where it was placed. Not drawn at all when
                     there is nothing to count and nothing to answer. -->
                <div
                  v-if="countdownRsvp && countdownRsvpShown"
                  ref="countdownRsvpRef"
                  class="mb-6 sm:mb-8 laptop-sm:mb-8 laptop-md:mb-10 laptop-lg:mb-12 desktop:mb-10 animate-reveal"
                >
                  <CountdownRsvpSection
                    :design="countdownRsvp"
                    :event-start-date="event.start_date"
                    :show-countdown="event.countdown_enabled !== false"
                    :show-rsvp="event.rsvp_enabled !== false"
                    :is-event-past="isEventPast"
                    :photos="eventPhotos"
                    :bleed-class="bleedMarginClasses"
                    :primary-color="primaryColor"
                    :accent-color="accentColor"
                    :background-color="backgroundColor"
                    :stationery="stationery"
                    :marker-color="markerColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                    :current-language="currentLanguage"
                  >
                    <template #rsvp>
                      <div id="rsvp-section" ref="rsvpSectionRef">
                        <component :is="rsvpForm.component" v-bind="rsvpForm.props" v-on="rsvpForm.listeners" />
                      </div>
                    </template>
                  </CountdownRsvpSection>

                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <PhotoBandSlot
                  :bands="bandsAt.after_event_info"
                  :bleed-class="bleedMarginClasses"
                  :class="BAND_SLOT_CLASS"
                />

                <!-- The one place the studio offers a new band. Each band's
                     editor then moves it to whichever section it belongs
                     after, so an add row at every slot would only be ten
                     dashed buttons down the invitation. Never on the public
                     showcase: editIntentCtx is only provided in the studio. -->
                <div v-if="editIntentCtx" class="add-video-row">
                  <button
                    type="button"
                    class="edit-region-control add-video-btn"
                    @click.stop.prevent="editIntentCtx.requestEdit({ kind: 'photoBand' })"
                  >
                    ＋ {{ tApp('management.showcasePreview.editors.addPhotoBand') }}
                  </button>
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
                    :dress-code-design="dressCodeDesign"
                  />

                  <!-- Dress Code Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <PhotoBandSlot
                  :bands="bandsAt.after_dress_code"
                  :bleed-class="bleedMarginClasses"
                  :class="BAND_SLOT_CLASS"
                />

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
                    :agenda-design="agendaDesign"
                  />

                  <!-- Agenda Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <PhotoBandSlot
                  :bands="bandsAt.after_agenda"
                  :bleed-class="bleedMarginClasses"
                  :class="BAND_SLOT_CLASS"
                />

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

                <PhotoBandSlot
                  :bands="bandsAt.after_host_message"
                  :bleed-class="bleedMarginClasses"
                  :class="BAND_SLOT_CLASS"
                />

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

                <PhotoBandSlot
                  :bands="bandsAt.after_video"
                  :bleed-class="bleedMarginClasses"
                  :class="BAND_SLOT_CLASS"
                />

                <!-- Photo Gallery Section -->
                <div
                  v-if="galleryPhotos.length > 0"
                  id="gallery-section"
                  ref="gallerySectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <!-- In the editable preview a tap on the gallery means "manage
                       photos", and nothing else. The region hears the tap only
                       as it bubbles, after the tile has already handled it, so
                       the tile's own viewer used to open too — hidden behind
                       the upload drawer, then waiting there when it closed.
                       The viewer is a guest's view, not an editing one, so it
                       is not forwarded at all while editing. -->
                  <EditableRegion :intent="{ kind: 'photos' }">
                    <PhotoGallery
                      :photos="galleryPhotos"
                      :primary-color="primaryColor"
                      :secondary-color="secondaryColor"
                      :accent-color="accentColor"
                      :get-media-url="getMediaUrl"
                      :current-font="currentFont"
                      :primary-font="primaryFont"
                      :secondary-font="secondaryFont"
                      :event-texts="eventTexts"
                      :current-language="currentLanguage"
                      :gallery-design="galleryDesign"
                      :bleed-class="bleedMarginClasses"
                      @open-photo="!editIntentCtx && $emit('openPhoto', $event)"
                    />
                  </EditableRegion>

                  <!-- Gallery Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <PhotoBandSlot
                  :bands="bandsAt.after_gallery"
                  :bleed-class="bleedMarginClasses"
                  :class="BAND_SLOT_CLASS"
                />

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
                    :background-color="backgroundColor"
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

                <PhotoBandSlot
                  :bands="bandsAt.after_payment"
                  :bleed-class="bleedMarginClasses"
                  :class="BAND_SLOT_CLASS"
                />

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
                    :ground-color="templateColor || blurEffectColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
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

                <PhotoBandSlot
                  :bands="bandsAt.after_comments"
                  :bleed-class="bleedMarginClasses"
                  :class="BAND_SLOT_CLASS"
                />

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

                     The height is the scrollport's less 2rem: the card's 85dvh, or
                     the whole stage when a screen backdrop runs the card to its
                     edges (which is also why that mode spaces only the top of the
                     content, never the bottom - see `--full`). The block's bottom
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
                  ref="footerPageRef"
                  class="footer-page flex flex-col items-center justify-center"
                  :class="[
                    bleedMarginClasses,
                    screenBackdrop ? 'min-h-[calc(100dvh-2rem)]' : 'min-h-[calc(85dvh-2rem)]',
                  ]"
                >
                  <!-- What is printed on the page: one of four footer designs,
                       chosen by the template (footerDesign.ts). -->
                  <ShowcaseFooter
                    :design="footerDesignType"
                    :ink="primaryColor"
                    :band="backgroundColor || primaryColor"
                    :paper="stationery"
                    :font="secondaryFont || currentFont"
                    :partner-logo-url="hasPartnerLogo ? getMediaUrl(event.referrer_details!.logo!) : null"
                    :partner-name="event.referrer_details?.first_name"
                    :show-partner-slot="showPartnerLogoSlot"
                    :lockup-ref="setFooterLockup"
                  />
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
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  nextTick,
  inject,
  type ComponentPublicInstance,
} from 'vue'
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
import {
  createShowcaseRevealObserver,
  storyScrollActive,
} from '@/composables/showcase/useScrollProgress'
import { useCinematicScroll } from '@/composables/showcase/useCinematicScroll'
import { useOptimizedDecorations } from '../../composables/showcase/useOptimizedDecorations'
import { useAssetProtection } from '../../composables/showcase/useAssetProtection'
import {
  coverBlockTypeVars,
  coverSlotVars,
  useCoverStageLayout,
} from '../../composables/showcase/useCoverStageLayout'
import type { CoverHostNamesBinding } from './cover/coverDetails'
import { resolveGlassTone } from './glassTone'
import { resolveStoryTone } from './scrollStory'
import { resolveContentBackdrop, stageBackdropLook, stageBackdropVars } from './stageBackdrop'
import type {
  AgendaDesignConfig,
  CountdownRsvpDesignConfig,
  DressCodeDesignConfig,
  GalleryDesignConfig,
  FooterDesignConfig,
  CoverStageLayout,
  EventDetailsDesignConfig,
  GuestInviteDesignConfig,
  HostInfoDesignConfig,
  InfoCardDesignConfig,
} from '../../services/api/types/template.types'

// Asset protection (production-only)
const { protectionAttrs } = useAssetProtection()

// Component imports
import HostInfo from './HostInfo.vue'
import GuestInviteSection from './GuestInviteSection.vue'
import EventInfo from './EventInfo.vue'
import CountdownRsvpSection from './countdown-rsvp/CountdownRsvpSection.vue'
import { countdownStripsPhotoId, resolveCountdownRsvpDesign } from './countdown-rsvp/countdownRsvp'
import { resolveMarkerColor, stationeryPaper } from './stationery'
import { resolveCalendarStyle } from './calendar-designs/calendarModel'
import RSVPSection from './RSVPSection.vue'
import GuestRSVPSection from './GuestRSVPSection.vue'
import AgendaSection from './AgendaSection.vue'
import HostMessageSection from './HostMessageSection.vue'
import DressCodeSection from './DressCodeSection.vue'
import YouTubeVideoSection from './YouTubeVideoSection.vue'
import PhotoGallery from './PhotoGallery.vue'
import ShowcaseFooter from './footer/ShowcaseFooter.vue'
import { resolveFooterDesign } from './footer/footerDesign'
import PhotoBandSlot from './photo-band/PhotoBandSlot.vue'
import {
  PHOTO_BAND_PLACEMENTS,
  galleryPhotosOf,
  resolvePhotoBands,
  type ResolvedPhotoBand,
} from './photo-band/photoBand'
import { coverFramePhotoId } from './cover/coverPhoto'
import type { PhotoBandPlacement } from '../../services/api/types/event.types'
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
  /** Custom breakline art, forwarded to the `crest` host layout. */
  host_divider_image?: string | null
  /** The cover's own mark between host names, for `simple` when it matches the cover. */
  cover_host_separator_image?: string | null
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
  /**
   * The template's `blur-effect` colour. With `templateColor`, the only two
   * colours that say what the template's base is (`backgroundColor` is
   * usually the primary itself); the guestbook draws its cards in that base.
   */
  blurEffectColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  /**
   * The template's other two font slots and its guest-name colour. Nothing on
   * this stage is set in them by default; they are here because the `simple`
   * host design can match the cover's host names, and the cover lets those
   * names (and the line under them) be set in any slot.
   */
  accentFont?: string
  decorativeFont?: string
  guestnameColor?: string | null
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
  /** Showcase animation type from template_assets.showcase_animation_type.
   *  `stack` enters as `decoration` does — its stage hands off the same way. */
  animationType?: 'decoration' | 'door' | 'stack'
  /** Main stage layout configuration for decoration z-indexes */
  mainStageLayout?: CoverStageLayout
  /** Date + location block design from template (panel | calendar) */
  eventDetailsDesign?: EventDetailsDesignConfig | null
  /** Host info block design from template (standard | simple) */
  hostInfoDesign?: HostInfoDesignConfig | null
  /** Info card (venue/map/countdown/RSVP) design from template (glass | engraved) */
  infoCardDesign?: InfoCardDesignConfig | null
  /** Agenda list design from template (rail | thread | milestone | ledger | stack) */
  agendaDesign?: AgendaDesignConfig | null
  dressCodeDesign?: DressCodeDesignConfig | null
  /** Photo gallery composition. Absent/unknown renders `column`. */
  galleryDesign?: GalleryDesignConfig | null
  /** Footer design. Absent / null / unknown = what the Liquid Glass switch picks. */
  footerDesign?: FooterDesignConfig | null
  /** Guest dedication design from template. Absent / null = no block. */
  guestInviteDesign?: GuestInviteDesignConfig | null
  /** Countdown + RSVP in a section of their own. Absent / null = both stay in the info card. */
  countdownRsvpDesign?: CountdownRsvpDesignConfig | null
}

const props = defineProps<Props>()

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the empty-agenda add affordance can never leak there.
const editIntentCtx = inject(EditIntentKey, undefined)

// Provided by every preview frame, editable or not — see previewContext.ts. The
// wider of the two gates: "show a section that has no content yet", which is
// true of the read-only partner catalogue preview as much as of the studio.
const previewFrameCtx = inject(PreviewFrameKey, undefined)
const { t: tApp } = useAppLanguage()

// Main stage layout configuration (decoration z-indexes + welcome header visibility)
const {
  decorationZIndexes,
  layout: mainStageLayoutResolved,
  coverDetails,
  textStyles: coverTextStyles,
  elements: coverElements,
  elementFontSlots: coverElementFontSlots,
} = useCoverStageLayout(
  computed(() => props.mainStageLayout),
  computed(() => undefined),
)

/**
 * The cover's host-names block, for the `simple` host design to draw instead of
 * its own two stacked names — only when the template asks it to
 * (`host_info_design.sync_cover_names`). Null otherwise, which is what keeps
 * `simple` rendering exactly as it always has.
 *
 * Built from the same resolved config the cover renders from, so the two can't
 * disagree about which hosts, how each name splits, or which mark sits between
 * them. Not gated on the cover SHOWING its names: the setting is "look like the
 * cover's names", and switching the cover's block off shouldn't silently change
 * the invitation.
 */
const matchesCoverNames = computed(
  () => props.hostInfoDesign?.type === 'simple' && !!props.hostInfoDesign.sync_cover_names,
)

/**
 * The stage's width in px, published so the matched names can be sized by the
 * cover's own formula — which is a share of the STAGE, not of the card the
 * invitation is drawn on.
 *
 * Measured rather than expressed in CSS, because neither unit reaches it: `vw`
 * is the window, and on a desktop the stage is a 9:16 frame centred in it
 * (`.showcase-container`), while a container query would mean making this root
 * a container, which also makes it the containing block for every
 * `position: fixed` layer inside the invitation. This root is `inset-0` of the
 * stage, so its own width is the number.
 */
const stageWidth = ref(0)

const coverHostNames = computed<CoverHostNamesBinding | null>(() => {
  if (!matchesCoverNames.value) return null
  const separatorImage = props.templateAssets?.cover_host_separator_image
  return {
    details: coverDetails.value,
    namesSlot: coverElementFontSlots.value.hosts,
    sublineStyle: coverTextStyles.value.hostSubline,
    vars: {
      ...coverSlotVars(props),
      ...coverBlockTypeVars(coverElements.value.hosts, coverTextStyles.value.hostNames),
      // Only once measured: until then the names fall back to the viewport,
      // which is the stage on a phone, rather than to 0 and vanishing.
      ...(stageWidth.value ? { '--cover-stage-w': `${stageWidth.value}px` } : {}),
    },
    separatorImageUrl: separatorImage ? props.getMediaUrl(separatorImage) : null,
  }
})

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

// How much the scroll story moves for this occasion (scrollStory.ts).
const storyTone = computed(() => resolveStoryTone(eventType.value))

// A photo set to appear as a band leaves the gallery, and so do the one in the
// cover's photo frame and the one the countdown's strips are cut from, while the
// design draws them: the invitation never shows the same photograph twice.
const galleryPhotos = computed(() =>
  galleryPhotosOf(
    props.eventPhotos,
    coverFramePhotoId(props.eventPhotos, props.mainStageLayout, props.templateAssets),
    countdownStripsPhotoId(
      props.eventPhotos,
      props.countdownRsvpDesign,
      props.event.countdown_enabled !== false,
    ),
  ),
)

// Which photo is a band where. Moving a band between sections changes no count
// the reveal watcher below could see, and each move mounts a new slot element.
const bandSignature = computed(() =>
  (props.eventPhotos ?? []).map((p) => `${p.id}:${p.band_placement ?? ''}`).join(','),
)

// The photo bands, grouped by the section each follows, in gallery order.
const bandsAt = computed(() => {
  const groups = Object.fromEntries(PHOTO_BAND_PLACEMENTS.map((p) => [p, []])) as unknown as Record<
    PhotoBandPlacement,
    ResolvedPhotoBand<EventPhoto>[]
  >
  for (const band of resolvePhotoBands(props.eventPhotos)) {
    groups[band.placement].push(band)
  }
  return groups
})

// Every slot's spacing and reveal — the same bottom rhythm as the sections.
const BAND_SLOT_CLASS =
  'mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal'

// Computed property to control liquid glass background visibility
const showLiquidGlass = computed(() => {
  const value = props.templateAssets?.display_liquid_glass_background
  // Show liquid glass by default (true or undefined), hide only when explicitly false
  return value !== false
})

// Which way the glass moves the ground — chosen against the ink, because a white
// film can't make gold legible. `clear` also turns on the text edge below. See
// glassTone.ts for the measurements behind it.
const glassTone = computed(() => resolveGlassTone(props.primaryColor))

// What sits behind the text: the legacy card pane (`card`), or the whole
// backdrop softened (`blur`, `frost`, `smoke`). See stageBackdrop.ts.
const contentBackdrop = computed(() => resolveContentBackdrop(props.mainStageLayout))
const screenBackdropLook = computed(() => {
  const { mode, strength } = contentBackdrop.value
  return mode === 'card' ? null : stageBackdropLook(mode, strength, props.primaryColor)
})
const screenBackdrop = computed(() => screenBackdropLook.value !== null)
const screenBackdropVars = computed(() =>
  screenBackdropLook.value ? stageBackdropVars(screenBackdropLook.value) : undefined,
)

// The text edge is what keeps a light ink legible where nothing darkens the
// ground under it: clear card glass, and the screen backdrop for the same inks.
const inkEdge = computed(() =>
  screenBackdropLook.value
    ? screenBackdropLook.value.inkEdge
    : showLiquidGlass.value && glassTone.value === 'clear',
)

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
// vertical rhythm is unchanged. Whatever runs edge to edge — the footer, the photo
// band — takes the negative-margin counterpart, so the two must move together.
const contentPaddingClasses = computed(() =>
  isWideContent.value
    ? 'py-6 sm:py-6 md:py-4 laptop-sm:py-5 laptop-md:py-5 laptop-lg:py-6 desktop:py-5 px-3 sm:px-3 md:px-2 laptop-sm:px-3 laptop-md:px-3 laptop-lg:px-4 desktop:px-3'
    : 'p-6 sm:p-6 md:p-4 laptop-sm:p-5 laptop-md:p-5 laptop-lg:p-6 desktop:p-5',
)
const bleedMarginClasses = computed(() =>
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
// it simply draws nothing: a guest must never meet a placeholder.
//
// The slot is an argument, not a placeholder for missing content, so it is drawn
// for the one audience that argument is aimed at: the shop owner reading the
// public catalogue, who is being sold this exact spot and cannot be sold a gap.
// Every other preview is a studio — the organizer or the partner previewing
// their own work already knows whose mark goes here, so the slot is only noise
// in a frame they are reading to judge the design.
const showPartnerLogoSlot = computed(() => !hasPartnerLogo.value && previewFrameCtx === 'catalogue')

// The footer's design: the template's own, else whichever of its two old looks
// the Liquid Glass switch gives it, so an untouched template renders as before.
const footerDesignType = computed(() =>
  resolveFooterDesign(props.footerDesign, props.templateAssets?.display_liquid_glass_background),
)

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
const cardContainerClasses = [
  'min-h-full',
  'py-10 sm:py-6',
  'md:py-8',
  'laptop-sm:py-6 laptop-sm:px-6',
  'laptop-md:py-8 laptop-md:px-8',
  'laptop-lg:py-10 laptop-lg:px-10',
  'desktop:py-12 desktop:px-12',
  'flex items-center justify-center',
]

const containerClasses = computed(() =>
  screenBackdrop.value
    ? [
        // Full height, no vertical padding: the card is the stage's height
        // (`.liquid-glass-card--full`). The horizontal padding is kept, so the
        // text measure is unchanged.
        'h-full',
        'laptop-sm:px-6',
        'laptop-md:px-8',
        'laptop-lg:px-10',
        'desktop:px-12',
        'flex justify-center',
      ]
    : cardContainerClasses,
)

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
  // at mount and fire them all at once instead of on scroll. Under the scroll
  // story, sections already on screen at mount still reveal in this first
  // batch (createShowcaseRevealObserver), so the opening screen composes as it
  // always did.
  revealObserver.value = createShowcaseRevealObserver((entries) => {
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
  })

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
  guestInvite: ref<HTMLElement>(),
  eventInfo: ref<HTMLElement>(),
  countdownRsvp: ref<HTMLElement>(),
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
  guestInvite: guestInviteRef,
  eventInfo: eventInfoRef,
  countdownRsvp: countdownRsvpRef,
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

// The footer's lockup lives inside ShowcaseFooter, which hands its element back
// here so the reveal observer below watches it with every other section.
const setFooterLockup = (el: Element | ComponentPublicInstance | null) => {
  footerLockupRef.value = el instanceof HTMLElement ? el : undefined
}

// Tap-to-play. It comes to rest where the footer page's `scroll-snap-align:
// center` puts it — the place a guest's own scroll settles at the end — so the
// snap it had to suspend while moving has nothing to correct when it returns.
// Off in the editable preview, where a tap on the invitation is an edit.
const stageRootRef = ref<HTMLElement>()

// Watches the stage's width for `stageWidth` above — declared here because
// `stageRootRef` is, and only while a template actually matches the cover's
// names, so every other showcase pays nothing for it.
let stageObserver: ResizeObserver | null = null

watch(
  [matchesCoverNames, stageRootRef],
  ([matches, root]) => {
    stageObserver?.disconnect()
    stageObserver = null
    if (!matches || !root || typeof ResizeObserver === 'undefined') return
    stageWidth.value = root.clientWidth
    stageObserver = new ResizeObserver(() => {
      stageWidth.value = root.clientWidth
    })
    stageObserver.observe(root)
  },
  { immediate: true },
)

onUnmounted(() => {
  stageObserver?.disconnect()
  stageObserver = null
})

const stageScrollRef = ref<HTMLElement>()
const footerPageRef = ref<HTMLElement>()
const { isPlaying: isAutoScrolling } = useCinematicScroll({
  root: stageRootRef,
  scroller: stageScrollRef,
  restOffset: (scroller) => {
    const footer = footerPageRef.value
    if (!footer) return scroller.scrollHeight - scroller.clientHeight
    // offsetTop is against `.stage-scroll`, the footer's nearest positioned
    // ancestor, so it is already in the scroller's content coordinates.
    return footer.offsetTop + footer.offsetHeight / 2 - scroller.clientHeight / 2
  },
  enabled: () => !editIntentCtx,
})

/**
 * Reveal one section, optionally offset within a staggered batch.
 *
 * `will-change` is applied for the duration of the transition and dropped on
 * completion. Leaving it in the stylesheet promoted all 12 sections to their own
 * compositor layer for the whole session, on top of the card's backdrop-filter.
 *
 * Under the scroll story there is no transition: the section has been rising
 * with the scroll all along, and `is-visible` only tells what is inside it
 * (EventInfo's own entrance, the footer's lockup) that it has reached the
 * reading line. Nothing would ever end to drop a `will-change` set here.
 */
const revealSection = (el: HTMLElement, staggerDelay: number) => {
  if (storyScrollActive()) {
    el.classList.add('is-visible')
    return
  }

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
    [guestInviteRef, 'guest-invite'],
    [eventInfoRef, 'event-info'],
    [countdownRsvpRef, 'countdown-rsvp'],
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

  // Photo band slots are as many as the organizer placed, each mounting and
  // unmounting as bands move between sections, so they are found rather than
  // held by ref. A slot that reappears is a new element, and is observed anew.
  const bandSlots = Array.from(
    stageScrollRef.value?.querySelectorAll<HTMLElement>('.photo-band-slot') ?? [],
  ).map((el): [SectionRef, string] => [{ value: el }, 'photo-band'])

  ;[...animationConfig, ...bandSlots].forEach(([elementRef, elementId]) => {
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
    bandSignature.value,
    props.paymentMethods?.length,
    props.eventTexts?.length,
    props.currentLanguage,
    // The guest dedication mounts on a template design and a guest name, and
    // either can arrive after the stage does (a studio design change, a
    // template's assets landing late).
    props.guestInviteDesign?.type,
    // The countdown + RSVP section mounts on a template design, which can
    // arrive after the stage does (a studio design change).
    !!props.countdownRsvpDesign,
    !!props.guestName,
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

/**
 * The `crest` host design puts the invitation sentence directly under the
 * parents who are inviting, in the slot every other design gives a welcome
 * header — so the description **moves** into the host block on that design and
 * the info card below must not draw it a second time.
 *
 * Decided here rather than inside either component: they are siblings, and only
 * their parent can see both.
 */
const hostBlockOwnsDescription = computed(() => props.hostInfoDesign?.type === 'crest')

/**
 * The invitation's stationery (stationery.ts), resolved once here and handed
 * to both EventInfo and the countdown + RSVP section, so the date, the venue,
 * the count and the reply are one set: the date design's marker colour as
 * every block's one accent, and one paper — the calendar card's stock and
 * corner when the date is that card — for every paper object.
 */
const markerColor = computed(() =>
  resolveMarkerColor({
    source: props.eventDetailsDesign?.marker_color_source,
    custom: props.eventDetailsDesign?.marker_custom_color,
    primary: props.primaryColor,
    secondary: props.secondaryColor,
    accent: props.accentColor,
  }),
)

const stationery = computed(() => {
  const details = props.eventDetailsDesign
  const isCardCalendar =
    details?.type === 'calendar' && resolveCalendarStyle(details.calendar_style) === 'card'
  return stationeryPaper({
    tone: props.backgroundColor || props.primaryColor,
    calendarCard: isCardCalendar
      ? { color: details?.calendar_card_color, radius: details?.calendar_card_radius }
      : null,
  })
})

/**
 * The countdown + RSVP section's two designs, or null to leave both in the info
 * card — which is what every template saved before the section existed has.
 */
const countdownRsvp = computed(() => resolveCountdownRsvpDesign(props.countdownRsvpDesign))

/**
 * Whether the section has anything to draw: a count still running, or a reply
 * that can still be given. Both forms hide themselves once the event has ended,
 * and the count once it has started, so with neither left the section (and its
 * divider) is not drawn rather than leaving an empty gap. The studio keeps both
 * on screen when switched off, for their on/off chips.
 *
 * Read against the clock once per render, not ticking: a page left open across
 * the start keeps its section until the next render, where the count inside it
 * has already hidden itself.
 */
const countdownRsvpShown = computed(() => {
  const editing = !!editIntentCtx
  const rsvp = (props.event.rsvp_enabled !== false || editing) && !props.isEventPast
  const start = Date.parse(props.event.start_date ?? '')
  const counting =
    (props.event.countdown_enabled !== false || editing) &&
    Number.isFinite(start) &&
    start > Date.now()
  return rsvp || counting
})

/**
 * The RSVP form, declared once for both places it can be drawn — in the info
 * card, or in the countdown + RSVP section. Private events answer a guest's own
 * questionnaire by shortcode; public ones RSVP through an account.
 */
const rsvpForm = computed(() => {
  const shared = {
    eventId: props.event.id,
    eventStartDate: props.event.start_date,
    eventEndDate: props.event.end_date,
    primaryColor: props.primaryColor,
    secondaryColor: props.secondaryColor,
    accentColor: props.accentColor,
    backgroundColor: props.backgroundColor,
    eventTexts: props.eventTexts,
    currentLanguage: props.currentLanguage,
    eventType: eventType.value,
    currentFont: props.currentFont,
    primaryFont: props.primaryFont,
    secondaryFont: props.secondaryFont,
  }
  if (props.event.privacy === 'private') {
    return {
      component: GuestRSVPSection,
      props: { ...shared, guestShortcode: props.guestShortcode, guestName: props.guestName },
      listeners: {},
    }
  }
  return {
    component: RSVPSection,
    props: { ...shared, isEventPast: props.isEventPast },
    listeners: { showAuthModal: () => emit('showAuthModal') },
  }
})
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

<!-- Unscoped, once: the scroll story's roles are given by the sections'
     own components (a title, a hairline, an ornament), which carry no scope
     attribute of this one. Every selector is under `.story`. -->
<style src="./scroll-story.css"></style>

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

/* Under a screen backdrop: the card runs the stage's full height and has no
   corners, because there is no pane to shape. `h-full` on the container (see
   `containerClasses`) is what makes this 100% definite. */
.liquid-glass-card--full {
  height: 100%;
  max-height: none;
  border-radius: 0;
}

/* The gap the 85% card left above the text, kept as space inside the scroll
   instead, so the first screen composes exactly as it did. Only the top: the
   footer page is always last and sizes itself against the scrollport, so a
   spacer below it would push its lockup off the centre line. A pseudo-element
   rather than padding, which would fight the breakpoint padding classes. */
.stage-scroll__content--full::before {
  content: '';
  display: block;
  height: 7.5vh;
  height: 7.5dvh;
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

/* Clear glass — for an ink white can't make legible (glassTone.ts). The blur
   stays, because it is what calms petals and filigree behind the glyphs; the
   white film goes, because against gold it only washed the artwork out, and
   over a dark backdrop it closed the gap to pale ink. The edge on `::after`
   still draws the pane. Legibility comes from `.stage-scroll--ink-edge`. */
.glass-background--clear::before {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px) saturate(0.85);
  -webkit-backdrop-filter: blur(10px) saturate(0.85);
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

  /* An opaque white sheet is the frost at its worst for a light ink. */
  .glass-background--clear::before {
    background: rgba(255, 255, 255, 0.06);
  }
}

/* The screen backdrop (stageBackdrop.ts): the whole backdrop behind the
   invitation, defocused and, for `frost` and `smoke`, filmed toward white or
   black. The numbers arrive as variables from the resolver; this rule only
   draws them.

   - The film is this element's own background, painted over its filtered
     backdrop, so it tints the defocused design rather than covering it.
   - It fades in on the card's own entrance curve and duration, so the backdrop
     goes out of focus as the text arrives rather than a beat before or after.
     Opacity only: the blur itself is never animated, which would re-filter the
     whole stage on every frame of the fade.
   - Promoted to its own layer for the reason `.glass-background` is: iOS Safari
     otherwise drops a backdrop filter on a layer it later composites. */
.stage-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--sb-film);
  backdrop-filter: blur(var(--sb-blur)) saturate(var(--sb-saturate));
  -webkit-backdrop-filter: blur(var(--sb-blur)) saturate(var(--sb-saturate));
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  animation: stageBackdropIn 0.8s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)) both;
}

@keyframes stageBackdropIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Without a backdrop filter there is nothing to defocus, so the film is all
   that can separate the text from the design: `--sb-film-fallback` is the same
   film, stronger. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .stage-backdrop {
    background: var(--sb-film-fallback);
  }
}

/* The text edge that clear glass relies on: a hairline in a deep shade of each
   run's own colour, which is what separates pale gold from a pale ground
   without covering the ground — the metallic finishes keep gold legible on a
   cream card the same way. Nearly every run on this stage is the primary ink,
   often at reduced alpha, so it is set once here and inherited rather than
   opted into by twenty section components.

   - Per element, not inherited from the root: `em` in the width resolves at
     the declaring element, so a root-level width would give 12px names the
     stroke of the root's size.
   - Capped at 0.5px, lower than the finishes' rim. Legibility is a small-text
     problem: display type is already large enough to read, and at 0.75px a
     40px numeral read as outlined sticker lettering.
   - The shade keeps the run's alpha, or a 58% note would carry a darker rim
     than its own fill and read as outlined. Relative colour does that;
     `color-mix` is the fallback for engines without it, and there a faded run's
     rim is somewhat stronger than its fill.
   - `paint-order: stroke fill` lays it under the glyph, so only the outer half
     shows and small Khmer keeps its full weight and open counters.
   - `.tfx-ink` is skipped: a metallic finish draws its own rim, and matching
     it here would tie the two at equal specificity with bundle order choosing.
     An inert ink span (no `.tfx` above it) inherits this one instead. */
.stage-scroll--ink-edge,
.stage-scroll--ink-edge :deep(:not(.tfx-ink)) {
  -webkit-text-stroke-width: clamp(0.3px, 0.035em - 0.25px, 0.5px);
  -webkit-text-stroke-color: color-mix(in srgb, currentColor 45%, #000);
  -webkit-text-stroke-color: rgb(
    from currentColor calc(r * 0.45) calc(g * 0.45) calc(b * 0.45) / alpha
  );
  paint-order: stroke fill;
}

/* Controls sit on fills of their own and keep the type they were designed
   with; so does the footer bar, which carries white on its own tint. Each
   selector outranks or follows the rule above, and none reaches `.tfx-ink`. */
.stage-scroll--ink-edge
  :deep(:is(button, a, input, textarea, select, [role='button'], [role='tab'])),
.stage-scroll--ink-edge
  :deep(:is(button, a, input, textarea, select, [role='button'], [role='tab']) :not(.tfx-ink)),
.stage-scroll--ink-edge .footer-card-container,
.stage-scroll--ink-edge .footer-card-container :deep(:not(.tfx-ink)) {
  -webkit-text-stroke-width: 0;
}

@media (forced-colors: active) {
  .stage-scroll--ink-edge,
  .stage-scroll--ink-edge :deep(:not(.tfx-ink)) {
    -webkit-text-stroke-width: 0;
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

/* The scroll story's chapters (scroll-story.css has the rest of it). Where the
   browser can drive animation by scroll position, a section no longer waits
   off-screen at opacity 0 for a one-shot reveal: it is there as it enters, and
   rises into place over the first stretch of its travel, tied to the guest's
   finger — a section that arrives a little behind the scroll and catches up,
   which is what makes the card read as a page being lifted rather than a
   document sliding past. `is-visible` still arrives, at the reading line, for
   what is inside the section to start its own entrance by.

   Transform only, never opacity. A section can hold a glass pane (the gift
   sheet, the reply glass, a frosted info card), and an ancestor below opacity
   1 is a backdrop root: the pane would blur nothing but its own section for as
   long as the guest rested mid-entrance, then snap into focus. No scale either:
   the photo bands, the countdown strips, the gallery and the footer bleed to
   the card's edges, and a scaled section would draw them short of the edge.

   `translate`, not `transform`: the resting `translateY(0)` above stays, so a
   section is still the containing block it always was. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .animate-reveal,
    .animate-reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
      transition: none;
      animation: storyChapter linear backwards;
      animation-timeline: view();
      animation-range: cover 0% cover var(--story-reach, 30vh);
    }
  }
}

@keyframes storyChapter {
  from {
    translate: 0 var(--story-rise, 40px);
  }
  to {
    translate: 0 0;
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

/* Suspended while tap-to-play rolls the card. Every `scrollTop` write is a
   programmatic scroll the browser snaps after, so once playback came within
   proximity range of the footer it would be yanked there in a single frame
   instead of gliding in. Playback lands on that same snap point itself. */
.stage-scroll--playing {
  scroll-snap-type: none;
}

.footer-page {
  scroll-snap-align: center;
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

  .animate-slideUp {
    animation: none;
  }

  .animate-fadeIn,
  .animate-fadeInUp {
    animation: none;
  }

  /* The card is there at once, so the backdrop doesn't take its time behind
     it: the same short fade the sections reveal with. */
  .stage-backdrop {
    animation-duration: 0.25s;
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
