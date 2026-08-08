# Handoff UX/API - Minori - Scheda caso legale e sanitaria

Data: 2026-07-03  
Area: `Minori > Dettaglio minore`  
Priorita: Alta

## Obiettivo

Aggiungere nel dettaglio del minore una sezione dedicata ai dati:

- ingresso e provenienza
- decreto o ordinanza di affidamento
- autorita giudiziaria e procedimento
- medico di base, pediatra, ASL
- cartella vaccinale collegata

Questa sezione non sostituisce l'anagrafica base del minore: la completa con dati di caso legale e sanitario.

## Endpoint backend

- `GET /api/minors/{minor}`
- `PUT /api/minors/{minor}/case-details`
- `PATCH /api/minors/{minor}/case-details`

Permesso backend richiesto in scrittura:

- `minor_profiles.update`

## Dati restituiti nel dettaglio minore

Dentro `GET /api/minors/{minor}` ora e disponibile:

- `case_detail`

Se non ancora compilata, `case_detail` puo essere `null`.

## Struttura `case_detail`

Campi principali:

- `entry_city_id`
- `origin_facility_id`
- `origin_structure_name`
- `placement_order_reference`
- `placement_order_minor_document_id`
- `judicial_authority_document_issuer_id`
- `proceeding_number`
- `next_hearing_at`
- `general_practitioner_staff_member_id`
- `pediatrician_staff_member_id`
- `health_authority_document_issuer_id`
- `vaccination_minor_document_id`

Relazioni pronte per la UI:

- `entry_city`
- `origin_facility`
- `placement_order_document`
- `judicial_authority`
- `general_practitioner`
- `pediatrician`
- `health_authority`
- `vaccination_document`

## Regole UI obbligatorie

### 1. Sezione dedicata nel dettaglio minore

La UI deve mostrare un tab o card autonoma, per esempio:

- `Caso`
- oppure `Caso legale e sanitario`

Non va mischiata nella tab documenti.

### 2. Modalita visualizzazione

Quando `case_detail` e `null`:

- mostrare stato vuoto chiaro
- mostrare CTA `Compila scheda caso` solo se l'utente ha permesso di scrittura

Quando `case_detail` e presente:

- mostrare riepilogo leggibile
- mostrare CTA `Modifica scheda caso`

### 3. Campi da mostrare nel form

Blocco `Ingresso e provenienza`

- citta di ingresso
- struttura di provenienza censita
- nome struttura di provenienza libero

Blocco `Provvedimento`

- riferimento decreto/ordinanza
- documento collegato del minore

Blocco `Autorita giudiziaria`

- autorita giudiziaria
- numero procedimento
- prossima udienza

Blocco `Riferimenti sanitari`

- medico di base
- pediatra
- ASL di riferimento
- cartella vaccinale collegata

## Regole di compilazione

### Provenienza

La UI deve consentire entrambe le modalita:

- selezione struttura esistente tramite `origin_facility_id`
- compilazione nome libero tramite `origin_structure_name`

Non imporre obbligo reciproco: il backend accetta anche solo una delle due.

### Documento collegato

Per `placement_order_minor_document_id` e `vaccination_minor_document_id`:

- usare select dei documenti del minore gia caricati
- label da mostrare:
  1. `document.label`
  2. fallback `document.attachment.original_name`

### Autorita e ASL

Per `judicial_authority_document_issuer_id` e `health_authority_document_issuer_id`:

- usare lookup relazionali, non input testuali liberi

### Medico di base e pediatra

Le select devono usare `staff members` della stessa struttura del minore.

Vincoli backend:

- medico di base: qualifica `MEDICO_BASE` oppure `PEDIATRA`
- pediatra: qualifica `PEDIATRA`

Se la UI mostra altri operatori, il backend rispondera con errore `422`.

## Payload esempio

```json
{
  "entry_city_id": 1201,
  "origin_facility_id": 3,
  "origin_structure_name": null,
  "placement_order_reference": "Decreto TM 2026/1458",
  "placement_order_minor_document_id": 44,
  "judicial_authority_document_issuer_id": 7,
  "proceeding_number": "PROC-2026-778",
  "next_hearing_at": "2026-09-15",
  "general_practitioner_staff_member_id": 18,
  "pediatrician_staff_member_id": 21,
  "health_authority_document_issuer_id": 15,
  "vaccination_minor_document_id": 52
}
```

## QA minima per UX

- aprire un minore senza `case_detail` e verificare stato vuoto corretto
- salvare la scheda caso completa
- riaprire il minore e verificare il reload dei dati
- verificare che i documenti collegati mostrino `label`
- verificare che medico di base e pediatra non consentano selezioni incoerenti
- verificare che la scheda continui a funzionare se e compilato solo parte del dataset

## Nota backend importante

Il backend e gia operativo e testato.  
Questa nota serve solo a riallineare la UI al contratto reale, senza introdurre campi inventati o logiche locali.
