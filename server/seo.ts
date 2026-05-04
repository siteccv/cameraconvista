import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import type { Page, Event } from "@shared/schema";

const SITE_NAME = "Camera con Vista";
const DEFAULT_TITLE_IT = "Camera con Vista - Tapas Bar e Cocktail Bar Bologna";
const DEFAULT_TITLE_EN = "Camera con Vista - Tapas & Cocktail Bar Bologna";
const DEFAULT_DESC_IT =
  "Tapas bar elegante nel centro storico di Bologna: aperitivi, cocktail d'autore, vini selezionati ed eventi privati in un'atmosfera curata.";
const DEFAULT_DESC_EN =
  "Elegant tapas and cocktail bar in Bologna's historic center for aperitivo, signature drinks, selected wines and private events.";

const SLUG_TO_PATH: Record<string, string> = {
  home: "/",
  menu: "/menu",
  "carta-vini": "/lista-vini",
  "cocktail-bar": "/cocktail-bar",
  eventi: "/eventi",
  "eventi-privati": "/eventi-privati",
  "eventi-privati-aperitivo": "/eventi-privati/aperitivo",
  "eventi-privati-esclusivo": "/eventi-privati/esclusivo",
  galleria: "/galleria",
  "dove-siamo": "/dove-siamo",
  privacy: "/privacy",
  cookie: "/cookie",
};

const PATH_TO_SLUG: Record<string, string> = {
  "/": "home",
};
for (const [slug, path] of Object.entries(SLUG_TO_PATH)) {
  if (slug !== "home") {
    PATH_TO_SLUG[path] = slug;
  }
}

const DEFAULT_PAGE_TITLES_IT: Record<string, string> = {
  home: "Camera con Vista - Tapas Bar e Cocktail Bar Bologna",
  menu: "Tapas e Aperitivo - Camera con Vista Bologna",
  "carta-vini": "Carta Vini per Tapas e Aperitivo - Camera con Vista",
  "cocktail-bar": "Cocktail Bar a Bologna - Camera con Vista",
  eventi: "Eventi - Camera con Vista | Events Bologna",
  "eventi-privati": "Eventi Privati e Aperitivi a Bologna - Camera con Vista",
  "eventi-privati-aperitivo": "Aperitivo Privato a Bologna - Camera con Vista",
  "eventi-privati-esclusivo": "Evento Privato Esclusivo a Bologna - Camera con Vista",
  galleria: "Galleria - Camera con Vista | Photo Gallery Bologna",
  "dove-siamo": "Tapas e Cocktail Bar in Centro a Bologna - Dove Siamo",
  privacy: "Privacy Policy - Camera con Vista",
  cookie: "Cookie Policy - Camera con Vista",
};

const DEFAULT_PAGE_TITLES_EN: Record<string, string> = {
  home: "Camera con Vista - Tapas & Cocktail Bar Bologna",
  menu: "Tapas & Aperitivo - Camera con Vista Bologna",
  "carta-vini": "Wine List for Tapas and Aperitivo - Camera con Vista",
  "cocktail-bar": "Cocktail Bar - Camera con Vista | Cocktails Bologna",
  eventi: "Events - Camera con Vista | Events Bologna",
  "eventi-privati": "Private Events and Aperitivo in Bologna - Camera con Vista",
  "eventi-privati-aperitivo": "Private Aperitivo in Bologna - Camera con Vista",
  "eventi-privati-esclusivo": "Exclusive Private Event in Bologna - Camera con Vista",
  galleria: "Gallery - Camera con Vista | Photo Gallery Bologna",
  "dove-siamo": "Tapas and Cocktail Bar in Central Bologna - Where We Are",
  privacy: "Privacy Policy - Camera con Vista",
  cookie: "Cookie Policy - Camera con Vista",
};

const DEFAULT_PAGE_DESCS_IT: Record<string, string> = {
  home: DEFAULT_DESC_IT,
  menu: "Scopri tapas, finger food e proposte da condividere per aperitivo e cena informale, con cocktail d'autore e vini selezionati.",
  "carta-vini":
    "Vini italiani e internazionali selezionati per accompagnare tapas, aperitivi e cocktail experience nel centro storico di Bologna.",
  "cocktail-bar":
    "Cocktail bar elegante a Bologna con drink d'autore, classici rivisitati, spirits selezionati e aperitivi con tapas nel centro storico.",
  eventi:
    "Scopri gli eventi in programma da Camera con Vista a Bologna. Serate speciali, degustazioni e appuntamenti esclusivi.",
  "eventi-privati":
    "Organizza aperitivi privati, feste aziendali ed eventi esclusivi a Bologna con cocktail bar dedicato, tapas e formule su misura.",
  "eventi-privati-aperitivo":
    "Aperitivo privato a Bologna con cocktail, tapas e finger food selezionati in uno spazio elegante e riservato.",
  "eventi-privati-esclusivo":
    "Evento privato esclusivo a Bologna con cocktail bar, tapas e formule personalizzate per gruppi e occasioni speciali.",
  galleria:
    "La galleria fotografica di Camera con Vista: tapas bar elegante, cocktail d'autore, aperitivi ed eventi privati a Bologna.",
  "dove-siamo":
    "Camera con Vista si trova nel centro storico di Bologna: tapas bar elegante per aperitivi, cocktail ed eventi privati.",
  privacy:
    "Informativa sulla privacy di Camera con Vista. Come trattiamo i tuoi dati personali, basi giuridiche e diritti dell'interessato.",
  cookie:
    "Cookie Policy di Camera con Vista. Dettagli sui cookie utilizzati, categorie e gestione del consenso.",
};

const DEFAULT_PAGE_DESCS_EN: Record<string, string> = {
  home: DEFAULT_DESC_EN,
  menu: "Discover tapas, sharing plates and aperitivo bites paired with signature cocktails and selected wines in Bologna.",
  "carta-vini":
    "Italian and international wines selected to pair with tapas, aperitivo and cocktail experiences in Bologna's historic center.",
  "cocktail-bar":
    "Elegant cocktail bar in Bologna with signature drinks, revisited classics, selected spirits and aperitivo with tapas.",
  eventi:
    "Discover upcoming events at Camera con Vista in Bologna. Special evenings, tastings and exclusive appointments.",
  "eventi-privati":
    "Plan private aperitifs, corporate parties and exclusive events in Bologna with dedicated cocktail bar, tapas and tailored formulas.",
  "eventi-privati-aperitivo":
    "Private aperitivo in Bologna with cocktails, tapas and selected finger food in an elegant reserved space.",
  "eventi-privati-esclusivo":
    "Exclusive private event in Bologna with cocktail bar, tapas and tailored formulas for groups and special occasions.",
  galleria:
    "The photo gallery of Camera con Vista: elegant tapas bar, signature cocktails, aperitivo and private events in Bologna.",
  "dove-siamo":
    "Find Camera con Vista in Bologna's historic center: an elegant tapas bar for aperitivo, cocktails and private events.",
  privacy:
    "Privacy Policy of Camera con Vista. How we process your personal data, legal bases and your rights.",
  cookie:
    "Cookie Policy of Camera con Vista. Details on cookies used, categories and consent management.",
};

interface SeoData {
  lang: "it" | "en";
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: string;
  ogImage?: string;
  hreflangIt: string;
  hreflangEn: string;
  jsonLd: object[];
  breadcrumbs: { name: string; url: string }[];
}

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5000";
  return `${proto}://${host}`;
}

function detectLang(req: Request): "it" | "en" {
  const langParam = req.query.lang;
  if (langParam === "en") return "en";
  return "it";
}

async function buildSeoData(req: Request): Promise<SeoData> {
  const lang = detectLang(req);
  const baseUrl = getBaseUrl(req);
  const rawPath = (req.originalUrl || req.url || req.path).split("?")[0];
  const pathname = rawPath.replace(/\/$/, "") || "/";
  const slug = PATH_TO_SLUG[pathname];

  let title: string;
  let description: string;
  let ogType = "website";
  let ogImage: string | undefined;
  const jsonLd: object[] = [];

  const breadcrumbs: { name: string; url: string }[] = [{ name: "Home", url: baseUrl + "/" }];

  if (slug) {
    let page: Page | undefined;
    try {
      const pages = await storage.getPages();
      page = pages.find((p) => p.slug === slug);
    } catch {}

    if (page) {
      const metaTitle = lang === "it" ? page.metaTitleIt : page.metaTitleEn;
      const metaDesc = lang === "it" ? page.metaDescriptionIt : page.metaDescriptionEn;

      title =
        metaTitle ||
        (lang === "it" ? DEFAULT_PAGE_TITLES_IT[slug] : DEFAULT_PAGE_TITLES_EN[slug]) ||
        DEFAULT_TITLE_IT;
      description =
        metaDesc ||
        (lang === "it" ? DEFAULT_PAGE_DESCS_IT[slug] : DEFAULT_PAGE_DESCS_EN[slug]) ||
        DEFAULT_DESC_IT;
    } else {
      title =
        (lang === "it" ? DEFAULT_PAGE_TITLES_IT[slug] : DEFAULT_PAGE_TITLES_EN[slug]) ||
        DEFAULT_TITLE_IT;
      description =
        (lang === "it" ? DEFAULT_PAGE_DESCS_IT[slug] : DEFAULT_PAGE_DESCS_EN[slug]) ||
        DEFAULT_DESC_IT;
    }

    if (slug !== "home") {
      const pageName = lang === "it" ? page?.titleIt || slug : page?.titleEn || slug;
      breadcrumbs.push({ name: pageName, url: baseUrl + pathname });
    }
  } else if (pathname.startsWith("/eventi/")) {
    const eventId = parseInt(pathname.split("/")[2], 10);
    let event: Event | undefined;
    try {
      const events = await storage.getEvents();
      event = events.find((e) => e.id === eventId);
    } catch {}

    if (event) {
      const eventTitle = lang === "it" ? event.titleIt : event.titleEn;
      title = `${eventTitle} - ${SITE_NAME}`;
      description =
        (lang === "it" ? event.descriptionIt : event.descriptionEn) ||
        (lang === "it" ? DEFAULT_DESC_IT : DEFAULT_DESC_EN);
      ogType = "article";
      ogImage = event.posterUrl || undefined;

      breadcrumbs.push(
        { name: lang === "it" ? "Eventi" : "Events", url: baseUrl + "/eventi" },
        { name: eventTitle, url: baseUrl + pathname },
      );

      if (event.startAt) {
        const eventSchema: any = {
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.titleIt,
          description: event.descriptionIt || "",
          startDate: new Date(event.startAt).toISOString(),
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: "Camera con Vista",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Via Santo Stefano 14/2a",
              addressLocality: "Bologna",
              postalCode: "40125",
              addressCountry: "IT",
            },
          },
          image: event.posterUrl || undefined,
          organizer: {
            "@type": "BarOrPub",
            name: "Camera con Vista",
            url: baseUrl,
          },
        };

        // Add endDate if available, otherwise default to 2 hours after start
        if (event.endAt) {
          eventSchema.endDate = new Date(event.endAt).toISOString();
        } else if (event.startAt) {
          const defaultEnd = new Date(event.startAt);
          defaultEnd.setHours(defaultEnd.getHours() + 2);
          eventSchema.endDate = defaultEnd.toISOString();
        }

        jsonLd.push(eventSchema);
      }
    } else {
      title = lang === "it" ? DEFAULT_TITLE_IT : DEFAULT_TITLE_EN;
      description = lang === "it" ? DEFAULT_DESC_IT : DEFAULT_DESC_EN;
    }
  } else {
    title = lang === "it" ? DEFAULT_TITLE_IT : DEFAULT_TITLE_EN;
    description = lang === "it" ? DEFAULT_DESC_IT : DEFAULT_DESC_EN;
  }

  const canonicalUrl = baseUrl + pathname + (lang === "en" ? "?lang=en" : "");
  const hreflangIt = baseUrl + pathname;
  const hreflangEn = baseUrl + pathname + "?lang=en";

  // Base URL for links in JSON-LD should be consistent with the current canonical version
  const currentBaseUrl = lang === "en" ? hreflangEn : hreflangIt;
  const linkBase = baseUrl + (lang === "en" ? "?lang=en" : "");

  if (pathname === "/" || slug === "home") {
    let footerData: any = {};
    try {
      const setting = await storage.getSiteSetting("footer_settings");
      if (setting?.valueIt) {
        footerData =
          typeof setting.valueIt === "string" ? JSON.parse(setting.valueIt) : setting.valueIt;
      }
    } catch {}

    jsonLd.push({
      "@context": "https://schema.org",
      "@type": ["BarOrPub", "Restaurant"],
      name: "Camera con Vista",
      alternateName: "Camera con Vista Tapas Bar",
      description: DEFAULT_DESC_IT,
      url: lang === "en" ? hreflangEn : hreflangIt,
      telephone: footerData.phone || "+39 051 267889",
      email: footerData.email || "info@cameraconvistabologna.it",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Via Santo Stefano 14/2a",
        addressLocality: "Bologna",
        addressRegion: "BO",
        postalCode: "40125",
        addressCountry: "IT",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 44.4949,
        longitude: 11.3366,
      },
      servesCuisine: ["Tapas", "Cocktails", "Italian", "Wine"],
      priceRange: "€€-€€€",
      image: baseUrl + "/favicon.png",
      sameAs: [footerData.instagramUrl, footerData.facebookUrl].filter(Boolean),
      hasMenu: {
        "@type": "Menu",
        url: baseUrl + "/menu" + (lang === "en" ? "?lang=en" : ""),
      },
    });
  }

  if (slug === "menu") {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "Menu",
      name: "Menu Camera con Vista",
      description: lang === "it" ? DEFAULT_PAGE_DESCS_IT.menu : DEFAULT_PAGE_DESCS_EN.menu,
      url: baseUrl + "/menu" + (lang === "en" ? "?lang=en" : ""),
      hasMenuSection: [],
    });
  }

  if (breadcrumbs.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => {
        // Ensure breadcrumb URLs include ?lang=en if we are in EN mode
        let breadcrumbUrl = b.url;
        if (lang === "en" && !breadcrumbUrl.includes("?lang=en")) {
          breadcrumbUrl = breadcrumbUrl.includes("?")
            ? `${breadcrumbUrl}&lang=en`
            : `${breadcrumbUrl}?lang=en`;
        }

        return {
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: breadcrumbUrl,
        };
      }),
    });
  }

  return {
    lang,
    title,
    description,
    canonicalUrl,
    ogType,
    ogImage,
    hreflangIt,
    hreflangEn,
    jsonLd,
    breadcrumbs,
  };
}

function buildMetaTags(seo: SeoData, baseUrl: string): string {
  const lines: string[] = [];

  lines.push(`<title>${escapeHtml(seo.title)}</title>`);
  lines.push(`<meta name="description" content="${escapeAttr(seo.description)}" />`);

  lines.push(`<link rel="canonical" href="${escapeAttr(seo.canonicalUrl)}" />`);

  lines.push(`<link rel="alternate" hreflang="it" href="${escapeAttr(seo.hreflangIt)}" />`);
  lines.push(`<link rel="alternate" hreflang="en" href="${escapeAttr(seo.hreflangEn)}" />`);
  lines.push(`<link rel="alternate" hreflang="x-default" href="${escapeAttr(seo.hreflangIt)}" />`);

  lines.push(`<meta property="og:title" content="${escapeAttr(seo.title)}" />`);
  lines.push(`<meta property="og:description" content="${escapeAttr(seo.description)}" />`);
  lines.push(`<meta property="og:type" content="${seo.ogType}" />`);
  lines.push(`<meta property="og:url" content="${escapeAttr(seo.canonicalUrl)}" />`);
  lines.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);

  if (seo.lang === "en") {
    lines.push(`<meta property="og:locale" content="en_US" />`);
    lines.push(`<meta property="og:locale:alternate" content="it_IT" />`);
  } else {
    lines.push(`<meta property="og:locale" content="it_IT" />`);
    lines.push(`<meta property="og:locale:alternate" content="en_US" />`);
  }

  if (seo.ogImage) {
    lines.push(`<meta property="og:image" content="${escapeAttr(seo.ogImage)}" />`);
  }

  lines.push(`<meta name="twitter:card" content="summary_large_image" />`);
  lines.push(`<meta name="twitter:title" content="${escapeAttr(seo.title)}" />`);
  lines.push(`<meta name="twitter:description" content="${escapeAttr(seo.description)}" />`);
  if (seo.ogImage) {
    lines.push(`<meta name="twitter:image" content="${escapeAttr(seo.ogImage)}" />`);
  }

  for (const ld of seo.jsonLd) {
    lines.push(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
  }

  return lines.join("\n    ");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function injectSeoIntoHtml(html: string, metaTags: string, lang: string = "it"): string {
  let cleaned = html;
  // Update html lang attribute
  cleaned = cleaned.replace(/<html[^>]*>/, `<html lang="${lang}">`);

  cleaned = cleaned.replace(/<title>[^<]*<\/title>\s*/g, "");
  cleaned = cleaned.replace(/<meta\s+name="description"[^>]*\/?\s*>\s*/g, "");
  cleaned = cleaned.replace(/<link\s+rel="canonical"[^>]*\/?\s*>\s*/g, "");
  cleaned = cleaned.replace(/<link\s+rel="alternate"\s+hreflang=[^>]*\/?\s*>\s*/g, "");
  cleaned = cleaned.replace(/<meta\s+property="og:[^"]*"[^>]*\/?\s*>\s*/g, "");
  cleaned = cleaned.replace(/<meta\s+name="twitter:[^"]*"[^>]*\/?\s*>\s*/g, "");
  cleaned = cleaned.replace(/<script\s+type="application\/ld\+json">[^<]*<\/script>\s*/g, "");
  cleaned = cleaned.replace(/<meta\s+name="seo-injected"[^>]*\/?\s*>\s*/g, "");
  return cleaned.replace("</head>", `    ${metaTags}\n  </head>`);
}

export async function generateSeoHtml(req: Request): Promise<{ metaTags: string; lang: string }> {
  const seo = await buildSeoData(req);
  const baseUrl = getBaseUrl(req);
  return {
    metaTags: buildMetaTags(seo, baseUrl),
    lang: seo.lang,
  };
}

export function mountSeoRoutes(app: Express): void {
  app.get("/robots.txt", (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    const body = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admina",
      "Disallow: /admina/",
      "Disallow: /api/admin/",
      "",
      `Sitemap: ${baseUrl}/sitemap.xml`,
      "",
    ].join("\n");
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(body);
  });

  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    try {
      const baseUrl = getBaseUrl(req);
      const pages = await storage.getPages();
      const visiblePages = pages.filter((p) => p.isVisible);

      let activeEvents: Event[] = [];
      try {
        const allEvents = await storage.getEvents();
        const now = new Date();
        activeEvents = allEvents.filter((e) => {
          if (!e.active) return false;
          if (e.visibilityMode === "UNTIL_DAYS_AFTER" && e.startAt) {
            const daysAfter = e.visibilityDaysAfter || 7;
            const hideDate = new Date(e.startAt);
            hideDate.setDate(hideDate.getDate() + daysAfter);
            if (now > hideDate) return false;
          }
          return true;
        });
      } catch {}

      const today = new Date().toISOString().split("T")[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
      xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

      for (const page of visiblePages) {
        const path = SLUG_TO_PATH[page.slug];
        if (!path) continue;

        const url = baseUrl + path;
        const priority = page.slug === "home" ? "1.0" : "0.8";
        const changefreq = page.slug === "home" ? "daily" : "weekly";

        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(url)}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${changefreq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="it" href="${escapeXml(url)}" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(url + "?lang=en")}" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url)}" />\n`;
        xml += `  </url>\n`;
      }

      for (const event of activeEvents) {
        const url = `${baseUrl}/eventi/${event.id}`;
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(url)}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="it" href="${escapeXml(url)}" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(url + "?lang=en")}" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url)}" />\n`;
        xml += `  </url>\n`;
      }

      xml += `</urlset>`;

      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
