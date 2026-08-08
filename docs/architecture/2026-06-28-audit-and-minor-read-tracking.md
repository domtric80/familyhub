# FamilyHub · Audit completo e tracciamento letture minore

## Obiettivo

Rendere probatorio il tracciamento di:

- accesso in sola lettura ai dati del minore
- accesso allo storico del minore
- download documenti del minore
- modifiche matrice permessi ruolo
- operazioni API amministrative e operative con formato leggibile

## Regole introdotte

### Audit globale

Ogni record audit deve poter esporre almeno:

- `occurred_at_utc`
- `ip_address`
- `actor_display_name`
- `operation_summary`

Campi di supporto:

- `action`
- `resource_type`
- `resource_id`
- `resource_label`
- `old_values_json`
- `new_values_json`
- `facility_id`
- `minor_id` (se collegabile a un minore)

### Storico minore

`GET /api/minors/{minor}/history` continua a restituire gli eventi del solo minore, ma ora include anche eventi di lettura:

- `minor_viewed`
- `minor_history_viewed`
- `minor_document_downloaded`

Ogni evento può includere in `metadata`:

- `operation_summary`
- `ip_address`
- identificativi documento/allegato
- classificazione documento

## Endpoint audit

Nuovo endpoint:

- `GET /api/admin/audit-logs`

Filtri supportati:

- `facility_id`
- `minor_id`
- `actor_user_id`
- `action`
- `resource_type`
- `date_from`
- `date_to`

## Note UX

### Pagina Audit

Tabella base consigliata:

- Data/Ora
- IP
- Utente
- Ruolo
- Operazione
- Risorsa
- Minore
- Struttura

### Storico minore

La timeline del minore deve mostrare anche gli eventi di sola lettura e download, senza mischiare log di altri minori.
