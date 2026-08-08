# Runtime Docker frontend · Informazioni operative mancanti

- `Request ID`: 2026-06-19-004
- `Stato`: OPEN

## 1. Contesto

Il team frontend ha segnalato che non dispone delle informazioni necessarie
per lavorare correttamente nello stack Docker del frontend.

Per questo motivo è stato creato il documento operativo:

- `C:\Projects\FamilyHUB\docs\architecture\frontend-docker-runtime.md`

## 2. Cosa deve leggere il team frontend

Documenti chiave:

- `C:\Projects\FamilyHUB\docs\architecture\frontend-docker-runtime.md`
- `C:\Projects\FamilyHUB\docker-compose.yml`
- `C:\Projects\FamilyHUB\frontend\package.json`
- `C:\Projects\FamilyHUB\frontend\Dockerfile`

## 3. Informazioni contenute

- nome servizio Docker frontend
- porta di esposizione utente
- porta interna dev server
- working directory nel container
- bind mount e volume `node_modules`
- comandi standard di lavoro
- procedura di reset completo dipendenze
- cause tipiche dei fallimenti build

## 4. Azione richiesta al team frontend

Il team deve confermare di aver compreso:

- dove lavorare
- come avviare e diagnosticare il container
- come resettare `node_modules`
- come distinguere problemi di codice da problemi di volume/container

## 5. Richiesta di risposta

Creare file risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-19-004-frontend-docker-runtime-response.md`

## 6. Checklist team frontend

- [ ] runtime Docker compreso
- [ ] path host/container compresi
- [ ] procedura reset dipendenze compresa
- [ ] comandi standard verificati
- [ ] eventuali dubbi residui riportati

