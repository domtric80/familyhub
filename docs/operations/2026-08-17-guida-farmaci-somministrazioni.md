# Guida operativa — Farmaci e somministrazioni

## Flusso

1. Censire il farmaco nel catalogo, se assente.
2. Creare il piano scegliendo farmaco, dose, unità, via, prescrittore e date.
3. Collegare facoltativamente la ricetta già caricata nei documenti del minore.
4. Inserire uno o più orari e giorni settimanali.
5. L'educatore assegnato registra l'esito della dose prevista.

## Esiti

- Somministrato
- Rifiutato
- Non somministrato
- Sospeso

Ogni registrazione è firmata dall'utente autenticato e non è modificabile o cancellabile. Un duplicato per lo stesso piano e momento previsto viene bloccato.

## Alert

La pagina alert mostra piani scaduti o prossimi alla scadenza. La ricetta resta un documento clinico protetto e segue separatamente RBAC, ABAC e scansione di sicurezza.

## Sicurezza

Istruzioni e note sono cifrate nel database. `ADMIN_IT` può amministrare il catalogo ma non accede ai piani dei minori. La firma è applicativa autenticata e non equivale a firma elettronica qualificata.
