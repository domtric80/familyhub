# Applicativo completo · specifica prescrittiva pagine, anagrafiche e flussi UI

- `Request ID`: 2026-06-20-008
- `Stato`: OPEN
- `Priorità`: CRITICA
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Obiettivo di questa richiesta

Il frontend attuale non è considerato accettabile perché espone quasi solo una struttura di navigazione senza le funzioni operative reali.

Da questo momento il team UX **non deve interpretare liberamente** le API: deve implementare esattamente le pagine, i componenti, i campi, le azioni, gli stati e i messaggi descritti in questo documento.

Questa richiesta non descrive un “tema grafico”: descrive **funzioni applicative obbligatorie**.

## 2. Regola generale per tutte le pagine

Per ogni schermata il team UX deve implementare:

- titolo pagina
- breadcrumb
- filtro iniziale se previsto
- tabella o form principale
- stato loading
- stato vuoto
- stato errore
- messaggio successo operazione
- gestione errori `401`, `403`, `422`, `423` dove applicabili
- visibilità azioni in base ai permessi ritornati da `GET /auth/me`

## 3. Layout applicativo obbligatorio

### 3.1 Header

L’header deve includere almeno:

- nome applicazione `FamilyHub`
- selettore o badge utente corrente
- voce rapida logout
- stato MFA utente
- area notifiche tecnica predisposta anche se non ancora alimentata dal backend

### 3.2 Sidebar

La sidebar deve contenere **menu reali**, non solo etichette decorative.

Struttura minima obbligatoria:

- `Dashboard`
- `Amministrazione`
  - `Organizzazioni`
  - `Strutture`
  - `Utenti`
  - `Assegnazioni ruolo-struttura`
- `Minori`
  - `Elenco minori`
  - `Nuovo minore`
- `Anagrafiche`
  - `Geografia`
  - `Ruoli`
  - `Tipi documento`
  - `Classificazioni documento`
  - `Tipi contatto`
  - `Stati minore`
  - `Generi`
- `Sicurezza`
  - `Profilo utente`
  - `Configurazione MFA`

## 4. Dashboard

### 4.1 Scopo

Pagina iniziale post-login con accesso rapido ai moduli.

### 4.2 Componenti obbligatori

- card “Minori”
- card “Utenti”
- card “Strutture”
- card “Documenti”
- riquadro “Profilo connesso”
- riquadro “Permessi applicativi”
- riquadro “Classificazioni documentali consentite”

### 4.3 Dati da usare

- `GET /auth/me`

### 4.4 Cosa mostrare

Nel riquadro profilo:

- nome
- cognome
- email
- ruolo/i
- struttura/e assegnata/e

Nel riquadro permessi:

- elenco testuale o badge da `user.capabilities.permissions`

Nel riquadro classificazioni:

- badge da `user.capabilities.document_classifications`

## 5. Autenticazione

## 5.1 Pagina Login

### Campi obbligatori

- `email`
- `password`
- `device_name`
- `otp` visibile solo se il backend richiede MFA oppure sempre disponibile come campo secondario

### Azioni

- pulsante `Accedi`

### Regole UX

- al primo invio tentare login con `email`, `password`, `device_name`
- se la risposta segnala MFA richiesta, mostrare messaggio dedicato e rendere evidente il campo OTP
- non cancellare i campi già compilati

### Errori da gestire

- `422` credenziali non valide
- `422` codice MFA non valido o mancante
- `403` utente disattivato

## 5.2 Pagina Profilo utente

### Dati

- `GET /auth/me`
- `GET /auth/mfa/status`

### Blocchi UI obbligatori

- anagrafica utente
- ruoli/strutture
- permessi effettivi
- classificazioni documentali consentite
- stato MFA

## 5.3 Pagina Configurazione MFA

### Dati/API

- `GET /auth/mfa/status`
- `POST /auth/mfa/setup`
- `POST /auth/mfa/confirm`
- `POST /auth/mfa/recovery-codes/regenerate`
- `POST /auth/mfa/disable`

### Componenti obbligatori

- stato attuale MFA
- pulsante `Attiva MFA`
- area visualizzazione `secret`
- area visualizzazione `otp_auth_url`
- elenco `recovery_codes`
- campo `code`
- pulsante `Conferma MFA`
- pulsante `Rigenera recovery codes`
- pulsante `Disabilita MFA`

### Flusso obbligatorio

1. utente apre pagina MFA
2. se MFA non attiva, vede CTA `Attiva MFA`
3. click su `Attiva MFA` → mostra secret, OTP URL e recovery codes
4. utente inserisce codice OTP
5. click `Conferma MFA`
6. stato pagina aggiornato a MFA confermata

### Errori da gestire

- `422` codice non valido
- `401` sessione scaduta

## 6. Amministrazione · Organizzazioni

## 6.1 Pagina Elenco organizzazioni

### Dati/API

- `GET /admin/organizations`

### Componenti obbligatori

- tabella con colonne:
  - `ID`
  - `Nome`
  - `Ragione sociale`
  - `Email`
  - `Telefono`

### Azioni

- pulsante `Nuova organizzazione`

## 6.2 Modale o pagina Nuova organizzazione

### API

- `POST /admin/organizations`

### Campi obbligatori

- `name`
- `legal_name`
- `email`
- `phone`

### Validazioni UX

- `name` obbligatorio
- `email` valida se valorizzata

## 7. Amministrazione · Strutture

## 7.1 Pagina Elenco strutture

### Dati/API

- `GET /admin/facilities`

### Tabella obbligatoria

Colonne:

- `ID`
- `Codice`
- `Nome`
- `Organizzazione`
- `Indirizzo`
- `Città`
- `CAP`
- `Capacità`
- `Stato`

### Azioni

- pulsante `Nuova struttura`

## 7.2 Modale o pagina Nuova struttura

### API

- `POST /admin/facilities`
- lookup geografici tramite `GET /lookups/geography`

### Campi obbligatori

- `organization_id`
- `code`
- `name`
- `address_line`
- `city_id`
- `postal_code`
- `capacity`
- `status`

### Regola anagrafica geografica obbligatoria

La UI non deve mostrare una sola select “città” isolata.
Deve mostrare:

1. `Stato/Nazione`
2. `Regione`
3. `Provincia`
4. `Città`

Anche se l’API finale salva solo `city_id`, la scelta deve essere guidata gerarchicamente.

## 8. Amministrazione · Utenti

## 8.1 Pagina Elenco utenti

### API

- `GET /admin/users`

### Tabella obbligatoria

Colonne:

- `ID`
- `Nome`
- `Cognome`
- `Email`
- `Attivo`
- `MFA richiesta`
- `Ultimo accesso` se disponibile

### Azioni

- pulsante `Nuovo utente`

## 8.2 Modale o pagina Nuovo utente

### API

- `POST /admin/users`

### Campi obbligatori

- `first_name`
- `last_name`
- `email`
- `password`
- `is_active`
- `mfa_required`

### Regole UX

- `password` deve essere campo password
- `is_active` come switch
- `mfa_required` come switch

## 9. Amministrazione · Assegnazioni ruolo-struttura

## 9.1 Pagina Elenco assegnazioni

### API

- `GET /admin/user-facility-roles`

### Tabella obbligatoria

Colonne:

- `Utente`
- `Struttura`
- `Ruolo`
- `Dal`
- `Al`
- `Attiva`
- `Assegnato da`

### Azioni

- pulsante `Nuova assegnazione`

## 9.2 Modale o pagina Nuova assegnazione

### API

- `POST /admin/user-facility-roles`
- `GET /admin/users`
- `GET /admin/facilities`
- `GET /lookups/roles`

### Campi obbligatori

- `user_id`
- `facility_id`
- `role_id`
- `valid_from`
- `valid_to`
- `is_active`

## 10. Anagrafiche

Le anagrafiche devono essere pagine reali di consultazione, non solo dati caricati in background.

## 10.1 Geografia

### API

- `GET /lookups/geography`
- `GET /lookups/cities`

### Pagina obbligatoria

Vista gerarchica o tabellare che mostri:

- Nazione
- Regione
- Provincia
- Città

### Uso obbligatorio in tutte le form

Per qualsiasi form che chiede località, il team UX deve riusare questa gerarchia.

## 10.2 Ruoli

### API

- `GET /lookups/roles`

### Pagina obbligatoria

Tabella:

- `Codice`
- `Nome`

## 10.3 Tipi documento

### API

- `GET /lookups/document-types`

### Pagina obbligatoria

Tabella:

- `ID`
- `Codice`
- `Nome`

## 10.4 Classificazioni documento

### API

- `GET /lookups/document-classifications`

### Pagina obbligatoria

Tabella:

- `Codice`
- `Nome`
- `Descrizione`
- `Ruoli ammessi`

### Regola UX

Questa pagina deve spiegare visivamente che la classificazione impatta la visibilità download.

## 10.5 Tipi contatto

### API

- `GET /lookups/contact-types`

### Pagina obbligatoria

Tabella:

- `ID`
- `Codice`
- `Nome`

## 10.6 Stati minore

### API

- `GET /lookups/minor-statuses`

### Pagina obbligatoria

Tabella:

- `ID`
- `Codice`
- `Nome`

## 10.7 Generi

### API

- `GET /lookups/gender-identities`

### Pagina obbligatoria

Tabella:

- `ID`
- `Codice`
- `Nome`

## 11. Minori · Elenco minori

## 11.1 Pagina elenco

### API

- `GET /minors`
- filtri via query `facility_id`, `minor_status_id`

### Filtri obbligatori

- struttura
- stato minore

### Tabella obbligatoria

Colonne:

- `Codice interno`
- `Nome`
- `Cognome`
- `Nome preferito`
- `Data nascita`
- `Struttura`
- `Stato`
- `Ingresso`

### Azioni

- `Nuovo minore`
- `Apri dettaglio`

## 12. Minori · Nuovo minore / modifica minore

### API

- `POST /minors`
- `PUT /minors/{minor}`
- `PATCH /minors/{minor}`
- lookup:
  - `GET /admin/facilities`
  - `GET /lookups/geography`
  - `GET /lookups/minor-statuses`
  - `GET /lookups/gender-identities`

### Campi obbligatori

- `facility_id`
- `internal_code`
- `first_name`
- `last_name`
- `preferred_name`
- `birth_date`
- `birth_city_id`
- `gender_identity_id`
- `tax_code`
- `entry_date`
- `minor_status_id`

### Regole UX obbligatorie

- `birth_city_id` scelto tramite cascata nazione/regione/provincia/città
- `minor_status_id` da anagrafica stati minore
- `gender_identity_id` da anagrafica generi

## 13. Minori · Pagina dettaglio minore

Pagina fondamentale. Deve esistere e contenere i seguenti tab o sezioni:

- `Dati anagrafici`
- `Profilo`
- `Contatti`
- `Documenti`
- `Storico`

## 13.1 Tab Dati anagrafici

Mostra:

- tutti i campi del minore
- pulsante `Modifica dati`

## 13.2 Tab Profilo

### API

- `PUT /minors/{minor}/profile`
- `PATCH /minors/{minor}/profile`

### Campi obbligatori

- `family_background`
- `life_history`
- `risk_factors`
- `crisis_indicators`

### Componenti UI

- form textarea per ogni campo
- pulsante `Salva profilo`

## 13.3 Tab Contatti

### API

- `POST /minors/{minor}/contacts`
- `PUT /minors/{minor}/contacts/{contact}`
- `PATCH /minors/{minor}/contacts/{contact}`
- `GET /lookups/contact-types`
- `GET /lookups/geography`

### Tabella obbligatoria

Colonne:

- `Tipo contatto`
- `Nome`
- `Cognome`
- `Telefono`
- `Email`
- `Città`
- `Note`
- `Azioni`

### Azioni

- `Nuovo contatto`
- `Modifica`

### Campi form contatto

- `contact_type_id`
- `first_name`
- `last_name`
- `phone`
- `email`
- `city_id`
- `notes`

### Regola geografica

Anche qui scelta gerarchica nazione/regione/provincia/città, non select piatta non guidata.

## 13.4 Tab Documenti

### API

- `POST /minors/{minor}/documents`
- `GET /lookups/document-types`
- `GET /lookups/document-classifications`
- `GET /minors/{minor}/documents/{document}/download`

### Tabella obbligatoria

Colonne:

- `Tipo documento`
- `Nome file`
- `Classificazione`
- `Emesso da`
- `Data emissione`
- `Data scadenza`
- `Stato sicurezza`
- `Azioni`

### Azioni obbligatorie

- `Carica documento`
- `Scarica documento`

### Form upload documento

Campi:

- `document_type_id`
- `classification_code`
- `document_issuer_id`
- `issued_by`
- `issue_date`
- `expiry_date`
- `file`

### Stati sicurezza da visualizzare

- `pending`
- `clean`
- `infected`
- `rejected`

### Regole UX obbligatorie

- pulsante download attivo solo se `attachment.security_status = clean`
- se risposta `423`, mostrare messaggio che il documento è in verifica sicurezza o non rilasciabile
- le opzioni classificazione devono essere compatibili con `GET /auth/me -> capabilities.document_classifications`

## 13.5 Tab Storico

### API

- `GET /minors/{minor}/history`

### Tabella o timeline obbligatoria

Campi da mostrare:

- `Data/ora evento`
- `Tipo evento`
- `Autore evento`
- `Riassunto`

### Regole UX

- usare `actor.first_name`, `actor.last_name`, `actor.email` se presenti
- fallback `Sistema` se `actor = null`
- prevedere espansione dettaglio snapshot/metadata

## 14. Stato vuoto, loading, errori

Ogni tabella deve avere:

- skeleton loading o spinner
- messaggio stato vuoto contestuale
- messaggio errore contestuale

Esempi:

- `Nessun minore presente`
- `Nessuna organizzazione disponibile`
- `Nessun documento caricato`
- `Errore durante il caricamento dei dati`

## 15. Permessi e visibilità

Fonte ufficiale:

- `GET /auth/me`

### Regola tassativa

Il team UX **non deve hardcodare ruoli** per mostrare pulsanti.
Deve usare:

- `user.capabilities.permissions`
- `user.capabilities.document_classifications`

### Esempi

- mostra upload documenti solo se presente `attachments.upload`
- mostra download documenti solo se presente `attachments.read`

## 16. Errori da gestire obbligatoriamente

### `401`

- sessione non valida o scaduta
- redirect al login

### `403`

- azione non consentita
- mostrare messaggio funzionale, non tecnico

### `422`

- validazione campi
- evidenziare il campo errato
- mostrare messaggio sotto il campo

### `423`

- documento bloccato in quarantena o non ancora validato

## 17. Deliverable richiesto al team UX

Il team UX deve produrre:

1. elenco pagine effettivamente implementate
2. mappa menu → pagina → endpoint usati
3. elenco componenti reali creati
4. elenco modali/form creati
5. elenco parti ancora mancanti

## 18. Checklist tassativa UX team

- [ ] login reale implementato
- [ ] pagina profilo utente implementata
- [ ] pagina configurazione MFA implementata
- [ ] elenco organizzazioni implementato
- [ ] creazione organizzazione implementata
- [ ] elenco strutture implementato
- [ ] creazione struttura implementata
- [ ] elenco utenti implementato
- [ ] creazione utente implementata
- [ ] elenco assegnazioni implementato
- [ ] creazione assegnazione implementata
- [ ] pagine anagrafiche implementate
- [ ] elenco minori implementato
- [ ] creazione minore implementata
- [ ] dettaglio minore implementato
- [ ] tab profilo implementata
- [ ] tab contatti implementata
- [ ] tab documenti implementata
- [ ] tab storico implementata
- [ ] gestione stati loading/empty/error implementata
- [ ] gestione permessi da `GET /auth/me` implementata

## 19. Risposta richiesta

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-20-008-complete-application-pages-and-master-data-ui-spec-response.md`

La risposta deve indicare, pagina per pagina:

- `IMPLEMENTATA`
- `PARZIALE`
- `NON IMPLEMENTATA`
- `BLOCCATA`
