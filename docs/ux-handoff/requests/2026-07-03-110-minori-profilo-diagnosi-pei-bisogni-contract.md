# Handoff UX/API - Minori - Profilo esteso, diagnosi, PEI, bisogni

Data: 2026-07-03  
Area: `Minori > Dettaglio minore`  
Priorita: Alta

## Obiettivo

Completare la scheda minore con quattro blocchi funzionali reali:

- profilo esteso psico-educativo
- diagnosi / DSM
- PEI con obiettivi
- bisogni categorizzati

Il backend e gia operativo e testato.  
La UI deve allinearsi al contratto e non inventare campi o flussi alternativi.

## Endpoint backend

### Profilo esteso

- `GET /api/minors/{minor}`
- `PUT /api/minors/{minor}/profile`
- `PATCH /api/minors/{minor}/profile`

### Diagnosi

- `POST /api/minors/{minor}/diagnoses`
- `PUT /api/minors/{minor}/diagnoses/{diagnosis}`
- `PATCH /api/minors/{minor}/diagnoses/{diagnosis}`
- `DELETE /api/minors/{minor}/diagnoses/{diagnosis}`

### PEI

- `POST /api/minors/{minor}/peis`
- `PUT /api/minors/{minor}/peis/{pei}`
- `PATCH /api/minors/{minor}/peis/{pei}`

### Obiettivi PEI

- `POST /api/minors/{minor}/peis/{pei}/objectives`
- `PUT /api/minors/{minor}/peis/{pei}/objectives/{objective}`
- `PATCH /api/minors/{minor}/peis/{pei}/objectives/{objective}`
- `DELETE /api/minors/{minor}/peis/{pei}/objectives/{objective}`

### Bisogni

- `POST /api/minors/{minor}/needs`
- `PUT /api/minors/{minor}/needs/{need}`
- `PATCH /api/minors/{minor}/needs/{need}`
- `DELETE /api/minors/{minor}/needs/{need}`

## Permessi backend

Per tutto il blocco sensibile serve:

- lettura scheda minore: `minor_profiles.read`
- modifica profilo/diagnosi/PEI/bisogni: `minor_profiles.update`

Resta valida anche la regola assegnazione al minore, salvo ruoli privilegiati.

## Dati disponibili in `GET /api/minors/{minor}`

Il payload del minore ora include:

- `profile`
- `case_detail`
- `diagnoses[]`
- `peis[]`
- `needs[]`
- `documents[]`

Quindi UX non deve fare chiamate extra per popolare la vista dettaglio iniziale.

## 1. Profilo esteso

Campi disponibili in `profile`:

- `family_background`
- `life_history`
- `learning_styles`
- `interests`
- `hobbies`
- `strengths`
- `risk_factors`
- `crisis_indicators`
- `clinical_notes_encrypted`

### Regola UX

Il profilo va mostrato come form strutturato, non come testo unico.

Suggerimento blocchi:

- contesto familiare
- storia di vita
- apprendimento e interessi
- fattori di rischio e crisi

## 2. Diagnosi / DSM

Ogni elemento di `diagnoses[]` contiene:

- `id`
- `diagnosis_code`
- `diagnosis_label`
- `dsm_code`
- `diagnosis_notes_encrypted`
- `diagnosed_at`
- `review_due_at`
- `is_primary`
- `is_active`

### Regola UX

Serve tabella o repeater CRUD con:

- badge primaria
- badge attiva/non attiva
- date leggibili
- azioni modifica/elimina

### Form diagnosi

Campi:

- codice diagnosi
- etichetta diagnosi
- codice DSM
- note cliniche
- data diagnosi
- data revisione
- primaria
- attiva

## 3. PEI

Ogni elemento di `peis[]` contiene:

- `id`
- `title`
- `summary`
- `start_date`
- `review_date`
- `end_date`
- `status`
- `digital_signature_status`
- `signed_at`
- `objectives[]`

### Regola UX

La UI deve distinguere:

- lista PEI
- dettaglio PEI
- obiettivi del PEI selezionato

Non usare una sola textarea generica.

### Form PEI

Campi:

- titolo
- sintesi
- data inizio
- data revisione
- data fine
- stato
- stato firma digitale
- data firma

## 4. Obiettivi PEI

Ogni obiettivo contiene:

- `id`
- `code`
- `title`
- `description`
- `due_date`
- `status`
- `progress_percent`
- `responsible_staff_member_id`
- `responsible_staff_member`

### Regola UX

Per ogni PEI serve una lista obiettivi con:

- titolo
- responsabile
- scadenza
- stato
- avanzamento percentuale
- azioni modifica/elimina

Il responsabile deve essere scelto da select operatori della struttura, non testo libero.

## 5. Bisogni

Ogni elemento di `needs[]` contiene:

- `id`
- `category_code`
- `title`
- `description`
- `priority`
- `status`
- `responsible_staff_member_id`
- `attachment_minor_document_id`
- `responsible_staff_member`
- `attachment_document`

### Categorie valide

- `physical`
- `emotional`
- `cognitive`
- `relational`
- `spiritual`

### Priorita valide

- `high`
- `medium`
- `low`

### Stato validi

- `open`
- `in_progress`
- `satisfied`

### Regola UX

Nessun campo testuale libero per categoria, priorita o stato.  
Devono essere select chiuse.

### Documento allegato

`attachment_minor_document_id` deve usare i documenti gia caricati del minore.

Label select obbligatoria:

1. `document.label`
2. fallback `document.attachment.original_name`

## 6. Informazioni / help contestuale

In questa sezione la UI deve aggiungere pulsante `Informazioni` con testo chiaro per utente finale.

Contenuti minimi:

- cosa e' il profilo minore
- cosa sono diagnosi e DSM
- cosa e' il PEI
- cosa sono i bisogni categorizzati
- quali dati sono sensibili
- che ogni modifica viene tracciata

## 7. QA minima per UX

- salvare profilo esteso e ricaricare pagina
- creare diagnosi primaria e verificarne il badge
- creare PEI con obiettivo e verificare avanzamento
- creare bisogno con categoria e documento collegato
- verificare presenza dei nuovi dati dentro `GET /api/minors/{minor}`
- verificare gestione permessi: utente senza `minor_profiles.update` non deve vedere CTA di modifica

## 8. Nota importante per team UX

Non duplicare dati gia presenti:

- i documenti arrivano dal backend
- gli operatori responsabili arrivano da lookup/lista struttura
- categoria/priorita/stato non vanno trasformati in input testuali

Se serve una seconda nota, il backend puo fornire anche il pacchetto `label -> valore` per i select, ma la logica dati e gia definita.
