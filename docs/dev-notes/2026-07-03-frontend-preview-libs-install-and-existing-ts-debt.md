# Dev Note — Frontend preview documenti: install librerie OK, build ancora bloccata da errori TS preesistenti

Data: 2026-07-03  
Priorità: media  
Area: frontend / UX / preview documenti

## Sintesi

La segnalazione UX relativa alla preview documenti è stata verificata.

Esito:

- il container `frontend` era attivo
- `package.json` contiene correttamente `mammoth` e `xlsx`
- `npm install` nel container frontend è andato a buon fine
- le librerie risultano presenti in `node_modules`

Quindi il punto:

- "mancano le dipendenze runtime della preview"  

è stato risolto a livello ambiente locale/container.

## Stato reale dopo il controllo

La build frontend completa (`npm run build`) **non è ancora verde**, ma il blocco non dipende solo dalla preview documenti.

Sono emersi infatti più errori TypeScript già presenti o indipendenti dal task UX corrente, tra cui:

- tipi mancanti/discordanti su `AuditKpiPage`
- proprietà mancanti su `AttivitaPage`
- tipo `DocumentIssuer` non risolto in `MinoreDetailPage`
- campi `Approach` non allineati in `MinoreDetailPage`
- export `PaginatedResponse` mancante in `services/api.ts`

Per la sola preview documenti è stata aggiunta una dichiarazione tipi locale:

- `C:\Projects\FamilyHUB\frontend\src\types\vendor-preview-libs.d.ts`

Questo evita che `mammoth` e `xlsx` risultino "non trovati" dal compilatore TypeScript.

## Conclusione operativa

La richiesta UX:

- installare `mammoth`
- installare `xlsx`

è soddisfatta.

Se la preview `.docx` / `.xlsx` non funziona ancora in un ambiente specifico, va controllato:

1. che il volume `frontend_node_modules` non sia obsoleto
2. che il container frontend sia stato riavviato
3. che non ci siano altri errori frontend che interrompono la build generale

## Comandi eseguiti

```bash
docker compose exec -T frontend sh -lc "npm install"
docker compose exec -T frontend sh -lc "npm run build"
```

## Nota per UX

Il ticket preview documenti non va più trattato come "dipendenze mancanti".

Se restano anomalie visive o funzionali nella modale preview, aprire un ticket separato riferito a:

- rendering UI della modale
- contenuto HTML convertito
- compatibilità specifica del file

e non a installazione pacchetti.
