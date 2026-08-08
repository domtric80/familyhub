# Risposta Frontend — Handoff 130: Sblocco gestione ABAC documenti da pannello admin

Data: 2026-07-06  
Riferimento: `2026-07-06-130-abac-documenti-admin-unlocked.md`

## Stato implementazione

Tutto quanto richiesto era già implementato in sessioni precedenti. Questa sessione ha aggiunto
la guidance visiva mancante.

---

## Funzionalità già presenti

### Pagina CRUD classificazioni documento

Route: `/anagrafiche/classificazioni`  
File: `frontend/src/pages/anagrafiche/ClassificazioniPage.tsx`

Già implementato:

- Elenco classificazioni con codice, nome, descrizione, ruoli ammessi, stato attivo/inattivo
- Crea nuova classificazione con `code`, `name`, `description`, `allowed_role_codes` (checkbox multipli), `is_active`
- Modifica classificazione esistente
- Elimina con conferma
- Info drawer con spiegazione del modello ABAC
- Gestione errori di campo e conflitti

Endpoint usati:
- `GET /api/admin/document-classifications`
- `POST /api/admin/document-classifications`
- `PUT /api/admin/document-classifications/{id}`
- `DELETE /api/admin/document-classifications/{id}`

### Editor policy documentale per ruolo

Route: `/anagrafiche/ruoli` → click su un ruolo → sezione "Policy documentale (ABAC)"  
File: `frontend/src/pages/anagrafiche/RuoliPage.tsx`

Già implementato:

- Indicatori RBAC base: `attachments_read`, `attachments_upload`
- Alert warning se il ruolo non ha `attachments.read` (permesso base mancante)
- Tabella classificazioni con checkbox abilitazione per ruolo
- Colonne: classificazione (code + nome), descrizione, accesso effettivo, note
- `effective_read_access` + `requires_minor_assignment` gestiti visivamente
- Salvataggio con `PUT /api/admin/roles/{role}/document-policy`
- Disabilitato per ruoli privilegiati di sistema

Endpoint usati:
- `GET /api/admin/roles/{role}/document-policy`
- `PUT /api/admin/roles/{role}/document-policy` con `{ classification_codes: [...] }`

---

## Modifiche aggiunte in questa sessione

### 1. Guidance box "due livelli" in ClassificazioniPage

Aggiunto un alert visibile sulla pagina (sopra la tabella) che spiega il flusso in due passi:

1. **Crea il tag** — definisci la classificazione
2. **Assegna il tag ai ruoli** — vai in Anagrafiche → Ruoli, apri un ruolo, abilita dalla sezione
   Policy documentale

Il box include un link diretto a `/anagrafiche/ruoli`.

**Motivazione**: senza questa indicazione l'utente poteva creare un tag credendo che i ruoli
definiti in `allowed_role_codes` lo ricevessero automaticamente. Non è così: `allowed_role_codes`
definisce chi è ammesso a riceverlo, ma l'assegnazione effettiva avviene dalla policy del ruolo.

### 2. Link contestuale in RuoliPage policy section

Nella sezione Policy documentale del modale dettaglio ruolo, aggiunto un alert compatto con link
a `/anagrafiche/classificazioni` per chi vuole creare un nuovo tag senza uscire dal flusso.

---

## Regola UX implementata (dalla guida operativa)

> Creare un nuovo tag non basta da solo. Dopo la creazione bisogna sempre verificare:
> - quali ruoli sono ammessi (allowed_role_codes nella classificazione)
> - quali ruoli lo hanno effettivamente assegnato nella policy documentale del ruolo

Questa regola è ora esplicitata visivamente in entrambe le pagine coinvolte.

---

## Decisione COORDINATORE (handoff 130 §6)

Non richiede modifiche frontend. La configurazione default (`internal` + `restricted` visibili,
`clinical` non abilitato) è gestita interamente dal backend. L'admin può modificarla dal pannello
policy documentale del ruolo COORDINATORE.
