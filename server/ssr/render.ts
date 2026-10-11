// Trasforma i dati pubblici del sito in HTML semplice e leggibile senza JavaScript.
// Funzioni pure: nessun accesso al database, cosi si testano da sole.
import type {
  Cocktail,
  Event,
  FooterSettings,
  Gallery,
  MenuItem,
  PageBlock,
  Wine,
} from "@shared/schema";
import { localizedColliText, sortColliByOrder, type ColliMenuPayload } from "@shared/colli";
import { WINE_CATEGORY_ORDER } from "@shared/wine-categories";

export type Lang = "it" | "en";

// Stessa regola del sito: nella lingua scelta, altrimenti nell'altra.
export const pick = (lang: Lang, it?: string | null, en?: string | null) =>
  localizedColliText(lang, it, en).trim();

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function paragraphs(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function euro(price: string | number | null | undefined): string {
  if (price === null || price === undefined || price === "") return "";
  if (typeof price === "number") {
    return `€ ${Number.isInteger(price) ? price : price.toFixed(1).replace(".", ",")}`;
  }
  const clean = price.replace("€", "").trim();
  return clean ? `€ ${clean}` : "";
}

export function localHref(path: string, lang: Lang): string {
  return lang === "en" ? `${path}${path.includes("?") ? "&" : "?"}lang=en` : path;
}

/** Un blocco di testo della pagina: sottotitolo, titolo, testo e link come li mostra il sito. */
export function blockSection(block: PageBlock | undefined, lang: Lang, level = 2): string {
  if (!block) return "";
  const meta = (block.metadata ?? {}) as Record<string, unknown>;
  const subtitle = pick(lang, meta.subtitleIt as string, meta.subtitleEn as string);
  const title = pick(lang, block.titleIt, block.titleEn);
  const body = pick(lang, block.bodyIt, block.bodyEn);
  const cta = pick(lang, block.ctaTextIt, block.ctaTextEn);
  const parts = [
    subtitle && `<p>${escapeHtml(subtitle)}</p>`,
    title && `<h${level}>${escapeHtml(title)}</h${level}>`,
    body && paragraphs(body),
    cta &&
      block.ctaUrl &&
      `<p><a href="${escapeHtml(localHref(block.ctaUrl, lang))}">${escapeHtml(cta)}</a></p>`,
  ].filter(Boolean);
  return parts.length ? `<section>${parts.join("")}</section>` : "";
}

function groupInOrder<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(item);
  }
  return Array.from(groups.entries());
}

function line(name: string, details: string[], price: string): string {
  const extra = details.filter(Boolean).map(escapeHtml).join(" · ");
  return `<li><strong>${escapeHtml(name)}</strong>${extra ? ` — ${extra}` : ""}${price ? ` <span>${escapeHtml(price)}</span>` : ""}</li>`;
}

export function menuList(
  items: MenuItem[],
  categoryMap: Record<string, string>,
  lang: Lang,
): string {
  const veg = lang === "en" ? "vegetarian" : "vegetariano";
  const gf = lang === "en" ? "gluten free" : "senza glutine";
  return groupInOrder(items, (i) => i.category)
    .map(([category, list]) => {
      const name = lang === "en" ? categoryMap[category] || category : category;
      const rows = list.map((i) =>
        line(
          pick(lang, i.nameIt, i.nameEn),
          [
            pick(lang, i.descriptionIt, i.descriptionEn),
            i.vegetarian ? veg : "",
            i.glutenFree ? gf : "",
          ],
          euro(i.price),
        ),
      );
      return `<section><h2>${escapeHtml(name)}</h2><ul>${rows.join("")}</ul></section>`;
    })
    .join("");
}

export function winesList(wines: Wine[], lang: Lang): string {
  const glass = lang === "en" ? "glass" : "calice";
  const bottle = lang === "en" ? "bottle" : "bottiglia";
  return WINE_CATEGORY_ORDER.map((category) => {
    const list = wines.filter((w) => w.category === category);
    if (!list.length) return "";
    const rows = list.map((w) => {
      const name = [pick(lang, w.nameIt, w.nameEn), w.year].filter(Boolean).join(" ");
      const prices = [
        w.priceGlass && `${glass} ${euro(w.priceGlass)}`,
        w.price && `${bottle} ${euro(w.price)}`,
      ].filter(Boolean);
      return line(name, [pick(lang, w.descriptionIt, w.descriptionEn)], prices.join(", "));
    });
    return `<section><h2>${escapeHtml(category)}</h2><ul>${rows.join("")}</ul></section>`;
  }).join("");
}

export function cocktailsList(cocktails: Cocktail[], lang: Lang): string {
  return groupInOrder(cocktails, (c) => c.category)
    .map(([category, list]) => {
      const rows = list.map((c) =>
        line(
          pick(lang, c.nameIt, c.nameEn),
          [pick(lang, c.descriptionIt, c.descriptionEn)],
          euro(c.price),
        ),
      );
      return `<section><h2>${escapeHtml(category)}</h2><ul>${rows.join("")}</ul></section>`;
    })
    .join("");
}

export function colliMenuList(menu: ColliMenuPayload, lang: Lang): string {
  return sortColliByOrder(menu.sections)
    .map((section) => {
      const isWine = section.type === "wine";
      const groups = isWine
        ? sortColliByOrder(menu.wineCategories).map((cat) => ({
            name: pick(lang, cat.name_it, cat.name_en),
            rows: sortColliByOrder(menu.wines.filter((w) => w.wine_category_id === cat.id)).map(
              (w) =>
                line(
                  pick(lang, w.name_it, w.name_en),
                  [w.producer ?? "", w.origin ?? ""],
                  [w.price_glass && euro(w.price_glass), w.price_bottle && euro(w.price_bottle)]
                    .filter(Boolean)
                    .join(" / "),
                ),
            ),
          }))
        : sortColliByOrder(menu.categories.filter((c) => c.section_id === section.id)).map(
            (cat) => ({
              name: pick(lang, cat.name_it, cat.name_en),
              rows: sortColliByOrder(menu.dishes.filter((d) => d.category_id === cat.id)).map((d) =>
                line(
                  pick(lang, d.name_it, d.name_en),
                  [
                    pick(lang, d.subtitle_it, d.subtitle_en),
                    pick(lang, d.description_it, d.description_en),
                  ],
                  euro(d.price),
                ),
              ),
            }),
          );
      const body = groups
        .filter((g) => g.rows.length)
        .map((g) => `<h3>${escapeHtml(g.name)}</h3><ul>${g.rows.join("")}</ul>`)
        .join("");
      return body
        ? `<section><h2>${escapeHtml(pick(lang, section.name_it, section.name_en))}</h2>${body}</section>`
        : "";
    })
    .join("");
}

export function galleriesList(galleries: Gallery[], lang: Lang): string {
  const names = [...galleries]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => (lang === "it" ? g.titleIt : g.titleEn))
    .filter(Boolean);
  return names.length ? `<ul>${names.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>` : "";
}

export function eventsList(events: Event[], lang: Lang): string {
  const rows = [...events]
    .sort((a, b) => new Date(a.startAt ?? 0).getTime() - new Date(b.startAt ?? 0).getTime())
    .map((e) => {
      const title = lang === "it" ? e.titleIt : e.titleEn;
      const date = e.startAt
        ? new Date(e.startAt).toLocaleDateString(lang === "it" ? "it-IT" : "en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Europe/Rome",
          })
        : "";
      return title
        ? `<li>${date ? `${escapeHtml(date)} — ` : ""}<strong>${escapeHtml(title)}</strong></li>`
        : "";
    })
    .filter(Boolean);
  return rows.length ? `<ul>${rows.join("")}</ul>` : "";
}

const DAY_NAMES = {
  it: ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

/** Giorni 0=lunedi..6=domenica; tre o piu giorni di fila diventano un intervallo. */
export function daysLabel(days: number[], lang: Lang): string {
  const names = DAY_NAMES[lang];
  const sorted = Array.from(new Set(days))
    .filter((d) => d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  const runs: number[][] = [];
  for (const d of sorted) {
    const last = runs[runs.length - 1];
    if (last && d === last[last.length - 1] + 1) last.push(d);
    else runs.push([d]);
  }
  return runs
    .map((r) =>
      r.length >= 3
        ? `${names[r[0]]}–${names[r[r.length - 1]]}`
        : r.map((d) => names[d]).join(", "),
    )
    .join(", ");
}

export function contactsSection(footer: FooterSettings, lang: Lang): string {
  const { address, phone, email } = footer.contacts;
  const closed = lang === "en" ? "closed" : "chiuso";
  const hours = footer.hours
    .filter((h) => h.selectedDays.length)
    .map(
      (h) =>
        `<li>${escapeHtml(daysLabel(h.selectedDays, lang))}: ${escapeHtml(h.isClosed ? closed : h.hours)}</li>`,
    );
  const parts = [
    address && `<p>${escapeHtml(address).replace(/\n/g, "<br>")}</p>`,
    phone &&
      `<p><a href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}">${escapeHtml(phone)}</a></p>`,
    email && `<p><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`,
    hours.length && `<ul>${hours.join("")}</ul>`,
  ].filter(Boolean);
  const heading = lang === "en" ? "Contacts and opening hours" : "Contatti e orari";
  return parts.length ? `<section><h2>${heading}</h2>${parts.join("")}</section>` : "";
}

export interface NavLink {
  path: string;
  it: string;
  en: string;
}

export function siteNav(links: NavLink[], lang: Lang): string {
  const items = links.map(
    (l) =>
      `<li><a href="${escapeHtml(localHref(l.path, lang))}">${escapeHtml(lang === "en" ? l.en : l.it)}</a></li>`,
  );
  return `<nav><ul>${items.join("")}</ul></nav>`;
}

export function pageMain(h1: string, parts: string[]): string {
  return `<main id="ssr-content"><h1>${escapeHtml(h1)}</h1>${parts.filter(Boolean).join("")}</main>`;
}
