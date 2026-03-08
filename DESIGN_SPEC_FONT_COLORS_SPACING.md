# Design Specification: Font, Colors & Spacing
## Camera con Vista - Wine List & Mobile Menu

**Scopo**: Replicate esatto dell'aspetto visivo della lista vini (carta-vini) e del menu a tendina mobile di Camera con Vista su altri progetti Replit.

---

## 📐 Sistema di Colori (HSL)

### Palette Principale Light Mode
Tutti i colori sono definiti in variabili CSS usando formato HSL con alpha transparency.

#### Background & Foreground
- **Background (crema calda)**: `hsl(34.29deg 100% 97.25%)` → Cream/beige quasi bianco
- **Foreground (bordeaux/burgundy)**: `hsl(349.37deg 55.24% 28.04%)` → Marrone rossastro scuro
- **Muted Foreground**: `hsl(25 8% 45%)` → Grigio/beige neutro

#### Primary (Bottoni, Link Attivi)
- **Primary**: `hsl(350 45% 30%)` → Bordeaux wine color (per "Italiano" button nel menu)
- **Primary Foreground**: `hsl(40 20% 98%)` → Crema chiara per testo su primary

#### Accent (Secundario, Highlight)
- **Accent**: `hsl(35 20% 92%)` → Beige/tan chiaro
- **Accent Foreground**: `hsl(25 15% 18%)` → Marrone scuro

#### Card
- **Card Background**: `hsl(40 25% 98%)` → Bianco caldo
- **Card Foreground**: `hsl(25 10% 15%)` → Marrone molto scuro
- **Card Border**: `hsl(35 15% 90%)` → Beige chiaro (per separatori/border)

### Colori Elementi Specifici

#### Prezzo (Prezzo del Vino)
- **Colore Testo Prezzo**: `#B8860B` (goldenrod/oro) o derivato da accent
- Equivalente HSL: `hsl(43 85% 38%)`
- **Font**: Spectral, serif
- **Variante Numerica**: `tabular-nums` (allineamento verticale numeri)

---

## 🔤 Font Family & Typography

### Font Importati
```css
@font-face {
  font-family: 'Adelia';
  src: url('/fonts/adelia.ttf') format('truetype');
  font-weight: normal;
  font-style: italic;
  font-display: swap;
}
```

### Font Dichiarati in CSS Root
```css
--font-sans: 'Montserrat', sans-serif;      /* Body, UI text */
--font-serif: 'Cormorant Garamond', serif;  /* Alternative serif */
--font-display: 'Playfair Display', serif;  /* Titoli, Categorie */
--font-mono: 'JetBrains Mono', monospace;   /* Codice, mono text */
```

---

## 📝 Typography Rules by Element

### 1️⃣ TITOLI CATEGORIA (Es. "Bollicine Italiane")
**Ubicazione**: Sopra la lista di vini di ogni categoria

| Proprietà | Valore |
|-----------|--------|
| **Font Family** | `Playfair Display`, serif |
| **Font Size Desktop** | `3xl` (1.875rem / 48px) |
| **Font Size Mobile** | `2xl` (1.5rem / 36px) |
| **Font Weight** | 400 (Regular) o 500 (Medium) |
| **Line Height** | 1.2 |
| **Color** | Foreground: `hsl(349.37deg 55.24% 28.04%)` |
| **Letter Spacing** | Normal |
| **Text Transform** | None (maiuscolo solo nel testo) |
| **CSS Class** | `font-display text-3xl md:text-4xl` |

**Tailwind Classes**:
```html
<h2 class="font-display text-3xl md:text-4xl text-foreground">
  Bollicine Italiane
</h2>
```

---

### 2️⃣ NOME VINO (Es. "PIGNOLETTO BRUT BIO")
**Ubicazione**: Prima riga di ogni vino nella lista

| Proprietà | Valore |
|-----------|--------|
| **Font Family** | `Montserrat`, sans-serif |
| **Font Size** | `base` (1rem / 16px) |
| **Font Weight** | 700 (Bold) / 600 (SemiBold) |
| **Line Height** | 1.5 |
| **Color** | Card Foreground: `hsl(25 10% 15%)` |
| **Letter Spacing** | `0.05em` (uppercase tracking) |
| **Text Transform** | UPPERCASE |
| **CSS Class** | `font-sans font-bold tracking-wide uppercase` |

**Tailwind Classes**:
```html
<h3 class="font-sans font-bold text-base uppercase tracking-wide">
  PIGNOLETTO BRUT BIO
</h3>
```

---

### 3️⃣ SOTTOTITOLO VINO (Es. "Montevecchio Isolani · BOLOGNA")
**Ubicazione**: Sotto il nome, informazioni produttore/zona

| Proprietà | Valore |
|-----------|--------|
| **Font Family** | `Montserrat`, sans-serif |
| **Font Size** | `sm` (0.875rem / 14px) |
| **Font Weight** | 400 (Regular) |
| **Line Height** | 1.4 |
| **Color** | Muted Foreground: `hsl(25 8% 45%)` |
| **Letter Spacing** | Normal |
| **CSS Class** | `font-sans text-sm text-muted-foreground` |

**Tailwind Classes**:
```html
<p class="font-sans text-sm text-muted-foreground">
  Montevecchio Isolani · BOLOGNA
</p>
```

---

### 4️⃣ PREZZO VINO (Es. "€ 6" / "€ 30")
**Ubicazione**: Sotto il sottotitolo del vino

| Proprietà | Valore |
|-----------|--------|
| **Font Family** | `Spectral`, Georgia, serif |
| **Font Size** | `lg` (1.125rem / 18px) |
| **Font Weight** | 400 (Regular) |
| **Line Height** | 1 (baseline aligned) |
| **Color** | **Accent Gold**: `hsl(43 85% 38%)` o `#B8860B` |
| **Font Variant** | `tabular-nums` (numeri a larghezza fissa) |
| **CSS Class** | `price-text` (custom class) |
| **Gap** | `0.25rem` (gap tra € e numero) |

**Tailwind Classes**:
```html
<span class="price-text text-lg">
  <span>€</span>
  <span>6</span>
</span>
```

**Custom CSS** (definito in index.css):
```css
.price-text {
  font-family: 'Spectral', Georgia, serif;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: baseline;
  line-height: 1;
  gap: 0.25rem;
}
```

---

## 🍷 Spaziature & Layout Elementi

### Spaziatura Verticale Lista Vini
| Elemento | Spaziatura |
|----------|-----------|
| Gap tra titolo categoria e vini | `1.5rem` (24px) / `md:2rem` |
| Gap tra vini | `1.5rem` (24px) / `md:2rem` |
| Padding categoria | `px-4 md:px-8` (left-right) |
| Margin titolo categoria | `mb-6` (bottom) |

---

### Spaziatura Interna Singolo Vino
| Elemento | Spaziatura |
|----------|-----------|
| Gap nome → sottotitolo | `0.25rem` (4px) |
| Gap sottotitolo → prezzo | `0.5rem` (8px) |
| Padding card/item | `px-0 py-4` |
| Border Bottom | `1px solid card-border` (`hsl(35 15% 90%)`) |

---

## 📱 MENU A TENDINA (Mobile Dropdown)

### Header Menu Voci
**Ubicazione**: Voci di navigazione nel menu mobile (Home, Menu, Carta dei Vini, ecc.)

| Proprietà | Valore |
|-----------|--------|
| **Font Family** | `Playfair Display`, serif |
| **Font Size** | `lg` (1.125rem / 18px) |
| **Font Weight** | 400 (Regular) |
| **Line Height** | 1.8 |
| **Color (Default)** | Muted Foreground: `hsl(25 8% 45%)` (grigio/marrone) |
| **Color (Active/Hover)** | Foreground: `hsl(349.37deg 55.24% 28.04%)` (bordeaux) |
| **Letter Spacing** | Normal |
| **CSS Class** | `font-display text-lg text-muted-foreground hover:text-foreground` |

**Tailwind Classes**:
```html
<a class="font-display text-lg text-muted-foreground hover:text-foreground transition-colors">
  Carta dei Vini
</a>
```

### Voce Menu "Carta dei Vini" (Highlighted)
Questa voce ha colore speciale (burgundy) poiché è la pagina attiva:

| Proprietà | Valore |
|-----------|--------|
| **Font Family** | `Playfair Display`, serif |
| **Font Size** | `lg` (1.125rem / 18px) |
| **Font Weight** | 400 (Regular) |
| **Color** | Primary: `hsl(350 45% 30%)` (bordeaux/wine) |
| **CSS Class** | `font-display text-lg text-primary` |

---

### Bottoni Lingua (Language Toggle)
**Ubicazione**: Bottom del menu mobile

| Elemento | Attivo | Inattivo |
|----------|--------|----------|
| **Font Family** | Montserrat, sans-serif | Montserrat, sans-serif |
| **Font Size** | `sm` (0.875rem) | `sm` (0.875rem) |
| **Font Weight** | 600 | 400 |
| **Background** | Primary: `hsl(350 45% 30%)` | Accent: `hsl(35 20% 92%)` |
| **Color Text** | Primary Foreground: `hsl(40 20% 98%)` | Secondary Foreground: `hsl(25 10% 20%)` |
| **Padding** | `px-4 py-2` | `px-4 py-2` |
| **Border Radius** | `0.375rem` (6px) | `0.375rem` (6px) |
| **CSS Class** | `font-sans font-semibold px-4 py-2 rounded-md bg-primary text-primary-foreground` | `font-sans px-4 py-2 rounded-md bg-accent text-secondary-foreground` |

**Tailwind Classes** (Attivo):
```html
<button class="font-sans font-semibold px-4 py-2 rounded-md bg-primary text-primary-foreground">
  Italiano
</button>
```

**Tailwind Classes** (Inattivo):
```html
<button class="font-sans px-4 py-2 rounded-md bg-accent text-secondary-foreground hover:bg-accent/80">
  English
</button>
```

---

## 🎨 Colori Completi (Hex Conversion)

### Da HSL a HEX (Approximate)
| Nome | HSL | HEX Approssimato | Uso |
|------|-----|------------------|-----|
| **Cream Background** | `hsl(34.29 100% 97.25%)` | `#F8F4F0` | Background pagina |
| **Burgundy/Wine** | `hsl(350 45% 30%)` | `#7A1C2E` | Primary, bottoni, link |
| **Marrone Scuro** | `hsl(25 10% 15%)` | `#1F1812` | Testo scuro, card foreground |
| **Grigio/Beige** | `hsl(25 8% 45%)` | `#72685F` | Muted text |
| **Beige Chiaro** | `hsl(35 20% 92%)` | `#EDE5DC` | Secondary, accent |
| **Gold/Prezzo** | `hsl(43 85% 38%)` | `#B8860B` | Prezzi |
| **Beige Border** | `hsl(35 15% 90%)` | `#EFE9E2` | Card border, separator |

---

## 📋 Checklist per Replicazione

- [ ] **Font Imports**: Aggiungere importazioni Google Fonts o self-hosted per:
  - Playfair Display
  - Spectral
  - Montserrat
  - (Opzionale) Cormorant Garamond

- [ ] **CSS Root Variables**: Definire colori HSL in variabili CSS custom (`:root`)

- [ ] **Tailwind Config**: Estendere `fontFamily` con:
  - `display: 'Playfair Display'`
  - `serif: 'Spectral'` o `'Cormorant Garamond'`
  - `sans: 'Montserrat'`

- [ ] **Custom CSS Class**: Aggiungere `.price-text` con:
  - `font-family: 'Spectral'`
  - `font-variant-numeric: tabular-nums`
  - `display: inline-flex`
  - `gap: 0.25rem`

- [ ] **Typography Scales**: Verificare `text-sm`, `text-base`, `text-lg`, `text-3xl`, `text-4xl` corrispondono a:
  - sm: 0.875rem (14px)
  - base: 1rem (16px)
  - lg: 1.125rem (18px)
  - 3xl: 1.875rem (30px)
  - 4xl: 2.25rem (36px)

- [ ] **Spacing**: Verificare `gap-4`, `mb-6`, `py-4`, `px-4` siano in `rem` (1rem = 16px)

- [ ] **Border Radius**: Border radius standard 0.375rem (6px) per input e button

---

## 💾 File di Riferimento (Camera con Vista)

### CSS Main
- `client/src/index.css` — Custom font faces, CSS variables, `.price-text` class

### Tailwind Config
- `tailwind.config.ts` — Font family extensions, color system

### Componenti
- `client/src/pages/carta-vini.tsx` — Wine list implementation
- `client/src/components/layout/Header.tsx` — Mobile menu

---

## 🔍 Note Importanti

1. **HSL Format**: Colori utilizzano notazione HSL con percentuali (es. `hsl(350 45% 30%)`) supportate da Tailwind tramite CSS variables.

2. **Font Variant Numeric**: La classe `price-text` usa `tabular-nums` per allineamento verticale prezzi (numeri larghezza fissa).

3. **Montserrat vs Cormorant Garamond**: 
   - Montserrat = body/UI text, uppercase elements
   - Cormorant Garamond = serif alternative (meno usato, opzionale)

4. **Spectral per Prezzi**: Font serif specificamente per numeri prezzi per eleganza e leggibilità.

5. **Playfair Display per Titoli**: Font serif decorativo per titoli categoria e elementi heading.

6. **Gap tra € e Numero**: 0.25rem (4px) mantenuto via flexbox gap per separazione elegante.

---

## 📌 TL;DR - Quick Reference

```css
/* Root CSS Variables */
--font-display: 'Playfair Display', serif;        /* Titoli */
--font-sans: 'Montserrat', sans-serif;            /* Body */
--font-serif: 'Cormorant Garamond', serif;        /* Alt serif */
--primary: hsl(350 45% 30%);                      /* Burgundy */
--foreground: hsl(349.37 55.24% 28.04%);          /* Dark marrone */
--muted-foreground: hsl(25 8% 45%);               /* Grigio */
--accent: hsl(35 20% 92%);                        /* Beige */
--background: hsl(34.29 100% 97.25%);             /* Cream */

/* Price Text */
.price-text {
  font-family: 'Spectral', serif;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  gap: 0.25rem;
}
```

```html
<!-- Titolo Categoria -->
<h2 class="font-display text-3xl md:text-4xl text-foreground">
  Bollicine Italiane
</h2>

<!-- Nome Vino -->
<h3 class="font-sans font-bold text-base uppercase tracking-wide">
  PIGNOLETTO BRUT BIO
</h3>

<!-- Sottotitolo -->
<p class="font-sans text-sm text-muted-foreground">
  Montevecchio Isolani · BOLOGNA
</p>

<!-- Prezzo -->
<span class="price-text text-lg">
  <span>€</span>
  <span>6</span>
</span>
```

---

**Generated**: 8 Marzo 2026 - Design System Camera con Vista  
**Versione**: 1.0
