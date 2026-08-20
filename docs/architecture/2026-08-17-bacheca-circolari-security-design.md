# Bacheca e circolari — disegno di sicurezza

## Obiettivo

Fornire comunicazioni operative per struttura con destinatari verificabili, scadenza e presa visione individuale. Il modulo non sostituisce la messaggistica cifrata: una circolare è una comunicazione ufficiale pubblicata, non una conversazione.

## Entità

- `facility_bulletins`: circolare della struttura; stato `DRAFT`, `PUBLISHED`, `ARCHIVED`; titolo, contenuto cifrato a riposo, data pubblicazione e scadenza.
- `facility_bulletin_role_targets`: ruoli destinatari; assenza di record significa tutti gli utenti con ruolo attivo nella struttura.
- `facility_bulletin_acknowledgements`: una sola presa visione per utente e circolare, con timestamp.

## Autorizzazione

| Operazione | Permesso | Ruoli iniziali |
|---|---|---|
| Elencare/leggere destinatari | `facility_bulletins.read` | ruoli operativi della struttura |
| Creare/modificare/archiviare | `facility_bulletins.manage` | Super Admin, Direttore, Coordinatore, Referente struttura |
| Pubblicare | `facility_bulletins.publish` | Super Admin, Direttore, Coordinatore, Referente struttura |
| Presa visione | `facility_bulletins.acknowledge` | ruoli operativi destinatari |

Il backend verifica sempre una relazione di ruolo attiva nella struttura, il targeting per ruolo e lo stato pubblicato/non scaduto. Non è consentito riconoscere, leggere o dedurre circolari destinate ad altri ruoli.

## Audit e privacy

Sono auditati creazione, modifica, pubblicazione, archiviazione, lettura e presa visione. L'audit conserva metadati e stato, non il corpo cifrato della circolare. Il contenuto non viene inviato in notifiche push/email: tali canali potranno contenere solo un invito ad accedere alla piattaforma.

## Vincoli

- una circolare pubblicata è immutabile: per correggerla si archivia e se ne pubblica una nuova;
- la presa visione è idempotente, ma la prima conferma resta prova dell'azione;
- la scadenza non cancella lo storico né le prese visione;
- non introdurre destinatari testuali: usare ruoli RBAC già configurati.
