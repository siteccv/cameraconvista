# STEP 3B — Stabilizzazione Aspect Ratio Hero Menu

## Data: 12 Febbraio 2026
## Stato: COMPLETATO ✅

---

## Intervento Eseguito

In linea con la decisione architetturale di garantire un'identità visiva stabile e un crop costante indipendentemente dalle proporzioni del browser desktop, è stata rimossa la dipendenza dall'altezza relativa al viewport (`vh`) a favore di un **aspect ratio fisso**.

### Modifiche Tecniche:
1. **Rimosso `h-[60vh]`**: La sezione hero non ha più un'altezza dipendente dalla viewport height.
2. **Rimosso `min-h-[calc(100vh-80px)]`**: Il wrapper principale è stato semplificato per permettere al contenuto di fluire naturalmente.
3. **Impostato `aspectRatio="16/9"`**: Su `ImageContainer`, forzando il componente a mantenere sempre le proporzioni 16:9 su desktop.
4. **Semplificazione Wrapper**: Rimosso il div con `absolute inset-y-0` che forzava l'espansione verticale, permettendo all'ImageContainer di determinare la propria altezza in base alla larghezza e all'aspect ratio impostato.
5. **Rimozione bordi/padding mobili**: Il container ora occupa tutta la larghezza (`w-full`) per coerenza con il nuovo sistema di aspect ratio.

## Risultati Ottenuti

- **Crop Stabile**: Ridimensionando la finestra desktop, l'inquadratura rimane identica. L'immagine scala in modo proporzionale senza rivelare aree precedentemente nascoste o cambiare il punto di inquadratura.
- **Identità Visiva Costante**: La proporzione 16/9 garantisce che l'impatto visivo "cinematografico" della hero sia preservato su qualsiasi monitor desktop.
- **Indipendenza Mobile**: La logica mobile rimane intatta, sfruttando la gestione indipendente dello zoom/pan già implementata nello Step 2.

## File Modificati

- `client/src/pages/menu.tsx`: Rimozione classi `vh` e attivazione `aspect-ratio: 16/9`.

---

## Test Eseguiti

| Test | Esito |
|---|---|
| Resize Desktop (1920 -> 900) | ✅ Inquadratura identica, nessun "effetto apertura" |
| Editing Admin | ✅ Funzionante, salvataggio proporzioni corretto |
| Visualizzazione Pubblica | ✅ Hero corretta su Desktop e Mobile |
| Overlay Dinamico | ✅ Preservato e regolabile |
