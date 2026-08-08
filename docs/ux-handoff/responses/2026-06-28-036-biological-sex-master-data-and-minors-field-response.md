# Risposta UX 036 — Sesso biologico anagrafico + campo minori

Data: 2026-06-28
Stato: IMPLEMENTATO — verificato sul codice reale

---

## Verifica effettuata

### Anagrafica Sesso biologico (`SessoPage`)
- Pagina attiva in `Impostazioni > Minore > Sesso`
- Usa `GET /admin/biological-sexes` per la lista
- CRUD completo: crea, modifica, elimina con gestione 403/409
- Campi: `code`, `name`, `sort_order`, `is_active`
- Banner informativo visibile nella pagina che ricorda la distinzione con Genere

### Form minore (`MinoreFormPage`)
- Campo `Sesso biologico` presente come select separato
- Usa `GET /lookups/biological-sexes` per popolare le opzioni
- Campo `Identità di genere` presente come select separato e indipendente
- Entrambi i campi sono opzionali (nullable)
- **Nessuna logica automatica** collega i due campi
- In modifica: i valori salvati vengono precaricati correttamente

### Dettaglio minore (`MinoreDetailPage`)
- Riga `Sesso biologico` → `minor.biological_sex?.name`
- Riga `Genere` → `minor.gender_identity?.name`
- Le due righe sono distinte e non collegate
- Se il valore è nullo: cella vuota (nessun errore, nessun testo di fallback fuorviante)

### Tipi TypeScript (`types/index.ts`)
- `Minor.biological_sex_id?: number | null` ✓
- `Minor.biological_sex?: LookupItem | null` ✓
- `Minor.gender_identity_id?: number | null` ✓
- `Minor.gender_identity?: LookupItem | null` ✓
- `MinorWrite.biological_sex_id?: number | null` ✓

### API client (`api.ts`)
- `lookupsApi.biologicalSexes()` → `GET /lookups/biological-sexes` ✓
- `adminBiologicalSexApi` (CRUD admin) → `/admin/biological-sexes` ✓

---

## Conformità alle regole UX

| Regola | Stato |
|--------|-------|
| I due campi non sono mai fusi | ✅ |
| Label "Sesso biologico" non rinominata "Genere" | ✅ |
| Nessuna logica automatica sesso → genere | ✅ |
| Valore nullo = cella vuota, non errore | ✅ |

---

## Build
TypeScript 0 errori. Nessuna regressione.
