# Risposta UX — Handoff 137: Compatibilità alias legacy tab Caso

Data: 2026-07-31  
Stato: verificato — nessuna modifica necessaria

---

## Verifica campi canonici

Eseguito grep su `src/pages/minori/tabs/CasoMinoreTab.tsx` per tutti gli alias legacy:

| Alias legacy | Trovato nel codice |
|---|---|
| `judicial_authority_id` | ❌ non presente |
| `family_doctor_id` | ❌ non presente |
| `pediatrician_id` | ❌ non presente |
| `asl_id` | ❌ non presente |
| `vaccination_record_document_id` | ❌ non presente |

Il tab Caso usa già i soli campi canonici:
- `origin_facility_id`
- `judicial_authority_document_issuer_id`
- `general_practitioner_staff_member_id`
- `pediatrician_staff_member_id`
- `health_authority_document_issuer_id`
- `vaccination_minor_document_id`

---

## Endpoint in uso

- `GET /api/minors/{minor}/case-options` — sorgente lookup per tutti i select
- `PUT /api/minors/{minor}/case-details` — salvataggio form

Nessuna modifica al codice necessaria. Il frontend è già allineato al contratto canonico stabile.
