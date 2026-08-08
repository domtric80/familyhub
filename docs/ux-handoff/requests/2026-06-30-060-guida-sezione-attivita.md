# Handoff UX/API - Guida contestuale sezione Attivita'

Data: 2026-06-30
Priorita': alta
Ambito: frontend / UX / help contestuale / modulo attivita'

## 1. Obiettivo

Realizzare la guida contestuale della sezione `Attivita'` con pulsante `Informazioni`, coerente con il contratto backend del modulo.

La guida deve evitare un errore interpretativo molto comune:
- l'utente pensa che il ruolo basti per operare
- in realta', per i ruoli non privilegiati serve anche assegnazione attiva al minore

---

## 2. Fonte contenuto

Frontend puo' usare come base:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-attivita.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-29-054-attivita-rbac-accesso-minori-contratto-backend-response.md`

---

## 3. Cosa spiegare nella guida UI

### 3.1 Scopo del modulo

Testo suggerito:

> La sezione Attivita' consente di registrare, aggiornare e consultare le attivita' educative e operative riferite al minore.

### 3.2 Regola principale di accesso

Testo suggerito:

> Per i ruoli non privilegiati, le attivita' richiedono sia il permesso del modulo sia l'assegnazione attiva al minore.

### 3.3 Eccezione dei ruoli privilegiati

Testo suggerito:

> Alcuni ruoli di sistema possono operare senza assegnazione puntuale al minore. I ruoli personalizzati non ereditano automaticamente questo comportamento.

---

## 4. Permessi da rappresentare in UI

Mappatura da riportare nella guida:

- `minor_activities.read` -> leggere le attivita'
- `minor_activities.create` -> creare una nuova attivita'
- `minor_activities.update` -> modificare un'attivita'
- `minor_activities.delete` -> eliminare un'attivita'

Nota obbligatoria da mostrare:

> Per i ruoli non privilegiati, ogni operazione richiede anche assegnazione attiva al minore.

---

## 5. Messaggio 403 da usare

Messaggio gia' allineato:

> Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.

UX deve mantenere questo testo o una variante strettamente equivalente, senza perdere il doppio significato.

---

## 6. Pattern UI consigliato

### 6.1 Posizione del pulsante

Inserire `Informazioni` nell'header della pagina `Attivita'`.

### 6.2 Formato consigliato

Preferibile:
- drawer laterale

Alternativa:
- modal ampia

### 6.3 Blocchi contenuto consigliati

1. `A cosa serve`
2. `Chi puo' operare`
3. `Permessi richiesti`
4. `Assegnazione al minore`
5. `Errori frequenti`

---

## 7. Microcopy utili

### 7.1 Box info leggero nel form

Testo suggerito:

> Le attivita' richiedono permesso di ruolo e, per i ruoli operativi, assegnazione attiva al minore.

### 7.2 Tooltip o nota contestuale vicino a controlli non attivi

> Verifica permessi del ruolo e assegnazione attiva al minore.

Nota:
- non implementare logiche client-side di pre-autorizzazione non confermate dal backend
- il pre-check UI resta un miglioramento futuro separato

---

## 8. Output atteso dal team frontend

- pulsante `Informazioni` nella pagina `Attivita'`
- guida contestuale coerente con backend
- uso del messaggio `403` gia' concordato
- rispetto del modello RBAC + assegnazione al minore
