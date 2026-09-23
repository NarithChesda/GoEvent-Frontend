import type {
  EventDetailsDesignConfig,
  EventDetailsDesignType,
  EventDetailsMarkerColorSource,
  PartnerTemplate,
} from '@/services/api'

export interface EventDetailsDesignFormState {
  /** Date/location block design rendered in the showcase (panel | calendar). */
  event_details_design_type: EventDetailsDesignType
  /** Colour slot for the calendar design's event-day marker (calendar only). */
  event_details_marker_color_source: EventDetailsMarkerColorSource
  /** Hex colour used when the marker colour source is 'custom'. */
  event_details_marker_custom_color: string
}

export const defaultEventDetailsDesign = (): EventDetailsDesignFormState => ({
  event_details_design_type: 'panel',
  event_details_marker_color_source: 'accent',
  event_details_marker_custom_color: '#B3261E',
})

export function hydrateEventDetailsDesign(
  template: PartnerTemplate | null,
): EventDetailsDesignFormState {
  const design = template?.event_details_design
  return {
    event_details_design_type: design?.type ?? 'panel',
    event_details_marker_color_source: design?.marker_color_source ?? 'accent',
    event_details_marker_custom_color: design?.marker_custom_color ?? '#B3261E',
  }
}

/**
 * The marker colour only drives the calendar design, so the panel design sends
 * just its type — nothing stale to interpret if the template switches back.
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
  return cfg
}
