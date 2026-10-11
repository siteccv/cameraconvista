import { describe, expect, it } from "vitest";
import type { MenuItem, PageBlock, Wine } from "@shared/schema";
import { defaultFooterSettings } from "@shared/schema";
import {
  blockSection,
  contactsSection,
  daysLabel,
  escapeHtml,
  euro,
  menuList,
  pageMain,
  paragraphs,
  winesList,
} from "../../server/ssr/render";
import { injectPageContent } from "../../server/ssr/inject";

const block = (fields: Partial<PageBlock>) => ({ blockType: "intro", ...fields }) as PageBlock;

describe("server-side page text", () => {
  it("escapes HTML coming from the database", () => {
    expect(escapeHtml(`<script>"x" & 'y'</script>`)).toBe(
      "&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;",
    );
    expect(paragraphs("Uno\nriga due\n\nDue <b>")).toBe(
      "<p>Uno<br>riga due</p><p>Due &lt;b&gt;</p>",
    );
  });

  it("uses the requested language and falls back to the other one", () => {
    const b = block({ titleIt: "Titolo", titleEn: "", bodyIt: "Testo", bodyEn: "Text" });
    expect(blockSection(b, "en")).toBe("<section><h2>Titolo</h2><p>Text</p></section>");
    expect(blockSection(block({}), "it")).toBe("");
  });

  it("keeps English links on the English version", () => {
    const b = block({ titleIt: "Menu", ctaTextIt: "Vai", ctaTextEn: "Go", ctaUrl: "/menu" });
    expect(blockSection(b, "en")).toContain('<a href="/menu?lang=en">Go</a>');
  });

  it("groups the menu by category in published order with prices", () => {
    const items = [
      { category: "Tapas", nameIt: "Pane", price: "€ 4", vegetarian: true },
      { category: "Dolci", nameIt: "Torta", price: "6" },
      { category: "Tapas", nameIt: "Olive", price: "3,5" },
    ] as MenuItem[];
    const html = menuList(items, { Tapas: "Small plates" }, "en");
    expect(html.indexOf("Small plates")).toBeLessThan(html.indexOf("Dolci"));
    expect(html).toContain("<strong>Pane</strong> — vegetarian <span>€ 4</span>");
    expect(html).toContain("<span>€ 3,5</span>");
  });

  it("shows only the wine categories the site shows, in its order", () => {
    const wines = [
      { category: "Rossi", nameIt: "Sangiovese", year: "2020", price: "30" },
      { category: "Segreti", nameIt: "Nascosto", price: "10" },
      { category: "Bianchi", nameIt: "Albana", priceGlass: "6", price: "28" },
    ] as Wine[];
    const html = winesList(wines, "it");
    expect(html).not.toContain("Nascosto");
    expect(html.indexOf("Bianchi")).toBeLessThan(html.indexOf("Rossi"));
    expect(html).toContain("calice € 6, bottiglia € 28");
  });

  it("formats opening days as ranges", () => {
    expect(daysLabel([0, 1, 2, 3, 4, 5, 6], "it")).toBe("Lunedì–Domenica");
    expect(daysLabel([5, 6], "en")).toBe("Saturday, Sunday");
    expect(euro(5.5)).toBe("€ 5,5");
  });

  it("renders contacts from the footer settings", () => {
    const html = contactsSection(defaultFooterSettings, "it");
    expect(html).toContain("<h2>Contatti e orari</h2>");
  });

  it("puts the text inside #root and preloads the hero image", () => {
    const shell = '<html><head><title>x</title></head><body><div id="root"></div></body></html>';
    const out = injectPageContent(shell, {
      html: pageMain("Camera con Vista", ["<p>Ciao</p>"]),
      heroImage: "https://example.com/hero.webp",
    });
    expect(out).toContain(
      '<div id="root"><main id="ssr-content"><h1>Camera con Vista</h1><p>Ciao</p></main></div>',
    );
    expect(out).toContain(
      '<link rel="preload" as="image" href="https://example.com/hero.webp" fetchpriority="high">',
    );
    expect(injectPageContent(shell, null)).toBe(shell);
  });
});
