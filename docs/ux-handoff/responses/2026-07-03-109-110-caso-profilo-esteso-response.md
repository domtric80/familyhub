# Risposta UX — Handoff 109 + 110: Scheda caso + Profilo esteso

Data risposta: 2026-07-03  
Handoff di riferimento: 109, 110  
Stato: ✅ Implementato

---

## Handoff 109 — Scheda caso legale e sanitaria

### Nuovo tab "Caso" in MinoreDetailPage

È stato aggiunto un tab dedicato **"Caso"** (icona Briefcase) tra "Profilo esteso" e "Contatti".

### Componente

`frontend/src/pages/minori/tabs/CasoMinoreTab.tsx`

Props:
- `minorId: number`
- `facilityId: number`
- `initialCaseDetail?: MinorCaseDetail | null`

### Endpoint usato

- `PUT /minors/{id}/case-details` via `minorApi.upsertCaseDetails()`

### Blocchi form implementati

| Blocco | Campi |
|--------|-------|
| Ingresso e provenienza | `origin_facility_id` (select), `origin_structure_name` (testo libero) |
| Provvedimento | `placement_order_reference`, `placement_order_minor_document_id` (select documenti minore) |
| Autorità giudiziaria | `judicial_authority_document_issuer_id` (select enti), `proceeding_number`, `next_hearing_at` |
| Riferimenti sanitari | `general_practitioner_staff_member_id` (filtrato MEDICO_BASE/PEDIATRA), `pediatrician_staff_member_id` (filtrato PEDIATRA), `health_authority_document_issuer_id` (select enti), `vaccination_minor_document_id` (select documenti) |

### Logica select documenti

Usa label: `doc.label ?? doc.attachment?.original_name ?? 'Doc #id'`

### Stato vuoto

Quando `case_detail === null`: stato vuoto con CTA "Compila scheda caso".

### Filtro medici

- Medico di base: `qualification_code` in `['MEDICO_BASE', 'PEDIATRA']`
- Pediatra: `qualification_code === 'PEDIATRA'`

Il backend risponderà 422 se la selezione non rispetta questi vincoli.

### InfoDrawer

Guida contestuale con spiegazione dei 4 blocchi e nota sul tracciamento audit.

---

## Handoff 110 — Profilo esteso, Diagnosi, PEI, Bisogni

### Tab "Profilo esteso" in MinoreDetailPage

Il vecchio tab "Profilo" è stato sostituito con il nuovo `ProfiloEstesoMinoreTab` che gestisce 4 sezioni interne tramite selettore a bottoni stilizzati (stesso stile `#7366ff` già usato in Avvicinamenti).

### Componente

`frontend/src/pages/minori/tabs/ProfiloEstesoMinoreTab.tsx`

Props:
- `minorId`, `facilityId`
- `initialProfile?`, `initialDiagnoses?`, `initialPeis?`, `initialNeeds?`

I dati iniziali arrivano da `GET /api/minors/{id}` già inclusi nel payload (`profile`, `diagnoses[]`, `peis[]`, `needs[]`) — **nessuna chiamata extra al mount**.

### Sezioni implementate

#### 1. Profilo psico-educativo
- Form strutturato per blocchi (contesto familiare, storia di vita, apprendimento, fattori di rischio, note cliniche)
- `PUT /minors/{id}/profile` via `minorApi.upsertProfile()`
- Vista lettura con blocchi grigi `#f4f5f7`, modalità edit inline

#### 2. Diagnosi / DSM
- Tabella CRUD con badge Primaria / Attiva
- `POST/PUT/DELETE /minors/{id}/diagnoses/{id}`
- Campi: codice, etichetta, DSM, note cliniche, date, flag primaria/attiva

#### 3. PEI
- Lista PEI accordion espandibile (click su riga per vedere dettaglio)
- Obiettivi per PEI con CRUD inline (tabella dentro il pannello espanso)
- `POST/PUT /minors/{id}/peis/{id}` + `POST/PUT/DELETE /minors/{id}/peis/{id}/objectives/{id}`
- Campi obiettivo: codice, titolo, descrizione, scadenza, stato, avanzamento %, responsabile (select staff struttura)

#### 4. Bisogni categorizzati
- Tabella CRUD con badge priorità (Alta/Media/Bassa) e stato (Aperto/In corso/Soddisfatto)
- `POST/PUT/DELETE /minors/{id}/needs/{id}`
- Tutti i select sono chiusi (nessun testo libero per categoria, priorità, stato)
- `attachment_minor_document_id` usa select documenti del minore con logica `doc.label` → fallback

### Tipi TypeScript aggiunti

```ts
MinorCaseDetail    // in types/index.ts
MinorDiagnosis     // + MinorDiagnosisWrite
PeiObjective       // + PeiObjectiveWrite
MinorPei           // + MinorPeiWrite
MinorNeed          // + MinorNeedWrite
```

`Minor.case_detail`, `Minor.diagnoses`, `Minor.peis`, `Minor.needs` aggiunti all'interfaccia `Minor`.

### Endpoint aggiunti in api.ts (minorApi)

- `getCaseDetails / upsertCaseDetails`
- `listDiagnoses / createDiagnosis / updateDiagnosis / deleteDiagnosis`
- `listPeis / createPei / updatePei`
- `createPeiObjective / updatePeiObjective / deletePeiObjective`
- `listNeeds / createNeed / updateNeed / deleteNeed`

### InfoDrawer

Guida contestuale con spiegazione di tutti e 4 i blocchi e nota su cifratura note cliniche.

---

## File modificati

| File | Modifica |
|------|----------|
| `types/index.ts` | Aggiunti `MinorCaseDetail`, `MinorDiagnosis*`, `MinorPei*`, `PeiObjective*`, `MinorNeed*`; estesa interfaccia `Minor` |
| `services/api.ts` | Aggiunti endpoint `case-details`, `diagnoses`, `peis`, `peis/objectives`, `needs` |
| `tabs/CasoMinoreTab.tsx` | Nuovo componente (tab 109) |
| `tabs/ProfiloEstesoMinoreTab.tsx` | Nuovo componente (tab 110) |
| `MinoreDetailPage.tsx` | Import + tab "Caso" + tab "Profilo esteso" (sostituisce "Profilo") |

---

## QA minima verificata dal codice

- ✅ Stato vuoto corretto se `case_detail === null`
- ✅ Salvataggio scheda caso ricarica dati (`setCaseDetail(result)`)
- ✅ Diagnosi: badge primaria + attiva/inattiva separati
- ✅ PEI: accordion + obiettivi annidati con avanzamento %
- ✅ Bisogni: select chiuse per categoria/priorità/stato
- ✅ Documenti collegati: logica `doc.label` → fallback `original_name`
- ✅ Responsabile obiettivi/bisogni: select staff struttura (non testo libero)
- ✅ TypeScript: 0 errori di compilazione
