# Risposta UX handoff — Task 098
# Preview documenti minore in modale

Data: 2026-07-03
File: `components/common/DocPreviewModal.tsx`, `pages/minori/MinoreDetailPage.tsx`, `package.json`

---

## Stato: ✅ Implementato

### Cosa è stato fatto

**Nuovo componente:** `frontend/src/components/common/DocPreviewModal.tsx`

Modale riusabile di anteprima documenti. Si apre scaricando il blob via API (stesso endpoint del download) e renderizza inline.

**Integrazione:** tab Documenti in `MinoreDetailPage`
- Aggiunto pulsante **Anteprima** (con icona occhio) affiancato al pulsante Scarica
- Il pulsante è disabilitato se `security_status !== 'clean'` (stesso controllo del download)
- La modale espone anche il pulsante Scarica all'interno, per comodità

---

## Tipi di file supportati

| Tipo | Come viene mostrato | Libreria necessaria |
|------|---------------------|---------------------|
| PDF (`.pdf`) | `<embed>` con blob URL nativo | Nessuna |
| Immagini (jpg, png, gif, webp, svg) | `<img>` con blob URL nativo | Nessuna |
| Testo (txt, csv, xml, json, md) | `<pre>` con testo estratto da blob | Nessuna |
| Word (`.docx`) | HTML inline con mammoth | `mammoth ^1.8.0` |
| Excel (`.xlsx`, `.xls`) | Tabella HTML con SheetJS | `xlsx ^0.18.5` |
| Tutti gli altri | Messaggio "anteprima non disponibile" + Scarica | — |

---

## ⚠️ Azione richiesta al team di sviluppo

Le librerie `mammoth` e `xlsx` sono state aggiunte a `package.json` ma **non sono ancora installate** (l'ambiente CI/sandbox non può eseguire `npm install` nella cartella montata).

**Prima del prossimo deploy, eseguire:**

```bash
cd frontend
npm install
```

Questo installerà `mammoth@^1.8.0` e `xlsx@^0.18.5`.

Fino all'installazione, la preview di file `.docx` e `.xlsx` mostrerà il messaggio:
> "Libreria mammoth/xlsx non installata. Esegui npm install nella cartella frontend."

PDF, immagini e file di testo funzionano già senza installazione aggiuntiva (usano API native del browser).

---

## Note tecniche

- Le librerie vengono caricate con **dynamic import** (`import('mammoth')`, `import('xlsx')`) — code splitting automatico di Vite, nessun impatto sul bundle iniziale.
- Il blob URL viene revocato (`URL.revokeObjectURL`) alla chiusura della modale per liberare memoria.
- Il componente `DocPreviewModal` è **riusabile**: accetta una prop `fetchBlob: () => Promise<Blob>` generica, quindi può essere usato anche per documenti dello staff in futuro.
- I file `dangerouslySetInnerHTML` (output di mammoth/xlsx) provengono da blob locali scaricati autenticati — non da sorgenti esterne.
