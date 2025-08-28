// Test script to demonstrate the translation functionality
// Run with: node test-translation.js

import { translateRSVP, formatDateLocalized, formatTimeLocalized, getPersonUnit } from './src/utils/translations.ts'

console.log('🧪 Testing RSVP Translation System\n')

// Test header translation
console.log('📝 Header Translation:')
console.log('English:', translateRSVP('rsvp_header', 'en'))
console.log('Khmer:  ', translateRSVP('rsvp_header', 'kh'))
console.log('French: ', translateRSVP('rsvp_header', 'fr'))
console.log('Japanese:', translateRSVP('rsvp_header', 'ja'))
console.log('')

// Test button translations
console.log('🔘 Button Translations:')
console.log('Yes Button (EN):', translateRSVP('rsvp_yes_button', 'en'))
console.log('Yes Button (KH):', translateRSVP('rsvp_yes_button', 'kh'))
console.log('No Button (EN): ', translateRSVP('rsvp_no_button', 'en'))
console.log('No Button (KH): ', translateRSVP('rsvp_no_button', 'kh'))
console.log('')

// Test person/people units
console.log('👥 Person/People Units:')
console.log('1 person (EN):', '1', getPersonUnit(1, 'en'))
console.log('5 people (EN):', '5', getPersonUnit(5, 'en'))
console.log('1 person (KH):', '1', getPersonUnit(1, 'kh'))
console.log('5 people (KH):', '5', getPersonUnit(5, 'kh'))
console.log('')

// Test template strings with replacements
console.log('📨 Template String Replacements:')
console.log('Success (EN):', translateRSVP('rsvp_registration_success', 'en', { count: 3, unit: 'people' }))
console.log('Success (KH):', translateRSVP('rsvp_registration_success', 'kh', { count: 3, unit: 'នាក់' }))
console.log('')

// Test date formatting
console.log('📅 Date Formatting:')
const testDate = new Date('2024-12-25T15:30:00')
console.log('Long Date (EN):', formatDateLocalized(testDate, 'long', 'en'))
console.log('Long Date (KH):', formatDateLocalized(testDate, 'long', 'kh'))
console.log('Compact Date (EN):', formatDateLocalized(testDate, 'compact', 'en'))
console.log('Compact Date (KH):', formatDateLocalized(testDate, 'compact', 'kh'))
console.log('')

// Test time formatting
console.log('⏰ Time Formatting:')
console.log('Time (EN):', formatTimeLocalized(testDate, 'en'))
console.log('Time (KH):', formatTimeLocalized(testDate, 'kh'))
console.log('Time (JA):', formatTimeLocalized(testDate, 'ja'))
console.log('Time (KO):', formatTimeLocalized(testDate, 'ko'))
console.log('')

console.log('✅ Translation system test completed!')