# UX Handoff 168 — ABAC documenti: matrice chiara, bypass ruoli privilegiati, deny by default

Data: 2026-08-13
Ambito: Admin / Ruoli / Matrice accesso documenti
Priorità: Alta

## Contesto

Il backend ABAC documentale è stato riallineato al comportamento reale.

Finora la UI poteva suggerire che **tutti** i ruoli richiedessero assegnazione attiva al minore per accedere ai documenti. Non è corretto.

Esistono ruoli privilegiati che bypassano l'assegnazione al minore:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

Tutti gli altri ruoli seguono invece la regola:

- classificazione ammessa + permesso RBAC + assegnazione attiva al minore

## Endpoint coinvolti

### 1. Matrice generale

`GET /api/admin/document-access-matrix`

### 2. Policy singolo ruolo

`GET /api/admin/roles/{role}/document-policy`

### 3. Salvataggio policy ruolo

`PUT /api/admin/roles/{role}/document-policy`

## Nuovi campi disponibili

### Matrice generale — `meta`

- `privileged_role_codes: string[]`
- `unknown_classification_policy`
  - `read`
  - `download`
  - `explanation`

### Matrice generale — `classifications[]`

- `allowed_role_count`
- `allowed_download_role_count`

### Matrice generale — `roles[]`

- `role_has_minor_assignment_bypass: boolean`
- `summary.readable_classifications_count`
- `summary.downloadable_classifications_count`
- `summary.minor_assignment_rule`

Valori attesi per `summary.minor_assignment_rule`:

- `bypass_for_privileged_role`
- `active_minor_assignment_required`

### Matrice generale — `roles[].document_access[]`

- `allowed_by_download_classification`
- `role_has_minor_assignment_bypass`
- `assignment_rule`
- `effective_download_access`
- `effective_download_rule`

Valori attesi:

- `assignment_rule`
  - `assignment_not_required_for_privileged_role`
  - `active_minor_assignment_required`
- `effective_read_rule`
  - `allowed_without_minor_assignment`
  - `allowed_if_minor_assignment_active`
  - `denied`
- `effective_download_rule`
  - `allowed_without_minor_assignment`
  - `allowed_if_minor_assignment_active`
  - `denied`

### Policy singolo ruolo — `meta`

- `privileged_role_codes`
- `role_has_minor_assignment_bypass`
- `unknown_classification_policy`

### Policy singolo ruolo — `summary`

- `readable_classifications_count`
- `downloadable_classifications_count`
- `role_has_minor_assignment_bypass`
- `minor_assignment_rule`

### Policy singolo ruolo — `classifications[]`

- `role_has_minor_assignment_bypass`
- `assignment_rule`

## Cosa deve fare UX

### A. Pagina “Matrice accesso documenti”

Mostrare chiaramente tre livelli:

1. **Permesso funzione (RBAC)**
   - leggere documenti
   - scaricare documenti
   - caricare documenti

2. **Policy classificazione (ABAC)**
   - classificazioni leggibili
   - classificazioni scaricabili

3. **Regola assegnazione minore**
   - bypass per ruolo privilegiato
   - assegnazione attiva richiesta

#### UI suggerita

Per ogni riga ruolo:

- badge “Ruolo privilegiato” se `role_has_minor_assignment_bypass = true`
- badge o testo regola assegnazione da `summary.minor_assignment_rule`
- contatori:
  - classificazioni leggibili
  - classificazioni scaricabili

Per ogni cella/riga classificazione:

- stato lettura
- stato download
- regola assegnazione

Non dedurre le regole lato frontend: usare i campi già serializzati dal backend.

### B. Pagina “Ruoli > Policy documentale”

Mostrare in alto:

- se il ruolo è privilegiato oppure no
- se richiede assegnazione attiva al minore oppure no
- contatore classificazioni leggibili/scaricabili

Per ogni classificazione:

- checkbox lettura
- checkbox download
- badge “richiede assegnazione minore” oppure “bypass assegnazione”

### C. Nuova classificazione / tag documento

La UI deve esplicitare che una classificazione nuova è:

- **negata di default in lettura**
- **negata di default in download**

Messaggio suggerito:

> “Le nuove classificazioni restano non accessibili finché non viene configurata la policy ABAC dei ruoli.”

## Regole da non implementare lato frontend

UX **non deve**:

- mantenere una lista hardcoded dei ruoli privilegiati;
- dedurre da sé se serve assegnazione minore;
- inferire il download dalla sola lettura.

UX deve leggere tutto dal payload backend.

## QA minima richiesta

### Caso 1 — `COORDINATORE`

Atteso:

- `role_has_minor_assignment_bypass = true`
- documenti `restricted` consentiti senza assegnazione al minore
- documenti `clinical` negati se non ammessi dalla classificazione

### Caso 2 — `PSICOLOGO`

Atteso:

- nessun bypass
- `clinical` leggibile/scaricabile solo con assegnazione attiva al minore

### Caso 3 — `EDUCATORE`

Atteso:

- lettura `internal` consentita
- download negato se manca `attachments.download`
- assegnazione minore richiesta

### Caso 4 — nuova classificazione

Atteso:

- nessun accesso implicito finché non configurata

## Nota importante

Questa modifica non cambia la UX dei documenti del minore lato operatore finale: chiarisce la semantica della console admin, così configurazione e comportamento reale restano coerenti.
