# Checklist UX/Frontend — Avvicinamenti

Data: 2026-07-03

## Pagina lista

- [ ] mostrare colonna `Tipologia`
- [ ] mostrare colonna `Partecipanti familiari`
- [ ] mostrare colonna `Professionisti presenti`
- [ ] mostrare stato provvedimento (`active`, `expiring`, `expired`)
- [ ] mostrare alert rinnovo

## Form creazione/modifica

- [ ] select `approach_type_id`
- [ ] repeater `participants[]`
- [ ] select ruolo familiare `contact_type_id`
- [ ] repeater `staff_participants[]`
- [ ] select ruolo professionale `qualification_code`
- [ ] select `authorization_minor_document_id`
- [ ] campi manuali provvedimento
- [ ] campi valutazione prima/durante/dopo
- [ ] blocco sospensione

## Dettaglio

- [ ] sezione partecipanti familiari
- [ ] sezione partecipanti professionali
- [ ] sezione provvedimento collegato
- [ ] sezione valutazione qualitativa
- [ ] sezione note riservate con rispetto permessi

## QA minima da fare

- [ ] create con 2 familiari
- [ ] create con 2 professionisti
- [ ] create con documento provvedimento collegato
- [ ] reopen in edit e verifica persistenza
- [ ] filtro lista coerente
