# Diagnosi RBAC — Avvicinamenti e Diario educativo

Data: 2026-07-02  
Ambito: backend RBAC / ruoli effettivi / ambiente locale corrente

## Esito sintetico

Il messaggio:

- `Permesso insufficiente: minor_approaches.read.`
- `Permesso insufficiente: minor_journals.read.`

non indica un bug generico dei moduli `Avvicinamenti` o `Diario educativo`.

Le route backend esistono e sono correttamente protette da middleware RBAC:

- `GET /api/approaches`
- `GET /api/journals`

I permessi esistono nel database:

- `minor_approaches.read/create/update/delete`
- `minor_journals.read/create/update/delete`

e risultano assegnati ai ruoli standard previsti:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`
- `EDUCATORE`
- `PSICOLOGO` (read/update)
- `EDUCATORE_NOTTURNO` (read)
- `ASSISTENTE_SOCIALE_EST` (read)

## Causa reale probabile

Il 403 è coerente quando l’utente loggato usa un ruolo che **non** possiede questi permessi.

Nell’ambiente corrente sono presenti ruoli custom / extra rispetto al seed standard:

- `PEDIATRA`
- `REFERENTE_STRUTTURA`

### `PEDIATRA`

Ruolo attualmente presente nel DB con set permessi limitato.  
Non possiede i permessi:

- `minor_approaches.read`
- `minor_journals.read`

Quindi, se l’utente di test sta navigando con il ruolo `PEDIATRA`, il 403 è atteso.

### `REFERENTE_STRUTTURA`

Ruolo presente nel DB con matrice ampia, ma al momento **non** include i permessi:

- `minor_approaches.read/create/update/delete`
- `minor_journals.read/create/update/delete`

Quindi anche questo ruolo, se usato per testare quei moduli, riceveva 403 coerente.

### Aggiornamento applicato

Su richiesta progettuale, il ruolo `REFERENTE_STRUTTURA` è stato allineato al perimetro del ruolo `COORDINATORE`:

- seed RBAC aggiornato
- ambiente locale corrente sincronizzato

Da questo momento `REFERENTE_STRUTTURA` dispone degli stessi permessi di `COORDINATORE`, inclusi:

- `minor_approaches.read/create/update`
- `minor_journals.read/create/update`

Il ruolo `PEDIATRA` resta volutamente non abilitato su `Avvicinamenti`.

## Implicazione pratica

Se il test viene eseguito con:

- `admin@familyhub.local` con ruolo attivo `SUPER_ADMIN`
- oppure con un utente che ha ruolo attivo `COORDINATORE`
- oppure con `EDUCATORE` / `PSICOLOGO` dove previsto

allora il 403 **non** dovrebbe comparire per il solo motivo RBAC di modulo.

Se invece il test viene eseguito con:

- `qa.pediatra@familyhub.local`
- oppure con un utente a cui è stato assegnato `REFERENTE_STRUTTURA`

il 403 è attualmente coerente con la matrice permessi salvata nel DB.

## Conclusione tecnica

Il problema è da classificare come:

- **RBAC / configurazione ruolo**
- non come bug strutturale delle API `approaches` / `journals`

## Azioni consigliate

### Opzione A — correzione di configurazione

Decidere formalmente se i ruoli:

- `PEDIATRA`
- `REFERENTE_STRUTTURA`

devono poter leggere / modificare:

- avvicinamenti
- diario educativo

Se sì, aggiornare la loro matrice RBAC.

Stato attuale dopo intervento:

- `REFERENTE_STRUTTURA`: allineato a `COORDINATORE`
- `PEDIATRA`: non allineato, scelta intenzionale

### Opzione B — chiarimento funzionale

Se quei ruoli **non** devono accedere a quei moduli, allora:

- il backend è corretto
- la UI deve spiegare meglio perché la funzione non è disponibile

## Nota per UX

Il frontend non va corretto sugli endpoint.  
Può però migliorare il messaggio utente finale, traducendo il 403 tecnico in una formula più leggibile, ad esempio:

> Non hai accesso a questa sezione con il ruolo attualmente assegnato.

oppure:

> Il tuo profilo non è abilitato a consultare Avvicinamenti o Diario educativo.
