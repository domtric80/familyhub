# Richiesta UX 026 · Strutture update/delete ora disponibili

Data: 2026-06-22

## Stato

OPEN

## Obiettivo

Allineare il frontend strutture al nuovo stato backend.

## Nuovo stato backend

Sono ora disponibili:

- `PUT /api/admin/facilities/{facility}`
- `DELETE /api/admin/facilities/{facility}`

Endpoint già presenti:

- `GET /api/admin/facilities`
- `POST /api/admin/facilities`

## Impatto pagina

Pagina:

- `C:\Projects\FamilyHUB\frontend\src\pages\admin\StrutturePage.tsx`

## Modifiche richieste

### Rimuovere

- alert che dice che modifica/elimina non sono disponibili
- pulsanti `Modifica` e `Elimina` disabilitati

### Abilitare

- modifica struttura reale
- elimina struttura reale

## Gestione errori obbligatoria

Se `DELETE` restituisce `409`, mostrare il messaggio backend senza reinterpretarlo.

Possibili casi:

- assegnazioni utente collegate
- minori collegati
- operatori collegati
- allegati collegati
- audit log collegati

## Vincolo importante

La UI non deve mai mostrare “eliminazione riuscita” se il backend restituisce `409`.

## Nota

La cascata geografica struttura resta comunque richiesta nella `025`.
Questa `026` sblocca solo il CRUD reale update/delete.
