# Risposta Frontend — Handoff 128: Riallineamento COORDINATORE

Data: 2026-07-06  
Riferimento: `2026-07-06-128-coordinatore-perimetro-admin-rbac.md`

## Modifiche applicate

### MinoriListPage

- `canCreate`: aggiunto `coordinatore` → ora può creare minori
- Pulsante elimina: visibile anche a `coordinatore`

### MinoreDetailPage

- `canEdit`: aggiunto `coordinatore` → ora vede il pulsante "Modifica" sulla scheda

## Note

Il frontend non applicava altri blocchi espliciti sul COORDINATORE oltre a questi tre punti.
Le sezioni assegnazioni minori, utenti e profilo esteso erano già accessibili tramite il controllo
permessi standard derivato dalle `capabilities` dell'utente loggato.

## Stato

Riallineamento completo. Nessun altro blocco frontend identificato sul ruolo COORDINATORE.
