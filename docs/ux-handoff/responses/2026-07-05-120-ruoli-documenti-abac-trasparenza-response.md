# Risposta UX — Handoff 120: Ruoli e documenti — trasparenza ABAC obbligatoria

Data risposta: 2026-07-05  
Handoff: 2026-07-05-120  
Stato: ✅ Implementato

## Cosa è stato fatto

### 1. Pagina Ruoli — sezione "Accesso documentale" nel dettaglio ruolo

Aprendo il dettaglio di un ruolo (click sulla riga o icona permessi), compare ora una sezione **Accesso documentale (ABAC)** con:

- Un box informativo che distingue RBAC (accesso ai moduli) da ABAC (accesso ai documenti)
- Una tabella per classificazione (`internal`, `restricted`, `clinical`, `judicial`) con:
  - Lettura: Sì / Sì (con assegnazione) / No
  - Download: Sì / Sì (con assegnazione) / No
  - Note per casi particolari
- Una nota a piè pagina che esplicita che la matrice è basata sulla policy di sistema e non è configurabile da questa interfaccia

La matrice è statica sul frontend fino a quando il backend non esporrà `GET /admin/document-access-matrix`. È chiaramente marcata come tale.

### 2. Form crea/modifica ruolo — box ABAC

Nel form di creazione e modifica ruolo è stato aggiunto un box informativo (`alert-warning`) con il testo richiesto dall'handoff:

> I permessi di ruolo controllano l'accesso ai moduli e alle funzioni del sistema.  
> L'accesso ai documenti sensibili segue anche policy ABAC basate su classificazione, ruolo effettivo e assegnazione al minore. Queste regole non sono configurabili da questa interfaccia e non dipendono dai permessi RBAC qui assegnati.

### 3. Drawer "Informazioni sui ruoli" — spiegazione ABAC/RBAC

Il drawer è stato aggiornato con:

- Sezione **RBAC vs ABAC documentale** con due box distinti che spiegano la differenza
- Tabella delle classificazioni documentali (`internal`, `restricted`, `clinical`, `judicial`) con descrizione e regola di accesso
- Testo esplicativo: "un utente con permesso RBAC corretto può vedere il minore, ma non necessariamente tutti i suoi documenti"
- Nota che rimanda al dettaglio del singolo ruolo per la matrice completa
- Avviso che una console ABAC dedicata è pianificata per una versione futura

### 4. Scheda minore — guida ABAC documenti

Il componente `MinoriGuideContent` (drawer "Informazioni" nella scheda minore) è stato aggiornato:

- La sezione "Documenti e ABAC" ora spiega esplicitamente i tre fattori che determinano l'accesso: classificazione, ruolo effettivo, assegnazione al minore
- Aggiunto esempio concreto: "un Educatore assegnato può leggere `internal` ma non scaricare `restricted` né accedere a `clinical`/`judicial`"
- Sezione "Errori frequenti" aggiornata con:
  - 403 su documento → regola ABAC, non permesso modulo
  - Pulsante Scarica assente → download non consentito da policy ABAC
  - Operatore assente da tab Accesso → ruolo privilegiato, accesso implicito

## File modificati

- `frontend/src/pages/anagrafiche/RuoliPage.tsx`
- `frontend/src/pages/minori/MinoreDetailPage.tsx`

## Cosa NON è stato fatto (by design)

- Nessuna console ABAC amministrativa: non esiste ancora il backend (`GET /admin/document-access-matrix`)
- La matrice documentale nel detail ruolo è statica e marcata esplicitamente come tale
- I permessi RBAC della pagina Ruoli non sono stati modificati (controllano solo accesso ai moduli)

## Nota per backend

Quando sarà disponibile `GET /admin/document-access-matrix`, il frontend dovrà:
1. Chiamare l'endpoint al posto della mappa statica `DOC_ACCESS_BY_ROLE`
2. Rimuovere la nota "matrice statica" dal dettaglio ruolo
