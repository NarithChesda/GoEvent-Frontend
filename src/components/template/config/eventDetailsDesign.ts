import type {
  EventDetailsCalendarStyle,
  EventDetailsDesignConfig,
  EventDetailsDesignType,
  EventDetailsMarkerColorSource,
  PartnerTemplate,
} from '@/services/api'
import {
  resolveCalendarCardColor,
  resolveCalendarCardRadius,
  resolveCalendarStyle,
} from '@/components/showcase/calendar-designs/calendarModel'

export interface EventDetailsDesignFormState {
  /** Date/location block design rendered in the showcase (panel | calendar). */
  event_details_design_type: EventDetailsDesignType
  /** Colour slot for the calendar design's event-day marker (calendar only). */
  event_details_marker_color_source: EventDetailsMarkerColorSource
  /** Hex colour used when the marker colour source is 'custom'. */
  event_details_marker_custom_color: string
  /** Which calendar the `calendar` design draws (calendar only). */
  event_details_calendar_style: EventDetailsCalendarStyle
  /** Corner radius of the `card` calendar, in px (card style only). */
  event_details_calendar_card_radius: number
  /** Paper colour of the card calendar, hex (card style only). */
  event_details_calendar_card_color: string
}

export const defaultEventDetailsDesign = (): EventDetailsDesignFormState => ({
  event_details_design_type: 'panel',
  event_details_marker_color_source: 'accent',
  event_details_marker_custom_color: '#B3261E',
  event_details_calendar_style: 'classic',
  event_details_calendar_card_radius: 0,
  event_details_calendar_card_color: '#FFFFFF',
})

export function hydrateEventDetailsDesign(
  template: PartnerTemplate | null,
): EventDetailsDesignFormState {
  const design = template?.event_details_design
  return {
    event_details_design_type: design?.type ?? 'panel',
    event_details_marker_color_source: design?.marker_color_source ?? 'accent',
    event_details_marker_custom_color: design?.marker_custom_color ?? '#B3261E',
    // Resolved the way the showcase resolves it, so a style this build doesn't
    // draw opens as the `classic` it renders — and a save writes that back.
    event_details_calendar_style: resolveCalendarStyle(design?.calendar_style),
    event_details_calendar_card_radius: resolveCalendarCardRadius(design?.calendar_card_radius),
    event_details_calendar_card_color: resolveCalendarCardColor(design?.calendar_card_color),
  }
}

/**
 * The marker colour only drives the calendar design, so the panel design sends
 * just its type — nothing stale to interpret if the template switches back.
 *
 * `calendar_style` goes only on the calendar design, and only when it is not
 * `classic`. Absent already means `classic`, so every calendar template saved
 * before the key existed keeps sending exactly the payload it always sent —
 * which matters, because the backend doc allows a strict validator to refuse
 * keys it doesn't know.
 */
export function buildEventDetailsDesignPayload(
  state: EventDetailsDesignFormState,
): EventDetailsDesignConfig {
  const cfg: EventDetailsDesignConfig = { type: state.event_details_design_type }
  if (state.event_details_design_type === 'panel') return cfg

  cfg.marker_color_source = state.event_details_marker_color_source
  if (state.event_details_marker_color_source === 'custom') {
    cfg.marker_custom_color = state.event_details_marker_custom_color
  }
  if (
    state.event_details_design_type === 'calendar' &&
    state.event_details_calendar_style !== 'classic'
  ) {
    cfg.calendar_style = state.event_details_calendar_style
    // Only the card has corners of its own to round.
    if (state.event_details_calendar_style === 'card') {
      cfg.calendar_card_radius = resolveCalendarCardRadius(
        state.event_details_calendar_card_radius,
      )
      // A half-typed hex in the field saves as white, which is what renders.
      cfg.calendar_card_color = resolveCalendarCardColor(state.event_details_calendar_card_color)
    }
  }
  return cfg
}
