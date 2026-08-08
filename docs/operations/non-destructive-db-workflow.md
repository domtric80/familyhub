# FamilyHub · Workflow DB non distruttivo

Data: 2026-06-28

## Regola operativa obbligatoria

Ogni ciclo tecnico che può impattare persistenza, autenticazione, Docker stack o configurazioni runtime deve partire da un backup.

Questo vale prima di:

- migrazioni
- restart o recreate dei container applicativi
- modifiche a `docker-compose.yml`
- modifiche a entrypoint o bootstrap
- fix su autenticazione, MFA, utenti o RBAC
- import massive o procedure batch

## Divieti sul database condiviso

Sul database di lavoro condiviso non devono essere eseguiti senza richiesta esplicita:

- `migrate:fresh`
- `db:wipe`
- drop schema o drop database
- reset dei volumi Docker di Postgres

## Comandi ammessi normalmente

- `php artisan migrate --force`
- seed idempotenti o bootstrap minimo
- update puntuali su dati anagrafici richiesti

## Procedura standard di ciclo

Backup manuale:

- `C:\Projects\FamilyHUB\scripts\db-backup.ps1`

Snapshot rapido stato DB:

- `C:\Projects\FamilyHUB\scripts\db-guard.ps1`

Restore dall'ultimo backup valido:

- `C:\Projects\FamilyHUB\scripts\db-restore.ps1`

Esecuzione protetta con backup obbligatorio nello stesso ciclo:

- `C:\Projects\FamilyHUB\scripts\safe-cycle.ps1 -Command "<comando>"`

Output generato:

- dump SQL in `C:\Projects\FamilyHUB\backups\db`
- puntatore ultimo backup in `C:\Projects\FamilyHUB\backups\db\latest.json`
- snapshot logico di controllo su utenti, minori, strutture, organizzazioni

## Guard-rail automatico

Lo script `safe-cycle.ps1` ora esegue automaticamente:

1. backup obbligatorio
2. snapshot DB pre-ciclo
3. esecuzione comando
4. snapshot DB post-ciclo
5. confronto insiemi critici
6. restore automatico se rileva azzeramento inatteso

Insiemi critici monitorati:

- `users`
- `facilities`
- `organizations`
- `minors`

Regola:

- se prima del ciclo un insieme critico aveva record
- e dopo il ciclo scende a zero
- il ciclo viene considerato distruttivo
- parte il restore automatico dall'ultimo backup creato

Eccezione intenzionale:

- usare `-AllowEmptyAfter` solo per operazioni consapevoli di laboratorio
- mai sul database condiviso

## Verifiche obbligatorie dopo ogni fix sensibile

1. verificare accesso admin
2. verificare conteggio utenti
3. verificare conteggio minori
4. verificare che non siano partiti reset o seed distruttivi
5. verificare che `safe-cycle.ps1` non abbia segnalato restore automatico

## Nota pratica

Se spariscono utenti, minori o anagrafiche, la causa probabile non è il codice applicativo ordinario ma:

- volume Postgres ricreato
- bootstrap eseguito su DB vuoto
- intervento manuale distruttivo
- restart applicativo con configurazione non stabile

## Impegno operativo fissato

Da ora in avanti ogni modifica strutturale che tocca persistenza deve seguire questo ordine:

1. backup DB
2. modifica tecnica non distruttiva
3. verifica dati esistenti
4. eventuale seed idempotente
5. verifica login e anagrafiche

## Procedura obbligatoria per questo progetto

Per FamilyHub, ogni comando rischioso deve essere lanciato così:

- `powershell -ExecutionPolicy Bypass -File C:\Projects\FamilyHUB\scripts\safe-cycle.ps1 -Command "<comando>"`

Esempi:

- `powershell -ExecutionPolicy Bypass -File C:\Projects\FamilyHUB\scripts\safe-cycle.ps1 -Command "docker compose -f C:\Projects\FamilyHUB\docker-compose.yml exec -T app php artisan migrate --force"`
- `powershell -ExecutionPolicy Bypass -File C:\Projects\FamilyHUB\scripts\safe-cycle.ps1 -Command "docker compose -f C:\Projects\FamilyHUB\docker-compose.yml restart app worker nginx"`
