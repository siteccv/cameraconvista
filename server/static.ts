import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { generateSeoHtml, injectSeoIntoHtml } from "./seo";

async function serveHtmlWithSeo(distPath: string, req: express.Request, res: express.Response) {
  try {
    const htmlPath = path.resolve(distPath, "index.html");
    let html = await fs.promises.readFile(htmlPath, "utf-8");
    const metaTags = await generateSeoHtml(req);
    html = injectSeoIntoHtml(html, metaTags);
    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (err) {
    console.error("Error serving HTML with SEO:", err);
    res.sendFile(path.resolve(distPath, "index.html"));
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

    // Only serve HTML fallback if the client accepts text/html
    const accept = req.headers.accept || "";
    if (accept.includes("text/html")) {
      return serveHtmlWithSeo(distPath, req, res);
    }

    next();
  });
}
