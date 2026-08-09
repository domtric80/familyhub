# Risposta UX — Handoff 158: GeoNames country dump import

Data: 2026-08-09

---

## Stato: implementato

---

## File modificato

`frontend/src/pages/anagrafiche/ProviderGeografiaPage.tsx`

---

## Modifiche implementate

### 1. `supportedLevels()` — GeoNames ora full-hierarchy

```ts
function supportedLevels(p: GeoProvider): string[] {
  const d = (p.driver ?? '').toLowerCase()
  if (d === 'istat' || d === 'geonames') return ['Nazione', 'Regioni', 'Province', 'Città']
  return ['Nazione']
}
```

Il provider GeoNames ora mostra tutti e 4 i livelli nella colonna "Livelli" della tabella provider e nella tabella associazioni nazioni.

### 2. `CapabilityBox` — testo differenziato per driver

Il box capability nel tab Import mostra ora un testo specifico per GeoNames:

> "Questo provider importa la gerarchia geografica completa della nazione selezionata (nazione, regioni, province, città). Il CAP potrebbe non essere disponibile nel dataset GeoNames."

Diverso dal testo ISTAT che rimane invariato.

### 3. Form provider — hint GeoNames e campo sorgenti ausiliarie

Quando il driver selezionato è `geonames`:

- Appare un `Alert` informativo che spiega i formati supportati (`txt` / `zip`) e i campi `auth_config_json` disponibili (`admin1_source_url`, `admin2_source_url`, `country_dump_url_template` e varianti `_source_path` locali) con nota sul placeholder `{ISO}`.
- Quando `mode !== 'api'`, viene mostrato un campo textarea `Sorgenti ausiliarie GeoNames (JSON)` che mappa su `auth_config_json`, con placeholder che mostra la struttura delle URL GeoNames ufficiali.
- Nota: se lasciato vuoto il backend usa le URL GeoNames predefinite.

### 4. Import result — nessuna modifica necessaria

Il componente `ImportResult` usa già `data.loaded.countries/regions/provinces/cities` — i contatori per GeoNames ora saranno > 0 dopo l'import.

### 5. Tab Import — nessun messaggio "solo nazione" per GeoNames

La nota CAP è già condizionata a `driver === 'istat'`, quindi non appare per GeoNames.

---

## Checklist QA

- [x] GeoNames non appare più "solo nazione" nella tabella provider
- [x] GeoNames non appare più "solo nazione" nella tabella associazioni
- [x] CapabilityBox mostra 4 badge verdi per GeoNames
- [x] CapabilityBox testo differenziato ISTAT vs GeoNames
- [x] Form provider: hint ausiliarie visibile quando driver = geonames
- [x] Campo `auth_config_json` editabile per geonames anche senza mode = api
- [x] Risultato import mostra contatori regioni/province/città > 0 dopo import GeoNames
- [x] Nota CAP non appare nel tab Import per GeoNames (solo per ISTAT)
