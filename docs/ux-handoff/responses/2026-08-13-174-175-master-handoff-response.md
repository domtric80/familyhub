# FamilyHub — Risposta handoff UX — 174 (Timesheet master) + 175 (ABAC master)

Data: 2026-08-13  
Riferimenti: `2026-08-13-174-timesheet-master-handoff.md`, `2026-08-13-175-abac-master-handoff.md`

---

## Handoff 174 — Timesheet master

### Stato implementazione corrente

| Pagina | Stato | Note |
|---|---|---|
| `Le mie presenze` (`MiePresentePage`) | ✅ Implementata | Geo fallback `geo_latitude ?? latitude` già applicato |
| `Verifica timesheet` (`VerificaTimesheetPage`) | ✅ Implementata | Geo fallback applicato, badge stati |
| `Dashboard timesheet` (`TimesheetCoordDashboardPage`) | ✅ Implementata | Seconda riga KPI (notturne, violazioni, operatori con anomalie), tabelle staff_totals e facility_totals |
| `Mia settimana` (`MiaSettimanaPage`) | ⏳ Da integrare con chiusura turno | Vedi handoff 172 |
| `Pianificazione` (`PianificazionePage`) | ⏳ Da estendere | Vedi handoff 170, 171, 173 |
| `Chiusura mese` | ⏳ Da implementare | Endpoint: `GET/POST /api/admin/timesheet-month-locks` |
| `Export avanzato` | ⏳ Da implementare | Endpoint: `GET /api/admin/timesheets/export.csv` e `.pdf` |

### Architettura garantita

Il frontend rispetta la distinzione a tre livelli imposta dal backend:

- `staff_shift_assignment` → turno pianificato
- `staff_attendance_event` → evento presenza grezzo
- `staff_timesheet_entry` → consuntivo firmato

Nessuna pagina mescola questi oggetti.

### Regole mantenute

- KPI sempre da backend, mai ricalcolati in frontend
- Stati operativi sempre da payload (`status`, `can_submit`, `has_open_anomalies`)
- Anomalie mostrate con evidenza colore (HIGH_PRIORITY_FLAGS → rosso, altre → giallo)
- Geo coordinate: `geo_latitude ?? latitude` per retrocompatibilità

---

## Handoff 175 — ABAC master

### Stato implementazione corrente

| Sezione | Stato | Note |
|---|---|---|
| `Matrice accesso documenti` (`DocumentAccessMatrixPage`) | ✅ Implementata | Badge privilegiato, conteggi lettura/download separati, deny-by-default box, lista ruoli privilegiati da `meta.privileged_role_codes` |
| `Ruoli > Policy documentale` | ✅ Implementata | `GET/PUT /api/admin/roles/{role}/document-policy` |
| `Documenti minore` — preview | ✅ Implementato | Preview e download come azioni separate, gestione 403 con messaggio ABAC |
| `Documenti minore` — download | ✅ Implementato | `canDownload` da `hasPermission('attachments.download')` |
| `Note minore` classificate | ✅ Implementate | Select classificazione da API, stessa tassonomia documentale |
| `Messaggistica classificata` | ✅ Implementata | Badge classificazione su thread, filtro partecipanti da backend |

### Regole garantite

- Nessuna lista hardcoded di ruoli privilegiati: `role_has_minor_assignment_bypass` letto da payload
- `read ≠ download`: sempre distinti a livello UI
- Nuove classificazioni negate di default: alert esplicito in `DocumentAccessMatrixPage`
- Regola assegnazione minore (`summary.minor_assignment_rule`) letta da backend, non dedotta in frontend
- Note classificate e thread classificati usano la stessa tassonomia (`document_classifications`)

### Checklist finale ABAC

- [x] Pagina matrice accesso documenti basata su `GET /api/admin/document-access-matrix`
- [x] Pagina policy ruolo documentale basata su `GET/PUT /api/admin/roles/{role}/document-policy`
- [x] Evidenza grafica lettura / download / bypass / assegnazione attiva
- [x] Messaggio esplicito nuove classificazioni negate di default
- [x] Documenti minore: preview e download come azioni separate
- [x] Note minore: select classificazione coerente con document classifications
- [x] Messaggistica interna: badge classificazione + filtro partecipanti per classificazione

---

## Prossimi step Turni

Da implementare in ordine (handoff 170 → 171 → 172 → 173):

1. **170** — Calendario mensile struttura + vista personale mensile operatore
2. **171** — Sostituzioni operative (form, badge "Sostituito", effective_staff_member)
3. **172** — Chiusura e firma turno in `MiaSettimanaPage` (operational state machine)
4. **173** — Tab "Scostamenti e anomalie" in `PianificazionePage`
