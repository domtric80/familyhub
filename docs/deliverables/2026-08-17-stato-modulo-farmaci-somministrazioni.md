# Stato modulo Farmaci e somministrazioni

Data: 2026-08-17

## Stato backend

Completata la prima fase sanitaria prevista dal capitolato:

- anagrafica relazionale dei farmaci;
- unità di dosaggio, vie di somministrazione ed esiti controllati;
- piani farmacologici per minore con prescrittore e ricetta collegabile;
- pianificazione settimanale degli orari;
- registro append-only delle somministrazioni con firma applicativa autenticata;
- prevenzione delle doppie registrazioni, inclusa la concorrenza;
- alert di scadenza dei piani;
- cifratura a riposo di istruzioni e note;
- RBAC per struttura e assegnazione attiva al minore;
- audit e storico del minore per le operazioni rilevanti.

## Migrazione runtime

- batch applicato: `17`;
- migrazione: `2026_08_17_140000_create_minor_medication_module.php`;
- backup verificato prima della migrazione: `C:\Projects\FamilyHUB\backups\pre-migration\familyhub-pre-medications-20260817-101645.dump`;
- nessun reset, truncate o seeding del database runtime.

## Validazione

- test dedicato: `MinorMedicationApiTest`;
- copertura dedicata: 1 test, 15 asserzioni;
- regressione con incidenti e media attività: 5 test, 69 asserzioni.

## Frontend

L'integrazione UX è descritta in `docs/ux-handoff/requests/2026-08-17-195-farmaci-somministrazioni-contract.md`.

Il frontend non è stato modificato dal team backend.

## Seguito pianificato

Restano separati per evitare un modulo sanitario monolitico:

- visite, esami e accessi al pronto soccorso;
- crescita e percentili;
- relativi alert, audit e viste UX.
