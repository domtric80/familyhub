# Handoff UX — Allineamento tab Diario nella scheda Minore

Data: 2026-08-15
Area: `Minori > Dettaglio minore > Diario educativo`
Priorità: correttiva

## Correzione necessaria

Il tab Diario nella scheda del minore riusa il contratto `JournalEntryWrite` del Diario educativo generale. Deve rispettare le stesse regole introdotte nell'handoff 180.

- non inviare mai `handover_read_at` o `handover_read_by_user_id` in create/update;
- se `journal_shift.closed_at` è valorizzato, disabilitare la modifica della voce e mostrare il motivo;
- la presa visione delle consegne deve avvenire esclusivamente con `POST /api/journals/{journalId}/acknowledge-handover`.

Il backend applica comunque questi vincoli, ma l'interfaccia deve renderli chiari prima dell'invio.
