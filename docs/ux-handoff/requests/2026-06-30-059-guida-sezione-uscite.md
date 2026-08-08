# Handoff UX/API - Guida contestuale sezione Uscite

Data: 2026-06-30
Priorita': alta
Ambito: frontend / UX / help contestuale / modulo operativo uscite

## 1. Obiettivo

Realizzare la guida contestuale della sezione `Uscite` con pulsante `Informazioni`, coerente con il modello di accesso backend gia' allineato.

La guida serve a ridurre errori interpretativi su un punto critico:
- l'utente puo' vedere il minore ma non poter creare/modificare un'uscita
- un `403` puo' dipendere sia da RBAC sia da assegnazione al minore

---

## 2. Fonte contenuto

Frontend puo' usare come base:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-uscite.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-29-053-rbac-accesso-minori-e-uscite-allineamento-backend-response.md`

---

## 3. Cosa spiegare nella guida UI

### 3.1 Scopo del modulo

Testo suggerito:

> La sezione Uscite consente di registrare, aggiornare e consultare le uscite dei minori dalla struttura, mantenendo traccia operativa degli spostamenti e dello stato dell'evento.

### 3.2 Regola principale di accesso

Testo suggerito:

> Per operare sulle uscite non basta il ruolo: per i ruoli non privilegiati servono sia il permesso del modulo sia un'assegnazione attiva al minore.

### 3.3 Eccezione dei ruoli privilegiati

Testo suggerito:

> Alcuni ruoli di sistema possono operare sui minori della struttura senza assegnazione puntuale. Questa eccezione non si estende automaticamente ai ruoli personalizzati.

---

## 4. Permessi da rappresentare in UI

Mappatura da riportare nella guida:

- `minor_exits.read` -> leggere le uscite
- `minor_exits.create` -> creare una nuova uscita
- `minor_exits.update` -> modificare un'uscita
- `minor_exits.delete` -> eliminare un'uscita

Nota esplicita da mostrare:

> Per i ruoli non privilegiati, ogni operazione richiede anche assegnazione attiva al minore.

---

## 5. Messaggio 403 da usare

Messaggio gia' allineato lato frontend/backend:

> Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.

UX non deve sostituire questo messaggio con varianti vaghe come:
- "permessi insufficienti"
- "azione non disponibile"

perche' perderebbe il riferimento alla seconda causa possibile: assegnazione mancante.

---

## 6. Pattern UI consigliato

### 6.1 Posizione del pulsante

Inserire `Informazioni` nell'header della pagina `Uscite`.

### 6.2 Formato consigliato

Preferibile:
- drawer laterale

Alternativa:
- modal ampia

### 6.3 Blocchi contenuto consigliati

1. `A cosa serve`
2. `Chi puo' operare`
3. `Permessi richiesti`
4. `Quando serve assegnazione`
5. `Perche' puoi vedere un 403`

---

## 7. Microcopy utili

### 7.1 Box info leggero nel form

Testo suggerito:

> Le operazioni sulle uscite richiedono permesso di ruolo e, per i ruoli operativi, assegnazione attiva al minore.

### 7.2 Tooltip o nota contestuale vicino ai pulsanti disabilitati

Se UX decide di mostrare pulsanti non attivi:

> Verifica permessi del ruolo e assegnazione attiva al minore.

Nota:
- il pre-check UI completo non e' richiesto in questo sprint
- quindi evitare logiche client-side inventate non confermate dal backend

---

## 8. Output atteso dal team frontend

- pulsante `Informazioni` nella pagina `Uscite`
- guida contestuale coerente con backend
- uso del messaggio `403` gia' concordato
- nessuna semplificazione fuorviante del modello RBAC + assegnazione minore
