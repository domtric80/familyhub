# 189 — Valutazioni periodiche dei professionisti

**Stato:** contratto API definito; backend in implementazione.  
**Area UX:** Organizzazione → Educatori → dettaglio professionista → nuovo tab `Valutazioni`.

## Obiettivo e confini

La valutazione HR è una registrazione riservata su un professionista, riferita a un periodo e composta da criteri relazionali con punteggio `1..5`. Non è visibile né modificabile dagli educatori ordinari e non deve essere confusa con il Timesheet.

- accesso: `staff_evaluations.read`;
- creazione, modifica, finalizzazione, archiviazione: `staff_evaluations.manage`;
- il backend applica anche il perimetro della struttura del professionista;
- la finalizzazione è una firma applicativa con utente e timestamp, **non** firma elettronica qualificata;
- una valutazione `FINALIZED` è immutabile e non eliminabile;
- `summary` e `scores[].notes` sono cifrati a riposo e non devono essere mostrati in log o toast.

## Endpoint

| Operazione | Endpoint | Permesso |
|---|---|---|
| Elenco criteri | `GET /api/admin/staff-evaluation-criteria` | `staff_evaluations.read` |
| Crea criterio | `POST /api/admin/staff-evaluation-criteria` | `staff_evaluations.manage` |
| Modifica criterio | `PUT /api/admin/staff-evaluation-criteria/{criterion}` | `staff_evaluations.manage` |
| Elimina criterio inutilizzato | `DELETE /api/admin/staff-evaluation-criteria/{criterion}` | `staff_evaluations.manage` |
| Elenco valutazioni | `GET /api/admin/staff-members/{staffId}/evaluations` | `staff_evaluations.read` |
| Crea bozza | `POST /api/admin/staff-members/{staffId}/evaluations` | `staff_evaluations.manage` |
| Dettaglio | `GET /api/admin/staff-members/{staffId}/evaluations/{id}` | `staff_evaluations.read` |
| Aggiorna bozza | `PUT /api/admin/staff-members/{staffId}/evaluations/{id}` | `staff_evaluations.manage` |
| Archivia bozza | `DELETE /api/admin/staff-members/{staffId}/evaluations/{id}` | `staff_evaluations.manage` |
| Finalizza | `POST /api/admin/staff-members/{staffId}/evaluations/{id}/finalize` | `staff_evaluations.manage` |

Schema e payload completi sono in `docs/api/openapi.yaml` (`StaffEvaluation*`).

## Comportamento UX obbligatorio

1. Nel tab mostra tabella: periodo, data, valutatore, media, stato e azione dettaglio.
2. Il form bozza richiede periodo inizio/fine, data valutazione e almeno un criterio; i criteri arrivano solo dall'anagrafica API.
3. Ogni criterio usa select/radio da 1 a 5; non introdurre categorie testuali libere.
4. Mostra `Finalizza` solo con `staff_evaluations.manage`; prima dell'azione chiedi conferma esplicita e spiega l'immutabilità.
5. Per `409`, mostra: “La valutazione è già finalizzata e non può essere modificata o archiviata.”
6. Inserire box **Informazioni**: le note sono riservate, la firma è applicativa, i dati non influenzano automaticamente i turni.

## Anagrafica criteri

Nella sezione anagrafiche professionali aggiungere il tab `Criteri valutazione`: codice immutabile, nome, descrizione, attivo, ordinamento. L'eliminazione di un criterio collegato restituisce `409`; proporre la disattivazione.

## Audit

Il backend audita lettura, creazione, modifica, finalizzazione e archiviazione. UX non deve aggiungere audit client-side né scrivere note sensibili nei messaggi di errore.
