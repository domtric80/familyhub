# FamilyHub · Segnalazione UX → Backend 016 · Campo `all_permissions` assente nella response GET /admin/roles/{role}/permissions

Data: 2026-06-21  
Priorità: Alta  
Mittente: Team UX  
Destinatario: Team Backend

---

## Problema riscontrato

Quando l'utente seleziona un ruolo nella pagina **Anagrafiche > Ruoli** e il frontend chiama:

```
GET /api/admin/roles/{role}/permissions
```

la response manca del campo `all_permissions` (risulta `undefined`), causando il crash:

```
TypeError: Cannot read properties of undefined (reading 'forEach')
    at grouped (RuoliPage.tsx:114)
```

## Comportamento atteso

La response deve seguire il contratto `RolePermissionsMatrix`:

```ts
interface RolePermissionsMatrix {
  role: AdminRole
  all_permissions: Permission[]       // lista COMPLETA di tutti i permessi di sistema
  assigned_permission_ids: number[]   // ID dei permessi già assegnati al ruolo
}
```

`all_permissions` deve sempre essere un array (vuoto `[]` se non ci sono permessi configurati, mai `null` o assente).

## Fix temporaneo lato frontend

Il frontend è stato aggiornato per gestire `undefined`/`null` su `all_permissions` senza crashare — mostrerà semplicemente la sezione permessi vuota finché il backend non restituisce i dati corretti.

## Richiesta

Verificare che `GET /api/admin/roles/{role}/permissions` includa sempre `all_permissions` nella response, anche per ruoli senza permessi assegnati.
