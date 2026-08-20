# UX handoff response — 193

**Data risposta:** 2026-08-19
**Handoff:** 193 — Media attività con consenso
**Stato:** implementato

---

## Nuovi tipi (`frontend/src/types/index.ts`)

```typescript
MinorActivityMedia      // id, minor_activity_id, media_document_id, consent_document_id,
                        // captured_at?, consent_expires_at?, consent_revoked_at?,
                        // consent_status: 'valid'|'expired'|'revoked', can_preview,
                        // media_document?: MinorDocument, consent_document?: MinorDocument
MinorActivityMediaWrite // media_document_id, consent_document_id, captured_at?
```

## Nuove API (`frontend/src/services/api.ts`)

```typescript
activityMediaApi: { list, create, delete, revokeConsent }
// GET  /api/activities/{id}/media
// POST /api/activities/{id}/media
// DELETE /api/activities/{id}/media/{mediaId}
// POST /api/activities/{id}/media/{mediaId}/revoke-consent  → body: { motivazione }
```

## Sezione Media nel modal dettaglio attività (`AttivitaPage.tsx`)

Posizione: dopo dati attività, prima della sezione Promemoria.

**Tabella media esistenti:**
- Colonne: file media (original_name), documento consenso, data cattura, stato consenso (badge Valido/Scaduto/Revocato)
- Pulsante Anteprima: visibile solo se `can_preview=true && consent_status === 'valid'`
- Pulsante Revoca consenso: visibile solo se `consent_status === 'valid'`; apre modal di conferma con campo motivazione obbligatorio
- Pulsante Rimuovi: visibile solo se `consent_status !== 'valid'` (non si rimuovono media con consenso attivo)

**Form collegamento nuovo media:**
- Selettore documento media: filtra per `mime_type` immagine/video con optgroup "Altri documenti"; il backend rivalida
- Selettore documento consenso: tutti i documenti del minore
- Data cattura (facoltativa)
- Documenti caricati da `minorApi.listDocuments(minor_id)`

**Preview:**
- Usa `minorApi.previewDocument(minor_id, media_document_id)` → blob autenticato
- Mai URL S3/MinIO esposti nella UI
- Visualizzazione in modal come `<img>` con fallback toast in caso di formato non visualizzabile

**Revoca consenso:**
- Modal di conferma con `<Alert>` warning esplicito
- Campo motivazione obbligatorio (empty → button disabilitato)
- Dopo revoca: riga aggiornata in lista (non rimossa — prova storica)
- Toast generico "Consenso revocato." (nessun testo del documento)

**Box informativo:**
> I media restano documenti protetti del minore. La galleria li rende visibili solo quando il consenso è valido, il file ha superato i controlli di sicurezza e il tuo profilo possiede gli accessi documentali necessari. La revoca interrompe la fruizione senza cancellare la prova storica.

## Vincoli rispettati

- Nessun URL storage esposto nella UI — preview via endpoint autenticato
- `can_preview=false` → pulsante Anteprima nascosto senza spiegazione (dipende dal backend)
- `consent_status` sempre da backend — mai derivato nel browser
- Conferma + motivazione obbligatoria prima della revoca
- Riga revocata rimane nella tabella (storico)
- Errori 403, 409, 422 mostrati via `apiError(e).message`

## File modificati

| File | Tipo |
|---|---|
| `frontend/src/types/index.ts` | Modifica (MinorActivityMedia, MinorActivityMediaWrite) |
| `frontend/src/services/api.ts` | Modifica (activityMediaApi + import block) |
| `frontend/src/pages/attivita/AttivitaPage.tsx` | Modifica (sezione Media in modal dettaglio) |
