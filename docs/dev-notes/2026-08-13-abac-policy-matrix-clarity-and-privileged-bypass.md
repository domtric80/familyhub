# ABAC documenti — chiarezza matrice policy e bypass ruoli privilegiati

Data: 2026-08-13
Ambito: Backend API / Contratto UX

## Obiettivo

Allineare il contratto API ABAC documentale al comportamento reale del backend, evitando discrepanze tra:

- matrice ruoli/classificazioni mostrata in UI;
- regole effettive applicate da `MinorAccessService`;
- interpretazione operativa del team UX.

## Problema corretto

Prima di questa correzione gli endpoint:

- `GET /api/admin/document-access-matrix`
- `GET /api/admin/roles/{role}/document-policy`

esponevano sempre `requires_minor_assignment = true`.

Questo era tecnicamente fuorviante, perché alcuni ruoli privilegiati hanno bypass dell'assegnazione al minore tramite configurazione backend:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

Di conseguenza la UI poteva far pensare che anche questi ruoli dovessero essere assegnati esplicitamente al minore per leggere documenti consentiti, mentre il backend applica già una regola diversa.

## Regola reale

### 1. RBAC

RBAC abilita la funzione tecnica:

- `attachments.read`
- `attachments.download`
- `attachments.upload`

Se il ruolo non possiede il permesso RBAC, ABAC non può concedere l'operazione.

### 2. ABAC classificazione

ABAC decide se il ruolo può leggere o scaricare una specifica classificazione documentale:

- `allowed_role_codes` => lettura/preview
- `allowed_download_role_codes` => download

### 3. Regola assegnazione al minore

- Ruoli privilegiati (`SUPER_ADMIN`, `DIRETTORE`, `COORDINATORE`) **non richiedono** assegnazione esplicita al minore.
- Tutti gli altri ruoli **richiedono assegnazione attiva** al minore per documenti del minore.

## Nuovi campi API introdotti

### `GET /api/admin/document-access-matrix`

#### `meta`

- `privileged_role_codes: string[]`
- `unknown_classification_policy`
  - `read = deny`
  - `download = deny`
  - `explanation`

#### `classifications[]`

- `allowed_role_count`
- `allowed_download_role_count`

#### `roles[]`

- `role_has_minor_assignment_bypass: boolean`
- `summary`
  - `readable_classifications_count`
  - `downloadable_classifications_count`
  - `minor_assignment_rule`

#### `roles[].document_access[]`

- `allowed_by_download_classification`
- `role_has_minor_assignment_bypass`
- `assignment_rule`
  - `active_minor_assignment_required`
  - `assignment_not_required_for_privileged_role`
- `effective_download_access`
- `effective_download_rule`
  - `allowed_if_minor_assignment_active`
  - `allowed_without_minor_assignment`
  - `denied`

### `GET /api/admin/roles/{role}/document-policy`

#### `meta`

- `privileged_role_codes`
- `role_has_minor_assignment_bypass`
- `unknown_classification_policy`

#### `summary`

- `readable_classifications_count`
- `downloadable_classifications_count`
- `role_has_minor_assignment_bypass`
- `minor_assignment_rule`

#### `classifications[]`

- `role_has_minor_assignment_bypass`
- `assignment_rule`

## Policy di default per nuovi tag/classificazioni

Per evitare aperture involontarie:

- una nuova classificazione senza ruoli associati è considerata **negata di default**;
- questo vale sia per preview/lettura sia per download.

Nota importante: il backend continua a usare le liste esplicite di ruoli configurate sulla classificazione. UX deve presentare questa policy come “deny by default finché non configurata”.

## Test aggiunti/aggiornati

- `DocumentAccessMatrixApiTest`
- `RoleDocumentPolicyApiTest`
- `CoordinatorDocumentPolicyAdminApiTest`

Copertura verificata su:

- distinzione ruoli privilegiati vs ruoli assegnati;
- regole preview/download separate;
- regola di default sui nuovi tag;
- coerenza del payload per il ruolo `COORDINATORE`.

## Impatto

Nessuna migrazione dati.

Impatto limitato a:

- serializzazione API admin ABAC;
- documentazione OpenAPI;
- tipizzazioni frontend.
