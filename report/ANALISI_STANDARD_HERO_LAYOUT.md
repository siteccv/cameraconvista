# Analisi e Proposta: Standard Definitivo Hero + Layout Width

## Data: 12 Febbraio 2026
## Stato: ANALISI — Nessuna modifica applicata

---

## 1. DIAGNOSI STATO ATTUALE

### 1.1 Layout Globale (PublicLayout)

`PublicLayout` (`client/src/components/layout/PublicLayout.tsx`) è un wrapper minimale:

```jsx
<div className="min-h-screen flex flex-col bg-background">
  <Header />
  <main className="flex-1">{children}</main>
  <Footer />
</div>
```

**Non esiste alcun vincolo di `max-width` globale.**

- `<main>` è `flex-1`, senza limiti di larghezza.
- Header: usa `container mx-auto px-4` internamente (Tailwind default `container` = max-width responsive: 640/768/1024/1280px).
- Footer: usa `container mx-auto px-4` internamente (stessi breakpoint).
- Le hero di TUTTE le pagine sono full-bleed (nessun max-width, coprono l'intera larghezza dello schermo).
- I contenuti sotto le hero usano `container mx-auto px-4 max-w-4xl` o `max-w-2xl`.

**Risultato su schermi grandi (27", 2560px)**: Header e Footer sono contenuti (max ~1280px centrati), ma le hero e le section intermedie si espandono senza limite fino ai bordi dello schermo. Il risultato è un layout "spezzato": contenuto stretto al centro, hero esplosa ai margini.

### 1.2 Hero Pre-Migrazione (tutte le pagine tranne Menu)

Tutte le pagine usano lo stesso pattern:

```jsx
<div className="min-h-[calc(100vh-80px)] flex flex-col">
  <section className="relative h-[60vh] shrink-0">
    <div className="absolute inset-y-0 left-4 right-4 md:left-0 md:right-0 rounded-xl md:rounded-none overflow-hidden">
      <EditableImage containerClassName="absolute inset-0" ... />
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />
    </div>
    <!-- Titolo centrato -->
  </section>
  <section className="flex-1 flex items-center justify-center">
    <!-- Intro text -->
  </section>
</div>
```

Caratteristiche:
- **Altezza hero**: `h-[60vh]` — 60% della viewport height, variabile.
- **Larghezza hero**: full-bleed su desktop (`left-0 right-0`), con margini `left-4 right-4` + `rounded-xl` su mobile.
- **Above-the-fold**: Il wrapper `min-h-[calc(100vh-80px)]` garantisce che hero + intro occupino esattamente lo spazio visibile (100vh meno header 80px).
- **Overlay**: Hardcoded `bg-black/35`.

### 1.3 Hero Menu Post-Migrazione (stato attuale)

```jsx
<div className="flex flex-col min-h-screen">
  <section className="relative shrink-0">
    <div className="w-full">
      <ImageContainer containerClassName="w-full" aspectRatio="16/9" ... />
    </div>
  </section>
  <section className="flex-1 flex items-center justify-center">
    <!-- Intro text -->
  </section>
</div>
```

Caratteristiche:
- **Altezza hero**: Determinata da `aspect-ratio: 16/9` applicato alla larghezza. Su 1920px → altezza = 1080px ≈ full screen. Su 2560px → altezza = 1440px > schermo intero.
- **Nessun max-height**: L'aspect ratio senza vincoli di larghezza o altezza massima produce hero giganti su schermi grandi.
- **Above-the-fold perso**: A 1920px, 16/9 produce un'altezza hero che occupa praticamente tutta la viewport, nascondendo completamente l'intro text.

### 1.4 Home Page (non migrata)

```jsx
const heroHeight = "h-[60vh]";
<section className={`relative ${heroHeight} shrink-0`}>
```

Usa ancora `h-[60vh]` con il problema diagnosticato in precedenza: riducendo la finestra si vede più immagine.

---

## 2. PROBLEMI IDENTIFICATI

| # | Problema | Impatto |
|---|---|---|
| P1 | Hero Menu 16/9 senza max-width/max-height: su 1920px occupa 100% viewport | Above-the-fold perso, intro invisibile |
| P2 | Hero 60vh su altre pagine: crop instabile al resize | Identità visiva non coerente |
| P3 | Nessun max-width globale sul layout | Su monitor 27"+ il sito appare "espanso", non elegante |
| P4 | Hero full-bleed senza margini su desktop | Effetto poster, non coerente con ristorazione di fascia alta |
| P5 | Pattern inconsistente: Menu usa aspect-ratio, tutte le altre usano vh | Manutenzione complicata, regole diverse per pagine simili |

---

## 3. PROPOSTA DI STANDARD DEFINITIVO

### 3.1 Principi Guida

Analizziamo i siti di ristorazione di fascia alta (es. ristoranti stellati, boutique hotel):

1. **La hero non è mai full-screen** — occupa tipicamente il 50-60% della viewport, lasciando sempre visibile un accenno del contenuto sotto (effetto "c'è di più").
2. **Il layout ha un contenitore centrale** — max-width tra 1400-1600px con margini laterali su schermi grandi, creando un'esperienza "incorniciata" ed elegante.
3. **L'aspect ratio della hero è fisso** — tipicamente tra 2.5:1 e 3:1 per formato "cinematic banner" (non 16:9 che è troppo alto).
4. **Il max-height previene overflow** — anche con aspect ratio fisso, un max-height impedisce che la hero superi una certa soglia assoluta.

### 3.2 Standard Proposto

#### A. Contenitore Globale (max-width)

```
max-width: 1440px  (90rem)
margin: 0 auto
```

Applicato a `<main>` in `PublicLayout`. Su schermi ≤1440px: nessun effetto. Su schermi >1440px: margini laterali automatici con sfondo `bg-background` visibile ai lati.

**Motivazione**: 1440px è lo standard "premium web" — abbastanza largo per contenuti ricchi, abbastanza contenuto per non risultare dispersivo su 27".

**Nota**: Il background di `bg-background` resterebbe visibile ai lati del contenitore — effetto "cornice" naturale senza dover aggiungere bordi.

#### B. Aspect Ratio Hero Standard

```
aspect-ratio: 5/2   (equivalente a 2.5:1)
max-height: 600px
```

**Calcolo risultante**:

| Larghezza viewport | Altezza hero (5/2) | Con max-height 600px | % viewport (1080p) |
|---|---|---|---|
| 1920px (cappato a 1440px) | 576px | 576px | 53% |
| 1440px | 576px | 576px | 53% |
| 1280px | 512px | 512px | ~67% (laptop) |
| 1024px | 410px | 410px | ~53% (tablet landscape) |
| 768px | 307px | 307px | ~40% (tablet portrait) |

**Motivazione**:
- **5/2**: Rapporto "cinematic banner" — panoramico, elegante, mai dominante. Usato da siti premium (Four Seasons, Aman, Nobu).
- **max-height 600px**: Sicurezza su schermi molto larghi. Anche senza max-width, la hero non supera mai 600px di altezza.
- **Above-the-fold**: A 1920px/1080p, la hero è ~53% → il restante 47% mostra titolo/intro → equilibrio perfetto.

#### C. Above-the-Fold Preservato

Mantenere il pattern esistente:
```jsx
<div className="min-h-[calc(100vh-80px)] flex flex-col">
  <section> <!-- hero con aspect-ratio --> </section>
  <section className="flex-1 flex items-center justify-center">
    <!-- intro centrato nello spazio rimanente -->
  </section>
</div>
```

L'intro text si posiziona automaticamente nel 47% rimanente della viewport.

#### D. Margini Laterali Mobile

Mantenere il pattern mobile esistente:
```
Mobile: left-4 right-4 rounded-xl (hero con margini e bordi arrotondati)
Desktop: full-width dentro il contenitore (ma il contenitore è max 1440px)
```

### 3.3 Implementazione CSS

```css
/* Nessuna modifica globale distruttiva — solo un vincolo aggiuntivo */
```

Opzione 1 — Su `<main>` in PublicLayout:
```jsx
<main className="flex-1 max-w-[1440px] mx-auto w-full">{children}</main>
```

Opzione 2 — Solo sulle hero (meno invasivo):
```jsx
<section className="relative shrink-0 max-w-[1440px] mx-auto w-full">
```

**Raccomandazione**: Opzione 1 per coerenza globale. Se il rischio è troppo alto, partire con Opzione 2 solo sulla hero Menu come test.

### 3.4 ImageContainer per Hero

```jsx
<ImageContainer
  containerClassName="w-full"
  aspectRatio="5/2"
  style con max-height via wrapper o prop
/>
```

Il `max-height` può essere applicato al wrapper esterno:
```jsx
<div className="w-full max-h-[600px] overflow-hidden">
  <ImageContainer aspectRatio="5/2" containerClassName="w-full" />
</div>
```

Oppure come prop addizionale di ImageContainer (da valutare).

---

## 4. ANALISI RISCHI / REGRESSIONI

| Rischio | Probabilità | Mitigazione |
|---|---|---|
| Max-width globale spezza layout di pagine specifiche | Media | Test su tutte le pagine prima di applicare. Partire solo da Menu come test. |
| Aspect ratio 5/2 troppo stretto per alcune immagini | Bassa | L'algoritmo fit-to-width + auto-cover di ImageContainer gestisce qualsiasi proporzione di immagine sorgente. |
| max-height 600px taglia la hero su tablet landscape | Bassa | A 1024px, 5/2 = 410px < 600px → il max-height non interviene. |
| Admin preview: l'iPhone frame potrebbe non rispettare le nuove proporzioni | Media | Verificare che forceMobileLayout+aspectRatio funzionino nell'anteprima. Nessuna modifica alla preview mobile richiesta. |
| Altre pagine con `h-[60vh]` potrebbero sembrare inconsistenti dopo il cambio su Menu | Alta (temporanea) | Previsto dalla migrazione progressiva. Menu è il test, le altre seguiranno. |

---

## 5. PIANO DI APPLICAZIONE PROGRESSIVA

### Fase 1: Menu Hero (test isolato)
- Applicare `aspectRatio="5/2"` + `max-height: 600px` sulla hero Menu
- Ripristinare il wrapper `min-h-[calc(100vh-80px)]` per above-the-fold
- Test completo (resize, admin, pubblico)
- **Nessuna modifica globale**

### Fase 2: Validazione Visiva
- Confronto prima/dopo su 1920px, 1440px, 1280px, 1024px
- Validazione con utente
- Se approvato → procedi

### Fase 3: Max-width Globale
- Applicare `max-w-[1440px] mx-auto w-full` su `<main>` in PublicLayout
- Test su TUTTE le pagine
- Verifica che Header/Footer rimangano coerenti

### Fase 4: Migrazione Progressiva Hero Altre Pagine
- Applicare stesso standard (5/2 + max-height) a: Home, Carta Vini, Cocktail Bar, Eventi, Galleria, Dove Siamo
- Una pagina alla volta, con test

### Fase 5: Rimozione EditableImage
- Quando tutte le hero usano ImageContainer → rimuovere EditableImage
- Pulizia codice

---

## 6. CONFRONTO VISIVO ATTESO

### Prima (stato attuale Menu, 1920px):
```
┌──────────────────────────────────────────────────┐
│ Header                                            │
├──────────────────────────────────────────────────┤
│                                                    │
│                                                    │
│              HERO 16/9 = 1080px                   │
│           (occupa TUTTA la viewport)              │
│                                                    │
│                                                    │
├──────────────────────────────────────────────────┤
│  (intro non visibile senza scroll)                │
└──────────────────────────────────────────────────┘
```

### Dopo (proposta, 1920px con max-width 1440px):
```
┌──────────────────────────────────────────────────┐
│ Header                                            │
├──── margine ──┬──────────────────┬── margine ────┤
│               │                  │               │
│    bg-bkg     │  HERO 5/2 ~576px │    bg-bkg     │
│               │                  │               │
│               ├──────────────────┤               │
│               │                  │               │
│               │   Intro text     │               │
│               │  (above the fold)│               │
│               │                  │               │
├───────────────┴──────────────────┴───────────────┤
│ Contenuto menu...                                 │
└──────────────────────────────────────────────────┘
```

---

## 7. CONCLUSIONE

La proposta è:
- **Aspect ratio 5/2** per hero "cinematic banner" (non poster full screen)
- **Max-height 600px** come sicurezza
- **Max-width 1440px** come contenitore globale per eleganza su schermi grandi
- **Applicazione progressiva** partendo solo da Menu come test
- **Nessun refactor globale distruttivo** — ogni fase è indipendente e reversibile

Lo standard è coerente con siti di ristorazione di fascia alta e con la logica di "above-the-fold equilibrato" già presente nel progetto originale (il pattern `min-h-[calc(100vh-80px)]` dimostra che l'intento era proprio mostrare hero + intro nella prima schermata).
