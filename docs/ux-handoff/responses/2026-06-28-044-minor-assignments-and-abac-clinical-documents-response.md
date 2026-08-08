# Risposta UX 044 · Assegnazioni minore e ABAC documenti clinici

Data: 2026-06-28
Stato: IMPLEMENTATO

## 1. Checklist di risposta

- [x] creare pagina admin assegnazioni minore
- [x] mostrare stato assegnazione in scheda minore
- [x] gestire empty-state utenti assigned-only
- [x] mostrare messaggi chiari di blocco ABAC su documenti
- [x] usare select controllate per ruolo assegnazione e livello accesso

---

## 2. Pagina assegnazioni minore

**File:** `frontend/src/pages/admin/AssegnazioniMinoriPage.tsx`

Implementata CRUD completa su `GET/POST/PUT /api/admin/minor-assignments` + revoca via PATCH.

Struttura:
- Filtri: struttura → minore (filtrato per struttura) → utente (filtrato per assegnazioni struttura attive) → ruolo → solo attive
- Tabella: minore, utente, struttura, ruolo, livello accesso (badge), validità, stato
- Modal crea: tutti i campi da select controllate (no testo libero)
- Modal modifica: struttura/minore/utente bloccati (non modificabili su assegnazione esistente)
- Modal revoca: data fine esplicita

Avviso visivo per livelli `read_clinical` / `edit_sensitive`: "assegna solo a professionisti sanitari abilitati".

Nota: se il backend non ha ancora reso disponibile l'endpoint, la pagina mostra un banner giallo anziché un errore generico.

---

## 3. Tab operatori nella scheda minore

**File:** `frontend/src/pages/minori/MinoreDetailPage.tsx` → `OperatoriTab`

- Chiama `GET /api/admin/minors/{id}/assigned-users`
- Tabella: operatore, ruolo (con label italiana), livello accesso (badge), validità, stato
- Link diretto alla pagina amministrativa per la gestione completa

---

## 4. Empty-state lista minori per utenti non privilegiati

**File:** `frontend/src/pages/minori/MinoriListPage.tsx`

Logica differenziata sull'empty-state:

| Condizione | Messaggio |
|---|---|
| Ricerca attiva, 0 risultati | `Nessun risultato per la ricerca` |
| Utente non privilegiato, 0 minori | `Non risultano minori assegnati al tuo profilo.` |
| Utente privilegiato, 0 minori | `Nessun minore registrato` |

Utenti privilegiati: `super_admin`, `admin`, `direttore`, `coordinatore`.

---

## 5. Messaggi ABAC espliciti

### 5A. Accesso minore negato (403 su GET /minori/:id)

**File:** `frontend/src/pages/minori/MinoreDetailPage.tsx`

Il 403 sul caricamento della scheda minore mostra:

> `Non puoi accedere a questo minore: il tuo profilo non risulta assegnato.`

Corrisponde esattamente al copy raccomandato dal task.

### 5B. Download documento clinico negato (403 su download)

**File:** `frontend/src/pages/minori/MinoreDetailPage.tsx` → `DocumentiTab` → `handleDownload`

Il 403 in download distingue il tipo di documento:

| Classificazione doc | Messaggio 403 |
|---|---|
| `clinical` | `Accesso negato: il tuo profilo non dispone del livello richiesto per i documenti clinici di questo minore.` |
| Altre classificazioni | `Non hai i permessi necessari per accedere a questo documento.` |

La classificazione viene letta da `doc.document_classification.code` nel momento dell'errore.

---

## 6. Select controllate ruolo e livello accesso

Entrambe le pagine (`AssegnazioniMinoriPage`) usano select da enum:

**Ruoli:**
- `PRIMARY_EDUCATOR` → Educatore di riferimento
- `SECONDARY_EDUCATOR` → Educatore secondario
- `PEDIATRICIAN` → Pediatra
- `PSYCHOLOGIST` → Psicologo/a
- `LEGAL_GUARDIAN_CONTACT` → Tutore legale / Referente
- `SOCIAL_WORKER` → Assistente sociale

**Livelli accesso:**
- `read_basic` → Lettura base
- `read_sensitive` → Lettura dati sensibili
- `read_clinical` → Lettura dati clinici
- `edit_operational` → Modifica operativa
- `edit_sensitive` → Modifica dati sensibili

Nessun campo testuale libero per questi valori.

---

## 7. Rotta menu

Voce aggiunta in sidebar `Amministrazione → Assegnazioni minori` → `/admin/assegnazioni-minori`.

La voce non ha guard permission (il backend filtra in base ai ruoli dell'utente autenticato).
