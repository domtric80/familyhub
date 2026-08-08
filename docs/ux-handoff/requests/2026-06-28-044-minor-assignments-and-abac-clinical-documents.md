# Richiesta UX 044 · Assegnazioni minore e ABAC documenti clinici

Data: 2026-06-28
Stato: READY_FOR_UX_IMPLEMENTATION

## 1. Contesto

Il backend supporta ora:

- assegnazioni nominative `utente ↔ minore`
- filtro automatico lista minori per utenti non privilegiati
- enforcement ABAC sui documenti del minore

Questa logica si somma all’RBAC esistente, non lo sostituisce.

## 2. Nuove API disponibili

### A. Lista assegnazioni minore

- `GET /api/admin/minor-assignments`

Filtri:

- `facility_id`
- `minor_id`
- `user_id`
- `assignment_role_code`
- `is_active`

### B. Creazione assegnazione minore

- `POST /api/admin/minor-assignments`

### C. Aggiornamento assegnazione minore

- `PUT /api/admin/minor-assignments/{minor_assignment}`

### D. Revoca assegnazione minore

- `PATCH /api/admin/minor-assignments/{minor_assignment}/revoke`

## 3. Effetti UX già attivi lato backend

### Lista minori

Per utenti non privilegiati:

- la lista mostra solo i minori assegnati

Per ruoli privilegiati:

- la lista continua a mostrare tutti i minori della struttura

### Documenti

Per classificazioni sensibili:

- il ruolo non basta più da solo
- il backend verifica anche l’assegnazione al minore e il livello accesso

## 4. Matrice ABAC lato documenti

Mappatura attuale:

- `public` → `read_basic`
- `restricted` → `read_sensitive`
- `clinical` → `read_clinical`

Quindi un utente può scaricare un documento `clinical` solo se:

1. ha il permesso RBAC documentale
2. il ruolo è ammesso alla classificazione
3. ha assegnazione attiva sul minore
4. la sua assegnazione ha livello `read_clinical`

## 5. Stati UX obbligatori

La UX deve gestire in modo esplicito:

- nessun minore assegnato
- accesso minore negato
- accesso documento clinico negato
- livello accesso insufficiente

## 6. Copy consigliato

### Minore non assegnato

- `Non puoi accedere a questo minore: il tuo profilo non risulta assegnato.`

### Documento clinico non accessibile

- `Accesso negato: il tuo profilo non dispone del livello richiesto per i documenti clinici di questo minore.`

## 7. Dati controllati, non liberi

Nel form assegnazione minore la UX deve usare solo valori controllati per:

- `assignment_role_code`
- `access_level`

Non devono essere campi testuali liberi.

## 8. Checklist UX team

- [ ] creare pagina admin assegnazioni minore
- [ ] mostrare stato assegnazione in scheda minore
- [ ] gestire empty-state utenti assigned-only
- [ ] mostrare messaggi chiari di blocco ABAC su documenti
- [ ] usare select controllate per ruolo assegnazione e livello accesso

## 9. File da verificare

- `C:\Projects\FamilyHUB\docs\architecture\2026-06-28-minor-scoped-access-control.md`
- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 10. Richiesta al team UX

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-28-044-minor-assignments-and-abac-clinical-documents-response.md`
