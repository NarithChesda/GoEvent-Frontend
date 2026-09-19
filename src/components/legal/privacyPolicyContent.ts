/**
 * The Privacy Policy's text, rendered by LegalDocument.vue at `/privacy`.
 *
 * English only, and deliberately not in the i18n bundles: a legal text is one
 * authoritative document, not a set of UI strings, and a Khmer version should be
 * a reviewed translation added beside this file (`privacyPolicyContent.kh.ts`),
 * not a key-by-key machine of one. The page's own chrome — title, contents,
 * notices — is i18n'd as usual.
 *
 * EVERY CLAIM HERE DESCRIBES THE CODE. Written 2026-09-18 against both repos;
 * when you change what is collected, where it goes, or which pages load the Meta
 * pixel, change this text in the same commit and bump `lastUpdated`:
 * - the pixel's page allowlist lives in src/utils/metaPixel.ts
 * - browser storage lifetimes in src/utils/attribution.ts and partnerRequestDraft.ts
 * - what the Conversions API receives in the backend's payment/meta_capi.py
 * - third-party origins: index.html (Google Fonts), src/utils/mediaUrl.ts
 *   (ImageKit), PublicEventQRModal.vue (QR codes), the showcase embeds
 */

export interface LegalTerm {
  /** A bold lead-in, e.g. "Account information." */
  term: string
  text: string
}

export type LegalBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'subheading'; text: string }
  | { kind: 'list'; items: Array<string | LegalTerm> }

export interface LegalSection {
  /** The URL fragment, so `/privacy#cookies` lands on it. Never rename one. */
  id: string
  title: string
  blocks: LegalBlock[]
}

export interface LegalDocumentContent {
  /** ISO date. Shown as "Last updated", in the reader's locale. */
  lastUpdated: string
  intro: string[]
  /** The whole policy in five sentences, above the full text. */
  summary: string[]
  sections: LegalSection[]
}

const p = (text: string): LegalBlock => ({ kind: 'paragraph', text })
const h = (text: string): LegalBlock => ({ kind: 'subheading', text })
const list = (...items: Array<string | LegalTerm>): LegalBlock => ({ kind: 'list', items })
const term = (label: string, text: string): LegalTerm => ({ term: label, text })

export const PRIVACY_POLICY_EN: LegalDocumentContent = {
  lastUpdated: '2026-09-18',

  intro: [
    'GoEvent ("GoEvent", "we", "us") runs goevent.online, a web app for creating events, sending digital invitations, managing guest lists, selling tickets and finding event services.',
    'This policy explains what personal information we collect, why, who we share it with, and the choices you have. It applies to everyone who uses GoEvent — people with an account, and guests who open an invitation without one.',
  ],

  summary: [
    'We collect what you give us to run your events, plus the technical information needed to keep GoEvent working and secure.',
    'We do not sell your personal information, and we do not use guest lists to market to guests.',
    'If you are a guest, the organizer who invited you controls your details on their event. Contact them first, or contact us.',
    'We use the Meta pixel only on our marketing pages, to measure our partner programme ads. It never runs on invitations or event pages.',
    'You can ask us to see, correct or delete your information at any time.',
  ],

  sections: [
    {
      id: 'information-we-collect',
      title: 'Information we collect',
      blocks: [
        h('Information you give us'),
        list(
          term(
            'Your account.',
            'You sign in to GoEvent with Google or Telegram. Google gives us your name, email address and profile photo. Telegram gives us your name, username and Telegram user ID, and the chat our bot uses to send you notifications. We never receive your Google or Telegram password.',
          ),
          term(
            'Your profile.',
            'Anything you add in Settings: your phone number, profile photo, bio, business logo, preferred language, and your payment and Telegram links.',
          ),
          term(
            'Events you create.',
            'Titles, descriptions, dates, venues and maps, agendas, the names and photos of hosts, photos, videos, music, dress codes and the text of your invitation.',
          ),
          term(
            'Guest lists.',
            "Your guests' names and, if you add them, their phone numbers, email addresses, groups, tables and seats, gift records and your notes.",
          ),
          term(
            'Payments to GoEvent.',
            'When you pay for a template or buy partner credits: the amount, the plan, the payment method, the transfer reference and the screenshot of the bank transfer you upload as proof. We do not process card payments and never see your banking login.',
          ),
          term(
            'Gift and payment details on your invitation.',
            'Bank account details and payment QR codes you add so guests can send gifts or donations. These are shown to everyone who opens your invitation.',
          ),
          term(
            'Tickets and donations.',
            "The buyer's name, email and phone number, attendees' names and email addresses, answers to the organizer's checkout questions, the donor's details and gift, and the proof of payment.",
          ),
          term(
            'Replies to an invitation.',
            'Your RSVP, how many people are coming with you and their names, answers to the RSVP questions, a private note to the host, and comments, wishes, reviews and ratings you post.',
          ),
          term(
            'Partner applications.',
            'Your business name, phone number, Telegram, business type, expected volume and your answers to our questions.',
          ),
          term(
            'Vendor profiles and listings.',
            'Business name, description, contact details, address and photos.',
          ),
          term('Budgets and expenses', 'you record for an event.'),
          term(
            'Job applications.',
            'Your name, contact details, resume, cover letter, the links you give us, and your answers about location, availability and salary.',
          ),
          term('Messages to us', 'through Telegram or our feedback forms.'),
        ),
        h('Information collected automatically'),
        list(
          term(
            'Device and log information.',
            'Your IP address, browser and device type, the pages and files requested, the time, and any errors. Our servers record this to run GoEvent and keep it secure.',
          ),
          term(
            'Marketplace activity.',
            'When you view a vendor listing or tap to contact a vendor, we record which listing, when, and your IP address and browser, so vendors can see how their listings perform.',
          ),
          term(
            'Where you came from.',
            'If you arrive through one of our ads or a link carrying campaign tags, we record the campaign and ad, the page you landed on and the website that sent you. See "Advertising and the Meta pixel".',
          ),
        ),
        h('Information from other people'),
        list(
          'Organizers add their guests, hosts and collaborators, and the people they share a guest list with can add guests too. If someone added your details to an event and you want them removed, ask the organizer, or contact us.',
          'Some vendor listings in our marketplace were compiled by our team from publicly available business information and are marked as not yet claimed. A business can claim its listing, correct it, or ask us to remove it.',
        ),
      ],
    },
    {
      id: 'how-we-use-information',
      title: 'How we use information',
      blocks: [
        list(
          term(
            'To provide GoEvent:',
            'to create and show your events and invitations, and to run guest lists, RSVPs, seating, check-in, tickets, donations and expense tracking.',
          ),
          term(
            'To keep accounts secure:',
            'to sign you in, and to detect and prevent fraud, spam and abuse.',
          ),
          term(
            'To handle payments:',
            'to check payment proofs, activate templates, issue partner credits and handle refunds.',
          ),
          term(
            'To contact you:',
            'to send the notifications GoEvent is built around — in the app, and through our Telegram bot if your account is connected to Telegram — and an email when someone invites you to help manage their event. We also reply when you contact us.',
          ),
          term(
            'To review applications:',
            'partner applications, vendor verification and job applications.',
          ),
          term(
            'To improve GoEvent:',
            'to understand how features are used and to find and fix problems.',
          ),
          term('To measure our advertising,', 'as described in "Advertising and the Meta pixel".'),
          term(
            'To meet legal obligations:',
            'to comply with the law, enforce our terms and protect the rights and safety of our users and others.',
          ),
        ),
        p(
          'We do not sell personal information. We do not use the guest lists organizers upload to contact or market to those guests.',
        ),
      ],
    },
    {
      id: 'who-can-see-what',
      title: 'Who can see what',
      blocks: [
        list(
          term(
            'Public events',
            'can be seen by anyone and may appear on our Explore page, including their title, description, date, venue, photos and hosts.',
          ),
          term(
            'Private events and invitations',
            'can be opened by anyone who has the link. An invitation link can identify the guest it was sent to and greet them by name, so anyone the link is forwarded to can see that name.',
          ),
          term(
            'Comments and wishes',
            'you post on an invitation can be seen by other people who open it.',
          ),
          term(
            'Organizers and their collaborators',
            'can see the guest list, RSVPs, notes to the host, comments, ticket orders and donations for their event.',
          ),
          term(
            'Guest-list sharing links',
            "let anyone who has one view an event's guest list, or change it if the organizer allowed that.",
          ),
          term('Vendor profiles and listings', 'are public.'),
          term(
            'Our team',
            'can access information when they need to: to review payments and applications, give you support, or investigate abuse.',
          ),
        ),
      ],
    },
    {
      id: 'sharing',
      title: 'How we share information',
      blocks: [
        p(
          'We share personal information only in these ways. Service providers act on our instructions and may use it only to provide their service to us.',
        ),
        h('Service providers'),
        list(
          term('Cloudflare', 'hosts our website and protects and delivers traffic to our servers.'),
          term('DigitalOcean', 'hosts our servers, database and the files you upload.'),
          term('ImageKit', 'resizes and delivers images.'),
          term(
            'Our email provider',
            'sends the emails that invite people to help manage an event.',
          ),
          term(
            'Google',
            'provides Sign in with Google, the fonts our pages use, and the maps shown on events that include one.',
          ),
          term('Telegram', "provides Log in with Telegram and delivers our bot's notifications."),
          term(
            'goqr.me',
            'draws the QR code for an event registration. It receives the registration code, not your name.',
          ),
        ),
        h('Others'),
        list(
          term('Meta (Facebook),', 'for our partner programme advertising — see the next section.'),
          term(
            'Event organizers.',
            'When you RSVP, buy a ticket, donate or comment on an event, the organizer of that event receives what you submit.',
          ),
          term(
            'Embedded content.',
            'Organizers can add YouTube and TikTok videos and Google Maps to their events. These load from those companies, which may collect information under their own privacy policies.',
          ),
          term(
            'The law.',
            "When we are required to by law or a court, or when it is necessary to protect someone's safety or to prevent fraud.",
          ),
          term(
            'A change of ownership.',
            'If GoEvent is merged, sold or reorganised, information may move with it, still protected by this policy.',
          ),
          term('With your permission,', 'in any other case.'),
        ),
      ],
    },
    {
      id: 'advertising',
      title: 'Advertising and the Meta pixel',
      blocks: [
        p(
          "We advertise our partner programme on Facebook and Instagram. To learn which ads bring shop owners to us, we use the Meta pixel and Meta's Conversions API.",
        ),
        list(
          term(
            'On our marketing pages only.',
            "The pixel runs on our home, about, partner programme and sign-in pages, and reports that the page was visited. It never runs on invitations, event pages or anything that shows a guest's details.",
          ),
          term(
            'When you apply to become a partner,',
            "we tell Meta that an application was made — both from your browser and from our server. Our server sends your email address, phone number, name and account ID in hashed (scrambled) form, with your IP address, your browser type and the pixel's cookies, so Meta can match the application to an ad. If a reviewer approves the application, we send a second event. We do not send the email address of an account created through Telegram.",
          ),
          term(
            'What we never send.',
            'We never send Meta anything about your events, your guests, your invitations or your payments.',
          ),
        ),
        p(
          "Meta uses this information under its own terms and privacy policy. You can manage how Meta uses your information for ads in your Facebook or Instagram ad settings, and you can block the pixel with your browser's privacy settings or an ad blocker.",
        ),
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies and browser storage',
      blocks: [
        p(
          "GoEvent itself does not use tracking cookies. We keep a few things in your browser's storage so the app works:",
        ),
        list(
          term('Your sign-in,', 'until you sign out.'),
          'Your language choice.',
          term(
            'A partner application you have started,',
            'for 24 hours, so it survives signing in.',
          ),
          term(
            'The ad or campaign that brought you,',
            'for up to 90 days, so a partner application can say where it came from.',
          ),
        ),
        p(
          'Other cookies come from third parties: the Meta pixel sets the _fbp and _fbc cookies (kept for up to 90 days) on the pages listed above, Sign in with Google may set cookies when you use it, and embedded videos and maps may set their own.',
        ),
        p(
          'You can clear or block cookies and storage in your browser settings. Blocking our storage will sign you out and stop the app remembering your language.',
        ),
      ],
    },
    {
      id: 'organizers',
      title: "If you add other people's information",
      blocks: [
        p(
          'When you add guests, hosts, collaborators or photos of other people to an event, you are responsible for that information. Please:',
        ),
        list(
          'only add people you have a reason to invite or involve, and whose details you are entitled to share;',
          'use their information only for your event;',
          "only add a child's details with the permission of a parent or guardian;",
          'not upload sensitive information — such as health, religious or financial details — that your event does not need;',
          "remove someone's details if they ask you to.",
        ),
      ],
    },
    {
      id: 'storage-and-security',
      title: 'Where your information is stored, and how it is protected',
      blocks: [
        p(
          'Our servers and service providers may be located outside Cambodia. We choose providers that protect the information they handle for us.',
        ),
        p(
          'Everything you send to GoEvent travels over an encrypted (HTTPS) connection. We hold no password for your account — Google or Telegram confirms who you are — sign-in sessions expire, and only team members who need it can access personal information.',
        ),
        p(
          'No service is perfectly secure. Keep your Google and Telegram accounts secure, since they are the key to your GoEvent account, be careful who you forward invitation and guest-list links to, and tell us straight away if you think someone has got into your account.',
        ),
      ],
    },
    {
      id: 'retention',
      title: 'How long we keep information',
      blocks: [
        list(
          term('Your account', 'is kept for as long as it is open.'),
          term(
            'Events',
            'are kept until you delete them or your account. Deleting an event also deletes its guest list, RSVPs, comments and photos.',
          ),
          term(
            'Payment and ticket records',
            'may be kept for as long as we need them for accounting, tax or a dispute, including after you ask us to close your account. An event that has sold tickets cannot be deleted while those orders exist.',
          ),
          term(
            'Partner and job applications',
            'are kept while we review them and for our records afterwards. You can ask us to delete yours.',
          ),
          term('Server logs', 'are kept for a limited time, for security.'),
        ),
        p('Deleted information can take some time to disappear from our systems and backups.'),
      ],
    },
    {
      id: 'your-rights',
      title: 'Your rights and choices',
      blocks: [
        p('You can ask us to:'),
        list(
          term('see', 'the personal information we hold about you, and get a copy of it;'),
          term(
            'correct it',
            '— you can also edit most of it yourself in Settings, and edit or delete your events at any time;',
          ),
          term('delete it,', 'including your whole account;'),
          term('stop using it', 'for a particular purpose, or withdraw a permission you gave us.'),
        ),
        p(
          'Contact us to make any of these requests. We may need to confirm who you are first, and we will reply within 30 days. We may keep some information where the law requires it, such as payment records.',
        ),
        p(
          'If you are a guest, the organizer of the event decides what happens with your details on it, so ask them first. If they do not help, contact us and we will.',
        ),
      ],
    },
    {
      id: 'children',
      title: 'Children',
      blocks: [
        p(
          "GoEvent is not meant for children under 13, and they may not create an account. If we learn that a child under 13 has one, we will delete it. Organizers sometimes add children to a guest list — for a birthday party, for example — and must have a parent's or guardian's permission to do so.",
        ),
      ],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      blocks: [
        p(
          'We will update this policy when GoEvent changes, and change the date at the top when we do. If a change significantly affects how we use your information, we will tell you in the app or by email before it takes effect.',
        ),
        p(
          'This policy is written in English. If we publish a translation and the two differ, the English version applies.',
        ),
      ],
    },
    {
      id: 'contact',
      title: 'Contact us',
      blocks: [
        p(
          'For any question about this policy or your information, or to make a request, message us on Telegram at @goeventkh.',
        ),
      ],
    },
  ],
}
