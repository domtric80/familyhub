# FamilyHub — Risposta handoff UX — 179 + 180

Data: 2026-08-14
Riferimenti: `2026-08-14-179-avvicinamenti-rinnovo-provvedimento-firma-sospensione-trend.md`, `2026-08-14-180-diario-turni-firma-consegne-ricerca.md`

---

## Handoff 179 — Avvicinamenti: rinnovo provvedimento, firma sospensione, trend esteso

### Stato: ✅ Implementato

**File:** `frontend/src/pages/avvicinamenti/AvvicinamentiPage.tsx`

### Tipi aggiunti (`frontend/src/types/index.ts`)

```typescript
interface ApproachTrendByType {
  approach_type_code: string
  approach_type_name: string
  total: number
}
interface ApproachTrendUpcomingRenewal {
  id: number; minor_id: number; minor_label: string; title: string
  authorization_reference?: string | null
  authorization_status?: string | null
  authorization_expires_at?: string | null
  authorization_days_until_expiry?: number | null
}
// ApproachTrend esteso:
  totals_by_approach_type?: ApproachTrendByType[]
  upcoming_authorization_renewals?: ApproachTrendUpcomingRenewal[]
```

Campi v4 aggiunti su `Approach`:
```typescript
  authorization_days_until_expiry?: number | null
  authorization_is_expired?: boolean
  can_renew_authorization?: boolean
  suspension_is_signed?: boolean
  can_sign_suspension?: boolean
```

### API aggiunte (`frontend/src/services/api.ts`)

```typescript
approachApi.renewAuthorization(id, {
  authorization_expires_at: string  // obbligatorio
  authorization_reference?: string | null
  authorization_issued_at?: string | null
  authorization_renewal_alert_days?: number | null
}) // POST /api/approaches/{id}/renew-authorization → Approach

approachApi.signSuspension(id, data?) // POST /api/approaches/{id}/sign-suspension → Approach
```

### UI implementata

#### Pannello trend (toggle "Mostra trend")

- Tabella **per tipologia**: colonne `Tipologia` / `Totale avvicinamenti`
- Tabella **rinnovi imminenti**: `Minore`, `Titolo`, `Rif.`, `Stato`, `Scadenza`, `Giorni rimanenti`
  - Badge rosso "Scaduto" se `authorization_days_until_expiry <= 0`
  - Badge giallo "Imminente" se `≤ 30 giorni`

#### Colonna autorizzazione in tabella

- Mostra `authorization_days_until_expiry` con badge colorati (rosso/giallo/verde)
- Badge "Sospensione firmata" se `suspension_is_signed === true`

#### Azioni rapide in tabella

- Pulsante **Rinnova** (RefreshCw, warning): visibile solo se `approach.can_renew_authorization === true`
- Pulsante **Firma sospensione** (PenTool, danger): visibile solo se `approach.can_sign_suspension === true`

#### Modal Rinnovo provvedimento

- Campo obbligatorio: `Data scadenza nuova` (`authorization_expires_at`)
- Campi opzionali: `Riferimento`, `Data emissione`, `Giorni avviso rinnovo`
- Chiamata: `approachApi.renewAuthorization(id, payload)` → ricarica lista + trend

#### Modal Firma sospensione

- Testo di conferma esplicito
- Chiamata: `approachApi.signSuspension(id)` → ricarica lista
- Errori backend (403/422) mostrati in modale

### Garanzie rispettate

- `can_renew_authorization` e `can_sign_suspension` mai ricalcolati in frontend: letti direttamente dall'`Approach` restituito dal backend
- Firma sospensione: policy di ruolo applicata interamente lato backend (frontend chiama e gestisce errori)
- `authorization_is_expired`: campo backend, mai derivato da `authorization_expires_at` in frontend

### QA checklist

- [x] Pulsante Rinnova visibile solo se `can_renew_authorization === true`
- [x] Pulsante Firma visibile solo se `can_sign_suspension === true`
- [x] Modal rinnovo richiede `authorization_expires_at` prima di inviare
- [x] Trend pannello mostra `totals_by_approach_type` e `upcoming_authorization_renewals`
- [x] Nessuna inferenza lato frontend su scadenza o permesso firma

---

## Handoff 180 — Diario educativo: turni operativi, firma applicativa, consegne, ricerca

### Stato: ✅ Implementato

**File:** `frontend/src/pages/diario/DiarioPage.tsx`

### Tipi modificati (`frontend/src/types/index.ts`)

Aggiunti:
```typescript
interface JournalShift {
  id: number; facility_id: number; title?: string | null
  started_at: string; ended_at?: string | null
  closed_at?: string | null; closed_by_user_id?: number | null
  closure_signature_type?: string | null; closing_notes?: string | null
  entries_count?: number | null; opened_by_user_id?: number | null
  facility?: { id: number; name: string } | null
  opened_by?: { id: number; display_name: string } | null
  closed_by?: { id: number; display_name: string } | null
}
interface JournalShiftWrite { facility_id: number; started_at: string; title?: string | null; ended_at?: string | null }
interface JournalShiftClosePayload { ended_at: string; closing_notes?: string | null }
interface JournalShiftCloseResponse { closed_at: string; closed_by_user_id: number; closure_signature_type: string; entries_count: number }
```

`JournalEntry` aggiornato:
```typescript
  handover_read_by?: { id: number; display_name: string } | null
  minor_journal_shift_id?: number | null
  journal_shift?: JournalShift | null
```

`JournalEntryWrite` aggiornato:
- Rimossi: `handover_read_at`, `handover_read_by_user_id` (non più scrivibili dal client)
- Aggiunto: `minor_journal_shift_id?: number | null`

### API aggiunte (`frontend/src/services/api.ts`)

```typescript
journalApi.listShifts(params?)   // GET /api/journals/shifts
journalApi.openShift(data)       // POST /api/journals/shifts
journalApi.closeShift(id, data)  // POST /api/journals/shifts/{id}/close
journalApi.acknowledgeHandover(id) // POST /api/journals/{id}/acknowledge-handover
```

`journalApi.list()` esteso con: `search`, `handover_pending`, `minor_journal_shift_id`

### UI implementata

#### Pannello turni (toggle "Turni" in CardHeader)

- Tabella turni: Struttura, Titolo, Inizio, Fine, Voci, Stato, Azioni
- Badge "Chiuso e firmato" vs "Aperto"
- Pulsante **Chiudi** su turni aperti → modal conferma con `ended_at` e `closing_notes`

#### Modal "Apri turno"

- Campi: Struttura (obbligatorio), Titolo (opzionale), Orario inizio (obbligatorio)
- Chiamata: `journalApi.openShift(data)`

#### Modal "Chiudi turno"

- Alert esplicito: chiusura applica **firma applicativa** (`authenticated_application_signature`) — NON firma digitale qualificata
- Campi: Orario chiusura (obbligatorio), Note chiusura (opzionale)
- Chiamata: `journalApi.closeShift(id, payload)`
- Dopo chiusura: `load()` + `loadShifts()` — le voci collegate diventano non modificabili

#### Voce diario: campo turno nel form

- Select "Turno diario" nella sezione Registro turno
- Mostra solo turni **aperti** della struttura del minore selezionato
- Caricato dinamicamente al cambio di `form.minor_id` via `journalApi.listShifts({ facility_id, status: 'open' })`
- Manda `minor_journal_shift_id` nel payload

#### Presa visione consegne

- Pulsante **CheckSquare** (info) in tabella: visibile se `handover_required && !handover_read_at`
- Chiamata: `journalApi.acknowledgeHandover(journalId)` — `POST /api/journals/{id}/acknowledge-handover`
- `handover_read_at` e `handover_read_by_user_id` non inviati dal client (rimossi da `JournalEntryWrite`)
- Pulsante "Prendi visione" anche nel modal dettaglio (posizionato `me-auto` nel footer)
- In dettaglio: mostra `handover_read_by.display_name` (già popolato dal backend dopo acknowledge)

#### Badge turno chiuso in tabella

- Badge "Turno chiuso" accanto al titolo se `item.journal_shift?.closed_at` è impostato
- Pulsanti Modifica e Elimina **disabled** se `item.journal_shift?.closed_at` (con tooltip esplicativo)

#### Sezione turno nel modal dettaglio

- Mostra info turno: nome, stato, orario inizio/fine
- Badge "Turno chiuso e firmato" vs "Turno aperto"

#### Filtri estesi

- Input testo: ricerca full-text → `search` param
- Checkbox "Solo handover in attesa" → `handover_pending=true` param

### Garanzie rispettate

- `handover_read_at` / `handover_read_by_user_id` non inviati dal form: rimossi da `JournalEntryWrite` e da `EMPTY_FORM`, `openEdit`, `handleSave`
- `closure_signature_type` letto dal backend: la UI descrive "firma applicativa" ma non genera né verifica il tipo
- Voci in turno chiuso: il backend risponde 422 se si tenta modifica — il frontend disabilita i controlli preventivamente basandosi su `journal_shift.closed_at`

### QA checklist

- [x] `EMPTY_FORM` non contiene `handover_read_at`
- [x] `openEdit` non mappa `handover_read_at`
- [x] `handleSave` non invia `handover_read_at`
- [x] Form modal: campo "Data/ora presa visione" rimosso
- [x] Presa visione via `acknowledgeHandover` — non via form update
- [x] Turno chiuso: Edit/Delete disabilitati in tabella e in modale dettaglio
- [x] Modal chiusura turno: testo esplicito "firma applicativa" (non firma digitale qualificata)
- [x] Turni select nel form: solo turni `status: 'open'` della struttura del minore
- [x] Filtri `search` e `handover_pending` passati a `journalApi.list()`
