# UX Handoff 169 — Stato implementazione Timesheet avanzato + ABAC documenti

Data: 2026-08-13
Ambito: Turni / Timesheet, Amministrazione / Ruoli / Documenti
Priorità: Alta

## Scopo

Questo handoff riassume due blocchi backend completati e già validati:

1. **Timesheet avanzato**
2. **ABAC documenti chiarito lato ruolo/matrice**

Serve come punto unico di riallineamento per il team UX prima dei prossimi sviluppi.

---

## 1. Timesheet avanzato — pronto backend

### Documenti di dettaglio già disponibili

- `docs/ux-handoff/requests/2026-08-13-167-timesheet-advanced-anomalies-and-dashboard-contract.md`
- `docs/api/openapi.yaml`

### Stato

Backend completato e testato.

### Da recepire lato UX

- nuovi flag anomalia timesheet;
- nuovi KPI dashboard coordinatore;
- nuove sezioni `staff_totals[]` e `facility_totals[]`;
- visualizzazione coordinate geo negli eventi di presenza.

### Nota

Non servono nuove API oltre a quelle già documentate.

---

## 2. ABAC documenti — chiarimento definitivo contratto

### Documenti di dettaglio già disponibili

- `docs/ux-handoff/requests/2026-08-13-168-abac-document-policy-clarity-contract.md`
- `docs/api/openapi.yaml`

### Stato

Backend completato e testato.

### Punto chiave da recepire

La UI non deve più mostrare la logica come se tutti i ruoli richiedessero assegnazione attiva al minore.

Esistono ruoli privilegiati con bypass:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

Gli altri ruoli restano soggetti a:

- permesso RBAC;
- classificazione ABAC ammessa;
- assegnazione attiva al minore.

### Nuovi concetti che UX deve rendere espliciti

- differenza tra **preview/lettura** e **download**;
- differenza tra **ruolo privilegiato** e **ruolo che richiede assegnazione**;
- policy **deny by default** per nuove classificazioni documentali non ancora configurate.

### Regola importante

Non hardcodare lato frontend:

- elenco ruoli privilegiati;
- necessità di assegnazione;
- relazione tra lettura e download.

Usare esclusivamente i campi serializzati dal backend.

---

## 3. Verifica minima richiesta a UX

### Timesheet

- [ ] Dashboard coordinatore aggiornata con i nuovi KPI
- [ ] Tabelle `staff_totals` e `facility_totals` collegate ai payload reali
- [ ] Link mappa visibile quando esistono coordinate evento

### ABAC documenti

- [ ] Matrice accessi mostra badge/indicazione per ruolo privilegiato
- [ ] Pagina policy ruolo distingue chiaramente lettura e download
- [ ] Nuova classificazione mostra stato “non accessibile finché non configurata”

---

## 4. Stato qualità backend

Validazione completata sui test mirati:

- `DocumentAccessMatrixApiTest`
- `RoleDocumentPolicyApiTest`
- `CoordinatorDocumentPolicyAdminApiTest`
- `StaffTimesheetApiTest`

Il backend per questi due blocchi è pronto per l’allineamento UX.
