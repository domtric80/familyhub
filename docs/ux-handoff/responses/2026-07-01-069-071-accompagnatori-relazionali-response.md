# UX Handoff Response — Task 069–071
## Accompagnatori uscita: modello relazionale, endpoint opzioni, audit parlante

**Data risposta:** 2026-07-01  
**Task di riferimento:** 069, 070, 071  
**File modificati:** 4  

---

## Task 069 — Accompagnatori con modello relazionale

### Cambio di paradigma

Il campo `accompanied_by` (stringa legacy) non viene più usato come fonte primaria.  
Il frontend ora scrive e legge `accompaniers[]` — l'array relazionale strutturato.

Il campo `accompanied_by` rimane visibile come fallback di lettura per uscite pregresse che non abbiano ancora l'array strutturato.

### Nuovi tipi TypeScript

**File:** `frontend/src/types/index.ts`

```ts
interface ExitAccompanier {
  id?: number
  person_type: 'staff_member' | 'minor_contact' | 'external'
  staff_member_id?: number | null
  minor_contact_id?: number | null
  external_name?: string | null
  display_name?: string | null
  staff_member?: { id: number; first_name: string; last_name: string } | null
  minor_contact?: { id: number; first_name: string; last_name: string; contact_type?: ... } | null
}

interface ExitAccompanierWrite {
  person_type: 'staff_member' | 'minor_contact' | 'external'
  staff_member_id?: number | null
  minor_contact_id?: number | null
  external_name?: string | null
}

interface ExitAccompanierOptions {
  minor: { id, internal_code, first_name, last_name, facility_id }
  facility: { id, code, name }
  staff_members: StaffMember[]
  minor_contacts: MinorContact[]
}
```

`MinorExit` aggiornato con `accompaniers?: ExitAccompanier[] | null`  
`MinorExitWrite` e `MinorExitUpdate` aggiornati con `accompaniers?: ExitAccompanierWrite[]`

### Payload inviato

```json
{
  "minor_id": 10,
  "exit_type_id": 1,
  "destination": "...",
  "accompaniers": [
    { "person_type": "staff_member",  "staff_member_id": 15 },
    { "person_type": "minor_contact", "minor_contact_id": 21 },
    { "person_type": "external",      "external_name": "Avv. Rossi" }
  ]
}
```

### Visualizzazione in lista

La colonna **Accompagnatori** nella tabella legge `item.accompaniers[]` con badge per tipo (`personale struttura`, `contatto minore`, `esterno`). Fallback a `item.accompanied_by` per record legacy.

---

## Task 070 — Endpoint opzioni accompagnatori

### Nuovo metodo API

**File:** `frontend/src/services/api.ts`

```ts
minorExitApi.getAccompanierOptions(minorId: number): Promise<ExitAccompanierOptions>
// → GET /api/exits/options/accompaniers?minor_id={id}
```

### Flusso nel form

1. Utente seleziona il **minore** → `useEffect` chiama `getAccompanierOptions(minor_id)`
2. La risposta popola `accompanierOptions` con `staff_members[]` e `minor_contacts[]`
3. Le select nel repeater usano solo queste opzioni (già filtrate per struttura del minore lato backend)
4. Cambio minore → reset `formAccompaniers` + reload opzioni

### Tipi di accompagnatore nel form

| Tipo | Input | Fonte opzioni |
|------|-------|--------------|
| `staff_member` | Select | `accompanierOptions.staff_members` |
| `minor_contact` | Select | `accompanierOptions.minor_contacts` |
| `external` | Testo libero | — |

Le select mostrano "Caricamento…" durante il fetch e sono disabilitate se non è stato selezionato il minore.

### Rimozione della logica precedente

La vecchia implementazione costruiva le opzioni personale via cross-join client-side tra `assignments[]` e `staffMembers[]`. Questa logica è stata rimossa: il backend ora restituisce le opzioni già contestualizzate tramite l'endpoint dedicato.

---

## Task 071 — Audit parlante accompagnatori

### Contesto

Il backend produce ora `operation_summary` leggibile per eventi `minor_exit` con accompagnatori. Questo campo è già visualizzato nell'Audit Log.

### Aggiunta al detail modal

**File:** `frontend/src/pages/admin/AuditPage.tsx`

Quando `resource_type === 'minor_exit'` e nei valori JSON sono presenti campi `accompaniers_before`/`accompaniers_after` (o `accompaniers`), il modal mostra una sezione strutturata leggibile con:

- **Prima** (in rosso) — lista accompagnatori con badge tipo + nome
- **Dopo** (in verde) — lista accompagnatori aggiornata

Il rendering usa `display_name` dalla risposta (nome già risolto lato backend), con fallback a `external_name` o ID grezzo.

### Esempio visuale

```
┌──────────────────────────────────────────────┐
│ Accompagnatori                               │
│                                              │
│ Prima                                        │
│  • [personale] Mario Rossi                   │
│  • [contatto]  Claudia Tutrice               │
│                                              │
│ Dopo                                         │
│  • [esterno]   Avv. Viola                    │
└──────────────────────────────────────────────┘
```

Il blocco appare solo se i dati sono presenti; non interferisce con la visualizzazione standard old/new JSON.

---

## Note tecniche

- Tutti i 4 file verificati con parser TSX TypeScript: 0 errori di parsing
- `accompanied_by` mantenuto in `MinorExitWrite`/`MinorExitUpdate` per retrocompatibilità — il backend lo valorizza automaticamente da `accompaniers[]`
- La logica client-side di cross-join assegnazioni×staff è stata rimossa da `UscitePage.tsx`
- Nessun componente nuovo — il repeater accompagnatori è inline nel form
