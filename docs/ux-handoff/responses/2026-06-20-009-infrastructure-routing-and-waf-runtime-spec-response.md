# Risposta UX Handoff · Request 2026-06-20-009

- `Request ID`: 2026-06-20-009
- `Data risposta`: 2026-06-20
- `Stato`: RECEPITA

---

## 1. Comprensione del routing

**CONFERMATA.**

Il frontend usa esclusivamente `/api/...` per tutte le chiamate al backend Laravel. Il file `src/services/api.ts` configura axios con:

```ts
baseURL: '/api'
```

Non esistono riferimenti a `app:8000`, `frontend:5173` o indirizzi Docker interni nel codice frontend. Tutte le richieste HTTP partono dal dominio pubblico applicativo (`http://localhost:8100` in locale) e vengono instradata da NGINX.

---

## 2. Comprensione dei flussi documentali

**CONFERMATA.**

Il frontend tratta il ciclo di vita dei documenti correttamente:

- **Upload**: invia `POST /api/minors/{id}/documents` — non accede direttamente a MinIO
- **Stato post-upload**: il documento viene mostrato come `pending` immediatamente dopo l'upload
- **Download**: usa `GET /api/minors/{id}/documents/{document}/download` — l'API backend gestisce il recupero da MinIO
- **Blocco 423**: se il backend risponde con `HTTP 423`, il frontend mostra un messaggio dedicato "Il documento è in verifica sicurezza o non rilasciabile" — il pulsante download non viene attivato
- **Download condizionato**: il pulsante download è attivo solo se `attachment.security_status === 'clean'`

Il frontend **non** tenta mai di costruire URL diretti verso MinIO o object storage.

---

## 3. Comprensione del ruolo di NGINX

**CONFERMATA.**

Il frontend non conosce e non deve conoscere la topologia interna Docker. Dal punto di vista del frontend:

- `/` → SPA React (servita da NGINX → Vite dev server in locale, build statica in produzione)
- `/api/...` → API Laravel (servita da NGINX → `app:8000`)

Questo routing è trasparente per il codice frontend. Non occorre nessuna configurazione aggiuntiva nel codice React per adattarsi a questo layer.

---

## 4. Comprensione del ruolo del WAF

**CONFERMATA.**

Il WAF (SafeLine) si posiziona davanti a NGINX ed è trasparente per il frontend. Il codice React non deve:

- rilevare la presenza del WAF
- modificare header per bypassarlo
- gestire risposte WAF specifiche (queste vengono gestite a livello di errore HTTP generico)

Il frontend gestisce già `401`, `403`, `422`, `423` come errori applicativi. Eventuali blocchi WAF si manifesterebbero come `403` o `429` e verranno trattati dal gestore errori globale (axios interceptor).

---

## 5. Implicazioni operative per il frontend

### 5.1 Base URL API

Verificato: `axios.defaults.baseURL = '/api'` — corretto per tutti gli ambienti (locale e produzione).

### 5.2 Documenti in quarantena

Il frontend gestisce `security_status` nei badge e nelle condizioni di abilitazione del download. Il messaggio per `423` è presente nella tab Documenti di `MinoreDetailPage`.

### 5.3 Assenza di endpoint interni hardcoded

Verificato: nessun URL Docker interno (`app:8000`, `frontend:5173`, `minio:9000`) presente nel codice frontend.

### 5.4 Worker e pipeline asincrona

Il frontend non assume che un documento caricato sia immediatamente disponibile per il download. La UI riflette lo stato `pending` e informa l'utente che il file è in verifica.

---

## 6. Nota infrastrutturale locale — deploy dipendenze

**ATTENZIONE per il team di sviluppo:**

Il container Docker `frontend` usa un volume separato per `node_modules`:

```yaml
volumes:
  - ./frontend:/workspace/frontend
  - frontend_node_modules:/workspace/frontend/node_modules
```

Le dipendenze aggiunte al `package.json` (reactstrap, react-hook-form, react-toastify) non vengono installate automaticamente nel container in esecuzione. Richiedono:

```bash
docker compose restart frontend
```

oppure, senza riavvio:

```bash
docker compose exec frontend npm install
```

Senza questo step, Vite non risolve gli import da `reactstrap` e le pagine admin/anagrafiche mostrano errori di runtime invece del contenuto.
