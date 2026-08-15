# UX handoff response — 181, 182, 183

**Data risposta:** 2026-08-15
**Handoff:** 181 (DiarioMinoreTab presa visione), 182 (Educatori documenti professionali), 183 (Profilo professionale relazionale)
**Stato:** implementato

---

## Handoff 181 — DiarioMinoreTab: presa visione handover

### Cosa è stato fatto

In `frontend/src/pages/minori/tabs/DiarioMinoreTab.tsx`:

- Aggiunto pulsante **"Prendi visione"** nel footer del modal di dettaglio voce diario.
  Visibile solo quando `handover_required === true && !handover_read_at`.
- Chiama `POST /api/journals/{id}/acknowledge-handover` tramite `journalApi.acknowledgeHandover(journalId)`.
- Dopo la chiamata: toast di conferma, ricarica la lista, chiude il modal.
- Badge informativo in modal: "Presa visione registrata" (success) o "In attesa" (danger) + data e autore quando disponibili.
- Pulsante **Modifica** nel footer del modal disabilitato se `journal_shift?.closed_at` è valorizzato (coerente con DiarioPage).

### Nota operativa

`handover_read_at` e `handover_read_by_user_id` sono read-only: il client non li scrive mai. Il backend li imposta alla chiamata `acknowledge-handover`.

---

## Handoff 182 — Educatori: documenti professionali

### Nuovi file

- `frontend/src/pages/educatori/EducatoreDetailPage.tsx` — pagina dettaglio educatore con 3 tab

### Route aggiunta

```
/educatori/:id  →  EducatoreDetailPage
```

### Link "Dettaglio" in EducatoriPage

Ogni riga della lista educatori ha ora un pulsante **Dettaglio** che naviga a `/educatori/:id`.

### Tab Anagrafica

Mostra in sola lettura: struttura, codice dipendente, nome, cognome, data e città nascita, codice fiscale, email, telefono, qualifica, stato, account collegato.

### Tab Documenti professionali

**KPI scadenze:** tre card (Scaduti / In scadenza / Validi) da `GET /api/admin/staff-documents/expiry-summary`.

**Tabella documenti** da `GET /api/admin/staff-members/{id}/documents`:
- Colonne: tipo, file, rilascio, scadenza, giorni, stato amm., stato file (sicurezza)
- Badge scadenza: `no_expiry` → grigio, `valid` → verde, `expiring` → giallo, `expired` → rosso
- Badge sicurezza: `pending` → "In verifica", `clean` → "Disponibile"

**Carica documento** (`POST multipart/form-data`):
- Campi: tipo documento (select), file, data rilascio, data scadenza, stato amministrativo
- Alert: file va in quarantena (scansione sicurezza) subito dopo il caricamento

**Modifica metadati** (`PUT /api/admin/staff-members/{id}/documents/{docId}`):
- Solo date e stato amministrativo — non sostituisce il file

**Download** (`GET …/download` → blob):
- Bloccato se `security_status !== 'clean'` con toast di avviso
- Se il backend risponde 423 → toast "In quarantena"

**Archiviazione logica** (`DELETE /api/admin/staff-members/{id}/documents/{docId}`):
- Conferma modal; testo chiarisce che il file è conservato per retention

### Comportamenti di sicurezza

- Il download è bloccato lato frontend se `attachment.security_status !== 'clean'`
- Errore 423 dal backend gestito con toast specifico
- L'archiviazione usa DELETE ma è semanticamente "soft delete" — file conservato

---

## Handoff 183 — Profilo professionale relazionale

### Tab Profilo professionale (in EducatoreDetailPage)

Carica il profilo da `GET /api/admin/staff-members/{id}/professional-profile` e le lookup da `GET /api/admin/staff-profile-lookups/{type}` (skills, languages, specializations, proficiency-levels).

**Struttura UI:**
- Sezione **Competenze**: righe con select competenza, select livello padronanza, data acquisizione, nota opzionale
- Sezione **Lingue**: righe con select lingua, select livello padronanza, nota opzionale
- Sezione **Specializzazioni**: righe con select specializzazione, data conseguimento, nota opzionale
- Pulsanti "+ Aggiungi" per ogni categoria
- Pulsante elimina riga (cestino)
- Pulsante **Salva profilo** → `PUT /api/admin/staff-members/{id}/professional-profile`

**Semantica PUT applicata:**
- Vengono sempre inviate tutte e tre le categorie caricate (skills, languages, specializations)
- Righe con `id = 0` (non ancora selezionate) vengono filtrate prima del payload
- Campi stringa vuoti → `null` nel payload

**Box informativo:**
> Il profilo professionale non assegna accessi al sistema e non modifica il ruolo applicativo. Ogni modifica è auditata.

### Nuova pagina admin — Anagrafiche professionali

**File:** `frontend/src/pages/admin/AnagraficheProfessionaliPage.tsx`
**Route:** `/anagrafiche/professionali`
**Sidebar:** Anagrafiche → "Prof. professionali"

4 tab: Competenze, Lingue, Specializzazioni, Livelli di padronanza.

**CRUD per ogni tab** tramite `staffProfessionalProfileApi.{createLookupItem, updateLookupItem, deleteLookupItem, lookups}`:
- Crea: codice (upper-cased, immutabile), nome, descrizione, ordinamento, attiva/inattiva
- Modifica: tutti i campi tranne codice
- Attiva/Disattiva (toggle): `PUT` con `is_active` invertito
- Elimina: se backend risponde **409** → alert "Voce già usata — impossibile eliminare" + pulsante **"Disattiva invece"**

**Gestione 409:**
Il modal di eliminazione si trasforma in modal di proposta disattivazione con spiegazione operativa. Nessuna cancellazione forzata.

### API coinvolte

| Endpoint | Metodo | Uso |
|---|---|---|
| `/admin/staff-members/{id}/documents` | GET | Lista documenti |
| `/admin/staff-members/{id}/documents` | POST (multipart) | Upload |
| `/admin/staff-members/{id}/documents/{docId}` | PUT | Metadati |
| `/admin/staff-members/{id}/documents/{docId}` | DELETE | Archiviazione |
| `/admin/staff-documents/expiry-summary` | GET | KPI scadenze |
| `/admin/staff-members/{id}/documents/{docId}/download` | GET | Blob download |
| `/admin/staff-members/{id}/professional-profile` | GET | Lettura profilo |
| `/admin/staff-members/{id}/professional-profile` | PUT | Sincronizzazione profilo |
| `/admin/staff-profile-lookups/{type}` | GET | Lookup anagrafiche |
| `/admin/staff-profile-lookups/{type}` | POST | Crea voce |
| `/admin/staff-profile-lookups/{type}/{id}` | PUT | Aggiorna voce |
| `/admin/staff-profile-lookups/{type}/{id}` | DELETE | Elimina voce (409 → disattiva) |

### Permessi attesi

| Permesso | Operazioni coperte |
|---|---|
| `staff_members.read` | Lettura profilo, documenti, lookup |
| `staff_members.update` | Salvataggio profilo, metadati documento |
| `staff_members.create` (o `update`) | Upload documento |
| `staff_members.delete` | Archiviazione documento |

Le pagine non applicano il gating lato frontend (lasciato al backend via 403).

---

## File modificati

| File | Handoff | Tipo |
|---|---|---|
| `frontend/src/pages/minori/tabs/DiarioMinoreTab.tsx` | 181 | Modifica |
| `frontend/src/pages/educatori/EducatoriPage.tsx` | 182 | Modifica (link Dettaglio) |
| `frontend/src/pages/educatori/EducatoreDetailPage.tsx` | 182+183 | Nuovo |
| `frontend/src/pages/admin/AnagraficheProfessionaliPage.tsx` | 183 | Nuovo |
| `frontend/src/App.tsx` | 182+183 | Modifica (route) |
| `frontend/src/layout/sidebar/menuItems.ts` | 183 | Modifica (voce sidebar) |
| `frontend/src/types/index.ts` | 182+183 | Già modificato (sessione precedente) |
| `frontend/src/services/api.ts` | 182+183 | Già modificato (sessione precedente) |
