# Release Process

## Obiettivo

Questo documento definisce il processo ufficiale di rilascio di FamilyHub.

Alla data del `2026-08-09`, il progetto usa un processo di release **manuale controllato**, con pubblicazione su GitHub e aggiornamento obbligatorio della documentazione di versione.

Questo processo è valido finché non verrà introdotta una pipeline automatizzata di release.

## Regole generali

- il versionamento segue `Semantic Versioning`: `MAJOR.MINOR.PATCH`
- ogni release deve essere tracciata in modo coerente in codice, changelog, documentazione e GitHub
- una release non è completa finché non esistono:
  - commit finale stabile
  - aggiornamento `VERSION`
  - aggiornamento `README.md` sulla versione corrente
  - aggiornamento `CHANGELOG.md`
  - file note release in `docs/releases/`
  - tag Git `vX.Y.Z`
  - release GitHub pubblicata o aggiornata

## Quando aumentare la versione

### Patch `X.Y.Z`

Usare una patch quando cambiano:

- bugfix
- correzioni UX/API senza breaking change
- fix di sicurezza
- hardening infrastrutturale senza impatto incompatibile
- correzioni documentali rilevanti per il deploy o la sicurezza

Esempio:

- `1.1.1` → `1.1.2`

### Minor `X.Y.0`

Usare una minor quando aggiungiamo:

- nuove funzionalità retrocompatibili
- nuovi moduli
- nuove API senza rompere quelle esistenti
- nuove pagine amministrative o operative compatibili

Esempio:

- `1.1.1` → `1.2.0`

### Major `X.0.0`

Usare una major quando introduciamo:

- breaking change API
- cambi di modello dati incompatibili
- rimozione/riscrittura di moduli con impatto di migrazione
- cambi di processo o architettura che richiedono adeguamenti esterni

Esempio:

- `1.1.1` → `2.0.0`

## Checklist pre-release

Prima di aprire una release, verificare almeno:

### Codice e stato repository

- working tree pulito o modifiche deliberate e comprese
- branch corretto
- nessun file temporaneo o vendor non runtime da includere per errore

### Backend

- test backend rilevanti verdi
- migrazioni coerenti e verificate
- nessun reset dati non giustificato
- audit / permessi / enforcement coerenti con i moduli toccati

### Frontend

- build frontend verde
- nessun errore bloccante TypeScript/Vite
- handoff UX aggiornato se il contratto backend/frontend è cambiato

### Sicurezza

- `composer audit` senza nuove vulnerabilità accettate inconsapevolmente
- `npm audit` coerente con lo stack runtime ufficiale
- verifica dei lockfile tracciati nel repo
- verifica rapida di `SECURITY.md` se cambia la politica

### Documentazione

- `CHANGELOG.md` aggiornato
- file release notes dedicato creato in `docs/releases/`
- `README.md` aggiornato se cambia la versione corrente o il flusso installativo
- OpenAPI aggiornata se cambiano endpoint o payload

## Procedura operativa

### 1. Scegliere la nuova versione

Aggiornare:

- `VERSION`
- `README.md` nella sezione “Versione corrente”

### 2. Aggiornare il changelog

Modificare `CHANGELOG.md` inserendo:

- data release
- tipo di modifiche
- sezioni consigliate:
  - `Added`
  - `Changed`
  - `Fixed`
  - `Security`
  - `Notes`

### 3. Creare le release notes dedicate

Creare un nuovo file:

- `docs/releases/YYYY-MM-DD-vX.Y.Z.md`

Contenuto minimo consigliato:

- numero versione
- data
- obiettivo della release
- moduli coinvolti
- fix / feature / security
- eventuali azioni operative richieste
- eventuali breaking change o note deploy

### 4. Verificare il software

Eseguire almeno i controlli pertinenti al blocco rilasciato, ad esempio:

```powershell
docker compose exec app php artisan test
docker compose exec frontend npm run build
docker compose exec app composer audit --format=json
docker compose exec frontend npm audit --omit=dev --json
```

Se la release impatta solo una parte del sistema, è accettabile eseguire test mirati aggiuntivi o sostitutivi, purché documentati nelle note di release o nel messaggio di commit.

### 5. Commit finale di release

Usare un commit esplicito, ad esempio:

```text
chore(release): publish v1.1.2
```

### 6. Creare il tag Git

```powershell
git tag -a v1.1.2 -m "FamilyHub v1.1.2"
git push origin master
git push origin v1.1.2
```

### 7. Pubblicare la release GitHub

La release GitHub può essere creata manualmente. Al momento è una procedura **accettata e ufficiale**.

Campi minimi consigliati:

- tag: `vX.Y.Z`
- titolo: `FamilyHub vX.Y.Z`
- descrizione: sintesi della release basata su `docs/releases/YYYY-MM-DD-vX.Y.Z.md`

Se la release è stabile, non marcarla come pre-release.

## Standard per le release notes

Ogni release deve rispondere a queste domande:

- cosa è stato introdotto o corretto
- perché è rilevante
- quali moduli sono coinvolti
- se sono richieste azioni operative
- se ci sono note di sicurezza o deploy

## Release manuali: va bene?

Sì. Alla data attuale, la gestione manuale delle release è corretta, a patto che sia disciplinata.

Una release manuale è considerata valida quando:

- il numero versione è allineato ovunque
- changelog e release notes coincidono
- il tag Git è presente
- la release GitHub è pubblicata

## Cosa non fare

- non pubblicare una release senza tag
- non aggiornare solo `README.md` senza `VERSION` e `CHANGELOG.md`
- non rilasciare modifiche con working tree sporco o non compreso
- non far sparire differenze documentali tra backend, UX e note di release
- non usare lockfile multipli (`npm` + `pnpm`) se il progetto ne adotta uno solo come standard

## Standard attuale del repository

Alla data del `2026-08-09`, lo standard FamilyHub è:

- frontend: `npm` + `package-lock.json`
- backend PHP: `composer.lock`
- release notes archiviate in `docs/releases/`
- pubblicazione release su GitHub gestita manualmente

## Evoluzione futura consigliata

Quando il progetto crescerà ancora, sarà utile automatizzare:

- validazione checklist release
- creazione tag
- generazione draft release notes
- validazione version bump
- controllo allineamento tra `VERSION`, `README.md` e `CHANGELOG.md`
