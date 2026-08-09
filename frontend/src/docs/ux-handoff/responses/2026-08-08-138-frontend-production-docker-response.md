# Risposta UX — Handoff 138: Frontend production Docker

Data: 2026-08-08  
Stato: verificato e conforme

---

## Build check

Eseguito `npm run build` (`tsc -b && vite build`) sul sorgente corrente.

**Risultato: ✅ build completata senza errori**

```
✓ 1028 modules transformed.
✓ built in 4.10s
```

Output prodotto:
```
dist/index.html                     1.61 kB │ gzip:   0.68 kB
dist/assets/index-DN5lMorX.css     15.97 kB │ gzip:   3.14 kB
dist/assets/xlsx-CkFp8p6R.js      429.53 kB │ gzip: 143.08 kB
dist/assets/index-2M7SBqTi.js     502.53 kB │ gzip: 131.17 kB
dist/assets/index-DTTa3yda.js   1,272.02 kB │ gzip: 282.15 kB
```

### Warning presenti (non bloccanti)

| Warning | Causa | Impatto |
|---------|-------|---------|
| `/fonts.css doesn't exist at build time` | CSS del template Cuba servito da Nginx a runtime | Nessuno — gestito dall'infrastruttura |
| `/cuba.css doesn't exist at build time` | Stesso pattern del template | Nessuno |
| Chunk `>500 kB` | Bundle non ottimizzato con code splitting | Warning di performance, non errore |
| `api.ts` dynamic+static import | `MinoreDetailPage` usa import dinamico mentre altri usano static | Warning bundler, nessun impatto funzionale |

---

## Checklist handoff 138

- [x] Feature committata nel repo — branch `master` up to date con `origin/master`
- [x] `frontend/package.json` include tutte le dipendenze — build OK senza moduli mancanti
- [x] Nessun import locale rotto — `tsc -b` completato senza errori TypeScript
- [x] Nessun riferimento a `localhost` hardcodato nel sorgente `src/` — grep negativo
- [x] `npm run build` termina con successo — `✓ built in 4.10s`
- [x] Nessuna nuova variabile `VITE_*` introdotta fuori contratto

---

## Variabili VITE_* in uso

Solo le 3 variabili canoniche già nel contratto:

| Variabile | Usata in |
|-----------|----------|
| `VITE_API_URL` | `src/services/api.ts` — base URL chiamate backend (`/api` default) |
| `VITE_CITY_MAP_PROVIDER` | `src/pages/anagrafiche/GeografiaPage.tsx`, `CittaDetailPage.tsx` |
| `VITE_MAPTILER_KEY` | `src/pages/anagrafiche/GeografiaPage.tsx`, `CittaDetailPage.tsx` |

Nessuna nuova `VITE_*` da comunicare a backend/infra.

---

## Routing SPA

Il frontend usa React Router con routing client-side su tutti i path applicativi. Compatibile con la configurazione Nginx `try_files $uri $uri/ /index.html` già presente in `frontend/nginx/default.conf`.

---

## Regole operative recepite

A partire da questo handoff, ogni modifica frontend rispetterà:

1. **Build gate obbligatorio** — `npm run build` prima di dichiarare una feature pronta
2. **Nessun localhost hardcodato** — tutte le chiamate API passano per `import.meta.env.VITE_API_URL ?? '/api'`
3. **Nuove VITE_*** — comunicate con handoff dedicato prima di qualsiasi uso in produzione
4. **Dipendenze npm** — aggiunte sempre in `package.json`, mai assunte come globali
5. **Asset statici** — versionati nel repo, mai dipendenti da file locali

---

## Nota su chunk size

Il bundle principale supera i 500 KB (threshold Vite). Non è un blocco per il deploy ma può impattare i tempi di primo caricamento. Se richiesto, è possibile introdurre code splitting con `React.lazy()` sui moduli pesanti (es. geografiaPage con libreria mappa). Non viene fatto proattivamente salvo indicazione backend/infra.
