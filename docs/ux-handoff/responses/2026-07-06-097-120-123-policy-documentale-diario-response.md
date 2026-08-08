# Risposta UX — Handoff 097 (update) + 120 (update) + 123: Policy documentale editor

Data risposta: 2026-07-06  
Handoff: 097-update, 120-update, 123  
Stato: ✅ Implementato

---

## Handoff 097 — Diario educativo: nota QA perimetro funzionale

### Fix applicato

Aggiornato il testo della sezione "Stato funzionale" nel drawer InfoDrawer di `DiarioPage.tsx`:

**Prima:**
> "Il registro strutturato di turno con firma di chiusura e il summary KPI saranno introdotti in un'evoluzione successiva."

**Dopo:**
> "Funzioni supportate: voci strutturate, priorità, umore, follow-up, passaggio consegne, KPI di riepilogo. Non ancora disponibili: firma digitale obbligatoria a chiusura turno, ricerca full-text avanzata, messaggistica interna cifrata per team."

Nessun'altra modifica necessaria: le funzioni non supportate (firma, full-text, messaggistica cifrata) non erano presenti nel codice operativo.

---

## Handoff 120 — Trasparenza ABAC: update endpoint

Il handoff 120 è già stato implementato nella sessione precedente (RuoliPage + MinoreDetailPage). L'update aggiunge l'informazione sui nuovi endpoint `GET/PUT /admin/roles/{role}/document-policy`, ora coperti dal handoff 123.

---

## Handoff 123 — Editor policy documentale per singolo ruolo

### Nuovi tipi (`types/index.ts`)

```typescript
DocumentPolicyClassification {
  code, name, description, is_active,
  assigned_to_role, effective_read_access,
  requires_minor_assignment, notes
}

DocumentPolicy {
  role: { id, code, name }
  rbac: { attachments_read, attachments_upload }
  summary: string
  classifications: DocumentPolicyClassification[]
}
```

### Nuovi endpoint API (`api.ts`)

```typescript
adminRoleApi.getDocumentPolicy(roleId)    // GET /admin/roles/{id}/document-policy
adminRoleApi.updateDocumentPolicy(roleId, classificationCodes)  // PUT /admin/roles/{id}/document-policy
```

### UI implementata in `RuoliPage.tsx`

Nel detail modal del ruolo, la sezione ABAC statica è stata sostituita con un blocco **Policy documentale (ABAC)** live:

**Header RBAC base:**
- Badge `Sì`/`No` per `attachments.read` e `attachments.upload`

**Warning se `attachments.read = false`:**
> "Questo ruolo non ha il permesso base di lettura documenti. Anche se abiliti una classificazione, non potrà leggere documenti finché non riceve quel permesso."

**Checklist classificazioni:**
- Colonne: checkbox, classificazione (code + name), descrizione, accesso effettivo (Sì / Sì con assegnazione / No), note backend
- Checkbox disabilitato per ruoli privilegiati (sistema)
- Classificazioni inattive mostrate con opacità ridotta

**Bottone "Salva policy documentale"** nel ModalFooter:
- Visibile solo per ruoli non privilegiati
- Chiama `PUT /admin/roles/{id}/document-policy` con i codici selezionati

**Caricamento:**
- Policy e permessi caricati in parallelo (`Promise.allSettled`) all'apertura del detail modal
- Fallimento policy non blocca la visualizzazione dei permessi RBAC

### Flusso ruolo nuovo

1. Crea ruolo → assegna permessi RBAC → apri detail
2. Sezione "Policy documentale": seleziona classificazioni → Salva policy documentale
3. Il badge "accesso effettivo" si aggiorna in base a `effective_read_access` restituito dal backend

## File modificati

- `frontend/src/types/index.ts` ← `DocumentPolicyClassification`, `DocumentPolicy`
- `frontend/src/services/api.ts` ← `getDocumentPolicy()`, `updateDocumentPolicy()`
- `frontend/src/pages/anagrafiche/RuoliPage.tsx` ← policy state, openDetail parallelo, checklist live, bottone salva
- `frontend/src/pages/diario/DiarioPage.tsx` ← testo stato funzionale aggiornato
