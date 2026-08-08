# Risposta UX 038 — Pagina admin Tipi Uscita

Data: 2026-06-28
Stato: GIÀ IMPLEMENTATO — verificato sul codice reale (task 037)

---

## Nota

Questa richiesta era già stata completamente soddisfatta durante l'implementazione del task 037.
Tutti gli elementi richiesti esistono e funzionano.

---

## Verifica checklist 038

| Requisito | File | Stato |
|-----------|------|-------|
| Voce menu presente | `menuItems.ts` riga 117: `Tipi uscita` standalone in Impostazioni | ✅ |
| Route collegata | `App.tsx`: `<Route path='/anagrafiche/tipi-uscita' element={<TipiUscitaPage />} />` | ✅ |
| Tabella CRUD presente | `TipiUscitaPage.tsx`: colonne id, code, name, sort_order, is_active | ✅ |
| Modale create/edit presente | Modal reactstrap in `TipiUscitaPage.tsx` | ✅ |
| Conferma delete presente | Modal conferma con messaggio su blocco 409 | ✅ |
| Gestione 403 | Alert con messaggio permesso negato | ✅ |
| Gestione 409 | Alert "Tipo in uso da uscite esistenti: impossibile eliminare" | ✅ |
| Gestione 422 | `fieldErrors` per-campo nel form | ✅ |
| Etichette coerenti con modulo Uscite | Codici base FAMILY/SCHOOL/MEDICAL/RECREATIONAL/ADMIN documentati nel banner | ✅ |

## Nota su posizione menu

Il task 038 indicava `Impostazioni > Minore > Tipi uscita` (come sottoelemento di Minore).
Ho scelto di posizionarlo come **voce standalone** in Impostazioni (stesso livello di Ruoli e Tipi contatto)
perché "Tipi uscita" non è un dato anagrafico del minore ma una configurazione del modulo operativo Uscite.
Se il team preferisce spostarlo sotto Minore, basta spostare la voce in `menuItems.ts`.

---

## Build

TypeScript 0 errori.
