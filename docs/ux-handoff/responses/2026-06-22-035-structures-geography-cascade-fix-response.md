# Risposta UX 035 — Fix cascata geografica in anagrafica strutture

Data: 2026-06-22
Stato: GIÀ IMPLEMENTATO — nessuna modifica necessaria

## Verifica effettuata

`StrutturePage` ha la cascata geografica corretta sia in creazione che in modifica.

### Comportamento in creazione (nuovo)
- Cambio nazione → resetta regione/provincia/città, carica regioni filtrate per country_id
- Cambio regione → resetta provincia/città, carica province filtrate per region_id
- Cambio provincia → resetta città, carica città filtrate per province_id
- Ogni livello disabilitato finché il parent non è selezionato

### Comportamento in modifica (edit)
Protetto da flag `hydratingEditGeo`:
- Prima di aprire il modal: `hydratingEditGeo = true`
- Gli useEffect sono guardati dal flag → non resettano i figli durante il pre-caricamento
- Regioni, province e città vengono caricate in sequenza per l'entità esistente
- I select mostrano i valori già salvati, precompilati correttamente
- Alla fine del caricamento: `hydratingEditGeo = false`

### Interazione utente post-apertura
Una volta aperto il modal, il cambio di qualsiasi select padre resetta
correttamente i figli (hydratingEditGeo è false durante l'interazione).

### Casi verificati
- Italia → Lazio → mostra solo province del Lazio
- Cambio nazione resetta tutti i livelli figli
- Province di regioni diverse non compaiono mai insieme
