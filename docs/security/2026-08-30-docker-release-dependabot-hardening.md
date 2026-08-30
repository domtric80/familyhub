# Hardening Docker, release firmate e triage Dependabot

Data: 2026-08-30

## Obiettivo

Ridurre gli alert OpenSSF Scorecard legati a dipendenze non fissate e rafforzare il processo di release prima dei prossimi sviluppi funzionali.

## Docker image pinning

Le immagini Docker principali sono ora dichiarate in formato `tag@sha256:digest`.

File aggiornati:

- `docker-compose.yml`
- `docker-compose.prod.yml`
- `backend/.dockerignore`
- `backend/Dockerfile`
- `backend/Dockerfile.prod`
- `frontend/Dockerfile`
- `frontend/Dockerfile.prod`

Immagini fissate:

- `php:8.4-cli-alpine@sha256:2f389f933c3cc58cc622bd243bb4ecff7e6553e2de4387a239bca640c988be19`
- `composer:2@sha256:4d71c3c2109c61d5415544264b59ad4087e4c5b7244481723664138fd36d5040`
- `node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32`
- `nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10`
- `postgres:16-alpine@sha256:cf78e76683b9ca8c5733cbbdce6c9262b45b6767934dd0a95e671f9a0fc20685`
- `redis:7-alpine@sha256:ff02b58f971e7d7d156a1267e283fcbbeee91773b6aa36c49dac28ecfe28eadf`
- `minio/minio:latest@sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e`
- `minio/mc:latest@sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727`
- `clamav/clamav:stable@sha256:0e85467cb0d6e7d860a45035707741cd5ffc032ffefc6002a3510c75b6d07027`
- `docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e`

Eccezione aperta:

- `chaitin/safeline:latest` e un placeholder legacy nel profilo locale `edge`
- il comando `docker buildx imagetools inspect chaitin/safeline:latest` fallisce con accesso negato o repository non esistente
- per produzione il WAF SafeLine va installato con il compose ufficiale Chaitin, non con questo placeholder locale

## Release firmate

Il workflow `.github/workflows/release.yml` ora:

- richiede `RELEASE_GPG_PRIVATE_KEY`
- richiede `RELEASE_GPG_PASSPHRASE`
- importa la chiave GPG solo durante il job di release
- crea il tag con `git tag -s`
- esegue `git tag -v` prima del push
- interrompe la release se la firma non e verificabile

## Fix emersi durante la validazione

La build di produzione ha evidenziato due problemi operativi non collegati al codice applicativo:

- `backend/public/storage` era un reparse point locale non tracciato da Git e veniva incluso nel contesto Docker, causando `invalid file request public/storage`
- `backend/Dockerfile.prod` eseguiva `composer install` prima del copy completo del progetto, quindi lo script Laravel `artisan package:discover` falliva per assenza di `artisan`

Correzioni applicate:

- `backend/.dockerignore` esclude `public\storage`
- `backend/Dockerfile.prod` usa `composer install --no-scripts` prima del copy completo e lascia la discovery Laravel al successivo `composer dump-autoload`

## Triage PR Dependabot aperte

Stato rilevato il 2026-08-30:

- `#18` nginx `1.27-alpine` -> `1.31-alpine`: major/minor runtime, da testare con frontend prod build e smoke Nginx
- `#13` Node `22-alpine` -> `26-alpine`: major runtime, da valutare solo dopo compatibilita Vite/TypeScript
- `#10` PHP `8.4-cli-alpine` -> `8.5-cli-alpine`: major runtime, richiede test backend completo e verifica estensioni PHP
- `#12` OpenSSF Scorecard `2.4.2` -> `2.4.4`: aggiornamento security tooling, candidato a merge dopo CI
- `#9` CodeQL analyze `3.x` -> `4.x`: major action, verificare supporto repo privato e permessi SARIF
- `#8` actions/checkout `4.x` -> `7.x`: major action, verificare changelog e compatibilita token
- `#7` dependency-review-action `4.x` -> `5.x`: major action, verificare policy PR
- `#6` CodeQL upload-sarif `3.x` -> `4.x`: major action, coordinare con `#9`
- `#5` Vite `6.x` -> `8.x`: major frontend, richiede build e smoke UI
- `#4` typescript-eslint patch/minor: candidato a merge dopo build frontend
- `#3` @types/node major: coordinare con upgrade Node, non fondere isolato
- `#2` @types/reactstrap patch: candidato a merge dopo build frontend
- `#1` TypeScript `6.x` -> `7.x`: major frontend, richiede verifica compilazione completa
- `#14` `agent/security-baseline-hardening`: confliggente e storicamente superato in parte, da chiudere o ricreare pulito

## Regola operativa

Non fondere major upgrade solo per eliminare rumore Dependabot. Ogni major deve avere:

- branch dedicato
- build/test/audit verdi
- smoke funzionale della parte impattata
- aggiornamento digest Docker se riguarda immagini container
- release note o nota tecnica se cambia runtime
