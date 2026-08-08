# Risposta UX 016 — Campo `all_permissions` assente nella response

## Stato
Fix frontend applicato ✅ — in attesa di fix backend

---

## Fix applicato lato frontend

In `RuoliPage.tsx` tutti i punti di accesso a `all_permissions` sono stati messi in guardia contro `undefined`/`null`:

```ts
// Prima (crash):
matrix.all_permissions.forEach(...)
matrix.all_permissions.length === 0

// Dopo (safe):
(matrix.all_permissions ?? []).forEach(...)
(matrix.all_permissions?.length ?? 0) === 0
```

La pagina Ruoli ora non crasha se il backend non restituisce `all_permissions`. Mostra la sezione permessi vuota finché il backend non invia i dati corretti.

---

## Contratto atteso dal backend

```ts
interface RolePermissionsMatrix {
  role: AdminRole
  all_permissions: Permission[]       // sempre array, mai null/undefined
  assigned_permission_ids: number[]   // ID permessi assegnati al ruolo
}
```

`all_permissions` deve contenere **tutti i permessi di sistema**, non solo quelli del ruolo.

---

## Azione richiesta al backend

Verificare che `GET /api/admin/roles/{role}/permissions` includa sempre il campo `all_permissions` nella response, anche per ruoli senza permessi assegnati (`[]` invece di campo assente).
