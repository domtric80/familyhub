# Richiesta UX 012 · CRUD anagrafiche semplici + utenti applicativi + ruoli/permessi

Stato: READY_FOR_UX_IMPLEMENTATION
Data: 2026-06-20

## 1. Contesto funzionale

Il backend FamilyHub espone ora API reali per:

- CRUD `tipi documento`
- CRUD `tipi contatto`
- CRUD `stati minore`
- CRUD `generi`
- gestione utenti applicativi
- gestione ruoli applicativi
- gestione matrice permessi per ruolo

Questo sostituisce i placeholder attuali con operazioni realmente eseguibili.

## 2. Impatto UX

Le pagine oggi consultative o con pulsanti disabilitati devono essere convertite in pagine operative.

Il team UX non deve inventare flussi: deve implementare esattamente quanto descritto sotto.

## 3. Fonte API contrattuale

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 4. Pagine da implementare / aggiornare

### 4.1 Pagina `Anagrafiche > Tipi documento`

- Route: `/anagrafiche/tipi-documento`
- Titolo pagina: `Tipi documento`
- Menu: `Anagrafiche`

#### Tabella

Colonne obbligatorie:

- `ID`
- `Codice`
- `Nome`
- `Scope`
- `Azioni`

#### CTA

- pulsante `Nuovo tipo`
- azione riga `Modifica`
- azione riga `Elimina`

#### Modale creazione/modifica

Campi obbligatori:

- `code`
- `name`
- `scope`

#### Endpoint

- `GET /api/admin/document-types`
- `POST /api/admin/document-types`
- `GET /api/admin/document-types/{document_type}`
- `PUT /api/admin/document-types/{document_type}`
- `DELETE /api/admin/document-types/{document_type}`

#### Stati UI da gestire

- `loading`
- `empty`
- `error`
- `success toast`
- `delete confirm`

#### Errori UI da gestire

- `422` validazione form
- `409` record in uso

---

### 4.2 Pagina `Anagrafiche > Tipi contatto`

- Route: `/anagrafiche/tipi-contatto`
- Titolo pagina: `Tipi contatto`

#### Tabella

- `ID`
- `Codice`
- `Nome`
- `Azioni`

#### Modale creazione/modifica

Campi:

- `code`
- `name`

#### Endpoint

- `GET /api/admin/contact-types`
- `POST /api/admin/contact-types`
- `GET /api/admin/contact-types/{contact_type}`
- `PUT /api/admin/contact-types/{contact_type}`
- `DELETE /api/admin/contact-types/{contact_type}`

#### Errori UI

- `422`
- `409`

---

### 4.3 Pagina `Anagrafiche > Stati minore`

- Route: `/anagrafiche/stati-minore`
- Titolo pagina: `Stati minore`

#### Tabella

- `ID`
- `Codice`
- `Nome`
- `Ordinamento`
- `Attivo`
- `Azioni`

#### Modale creazione/modifica

Campi:

- `code`
- `name`
- `sort_order`
- `is_active`

#### Endpoint

- `GET /api/admin/minor-statuses`
- `POST /api/admin/minor-statuses`
- `GET /api/admin/minor-statuses/{minor_status}`
- `PUT /api/admin/minor-statuses/{minor_status}`
- `DELETE /api/admin/minor-statuses/{minor_status}`

#### Errori UI

- `422`
- `409`

---

### 4.4 Pagina `Anagrafiche > Generi`

- Route: `/anagrafiche/generi`
- Titolo pagina: `Generi`

#### Tabella

- `ID`
- `Codice`
- `Nome`
- `Ordinamento`
- `Attivo`
- `Azioni`

#### Modale creazione/modifica

Campi:

- `code`
- `name`
- `sort_order`
- `is_active`

#### Endpoint

- `GET /api/admin/gender-identities`
- `POST /api/admin/gender-identities`
- `GET /api/admin/gender-identities/{gender_identity}`
- `PUT /api/admin/gender-identities/{gender_identity}`
- `DELETE /api/admin/gender-identities/{gender_identity}`

#### Errori UI

- `422`
- `409`

---

### 4.5 Pagina `Admin > Utenti`

- Route: `/admin/utenti`
- Titolo pagina: `Utenti di sistema`

#### Tabella

Colonne obbligatorie:

- `Nome`
- `Email`
- `Attivo`
- `MFA richiesta`
- `MFA confermata`
- `Ultimo accesso`
- `Ruoli assegnati`
- `Azioni`

#### CTA globali

- `Nuovo utente`

#### Azioni riga

- `Modifica`
- `Disattiva`
- `Reset MFA`

#### Modale nuovo utente

Campi:

- `first_name`
- `last_name`
- `email`
- `password`
- `is_active`
- `mfa_required`

#### Modale modifica utente

Campi:

- `first_name`
- `last_name`
- `email`
- `password` opzionale
- `is_active`
- `mfa_required`

Nota:

- se il campo password è vuoto in modifica, UX non deve forzare un cambio password

#### Endpoint

- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/admin/users/{user}`
- `PUT /api/admin/users/{user}`
- `POST /api/admin/users/{user}/deactivate`
- `POST /api/admin/users/{user}/reset-mfa`

#### Comportamenti obbligatori

- azione `Disattiva` con modale di conferma
- azione `Reset MFA` con modale di conferma
- se backend risponde `422` su self-deactivation, mostrare messaggio backend

---

### 4.6 Pagina `Anagrafiche > Ruoli`

- Route: `/anagrafiche/ruoli`
- Titolo pagina: `Ruoli`

#### Layout obbligatorio

Vista master-detail:

- colonna sinistra: elenco ruoli
- colonna destra: dettaglio ruolo + matrice permessi

#### Tabella ruoli

Colonne:

- `Codice`
- `Nome`
- `Descrizione`
- `Sistema`
- `N. permessi`
- `Azioni`

#### CTA ruolo

- `Nuovo ruolo`
- `Modifica ruolo`
- `Elimina ruolo`

#### Form ruolo

Campi:

- `code`
- `name`
- `description`
- `is_system`

#### Matrice permessi

Quando un ruolo è selezionato, la UI deve chiamare:

- `GET /api/admin/roles/{role}/permissions`

La UI deve mostrare:

- intestazione ruolo
- elenco completo permessi disponibili
- checkbox checked per `assigned_permission_ids`
- raggruppamento visuale per `resource`

#### Salvataggio matrice

- `PUT /api/admin/roles/{role}/permissions`

Payload:

```json
{
  "permission_ids": [1, 2, 3]
}
```

#### Endpoint ruolo

- `GET /api/admin/roles`
- `POST /api/admin/roles`
- `GET /api/admin/roles/{role}`
- `PUT /api/admin/roles/{role}`
- `DELETE /api/admin/roles/{role}`
- `GET /api/admin/roles/{role}/permissions`
- `PUT /api/admin/roles/{role}/permissions`

#### Errori UI

- `422` validazione
- `409` ruolo in uso

## 5. Regole visibilità

Per questa fase:

- tutte le pagine sopra sono da considerare amministrative
- il frontend deve comunque essere predisposto a nascondere o disabilitare CTA future in base ai permission code, ma non deve inventare logiche non presenti nella risposta backend

## 6. Checklist implementativa UX

- [ ] rimuovere tutti i banner “BLOCCATE DA BACKEND” per le pagine coperte
- [ ] collegare le tabelle ai nuovi endpoint `admin/*`
- [ ] implementare modali create/edit/delete/confirm dove richiesto
- [ ] gestire `422` con error mapping campo-per-campo
- [ ] gestire `409` con alert contestuale
- [ ] mostrare feedback di salvataggio riuscito
- [ ] implementare matrice permessi ruolo con grouping per `resource`
- [ ] non usare endpoint `lookups/*` per azioni CRUD amministrative

## 7. Punti da verificare con backend

- confermare mapping dei campi modali rispetto a `openapi.yaml`
- confermare gestione visuale dei `permission_ids`
- confermare pattern di messaggistica per `409 Conflict`

## 8. Richiesta al team UX

Quando avete recepito questa specifica, create la risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-20-012-admin-master-data-crud-and-rbac-apis-response.md`

Stato atteso minimo:

- `RECEIVED` oppure `READY_FOR_BACKEND_REVIEW`
