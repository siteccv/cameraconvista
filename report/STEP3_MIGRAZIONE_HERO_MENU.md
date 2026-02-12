# STEP 3 — Migrazione Hero Pagina Menu a ImageContainer

## Data: 12 Febbraio 2026
## Stato: COMPLETATO

---

## Cosa è stato fatto

1. **Sostituito `EditableImage` con `ImageContainer`** nella hero section della pagina Menu (`client/src/pages/menu.tsx`)

2. **Rimosso overlay hardcoded** `<div className="absolute inset-0 bg-black/35 pointer-events-none" />` — l'overlay è ora gestito dal sistema dinamico di ImageContainer (default: 35%, slider 0-70%)

3. **Aggiornato `handleHeroImageSave`** per usare `ImageContainerSaveData`:
   - `zoom` / `zoomMobile` → `imageScaleDesktop` / `imageScaleMobile`
   - `panX` / `panY` → `imageOffsetX` / `imageOffsetY` (valori normalizzati [-100,+100])
   - `panXMobile` / `panYMobile` → `imageOffsetXMobile` / `imageOffsetYMobile`
   - `overlay` / `overlayMobile` → `metadata.overlay` / `metadata.overlayMobile`

4. **Titolo come children** dell'ImageContainer (EditableText resta invariato, ora renderizzato dentro il container)

5. **Rimosso import** di `EditableImage` e `deviceView` (non più necessari — ImageContainer gestisce internamente il device detection)

## Legacy offset

I valori offset legacy per il Menu hero erano già **tutti a 0** nel database. Nessun reset necessario.

## Problema riscontrato e risoluzione

### Bug: Hero invisibile su pagina pubblica
- **Causa**: `containerClassName="absolute inset-0"` confliggeva con il `relative` aggiunto internamente da ImageContainer. CSS `position: relative` sovrascriveva `position: absolute`, impedendo al container di riempire il parent.
- **Fix**: Cambiato `containerClassName` da `"absolute inset-0"` a `"w-full h-full"` — il parent `<div>` già posizionato con `absolute inset-y-0` gestisce il layout.
- **Nota architetturale**: ImageContainer aggiunge sempre `relative overflow-hidden` internamente per posizionare toolbar e overlay. I consumer NON devono passare `absolute` via containerClassName.

## File toccati

| File | Azione | Dettaglio |
|---|---|---|
| `client/src/pages/menu.tsx` | MODIFICATO | Migrazione hero da EditableImage a ImageContainer |

## Esito test

Tutti i test obbligatori superati (Playwright e2e — 20 step):

| Test | Esito |
|---|---|
| Pagina pubblica /menu carica senza errori | ✅ |
| Hero section visibile con immagine di sfondo | ✅ |
| Overlay scuro visibile sull'immagine (default 35%) | ✅ |
| Titolo "Menù" centrato in bianco | ✅ |
| Intro text sotto hero visibile | ✅ |
| Categorie menu (Antipasti, Primi, Secondi, Contorni, Dessert) visibili | ✅ |
| Admin editing mode: zoom + overlay slider funzionanti | ✅ |
| Admin Cancel chiude editor | ✅ |
| Resize 768×1024 (tablet): hero + titolo visibili | ✅ |
| Resize 1920×1080 (desktop wide): hero copre area | ✅ |

## Regola derivata per migrazioni future

> **IMPORTANTE**: Non usare `containerClassName="absolute inset-0"` con ImageContainer. Usare `containerClassName="w-full h-full"` e posizionare il container dal parent wrapper.

## Prima / Dopo

### Prima (EditableImage + overlay hardcoded)
```jsx
<EditableImage src={...} zoomDesktop={...} offsetXDesktop={...} ... />
<div className="absolute inset-0 bg-black/35 pointer-events-none" />
<div className="relative z-10">
  <EditableText ... />
</div>
```

### Dopo (ImageContainer con overlay dinamico + children)
```jsx
<ImageContainer
  src={...} zoom={...} panX={...} overlay={35}
  zoomMobile={...} panXMobile={...} overlayMobile={35}
  containerClassName="w-full h-full"
  aspectRatio="auto"
  testIdPrefix="menu-hero"
  onSave={handleHeroImageSave}
>
  <div className="flex items-center justify-center h-full">
    <EditableText ... />
  </div>
</ImageContainer>
```
