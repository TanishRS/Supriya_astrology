import { EMAIL, EMAIL_URL, WHATSAPP_DISPLAY, WHATSAPP_URL } from '../data.js'
import LegalPage from '../components/LegalPage.jsx'

const INTRO = [
  'Welcome to Supriya’s astrology, tarot, and energy healing website (supriyackirugaval.com). This Privacy Policy explains what information we collect, how we use it, and how we protect it when you use this site to book a consultation or order the Kundli Blueprint report. By using this site, you agree to the practices described here.',
]

const SECTIONS = [
  {
    n: 1,
    heading: 'Information We Collect',
    paragraphs: [
      'Personal information: when you book a consultation or order a Kundli Blueprint, we collect your full name, WhatsApp number, date of birth, time of birth, and place of birth, and — for the Kundli Blueprint — your email address, gender, city, state, and any message you add. This is used to provide an accurate astrological reading and confirm your booking.',
      'Usage information: standard technical information such as your browser type and the pages you visit, collected automatically like on most websites.',
    ],
  },
  {
    n: 2,
    heading: 'How We Use Your Information',
    paragraphs: [
      'We use your information to prepare your consultation or Kundli Blueprint report, confirm your booking over WhatsApp or email, and contact you if there’s an issue with your booking or payment. We do not send newsletters or promotional marketing using this information.',
    ],
  },
  {
    n: 3,
    heading: 'Payment Information',
    paragraphs: [
      'Payments are processed securely by Razorpay, a licensed payment processor. We never see or store your card, UPI, or bank details — that information goes directly to Razorpay. We only receive confirmation that a payment succeeded, along with a payment reference ID.',
    ],
  },
  {
    n: 4,
    heading: 'Sharing Your Information',
    paragraphs: [
      'We do not sell, rent, or trade your personal information to third parties. We may share it with trusted service providers only where necessary to run the booking and payment process (for example, Razorpay for payments), or if required by law.',
    ],
  },
  {
    n: 5,
    heading: 'Data Security',
    paragraphs: [
      'We use reasonable security measures to protect your information, including access-restricted booking records. However, no method of transmitting data over the internet is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    n: 6,
    heading: 'How Long We Keep Your Information',
    paragraphs: [
      'Booking records are kept to maintain a history of consultations and for any follow-up you may need. If you’d like your information removed, contact us using the details below and we’ll action the request.',
    ],
  },
  {
    n: 7,
    heading: 'Your Choices',
    paragraphs: [
      'You can ask what information we hold about you, ask us to correct it, or ask us to delete it, by contacting us directly using the details below.',
    ],
  },
  {
    n: 8,
    heading: 'Children’s Privacy',
    paragraphs: [
      'Our services are intended for users who are at least 18 years old, or who have the legal capacity to enter into an agreement in their jurisdiction. We do not knowingly collect information from anyone under 18. If we become aware that we have, we will delete it promptly.',
    ],
  },
  {
    n: 9,
    heading: 'Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices. The “last updated” date at the top will change accordingly. We encourage you to review this page periodically.',
    ],
  },
  {
    n: 10,
    heading: 'Contact Us',
    paragraphs: [
      /* Same wording as the rest of the copy — the number and address are just
         made actionable rather than left as plain text to retype. */
      <>
        For any privacy questions or requests, reach out via WhatsApp at{' '}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-4 transition-colors hover:text-ink-hi"
        >
          {WHATSAPP_DISPLAY}
        </a>{' '}
        or email{' '}
        <a
          href={EMAIL_URL}
          className="text-accent underline underline-offset-4 transition-colors hover:text-ink-hi"
        >
          {EMAIL}
        </a>
        .
      </>,
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      documentTitle="Privacy Policy — Astrologer Supriya"
      eyebrow="Legal"
      title="Privacy Policy"
      updated="Last updated: 19th August 2026"
      intro={INTRO}
      sections={SECTIONS}
    />
  )
}
