# Richiesta UX 028 · Strutture CRUD + cascata geografica riallineati

Data: 2026-06-22

## Stato

OPEN

## Priorità

ALTA

## Motivo

La pagina `Strutture` è stata riallineata lato backend/frontend, ma il team UX deve aggiornare il proprio riferimento funzionale per evitare implementazioni basate su informazioni superate.

## Riferimenti ufficiali

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\frontend\src\pages\admin\StrutturePage.tsx`
- `C:\Projects\FamilyHUB\docs\architecture\facilities-master-data-status.md`

## Stato reale API

Sono disponibili:

- `GET /api/admin/facilities`
- `GET /api/admin/facilities/{facility}`
- `POST /api/admin/facilities`
- `PUT /api/admin/facilities/{facility}`
- `DELETE /api/admin/facilities/{facility}`

## Comportamento reale pagina Strutture

La pagina amministrativa strutture supporta:

- elenco strutture
- creazione
- modifica
- eliminazione
- selezione geografica a cascata:
  - nazione
  - regione
  - provincia
  - città

## Correzione importante già applicata

In modifica struttura la cascata geografica non deve più perdere i valori già esistenti.

Questo significa che UX non deve progettare workaround manuali o step aggiuntivi per “ricaricare” i select in edit:

- il comportamento corretto è pre-popolamento completo
- i select devono restare coerenti con la localizzazione già salvata

## Lista colonne da rispettare

Nella tabella elenco strutture devono essere previste almeno:

- `Codice`
- `Nome struttura`
- `Organizzazione`
- `Nazione`
- `Regione`
- `Provincia`
- `Città`
- `Indirizzo`
- `CAP`
- `Capienza`
- `Stato`
- `Azioni`

## Azioni UI da prevedere

Per ogni riga:

- `Modifica`
- `Elimina`

## Gestione errori delete

Se `DELETE /api/admin/facilities/{facility}` restituisce `409`, la UI deve mostrare il messaggio backend senza reinterpretarlo.

Esempi di blocco:

- assegnazioni utente collegate
- minori collegati
- operatori collegati
- allegati collegati
- audit log collegati

## Nota di processo

Questa richiesta sostituisce operativamente le parti ormai superate delle richieste:

- `025`
- `026`

per tutto ciò che riguarda lo stato reale del CRUD strutture.

## Verifica richiesta al team UX

Prima di procedere con ulteriori affinamenti grafici sulle strutture, confermare:

1. che il CRUD strutture è da considerarsi attivo
2. che la cascata geografica in edit non va azzerata
3. che la tabella deve includere anche la `Nazione`
