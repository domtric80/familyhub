# Security Policy

FamilyHub tratta dati personali e dati ad alta sensibilità operativa. Le segnalazioni di sicurezza vengono quindi gestite con priorità e con un processo di disclosure responsabile.

## Ambito

Questa policy si applica al repository:

- `https://github.com/domtric80/familyhub`

e ai componenti runtime ufficiali del progetto:

- `backend/` — API Laravel
- `frontend/` — applicazione React/Vite
- `docker-compose.yml`
- `docker-compose.prod.yml`
- configurazioni storage S3/MinIO, health checks e processi documentali descritti nella documentazione di progetto

Sono esclusi dall’ambito runtime:

- asset vendor di riferimento non eseguiti in produzione
- materiale di supporto in `tmp/`
- dipendenze o template non collegati allo stack FamilyHub attivo

## Versioni supportate

Alla data del `2026-08-09`, la versione corrente del progetto è `1.1.1`.

| Versione | Stato supporto | Note |
| --- | --- | --- |
| `1.1.x` | ✅ supportata | linea corrente, riceve fix funzionali e di sicurezza |
| `1.0.x` | ⚠️ supporto limitato | solo fix selettivi e attività di riallineamento verso `1.1.x` |
| `< 1.0.0` | ❌ non supportata | nessun aggiornamento previsto |

Regola operativa:

- i fix di sicurezza vengono applicati prima alla linea corrente
- eventuali backport su `1.0.x` vengono valutati caso per caso
- non è garantito supporto per fork o deploy alterati fuori dalla configurazione documentata

## Come segnalare una vulnerabilità

Per segnalazioni di sicurezza **non aprire issue pubbliche**.

Usare il canale privato:

- email: `domtric80@gmail.com`
- oggetto consigliato: `[FamilyHub Security] breve titolo del problema`

Nel messaggio includere, se possibile:

- descrizione del problema
- impatto atteso
- componente coinvolto (`backend`, `frontend`, `documenti`, `RBAC`, `ABAC`, `storage`, `docker`, ecc.)
- passaggi per riprodurre
- ambiente coinvolto (`locale`, `docker`, `produzione`)
- eventuale PoC, log, screenshot o richiesta HTTP
- indicazione se la vulnerabilità coinvolge dati reali o solo ambiente di test

## Tempi di presa in carico

Obiettivi di servizio attesi:

- conferma ricezione: entro `3` giorni lavorativi
- prima valutazione triage: entro `5` giorni lavorativi
- piano di remediation o stato dell’analisi: entro `10` giorni lavorativi, salvo casi complessi

Questi tempi sono obiettivi operativi e non costituiscono SLA contrattuale.

## Processo di gestione

Quando una segnalazione è valida, il processo minimo è:

1. triage iniziale e classificazione
2. riproduzione tecnica del problema
3. valutazione impatto su:
   - confidenzialità
   - integrità
   - disponibilità
   - tracciabilità/audit
4. definizione della remediation
5. validazione tecnica del fix
6. rilascio in versione patch/minor secondo il processo ufficiale di release
7. aggiornamento di:
   - `CHANGELOG.md`
   - `docs/releases/`
   - eventuale documentazione operativa o UX/API impattata

## Disclosure responsabile

Si richiede di:

- evitare accessi distruttivi, esfiltrazione o alterazione intenzionale di dati
- non colpire sistemi di terzi
- non interrompere il servizio intenzionalmente
- non pubblicare dettagli tecnici prima del coordinamento con il maintainer

Se la segnalazione viene confermata, FamilyHub si impegna a gestirla in buona fede e a riconoscerne la priorità nel backlog di sicurezza.

## Buone pratiche di verifica per chi segnala

Le aree particolarmente sensibili del progetto sono:

- autenticazione e MFA
- sessioni e scadenza token
- RBAC applicativo
- ABAC documentale
- upload, preview e download documenti
- storage S3/MinIO e cifratura delle credenziali
- audit log e accesso ai dati del minore
- esposizione dei servizi Docker / reverse proxy / WAF

Le segnalazioni che includono il contesto preciso di una di queste aree sono più rapide da verificare.

## Dipendenze e supply chain

Gli audit rilevanti per il progetto vengono eseguiti sui manifest runtime ufficiali:

- `frontend/package.json`
- `frontend/package-lock.json`
- `backend/composer.json`
- `backend/composer.lock`
- `backend/package.json` se usato nel bootstrap locale Laravel/Vite

Manifest vendor non runtime o lockfile obsoleti non fanno parte della supply chain ufficiale e vengono rimossi dal repository quando generano rumore di sicurezza non pertinente.

## Note finali

- questa policy può essere aggiornata con l’evoluzione del progetto
- per i rilasci fare riferimento a `docs/releases/RELEASE-PROCESS.md`
