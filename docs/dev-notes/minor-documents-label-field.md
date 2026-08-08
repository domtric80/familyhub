# Dev Note — Campo `label` (o `name`) su `minor_documents`

**Data:** 2026-07-03  
**Autore:** Frontend team  
**Priorità:** Alta  

---

## Contesto

Nel form degli **Avvicinamenti** (sia pagina globale che tab Minore), la sezione "Provvedimento autorizzativo" permette ora di collegare un documento esistente del minore all'avvicinamento tramite il campo `authorization_minor_document_id`.

Per selezionare il documento da un `<select>`, il frontend mostra attualmente:

```
{tipo_documento} — {nome_file_senza_estensione}
```

dove `nome_file_senza_estensione` deriva da `attachment.original_name` (es. `decreto_123_2026.pdf` → `decreto_123_2026`).

---

## Problema

Il nome del file caricato (`attachment.original_name`) non è sempre un'etichetta leggibile o significativa per l'utente (es. `scan_20260615_0001.pdf`).

---

## Richiesta

Aggiungere alla tabella `minor_documents` (o all'entità equivalente) un campo opzionale:

```
label  VARCHAR(255)  NULL  DEFAULT NULL
```

**Alternativa accettata:** `name`, `display_name`, o `title` — il nome è libero, l'importante è che sia un campo testuale opzionale che l'utente può compilare per dare un nome leggibile al documento.

---

## Utilizzo lato frontend

Al momento del **caricamento di un nuovo documento** (upload), il frontend invia già questo campo nel `FormData`:

```js
if (uploadLabel) fd.append('label', uploadLabel)
```

Il valore è pre-compilato automaticamente dal nome file senza estensione, ma l'utente può modificarlo liberamente prima di caricare.

Nella **visualizzazione** (select, tabelle, modal), il frontend userebbe `doc.label ?? doc.attachment?.original_name` come stringa di display.

---

## API coinvolte

- `POST /minors/{id}/documents` — aggiungere `label` tra i campi accettati nel body multipart
- `GET /minors/{id}/documents` — includere `label` nella risposta (`MinorDocument.label`)
- `PATCH /minors/{id}/documents/{doc_id}` (se esiste) — accettare aggiornamento di `label`

---

## Impatto tipo TypeScript

Una volta disponibile, aggiornare `MinorDocument` in `frontend/src/types/index.ts`:

```ts
export interface MinorDocument {
  id: number
  label?: string | null          // ← NUOVO campo da aggiungere
  document_type?: { id: number; name: string } | null
  attachment?: {
    original_name: string
    url?: string
    size?: number
  } | null
  // ... altri campi
}
```
