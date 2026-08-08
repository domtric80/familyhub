# Handoff UX/API — Collegamento PEI ? Attività / Diario educativo

Data: 2026-07-03  
Area: `Minori > Attività`, `Minori > Diario educativo`, `Minori > PEI`

## 1. Obiettivo

Collegare in modo relazionale gli eventi operativi quotidiani (`Attività` e `Diario educativo`) agli `obiettivi PEI`, così il software può misurare davvero l'avanzamento educativo nel tempo.

Non usare più solo riferimenti testuali liberi. Il backend ora espone un legame strutturato tramite `pei_objective_id`.

## 2. Nuovo comportamento backend

### 2.1 Attività

Su create/update attività il payload può contenere:

```json
{
  "pei_objective_id": 55
}
```

Regole:
- il campo è opzionale
- se valorizzato, l'obiettivo deve appartenere allo stesso minore dell'attività
- in risposta l'API restituisce anche la relazione `pei_objective`
- il summary attività restituisce anche `summary.pei_linked`

### 2.2 Diario educativo

Su create/update voce diario il payload può contenere:

```json
{
  "pei_objective_id": 55
}
```

Regole:
- il campo è opzionale
- se valorizzato, l'obiettivo deve appartenere allo stesso minore della voce diario
- in risposta l'API restituisce anche la relazione `pei_objective`
- il summary diario restituisce anche `summary.pei_linked`

## 3. Effetto sullo storico PEI

Quando un'attività o una voce diario è collegata a un obiettivo PEI, il backend crea un record in `minor_pei_objective_progress_logs` con:

- `minor_pei_objective_id`
- `progress_percent`
- `status`
- `notes`
- `source_type`
- `source_id`
- `source_label`

Valori previsti:
- `source_type = minor_activity`
- `source_type = minor_journal_entry`

Questo serve a costruire in UI una timeline di avanzamento non solo da modifiche manuali del PEI ma anche da evidenze operative quotidiane.

## 4. Impatto UX obbligatorio

### 4.1 Form Attività

Aggiungere selettore opzionale `Obiettivo PEI`:
- visibile quando è selezionato un minore
- popolato solo con obiettivi PEI di quel minore
- non editabile a testo libero
- label consigliata: `Collega a obiettivo PEI`
- helper text consigliato: `Usa questo campo quando l'attività documenta un progresso o una criticità rispetto al PEI.`

### 4.2 Form Diario educativo

Aggiungere selettore opzionale `Obiettivo PEI`:
- visibile quando è selezionato un minore
- popolato solo con obiettivi PEI di quel minore
- non editabile a testo libero
- helper text consigliato: `Collega la voce a un obiettivo PEI se l'osservazione misura l'andamento educativo.`

### 4.3 Liste e dettaglio

In entrambe le pagine:
- mostrare badge o colonna `PEI` quando esiste il collegamento
- nel dettaglio mostrare titolo obiettivo e codice obiettivo
- nei KPI summary usare anche `pei_linked`

## 5. API da usare in frontend

### Attività
- `GET /api/activities`
- `POST /api/activities`
- `PUT /api/activities/{activity}`
- `GET /api/activities/summary`

Nuovi campi risposta/richiesta:
- `pei_objective_id`
- `pei_objective`
- `summary.pei_linked`

### Diario educativo
- `GET /api/journals`
- `POST /api/journals`
- `PUT /api/journals/{journal}`
- `GET /api/journals/summary`

Nuovi campi risposta/richiesta:
- `pei_objective_id`
- `pei_objective`
- `summary.pei_linked`

### Sorgente dati selettore PEI
- riusare i dati PEI già disponibili nella scheda minore
- in alternativa leggere da `GET /api/minors/{minor}` dove il backend restituisce `peis` e `peis.objectives`

## 6. Errori da gestire

Se l'utente tenta di collegare un obiettivo di un altro minore, il backend risponde `422` con errore su `pei_objective_id`.

Messaggio atteso:
- `L'obiettivo PEI selezionato non appartiene al minore indicato.`

## 7. Nota per UX

Non introdurre campi di testo libero per il collegamento PEI.

Il vecchio `pei_objective_ref` può restare visibile solo come dato legacy tecnico se già presente, ma la UI operativa deve usare `pei_objective_id` come unica modalità standard.
