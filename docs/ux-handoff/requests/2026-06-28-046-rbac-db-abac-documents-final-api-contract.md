# Richiesta UX 046 · Contratto finale RBAC database / ABAC documenti

Data: 2026-06-28
Stato: READY_FOR_UX_IMPLEMENTATION
Priorità: ALTA

## 1. Decisione definitiva

Il modello corretto è:

- **RBAC** per accesso al sistema e ai dati del database
- **ABAC** per accesso documentale

Da questo momento il frontend deve aderire esattamente a questo principio.

## 2. Assegnazioni minore: cosa sono

Le assegnazioni minore servono solo a collegare un utente a uno o più minori.

Campi reali dell'assegnazione:

- `minor_id`
- `user_id`
- `facility_id`
- `valid_from`
- `valid_to`
- `is_active`
- `notes`

## 3. Assegnazioni minore: cosa NON sono

L'assegnazione minore:

- non ridefinisce il ruolo utente
- non decide il livello di accesso ai dati
- non è un mini-RBAC

Quindi in UI vanno rimossi:

- `Ruolo assegnazione`
- `Livello accesso`

## 4. API da usare

### 4.1 Lista assegnazioni

- `GET /api/admin/minor-assignments`

Filtri supportati:

- `facility_id`
- `minor_id`
- `user_id`
- `is_active`

### 4.2 Crea assegnazione singola

- `POST /api/admin/minor-assignments`

Payload:

```json
{
  "facility_id": 2,
  "minor_id": 1,
  "user_id": 4,
  "valid_from": "2026-06-28",
  "valid_to": null,
  "is_active": true,
  "notes": "Assegnazione operativa"
}
```

### 4.3 Aggiorna assegnazione singola

- `PUT /api/admin/minor-assignments/{minor_assignment}`

Payload identico alla creazione.

### 4.4 Revoca assegnazione

- `PATCH /api/admin/minor-assignments/{minor_assignment}/revoke`

Payload opzionale:

```json
{
  "valid_to": "2026-06-30"
}
```

### 4.5 Vista dalla scheda minore

- `GET /api/admin/minors/{minor}/assigned-users`

Usare questo endpoint per mostrare la tabella utenti assegnati al minore.

### 4.6 Bulk dalla scheda minore

- `POST /api/admin/minors/{minor}/user-assignments/bulk-sync`

Payload:

```json
{
  "user_ids": [4, 5, 6],
  "valid_from": "2026-06-28",
  "valid_to": null,
  "is_active": true,
  "notes": "Allineamento equipe minore"
}
```

Semantica:

- la lista `user_ids` rappresenta l'insieme finale assegnato a quel minore
- gli utenti attivi non inclusi vengono revocati automaticamente

### 4.7 Vista dalla scheda utente

- `GET /api/admin/users/{user}/assigned-minors`

Usare questo endpoint per mostrare i minori già assegnati all'utente.

### 4.8 Bulk dalla scheda utente

- `POST /api/admin/users/{user}/minor-assignments/bulk-sync`

Payload:

```json
{
  "facility_id": 2,
  "minor_ids": [1, 2, 7, 9],
  "valid_from": "2026-06-28",
  "valid_to": null,
  "is_active": true,
  "notes": "Pediatra assegnato ai minori della struttura"
}
```

Semantica:

- la lista `minor_ids` rappresenta l'insieme finale assegnato a quell'utente nella struttura
- i minori attivi non inclusi vengono revocati automaticamente

## 5. UX obbligatoria

### 5.1 Scheda minore

Sezione da chiamare:

- `Accesso al minore`

Funzioni:

- tabella utenti assegnati
- aggiunta multipla utenti
- revoca singola
- salvataggio bulk

### 5.2 Scheda utente

Tab da chiamare:

- `Minori assegnati`

Funzioni:

- selezione struttura
- tabella minori della struttura
- checkbox per ogni minore
- selezione multipla
- `Seleziona tutti`
- `Deseleziona tutti`
- `Salva assegnazioni`

## 6. Colonne richieste in UI

### 6.1 Tabella utenti assegnati al minore

- Nome
- Cognome
- Email
- Ruolo struttura
- Valido dal
- Valido al
- Stato
- Azioni

### 6.2 Tabella minori assegnati all'utente

- Checkbox
- Codice minore
- Nome minore
- Struttura
- Stato minore
- Assegnato sì/no

## 7. Comportamento documenti

Il frontend non deve chiedere all'utente un livello dati.

Per i documenti:

- il backend valuta RBAC documentale
- il backend valuta la classificazione documento
- il backend valuta se il ruolo è ammesso
- il backend valuta se l'utente è assegnato al minore

Questa è la parte ABAC.

## 8. Messaggi UX

### Salvataggio singolo

- `Utente assegnato al minore con successo.`

### Salvataggio bulk da utente

- `Assegnazioni minori aggiornate con successo.`

### Salvataggio bulk da minore

- `Accessi al minore aggiornati con successo.`

### Revoca

- `Assegnazione rimossa con successo.`

## 9. File vincolanti

- `C:\Projects\FamilyHUB\docs\architecture\2026-06-28-rbac-abac-final-separation.md`
- `C:\Projects\FamilyHUB\docs\architecture\2026-06-28-minor-assignment-model-simplification.md`
- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 10. Richiesta al team UX

Produrre risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-28-046-rbac-db-abac-documents-final-api-contract-response.md`
