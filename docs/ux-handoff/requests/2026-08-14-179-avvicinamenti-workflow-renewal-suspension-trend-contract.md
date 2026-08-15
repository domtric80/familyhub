# UX Handoff 179 - Avvicinamenti familiari: rinnovo provvedimento, firma sospensione, trend e audit note riservate

Data: 2026-08-14
Ambito: `Avvicinamenti familiari`

## Obiettivo

Chiudere il workflow operativo residuo degli avvicinamenti sul backend, senza rifare il CRUD esistente.

Questo handoff aggiunge quattro capacità reali:

1. rinnovo esplicito del provvedimento autorizzativo
2. firma esplicita della sospensione da parte del responsabile
3. audit di lettura delle note riservate
4. trend più leggibile per rinnovi e distribuzione tipologie

## Endpoint nuovi

### Rinnovo provvedimento

`POST /api/approaches/{approach}/renew-authorization`

Payload:

- `authorization_reference`
- `authorization_minor_document_id`
- `authorization_issued_at`
- `authorization_expires_at` **required**
- `authorization_renewal_alert_days`

Effetto:

- aggiorna i metadati del provvedimento
- ricalcola stato `authorization_status`
- registra storico minore
- registra audit `minor_approach_authorization`

### Firma sospensione

`POST /api/approaches/{approach}/sign-suspension`

Payload opzionale:

- `suspension_reason`
- `suspended_at`

Regole backend:

- consentito solo a ruoli responsabili ammessi dalla policy backend
- l'avvicinamento deve essere già in stato `suspended`
- deve esistere una motivazione di sospensione
- il backend valorizza `suspension_signed_at`
- registra storico minore
- registra audit `minor_approach_suspension`

## Campi aggiunti nel dettaglio avvicinamento

Ogni record `MinorApproach` ora espone anche:

- `authorization_days_until_expiry`
- `authorization_is_expired`
- `can_renew_authorization`
- `suspension_is_signed`
- `can_sign_suspension`

## Audit note riservate

Quando un utente autorizzato apre il dettaglio di un avvicinamento che contiene note riservate, il backend registra un audit dedicato:

- `resource_type = minor_approach_reserved_notes`
- `action = read`

UX non deve simulare questa logica. Avviene lato backend sul `GET /api/approaches/{approach}`.

## Trend API esteso

`GET /api/approaches/trend`

Nuovi blocchi payload:

- `totals_by_approach_type[]`
  - `approach_type_code`
  - `approach_type_name`
  - `total`

- `upcoming_authorization_renewals[]`
  - `id`
  - `minor_id`
  - `minor_label`
  - `title`
  - `authorization_reference`
  - `authorization_status`
  - `authorization_expires_at`
  - `authorization_days_until_expiry`

## Indicazioni UX

### 1. Dettaglio / tab Avvicinamenti

Mostrare in modo evidente:

- stato provvedimento: `active / expiring / expired`
- giorni mancanti al rinnovo
- pulsante `Rinnova provvedimento` solo se `can_renew_authorization = true`
- badge sospensione firmata se `suspension_is_signed = true`
- pulsante `Firma sospensione` solo se `can_sign_suspension = true` e stato `suspended`

### 2. Trend / dashboard Avvicinamenti

Aggiungere:

- blocco tipologie più frequenti
- blocco rinnovi imminenti / scaduti

## Non fare in frontend

- non dedurre chi può firmare la sospensione
- non calcolare localmente il rinnovo imminente
- non simulare l'audit di consultazione note riservate
