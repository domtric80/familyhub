# Handoff UX/API - Note classificate del minore

Data: 2026-07-06  
Area: `Minore > Note riservate`  
Priorità: alta  
Tipo: nuovo modulo backend già disponibile

## 1. Obiettivo

Introdurre un contenitore uniforme per note sensibili del minore, con:

- classificazione documentale riusata
- cifratura a riposo lato backend
- enforcement ABAC coerente con i documenti
- audit su lettura e scrittura

## 2. Endpoint disponibili

- `GET /api/minors/{minor}/notes`
- `POST /api/minors/{minor}/notes`
- `PUT /api/minors/{minor}/notes/{note}`
- `PATCH /api/minors/{minor}/notes/{note}`
- `DELETE /api/minors/{minor}/notes/{note}`

## 3. Regola di visibilità

La UI non deve filtrare da sola.

Il backend restituisce solo le note che l'utente può leggere davvero, usando la stessa logica dei documenti:

- permesso sensibile sul minore
- classificazione ammessa per il ruolo
- assegnazione attiva al minore

## 4. Payload create

```json
{
  "classification_code": "clinical",
  "title": "Nota clinica condivisa",
  "body": "Osservazione clinica protetta."
}
```

## 5. Response

Campi principali:

- `id`
- `minor_id`
- `facility_id`
- `classification_code`
- `classification_label`
- `document_classification`
- `title`
- `body`
- `is_encrypted`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

## 6. Regole UX obbligatorie

### 6.1 Select classificazione

Usare come fonte primaria:

- `GET /api/auth/me -> capabilities.document_classifications`

oppure:

- `GET /api/lookups/document-classifications`

### 6.2 Badge visivo

Mostrare badge per:

- `internal`
- `restricted`
- `clinical`
- `judicial`

### 6.3 Messaggio sicurezza

Testo consigliato:

`Le note sensibili vengono salvate in forma cifrata e sono visibili solo agli utenti autorizzati per classificazione e assegnazione al minore.`

## 7. Non fare lato frontend

- non cifrare lato client
- non filtrare manualmente per ruolo
- non considerare “vuoto” come errore: se una nota non arriva, il backend l'ha esclusa
