# FamilyHub · Protocollo di scambio Backend ↔ UX Team

Da questo momento il frontend non viene più modificato in questo flusso di lavoro.
Ogni modifica backend o API che ha impatto sul frontend deve essere comunicata al team UX/WebDesigner
tramite documentazione formale, verificabile e versionata nel repository.

## Obiettivi

- separare in modo netto responsabilità backend e frontend
- evitare ambiguità su payload, flussi, stati ed errori
- creare un canale di scambio persistente e verificabile
- consentire controlli successivi su ciò che il team UX ha recepito e implementato

## Fonte ufficiale API

La fonte contrattuale delle API resta:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

Ogni modifica a endpoint, payload, regole, autorizzazioni, codici di risposta o comportamento
deve aggiornare questa specifica.

## Canale operativo UX

Per ogni modifica con impatto frontend devono essere creati file dedicati in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\`

Il team UX deve rispondere in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\`

## Convenzione file

Formato nome file richiesta:

- `YYYY-MM-DD-###-slug-modifica.md`

Esempio:

- `2026-06-19-001-minors-history-documents.md`

Formato nome file risposta UX:

- stesso nome base con suffisso `-response.md`

Esempio:

- `2026-06-19-001-minors-history-documents-response.md`

## Quando creare una richiesta UX

Creare sempre una nuova richiesta se cambia almeno uno di questi elementi:

- nuovo endpoint API
- modifica endpoint esistente
- nuovi campi request/response
- nuovi stati, badge, classificazioni o filtri
- nuove regole autorizzative che cambiano la UX
- nuove validazioni o errori da gestire in UI
- nuovo flusso utente o passo operativo
- modifica di comportamento su upload/download/documenti/storico

## Contenuto minimo della richiesta

Ogni file richiesta deve contenere:

1. contesto funzionale
2. impatto UX
3. endpoint coinvolti
4. payload request
5. payload response
6. stati UI da gestire
7. errori UI da gestire
8. permessi/visibilità
9. checklist implementativa UX
10. punti da verificare con backend

## Livello di dettaglio richiesto al team UX

Per evitare interpretazioni libere, ogni richiesta UX che definisce una funzione applicativa
deve indicare **in modo prescrittivo** anche:

1. nome pagina
2. posizione nel menu
3. titolo pagina
4. tab o sottosezioni obbligatorie
5. campi esatti del form
6. colonne esatte delle tabelle
7. pulsanti e CTA da mostrare
8. modali o drawer richiesti
9. ordine logico dei campi
10. stati `loading`, `empty`, `error`, `success`
11. regole di visibilità per permesso
12. endpoint consumati da quella specifica pagina

Se questi elementi non sono presenti, la richiesta è da considerarsi incompleta.

## Contenuto minimo della risposta UX

Ogni file risposta deve contenere:

1. presa in carico
2. interpretazione della richiesta
3. componenti/pagine toccate
4. eventuali dubbi o blocchi
5. stato finale:
   - `RECEIVED`
   - `IN_PROGRESS`
   - `READY_FOR_BACKEND_REVIEW`
   - `BLOCKED`
   - `DONE`

## Regola di verifica

Quando arriva una risposta UX:

- si confronta la risposta con `openapi.yaml`
- si confronta la risposta con il file richiesta
- si verifica che non manchino stati, errori, permessi o campi
- solo dopo questa verifica si procede oltre

## Regola operativa futura

Da ora in poi, per ogni modifica backend con impatto frontend:

1. aggiorno `openapi.yaml`
2. creo un nuovo file in `requests`
3. ti avviso esplicitamente che esiste una nuova richiesta da far verificare al team UX
4. attendo il file di risposta UX per fare la verifica di allineamento

## Regola permanente richiesta dal committente

Questa regola è da considerarsi **sempre attiva** per l'intero progetto FamilyHub:

- ad ogni richiesta utente che introduce, modifica, estende o corregge una funzione con impatto frontend/UX
- deve essere creato **sempre** un nuovo documento dedicato in `C:\Projects\FamilyHUB\docs\ux-handoff\requests\`
- anche se la modifica sembra piccola, incrementale o solo tecnica
- anche se esiste già una richiesta precedente sullo stesso modulo

### Eccezioni ammesse

Non è obbligatorio creare una nuova richiesta UX solo se la modifica riguarda esclusivamente:

- refactoring interno backend senza alcun impatto su API, payload, permessi o comportamento UI
- test backend
- documentazione puramente interna senza effetti su UX
- fix infrastrutturali Docker, CI/CD o deploy senza impatto funzionale sul frontend

### Obbligo di notifica

Ogni volta che viene creato un nuovo file UX, il backend deve avvisare esplicitamente il committente indicando:

1. path completo del file creato
2. motivo della richiesta UX
3. cosa il team UX deve verificare o implementare

### Regola di continuità operativa

Se durante una singola attività vengono toccate più funzionalità frontend distinte, è preferibile:

- creare più file separati, uno per funzione o blocco coerente
- invece di concentrare tutto in un unico handoff ambiguo

Obiettivo:

- evitare omissioni
- rendere verificabile ogni consegna
- impedire che il team UX “interpreti” invece di implementare quanto richiesto
