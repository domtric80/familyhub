# FamilyHub — Draft release notes non pubblicate

Data draft: 2026-08-09  
Stato: non pubblicare ancora su GitHub, in attesa chiusura UX e commit finale

---

## In lavorazione

### Turni / Timesheet

- attivato il workflow rettifiche timesheet `pending -> approved/rejected`
- introdotto audit trail dedicato alla richiesta e alla revisione delle rettifiche sul consuntivo
- mantenuto separato lo storico timbrature dal ricalcolo dei minuti finali
- collegata la UI coordinatore per invio richiesta, approvazione e rifiuto rettifiche da `Verifica timesheet`
- resa visibile la lista rettifiche anche in `Le mie presenze`
- aggiunta copertura test API per creazione, approvazione e rifiuto rettifiche

### Documentazione tecnica

- aggiornato `docs/api/openapi.yaml` con endpoint `POST /api/admin/timesheets/{timesheetEntry}/adjustments` e revisione `/approve` `/reject`
- preparato handoff UX dedicato per comportamento pagina, stati e payload

### Documenti / Policy ABAC

- separata amministrazione della policy documentale per `lettura/preview` e `download`
- aggiornato il contratto ruolo-documenti con `classification_codes` e `download_classification_codes`
- resa esplicita la matrice classificazioni con `Ruoli lettura` e `Ruoli download`
- aggiornati test backend per policy documentale coordinatore/admin
- allineate API e UI ruolo per evitare download consentiti senza lettura della stessa classificazione

---

## Nota pubblicazione GitHub

Quando UX conferma:

1. consolidare commit finale
2. versionare la release corretta
3. riportare questi punti anche nella release GitHub, non solo nel repository locale
