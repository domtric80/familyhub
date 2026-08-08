# UX Handoff Response — Task 077, 078, 079
## Contratti relazionali documenti: stati staff, classificazione minore, enti rilascio

**Data risposta:** 2026-07-02  
**Task di riferimento:** 077, 078, 079  
**File modificati/creati:** 7  

---

## Task 077 — Stati documenti staff

### Nuovi tipi TypeScript

**File:** `frontend/src/types/index.ts`

```ts
interface StaffDocumentStatus {
  id: number; code: string; name: string
  description?: string | null; sort_order?: number | null; is_active: boolean
}

interface StaffDocument {
  id: number; staff_member_id: number; document_type_id: number; attachment_id?: number | null
  status?: string | null
  status_code?: string | null; status_label?: string | null
  status_lookup?: { id: number; code: string; name: string } | null
  document_type?: { id: number; name: string } | null; attachment?: Attachment | null
}
```

### API

**File:** `frontend/src/services/api.ts`

- `lookupsApi.staffDocumentStatuses()` → `GET /api/lookups/staff-document-statuses`
- `adminStaffDocumentStatusApi` CRUD completo su `/api/admin/staff-document-statuses`

### Nuova pagina: Stati documenti staff

**File:** `frontend/src/pages/anagrafiche/StatiDocumentiStaffPage.tsx`

Pattern identico a `StatiOperatoriPage`. Gestione 409 su delete (stato in uso).

**Route:** `/anagrafiche/stati-documenti-staff`  
**Sidebar:** voce "Stati doc. staff" aggiunta in `menuItems.ts`

---

## Task 078 — Classificazione documento minore relazionale

### Tipo aggiornato

**File:** `frontend/src/types/index.ts`

`MinorDocument` aggiornato:
```ts
classification?: string | null         // legacy, opzionale
classification_code?: string | null    // campo canonico
classification_label?: string | null   // label pronta UI
document_classification?: { id: number; code: string; name: string } | null
```

### Tab Documenti minore

**File:** `frontend/src/pages/minori/MinoreDetailPage.tsx`

- Upload invia `classification_code` (non più `classification`)
- Tabella: mostra `classification_label ?? document_classification?.name ?? classification`
- Badge usa `classification_code ?? classification` come chiave colore

---

## Task 079 — Enti rilascio documenti relazionale

### Nuovo tipo

**File:** `frontend/src/types/index.ts`

```ts
interface DocumentIssuer {
  id: number; code: string; name: string
  description?: string | null; sort_order?: number | null; is_active: boolean
}
```

`MinorDocument` aggiornato:
```ts
document_issuer_id?: number | null
issuer_label?: string | null
document_issuer?: DocumentIssuer | null
```

### API

- `lookupsApi.documentIssuers()` → `GET /api/lookups/document-issuers`
- `adminDocumentIssuerApi` CRUD completo su `/api/admin/document-issuers`

### Tab Documenti minore

**File:** `frontend/src/pages/minori/MinoreDetailPage.tsx`

- Upload: se il lookup è disponibile → `<select>` su `document_issuer_id`; se vuoto → fallback `issued_by` text input
- Upload invia `document_issuer_id` (preferito) oppure `issued_by` (legacy)
- Tabella: mostra `issuer_label ?? document_issuer?.name ?? issued_by ?? '—'`

### Nuova pagina: Enti rilascio

**File:** `frontend/src/pages/anagrafiche/EntiRilascioPage.tsx`

Pattern identico a `StatiOperatoriPage`. Gestione 409 su delete (ente in uso da documenti).

**Route:** `/anagrafiche/enti-rilascio`  
**Sidebar:** voce "Enti rilascio" aggiunta in `menuItems.ts`

---

## Note tecniche

- Tutti i 7 file: 0 errori di parsing
- `classification` legacy mantenuto in `MinorDocument` come opzionale per retrocompat. di lettura
- `issued_by` legacy mantenuto nel payload come fallback se lookup non popolato
- `attachment.security_status` invariato (piano distinto da `staff_document.status_code`)
