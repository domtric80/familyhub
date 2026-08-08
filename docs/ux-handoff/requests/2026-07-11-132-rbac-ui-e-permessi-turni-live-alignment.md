# Handoff UX/API - Allineamento live permessi Turni + editor RBAC

Data: 2026-07-11  
Priorita: alta  
Ambito: `Ruoli`, `Turni`, `Matrice permessi`

## 1. Problema rilevato

Nel DB live locale c'era uno scostamento reale tra:

- permessi dichiarati nel backend
- permessi effettivamente presenti nel database della sessione corrente

Effetto osservato:

- `DIRETTORE`, `COORDINATORE`, `REFERENTE_STRUTTURA` non potevano usare correttamente la parte `Turni`
- la UI RBAC poteva risultare non funzionante o parzialmente vuota

## 2. Stato corretto backend

### 2.1 Turni

I ruoli seguenti devono risultare abilitati ai permessi del modulo turni:

- `DIRETTORE`
- `COORDINATORE`
- `REFERENTE_STRUTTURA`

Permessi attesi:

- `staff_shift_templates.create`
- `staff_shift_templates.read`
- `staff_shift_templates.update`
- `staff_shift_assignments.create`
- `staff_shift_assignments.read`
- `staff_shift_assignments.update`

Per `DIRETTORE` risultano anche:

- `staff_shift_templates.delete`
- `staff_shift_assignments.delete`

### 2.2 Matrice RBAC UI

L'endpoint:

- `GET /api/admin/roles/{role}/permissions`

ora restituisce entrambi i campi:

- `permissions`
- `all_permissions`

`all_permissions` e un alias retrocompatibile da usare se il frontend storico lo aspetta ancora.

## 3. Response minima attesa

```json
{
  "role": { "id": 1, "code": "COORDINATORE" },
  "permissions": [],
  "all_permissions": [],
  "assigned_permission_ids": []
}
```

## 4. Impatto UX

### Pagina Turni

Non trattare piu come assenza di capability backend:

- creazione modello turno
- lettura modelli turno
- pianificazione turni struttura

Se la UI continua a nascondere CTA o schermate per `COORDINATORE` / `DIRETTORE`, il problema e frontend o cache stato utente.

### Pagina Ruoli

Per la matrice permessi:

- usare `all_permissions` se il codice UI legacy lo richiede
- in alternativa usare `permissions`
- non assumere che uno dei due manchi

Fallback raccomandato:

```ts
const allPermissions = response.all_permissions ?? response.permissions ?? []
```

## 5. Nota di policy

Questo handoff non ridefinisce da solo la policy organizzativa su chi puo modificare RBAC.

Ad oggi:

- il backend espone l'editor permessi ruolo
- la compatibilita payload per la UI e presente

Se una specifica schermata continua a risultare non editabile per un ruolo, distinguere:

1. `problema tecnico UI`
2. `scelta di policy sul ruolo`

