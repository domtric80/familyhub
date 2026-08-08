# Guida operativa - Visibilita documenti del Coordinatore

Data: 2026-07-06  
Area: `Ruoli`, `Documenti`, `Minori`

## Regola base

Il coordinatore non vede automaticamente tutti i documenti.

Di default puo vedere:

- documenti `internal`
- documenti `restricted`

Di default non vede:

- documenti `clinical`
- documenti `judicial`

## Quando puo vedere i documenti clinici

I documenti clinici possono essere resi visibili al coordinatore solo tramite configurazione amministrativa della policy documentale del ruolo.

Questo permette di adattare il software alle politiche della struttura senza aprire automaticamente l'accesso ai contenuti piu sensibili.

## Effetto pratico

Se un coordinatore non trova un referto clinico o una nota clinica:

- non significa che il documento manca
- puo significare che la classificazione `clinical` non e stata abilitata per il suo ruolo

## Dove si governa

La visibilita per ruolo si governa dal pannello amministrativo dedicato alla policy documentale.
