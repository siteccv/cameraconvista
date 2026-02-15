# Report: Rimozione Rotta /home e Redirect Permanente

## Descrizione dell'intervento
È stata implementata una politica di "Unica Homepage" per consolidare l'autorità SEO sulla root domain (`/`). La rotta `/home` è stata disabilitata come entità autonoma e reindirizzata in modo permanente.

## Modifiche Effettuate

### 1. Redirect 301 (Backend)
Nel file `server/index.ts`, è stata aggiunta una logica di redirect permanente:
- Qualsiasi richiesta a `/home`, `/home/` o `/home?query=...` viene ora reindirizzata con codice **301** verso `/`.
- I parametri query vengono preservati durante il reindirizzamento per non interrompere eventuali campagne marketing o tracciamenti.

### 2. Consolidamento SEO (server/seo.ts)
- Aggiornata la mappa `PATH_TO_SLUG` per garantire che la root `/` sia l'unico punto di ingresso mappato allo slug `home`.
- Rimosso il rischio di duplicazione dei contenuti nei tag canonical: ora puntano esclusivamente a `/`.
- La sitemap dinamica genererà ora solo il link alla root `/`, escludendo qualsiasi riferimento a `/home`.

### 3. Link Interni
- Audit della mappa dei percorsi per garantire la coerenza tra frontend e backend.

## Verifica
- `curl -I https://www.cameraconvista.it/home` -> Restituisce 301 verso `/`.
- `curl -I https://www.cameraconvista.it/home?lang=en` -> Restituisce 301 verso `/?lang=en`.
- Controllo Sitemap: `/home` non è più presente.
- Controllo Canonical: La pagina principale punta a `/`.

---
**Stato**: Completato.
