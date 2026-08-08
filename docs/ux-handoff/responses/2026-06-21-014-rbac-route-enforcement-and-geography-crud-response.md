# Response — UX Handoff 014: RBAC Route Enforcement & Geography CRUD

**Data:** 2026-06-21  
**Handoff:** 014 — RBAC 403 enforcement su tutte le pagine CRUD admin + CRUD geografia a 4 livelli  
**Stato:** ✅ Completato

---

## 1. RBAC 403 Enforcement — tutte le pagine CRUD admin

### Approccio

Introdotta funzione helper `errorMessage(ae: ApiError): string` in `services/api.ts`:

```ts
export function errorMessage(ae: ApiError): string {
  if (ae.status === 403) return 'Permesso insufficiente — contatta l\'amministratore'
  if (ae.status === 409) return ae.message ?? 'Record in uso: impossibile completare l\'operazione'
  return ae.message ?? 'Errore di sistema'
}
```

Corretta anche `apiError()` per propagare sempre l'HTTP status dall'axios response (il body backend non garantisce il campo `status`):

```ts
export function apiError(err: unknown): ApiError {
  const e = err as AxiosError<ApiError>
  const httpStatus = e.response?.status
  const data = e.response?.data ?? { message: 'Errore di rete' }
  return { ...data, status: httpStatus ?? data.status }
}
```

### Pagine aggiornate

Ogni catch block ora distingue esplicitamente:

| Codice HTTP | Messaggio mostrato all'utente |
|------------|-------------------------------|
| 403 | "Permesso insufficiente — contatta l'amministratore" |
| 409 | Messaggio dal backend (record in uso / conflitto gerarchico) |
| 422 | Field errors mostrati inline sotto ogni campo |
| altri | `ae.message` o fallback generico |

Pagine aggiornate: `OrganizzazioniPage`, `StrutturePage`, `AssegnazioniPage`, `UtentiPage`, `RuoliPage`, `TipiDocumentoPage`, `TipiContattoPage`, `StatiMinorePage`, `GeneriPage`, `GeografiaPage` (4 tab).

---

## 2. CRUD Geografia — 4 livelli gerarchici

### Componente: `GeografiaPage.tsx`

Struttura a tab (`Nav tabs` con `border-tab nav-primary`, pattern Cuba):

```
Tab Nazioni   → adminCountryApi   → GET/POST/PUT/DELETE /admin/countries
Tab Regioni   → adminRegionApi    → GET/POST/PUT/DELETE /admin/regions
Tab Province  → adminProvinceApi  → GET/POST/PUT/DELETE /admin/provinces
Tab Città     → adminCityApi      → GET/POST/PUT/DELETE /admin/cities
```

Ogni tab è un componente separato (`NazioniTab`, `RegioniTab`, `ProvinceTab`, `CittaTab`) montato solo quando attivo (`{activeTab === 'X' && <XTab />}`) per evitare caricamenti inutili.

### Filtri gerarchici a cascata

| Tab | Filtro obbligatorio |
|-----|---------------------|
| Regioni | Selezione nazione — `GET /admin/regions?country_id=X` |
| Province | Selezione regione — `GET /admin/provinces?region_id=X` |
| Città | Selezione provincia — `GET /admin/cities?province_id=X` (lazy load — nessun caricamento senza filtro) |

Il tab Città non carica mai record senza `province_id` selezionata. Questo gestisce la scala dei dati (7000+ comuni italiani).

### Campi per entità

**Nazioni** (`CountryWrite`): `iso_code` (uppercase automatico, max 3 char), `name`

**Regioni** (`RegionWrite`): `country_id` (select), `code`, `name`

**Province** (`ProvinceWrite`): `region_id` (select), `code`, `name`

**Città** (`CityWrite`): `province_id` (select), `name`, `cadastre_code` (opzionale, inviato null se vuoto), `postal_code` (opzionale, inviato null se vuoto)

### Gestione errori 409 gerarchici

Messaggi 409 specifici per livello:

| Livello eliminato | Messaggio fallback 409 |
|-------------------|------------------------|
| Nazione | "Nazione con regioni collegate" |
| Regione | "Regione con province collegate" |
| Provincia | "Provincia con città collegate" |
| Città | "Città con strutture collegate" |

(Il backend può sovrascrivere con `ae.message` più specifico.)

### Pattern UI

- Tabelle `table table-hover` con `table-responsive` — identico alle altre pagine admin
- Modal create/edit con `FormGroup` + `Label` + `Input` reactstrap
- Field errors 422 mostrati con `invalid-feedback d-block` sotto ogni campo
- Conflict message 403/409 in `Alert color='danger'` dentro il modal
- Delete confirm modal riutilizzabile (`DeleteModal`) con blocco se 409 (mostra errore, nessun pulsante elimina)
- Pulsanti Edit/Delete con icone `Edit2`/`Trash2` (react-feather, size 12)

---

## 3. API — nuovi oggetti in `services/api.ts`

```ts
export const adminCountryApi = { list, create, update, delete }
export const adminRegionApi  = { list(countryId?: number), create, update, delete }
export const adminProvinceApi = { list(regionId?: number), create, update, delete }
export const adminCityApi    = { list(provinceId: number), create, update, delete }
```

`adminCityApi.list` richiede `provinceId` obbligatorio per design (nessun default, nessun fallback a lista vuota implicita).

---

## 4. TypeScript

Verifica `npx tsc --noEmit` completata con **0 errori** dopo tutte le modifiche.

---

## Note per il backend

- Atteso `GET /admin/regions?country_id=X` — se il backend non filtra lato server, il filtro va applicato lato frontend prima del render (non implementato attualmente, in attesa di conferma dal backend).
- Il campo `iso_code` su `Country` è esposto come `iso2` o `iso_code` nei dati esistenti (entrambi presenti nei tipi). La pagina legge `c.iso_code ?? c.iso2` per compatibilità durante la migrazione del backend.
- `PUT /admin/countries/{id}` invia `{ iso_code, name }` — il backend deve accettare entrambi i nomi campo o normalizzare internamente.
