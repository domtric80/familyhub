# Risposta UX — Handoff 159: GeoNames global countries import

Data: 2026-08-09

---

## Stato: implementato

---

## File modificato

`frontend/src/pages/anagrafiche/ProviderGeografiaPage.tsx`

API e tipi erano già completi:
- `adminGeoProvidersApi.importCountries(id)` → `POST /admin/geography-providers/{id}/import-countries`
- `GeoProviderCountriesImportResponse` / `GeoProviderCountriesImportResponseData` → già in `types/index.ts`

---

## Modifiche implementate

### 1. Helper `isGeoNamesGlobalProvider()`

```ts
function isGeoNamesGlobalProvider(p: GeoProvider): boolean {
  const driver = (p.driver ?? '').toLowerCase()
  const format = (p.format ?? '').toLowerCase()
  const src = (p.source_url ?? p.source_path ?? '').toLowerCase()
  return driver === 'geonames' && format === 'txt' && src.includes('countryinfo')
}
```

Visibilità bottone condizionata a `driver=geonames`, `format=txt`, sorgente contenente `countryinfo` (case-insensitive). I provider `zip` paese-specifici non lo mostrano.

### 2. Bottone "Importa nazioni" nella tabella Provider

Icona `Globe` (react-feather) in azzurro, accanto al bottone Import singola nazione.
Visibile solo se `isGeoNamesGlobalProvider(p) && canImport`.

### 3. Modal di conferma

Prima della chiamata API, modal dedicato con:
- Nome del provider
- Alert info: "Verranno create o aggiornate le nazioni del mondo nell'anagrafica globale. Non verranno importate regioni, province o città."
- Bottone Annulla / Importa nazioni

### 4. Risultato import

Dopo risposta `201`, l'alert di successo nel tab Provider mostra:
- Messaggio backend (`message`)
- Nazioni lette (`raw.countries`)
- Create (`stats.created_countries`)
- Aggiornate (`stats.updated_countries`)
- Run ID e status

### 5. Error handling

In caso di `422` (provider zip), il messaggio backend viene mostrato direttamente nell'alert danger (no trasformazione copy).

---

## Distinzione flussi mantenuta

| CTA | Scopo |
|-----|-------|
| `Globe` (nuovo) | Import globale → popola solo tabella `countries` |
| `Upload` (esistente) | Import singola nazione → gerarchia completa `regions/provinces/cities` |

---

## Checklist QA

- [x] Bottone Globe visibile su provider geonames+txt+countryinfo
- [x] Bottone Globe non visibile su provider istat o geonames+zip
- [x] Modal conferma con testo chiaro sui limiti dell'import
- [x] Risultato mostra nazioni lette/create/aggiornate + run id
- [x] Errore 422 mostrato verbatim dal backend
- [x] Durante import: spinner + bottone disabilitato
