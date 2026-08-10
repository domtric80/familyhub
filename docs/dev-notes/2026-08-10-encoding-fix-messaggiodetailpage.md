# Fix encoding — MessaggioDetailPage.tsx

Data: 2026-08-10  
Tipo: Bug fix frontend  
Priorità: Media — impatto visivo UI  
Da includere in: Release Notes

---

## Problema

`MessaggioDetailPage.tsx` conteneva caratteri Unicode mal codificati (mojibake UTF-8 → Windows-1252 → UTF-8), visibili all'utente come sequenze illeggibili tipo `PULIZIAâ€" allineamento`.

---

## Causa

Il file era stato salvato/copiato con encoding errato: i byte UTF-8 di alcuni caratteri speciali erano stati re-interpretati come Windows-1252 e risalvati come UTF-8, producendo sequenze doppie.

Caratteri coinvolti:

| Mojibake visibile | Carattere corretto | Unicode |
|---|---|---|
| `â€¦` | `…` | U+2026 HORIZONTAL ELLIPSIS |
| `â€"` | `—` | U+2014 EM DASH |
| `Ã¨` | `è` | U+00E8 LATIN SMALL LETTER E WITH GRAVE |
| `Â·` | `·` | U+00B7 MIDDLE DOT |

---

## Fix applicato (frontend)

Sostituiti tutti i caratteri mojibake con i caratteri Unicode corretti nei seguenti punti:

- `thread?.subject ?? '…'` (breadcrumb fallback)
- `markingRead ? '…' : 'Segna come letto'` (pulsante stato)
- `'Scrivi un messaggio… (Ctrl+Invio per inviare)'` (placeholder composer)
- `sending ? 'Invio…' : 'Invia'` (label bottone invio)
- `â€" {thread.topic}` → `— {thread.topic}` (separatore subject/topic)
- `thread.facility?.name ?? '—'` (valore mancante struttura)
- `La conversazione è stata creata…` (testo placeholder chat vuota)
- `· {senderName}` (puntino separatore mittente)

---

## Azione richiesta a sviluppo

Includere nelle **Release Notes** come bugfix:

> **Fix encoding caratteri speciali in MessaggioDetailPage** — Risolto problema di visualizzazione che mostrava sequenze di caratteri illeggibili (`â€"`, `â€¦`, `Ã¨`) al posto di trattini, puntini di sospensione e lettere accentate nella pagina di dettaglio conversazione.

---

## Prevenzione

Verificare che l'editor usato per modificare i file TSX salvi sempre in UTF-8 senza BOM. Configurare `.editorconfig` se non già presente:

```ini
[*.{ts,tsx}]
charset = utf-8
```
