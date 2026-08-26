# Verifica alert sicurezza GitHub — 24 agosto 2026

Repository: `domtric80/familyhub`

## Stato verificato

- Code scanning aperti: 19;
- CodeQL applicativi: 3, tutti sul rich text frontend;
- Scorecard: 16 osservazioni di hardening e governance;
- Dependabot aperti: 0;
- secret scanning aperti: 0.

## Interventi di questo blocco

- sanitizzazione rich text backend con allowlist e protocolli link controllati;
- sanitizzazione sia in scrittura sia in lettura per coprire dati storici;
- test automatici con payload script, handler, URI JavaScript, SVG e MathML;
- ripristino Semgrep CE per PHP e TypeScript con SARIF;
- ripristino del check CodeQL GitHub Actions;
- allineamento del nome `Dependency Review` al ruleset;
- handoff UX P0 per DOMPurify su editor, messaggi e preview DOCX.

## Verifiche locali

- test unitari sanitizzatore: 8 superati, 26 asserzioni;
- test API messaggistica: 10 superati, 82 asserzioni;
- sintassi PHP: valida per servizio, modello, controller e test modificati;
- `git diff --check`: nessun errore;
- Semgrep CE: immagine verificata e fissata per digest; il download delle regole dal registry non ha restituito un risultato entro il tempo disponibile, quindi la scansione completa deve essere confermata dalla CI GitHub.

Nessuna migrazione, reset, seeding o modifica è stata eseguita sul database operativo.

## Stato degli alert applicativi

UX ha completato la sostituzione della sanitizzazione regex con DOMPurify il 26 agosto 2026. Tutti i sink HTML individuati usano ora l'helper centralizzato `sanitizeRichText`; il lockfile npm è stato aggiornato.

Validazione integrazione UX:

- `npm install`: completato;
- build TypeScript/Vite: completata;
- audit npm runtime: 0 vulnerabilità;
- ricerca globale dei sink: nessun `dangerouslySetInnerHTML` privo di `sanitizeRichText`;
- lint globale: non verde per 202 rilievi preesistenti e non introdotti dalla remediation; il debito lint deve essere gestito in un blocco separato.

I tre alert CodeQL frontend restano correttamente aperti fino alla nuova analisi GitHub della branch o della pull request. Non devono essere chiusi manualmente.

## Residui pianificati

- fissare tramite digest tutte le immagini Docker segnalate da Scorecard;
- separare build/test e pubblicazione nel workflow release;
- introdurre CODEOWNERS solo dopo aver definito almeno un revisore indipendente;
- ridurre il bypass permanente del ruleset senza compromettere il recupero di emergenza;
- rivalutare gli alert Scorecard dopo la successiva scansione pianificata.

## Governance delle modifiche

Dal 26 agosto 2026 `@tuxlbit` è CODEOWNER globale con ruolo Write. Il ruleset di `master` richiede almeno una approvazione del CODEOWNER, oltre alla risoluzione delle conversazioni e al superamento dei controlli CI, CodeQL, Dependency Review e Semgrep.

Il bypass amministrativo resta temporaneamente disponibile come recupero di emergenza fino alla validazione completa del nuovo flusso tramite pull request dedicata.
