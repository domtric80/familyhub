# Risposta 050 — Document preview, audit log dettaglio e refactoring AuditPage

Data: 2026-06-29

## Implementato

### 1. Preview documento (minori)
- Aggiunto `minorApi.previewDocument(minorId, documentId)` in `services/api.ts`
- Endpoint: `GET /minors/{id}/documents/{documentId}/preview` con `responseType: 'blob'`

### 2. Preview + download documento (staff)
- Aggiunto `staffMemberApi.previewDocument(staffId, documentId)` in `services/api.ts`
- Aggiunto `staffMemberApi.downloadDocument(staffId, documentId)` in `services/api.ts`
- Endpoint: `GET /admin/staff-members/{id}/documents/{documentId}/preview|download`

### 3. AuditPage — modal dettaglio potenziato
- Il modal apre immediatamente con i dati già in memoria (nessun caricamento extra)
- Pulsante "Aggiorna" nella testata modal: chiama `adminAuditApi.get(id)` per dati freschi
- Sezione "Prima (old_values)" con sfondo rosso chiaro e "Dopo (new_values)" con sfondo verde chiaro
- Azione visualizzata come Badge secondario con uppercase

### 4. adminAuditApi.get(id)
- Nuovo metodo: `GET /admin/audit-logs/{id}` per dettaglio singolo record
