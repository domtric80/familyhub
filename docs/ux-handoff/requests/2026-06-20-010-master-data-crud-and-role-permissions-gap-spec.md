# Anagrafiche CRUD e ruoli/permessi · specifica UX correttiva e gap backend

- `Request ID`: 2026-06-20-010
- `Stato`: OPEN
- `Priorità`: CRITICA

## 1. Problema rilevato

Il frontend attuale mostra pagine anagrafiche quasi solo consultative.

Questo è insufficiente.

Per ogni anagrafica, il team UX deve prevedere esplicitamente:

- elenco
- creazione
- modifica
- eliminazione o disattivazione

Se il backend non espone ancora le API necessarie, la UI non può semplicemente omettere la funzione:
deve segnalarla come `BLOCCATA DA BACKEND` nella risposta.

## 2. Regola tassativa per il team UX

Per ogni modulo sotto `Anagrafiche` e `Ruoli` il team UX deve dichiarare in risposta uno dei seguenti stati:

- `IMPLEMENTATA`
- `PARZIALE`
- `NON IMPLEMENTATA`
- `BLOCCATA DA BACKEND`

Non è accettabile rispondere solo con menu o pagine vuote.

## 3. Stato backend attuale

## 3.1 API oggi disponibili

### Consultazione anagrafiche

- `GET /lookups/geography`
- `GET /lookups/cities`
- `GET /lookups/roles`
- `GET /lookups/document-types`
- `GET /lookups/document-classifications`
- `GET /lookups/contact-types`
- `GET /lookups/minor-statuses`
- `GET /lookups/gender-identities`

### Amministrazione oggi disponibile

- `GET /admin/organizations`
- `POST /admin/organizations`
- `GET /admin/facilities`
- `POST /admin/facilities`
- `GET /admin/users`
- `POST /admin/users`
- `GET /admin/user-facility-roles`
- `POST /admin/user-facility-roles`

## 3.2 API oggi mancanti per CRUD pieno

Attualmente **non risultano esposte** API per:

- modifica organizzazioni
- cancellazione organizzazioni
- modifica strutture
- cancellazione strutture
- modifica utenti
- disattivazione utenti
- modifica assegnazioni utente-struttura-ruolo
- revoca assegnazioni
- creazione/modifica/cancellazione ruoli
- gestione matrice permessi per ruolo
- CRUD backend per:
  - tipi documento
  - tipi contatto
  - stati minore
  - generi
  - geografia

## 4. Cosa deve comunque fare il team UX

Il team UX deve progettare e implementare le schermate **complete**, anche se alcune azioni restano backend-blocked.

Questo significa:

- predisporre struttura pagina
- predisporre tabella completa
- predisporre CTA di creazione/modifica/eliminazione
- indicare con precisione quali CTA sono attive e quali bloccate dal backend

## 5. Specifica per modulo

## 5.1 Organizzazioni

### UI obbligatoria

- tabella elenco
- pulsante `Nuova organizzazione`
- azione riga `Modifica`
- azione riga `Elimina`

### Stato backend

- `Nuova organizzazione` → backend disponibile
- `Modifica` → backend mancante
- `Elimina` → backend mancante

### Esito atteso UX

Il team deve:

- implementare elenco e creazione
- predisporre UI modifica/elimina
- marcare modifica/elimina come `BLOCCATA DA BACKEND`

## 5.2 Strutture

### UI obbligatoria

- tabella elenco
- pulsante `Nuova struttura`
- azione riga `Modifica`
- azione riga `Elimina`

### Stato backend

- creazione disponibile
- modifica mancante
- eliminazione mancante

## 5.3 Utenti

### UI obbligatoria

- tabella elenco
- pulsante `Nuovo utente`
- azione riga `Modifica`
- azione riga `Disattiva`
- azione riga `Reset MFA` predisposta

### Stato backend

- creazione disponibile
- modifica mancante
- disattivazione mancante
- reset MFA self-service admin non esposto come endpoint amministrativo dedicato

## 5.4 Assegnazioni ruolo-struttura

### UI obbligatoria

- tabella elenco
- pulsante `Nuova assegnazione`
- azione riga `Modifica assegnazione`
- azione riga `Revoca`

### Stato backend

- creazione disponibile
- modifica mancante
- revoca/disattivazione mancante

## 5.5 Ruoli

### Errore attuale da correggere

La pagina `Ruoli` non può limitarsi all’elenco di codice/nome.

### UI obbligatoria minima

- tabella ruoli
- pannello dettaglio ruolo
- sezione `Permessi assegnati`
- sezione `Permessi disponibili`
- matrice o checklist permessi

### Stato backend

- `GET /lookups/roles` disponibile ma insufficiente
- matrice permessi ruolo **non esposta** da API dedicata
- CRUD ruoli **non esposto**

### Esito atteso UX

Il team deve:

- implementare almeno la pagina ruoli con spazio reale per la matrice permessi
- dichiarare `BLOCCATA DA BACKEND` la gestione completa finché non arriva API

## 5.6 Tipi documento

### UI obbligatoria

- elenco
- nuovo
- modifica
- elimina/disattiva

### Stato backend

- solo lookup lettura disponibile

## 5.7 Tipi contatto

### UI obbligatoria

- elenco
- nuovo
- modifica
- elimina/disattiva

### Stato backend

- solo lookup lettura disponibile

## 5.8 Stati minore

### UI obbligatoria

- elenco
- nuovo
- modifica
- disattiva

### Stato backend

- solo lookup lettura disponibile

## 5.9 Generi

### UI obbligatoria

- elenco
- nuovo
- modifica
- disattiva

### Stato backend

- solo lookup lettura disponibile

## 5.10 Geografia

### UI obbligatoria

- elenco gerarchico
- nuovo stato/nazione
- nuova regione
- nuova provincia
- nuova città
- modifica
- disattiva

### Stato backend

- sola lettura disponibile

## 6. Regola su pulsanti e componenti

Non è accettabile che il team UX ometta i pulsanti perché manca l’endpoint.

Se l’azione è prevista dal prodotto ma non dal backend attuale, la UI deve essere:

- progettata
- posizionata
- etichettata
- dichiarata `BLOCCATA DA BACKEND`

## 7. Risposta richiesta

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-20-010-master-data-crud-and-role-permissions-gap-spec-response.md`

La risposta deve avere una tabella con colonne:

- `Modulo`
- `Elenco`
- `Creazione`
- `Modifica`
- `Eliminazione/Disattivazione`
- `Gestione permessi`
- `Stato`
- `Blocco backend`

## 8. Nota per il backend

Questo documento evidenzia anche un gap reale lato API:

- per completare il prodotto serviranno endpoint CRUD amministrativi sulle anagrafiche
- serviranno endpoint di gestione ruoli e permessi

