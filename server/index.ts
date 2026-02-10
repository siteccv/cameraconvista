import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import { mountSeoRoutes, generateSeoHtml, injectSeoIntoHtml } from "./seo";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(cookieParser());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();

  const canonicalHost = "www.cameraconvista.it";
  const host = req.hostname;
  const needsWww = process.env.NODE_ENV === "production" && host !== canonicalHost && (host === "cameraconvista.it" || host.endsWith(".cameraconvista.it"));
  const needsSlashStrip = req.path !== "/" && req.path.endsWith("/");

  if (needsWww || needsSlashStrip) {
    const targetHost = needsWww ? canonicalHost : host;
    const targetPath = needsSlashStrip ? req.path.replace(/\/+$/, "") : req.path;
    const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
    const targetUrl = needsWww
      ? `https://${targetHost}${targetPath}${query}`
      : `${targetPath}${query}`;
    return res.redirect(301, targetUrl);
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

if (process.env.NODE_ENV !== "production") {
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("ETag", "false");
    res.removeHeader("ETag");
    next();
  });
  app.set("etag", false);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await storage.seedInitialData();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  mountSeoRoutes(app);

  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/admina") || req.path.startsWith("/vite-hmr")) {
      return next();
    }

    const ext = req.path.split(".").pop();
    if (ext && ["js", "css", "png", "jpg", "jpeg", "gif", "svg", "ico", "woff", "woff2", "ttf", "map", "json", "txt", "xml", "webp", "mp4"].includes(ext)) {
      return next();
    }

    const originalEnd = res.end;
    const originalSend = res.send;

    res.send = function (body: any) {
      if (typeof body === "string" && body.includes("</head>") && body.includes('<div id="root">')) {
        generateSeoHtml(req)
          .then((metaTags) => {
            const injected = injectSeoIntoHtml(body, metaTags);
            res.set("Content-Length", Buffer.byteLength(injected).toString());
            originalEnd.call(res, injected, "utf-8" as any);
          })
          .catch(() => {
            originalSend.call(res, body);
          });
        return res;
      }
      return originalSend.call(res, body);
    } as any;

    res.end = function (chunk: any, encoding?: any, callback?: any) {
      if (typeof chunk === "string" && chunk.includes("</head>") && chunk.includes('<div id="root">')) {
        generateSeoHtml(req)
          .then((metaTags) => {
            const injected = injectSeoIntoHtml(chunk, metaTags);
            originalEnd.call(res, injected, "utf-8" as any);
          })
          .catch(() => {
            originalEnd.call(res, chunk, encoding, callback);
          });
        return res;
      }
      return originalEnd.call(res, chunk, encoding, callback);
    } as any;

    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
