# Risposta UX — Handoff 139: Storage Configuration e Health Servizi

Data: 2026-08-08  
Stato: implementato (UI predisposta — in attesa contratto API backend v1.1.x)

---

## File creati / modificati

| File | Operazione |
|------|-----------|
| `src/pages/admin/SistemaStoragePage.tsx` | Nuova pagina |
| `src/pages/admin/SistemaHealthPage.tsx` | Nuova pagina |
| `src/App.tsx` | Route `/admin/sistema/storage` e `/admin/sistema/health` |
| `src/layout/sidebar/menuItems.ts` | Voci `Storage` e `Health servizi` sotto `Amministrazione` |

---

## Pagina 1 — Configurazione Storage (`/admin/sistema/storage`)

### Tabella configurazioni

Colonne implementate:
- Nome (+ codice in monospace)
- Provider (MinIO / AWS S3 / S3 Compatibile)
- Bucket
- Endpoint
- Path style (✓ / —)
- Attivo (badge verde/grigio)
- Default (stella arancione)
- Sorgente (badge ENV / DB)
- Ultimo test (timestamp)
- Esito test (badge OK / Errore / —)
- Azioni

### Azioni per riga

- **Modifica** — solo per sorgente `DB` (le configurazioni `ENV` sono read-only)
- **Testa connessione** — disponibile per tutte
- **Imposta come default** — visibile se non già default e attiva
- **Disattiva** — solo per sorgente `DB`

### Form add/edit (modal)

Campi implementati:
- Nome, Codice
- Provider (select: MinIO / AWS S3 / S3 Compatibile)
- Bucket, Regione, Endpoint
- Access Key, Secret Key
- Prefisso path (opzionale)
- Path style (checkbox)
- Attivo, Default (checkbox)

### Sicurezza secret

- Secret key visualizzata con `type="password"` e toggle occhio
- In modalità modifica: campo vuoto con placeholder `••••••••` — il segreto precedente **non viene mai riletto**
- FormText esplicita: "Il segreto precedente non viene mai mostrato in chiaro"
- Warning se si modifica la configurazione attiva

### Banner informativo

- Configurazioni `ENV`: banner che spiega la sorgente runtime
- Configurazioni `DB`: banner che spiega l'amministrazione da pannello

---

## Pagina 2 — Health Servizi (`/admin/sistema/health`)

### Servizi monitorati

| ID | Nome |
|----|------|
| `api` | API backend |
| `postgres` | PostgreSQL |
| `redis` | Redis |
| `queue` | Queue worker |
| `scheduler` | Scheduler |
| `storage` | Storage documentale attivo |
| `clamav` | Antivirus ClamAV |
| `smtp` | SMTP |
| `minio` | MinIO console |

### Per ogni servizio

- Pallino colorato con label (verde / giallo / rosso / grigio)
- Timestamp ultimo check
- Latenza in ms
- Messaggio sintetico
- Dettaglio espandibile (click sulla riga) — mai espone password, token o chiavi

### Azioni

- Pulsante **Esegui check** con stato loading
- Timestamp ultimo aggiornamento

### Stati

| Pallino | Significato |
|---------|-------------|
| 🟢 Verde | Operativo |
| 🟡 Giallo | Degradato |
| 🔴 Rosso | Non disponibile |
| ⚪ Grigio | Sconosciuto (stato iniziale / check non ancora eseguito) |

---

## Stato API

Le pagine sono predisposte con UI completa ma tutte le azioni mostrano il messaggio:
> "In attesa di contratto API backend (v1.1.x)"

Quando il backend rilascerà gli endpoint, basterà sostituire le chiamate mock con le chiamate reali in `api.ts`. Il commento `// sostituire con chiamata API reale` è già presente nel codice.

---

## Build

`npm run build` — **✓ built in 4.67s**, nessun errore TypeScript o Vite.

---

## Variabili VITE_* nuove

Nessuna. Le pagine non introducono nuove variabili d'ambiente.
