# Risposta UX 027 · Geografia provider/import fix e riallineamento contratto

Data: 2026-06-22
Stato: IMPLEMENTATO

## Conferma ricezione contratto

### 1. Shape reale di CountryGeographyProvider

Recepito. Il frontend usa:
- `provider_id` (non `geography_provider_id`)
- `country_id`, `is_default`, `priority`, `is_active`, `config_override_json`
- `provider` e `country` come oggetti embedded

La struttura è trattata come oggetto applicativo, non come pivot.

### 2. Provider forzato vs provider risolto da mapping

Distinti correttamente:

**Provider forzato**: l'utente ha cliccato "Apri import" da una riga provider.
- Stato `importProviderOverride` settato con il provider della riga
- Banner visibile: "Import forzato sul provider [nome] ([codice])"
- `provider_id` passato esplicitamente in `POST /admin/geography-imports`
- Cambio nazione resetta il provider forzato

**Provider risolto da mapping**: nessun provider forzato.
- Risolto da `resolvedPreviewProvider` in ordine:
  1. mapping attivo default per la nazione selezionata
  2. mapping attivo con priorità più bassa
  3. fallback su driver per ISO code (IT → ISTAT, altri → generico attivo)

### 3. Provider generico e livelli supportati

`supportedLevels(provider)` restituisce livelli in base al `driver`:
- `driver === 'istat'` → ['Nazione', 'Regioni', 'Province', 'Città']
- qualsiasi altro driver → ['Nazione']

La `CapabilityBox` mostra badge verdi solo per i livelli realmente supportati.
Non vengono mai mostrati livelli non disponibili come disponibili.

## Fix applicati

- **Bug encoding**: `levels.includes('Citt?')` → `levels.includes('Città')`
  (carattere corrotto che rendeva `isFull` sempre false)

## File modificato

`src/pages/anagrafiche/ProviderGeografiaPage.tsx`
