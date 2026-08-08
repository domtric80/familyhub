# Mini checklist QA - Modulo Uscite

- `Request ID`: 2026-07-03-094
- `Destinatario`: team frontend / QA
- `Ambito`: validazione funzionale rapida del modulo `Uscite`

## 1. Obiettivo

Questa checklist serve a verificare che la UI `Uscite` sia coerente con il backend attuale, senza interpretazioni lato client.

## 2. Prerequisiti

- utente autenticato con accesso reale al modulo `Uscite`
- almeno un minore visibile
- almeno un tipo uscita disponibile
- se possibile, un caso con assegnazione attiva al minore e uno senza

## 3. Checklist rapida elenco

- [ ] la pagina carica `GET /api/exits`
- [ ] i KPI caricano `GET /api/exits/summary`
- [ ] non vengono calcolati KPI lato frontend
- [ ] i filtri `struttura`, `minore`, `stato` funzionano
- [ ] i filtri `return_condition` e `follow_up_required` funzionano
- [ ] ogni riga mostra stato uscita
- [ ] ogni riga mostra alert o badge `in ritardo` se `is_overdue = true`
- [ ] ogni riga mostra `return_condition` se valorizzato
- [ ] ogni riga mostra `follow_up_required`

## 4. Checklist creazione

- [ ] il form usa `exit_type_id` da lookup e non testo libero
- [ ] il form invia `facility_id`, `minor_id`, `exit_type_id`, `destination`, `planned_exit_at`
- [ ] la creazione riuscita restituisce record coerente in lista
- [ ] un utente non assegnato al minore riceve `403`
- [ ] il messaggio UX non parla genericamente di “bug”, ma di permessi/assegnazione

## 5. Checklist transizioni

### Partenza

- [ ] `mark-out` aggiorna lo stato a `out`
- [ ] l’orario effettivo di uscita viene aggiornato in UI

### Rientro

- [ ] la modale `mark-returned` mostra:
  - [ ] `actual_return_at`
  - [ ] `return_condition`
  - [ ] `follow_up_required`
  - [ ] `follow_up_notes`
  - [ ] `outcome_notes`
- [ ] se `follow_up_required = true` e `follow_up_notes` è vuoto, UX mostra errore backend `422`
- [ ] dopo il rientro, la UI mostra `delay_minutes` se presente

### Annullamento

- [ ] `cancel` aggiorna lo stato a `cancelled`
- [ ] la motivazione è gestita in modo leggibile

## 6. Checklist informazioni e microcopy

- [ ] il tasto `Informazioni` è presente
- [ ] il pannello spiega stati, ritardi, follow-up e permessi
- [ ] i tooltip KPI spiegano chiaramente:
  - [ ] `In ritardo`
  - [ ] `Follow-up`
  - [ ] `Rientri critici`

## 7. Esito atteso

La pagina `Uscite` si considera validata quando:

- usa solo dati backend reali
- non ricostruisce ritardi o KPI lato client
- mostra errori coerenti
- rende leggibile il flusso `pianificata -> fuori struttura -> rientrata / annullata`
