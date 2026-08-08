# Risposta UX

- `Request ID`: 2026-06-19-001
- `Stato`: DONE

## 1. Presa in carico

Richiesta recepita e implementata. Tutte le lavorazioni sono state eseguite sul file `frontend/src/pages/minori/MinoreDetailPage.tsx` e sul file dei tipi `frontend/src/types/index.ts`.

## 2. Interpretazione UX

Il team ha implementato le due sezioni richieste all'interno della pagina di dettaglio minore già esistente (`MinoreDetailPage`), che espone una navigazione a tab. Le due tab coinvolte sono **Storico** e **Documenti**.

## 3. Pagine/componenti coinvolti

- `src/pages/minori/MinoreDetailPage.tsx` — pagina principale aggiornata con due nuovi sottocomponenti interni:
  - `StoricoTab` — gestisce la cronologia immutabile
  - `DocumentiTab` — gestisce l'elenco documenti, l'upload e il download
- `src/types/index.ts` — aggiunto tipo `MinorHistoryActor` e campo opzionale `actor` su `MinorHistoryEntry`

## 4. Dubbi / blocchi

### Campo `actor` nello storico

Lo schema `MinorHistoryEntry` in `openapi.yaml` espone solo `actor_user_id` (integer). La request documento elenca però `actor.first_name`, `actor.last_name`, `actor.email` come campi UI rilevanti.

**Soluzione adottata**: il tipo TypeScript è stato esteso con un campo opzionale `actor?: MinorHistoryActor | null`. La UI mostra i dati dell'attore se presenti, altrimenti ricade su `Utente #<id>` o `Sistema`. Nessun campo inventato: l'interfaccia è resiliente a entrambi i casi.

**Richiesta al backend**: confermare se `actor` verrà aggiunto allo schema OpenAPI oppure se i dati dell'attore devono essere ricavati da `snapshot`.

### Permessi upload/download

La visibilità dei pulsanti upload e download non è condizionata a `attachments.upload` / `attachments.read` lato frontend perché `UserProfile` non espone ancora i permessi in modo strutturato. Il backend applica correttamente i vincoli; la UI gestisce il `403` con messaggio esplicito. Non appena i permessi saranno esposti, sarà possibile nascondere i pulsanti in anticipo.

## 5. Esito

`DONE`

## 6. Note per verifica backend

- Verificare che `GET /minors/{minor}/history` restituisca (o possa restituire) un oggetto `actor` embedded con `first_name`, `last_name`, `email`, o indicare come ottenere queste informazioni.
- Verificare che `POST /minors/{minor}/documents` restituisca il documento completo con `document_type` e `attachment` annidati (come da schema `MinorDocument`), in modo che la lista venga aggiornata localmente senza un secondo fetch.
- Verificare che `GET /lookups/document-types` sia accessibile a tutti i ruoli che possono aprire la scheda minore.
