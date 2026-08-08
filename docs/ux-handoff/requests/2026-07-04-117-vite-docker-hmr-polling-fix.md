# Handoff UX/Frontend - Fix strutturale Vite Docker file watch/HMR

Data: 2026-07-04
Priorita: alta
Ambito: ambiente sviluppo frontend Docker su Windows / Docker Desktop / bind mount

## Problema risolto

Le modifiche ai file `.ts` / `.tsx` effettuate fuori dal container non venivano rilevate in modo affidabile dal dev server Vite.

Effetto visibile per UX:
- errori di sintassi apparentemente gia corretti che restano a video
- HMR che non si attiva
- necessit? di riavviare il dev server per vedere la versione aggiornata

## Fix applicato

File aggiornato:
- `frontend/vite.config.ts`

Configurazione introdotta:
- `server.watch.usePolling = true`
- `server.watch.interval = 1000`
- `server.hmr.host = 'localhost'`
- `server.hmr.protocol = 'ws'`

## Effetto atteso per UX

Dopo questo fix, in ambiente Docker locale:
- i salvataggi ai file frontend devono essere rilevati anche su Windows bind mount
- la pagina deve aggiornarsi senza riavvio manuale nella maggior parte dei casi
- i falsi errori dovuti a cache/hot reload incompleto devono ridursi drasticamente

## Cosa UX deve fare ora

1. riavviare il container/frontend dev server una sola volta dopo il pull del fix
2. riprovare una modifica semplice su un file `.tsx`
3. verificare che HMR aggiorni la pagina senza restart manuale

## Se il problema si ripresenta

Ordine corretto di verifica:
1. controllare che il container `frontend` sia stato riavviato dopo il fix
2. controllare che il browser non stia mostrando una tab vecchia
3. solo se necessario riavviare `npm run dev`

## Nota importante

Questo fix riguarda esclusivamente l'ambiente di sviluppo.
Non cambia nulla nel comportamento di produzione.
