> **STATO DOCUMENTO: STORICO**
>
> Questo documento fotografa una fase molto iniziale del progetto.
> Molti item marcati come `BLOCCATA DA BACKEND` o `PARZIALE` non rappresentano piu' lo stato attuale.
>
> Deve essere usato solo come traccia storica di avanzamento, non come fonte corrente.
>
> Fonti correnti da preferire:
>
> - `C:/Projects/FamilyHUB/docs/api/openapi.yaml`
> - `C:/Projects/FamilyHUB/docs/ux-handoff/MASTER-UX-APPLICATION-SPEC.md`
> - handoff incrementali piu' recenti in `C:/Projects/FamilyHUB/docs/ux-handoff/requests/`

# Risposta UX Handoff · Request 2026-06-20-010

- `Request ID`: 2026-06-20-010
- `Data risposta`: 2026-06-20
- `Stato`: RECEPITA

---

## 1. Tabella stato CRUD per modulo

| Modulo | Elenco | Creazione | Modifica | Eliminazione / Disattivazione | Gestione permessi | Stato | Blocco backend |
|--------|--------|-----------|----------|-------------------------------|-------------------|-------|----------------|
| Organizzazioni | ✅ | ✅ | ⛔ predisposta | ⛔ predisposta | N/A | PARZIALE | PUT /admin/organizations/{id} — DELETE /admin/organizations/{id} |
| Strutture | ✅ | ✅ | ⛔ predisposta | ⛔ predisposta | N/A | PARZIALE | PUT /admin/facilities/{id} — DELETE /admin/facilities/{id} |
| Utenti | ✅ | ✅ | ⛔ predisposta | ⛔ predisposta (disattiva) | N/A | PARZIALE | PUT /admin/users/{id} — DELETE/PATCH /admin/users/{id} |
| Assegnazioni | ✅ | ✅ | ⛔ predisposta | ⛔ predisposta (revoca) | N/A | PARZIALE | PUT /admin/user-facility-roles/{id} — PATCH revoca |
| Ruoli | ✅ | ⛔ predisposta | ⛔ predisposta | ⛔ predisposta | ⛔ predisposta (matrice) | BLOCCATA DA BACKEND | CRUD ruoli non esposto — Matrice permessi non esposta |
| Tipi documento | ✅ | ⛔ predisposta | ⛔ predisposta | ⛔ predisposta | N/A | BLOCCATA DA BACKEND | Nessun endpoint CRUD |
| Tipi contatto | ✅ | ⛔ predisposta | ⛔ predisposta | ⛔ predisposta | N/A | BLOCCATA DA BACKEND | Nessun endpoint CRUD |
| Stati minore | ✅ | ⛔ predisposta | ⛔ predisposta | ⛔ predisposta | N/A | BLOCCATA DA BACKEND | Nessun endpoint CRUD |
| Generi | ✅ | ⛔ predisposta | ⛔ predisposta | ⛔ predisposta | N/A | BLOCCATA DA BACKEND | Nessun endpoint CRUD |
| Geografia | ✅ (gerarchica) | ⛔ predisposta | ⛔ predisposta | ⛔ predisposta | N/A | BLOCCATA DA BACKEND | Nessun endpoint CRUD |

Legenda: ✅ attiva — ⛔ predisposta (pulsante visibile, disabilitato, endpoint mancante)

---

## 2. Implementazione UI — pattern adottato

Per ogni CTA bloccata da backend, la UI adotta il seguente pattern uniforme:

- Il pulsante è **visibile** nella posizione corretta della pagina
- Il pulsante è **disabilitato** (`disabled`)
- Il pulsante ha `title="Endpoint backend non disponibile"`
- Ogni pagina con operazioni bloccate mostra un **alert informativo** in cima alla card

Questo permette di:
- comunicare all'utente che la funzione esiste nel prodotto
- dare visibilità al team backend di cosa manca
- abilitare le CTA senza modifiche strutturali al layout quando l'endpoint arriva

---

## 3. Stato per modulo — dettaglio

### 3.1 Organizzazioni

- **Elenco**: IMPLEMENTATA — tabella con ID, Nome, Ragione sociale, Email, Telefono
- **Creazione**: IMPLEMENTATA — modale reactstrap con react-hook-form, `POST /admin/organizations`
- **Modifica**: BLOCCATA DA BACKEND — pulsante predisposto nella colonna Azioni, disabilitato
- **Elimina**: BLOCCATA DA BACKEND — pulsante predisposto nella colonna Azioni, disabilitato

### 3.2 Strutture

- **Elenco**: IMPLEMENTATA — tabella con Codice, Nome, Organizzazione, Città, Posti, Stato
- **Creazione**: IMPLEMENTATA — modale reactstrap, `POST /admin/facilities`
- **Modifica**: BLOCCATA DA BACKEND — pulsante predisposto, disabilitato
- **Elimina**: BLOCCATA DA BACKEND — pulsante predisposto, disabilitato

### 3.3 Utenti

- **Elenco**: IMPLEMENTATA — tabella con Nome, Cognome, Email, Attivo, MFA, Ultimo accesso
- **Creazione**: IMPLEMENTATA — modale reactstrap con switch Cuba, `POST /admin/users`
- **Modifica**: BLOCCATA DA BACKEND — pulsante predisposto, disabilitato
- **Disattiva**: BLOCCATA DA BACKEND — pulsante predisposto, disabilitato
- **Reset MFA**: BLOCCATA DA BACKEND — pulsante predisposto, disabilitato (nessun endpoint admin dedicato)

### 3.4 Assegnazioni

- **Elenco**: IMPLEMENTATA — tabella con Utente, Struttura, Ruolo, Dal, Al, Stato
- **Creazione**: IMPLEMENTATA — modale reactstrap, `POST /admin/user-facility-roles`
- **Modifica**: BLOCCATA DA BACKEND — pulsante predisposto, disabilitato
- **Revoca**: BLOCCATA DA BACKEND — pulsante predisposto, disabilitato

### 3.5 Ruoli

- **Elenco**: IMPLEMENTATA — tabella Codice/Nome
- **Dettaglio con matrice permessi**: BLOCCATA DA BACKEND — sezione visibile nella pagina con placeholder
- **Nuovo ruolo**: BLOCCATA DA BACKEND — pulsante predisposto, disabilitato
- **Modifica/Elimina**: BLOCCATA DA BACKEND — pulsanti predisposti, disabilitati

### 3.6 Tipi documento

- **Elenco**: IMPLEMENTATA — tabella ID/Codice/Nome
- **Nuovo/Modifica/Elimina**: BLOCCATA DA BACKEND — pulsanti predisposti, disabilitati

### 3.7 Tipi contatto

- **Elenco**: IMPLEMENTATA — tabella ID/Codice/Nome
- **Nuovo/Modifica/Elimina**: BLOCCATA DA BACKEND — pulsanti predisposti, disabilitati

### 3.8 Stati minore

- **Elenco**: IMPLEMENTATA — tabella ID/Codice/Nome
- **Nuovo/Modifica/Disattiva**: BLOCCATA DA BACKEND — pulsanti predisposti, disabilitati

### 3.9 Generi

- **Elenco**: IMPLEMENTATA — tabella ID/Codice/Nome
- **Nuovo/Modifica/Disattiva**: BLOCCATA DA BACKEND — pulsanti predisposti, disabilitati

### 3.10 Geografia

- **Elenco gerarchico**: IMPLEMENTATA — albero nazione → regione → provincia → città
- **Nuovo nazione/regione/provincia/città**: BLOCCATA DA BACKEND — pulsanti predisposti, disabilitati
- **Modifica/Disattiva**: BLOCCATA DA BACKEND — pulsanti predisposti, disabilitati

---

## 4. Gap backend segnalati

Il frontend ha predisposto la UI per tutte le operazioni richieste. Le seguenti API sono necessarie per sbloccare le CTA:

**Admin:**
- `PUT /admin/organizations/{id}`
- `DELETE /admin/organizations/{id}`
- `PUT /admin/facilities/{id}`
- `DELETE /admin/facilities/{id}`
- `PUT /admin/users/{id}`
- `PATCH /admin/users/{id}/deactivate` o campo `is_active` via PUT
- `PUT /admin/user-facility-roles/{id}`
- `PATCH /admin/user-facility-roles/{id}/revoke`

**Anagrafiche (CRUD completo per tutte):**
- `POST/PUT/DELETE /admin/roles`
- `GET /admin/roles/{id}/permissions`
- `PUT /admin/roles/{id}/permissions`
- `POST/PUT/DELETE /admin/document-types`
- `POST/PUT/DELETE /admin/contact-types`
- `POST/PUT/DELETE /admin/minor-statuses`
- `POST/PUT/DELETE /admin/gender-identities`
- `POST/PUT/DELETE /admin/geography/nations`
- `POST/PUT/DELETE /admin/geography/regions`
- `POST/PUT/DELETE /admin/geography/provinces`
- `POST/PUT/DELETE /admin/geography/cities`
