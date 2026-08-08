# Risposta UX 039 — Educatori anagrafica + separazione da utenti/ruoli

Data: 2026-06-28
Stato: GIÀ IMPLEMENTATO — verificato sul codice reale

---

## Verifica checklist 039

| Requisito | File | Stato |
|-----------|------|-------|
| Placeholder rimosso | `EducatoriPage.tsx` — pagina CRUD completa operativa | ✅ |
| Lista CRUD presente | Tabella con colonne: codice, nome, struttura, utente collegato, qualifica, stato | ✅ |
| Filtri struttura/stato presenti | Due select in alto: struttura e stato (active/inactive/suspended) | ✅ |
| Select utente collegato presente | Select opzionale in modal — filtra utenti già collegati ad altri educatori | ✅ |
| Nessuna UI permessi dentro Educatori | Banner informativo: "I permessi si gestiscono in Utenti / Assegnazioni / Ruoli" | ✅ |
| Copy coerente con separazione anagrafica vs accesso | Copy esplicito nel header card e nell'alert | ✅ |

## Componenti verificati

### `EducatoriPage.tsx` (`/educatori`)
- CRUD completo: crea, modifica, elimina
- Filtri per struttura e stato con ricarica automatica
- Modal size `lg` con tutti i campi: codice, nome, cognome, data nascita, città nascita, CF, email, telefono, qualifica, stato
- Select utente collegato opzionale — mostra solo utenti liberi (non già collegati ad altri educatori)
- Gestione 403, 409 (educatore con documenti), 422 per-campo

### `staffMemberApi` (`api.ts` riga 192)
- `list(params?)` → `GET /admin/staff-members`
- `get(id)` → `GET /admin/staff-members/{id}`
- `create(data)` → `POST /admin/staff-members`
- `update(id, data)` → `PUT /admin/staff-members/{id}`
- `delete(id)` → `DELETE /admin/staff-members/{id}`

### Tipi (`types/index.ts`)
- `StaffMember` (riga 223) ✅
- `StaffMemberWrite` (riga 242) ✅

### Routing e menu
- Route: `<Route path='/educatori' element={<EducatoriPage />} />` ✅
- Menu: voce `Educatori` nel menu principale ✅

## Separazione architetturale rispettata

| Concetto | Dove si gestisce |
|----------|-----------------|
| Anagrafica personale educativo | Pagina Educatori (`/educatori`) |
| Accesso al software | Pagina Utenti (`/admin/utenti`) |
| Permessi operativi | Pagina Ruoli (`/admin/ruoli`) |
| Assegnazione educatore ↔ minore | Pagina Assegnazioni (`/admin/assegnazioni`) |
| Collegamento educatore ↔ utente | Select opzionale dentro Educatori |

---

## Build

TypeScript 0 errori.
