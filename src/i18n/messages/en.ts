/**
 * English message bundle.
 *
 * Statically imported by src/i18n/index.ts, so it lands in the app entry chunk
 * with no extra round trip. English is DEFAULT_LOCALE *and* FALLBACK_LOCALE —
 * every other locale falls back to it for missing keys — so it is the one
 * bundle that is always needed and therefore the one worth paying for up front.
 * Every other locale is a lazily loaded chunk (see ./kh.ts).
 */

import common from '../locales/en/common.json'
import auth from '../locales/en/auth.json'
import events from '../locales/en/events.json'
import discover from '../locales/en/discover.json'
import management from '../locales/en/management.json'
import settings from '../locales/en/settings.json'
import categories from '../locales/en/categories.json'
import services from '../locales/en/services.json'
import partners from '../locales/en/partners.json'

export default {
  common,
  auth,
  events,
  discover,
  management,
  settings,
  categories,
  services,
  partners,
}
