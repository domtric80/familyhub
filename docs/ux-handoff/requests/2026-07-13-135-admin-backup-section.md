# Handoff UX/API 135 — Sezione Admin `Backup`

## Obiettivo

Aggiungere in area amministrativa una sezione dedicata a:

- export manuale del database
- elenco backup SQL disponibili
- download singolo backup
- import / restore database con conferma forte

La UI non deve eseguire restore “silenziosi”: l’azione è distruttiva sul contenuto corrente del DB e va sempre trattata come operazione eccezionale.

---

## Menu

Nuova voce admin:

- `Amministrazione > Backup`

---

## Endpoint disponibili

### 1. Lista backup

`GET /api/admin/database-backups`

Risposta:

```json
{
  "items": [
    {
      "filename": "familyhub-20260713-101500.sql",
      "path": "/var/www/.../backups/db/familyhub-20260713-101500.sql",
      "size_bytes": 123456,
      "created_at": "2026-07-13T10:15:00Z",
      "download_url": "/api/admin/database-backups/download?filename=familyhub-20260713-101500.sql"
    }
  ],
  "restore_confirm_text": "RIPRISTINA DATABASE"
}
```

Uso UI:

- tabella backup ordinata per data desc
- colonne:
  - nome file
  - data creazione
  - dimensione
  - azioni

Azioni per riga:

- `Scarica`
- `Ripristina da questo backup`

---

### 2. Export manuale

`POST /api/admin/database-backups/export`

Body opzionale:

```json
{
  "label": "manual-export"
}
```

Risposta `201`:

```json
{
  "filename": "familyhub-20260713-101600-manual-export.sql",
  "path": "/var/www/.../backups/db/familyhub-20260713-101600-manual-export.sql",
  "size_bytes": 234567,
  "created_at": "2026-07-13T10:16:00Z",
  "download_url": "/api/admin/database-backups/download?filename=familyhub-20260713-101600-manual-export.sql"
}
```

Uso UI:

- bottone principale `Crea backup adesso`
- al successo:
  - toast verde
  - refresh lista

---

### 3. Download backup

`GET /api/admin/database-backups/download?filename=...`

Uso UI:

- semplice download browser

---

### 4. Import / Restore database

`POST /api/admin/database-backups/restore`

Due modalità:

#### A. Restore da backup già presente

```json
{
  "backup_filename": "familyhub-20260713-101500.sql",
  "confirm_text": "RIPRISTINA DATABASE",
  "create_pre_restore_backup": true
}
```

#### B. Restore da file SQL caricato

`multipart/form-data`

Campi:

- `sql_file`
- `confirm_text`
- `create_pre_restore_backup`

Risposta:

```json
{
  "restored": true,
  "source": {
    "filename": "familyhub-20260713-101500.sql",
    "uploaded": false
  },
  "pre_restore_backup": {
    "filename": "familyhub-20260713-101700-pre-restore.sql",
    "path": "/var/www/.../backups/db/familyhub-20260713-101700-pre-restore.sql",
    "size_bytes": 345678,
    "created_at": "2026-07-13T10:17:00Z",
    "download_url": "/api/admin/database-backups/download?filename=familyhub-20260713-101700-pre-restore.sql"
  },
  "post_restore_counts": {
    "users": 12,
    "organizations": 1,
    "facilities": 2,
    "minors": 31,
    "attachments": 148
  }
}
```

---

## Regole UX obbligatorie

### Export

- bottone alto `Crea backup adesso`
- opzionale campo etichetta
- nessun modal di conferma necessario

### Restore

Mostrare sempre modal dedicata con:

- warning rosso alto: `Il restore sostituisce il contenuto attuale del database.`
- radio o tab:
  - `Usa backup esistente`
  - `Carica file SQL`
- checkbox default attiva:
  - `Crea backup automatico prima del restore`
- campo testuale obbligatorio:
  - label: `Scrivi "RIPRISTINA DATABASE" per confermare`
- submit disabilitato finché il testo non coincide esattamente

### Post restore

Al successo:

- messaggio forte di conferma
- mostrare riepilogo `post_restore_counts`
- proporre refresh applicazione / nuovo login se necessario

---

## Permessi backend

### Possono vedere lista / scaricare

- `database_backups.read`

### Possono creare export

- `database_backups.create`

### Possono eseguire restore

- `database_backups.restore`

Permessi assegnati lato backend:

- `SUPER_ADMIN`: read/create/restore
- `ADMIN_IT`: read/create/restore
- `DIRETTORE`: read/create/restore
- `COORDINATORE`: read/create
- `REFERENTE_STRUTTURA`: read/create

Quindi:

- `COORDINATORE` e `REFERENTE_STRUTTURA` **non devono vedere** il bottone restore
- se il frontend decide di mostrarlo per errore, il backend risponderà comunque `403`

---

## QA minimo richiesto

### Caso A — lista

- aprire pagina backup
- caricare lista
- verificare `restore_confirm_text`

### Caso B — export

- clic `Crea backup adesso`
- verificare nuovo record in tabella

### Caso C — restore senza conferma

- inviare modal con testo errato
- atteso `422`

### Caso D — restore da backup esistente

- selezionare file da lista
- digitare conferma esatta
- atteso `200`
- mostrare conteggi finali

### Caso E — restore da file SQL

- caricare file `.sql`
- digitare conferma esatta
- atteso `200`

