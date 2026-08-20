# Security Policy

FamilyHub tratta dati personali e sanitari particolarmente sensibili. Le segnalazioni vengono gestite tramite disclosure responsabile e canali privati.

## Versioni supportate

| Versione | Supporto |
| --- | --- |
| `1.4.x` | Supportata con fix funzionali e di sicurezza |
| `< 1.4.0` | Non supportata; aggiornamento raccomandato |

La versione corrente è indicata nel file `VERSION` e nel `CHANGELOG.md`.

## Segnalare una vulnerabilità

Non aprire issue pubbliche contenenti dettagli tecnici, credenziali, dati personali o proof of concept sfruttabili.

Usare come canale principale **GitHub Private Vulnerability Reporting** nella sezione `Security` del repository `domtric80/familyhub`.

Il report dovrebbe includere:

- componente e versione coinvolti;
- impatto su confidenzialità, integrità, disponibilità o audit;
- passaggi minimi per riprodurre;
- eventuale richiesta HTTP, log o PoC priva di dati reali;
- ambiente interessato: locale, Docker o produzione.

## Tempi obiettivo

- conferma di ricezione: 3 giorni lavorativi;
- prima valutazione: 5 giorni lavorativi;
- piano di remediation: 10 giorni lavorativi, salvo casi complessi.

Questi tempi sono obiettivi operativi e non costituiscono SLA contrattuale.

## Ambito prioritario

- autenticazione, MFA e gestione sessioni;
- RBAC applicativo e assegnazioni ai minori;
- ABAC documentale e note cifrate;
- upload, preview e download;
- storage S3/MinIO e gestione segreti;
- audit log e storico minore;
- API, Docker, reverse proxy e WAF;
- dipendenze Composer, npm, immagini Docker e GitHub Actions.

## Regole per i test

- non accedere a dati reali senza autorizzazione;
- non effettuare esfiltrazione, persistenza o interruzione del servizio;
- non pubblicare dettagli prima del coordinamento con il maintainer;
- usare dati sintetici e il minimo impatto necessario alla verifica.

## Processo di remediation

1. triage e classificazione;
2. riproduzione controllata;
3. correzione e test di regressione;
4. aggiornamento di audit, documentazione e contratti API se coinvolti;
5. release patch o minor con note dedicate;
6. disclosure coordinata dopo disponibilità del fix.

## Supply chain

I manifest runtime ufficiali sono:

- `backend/composer.json` e `backend/composer.lock`;
- `frontend/package.json` e `frontend/package-lock.json`;
- immagini dichiarate nei file Docker Compose;
- action dichiarate in `.github/workflows/`.

Il repository utilizza Dependabot, dependency review, CodeQL, audit Composer/npm e OpenSSF Scorecard. Gli asset vendor non utilizzati in produzione non fanno parte della supply chain runtime.
