<template>
        <!-- Still asks for a plan first, because a template needs one to
             be saved at all — but the plan no longer decides which backdrop
             is on offer. That is the mode's call. -->
        <PlanRequiredNotice v-if="!form.package_plan_id" @pick="selectSection('basics')" />
        <section v-else :class="[PANEL, 'p-4 space-y-3']">
          <h5 :class="SECTION_HEADING">
            {{ t('management.partnerTemplateForm.backgroundStage.sectionTitle') }}
          </h5>
          <TemplateFormChoice v-model="backgroundModeModel" :options="stageModeOptions" />
          <p :class="FIELD_HINT">
            {{ t(`management.partnerTemplateForm.stageModes.backgroundHint.${form.stage_mode_background}`) }}
          </p>
          <FileUploadField
            v-if="form.stage_mode_background === 'animation'"
            :label="t('management.partnerTemplateForm.backgroundStage.backgroundPhoto')"
            accept="image/*"
            :file-name="form.basic_background_photo?.name"
            :has-existing-file="hasSavedAsset('basic_background_photo')"
            @change="handleFileChange('basic_background_photo', $event)"
            @clear="clearAssetField('basic_background_photo')"
          />
          <FileUploadField
            v-else
            :label="t('management.partnerTemplateForm.backgroundStage.backgroundVideo')"
            accept="video/*"
            :file-name="form.standard_background_video?.name"
            :has-existing-file="hasSavedAsset('standard_background_video')"
            @change="handleFileChange('standard_background_video', $event)"
            @clear="clearAssetField('standard_background_video')"
          />
          <!-- Drawn over the invitation whatever is behind it, so unlike
               the backdrop slot above these do not follow the mode — and
               they never followed the plan either, beyond it having been
               the only gate available. -->
          <div class="grid grid-cols-2 gap-2.5">
            <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.topDecoration')" accept="image/*" :file-name="form.top_decoration?.name" :has-existing-file="hasSavedAsset('top_decoration')" @change="handleFileChange('top_decoration', $event)" @clear="clearAssetField('top_decoration')" />
            <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.bottomDecoration')" accept="image/*" :file-name="form.bottom_decoration?.name" :has-existing-file="hasSavedAsset('bottom_decoration')" @change="handleFileChange('bottom_decoration', $event)" @clear="clearAssetField('bottom_decoration')" />
            <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.leftDecoration')" accept="image/*" :file-name="form.left_decoration?.name" :has-existing-file="hasSavedAsset('left_decoration')" @change="handleFileChange('left_decoration', $event)" @clear="clearAssetField('left_decoration')" />
            <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.rightDecoration')" accept="image/*" :file-name="form.right_decoration?.name" :has-existing-file="hasSavedAsset('right_decoration')" @change="handleFileChange('right_decoration', $event)" @clear="clearAssetField('right_decoration')" />
          </div>
        </section>

        <!-- How the content card itself is presented: how wide it sits and
             whether it wears the glass treatment. Both were under Cover
             Layout because both are stored inside `cover_stage_layout`, but
             what they change is this stage. The glass switch does also govern
             the cover's own glass panels (see CoverContentOverlay's
             displayLiquidGlass); it is one switch for both stages. -->
        <section :class="[PANEL, 'overflow-hidden']">
          <div class="p-4">
            <TemplateFormChoice
              v-model="contentWidthModel"
              :label="t('management.partnerTemplateForm.coverLayout.contentWidth')"
              :options="contentWidthOptions"
            />
          </div>
          <div class="border-t border-slate-100">
            <TemplateFormSwitch
              v-model="form.display_liquid_glass_background"
              :label="t('management.partnerTemplateForm.fields.liquidGlass')"
              :description="t('management.partnerTemplateForm.fields.liquidGlassHint')"
            />
          </div>
        </section>

        <!-- Who is inviting — the first block on the stage, and the first
             design decision here, because these sections are ordered to
             match MainContentStage's own render order: backdrop, then the
             card it draws on, then hosts, then the date, then the card
             under the date, then the schedule. A partner scrolling this
             panel is walking down the invitation. -->
        <!-- The design pickers, in one panel.
             Each was its own card carrying an uppercase eyebrow, a stack of
             full-width radio cards and a hint — three levels of chrome over
             one question, five times down the page, so scrolling this
             section read as five unrelated screens rather than as one walk
             down the invitation. They ask the same kind of question about
             consecutive blocks of one stage, so they are one panel
             whose hairlines keep that order legible. The eyebrow becomes
             the picker's own label, the same way every other field in this
             editor is named. -->
        <section :class="[PANEL, 'divide-y divide-slate-200/70']">
          <div class="p-4 space-y-2">
            <TemplateFormChoice
              v-model="hostInfoDesignModel"
              :label="t('management.partnerTemplateForm.hostInfoDesign.sectionTitle')"
              :options="hostInfoDesignOptions"
              :columns="1"
            />
            <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.hostInfoDesign.designHint') }}</p>

            <!-- What the block shows. Both switches are stored in
                 cover_stage_layout, which is how they came to sit under
                 Cover — a stage that draws neither. The welcome header
                 collapses away on `crest`, whose invitation sentence holds
                 that slot. The host name belongs to the birthday layout,
                 which reads none of these designs, so it never collapses. -->
            <div class="list-group">
              <TemplateFormDisclosure :open="hostDesignHasWelcomeHeader" content-class="">
                <TemplateFormSwitch
                  v-model="form.cover_stage_layout.showWelcomeHeaderText"
                  :label="t('management.partnerTemplateForm.coverLayout.showWelcomeHeaderText')"
                  :description="t('management.partnerTemplateForm.coverLayout.showWelcomeHeaderTextHint')"
                />
              </TemplateFormDisclosure>
              <TemplateFormSwitch
                v-model="form.cover_stage_layout.showHostNameUnderLogo"
                :label="t('management.partnerTemplateForm.coverLayout.showHostNameUnderLogo')"
                :description="t('management.partnerTemplateForm.coverLayout.showHostNameUnderLogoHint')"
              />
              <!-- `simple` is the one design whose names are the cover's
                   names block laid out again, so it is the one that can
                   borrow that block's settings rather than keep its own.
                   Off keeps its own look; nothing is backfilled. -->
              <TemplateFormDisclosure :open="form.host_info_design_type === 'simple'" content-class="">
                <TemplateFormSwitch
                  v-model="form.host_sync_cover_names"
                  :label="t('management.partnerTemplateForm.hostInfoDesign.syncCoverNames')"
                  :description="t('management.partnerTemplateForm.hostInfoDesign.syncCoverNamesHint')"
                />
              </TemplateFormDisclosure>
            </div>

            <!-- The settings it borrows live under the cover's "Show host
                 names" switch, and that switch hides them while it is off —
                 so say where they are, with the way there, rather than let
                 the names follow settings the partner cannot find. -->
            <TemplateFormDisclosure
              :open="form.host_info_design_type === 'simple' && form.host_sync_cover_names && !form.cover_stage_layout.showCoverHosts"
              content-class="pt-1"
            >
              <div class="flex items-center gap-3 rounded-xl bg-slate-50 ring-1 ring-slate-200/70 p-2.5">
                <p class="flex-1 min-w-0 text-[0.6875rem] leading-snug text-slate-600">
                  {{ t('management.partnerTemplateForm.hostInfoDesign.syncCoverNamesOff') }}
                </p>
                <button type="button" :class="BTN_SECONDARY_SM" @click="selectSection('cover')">
                  {{ t('management.partnerTemplateForm.hostInfoDesign.openCover') }}
                </button>
              </div>
            </TemplateFormDisclosure>

            <!-- The frame is one choice drawn twice — around the title and
                 around the avatar — so the pair can never be mismatched. Only
                 the grid designs draw it: arch brings its own frames, and
                 simple and crest have no avatar to frame. -->
            <TemplateFormDisclosure :open="hostDesignHasFrames" content-class="space-y-3 pt-2">
              <TemplateFormChoice
                v-model="hostFrameStyleModel"
                :label="t('management.partnerTemplateForm.hostInfoDesign.frameLabel')"
                :options="hostFrameStyleOptions"
                :columns="1"
              />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.hostInfoDesign.frameHint') }}</p>
            </TemplateFormDisclosure>

            <!-- The motif is its own disclosure rather than a second row in
                 the frame's, because the two open on different designs: the
                 crest has no avatars to frame but it does have a gap between
                 the two names, which is the same question in the one place
                 that design has for it. -->
            <TemplateFormDisclosure :open="hostDesignHasOrnament" content-class="space-y-3 pt-2">
              <TemplateFormChoice
                v-model="hostCoupleOrnamentModel"
                :label="t('management.partnerTemplateForm.hostInfoDesign.ornamentLabel')"
                :options="hostCoupleOrnamentOptions"
                :columns="1"
              />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.hostInfoDesign.ornamentHint') }}</p>
            </TemplateFormDisclosure>

            <!-- The crest design's own controls: the breakline that closes
                 the block, and the two sizes plus the offset that place it.
                 None of them exist on any other design. -->
            <TemplateFormDisclosure
              :open="form.host_info_design_type === 'crest'"
              content-class="space-y-3 pt-2"
            >
              <TemplateFormChoice
                v-model="hostBreaklineStyleModel"
                :label="t('management.partnerTemplateForm.hostInfoDesign.breaklineLabel')"
                :options="hostBreaklineStyleOptions"
                :columns="1"
              />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.hostInfoDesign.breaklineHint') }}</p>

              <TemplateFormImageField
                :label="t('management.partnerTemplateForm.hostInfoDesign.breaklineImage')"
                :hint="t('management.partnerTemplateForm.hostInfoDesign.breaklineImageHint')"
                :upload-label="t('management.partnerTemplateForm.hostInfoDesign.breaklineImageUpload')"
                accept="image/png,image/svg+xml,image/*"
                :preview="hostDividerImageSrc"
                :file-name="form.host_divider_image?.name"
                @change="handleFileChange('host_divider_image', $event)"
                @clear="clearAssetField('host_divider_image')"
              />

              <TemplateFormNumber
                v-model="form.host_divider_scale"
                :label="t('management.partnerTemplateForm.hostInfoDesign.breaklineWidth')"
                :min="40"
                :max="200"
                :step="5"
                unit="%"
              />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.hostInfoDesign.breaklineWidthHint') }}</p>
            </TemplateFormDisclosure>

            <!-- Placement, and the one part of this panel that is not about
                 which design: every design starts somewhere, and the ones
                 that draw a logo can size it. So the offset is always on
                 show and only the logo size collapses away — on `simple`
                 and `arch`, which render no logo to size. -->
            <div class="pt-1 space-y-3">
              <TemplateFormDisclosure :open="hostDesignHasLogo">
                <TemplateFormNumber
                  v-model="form.host_logo_scale"
                  :label="t('management.partnerTemplateForm.hostInfoDesign.logoScale')"
                  :min="40"
                  :max="250"
                  :step="5"
                  unit="%"
                />
              </TemplateFormDisclosure>

              <TemplateFormNumber
                v-model="form.host_top_offset"
                :label="t('management.partnerTemplateForm.hostInfoDesign.topOffset')"
                :min="-4"
                :max="16"
                :step="0.25"
                unit="rem"
              />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.hostInfoDesign.placementHint') }}</p>
            </div>
          </div>

          <!-- Who the invitation is for: the invite text and the guest's
               name, between the hosts above and the date below — which is
               why it sits between their two pickers here. Off by default,
               because it is additive: a cover that already greets the guest
               by name does not want a second greeting under the hosts. -->
          <div class="p-4 space-y-2">
            <TemplateFormChoice
              v-model="guestInviteDesignModel"
              :label="t('management.partnerTemplateForm.guestInviteDesign.sectionTitle')"
              :options="guestInviteDesignOptions"
              :columns="1"
            />
            <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.guestInviteDesign.designHint') }}</p>

            <!-- Suggested, never done for the partner: when the cover no
                 longer names the guest and this is off, nothing on the
                 template says who it was sent to. One tap turns it on. -->
            <TemplateFormDisclosure :open="guestUnaddressed" content-class="pt-1">
              <div class="flex items-center gap-3 rounded-xl bg-slate-50 ring-1 ring-slate-200/70 p-2.5">
                <p class="flex-1 min-w-0 text-[0.6875rem] leading-snug text-slate-600">
                  {{ t('management.partnerTemplateForm.guestInviteDesign.coverHidesGuest') }}
                </p>
                <button
                  type="button"
                  :class="BTN_SECONDARY_SM"
                  @click="form.guest_invite_design_type = 'inscribed'"
                >
                  {{ t('management.partnerTemplateForm.guestInviteDesign.addHere') }}
                </button>
              </div>
            </TemplateFormDisclosure>
          </div>

          <div class="p-4 space-y-2">
            <TemplateFormChoice
              v-model="eventDetailsDesignModel"
              :label="t('management.partnerTemplateForm.eventDetailsDesign.sectionTitle')"
              :options="eventDetailsDesignOptions"
              :columns="1"
            />
            <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.eventDetailsDesign.designHint') }}</p>

            <!-- Every design but panel spends this on exactly one accent mark:
                 the calendar's circled day, the flanked rules, the arch
                 outline, the ticket perforation + stub numeral. -->
            <TemplateFormDisclosure
              :open="form.event_details_design_type !== 'panel'"
              content-class="space-y-3 pt-2"
            >
              <TemplateFormChoice
                v-model="eventDetailsMarkerColorSourceModel"
                :label="t('management.partnerTemplateForm.eventDetailsDesign.markerColorSource')"
                :options="eventDetailsMarkerColorOptions"
                variant="segmented"
              />
              <TemplateFormColor
                v-if="form.event_details_marker_color_source === 'custom'"
                v-model="form.event_details_marker_custom_color"
                :name="t('management.partnerTemplateForm.colorField.names.calendarMarker')"
                placeholder="#B3261E"
              />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.eventDetailsDesign.markerColorHint') }}</p>
            </TemplateFormDisclosure>
          </div>

          <!-- The other half of the date design above: whatever the date
               becomes, this is the block that sits under it (venue, map,
               countdown, RSVP). `engraved` is the set drawn in the same
               hairline language as the calendar / flanked / arch dates, so
               the two read as one sheet instead of type stacked on glass.
               `frosted` keeps the card, but in the material the guestbook
               and the gift page below it are already made of — `glass` was
               drawn before those and is the heavier of the two glasses. -->
          <div class="p-4 space-y-2">
            <TemplateFormChoice
              v-model="infoCardDesignModel"
              :label="t('management.partnerTemplateForm.infoCardDesign.sectionTitle')"
              :options="infoCardDesignOptions"
              :columns="1"
            />
            <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.infoCardDesign.designHint') }}</p>
          </div>

          <!-- The schedule under the invitation. Until this existed the
               agenda picked its look from the event's *category*, so a
               partner selling a wedding design and a birthday design shipped
               the same list in both and could change neither. The category
               still decides the wording (a funeral's is a Ceremony Schedule);
               this decides how it is drawn. -->
          <div class="p-4 space-y-2">
            <TemplateFormChoice
              v-model="agendaDesignModel"
              :label="t('management.partnerTemplateForm.agendaDesign.sectionTitle')"
              :options="agendaDesignOptions"
              :columns="1"
            />
            <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.agendaDesign.designHint') }}</p>
          </div>

          <!-- What the guest is asked to wear. Before this there was one
               composition, and its most common state was broken: a dress code
               carries a colour and an OPTIONAL photograph, and with no
               photograph the section drew a flat square of that colour with a
               generic person glyph over it. Every design here draws the
               garment instead, in the dress code's own colour — so this
               picker chooses a layout, never whether the block looks
               finished. -->
          <div class="p-4 space-y-2">
            <TemplateFormChoice
              v-model="dressCodeDesignModel"
              :label="t('management.partnerTemplateForm.dressCodeDesign.sectionTitle')"
              :options="dressCodeDesignOptions"
              :columns="1"
            />
            <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.dressCodeDesign.designHint') }}</p>
          </div>
        </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlignVerticalJustifyCenter,
  Award,
  Ban,
  Bookmark,
  CalendarDays,
  Church,
  CircleDashed,
  Clapperboard,
  Columns2,
  Crown,
  Diamond,
  Droplets,
  Feather,
  Flower2,
  Frame,
  GitCommitVertical,
  Heart,
  IdCard,
  Infinity as InfinityIcon,
  LayoutList,
  LayoutPanelTop,
  Maximize2,
  Milestone,
  Minimize2,
  Minus,
  PanelLeft,
  Palette,
  PenLine,
  RectangleHorizontal,
  Rows3,
  Snowflake,
  Sparkles,
  Spline,
  Square,
  Tag,
  Tent,
  Ticket,
  UserRound,
  Users,
  Waypoints,
} from 'lucide-vue-next'

import TemplateFormChoice from '../TemplateFormChoice.vue'
import TemplateFormColor from '../TemplateFormColor.vue'
import TemplateFormDisclosure from '../TemplateFormDisclosure.vue'
import TemplateFormImageField from '../TemplateFormImageField.vue'
import TemplateFormNumber from '../TemplateFormNumber.vue'
import TemplateFormSwitch from '../TemplateFormSwitch.vue'
import FileUploadField from '../PartnerTemplateFileField.vue'
import PlanRequiredNotice from '../TemplateFormPlanNotice.vue'
import { BTN_SECONDARY_SM, FIELD_HINT, PANEL, SECTION_HEADING } from '../templateUi'
import { enumModel } from '../formModels'
import { useTemplateEditor } from '../templateEditorContext'

/**
 * The invitation itself: the backdrop behind the card, the card's own treatment,
 * and every block drawn inside it — the date and venue, the host block, the
 * agenda and the dress code.
 *
 * In the order they stack on screen. The backdrop used to be its own rail entry,
 * which put the image and the thing it sits behind two clicks apart even though
 * both only ever show on this one stage.
 */
const { form, assets, selectSection } = useTemplateEditor()
const { hasSavedAsset, handleFileChange, clearAssetField, stagedImageSrc } = assets

const { t } = useI18n()

/** The crest's breakline art, on the three states every staged asset has. */
const hostDividerImageSrc = stagedImageSrc('host_divider_image')

const contentWidthOptions = computed(() => [
  { value: 'standard', label: t('management.partnerTemplateForm.coverLayout.contentWidthStandard'), icon: Minimize2 },
  { value: 'wide', label: t('management.partnerTemplateForm.coverLayout.contentWidthWide'), icon: Maximize2 },
])

const stageModeOptions = computed(() => [
  { value: 'animation', label: t('management.partnerTemplateForm.stageModes.animation'), icon: Sparkles },
  { value: 'video', label: t('management.partnerTemplateForm.stageModes.video'), icon: Clapperboard },
])

const eventDetailsDesignOptions = computed(() => [
  { value: 'panel', label: t('management.partnerTemplateForm.eventDetailsDesign.types.panel'), icon: LayoutPanelTop },
  { value: 'calendar', label: t('management.partnerTemplateForm.eventDetailsDesign.types.calendar'), icon: CalendarDays },
  { value: 'flanked', label: t('management.partnerTemplateForm.eventDetailsDesign.types.flanked'), icon: AlignVerticalJustifyCenter },
  { value: 'arch', label: t('management.partnerTemplateForm.eventDetailsDesign.types.arch'), icon: Church },
  { value: 'ticket', label: t('management.partnerTemplateForm.eventDetailsDesign.types.ticket'), icon: Ticket },
])

const eventDetailsMarkerColorOptions = computed(() => [
  { value: 'accent', label: t('management.partnerTemplateForm.eventDetailsDesign.sourceAccent') },
  { value: 'primary', label: t('management.partnerTemplateForm.eventDetailsDesign.sourcePrimary') },
  { value: 'secondary', label: t('management.partnerTemplateForm.eventDetailsDesign.sourceSecondary') },
  { value: 'custom', label: t('management.partnerTemplateForm.fallingEffect.sourceCustomShort') },
])

// portrait, arch and crest are wedding-only rearrangements of the host block;
// on any other event type they fall through to the standard layout.
const hostInfoDesignOptions = computed(() => [
  { value: 'standard', label: t('management.partnerTemplateForm.hostInfoDesign.types.standard'), icon: Users },
  { value: 'simple', label: t('management.partnerTemplateForm.hostInfoDesign.types.simple'), icon: UserRound },
  { value: 'portrait', label: t('management.partnerTemplateForm.hostInfoDesign.types.portrait'), icon: IdCard },
  { value: 'arch', label: t('management.partnerTemplateForm.hostInfoDesign.types.arch'), icon: Church },
  { value: 'crest', label: t('management.partnerTemplateForm.hostInfoDesign.types.crest'), icon: Crown },
])

// One choice, two renderings — the title's frame and the avatar's ring are a
// matched pair, so they are never selected independently. Drawn by the grid
// designs (standard, portrait); arch draws its own and simple has neither.
const hostFrameStyleOptions = computed(() => [
  { value: 'none', label: t('management.partnerTemplateForm.hostInfoDesign.frames.none'), icon: Ban },
  { value: 'banner', label: t('management.partnerTemplateForm.hostInfoDesign.frames.banner'), icon: RectangleHorizontal },
  { value: 'plaque', label: t('management.partnerTemplateForm.hostInfoDesign.frames.plaque'), icon: Square },
  { value: 'ribbon', label: t('management.partnerTemplateForm.hostInfoDesign.frames.ribbon'), icon: Bookmark },
  { value: 'laurel', label: t('management.partnerTemplateForm.hostInfoDesign.frames.laurel'), icon: Award },
])

// The motif in the centre column between the two hosts — beside their photos on
// the grid designs, between their names on crest.
const hostCoupleOrnamentOptions = computed(() => [
  { value: 'none', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.none'), icon: Ban },
  { value: 'heart', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.heart'), icon: Heart },
  { value: 'rings', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.rings'), icon: CircleDashed },
  { value: 'knot', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.knot'), icon: InfinityIcon },
  { value: 'bloom', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.bloom'), icon: Flower2 },
])

// The crest design's closing rule. A separate list from the centre motif above
// because the two answer different questions in different places — that one is
// the mark BETWEEN the hosts, this one is the rule UNDER them — and a template
// may carry both without them competing.
//
// There is deliberately no `custom` entry: a partner picking it before
// uploading anything would select a style that draws nothing. The upload is the
// switch instead — a file, once attached, is drawn in place of whichever of
// these is selected, and removing it reveals that choice again.
const hostBreaklineStyleOptions = computed(() => [
  { value: 'none', label: t('management.partnerTemplateForm.hostInfoDesign.breaklines.none'), icon: Ban },
  { value: 'rule', label: t('management.partnerTemplateForm.hostInfoDesign.breaklines.rule'), icon: Minus },
  { value: 'diamond', label: t('management.partnerTemplateForm.hostInfoDesign.breaklines.diamond'), icon: Diamond },
  { value: 'lotus', label: t('management.partnerTemplateForm.hostInfoDesign.breaklines.lotus'), icon: Flower2 },
  { value: 'flourish', label: t('management.partnerTemplateForm.hostInfoDesign.breaklines.flourish'), icon: Spline },
])

// Ordered by how much furniture each adds, which is also roughly how loud they
// are: `rail` leads because it is what every existing template renders, so the
// picker opens on no change. `stack` closes it — the only one with a surface of
// its own, and the birthday answer. The event's category still picks the header
// copy; none of these five knows what kind of event it is drawing.
const agendaDesignOptions = computed(() => [
  { value: 'rail', label: t('management.partnerTemplateForm.agendaDesign.types.rail'), icon: GitCommitVertical },
  { value: 'thread', label: t('management.partnerTemplateForm.agendaDesign.types.thread'), icon: Waypoints },
  { value: 'milestone', label: t('management.partnerTemplateForm.agendaDesign.types.milestone'), icon: Milestone },
  { value: 'ledger', label: t('management.partnerTemplateForm.agendaDesign.types.ledger'), icon: Rows3 },
  { value: 'stack', label: t('management.partnerTemplateForm.agendaDesign.types.stack'), icon: LayoutList },
])

const dressCodeDesignOptions = computed(() => [
  { value: 'portrait', label: t('management.partnerTemplateForm.dressCodeDesign.types.portrait'), icon: Columns2 },
  { value: 'atelier', label: t('management.partnerTemplateForm.dressCodeDesign.types.atelier'), icon: Frame },
  { value: 'spread', label: t('management.partnerTemplateForm.dressCodeDesign.types.spread'), icon: PanelLeft },
  { value: 'palette', label: t('management.partnerTemplateForm.dressCodeDesign.types.palette'), icon: Palette },
  { value: 'ledger', label: t('management.partnerTemplateForm.dressCodeDesign.types.ledger'), icon: Rows3 },
])

// Off leads, because it is the default and what every existing template is.
// The four then run from the most traditional to the most playful — the dotted
// line of a printed Khmer card, the tracked formal line, the reception's place
// card, the party's gift tag — which is also the order a partner would reach
// for them going from a wedding to a birthday.
const guestInviteDesignOptions = computed(() => [
  { value: 'none', label: t('management.partnerTemplateForm.guestInviteDesign.types.none'), icon: Ban },
  { value: 'inscribed', label: t('management.partnerTemplateForm.guestInviteDesign.types.inscribed'), icon: PenLine },
  { value: 'formal', label: t('management.partnerTemplateForm.guestInviteDesign.types.formal'), icon: Feather },
  { value: 'place_card', label: t('management.partnerTemplateForm.guestInviteDesign.types.place_card'), icon: Tent },
  { value: 'tag', label: t('management.partnerTemplateForm.guestInviteDesign.types.tag'), icon: Tag },
])

/**
 * The cover names nobody and neither does the invitation. Both of the cover's
 * rows count: its invite text is only drawn beside a name, so with the name
 * off the cover addresses no one even if that switch is on.
 */
const guestUnaddressed = computed(
  () =>
    form.guest_invite_design_type === 'none' &&
    form.cover_stage_layout.showCoverGuestName === false,
)

// The engraved option is built to sit under the calendar / flanked / arch date
// designs, which are drawn in the same hairline language. Under the panel or
// ticket designs it still renders, it just has nothing above it to rhyme with.
const infoCardDesignOptions = computed(() => [
  { value: 'glass', label: t('management.partnerTemplateForm.infoCardDesign.types.glass'), icon: Droplets },
  { value: 'frosted', label: t('management.partnerTemplateForm.infoCardDesign.types.frosted'), icon: Snowflake },
  { value: 'engraved', label: t('management.partnerTemplateForm.infoCardDesign.types.engraved'), icon: PenLine },
])

/**
 * Which of the two shared host-chrome pickers this design actually draws.
 *
 * They are not the same set, which is why they are two disclosures rather than
 * one: `arch` brings its own frames, `simple` has neither a title nor an
 * avatar, and `crest` has no avatars to frame — but it does have a gap between
 * its two names, which is the motif's slot on that design.
 */
const hostDesignHasFrames = computed(
  () => form.host_info_design_type === 'standard' || form.host_info_design_type === 'portrait',
)

const hostDesignHasOrnament = computed(
  () => hostDesignHasFrames.value || form.host_info_design_type === 'crest',
)

/**
 * Which designs draw a logo, and can therefore be asked how big it should be.
 * `simple` is a welcome header over two names and `arch` stages the couple's
 * portraits instead — neither has one, so the control collapses away rather
 * than offering a size for something that is not on screen.
 *
 * The same three designs as `hostDesignHasOrnament` today, and deliberately not
 * the same constant: one asks whether there is a gap between the hosts to put a
 * motif in, the other whether there is a logo on screen at all, and the next
 * design added will almost certainly answer them differently.
 */
const hostDesignHasLogo = computed(
  () => hostDesignHasFrames.value || form.host_info_design_type === 'crest',
)

/**
 * Every design opens on the welcome header except `crest`, where the invitation
 * sentence holds that slot and a greeting above it would be a second headline —
 * so the switch collapses away there rather than toggling nothing.
 */
const hostDesignHasWelcomeHeader = computed(() => form.host_info_design_type !== 'crest')

const contentWidthModel = enumModel(() => form.cover_stage_layout, 'contentWidth')
const backgroundModeModel = enumModel(() => form, 'stage_mode_background')
const eventDetailsDesignModel = enumModel(() => form, 'event_details_design_type')
const eventDetailsMarkerColorSourceModel = enumModel(
  () => form,
  'event_details_marker_color_source',
)
const hostInfoDesignModel = enumModel(() => form, 'host_info_design_type')
const hostFrameStyleModel = enumModel(() => form, 'host_frame_style')
const hostCoupleOrnamentModel = enumModel(() => form, 'host_couple_ornament')
const hostBreaklineStyleModel = enumModel(() => form, 'host_divider_style')
const agendaDesignModel = enumModel(() => form, 'agenda_design_type')
const dressCodeDesignModel = enumModel(() => form, 'dress_code_design_type')
const guestInviteDesignModel = enumModel(() => form, 'guest_invite_design_type')
const infoCardDesignModel = enumModel(() => form, 'info_card_design_type')
</script>
