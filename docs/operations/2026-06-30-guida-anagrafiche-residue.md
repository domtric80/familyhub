# Guida operativa - Anagrafiche residue

Data: 2026-06-30
Ambito: amministrazione / dizionari applicativi / qualita' del dato

## 1. Scopo del pacchetto anagrafiche residue

Le anagrafiche residue servono a governare i valori riusabili del software che non devono essere lasciati a testo libero.

Questo vale in particolare per:
- tipi documento
- classificazioni documento
- tipi contatto
- stati minore
- tipi uscita
- tipi attivita'

Principio comune:
- se un valore deve essere riusato, filtrato, correlato o auditato, deve vivere in un'anagrafica canonica

---

## 2. Tipi Documento

### Scopo

Definiscono la tipologia funzionale del documento.

### Regola importante

Non devono contenere campi semantici critici lasciati a testo libero se quei valori servono a correlare comportamento, visibilita' o processo.

### Da spiegare in UI

- il tipo documento descrive che cos'e' il documento
- non sostituisce classificazione o scope
- viene riusato nei filtri, nei caricamenti e nelle regole documentali

---

## 3. Classificazioni Documento

### Scopo

Definiscono il livello o la famiglia di classificazione del documento, con impatto possibile sulle regole di accesso documentale.

### Regola importante

Questa sezione e' strettamente collegata al modello documentale e alle regole ABAC.

### Da spiegare in UI

- la classificazione non e' un'etichetta cosmetica
- puo' incidere su visibilita', filtri e audit
- va gestita con attenzione per non alterare il perimetro di accesso

---

## 4. Tipi Contatto

### Scopo

Definiscono le categorie di contatto riusabili nei moduli collegati ai minori e ad altre entita'.

### Regola importante

Serve a evitare varianti manuali incoerenti di uno stesso concetto.

### Da spiegare in UI

- i tipi contatto normalizzano il dato
- migliorano filtri, report e correlazioni
- non vanno sostituiti con descrizioni manuali ogni volta

---

## 5. Stati Minore

### Scopo

Definiscono gli stati canonici con cui viene rappresentata la situazione gestionale del minore nel sistema.

### Regola importante

Lo stato del minore e' un dato di processo, non un testo descrittivo libero.

### Da spiegare in UI

- gli stati servono a rappresentare il ciclo gestionale del caso
- vanno scelti da elenco canonico
- impattano viste, filtri e processo operativo

---

## 6. Tipi Uscita

### Scopo

Definiscono le categorie riusabili delle uscite del minore.

### Regola importante

Sono essenziali per uniformare il dato operativo, i filtri e i report.

### Da spiegare in UI

- il tipo uscita classifica l'evento
- non va scritto manualmente ogni volta
- consente controllo, analisi e reporting coerenti

---

## 7. Tipi Attivita'

### Scopo

Definiscono le categorie riusabili delle attivita' collegate al minore.

### Regola importante

Permettono di leggere il percorso educativo e operativo con criteri stabili.

### Da spiegare in UI

- il tipo attivita' normalizza la descrizione operativa
- migliora reporting, analisi e filtri
- evita dispersione semantica del dato

---

## 8. Regola comune a tutte queste anagrafiche

Queste sezioni non sono semplici tabelle tecniche.

Servono a:
- impedire testo libero non controllato
- mantenere dati coerenti
- sostenere filtri, audit, export e correlazioni
- permettere evoluzione manutenibile del software

---

## 9. Nota per QA e supporto

Se nel software compaiono valori simili ma scritti in modi diversi, va verificato se manca l'uso corretto dell'anagrafica canonica o se esiste una fuga verso campi liberi.
