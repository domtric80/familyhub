# Handoff UX/API - Aggiornamento accompagnatori uscita: endpoint opzioni form

Data: 2026-07-01
Priorita': alta
Ambito: frontend / UX / API / modulo Uscite

## 1. Obiettivo

Oltre al modello relazionale `accompaniers[]`, il backend espone ora un endpoint dedicato per ottenere le opzioni selezionabili del form accompagnatori in base al minore.

Questo evita al frontend di ricostruire le opzioni da piu' chiamate separate e riduce il rischio di incoerenza.

---

## 2. Nuovo endpoint

### GET `/api/exits/options/accompaniers?minor_id={id}`

Permesso richiesto:
- `minor_exits.read`

Regola aggiuntiva:
- l'utente deve poter accedere al minore secondo il modello di accesso ai minori

Errore atteso se non autorizzato:
- `403` con messaggio: `Accesso alle opzioni accompagnatori non consentito per questo minore.`

---

## 3. Cosa restituisce

L'endpoint restituisce in un solo payload:

- il minore corrente
- la struttura del minore
- gli `staff_members` attivi o senza stato esplicito della stessa struttura
- i `minor_contacts` del minore

Esempio concettuale:

```json
{
  "minor": {
    "id": 10,
    "internal_code": "MIN-2026-01",
    "first_name": "Mario",
    "last_name": "Rossi",
    "facility_id": 2
  },
  "facility": {
    "id": 2,
    "code": "FH-ROMA-01",
    "name": "FamilyHub Roma Demo"
  },
  "staff_members": [
    {
      "id": 15,
      "facility_id": 2,
      "user_id": 8,
      "employee_code": "EDU-001",
      "first_name": "Sara",
      "last_name": "Interna",
      "qualification": "educatore",
      "status": "active"
    }
  ],
  "minor_contacts": [
    {
      "id": 21,
      "first_name": "Claudia",
      "last_name": "Tutore",
      "contact_type": {
        "id": 3,
        "code": "TUTOR",
        "name": "Tutore"
      },
      "phone": null,
      "email": null,
      "notes": "Contatto reperibile"
    }
  ]
}
```

---

## 4. Uso frontend consigliato

### 4.1 Per il tipo `staff_member`

La select deve usare `staff_members[]`.

Label consigliata:
- `first_name + last_name`
- opzionale: mostrare anche `employee_code` o `qualification`

### 4.2 Per il tipo `minor_contact`

La select deve usare `minor_contacts[]`.

Label consigliata:
- `first_name + last_name`
- opzionale: badge con `contact_type.name`

### 4.3 Per il tipo `external`

Usare campo testo libero controllato:
- `external_name`

---

## 5. Vantaggio da spiegare internamente al team UX

Il frontend non deve piu':
- interrogare separatamente utenti/ruoli/staff
- incrociare in client la struttura del minore con staff members generici
- cercare contatti del minore da payload non dedicati

Il backend consegna gia' le opzioni coerenti con il contesto del minore.

---

## 6. Flusso suggerito nel form Uscita

1. seleziono il minore
2. il frontend chiama `GET /api/exits/options/accompaniers?minor_id=...`
3. popola le opzioni dei repeater accompagnatori
4. alla submit invia `accompaniers[]` nel payload uscita

---

## 7. QA minimo frontend

1. selezione minore -> endpoint opzioni chiamato correttamente
2. `staff_members` mostrati solo per la struttura del minore
3. `minor_contacts` mostrati solo per il minore selezionato
4. cambio minore -> refresh completo opzioni accompagnatori
5. submit con mix di tipi -> payload coerente con `accompaniers[]`
