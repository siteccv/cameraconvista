# Report Fix SEO Middleware in Produzione (Render)
**Data**: 9 Febbraio 2026

---

## 1. Sintesi problema

Su Render (`https://cameraconvista.onrender.com`), tutte le pagine pubbliche restituivano gli stessi meta tag statici presenti nell'`index.html` di build:

```html
<title>Camera con Vista Bistrot</title>
<meta name="description" content="Camera con Vista è riconosciuto come..." />
```

Assenti su TUTTE le pagine: `<title>` specifico per pagina, `<link rel="canonical">`, `<link rel="alternate" hreflang>`, Open Graph completi, Twitter Card, JSON-LD.

La sitemap.xml e robots.txt funzionavano correttamente (endpoint Express dedicati).

---

## 2. Root cause reale

**File**: `server/static.ts`, riga 17  
**Causa**: In produzione, il catch-all SPA usava `res.sendFile()`:

```ts
app.use("/{*path}", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

`res.sendFile()` usa internamente il modulo Node `send` che trasferisce il file come **Buffer** tramite streaming, non come stringa. Il middleware SEO in `server/index.ts` intercettava `res.send()` e `res.end()` verificando `typeof chunk === "string"` — i Buffer fallivano questo controllo, quindi l'iniezione non avveniva mai.

In sviluppo (dev), Vite leggeva il file HTML, lo trasformava e chiamava `res.end(page)` dove `page` era una stringa. L'hook funzionava correttamente in dev.

---

## 3. Soluzione scelta

**Approccio**: Modificare il catch-all di produzione in `server/static.ts` per leggere il file HTML come stringa, iniettare i meta tag SEO, e rispondere con `res.send(html)`.

**Perché è la meno invasiva**:
- Modifica un solo file (`server/static.ts`: 4 righe cambiate)
- Non introduce nuove dipendenze
- Non tocca componenti React, layout, routing frontend
- Non modifica la logica del middleware SEO esistente
- Mantiene un fallback (`res.sendFile`) in caso di errore
- Compatibile dev + prod: in dev `serveStatic()` non viene chiamata

---

## 4. File toccati

| File | Modifica |
|---|---|
| `server/static.ts` | Catch-all: `res.sendFile()` → `fs.readFile()` + `generateSeoHtml()` + `injectSeoIntoHtml()` + `res.send()` |
| `server/seo.ts` | Aggiunto endpoint `/robots.txt` dinamico con URL assoluto per Sitemap |
| `server/seo.ts` | Aggiunta riga `hreflang x-default` per eventi in sitemap.xml |

---

## 5. Risultati test (dev locale, porta 5000)

### Test 1: `/menu` (IT)
```
curl -s http://localhost:5000/menu | grep -E '<title>|canonical|hreflang|og:title|twitter:card|application/ld'
```
**Risultato**:
- `<title>Menu - Camera con Vista | Ristorante Bologna</title>` ✅
- `<link rel="canonical" href="http://localhost:5000/menu" />` ✅
- `<link rel="alternate" hreflang="it" href="http://localhost:5000/menu" />` ✅
- `<link rel="alternate" hreflang="en" href="http://localhost:5000/menu?lang=en" />` ✅
- `<link rel="alternate" hreflang="x-default" href="http://localhost:5000/menu" />` ✅
- `og:title`, `og:description`, `og:url`, `og:site_name` ✅
- `twitter:card summary_large_image` ✅
- JSON-LD: Menu + BreadcrumbList ✅

### Test 2: `/menu?lang=en` (EN)
```
curl -s http://localhost:5000/menu?lang=en | grep -E '<title>|canonical|hreflang'
```
**Risultato**:
- `<title>Menu - Camera con Vista | Restaurant Bologna</title>` ✅
- `<link rel="canonical" href="http://localhost:5000/menu?lang=en" />` ✅
- `hreflang it` → `/menu` ✅
- `hreflang en` → `/menu?lang=en` ✅
- `hreflang x-default` → `/menu` ✅

### Test 3: `/` (Home)
**Risultato**:
- `<title>Camera con Vista - Ristorante & Cocktail Bar Bologna</title>` ✅
- Canonical, hreflang ✅
- JSON-LD: Restaurant (con indirizzo, geo, menu, social) + BreadcrumbList ✅

### Test 4: `/contatti`
**Risultato**:
- `<title>Contatti - Camera con Vista | Contact Bologna</title>` ✅
- Canonical, hreflang ✅

### Test 5: `/robots.txt`
```
curl -s http://localhost:5000/robots.txt
```
**Risultato**:
```
User-agent: *
Allow: /
Disallow: /admina
Disallow: /admina/
Disallow: /api/admin/

Sitemap: http://localhost:5000/sitemap.xml
```
URL assoluto per Sitemap ✅

### Test 6: `/sitemap.xml` — eventi
```
curl -s http://localhost:5000/sitemap.xml | grep -A5 'eventi/'
```
**Risultato**: `/eventi/3` ha `hreflang it`, `hreflang en`, `hreflang x-default` ✅

---

## 6. Rischi residui

1. **Verifica su Render**: il fix è testato in dev locale. Dopo il deploy su Render, verificare con `curl https://cameraconvista.onrender.com/menu` che l'iniezione avvenga anche lì (il meccanismo è identico, ma Render potrebbe avere proxy/headers diversi).

2. **Cold start Render (piano free)**: il primo accesso dopo inattività può richiedere 30-60s. Potrebbe impattare Core Web Vitals e crawling Google.

3. **`lastmod` statico**: sitemap.xml usa sempre la data odierna. Google potrebbe ignorarlo. Miglioramento futuro: usare timestamp reale dal DB.

4. **Nessuna og:image sulla homepage**: condivisioni social senza immagine di anteprima. Miglioramento futuro: configurare un'immagine rappresentativa.

5. **Approccio `?lang=en`**: meno robusto di `/en/` per SEO multilingua. Valutare solo se l'inglese diventa priorità strategica.
