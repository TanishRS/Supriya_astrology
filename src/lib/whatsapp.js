import { WHATSAPP_NUMBER } from '../data.js'

/* [NEEDS CLIENT DECISION] There is still no booking backend. Both the
   consultation form and the detailed-file form compose a pre-filled WhatsApp
   message and open the chat — the visitor must press send themselves, so a
   submission is only received if they complete that step. Swap this for a real
   backend / calendar + payment when the client decides. */
export function openWhatsApp(intro, fields) {
  const lines = [intro, '']
  for (const [label, value] of fields) {
    lines.push(`${label}: ${value?.toString().trim() || '—'}`)
  }
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
  window.open(url, '_blank', 'noopener,noreferrer')
  return url
}
