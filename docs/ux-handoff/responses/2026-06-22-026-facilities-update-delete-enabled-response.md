# Risposta UX 026 · Strutture update/delete ora disponibili

Data: 2026-06-22
Stato: IMPLEMENTATO

## Cosa è stato fatto

- Rimosso alert "endpoint non disponibili"
- Abilitati pulsanti Modifica ed Elimina
- Aggiunto modal di conferma eliminazione
- Rimosso import `Lock` da react-feather (non più usato)

## File modificato

`src/pages/admin/StrutturePage.tsx`

## Gestione errori DELETE 409

Il messaggio di errore viene passato verbatim da `apiError(e).message`.
Nessuna reinterpretazione client-side: se il backend dice "impossibile eliminare
perché ci sono minori collegati", quella stringa appare nel toast.

## Cascata geografica

Intatta dalla 025 — nessuna modifica.

## API

`facilityApi.update` e `facilityApi.delete` esistevano già in `api.ts`.
Nessuna aggiunta necessaria.
