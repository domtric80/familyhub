# Risposta UX 056 · Messaggi frontend e collaudo accessi minori

Data: 2026-06-29  
Stato: IMPLEMENTATO

## 1. Checklist

- [x] Messaggio 403 scheda minore già aggiornato in MinoreDetailPage (vedi sezione 2)
- [x] Assegnazioni: `response.assignments` già corretto in api.ts
- [x] Coerenza `Assegnazioni Minori` ↔ `Accesso al minore` garantita dallo stesso endpoint
- [x] Note per i test QA documentate

---

## 2. Messaggio 403 — scheda minore completa

**File:** `frontend/src/pages/minori/MinoreDetailPage.tsx` — riga 1128–1130

```ts
if (ae.status === 403) {
  setError('Non puoi aprire la scheda completa di questo minore: '
    + 'verifica assegnazione attiva e permesso sensibile `minor_profiles.read`.')
}
```

Il messaggio appare come banner rosso sopra il contenuto della pagina. È più informativo
del precedente "non risulti assegnato" perché chiarisce che il problema può dipendere da
due cause distinte:

1. Assegnazione al minore non attiva (o assente)
2. Permesso `minor_profiles.read` non presente nel ruolo

---

## 3. Coerenza Assegnazioni Minori ↔ Accesso al minore

Entrambe le superfici leggono dallo stesso endpoint:

- `Amministrazione > Assegnazioni Minori` → usa `GET /admin/minor-assignments` (lista globale)
- `Minore > Tab "Accesso al minore"` → usa `GET /admin/minors/{minor}/assigned-users`
  → legge `response.assignments`

Dopo l'implementazione del backend, le due viste mostrano gli stessi dati. Se una riga
compare in `Assegnazioni Minori`, deve comparire anche nella tab del minore.

**Verifica da fare in QA (Caso B del task 056):**
- aprire `Amministrazione > Assegnazioni Minori`, notare le righe attive per un minore
- aprire la scheda di quel minore, tab `Accesso al minore`
- i risultati devono essere identici

---

## 4. Minori assegnati all'utente

**File:** `frontend/src/pages/admin/UtentiPage.tsx` — modale "Minori assegnati"

Usa `GET /admin/users/{user}/assigned-minors` → legge `response.assignments`. Dopo il
salvataggio con bulk-sync, la modale ricarica i dati prima di chiudersi:

```ts
// Dopo handleSaveMinori: ricarica dal backend prima di chiudere
const assegnati = await minorAssignmentApi.assignedMinors(selectedUser.id)
setMinoriAssegnati(assegnatiArr)
```

---

## 5. Test QA — piano dettagliato

### Caso A — scheda minore

Setup: utente con assegnazione attiva al minore ma **senza** `minor_profiles.read`

Atteso:
- il minore può comparire in elenco se l'utente ha `minors.read`
- clic sulla scheda → `403`
- banner: "Non puoi aprire la scheda completa di questo minore: verifica assegnazione attiva e permesso sensibile `minor_profiles.read`."

### Caso B — coerenza assegnazioni

Setup: creare assegnazione utente-minore da `Assegnazioni Minori`

Atteso:
- `Amministrazione > Assegnazioni Minori` mostra la riga
- `Minore > Accesso al minore` mostra lo stesso utente
- `Utente > Minori assegnati` mostra lo stesso minore

### Caso C — minori assegnati all'utente

Setup: assegnare due minori a un utente da `Utenti > Minori assegnati`

Atteso:
- dopo salvataggio, la modale si ricarica e mostra i due minori selezionati
- riaprendo la modale, lo stato è persistente (viene dal backend, non da stato locale)

---

## 6. Nota finale per i test

Non usare `admin@familyhub.local` per validare i limiti:
- è ruolo `SUPER_ADMIN`
- bypassa sia il check assegnazione minore sia i limiti operativi
- tutti i test su accessi ristretti devono usare ruoli operativi reali

Ruoli consigliati per QA: `EDUCATORE`, `PSICOLOGO`, `ASSISTENTE_SOCIALE_EST`
