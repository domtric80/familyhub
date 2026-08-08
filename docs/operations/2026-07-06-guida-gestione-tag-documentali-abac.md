# Guida operativa - Gestione tag documentali e accessi ABAC

Data: 2026-07-06  
Area: `Documenti`, `Ruoli`, `Amministrazione`

## Scopo

Il sistema consente di governare da pannello:

- i tag documentali
- i ruoli che possono vedere quei tag

Questo permette di adattare la piattaforma anche quando nasce una nuova categoria documentale.

## Come funziona

### 1. Creazione del tag

Si crea una nuova classificazione documento, ad esempio:

- `school_sensitive`
- `legal_sensitive`
- `psy_reserved`

Per ogni tag si definiscono:

- codice
- nome
- descrizione
- ruoli ammessi di default

### 2. Assegnazione ai ruoli

Dopo aver creato il tag, bisogna assegnarlo ai ruoli che dovranno leggerlo.

Esempio:

- il tag `school_sensitive` puo essere assegnato a `DIRETTORE` e `COORDINATORE`
- il tag `clinical` puo restare solo per ruoli clinici oppure essere esteso manualmente

## Regola importante

Creare un nuovo tag non basta da solo.

Dopo la creazione bisogna sempre verificare:

- quali ruoli sono ammessi
- quali ruoli lo hanno effettivamente assegnato nella policy documentale

## Caso del Coordinatore

Di default il coordinatore:

- vede `internal`
- vede `restricted`
- non vede `clinical`

Se la struttura vuole che veda anche documenti clinici:

- bisogna abilitarlo esplicitamente dalla policy documentale del ruolo
