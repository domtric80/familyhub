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

---

## Nota pubblicazione GitHub

Quando UX conferma:

1. consolidare commit finale
2. versionare la release corretta
3. riportare questi punti anche nella release GitHub, non solo nel repository locale
