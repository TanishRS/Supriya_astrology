import { Link } from 'react-router-dom'
import { EMAIL, EMAIL_URL, PRIVACY_PATH, WHATSAPP_DISPLAY, WHATSAPP_URL } from '../data.js'
import LegalPage from '../components/LegalPage.jsx'

const LINK_CLASS =
  'text-accent underline underline-offset-4 transition-colors hover:text-ink-hi'

const INTRO = [
  'Welcome to Supriya’s astrology, tarot, and energy healing website (supriyackirugaval.com). Please read these Terms and Conditions carefully before using this site. By accessing or using this site, you agree to be bound by these Terms. If you do not agree, please do not use the site.',
]

const SECTIONS = [
  {
    n: 1,
    heading: 'General',
    paragraphs: [
      /* "our Privacy Policy" is wired to the sibling route rather than left as
         plain text, since the clause is telling the reader to go read it. */
      <>
        By using this website, you agree to comply with these Terms. If you don’t agree with any
        part of them, please don’t use the site. You must be at least 18 years old, or have the
        legal capacity to enter into an agreement in your jurisdiction, to use this site. Please
        also review our{' '}
        <Link to={PRIVACY_PATH} className={LINK_CLASS}>
          Privacy Policy
        </Link>
        , which explains how we handle your information.
      </>,
    ],
  },
  {
    n: 2,
    heading: 'Our Services',
    paragraphs: [
      'Supriya offers astrology, tarot reading, numerology, vastu consultation, reiki-based inner child healing, and akashic records reading, along with the Kundli Blueprint written report. These services are offered for guidance and personal insight, and are not a substitute for professional medical, legal, financial, or psychological advice.',
      'Astrology and related practices are not exact sciences. While every reading and report is prepared with care and genuine effort, we do not guarantee specific outcomes, predictions, or results.',
    ],
  },
  {
    n: 3,
    heading: 'Bookings and Payment',
    paragraphs: [
      'Booking a consultation or ordering a Kundli Blueprint requires payment of the listed fee at the time of booking. Payments are processed securely through Razorpay. By completing a booking, you agree to pay the amount shown for the service you selected.',
      'Appointment slots are held temporarily once you begin the payment process and are confirmed only once payment is successfully completed. If a slot becomes unavailable before payment completes, you’ll be asked to choose another time.',
    ],
  },
  {
    n: 4,
    heading: 'Cancellations and Rescheduling',
    paragraphs: [
      <>
        If you need to cancel or reschedule a booked consultation, contact us via WhatsApp at{' '}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {WHATSAPP_DISPLAY}
        </a>{' '}
        at least 24 hours before your scheduled appointment time. Requests made with less than 24
        hours’ notice may not be accommodated. The Kundli Blueprint report, once preparation has
        begun, cannot be cancelled.
      </>,
    ],
  },
  {
    n: 5,
    heading: 'Refunds',
    paragraphs: [
      'Refund requests are considered on a case-by-case basis — for example, if a technical error results in a duplicate charge, or if a service cannot be delivered. To request a refund, contact us via WhatsApp or email with your payment ID. We aim to resolve legitimate refund requests promptly.',
    ],
  },
  {
    n: 6,
    heading: 'Your Content',
    paragraphs: [
      'If you send us a message, question, or feedback (for example, through the optional message field when booking), you agree that we may use it to better understand and respond to your request. Please don’t submit anything defamatory, offensive, or that infringes on someone else’s rights.',
    ],
  },
  {
    n: 7,
    heading: 'Intellectual Property',
    paragraphs: [
      'All content on this website — including text, design, graphics, and the Kundli Blueprint report format — belongs to Supriya and is protected by copyright. You may view and use this content for personal, non-commercial purposes only. Reproducing or distributing it for commercial use isn’t allowed without prior written permission.',
    ],
  },
  {
    n: 8,
    heading: 'Disclaimers',
    paragraphs: [
      'Astrological, tarot, and energy-healing guidance is offered for informational and personal-growth purposes. We make no guarantees about the accuracy or outcome of any reading, remedy, or recommendation. Your use of this website and its services is at your own discretion and risk.',
    ],
  },
  {
    n: 9,
    heading: 'Limitation of Liability',
    paragraphs: [
      'To the extent permitted by law, Supriya is not liable for any indirect, incidental, or consequential loss arising from your use of this website or its services, or from decisions made based on a reading or consultation.',
    ],
  },
  {
    n: 10,
    heading: 'Changes to These Terms',
    paragraphs: [
      'We may update these Terms from time to time. The “last updated” date at the top of this page will reflect the most recent version. Continued use of the site after changes means you accept the updated Terms.',
    ],
  },
  {
    n: 11,
    heading: 'Contact Information',
    paragraphs: [
      <>
        For any questions about these Terms, reach out via WhatsApp at{' '}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {WHATSAPP_DISPLAY}
        </a>{' '}
        or email{' '}
        <a href={EMAIL_URL} className={LINK_CLASS}>
          {EMAIL}
        </a>
        .
      </>,
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      documentTitle="Terms and Conditions — Astrologer Supriya"
      eyebrow="Legal"
      title="Terms and Conditions"
      updated="Last updated: 19th August 2026"
      intro={INTRO}
      sections={SECTIONS}
    />
  )
}
