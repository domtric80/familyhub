# Stato modulo Incidenti e segnalazioni

Data: 2026-08-17

## Copertura capitolato 6.1

| Requisito | Stato backend |
| --- | --- |
| Registro cadute, aggressioni, autolesionismo, fughe e crisi | Implementato con anagrafica relazionale estendibile |
| Escalation operatore → coordinatore → direttore → autorità | Implementata con transizioni vincolate e timeline |
| Segnalazione autorità precompilata | Implementato payload precompilato; invio automatico escluso per sicurezza |
| Root cause analysis e misure correttive | Implementate con cifratura, responsabile e scadenze |

## Controlli

- migrazione `2026_08_17_130000_create_minor_incidents_module`;
- RBAC dedicato e accesso per-minore;
- audit e storico minore;
- contenuti sensibili cifrati;
- test API completo del workflow;
- OpenAPI e handoff UX aggiornati.

## Residuo

Resta l'implementazione delle pagine frontend descritte nell'handoff UX 194 e il relativo collaudo asincrono.
