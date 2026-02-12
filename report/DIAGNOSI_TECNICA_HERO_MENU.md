# Analisi Tecnica: Hero Pagina Menu (ImageContainer)

## Data: 12 Febbraio 2026
## Oggetto: Analisi del comportamento responsivo e gestione altezze

---

## 1. Configurazione `aspectRatio`

Nella pagina `client/src/pages/menu.tsx`, il componente `ImageContainer` è configurato come segue:

```jsx
<ImageContainer
  ...
  aspectRatio="auto"
  containerClassName="w-full h-full"
  ...
>
```

### Dettagli Tecnici:
- **Valore**: `"auto"`
- **Comportamento**: Il valore viene applicato come stile inline CSS (`aspect-ratio: auto`). In CSS, questo significa che il container **non impone alcun rapporto d'aspetto predefinito**. L'altezza non viene calcolata in base alla larghezza, ma deve essere fornita dal contesto esterno (parent).

---

## 2. Determinazione dell'Altezza

L'altezza del container non dipende da `ImageContainer` stesso, ma dalla gerarchia dei parent in `menu.tsx`:

1. **Section Esterna** (`<section className="relative h-[60vh] shrink-0">`):
   - Definisce un'altezza fissa pari al **60% della viewport height (vh)**. Questa è la "sorgente" primaria dell'altezza.
2. **Wrapper Intermedio** (`<div className="absolute inset-y-0 ...">`):
   - Grazie a `absolute inset-y-0`, questo div si estende per tutta l'altezza della section (60vh).
3. **ImageContainer** (`containerClassName="w-full h-full"`):
   - Con `h-full`, il componente occupa il 100% dell'altezza del wrapper, ovvero i 60vh originali.

**Conclusione**: L'altezza è fluida rispetto al viewport (`60vh`), ma fissa rispetto al contenuto dell'immagine.

---

## 3. Analisi del Comportamento al Ridimensionamento

### Fenomeno: "Riducendo la finestra si vede più immagine"
Questo accade a causa dell'algoritmo di **fit-to-width** e **min-zoom** implementato nel componente:

1. **Fit-to-Width**: L'immagine viene inizialmente scalata per coprire l'intera larghezza del container (`containerW`).
2. **Calcolo Altezza Immagine (`baseH`)**: L'altezza dell'immagine scalata dipende dal suo rapporto d'aspetto naturale.
3. **Min-Zoom (Auto-Cover)**: Se `baseH` è inferiore all'altezza del container (`60vh`), il componente aumenta automaticamente lo zoom per evitare bande vuote.

### Dinamica del Viewport:
- **Viewport Largo (Desktop)**: Il container è molto largo e relativamente basso. L'altezza dell'immagine (scalata alla larghezza) eccede di molto i 60vh. Risultato: vedi solo una "striscia" centrale dell'immagine (crop verticale marcato).
- **Viewport Stretto (Mobile/Resize)**: Man mano che la larghezza diminuisce, l'altezza dell'immagine scalata (`baseH`) si avvicina all'altezza del container (60vh). Il rapporto tra l'area visibile e l'immagine totale aumenta.
- **Risultato Visivo**: L'immagine sembra "aprirsi" e mostrare più dettagli verticali perché il crop necessario a coprire il container diminuisce.

---

## 4. Sintesi Diagnostica

- **Altezza**: Gestita interamente tramite Tailwind `h-[60vh]` sulla section esterna.
- **Fluidità**: Il container è fluido in larghezza (`w-full`) e reattivo in altezza (`60vh`).
- **Aspect Ratio**: Disattivato (`auto`) per permettere al layout basato su viewport (vh) di dominare.
- **Percezione**: L'effetto di vedere "più immagine" rimpicciolendo la finestra è un comportamento matematico corretto del sistema di posizionamento `cover`, che minimizza il ritaglio quando le proporzioni del container si avvicinano a quelle dell'immagine originale.
