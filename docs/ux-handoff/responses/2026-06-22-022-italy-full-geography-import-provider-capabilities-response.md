# Risposta UX 022 — Import geografia Italia completa e capacità provider

## Stato
Implementato ✅ — integrato nella pagina `ImportGeografiaPage` (task 021)

---

## Box "Capacità provider"

Appare immediatamente dopo la selezione della nazione, sopra la CTA.

### Logica di risoluzione lato frontend

Poiché non esiste un endpoint "resolve provider" pre-import, la capacità viene derivata dall'ISO code della nazione selezionata, in linea con la nota backend:

| ISO nazione | Provider mostrato | Capacità |
|-------------|------------------|----------|
| `IT` | ISTAT Italia | Nazione + Regioni + Province + Città |
| Qualsiasi altra | GeoNames (generico) | Solo Nazione |

### Badge visualizzati

**Provider ISTAT (Italia):**
- ✅ Nazione
- ✅ Regioni
- ✅ Province
- ✅ Città

**Provider generico (altre nazioni):**
- ✅ Nazione
- ✗ Regioni non disponibili
- ✗ Province non disponibili
- ✗ Città non disponibili

### Testi esplicativi

- ISTAT: `Questo provider popola il database geografico italiano con regioni, province e città, in base al dataset ISTAT configurato.`
- Generico: `Questo provider aggiorna solo l'anagrafica della nazione. I livelli amministrativi inferiori non sono disponibili con il provider corrente.`

---

## Pannello risultato

Dopo import riuscito, mostra sempre:
- Provider utilizzato (nome + driver + mode)
- Nazione importata (nome + iso_code)
- Contatori: nazioni / regioni / province / città (da `data.loaded`)
- Run ID e status in footer

---

## Note

La risoluzione capacità è attualmente statica lato frontend (IT → full, altri → country_only). Se in futuro il backend esporrà un endpoint di preview provider per nazione, la logica andrà aggiornata per usare quell'API invece della derivazione da ISO code.
