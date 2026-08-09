# Risposta UX — Handoff 144: Separazione preview vs download documenti

Data: 2026-08-09  
Stato: implementato

---

## File modificati

| File | Operazione |
|------|-----------|
| `src/components/common/DocPreviewModal.tsx` | Gestione 403 su download, nota "preview sì / download no" |
| `src/pages/anagrafiche/DocumentAccessMatrixPage.tsx` | Colonna "Download effettivo" + badge RBAC download |
| `src/pages/minori/MinoreDetailPage.tsx` | Messaggio 403 allineato al contratto, re-throw per modal |

---

## DocPreviewModal — Comportamento aggiornato

### Download 403
- `handleDownload` diventa `async` e cattura errori
- Se `onDownload()` lancia un errore con `response.status === 403`:
  - Mostra `Alert color='warning'` nel footer: `"Download non consentito per il tuo ruolo o per la classificazione del documento."`

### Note "preview sì / download no"
- Se `canDownload === false` e `state === 'ready'`:
  - Mostra nel footer: `"Puoi consultare il documento, ma il download non è consentito per il tuo ruolo o per questa classificazione."`

### Endpoint
- `fetchBlob` → `/preview` (già corretto — preview usa endpoint dedicato)
- `onDownload` → `/download` (gestito dai caller: MinoreDetailPage chiama `minorApi.downloadDocument`)

---

## DocumentAccessMatrixPage — Aggiornamenti

### Tabella principale (per ruolo)
- Aggiunta colonna **Download (RBAC)** con `role.rbac.attachments_download` badge

### Tabella dettaglio per classificazione (espandibile)
- Aggiunta colonna **Lettura effettiva** con `effective_read_access` (rinominata da "Accesso effettivo")
- Aggiunta colonna **Regola lettura** con `effective_read_rule`
- Aggiunta colonna **Download effettivo** con `effective_download_access`
- Aggiunta colonna **Regola download** con `effective_download_rule`

### Alert informativi
- Se `!rbac.attachments_read` → warning "no RBAC base lettura"
- Se `!rbac.attachments_download` → info "può fare preview ma non scaricare"

---

## MinoreDetailPage — handleDownload

- 403 → messaggio: `"Download non consentito per il tuo ruolo o per la classificazione del documento."`
- L'errore viene re-thrown dopo aver impostato `downloadErrors`, così DocPreviewModal può mostrare il proprio `downloadBlockedMsg` inline nel modal

---

## QA da verificare

- [ ] Educatore apre documento `internal` in preview → OK (fetchBlob usa `/preview`)
- [ ] Educatore prova a scaricare → 403 → messaggio nel modal e nella lista
- [ ] Psicologo scarica documento `clinical` → OK
- [ ] MatriceAccesso mostra colonne separate Lettura / Download per ogni classificazione
- [ ] `canDownload={hasPermission('attachments.download')}` già presente in MinoreDetailPage e AvvicinamentiMinoreTab ✓

---

## TypeScript

`tsc -b --noEmit` → exit 0, zero errori.
