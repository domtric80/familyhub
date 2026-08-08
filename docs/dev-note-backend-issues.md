# Nota per il Backend — Problemi riscontrati dal Frontend

**Data:** 2026-07-06  
**Mittente:** Team Frontend  
**Destinatario:** Team Backend / Dev

---

## 1. Tab "Caso" del minore — Menu a tendina vuoti

Nella scheda minore, tab **Caso** (`/minori/:id` → tab `caso`), i seguenti campi select non ricevono dati dall'API e rimangono vuoti:

### 1.1 Struttura di provenienza censita
- **Campo:** `MinorCaseDetail.origin_facility_id`
- **Endpoint atteso:** lookup list strutture censite come provenienza (distinto dalla struttura di accoglienza corrente)
- **Stato attuale:** il frontend carica le strutture tramite `GET /facilities/` ma le strutture di provenienza potrebbero essere un sottoinsieme o un tipo diverso — chiarire se serve un endpoint dedicato o un filtro (es. `?type=provenienza`)
- **Impatto:** operatore non può selezionare la struttura di provenienza del minore

### 1.2 Autorità giudiziaria
- **Campo:** `MinorCaseDetail.judicial_authority_id`
- **Endpoint atteso:** `GET /lookups/judicial-authorities/` o simile
- **Stato attuale:** nessun endpoint restituisce l'elenco delle autorità giudiziarie — il select rimane vuoto
- **Impatto:** operatore non può registrare l'autorità giudiziaria competente

### 1.3 Medico di base
- **Campo:** `MinorCaseDetail.family_doctor_id`
- **Endpoint atteso:** lista medici di base (anagrafica sanitaria)
- **Stato attuale:** nessun endpoint — campo non popolabile
- **Impatto:** impossibile collegare il medico di base al fascicolo del minore

### 1.4 Pediatra
- **Campo:** `MinorCaseDetail.pediatrician_id`
- **Endpoint atteso:** lista pediatri (anagrafica sanitaria)
- **Stato attuale:** nessun endpoint — campo non popolabile
- **Opzione alternativa:** unificare medico di base e pediatra in una lista unica `GET /healthcare-providers/?type=medico_base|pediatra`

### 1.5 ASL di riferimento
- **Campo:** `MinorCaseDetail.asl_id`
- **Endpoint atteso:** `GET /lookups/asl/` — lista ASL per regione/provincia
- **Stato attuale:** nessun endpoint
- **Impatto:** operatore non può registrare l'ASL competente

---

## 2. Cartella vaccinale — Filtro documenti medici

- **Dove:** tab Caso → campo "Cartella vaccinale (documento collegato)"
- **Campo:** `MinorCaseDetail.vaccination_record_document_id`
- **Comportamento atteso:** il select deve mostrare **solo i documenti del minore classificati come medici** (es. `document_type.scope = 'medico'` o flag `is_medical = true`)
- **Comportamento attuale:** il frontend carica tutti i documenti del minore senza filtrare per tipo — i documenti non sanitari appaiono nel select
- **Richiesta:** aggiungere un parametro di filtro all'endpoint documenti (es. `GET /minori/:id/documents/?scope=medico`) oppure esporre il campo `is_medical` nei tipi documento per permettere il filtro lato frontend

---

## 3. Admin/Utenti — "Assegna minore": strutture non visibili nel dropdown

- **Dove:** sezione Admin → Utenti → Assegna minore → select struttura
- **Possibile causa frontend:** il componente potrebbe non caricare correttamente le strutture prima di aprire il modal (race condition o endpoint che richiede permessi elevati)
- **Possibile causa backend:** l'endpoint strutture richiede un ruolo che l'utente admin non ha, oppure restituisce una lista vuota per contesti specifici
- **Richiesta al backend:** verificare che `GET /facilities/` (o endpoint equivalente usato per popolare il select) sia accessibile al ruolo ADMIN senza restrizioni di struttura di appartenenza; restituire la lista completa delle strutture attive

> **Nota:** il Frontend verificherà in parallelo che il componente carichi le strutture al mount e non solo all'apertura del modal.

---

## Priorità suggerita

| # | Issue | Impatto | Priorità |
|---|-------|---------|----------|
| 1 | Autorità giudiziaria vuota | Alto — campo obbligatorio per molti minori | 🔴 Alta |
| 2 | ASL di riferimento vuota | Alto | 🔴 Alta |
| 3 | Medico di base / Pediatra vuoti | Medio | 🟡 Media |
| 4 | Struttura di provenienza — chiarimento tipo | Medio | 🟡 Media |
| 5 | Filtro documenti medici (vaccini) | Medio | 🟡 Media |
| 6 | Strutture vuote in Assegna minore | Basso — workaround manuale possibile | 🟢 Bassa |

---

*Per qualsiasi domanda o chiarimento contattare il team frontend prima di implementare gli endpoint, per allineare i nomi dei campi con il contratto OpenAPI esistente.*
