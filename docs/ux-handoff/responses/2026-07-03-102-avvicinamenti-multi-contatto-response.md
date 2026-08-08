# Risposta UX handoff — Task 102
# Avvicinamenti multi-contatto

Data: 2026-07-03
File: `types/index.ts`, `pages/avvicinamenti/AvvicinamentiPage.tsx`, `pages/minori/tabs/AvvicinamentiMinoreTab.tsx`

---

## Stato: ✅ Implementato

### Tipi aggiornati (`types/index.ts`)

**`Approach`** — aggiunti:
- `minor_contact_ids?: number[] | null`
- `minor_contacts_count?: number | null`
- `minor_contacts?: { id: number; first_name: string; last_name: string }[] | null`

**`ApproachWrite`** — aggiunto:
- `minor_contact_ids?: number[]`

Il campo `minor_contact_id` rimane per retrocompatibilità.

### Form creazione / modifica

Entrambe le pagine (globale e tab minore) usano ora un **elenco di checkbox** al posto della select singola:

- Label: `Contatti coinvolti`
- Ogni contatto del minore selezionato è una checkbox
- Il campo scrive `minor_contact_ids: []` nel payload
- In edit, pre-seleziona con: `item.minor_contact_ids ?? (item.minor_contact_id ? [item.minor_contact_id] : [])`

### Tabella lista

Colonna `Contatti` mostra:
- `Rossi Mario` se un solo contatto
- `Rossi Mario +1` se più contatti (badge `badge-light-secondary`)
- `—` se nessun contatto

Fonte dati: `item.minor_contacts ?? (item.minor_contact ? [item.minor_contact] : [])`

### Dettaglio

Blocco dedicato **Contatti coinvolti** mostra elenco completo di tutti i contatti associati.

### Retrocompatibilità

- Record con solo `minor_contact_id`: visualizzazione corretta via fallback
- Nuovi record: scritti sempre con `minor_contact_ids`

### Build TypeScript

0 errori. ✅
