# Handoff UX/API - Sblocco gestione ABAC documenti da pannello admin

Data: 2026-07-06  
Area: `Ruoli`, `Accesso documentale`, `Classificazioni documento`, `Policy documentale ruolo`  
Priorita: altissima  
Tipo: fix backend + abilitazione funzionale UI

## 1. Problema precedente

La gestione ABAC documentale esisteva lato backend, ma non era realmente governabile bene dal pannello:

- la matrice accesso documentale dipendeva da permessi generici come `roles.read`
- la modifica policy ruolo dipendeva da `document_types.update`
- la creazione di nuovi tag/classificazioni dipendeva da `document_types.create`

Questo creava due problemi:

1. permessi troppo indiretti e poco chiari
2. impossibilita pratica di governare bene i nuovi tag documentali da UI

## 2. Stato nuovo

Sono stati introdotti permessi dedicati:

- `document_access_matrix.read`
- `document_classifications.create`
- `document_classifications.read`
- `document_classifications.update`
- `document_classifications.delete`
- `role_document_policies.read`
- `role_document_policies.update`

## 3. Ruoli abilitati

Attualmente sono abilitati a governare il modello ABAC documentale:

- `SUPER_ADMIN`
- `ADMIN_IT`
- `DIRETTORE`
- `COORDINATORE`
- `REFERENTE_STRUTTURA`

Nota:

- `COORDINATORE` e `REFERENTE_STRUTTURA` possono leggere la matrice, creare nuovi tag documentali e aggiornare la policy documentale dei ruoli

## 4. Endpoint da usare in UI

### Matrice complessiva

- `GET /api/admin/document-access-matrix`

Uso:

- tabella globale classificazioni x ruoli
- spiegazione effettiva del modello RBAC + ABAC

### Elenco classificazioni documento

- `GET /api/admin/document-classifications`

Uso:

- elenco tag/classificazioni esistenti
- popolare gestione CRUD dei tag documentali

### Crea nuova classificazione/tag

- `POST /api/admin/document-classifications`

Payload esempio:

```json
{
  "code": "school_sensitive",
  "name": "Scolastico sensibile",
  "description": "Documenti scolastici con sensibilita elevata ma non clinica.",
  "allowed_role_codes": ["SUPER_ADMIN", "DIRETTORE", "COORDINATORE"],
  "is_active": true
}
```

### Modifica classificazione/tag

- `PUT /api/admin/document-classifications/{document_classification}`

Uso:

- cambiare nome, descrizione, attivazione
- modificare i ruoli di default ammessi al tag

### Leggere policy di un ruolo

- `GET /api/admin/roles/{role}/document-policy`

Uso:

- pannello dettaglio ruolo
- checkbox o matrice delle classificazioni assegnate al ruolo

### Aggiornare policy di un ruolo

- `PUT /api/admin/roles/{role}/document-policy`

Payload esempio:

```json
{
  "classification_codes": ["internal", "restricted", "clinical"]
}
```

Uso:

- aggiungere o rimuovere classificazioni visibili per un ruolo

## 5. Regola UX da rendere chiarissima

Ci sono due livelli diversi:

### Livello A - classifica/tag documentale

La classificazione definisce:

- il nome del tag
- i ruoli ammessi per default

### Livello B - policy del ruolo

La policy del ruolo definisce:

- quali classificazioni sono effettivamente assegnate a quel ruolo

Quindi:

- se nasce un nuovo tag documentale, prima si crea la classificazione
- poi si assegna il tag ai ruoli che devono poterlo leggere

## 6. Decisione sul Coordinatore

Default approvato:

- `COORDINATORE` vede `internal`
- `COORDINATORE` vede `restricted`
- `COORDINATORE` non vede `clinical` di default
- `clinical` puo essere abilitato da pannello policy ruolo

## 7. Cosa deve fare UX adesso

- esporre davvero la pagina gestione classificazioni documento
- esporre davvero l'editor policy documentale del ruolo
- distinguere visivamente:
  - tag/classificazione
  - ruolo
  - accesso effettivo
- mostrare un box guida che spieghi:
  - "se aggiungi un nuovo tag, devi poi assegnarlo ai ruoli dalla policy documentale"

## 8. Verifica backend completata

Copertura test aggiunta:

- `tests/Feature/CoordinatorDocumentPolicyAdminApiTest.php`

Il test verifica che `COORDINATORE` possa:

- leggere la matrice accesso documentale
- aggiornare la policy documentale di un ruolo
- creare un nuovo tag/classificazione documento
