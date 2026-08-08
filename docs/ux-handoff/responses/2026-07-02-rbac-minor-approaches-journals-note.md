> **STATO DOCUMENTO: SUPERATO / STORICO**
>
> Questa nota descriveva una diagnosi intermedia.
> Dopo le verifiche successive:
>
> - i permessi `minor_approaches.*` e `minor_journals.*` risultano presenti nel backend
> - il problema reale e' stato ricondotto ai ruoli effettivi dell'ambiente
> - il ruolo `REFERENTE_STRUTTURA` e' stato poi allineato a `COORDINATORE`
>
> Documento sostitutivo di riferimento:
>
> - `C:/Projects/FamilyHUB/docs/dev-notes/2026-07-02-rbac-diagnosi-avvicinamenti-diario.md`

# Dev Note — RBAC: permessi mancanti per Avvicinamenti e Diario

**Data:** 2026-07-02  
**Priorità:** Alta  
**Componenti interessati:** Backend RBAC / Avvicinamenti / Diario educativo

## Problema riscontrato

Le pagine `/avvicinamenti` e `/diario` restituiscono errore 403 con messaggio:

```
Permesso insufficiente: minor_approaches.read.
Permesso insufficiente: minor_journals.read.
```

Il frontend funziona correttamente — riceve il 403 e mostra il messaggio dal body della risposta API.

## Causa

I permessi `minor_approaches.read` e `minor_journals.read` non sono assegnati al ruolo dell'utente di test nel sistema RBAC backend.

## Azione richiesta al backend

1. Verificare che `minor_approaches.read` e `minor_journals.read` esistano nella tabella `permissions` (o equivalente).
2. Assegnare i seguenti permessi ai ruoli che devono accedere a questi moduli:

| Permesso | Ruolo tipico |
|---|---|
| `minor_approaches.read` | educatore, coordinatore, admin |
| `minor_approaches.write` | educatore, coordinatore, admin |
| `minor_approaches.delete` | coordinatore, admin |
| `minor_journals.read` | educatore, coordinatore, admin |
| `minor_journals.write` | educatore, coordinatore, admin |
| `minor_journals.delete` | coordinatore, admin |

3. Se i permessi non esistono ancora nella matrice RBAC, aggiungerli con le risorse `minor_approaches` e `minor_journals`.

## Note frontend

Il frontend usa già correttamente:
- `approachApi.list()` → `GET /minor-approaches`
- `journalApi.list()` → `GET /minor-journals`
- Gestione 403 con messaggio user-friendly e graceful degradation

Nessuna modifica frontend necessaria.
