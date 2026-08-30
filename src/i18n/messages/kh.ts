/**
 * Khmer message bundle.
 *
 * One module that pulls in every kh namespace, so the dynamic `import()` in
 * src/i18n/index.ts produces exactly ONE extra chunk rather than one per
 * namespace. Never statically imported anywhere — that would defeat the split
 * and put all ~320kB back into the entry chunk.
 */

import common from '../locales/kh/common.json'
import auth from '../locales/kh/auth.json'
import events from '../locales/kh/events.json'
import discover from '../locales/kh/discover.json'
import management from '../locales/kh/management.json'
import settings from '../locales/kh/settings.json'
import categories from '../locales/kh/categories.json'
import services from '../locales/kh/services.json'
import partners from '../locales/kh/partners.json'

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
