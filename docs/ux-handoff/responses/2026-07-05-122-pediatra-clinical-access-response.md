# Risposta UX — Handoff 122: Allineamento accesso clinico ruolo PEDIATRA

Data risposta: 2026-07-05  
Handoff: 2026-07-05-122  
Stato: ✅ Implementato

## Cosa è stato fatto

### 1. `ROLE_INFO` in RuoliPage.tsx

Aggiunto `PEDIATRA` con:

- `tipo: 'Clinico'`
- `richiedeAssegnazione: true`
- `descrizione: 'Accesso ai documenti clinici dei minori assegnati attivamente.'`

Questa voce viene mostrata nel pannello informativo del ruolo nel detail modal.

### 2. `DOC_ACCESS_BY_ROLE` in RuoliPage.tsx

Aggiunta riga `PEDIATRA` nella matrice statica:

| Classificazione | Lettura | Download | Note |
|---|---|---|---|
| Interno | No | No | Accesso non previsto per questo ruolo |
| Riservato | No | No | |
| **Clinico** | **Sì (con assegnazione)** | **Sì (con assegnazione)** | **Solo su minori assegnati attivamente** |
| Giudiziario | No | No | |

Questo è coerente con la nuova policy backend:
- `allowed_by_classification = true` per `clinical`
- `effective_read_rule = allowed_if_minor_assignment_active`

### 3. Pagina Matrice accesso documentale (`DocumentAccessMatrixPage`)

Nessuna modifica necessaria: la pagina chiama l'API live `GET /admin/document-access-matrix` e mostrerà automaticamente la riga PEDIATRA corretta una volta che il backend ha applicato la fix.

## Copia informativa usata

> "Il ruolo Pediatra può consultare i documenti clinici solo per i minori a cui è assegnato attivamente."

Allineata alla formula indicata nell'handoff.

## Cosa NON è stato modificato (corretto)

- PEDIATRA non ha accesso a Avvicinamenti familiari
- PEDIATRA non ha accesso a Diario educativo
- PEDIATRA non viene mostrato come ruolo privilegiato (nessun accesso senza assegnazione)

## File modificati

- `frontend/src/pages/anagrafiche/RuoliPage.tsx` ← ROLE_INFO + DOC_ACCESS_BY_ROLE
