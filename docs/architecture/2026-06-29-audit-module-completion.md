# FamilyHub · Audit module completion

## Copertura raggiunta

Il modulo Audit ora copre:

- letture sensibili minore
- storico minore
- download documenti minore
- modifiche RBAC sui permessi ruolo
- login / logout
- fallimenti di login
- blocco utente disattivato
- errori MFA
- setup / conferma / disattivazione MFA
- rigenerazione recovery code MFA

## Endpoint

- `GET /api/admin/audit-logs`
- `GET /api/admin/audit-logs/filters`

## Decisioni tecniche

- `audit_logs.facility_id` reso nullable per eventi globali o di autenticazione
- `operation_summary` è il testo canonico leggibile per UI e audit operativo
- `minor_id` su `audit_logs` permette slicing per minore anche nei log globali
- la pagina storico minore continua a consumare `minor_history_entries`
- la pagina audit globale consuma `audit_logs`

## Distinzione fra audit globale e storico minore

### Audit globale

Usato per:

- ispezione sicurezza
- verifiche amministrative
- compliance operativa
- ricerca trasversale per utente/IP/risorsa/data

### Storico minore

Usato per:

- timeline funzionale del singolo minore
- evidenza di accessi, download e modifiche che riguardano solo quel minore
