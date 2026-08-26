# UX handoff response — 201

**Data risposta:** 2026-08-24
**Handoff:** 201 — Rich text: remediation stored XSS
**Priorità:** P0 sicurezza
**Esito:** IMPLEMENTATO

---

## File modificati

| File | Modifica |
|---|---|
| `frontend/package.json` | Aggiunti `dompurify ^3.2.6` (dep) e `@types/dompurify ^3.0.5` (devDep) |
| `frontend/src/utils/sanitize.ts` | **NUOVO** — helper `sanitizeRichText(html)` con DOMPurify + allowlist + hook `rel` |
| `frontend/src/components/common/RichTextEditor.tsx` | Rimossa regex `sanitize()`; `richToPlain` usa DOMPurify; tutti i sink usano `sanitizeRichText` |
| `frontend/src/pages/messaggi/MessaggioDetailPage.tsx` | `dangerouslySetInnerHTML={{ __html: sanitizeRichText(msg.body) }}` |
| `frontend/src/components/common/DocPreviewModal.tsx` | `dangerouslySetInnerHTML={{ __html: sanitizeRichText(htmlContent) }}` |

> **Azione richiesta:** eseguire `npm install` nella cartella `frontend/` sulla macchina di sviluppo per installare `dompurify` e `@types/dompurify` prima del build.

---

## Helper `sanitizeRichText`

File: `frontend/src/utils/sanitize.ts`

```typescript
import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'a']
const ALLOWED_ATTR = ['href', 'rel']

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'nofollow noopener noreferrer')
    const href = node.getAttribute('href') ?? ''
    if (href && !/^(https?:|mailto:)/i.test(href)) {
      node.removeAttribute('href')
    }
  }
})

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  })
}
```

Allowlist conforme al contratto handoff 201: tag `p br strong em u ul ol li h2 h3 a`, attributi `href rel`, protocolli `https: http: mailto:`, `rel="nofollow noopener noreferrer"` su ogni link.

---

## Copertura dei sink

| Sink | Prima | Dopo |
|---|---|---|
| `editorRef.current.innerHTML = value` (mount) | regex aggirabili | `sanitizeRichText(value)` |
| `onChange(editorRef.current.innerHTML)` (input) | regex aggirabili | `sanitizeRichText(...)` |
| `richToPlain(html)` | `innerHTML = html` diretto | `innerHTML = sanitizeRichText(html)` |
| `dangerouslySetInnerHTML` messaggi (`msg.body`) | nessuna protezione | `sanitizeRichText(msg.body)` |
| `dangerouslySetInnerHTML` DOCX preview (`htmlContent`) | nessuna protezione | `sanitizeRichText(htmlContent)` |

---

## Payload QA — esito atteso

| Payload | Risultato atteso |
|---|---|
| `<script>alert(1)</script >` | tag rimosso da DOMPurify |
| `<p onclick='alert(1)'>test</p>` | attributo `onclick` rimosso |
| `<p onmouseover=alert(1)>test</p>` | attributo rimosso |
| `<a href="javascript:alert(1)">test</a>` | `href` rimosso dall'hook (protocollo non ammesso) |
| payload SVG/MathML con handler | tag non in allowlist → rimossi |
| HTML malformato con tag annidati | DOMPurify normalizza e pulisce |
| link `https://example.com` | preservato, `rel` aggiunto |
| `<strong>grassetto</strong>` | preservato |

---

## Build e CodeQL

- `npm run build`: da eseguire su macchina di sviluppo dopo `npm install` (I/O error sandbox — invariato).
- Gli alert CodeQL `#17`, `#18`, `#19` dipendono dall'assegnazione di HTML non sanitizzato a `innerHTML` / `dangerouslySetInnerHTML`. Tutti i sink identificati usano ora `sanitizeRichText` via DOMPurify. Una nuova analisi CodeQL dovrebbe chiuderli automaticamente senza marking manuale.

---

## Limiti residui

- `npm install` deve essere eseguito prima del build — il commit aggiunge `dompurify` al `package.json` ma non al lock file del sandbox.
- Verifica manuale dei payload QA richiesta su ambiente live con browser.
- Qualsiasi nuovo `dangerouslySetInnerHTML` o assegnazione diretta a `innerHTML` introdotto in futuro deve usare `sanitizeRichText` — non creare sanitizzazioni locali alternative.
