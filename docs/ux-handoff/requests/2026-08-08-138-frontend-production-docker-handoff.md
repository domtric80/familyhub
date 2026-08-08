# 2026-08-08-138-frontend-production-docker-handoff

## Contesto
Backend/infrastruttura ha introdotto uno stack Docker di produzione con immagini immutabili. UX/frontend continua a lavorare nello stesso repository locale `C:\Projects\FamilyHUB` e quindi deve considerare che il frontend React viene ora buildato in produzione tramite Docker, non più servito da Vite dev server o da bind mount del sorgente.

Questo handoff serve a evitare fraintendimenti: la parte frontend è inclusa nel deploy production, ma solo per ciò che è committato nel repository.

## File di riferimento già presenti
- `frontend/Dockerfile.prod`
- `frontend/.dockerignore`
- `frontend/nginx/default.conf`
- `docker-compose.prod.yml`
- `docs/operations/2026-08-08-runtime-production-files.md`

## Cosa significa per UX/frontend
1. Il container production del frontend esegue:
   - `npm ci`
   - `npm run build`
   - pubblicazione di `dist/` dentro Nginx
2. In produzione non esiste hot reload, non esiste `vite dev`, non esiste accesso al sorgente host dal container.
3. Qualunque asset, route SPA, import TypeScript, libreria npm o env Vite usata dal frontend deve essere corretta già in fase di build.
4. Se un file frontend esiste solo in locale ma non è committato, non entrerà nell’immagine production.

## Regole operative obbligatorie per UX/frontend

### 1) Tutto ciò che serve al runtime browser deve stare nel repo
UX deve assicurarsi che siano versionati:
- componenti React/TSX
- moduli TS
- assets statici necessari
- fogli stile realmente usati
- eventuali file in `public/`

Non va fatto affidamento su file locali esterni al repository.

### 2) Nessun import rotto tollerato
Prima di dichiarare conclusa una modifica frontend, UX deve verificare che:
- i path import siano validi;
- non ci siano dipendenze mancanti in `frontend/package.json`;
- non ci siano riferimenti a file non versionati;
- non ci siano tipi TS che falliscono il build.

### 3) Variabili ambiente frontend consentite
Lo stack production passa questi argomenti/env al build frontend:
- `VITE_API_URL`
- `VITE_CITY_MAP_PROVIDER`
- `VITE_MAPTILER_KEY`

Se UX introduce nuove variabili `VITE_*`, deve obbligatoriamente:
1. comunicarle con nuovo handoff backend/infra;
2. aggiornare il contratto di deploy;
3. non assumere che siano già disponibili in produzione.

### 4) Routing SPA
Il frontend production è servito via Nginx con fallback SPA su `index.html`.
UX può quindi continuare a usare routing client-side, ma deve evitare assunzioni su rewrite custom non documentate.

### 5) Chiamate API
Le chiamate API in produzione devono continuare a funzionare con base path `/api` oppure con `VITE_API_URL` coerente.
UX non deve hardcodare host locali tipo:
- `http://localhost:8000`
- `http://127.0.0.1:8000`
- IP LAN della macchina di sviluppo

### 6) Librerie preview/parsing file
Se UX usa librerie per preview documenti o parsing browser-side, devono essere:
- installate in `frontend/package.json`;
- compatibili con build Vite production;
- prive di dipendenze locali implicite.

## Smoke check minimo richiesto a UX prima di dichiarare pronta una feature
Nel workspace `C:\Projects\FamilyHUB\frontend` eseguire almeno:
- `npm install` oppure `npm ci`
- `npm run build`

La feature frontend non è considerata pronta per produzione se `npm run build` fallisce.

## Cosa non è responsabilità di UX
Non è richiesto a UX:
- modificare `backend/Dockerfile.prod`;
- modificare `docker-compose.prod.yml` salvo richiesta esplicita;
- modificare `infra/nginx/familyhub.prod.conf` salvo richiesta esplicita.

Questi file sono gestiti lato backend/infrastruttura.

## Cosa deve fare UX quando introduce esigenze nuove
Aprire risposta/handoff se serve uno di questi casi:
- nuova variabile `VITE_*`;
- nuova dipendenza npm necessaria al build;
- nuovo asset statico da servire in modo speciale;
- esigenza di proxy diverso da `/api`;
- necessità di header/csp/caching particolari;
- necessità di upload diretto browser verso storage.

## Nota importante sul perimetro del commit production
Il commit infrastructure/deploy ha incluso la parte necessaria a buildare e servire il frontend in produzione.
Non ha invece alterato la UX applicativa o i componenti funzionali del team grafico.

Tradotto operativamente:
- il packaging production del frontend è pronto;
- il contenuto funzionale del frontend dipende dai file che UX committa nello stesso repo.

## Checklist breve per UX
- [ ] la feature è committata nel repo condiviso
- [ ] `frontend/package.json` include tutte le dipendenze usate
- [ ] nessun import locale rotto
- [ ] nessun riferimento a `localhost` hardcodato
- [ ] `npm run build` termina con successo
- [ ] eventuali nuove `VITE_*` sono state comunicate a backend/infra

## Esito atteso
Quando UX conclude una modifica, backend/infrastruttura deve poter eseguire il deploy production senza dover “indovinare” file mancanti, env mancanti o comportamenti speciali del frontend.
