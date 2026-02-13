import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import type { Page, Event } from "@shared/schema";

const SITE_NAME = "Camera con Vista";
const DEFAULT_TITLE_IT = "Camera con Vista - Ristorante & Cocktail Bar Bologna";
const DEFAULT_TITLE_EN = "Camera con Vista - Restaurant & Cocktail Bar Bologna";
const DEFAULT_DESC_IT = "Camera con Vista è riconosciuto come uno dei cocktail bar più rinomati di Bologna. La nostra filosofia si basa sulla qualità degli ingredienti.";
const DEFAULT_DESC_EN = "Camera con Vista is recognized as one of the most renowned cocktail bars in Bologna. Our philosophy is based on the quality of ingredients.";

const SLUG_TO_PATH: Record<string, string> = {
  home: "/",
  menu: "/menu",
  "carta-vini": "/lista-vini",
  "cocktail-bar": "/cocktail-bar",
  eventi: "/eventi",
  "eventi-privati": "/eventi-privati",
  galleria: "/galleria",
  "dove-siamo": "/dove-siamo",
  privacy: "/privacy",
  cookie: "/cookie",
};

const PATH_TO_SLUG: Record<string, string> = {};
for (const [slug, path] of Object.entries(SLUG_TO_PATH)) {
  PATH_TO_SLUG[path] = slug;
}

const DEFAULT_PAGE_TITLES_IT: Record<string, string> = {
  home: "Camera con Vista - Ristorante & Cocktail Bar Bologna",
  menu: "Menu - Camera con Vista | Ristorante Bologna",
  "carta-vini": "Lista Vini - Camera con Vista | Wine List Bologna",
  "cocktail-bar": "Cocktail Bar - Camera con Vista | Cocktail Bologna",
  eventi: "Eventi - Camera con Vista | Events Bologna",
  "eventi-privati": "Eventi Privati - Camera con Vista | Private Events Bologna",
  galleria: "Galleria - Camera con Vista | Photo Gallery Bologna",
  "dove-siamo": "Dove Siamo - Camera con Vista | Bologna",
  privacy: "Privacy Policy - Camera con Vista",
  cookie: "Cookie Policy - Camera con Vista",
};

const DEFAULT_PAGE_TITLES_EN: Record<string, string> = {
  home: "Camera con Vista - Restaurant & Cocktail Bar Bologna",
  menu: "Menu - Camera con Vista | Restaurant Bologna",
  "carta-vini": "Wine List - Camera con Vista | Wine Selection Bologna",
  "cocktail-bar": "Cocktail Bar - Camera con Vista | Cocktails Bologna",
  eventi: "Events - Camera con Vista | Events Bologna",
  "eventi-privati": "Private Events - Camera con Vista | Private Events Bologna",
  galleria: "Gallery - Camera con Vista | Photo Gallery Bologna",
  "dove-siamo": "Where We Are - Camera con Vista | Bologna",
  privacy: "Privacy Policy - Camera con Vista",
  cookie: "Cookie Policy - Camera con Vista",
};

const DEFAULT_PAGE_DESCS_IT: Record<string, string> = {
  home: DEFAULT_DESC_IT,
  menu: "Scopri il menu del ristorante Camera con Vista a Bologna. Piatti ricercati preparati con ingredienti di prima qualità.",
  "carta-vini": "La lista vini di Camera con Vista, una selezione curata di etichette italiane e internazionali per accompagnare ogni piatto.",
  "cocktail-bar": "Il cocktail bar di Camera con Vista a Bologna. Drink d'autore, classici rivisitati e creazioni originali.",
  eventi: "Scopri gli eventi in programma da Camera con Vista a Bologna. Serate speciali, degustazioni e appuntamenti esclusivi.",
  "eventi-privati": "Organizza il tuo evento privato da Camera con Vista a Bologna. Spazi esclusivi per cene private, aperitivi e celebrazioni.",
  galleria: "La galleria fotografica di Camera con Vista. Scopri l'atmosfera del nostro ristorante e cocktail bar a Bologna.",
  "dove-siamo": "Scopri dove si trova Camera con Vista a Bologna. Indirizzo, orari di apertura, telefono e indicazioni stradali.",
  privacy: "Informativa sulla privacy di Camera con Vista. Come trattiamo i tuoi dati personali, basi giuridiche e diritti dell'interessato.",
  cookie: "Cookie Policy di Camera con Vista. Dettagli sui cookie utilizzati, categorie e gestione del consenso.",
};

const DEFAULT_PAGE_DESCS_EN: Record<string, string> = {
  home: DEFAULT_DESC_EN,
  menu: "Discover the menu at Camera con Vista in Bologna. Refined dishes prepared with top-quality ingredients.",
  "carta-vini": "The wine list at Camera con Vista, a curated selection of Italian and international labels to complement every dish.",
  "cocktail-bar": "The cocktail bar at Camera con Vista in Bologna. Signature drinks, revisited classics and original creations.",
  eventi: "Discover upcoming events at Camera con Vista in Bologna. Special evenings, tastings and exclusive appointments.",
  "eventi-privati": "Organize your private event at Camera con Vista in Bologna. Exclusive spaces for private dinners, aperitifs and celebrations.",
  galleria: "The photo gallery of Camera con Vista. Discover the atmosphere of our restaurant and cocktail bar in Bologna.",
  "dove-siamo": "Find Camera con Vista in Bologna. Address, opening hours, phone and directions.",
  privacy: "Privacy Policy of Camera con Vista. How we process your personal data, legal bases and your rights.",
  cookie: "Cookie Policy of Camera con Vista. Details on cookies used, categories and consent management.",
};

interface SeoData {
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

  const breadcrumbs: { name: string; url: string }[] = [
    { name: "Home", url: baseUrl + "/" },
  ];

  if (slug) {
    let page: Page | undefined;
    try {
      const pages = await storage.getPages();
      page = pages.find((p) => p.slug === slug);
    } catch {}

    if (page) {
      const metaTitle =
        lang === "it" ? page.metaTitleIt : page.metaTitleEn;
      const metaDesc =
        lang === "it" ? page.metaDescriptionIt : page.metaDescriptionEn;

      title = metaTitle || (lang === "it" ? DEFAULT_PAGE_TITLES_IT[slug] : DEFAULT_PAGE_TITLES_EN[slug]) || DEFAULT_TITLE_IT;
      description = metaDesc || (lang === "it" ? DEFAULT_PAGE_DESCS_IT[slug] : DEFAULT_PAGE_DESCS_EN[slug]) || DEFAULT_DESC_IT;
    } else {
      title = (lang === "it" ? DEFAULT_PAGE_TITLES_IT[slug] : DEFAULT_PAGE_TITLES_EN[slug]) || DEFAULT_TITLE_IT;
      description = (lang === "it" ? DEFAULT_PAGE_DESCS_IT[slug] : DEFAULT_PAGE_DESCS_EN[slug]) || DEFAULT_DESC_IT;
    }

    if (slug !== "home") {
      const pageName = lang === "it"
        ? (page?.titleIt || slug)
        : (page?.titleEn || slug);
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
        { name: eventTitle, url: baseUrl + pathname }
      );

      if (event.startAt) {
        jsonLd.push({
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
              streetAddress: "Via San Felice 21/A",
              addressLocality: "Bologna",
              postalCode: "40122",
              addressCountry: "IT",
            },
          },
          image: event.posterUrl || undefined,
          organizer: {
            "@type": "Restaurant",
            name: "Camera con Vista",
            url: baseUrl,
          },
        });
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

  if (pathname === "/" || slug === "home") {
    let footerData: any = {};
    try {
      const setting = await storage.getSiteSetting("footer_settings");
      if (setting?.valueIt) {
        footerData = typeof setting.valueIt === "string" ? JSON.parse(setting.valueIt) : setting.valueIt;
      }
    } catch {}

    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "Camera con Vista",
      alternateName: "Camera con Vista Bistrot",
      description: DEFAULT_DESC_IT,
      url: baseUrl,
      telephone: footerData.phone || "+39 051 267889",
      email: footerData.email || "info@cameraconvistabologna.it",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Via San Felice 21/A",
        addressLocality: "Bologna",
        addressRegion: "BO",
        postalCode: "40122",
        addressCountry: "IT",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 44.4949,
        longitude: 11.3366,
      },
      servesCuisine: ["Italian", "Cocktails"],
      priceRange: "€€-€€€",
      image: baseUrl + "/favicon.png",
      sameAs: [
        footerData.instagramUrl,
        footerData.facebookUrl,
      ].filter(Boolean),
      hasMenu: {
        "@type": "Menu",
        url: baseUrl + "/menu",
      },
    });
  }

  if (slug === "menu") {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "Menu",
      name: "Menu Camera con Vista",
      description: lang === "it" ? DEFAULT_PAGE_DESCS_IT.menu : DEFAULT_PAGE_DESCS_EN.menu,
      url: baseUrl + "/menu",
      hasMenuSection: [],
    });
  }

  if (breadcrumbs.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: b.url,
      })),
    });
  }

  return {
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
  lines.push(`<meta property="og:locale" content="it_IT" />`);
  lines.push(`<meta property="og:locale:alternate" content="en_US" />`);
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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function injectSeoIntoHtml(html: string, metaTags: string): string {
  // We no longer need to replace specific tags because we removed them from the template.
  // We only replace the closing </head> tag with our dynamic meta tags.
  return html.replace("</head>", `    ${metaTags}\n  </head>`);
}

export async function generateSeoHtml(req: Request): Promise<string> {
  const seo = await buildSeoData(req);
  const baseUrl = getBaseUrl(req);
  return buildMetaTags(seo, baseUrl);
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
