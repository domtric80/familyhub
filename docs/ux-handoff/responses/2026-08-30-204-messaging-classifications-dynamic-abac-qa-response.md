# Risposta UX — Handoff 204: Messaggistica ABAC — classificazioni dinamiche

**Data:** 2026-08-30  
**Handoff:** 204  
**Route:** `/messaggi` → `MessaggiPage`, `/messaggi/:id` → `MessaggioDetailPage`

## Stato: già implementato ✅

L'ispezione del codice conferma che entrambe le pagine erano già conformi alle specifiche nel commit del 2026-08-30.

## Implementazione verificata

### Classificazioni dinamiche da API

`MessaggiPage.tsx` carica le classificazioni disponibili da `lookupsApi.documentClassifications()` all'avvio:

```typescript
const [classifications, setClassifications] = useState<ClassificationOption[]>(DEFAULT_CLASSIFICATIONS)

useEffect(() => {
  lookupsApi.documentClassifications()
    .then(setClassifications)
    .catch(() => { /* DEFAULT_CLASSIFICATIONS già impostato */ })
}, [])
```

Il fallback `DEFAULT_CLASSIFICATIONS` (array statico) viene usato solo se la chiamata API fallisce, garantendo che la UI non rimanga mai vuota.

### Filtro minori per struttura

Nel modal di nuovo messaggio, l'elenco dei destinatari minori è filtrato per `form.facility_id` (struttura selezionata nel form), non per il filtro globale `filterFacilityId` della lista. Questo è il comportamento corretto: il destinatario deve appartenere alla stessa struttura del messaggio.

```typescript
const minoriPerStruttura = minoriList.filter(
  (m) => !form.facility_id || m.facility_id === form.facility_id
)
```

### Classificazione nel form

Il select classificazione nel modal usa le `classifications` dinamiche:

```tsx
<Input type='select' value={form.classification_code} onChange={...}>
  {classifications.map((c) => (
    <option key={c.code} value={c.code}>{c.label}</option>
  ))}
</Input>
```

## Note di divergenza

Nessuna divergenza rispetto alle specifiche. Il comportamento è conforme all'handoff 204.

## Prossimo passo

Nessuna azione richiesta. Il team può procedere al collaudo UAT del modulo messaggistica.
