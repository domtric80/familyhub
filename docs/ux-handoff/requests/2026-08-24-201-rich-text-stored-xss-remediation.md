# UX handoff 201 — Rich text: remediation stored XSS

Data: 2026-08-24
Priorità: P0 sicurezza
Stato backend: difesa in profondità implementata
Stato UX: implementato e validato localmente il 2026-08-26; chiusura CodeQL in attesa della CI GitHub

## Problema confermato

`frontend/src/components/common/RichTextEditor.tsx` usa regex aggirabili per rimuovere script e attributi evento. Il contenuto viene poi assegnato a `innerHTML` nell'editor e a `dangerouslySetInnerHTML` nei messaggi.

Alert GitHub interessati: CodeQL `#17`, `#18`, `#19`.

## Modifiche frontend obbligatorie

1. Aggiungere `dompurify` come dipendenza runtime mantenuta.
2. Creare un unico helper `sanitizeRichText(html)` riutilizzato dall'editor e da ogni renderer HTML.
3. Configurare l'allowlist esatta:
   - tag: `p`, `br`, `strong`, `em`, `u`, `ul`, `ol`, `li`, `h2`, `h3`, `a`;
   - attributi: solo `href` e `rel` sui link;
   - protocolli link: `https:`, `http:`, `mailto:`;
   - aggiungere `rel="nofollow noopener noreferrer"` ai link.
4. Sanitizzare:
   - `value` prima dell'assegnazione a `editorRef.current.innerHTML`;
   - `editorRef.current.innerHTML` prima di `onChange`;
   - `msg.body` prima di `dangerouslySetInnerHTML` in `MessaggioDetailPage.tsx`;
   - `htmlContent` DOCX prima di `dangerouslySetInnerHTML` in `DocPreviewModal.tsx`.
5. `richToPlain` deve ricevere o produrre contenuto già sanitizzato.

## Payload QA minimi

- `<script>alert(1)</script >`;
- `<p onclick='alert(1)'>test</p>`;
- `<p onmouseover=alert(1)>test</p>`;
- `<a href="javascript:alert(1)">test</a>`;
- payload SVG e MathML con handler o URI attive;
- HTML malformato con tag annidati.

## Risultato atteso

- nessun payload eseguibile nel DOM;
- formattazione consentita preservata;
- link non ammessi privati di `href`;
- build, test frontend e CodeQL verdi;
- gli alert `#17`, `#18`, `#19` devono essere chiusi automaticamente da una nuova analisi CodeQL, non manualmente.

## Contratto backend

Il backend applica la stessa allowlist sia prima della cifratura sia durante la lettura, proteggendo anche i messaggi storici. Il frontend deve comunque sanitizzare al sink per difesa in profondità.
