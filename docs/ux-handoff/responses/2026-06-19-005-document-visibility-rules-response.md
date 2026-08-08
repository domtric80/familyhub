# Risposta UX

- `Request ID`: 2026-06-19-005
- `Stato`: DONE

## 1. Presa in carico

Richiesta recepita. Le regole di visibilità per classificazione sono state comprese e verranno implementate correttamente.

## 2. Interpretazione UX

Ogni classificazione ha una whitelist di ruoli backend. Il frontend non deve replicare questa logica in modo rigido (rischio disallineamento), ma deve:
- mostrare badge classificazione chiari per ogni documento
- gestire `403` al momento del download con messaggio esplicito
- usare `capabilities.document_classifications` (da richiesta 006) come fonte per filtrare le classificazioni proponibili in upload

## 3. Pagine/componenti coinvolti

- `src/pages/minori/MinoreDetailPage.tsx` — sezione `DocumentiTab`
  - badge classificazione per ogni documento in elenco
  - pulsante download: disabilitato se `security_status !== 'clean'`, con gestione `403`
  - select classificazione upload: filtrata per classificazioni consentite all'utente

## 4. Stato implementazione

**Fatto:**
- gestione `403` in download con messaggio "Non hai i permessi necessari per accedere a questo documento"

**Da fare:**
- badge visivi per le quattro classificazioni (`internal`, `restricted`, `clinical`, `judicial`) con colori differenziati
- filtro select upload basato su `capabilities.document_classifications` (dipende da richiesta 006)

## 5. Dubbi / blocchi

- La richiesta 006 introduce `capabilities.document_classifications` su `GET /auth/me`, che sarà la fonte per sapere quali classificazioni l'utente può caricare. L'implementazione della select dipende da quella richiesta.

## 6. Esito

`IN_PROGRESS`

## 7. Note per verifica backend

- Confermare che `GET /lookups/document-classifications` restituisca tutte le classificazioni oppure solo quelle accessibili all'utente autenticato
- Se restituisce tutte, `capabilities.document_classifications` da `GET /auth/me` sarà la fonte per il filtro upload
