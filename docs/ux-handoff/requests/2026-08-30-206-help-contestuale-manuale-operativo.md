# Handoff UX — Help contestuale FamilyHub

## Obiettivo

Aggiungere un pulsante **Informazioni** in ogni pagina applicativa. Il manuale utente di riferimento è `docs/manuale/2026-08-30-manuale-operativo-familyhub-v1.5.2.md`.

## Comportamento comune

- Posizione: intestazione della pagina, vicino al titolo; non dentro un pulsante CRUD.
- Etichetta accessibile: `Informazioni su [nome pagina]`.
- Apertura: drawer o modal non distruttiva, chiudibile con Esc, X e click fuori.
- Contenuto: scopo, cosa si può fare, significato dei campi, prerequisiti, permessi e cosa fare in caso di errore.
- Il testo deve cambiare in base a ruolo e permessi senza nascondere la spiegazione generale.
- Non mostrare dati personali o contenuti del minore nel testo di help.
- WCAG: focus visibile, ordine tastiera, contrasto AA, heading del dialog, aria-describedby, nessun contenuto accessibile solo con colore.

## Schede minime per pagina

| Route | Help obbligatorio |
|---|---|
| `/minori`, `/minori/nuovo`, `/minori/{id}` | anagrafica, tab, dati protetti, assegnazioni, audit |
| `/uscite` | minori, decreto, allegato esistente/nuovo, più accompagnatori |
| `/avvicinamenti` | tipologia, contatti multipli, ruolo contatto, reazioni, sospensione |
| `/diario`, `/attivita` | evento, priorità, PEI, firma, consegne, ricerca |
| `/turni/*` | modello H24, fabbisogno, assegnazione, presenza, approvazione, lock |
| `/messaggi/*` | destinatari, classificazione ABAC, allegati, audit |
| `/educatori`, `/admin/utenti` | differenza professionista/account, ruolo, MFA, struttura |
| `/admin/strutture` | organizzazione, geografia, utenti, fabbisogno turni |
| `/anagrafiche/geografia` | filtri gerarchici e dati certificati |
| `/anagrafiche/provider-geografia` | provider, import, run, errori e idempotenza |
| `/anagrafiche/ruoli`, `/anagrafiche/accesso-documentale` | RBAC, ABAC, deny by default, nuovi tag |
| `/admin/audit`, `/admin/audit-kpi` | eventi, diff, filtri, export e limiti |
| `/admin/backup`, `/admin/sistema/storage`, `/admin/sistema/health` | backup, S3/MinIO, stato componenti |

## Criteri di accettazione

1. Ogni route protetta mostra il proprio help senza cambiare URL.
2. Ogni campo di form ha descrizione breve e, se necessario, esempio.
3. I campi riusabili sono select/autocomplete: nessun testo libero per ruolo, stato, genere, scope, classificazione o geografia.
4. I messaggi 401/403 spiegano il controllo mancante senza rivelare dati riservati.
5. Il team verifica tastiera, screen reader, responsive e contrasto su ogni scheda.
6. UX risponde a questo handoff con route completate, screenshot e note di eventuali divergenze.

