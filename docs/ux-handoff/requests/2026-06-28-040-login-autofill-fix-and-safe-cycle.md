# UX/API Handoff 040 · Login autofill fix e ciclo sicuro

Data: 2026-06-28

## Contesto

È stato corretto un bug reale sulla pagina login: con autofill del browser, i campi potevano apparire valorizzati visivamente ma il submit React partiva con stato interno vuoto, causando `422 validation.required` su `email` e `password`.

## Fix applicato

File frontend aggiornato:

- `C:\Projects\FamilyHUB\frontend\src\pages\auth\LoginPage.tsx`

Modifiche:

1. submit legge i valori direttamente dal `FormData` del form
2. aggiunti attributi `id` e `name` a:
   - `email`
   - `password`
   - `otp`

## Impatto atteso per UX team

La UX non deve cambiare il comportamento di submit della login senza preservare:

- lettura robusta dei valori da form anche in presenza di autofill browser
- naming stabile dei campi:
  - `email`
  - `password`
  - `otp`

## Verifica richiesta a UX

Verificare manualmente questi casi:

1. digitazione manuale email/password
2. autofill browser email/password
3. login con MFA già attiva
4. comparsa campo OTP dopo risposta MFA richiesta

## Nota operativa condivisa

Da questo ciclo è attiva anche la procedura tecnica di backup obbligatorio pre-fix:

- `C:\Projects\FamilyHUB\scripts\db-backup.ps1`
- `C:\Projects\FamilyHUB\scripts\safe-cycle.ps1`
