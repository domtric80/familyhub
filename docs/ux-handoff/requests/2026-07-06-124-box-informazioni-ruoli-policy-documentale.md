# Handoff UX/API - Box Informazioni in pagina Ruoli

Data: 2026-07-06  
Area: `Amministrazione > Ruoli`  
Priorità: alta  
Tipo: box informativo contestuale obbligatorio

## 1. Obiettivo

In pagina `Ruoli` l’utente amministratore deve capire subito:

- che differenza c’è tra permessi ruolo e accesso ai documenti
- perché un ruolo può vedere il modulo documenti ma non tutti i documenti
- come configurare correttamente un ruolo nuovo

Questo box non sostituisce la configurazione.  
Serve a evitare errori di interpretazione.

## 2. Posizionamento UI

Mostrare il box in due punti:

1. nel dettaglio ruolo, sopra o subito prima del tab `Policy documentale`
2. nel form creazione/modifica ruolo, vicino ai permessi RBAC

## 3. Titolo box

Titolo consigliato:

- `Informazioni accesso documentale`

Alternativa accettabile:

- `Come funziona l’accesso ai documenti`

## 4. Testo breve principale

Testo consigliato:

`I permessi del ruolo controllano l’accesso ai moduli e alle funzioni del sistema.`

`La visibilità dei documenti dipende anche dalle classificazioni documentali abilitate al ruolo.`

`Per i documenti del minore serve inoltre un’assegnazione attiva al minore.`

## 5. Versione compatta a bullet

Se UX preferisce una resa a elenco:

- `Permessi ruolo (RBAC):` aprono moduli e funzioni
- `Classificazioni documentali:` decidono quali categorie di documenti il ruolo può vedere
- `Assegnazione minore:` richiesta per accedere ai documenti del minore

## 6. Stati e messaggi dinamici

### Caso 1 - ruolo senza `attachments.read`

Mostrare warning:

`Questo ruolo non ha il permesso base di lettura documenti. Anche se abiliti una classificazione, non potrà leggere documenti finché non riceve attachments.read.`

### Caso 2 - ruolo con `attachments.read` ma senza classificazioni assegnate

Mostrare warning:

`Questo ruolo può accedere al modulo documenti, ma non ha ancora classificazioni documentali abilitate.`

### Caso 3 - ruolo con permesso e classificazioni configurate

Mostrare info positiva:

`La visibilità documentale del ruolo è configurata. Ricorda che per i documenti del minore serve anche l’assegnazione attiva al minore.`

## 7. Microcopy da non usare

Non usare testi generici come:

- `Hai accesso ai documenti`
- `Permessi completi`
- `Ruolo abilitato`

Sono ambigui e non spiegano la differenza tra RBAC e policy documentale.

## 8. Collegamento con il nuovo endpoint

Il box deve leggere gli stati da:

- `GET /api/admin/roles/{role}/document-policy`

Campi utili:

- `rbac.attachments_read`
- `rbac.attachments_upload`
- `summary.explanation`
- `classifications[].assigned_to_role`
- `classifications[].effective_read_access`

## 9. CTA consigliata

Sotto il box, se utile, mostrare un link o pulsante secondario:

- `Configura policy documentale`

che porta al tab/blocco di gestione classificazioni del ruolo.

## 10. Esempio pratico per QA

### Ruolo `PEDIATRA`

Atteso:

- box con messaggio positivo
- classificazione `clinical` visibile come assegnata
- nota che l’accesso vale solo per minori assegnati

### Ruolo custom senza `attachments.read`

Atteso:

- warning forte
- nessun messaggio che faccia credere che le classificazioni bastino da sole
