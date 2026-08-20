# 190 — Idoneità personale per pianificazione turni (advisory)

**Stato:** backend in implementazione.  
**Area UX:** Turni → pianificazione e dettaglio struttura.

## Decisione di dominio

Il controllo è inizialmente **solo consultivo**: non blocca la creazione o modifica dei turni, non cambia lo stato del professionista e non interviene sul Timesheet. Mostra però gli avvisi necessari al coordinatore prima dell’assegnazione.

Endpoint: `GET /api/admin/facilities/{facilityId}/shift-eligibility`  
Permesso: `staff_shift_assignments.read` nel perimetro della struttura.

Risposta: `FacilityShiftEligibility` in `docs/api/openapi.yaml`.

## Comportamento UX obbligatorio

1. Caricare il controllo quando si apre la pianificazione della struttura e dopo modifiche di struttura/personale.
2. Mostrare un badge giallo `Richiede attenzione` sugli operatori con `requires_attention: true`.
3. Mostrare gli `alerts[].message` nel dettaglio/tooltip dell’operatore.
4. Consentire comunque l’assegnazione quando `can_assign` è `true`.
5. Inserire un box Informazioni: “Il controllo è consultivo: valuta documenti e certificazioni ma non blocca i turni.”
6. Non ricostruire controlli nel browser e non usare gli alert per cambiare automaticamente ruoli o stati.

## Avvisi previsti

| Codice | Significato |
|---|---|
| `staff_document_expired` | Esiste un documento professionale scaduto. |
| `certification_missing` | Manca una certificazione richiesta dalla struttura per la qualifica. |
| `certification_expired` | Esiste soltanto una certificazione scaduta per un requisito. |
| `certification_revoked` | Esiste soltanto una certificazione revocata per un requisito. |

La consultazione è registrata in audit. Nessun dato HR riservato viene restituito oltre a tipo di avviso e nome della certificazione/documento.
