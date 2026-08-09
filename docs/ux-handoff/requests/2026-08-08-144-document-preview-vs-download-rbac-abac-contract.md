## Handoff UX/API - Separazione preview vs download documenti

Data: 2026-08-08  
Area: `Documenti minore`, `Documenti staff`, `Ruoli`, `Matrice accesso documentale`  
Priorita: alta  
Tipo: security hardening + riallineamento UX

### 1. Obiettivo

Da ora in poi **vedere un documento** e **scaricare un documento** sono due azioni diverse.

- `preview/read` = apertura inline, senza download esplicito
- `download` = scarico file sul device utente

Il backend non considera piu le due azioni equivalenti.

---

### 2. Regola funzionale

Per poter fare `download` servono **entrambe** queste condizioni:

1. permesso RBAC `attachments.download`
2. regola ABAC della classificazione documentale compatibile con azione `download`

Per poter fare `preview` servono:

1. permesso RBAC `attachments.read`
2. regola ABAC della classificazione documentale compatibile con azione `read`

Conseguenza importante:

- un utente puo **aprire in preview** un documento
- ma **non poterlo scaricare**

Questo comportamento e voluto.

---

### 3. Endpoint da usare

#### Documenti minore

- `GET /api/minors/{minor}/documents/{document}/preview`
  - usa regola `read`
  - richiede `attachments.read`

- `GET /api/minors/{minor}/documents/{document}/download`
  - usa regola `download`
  - richiede `attachments.download`

#### Documenti staff

- `GET /api/admin/staff-members/{staff_member}/documents/{document}/preview`
  - usa regola `read`
  - richiede `attachments.read`

- `GET /api/admin/staff-members/{staff_member}/documents/{document}/download`
  - usa regola `download`
  - richiede `attachments.download`

---

### 4. Impatto UX obbligatorio

#### Viewer / modal documento

La preview deve chiamare **solo** gli endpoint `/preview`.

Il pulsante `Scarica` deve essere mostrato solo se:

- l'utente ha il permesso `attachments.download`
- e il backend non restituisce `403`

Se il backend risponde `403` sul download:

- non mostrare errore generico
- mostrare messaggio chiaro tipo:
  - `Download non consentito per il tuo ruolo o per la classificazione del documento.`

#### Liste documenti

In tutte le liste documentali:

- azione `Apri / Preview` separata da `Scarica`
- non usare piu l'endpoint download come fallback per la preview

---

### 5. Matrice documentale admin

Le pagine admin documentali devono mostrare due concetti distinti:

- **Lettura effettiva**
- **Download effettivo**

La UI ruolo/policy non deve piu mostrare un solo booleano di accesso.

Serve doppia lettura:

- accesso preview/read
- accesso download

---

### 6. Contratto payload admin gia disponibile

Il backend ora espone nei payload admin anche i campi download-specifici:

#### `GET /api/admin/document-access-matrix`

Per ruolo/classificazione:

- `allowed_by_download_classification`
- `effective_download_access`
- `effective_download_rule`
- `rbac.attachments_download`

Meta:

- `meta.document_rbac_permissions.download = "attachments.download"`

#### `GET /api/admin/roles/{role}/document-policy`

Disponibili:

- `rbac.attachments_download`
- `classifications[].download_assigned_to_role`
- `classifications[].effective_download_access`
- `summary.can_download_any_documents`

---

### 7. Default funzionali attesi

Default attuali lato backend:

- `EDUCATORE` puo fare preview di documenti `internal` se ABAC lo consente
- `EDUCATORE` **non** puo scaricare documenti
- `PSICOLOGO` puo scaricare documenti clinici
- `PEDIATRA` puo scaricare documenti clinici
- `COORDINATORE` e `REFERENTE_STRUTTURA` possono scaricare dove la classificazione lo consente

---

### 8. QA da fare lato frontend

Verificare questi scenari:

1. educatore apre un documento `internal` in preview -> OK
2. educatore prova a scaricare lo stesso documento -> 403 con messaggio chiaro
3. psicologo scarica documento `clinical` -> OK
4. preview e download usano endpoint diversi
5. matrice ruoli mostra differenza tra lettura e download

---

### 9. Nota sicurezza

Il requisito nasce da una scelta precisa:

- il file puo essere consultabile in applicazione
- ma non necessariamente esportabile sul device client

Questa e la base per ridurre esfiltrazione dati lato endpoint documentali.
