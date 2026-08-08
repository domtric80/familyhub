# Risposta UX — Handoff 103–108: Avvicinamenti v2 completo + label documenti

Data risposta: 2026-07-03  
Handoff di riferimento: 103, 104, 105, 106, 107, 108  
Stato: ✅ Implementato

---

## Riepilogo implementazione

Tutti i contratti definiti negli handoff 103–108 sono stati recepiti e implementati in:

- `frontend/src/pages/avvicinamenti/AvvicinamentiPage.tsx`
- `frontend/src/pages/minori/tabs/AvvicinamentiMinoreTab.tsx`
- `frontend/src/types/index.ts`

---

## Handoff 103 — Tipologia avvicinamento + provvedimento autorizzativo

### Tipologia contatto

- Select `approach_type_id` popolata da `GET /api/lookups/approach-types`
- Label nel form: `Tipologia contatto`
- Il campo è obbligatorio (validazione lato frontend)

### Provvedimento autorizzativo — 3 modalità

Implementato selettore a 3 bottoni stilizzati (colore primario `#7366ff`):

| Modalità | Comportamento |
|----------|---------------|
| 📎 Documento esistente | Select dei documenti del minore già caricati; imposta `authorization_minor_document_id` |
| ⬆️ Carica nuovo | Upload file → `POST /minors/{id}/documents` → auto-collega l'ID restituito come `authorization_minor_document_id` |
| ✏️ Inserimento manuale | Campi `authorization_reference`, `authorization_issued_at`, `authorization_expires_at`, `authorization_renewal_alert_days` |

**Auto-detect in modifica:** se `authorization_minor_document_id` è valorizzato → "Documento esistente"; se solo `authorization_reference` → "Manuale"; altrimenti → "Documento esistente".

**Warning coerenza:** la select documenti è filtrata sui documenti del minore selezionato. Se il minore non è ancora scelto, viene mostrato un alert informativo.

---

## Handoff 104 — Partecipanti familiari con ruolo

### Struttura implementata

Repeater a righe (`ParticipantsRepeater`) con due colonne per riga:

- `minor_contact_id` — select contatti del minore
- `contact_type_id` — select lookup `contact_types` (Madre, Padre, Affidatario, Tutore…)

### Payload inviato

```json
"participants": [
  { "minor_contact_id": 44, "contact_type_id": 2 },
  { "minor_contact_id": 45, "contact_type_id": 7 }
]
```

### Retrocompatibilità

I record esistenti con solo `minor_contact_ids` vengono mappati automaticamente in apertura form:

```ts
item.participants?.map(...) ?? item.minor_contact_ids?.map(id => ({ minor_contact_id: id, contact_type_id: null })) ?? []
```

### Visualizzazione lista / dettaglio

- Lista: colonna "Partecipanti" mostra `Cognome Nome` del primo + badge `+N` per i restanti
- Dettaglio modal: sezione `Partecipanti familiari / tutori` con nome + badge ruolo (pill `badge-secondary`)

---

## Handoff 105 — Partecipanti professionali

### Struttura implementata

Repeater separato (`StaffRepeater` / `StaffParticipantsRepeater`) con:

- `staff_member_id` — select operatori della struttura del minore
- `qualification_code` — select `staffQualifications` (opzionale)

### Payload inviato

```json
"staff_participants": [
  { "staff_member_id": 21, "qualification_code": "PSICOLOGO" },
  { "staff_member_id": 22, "qualification_code": "ASSISTENTE_SOCIALE" }
]
```

### Caricamento dati staff

- `AvvicinamentiPage`: staff caricato da `staffMemberApi.list({ facility_id })` recuperando `facility_id` dal minore selezionato
- `AvvicinamentiMinoreTab`: staff caricato da `minorApi.get(minorId)` → `staffMemberApi.list({ facility_id: m.facility_id })`

### Visualizzazione dettaglio

Sezione `Professionisti presenti` con nome + badge qualifica, separata fisicamente dai familiari.

---

## Handoff 106 — Pack UX consolidato avvicinamenti

### Checklist completata

**Pagina lista:**
- ✅ Colonna `Tipo` (approach_type.name)
- ✅ Colonna `Partecipanti` (primo nome + badge conteggio)
- ✅ Colonna `Autorizzazione` (badge active/expiring/expired)
- ✅ Filtri: minore, tipo, stato, data range, limite risultati

**Form creazione/modifica:**
- ✅ Select `approach_type_id`
- ✅ Repeater `participants[]` con `contact_type_id`
- ✅ Repeater `staff_participants[]` con `qualification_code`
- ✅ Selettore 3 modalità provvedimento con `authorization_minor_document_id`
- ✅ Campi manuali provvedimento (riferimento, date, alert)
- ✅ Valutazione prima/durante/dopo con note
- ✅ Blocco note riservate (psicologo, coordinatore)

**Dettaglio modal:**
- ✅ Sezione partecipanti familiari (sfondo `#f4f5f7`, badge ruolo)
- ✅ Sezione professionisti presenti (sfondo `#f4f5f7`, badge qualifica)
- ✅ Sezione provvedimento collegato (con status badge)
- ✅ Sezione valutazione qualitativa

---

## Handoff 107 — Checklist UX dev

### Stato checklist

Tutte le voci della checklist di sviluppo risultano implementate. Si rimanda alla tabella del handoff 106 per il dettaglio voce per voce.

**Scenari QA coperti dal codice:**
- create con 2 familiari e ruoli distinti → payload `participants[]`
- create con 2 professionisti → payload `staff_participants[]`
- create con documento provvedimento collegato → `authorization_minor_document_id`
- reopen in modifica con auto-detect modalità provvedimento
- filtro lista per minore, tipo, stato

---

## Handoff 108 — Campo `label` su MinorDocument

### Tipo aggiornato

`MinorDocument.label?: string | null` aggiunto in `frontend/src/types/index.ts`.

### Logica di visualizzazione

In tutte le select e i blocchi che mostrano documenti del minore:

```ts
const label = doc.label ?? doc.attachment?.original_name?.replace(/\.[^.]+$/, '') ?? `Doc #${doc.id}`
```

Implementata in:
- `AvvicinamentiPage.tsx` — select provvedimento
- `AvvicinamentiMinoreTab.tsx` — select provvedimento

### Form upload

Nel campo upload "Carica nuovo", il campo `Nome documento` è precompilato con il nome file senza estensione e trasmesso come `label` nel FormData. L'utente può modificarlo prima del caricamento.

### Moduli ancora da aggiornare

- `Minori > tab Documenti` — da verificare se la tabella mostra già `label`
- `Minori > Scheda caso` (handoff 109) — userà stessa logica per `placement_order_minor_document_id` e `vaccination_minor_document_id`

---

## File modificati

| File | Modifiche |
|------|-----------|
| `pages/avvicinamenti/AvvicinamentiPage.tsx` | Repeater partecipanti, staff, selettore 3 modalità provvedimento, label documenti |
| `pages/minori/tabs/AvvicinamentiMinoreTab.tsx` | Idem per tab minore |
| `types/index.ts` | `MinorDocument.label` aggiunto |
| `docs/dev-notes/minor-documents-label-field.md` | Nota backend per campo `label` |

---

## Note per sviluppo backend

Il campo `label` su `minor_documents` è già operativo lato backend (handoff 108 confermato). Il frontend lo usa correttamente. Nessuna ulteriore azione backend richiesta su questi handoff.
