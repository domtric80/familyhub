# FamilyHub — Handoff UX/API — Minori — Narrativa protetta e profilo sensibile

Data: 2026-08-13  
Area: `Minori > Dettaglio minore > Anagrafica / Profilo`  
Priorita: alta  
Tipo: sicurezza by default + riallineamento contratto profilo

## Obiettivo

Rendere esplicito che nel profilo minore esistono campi con natura diversa:

- campi operativi educativi
- campi narrativi protetti
- campi clinici riservati

Il backend ora cifra a riposo i campi più sensibili e non deve mai esporre tali contenuti nei log tecnici o audit generici.

## Campi del profilo minore

### 1) Campi narrativi protetti

Questi campi sono **cifrati a riposo nel database**:

- `family_background`
- `life_history`

### 2) Campo clinico riservato

Questo campo è **cifrato a riposo nel database**:

- `clinical_notes_encrypted`

### 3) Campi educativi/operativi

Questi restano visibili in chiaro nell’applicazione ai ruoli autorizzati:

- `learning_styles`
- `interests`
- `hobbies`
- `strengths`
- `risk_factors`
- `crisis_indicators`

## Regola UX obbligatoria

UX deve trattare `family_background`, `life_history` e `clinical_notes_encrypted` come campi sensibili.

### Quindi:

- mostrare warning visivo “contenuto sensibile”
- evitare anteprime sintetiche automatiche fuori dalla scheda minore
- non duplicare questi contenuti in card, tooltip, tabelle, badge, riepiloghi o drawer generici
- non riportare questi contenuti in timeline audit o storico tecnico

## Endpoint coinvolti

### Lettura scheda minore

- `GET /api/minors/{minor}`

Il payload continua a includere `profile` con i valori già decrittati lato backend per i ruoli autorizzati.

### Scrittura profilo

- `PUT /api/minors/{minor}/profile`
- `PATCH /api/minors/{minor}/profile`

## Comportamento nuovo lato storico/audit

Quando viene aggiornato il profilo:

- il backend **non** salva il contenuto narrativo/clinico nei log audit pubblici
- salva invece:
  - `changed_sections`
  - `protected_sections_updated`
  - una `operation_summary` parlante ma senza contenuto sensibile

### Esempio

```json
{
  "operation_summary": "System Administrator ha aggiornato il profilo del minore Minore MIN-0002. Sezioni modificate: background familiare, storia di vita, fattori di rischio.",
  "changed_sections": [
    "family_background",
    "life_history",
    "risk_factors"
  ],
  "protected_sections_updated": [
    "family_background",
    "life_history"
  ]
}
```

## Impatto UI richiesto

### Sezione `Profilo`

Organizzare il form in gruppi chiari:

1. `Contesto familiare`
   - `family_background`

2. `Storia di vita`
   - `life_history`

3. `Profilo educativo`
   - `learning_styles`
   - `interests`
   - `hobbies`
   - `strengths`

4. `Rischi e crisi`
   - `risk_factors`
   - `crisis_indicators`

5. `Note cliniche riservate`
   - `clinical_notes_encrypted`

## Pattern UX richiesti

- textarea dedicate, non campo unico generico
- etichetta sensibile per:
  - `family_background`
  - `life_history`
  - `clinical_notes_encrypted`
- eventuale icona informativa contestuale:
  - “contenuto visibile solo nella scheda minore ai ruoli autorizzati”

## QA checklist UX

- [ ] `family_background` e `life_history` sono presentati come campi protetti
- [ ] `clinical_notes_encrypted` è presentato come area clinica riservata
- [ ] nessun riepilogo UI secondario mostra il contenuto di questi campi
- [ ] nessuna tabella audit/storico mostra il testo inserito
- [ ] il frontend usa `changed_sections` solo come metadato tecnico, non prova a ricostruire contenuti

## Nota per sviluppo frontend

Il nome campo `clinical_notes_encrypted` resta invariato per retrocompatibilita del contratto attuale, ma **per UX il contenuto va trattato come “Note cliniche riservate”**.
