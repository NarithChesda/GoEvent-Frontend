const fs = require("fs");
const path = 'src/components/EventInvitationTab.vue';
let s = fs.readFileSync(path, 'utf8');
const startKey = 'const getGuestShowcaseUrl';
const endKey = '\nconst showMessage';
const start = s.indexOf(startKey);
if (start !== -1) {
  const end = s.indexOf(endKey, start);
  if (end !== -1) {
    const before = s.slice(0, start);
    const after = s.slice(end); // includes leading \nconst showMessage
    const lines = [
      "const getGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {",
      "  // Use SSR meta URL for personalized guest invitations",
      "  return getGuestSSRMetaUrl(props.eventId, guest.name, language)",
      "}",
      "",
      "const getDirectGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {",
      "  // Direct URL for opening in browser (non-SSR)",
      "  const showcaseUrl = `/events/${props.eventId}/showcase?guest_name=${encodeURIComponent(guest.name)}&lang=${language}`",
      "  return `${window.location.origin}${showcaseUrl}`",
      "}",
      "",
      "const viewGuestShowcase = (guest: EventGuest) => {",
      "  // Use direct URL for viewing (non-SSR) so it opens immediately",
      "  const fullUrl = getDirectGuestShowcaseUrl(guest, 'kh')",
      "  window.open(fullUrl, '_blank')",
      "}",
      "",
      "const copyShowcaseLink = (guest: EventGuest, language: 'en' | 'kh') => {",
      "  const fullUrl = getGuestShowcaseUrl(guest, language)",
      "  navigator.clipboard",
      "    .writeText(fullUrl)",
      "    .then(() => {",
      "      showMessage('success', `Showcase link (${language.toUpperCase()}) copied for ${guest.name}`)",
      "    })",
      "    .catch(() => {",
      "      showMessage('error', 'Failed to copy link')",
      "    })",
      "}",
      ""
    ];
    const inject = lines.join('\n');
    s = before + inject + after;
    fs.writeFileSync(path, s, { encoding: 'utf8' });
    console.log('Replaced language URL helper block');
  } else {
    console.log('End key not found');
  }
} else {
  console.log('Start key not found');
}
