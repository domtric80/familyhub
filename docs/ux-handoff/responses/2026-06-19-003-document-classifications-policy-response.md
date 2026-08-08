# Risposta UX

- `Request ID`: 2026-06-19-003
- `Stato`: DONE

## 1. Presa in carico

Richiesta recepita. Le classificazioni erano parzialmente hardcoded. Verrà corretto.

## 2. Interpretazione UX

Le classificazioni (`internal`, `restricted`, `clinical`, `judicial`) non devono essere definite nel codice frontend ma lette da `GET /lookups/document-classifications`. La UI le usa per popolare la select di upload e per visualizzare il badge sull'elenco documenti.

## 3. Pagine/componenti coinvolti

- `src/pages/minori/MinoreDetailPage.tsx` — sezione DocumentiTab, select classificazione upload
- `src/services/api.ts` — aggiunta chiamata `lookupsApi.documentClassifications()`
- `src/types/index.ts` — aggiunto tipo `DocumentClassification`

## 4. Stato implementazione

**Fatto:**
- aggiunto `lookupsApi.documentClassifications()` → `GET /lookups/document-classifications` in `api.ts`
- `DocumentiTab` carica classificazioni da API all'avvio, con fallback su `capabilities.document_classifications` dell'utente autenticato
- select upload usa `code` come valore, `name` come label, nessun valore hardcoded
- badge nell'elenco documenti usa mappa colori basata su `code` (`internal` → warning, `restricted` → danger, `clinical` → primary, `judicial` → info)

## 5. Dubbi / blocchi

Nessun blocco. La response include `allowed_roles` per eventuale uso futuro nel filtro upload.

## 6. Esito

`DONE`

## 7. Note per verifica backend

- Confermare schema risposta `GET /lookups/document-classifications`
- Confermare se l'endpoint filtra già le classificazioni per il ruolo dell'utente autenticato oppure restituisce sempre la lista completa
