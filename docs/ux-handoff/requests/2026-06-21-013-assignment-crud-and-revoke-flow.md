# Richiesta UX 013 · Assegnazioni utente-struttura-ruolo complete

Stato: READY_FOR_UX_IMPLEMENTATION
Data: 2026-06-21

## 1. Contesto funzionale

Il backend espone ora il ciclo completo di gestione delle assegnazioni RBAC contestuali:

- creazione assegnazione
- modifica assegnazione
- dettaglio assegnazione
- revoca assegnazione

L’assegnazione opera sul legame:

- utente
- struttura
- ruolo
- finestra temporale di validità

## 2. Fonte API contrattuale

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 3. Pagina interessata

- route: `/admin/assegnazioni`
- menu: `Admin`
- titolo pagina: `Assegnazioni ruolo-struttura`

## 4. Tabella obbligatoria

Colonne:

- `Utente`
- `Struttura`
- `Ruolo`
- `Dal`
- `Al`
- `Assegnato da`
- `Stato`
- `Azioni`

## 5. CTA obbligatorie

- `Nuova assegnazione`
- `Modifica`
- `Revoca`

## 6. Flusso creazione / modifica

### Modale form

Campi obbligatori:

- `user_id`
- `facility_id`
- `role_id`
- `valid_from`
- `valid_to` opzionale
- `is_active`

### Endpoint

- `GET /api/admin/user-facility-roles`
- `POST /api/admin/user-facility-roles`
- `GET /api/admin/user-facility-roles/{assignment}`
- `PUT /api/admin/user-facility-roles/{assignment}`

### Validazioni UX da prevedere

- selezione obbligatoria di utente
- selezione obbligatoria di struttura
- selezione obbligatoria di ruolo
- `valid_to >= valid_from`

### Errori backend da gestire

- `422` con mapping campi
- errore possibile su sovrapposizione temporale:
  - messaggio atteso sul campo `role_id`
  - testo backend: esiste già un’assegnazione sovrapposta per utente, struttura e ruolo nel periodo selezionato

## 7. Flusso revoca

### Modale revoca

La modale deve mostrare:

- utente
- ruolo
- struttura
- campo `data revoca effettiva`

### Endpoint

- `PATCH /api/admin/user-facility-roles/{assignment}/revoke`

Payload:

```json
{
  "valid_to": "2026-06-21"
}
```

### Regole UI

- il pulsante `Revoca` deve essere disabilitato per assegnazioni già inattive
- la modale deve accettare anche il caso in cui il backend ritorni un messaggio di assegnazione già revocata
- se il backend risponde `422`, mostrare il messaggio ricevuto

## 8. Stati UI obbligatori

- `loading`
- `empty`
- `error`
- `saving`
- `revoking`
- `success toast`

## 9. Note di dominio

- la revoca non è una cancellazione fisica
- la revoca imposta `valid_to` e `is_active = false`
- una stessa combinazione utente-struttura-ruolo non può avere finestre temporali sovrapposte

## 10. Checklist implementativa UX

- [ ] tabella aggiornata con colonna `Assegnato da`
- [ ] modale nuova assegnazione collegata a `POST`
- [ ] modale modifica collegata a `PUT`
- [ ] modale revoca collegata a `PATCH /revoke`
- [ ] gestione `422` campo-per-campo
- [ ] rimozione banner che indicava backend incompleto

## 11. File risposta richiesto

Il team UX deve rispondere in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-21-013-assignment-crud-and-revoke-flow-response.md`
