# Mini checklist QA - Diario educativo

- `Request ID`: 2026-07-03-096
- `Destinatario`: team frontend / QA
- `Ambito`: validazione operativa del modulo `Diario educativo`

## 1. Obiettivo

Verificare che la UI `Diario educativo` usi davvero il backend disponibile e non anticipi funzionalità ancora non implementate.

## 2. Prerequisiti

- utente autenticato con accesso reale al modulo
- almeno un minore visibile
- almeno una tipologia voce diario disponibile

## 3. Checklist elenco

- [ ] la pagina carica `GET /api/journals`
- [ ] il riepilogo carica `GET /api/journals/summary`
- [ ] i KPI non sono calcolati lato frontend
- [ ] funzionano i filtri:
  - [ ] `minor_id`
  - [ ] `priority_level`
  - [ ] `mood_level`
  - [ ] `handover_required`
- [ ] la tabella mostra almeno:
  - [ ] data/ora
  - [ ] minore
  - [ ] tipologia
  - [ ] titolo
  - [ ] priorità
  - [ ] umore
  - [ ] follow-up
  - [ ] handover

## 4. Checklist form create/edit

- [ ] blocco `Dati base` presente
- [ ] blocco `Priorità e contesto` presente
- [ ] blocco `Registro turno` presente
- [ ] blocco `Follow-up` presente
- [ ] blocco `Passaggio consegne` presente

## 5. Validazioni obbligatorie da provare

### Follow-up

- [ ] se `follow_up_required = true` e `follow_up_notes` è vuoto, UX mostra `422`

### Handover

- [ ] se `handover_required = true` e `handover_notes` è vuoto, UX mostra `422`
- [ ] se `handover_read_at` è valorizzato ma `handover_read_by_user_id` manca, UX mostra `422`

## 6. Summary/KPI

- [ ] visualizzati `total`, `green`, `yellow`, `red`
- [ ] visualizzati `follow_up_required`, `handover_required`, `handover_pending`
- [ ] visualizzato andamento `daily_series`

## 7. Informazioni e limiti funzionali

- [ ] tasto `Informazioni` presente
- [ ] drawer spiega priorità, umore, follow-up e handover
- [ ] la UI non mostra CTA o workflow non ancora presenti:
  - [ ] firma digitale chiusura turno
  - [ ] ricerca full-text avanzata
  - [ ] messaggistica interna cifrata

## 8. Esito atteso

Il modulo si considera validato quando:

- usa solo API backend reali
- gestisce correttamente i `422`
- mostra il riepilogo server-side
- non promette funzionalità roadmap ancora assenti
