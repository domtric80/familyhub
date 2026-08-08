# Risposta UX handoff — Task 098-099 (fase 2)
# Messaggistica interna — Vista dettaglio + Composer

Data: 2026-07-03
File: `pages/messaggi/MessaggioDetailPage.tsx`, `App.tsx`

---

## Stato: ✅ Implementato (modulo completo)

### Pagina `MessaggioDetailPage.tsx` — `/messaggi/:id`

**Layout a due colonne:**

**Colonna principale (lg=8):**
- Header con oggetto, topic, badge tipo conversazione
- Pulsante "Segna come letto" visibile solo se `unread_count > 0`
- **Timeline messaggi** — bubble chat con allineamento destra (propri) / sinistra (altrui)
  - Proprio messaggio: sfondo blu (`bg-primary`), testo bianco, allineato a destra
  - Messaggio altrui: sfondo grigio chiaro, nome mittente sopra la bubble
  - Orario sotto ogni bubble (formato italiano corto)
- Scroll automatico all'ultimo messaggio al caricamento
- Empty state: "La conversazione è stata creata ma non contiene ancora messaggi visibili."
- **Composer:**
  - Textarea con placeholder "Scrivi un messaggio... (Ctrl+Invio per inviare)"
  - Shortcut `Ctrl+Invio` / `Cmd+Invio` per inviare senza mouse
  - Pulsante Invia disabilitato se textarea vuota o invio in corso
  - Alert sicurezza inline sopra il composer
  - Gestione 403: "Non puoi inviare messaggi in questa conversazione."

**Colonna laterale (lg=4):**
- Card Dettagli: struttura, minore collegato (se presente), tipo, conteggio messaggi, badge non letti
- Card Partecipanti: lista con avatar iniziale colorato, "(tu)" accanto all'utente corrente

**Navigazione:**
- Breadcrumb: Dashboard → Messaggistica → oggetto conversazione
- Pulsante "← Conversazioni" per tornare alla lista

### Regole backend rispettate

- Nessuna logica di decifrazione lato frontend — il testo arriva già decifrato nella response
- Nessun tentativo di filtrare chi può leggere: se il backend restituisce il thread, si mostra
- Audit non simulato lato client
- Identificazione "messaggio proprio" tramite `msg.created_by.id === user.id` (da AuthContext)

### Route aggiunta in `App.tsx`

```
/messaggi/:id  →  MessaggioDetailPage
```

---

## Riepilogo modulo messaggistica completo

| Componente | Route | Stato |
|---|---|---|
| Lista thread + filtri | `/messaggi` | ✅ |
| Modale nuova conversazione | (inline in lista) | ✅ |
| Vista dettaglio + timeline | `/messaggi/:id` | ✅ |
| Composer invia messaggio | (inline in dettaglio) | ✅ |
| Segna come letto | (inline in dettaglio) | ✅ |
| Voce sidebar "Messaggistica" | — | ✅ |

**Build TypeScript: 0 errori.** ✅

---

## Non implementato in v1 (fuori perimetro contratto 098)

- Aggiornamento realtime (WebSocket/polling) — non previsto in v1
- Allegati in chat — non previsto in v1
- Inoltro messaggi — non previsto in v1
