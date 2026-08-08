# Handoff UX/API — Stabilizzazione tecnica blocco Minori / Diario / Avvicinamenti / Messaggistica

Data: 2026-07-05  
Priorità: media  
Tipo: stabilizzazione tecnica post-fix

## Obiettivo

Chiudere alcuni falsi bug frontend dovuti a refusi TypeScript e piccoli mismatch di tipizzazione, senza cambiare il comportamento funzionale del software.

## Correzioni applicate

### 1. Messaggistica interna

File:

- `C:\Projects\FamilyHUB\frontend\src\pages\messaggi\MessaggiPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\messaggi\MessaggioDetailPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\services\api.ts`
- `C:\Projects\FamilyHUB\frontend\src\types\index.ts`

Correzioni:

- allineato il caricamento partecipanti al contratto attuale del client API
- corretta la tipizzazione dell’evento tastiera nel composer messaggi
- mantenuto il messaggio UX neutro in caso di backend non raggiungibile/non aggiornato

Impatto UX:

- nessun cambio layout richiesto
- nessun cambio di testo obbligatorio aggiuntivo oltre a quanto già consegnato con handoff `118`

### 2. Diario educativo

File:

- `C:\Projects\FamilyHUB\frontend\src\types\index.ts`
- `C:\Projects\FamilyHUB\frontend\src\pages\diario\DiarioPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\minori\tabs\DiarioMinoreTab.tsx`

Correzioni:

- aggiunto il tipo mancante `JournalEntryWrite`
- corrette le tipizzazioni dei setter form su `priority_level` e `mood_level`

Impatto UX:

- nessun cambio visuale
- il form Diario resta invariato

### 3. Scheda Caso minore

File:

- `C:\Projects\FamilyHUB\frontend\src\pages\minori\tabs\CasoMinoreTab.tsx`

Correzioni:

- corretto refuso tipo `MinorMinorCaseDetail` → `MinorCaseDetail`

Impatto UX:

- nessun cambio visuale
- nessuna modifica richiesta al team design

### 4. Avvicinamenti minore

File:

- `C:\Projects\FamilyHUB\frontend\src\pages\minori\tabs\AvvicinamentiMinoreTab.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\avvicinamenti\AvvicinamentiPage.tsx`

Correzioni:

- normalizzata la lettura dei partecipanti familiari tra:
  - `participants`
  - `minor_contacts`
  - `minor_contact`
- corretta la resa dei nomi in lista e dettaglio
- corretto un uso errato di `minorApi.list({})` in favore di `minorApi.list()`

Impatto UX:

- nessun cambio di flusso
- la UI può continuare a mostrare i partecipanti come prima
- migliora la stabilità quando il backend restituisce forme dati legacy/fallback

## Verifica eseguita

Build eseguita nel container frontend:

- comando: `docker compose exec frontend npm run build`
- esito: `OK`

## Nota per UX

Questo handoff non introduce nuove funzionalità.  
Serve a chiarire che eventuali anomalie precedenti in questi punti erano di stabilità del codice frontend e non di perimetro funzionale del backend.

## Warning non bloccanti rimasti

La build segnala solo warning di bundling/chunk size Vite:

- chunk JS molto grandi
- `api.ts` importato sia staticamente sia dinamicamente

Non bloccano UX e non richiedono azione immediata sul team design.
