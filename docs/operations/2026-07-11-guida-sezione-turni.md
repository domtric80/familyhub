# Guida sezione Turni

Data: 2026-07-11

## Scopo

La sezione `Turni` serve a pianificare la copertura operativa delle strutture H24.

Il sistema separa:

- i `modelli turno`, cioe le fasce standard della struttura
- le `assegnazioni`, cioe chi lavora in quel turno in una certa data

## Cosa puo fare il coordinatore

Il coordinatore puo:

- definire i modelli turno della struttura
- impostare il numero minimo di operatori richiesti per ogni fascia
- assegnare gli operatori ai turni della settimana
- controllare scoperture e coperture complete

## Cosa vede l'educatore

L'educatore vede solo la propria settimana:

- data
- turno
- fascia oraria
- struttura
- stato del turno

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

In questo modo la settimana evidenzia subito i buchi di copertura.

## Vincoli di coerenza

Il sistema non consente:

- assegnare un operatore a una struttura diversa
- usare un modello turno di una struttura diversa
- creare due turni sovrapposti per lo stesso operatore

## Limite attuale

La sezione `Turni` non e ancora il consuntivo presenze.

Non gestisce ancora:

- timbrature
- straordinari
- firma di chiusura turno
- calcolo paghe

Questa fase copre solo pianificazione e controllo copertura.

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
- `docs/api/2026-07-11-timesheet-openapi-draft.yaml`
- `docs/ux-handoff/requests/2026-07-11-133-timesheet-operativo-contract.md`
