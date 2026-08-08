# Risposta UX 018 — Geography bulk load wizard + fix console sync

## Stato
Implementato ✅ — `tsc --noEmit` 0 errori

---

## File toccati

| File | Modifica |
|------|----------|
| `src/pages/anagrafiche/ScaricaGeografiaPage.tsx` | **Nuovo** — wizard scarico geografia |
| `src/App.tsx` | Aggiunta route `/anagrafiche/scarico-geografia` |
| `src/layout/sidebar/menuItems.ts` | Aggiunta voce menu "Scarico geografia" |

> Le voci relative alla console sync (console `GeografiaSyncPage.tsx`, `types/index.ts`, `services/api.ts`, `menuItems.ts`) erano già state implementate nelle sessioni 016 e 017.

---

## Route frontend

```
/anagrafiche/scarico-geografia  →  ScaricaGeografiaPage
```

Menu sidebar (visibile solo con permesso `geography_sync.read`):
- `Sinc. geografia` → `/anagrafiche/geografia-sync`
- `Scarico geografia` → `/anagrafiche/scarico-geografia`

---

## Permessi

| Operazione | Permesso richiesto |
|------------|-------------------|
| Accesso alla pagina / lettura opzioni | `geography_sync.read` |
| Esecuzione scarico | `geography_sync.run` |

Utenti senza `geography_sync.read` vedono una `Alert color='warning'`.
Utenti senza `geography_sync.run` vedono gli action button disabilitati con avviso.

---

## Endpoint usati

| Endpoint | Quando |
|----------|--------|
| `GET /admin/geography-load/runs` | All'apertura della pagina |
| `GET /admin/geography-load/options/continents?run_id=&source=` | Quando run + source sono valorizzati |
| `GET /admin/geography-load/options/countries?run_id=&source=&continent_code=` | Quando continente cambia (o subito se continenti vuoti) |
| `GET /admin/geography-load/options/regions?run_id=&source=&country_key=` | Quando nazione cambia |
| `GET /admin/geography-load/options/provinces?run_id=&source=&region_key=` | Quando regione cambia |
| `POST /admin/geography-load/execute` | Su ogni azione di scarico |

---

## Gestione loading / error / empty per ogni select

| Select | Loading | Empty | Disabled quando |
|--------|---------|-------|-----------------|
| Run | Spinner al mount | `runsError` Alert | mai |
| Sorgente | — | — | `runId` non valorizzato |
| Continente | Spinner, label "Caricamento…" | Step nascosto se API restituisce `[]` | `source` non valorizzato |
| Nazione | Spinner, label "Caricamento…" | `Nessun dato disponibile per questa selezione` | loading continenti attivo |
| Regione | Spinner, label "Caricamento…" | `Nessun dato disponibile` / placeholder `Seleziona prima una nazione` | `countryKey` vuoto |
| Provincia | Spinner, label "Caricamento…" | `Nessun dato disponibile` / placeholder `Seleziona prima una regione` | `regionKey` vuoto |

---

## Logica continente

Se `GET /options/continents` restituisce array vuoto (o errore):
- lo step continente viene **nascosto**
- viene chiamato automaticamente `GET /options/countries` senza `continent_code`

Se restituisce dati:
- lo step continente è visibile e opzionale (placeholder "Tutti i continenti")
- la selezione del continente filtra i paesi nella select successiva

---

## Gestione Scarica completo

Il pulsante "Scarica completo" determina il livello più profondo del contesto corrente e invia una richiesta ricorsiva (`recursive: true`):

| Contesto attivo | `level` inviato |
|-----------------|----------------|
| Solo run + source | `countries` |
| Nazione selezionata | `regions` |
| Regione selezionata | `provinces` |
| Provincia selezionata | `cities` |

Tutti i parametri di contesto (`continent_code`, `country_key`, `region_key`, `province_key`) vengono inviati insieme.

---

## Risultato scarico

Dopo POST riuscita, viene mostrata una card con:
- Alert success con il messaggio del backend
- 4 counter: nazioni / regioni / province / città
- Badge livello e ricorsivo/non ricorsivo

Errori mostrati come `Alert color='danger'` nella card risultato + `toast.error`.

---

## Reset a cascata

| Evento | Reset |
|--------|-------|
| `runId` cambia | source, continente, nazione, regione, provincia |
| `source` cambia | continente, nazione, regione, provincia |
| `continentCode` cambia | nazione, regione, provincia |
| `countryKey` cambia | regione, provincia |
| `regionKey` cambia | provincia |
