# Handoff UX/API — Policy documentale separata lettura vs download

Data: 2026-08-09  
Ambito: `Anagrafiche > Ruoli`, `Anagrafiche > Accesso documentale`, `Documenti minore`
Priorità: alta

---

## Obiettivo

Da ora la policy documentale ABAC distingue in modo esplicito:

- `lettura / preview`
- `download`

Questa distinzione esisteva già nel motore autorizzativo backend, ma ora è anche amministrabile da interfaccia e documentata nel contratto API.

---

## Endpoint aggiornato

### `PUT /api/admin/roles/{role}/document-policy`

Payload aggiornato:

```json
{
  "classification_codes": ["internal", "restricted", "clinical"],
  "download_classification_codes": ["internal", "restricted"]
}
```

Semantica:

- `classification_codes` = classificazioni che il ruolo può leggere in preview
- `download_classification_codes` = sottoinsieme delle classificazioni che il ruolo può anche scaricare

Regola importante:

- una classificazione non può essere abilitata in `download` se non è già abilitata anche in `read`
- se UI prova a mandare un download senza read, il backend riallinea automaticamente il download al sottoinsieme valido

---

## Risposta policy ruolo

La risposta `GET/PUT /api/admin/roles/{role}/document-policy` espone per ogni classificazione:

- `assigned_to_role`
- `download_assigned_to_role`
- `effective_read_access`
- `effective_download_access`

Questo significa che UX non deve più dedurre il download dal solo RBAC.

---

## Modifica UI richiesta — Pagina Ruoli

Nel box `Policy documentale (ABAC)` della modale dettaglio ruolo:

- sostituire la singola checkbox con due colonne checkbox:
  - `R` = lettura / preview
  - `D` = download

### Regole UI

- `R` può essere selezionato liberamente
- `D` può essere selezionato solo se:
  - la classificazione è già selezionata in `R`
  - il ruolo ha il permesso RBAC `attachments.download`

- se `R` viene deselezionato:
  - UI deve togliere automaticamente anche `D`

### Footer / help text

Mostrare una nota chiara:

- `R = lettura/preview`
- `D = download`
- per i documenti del minore serve comunque assegnazione attiva al minore, salvo ruoli privilegiati

---

## Modifica UI richiesta — Matrice accesso documentale

Nella tabella classificazioni:

- sostituire colonna unica `Ruoli ammessi` con:
  - `Ruoli lettura`
  - `Ruoli download`

Così l’amministratore vede subito se una classificazione è:

- leggibile da più ruoli
- ma scaricabile solo da un sottoinsieme più ristretto

---

## QA minima richiesta

1. aprire `Ruoli`
2. entrare nel dettaglio di un ruolo con `attachments.download`
3. abilitare una classificazione in `R`
4. abilitarla anche in `D`
5. salvare
6. verificare che dopo reload siano persistenti entrambi i flag
7. togliere `R` e verificare che `D` non resti attivo da solo

---

## Nota funzionale

Esempio pratico desiderato:

- un ruolo può vedere documenti `internal`
- ma non poterli scaricare sul device locale

Questo supporta meglio il requisito di sicurezza:

- preview controllata in applicazione
- download più restrittivo dove necessario
