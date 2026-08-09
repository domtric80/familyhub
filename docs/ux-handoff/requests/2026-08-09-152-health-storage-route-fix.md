# UX Handoff — 2026-08-09 — Fix check servizi / storage admin routes

## Contesto
Corretto un bug lato frontend sui client API della sezione **Admin > Stato servizi** e **Admin > Storage**.

## Problema corretto
Il frontend chiamava endpoint con prefisso duplicato:
- errato: `/api/api/admin/system/...`
- corretto: `/api/admin/system/...`

Questo impattava:
- check stato servizi
- esecuzione check manuale
- elenco configurazioni storage
- create/update/test/activate/delete configurazioni storage

## Impatto per UX/frontend
Nessun cambio di payload, nessun cambio di componente richiesto.
Serve solo riallinearsi al fatto che ora le chiamate funzionano con i path già documentati nel contratto API.

## Verifica attesa da UX
- pagina `Admin > Stato servizi`: caricamento senza errore
- azione `Esegui controllo`: refresh stato senza errore
- pagina `Admin > Storage`: lista configurazioni visibile
- azioni storage: test/attiva/salva/elimina senza 404 dovuti al doppio prefisso

## Note
Non cambia il contratto OpenAPI: il fix è solo sul client frontend.
