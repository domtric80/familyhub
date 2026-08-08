# Handoff UX/API - Riallineamento backend per tab Caso del minore

Data: 2026-07-06  
Area: `Minore > Caso`, `Admin > Utenti > Assegna minore`  
Priorita: alta  
Tipo: fix backend + chiarimento contratto

## 1. Sintesi

Il documento `docs/dev-note-backend-issues.md` evidenzia problemi reali, ma contiene anche alcuni nomi campo non allineati al contratto backend attuale.

Questa nota serve a riallineare UX con il backend gia disponibile e con i fix aggiunti oggi.

## 2. Endpoint nuovo per il tab Caso

Usare come fonte primaria:

- `GET /api/minors/{minor}/case-options`

Restituisce gia filtrati:

- `origin_facilities`
- `judicial_authorities`
- `health_authorities`
- `general_practitioners`
- `pediatricians`
- `vaccination_documents`

## 3. Nomi campo corretti

Usare questi campi backend:

- `origin_facility_id`
- `judicial_authority_document_issuer_id`
- `general_practitioner_staff_member_id`
- `pediatrician_staff_member_id`
- `health_authority_document_issuer_id`
- `vaccination_minor_document_id`

Non usare questi alias:

- `judicial_authority_id`
- `family_doctor_id`
- `pediatrician_id`
- `asl_id`
- `vaccination_record_document_id`

## 4. Struttura di provenienza

Scelta corrente:

- il backend restituisce `origin_facilities` come elenco strutture censite
- non esiste al momento una tipologia separata "solo provenienza"

## 5. Autorita giudiziaria

Fonte corretta:

- `judicial_authorities` da `GET /api/minors/{minor}/case-options`

Sono document issuer filtrati su codice `TRIBUNALE`.

## 6. ASL di riferimento

Fonte corretta:

- `health_authorities` da `GET /api/minors/{minor}/case-options`

Sono document issuer filtrati su codice `ASL`.

## 7. Medico di base e pediatra

Fonti corrette:

- `general_practitioners`
- `pediatricians`

Entrambe arrivano da `GET /api/minors/{minor}/case-options`.

Nota:

- e stato aggiunto anche il codice qualifica `MEDICO_BASE`

## 8. Cartella vaccinale

### Soluzione consigliata

Usare direttamente:

- `vaccination_documents` da `GET /api/minors/{minor}/case-options`

### Soluzione alternativa

Usare:

- `GET /api/minors/{minor}/documents?medical_only=true`

oppure:

- `GET /api/minors/{minor}/documents?document_type_code=MEDICAL_REPORT`

## 9. Admin > Utenti > Assegna minore

Verifica backend:

- `GET /api/admin/facilities` esiste ed e attivo

Questa issue al momento sembra piu probabile lato frontend/consumo endpoint che backend puro.

Controlli richiesti a UX:

- usare `GET /api/admin/facilities`
- verificare caricamento al mount
- verificare token/percorso corretto
- non usare path abbreviati o non-admin
