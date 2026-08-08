## Handoff UX/API — Compatibilità alias legacy tab Caso minore

- **Data:** 2026-07-31
- **Area:** `Minori > Dettaglio > Tab Caso`
- **Priorità:** media
- **Tipo:** hardening backend + riallineamento frontend

### Sintesi

- Il backend del tab `Caso` è già disponibile e il contratto canonico resta invariato.
- Per evitare regressioni durante il riallineamento finale del frontend, il backend ora accetta anche alcuni **alias legacy** in input.
- Questa compatibilità è **temporanea**: il frontend deve continuare a usare solo i campi canonici.

### Endpoint coinvolti

- `GET /api/minors/{minor}/case-options`
- `PUT /api/minors/{minor}/case-details`
- `PATCH /api/minors/{minor}/case-details`

### Campi canonici da usare nel frontend

- `origin_facility_id`
- `judicial_authority_document_issuer_id`
- `general_practitioner_staff_member_id`
- `pediatrician_staff_member_id`
- `health_authority_document_issuer_id`
- `vaccination_minor_document_id`

### Alias legacy accettati dal backend solo per compatibilità

- `judicial_authority_id` → `judicial_authority_document_issuer_id`
- `family_doctor_id` → `general_practitioner_staff_member_id`
- `pediatrician_id` → `pediatrician_staff_member_id`
- `asl_id` → `health_authority_document_issuer_id`
- `vaccination_record_document_id` → `vaccination_minor_document_id`

### Azione richiesta a UX

- Verificare che tutte le form del tab `Caso` inviino solo i campi canonici.
- Non introdurre nuovi componenti che usano gli alias legacy.
- Considerare gli alias come fallback backend e non come parte del contratto stabile.

### Nota operativa

- Nessuna modifica necessaria sul rendering delle select:
  - `origin_facilities`
  - `judicial_authorities`
  - `health_authorities`
  - `general_practitioners`
  - `pediatricians`
  - `vaccination_documents`

- La sorgente lookup del tab `Caso` resta `GET /api/minors/{minor}/case-options`.
