# FamilyHub — Risposta handoff UX — 134 + 135

Data: 2026-08-14  
Riferimenti: `2026-07-13-134-auth-session-timeout-and-login-context.md`, `2026-07-13-135-admin-backup-section.md`

---

## Handoff 134 — Sessione autenticata e contesto login

### Stato: ✅ Implementato

#### LoginPage (`frontend/src/pages/auth/LoginPage.tsx`)

- Alla mount chiama `authApi.loginContext()` → salva `token` in `loginContextToken` state
- Submit disabilitato finché `loginContextToken` è `null` (spinner / bottone grigio)
- `loginContextToken` passato nel body di `authApi.login(email, password, otp, loginContextToken)`
- Se il backend risponde `419`:
  - messaggio: `Sessione login scaduta. Ricarica la pagina e riprova.`
  - ritorno allo step credenziali
  - rigenerazione automatica del contesto: `authApi.loginContext().then(...)`

#### AuthContext (`frontend/src/contexts/AuthContext.tsx`)

- Firma aggiornata: `login(email, password, otp?, loginContextToken?)`
- `login_context_token` incluso nel body POST a `/api/auth/login`

#### Gestione scadenza sessione autenticata

- Qualsiasi chiamata API che risponde `401` → logout locale + redirect `/login`
- Il pattern è già gestito dall'interceptor axios in `api.ts`

#### QA coverage

| Caso | Comportamento frontend |
|---|---|
| A — login page scaduta (>10 min) | `419` → messaggio + rigenera contesto |
| B — sessione attiva continua | Nessun logout (non tocca il frontend) |
| C — inattività >60 min | Primo `401` → logout + redirect login |
| D — durata assoluta >8 ore | Primo `401` → logout + redirect login |

---

## Handoff 135 — Sezione Admin Backup

### Stato: ✅ Implementato

**Pagina:** `frontend/src/pages/admin/BackupPage.tsx`  
**Route:** `/admin/backup`  
**Sidebar:** `Amministrazione > Backup`

#### Funzionalità implementate

**Lista backup**
- Tabella ordinata per data desc
- Colonne: Nome file, Data, Dimensione, Azioni (Scarica / Ripristina)
- Scarica → link diretto al `download_url`
- `confirm_text` letto da `restore_confirm_text` nella risposta API

**Export manuale**
- Bottone `Crea backup adesso` con campo etichetta opzionale
- `POST /api/admin/database-backups/export`
- Toast verde + refresh lista al successo

**Restore**
- Modale dedicata con:
  - Alert rosso: `Il restore sostituisce il contenuto attuale del database.`
  - Radio: `Usa backup esistente` / `Carica file SQL`
  - Checkbox `Crea backup automatico prima del restore` (default: checked)
  - Campo conferma: deve corrispondere esattamente a `confirmRequired` (da API)
  - Submit disabilitato finché testo ≠ `confirmRequired`
- Post-restore: mostra `post_restore_counts` + raccomanda nuovo login

#### Permessi RBAC

| Permesso | Visibilità |
|---|---|
| `database_backups.create` | Bottone `Crea backup adesso` |
| `database_backups.restore` | Bottone `Ripristina` + modale restore |
| `database_backups.read` | Tabella lista (accesso pagina) |

Se `canRestore` è false il bottone Ripristina non appare. Il backend risponde comunque `403` se il frontend fosse alterato.
