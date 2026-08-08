# Risposta UX Handoff 041 · Assegnazioni per-minore e accesso dati sensibili

Data: 2026-06-28
Stato: ALLINEAMENTO RICEVUTO — piano UX definito, implementazione frontend in attesa API

---

## 1. Separazione concettuale confermata

Il team UX recepisce e applica la distinzione tassativa:

| Tipo | Tabella backend | Cosa governa |
|---|---|---|
| **Assegnazioni struttura** | `user_facility_roles` | Accesso al software, ruolo RBAC nella struttura |
| **Assegnazioni minore** | `minor_user_assignments` (nuova) | Perimetro operativo su minori specifici |

Da questo momento i due concetti vengono trattati come **domini separati** in tutta la UX: navigazione, nomenclatura, schermate, messaggi di errore.

---

## 2. Dove compare la gestione assegnazioni minore

### 2.1 Menu amministrativo dedicato

Verrà aggiunta una voce separata nella sezione Amministrazione:

```
Amministrazione
  ├── Organizzazioni
  ├── Strutture
  ├── Utenti
  ├── Assegnazioni struttura   ← voce esistente (rinominata per chiarezza)
  └── Assegnazioni minori      ← NUOVA voce
```

### 2.2 Tab nella scheda minore

In `MinoreDetailPage` verrà aggiunto un tab **"Operatori assegnati"** con:
- lista utenti assegnati al minore (ruolo sul minore, livello accesso, validità, stato)
- pulsante Aggiungi assegnazione
- azioni Modifica / Revoca per ogni riga

### 2.3 Sezione nella pagina utente

In `UtentiPage` (o futura scheda utente dedicata) verrà aggiunta una sezione **"Minori assegnati"**:
- lista minori con struttura, ruolo sul minore, livello accesso, stato

---

## 3. Pagina amministrativa Assegnazioni Minori

### Colonne tabella

| Colonna | Note |
|---|---|
| Struttura | filtro principale |
| Minore | filtro, minore filtrato per struttura |
| Utente assegnato | filtro, utente filtrato per struttura |
| Ruolo assegnazione | da anagrafica controllata, no testo libero |
| Livello accesso | da enum: `read_basic`, `read_sensitive`, `read_clinical`, `edit_operational`, `edit_sensitive` |
| Valido dal / al | date |
| Attivo | badge |
| Assegnato da | utente che ha creato l'assegnazione |
| Azioni | Modifica · Revoca |

### Filtri obbligatori

- Struttura
- Minore (dipendente dalla struttura)
- Utente (dipendente dalla struttura)
- Ruolo assegnazione
- Solo attivi (default: sì)

### Form creazione / modifica

- Struttura → Minore (filtrato) → Utente (filtrato per struttura)
- Ruolo assegnazione minore: select da anagrafica (`PRIMARY_EDUCATOR`, `SECONDARY_EDUCATOR`, `PEDIATRICIAN`, `PSYCHOLOGIST`, `LEGAL_GUARDIAN_CONTACT`, `SOCIAL_WORKER`) — **no testo libero**
- Livello accesso: select da enum — **no testo libero**
- Valid from / valid to
- Attivo (checkbox)
- Note (textarea opzionale)

---

## 4. Gestione blocco accesso documenti sensibili

Per documenti con classificazione `restricted` o `clinical`, quando manca l'assegnazione al minore:

- il pulsante di download **non viene mostrato** (non disabilitato — non visibile)
- al suo posto compare un badge: `🔒 Accesso ristretto`
- tooltip / messaggio espanso: *"Documento clinico — accesso riservato agli operatori assegnati a questo minore"*
- nessuna reveal parziale del contenuto

Questo si distingue dall'errore 403 generico (permesso RBAC mancante) con messaggi distinti:

| Caso | Messaggio |
|---|---|
| Ruolo RBAC insufficiente | "Permessi insufficienti per visualizzare questo documento" |
| Assegnazione al minore mancante | "Documento clinico: non sei assegnato a questo minore" |
| Assegnazione scaduta | "Documento clinico: la tua assegnazione a questo minore è scaduta" |

---

## 5. Lista minori — modalità `assigned_only`

La lista minori gestirà due comportamenti distinti in base alla policy del ruolo:

### `minor_scope_mode = all_facility`

- lista completa dei minori della struttura
- nessun filtro aggiuntivo

### `minor_scope_mode = assigned_only`

- lista limitata ai minori con assegnazione attiva per l'utente corrente
- badge visibile: **"Stai vedendo solo i minori assegnati al tuo profilo"**
- filtro rapido opzionale: `Solo i miei minori` (per ruoli con accesso globale che vogliono filtrare per comodità)

Il frontend leggerà questa modalità dalle `capabilities` dell'utente (già disponibili in `AuthContext`) — campo proposto: `capabilities.minor_scope_mode`.

---

## 6. Stati da gestire nella UX

| Stato | Dove | Messaggio |
|---|---|---|
| Nessun minore assegnato | Lista minori (utente `assigned_only`) | "Nessun minore è attualmente assegnato al tuo profilo. Contatta l'amministratore." |
| Nessun utente assegnabile | Form assegnazione minore | "Nessun utente con ruolo compatibile trovato per questa struttura." |
| Permesso RBAC insufficiente | Qualsiasi area protetta | "Permessi insufficienti" (comportamento già implementato) |
| Utente non autorizzato a vedere il minore | Accesso diretto via URL | Redirect con messaggio: "Non hai accesso a questo minore" |
| Documento clinico non accessibile | Tab documenti minore | Badge 🔒 + messaggio (vedi §4) |

---

## 7. Stato implementazione frontend

### Già fatto

- Separazione visiva delle due sezioni nella sidebar (voce "Assegnazioni" esistente = assegnazioni struttura)
- Gestione permessi RBAC via `capabilities` (già implementata)
- Gestione errori 403 esplicita in tutte le pagine

### In attesa di API backend

Le seguenti funzionalità sono **progettate ma non implementabili** finché i seguenti endpoint non sono disponibili:

| Funzionalità | Endpoint richiesto |
|---|---|
| Pagina Assegnazioni Minori | `GET /api/admin/minor-assignments` |
| Creazione assegnazione | `POST /api/admin/minor-assignments` |
| Modifica assegnazione | `PUT /api/admin/minor-assignments/{id}` |
| Revoca assegnazione | `POST /api/admin/minor-assignments/{id}/revoke` |
| Tab operatori assegnati (scheda minore) | `GET /api/admin/minors/{id}/assigned-users` |
| Sezione minori assegnati (scheda utente) | `GET /api/admin/users/{id}/assigned-minors` |
| Filtro lista minori per scope | `capabilities.minor_scope_mode` nelle capabilities |
| Blocco documento clinico | campo `access_blocked` o HTTP 403 con codice specifico nella risposta documento |

Non appena gli endpoint sono disponibili, il frontend può essere completato in tempi brevi — la struttura UX è definita.

---

## 8. Nomenclatura applicativa da adottare

Da questo task in avanti, nel frontend si usano esclusivamente questi termini:

| ✅ Corretto | ❌ Da evitare |
|---|---|
| Assegnazioni struttura | "Assegnazioni" (generico) |
| Assegnazioni minore | "Assegnazioni" (generico) |
| Operatori assegnati al minore | "Staff del minore" |
| Minori assegnati all'operatore | "I miei minori" (solo come label UI, non come concetto tecnico) |
