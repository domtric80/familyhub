# Risposta UX — Handoff 157: Messaggistica interna classificata ABAC

Data: 2026-08-09

---

## Stato: implementato

---

## File modificato

`frontend/src/pages/messaggi/MessaggiPage.tsx`

API e tipi erano già completi dalla sessione precedente:
- `internalMessageApi.listThreads()` → già supportava `classification_code`
- `internalMessageApi.participantOptions()` → già supportava `classification_code`
- `InternalMessageThread.classification_code/classification_label/document_classification` → già in `types/index.ts`
- `InternalMessageThreadWrite.classification_code` → già in `types/index.ts`

---

## Modifiche implementate

### 1. Costante CLASSIFICATIONS e helper badge

```tsx
const CLASSIFICATIONS = [
  { code: 'internal',    label: 'Interno',     cls: 'badge-light-secondary' },
  { code: 'restricted',  label: 'Riservato',   cls: 'badge-light-warning'   },
  { code: 'clinical',    label: 'Clinico',     cls: 'badge-light-danger'    },
  { code: 'judicial',    label: 'Giudiziario', cls: 'badge-light-primary'   },
]

function classificationBadge(code?: string | null) {
  const c = CLASSIFICATIONS.find((x) => x.code === code) ?? CLASSIFICATIONS[0]
  return <span className={`badge ${c.cls}`} style={{ fontSize: 10 }}>{c.label}</span>
}
```

### 2. Stato form — valore iniziale

`EMPTY_FORM.classification_code = 'internal'`

### 3. Filtro lista — Classificazione

Aggiunto `filterClassification` state. La barra filtri espone una `<select>` con opzione vuota ("Tutte") e le 4 classificazioni. Passato come `classification_code` a `listThreads()` se valorizzato.

### 4. Badge classificazione nella tabella

Ogni riga della lista mostra, nella colonna Tipo, due badge verticali:
1. Badge tipo thread (facility/minor — già presente)
2. Badge classificazione ABAC (nuovo)

### 5. Ricarica partecipanti al cambio classificazione

Il `useEffect` che carica i partecipanti disponibili nel modal dipende da `form.classification_code`. Quando cambia:
- La selezione `participant_user_ids` viene azzerata
- `participantOptions()` viene richiamato con il nuovo `classification_code`
- Il backend restituisce solo gli utenti autorizzati a quella classificazione

### 6. Select Classificazione nel modal "Nuova conversazione"

Nel blocco "Dati base", dopo il campo Tipo conversazione:

```tsx
<FormGroup>
  <Label className='col-form-label'>Classificazione</Label>
  <Input type='select' value={form.classification_code ?? 'internal'} invalid={!!fe('classification_code')}
    onChange={(e) => { setF('classification_code', e.target.value); setF('participant_user_ids', []) }}>
    {CLASSIFICATIONS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
  </Input>
  {fe('classification_code') && <div className='invalid-feedback d-block'>{fe('classification_code')}</div>}
  <div className='form-text'>Cambiando classificazione i partecipanti verranno rifiltrati automaticamente.</div>
</FormGroup>
```

### 7. Errore inline classification_code

L'errore 422 su `classification_code` (es. "La classificazione selezionata non è consentita per il tuo profilo o per il contesto scelto.") viene mostrato inline sotto la select, tramite `fe('classification_code')`.

---

## Checklist QA

- [x] creazione thread senza `classification_code` → backend usa `internal` (retrocompatibilità)
- [x] cambiando classificazione nel modal, la lista partecipanti si ricarica automaticamente
- [x] partecipante non autorizzato non appare nel multiselect se classificazione > `internal`
- [x] badge classificazione visibile in lista per ogni thread
- [x] filtro classificazione nella barra restringe la lista correttamente
- [x] errore 422 `classification_code` mostrato inline sotto la select
- [x] errore 422 `participant_user_ids` (utente non autorizzato) mostrato inline sotto la lista partecipanti
