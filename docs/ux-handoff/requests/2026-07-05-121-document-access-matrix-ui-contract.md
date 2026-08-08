# Handoff UX/API — Matrice accesso documentale RBAC + ABAC

Data: 2026-07-05  
Area: `Ruoli`, `Documenti`, `Amministrazione`  
Priorità: alta  
Tipo: nuova vista amministrativa / informativa

## 1. Obiettivo

Rendere finalmente leggibile all’amministratore **chi può accedere a quali documenti** senza dover interpretare policy backend o codice.

Questa vista **non modifica** la policy.  
Mostra il **risultato leggibile** del modello corrente.

## 2. Endpoint backend disponibile

- `GET /api/admin/document-access-matrix`

Permesso richiesto:

- `roles.read`

## 3. Modello da spiegare in UI

La pagina deve chiarire in modo esplicito:

- `RBAC` = permessi funzionali generali documentali (`attachments.read`, `attachments.upload`)
- `ABAC` = accesso effettivo alle classificazioni documento
- per i documenti del minore serve anche:
  - assegnazione attiva al minore

Quindi:

`Accesso documento = permesso RBAC documentale + ruolo ammesso dalla classificazione + assegnazione minore attiva`

## 4. Struttura response

### `meta`

Contiene:

- `model`
- `summary`
- `minor_assignment_required_for_sensitive_minor_documents`
- `document_rbac_permissions.read`
- `document_rbac_permissions.upload`

### `classifications[]`

Per ogni classificazione:

- `id`
- `code`
- `name`
- `description`
- `is_active`
- `allowed_role_codes[]`
- `assignment_required_for_minor_documents`

### `roles[]`

Per ogni ruolo:

- `id`
- `code`
- `name`
- `description`
- `is_system`
- `rbac.attachments_read`
- `rbac.attachments_upload`
- `document_access[]`

### `roles[].document_access[]`

Per ogni classificazione su ogni ruolo:

- `classification_code`
- `classification_name`
- `classification_active`
- `allowed_by_classification`
- `requires_minor_assignment`
- `effective_read_access`
- `effective_read_rule`
- `notes`

## 5. UI consigliata

### 5.1 Pagina dedicata o tab in `Ruoli`

Consigliato:

- nuova sezione/tab: `Accesso documentale`

Layout minimo:

1. box introduttivo con differenza RBAC / ABAC
2. tabella per ruolo
3. dettaglio espandibile per classificazione

### 5.2 Tabella ruoli

Colonne consigliate:

- `Ruolo`
- `Permesso documenti`
- `Upload documenti`
- `Classificazioni leggibili`
- `Note`

Esempi:

- `Permesso documenti` → badge `Sì / No` basato su `rbac.attachments_read`
- `Upload documenti` → badge `Sì / No` basato su `rbac.attachments_upload`
- `Classificazioni leggibili` → elenco sintetico delle sole voci con `effective_read_access = true`

### 5.3 Drawer o riga espansa per ruolo

Per ogni ruolo mostrare tutte le classificazioni:

- `Internal`
- `Restricted`
- `Clinical`
- `Judicial`

Per ciascuna:

- consentito / non consentito
- se richiede assegnazione al minore
- nota backend (`notes`)

## 6. Messaggi da usare

### Caso consentito

- `Consentito se l’utente è assegnato attivamente al minore.`

### Caso negato per classificazione

- `Il ruolo non è ammesso dalla classificazione documentale.`

### Caso negato per RBAC

- `Il ruolo non dispone del permesso documentale di base (attachments.read).`

## 7. Regola importante per UX

Non rappresentare questa matrice come semplice schermata “permessi ruolo”.

È una vista **ibrida esplicativa**:

- una parte viene da RBAC
- una parte viene dalla policy ABAC documentale

## 8. Uso pratico per nuovi ruoli

Questa pagina serve anche a chiarire il comportamento dei ruoli nuovi:

- se un ruolo nuovo ha `attachments.read` ma non è incluso in `allowed_role_codes` di una classificazione, non leggerà quella classificazione
- quindi il ruolo può vedere il modulo documenti ma non tutti i documenti

Questo punto deve essere visibile in UI in modo chiaro.
