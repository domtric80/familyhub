# FamilyHub · Master UX Application Spec

Questo documento è la specifica principale che il team UX deve seguire per costruire l'applicativo.

## Regola

Le richieste incremental in `requests/` descrivono variazioni o approfondimenti.
La definizione completa delle pagine applicative correnti è qui:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-06-20-008-complete-application-pages-and-master-data-ui-spec.md`

## Fonte funzionale

- API contrattuali: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- Protocollo handoff: `C:\Projects\FamilyHUB\docs\ux-handoff\README.md`
- Gap analysis moduli evolutivi: `C:\Projects\FamilyHUB\docs\architecture\2026-07-02-gap-analysis-avvicinamenti-diario-educativo.md`

## Obbligo del team UX

Prima di dichiarare “DONE”, il team UX deve verificare:

1. che esista una pagina o modale reale per ogni funzione descritta
2. che ogni form esponga tutti i campi richiesti
3. che ogni tabella esponga le colonne richieste
4. che ogni stato errore/loading/empty sia implementato
5. che i permessi siano derivati da `GET /auth/me`
6. che, dove richiesto dall'handoff, sia presente anche il box o drawer `Informazioni`

## Regola aggiuntiva su CRUD e backend gap

Se una funzione di prodotto richiede `creazione`, `modifica`, `eliminazione`, `disattivazione`
o `gestione permessi`, il team UX non può ometterla in silenzio.

Deve:

1. implementare la pagina e la struttura UI prevista
2. indicare se il backend supporta davvero l’azione
3. marcare l’azione come `BLOCCATA DA BACKEND` se manca l’API

Riferimento operativo:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-06-20-010-master-data-crud-and-role-permissions-gap-spec.md`

## Regola aggiuntiva su moduli v1 vs moduli completi

Se una pagina esiste ma rappresenta solo una prima versione funzionale del dominio:

1. il team UX non deve presentarla come copertura completa del processo
2. deve attenersi all'handoff incrementale più recente
3. deve verificare se esiste una gap analysis o roadmap funzionale allegata

Riferimento attuale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-083-avvicinamenti-diario-gap-roadmap-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-085-avvicinamenti-family-workflow-v2-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-086-avvicinamenti-information-boxes-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-087-diario-educativo-v2-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-088-diario-educativo-information-boxes-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-089-avvicinamenti-diario-ux-checklist-esecutiva.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-090-attivita-v2-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-091-attivita-information-boxes-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-092-uscite-v2-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-093-uscite-information-boxes-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-03-094-uscite-mini-checklist-qa.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-03-095-avvicinamenti-v2-qa-and-trend-placement.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-03-096-diario-educativo-mini-checklist-qa.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-03-097-diario-educativo-qa-gap-note.md`
