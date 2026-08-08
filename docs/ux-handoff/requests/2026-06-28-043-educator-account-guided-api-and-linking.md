# Richiesta UX 043 · API guidate account educatore e collegamento anagrafica

Data: 2026-06-28
Stato: READY_FOR_UX_IMPLEMENTATION

## 1. Contesto

Il backend espone ora API dedicate per evitare la creazione disallineata tra:

- anagrafica `Educatore`
- account `Utente`
- assegnazione ruolo alla struttura

## 2. Nuove API disponibili

### A. Ricerca educatori non collegati

- `GET /api/admin/users/linkable-staff-members`

Query supportate:

- `facility_id`
- `q`

Uso UX:

- nella creazione utente educatore
- proporre prima il collegamento a un educatore già censito

### B. Collegamento account a educatore esistente

- `POST /api/admin/staff-members/{staff_member}/link-user`

Payload:

```json
{
  "user_id": 12
}
```

### C. Creazione guidata account educatore

- `POST /api/admin/users/educator-account`

Due modalità supportate:

1. collegare un educatore già esistente tramite `staff_member_id`
2. creare contestualmente un nuovo educatore tramite `staff_member.*`

## 3. Regola UX tassativa

Se si sta creando un utente che deve operare come educatore, la UX non deve usare direttamente il flusso generico `POST /api/admin/users` come esperienza primaria.

Deve usare il flusso guidato `POST /api/admin/users/educator-account`.

## 4. Flusso UX richiesto

### Step 1

L’operatore sceglie che sta creando un account educatore.

### Step 2

La UI chiede:

- “Vuoi collegare un educatore già esistente?”

### Step 3A — sì

La UI interroga:

- `GET /api/admin/users/linkable-staff-members?facility_id={id}&q=...`

e mostra elenco selezionabile.

### Step 3B — no

La UI mostra i campi minimi per creare anche l’anagrafica educatore.

### Step 4

La UI invia un solo payload a:

- `POST /api/admin/users/educator-account`

## 5. Stati UI richiesti

- nessun educatore disponibile da collegare
- educatore già collegato a un altro account
- matricola già presente nella struttura
- struttura dell’educatore diversa da quella scelta
- salvataggio completo riuscito

## 6. Messaggi da non reinterpretare

Il team UX non deve sostituire con copy generico questi errori di dominio:

- educatore già collegato
- struttura diversa
- matricola duplicata

Deve mostrarli in modo comprensibile ma fedele.

## 7. Checklist UX team

- [ ] usare `linkable-staff-members` nel wizard utente educatore
- [ ] usare `educator-account` come endpoint principale del flusso guidato
- [ ] mantenere disponibile il collegamento manuale successivo
- [ ] mostrare stato collegato/non collegato in lista educatori e utenti
- [ ] evitare UX che porti alla creazione parallela e incoerente

## 8. Richiesta al team UX

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-28-043-educator-account-guided-api-and-linking-response.md`
