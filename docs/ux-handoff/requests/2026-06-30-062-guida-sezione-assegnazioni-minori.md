# Handoff UX/API - Guida contestuale sezione Assegnazioni Minori

Data: 2026-06-30
Priorita': alta
Ambito: frontend / UX / help contestuale / modello accesso ai casi

## 1. Obiettivo

Realizzare la guida contestuale della sezione `Assegnazioni Minori`, spiegando in modo semplice ma rigoroso il rapporto tra ruolo RBAC e assegnazione puntuale al minore.

Questa e' una delle sezioni dove piu' facilmente l'utente si confonde, perche' tende a pensare che l'assegnazione definisca anche il ruolo o i permessi. Non e' cosi'.

---

## 2. Fonte contenuto

Frontend puo' usare come base:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-assegnazioni-minori.md`
- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-minori.md`
- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-mappa-ruoli-e-bypass-accesso-minori.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-30-057-gestione-ruolo-utente-e-filtro-assegnazioni-attive-response.md`

---

## 3. Concetto da spiegare chiaramente in UI

### 3.1 Messaggio chiave

Testo suggerito:

> Il ruolo definisce quali operazioni un utente puo' eseguire. L'assegnazione al minore definisce su quali minori puo' eseguirle.

### 3.2 Corollario da mostrare

> Un'assegnazione non aggiunge permessi che il ruolo non possiede.

### 3.3 Eccezione ruoli privilegiati

> Alcuni ruoli di sistema possono operare senza assegnazione manuale puntuale. Le assegnazioni visibili in questa sezione rappresentano soprattutto i collegamenti operativi necessari ai ruoli non privilegiati.

---

## 4. Cosa NON deve fare la UI

La UI non deve:
- chiedere di ridefinire il ruolo dentro l'assegnazione minore
- trasformare la sezione in una seconda matrice RBAC
- far pensare che l'assegnazione da sola abiliti ogni funzione

Se c'e' un attributo descrittivo del legame operativo, va trattato come contesto gestionale, non come sostituzione del ruolo.

---

## 5. Contenuti minimi della guida

### 5.1 A cosa serve la sezione

> La sezione Assegnazioni Minori consente di collegare utenti operativi a singoli minori, definendo il perimetro concreto di lavoro sui casi.

### 5.2 Differenza ruolo vs assegnazione

> Il ruolo decide le funzioni disponibili; l'assegnazione decide su quali minori quelle funzioni possono essere esercitate.

### 5.3 Ruoli privilegiati

> Alcuni ruoli di sistema non richiedono assegnazione puntuale al minore. Per questo motivo, l'assenza di un record in questa sezione non equivale sempre ad assenza di accesso.

### 5.4 Stato attivo e validita'

> Solo le assegnazioni attive e nel periodo di validita' producono effetto operativo.

---

## 6. Nota UX importante sulla coerenza delle viste

La pagina `Assegnazioni Minori` e la tab `Accesso al minore` nella scheda del minore devono apparire coerenti all'utente.

Se una delle due superfici mostra una assegnazione e l'altra no:
- non trattarlo come dettaglio cosmetico
- segnalarlo come possibile anomalia di contratto dati o di filtro applicato

Questo punto e' particolarmente importante per evitare sfiducia nel modello di sicurezza.

---

## 7. Nota tecnica da tenere presente

Esiste una nota UX recente su possibile duplicazione di record ruolo/struttura lato utente.

Riferimento:
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-30-057-gestione-ruolo-utente-e-filtro-assegnazioni-attive-response.md`

Impatto da comprendere in frontend:
- il ruolo attivo mostrato a schermo puo' non rappresentare bene situazioni anomale se esistono record duplicati lato backend
- la guida non deve entrare nel dettaglio tecnico, ma il team UX deve sapere che il tema esiste

---

## 8. Pattern UI consigliato

### 8.1 Posizione del pulsante

Inserire `Informazioni` nell'header della pagina `Assegnazioni Minori`.

### 8.2 Formato consigliato

Preferibile:
- drawer laterale

Alternativa:
- modal ampia

### 8.3 Blocchi contenuto consigliati

1. `A cosa serve`
2. `Ruolo e assegnazione`
3. `Ruoli privilegiati`
4. `Validita' e stato attivo`
5. `Coerenza con la scheda Minore`
6. `Errori frequenti`

---

## 9. Output atteso dal team frontend

- pulsante `Informazioni` nella pagina `Assegnazioni Minori`
- guida contestuale chiara su ruolo vs assegnazione
- microcopy che eviti di far percepire l'assegnazione come una seconda RBAC
- attenzione specifica alla coerenza con la tab `Accesso al minore`
