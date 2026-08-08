# Risposta UX 042 · Flusso canonico Educatore ↔ Utente applicativo

Data: 2026-06-28
Stato: IMPLEMENTATO

## 1. Checklist

- [x] distinguere sempre anagrafica educatore e account utente
- [x] introdurre flusso di collegamento educatore esistente
- [x] introdurre opzione di creazione contestuale educatore
- [x] mostrare stato di collegamento in liste e dettagli
- [x] non consentire UX ambigua che favorisca record doppi
- [x] wizard/modal guidata implementata

---

## 2. Pagina Educatori — stati di collegamento

**File:** `frontend/src/pages/educatori/EducatoriPage.tsx`

Aggiunte due colonne nella tabella educatori:

| Colonna | Valori |
|---|---|
| `Account` | badge verde "Collegato" (con nome utente) / badge giallo "Non collegato" |
| `Accesso software` | badge verde "Sì" (utente attivo) / badge grigio "No" |

La colonna "Accesso software" riflette `user.is_active`: un educatore può avere account ma con accesso disabilitato. Il badge è distinto per chiarezza.

---

## 3. Wizard account educatore in UtentiPage

**File:** `frontend/src/pages/admin/UtentiPage.tsx`

Aggiunto pulsante "Account educatore" nella testata della pagina utenti, che apre il wizard guidato a step.

### Step 1 — Credenziali account

Campi:
- Nome, Cognome, Email, Password (con barra forza e requisiti), Conferma password

Nessuna ambiguità: l'operatore capisce che sta creando un account di accesso.

### Step 2 — Collegamento anagrafica

Domanda esplicita:

> "Vuoi collegare questo account a un educatore già censito?"

Due pulsanti:
- `Sì, collega educatore esistente` → step 3A
- `No, crea nuova anagrafica educatore` → step 3B

Questo step impedisce la creazione "cieca" che genera disallineamento.

### Step 3A — Educatore esistente

- Filtro per struttura
- Campo di ricerca libera
- Lista selezionabile da `GET /api/admin/users/linkable-staff-members`
- Se la lista è vuota: messaggio "Nessun educatore disponibile da collegare in questa struttura"

### Step 3B — Nuova anagrafica

Mini-form con campi minimi:
- Struttura, Codice matricola, Qualifica

Nome e cognome ereditati dall'account (Step 1), email opzionale separata.

### Submit

Un solo payload a `POST /api/admin/users/educator-account`.

---

## 4. Regola anti-duplicato

Il frontend non esegue merge automatici. La lista in Step 3A mostra solo educatori **senza account collegato** (`linkable-staff-members`). L'operatore deve selezionare esplicitamente o confermare la creazione di una nuova anagrafica.

Gli errori di dominio dal backend (educatore già collegato, matricola duplicata) vengono mostrati nel banner del wizard senza riscrittura.

---

## 5. Timesheet

Il frontend non gestisce ancora i timesheet, ma la regola è registrata:
- un educatore senza account non può compilare timesheet
- il modulo timesheet richiederà: account attivo + assegnazione struttura + collegamento anagrafica educatore

---

## 6. Colonna `Entità educatore` in UtentiPage

Non ancora implementata nella tabella utenti (richiederebbe un campo `staff_member_id` esposto dall'API `GET /admin/users`). Quando il backend includerà questo campo nell'oggetto `AdminUser`, la colonna potrà essere aggiunta senza modifiche architetturali.
