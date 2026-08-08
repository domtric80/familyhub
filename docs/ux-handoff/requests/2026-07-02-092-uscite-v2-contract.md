# Uscite v2 - KPI operativi, rientro strutturato e alert ritardo

- `Request ID`: 2026-07-02-092
- `Stato`: OPEN
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Obiettivo

Il modulo `Uscite` viene esteso con tre capacità backend da usare obbligatoriamente in UX:

1. KPI e summary backend
2. rientro strutturato con classificazione esito
3. alert di ritardo e follow-up

Il frontend non deve ricostruire questi indicatori lato client.

## 2. Endpoint coinvolti

- `GET /api/exits`
- `GET /api/exits/summary`
- `POST /api/exits`
- `PUT /api/exits/{exit}`
- `PATCH /api/exits/{exit}`
- `POST /api/exits/{exit}/mark-out`
- `POST /api/exits/{exit}/mark-returned`
- `POST /api/exits/{exit}/cancel`

## 3. Nuovi campi dominio

Campi ora disponibili sul record uscita:

- `return_condition`
  - valori ammessi: `regular`, `delayed`, `critical`
- `follow_up_required`
  - boolean
- `follow_up_notes`
  - testo guidato
- `is_overdue`
  - boolean calcolato dal backend
- `delay_minutes`
  - intero calcolato dal backend quando il rientro supera l'orario atteso

## 4. Regole operative

### 4.1 Ritardo

Un'uscita è `is_overdue = true` quando:

- `status = out`
- esiste `expected_return_at`
- il minore non è ancora rientrato
- `expected_return_at` è nel passato

### 4.2 Rientro strutturato

Quando UX usa `POST /api/exits/{exit}/mark-returned`, può inviare:

- `actual_return_at`
- `return_condition`
- `follow_up_required`
- `follow_up_notes`
- `outcome_notes`

Se `follow_up_required = true`, il backend valida anche `follow_up_notes`.

### 4.3 Filtri lista

`GET /api/exits` supporta ora anche:

- `follow_up_required`
- `return_condition`

## 5. Summary backend

### `GET /api/exits/summary`

Parametri supportati:

- `facility_id` opzionale
- `minor_id` opzionale

Response:

```json
{
  "summary": {
    "total": 12,
    "planned": 3,
    "out": 2,
    "returned": 6,
    "cancelled": 1,
    "overdue_open": 1,
    "follow_up_required": 2,
    "delayed_returns": 2,
    "critical_returns": 0
  }
}
```

UX deve usare questo endpoint per:

- card KPI in alto pagina
- contatore ritardi aperti
- contatore follow-up
- alert operativi

## 6. Requisiti UX obbligatori

### 6.1 Lista uscite

Aggiungere:

- badge o indicatore visuale per `is_overdue`
- colonna o pillola per `return_condition`
- colonna o icona per `follow_up_required`

### 6.2 Form crea/modifica

Nel form standard, i nuovi campi possono stare nella sezione `Rientro / Esito`, ma devono essere presenti almeno in modifica.

### 6.3 Azione “Segna rientro”

La modale di `mark-returned` deve mostrare:

- data/ora rientro
- esito rientro (`return_condition`)
- toggle `follow_up_required`
- textarea `follow_up_notes`
- textarea `outcome_notes`

Se il toggle follow-up è attivo e le note sono vuote, UX deve mostrare errore backend `422`.

## 7. Audit e storico

Il backend registra summary parlanti anche per:

- partenza effettiva
- rientro
- annullamento

UX non deve ricostruire frasi locali: usare il testo audit/storico restituito dal backend.

## 8. Checklist UX

- [ ] usare `GET /api/exits/summary` per i KPI
- [ ] mostrare alert su `is_overdue`
- [ ] mostrare `return_condition`
- [ ] mostrare `follow_up_required`
- [ ] completare modale `mark-returned` con tutti i nuovi campi
- [ ] non inventare KPI o ritardo lato frontend
- [ ] gestire `422` su `follow_up_notes`
