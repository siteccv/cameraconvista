# Fix: Fallback SPA intercetta Sitemap e Robots

## Descrizione del Problema
In ambiente di produzione, le richieste a `/sitemap.xml` e `/robots.txt` venivano intercettate dal middleware di fallback della Single Page Application (SPA) in `server/static.ts`. Questo succedeva perché il middleware utilizzava un selettore universale `app.use("/{*path}", ...)` che serviva sempre il file `index.html` (con iniezione SEO), ignorando le rotte dinamiche precedentemente montate in `server/seo.ts`.

## Soluzione Applicata
È stato modificato il file `server/static.ts` per rendere il fallback SPA più selettivo:

1. **Esclusione esplicita**: I percorsi `/sitemap.xml`, `/robots.txt` e `/sitemap-index.xml` sono stati esplicitamente esclusi dal fallback tramite un controllo su `req.path`. Se la richiesta riguarda uno di questi file, il controllo passa al middleware successivo (`next()`), permettendo alle rotte in `server/seo.ts` di rispondere correttamente.
2. **Controllo Header Accept**: Il fallback SPA ora viene attivato solo se l'header `Accept` della richiesta include `text/html`. Questo assicura che richieste per altri tipi di risorse (che non sono file statici fisici) non ricevano erroneamente una pagina HTML.

## File Modificati
- `server/static.ts`: Sostituzione di `app.use("/{*path}", ...)` con un middleware condizionale.

## Verifica
- `curl -I /sitemap.xml` -> Deve restituire `application/xml`.
- `curl -I /robots.txt` -> Deve restituire `text/plain`.
- Navigazione SPA (es. `/menu`) -> Deve continuare a funzionare servendo l'HTML con SEO injection.

---
**Stato**: Fix applicato e pronto per la produzione.
