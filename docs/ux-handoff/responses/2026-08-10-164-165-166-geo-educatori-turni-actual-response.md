# FamilyHub — Risposta handoff UX — 164 + 165 + 166

Data: 2026-08-14  
Riferimenti: `2026-08-10-164-city-map-db-coordinates-priority.md`, `2026-08-10-165-educatori-birth-city-async-lookup.md`, `2026-08-10-166-turni-planned-vs-actual-contract.md`

---

## Handoff 164 — Mappa città: priorità coordinate DB

### Stato: ✅ Implementato

**File:** `frontend/src/pages/anagrafiche/CittaDetailPage.tsx`

#### Logica coordinate (in ordine di priorità)

```
1. city.latitude != null && city.longitude != null
   → usa DB coordinates direttamente
   → link OSM con ?mlat=...&mlon=... (non ricerca testuale)
   
2. coordinate DB assenti
   → Nominatim geocoding: GET https://nominatim.openstreetmap.org/search?...
   → usa risultato se trovato
   
3. geocoding fallisce o non restituisce risultati
   → map.error → messaggio fallback, link esterno OSM per ricerca testuale
```

#### Link OpenStreetMap

- Con coordinate DB: `https://www.openstreetmap.org/?mlat={lat}&mlon={lon}#map=15/{lat}/{lon}`
- Senza coordinate: `https://www.openstreetmap.org/search?query={nome, provincia, regione, paese}`

#### Hint opzionale

I label "Latitudine DB" / "Longitudine DB" nella card Dati amministrativi indicano chiaramente la provenienza. L'hint testuale esplicito ("Coordinate lette dal database geografico") non è stato aggiunto come testo separato — è sufficientemente chiaro dalla label.

---

## Handoff 165 — Educatori: lookup città nascita asincrono

### Stato: ✅ Implementato

**File:** `frontend/src/pages/educatori/EducatoriPage.tsx`

#### Comportamento

- Nessun preload massivo dell'archivio città all'apertura
- Campo `Città nascita` → input di ricerca + select risultati dinamici
- Ricerca parte con minimo 2 caratteri (debounce tramite `useEffect` su `citySearch`)
- Chiama `lookupsApi.cities({ q: citySearch })` → `GET /api/lookups/cities?q=...`
- Massimo 25 risultati (clamp backend)
- In modifica: la città già salvata viene precaricata via `lookupsApi.cities({ id: selectedCityId })` e mantenuta selezionabile

#### State

```tsx
const [cities, setCities] = useState<City[]>([])
const [citySearch, setCitySearch] = useState('')
```

Sul mount del modal in edit mode:
```tsx
lookupsApi.cities({ id: form.birth_city_id }).then(setCities)
setCitySearch(item.birth_city?.name ?? '')
```

---

## Handoff 166 — Turni: planned vs actual nel planner

### Stato: ✅ Implementato

**Tipi** (`frontend/src/types/index.ts`) — blocco `actual` già presente su `StaffShiftAssignment`:

```typescript
actual?: {
  timesheet_entry_id?: number | null
  status?: string
  started: boolean
  completed: boolean
  planned_start?: string | null
  planned_end?: string | null
  actual_start?: string | null
  actual_end?: string | null
  planned_minutes?: number | null
  worked_minutes?: number | null
  break_minutes?: number | null
  ordinary_minutes?: number | null
  overtime_minutes?: number | null
  absence_minutes?: number | null
  variance_minutes?: number | null
  has_anomaly: boolean
  anomaly_flags?: string[]
}
```

Anche i campi di riepilogo turno giornaliero (`actual_started_count`, `actual_completed_count`, `actual_coverage_gap`, `anomaly_count`) sono già tipizzati su `ShiftMonthDay.shifts[]` e `ShiftWeekShift`.

#### Utilizzo nel planner coordinatore (`PianificazionePage.tsx`)

- Badge "Anomalia" se `actual.has_anomaly`
- Chip sostituzione con `has_active_substitution` + `effective_staff_member`

#### Utilizzo in `MiaSettimanaPage.tsx`

- Minuti lavorati da `actual.worked_minutes`
- Stato operativo da `op.state` (separato da `actual.status`)
- CTA "Chiudi e firma turno" da `op.can_submit`
- Badge anomalie da `op.has_open_anomalies`

#### Nota sulla retrocompatibilità

I nuovi campi sono additivi: il frontend ignorava i campi `actual.*` prima dell'handoff 166 senza errori TypeScript grazie al tipo opzionale `actual?`. Nessun campo rimosso.
