# Richiesta UX 019 — Separazione semantica tra Sync e Scarico + fix selezione dataset

- `Request ID`: 2026-06-21-019
- `Stato`: OPEN
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

È emersa una confusione funzionale critica nella pagina `Scarico geografia`.

L’utente finale sta interpretando la select iniziale come:

- storico dei run di sincronizzazione

mentre il significato corretto della pagina è:

- scelta di un **dataset raw già disponibile e scaricabile nel DB canonico**

Distinzione obbligatoria:

- `Sync geografia` = verifica sorgenti, acquisisce dati raw, controlla modifiche
- `Scarico geografia` = carica nel DB applicativo dati raw già presenti ma non ancora disponibili/voluti nel canonico

La UI attuale non comunica bene questa differenza.

## 2. Impatto frontend

La pagina `Scarico geografia` va reinterpretata come **wizard di scelta dataset disponibile**, non come storico tecnico run.

La select iniziale non deve più mostrare label tecniche del tipo:

- `#6 — completed (italy_admin_seed)`

ma label funzionali comprensibili.

## 3. Endpoint coinvolti

- `GET /admin/geography-load/runs`
- `POST /admin/geography-load/execute`

## 4. Nuovo contratto rilevante della response `GET /admin/geography-load/runs`

Ogni elemento `data[]` ora include anche:

- `source`
- `dataset`
- `display_name`
- `available_levels`
- `is_loadable`

Esempio:

```json
{
  "id": 10,
  "scope": "full",
  "status": "completed",
  "source": "geonames",
  "dataset": "countries",
  "display_name": "Nazioni mondiali (GeoNames)",
  "available_levels": ["countries"],
  "is_loadable": true
}
```

Importante:

- l’endpoint restituisce solo run **davvero loadabili**
- sono già esclusi i run falliti
- sono già esclusi i run storici `anpr_history`

## 5. Response da visualizzare

### Select iniziale

Non usare più `status/scope` come testo principale.

Usare come label principale:

- `display_name`

Usare eventualmente come testo secondario o badge:

- `#run_id`
- `source`
- `started_at`
- `available_levels`

### Esempi label corrette

- `Nazioni mondiali (GeoNames) — Run #10`
- `Dataset seed Italia — Run #6`
- `Dataset amministrativo ISTAT Italia — Run #7`

### Esempi label errate

- `#6 — completed (italy_admin_seed)`
- `#10 — completed (full)`

## 6. Stati UI da gestire

- `loading`
- `empty`
- `success`
- `validation error`
- `forbidden`
- `not found`

### Empty state obbligatorio

Se `GET /admin/geography-load/runs` restituisce array vuoto:

- mostrare messaggio esplicito:
  - `Nessun dataset scaricabile disponibile. Eseguire prima una sincronizzazione valida.`

## 7. Regole autorizzative

- visibilità pagina: `geography_sync.read`
- esecuzione scarico: `geography_sync.run`

## 8. Comportamento atteso

### A. Header e testo esplicativo

La pagina deve spiegare chiaramente:

- `Sincronizzazione` cerca e valida modifiche dalle sorgenti
- `Scarico` inserisce nel database applicativo dati raw già acquisiti

Inserire un alert/info box in alto con questo significato.

### B. Step 1

Rinominare:

- da `Run di importazione`
- a `Dataset disponibile da scaricare`

### C. Step 2

La `Sorgente` non deve essere una select libera se è già determinata dal dataset scelto.

UX deve:

- precompilare automaticamente la sorgente dal record selezionato
- mostrarla in sola lettura oppure come badge/testo
- evitare che l’utente scelga una sorgente incompatibile col run

### D. Livelli disponibili

Usare `available_levels` per mostrare/abilitare solo le azioni coerenti:

- GeoNames → solo `Scarica nazioni`
- Seed / ISTAT → livelli completi

Non mostrare o disabilitare in modo ambiguo azioni impossibili.

### E. Copy azioni

Le CTA devono chiarire che si tratta di caricamento nel DB applicativo:

- `Carica nazioni nel database`
- `Carica regioni nel database`
- `Carica province nel database`
- `Carica città nel database`
- `Carica tutto nel database`

Se preferiscono mantenere “Scarica”, aggiungere un sottotesto chiarificatore:

- `I dati verranno inseriti nel database applicativo`

## 9. Checklist UX team

- [ ] Sostituita label tecnica dei run con `display_name`
- [ ] Rinominato step iniziale in modo funzionale
- [ ] Rimossa la scelta libera sorgente dopo la selezione dataset
- [ ] Aggiunto box esplicativo su differenza Sync vs Scarico
- [ ] Gestito stato empty con messaggio corretto
- [ ] Azioni mostrate solo se compatibili con `available_levels`
- [ ] QA funzionale fatto con dataset GeoNames, Seed e ISTAT

## 10. Note backend

- Il backend ora rifiuta anche l’esecuzione se il `run_id` non appartiene alla `source` inviata.
- Quindi la UI non deve permettere combinazioni manuali incoerenti.
- Questa richiesta non introduce nuove route, ma cambia il modo corretto di usare `GET /admin/geography-load/runs`.
