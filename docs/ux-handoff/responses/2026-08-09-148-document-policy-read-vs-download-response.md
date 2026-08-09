# Risposta UX — Handoff 148: Policy documentale separata lettura vs download

Data: 2026-08-09  
Stato: implementato

---

## Verifica stato pre-handoff

La maggior parte delle modifiche richieste era già presente dal lavoro delle sessioni 144/145. L'unica mancanza era l'auto-uncheck di D alla deselezione di R.

---

## Modifiche applicate

### RuoliPage — auto-uncheck D quando R viene deselezionato

**Prima:**
```tsx
onChange={(e) => {
  const s = new Set(policyChecked)
  if (e.target.checked) s.add(cls.code); else s.delete(cls.code)
  setPolicyChecked(s)
}}
```

**Dopo:**
```tsx
onChange={(e) => {
  const s = new Set(policyChecked)
  if (e.target.checked) {
    s.add(cls.code)
  } else {
    s.delete(cls.code)
    // Auto-uncheck D when R is deselected
    const ds = new Set(policyDownloadChecked)
    ds.delete(cls.code)
    setPolicyDownloadChecked(ds)
  }
  setPolicyChecked(s)
}}
```

---

## Checklist completa handoff 148

### RuoliPage — Policy documentale ABAC

- [x] Due colonne checkbox: `R` (lettura/preview) e `D` (download)
- [x] `D` disabilitato se `R` non è selezionato (`disabled={... || !checked}`)
- [x] `D` disabilitato se il ruolo non ha `attachments.download` RBAC (`disabled={... || !policy.rbac.attachments_download || ...}`)
- [x] Deselezione di `R` → auto-rimozione di `D` dallo state `policyDownloadChecked` ← **fix di questa sessione**
- [x] Alert info visibile se ruolo senza `attachments.download`: "può vedere documenti solo in preview"
- [x] Alert warning visibile se ruolo senza `attachments.read`
- [x] Footer: `R = lettura/preview`, `D = download`, nota assegnazione minore
- [x] Payload `PUT /api/admin/roles/{role}/document-policy`: `{ classification_codes, download_classification_codes }`
- [x] Dopo salvataggio: state aggiornato da risposta backend (incluso `download_assigned_to_role`)

### DocumentAccessMatrixPage — Classificazioni

- [x] Colonna `Ruoli lettura` → `cls.allowed_role_codes`
- [x] Colonna `Ruoli download` → `cls.allowed_download_role_codes` (badge verde)
- [x] Colonna `Ruoli ammessi` rimossa

### DocumentAccessMatrixPage — Dettaglio per ruolo (riga espandibile)

- [x] Colonna `Lettura effettiva` con `ReadAccessBadge`
- [x] Colonna `Download effettivo` con `DownloadAccessBadge`
- [x] Colonna `Regola lettura` e `Regola download`
- [x] Alert se ruolo senza `attachments.download`: "può aprire in preview ma non scaricare"

---

## Regole semantiche rispettate

| Regola | Comportamento UI |
|--------|-----------------|
| D richiede R | `D` disabled se R non checked |
| D richiede `attachments.download` RBAC | `D` disabled se `!policy.rbac.attachments_download` |
| Deselezione R → rimozione D | Handler R auto-cancella D da state |
| Backend riallinea eventuali inconsistenze | Payload inviato è comunque validato lato server |

---

## TypeScript

`tsc -b --noEmit` → 0 errori.
