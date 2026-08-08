# FamilyHub · Modulo Attività

Data: 2026-06-28
Stato: backend MVP operativo

## 1. Obiettivo

Gestire attività educative, ricreative e terapeutiche riferite al minore.

## 2. Modello

### Anagrafica

- `activity_types`

### Operativo

- `minor_activities`

## 3. Regola autorizzativa

- RBAC governa accesso al modulo
- visibilità filtrata dal perimetro minore già attivo
- nessun testo libero per il tipo attività

## 4. API esposte

- `GET /api/lookups/activity-types`
- `GET /api/admin/activity-types`
- `POST /api/admin/activity-types`
- `GET /api/admin/activity-types/{activity_type}`
- `PUT /api/admin/activity-types/{activity_type}`
- `DELETE /api/admin/activity-types/{activity_type}`
- `GET /api/activities`
- `POST /api/activities`
- `GET /api/activities/{activity}`
- `PUT /api/activities/{activity}`
- `PATCH /api/activities/{activity}`
- `DELETE /api/activities/{activity}`
