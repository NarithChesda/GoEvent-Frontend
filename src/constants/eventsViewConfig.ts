/**
 * eventsViewConfig.ts
 *
 * Configuration constants for EventsView component.
 * Defines view types, their icons, labels, and associated messages.
 *
 * @module constants/eventsViewConfig
 */

import { Ticket, Globe } from 'lucide-vue-next'
import type { Component } from 'vue'

export type ViewType = 'all' | 'my' | 'registered'

/**
 * View option configuration
 */
export interface ViewOption {
  /** View type identifier */
  type: ViewType
  /** Display label for the view */
  label: string
  /** Icon component for the view */
  icon: Component
}

/**
 * Available view options for events page
 */
export const VIEW_OPTIONS: ViewOption[] = [
  {
    type: 'my',
    label: 'Events',
    icon: Ticket,
  },
  {
    type: 'all',
    label: 'Explore',
    icon: Globe,
  },
]

/**
 * Empty state messages for each view type
 */
export const EMPTY_STATE_CONFIG: Record<ViewType, { title: string; message: string }> = {
  my: {
    title: "You haven't created any events yet",
    message: 'Start organizing amazing events and bring people together for memorable experiences.',
  },
  all: {
    title: 'No events found',
    message: 'Try adjusting your filters or check back later for new events.',
  },
  registered: {
    title: "You haven't registered for any events yet",
    message: 'Browse events and register to join amazing experiences.',
  },
}

/**
 * Login prompt messages for each view type
 */
export const LOGIN_PROMPT_CONFIG: Record<ViewType, string> = {
  my: 'Please sign in to view and manage your events.',
  all: 'Please sign in to continue.',
  registered: 'Please sign in to view your registered events.',
}

/**
 * Section labels for each view type
 */
export const SECTION_LABEL_CONFIG: Record<ViewType, string> = {
  my: 'Events',
  all: 'Explore',
  registered: 'Registered',
}
