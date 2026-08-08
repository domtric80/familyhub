# Richiesta UX 048 · Audit completo e storico minore con accessi in lettura

Data: 2026-06-28
Stato: READY_FOR_UX_IMPLEMENTATION
Priorità: ALTA

## 1. Obiettivo

Visualizzare in UI:

- audit globale amministrativo/operativo
- accessi in sola lettura ai dati del minore
- accessi allo storico minore
- download documenti minore

## 2. Endpoint nuovo audit globale

### `GET /api/admin/audit-logs`

Filtri query supportati:

- `facility_id`
- `minor_id`
- `actor_user_id`
- `action`
- `resource_type`
- `date_from`
- `date_to`

Response: array di record audit ordinati per `occurred_at_utc desc`.

Campi principali:

- `occurred_at_utc`
- `ip_address`
- `actor_display_name`
- `actor_role_name`
- `operation_summary`
- `action`
- `resource_type`
- `resource_id`
- `resource_label`
- `facility_id`
- `minor_id`
- `old_values_json`
- `new_values_json`
- `actor_user`
- `facility`
- `minor`

## 3. Formato visualizzazione richiesto

Mostrare sempre come colonne base:

- Data/Ora
- Indirizzo IP
- Utente
- Operazione

La colonna `Operazione` deve usare direttamente `operation_summary`.

## 4. Esempi reali di summary

- `Mario Rossi ha avuto accesso in lettura ai dati del minore Luca Bianchi (MIN-2026-01).`
- `Mario Rossi ha visualizzato lo storico del minore Luca Bianchi (MIN-2026-01).`
- `Mario Rossi ha scaricato il documento tessera-sanitaria.pdf del minore Luca Bianchi (MIN-2026-01).`
- `Admin FamilyHub ha modificato i permessi del ruolo Operatore. Permessi precedenti: [...]. Permessi successivi: [...].`

## 5. Storico minore

### Endpoint già esistente

- `GET /api/minors/{minor}/history`

Ora la timeline deve mostrare anche questi `event_type`:

- `minor_viewed`
- `minor_history_viewed`
- `minor_document_downloaded`

Per questi eventi leggere anche `metadata.operation_summary` e `metadata.ip_address`.

## 6. Regole UI

- Nella pagina minore mostrare solo eventi del minore corrente.
- Non costruire frasi lato frontend: usare `operation_summary` se presente.
- Se `operation_summary` non è presente, usare fallback tecnico su `event_type`.
- Mostrare badge o etichetta diversa per:
  - lettura
  - download
  - modifica
  - eliminazione

## 7. QA checklist UX

- [ ] Pagina Audit legge `GET /api/admin/audit-logs`
- [ ] Filtri funzionanti per minore, utente, struttura, data
- [ ] Timeline minore mostra eventi di lettura e download
- [ ] Colonna `Operazione` usa `operation_summary`
- [ ] Nessun log di altri minori appare nella pagina del minore
