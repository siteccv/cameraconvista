# MODELLO PLACEHOLDER (DNA)

### Aggiornamento 2026-01-29
- Hero placeholders: bg/testo rimossi, immagini eager; flash eliminato su Menu, Carta dei Vini, Cocktail Bar, Eventi Privati, Contatti, Home.
- Admin: box hero/placeholder eliminati per Menu, Cocktail, Carta dei Vini, Eventi, Galleria; card contenuti Galleria disattivata.

> Questa è la specifica canonica; vedi anche `DOCS/CODEX_RULES.md` per le regole operative e il comando standard.

> Documento canonico per replicare il placeholder immagine standard (baseline: Hero Home). Nessuna modifica UX/layout: descrive principi, architettura, contract dati, regole, checklist e test.

## 0) Come usare questo documento
- Prima di intervenire: leggi questa pagina e la sezione “Checklist applica modello”.
- Per i log di debug: `VITE_DEBUG_PLACEHOLDER=1` (client) e `DEBUG_PLACEHOLDER=1` (server).
- Report finale: usa il template `DOCS/TEMPLATE_REPORT_APPLICA_MODELLO_PLACEHOLDER.md`.

## 1) Principi (non negoziabili)
- **Single source of truth**: un solo placeholder (`StandardImagePlaceholder`) e un solo stato locale per i transforms; niente doppi modelli.
- **Resa identica local/prod**: stessa pipeline di rendering per admin e pubblico; preview admin desktop allineata a pubblico (max-w 122rem, breakpoint `lg`).
- **Persistenza robusta**: prima del PATCH arrotondare pan/zoom/scale a interi (`Math.round`); niente decimali in payload (evita `22P02`).
- **Cache sync corretta**: dopo PATCH invalidare e refetchare `page-blocks` globali e specifici della pagina; sul pubblico i `page-blocks` non devono restare stantii (`staleTime: 0`, `refetchOnWindowFocus: true`).

## 2) Architettura (diagramma testuale)
- **Rendering pubblico**: `page (home.tsx)` → `HeroSection` → container responsive (aspect 4/5→16/9→21/9) → `StandardImagePlaceholder` (fit contain) che applica transform clampati.
- **Admin**: toolbar inline nel placeholder (drag/zoom/reset) → aggiorna `localTransforms` → debounce `scheduleSaveTransforms` → PATCH `/api/page-blocks/:id` → invalidation/refetch.
- **Preview admin vs pubblico**: `PreviewPane` desktop iframe `max-w-[122rem] h-[80vh]` (breakpoint `lg` raggiunto); mobile frame 390x820 invariato.

## 3) Contract dati (DB/API)
- Campi usati: `imageOffsetX`, `imageOffsetY`, `imageScaleDesktop`, `imageOffsetXMobile`, `imageOffsetYMobile`, `imageScaleMobile` (interi).
- Unità/range: panX/panY in punti percentuali del frame (clamp ±50); scale percentuale (50–400).
- Arrotondamento: obbligatorio `Math.round` prima del PATCH per tutti i campi pan/scale (desktop+mobile).
- Device: selezione implicita via viewport (`matchMedia("(max-width: 768px)")` dentro `StandardImagePlaceholder`); no toggle manuale lato pubblico.

## 4) Comportamenti canonici
- **Pan**: drag sul placeholder (pointer events) aggiorna panX/panY clamp ±50.
- **Zoom**: slider unico per device corrente; range `MIN_ZOOM=50` – `MAX_ZOOM=400`; apply cover-min in render (`Math.max(userZoom, computedMinZoom)` quando `autoCoverMinZoom` attivo).
- **Reset**: azzera pan a 0/0 e porta zoom al `minZoom` corrente (calcolato); salva via PATCH.
- **Fit**: default cover; Hero usa `fit="contain"` + `autoCoverMinZoom` per evitare bande vuote quando possibile. Cover-min influenza solo il render, non persiste nei transforms.

### 4bis) Variante canonica: placeholder piccoli (Home teaser tiles)
- **Stessa logica, UI più piccola**: identica pipeline di transforms/persistenza/caching dei placeholder principali, con toolbar ridotta proporzionata al frame (poche azioni: zoom + reset + picker).
- **Toolbar**: box compatto (tipografia ~10px), slider più corto, pulsanti piccoli.
- **Pulsante immagine**: usare un pulsante con **icona immagine** (no testo) con `aria-label`/`title` per aprire `InlineMediaPicker` e sostituire/inserire l'immagine.
- **Anteprima nel picker**: nel `MediaPickerDialog` ogni miniatura include un pulsante anteprima che apre un modale “solo immagine” (fit-to-modal) per verificare dimensioni/proporzioni senza selezionare.
- **Click fuori**: quando la toolbar è visibile, click fuori dal placeholder e fuori dalla toolbar deve chiuderla (replicare comportamento Hero).
- **No UX/layout changes**: pubblico identico; logiche attive solo in `adminPreview`.

### 4ter) Nota tecnica: `computeCoverMinZoom` con `fit="contain"`
- Quando `StandardImagePlaceholder` usa `object-fit: contain` e lo zoom è applicato via `transform: scale(...)`, lo `scalePercent` è **relativo alla dimensione già “contained”**.
- Il minimo zoom per evitare bande vuote si calcola come fattore aggiuntivo per passare da contain a cover:
  - `containFactor = min(containerW/imageW, containerH/imageH)`
  - `coverFactor = max(containerW/imageW, containerH/imageH)`
  - `minZoom = (coverFactor / containFactor) * 100` clampato.

## 5bis) Storia problemi & checklist preventiva
- **Admin vs pubblico (risolto)**: preview desktop era 96rem → ora 122rem; controllare che il breakpoint `lg` scatti (>1024px).
- **Cache/stale (risolto)**: pubblico aveva `staleTime: Infinity`; ora `page-blocks` hanno `staleTime: 0` + `refetchOnWindowFocus`; dopo PATCH invalidare/refetch `["page-blocks", pageId]`.
- **Persistenza decimali (risolto)**: payload con decimali generava 500 Postgres; obbligo `Math.round` su pan/zoom/scale.
- **Picker bloccato (risolto)**: pointer-capture impediva PATCH; assicurare che controlli admin non fermino la selezione (guardare eventi pointer/stopPropagation).
- **Local vs deploy**: se `DATABASE_URL` assente in deploy → MemStorage (reset valori). Verificare env in prod.
- **Fit contain rollback**: per tornare a cover sull’hero, impostare `fit="cover"` in `HeroSection` (nessun altro file).

## 5) Checklist “APPLICA MODELLO A NUOVO PLACEHOLDER”
1. Identifica container (aspect/width) e fit desiderato (cover/contain).
2. Renderizza `StandardImagePlaceholder` con `transforms { desktop, mobile }` (percentuali) + `autoCoverMinZoom` se serve coprire.
3. Toolbar admin minima: drag + slider zoom + reset; aggiorna solo `localTransforms`.
4. Persistenza: debounce PATCH `/api/page-blocks/:id` con `Math.round` su tutti i campi pan/scale.
5. Cache: `invalidateQueries` + `refetchQueries` su `page-blocks` globali e per `pageId`; pubblico con `refetchOnWindowFocus` e `staleTime: 0` per `page-blocks`.
6. Test rapidi: vedi sezione 6.
- **Anti-pattern da evitare**: useEffect che risincronizza stato locale dai props ad ogni render; clamp diversi tra admin/pubblico; `staleTime: Infinity` senza refetch; doppio overlay o doppio placeholder; payload con decimali.

### 5bis) Checklist rapida per placeholder piccoli (Home teaser)
1. Stessa pipeline transforms: `localTransforms` (desktop/mobile) + drag pan in % (dx/dy normalizzati su width/height del frame) + clamp ±50.
2. Calcolo `minZoom`: `naturalWidth/Height` + `ResizeObserver` sul container + `computeCoverMinZoom`.
3. Enforce `scalePercent >= minZoom` e `fit="contain"` + `autoCoverMinZoom`.
4. Toolbar mini: zoom slider + reset + pulsante picker (icona immagine) + `InlineMediaPicker`.
5. Persistenza: PATCH con `Math.round` anche su `imageUrl` quando si sostituisce.
6. Click fuori: chiude toolbar quando si clicca fuori da placeholder/toolbar.

## 6) Test plan minimo
- `npm run build`.
- Persistenza: modifica pan/zoom → attendi PATCH → refresh pagina → valori invariati.
- Admin vs pubblico: confronta dimensioni hero desktop (iframe 122rem vs pubblico) e mobile invariato.
- Sync tab: modifica da admin → tab pubblica già aperta → focus: dati aggiornati (grazie refetchOnWindowFocus/staleTime=0).
- Decimali: verifica console server `DEBUG_PLACEHOLDER=1` o network: payload PATCH solo interi.

## 7) Prompt template Codex (riuso)
```
Applica modello placeholder a [nome componente]
Requisiti: no cambi UX, usa StandardImagePlaceholder, pan/zoom % clamp ±50/50–400, fit [cover|contain], Math.round prima del PATCH, invalidate+refetch page-blocks (global + pageId), pubblico con staleTime=0/refetchOnWindowFocus per page-blocks. Aggiorna DOCS/MODELLO_PLACEHOLDER.md se varia il modello. Report finale: file toccati + verifica persistenza/cache.
File da toccare: [elencare sezione target + eventuale hook cache + docs].
```

## Riferimenti codice attuale
- Rendering: `client/src/components/media/StandardImagePlaceholder.tsx`.
- Admin/persistenza: `client/src/pages/home/sections/HeroSection.tsx`.
- Placeholder piccoli (Home teaser): `client/src/pages/home/sections/TeaserImagePlaceholder.tsx`.
- Preview: `client/src/pages/admin/home-sections/PreviewPane.tsx`.
- Cache/query: `client/src/hooks/usePageContent.ts` (page-blocks con refetch on focus, staleTime 0).
- API: `server/routes/pages.ts` (GET/PATCH `/api/page-blocks`).

## Aggiornamenti 2026-01-28
- **Rounding server-side**: `/api/page-blocks/:id` arrotonda ora tutti i campi int (offset/scale desktop+mobile, imagePosition/Scale) prima di scrivere su DB per evitare 22P02 se arrivano decimali.
- **Menu hero state sync**: `client/src/pages/menu.tsx` riallinea `localImage`/`localTransforms` quando arriva il blocco hero (evita hero vuoto dopo refetch) e flusha il debounce su unmount/visibilitychange/pagehide.
- **Overlay e testo Menu = Carta Vini**: hero Menù usa lo stesso gradient scuro della Carta dei Vini (`bg-gradient-to-b from-foreground/60 via-foreground/50 to-foreground/70`) e la stessa tipografia/size titolo (text-5xl/6xl/7xl, font-display, bianco, centrato con drop-shadow).
- **Persistenza sicura**: debounce 350ms con `pendingTransforms` + flush immediato; chiamate PATCH sempre con valori interi.
