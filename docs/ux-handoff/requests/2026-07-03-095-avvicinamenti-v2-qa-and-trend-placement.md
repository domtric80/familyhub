# Avvicinamenti v2 - QA checklist e posizionamento trend

- `Request ID`: 2026-07-03-095
- `Stato`: OPEN
- `Destinatario`: UX / frontend / QA

## 1. Obiettivo

Il backend `Avvicinamenti` è da considerare modulo operativo v2.

Restano due obblighi per il team UX:

1. validare i casi sensibili di sicurezza e stato
2. collegare in modo esplicito la UI al trend backend già disponibile

## 2. Posizionamento obbligatorio del trend

`GET /api/approaches/trend` non deve restare “in sospeso”.

UX deve mostrare il dato in uno dei seguenti punti, mantenendo la stessa scelta in modo stabile:

- nella pagina lista `Avvicinamenti`, sopra la tabella
- oppure nel tab `Avvicinamenti` del dettaglio minore, come blocco KPI + grafico

Scelta raccomandata:

- **lista pagina Avvicinamenti** → KPI sintetici
- **dettaglio minore** → serie mensile e distribuzione reazioni

## 3. Checklist QA obbligatoria

### Lista

- [ ] il filtro `authorization_status` usa il backend e non logiche client
- [ ] i badge `active / expiring / expired` sono coerenti
- [ ] `has_reserved_notes = true` mostra badge informativo senza esporre il testo se l’utente non è autorizzato

### Form

- [ ] blocco `Provvedimento autorizzativo` presente
- [ ] blocco `Reazione del minore` presente per prima/durante/dopo
- [ ] blocco `Area riservata` visibile solo quando consentito
- [ ] blocco `Sospensione` presente e leggibile

### Sicurezza

- [ ] utente non autorizzato non vede `reserved_psychologist_notes`
- [ ] utente non autorizzato non vede `reserved_coordinator_notes`
- [ ] utente non autorizzato non può salvarle

### Validazioni

- [ ] `authorization_expires_at >= authorization_issued_at`
- [ ] `status = suspended` richiede `suspension_reason`
- [ ] presenza di `suspension_reason` richiede `suspended_at`

### Trend

- [ ] la UI usa `GET /api/approaches/trend`
- [ ] `summary` è mostrato come KPI
- [ ] `monthly_series` è mostrato come grafico o lista temporale
- [ ] `reaction_distribution` è mostrato come grafico o riepilogo per fase

## 4. Regola finale

UX non deve marcare il modulo come completo se il trend backend non è collegato a una UI reale.
