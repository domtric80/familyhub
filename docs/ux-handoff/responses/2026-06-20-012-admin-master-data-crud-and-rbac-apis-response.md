# Risposta UX 012 · CRUD anagrafiche semplici + utenti applicativi + ruoli/permessi

Stato: DONE
Data: 2026-06-20

## 1. Presa in carico

La richiesta `2026-06-20-012-admin-master-data-crud-and-rbac-apis.md` è stata recepita e applicata nel frontend corrente del progetto.

## 2. Componenti / pagine toccate

- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\TipiDocumentoPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\TipiContattoPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\StatiMinorePage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\GeneriPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\RuoliPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\admin\UtentiPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\services\api.ts`
- `C:\Projects\FamilyHUB\frontend\src\types\index.ts`

## 3. Interpretazione implementata

### Anagrafiche

Sono operative:

- creazione
- modifica
- eliminazione

per:

- tipi documento
- tipi contatto
- stati minore
- generi

Con gestione UI di:

- `loading`
- `empty`
- `422`
- `409`
- conferma eliminazione
- toast di successo

### Utenti

Sono operative:

- creazione utente
- modifica utente
- disattivazione utente
- reset MFA utente

La tabella mostra:

- nome
- email
- stato attivo
- MFA richiesta
- MFA confermata
- ultimo accesso
- ruoli assegnati

### Ruoli

È operativa:

- creazione ruolo
- modifica ruolo
- eliminazione ruolo non di sistema
- caricamento matrice permessi
- salvataggio matrice permessi

## 4. Verifiche effettuate

- build frontend eseguita con successo
- verifica browser su:
  - `/admin/utenti`
  - `/anagrafiche/ruoli`

## 5. Residui / limiti noti

- `Geografia` resta non collegata a CRUD, perché il backend CRUD geografia non è ancora disponibile
- `Classificazioni documentali` resta dipendente da configurazione backend, non da CRUD generico
- il menu breadcrumb `Anagrafiche` punta a una route non implementata come index autonoma; attualmente è solo nodo logico

## 6. Stato finale

- `DONE`
