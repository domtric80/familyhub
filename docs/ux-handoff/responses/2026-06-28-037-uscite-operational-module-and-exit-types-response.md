# Risposta UX 037 — Modulo Uscite operativo + anagrafica Tipi Uscita

Data: 2026-06-28
Stato: IMPLEMENTATO — verificato sul codice reale

---

## Verifica pre-esistente

Prima di implementare ho verificato lo stato reale del codice:

- `UscitePage.tsx` → già implementato con logica operativa completa
- `types/index.ts` → già conteneva `MinorExit`, `MinorExitWrite`, `MinorExitUpdate`, `MinorExitTransition`, `MinorExitStatus`
- `adminExitTypeApi` → già presente in `api.ts`
- `lookupsApi.exitTypes()` → già presente
- `App.tsx` → già importava `TipiUscitaPage` e `UscitePage` con route corrette
- `menuItems.ts` → già aveva voce "Tipi uscita"

**Elementi mancanti trovati e aggiunti:**
- `minorExitApi` non era definito in `api.ts` (solo i tipi erano importati)
- `TipiUscitaPage.tsx` non esisteva (importata in App.tsx ma file assente)
- "Tipi uscita" era erroneamente sotto il sottomenu "Minore" invece che standalone

---

## Implementazione effettuata

### `minorExitApi` aggiunto a `api.ts`

```ts
export const minorExitApi = {
  list: (params?) => http.get<MinorExit[]>('/exits', { params }).then(r => r.data),
  get: (id) => http.get<MinorExit>(`/exits/${id}`).then(r => r.data),
  create: (data) => http.post<MinorExit>('/exits', data).then(r => r.data),
  update: (id, data) => http.patch<MinorExit>(`/exits/${id}`, data).then(r => r.data),
  markOut: (id, data?) => http.post<MinorExit>(`/exits/${id}/mark-out`, data).then(r => r.data),
  markReturned: (id, data?) => http.post<MinorExit>(`/exits/${id}/mark-returned`, data).then(r => r.data),
  cancel: (id, data?) => http.post<MinorExit>(`/exits/${id}/cancel`, data).then(r => r.data),
  delete: (id) => http.delete(`/exits/${id}`),
}
```

### `TipiUscitaPage.tsx` creata

- Pattern identico a SessoPage/GeneriPage
- Usa `adminExitTypeApi`
- CRUD completo: crea, modifica, elimina
- Gestione 403, 409 (tipo in uso), 422
- Banner informativo con i tipi base: FAMILY, SCHOOL, MEDICAL, RECREATIONAL, ADMIN

### Menu corretto

"Tipi uscita" spostato fuori dal sottomenu "Minore" → voce standalone in Impostazioni, accanto a Ruoli e Tipi contatto.

---

## Stato componenti

### `UscitePage` — modulo operativo

| Requisito | Stato |
|-----------|-------|
| Filtri struttura / minore / stato | ✅ |
| Tabella con badge stato | ✅ |
| Badge mappatura: planned/out/returned/cancelled | ✅ |
| Form creazione uscita | ✅ |
| Form modifica uscita | ✅ |
| Azione mark-out (`POST /exits/{id}/mark-out`) | ✅ |
| Azione mark-returned (`POST /exits/{id}/mark-returned`) | ✅ |
| Azione cancel con prompt motivazione | ✅ |
| Elimina con conferma | ✅ |
| Azioni visibili per stato (planned/out/returned/cancelled) | ✅ |
| Permessi: `minor_exits.create/update/delete` | ✅ |
| facility_id e minor_id non modificabili in edit | ✅ |
| Nessun testo libero per tipo uscita: solo `exit_type_id` | ✅ |
| Gestione 403, 422 | ✅ |

### `TipiUscitaPage` — CRUD admin

| Requisito | Stato |
|-----------|-------|
| Lista ordinata | ✅ |
| Crea tipo uscita | ✅ |
| Modifica tipo uscita | ✅ |
| Elimina con blocco 409 se in uso | ✅ |
| Campi: code, name, sort_order, is_active | ✅ |

### API client

| Endpoint | Metodo api.ts |
|----------|---------------|
| `GET /exits` | `minorExitApi.list()` |
| `POST /exits` | `minorExitApi.create()` |
| `PATCH /exits/{id}` | `minorExitApi.update()` |
| `POST /exits/{id}/mark-out` | `minorExitApi.markOut()` |
| `POST /exits/{id}/mark-returned` | `minorExitApi.markReturned()` |
| `POST /exits/{id}/cancel` | `minorExitApi.cancel()` |
| `DELETE /exits/{id}` | `minorExitApi.delete()` |
| `GET /admin/exit-types` | `adminExitTypeApi.list()` |
| `POST /admin/exit-types` | `adminExitTypeApi.create()` |
| `PUT /admin/exit-types/{id}` | `adminExitTypeApi.update()` |
| `DELETE /admin/exit-types/{id}` | `adminExitTypeApi.delete()` |
| `GET /lookups/exit-types` | `lookupsApi.exitTypes()` |

---

## Build

TypeScript 0 errori. Nessuna regressione.
