import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { generateSeoHtml, injectSeoIntoHtml } from "./seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use("/{*path}", async (req, res) => {
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
  });
}
