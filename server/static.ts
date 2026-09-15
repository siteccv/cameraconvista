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

    // Only serve HTML fallback if the client accepts text/html.
    // Unknown paths get the SPA shell with a 404 status so search engines drop them.
    const accept = req.headers.accept || "";
    if (accept.includes("text/html")) {
      return serveHtmlWithSeo(distPath, req, res, isKnownPath(req.path) ? 200 : 404);
    }

    next();
  });
}
