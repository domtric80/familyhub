# Guida sezione Timesheet

Data: 2026-08-13

## Scopo

La sezione `Timesheet` serve a trasformare i turni pianificati in un consuntivo operativo e amministrativo verificabile.

Il modulo separa sempre tre livelli:

- `Turni` = pianificazione originaria
- `Presenze` = eventi reali di entrata, uscita e pausa
- `Timesheet` = consuntivo risultante, revisionabile, approvabile, esportabile

Questa distinzione e obbligatoria per non perdere:

- il piano originario
- gli scostamenti reali
- lo storico delle rettifiche
- la tracciabilita audit

## Cosa puo fare l'educatore

L'educatore puo:

- registrare eventi presenza
- vedere il proprio elenco presenze e consuntivi
- chiudere e firmare operativamente il proprio turno
- inviare il proprio timesheet in stato `submitted`
- vedere eventuali anomalie e rettifiche sulle proprie entry

L'educatore non approva il timesheet e non puo bloccare il mese.

## Cosa puo fare il coordinatore

Il coordinatore puo:

- consultare tutte le entry timesheet della struttura
- aprire il dettaglio di una entry
- verificare anomalie e scostamenti
- approvare o rifiutare entry `submitted`
- creare rettifiche
- approvare o rifiutare rettifiche pending
- monitorare KPI e dashboard timesheet
- bloccare o riaprire il mese contabile
- esportare il timesheet in CSV e PDF

## Flusso operativo standard

1. il coordinatore pianifica il turno
2. l'operatore timbra entrata, eventuali pause e uscita
3. il backend calcola o aggiorna la `timesheet_entry`
4. l'operatore chiude e firma il turno
5. il consuntivo passa in `submitted`
6. il coordinatore verifica eventuali anomalie o rettifiche
7. il coordinatore approva o rifiuta
8. a fine periodo il mese puo essere bloccato ed esportato

## Stati principali della entry

Una entry timesheet puo stare in uno dei seguenti stati:

- `draft`
- `computed`
- `submitted`
- `approved`
- `rejected`
- `locked`

### Significato pratico

- `draft`: eventi ancora incompleti o appena creati
- `computed`: consuntivo calcolato ma non ancora inviato
- `submitted`: inviato dall'operatore o chiuso operativamente
- `approved`: validato dal coordinatore
- `rejected`: respinto, in attesa di nuova sistemazione o reinvio
- `locked`: chiusura amministrativa del mese, nessuna modifica ammessa

## Anomalie operative

Il sistema puo evidenziare, tra le altre:

- ritardo in entrata
- uscita anticipata
- mancanza timbratura uscita
- lavoro non pianificato
- assenza pausa
- superamento ore giornaliere
- violazione riposo minimo
- soglia ore settimanali superata

Le anomalie non sono tutte bloccanti, ma devono essere visibili in revisione.

## Rettifiche

Le rettifiche servono per correggere il consuntivo senza alterare lo storico delle timbrature.

Esempi:

- correzione manuale minuti
- riconciliazione assenza
- correzione pausa

Flusso:

- creazione rettifica -> `pending`
- revisione coordinatore
- approvazione -> impatta il consuntivo
- rifiuto -> nessun impatto sui minuti

## Lock mensile

Il lock mensile serve alla chiusura amministrativa del periodo.

Quando un mese e bloccato:

- non si possono aggiungere rettifiche
- non si possono alterare eventi presenza
- le entry del periodo passano in stato operativo bloccato

Lo sblocco deve essere eccezionale e sempre auditato.

## Export

Il modulo supporta export:

- `CSV`
- `PDF`

Preset attualmente previsti:

- `review`
- `labor_consultant`

L'export non sostituisce il timesheet operativo, ma ne produce una vista consegnabile.

## Dashboard coordinatore

La dashboard timesheet aggrega gia lato backend:

- entry totali
- entry submitted
- entry approvate o bloccate
- anomalie aperte
- straordinari
- rettifiche pending
- riconciliazioni assenza
- totali per operatore
- totali per struttura

La UI non deve ricostruire questi KPI da zero.

## Relazione con il planner turni

Il planner turni resta la sorgente del piano.

Il timesheet non cancella mai:

- il turno assegnato originariamente
- l'operatore pianificato
- la differenza tra copertura teorica e copertura effettiva

Per questo la UI deve sempre rispettare la distinzione tra:

- `staff_member`
- `effective_staff_member`
- `actual`
- `operational`

## Riferimenti

- `C:\Projects\FamilyHUB\docs\architecture\2026-07-11-timesheet-design.md`
- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-174-timesheet-master-handoff.md`
