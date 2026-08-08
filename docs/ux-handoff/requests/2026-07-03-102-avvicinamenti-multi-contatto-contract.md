# Handoff UX/API — Avvicinamenti multi-contatto

Data: 2026-07-03  
Area: `Minori > Avvicinamenti familiari`  
Priorità: Alta

## Obiettivo

Un avvicinamento può coinvolgere **più contatti dello stesso minore**:

- genitori affidatari
- madre + padre
- tutore + referente familiare
- altri contatti registrati in anagrafica minore

Il backend non deve più essere interpretato come “un avvicinamento = un solo contatto”.

## Contratto backend aggiornato

### Scrittura

Endpoint:

- `POST /api/approaches`
- `PUT /api/approaches/{approach}`
- `PATCH /api/approaches/{approach}`

Payload aggiornato:

```json
{
  "minor_id": 12,
  "approach_type_id": 3,
  "minor_contact_ids": [44, 45],
  "title": "Videochiamata con genitori affidatari",
  "planned_start_at": "2026-07-03 17:00:00"
}
```

### Lettura

La risposta include ora:

- `minor_contact_ids`: array completo dei contatti coinvolti
- `minor_contacts_count`: numero contatti coinvolti
- `minor_contacts`: array oggetti contatto completi

Il campo `minor_contact_id` resta disponibile **solo per retrocompatibilità** e coincide con il primo contatto della lista.

## Regole UX obbligatorie

### Form creazione / modifica

Il form deve usare un controllo **multi-selezione** per i contatti coinvolti:

- label consigliata: `Contatti coinvolti`
- sorgente dati: contatti del minore corrente
- selezione multipla obbligatoriamente supportata
- non usare più select singola come comportamento principale

### Tabella lista

Nella lista avvicinamenti non mostrare un solo nominativo se i contatti sono più di uno. Mostrare invece:

- nome primo contatto + badge `+N`
oppure
- elenco compatto dei nomi

Esempio:

- `Maria Rossi +1`
- `Madre affidataria, Padre affidatario`

### Dettaglio

Nel dettaglio avvicinamento mostrare un blocco dedicato:

- `Contatti coinvolti`
- elenco completo dei contatti associati

## Filtri

Il filtro backend `minor_contact_id` ora deve essere letto come:

- “mostrami tutti gli avvicinamenti dove questo contatto è coinvolto”

quindi la UI può mantenere il filtro singolo per contatto, ma deve sapere che il match avviene anche sulle associazioni multiple.

## Retrocompatibilità

- i record storici con solo `minor_contact_id` vengono mantenuti
- backend li espone anche come lista `minor_contact_ids`
- UX non deve più creare nuovi record usando solo `minor_contact_id`, salvo fallback tecnico

## QA minima richiesta

- creare un avvicinamento con 2 contatti
- verificare presenza di `minor_contact_ids` in risposta API
- verificare riapertura record in edit con i 2 contatti già selezionati
- filtrare lista per il secondo contatto e verificare che il record compaia
