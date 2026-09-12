/**
 * The offer, as it stands if `/api/core-data/pricing-plans/` cannot be reached.
 *
 * [PricingSection.vue](src/components/PricingSection.vue) is on the public
 * landing page and renders whatever that endpoint returns; this is what it
 * draws when the request fails. It therefore has to be the **real** offer —
 * the plans below mirror the live production records (ids, prices, categories
 * and demo links included) so a failed fetch degrades to last-known-good copy
 * rather than to something invented. It previously degraded to a verbatim copy
 * of another company's chat-subscription tiers, which is the failure this file
 * exists to prevent.
 *
 * The backend remains the source of truth. When staff edit a plan in
 * Admin → Pricing Plans, update this file to match, or the fallback slowly
 * drifts into advertising a price nobody sells any more.
 *
 * Feature lines follow the `title — description` convention documented in
 * [planFeatures.ts](src/utils/planFeatures.ts).
 */

export interface PricingPlanCategory {
  id: number
  name: string
  description: string
  color: string
  icon: string
  is_active: boolean
  created_by: number
  created_by_name: string
  created_at: string
}

export interface PricingPlan {
  id: number
  name: string
  /** Doubles as the "see it in action" demo URL on the card footer. */
  description: string
  price: string
  commission: string
  features: string[]
  is_active: boolean
  is_best_seller: boolean
  category: PricingPlanCategory | number
  created_at: string
  updated_at: string
}

const TIMESTAMP = '2026-09-11T00:00:00+07:00'

const category = (id: number, name: string, color: string): PricingPlanCategory => ({
  id,
  name,
  description: '',
  color,
  icon: '',
  is_active: true,
  created_by: 1,
  created_by_name: 'admin@goevent.com',
  created_at: TIMESTAMP,
})

const WEDDING = category(1, 'Wedding', '#02d282')
const BIRTHDAY = category(8, 'Birthday', '#3498db')
const FUNERAL = category(22, 'Funeral', '#3498db')

const DEMO_GUEST_QUERY =
  'guest_name=%E1%9E%97%E1%9F%92%E1%9E%89%E1%9F%80%E1%9E%9C%E1%9E%80%E1%9E%B7%E1%9E%8F%E1%9F%92%E1%9E%8F%E1%9E%B7%E1%9E%99%E1%9E%9F&lang=kh'

const demoUrlFor = (eventId: string) =>
  `https://api.goevent.online/api/events/${eventId}/meta/?${DEMO_GUEST_QUERY}`

/** Everything a Basic Plus buys, wedding and birthday alike. */
export const BASIC_PLUS_FEATURES: string[] = [
  'ទម្រង់កាតអញ្ជើញជាង ៣០ បែប — ជ្រើសរើសម៉ូដដែលពេញចិត្ត រួចប្ដូរអក្សរ រូបភាព និងពណ៌បានតាមចិត្ត',
  'តំណអញ្ជើញផ្ទាល់ខ្លួនរបស់ភ្ញៀវម្នាក់ៗ — ឈ្មោះភ្ញៀវបង្ហាញនៅលើកាត និងក្នុងតំណពេលផ្ញើតាម Telegram ឬ Facebook ហើយអ្នកដឹងថាអ្នកណាបានបើកមើលរួចហើយ',
  'គ្រប់គ្រងបញ្ជីភ្ញៀវជាក្រុម — បែងចែកតាមក្រុមគ្រួសារ ភាគីកម្មវិធី ឬមិត្តភក្ដិ ព្រមទាំងមើលស្ថិតិដាច់ដោយឡែកតាមក្រុមនីមួយៗ',
  'ការឆ្លើយតបចូលរួម (RSVP) — ភ្ញៀវឆ្លើយថាមក ឬមិនមក ប្រាប់ចំនួនអ្នកទៅជាមួយ ផ្ញើសារដល់ម្ចាស់កម្មវិធី និងឆ្លើយសំណួរដែលអ្នកកំណត់ខ្លួនឯង',
  'ចែករំលែកបញ្ជីភ្ញៀវ — ផ្ញើតំណឱ្យឪពុកម្ដាយ ឬអ្នករៀបចំកម្មវិធី មើល ឬកែបញ្ជីជាមួយគ្នា ដោយមិនចាំបាច់មានគណនី ហើយអាចដកហូតតំណវិញពេលណាក៏បាន',
  'រៀបចំតុ និងកន្លែងអង្គុយ — អូសដាក់ភ្ញៀវតាមតុនីមួយៗ ហើយភ្ញៀវឃើញលេខតុរបស់ខ្លួននៅលើកាតអញ្ជើញផ្ទាល់',
  'កត់ត្រាប្រាក់អំណោយ និងចំណាយ — កត់ត្រាអំណោយតាមភ្ញៀវម្នាក់ៗ បានច្រើនរូបិយប័ណ្ណ ព្រមទាំងតាមដានថវិកាចំណាយរបស់កម្មវិធី',
  'ផែនទី វីដេអូ និងសៀវភៅជូនពរ — Google Map ប៊ូតុងរំលឹកដាក់ក្នុងប្រតិទិន វីដេអូ YouTube និងកន្លែងឱ្យភ្ញៀវសរសេរជូនពរ',
  'ពីរភាសាក្នុងកាតតែមួយ — ខ្មែរ និងអង់គ្លេស ភ្ញៀវជ្រើសរើសភាសាដោយខ្លួនឯង',
  'នៅដំណើរការជារៀងរហូត — បង់តែម្ដងគត់ គ្មានថ្ងៃផុតកំណត់ និងគ្មានការបង់ប្រចាំខែ',
]

/** Standard adds motion, film, photographs and the numbers behind the event. */
export const STANDARD_FEATURES: string[] = [
  'មុខងារ Basic Plus ទាំងអស់ — គ្រប់មុខងារគ្រប់គ្រងភ្ញៀវ និងកាតអញ្ជើញខាងលើ រួមបញ្ចូលទាំងស្រុង',
  'ទម្រង់កាតមានចលនា — កាតបើកចេញដូចទ្វារ ឬគ្រឿងតុបតែងរសាត់ចេញ មានឈុត Save the Date និងផ្កា ឬពន្លឺរសាត់ពេញអេក្រង់',
  'វីដេអូផ្ទាល់ខ្លួនពេលបើកកាត — ដាក់វីដេអូរបស់អ្នកឱ្យលេងនៅពេលភ្ញៀវបើកកាតអញ្ជើញ',
  'វិចិត្រសាលរូបភាពរហូតដល់ ២០ សន្លឹក — រូបភាពរបស់អ្នកបង្ហាញក្នុងកាតអញ្ជើញ ចុចមើលពេញអេក្រង់បាន',
  'ស្ថិតិកម្មវិធី — អត្រាឆ្លើយតប បញ្ជីអ្នកមិនទាន់ឆ្លើយ លទ្ធផលសំណួរផ្ទាល់ខ្លួន និងអំណោយបែងចែកតាមក្រុម',
  'ជំនួយពីក្រុមការងារ — មានក្រុមការងារជួយឆ្លើយសំណួរ និងដោះស្រាយបញ្ហាឱ្យអ្នក ពេលអ្នកត្រូវការ',
]

/**
 * Premium is a design made for one event, plus the people who make it.
 *
 * It deliberately carries **no** analytics line of its own. Premium and
 * Standard reach the identical Analytics tab today, so a separate "detailed
 * analytics" bullet here would be a distinction the product does not make —
 * the opening "everything in Standard" line already covers it. When sharing
 * and export ship for Premium, that is the moment to add one back.
 */
export const PREMIUM_FEATURES: string[] = [
  'មុខងារ Standard ទាំងអស់ — រួមបញ្ចូលទម្រង់មានចលនា វីដេអូបើកកាត និងស្ថិតិទាំងអស់ខាងលើ',
  'ទម្រង់រចនាផ្ទាល់ខ្លួនទាំងស្រុង — រចនាថ្មីសម្រាប់កម្មវិធីរបស់អ្នកដោយឡែក ទាំងពណ៌ ពុម្ពអក្សរ ទម្រង់ និងចលនា',
  'ក្រុមអ្នករចនាឧទ្ទិសជូន ២៤/៧ — មានអ្នករចនាជួយកែតម្រូវរហូតដល់អ្នកពេញចិត្ត',
  'វិចិត្រសាលរូបភាពរហូតដល់ ៣០ សន្លឹក — កន្លែងគ្រប់គ្រាន់សម្រាប់រូបភាព Pre-wedding ពេញលេញ',
  'ជំនួយពីក្រុមការងារ — មានក្រុមការងារជួយឆ្លើយសំណួរ និងដោះស្រាយបញ្ហាឱ្យអ្នក ពេលអ្នកត្រូវការ',
]

/**
 * A funeral is the same machinery with none of the celebration in the words —
 * a notice rather than an invitation, contributions rather than gifts, and a
 * programme that runs over several days. That is why this is its own list and
 * not Basic Plus with two nouns swapped.
 */
export const FUNERAL_FEATURES: string[] = [
  'ទម្រង់សេចក្ដីជូនដំណឹងច្រើនបែប — ជ្រើសរើសទម្រង់សមរម្យ រួចប្ដូរអក្សរ រូបភាព និងពណ៌តាមតម្រូវការ',
  'តំណផ្ទាល់ខ្លួនរបស់ភ្ញៀវម្នាក់ៗ — ឈ្មោះភ្ញៀវបង្ហាញនៅលើសេចក្ដីជូនដំណឹង ហើយអ្នកដឹងថាអ្នកណាបានបើកមើលរួចហើយ',
  'គ្រប់គ្រងបញ្ជីភ្ញៀវជាក្រុម — បែងចែកតាមក្រុមគ្រួសារ សាច់ញាតិ ឬអ្នកជិតខាង ព្រមទាំងមើលស្ថិតិតាមក្រុម',
  'ការឆ្លើយតបចូលរួម — ដឹងជាមុនថាមានភ្ញៀវប៉ុន្មាននាក់នឹងអញ្ជើញមកចូលរួម ដើម្បីរៀបចំបានគ្រប់គ្រាន់',
  'ចែករំលែកបញ្ជីភ្ញៀវ — ផ្ញើតំណឱ្យសមាជិកគ្រួសារជួយបំពេញ ឬកែបញ្ជីជាមួយគ្នា ដោយមិនចាំបាច់មានគណនី',
  'កត់ត្រាការឧបត្ថម្ភ — កត់ត្រាតាមអ្នកឧបត្ថម្ភម្នាក់ៗ បានច្រើនរូបិយប័ណ្ណ និងមើលសរុបតាមក្រុម',
  'កម្មវិធីបុណ្យតាមថ្ងៃ — បង្ហាញកាលវិភាគពិធីនីមួយៗ តាមថ្ងៃ និងតាមម៉ោង',
  'ផែនទី និងសៀវភៅរំលឹក — Google Map ប៊ូតុងរំលឹកដាក់ក្នុងប្រតិទិន និងកន្លែងឱ្យភ្ញៀវផ្ញើសាររំលែកទុក្ខ',
  'ពីរភាសាក្នុងសេចក្ដីជូនដំណឹងតែមួយ — ខ្មែរ និងអង់គ្លេស',
  'នៅដំណើរការជារៀងរហូត — បង់តែម្ដងគត់ គ្មានថ្ងៃផុតកំណត់',
]

const plan = (
  id: number,
  name: string,
  price: string,
  planCategory: PricingPlanCategory,
  features: string[],
  options: { demoEventId?: string; bestSeller?: boolean } = {},
): PricingPlan => ({
  id,
  name,
  description: options.demoEventId ? demoUrlFor(options.demoEventId) : '',
  price,
  commission: '0.00',
  features,
  is_active: true,
  is_best_seller: options.bestSeller ?? false,
  category: planCategory,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
})

export const FALLBACK_PRICING_PLANS: PricingPlan[] = [
  plan(1, 'Basic Plus', '85.00', WEDDING, BASIC_PLUS_FEATURES, {
    demoEventId: 'ff726c4d-9356-4350-bc48-930b93a2a812',
  }),
  plan(3, 'Standard', '150.00', WEDDING, STANDARD_FEATURES, {
    demoEventId: 'd67b42b7-3daf-4734-a544-58743cae6886',
    bestSeller: true,
  }),
  plan(2, 'Premium', '200.00', WEDDING, PREMIUM_FEATURES, {
    demoEventId: '3db47127-bc94-40e8-bc46-ea9cbe05dd28',
  }),
  plan(4, 'Basic Plus Birthday', '50.00', BIRTHDAY, BASIC_PLUS_FEATURES, {
    bestSeller: true,
  }),
  plan(5, 'Standard', '150.00', BIRTHDAY, STANDARD_FEATURES, {
    demoEventId: '4cd9a61b-4bb6-4b14-a1f3-8fe42c1e52b3',
  }),
  plan(8, 'Basic Plus Funeral', '50.00', FUNERAL, FUNERAL_FEATURES),
]
