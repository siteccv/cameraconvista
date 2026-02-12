# DIAGNOSI TECNICA: Layout, Gestione Immagini, Preview Mobile

## Progetto: Camera con Vista
## Data: 12 Febbraio 2026
## Tipo: SOLO ANALISI — NESSUNA MODIFICA

---

## 1. STATO LAYOUT ROOT ATTUALE

### Struttura gerarchica del rendering pubblico

```
<div class="min-h-screen flex flex-col bg-background">     ← PublicLayout (100% viewport width, NO max-width)
  <Header />                                                 ← NESSUN max-width sul contenitore header
  <main class="flex-1">                                      ← NESSUN max-width
    <div class="min-h-[calc(100vh-80px)] flex flex-col">     ← Above-the-fold wrapper (100% viewport)
      <section class="relative h-[60vh] shrink-0">          ← Hero (100% viewport width, 60% viewport height)
        <div class="absolute inset-y-0 left-0 right-0">     ← Container immagine = 100% viewport (desktop)
          <EditableImage containerClass="absolute inset-0"   ← Immagine copre tutto
            class="w-full h-full object-cover" />
          <div class="bg-black/35" />                        ← Overlay fisso hardcoded
```

### Diagnosi: Perché il crop cambia

**Causa root**: L'immagine hero usa `object-cover` su un container che ha:
- **Larghezza** = 100% viewport (nessun max-width)
- **Altezza** = 60vh (60% dell'altezza viewport)

`object-cover` funziona così: calcola il ratio più grande tra `containerW/imgW` e `containerH/imgH`, poi scala l'immagine a quel fattore e centra. Questo significa:

| Viewport | Container | Aspect container | Crop comportamento |
|---|---|---|---|
| 2560×1440 (27") | 2560×864 | 2.96:1 | Vede meno altezza, più panoramico |
| 1920×1080 | 1920×648 | 2.96:1 | Simile ma più piccolo |
| 1440×900 | 1440×540 | 2.67:1 | Vede più altezza dell'immagine |
| 1280×800 | 1280×480 | 2.67:1 | Ancora diverso |
| 1024×768 | 1024×461 | 2.22:1 | Crop molto diverso |

**Il problema non è solo di scala** — è che il rapporto larghezza/altezza del container cambia con ogni dimensione di viewport, e `object-cover` seleziona una porzione diversa dell'immagine per ogni aspect ratio.

Su un monitor 27" a tutto schermo, il container hero è estremamente panoramico (quasi 3:1). Riducendo la finestra, diventa meno panoramico e l'inquadratura cambia visibilmente.

### Perché il TestImageContainer non ha questo problema

Il TestImageContainer usa:
- **`aspectRatio: "16/9"`** → l'aspect ratio del container è FISSO
- **Fit-to-width** → la base di rendering è sempre la stessa proporzione
- **Nessun object-cover** → posizionamento esplicito

Risultato: il crop è identico a qualsiasi dimensione di viewport.

---

## 2. ANALISI DETTAGLIATA: EditableImage vs TestImageContainer

### EditableImage (attuale — usato ovunque)

```
RENDERING PUBBLICO:
  <img class="w-full h-full object-cover"
       style="transform: scale(zoom/100) translate(offsetXpx, offsetYpx)" />

PROBLEMI:
1. object-cover decide il crop base → non controllabile
2. transform scale si applica SOPRA object-cover → doppia logica
3. translate usa PIXEL assoluti → non portabili tra device/viewport
4. Il modale di editing ha aspect ratio diverso dalla pagina pubblica
5. Zoom < 100 attiva una seconda logica di rendering (riga 350-378)
6. L'offset non è normalizzato → lo stesso valore px ha effetti diversi
   su schermi diversi
```

### TestImageContainer (nuovo — solo sul test)

```
RENDERING:
  <img style="position:absolute; width:imgW; height:imgH; left:imgLeft; top:imgTop" />

VANTAGGI:
1. Aspect ratio container FISSO → crop prevedibile
2. Posizionamento esplicito → nessuna dipendenza da object-cover
3. Offset normalizzato [-100, +100] → portabile tra device
4. UNA sola logica di rendering per admin e pubblico
5. Editing diretto nel container reale (WYSIWYG)
6. Zoom monodirezionale con minimo intelligente (panoramiche)
7. Overlay controllabile (0-70%)
```

### Tabella comparativa

| Aspetto | EditableImage | TestImageContainer |
|---|---|---|
| Base rendering | object-cover (browser) | fit-to-width (matematica nostra) |
| Crop prevedibile? | NO — dipende da viewport | SÌ — aspect ratio fisso |
| Offset unità | Pixel assoluti | Normalizzato [-100,+100] |
| Logiche rendering | 2 (zoom≥100 e zoom<100) | 1 sola |
| Editing | Modale separato | WYSIWYG nel container |
| Modale vs pagina | Aspect ratio diversi | Stesso container |
| Overlay | Hardcoded (bg-black/35) | Controllabile (0-70%) |
| Mobile indipendente | Sì (valori separati) | NO (solo desktop per ora) |

---

## 3. OVERLAY HARDCODED — STATO ATTUALE

Tutte le hero del sito hanno overlay identico e non controllabile:

```
bg-black/35  →  menu.tsx, carta-vini.tsx, cocktail-bar.tsx,
                eventi.tsx, eventi-privati.tsx, galleria.tsx, dove-siamo.tsx
```

Questo significa:
- Tutte le pagine hanno la stessa oscurazione al 35%
- Non è modificabile dall'admin
- Se un'immagine è già scura, il 35% la rende troppo scura
- Se un'immagine è chiara, il 35% potrebbe non bastare

Il TestImageContainer ha risolto questo con slider 0-70% persistente.

---

## 4. GESTIONE IMMAGINI DESKTOP vs MOBILE — STATO ATTUALE

### EditableImage: supporto parziale

EditableImage **ha già** valori separati per desktop e mobile:
- `zoomDesktop` / `zoomMobile`
- `offsetXDesktop` / `offsetXMobile`
- `offsetYDesktop` / `offsetYMobile`

Il modale ha tab Desktop/Mobile per editare separatamente. Sul sito pubblico, la logica sceglie i valori in base a `forceMobileLayout || viewportIsMobile`.

**Problema**: i valori offset sono in pixel assoluti e la base è object-cover. Quindi i valori mobile non sono realmente "indipendenti" perché:
- Il container mobile ha aspect ratio diverso
- object-cover produce un crop base diverso
- Gli offset pixel hanno effetto diverso
- L'admin edita in un modale con aspect ratio generico, non in quello reale

### TestImageContainer: solo desktop per ora

Il TestImageContainer attualmente ha un solo set di valori (zoom, panX, panY, overlay). Non ha gestione mobile separata.

**Per aggiungere gestione mobile indipendente servono:**
- 4 valori aggiuntivi: `zoomMobile`, `panXMobile`, `panYMobile`, `overlayMobile`
- Switch desktop/mobile nell'admin (come EditableImage ha già)
- Logica di selezione basata su `forceMobileLayout || viewportIsMobile`
- Gli offset normalizzati del TestImageContainer rendono questo MOLTO più pulito rispetto a EditableImage, perché [-100,+100] ha lo stesso significato indipendentemente dalle dimensioni del container

---

## 5. PREVIEW MOBILE IN ADMIN — DIAGNOSI

### Architettura attuale

```
IPhoneFrame.tsx:
  - Width: FISSO 393px (iPhone 15 Pro logica)
  - Height: VARIABILE — min(parentHeight - 32, 771px)
  - Overflow: scroll verticale
  - Nessun CSS zoom/scale
  - I children vengono renderizzati direttamente dentro il frame
```

### Problemi identificati

**1. L'altezza è dinamica (dipende dal parent)**

```typescript
const availableHeight = parent.clientHeight - 32;
setContainerHeight(Math.min(availableHeight, IPHONE_15_PRO_HEIGHT));
```

Se la finestra del browser è piccola, l'altezza del frame si riduce. Questo significa che il contenuto dentro l'IPhoneFrame vede un viewport diverso e il layout cambia.

**2. La larghezza è fissa (393px) ma il breakpoint mobile è 768px**

Il hook `useIsMobile()` usa `window.innerWidth < 768`, non la larghezza del container IPhoneFrame. Quindi:

- L'IPhoneFrame ha 393px di larghezza
- Ma `window.innerWidth` è la larghezza della finestra INTERA (es. 1920px)
- `useIsMobile()` restituisce `false` (non siamo su mobile)
- `forceMobileLayout = true` è settato dal contesto admin

Questo funziona per i componenti che usano `forceMobileLayout`, ma **non funziona** per:
- Classi Tailwind responsive (`md:`, `lg:`) → queste guardano il viewport reale
- Media query CSS → queste guardano il viewport reale
- Il Header (riga 56: `window.innerWidth < 1280`) → guarda il viewport reale

**3. Il contenuto usa unità viewport (vh)**

Le hero usano `h-[60vh]` → 60% dell'altezza del viewport reale (es. 1080px), non dell'IPhoneFrame (771px). All'interno dell'IPhoneFrame, la hero sarà alta 648px in un frame di 771px — completamente sproporzionata.

**4. Nessun CSS zoom/scale**

Il replit.md menziona "CSS zoom" per l'IPhoneFrame, ma il codice attuale NON usa zoom né transform:scale. I pixel sono 1:1, il che è buono per la fedeltà pixel, ma il frame è troppo alto per alcuni schermi admin.

### Impatto pratico

La preview mobile è **parzialmente affidabile**:
- ✅ La larghezza del contenuto è fissa (393px)
- ✅ `forceMobileLayout` attiva il layout mobile nei componenti React
- ❌ Le classi Tailwind responsive NON rispondono alla larghezza del frame
- ❌ Le unità `vh` non sono relative al frame ma al viewport reale
- ❌ L'altezza del frame cambia con la dimensione della finestra
- ❌ L'Header usa `window.innerWidth` direttamente

---

## 6. RISPOSTE ALLE DOMANDE DI DIAGNOSI

### È un problema di container width globale?
**SÌ.** Il layout root (`PublicLayout`, `<main>`, hero sections) non ha nessun `max-width`. Tutto è 100% viewport. Su un monitor 4K (3840px), l'hero è largo 3840px. Su un 13" (1440px), è largo 1440px. Il crop cambia radicalmente.

### È un problema di object-fit / object-position?
**SÌ.** `object-cover` adatta l'immagine al container mantenendo il rapporto, ma quando l'aspect ratio del container cambia (perché la larghezza è fluida e l'altezza è `60vh`), `object-cover` seleziona una porzione diversa dell'immagine.

### È un problema di layout root fluid?
**SÌ.** Non c'è nessun max-width bounded. Il layout è completamente fluid. Siti enterprise (Apple, ecc.) usano tipicamente `max-width: 1440px` o simile con `margin: 0 auto` per limitare la larghezza del contenuto.

### La preview mobile usa viewport relativo o wrapper fixed?
**Wrapper con larghezza fixed (393px) ma altezza dinamica.** Il contenuto all'interno usa ancora unità viewport (`vh`) che si riferiscono alla finestra reale, non al frame. Le classi responsive Tailwind rispondono al viewport reale, non alla larghezza del frame.

### Serve un layout bounded globale?
**SÌ, per stabilizzare l'identità visiva.** Tuttavia, la decisione è delicata:
- Un `max-width` globale su tutto il body cambierebbe l'aspetto dell'intero sito
- Le hero full-bleed (edge-to-edge) sono un pattern comune e desiderabile su schermi normali
- La soluzione potrebbe essere un `max-width` solo sul hero + aspect ratio fisso, non necessariamente su tutto il layout

### Conviene prima stabilizzare layout o consolidare logica immagini?
**Dipende dall'approccio scelto.** Analisi nel paragrafo successivo.

---

## 7. ORDINE SUGGERITO DEGLI INTERVENTI

### Approccio 1: Layout First (stabilizzare il contenitore, poi le immagini)

```
1. Definire max-width o aspect ratio fisso per le hero
2. Stabilizzare la preview mobile (Container Queries o iframe)
3. Consolidare TestImageContainer come componente unico
4. Migrare le hero pagina per pagina
5. Aggiungere gestione mobile indipendente
```

**Pro**: Si parte dalle fondamenta. Il componente immagine viene costruito su un layout stabile.
**Contro**: Tocca prima il layout globale → rischio di regressioni visive immediate su tutto il sito.

### Approccio 2: Image First (consolidare la logica, poi il layout)

```
1. Consolidare TestImageContainer → ImageContainer generico
2. Aggiungere gestione mobile indipendente al componente
3. Migrare le hero pagina per pagina (mantenendo layout attuale)
4. Stabilizzare la preview mobile
5. Eventualmente aggiungere bounded layout per le hero
```

**Pro**: Il componente immagine è autosufficiente. Con aspect ratio fisso sul container, il crop è già stabile. Meno rischio di regressioni iniziali.
**Contro**: Il layout root resta fluid, quindi il container immagine sarà stabile nel suo aspect ratio ma il suo posizionamento nel viewport resta fluid.

### Approccio 3: Ibrido (raccomandato)

```
1. Consolidare TestImageContainer → ImageContainer generico
   (con aspect ratio fisso, il crop non dipende più dal viewport)
2. Aggiungere gestione mobile indipendente al componente
3. Migrare UNA hero di prova (es. menu — basso traffico)
4. Validare che l'aspect ratio fisso risolve il problema del crop
5. Se validato, migrare le altre hero progressivamente
6. Stabilizzare preview mobile (questo può essere fatto in parallelo)
7. Valutare se serve anche un bounded layout globale
```

**Perché questo ordine:**
- L'aspect ratio fisso del TestImageContainer **già risolve** il problema del crop dinamico, senza toccare il layout globale
- Se il container hero usa `aspectRatio: "16/9"` (o altro ratio fisso) con fit-to-width, il crop è identico su qualsiasi viewport
- Il layout globale può essere affrontato separatamente e con meno urgenza
- La preview mobile è un problema indipendente che può essere risolto in parallelo

---

## 8. RISCHI E COMPLESSITÀ

### Rischio basso
- Consolidamento TestImageContainer → ImageContainer: è codice nuovo, non tocca l'esistente
- Aggiunta gestione mobile: è estensione del componente esistente

### Rischio medio
- Migrazione hero pagine: richiede sostituzione di EditableImage con ImageContainer + adattamento dei dati salvati (pixel → normalizzati)
- Preview mobile: richiede intervento su IPhoneFrame e possibilmente Container Queries

### Rischio alto
- Modifica layout root globale (max-width): impatto su tutte le pagine, header, footer, contenuti
- Conversione dati offset esistenti: i valori pixel salvati nel database non sono convertibili automaticamente in valori normalizzati

### Complessità della conversione dati

I dati attualmente salvati nelle page_blocks hanno:
- `imageScaleDesktop/Mobile`: usati come "zoom" in % (100 = cover)
- `imageOffsetX/Y`, `imageOffsetXMobile/YMobile`: in **pixel assoluti**

Nel nuovo sistema:
- `imageScaleDesktop/Mobile`: usati come "zoom" in % (100 = fit-to-width)
- `imageOffsetX/Y`: in **unità normalizzate [-100, +100]**

**Non sono convertibili** perché:
- Lo stesso offset in pixel ha significato diverso a seconda del viewport in cui è stato editato
- I dati non registrano quale viewport/aspect ratio era attivo durante l'editing
- La soluzione più sicura: resettare a 0 tutti gli offset durante la migrazione e rieditare le immagini

---

## 9. RIEPILOGO

| Problema | Causa | Soluzione suggerita |
|---|---|---|
| Crop hero cambia con viewport | Layout fluid + object-cover + 60vh | Aspect ratio fisso sul container (TestImageContainer già lo fa) |
| Overlay non controllabile | Hardcoded bg-black/35 | Overlay controllabile (TestImageContainer già lo fa) |
| Preview mobile instabile | IPhoneFrame con altezza dinamica + vh units + Tailwind responsive non intercettato | Container Queries o iframe isolato |
| Offset non portabili | Pixel assoluti in EditableImage | Offset normalizzati (TestImageContainer già lo fa) |
| Due logiche di rendering | EditableImage ha zoom≥100 e zoom<100 | Una logica unica (TestImageContainer già lo fa) |
| Editing in modale separato | EditableImage apre Dialog | WYSIWYG nel container (TestImageContainer già lo fa) |
| No gestione mobile indipendente nel test | TestImageContainer ha solo 1 set valori | Da aggiungere (estensione naturale) |

**Conclusione**: Il TestImageContainer risolve già 5 dei 7 problemi identificati. I due rimanenti (preview mobile e gestione mobile indipendente) sono estensioni naturali. Il problema del crop hero dinamico viene risolto dall'aspect ratio fisso del container, senza necessità di toccare il layout root globale.
