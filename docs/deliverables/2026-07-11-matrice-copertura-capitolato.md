# FamilyHub — Matrice copertura capitolato vs stato reale

Data: 2026-07-11  
Fonte requisiti: `F:\OwnCloud\Domenico Tricarico Consulente\FamilyHub\FamilyHub_Capitolato_v3_clean.pdf`  
Workspace di verifica: `C:\Projects\FamilyHUB`

## 1. Scopo

Questo documento sostituisce una lettura “a memoria” dello stato progetto.

Obiettivo:

- confrontare i requisiti del capitolato con quanto oggi esiste davvero
- distinguere tra backend disponibile, copertura parziale e funzionalità ancora assenti
- identificare il backlog prioritario reale

Legenda stato:

- `Implementato`: requisito sostanzialmente coperto nel backend/documentazione
- `Parziale`: esiste una base reale ma non l’intero workflow richiesto
- `Assente`: requisito non ancora coperto in modo significativo

Nota metodologica:

- la matrice valuta soprattutto backend, modello dati, API e documentazione tecnica
- la piena disponibilità UX/frontend può essere ancora in corso su alcune aree

## 2. Sintesi esecutiva

Stato generale al 2026-07-11:

- `Minori`: base forte, oggi uno dei moduli più maturi
- `Uscite`: operativo ma con estensioni ancora possibili
- `Attività`: operativo, manca la parte più ricca di calendario/notifiche/media
- `Avvicinamenti familiari`: molto più avanti della vecchia gap analysis, ma non completamente chiuso
- `Educatori`: anagrafica e collegamento account presenti; parte HR avanzata ancora aperta
- `Turni`: pianificazione presente; `timesheet` ancora aperto
- `Diario educativo`: operativo e più evoluto della baseline iniziale; restano firma turno e full-text reale
- `Messaggistica interna`: presente e cifrata; restano alcuni elementi avanzati
- `Geografia`: Italia gestita bene; provider generici esteri ancora limitati
- `Sicurezza/Audit/RBAC`: area forte, già strutturata

## 3. Architettura e requisiti non funzionali

| Area capitolato | Requisito | Stato | Nota |
| --- | --- | --- | --- |
| Architettura 3-tier | Separazione frontend/backend/dati | Implementato | Architettura API + frontend separato + DB già impostata |
| HTTPS/TLS 1.3 | Comunicazioni sicure | Parziale | previsto in stack e deployment, da verificare in ambiente finale |
| Frontend React + TS + Vite | stack suggerito | Implementato | adottato nel progetto |
| Backend Laravel/Nest | stack suggerito | Implementato | adottato Laravel |
| PostgreSQL 16 + RLS | DB primario suggerito | Parziale | PostgreSQL usato; RLS nativo non risulta il perno dell’enforcement |
| Redis cache/sessioni | cache, rate limit, blacklist | Parziale | stack previsto ma non è il cuore funzionale oggi documentato |
| MinIO / S3 | object storage cifrato | Implementato | storage documentale e quarantena presenti |
| OAuth2/OIDC + MFA | autenticazione forte | Parziale | MFA TOTP presente; OIDC/Keycloak non risulta implementato |
| Docker / CI-CD | deploy containerizzato | Parziale | Docker presente; pipeline da consolidare secondo ambiente target |
| Uptime/SLA | 99,5% | Parziale | requisito contrattuale, non dimostrabile dal solo codice |
| Backup giornaliero 90gg | backup cifrati | Parziale | requisito architetturale/ops, non chiuso nel codice applicativo |
| API <300ms p95 | performance target | Parziale | requisito non ancora validato con misure oggettive |
| WCAG 2.1 AA | accessibilità | Parziale | target dichiarato, frontend non ancora da considerare chiuso |
| Audit immutabile | log sensibili immutabili | Parziale | audit ampio presente; immutabilità WORM non formalizzata a livello storage |

## 4. Modulo Minori

| Requisito | Stato | Nota |
| --- | --- | --- |
| Generalità complete | Implementato | anagrafica minore presente |
| Pseudonimo nei log pubblici | Parziale | la separazione logica esiste, da validare il comportamento completo in tutti i log/UI |
| Documento identità / CF con upload cifrato | Implementato | upload documentale e cifratura presenti |
| Ingresso, provenienza, decreto/ordinanza | Implementato | copertura presente nella scheda caso |
| Autorità giudiziaria, procedimento, udienza | Implementato | case details presenti |
| Medico base, pediatra, ASL, vaccinale | Parziale | base presente; da verificare completezza UX e workflow sanitario |
| Background familiare / storia di vita | Implementato | profilo caso presente |
| Diagnosi cliniche e DSM | Implementato | con enforcement sensibile |
| Stili apprendimento, interessi, hobby, punti di forza | Parziale | profilo presente ma non tutto risulta modellato in modo pienamente ricco |
| Fattori rischio / segnalatori crisi | Parziale | parte del profilo c’è, ma non tutto appare come modulo dedicato maturo |
| PEI con obiettivi / scadenze / stato | Implementato | con obiettivi e trend |
| Storico aggiornamenti PEI con firma digitale educatore | Parziale | storico presente; firma oggi è più stato applicativo che firma forte |
| Bisogni categorizzati | Implementato | modello relazionale presente |
| Priorità / responsabile / stato bisogni | Implementato | coperti |
| Allegati ai bisogni | Parziale | bisogni presenti; allegati specifici per bisogno non risultano chiusi end-to-end |

## 5. Modulo Uscite

| Requisito | Stato | Nota |
| --- | --- | --- |
| Tipologia uscita | Implementato | anagrafica e modulo presenti |
| Destinazione / orari / accompagnatore | Implementato | coperti |
| Autorizzazione con organo emittente e allegato | Parziale | base documentale presente, da verificare copertura completa del workflow autorizzativo |
| Resoconto post-uscita con valutazione | Implementato | presente |
| Alert mancato rientro | Parziale | logica di follow-up esiste; notifica push/email automatica da verificare come chiusa |
| Report per minore/tipologia/periodo PDF/CSV | Parziale | export/reporting non risultano completi su tutto il requisito |

## 6. Modulo Attività

| Requisito | Stato | Nota |
| --- | --- | --- |
| Tipologie attività | Implementato | anagrafica presente |
| Data/ora/durata/luogo/responsabile/partecipanti | Implementato | base operativa presente |
| Obiettivi educativi collegati al PEI | Implementato | collegamento introdotto |
| Indicatori outcome | Parziale | esiste tracciamento, non ancora un sistema KPI completo dedicato |
| Verbale con note strutturate e libere | Implementato | presente |
| Galleria fotografica cifrata con consenso | Assente | non risulta chiusa come funzionalità specifica |
| Calendario condiviso mese/settimana/giorno drag-and-drop | Assente | non risulta implementato |
| Promemoria 24h e 1h prima | Assente | notifiche attività non risultano chiuse |

## 7. Avvicinamenti familiari

| Requisito | Stato | Nota |
| --- | --- | --- |
| Registro contatti per tipologia | Implementato | con tipologie dedicate |
| Partecipanti familiari/professionali, luogo, durata | Implementato | più partecipanti e ruoli presenti |
| Provvedimento autorizzativo allegato con scadenza e alert rinnovo | Parziale | dati e collegamento documento presenti; workflow rinnovo completo ancora da chiudere |
| Reazione prima/durante/dopo | Implementato | presente |
| Note riservate psicologo/coordinatore | Implementato | presenti con masking |
| Diario evolutivo con grafico trend | Parziale | trend API presente, chiusura UX/analytics ancora da consolidare |
| Sospensione con motivazione e firma responsabile | Parziale | stato/campi presenti; firma forte e processo completo ancora aperti |

## 8. Educatori / Operatori

| Requisito | Stato | Nota |
| --- | --- | --- |
| Dati personali / qualifica / titolo / iscrizione ordine | Parziale | anagrafica operatore forte; non tutta la parte professionale avanzata è chiusa |
| Documenti contratto / penale / formazione con scadenza alert | Parziale | documenti staff e stati presenti; alert/scadenze specifiche da consolidare |
| Competenze / lingue / specializzazioni | Parziale | qualifica presente, competenze avanzate non risultano complete |
| Storico turni lavorati / ore / ferie / malattia | Assente | dipende dal modulo timesheet ancora aperto |
| Valutazione periodica / note performance | Assente | non risulta implementato |
| Referenti supervisore / coordinatore / responsabile | Parziale | collegamenti organizzativi presenti solo in parte |

## 9. Turni e Timesheet

| Requisito | Stato | Nota |
| --- | --- | --- |
| Turni standard configurabili | Implementato | presenti modelli turno |
| Calendario turni mensile educatore / vista struttura | Parziale | vista settimanale backend presente; mensile aggregata ancora da completare |
| Drag-and-drop assegnazione/spostamento | Assente | non risulta chiuso |
| Verifica riposo minimo / tetto ore / doppio turno | Parziale | overlap bloccato; regole complete su riposo/monte ore non ancora chiuse |
| Gestione sostituzioni | Assente | non risulta implementata |
| Notifiche turno assegnato/modificato/cancellato | Assente | non risulta chiuso |
| Timbratura digitale con geolocalizzazione | Assente | timesheet non implementato |
| Confronto ore lavorate vs pianificate | Assente | timesheet non implementato |
| Straordinari con approvazione coordinatore | Assente | non implementato |
| Export presenze PDF/CSV per paghe | Assente | non implementato |
| Dashboard ore per educatore/struttura | Assente | non implementato |
| Integrazione sistemi paghe CSV configurabile | Assente | non implementato |

## 10. RBAC / accessi / sicurezza dati

| Requisito | Stato | Nota |
| --- | --- | --- |
| Ruoli di sistema base | Implementato | presenti e gestiti |
| Matrice CRUD per moduli | Implementato | presente e documentata |
| Field-level security | Parziale | presente su aree sensibili; non formalizzata ovunque come policy uniforme |
| Permessi temporanei / delega a termine | Parziale | validità assegnazioni presente; delega evoluta da formalizzare |
| Modalità emergenza con traccia | Assente | non risulta implementata come funzione specifica |
| Multi-struttura | Implementato | presente |
| Hard separation ADMIN_IT dai dati minori | Implementato | già impostata come guardrail centrale |
| ABAC documentale | Implementato | matrice e policy ruolo presenti |

## 11. Diario educativo e comunicazioni interne

| Requisito | Stato | Nota |
| --- | --- | --- |
| Registro eventi turno alimentazione/igiene/sonno/umore | Implementato | presente a livello dati |
| Urgenze con priorità e alert | Parziale | priorità presenti; notifica immediata al coordinatore da consolidare |
| Campo libero + checklist strutturata | Implementato | presente |
| Firma digitale obbligatoria a chiusura turno | Assente | non risulta un vero workflow di chiusura firmata |
| Passaggio consegne con presa visione | Parziale | handover e read tracking presenti; chiusura formale di turno ancora non completa |
| Ricerca full-text con filtri | Assente | ci sono filtri, non una full-text search vera |
| Chat interna cifrata | Implementato | presente e cifrata |
| Canali per struttura/team/caso | Parziale | struttura e caso presenti; concetto di team/canali più ricchi ancora da estendere |
| Urgenza / ricevuta lettura / scadenza messaggi | Parziale | lettura presente; flag urgenza e scadenza non risultano completi |
| Bacheca e circolari | Assente | non implementato |
| Archivio procedure/protocolli/circolari | Assente | non implementato come modulo dedicato |
| Versioning documenti con revisioni | Assente | non risulta implementato come repository circolari |

## 12. Moduli aggiuntivi consigliati

| Modulo capitolato | Stato | Nota |
| --- | --- | --- |
| Gestione incidenti e segnalazioni | Assente | non risulta modulo dedicato |
| Gestione farmaci e salute | Assente | presenti solo parti cliniche di base nel profilo minore |
| Modulo scuola e formazione | Assente | non risulta implementato |
| Portale famiglie opzionale | Assente | non risulta implementato |
| Reportistica e dashboard avanzata | Parziale | audit/KPI sicurezza e PEI trends presenti, ma non tutta la reportistica del capitolato |

## 13. Infrastruttura, interoperabilità e conformità

| Requisito | Stato | Nota |
| --- | --- | --- |
| Docker / ambienti portabili | Implementato | presente |
| Possibile cloud/on-prem | Parziale | architettura compatibile; da formalizzare playbook di deploy finale |
| WAF / hardening | Parziale | architetturalmente discusso, non parte “chiusa” nel codice |
| Integrazioni esterne | Parziale | storage e import geografia presenti; paghe/Calendaring/SSO ancora aperti |
| Audit log completo | Implementato | area forte del progetto |
| GDPR / privacy by design | Parziale | forte impostazione tecnica, da completare con processi e documenti operativi |
| Documentazione e formazione | Parziale | buona base tecnica; documentazione utente/commerciale ancora da migliorare |
| Ownership / escrow / audit codice | Parziale | requisito contrattuale/organizzativo, non chiudibile dal solo codice |

## 14. Gap prioritari reali

Ordine consigliato, ad oggi:

1. `Timesheet completo`
   - timbratura
   - ore lavorate vs pianificate
   - straordinari
   - export presenze / paghe

2. `Chiusura completa Diario educativo`
   - firma obbligatoria di fine turno
   - workflow formale di chiusura turno
   - full-text search vera
   - notifiche urgenze

3. `Avvicinamenti familiari — chiusura workflow`
   - rinnovo provvedimento completo
   - firma forte sospensione
   - trend pienamente esposti e leggibili lato UX

4. `Modulo Educatori avanzato`
   - competenze
   - scadenze documentali
   - valutazioni periodiche
   - storico HR operativo

5. `Geografia internazionale`
   - provider non-Italia oltre il solo livello nazione

6. `Bacheca / circolari / versioning interno`

7. `Moduli aggiuntivi`
   - incidenti
   - farmaci/salute
   - scuola/formazione
   - portale famiglie

## 15. Decisione pratica suggerita

Il progetto non è “vuoto” né “bozza”: ha già una base backend consistente.

Ma non è ancora corretto dichiarare copertura completa del capitolato.

Formula corretta ad oggi:

- piattaforma core già avviata e utilizzabile
- sicurezza, ruoli, audit, documenti e nucleo minori già impostati in modo serio
- moduli avanzati di presidio operativo e HR ancora da completare, con priorità chiara

