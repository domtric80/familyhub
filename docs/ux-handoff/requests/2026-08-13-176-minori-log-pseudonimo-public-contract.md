# FamilyHub — Handoff UX/API — Pseudonimo pubblico nei log Minori

Data: 2026-08-13  
Ambito: `Modulo Minori` → storico minore, audit admin, export CSV audit  
Priorita: alta  
Tipo: riallineamento sicurezza/privacy backend + contratto frontend

## Obiettivo

Da ora in poi **log pubblici, storico minore e audit amministrativo non devono esporre nome e cognome reali del minore**.

Il backend mantiene i dati reali nel dominio applicativo e negli snapshot storicizzati protetti, ma per la UI pubblica/logistica espone un identificativo pseudonimizzato.

## Regola funzionale

Per ogni minore il backend espone `public_display_name` con questa priorita:

1. `preferred_name + " (" + internal_code + ")"`
2. se `preferred_name` manca: `"Minore " + internal_code`
3. fallback estremo: `"Minore #ID"`

### Esempi

- `Mario (MIN-2026-001)`
- `Minore MIN-2026-001`
- `Minore #25`

## Impatto UX obbligatorio

UX deve usare **sempre** il valore già pronto inviato dal backend:

- `minor.public_display_name`
- oppure `description`
- oppure `metadata.operation_summary`

### UX NON deve

- ricostruire nome/cognome del minore nei log
- concatenare `first_name + last_name` nelle viste audit/storico
- inferire il pseudonimo lato frontend

## Endpoint impattati

### 1) `GET /api/minors/{minor}/history`

Ogni entry ora ha:

- `description`
- `metadata`
- `snapshot.minor.public_display_name`
- `actor.display_name`

### Shape rilevante

```json
{
  "id": 123,
  "event_type": "minor_document_viewed",
  "description": "System Admin ha visualizzato il documento report.pdf del minore Minore MIN-0006.",
  "actor_user_id": 1,
  "actor": {
    "id": 1,
    "first_name": "System",
    "last_name": "Administrator",
    "display_name": "System Administrator",
    "email": "admin@familyhub.local"
  },
  "snapshot": {
    "minor": {
      "id": 6,
      "internal_code": "MIN-0006",
      "public_display_name": "Minore MIN-0006"
    }
  },
  "metadata": {
    "operation_summary": "System Admin ha visualizzato il documento report.pdf del minore Minore MIN-0006."
  },
  "created_at": "2026-08-13T10:00:00Z"
}
```

## 2) `GET /api/admin/audit-logs`

Il nodo `minor` non contiene più nome/cognome per la UI audit.

### Shape nuova

```json
{
  "minor": {
    "id": 6,
    "internal_code": "MIN-0006",
    "public_display_name": "Minore MIN-0006"
  }
}
```

## 3) `GET /api/admin/audit-logs/{id}`

Stessa regola del punto 2.

## 4) `GET /api/admin/audit-logs/export.csv`

La colonna CSV cambia da:

- `minore_nome`

a:

- `minore_pseudonimo`

## Azioni UI richieste

### Pagina `Audit`

- colonna `Minore` → usare `minor.public_display_name`
- drawer/modal dettaglio → usare `minor.public_display_name`
- non mostrare più `first_name` / `last_name` del minore in questa pagina

### Tab `Storico` nel dettaglio minore

- usare `description` come testo principale evento
- opzionale: usare `metadata.operation_summary` solo come fallback
- non mostrare il nome reale del minore dentro la timeline

## QA checklist UX

- [ ] Nella pagina Audit non compare più nome/cognome reale del minore
- [ ] Nel dettaglio audit compare `public_display_name`
- [ ] Nell’export CSV audit la colonna è `minore_pseudonimo`
- [ ] Nello storico minore gli eventi usano `description`
- [ ] Nessun componente frontend concatena `minor.first_name` / `minor.last_name` nei log pubblici

## Nota importante

Questo handoff riguarda **solo esposizione pubblica/logistica**.  
Le schermate cliniche/anagrafiche del minore continuano a usare i dati reali dove previsto dai permessi.
