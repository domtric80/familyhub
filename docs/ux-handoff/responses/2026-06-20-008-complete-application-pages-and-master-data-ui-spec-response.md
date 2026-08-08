> **STATO DOCUMENTO: STORICO / NON PIU' SUFFICIENTE COME FONTE CORRENTE**
>
> Questo documento descriveva uno stato iniziale del frontend.
> Oggi non e' piu' sufficiente per valutare il progetto perche':
>
> - molte pagine sono evolute
> - diversi gap sono stati chiusi
> - altri sono stati ridefiniti con handoff piu' recenti
>
> Va quindi usato solo come storico di sprint.
>
> Fonti correnti da preferire:
>
> - `C:/Projects/FamilyHUB/docs/ux-handoff/MASTER-UX-APPLICATION-SPEC.md`
> - `C:/Projects/FamilyHUB/docs/api/openapi.yaml`
> - handoff recenti per modulo in `C:/Projects/FamilyHUB/docs/ux-handoff/requests/`

# Risposta UX Handoff · Request 2026-06-20-008

- `Request ID`: 2026-06-20-008
- `Data risposta`: 2026-06-20 (aggiornata dopo sprint reactstrap)
- `Stato`: AGGIORNATA

---

## Nota metodologica

- **IMPLEMENTATA** = funzione reale e raggiungibile dalla UI
- **PARZIALE** = esiste ma con campi/colonne/funzioni mancanti rispetto alla spec
- **NON IMPLEMENTATA** = nessuna pagina/route/componente esistente
- **BLOCCATA** = codice presente ma non raggiungibile dalla UI (no route, no link)

---

## 3. Layout applicativo

### 3.1 Header — `PARZIALE`

**Presente:**
- Nome applicazione FamilyHub
- Badge utente connesso (nome)
- Logout funzionante

**Mancante:**
- Stato MFA utente (badge visivo in header)
- Area notifiche (anche solo predisposta)

### 3.2 Sidebar — `IMPLEMENTATA`

**Presente:**
- Dashboard
- Minori (Elenco, Nuovo)
- Amministrazione (Organizzazioni, Strutture, Utenti, Assegnazioni)
- Anagrafiche (tutti e 7 i sotto-menu: Geografia, Ruoli, Tipi documento, Classificazioni, Tipi contatto, Stati minore, Generi)
- Sicurezza (Profilo utente, Configurazione MFA)

---

## 4. Dashboard — `PARZIALE`

**Presente:**
- Riquadro "Profilo connesso" con dati reali da `GET /auth/me` (nome, email, ruoli, strutture, MFA)
- Riquadro "Permessi applicativi" da `capabilities.permissions`
- Riquadro "Classificazioni documentali consentite" da `capabilities.document_classifications`
- Dashboard differenziate per ruolo (Direttore / Coordinatore / Educatore)
- Card Minori, Utenti, Strutture, Documenti presenti

**Mancante:**
- Dati reali nelle card di riepilogo (conteggi statici, non da API)
- Nessun endpoint count previsto dall'OpenAPI attuale

---

## 5. Autenticazione

### 5.1 Pagina Login — `PARZIALE`

**Presente:**
- Campi `email`, `password`
- Campo `otp` appare dinamicamente quando il backend richiede MFA
- `device_name` passato in AuthContext con valore fisso (non visibile all'utente)
- Gestione `422` credenziali non valide
- Messaggio dedicato quando MFA richiesta

**Mancante:**
- Campo `device_name` visibile/configurabile dall'utente (spec richiede campo esplicito)
- Gestione `403` utente disabilitato con messaggio dedicato (attuale: messaggio generico)

### 5.2 Pagina Profilo utente — `IMPLEMENTATA`

**Presente:**
- Route `/profilo` con link sidebar
- Dati da `GET /auth/me` e `GET /auth/mfa/status`
- Sezione anagrafica: nome, cognome, email, stato account
- Sezione ruoli/strutture con badge
- Sezione permessi effettivi da `capabilities.permissions`
- Sezione classificazioni documentali da `capabilities.document_classifications`
- Stato MFA con badge

### 5.3 Pagina Configurazione MFA — `IMPLEMENTATA`

**Presente:**
- Route `/mfa/config` con link sidebar
- Stato attuale MFA da `GET /auth/mfa/status`
- Pulsante `Attiva MFA` → `POST /auth/mfa/setup`
- Visualizzazione `secret`, `otp_auth_url`, `recovery_codes`
- Campo `code` e pulsante `Conferma MFA` → `POST /auth/mfa/confirm`
- Pulsante `Rigenera recovery codes` → `POST /auth/mfa/recovery-codes/regenerate`
- Pulsante `Disabilita MFA` → `POST /auth/mfa/disable`

---

## 6. Amministrazione · Organizzazioni

### 6.1 Elenco organizzazioni — `PARZIALE`

**Presente:**
- Tabella con colonne: Nome, Ragione sociale, Email, Telefono, Azioni
- `GET /admin/organizations` — loading, stato vuoto, toast errore

**Mancante:**
- Colonna `ID` assente

### 6.2 Nuova/modifica organizzazione — `IMPLEMENTATA`

- Modale reactstrap: `name`, `legal_name`, `email`, `phone`
- `POST /admin/organizations` / `PUT /admin/organizations/{id}`
- Validazione react-hook-form, toast successo/errore

---

## 7. Amministrazione · Strutture

### 7.1 Elenco strutture — `PARZIALE`

**Presente:**
- Tabella con colonne: Codice, Nome struttura, Organizzazione, Città, Posti, Stato, Azioni
- `GET /admin/facilities`

**Mancante:**
- Colonne `ID`, `Indirizzo`, `CAP` assenti

### 7.2 Nuova/modifica struttura — `PARZIALE`

**Presente:**
- Campi: `organization_id`, `code`, `name`, `address_line`, `city_id`, `postal_code`, `capacity`, `status`
- `POST /admin/facilities` / `PUT /admin/facilities/{id}`

**Mancante:**
- Cascata geografica nazione→regione→provincia→città per `city_id` (attuale: select piatta)

---

## 8. Amministrazione · Utenti

### 8.1 Elenco utenti — `PARZIALE`

**Presente:**
- Tabella con colonne: Nome, Email, Attivo, MFA richiesta, Ultimo accesso, Azioni
- `GET /admin/users`

**Mancante:**
- Colonne `ID` e `Cognome` separate (attuale: nome+cognome uniti)

### 8.2 Nuovo/modifica utente — `IMPLEMENTATA`

- Campi: `first_name`, `last_name`, `email`, `password`, `is_active`, `mfa_required`
- `is_active` e `mfa_required` come switch Cuba (Controller + `<label className="switch">`)
- `POST /admin/users` / `PUT /admin/users/{id}`

---

## 9. Amministrazione · Assegnazioni

### 9.1 Elenco assegnazioni — `PARZIALE`

**Presente:**
- Tabella con colonne: Utente, Struttura, Ruolo, Dal, Al, Stato, Azioni
- `GET /admin/user-facility-roles`

**Mancante:**
- Colonna "Assegnato da" assente (campo non ritornato dall'API attuale)

### 9.2 Nuova assegnazione — `IMPLEMENTATA`

- Campi: `user_id`, `facility_id`, `role_id`, `valid_from`, `valid_to`, `is_active`
- Select dinamici da `GET /admin/users`, `GET /admin/facilities`, `GET /lookups/roles`
- `POST /admin/user-facility-roles`

---

## 10. Anagrafiche

### 10.1 Geografia — `IMPLEMENTATA`

- Route `/anagrafiche/geografia`, vista gerarchica nazione→regione→provincia→città
- `GET /lookups/geography`

### 10.2 Ruoli — `IMPLEMENTATA`

- Route `/anagrafiche/ruoli`, tabella: Codice, Nome
- `GET /lookups/roles`

### 10.3 Tipi documento — `IMPLEMENTATA`

- Route `/anagrafiche/tipi-documento`, tabella: ID, Codice, Nome
- `GET /lookups/document-types`

### 10.4 Classificazioni documento — `IMPLEMENTATA`

- Route `/anagrafiche/classificazioni`, tabella: Codice, Nome, Descrizione, Ruoli ammessi (badge)
- `GET /lookups/document-classifications`

### 10.5 Tipi contatto — `IMPLEMENTATA`

- Route `/anagrafiche/tipi-contatto`, tabella: ID, Codice, Nome
- `GET /lookups/contact-types`

### 10.6 Stati minore — `IMPLEMENTATA`

- Route `/anagrafiche/stati-minore`, tabella: ID, Codice, Nome
- `GET /lookups/minor-statuses`

### 10.7 Generi — `IMPLEMENTATA`

- Route `/anagrafiche/generi`, tabella: ID, Codice, Nome
- `GET /lookups/gender-identities`

---

## 11. Minori · Elenco minori — `PARZIALE`

**Presente:**
- Tabella: Codice interno, Nome, Cognome, Data nascita, Struttura, Stato, Ingresso, Azioni
- Ricerca testuale locale
- `GET /minors`

**Mancante:**
- Filtro struttura (`facility_id`) come select → query param verso API
- Filtro stato minore (`minor_status_id`) come select → query param verso API
- Colonna `Nome preferito` assente

---

## 12. Minori · Nuovo/modifica minore — `PARZIALE`

**Presente:**
- Tutti i campi: `facility_id`, `internal_code`, `first_name`, `last_name`, `preferred_name`, `birth_date`, `birth_city_id`, `gender_identity_id`, `tax_code`, `entry_date`, `minor_status_id`
- `POST /minors` e `PUT /minors/{id}`
- `theme-form` Cuba presente

**Mancante:**
- `birth_city_id` scelto tramite select piatta, non cascata geografica

---

## 13. Minori · Dettaglio minore

### 13.1 Tab Dati anagrafici — `IMPLEMENTATA`

- Tutti i campi visualizzati, pulsante Modifica funzionante

### 13.2 Tab Profilo — `IMPLEMENTATA`

- Campi: `family_background`, `life_history`, `risk_factors`, `crisis_indicators`
- Form textarea per ogni campo, `PUT /minors/{id}/profile`, toast feedback

### 13.3 Tab Contatti — `PARZIALE`

**Presente:**
- Tabella: Tipo contatto, Nome, Cognome, Telefono, Email, Città, Note, Azioni
- Modale: `contact_type_id`, `first_name`, `last_name`, `phone`, `email`, `city_id`, `notes`
- `POST/PUT /minors/{id}/contacts`

**Mancante:**
- `city_id` scelto tramite select piatta, non cascata geografica

### 13.4 Tab Documenti — `IMPLEMENTATA`

- Tabella completa con stati sicurezza
- Upload con tutti i campi richiesti
- Download solo se `security_status = clean`
- Gestione `423` con messaggio dedicato
- Classificazioni filtrate da `capabilities.document_classifications`

### 13.5 Tab Storico — `IMPLEMENTATA`

- Tabella con data/ora, tipo evento, autore, riassunto
- `GET /minors/{id}/history`
- `actor` con fallback "Sistema", filtro tipo evento

---

## 14. Stato vuoto, loading, errori — `PARZIALE`

**Presente:** Spinner loading + messaggio stato vuoto in tutte le pagine

**Mancante:** Skeleton loading assente; messaggi errore non uniformi tra le pagine

---

## 15. Permessi e visibilità — `PARZIALE`

**Presente:**
- Dashboard mostra `capabilities.permissions` e `capabilities.document_classifications`
- Download documenti condizionato a `security_status`
- Classificazioni upload filtrate da `capabilities.document_classifications`

**Mancante:**
- `capabilities.permissions` non verificati per mostrare/nascondere pulsanti CRUD
- `attachments.upload` / `attachments.read` non verificati sui pulsanti

---

## 16. Gestione errori — `PARZIALE`

**Presente:**
- `401` → redirect login (axios interceptor)
- `422` → toast messaggio API
- `423` → messaggio dedicato nella tab Documenti

**Mancante:**
- `422` → evidenziazione campo specifico inline (solo nelle pagine con react-hook-form)
- `403` → messaggio funzionale dedicato

---

## 17. Checklist tassativa — stato aggiornato

- [x] login reale implementato — **PARZIALE** (manca `device_name` visibile, `403` dedicato)
- [x] pagina profilo utente implementata — **IMPLEMENTATA**
- [x] pagina configurazione MFA implementata — **IMPLEMENTATA**
- [x] elenco organizzazioni implementato — **PARZIALE** (manca colonna ID)
- [x] creazione organizzazione implementata — **IMPLEMENTATA**
- [x] elenco strutture implementato — **PARZIALE** (mancano colonne ID, Indirizzo, CAP)
- [x] creazione struttura implementata — **PARZIALE** (manca cascata geografica)
- [x] elenco utenti implementato — **PARZIALE** (ID e Cognome uniti)
- [x] creazione utente implementata — **IMPLEMENTATA** (switch Cuba corretti)
- [x] elenco assegnazioni implementato — **PARZIALE** (manca colonna "Assegnato da")
- [x] creazione assegnazione implementata — **IMPLEMENTATA**
- [x] pagine anagrafiche implementate — **IMPLEMENTATE** (tutte e 7)
- [x] elenco minori implementato — **PARZIALE** (mancano filtri API, colonna nome preferito)
- [x] creazione minore implementata — **PARZIALE** (manca cascata geografica città nascita)
- [x] dettaglio minore implementato — **IMPLEMENTATA** (tab Cuba border-tab corretti)
- [x] tab profilo implementata — **IMPLEMENTATA**
- [x] tab contatti implementata — **PARZIALE** (manca cascata geografica city_id)
- [x] tab documenti implementata — **IMPLEMENTATA**
- [x] tab storico implementata — **IMPLEMENTATA**
- [x] gestione stati loading/empty/error implementata — **PARZIALE** (no skeleton)
- [x] gestione permessi da `GET /auth/me` implementata — **PARZIALE** (non sui pulsanti CRUD)

---

## Gaps prioritari rimanenti

1. **Cascata geografica** (nazione→regione→provincia→città) — manca in StrutturePage, MinoreFormPage, ContattiTab. Componente riusabile da creare.
2. **Filtri MinoriListPage** — select `facility_id` e `minor_status_id` con query params verso API
3. **Colonne mancanti nelle tabelle** — ID in Organizzazioni; ID/Indirizzo/CAP in Strutture; Cognome separato in Utenti; Assegnato da in Assegnazioni
4. **Permessi CRUD** — `capabilities.permissions` per visibilità pulsanti
5. **device_name visibile in login** — campo o valore configurabile

---

## Nota infrastrutturale critica

Il frontend gira tramite **Vite dev server** (non `dist/`). Le librerie `reactstrap`, `react-hook-form`, `react-toastify` sono nel `package.json` ma il container Docker usa un volume separato per `node_modules`. Per applicare le dipendenze al container in esecuzione occorre:

```bash
docker compose restart frontend
```

oppure, senza riavvio completo:

```bash
docker compose exec frontend npm install
```
