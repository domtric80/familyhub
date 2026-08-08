# Nota di pulizia documentale

Data: 2026-07-02

## Obiettivo

Questa nota serve a distinguere con chiarezza:

- documenti correnti da usare come riferimento operativo
- documenti storici da conservare ma non usare come fonte primaria

## Documenti correnti da preferire

- `C:/Projects/FamilyHUB/docs/api/openapi.yaml`
- `C:/Projects/FamilyHUB/docs/ux-handoff/MASTER-UX-APPLICATION-SPEC.md`
- handoff recenti in `C:/Projects/FamilyHUB/docs/ux-handoff/requests/`
- note tecniche aggiornate in `C:/Projects/FamilyHUB/docs/dev-notes/`
- deliverable funzionali/commerciali in `C:/Projects/FamilyHUB/docs/deliverables/`

## Documenti marcati come storici o superati

- `C:/Projects/FamilyHUB/docs/ux-handoff/responses/2026-07-02-rbac-minor-approaches-journals-note.md`
- `C:/Projects/FamilyHUB/docs/ux-handoff/responses/2026-07-02-083-084-avvicinamenti-diario-gap-permessi-response.md`
- `C:/Projects/FamilyHUB/docs/ux-handoff/responses/2026-06-20-010-master-data-crud-and-role-permissions-gap-spec-response.md`
- `C:/Projects/FamilyHUB/docs/ux-handoff/responses/2026-06-20-008-complete-application-pages-and-master-data-ui-spec-response.md`

## Regola pratica

Quando un documento:

- descrive blocchi backend ormai chiusi
- contiene stati intermedi non piu' veri
- usa endpoint o nomi permesso non piu' canonici

deve essere marcato esplicitamente come:

- `STORICO`
- `SUPERATO`
- oppure `PARZIALMENTE SUPERATO`

senza cancellarlo, cosi' resta utile per ricostruire l'evoluzione del progetto.
