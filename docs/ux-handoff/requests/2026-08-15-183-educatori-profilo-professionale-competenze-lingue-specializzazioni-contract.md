# UX handoff 183 — Educatori: profilo professionale relazionale

**Stato:** backend pronto per integrazione asincrona.
**Area:** Organizzazione → Educatori → dettaglio professionista → nuovo tab **Profilo professionale**.

## Obiettivo

Gestire competenze, lingue e specializzazioni senza campi testuali ripetibili. Ogni valore viene scelto da una anagrafica controllata; la relazione e attribuita a un `staff_member` (professionista), non a un `user` (account). Non creare automaticamente utenze, ruoli RBAC o assegnazioni minori.

## UI richiesta

Nel dettaglio Educatore aggiungere il tab **Profilo professionale** con tre blocchi indipendenti:

1. **Competenze**: multi-select, livello di padronanza, data acquisizione, nota opzionale.
2. **Lingue**: multi-select, livello di padronanza, nota opzionale.
3. **Specializzazioni**: multi-select, data conseguimento, nota opzionale.

Usare select/autocomplete sulle anagrafiche. La nota e l'unico testo libero e serve solo come precisazione contestuale; non deve sostituire una competenza, lingua o specializzazione.

## Contratto API

| Operazione | Endpoint | Permesso |
|---|---|---|
| Leggere profilo | `GET /api/admin/staff-members/{id}/professional-profile` | `staff_members.read` |
| Salvare profilo | `PUT /api/admin/staff-members/{id}/professional-profile` | `staff_members.update` |
| Leggere lookup | `GET /api/admin/staff-profile-lookups/{lookup}` | `staff_members.read` |
| CRUD lookup | `/api/admin/staff-profile-lookups/{lookup}[/{item}]` | create/update/delete `staff_members.*` |

`lookup` puo essere soltanto: `skills`, `languages`, `specializations`, `proficiency-levels`.

### Semantica fondamentale del salvataggio

`PUT professional-profile` e una sincronizzazione per categoria:

- categoria **omessa**: non viene modificata;
- categoria inviata con elementi: sostituisce integralmente quella categoria;
- categoria inviata come `[]`: svuota integralmente quella categoria;
- non inviare categorie non ancora caricate dalla UI.

Esempio per aggiornare solo le lingue:

```json
{
  "languages": [
    { "id": 2, "proficiency_level_code": "ADVANCED" }
  ]
}
```

## Gestione anagrafiche

Creare in Amministrazione → Anagrafiche professionali quattro pagine/tab: **Competenze**, **Lingue**, **Specializzazioni**, **Livelli di padronanza**. Ogni voce ha codice, nome, descrizione, attiva/disattiva e ordinamento. Se una voce e gia assegnata a un professionista, il backend restituisce `409` alla cancellazione: mostrare un messaggio operativo e proporre la disattivazione, non una cancellazione forzata.

## Informazioni e audit

Nel box **Informazioni** spiegare che il profilo professionale non assegna accessi al sistema e non modifica il ruolo applicativo. Ogni modifica e auditata con valori prima/dopo. Non visualizzare codici di permesso interni nel testo rivolto agli operatori.
