// Testo vero delle pagine dentro l'HTML servito, per chi non esegue JavaScript
// (crawler di ChatGPT, Claude, Perplexity; primo passaggio di Google). React,
// partendo, sostituisce tutto il contenuto di #root: per l'utente non cambia nulla.
// Usa le stesse fonti pubbliche delle API: blocchi pubblicati, snapshot di menu,
// vini e cocktail, menu Colli attivo, eventi e gallerie visibili.
import type { Request } from "express";
import { storage } from "../storage";
import {
  footerSettingsSchema,
  type Cocktail,
  type FooterSettings,
  type MenuItem,
  type Page,
  type PageBlock,
  type Wine,
} from "@shared/schema";
import { applyPublishedSnapshot } from "../routes/pages";
import { getPublishedSnapshot } from "../routes/menu";
import { getColliMenu } from "../routes/colli";
import { getPublicEvents } from "../routes/events";
import { generateSeoHtml, injectSeoIntoHtml, slugForPath } from "../seo";
import * as R from "./render";
import { injectPageContent, type PageContent } from "./inject";

const NAV_LINKS: (R.NavLink & { slug: string })[] = [
  { slug: "home", path: "/", it: "Home", en: "Home" },
  { slug: "menu", path: "/menu", it: "Menu", en: "Menu" },
  { slug: "carta-vini", path: "/lista-vini", it: "Carta dei vini", en: "Wine list" },
  { slug: "cocktail-bar", path: "/cocktail-bar", it: "Cocktail bar", en: "Cocktail bar" },
  { slug: "eventi", path: "/eventi", it: "Eventi", en: "Events" },
  { slug: "eventi-privati", path: "/eventi-privati", it: "Eventi privati", en: "Private events" },
  { slug: "galleria", path: "/galleria", it: "Galleria", en: "Gallery" },
  { slug: "dove-siamo", path: "/dove-siamo", it: "Dove siamo", en: "Find us" },
  { slug: "colli", path: "/colli", it: "Camera con Vista Colli", en: "Camera con Vista Colli" },
];

const HOME_TEASERS = [
  "teaser-menu",
  "teaser-vini",
  "teaser-cocktail",
  "teaser-eventi",
  "teaser-privati",
];

const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, { at: number; value: PageContent | null }>();

interface Ctx {
  lang: R.Lang;
  page?: Page;
  blocks: PageBlock[];
  hiddenPaths: Set<string>;
}

const block = (ctx: Ctx, type: string) => ctx.blocks.find((b) => b.blockType === type);
const text = (ctx: Ctx, type: string) => {
  const b = block(ctx, type);
  return b ? R.paragraphs(R.pick(ctx.lang, b.bodyIt, b.bodyEn)) : "";
};
const heroTitle = (ctx: Ctx, fallback: string) => {
  const hero = block(ctx, "hero");
  return (
    R.pick(ctx.lang, hero?.titleIt, hero?.titleEn) ||
    R.pick(ctx.lang, ctx.page?.titleIt, ctx.page?.titleEn) ||
    fallback
  );
};
const sections = (ctx: Ctx, types: string[], level = 2) =>
  types.map((t) => R.blockSection(block(ctx, t), ctx.lang, level));

type Builder = (ctx: Ctx) => Promise<{ h1: string; parts: string[] }>;

// Solo i blocchi che il sito mostra davvero (vedi i componenti in client/src/pages).
const BUILDERS: Record<string, Builder> = {
  home: async (ctx) => {
    const branding = block(ctx, "branding");
    const claim = R.pick(ctx.lang, branding?.titleIt, branding?.titleEn);
    const teasers = HOME_TEASERS.map((t) => block(ctx, t)).filter(
      (b) => b && !ctx.hiddenPaths.has((b.ctaUrl || "").split("?")[0]),
    );
    // Il nome del locale come titolo principale: e cio che la gente cerca di piu.
    return {
      h1: "Camera con Vista",
      parts: [
        claim && `<p>${R.escapeHtml(claim)}</p>`,
        text(ctx, "branding"),
        ...teasers.map((b) => R.blockSection(b, ctx.lang)),
      ],
    };
  },
  menu: async (ctx) => {
    const [items, mapSetting] = await Promise.all([
      getPublishedSnapshot<MenuItem>("published_menu_items"),
      storage.getSiteSetting("menu_category_map"),
    ]);
    const categoryMap = mapSetting?.valueIt ? JSON.parse(mapSetting.valueIt) : {};
    return {
      h1: heroTitle(ctx, "Menu"),
      parts: [text(ctx, "intro"), R.menuList(items, categoryMap, ctx.lang)],
    };
  },
  "carta-vini": async (ctx) => ({
    h1: heroTitle(ctx, ctx.lang === "en" ? "Wine list" : "Carta dei vini"),
    parts: [
      text(ctx, "intro"),
      R.winesList(await getPublishedSnapshot<Wine>("published_wines"), ctx.lang),
    ],
  }),
  "cocktail-bar": async (ctx) => ({
    h1: heroTitle(ctx, "Cocktail bar"),
    parts: [
      text(ctx, "intro"),
      R.cocktailsList(await getPublishedSnapshot<Cocktail>("published_cocktails"), ctx.lang),
      text(ctx, "outro"),
    ],
  }),
  eventi: async (ctx) => ({
    h1: heroTitle(ctx, ctx.lang === "en" ? "Events" : "Eventi"),
    parts: [text(ctx, "intro"), R.eventsList(await getPublicEvents(), ctx.lang)],
  }),
  "eventi-privati": async (ctx) => ({
    h1: heroTitle(ctx, ctx.lang === "en" ? "Private events" : "Eventi privati"),
    // package-2 (cena) e spento come nel sito (PRIVATE_DINNER_ENABLED=false), package-3 non e mostrato
    parts: [
      text(ctx, "intro"),
      ...sections(ctx, ["section-title"]),
      ...sections(ctx, ["package-1", "package-4"], 3),
      ...sections(ctx, ["spaces-title"]),
      ...["spaces-1", "spaces-2", "spaces-3"].map((t) => text(ctx, t)),
      ...sections(ctx, ["cta"]),
    ],
  }),
  "eventi-privati-aperitivo": async (ctx) => ({
    h1: heroTitle(ctx, "Aperitivo privato"),
    parts: [
      text(ctx, "intro"),
      ...sections(ctx, ["section-a", "section-b", "section-c"], 3),
      ...["gallery-1", "gallery-2", "gallery-3"].map((t) => text(ctx, t)),
    ],
  }),
  "eventi-privati-esclusivo": async (ctx) => ({
    h1: heroTitle(ctx, "Evento esclusivo"),
    parts: [
      text(ctx, "intro"),
      ...sections(ctx, ["option-convivialis", "option-riserva-ccv", "option-riserva-jazz"], 3),
      ...["gallery-1", "gallery-2", "gallery-3"].map((t) => text(ctx, t)),
    ],
  }),
  galleria: async (ctx) => {
    const galleries = (await storage.getGalleries()).filter((g) => g.isVisible);
    return {
      h1: heroTitle(ctx, ctx.lang === "en" ? "Gallery" : "Galleria"),
      parts: [text(ctx, "intro"), R.galleriesList(galleries, ctx.lang)],
    };
  },
  "dove-siamo": async (ctx) => ({
    h1: heroTitle(ctx, ctx.lang === "en" ? "Find us" : "Dove siamo"),
    parts: [text(ctx, "intro")],
  }),
  colli: async (ctx) => {
    const cta = block(ctx, "cta");
    const ctaText = cta ? R.pick(ctx.lang, cta.bodyIt, cta.bodyEn) : "";
    const address = text(ctx, "location");
    return {
      h1: "Camera con Vista Colli",
      parts: [
        R.blockSection(block(ctx, "intro"), ctx.lang),
        ctaText &&
          `<p><a href="${R.localHref("/colli/menu", ctx.lang)}">${R.escapeHtml(ctaText)}</a></p>`,
        text(ctx, "booking-cta"),
        address &&
          `<section><h2>${ctx.lang === "en" ? "Address" : "Indirizzo"}</h2>${address}</section>`,
      ],
    };
  },
  "colli-menu": async (ctx) => {
    const menu = await getColliMenu();
    const lang: R.Lang = menu.metadata?.englishEnabled ? ctx.lang : "it";
    return { h1: "Menu — Camera con Vista Colli", parts: [R.colliMenuList(menu, lang)] };
  },
};

// Senza impostazioni vere niente contatti: i valori predefiniti contengono un
// indirizzo e un telefono di esempio che non devono finire su Google.
async function loadFooter(): Promise<FooterSettings | null> {
  try {
    const setting = await storage.getSiteSetting("footer_settings");
    if (!setting?.valueIt) return null;
    const parsed = footerSettingsSchema.safeParse(JSON.parse(setting.valueIt));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function buildPageContent(
  pathname: string,
  lang: R.Lang,
): Promise<PageContent | null> {
  const slug = slugForPath(pathname);
  const builder = slug ? BUILDERS[slug] : undefined;
  if (!slug || !builder) return null;

  const pages = await storage.getPages();
  const isPublic = (p: Page) => p.isVisible && !p.isDraft;
  const page = pages.find((p) => p.slug === slug);
  // Pagina nascosta o in bozza: il sito mostra "non trovata", qui niente testo.
  if (page && !isPublic(page)) return null;

  const hiddenSlugs = new Set(pages.filter((p) => !isPublic(p)).map((p) => p.slug));
  const ctx: Ctx = {
    lang,
    page,
    blocks: page ? (await storage.getPageBlocks(page.id)).map(applyPublishedSnapshot) : [],
    hiddenPaths: new Set(NAV_LINKS.filter((l) => hiddenSlugs.has(l.slug)).map((l) => l.path)),
  };

  const [{ h1, parts }, footer] = await Promise.all([builder(ctx), loadFooter()]);
  const nav = R.siteNav(
    NAV_LINKS.filter((l) => !ctx.hiddenPaths.has(l.path)),
    lang,
  );
  const extra = slug === "colli-menu" ? [] : [footer ? R.contactsSection(footer, lang) : "", nav];
  return {
    html: R.pageMain(h1, [...parts, ...extra]),
    heroImage: block(ctx, "hero")?.imageUrl || undefined,
  };
}

async function refreshPageContent(key: string, pathname: string, lang: R.Lang) {
  let value: PageContent | null = null;
  try {
    value = await buildPageContent(pathname, lang);
  } catch (error) {
    console.warn("[ssr] page content skipped:", pathname, error);
  }
  cache.set(key, { at: Date.now(), value });
  return value;
}

// Il testo cambia di rado: chi arriva riceve subito l'ultima versione pronta e, se e
// scaduta, la si ricostruisce dietro le quinte. Solo la prima richiesta in assoluto aspetta.
async function cachedPageContent(pathname: string, lang: R.Lang): Promise<PageContent | null> {
  const key = `${pathname}|${lang}`;
  const hit = cache.get(key);
  if (!hit) return refreshPageContent(key, pathname, lang);
  if (Date.now() - hit.at >= CACHE_TTL_MS) {
    hit.at = Date.now();
    void refreshPageContent(key, pathname, lang);
  }
  return hit.value;
}

/** HTML finale di una pagina: meta SEO + testo leggibile + precaricamento della foto principale. */
export async function renderPageHtml(html: string, req: Request): Promise<string> {
  const { metaTags, lang } = await generateSeoHtml(req);
  const withSeo = injectSeoIntoHtml(html, metaTags, lang);
  const pathname = (req.originalUrl || req.url).split("?")[0].replace(/\/$/, "") || "/";
  return injectPageContent(withSeo, await cachedPageContent(pathname, lang === "en" ? "en" : "it"));
}
