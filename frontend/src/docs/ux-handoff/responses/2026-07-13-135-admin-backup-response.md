# Risposta UX — Handoff 135: Sezione Admin Backup

Data: 2026-07-13  
Stato: implementato

---

## File creati / modificati

| File | Operazione |
|------|-----------|
| `src/types/index.ts` | Aggiunti `DatabaseBackup`, `DatabaseBackupListResponse`, `DatabaseRestoreRequest`, `DatabaseRestoreResponse` (+ fix troncamento: `InternalMessageThread`, tipi Turni/Timesheet mancanti) |
| `src/services/api.ts` | Aggiunto `backupApi` con 5 metodi; completato `adminGeoApi` troncato; aggiunti `shiftTemplatesApi`, `shiftAssignmentsApi`, `attendanceApi`, `timesheetApi` mancanti |
| `src/pages/admin/BackupPage.tsx` | Nuova pagina |
| `src/App.tsx` | Route `/admin/backup` → `BackupPage` |
| `src/layout/sidebar/menuItems.ts` | Voce `Backup` (icon: `project`) sotto `Amministrazione` |

---

## Pagina BackupPage (`/admin/backup`)

### Sezione Export

- Card con campo etichetta opzionale + bottone `Crea backup adesso`
- `POST /admin/database-backups/export`
- Al successo: toast verde + refresh lista
- Visibile solo se `database_backups.create`

### Tabella backup

- Colonne: nome file (monospace), data creazione, dimensione formattata (KB/MB)
- Ordinamento a carico del backend (lista in risposta già desc per data)
- Per riga: `Scarica` (blob download) + `Ripristina` (solo se `database_backups.restore`)

### Download

```ts
backupApi.download(filename)  // GET /admin/database-backups/download?filename=…
// axios responseType: blob → createObjectURL → <a download>
```

### Modal restore

**Warning obbligatorio** in cima: `Il restore sostituisce il contenuto attuale del database.`

**Selezione sorgente** (radio):
- `Usa backup esistente` → `<select>` con lista completa
- `Carica file SQL` → `<input type="file" accept=".sql">`

**Checkbox** `Crea backup automatico prima del restore` — default attiva

**Campo conferma** — placeholder = `restore_confirm_text` dalla risposta lista API:
- Submit disabilitato finché `confirmText !== confirmRequired`
- Campo visually marked valid/invalid in tempo reale

### Post-restore

- Vista sostitutiva nel modal (non chiude automaticamente)
- Alert verde con esito
- Alert info con filename del backup pre-restore (se creato)
- Tabella `post_restore_counts` con conteggi
- Alert warning: suggerimento reload + nuovo login

---

## Permessi applicati

| Permesso | Elemento controllato |
|----------|---------------------|
| `database_backups.create` | Intera card Export |
| `database_backups.restore` | Bottone Ripristina per riga |

Nessun gating lato pagina: visibilità menu + 403 backend sono la protezione reale.

---

## Errori gestiti

| Status | Comportamento |
|--------|--------------|
| 404 (lista vuota) | Messaggio "Nessun backup disponibile" |
| 422 (testo conferma errato) | Toast specifico: "Testo di conferma non corretto" |
| Altri | Toast generico con messaggio backend |
