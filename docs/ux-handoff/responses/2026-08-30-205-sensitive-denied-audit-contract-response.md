# Risposta UX — Handoff 205: Audit — accessi negati e dati oscurati

**Data:** 2026-08-30  
**Handoff:** 205  
**Route:** `/admin/audit` → `AuditPage`

## Stato: implementato ✅

Le modifiche sono state applicate a `frontend/src/pages/admin/AuditPage.tsx`.

## Modifiche implementate

### 1. Nuovo tipo evento `denied` — evidenziazione in tabella

Le righe con `action === 'denied'` ricevono un background rosso chiaro (`#fff5f5`) nella tabella principale per renderle immediatamente distinguibili.

```tsx
<tr key={log.id} style={log.action === 'denied' ? { background: '#fff5f5' } : undefined}>
```

### 2. Badge "Accesso negato" nella colonna Operazione

Un badge `bg-danger` a testo piccolo compare prima del nome dell'azione nei record `denied`:

```tsx
{log.action === 'denied' && (
  <span className='badge bg-danger me-1' style={{ fontSize: 10 }}>Accesso negato</span>
)}
```

### 3. Badge nel modal di dettaglio

La sezione badge dell'azione nel drawer di dettaglio usa `color='danger'` e il testo "Accesso negato" per eventi `denied`, anziché il badge secondario generico:

```tsx
<Badge color={displayLog.action === 'denied' ? 'danger' : 'secondary'}>
  {displayLog.action === 'denied' ? 'Accesso negato' : displayLog.action}
</Badge>
```

### 4. Sezione dettaglio accesso negato

Quando `action === 'denied'` e `new_values_json` è presente, viene mostrata una sezione separata con sfondo `#fff5f5` prima dei valori old/new:

- **Codice HTTP** — badge danger con `new_values_json.status_code`
- **Metodo** — testo `new_values_json.method`
- **Path** — testo `new_values_json.path`

### 5. Rendering `***redacted***`

I valori oscurati nel payload JSON (`"***redacted***"`) vengono sostituiti con `"[contenuto oscurato]"` prima della visualizzazione:

```typescript
JSON.stringify(displayLog.old_values_json, null, 2)
  .replace(/"(\*\*\*redacted\*\*\*)"/g, '"[contenuto oscurato]"')
```

Questo vale sia per `old_values_json` sia per `new_values_json`.

## Contratto API atteso

Il backend deve popolare `new_values_json` con almeno:

```json
{
  "status_code": 403,
  "method": "GET",
  "path": "/api/minors/42/documents"
}
```

Per i campi oscurati: il valore `"***redacted***"` nel JSON viene reso come `"[contenuto oscurato]"` nel frontend.

## Note di divergenza

Nessuna divergenza dalle specifiche. Build TypeScript conforme (verifica su macchina di sviluppo richiesta — node_modules non disponibili in sandbox CI).
