# Diagnosi Preview Mobile Admin

## Data: 13 Febbraio 2026

## Problema
La preview mobile nell'admin panel non corrisponde al rendering reale su iPhone 15 Pro.

## Causa Tecnica
L'IPhoneFrame attuale è un `div` di 393×852px che contiene direttamente i componenti React.
- Su un desktop, 393px CSS sono **fisicamente piccoli** (~10cm su un monitor 1920px/24")
- Su un iPhone 15 Pro reale, 393px CSS riempiono l'**intero schermo** (device pixel ratio 3x → 1179px fisici)
- Per compensare, l'admin deve zoomare il browser, ma questo rompe il layout dell'intera pagina admin

Il contenuto CSS è corretto (breakpoints e layout funzionano a 393px), ma la **scala fisica** è sbagliata.

## Proposta A (Fix - CSS Transform Scaling) ✅ RACCOMANDATA
- Rendere il contenuto a 393×852px internamente (viewport iPhone reale)
- Applicare `transform: scale(factor)` per ingrandirlo visivamente
- Il factor si calcola in base all'altezza disponibile nel container admin
- `transform-origin: top center` mantiene l'ancoraggio corretto
- Il wrapper esterno definisce dimensioni esplicite per il layout flow

**Rischi**: Nessuno significativo. È lo stesso approccio di Chrome DevTools e Figma.

**Vantaggi**:
- Zero dipendenza da zoom browser
- Layout interno immutabile (sempre 393px)
- Proporzionale e deterministico
- Minimo impatto sul codice esistente

## Proposta B (Refactor - iframe)
- Usare un `<iframe>` per isolare completamente il viewport
- L'iframe avrebbe viewport 393px reale

**Rischi**: 
- Complessità: comunicazione cross-frame per admin editing (click-to-edit non funzionerebbe)
- Duplicazione stato React (AdminContext, LanguageContext non condivisi)
- Rottura completa del sistema di editing WYSIWYG

**Non raccomandato** perché romperebbe il sistema di editing inline.

## Raccomandazione: Proposta A

## Checklist Test di Accettazione
1. [ ] Frame iPhone visibile e grande (~80% dell'altezza disponibile)
2. [ ] Contenuto interno identico al rendering su iPhone reale
3. [ ] Browser zoom ±: frame scala, contenuto interno invariato
4. [ ] Ridimensionamento finestra: frame si adatta, contenuto interno invariato
5. [ ] Editing click-to-edit funziona dentro il frame
6. [ ] ImageContainer funziona correttamente dentro il frame
