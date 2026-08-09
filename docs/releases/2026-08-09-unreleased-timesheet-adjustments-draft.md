# FamilyHub — Draft release notes non pubblicate

Data draft: 2026-08-09  
Stato: non pubblicare ancora su GitHub, in attesa chiusura UX e commit finale

---

## In lavorazione

### Turni / Timesheet

- attivata la creazione operativa delle rettifiche timesheet
- introdotto audit trail dedicato alle rettifiche sul consuntivo
- mantenuto separato lo storico timbrature dal ricalcolo dei minuti finali
- collegata la UI coordinatore per aggiunta rettifiche da `Verifica timesheet`
- resa visibile la lista rettifiche anche in `Le mie presenze`
- aggiunta copertura test API per creazione rettifica con ricalcolo minuti

### Documentazione tecnica

- aggiornato `docs/api/openapi.yaml` con endpoint `POST /api/admin/timesheets/{timesheetEntry}/adjustments`
- preparato handoff UX dedicato per comportamento pagina e payload

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
