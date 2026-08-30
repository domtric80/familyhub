# Handoff UX — Messaggistica ABAC dinamica e QA accessi sensibili

Data: 2026-08-30  
Richiesta: 204  
Priorità: Alta  
Area: Messaggistica interna, documenti, note classificate, audit.

## Sintesi

La messaggistica interna usa le stesse classificazioni ABAC dei documenti e delle note. La UI non deve più usare una lista fissa di classificazioni (`internal`, `restricted`, `clinical`, `judicial`) perché l'amministratore può creare nuove classificazioni da backend.

## Modifica frontend richiesta

Nella pagina messaggistica:

1. caricare le classificazioni attive con `GET /api/lookups/document-classifications`;
2. usare il risultato per:
   - filtro classificazione;
   - select classificazione nella modale nuova conversazione;
   - badge classificazione nei thread;
3. usare `classification_label` o `document_classification.name` quando presenti nel payload thread;
4. mantenere fallback tecnico solo se il lookup non risponde, senza bloccare la pagina;
5. al cambio classificazione nella modale, svuotare i partecipanti selezionati e richiamare `GET /api/internal-messages/options/participants`.
6. nella modale nuova conversazione di tipo `minor`, filtrare il menu minori usando la struttura scelta nel form (`facility_id` della modale), non il filtro struttura della tabella principale.

## Endpoint classificazioni

`GET /api/lookups/document-classifications`

Risposta attesa:

```json
[
  {
    "id": 1,
    "code": "clinical",
    "name": "Clinico",
    "description": "Dati sanitari e clinici",
    "allowed_role_codes": ["DIRETTORE", "COORDINATORE", "PEDIATRA"],
    "allowed_download_role_codes": ["DIRETTORE", "COORDINATORE"],
    "is_active": true
  }
]
```

La UI deve mostrare solo record con `is_active !== false`.

## Endpoint partecipanti

`GET /api/internal-messages/options/participants?facility_id={id}&minor_id={id?}&classification_code={code?}`

Regole:

- `facility_id` è obbligatorio;
- `minor_id` si passa solo per thread `minor`;
- `classification_code` va passato sempre se selezionato;
- il backend restituisce solo utenti compatibili con struttura, minore e classificazione ABAC.

La UI non deve applicare regole ABAC proprie sui ruoli: deve fidarsi del backend.

## Creazione thread

`POST /api/internal-messages/threads`

Payload minimo:

```json
{
  "facility_id": 1,
  "minor_id": 2,
  "thread_type": "minor",
  "subject": "Confronto clinico",
  "topic": "Aggiornamento",
  "classification_code": "clinical",
  "participant_user_ids": [5, 7],
  "message_body": "Testo messaggio"
}
```

Errori da gestire:

- `403`: utente corrente non autorizzato alla messaggistica o alla classificazione;
- `422`: partecipanti non validi per struttura/minore/classificazione;
- `404`: endpoint non disponibile o backend non aggiornato.

## QA richiesto a UX

Eseguire la checklist completa in:

`docs/qa/2026-08-30-abac-note-documenti-messaggi-checklist.md`

Casi minimi da confermare:

- nuova classificazione creata da admin appare in messaggistica senza deploy;
- partecipanti cambiano al cambio classificazione;
- minori selezionabili cambiano al cambio struttura nella modale nuova conversazione;
- utente senza accesso ABAC non compare tra i partecipanti;
- errore 422 viene mostrato come messaggio chiaro;
- apertura thread da utente non partecipante produce 403 leggibile.

## Nota di sicurezza

Il frontend non deve decidere chi può vedere contenuti classificati. La UI può solo filtrare e spiegare. L'enforcement resta sempre nel backend.
