import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { generateSeoHtml, injectSeoIntoHtml, isKnownPath } from "./seo";

async function serveHtmlWithSeo(
  distPath: string,
  req: express.Request,
  res: express.Response,
  status = 200,
) {
  try {
    const htmlPath = path.resolve(distPath, "index.html");
    let html = await fs.promises.readFile(htmlPath, "utf-8");
    const { metaTags, lang } = await generateSeoHtml(req);
    html = injectSeoIntoHtml(html, metaTags, lang);
    res.status(status).set({ "Content-Type": "text/html" }).send(html);
  } catch (err) {
    console.error("Error serving HTML with SEO:", err);
    res.status(status).sendFile(path.resolve(distPath, "index.html"));
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.get("/", (req, res) => serveHtmlWithSeo(distPath, req, res));

  app.use(express.static(distPath, { index: false }));

  // Fallback SPA - Only for HTML requests and exclude sitemap/robots
  app.use((req, res, next) => {
    // Exclude service files from SPA fallback
    const excludedPaths = ["/sitemap.xml", "/robots.txt", "/sitemap-index.xml"];
    if (excludedPaths.includes(req.path)) {
      return next();
    }

    // Una pagina vera del sito va servita sempre, anche se il client non dichiara
    // di accettare text/html: lo strumento di ispezione di Google chiede con
    // "Accept: */*" e altrimenti riceve un 404 (verificato 17/09/2026 su /cocktail-bar).
    // Gli indirizzi sconosciuti restano come prima: shell SPA con 404 solo per chi
    // chiede HTML, cosi i motori di ricerca li lasciano cadere.
    const accept = req.headers.accept || "";
    const known = isKnownPath(req.path);
    if (known || accept.includes("text/html")) {
      return serveHtmlWithSeo(distPath, req, res, known ? 200 : 404);
    }

    next();
  });
}
