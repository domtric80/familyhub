# Richiesta UX 050 · Preview documento auditata + dettaglio pagina Audit

Data: 2026-06-29
Stato: READY_FOR_UX_IMPLEMENTATION
Priorità: ALTA

## 1. Nuovo endpoint documento

### `GET /api/minors/{minor}/documents/{document}/preview`

Uso:

- preview inline del documento
- non equivale a download
- genera eventi audit e storico minore dedicati

## 2. Evento storico minore nuovo

- `minor_document_viewed`

Leggere:

- `metadata.operation_summary`
- `metadata.ip_address`
- `metadata.document_name`
- `metadata.classification`

## 3. Audit globale correlato

Per la preview il backend genera:

- `action = read`
- `resource_type = minor_document_preview`

`operation_summary` esempio:

- `Mario Rossi ha visualizzato il documento tessera-sanitaria.pdf del minore Luca Bianchi (MIN-2026-01).`

## 4. Pagina Audit · dettaglio richiesto

### Tabella principale

Colonne minime:

- Data/Ora
- IP
- Utente
- Ruolo
- Operazione
- Tipo risorsa
- Minore
- Struttura

### Filtri

- ricerca libera `q`
- preset rapido `oggi`
- preset rapido `ultime 24 ore`
- preset rapido `ultimi 7 giorni`
- preset rapido `solo autenticazione`
- preset rapido `solo minori`
- preset rapido `solo documenti`
- preset rapido `solo permessi`

### Drawer dettaglio riga

Il drawer deve mostrare:

- dati principali record
- `old_values_json` come blocco “Prima”
- `new_values_json` come blocco “Dopo”
- se uno dei due è assente, mostrare solo il blocco disponibile

### Mappatura suggerita preset

- `solo autenticazione` → `resource_type` in `auth_login`, `auth_logout`, `mfa_setup`, `mfa_confirm`, `mfa_disable`, `mfa_recovery_codes`, `auth_failed`
- `solo minori` → `resource_type` in `minor`, `minor_history`
- `solo documenti` → `resource_type` in `minor_document_preview`, `minor_document_download`
- `solo permessi` → `resource_type = role_permissions`

## 5. Regola importante

Per preview documento usare il nuovo endpoint `preview`, non il `download`.
