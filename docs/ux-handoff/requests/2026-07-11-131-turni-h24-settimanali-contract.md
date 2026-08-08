# Handoff UX/API - Modulo Turni H24, coperture e vista settimanale

Data: 2026-07-11  
Area: `Amministrazione > Turni`, `Educatori`, `Coordinamento struttura`  
Priorita: alta  
Tipo: nuova funzionalita backend + contratto UI

## 1. Obiettivo

Il backend espone ora il primo blocco operativo del modulo `Turni`:

- definizione dei modelli turno per struttura
- assegnazione operatori ai turni
- vista settimanale della copertura per struttura
- vista settimanale personale per l'operatore autenticato

Questo e il blocco base per una struttura H24. Il timesheet consuntivo verra dopo; qui siamo sulla pianificazione.

## 2. Modello concettuale

### 2.1 Modello turno struttura

Un modello turno rappresenta una fascia standard ripetibile della struttura:

- esempio: `mattina`, `pomeriggio`, `notte`
- ogni modello e legato a una sola struttura
- ha:
  - `code`
  - `name`
  - `start_time`
  - `end_time`
  - `minimum_staff_required`
  - `sort_order`
  - `is_active`

### 2.2 Assegnazione turno

Una assegnazione collega:

- struttura
- modello turno
- operatore (`staff_member`)
- data del turno
- finestra effettiva calcolata (`starts_at`, `ends_at`)
- stato
- note

Il backend calcola `starts_at` e `ends_at` dal modello turno e dalla data scelta.

## 3. Regole backend da riflettere in UI

- il modello turno deve appartenere alla stessa struttura dell'assegnazione
- l'operatore deve appartenere alla stessa struttura dell'assegnazione
- non sono ammessi turni sovrapposti per lo stesso operatore
- un modello turno non si puo eliminare se ha assegnazioni collegate

## 4. Stati assegnazione

Valori supportati:

- `planned`
- `confirmed`
- `completed`
- `cancelled`

UX non deve inventare altri valori.

## 5. Endpoint da usare

### 5.1 Modelli turno struttura

- `GET /api/admin/staff-shift-templates`
- `POST /api/admin/staff-shift-templates`
- `GET /api/admin/staff-shift-templates/{shift_template}`
- `PUT /api/admin/staff-shift-templates/{shift_template}`
- `DELETE /api/admin/staff-shift-templates/{shift_template}`

Query supportate in lista:

- `facility_id`
- `is_active`

Payload create/update:

```json
{
  "facility_id": 1,
  "code": "NIGHT",
  "name": "Turno notte",
  "start_time": "22:00",
  "end_time": "06:00",
  "minimum_staff_required": 1,
  "sort_order": 30,
  "is_active": true
}
```

### 5.2 Assegnazioni turno

- `GET /api/admin/staff-shifts`
- `POST /api/admin/staff-shifts`
- `GET /api/admin/staff-shifts/{shift_assignment}`
- `PUT /api/admin/staff-shifts/{shift_assignment}`
- `DELETE /api/admin/staff-shifts/{shift_assignment}`

Query supportate:

- `facility_id`
- `staff_member_id`
- `shift_template_id`
- `date_from`
- `date_to`

Payload create/update:

```json
{
  "facility_id": 1,
  "shift_template_id": 4,
  "staff_member_id": 21,
  "shift_date": "2026-07-13",
  "status": "planned",
  "notes": "Copertura ferie collega"
}
```

### 5.3 Vista settimanale struttura

- `GET /api/admin/staff-shifts/week?facility_id=1&week_start=2026-07-13`

La risposta contiene:

- `facility_id`
- `week_start`
- `week_end`
- `days[]`

Per ogni giorno:

- `date`
- `shifts[]`

Per ogni blocco turno:

- `shift_template`
- `minimum_staff_required`
- `assigned_count`
- `coverage_gap`
- `assignments[]`

### 5.4 Vista settimanale personale

- `GET /api/staff-shifts/my-week?week_start=2026-07-13`

Risposta:

- `staff_member`
- `week_start`
- `week_end`
- `assignments[]`

Se l'utente non e collegato a nessun `staff_member`, il backend risponde `404`.

## 6. Permessi da rispettare

Possono gestire modelli e assegnazioni:

- `SUPER_ADMIN`
- `ADMIN_IT`
- `DIRETTORE`
- `COORDINATORE`
- `REFERENTE_STRUTTURA`

Permessi tecnici:

- `staff_shift_templates.create/read/update/delete`
- `staff_shift_assignments.create/read/update/delete`

Possono leggere la propria settimana se collegati a un operatore:

- `EDUCATORE`
- `EDUCATORE_NOTTURNO`
- `PSICOLOGO`
- ruoli di coordinamento che hanno `staff_shift_assignments.read`

## 7. Cosa deve fare UX

### A. Pagina `Modelli turno`

Tabella con:

- struttura
- codice
- nome
- fascia oraria
- minimo richiesto
- stato attivo
- azioni modifica/elimina

Form:

- `facility`
- `code`
- `name`
- `start_time`
- `end_time`
- `minimum_staff_required`
- `sort_order`
- `is_active`

### B. Pagina `Pianificazione settimanale`

Filtri:

- struttura
- settimana

Vista consigliata:

- griglia settimanale
- per ogni giorno un blocco per ogni turno attivo

Ogni blocco deve mostrare:

- nome turno
- fascia oraria
- minimo richiesto
- numero assegnato
- gap copertura
- operatori assegnati

Colori consigliati:

- verde = copertura completa
- giallo = copertura parziale
- rosso = scopertura

### C. Pagina `Le mie settimane`

Vista personale per operatore autenticato:

- filtro settimana
- lista/card per giorno
- fascia oraria
- nome turno
- struttura
- stato
- note

Non mostrare dati di altri operatori.

## 8. Box informazioni da inserire

Titolo suggerito:

- `Come funziona la pianificazione turni`

Testo:

- i modelli turno definiscono le fasce standard della struttura
- la pianificazione assegna operatori ai turni nei singoli giorni
- il sistema evidenzia il gap tra minimo richiesto e personale assegnato
- la vista personale mostra solo i turni del proprio profilo operatore

## 9. QA minimo frontend

- creare un modello turno per una struttura
- modificare il minimo richiesto
- assegnare due operatori allo stesso turno/giorno
- verificare `assigned_count` e `coverage_gap`
- verificare blocco validazione su sovrapposizione stesso operatore
- verificare vista personale con utente educatore collegato
- verificare che la vista personale non mostri turni di altri operatori

## 10. Limite funzionale attuale

Questo modulo non e ancora timesheet.

Non introdurre in UI:

- timbrature
- straordinari
- firma fine turno
- consuntivo paghe
