# Handoff UX/API — Tipologia avvicinamento + provvedimento autorizzativo

Data: 2026-07-03  
Area: `Minori > Avvicinamenti familiari`  
Priorità: Alta

## 1. Tipologia avvicinamento

Il capitolato richiede che il registro contatti distingua chiaramente la natura del contatto.

Il backend espone/aggiorna le seguenti tipologie operative tramite `GET /api/lookups/approach-types`:

- `FAMILY_VISIT` — Avvicinamento familiare
- `FACILITY_VISIT` — Visita in struttura
- `AUTHORIZED_EXIT` — Uscita autorizzata
- `PHONE_CALL` — Telefonata
- `VIDEO_CALL` — Videochiamata
- `LETTER` — Lettera / comunicazione scritta
- `TUTOR_MEETING` — Incontro con tutore
- `PROTECTED_MEETING` — Incontro protetto
- `REINTEGRATION_STEP` — Step reintegrazione

### Regola UX

Nel form avvicinamento la tipologia deve essere mostrata come campo esplicito e comprensibile:

- label consigliata: `Tipologia contatto`
- usare solo lookup API
- non nascondere il significato dietro label generiche

## 2. Provvedimento autorizzativo

Il backend supporta ora tre scenari di compilazione:

### A. Solo riferimento manuale

L’utente compila solo:

- `authorization_reference`
- `authorization_issued_at`
- `authorization_expires_at`

senza allegare alcun documento.

### B. Collegamento a documento già caricato

Nuovo campo API:

- `authorization_minor_document_id`

Consente di collegare un documento del minore già presente nell’archivio documentale come provvedimento autorizzativo.

### C. Caricamento documento e poi collegamento

Per ora il flusso backend supportato è in **2 step**:

1. caricare il documento nella sezione documenti minore
2. selezionarlo nel form avvicinamento come `authorization_minor_document_id`

UX non deve inventare un upload inline dentro il form se non viene richiesto in una fase successiva.

## 3. Campi response da usare

Nella response di un avvicinamento possono essere presenti:

- `authorization_minor_document_id`
- `authorization_minor_document`

`authorization_minor_document` contiene il dettaglio del documento collegato, incluso l’allegato.

## 4. Comportamento UI richiesto

Nel blocco `Provvedimento autorizzativo` il form deve offrire:

- modalità `Nessun documento collegato`
- modalità `Collega documento esistente`
- campi manuali sempre disponibili anche senza documento

### Suggerimento UI

- select/lookup per documento esistente filtrato sui documenti del minore
- mostrare nome file, tipo documento e data se il link è valorizzato
- permettere rimozione del collegamento impostando valore vuoto

## 5. Warning importante

Se viene scelto `authorization_minor_document_id`, il documento deve appartenere allo stesso minore.  
Il backend valida questa coerenza e rifiuta associazioni errate.

## 6. QA minima

- creare avvicinamento con sola referenza manuale
- creare avvicinamento con documento esistente collegato
- verificare che il dettaglio mostri file e metadati del documento collegato
- verificare che il form mostri tipologie granulari come `Telefonata`, `Videochiamata`, `Visita in struttura`, `Uscita autorizzata`
