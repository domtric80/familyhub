# Handoff UX/API - Accompagnatori uscita con modello relazionale

Data: 2026-07-01
Priorita': alta
Ambito: frontend / UX / API / modulo Uscite

## 1. Obiettivo

Il modulo `Uscite` non deve piu' trattare gli accompagnatori come semplice stringa libera.

Il backend supporta ora un modello relazionale vero per gli accompagnatori dell'uscita, mantenendo il campo legacy `accompanied_by` come valore denormalizzato di supporto / retrocompatibilita'.

---

## 2. Stato backend

Implementato:

- nuova tabella relazionale `minor_exit_accompaniers`
- supporto `accompaniers[]` in `POST /api/exits`
- supporto `accompaniers[]` in `PUT /api/exits/{id}`
- ritorno degli accompagnatori nella risposta dell'uscita
- popolamento automatico del campo legacy `accompanied_by`

---

## 3. Modello dati

Ogni accompagnatore puo' essere di tre tipi:

### 3.1 `staff_member`

Usa:
- `staff_member_id`

### 3.2 `minor_contact`

Usa:
- `minor_contact_id`

### 3.3 `external`

Usa:
- `external_name`

---

## 4. Payload API

### 4.1 Create uscita

Endpoint:
- `POST /api/exits`

Nuovo payload supportato:

```json
{
  "facility_id": 2,
  "minor_id": 10,
  "exit_type_id": 1,
  "destination": "Visita specialistica",
  "planned_exit_at": "2026-07-01 10:00:00",
  "expected_return_at": "2026-07-01 12:00:00",
  "accompaniers": [
    {
      "person_type": "staff_member",
      "staff_member_id": 15
    },
    {
      "person_type": "minor_contact",
      "minor_contact_id": 21
    },
    {
      "person_type": "external",
      "external_name": "Avv. Rossi"
    }
  ]
}
```

### 4.2 Update uscita

Endpoint:
- `PUT /api/exits/{id}`
- `PATCH /api/exits/{id}`

Se `accompaniers` viene inviato, il backend sostituisce l'elenco corrente con il nuovo elenco.

---

## 5. Regole di validazione backend

### 5.1 `staff_member`

- `staff_member_id` obbligatorio
- lo staff member deve appartenere alla stessa struttura del minore

### 5.2 `minor_contact`

- `minor_contact_id` obbligatorio
- il contatto deve appartenere al minore corrente

### 5.3 `external`

- `external_name` obbligatorio

---

## 6. Risposta API

La risposta dell'uscita ora include:

- `accompanied_by` -> stringa legacy/denormalizzata
- `accompaniers` -> elenco strutturato

Esempio concettuale:

```json
{
  "id": 55,
  "destination": "Visita specialistica",
  "accompanied_by": "Mario Accompagnatore, Lucia Tutrice, Avv. Rossi",
  "accompaniers": [
    {
      "id": 1,
      "person_type": "staff_member",
      "staff_member_id": 15,
      "minor_contact_id": null,
      "external_name": null,
      "notes": null,
      "staff_member": {
        "id": 15,
        "first_name": "Mario",
        "last_name": "Accompagnatore"
      }
    },
    {
      "id": 2,
      "person_type": "minor_contact",
      "minor_contact_id": 21,
      "staff_member_id": null,
      "external_name": null,
      "minor_contact": {
        "id": 21,
        "first_name": "Lucia",
        "last_name": "Tutrice"
      }
    },
    {
      "id": 3,
      "person_type": "external",
      "external_name": "Avv. Rossi"
    }
  ]
}
```

---

## 7. Implicazioni UX

Frontend deve smettere di usare `accompanied_by` come fonte principale del dato.

Nuova regola:

- `accompaniers[]` = fonte strutturata vera
- `accompanied_by` = fallback legacy / testo di riepilogo

---

## 8. Comportamento UI consigliato

La UI di creazione/modifica uscita deve consentire di aggiungere accompagnatori di tre categorie:

1. personale interno (`staff_member`)
2. contatti del minore (`minor_contact`)
3. esterni (`external`)

Pattern consigliato:
- repeatable list / repeater
- scelta tipo accompagnatore
- campo dinamico coerente con il tipo scelto

---

## 9. Microcopy consigliato

### 9.1 Label sezione

- `Accompagnatori uscita`

### 9.2 Help text

> Puoi associare personale interno, contatti del minore o soggetti esterni. Gli accompagnatori vengono salvati in forma strutturata e non come semplice testo libero.

### 9.3 Nota legacy non da esporre come primaria

Il campo `accompanied_by` non deve piu' essere mostrato come campo editabile principale se la UI usa il nuovo modello relazionale.

---

## 10. Compatibilita'

Per retrocompatibilita':

- il backend continua a valorizzare `accompanied_by`
- vecchie viste read-only possono ancora leggerlo
- le nuove UI devono invece scrivere e leggere `accompaniers`

---

## 11. QA minimo richiesto al frontend

1. creare uscita con solo `staff_member`
2. creare uscita con solo `minor_contact`
3. creare uscita con solo `external`
4. creare uscita con mix di tipi
5. verificare che la risposta contenga `accompaniers[]`
6. verificare che `accompanied_by` mostri un riepilogo coerente
7. tentare staff member di altra struttura -> atteso errore validazione
8. tentare contatto di altro minore -> atteso errore validazione
