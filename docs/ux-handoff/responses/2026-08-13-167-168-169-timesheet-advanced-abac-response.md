# UX Handoff Response — 167, 168, 169

Data risposta: 2026-08-13
Riferimento richieste: 167 (Timesheet avanzato), 168 (ABAC documenti), 169 (riepilogo)

---

## Handoff 167 — Timesheet avanzato: anomalie, dashboard, geo eventi

### Stato: ✅ Implementato

### Modifiche effettuate

#### `frontend/src/types/index.ts`

Esteso `TimesheetDashboardSummary` con i nuovi campi:
- `night_minutes_total`
- `minimum_rest_violations_count`
- `maximum_daily_hours_violations_count`
- `weekly_hours_threshold_exceeded_count`
- `staff_with_open_anomalies_count`

Esteso `TimesheetDashboardOpenAnomaly` con:
- `actual_start`
- `actual_end`
- `night_minutes`

Aggiunti due nuovi tipi:
- `TimesheetDashboardStaffTotal`
- `TimesheetDashboardFacilityTotal`

Esteso `TimesheetCoordinatorDashboardResponse` con:
- `staff_totals?: TimesheetDashboardStaffTotal[]`
- `facility_totals?: TimesheetDashboardFacilityTotal[]`

Aggiornato `AttendanceEvent` con:
- `geo_latitude?: number | null`
- `geo_longitude?: number | null`

#### `frontend/src/pages/turni/TimesheetCoordDashboardPage.tsx`

**Nuovi flag anomalia con label:**

| Codice | Label |
|---|---|
| `overtime_detected` | Straordinario rilevato |
| `absence_detected` | Assenza / copertura incompleta |
| `maximum_daily_hours_exceeded` | Superamento ore giornaliere |
| `minimum_rest_violation` | Riposo minimo non rispettato |
| `weekly_hours_threshold_exceeded` | Superamento soglia settimanale |

**Resa visiva differenziata:** i flag `minimum_rest_violation`, `maximum_daily_hours_exceeded`, `weekly_hours_threshold_exceeded` usano `badge-light-danger` invece di `badge-light-warning`.

**Seconda riga KPI aggiunta:**
- Ore notturne (`night_minutes_total`)
- Violazioni riposo minimo (`minimum_rest_violations_count`)
- Superamenti ore giornaliere (`maximum_daily_hours_violations_count`)
- Operatori con anomalie (`staff_with_open_anomalies_count`)

**Nuova sezione "Ore per operatore"** — tabella da `staff_totals[]`, visibile solo se non vuota:
- Operatore, Entry, Ore lavorate, Ore straordinarie, Ore notturne, Assenze, Anomalie (badge rosso), Rettifiche pending (badge arancione)

**Nuova sezione "Totali per struttura"** — tabella da `facility_totals[]`, visibile solo se non vuota:
- Struttura, Entry, Ore lavorate, Ore straordinarie, Ore notturne, Assenze, Entry con anomalie

#### `frontend/src/pages/turni/VerificaTimesheetPage.tsx`
#### `frontend/src/pages/turni/MiePresentePage.tsx`

Per ogni `attendance_event` nel pannello dettaglio:
- Se `geo_latitude`/`geo_longitude` (o fallback `latitude`/`longitude`) presenti → badge verde "Posizione disponibile" con link OpenStreetMap
- Se coordinate assenti → testo grigio "Posizione assente"

Formula link OSM usata:
```
https://www.openstreetmap.org/?mlat={LAT}&mlon={LON}#map=17/{LAT}/{LON}
```

### QA check
- [x] I nuovi KPI leggono i valori reali (opzionali con `??` fallback)
- [x] Le tabelle `staff_totals`/`facility_totals` non renderizzano se array vuoto o assente
- [x] Le nuove anomalie hanno label leggibile
- [x] Link mappa compare solo se coordinate presenti
- [x] "Posizione assente" compare se coordinate mancanti
- [x] Nessun campo testuale libero per i flag

---

## Handoff 168 — ABAC documenti: matrice chiara, bypass privilegiati, deny by default

### Stato: ✅ Implementato

### Modifiche effettuate

#### `frontend/src/pages/anagrafiche/DocumentAccessMatrixPage.tsx`

**Badge "Ruolo privilegiato"** — visualizzato nel nome ruolo quando `role_has_minor_assignment_bypass = true`. L'elenco non è hardcoded: viene letto da `role.role_has_minor_assignment_bypass` del payload backend.

**Regola assegnazione minore** — per ogni riga ruolo visualizzata come badge sotto il nome:
- `bypass_for_privileged_role` → "Bypass assegnazione minore" (verde)
- `active_minor_assignment_required` → "Richiede assegnazione minore" (giallo)
- Altro → valore grezzo dal backend

**Contatori classificazioni** — colonna "Classificazioni leggibili" sostituita con:
- `N lettura` (verde)
- `N download` (blu)

letti da `summary.readable_classifications_count` e `summary.downloadable_classifications_count`.

**Nota ruoli privilegiati** — la nota in fondo alla tabella ora elenca dinamicamente i codici da `meta.privileged_role_codes` (non hardcoded).

**Box "Deny by default"** — aggiunto alert rosso fisso:
> Le nuove classificazioni restano non accessibili finché non viene configurata la policy ABAC dei ruoli.

Integra eventuale `meta.unknown_classification_policy.explanation` dal backend.

### Regole rispettate

- [x] Lista ruoli privilegiati letta dal backend (`role_has_minor_assignment_bypass`), mai hardcoded
- [x] Regola assegnazione letta da `summary.minor_assignment_rule`, mai dedotta
- [x] Download e lettura trattati come colonne separate, mai inferiti l'uno dall'altro

### QA atteso (come da handoff)

| Caso | Verifica |
|---|---|
| COORDINATORE | `role_has_minor_assignment_bypass = true` → badge "Ruolo privilegiato" + "Bypass assegnazione minore" |
| PSICOLOGO | nessun bypass → "Richiede assegnazione minore" |
| EDUCATORE | lettura `internal` consentita, download separato |
| Nuova classificazione | nessun accesso implicito, box deny-by-default visibile |

---

## Handoff 169 — Riepilogo stato implementazione

### Stato: ✅ Recepito

Handoff 169 è un riepilogo che punta a 167 e 168. Entrambi implementati in questa sessione — nessuna ulteriore azione richiesta.

---

## Richieste a sviluppo

Nessuna. Tutti i campi dichiarati nel contratto sono già presenti nei tipi e letti dal payload backend senza logica frontend aggiuntiva.
