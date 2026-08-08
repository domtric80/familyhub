# Handoff UX Consolidato — Avvicinamenti familiari

Data: 2026-07-03  
Area: `Minori > Avvicinamenti familiari`  
Priorità: Critica

## Scopo

Questo documento unifica in un solo punto tutte le modifiche backend recenti che il frontend deve recepire per rendere davvero operativo il modulo `Avvicinamenti`.

Usare questo file come riferimento principale di implementazione.

## Modifiche da recepire

### 1. Tipologia contatto / avvicinamento

La UI deve mostrare una select chiara basata su `GET /api/lookups/approach-types`.

Tipologie attese:

- `FAMILY_VISIT` — Avvicinamento familiare
- `FACILITY_VISIT` — Visita in struttura
- `AUTHORIZED_EXIT` — Uscita autorizzata
- `PHONE_CALL` — Telefonata
- `VIDEO_CALL` — Videochiamata
- `LETTER` — Lettera / comunicazione scritta
- `TUTOR_MEETING` — Incontro con tutore
- `PROTECTED_MEETING` — Incontro protetto
- `REINTEGRATION_STEP` — Step reintegrazione

Label consigliata nel form:

- `Tipologia contatto`

### 2. Partecipanti familiari / tutori

Non usare più una select singola contatto.

La UI deve gestire:

- `participants[]`

Ogni riga contiene:

- `minor_contact_id`
- `contact_type_id`

Esempio payload:

```json
"participants": [
  { "minor_contact_id": 44, "contact_type_id": 2 },
  { "minor_contact_id": 45, "contact_type_id": 7 }
]
```

### 3. Partecipanti professionali

La UI deve gestire un blocco separato:

- `staff_participants[]`

Ogni riga contiene:

- `staff_member_id`
- `qualification_code`

Esempio payload:

```json
"staff_participants": [
  { "staff_member_id": 21, "qualification_code": "PSICOLOGO" },
  { "staff_member_id": 22, "qualification_code": "ASSISTENTE_SOCIALE" }
]
```

### 4. Provvedimento autorizzativo

La UI deve supportare tre casi:

- solo riferimento manuale
- collegamento a documento del minore già caricato
- nessun documento collegato

Campo API nuovo:

- `authorization_minor_document_id`

## Struttura form obbligatoria

Il form creazione/modifica deve essere diviso almeno in questi blocchi:

### A. Dati generali

- minore
- tipologia contatto
- titolo
- obiettivo
- luogo
- data/ora inizio prevista
- data/ora fine prevista
- stato

### B. Partecipanti familiari / tutori

Tabella o repeater con colonne:

- contatto
- ruolo nel singolo avvicinamento
- rimuovi riga

Bottone:

- `Aggiungi partecipante familiare`

### C. Partecipanti professionali

Tabella o repeater con colonne:

- operatore
- ruolo professionale nel singolo avvicinamento
- rimuovi riga

Bottone:

- `Aggiungi professionista presente`

### D. Provvedimento autorizzativo

Campi:

- riferimento provvedimento
- data emissione
- data scadenza
- giorni alert rinnovo
- documento autorizzativo esistente

### E. Valutazione qualitativa

- reazione prima
- note prima
- reazione durante
- note durante
- reazione dopo
- note dopo

### F. Note riservate

- note riservate psicologo
- note riservate coordinatore

### G. Sospensione

- stato = sospeso
- motivazione sospensione
- data/ora sospensione
- firma/responsabile

## Regole di visualizzazione lista

Nella tabella lista mostrare almeno:

- tipologia contatto
- titolo
- minore
- partecipanti familiari in formato compatto
- partecipanti professionali in formato compatto
- stato
- scadenza provvedimento
- alert rinnovo

### Rendering compatto consigliato

Familiari:

- `Maria Rossi (Madre), Paolo Rossi (Padre)`

Professionisti:

- `Dott.ssa Bianchi (Psicologo), Luca Verdi (Assistente sociale)`

## Regole di dettaglio

Nel dettaglio avvicinamento mostrare sezioni distinte:

- `Partecipanti familiari`
- `Professionisti presenti`
- `Provvedimento autorizzativo`
- `Valutazione qualitativa`
- `Note riservate`
- `Storico / audit`

## Response backend da usare

### Familiari

- `participants[]`
- `minor_contact_ids`
- `minor_contacts_count`

### Professionisti

- `staff_participants[]`
- `staff_participants_count`
- `supervising_staff_member_id`

### Provvedimento

- `authorization_minor_document_id`
- `authorization_minor_document`

## Non fare

- non usare campi testuali liberi per ruolo familiare
- non usare campi testuali liberi per ruolo professionale
- non usare più solo `minor_contact_id` come modello principale
- non mischiare familiari e professionisti nello stesso repeater

## Checklist implementativa UX

- [ ] aggiornare select tipologie avvicinamento con nuovi valori lookup
- [ ] sostituire contatto singolo con `participants[]`
- [ ] aggiungere blocco `staff_participants[]`
- [ ] aggiungere selezione documento esistente per `authorization_minor_document_id`
- [ ] mostrare partecipanti familiari con ruolo
- [ ] mostrare partecipanti professionali con ruolo
- [ ] supportare edit completo dei repeater
- [ ] supportare create/update senza rompere retrocompatibilità

## File di dettaglio collegati

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-03-102-avvicinamenti-multi-contatto-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-03-103-avvicinamenti-tipologia-e-provvedimento-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-03-104-avvicinamenti-partecipanti-con-ruolo-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-03-105-avvicinamenti-partecipanti-professionali-contract.md`
