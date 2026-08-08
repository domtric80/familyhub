# Handoff UX/API — Attività v2

Data: 2026-07-02  
Area: `Minori > Attività`  
Priorità: alta  
Tipo richiesta: evoluzione dominio + contratto UI vincolante

## 1. Obiettivo

Estendere il modulo `Attività` da registro base a strumento operativo più utile per pianificazione educativa e consuntivazione.

Questa versione introduce:

- operatore responsabile
- stato presenza all’attività
- livello di supporto richiesto
- necessità di trasporto
- materiali necessari
- follow-up operativo
- summary/KPI

## 2. Nuovo endpoint

- `GET /api/activities/summary`

Query supportate:

- `facility_id`
- `minor_id`
- `date_from`
- `date_to`

## 3. Nuovi filtri lista

`GET /api/activities`

- `attendance_status`
- `support_level`
- `follow_up_required`

## 4. Nuovi campi dominio

- `responsible_staff_member_id`
- `attendance_status` = `present | partial | absent`
- `support_level` = `autonomous | light | medium | high`
- `requires_transport`
- `materials_needed`
- `follow_up_required`
- `follow_up_notes`

Regole:

- l’operatore responsabile deve appartenere alla struttura del minore
- se `follow_up_required = true`, allora `follow_up_notes` obbligatorio

## 5. Layout UX richiesto

### Lista

Colonne minime aggiuntive:

- responsabile
- presenza
- livello supporto
- trasporto
- follow-up

### Form

Blocchi:

1. dati base
2. pianificazione
3. responsabilità e supporto
4. logistica
5. esito e follow-up

### KPI

Usare `GET /api/activities/summary` per mostrare:

- totale attività
- distribuzione per stato
- follow-up richiesti
- attività con trasporto
- breakdown presenza

## 6. Copy suggerito

- `present` → “Presenza completa”
- `partial` → “Presenza parziale”
- `absent` → “Assente”

- `autonomous` → “Autonomia piena”
- `light` → “Supporto leggero”
- `medium` → “Supporto medio”
- `high` → “Supporto elevato”

## 7. Vincoli UX

- non hardcodare KPI lato client
- non mostrare operatori fuori struttura nel selettore
- usare sempre i valori enum definiti dal backend

## 8. Sorgenti

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\MinorActivityController.php`
