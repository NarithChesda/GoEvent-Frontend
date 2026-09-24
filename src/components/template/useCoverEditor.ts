import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Ampersand,
  Ban,
  CalendarDays,
  CaseLower,
  Columns3,
  Flower2,
  Frame,
  Hash,
  CircleDashed,
  Heart,
  IdCard,
  Infinity as InfinityIcon,
  Move,
  PenLine,
  RectangleHorizontal,
  Rows3,
  BringToFront,
  SendToBack,
  Type,
} from 'lucide-vue-next'

import type {
  CoverElementBox,
  CoverElementBoxes,
  CoverElementColorSource,
  CoverElementId,
  CoverFontSlot,
  CoverHostArrangement,
  CoverLayoutMode,
  CoverStageLayout,
  CoverTextId,
  CoverTextStyle,
  EventTemplateLanguageFont,
  GuestFrameCorners,
} from '@/services/api'
import {
  COVER_BLOCK_TEXT,
  COVER_BOX_ELEMENT_IDS,
  COVER_ELEMENT_IDS,
  COVER_FONT_SLOT_VARS,
  COVER_HOST_COUNT_MAX,
  COVER_ROW_ELEMENT_IDS,
  COVER_SEPARATOR_SCALE_RANGE,
  COVER_TEXT_BLOCK,
  COVER_TEXT_IDS,
  COVER_TEXT_SCALE_RANGE,
  isCoverBoxElement,
  placeableCoverElementIds,
  resolveCoverElements,
  resolveCoverTextStyles,
  resolveGuestFrame,
  rowsToCoverElements,
  type ResolvedCoverElementBox,
} from '@/composables/showcase/useCoverStageLayout'

import type { TemplateFormSelectOption } from './TemplateFormSelect.vue'

import type { FormState } from './config'
import type { SectionId } from './templateEditorContext'
import { enumModel } from './formModels'
import type { TemplateAssets } from './useTemplateAssets'

/**
 * Everything the Cover panel edits: the gilding on the artwork, the guest-name
 * frame, which blocks the cover draws, how each of its seven texts is set, and
 * where every block sits.
 *
 * Outside the component because three of its values are not the panel's alone.
 * `selectedCoverElement` is a two-way binding with the live preview — the frame
 * is the primary placement editor and the panel is the numeric half of the same
 * control — and `onCoverLayoutChange`/`onCoverTextChange` are what the frame
 * reports a drag and a resize back through. `resolvedCoverText` is read by the
 * Brand panel too, which offers a metallic finish only for slots a cover text
 * actually renders in.
 */
export function useCoverEditor(
  form: FormState,
  assets: TemplateAssets,
  /** Which rail section is open — drag handles arm only while Cover is. */
  activeSection: Ref<SectionId>,
  /** The template's font rows, so the slot picker can name the faces each slot resolves to. */
  previewFonts: ComputedRef<EventTemplateLanguageFont[]>,
) {
  const { t } = useI18n()
  const { hasSavedAsset } = assets

  /** Whether the rare geometry disclosure is open. */
  const coverAdvancedOpen = ref(false)

  // ---------------------------------------------------------------------------
  // Cover gilding. Stored inside cover_stage_layout alongside the animation type
  // it belongs with, so it needs no field of its own on the template model.
  // ---------------------------------------------------------------------------
  const gildingIntensityOptions = computed(() => [
    { value: 'subtle', label: t('management.partnerTemplateForm.coverGilding.intensitySubtle') },
    { value: 'normal', label: t('management.partnerTemplateForm.coverGilding.intensityNormal') },
    { value: 'bright', label: t('management.partnerTemplateForm.coverGilding.intensityBright') },
  ])

  const gildingReliefOptions = computed(() => [
    { value: 'none', label: t('management.partnerTemplateForm.coverGilding.reliefNone') },
    { value: 'soft', label: t('management.partnerTemplateForm.coverGilding.reliefSoft') },
    { value: 'raised', label: t('management.partnerTemplateForm.coverGilding.reliefRaised') },
  ])

  const gildingReliefModel = enumModel(() => form.cover_stage_layout.coverGilding, 'decorationRelief')

  const gildingColorSourceOptions = computed(() => [
    { value: 'primary', label: t('management.partnerTemplateForm.ambientCreatures.sourcePrimary') },
    { value: 'secondary', label: t('management.partnerTemplateForm.coverGilding.sourceSecondary') },
    { value: 'accent', label: t('management.partnerTemplateForm.ambientCreatures.sourceAccent') },
    { value: 'custom', label: t('management.partnerTemplateForm.fallingEffect.sourceCustomShort') },
  ])

  const gildingIntensityModel = enumModel(() => form.cover_stage_layout.coverGilding, 'intensity')

  const gildingColorSourceModel = enumModel(() => form.cover_stage_layout.coverGilding, 'colorSource')

  // ---------------------------------------------------------------------------
  // Guest name frame.
  //
  // Switching style never touches the uploads: all three styles read the same
  // three asset slots (relabelled per style by CoverSection), so a partner can
  // try the one-piece look and go back to the 3-piece one with their artwork
  // intact. The corner board keeps its config for the same reason.
  // ---------------------------------------------------------------------------
  const guestFrameStyleModel = enumModel(() => form.cover_stage_layout.guestFrame, 'style')

  const guestFrameCornersModel = computed<GuestFrameCorners>({
    get: () => form.cover_stage_layout.guestFrame.corners,
    set: (value) => {
      // The grid emits a partial map; re-resolving fills any corner it left out so
      // the form's copy stays fully populated for the controls bound to it.
      form.cover_stage_layout.guestFrame = resolveGuestFrame({
        guestFrame: { ...form.cover_stage_layout.guestFrame, corners: value },
      } as Required<CoverStageLayout>)
    },
  })

  const guestFrameStyleOptions = computed(() => [
    { value: 'split', label: t('management.partnerTemplateForm.guestFrame.styles.split'), icon: Columns3 },
    { value: 'single', label: t('management.partnerTemplateForm.guestFrame.styles.single'), icon: RectangleHorizontal },
    { value: 'corners', label: t('management.partnerTemplateForm.guestFrame.styles.corners'), icon: Frame },
  ])

  /**
   * Whether a guest-frame slot will actually have art at render time — a file
   * picked in this session, or a saved one not staged for removal. The corner
   * board greys out sources that would draw nothing.
   */
  const hasGuestFrameSlot = (
    field: 'guest_title_frame_left' | 'guest_title_frame_right',
  ): boolean => !!form[field] || hasSavedAsset(field)

  // ---------------------------------------------------------------------------
  // Free placement of the cover blocks.
  //
  // The preview frame is the primary editor — drag a block there and it reports
  // the whole map back through `onCoverLayoutChange`. Everything below is the
  // numeric half of that: the same values, typed or nudged when a pointer can't
  // be precise enough at preview scale.
  // ---------------------------------------------------------------------------
  const selectedCoverElement = ref<CoverElementId | null>(null)

  const isFreeCoverLayout = computed(() => form.cover_stage_layout.layoutMode === 'free')

  /**
   * Handles only appear while the section that owns them is open. Leaving the
   * overlay armed after navigating to, say, Main Content would mean an invisible
   * sheet sitting over a preview nobody is trying to drag.
   *
   * Armed in rows mode too once a names-and-details block is on: those are placed
   * by box in both modes, and the preview is the only place a partner can see
   * where they are putting one.
   */
  const coverLayoutEditing = computed(
    () =>
      activeSection.value === 'cover' &&
      (isFreeCoverLayout.value || coverDetailsShown.value || form.cover_stage_layout.showCoverPhoto),
  )

  /**
   * The boxes as they'd render right now: whatever the template specifies, over
   * the geometry the row model would have produced. Same function the showcase
   * resolves with, so the numbers here and the ones on screen can't diverge.
   */
  const resolvedCoverElements = computed(() => resolveCoverElements(form.cover_stage_layout))

  const selectedCoverBox = computed<ResolvedCoverElementBox | null>(() =>
    selectedCoverElement.value ? resolvedCoverElements.value[selectedCoverElement.value] : null,
  )

  const layoutModeOptions = computed(() => [
    { value: 'rows', label: t('management.coverLayoutEditor.modes.rows'), icon: Rows3 },
    { value: 'free', label: t('management.coverLayoutEditor.modes.free'), icon: Move },
  ])

  const layoutModeModel = computed<string>({
    get: () => form.cover_stage_layout.layoutMode,
    set: (value) => {
      const mode = value as CoverLayoutMode
      // Seeding on the way in is what makes the switch non-destructive: free mode
      // starts as a pixel-identical copy of the rows the partner already tuned,
      // rather than a blank canvas they have to rebuild. Per block rather than
      // "if the map is empty": the names, date and venue are placed in rows mode
      // too, so the map can already hold them — and a row block that an earlier
      // free session left a box for keeps that box, as it always has.
      if (mode === 'free') {
        const current = form.cover_stage_layout.coverElements ?? {}
        const rows = rowsToCoverElements(form.cover_stage_layout)
        const next: CoverElementBoxes = { ...current }
        for (const id of COVER_ROW_ELEMENT_IDS) next[id] = current[id] ?? rows[id]
        form.cover_stage_layout.coverElements = next
      }
      form.cover_stage_layout.layoutMode = mode
      // A box block stays selectable in rows mode; a row block does not.
      const selected = selectedCoverElement.value
      if (mode !== 'free' && selected && !isCoverBoxElement(selected)) selectedCoverElement.value = null
    },
  })

  /** The switch that puts each block on the cover. */
  const COVER_BLOCK_SWITCH = {
    header: 'showCoverHeaderText',
    logo: 'showCoverLogo',
    photo: 'showCoverPhoto',
    invite: 'showCoverInviteText',
    guest: 'showCoverGuestName',
    hosts: 'showCoverHosts',
    date: 'showCoverDate',
    location: 'showCoverLocation',
  } as const satisfies Record<CoverElementId, keyof CoverStageLayout>

  /**
   * Which blocks are on the cover at all — the preview frame's
   * `coverElementVisibility`, minus its guest-name gate, which no template setting
   * controls. A block that is switched off has nothing to place.
   */
  const coverBlockShown = computed(
    () =>
      Object.fromEntries(
        COVER_ELEMENT_IDS.map((id) => [id, form.cover_stage_layout[COVER_BLOCK_SWITCH[id]]]),
      ) as Record<CoverElementId, boolean>,
  )

  function setCoverBlockShown(id: CoverElementId, shown: boolean): void {
    form.cover_stage_layout[COVER_BLOCK_SWITCH[id]] = shown
  }

  /**
   * Free mode lists every block, greying the ones switched off, as it always has.
   * Rows mode lists only the box blocks that are on (the photo frame and the
   * details) — the row blocks are placed by the row numbers there, and a greyed
   * chip for a block the partner never asked for would only be noise.
   */
  const coverBlockChips = computed(() => {
    const ids = isFreeCoverLayout.value
      ? COVER_ELEMENT_IDS
      : COVER_BOX_ELEMENT_IDS.filter((id) => coverBlockShown.value[id])
    return ids.map((id) => ({
      id,
      label: t(`management.coverLayoutEditor.blocks.${id}`),
      available: coverBlockShown.value[id],
    }))
  })

  function selectCoverElement(id: CoverElementId): void {
    selectedCoverElement.value = selectedCoverElement.value === id ? null : id
  }

  // Switching off the selected block would leave its fields on screen, editing a
  // box nothing draws — the preview has already dropped its handles.
  watch(
    () => {
      const id = selectedCoverElement.value
      return id !== null && !coverBlockShown.value[id]
    },
    (hidden) => {
      if (hidden) selectedCoverElement.value = null
    },
  )

  /**
   * Writes one block and persists every block this mode places.
   *
   * Storing the complete map rather than just the edited block matters for what
   * the template does later: a half-specified `coverElements` leaves the other
   * blocks implicitly tied to the row numbers, so editing an unrelated row height
   * months later would silently move them.
   *
   * In rows mode that map is only the detail blocks, merged over whatever else is
   * stored: the row blocks' resolved boxes there are their ROW geometry, and
   * writing it would freeze them against the next row-height edit.
   */
  function updateCoverBox(id: CoverElementId, patch: Partial<CoverElementBox>): void {
    const next: CoverElementBoxes = { ...(form.cover_stage_layout.coverElements ?? {}) }
    for (const key of placeableCoverElementIds(form.cover_stage_layout.layoutMode)) {
      next[key] =
        key === id
          ? { ...resolvedCoverElements.value[key], ...patch }
          : { ...resolvedCoverElements.value[key] }
    }
    form.cover_stage_layout.coverElements = next
  }

  function coverBoxModel(field: 'x' | 'y' | 'width' | 'height') {
    return computed<number>({
      get: () => selectedCoverBox.value?.[field] ?? 0,
      set: (value) => {
        const id = selectedCoverElement.value
        if (id) updateCoverBox(id, { [field]: value })
      },
    })
  }

  const coverBoxX = coverBoxModel('x')
  const coverBoxY = coverBoxModel('y')
  const coverBoxWidth = coverBoxModel('width')
  const coverBoxHeight = coverBoxModel('height')

  /**
   * `auto` is the unset state, and it is not the same as picking the slot the
   * block happens to use today: unset means "keep following whatever rule this
   * block has always followed", which for the guest name includes the Great Vibes
   * override for Latin names. Storing `undefined` keeps that rule intact;
   * storing `primary` deliberately overrides it.
   */
  const COVER_SLOT_AUTO = 'auto'

  /**
   * The fonts a cover text can be set in: the template's own slots, each labelled
   * with what it holds ("Primary · Cormorant Garamond / Kantumruy Pro"), since a
   * slot name alone says nothing about how the text will look. One name per
   * language the slot is filled in — the text follows the showcase's language,
   * so a partner is choosing all of them at once.
   *
   * Driven by `COVER_FONT_SLOT_VARS`, not by `FONT_TYPE_LABELS`. The two lists
   * used to be the same four values, but `font_type` gained the scroll-story
   * slots (`v2-body`, `v2-display`) and the cover stage publishes no CSS variable
   * for those — a text pointed at one would inherit nothing and render in no font
   * at all. Reading the slot-variable map means the picker can only ever offer
   * slots that actually resolve.
   */
  const coverTextFontOptions = computed<TemplateFormSelectOption[]>(() => [
    { value: COVER_SLOT_AUTO, label: t('management.coverLayoutEditor.fontTypes.auto') },
    ...(Object.keys(COVER_FONT_SLOT_VARS) as CoverFontSlot[]).map((slot) => {
      const names = [
        ...new Set(
          previewFonts.value
            .filter((row) => row.font_type === slot && row.font?.name)
            .map((row) => row.font!.name),
        ),
      ]
      const slotLabel = t(`management.coverLayoutEditor.fontTypes.${slot}`)
      return {
        value: slot,
        label: names.length
          ? `${slotLabel} · ${names.join(' / ')}`
          : t('management.partnerTemplateForm.coverText.slotEmpty', { slot: slotLabel }),
      }
    }),
  ])

  const coverColorSourceOptions = computed<TemplateFormSelectOption[]>(() => [
    { value: COVER_SLOT_AUTO, label: t('management.coverLayoutEditor.colorSources.auto') },
    ...(['primary', 'secondary', 'accent', 'guestname', 'custom'] as CoverElementColorSource[]).map(
      (source) => ({
        value: source,
        label: t(`management.coverLayoutEditor.colorSources.${source}`),
      }),
    ),
  ])

  /**
   * Whether a block's colour can be set: it has text, and it is placed by box in
   * this mode. The colour lives on the box, and in rows mode the header, invite
   * line and guest name have none — they are laid out by the row numbers, and
   * writing them a box would freeze that geometry against the next row edit.
   */
  const coverBlockColorEditable = (id: CoverElementId): boolean =>
    COVER_BLOCK_TEXT[id] !== null &&
    placeableCoverElementIds(form.cover_stage_layout.layoutMode).includes(id)

  const coverBlockColorSource = (id: CoverElementId): string =>
    resolvedCoverElements.value[id].colorSource ?? COVER_SLOT_AUTO

  function setCoverBlockColorSource(id: CoverElementId, value: string | number): void {
    const source = value === COVER_SLOT_AUTO ? undefined : (value as CoverElementColorSource)
    updateCoverBox(id, {
      colorSource: source,
      // Seed the picker with something visible rather than an empty swatch the
      // partner has to notice is empty before the colour can change at all.
      ...(source === 'custom' && !resolvedCoverElements.value[id].customColor
        ? { customColor: '#FFFFFF' }
        : {}),
    })
  }

  const coverBlockCustomColor = (id: CoverElementId): string =>
    resolvedCoverElements.value[id].customColor ?? '#FFFFFF'

  function setCoverBlockCustomColor(id: CoverElementId, value: string): void {
    updateCoverBox(id, { customColor: value })
  }

  /**
   * Puts one block back where the row model would have put it.
   *
   * Geometry only. The colour is set beside the block's switch, not in the
   * placement panel this button sits in, so a reset here must not undo it — the
   * patch merges onto the block's current resolved values, which carries the
   * colour through. `fontType` is named with an explicit `undefined` because the
   * row model's own boxes never had one, and omitting the key would leave a
   * legacy slot on the box untouched.
   */
  function resetSelectedCoverBlock(): void {
    const id = selectedCoverElement.value
    if (!id) return
    updateCoverBox(id, {
      ...rowsToCoverElements(form.cover_stage_layout)[id],
      fontType: undefined,
    })
  }

  /**
   * Drops every hand-placed box this mode lists, which is also what makes "reset"
   * a real reset: the blocks go back to tracking the row numbers rather than to a
   * frozen copy of them.
   *
   * A block with a colour keeps a box at its seeded geometry, carrying only that
   * colour — for the reason `resetSelectedCoverBlock` gives. Rows mode resets
   * what it lists, the detail blocks, and leaves the row blocks' remembered free
   * positions for the next switch back to free.
   */
  function resetAllCoverBlocks(): void {
    const stored = form.cover_stage_layout.coverElements ?? {}
    const seeds = rowsToCoverElements(form.cover_stage_layout)
    const next: CoverElementBoxes = { ...stored }
    for (const id of placeableCoverElementIds(form.cover_stage_layout.layoutMode)) {
      const { colorSource, customColor } = stored[id] ?? {}
      if (colorSource) next[id] = { ...seeds[id], colorSource, ...(customColor ? { customColor } : {}) }
      else delete next[id]
    }
    form.cover_stage_layout.coverElements = next
    selectedCoverElement.value = null
  }

  /**
   * A block was dragged or resized in the preview frame. Merged, not assigned:
   * in rows mode the frame reports only the detail blocks.
   */
  function onCoverLayoutChange(elements: CoverElementBoxes): void {
    form.cover_stage_layout.coverElements = {
      ...(form.cover_stage_layout.coverElements ?? {}),
      ...elements,
    }
  }

  // ---------------------------------------------------------------------------
  // Text styles — font slot and size per text, in `coverText`.
  // ---------------------------------------------------------------------------

  /** Every text's style as it renders now, box fallbacks included. */
  const resolvedCoverText = computed(() => resolveCoverTextStyles(form.cover_stage_layout))

  /**
   * The copy for each block's switch, under `management.partnerTemplateForm`.
   * The hint is the same key with `Hint` appended. The row blocks' switches were
   * written under `coverLayout`, the names-and-details ones under `coverDetails`.
   */
  const COVER_BLOCK_SWITCH_COPY: Record<CoverElementId, string> = {
    header: 'coverLayout.showCoverHeaderText',
    logo: 'coverLayout.showCoverLogo',
    photo: 'coverPhoto.show',
    invite: 'coverLayout.showCoverInviteText',
    guest: 'coverLayout.showCoverGuestName',
    hosts: 'coverDetails.showHosts',
    date: 'coverDetails.showDate',
    location: 'coverDetails.showLocation',
  }

  /**
   * Everything on the cover, in the order the cover draws it — one switch each,
   * opening that block's own settings and then its type.
   *
   * `texts` is the block's texts (two for the names while "Under each name" draws
   * something, one for every other text block, none for the logo). It does NOT
   * follow the block's own switch, even though a text switched off has nothing to
   * style: the disclosure already hides it, and emptying the list at the same
   * moment would drop the type rows out from under the collapse while it plays.
   * A lone text's font field is labelled "Font"; the names' two are labelled by
   * text, since "Font" twice would not say which is which.
   */
  const coverBlocks = computed(() =>
    COVER_ELEMENT_IDS.map((id) => {
      const texts = COVER_TEXT_IDS.filter(
        (text) =>
          COVER_TEXT_BLOCK[text] === id &&
          (text !== 'hostSubline' || form.cover_stage_layout.coverDetails.hostSubline !== 'none'),
      )
      const copy = COVER_BLOCK_SWITCH_COPY[id]
      return {
        id,
        shown: coverBlockShown.value[id],
        label: t(`management.partnerTemplateForm.${copy}`),
        hint: t(`management.partnerTemplateForm.${copy}Hint`),
        texts: texts.map((text) => ({
          id: text,
          label:
            texts.length > 1
              ? t(`management.partnerTemplateForm.coverText.texts.${text}`)
              : t('management.coverLayoutEditor.fields.fontType'),
        })),
        colorEditable: coverBlockColorEditable(id),
      }
    }),
  )

  const coverTextFont = (id: CoverTextId): string =>
    resolvedCoverText.value[id].fontType ?? COVER_SLOT_AUTO

  // Stored as a multiplier, edited as a percentage — "120%" reads as a size, "1.2"
  // reads as an implementation detail.
  const coverTextSize = (id: CoverTextId): number =>
    Math.round(resolvedCoverText.value[id].fontScale * 100)

  /**
   * Writes one text's whole style, and takes the type off its block's box.
   *
   * The whole style, because the entry replaces what the text resolved to —
   * including a slot it was only inheriting from its box, which must survive a
   * resize. And off the box, because the box is only the FALLBACK
   * (resolveCoverTextStyles): left there, picking "Default" would fall straight
   * back to the box's old slot and appear to do nothing. The box is only touched
   * if it is already stored, so this never creates one — which would pin a row
   * block's geometry.
   */
  function writeCoverText(id: CoverTextId, style: CoverTextStyle): void {
    const layout = form.cover_stage_layout
    layout.coverText = { ...(layout.coverText ?? {}), [id]: style }

    const block = COVER_TEXT_BLOCK[id]
    const box = layout.coverElements?.[block]
    if (COVER_BLOCK_TEXT[block] === id && box && (box.fontType || box.fontScale !== undefined)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { fontType, fontScale, ...rest } = box
      layout.coverElements = { ...layout.coverElements, [block]: rest }
    }
  }

  function setCoverTextFont(id: CoverTextId, value: string | number): void {
    const current = resolvedCoverText.value[id]
    const slot = value === COVER_SLOT_AUTO ? undefined : (value as CoverFontSlot)
    writeCoverText(id, { ...(slot ? { fontType: slot } : {}), fontScale: current.fontScale })
  }

  function setCoverTextSize(id: CoverTextId, percent: number): void {
    const current = resolvedCoverText.value[id]
    const fontScale = Math.min(
      COVER_TEXT_SCALE_RANGE.max,
      Math.max(COVER_TEXT_SCALE_RANGE.min, percent / 100),
    )
    writeCoverText(id, { ...(current.fontType ? { fontType: current.fontType } : {}), fontScale })
  }

  /** The preview's A−/A+ resized a text; the frame sends its whole style. */
  function onCoverTextChange(id: CoverTextId, style: CoverTextStyle): void {
    writeCoverText(id, style)
  }

  // ---------------------------------------------------------------------------
  // The names-and-details composition's own settings. Placement is above, with
  // every other block's; everything here is how the three draw.
  // ---------------------------------------------------------------------------
  const coverDetailsShown = computed(
    () =>
      form.cover_stage_layout.showCoverHosts ||
      form.cover_stage_layout.showCoverDate ||
      form.cover_stage_layout.showCoverLocation,
  )

  /** The row blocks this composition lands on top of, still switched on. */
  const coverRowsCompeting = computed(
    () =>
      coverDetailsShown.value &&
      (form.cover_stage_layout.showCoverLogo ||
        form.cover_stage_layout.showCoverInviteText ||
        form.cover_stage_layout.showCoverGuestName),
  )

  /**
   * The header is deliberately left alone: on the reference card it is the line
   * that opens the invitation above the names ("You are invited to the wedding
   * of"), and the default placement leaves its row clear for exactly that.
   */
  function hideCompetingCoverBlocks(): void {
    form.cover_stage_layout.showCoverLogo = false
    form.cover_stage_layout.showCoverInviteText = false
    form.cover_stage_layout.showCoverGuestName = false
  }

  const COVER_HOST_COUNT_ALL = 'all'

  const coverHostCountOptions = computed<TemplateFormSelectOption[]>(() => [
    { value: COVER_HOST_COUNT_ALL, label: t('management.partnerTemplateForm.coverDetails.hostCountAll') },
    ...Array.from({ length: COVER_HOST_COUNT_MAX }, (_, i) => ({
      value: String(i + 1),
      label: t('management.partnerTemplateForm.coverDetails.hostCountN', { n: i + 1 }),
    })),
  ])

  const coverHostCountModel = computed<string>({
    get: () => {
      const count = form.cover_stage_layout.coverDetails.hostCount
      return count ? String(count) : COVER_HOST_COUNT_ALL
    },
    set: (value) => {
      form.cover_stage_layout.coverDetails.hostCount =
        value === COVER_HOST_COUNT_ALL ? null : Number(value)
    },
  })

  const coverHostArrangementOptions = computed(() =>
    (['stacked', 'inline'] as CoverHostArrangement[]).map((value) => ({
      value,
      label: t(`management.partnerTemplateForm.coverDetails.arrangements.${value}`),
    })),
  )

  const coverHostArrangementModel = enumModel(() => form.cover_stage_layout.coverDetails, 'hostArrangement')

  const coverHostSublineOptions = computed(() => [
    { value: 'none', label: t('management.partnerTemplateForm.coverDetails.sublines.none'), icon: Ban },
    { value: 'surname', label: t('management.partnerTemplateForm.coverDetails.sublines.surname'), icon: Type },
    { value: 'title', label: t('management.partnerTemplateForm.coverDetails.sublines.title'), icon: IdCard },
  ])

  const coverHostSublineModel = enumModel(() => form.cover_stage_layout.coverDetails, 'hostSubline')

  // The four drawn motifs keep the names the host block's centre ornament gives
  // them, so a partner who picked "Knot" there finds the same word here.
  const coverSeparatorOptions = computed(() => [
    { value: 'ampersand', label: t('management.partnerTemplateForm.coverDetails.separators.ampersand'), icon: Ampersand },
    { value: 'word', label: t('management.partnerTemplateForm.coverDetails.separators.word'), icon: CaseLower },
    { value: 'heart', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.heart'), icon: Heart },
    { value: 'rings', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.rings'), icon: CircleDashed },
    { value: 'knot', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.knot'), icon: InfinityIcon },
    { value: 'bloom', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.bloom'), icon: Flower2 },
    { value: 'none', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.none'), icon: Ban },
  ])

  const coverSeparatorModel = enumModel(() => form.cover_stage_layout.coverDetails, 'separator')

  // No "default" entry, unlike the blocks' own colour picker: the mark has no
  // older rule to fall back to, so its default is simply the accent it starts on.
  const coverSeparatorColorOptions = computed<TemplateFormSelectOption[]>(() =>
    (['primary', 'secondary', 'accent', 'guestname', 'custom'] as CoverElementColorSource[]).map(
      (source) => ({
        value: source,
        label: t(`management.coverLayoutEditor.colorSources.${source}`),
      }),
    ),
  )

  const coverSeparatorColorModel = computed<string>({
    get: () => form.cover_stage_layout.coverDetails.separatorColorSource,
    set: (value) => {
      const details = form.cover_stage_layout.coverDetails
      details.separatorColorSource = value as CoverElementColorSource
      // Seed the picker with something visible, as the blocks' own custom colour does.
      if (value === 'custom' && !details.separatorCustomColor) details.separatorCustomColor = '#C9A45C'
    },
  })

  // Stored as a multiplier, edited as a percentage, like the blocks' text size.
  const coverSeparatorScaleModel = computed<number>({
    get: () => Math.round(form.cover_stage_layout.coverDetails.separatorScale * 100),
    set: (value) => {
      form.cover_stage_layout.coverDetails.separatorScale = Math.min(
        COVER_SEPARATOR_SCALE_RANGE.max,
        Math.max(COVER_SEPARATOR_SCALE_RANGE.min, value / 100),
      )
    },
  })

  const coverDateFormatOptions = computed(() => [
    { value: 'numeric', label: t('management.partnerTemplateForm.coverDetails.dateFormats.numeric'), icon: Hash },
    { value: 'long', label: t('management.partnerTemplateForm.coverDetails.dateFormats.long'), icon: CalendarDays },
    { value: 'text', label: t('management.partnerTemplateForm.coverDetails.dateFormats.text'), icon: PenLine },
  ])

  const coverDateFormatModel = enumModel(() => form.cover_stage_layout.coverDetails, 'dateFormat')

  // ---------------------------------------------------------------------------
  // The photo frame's own settings. Placement is above, with every other
  // block's; which photograph fills it, and how it is framed, is the organizer's
  // choice in their own studio, not the template's.
  // ---------------------------------------------------------------------------
  const coverPhotoFrameLayerOptions = computed(() => [
    { value: 'under', label: t('management.partnerTemplateForm.coverPhoto.layers.under'), icon: SendToBack },
    { value: 'over', label: t('management.partnerTemplateForm.coverPhoto.layers.over'), icon: BringToFront },
  ])

  const coverPhotoFrameLayerModel = enumModel(() => form.cover_stage_layout.coverPhoto, 'frameLayer')

  /** Whether an image will be there at render time: picked now, or saved and not staged for removal. */
  const hasCoverArt = (
    field: 'cover_photo_frame_image' | 'cover_photo_shape_image' | 'sample_logo_2',
  ): boolean => !!form[field] || hasSavedAsset(field)

  /**
   * The frame is still drawn from the sample-logo pair — the same rule the cover
   * applies (coverPhotoArt): neither image of its own, and a sample logo 2.
   * Said in the panel, because otherwise two empty upload slots sit above a
   * frame that is plainly drawing something.
   */
  const coverPhotoUsesSampleLogos = computed(
    () =>
      !hasCoverArt('cover_photo_frame_image') &&
      !hasCoverArt('cover_photo_shape_image') &&
      hasCoverArt('sample_logo_2'),
  )

  /**
   * The frame is on, still where it starts — on the logo row, because that is
   * where a card's centrepiece goes — and the logo is on too, so the two draw
   * over each other. Said, with the one-tap way out, rather than done: the same
   * courtesy the names-and-details composition extends.
   */
  const coverPhotoOverLogo = computed(
    () =>
      form.cover_stage_layout.showCoverPhoto &&
      form.cover_stage_layout.showCoverLogo &&
      !form.cover_stage_layout.coverElements?.photo,
  )

  function hideLogoForPhoto(): void {
    form.cover_stage_layout.showCoverLogo = false
  }

  return {
    coverAdvancedOpen,
    // Whether the preview frame should arm its drag handles.
    coverLayoutEditing,
    // Gilding
    gildingIntensityOptions,
    gildingIntensityModel,
    gildingReliefOptions,
    gildingReliefModel,
    gildingColorSourceOptions,
    gildingColorSourceModel,
    // Guest name frame
    guestFrameStyleOptions,
    guestFrameStyleModel,
    guestFrameCornersModel,
    hasGuestFrameSlot,
    // Block placement. `selectedCoverElement` and the two change handlers are
    // shared with the live preview frame, which is the primary drag editor.
    selectedCoverElement,
    isFreeCoverLayout,
    layoutModeOptions,
    layoutModeModel,
    selectedCoverBox,
    coverBlockChips,
    selectCoverElement,
    setCoverBlockShown,
    coverBoxX,
    coverBoxY,
    coverBoxWidth,
    coverBoxHeight,
    coverBlockColorSource,
    setCoverBlockColorSource,
    coverBlockCustomColor,
    setCoverBlockCustomColor,
    coverColorSourceOptions,
    resetSelectedCoverBlock,
    resetAllCoverBlocks,
    onCoverLayoutChange,
    // Per-text type. `resolvedCoverText` is read by the Brand panel too.
    resolvedCoverText,
    coverBlocks,
    coverTextFont,
    coverTextFontOptions,
    setCoverTextFont,
    coverTextSize,
    setCoverTextSize,
    onCoverTextChange,
    // The names, date and venue composition
    coverDetailsShown,
    coverRowsCompeting,
    hideCompetingCoverBlocks,
    coverHostCountOptions,
    coverHostCountModel,
    coverHostArrangementOptions,
    coverHostArrangementModel,
    coverHostSublineOptions,
    coverHostSublineModel,
    coverSeparatorOptions,
    coverSeparatorModel,
    coverSeparatorColorOptions,
    coverSeparatorColorModel,
    coverSeparatorScaleModel,
    coverDateFormatOptions,
    coverDateFormatModel,
    // The photo frame
    coverPhotoFrameLayerOptions,
    coverPhotoFrameLayerModel,
    coverPhotoUsesSampleLogos,
    coverPhotoOverLogo,
    hideLogoForPhoto,
  }
}

export type CoverEditor = ReturnType<typeof useCoverEditor>
