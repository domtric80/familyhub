# QA ABAC documenti, note e messaggistica interna

Data: 2026-08-30  
Scope: validazione funzionale ABAC/RBAC dopo release v1.5.2.  
Regola operativa: non resettare il database; usare solo dati esistenti o creare record di test incrementali.

## Obiettivo

Verificare che l'accesso ai dati sensibili sia coerente su tre aree:

1. documenti del minore;
2. note riservate/classificate;
3. messaggistica interna cifrata.

RBAC governa accesso al sistema e operazioni CRUD. ABAC governa invece la classificazione del contenuto: `internal`, `restricted`, `clinical`, `judicial` o classificazioni aggiunte da admin.

## Prerequisiti

- Almeno una struttura attiva.
- Almeno due minori attivi nella stessa struttura.
- Almeno questi ruoli/utenti assegnati alla struttura:
  - `SUPER_ADMIN` o amministratore di sistema;
  - `DIRETTORE`;
  - `COORDINATORE`;
  - `EDUCATORE`;
  - `PEDIATRA` o ruolo clinico equivalente.
- Almeno una classificazione documento attiva per ciascun ambito da testare.
- Almeno un documento e una nota per classificazione, collegati al minore di test.

## Matrice documenti

| Caso | Utente | Classificazione | Azione | Atteso |
|---|---|---:|---|---|
| D1 | SUPER_ADMIN | qualsiasi | preview/read | 200 |
| D2 | SUPER_ADMIN | qualsiasi | download | 200 se ha `attachments.download` |
| D3 | COORDINATORE | internal/restricted/judicial | preview/read | 200 |
| D4 | COORDINATORE | clinical riservato | preview/read | 403 salvo abilitazione ABAC |
| D5 | PEDIATRA | clinical | preview/read | 200 se ruolo ammesso nella classificazione |
| D6 | EDUCATORE | clinical | preview/read | 403 se ruolo non ammesso |
| D7 | Utente senza assegnazione minore | qualsiasi | preview/read/download | 403, salvo ruolo con bypass minori |

Verifiche audit obbligatorie:

- preview/read documento crea evento audit di lettura;
- download documento crea evento audit di download;
- nel tab storico del minore compaiono solo eventi del minore interessato;
- nella pagina Audit admin compare IP, utente, operazione, oggetto e dettagli.

## Matrice note classificate

| Caso | Utente | Classificazione nota | Azione | Atteso |
|---|---|---:|---|---|
| N1 | COORDINATORE | internal/restricted/judicial | lettura | 200 |
| N2 | COORDINATORE | clinical riservato | lettura | 403 salvo abilitazione ABAC |
| N3 | PEDIATRA | clinical | lettura | 200 se classificazione abilita il ruolo |
| N4 | EDUCATORE | restricted/internal | lettura | 200 se assegnato al minore e ruolo ammesso |
| N5 | Utente non partecipante/assegnato | qualsiasi | lettura | 403 |

## Matrice messaggistica interna

Endpoint coinvolti:

- `GET /api/internal-messages/threads`
- `GET /api/internal-messages/options/participants`
- `POST /api/internal-messages/threads`
- `GET /api/internal-messages/threads/{thread}`
- `POST /api/internal-messages/threads/{thread}/messages`
- `POST /api/internal-messages/threads/{thread}/mark-read`
- `POST /api/internal-messages/threads/{thread}/archive`

| Caso | Scenario | Atteso |
|---|---|---|
| M1 | Creo thread `facility` classificato `internal` con partecipante della struttura | 201, messaggio cifrato nel DB |
| M2 | Creo thread `minor` senza `minor_id` | 422 |
| M3 | Creo thread `minor` con partecipante non assegnato al minore | 422 |
| M4 | Creo thread `minor` `clinical` con partecipante senza ruolo ABAC clinical | 422 |
| M5 | Partecipante autorizzato apre thread | 200 e audit read |
| M6 | Utente non partecipante apre thread | 403 |
| M7 | Partecipante autorizzato risponde | 200 e audit update |
| M8 | Partecipante archivia thread | 200 e audit archive |

## Test UI richiesti

- La lista classificazioni della messaggistica non deve essere hardcoded.
- Il frontend deve leggere le classificazioni da `GET /api/lookups/document-classifications`.
- Se admin aggiunge una nuova classificazione attiva, deve apparire nei filtri e nella creazione conversazione senza deploy frontend.
- Al cambio classificazione nel form nuova conversazione, la lista partecipanti deve essere ricaricata.
- Gli errori 403/422 devono essere mostrati come messaggi utente comprensibili, non come stack trace.

## Esito atteso

Il blocco è validato solo se:

- nessun utente vede documenti, note o thread fuori dal proprio perimetro RBAC/ABAC;
- i ruoli con bypass minore continuano ad accedere secondo policy;
- ogni preview/read/download/messaggio produce audit leggibile;
- le classificazioni custom sono gestite senza modificare codice frontend.
