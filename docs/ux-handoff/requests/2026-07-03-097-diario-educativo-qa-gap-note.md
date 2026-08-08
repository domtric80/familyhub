# Diario educativo - Nota QA e perimetro funzionale attuale

- `Request ID`: 2026-07-03-097
- `Stato`: OPEN
- `Destinatario`: UX / frontend / QA

## 1. Stato attuale backend

Il backend `Diario educativo` supporta oggi:

- voci diario strutturate
- priorità (`green`, `yellow`, `red`)
- umore sintetico
- sezioni turno (`nutrition`, `hygiene`, `sleep`)
- follow-up
- passaggio consegne
- KPI/summary

## 2. Funzioni NON ancora presenti e da non simulare

Le seguenti funzioni non devono essere presentate come operative:

- firma digitale obbligatoria a chiusura turno
- ricerca full-text trasversale avanzata
- messaggistica interna cifrata per team

Se UX vuole mostrarle come roadmap, devono essere chiaramente marcate come non disponibili.

## 3. Focus QA

Il collaudo deve concentrarsi su:

1. vincoli `follow-up`
2. vincoli `handover`
3. coerenza KPI summary
4. assenza di funzionalità non supportate

## 4. Regola finale

UX non deve costruire logiche parallele per handover o KPI: usare soltanto il backend attuale.
