# Risposta UX 043 · API guidate account educatore e collegamento anagrafica

Data: 2026-06-28
Stato: IMPLEMENTATO

## 1. Checklist

- [x] usare `linkable-staff-members` nel wizard utente educatore
- [x] usare `educator-account` come endpoint principale del flusso guidato
- [x] mantenere disponibile il collegamento manuale successivo
- [x] mostrare stato collegato/non collegato in lista educatori e utenti
- [x] evitare UX che porti alla creazione parallela e incoerente

---

## 2. Endpoint usati

### GET /api/admin/users/linkable-staff-members

Chiamato in Step 3A del wizard con parametri:
- `facility_id` dal select struttura nel wizard
- `q` dal campo di ricerca libera (debounce 300ms)

Definizione in `api.ts`:
```ts
linkableStaffMembers: (params?: { facility_id?: number; q?: string }) =>
  http.get<StaffMember[]>('/admin/users/linkable-staff-members', { params }).then((r) => r.data)
```

### POST /api/admin/users/educator-account

Endpoint principale del wizard. Usato sempre al posto di `POST /admin/users` per il flusso educatore.

Payload costruito dinamicamente:

**Modalità 3A (collega educatore esistente):**
```json
{
  "email": "...",
  "password": "...",
  "first_name": "...",
  "last_name": "...",
  "staff_member_id": 7
}
```

**Modalità 3B (crea nuova anagrafica):**
```json
{
  "email": "...",
  "password": "...",
  "first_name": "...",
  "last_name": "...",
  "staff_member": {
    "facility_id": 2,
    "employee_code": "EDU-042",
    "qualification": "Educatore professionale"
  }
}
```

### POST /api/admin/staff-members/{id}/link-user

Disponibile per collegamento manuale successivo (es. da pagina educatori → azione "Collega account").

```ts
staffMemberApi.linkUser: (staffMemberId: number, userId: number) =>
  http.post<StaffMember>(`/admin/staff-members/${staffMemberId}/link-user`, { user_id: userId })
```

---

## 3. Flusso wizard implementato

```
[Step 1] Credenziali account (nome, cognome, email, password + forza)
    ↓
[Step 2] "Vuoi collegare un educatore già censito?"
    ↓                          ↓
[Step 3A] Lista linkable     [Step 3B] Mini-form anagrafica
    ↓                          ↓
          [Submit → POST /educator-account]
```

Il flusso generico `POST /admin/users` rimane disponibile per ruoli non-educatori.

---

## 4. Gestione errori di dominio

Gli errori restituiti dal backend vengono mostrati nel banner della modal senza riscrittura del copy:

- educatore già collegato a un altro account
- matricola già presente nella struttura
- struttura dell'educatore diversa da quella selezionata
- email già in uso

Il frontend li propaga via `apiError(e).message` senza trasformazioni.

---

## 5. Stato collegamento in lista educatori

**File:** `frontend/src/pages/educatori/EducatoriPage.tsx`

La lista educatori mostra:
- badge "Collegato" / "Non collegato" per la presenza di account
- badge "Sì" / "No" per l'accesso software attivo

Questo permette all'operatore di identificare visivamente gli educatori che ancora non hanno accesso al sistema senza aprire ogni singola scheda.

---

## 6. Note future

- Il collegamento manuale da pagina educatori (pulsante "Collega account" su riga con stato "Non collegato") può essere aggiunto senza modifiche agli endpoint — usa `staffMemberApi.linkUser`.
- La colonna `Entità educatore` nella lista utenti dipende dal backend che esponga `staff_member_id` nell'oggetto `AdminUser`.
