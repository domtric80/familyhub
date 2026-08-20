# Eventi sanitari — security design

Data: 2026-08-17

## Ambito

Il modulo registra visite pediatriche, visite mediche, visite specialistiche, esami di laboratorio, esami diagnostici e accessi al pronto soccorso.

## Controlli

- RBAC `minor_health.*` sulla struttura;
- assegnazione attiva dell'utente al minore, salvo ruoli privilegiati configurati;
- categorie e stati relazionali, mai digitati liberamente;
- professionista limitato a medico di base o pediatra della stessa struttura;
- ente sanitario selezionato dall'anagrafica enti;
- documento collegato obbligatoriamente appartenente allo stesso minore;
- apertura del documento demandata agli endpoint documentali ABAC;
- motivazione, riscontro clinico ed esito cifrati a riposo mediante cast Laravel `encrypted`;
- nessun endpoint delete;
- audit e storico minore su creazione e modifica;
- diff audit privo dei testi clinici, per evitare duplicazioni sensibili in chiaro.

## Coerenza workflow

- `COMPLETED` richiede `occurred_at`;
- `CANCELLED` vieta `occurred_at`;
- appuntamenti programmati e follow-up alimentano gli alert;
- i testi clinici sono narrativa protetta, non anagrafiche riutilizzabili.
