# Guida sezione Turni

Data: 2026-07-11

## Scopo

La sezione `Turni` serve a pianificare la copertura operativa delle strutture H24.

Il sistema separa:

- i `modelli turno`, cioe le fasce standard della struttura
- le `assegnazioni`, cioe chi lavora in quel turno in una certa data
- le `sostituzioni`, cioe chi copre davvero il turno quando l'assegnatario originario non puo svolgerlo

## Cosa puo fare il coordinatore

Il coordinatore puo:

- definire i modelli turno della struttura
- impostare il numero minimo di operatori richiesti per ogni fascia
- assegnare gli operatori ai turni della settimana
- consultare il calendario mensile della struttura
- registrare sostituzioni temporanee su turni gia pianificati
- annullare una sostituzione attiva quando il turno torna al titolare originario
- controllare scoperture e coperture complete
- confrontare copertura pianificata e copertura effettiva quando il timesheet e disponibile

## Cosa vede l'educatore

L'educatore vede solo la propria settimana:

- data
- turno
- fascia oraria
- struttura
- stato del turno

In aggiunta, puo consultare anche il proprio mese:

- giorni con turni assegnati
- giorni con turni completati
- giorni con anomalie
- minuti pianificati e lavorati
- eventuali turni ricevuti come sostituto effettivo

Non vede i turni degli altri operatori, salvo ruoli di coordinamento.

## Logica operativa

Ogni struttura puo definire i propri turni standard, per esempio:

- mattina
- pomeriggio
- notte

Per ogni turno si imposta anche il personale minimo necessario.

Quando il coordinatore assegna i turni, il sistema confronta:

- personale minimo richiesto
- personale realmente assegnato

In questo modo il sistema evidenzia subito i buchi di copertura, sia in vista settimanale sia nel calendario mensile.

## Vincoli di coerenza

Il sistema non consente:

- assegnare un operatore a una struttura diversa
- usare un modello turno di una struttura diversa
- creare due turni sovrapposti per lo stesso operatore
- creare piu di una sostituzione attiva sullo stesso turno
- usare come sostituto lo stesso operatore gia titolare del turno
- assegnare come sostituto un operatore con un altro turno sovrapposto

## Stato attuale

La sezione `Turni` resta distinta dal consuntivo, ma oggi dialoga con il `Timesheet` per mostrare:

- differenza tra pianificato ed effettivo
- copertura completata
- anomalie sul turno
- differenza tra operatore pianificato e operatore effettivo quando esiste una sostituzione

Il planner non sostituisce comunque la sezione amministrativa timesheet:

- approvazioni
- lock mensili
- export
- revisione rettifiche

Questa fase copre pianificazione, controllo copertura e sostituzioni operative.

## Regola chiave sulle sostituzioni

Quando esiste una sostituzione attiva:

- il turno mantiene il titolare originario in `staff_member`
- la UI deve mostrare il sostituto corrente in `effective_staff_member`
- `has_active_substitution = true` segnala che il turno ha una copertura effettiva diversa dal piano
- `active_substitution` descrive motivo, finestra temporale e attori
- il sostituto vede quel turno in `I miei turni`
- il titolare originario non vede piu quel turno nella propria vista personale finche la sostituzione resta attiva
- timbrature e timesheet si agganciano al sostituto effettivo

## Evoluzione prevista

Il passaggio a `Timesheet` introduce un secondo livello distinto:

- `Turni` = cosa era pianificato
- `Presenze` = eventi reali di entrata, uscita e pausa
- `Timesheet` = consuntivo approvato, usabile per controllo e amministrazione

Questa separazione evita di perdere il piano originario e consente di tracciare:

- ritardi
- uscite anticipate
- straordinari
- rettifiche approvate
- export mensili

Riferimenti:

- `docs/architecture/2026-07-11-timesheet-design.md`
- `docs/api/openapi.yaml`
- `docs/ux-handoff/requests/2026-08-13-170-turni-calendario-mensile-contract.md`
- `docs/ux-handoff/requests/2026-08-13-171-turni-sostituzioni-contract.md`
