# Stato modulo Eventi sanitari

Data: 2026-08-17

## Completato

- visite pediatriche, generali e specialistiche;
- esami di laboratorio e diagnostici;
- accessi al pronto soccorso;
- stati programmato, completato e annullato;
- professionista ed ente sanitario relazionali;
- referto/documento esistente collegabile;
- follow-up e alert;
- cifratura narrativa clinica;
- RBAC, accesso minore, ABAC documentale, audit e storico.

## Migrazione runtime

- batch `18`;
- migrazione `2026_08_17_150000_create_minor_health_events.php`;
- backup verificato `C:\Projects\FamilyHUB\backups\pre-migration\familyhub-pre-health-events-20260817.dump`;
- dimensione backup: 62.516.733 byte;
- TOC verificato: 1.277 voci;
- nessun reset, truncate o seeding runtime.

## Frontend

Handoff: `docs/ux-handoff/requests/2026-08-17-196-eventi-sanitari-visite-esami-ps-contract.md`.

Il backend non ha modificato file frontend.

## Validazione

- test dedicato: 1 test, 16 asserzioni;
- regressione combinata eventi sanitari, farmaci e incidenti: 5 test, 65 asserzioni;
- rotte API verificate con middleware autenticazione, accesso minori, audit e permission-check.
