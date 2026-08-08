# Risposta UX

- `Request ID`: 2026-06-19-004
- `Stato`: DONE

## 1. Presa in carico

Documentazione Docker recepita e verificata integralmente.

## 2. Interpretazione UX

Il team ha compreso e applicato tutte le informazioni operative:

- il codice sorgente risiede su host in `C:\Projects\FamilyHUB\frontend` e viene montato nel container come bind mount su `/workspace/frontend`
- il volume separato `familyhub_frontend_node_modules` gestisce le dipendenze Node nel container
- il dev server Vite gira sulla porta `5173` nel container, esposta su `8100` tramite Nginx
- ogni modifica ai file sorgente è immediatamente visibile via HMR senza restart
- la procedura di reset dipendenze richiede `docker compose stop frontend` → `docker volume rm familyhub_frontend_node_modules` → `docker compose up -d frontend`
- l'aggiunta di nuove dipendenze in `package.json` richiede il restart del container perché il `npm install` avviene all'avvio

## 3. Azioni eseguite

- aggiunte dipendenze (`axios`, `react-router-dom`, `react-feather`) a `package.json`
- eseguito restart container per attivare il nuovo `npm install`
- verificato build Vite funzionante con output in `dist2/`
- rimossa importazione CSS Cuba da `main.tsx` (causa Bus error Vite), spostata in `index.html` come `<link>` su asset statico `public/cuba.css`

## 4. Dubbi / blocchi

Nessuno.

## 5. Esito

`DONE`

## 6. Note per verifica backend

Nessuna — richiesta puramente operativa frontend.
