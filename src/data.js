export const WHATSAPP_NUMBER = '919619635666'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
export const INSTAGRAM_URL = 'https://www.instagram.com/astronumerodecode'

// [OPEN ITEM] The client's source doc listed "supriyakirugaval.com" under an
// "Email" field — it is clearly a website URL, not an email address. Displayed
// as a website link for now; a real email address is still needed from the client.
export const WEBSITE_URL = 'https://supriyakirugaval.com'
export const WEBSITE_LABEL = 'supriyakirugaval.com'

// Client-supplied portrait. Drop the photo at `public/supriya-portrait.jpg`;
// if the file is absent the About section falls back to a silhouette rather
// than showing a broken image.
export const PORTRAIT_SRC = '/supriya-portrait.jpg'

// Client-supplied logo (elephant + sun + crescent moon mark). Drop the file at
// `public/logo.png`; if it's absent the Nav falls back to the "✦ Supriya"
// text wordmark rather than showing a broken image.
export const LOGO_SRC = '/logo.png'

// In-page anchors on the home route (also drives the desktop scroll dots)
export const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'book', label: 'Book' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
]

// Real routes (not anchors) — these need react-router navigation, not scrolling
export const DETAILED_FILE_PATH = '/detailed-file'

export const MODALITIES = [
  'Astrology',
  'Tarot',
  'Numerology',
  'Vastu',
  'Reiki',
  'Akashic Records',
  'Inner Child Healing',
]

export const SERVICES = [
  {
    id: 'astrology',
    name: 'Astrology Consultation',
    price: 'Rs. 5,001',
    icon: 'planet',
    items: ['Birth Chart Analysis', 'Career', 'Marriage', 'Finance'],
  },
  {
    id: 'numerology',
    name: 'Numerology',
    price: 'Rs. 3,003',
    icon: 'numbers',
    items: ['Name Correction', 'Business Numbers', 'Mobile Number Analysis'],
  },
  {
    id: 'tarot',
    name: 'Tarot Reading',
    price: 'Rs. 3,003',
    icon: 'cards',
    items: ['Love', 'Career', 'Yes/No Questions'],
  },
  {
    // Renamed from "Reiki Healing" at the client's request. [OPEN ITEM] The price
    // and the three checklist items below are still the ones the client supplied
    // for Reiki — confirm they describe Inner Child Healing before launch.
    id: 'inner-child',
    name: 'Inner Child Healing',
    price: 'Rs. 11,000',
    icon: 'lotus',
    items: ['Emotional Healing', 'Stress Relief', 'Energy Balancing'],
  },
  {
    id: 'akashic',
    name: 'Akashic Records Reading',
    price: 'Rs. 5,001',
    icon: 'book',
    items: ['Past Life', 'Soul Purpose', 'Karmic Patterns'],
  },
  {
    id: 'vastu',
    name: 'Vastu Consultation',
    price: 'Rs. 21,000',
    icon: 'home',
    items: ['Home', 'Office', 'Business'],
  },
]

/* Detailed File — a standalone written birth-chart report, sold separately from
   the live consultations. Structure follows the reference page the client shared;
   the wording here is original, not copied from that site. */
export const DETAILED_FILE = {
  // Written "Rs." to match the price format used on the service cards
  price: 'Rs. 1,200',
  // [OPEN ITEM] Delivery window carried over from the client's reference page.
  // This is a promise made to paying customers — confirm Supriya's real
  // turnaround before launch.
  delivery: '6 to 8 days',
  inclusions: [
    'A complete reading of all 9 planets in your birth chart',
    'How each planet is shaping your health, career, finances and relationships',
    'Which planets are supporting you, and which are currently working against you',
    'Practical remedies for the planets causing difficulty',
    'Clear do’s and don’ts to follow in daily life',
    'A direct number to ask any questions once your file arrives',
  ],
}

// [OPEN ITEM] No testimonial author names supplied by the client — each is
// labelled "Verified Client" rather than inventing names.
export const TESTIMONIALS = [
  { quote: 'Excellent astrology guidance.', author: 'Verified Client' },
  { quote: 'My career improved after following the remedies.', author: 'Verified Client' },
  { quote: 'Very accurate predictions.', author: 'Verified Client' },
]
