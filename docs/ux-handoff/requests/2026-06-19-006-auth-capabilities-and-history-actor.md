# Autenticazione · capabilities utente e attore nello storico

- `Request ID`: 2026-06-19-006
- `Stato`: OPEN
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

Per ridurre logica duplicata lato frontend, il backend ora espone nel profilo autenticato:

- permessi effettivi aggregati dell'utente
- classificazioni documentali consentite per l'utente corrente

Inoltre lo storico minori dichiara formalmente l'oggetto `actor` embedded.

## 2. Endpoint coinvolti

- `GET /auth/me`
- `GET /minors/{minor}/history`

## 3. Nuovi campi su `GET /auth/me`

Dentro `user` è ora presente:

### `capabilities.permissions`

Array di stringhe con i codici permesso effettivi, ad esempio:

- `attachments.read`
- `attachments.upload`
- `minors.read`
- `minors.update`

### `capabilities.document_classifications`

Array di classificazioni già filtrate per l'utente autenticato.

Ogni item contiene:

- `code`
- `name`
- `description`
- `allowed_roles`

Uso previsto:

- abilitare/disabilitare pulsanti upload/download
- filtrare select/classificazioni proponibili in upload
- evitare assunzioni hardcoded sui ruoli

## 4. Campo `actor` su storico minori

Ogni item di `GET /minors/{minor}/history` può ora includere:

- `actor.id`
- `actor.first_name`
- `actor.last_name`
- `actor.email`

Il campo può essere `null` per eventi di sistema.

Uso previsto:

- mostrare autore leggibile dell'evento
- evitare fallback basati solo su `actor_user_id`

## 5. Note implementative UX

- usare `capabilities.permissions` come fonte primaria dei permessi UI
- usare `capabilities.document_classifications` per popolare le opzioni di classificazione consentite
- mantenere comunque gestione `403` come rete di sicurezza
- nello storico mostrare `actor` se presente, altrimenti fallback “Sistema”

## 6. Checklist UX team

- [ ] contratto `GET /auth/me` recepito
- [ ] permessi UI derivati da `capabilities.permissions`
- [ ] select classificazioni derivata da `capabilities.document_classifications`
- [ ] storico aggiornato per usare `actor`

## 7. Risposta richiesta

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-19-006-auth-capabilities-and-history-actor-response.md`
