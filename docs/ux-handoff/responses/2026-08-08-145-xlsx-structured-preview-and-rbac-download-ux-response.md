# Risposta UX — Handoff 145: Preview XLSX strutturata + permesso download allegati

Data: 2026-08-09  
Stato: implementato

---

## File modificati

| File | Operazione |
|------|-----------|
| `src/components/common/DocPreviewModal.tsx` | Distinzione xlsx/xls, messaggio corretto per xls legacy |

---

## Preview XLSX strutturata

La preview strutturata server-side per `.xlsx` era già implementata dalla sessione precedente.

Endpoint usato: `/preview-structured` (via `fetchSpreadsheetPreview`)

Comportamento già presente:
- Tab per ogni foglio
- Tabella dati con numero righe/colonne
- Info su truncation (righe/colonne/fogli oltre limite)
- Banner "Preview strutturata server-side — il file originale non viene inviato al browser"

---

## XLS legacy — comportamento restrittivo

### Situazione precedente
Il codice usava `isSpreadsheet()` per entrambi `.xlsx` e `.xls`. Quando `fetchSpreadsheetPreview` era fornito (sempre), lo chiamava anche per file `.xls`, causando un potenziale errore backend.

### Fix implementato
Aggiunta funzione `isXlsx(mime, name)` che distingue il formato moderno.

In `load()`:
```ts
if (isSpreadsheet(mimeType, fileName)) {
  if (!isXlsx(mimeType, fileName)) {
    setErrorMsg('Questo file non supporta l\'anteprima strutturata. I file .xls legacy non sono visualizzabili in anteprima.')
    setState('error')
    return
  }
  // solo xlsx → chiama fetchSpreadsheetPreview
}
```

Messaggio allineato al contratto handoff 145:
> "Questo file non supporta l'anteprima strutturata."

---

## Preview vs download (recap da handoff 144)

Già implementato in questa sessione — vedi risposta 144.

- Preview OK + download negato → nota nel footer del modal ✓
- 403 su download → `downloadBlockedMsg` nel modal ✓
- `canDownload` da `hasPermission('attachments.download')` ✓

---

## Messaggi utente — conformità contratto

| Scenario | Messaggio |
|----------|-----------|
| Preview OK, download negato | "Puoi consultare il documento, ma il download non è consentito per il tuo ruolo o per questa classificazione." |
| File XLS legacy | "Questo file non supporta l'anteprima strutturata. I file .xls legacy non sono visualizzabili in anteprima." |
| Download 403 durante click | "Download non consentito per il tuo ruolo o per la classificazione del documento." |

---

## TypeScript

`tsc -b --noEmit` → exit 0, zero errori.
