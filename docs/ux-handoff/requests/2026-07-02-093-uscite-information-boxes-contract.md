# Uscite - Box Informazioni v2

- `Request ID`: 2026-07-02-093
- `Stato`: OPEN
- `Ambito`: frontend / UX / help contestuale

## 1. Obiettivo

Aggiornare il pannello `Informazioni` della sezione `Uscite` per includere:

- differenza tra pianificazione, partenza, rientro e annullamento
- gestione ritardi
- gestione follow-up
- significato dei KPI di testata

## 2. Box principale pagina elenco

Testo suggerito:

> La sezione Uscite registra gli spostamenti del minore fuori struttura. Ogni uscita può essere pianificata, segnata come partita, chiusa al rientro oppure annullata. Il sistema evidenzia i ritardi di rientro e consente di marcare eventuali follow-up operativi da completare.

## 3. Contenuti minimi

Il pannello deve spiegare:

1. cosa rappresentano gli stati `Pianificata`, `Fuori struttura`, `Rientrata`, `Annullata`
2. quando un'uscita diventa “in ritardo”
3. cosa significa `follow-up richiesto`
4. che i KPI vengono dal backend
5. che le azioni dipendono da permessi e accesso al minore

## 4. Box vicino ai KPI

Tooltip o testo breve:

- `In ritardo`: uscite ancora aperte oltre il rientro previsto
- `Follow-up`: uscite che richiedono un'azione successiva
- `Rientri critici`: rientri classificati come critici

## 5. Box nella modale “Segna rientro”

Testo suggerito:

> Usa questa finestra per registrare il rientro reale del minore, classificare l'esito del rientro e indicare se servono azioni successive da parte dell'equipe.

## 6. Checklist UX

- [ ] pannello informazioni aggiornato sulla pagina elenco
- [ ] microcopy KPI presente
- [ ] help contestuale nella modale `mark-returned`
- [ ] testo coerente con `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-uscite.md`
