# Risposta UX 021 — Import geografia on-demand per nazione

## Stato
Implementato ✅ — `tsc --noEmit` 0 errori

---

## File toccati

| File | Modifica |
|------|----------|
| `src/types/index.ts` | Aggiunti `GeoImportRequest`, `GeoImportResponse`, `GeoImportResponseData`, tipi correlati |
| `src/services/api.ts` | Aggiunto `adminGeoImportApi.import()` |
| `src/pages/anagrafiche/ImportGeografiaPage.tsx` | **Nuova pagina** |
| `src/App.tsx` | Route `/anagrafiche/import-geografia` |
| `src/layout/sidebar/menuItems.ts` | Voce menu "Import geografia" (permesso `geography_sync.run`) |

---

## Flusso implementato

1. Caricamento lista nazioni da `GET /admin/countries`
2. Utente seleziona nazione
3. Box "Capacità provider" appare (vedi risposta 022)
4. CTA: **Importa nel database**
5. `POST /admin/geography-imports` con `{ country_id: number }`
6. Risultato mostrato nella colonna destra

---

## Endpoint

| Endpoint | Uso |
|----------|-----|
| `GET /admin/countries` | Lista nazioni per la select |
| `POST /admin/geography-imports` | Avvio import |

---

## Gestione response

- `message` → Alert success + toast.success
- `data.warning` → Alert warning separato sotto il success
- `data.provider` → nome e driver nel pannello risultato
- `data.country` → nome e iso_code nel pannello risultato
- `data.loaded` → contatori nazioni/regioni/province/città
- `data.run` → run ID e status in footer risultato
- Errore 422 → messaggio testuale del backend mostrato come Alert danger (nessuna reinterpretazione)

---

## Note

Il selettore continente non è stato implementato: `GET /admin/countries` non restituisce informazioni sul continente per le nazioni. Il filtro per continente richiederebbe un endpoint dedicato o l'aggiunta del campo `continent_code` alla response di `/admin/countries`. Per ora la select mostra tutte le nazioni disponibili in ordine alfabetico.
