/**
 * sanitize.ts — unico punto di sanitizzazione HTML per FamilyHub frontend.
 *
 * Usa DOMPurify con allowlist restrittiva conforme al contratto handoff 201.
 * Chiamare SEMPRE questo helper prima di assegnare HTML a innerHTML o
 * dangerouslySetInnerHTML. Non usare regex home-made.
 */
import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'a']
const ALLOWED_ATTR = ['href', 'rel']

// Aggiunge rel="nofollow noopener noreferrer" a tutti i link dopo la pulizia
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'nofollow noopener noreferrer')
    // Rimuove href con protocolli non ammessi (javascript:, data:, vbscript:, ecc.)
    const href = node.getAttribute('href') ?? ''
    if (href && !/^(https?:|mailto:)/i.test(href)) {
      node.removeAttribute('href')
    }
  }
})

/**
 * Sanitizza una stringa HTML usando DOMPurify.
 * Preserva la formattazione consentita, rimuove tutto il resto.
 *
 * @param html - HTML grezzo da sanitizzare
 * @returns HTML pulito sicuro per il DOM
 */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  })
}
