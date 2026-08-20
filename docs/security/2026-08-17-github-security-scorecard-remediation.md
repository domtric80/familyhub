# GitHub security posture e remediation Scorecard

Data apertura: 2026-08-17
Data chiusura bonifica repository: 2026-08-20

## Baseline

OpenSSF Scorecard iniziale per `github.com/domtric80/familyhub`: `3.6/10`.

Il valore basso non indicava vulnerabilità note:

- `Vulnerabilities`: 10/10;
- Composer audit: 0 advisory;
- npm audit completo: 0 vulnerabilità;
- Dependabot: 0 alert aperti.

## Cause principali

- assenza di SAST continuo;
- assenza di Dependabot configurato nei manifest runtime;
- GitHub Actions non pin-nate a commit SHA;
- CI non eseguita su ogni pull request;
- branch `master` non protetto;
- token del workflow release con permesso write globale;
- nessun workflow Scorecard pubblicato in code scanning;
- 3.878 file del template commerciale Cuba tracciati nel repository pubblico, inclusa una chiave Google demo rilevata da secret scanning.

## Correzioni applicate

- aggiunto `.github/dependabot.yml` per Composer, frontend npm, GitHub Actions e Docker;
- aggiunta CI su push e pull request con test backend, build frontend e audit dipendenze;
- aggiunto CodeQL JavaScript/TypeScript su push, pull request e schedulazione;
- aggiunta Dependency Review con blocco dalla severità `low`;
- aggiunto OpenSSF Scorecard con pubblicazione SARIF in GitHub code scanning;
- action pin-nate a SHA e credenziali checkout non persistenti;
- permessi release ridotti a read globalmente e write solo nel job necessario;
- aggiornato `SECURITY.md` alla linea 1.4.x e riscritto in UTF-8;
- escluso integralmente `vendor-assets/` da Git, mantenendo i file solo nel workspace locale.

## Bonifica della cronologia

La sola rimozione dal branch corrente non eliminava il segreto dai tag e dalla cronologia pubblicata. È stata quindi eseguita una bonifica completa:

1. backup bundle di tutti i riferimenti originali;
2. backup separato di `vendor-assets/` e del working tree non committato;
3. riscrittura della cronologia con rimozione totale di `vendor-assets/`;
4. verifica di assenza del percorso su tutti i branch e tag riscritti;
5. ricreazione del repository pubblico `domtric80/familyhub`;
6. ripubblicazione dei branch puliti;
7. ripristino delle sette release storiche con note UTF-8 verificate.

GitHub conserva in modo permanente i nomi dei tag associati a release immutabili eliminate. Per questo le release storiche mantengono titolo e contenuto originali, ma usano tag tecnici `history-vX.Y.Z`. Le release future riprendono la convenzione ordinaria `vX.Y.Z`.

## Stato GitHub verificato

- Private Vulnerability Reporting: attivo;
- Dependabot security updates: attivo;
- Secret scanning: attivo;
- Push protection per segreti: attiva;
- release immutabili: attive;
- alert secret scanning aperti: 0;
- alert Dependabot aperti: 0;
- file `vendor-assets/` indicizzati da Git: 0;
- file Cuba conservati localmente per UX: 3.878;
- release storiche ripristinate: 7;
- release più recente ripristinata: FamilyHub v1.4.0.

CodeQL, Dependency Review, CI e Scorecard diventano operativi dopo il push dei workflow di hardening.

## Decisioni ancora necessarie

- branch protection su `master`: raccomandata, ma modifica il flusso operativo imponendo pull request e check obbligatori;
- firma crittografica di tag e release: da progettare con chiave custodita fuori dal repository;
- fuzzing: fase successiva, dopo individuazione dei parser e delle API più adatti.
