# Risposta UX — Handoff 160: Roadmap Turni / ABAC / Modulo Minori

Data: 2026-08-10

---

## Stato: preso in carico come riferimento di priorità

---

## Riepilogo roadmap ricevuta

### Ordine di esecuzione concordato

1. **Turni / Timesheet** (Sprint 1-2)
2. **ABAC documenti / note** (Sprint 3-4)
3. **Modulo Minori** (Sprint 5-6)

---

## Stato UX attuale per fase

### Fase 1 — Turni / Timesheet

| Step | Stato UX |
|------|----------|
| 1.2 Anagrafica modelli turno | ✅ Pagina già implementata (CRUD modelli turno) |
| 1.3 Pianificazione settimanale | ✅ Pagina già implementata (planner settimanale coordinatore) |
| 1.4 Vista personale educatore | ✅ Pagina già implementata (Le mie settimane) |
| 1.1 Modello dati definitivo | ⏳ In attesa contratto backend (distinzione pianificato/effettivo) |
| 1.5 Consuntivazione turno | ⏳ In attesa handoff backend |
| 1.6 Scostamenti e anomalie | ⏳ In attesa handoff backend |
| 1.7 Audit | ⏳ In attesa handoff backend |

**Nota importante**: le pagine 1.2-1.4 già esistono ma potrebbero richiedere revisione quando il backend esporrà la distinzione definitiva tra `planned shift` e `actual shift`. UX non tratterà le due entità come equivalenti.

### Fase 2 — ABAC documenti / note

| Step | Stato UX |
|------|----------|
| 2.3 Matrice admin (parziale) | ✅ `DocumentAccessMatrixPage` già presente (preview/download per ruolo) |
| 2.1 Censimento classificazioni | ✅ `ClassificazioniPage` già presente |
| 2.2 Separazione azioni | ✅ Colonne preview / download già distinte |
| 2.4 Nuove classificazioni dinamiche | ⏳ In attesa handoff |
| 2.5 Estensione alle note | ⏳ In attesa handoff |
| 2.6 Audit ABAC | ⏳ In attesa handoff |

### Fase 3 — Modulo Minori

| Step | Stato UX |
|------|----------|
| 3.3 Bisogni categorizzati | ✅ Tab Bisogni presente in MinoreDetailPage |
| 3.4 PEI | ✅ Tab PEI con obiettivi, avanzamento, storico presente |
| 3.5 Collegamenti PEI → Attività/Diario | ✅ Implementato |
| 3.6 Dashboard minore | ✅ Implementata con trend PEI |
| 3.1 Background familiare | ⏳ In attesa handoff backend |
| 3.2 Diagnosi / DSM | ⏳ In attesa handoff backend (classificazione `clinical`) |

---

## Vincoli accolti

- **Turni**: UX non anticipa UI definitive su consuntivazione/scostamenti finché backend non espone il contratto `planned` vs `actual`
- **ABAC**: RBAC (accesso modulo) e ABAC (accesso contenuto sensibile) resteranno rappresentati separatamente nell'interfaccia
- **Minori**: ogni nuova sezione rispetterà RBAC + ABAC + audit prima di essere completata

---

## Prossima azione UX

In attesa dei prossimi handoff tecnici puntuali. UX procederà per blocchi, seguendo l'ordine sprint concordato.
