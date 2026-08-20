# Incidenti e segnalazioni — Security e workflow design

Data: 2026-08-17

## Fonte

Il modello segue il capitolato tecnico, sezione 6.1:

- registro cadute, aggressioni, autolesionismo, fughe e crisi;
- escalation operatore → coordinatore → direttore → eventuale autorità esterna;
- segnalazione alle autorità precompilata;
- root cause analysis e misure correttive.

## Modello

- `incident_types`: anagrafica amministrabile delle tipologie;
- `incident_severity_levels`: livelli chiusi verde/giallo/rosso;
- `incident_statuses`: stati chiusi del workflow;
- `minor_incidents`: registro principale;
- `minor_incident_transitions`: storico append-only dell'escalation;
- `minor_incident_analyses`: RCA e misure correttive;
- `minor_incident_external_notifications`: comunicazioni registrate verso autorità censite in `document_issuers`.

## Sicurezza

- descrizione, luogo, azioni immediate, note transizione, RCA, misure correttive e riferimenti esterni sono cifrati a riposo;
- ogni endpoint applica RBAC e accesso per-minore;
- `ADMIN_IT` non riceve permessi sul modulo;
- nessuna segnalazione viene inviata automaticamente: il backend produce un payload precompilato e registra l'invio effettuato fuori sistema;
- nessuna eliminazione fisica degli incidenti;
- ogni creazione, correzione, transizione, RCA, precompilazione e notifica esterna è auditata e compare nello storico minore.

## Workflow

1. `REPORTED`: creazione da operatore autorizzato.
2. `COORDINATOR_REVIEWED`: revisione coordinatore/referente o direttore.
3. `DIRECTOR_REVIEWED`: revisione direttore.
4. `EXTERNAL_NOTIFIED`: almeno una autorità esterna è stata registrata.
5. `CLOSED`: chiusura direttore; se la segnalazione esterna è obbligatoria richiede almeno una notifica registrata.

Le transizioni non ammesse falliscono con `409`.
