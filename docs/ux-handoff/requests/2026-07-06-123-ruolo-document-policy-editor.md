# Handoff UX/API - Editor policy documentale per singolo ruolo

Data: 2026-07-06  
Area: `Amministrazione > Ruoli`  
Priorità: alta  
Tipo: nuova sezione operativa nel dettaglio ruolo

## 1. Obiettivo

Quando l’amministratore crea un ruolo nuovo, deve poter definire in modo esplicito:

1. quali permessi modulo possiede il ruolo
2. quali classificazioni documentali il ruolo può leggere

## 2. Endpoint disponibili

- `GET /api/admin/roles/{role}/document-policy`
- `PUT /api/admin/roles/{role}/document-policy`

Payload:

```json
{
  "classification_codes": ["internal", "restricted", "clinical"]
}
```

## 3. Response lettura

Contiene:

- `role`
- `rbac.attachments_read`
- `rbac.attachments_upload`
- `summary`
- `classifications[]`

Per ogni classificazione:

- `code`
- `name`
- `description`
- `is_active`
- `assigned_to_role`
- `effective_read_access`
- `requires_minor_assignment`
- `notes`

## 4. UI richiesta

Nel dettaglio ruolo aggiungere un tab o blocco:

- `Policy documentale`

### 4.1 Header riassuntivo

Mostrare:

- `Permesso lettura documenti`
- `Permesso upload documenti`

### 4.2 Checklist classificazioni

Una riga per classificazione con:

- nome classificazione
- descrizione
- checkbox `assegnata al ruolo`
- badge `accesso effettivo`
- nota esplicativa

## 5. Regola importante per UX

Se `attachments.read = false`, mostrare un warning visibile:

`Questo ruolo non ha il permesso base di lettura documenti. Anche se abiliti una classificazione, non potrà leggere documenti finché non riceve attachments.read.`

## 6. Flusso corretto per ruolo nuovo

1. creare il ruolo
2. assegnare i permessi RBAC
3. aprire il tab `Policy documentale`
4. selezionare le classificazioni consentite
5. salvare

## 7. Esempi

### Pediatra

- `attachments.read = true`
- classificazioni abilitate:
  - `clinical`

Risultato:

- il pediatra legge i documenti clinici dei minori assegnati

### Ruolo custom senza permesso documenti

- `attachments.read = false`
- classificazioni abilitate:
  - `internal`

Risultato:

- nessun accesso effettivo ai documenti finché manca il permesso base
