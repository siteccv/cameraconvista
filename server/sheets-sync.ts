import { type InsertMenuItem, type InsertWine, type InsertCocktail } from "@shared/schema";

const HAS_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

async function getDbClient() {
  if (HAS_SUPABASE) {
    const { supabaseAdmin } = await import("./supabase");
    return {
      async deleteAll(table: string) {
        const { error } = await supabaseAdmin.from(table).delete().gte('id', 0);
        if (error) throw new Error(`Delete ${table} failed: ${error.message}`);
      },
      async insertMany(table: string, items: Record<string, any>[]) {
        const snakeItems = items.map(toSnakeCase);
        const batchSize = 100;
        for (let i = 0; i < snakeItems.length; i += batchSize) {
          const batch = snakeItems.slice(i, i + batchSize);
          const { error } = await supabaseAdmin.from(table).insert(batch);
          if (error) throw new Error(`Insert ${table} batch failed: ${error.message}`);
        }
      }
    };
  } else {
    const { db } = await import("./db");
    const { menuItems, wines, cocktails } = await import("@shared/schema");
    const tableMap: Record<string, any> = { menu_items: menuItems, wines, cocktails };
    return {
      async deleteAll(table: string) {
        await db.delete(tableMap[table]);
      },
      async insertMany(table: string, items: Record<string, any>[]) {
        if (items.length > 0) {
          await db.insert(tableMap[table]).values(items);
        }
      }
    };
  }
}

export interface GoogleSheetsConfig {
  menu: {
    syncUrl: string;
  };
  wines: {
    categories: { category: string; syncUrl: string }[];
  };
  cocktails: {
    syncUrl: string;
  };
}

const DEFAULT_CONFIG: GoogleSheetsConfig = {
  menu: {
    syncUrl: "https://docs.google.com/spreadsheets/d/1TVHaO3bM4WALAey-TXNWYJh--RiGUheAaoU00gamJpY/export?format=csv&gid=1122482173",
  },
  wines: {
    categories: [
      { category: "Bollicine Italiane", syncUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv" },
      { category: "Bollicine Francesi", syncUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv" },
      { category: "Bianchi", syncUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv" },
      { category: "Rossi", syncUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv" },
      { category: "Rosati", syncUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv" },
      { category: "Vini Dolci", syncUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv" },
    ],
  },
  cocktails: {
    syncUrl: "https://docs.google.com/spreadsheets/d/1kDXAPQ73vXh1RiEICXLneizZm4I0wdNy1WKng0CQ5SQ/export?format=csv&gid=1122482173",
  },
};

let cachedConfig: GoogleSheetsConfig | null = null;

export async function getGoogleSheetsConfig(): Promise<GoogleSheetsConfig> {
  if (cachedConfig) return cachedConfig;
  try {
    const { storage } = await import("./storage");
    const setting = await storage.getSiteSetting("google_sheets_config");
    if (setting?.valueIt) {
      const parsed = JSON.parse(setting.valueIt);
      if (parsed.menu?.syncUrl && parsed.wines?.categories && parsed.cocktails?.syncUrl) {
        cachedConfig = parsed;
        return cachedConfig!;
      }
    }
  } catch (e) {
    console.error("[sheets-sync] Error loading config from DB, using defaults:", e);
  }
  return DEFAULT_CONFIG;
}

export async function saveGoogleSheetsConfig(config: GoogleSheetsConfig): Promise<void> {
  const { storage } = await import("./storage");
  const json = JSON.stringify(config);
  await storage.upsertSiteSetting({
    key: "google_sheets_config",
    valueIt: json,
    valueEn: json,
  });
  cachedConfig = config;
}

export function invalidateConfigCache(): void {
  cachedConfig = null;
}

function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        if (char === "\r") i++;
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

async function fetchCsvFromUrl(url: string): Promise<string[][]> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.statusText}`);
  }
  const csvText = await response.text();
  return parseCSV(csvText);
}

export async function syncMenuFromSheets(): Promise<{ count: number; error?: string }> {
  try {
    const config = await getGoogleSheetsConfig();
    const client = await getDbClient();
    const rows = await fetchCsvFromUrl(config.menu.syncUrl);
    if (rows.length < 2) {
      return { count: 0, error: "No data rows found" };
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const categoryIdx = headers.findIndex(h => h.includes("categoria") || h.includes("category"));
    const nameItIdx = headers.findIndex(h => h.includes("titolo it") || h === "nome_it" || h === "nome" || h.includes("name_it"));
    const nameEnIdx = headers.findIndex(h => h.includes("titolo en") || h === "nome_en" || h.includes("name_en"));
    const descItIdx = headers.findIndex(h => h === "descrizione_it" || h === "descrizione" || h.includes("desc_it"));
    const descEnIdx = headers.findIndex(h => h === "descrizione_en" || h.includes("desc_en"));
    const priceIdx = headers.findIndex(h => h.includes("prezzo") || h.includes("price"));

    const items: InsertMenuItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const category = row[categoryIdx] || "";
      const nameIt = row[nameItIdx] || "";
      const nameEn = nameEnIdx >= 0 ? (row[nameEnIdx] || nameIt) : nameIt;
      
      if (!category || !nameIt) continue;

      items.push({
        category,
        nameIt: nameIt.trim(),
        nameEn: nameEn.trim(),
        descriptionIt: descItIdx >= 0 ? (row[descItIdx] || null) : null,
        descriptionEn: descEnIdx >= 0 ? (row[descEnIdx] || null) : null,
        price: priceIdx >= 0 ? (row[priceIdx] || null) : null,
        sortOrder: i,
        sheetRowIndex: i,
        isAvailable: true,
      });
    }

    await client.deleteAll('menu_items');
    await client.insertMany('menu_items', items);

    console.log(`[sheets-sync] Menu synced: ${items.length} items`);
    return { count: items.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[sheets-sync] Menu sync error:", message);
    return { count: 0, error: message };
  }
}

export async function syncWinesFromSheets(): Promise<{ count: number; error?: string }> {
  try {
    const config = await getGoogleSheetsConfig();
    const client = await getDbClient();
    const allWines: InsertWine[] = [];
    let globalSortOrder = 0;

    for (const { syncUrl, category } of config.wines.categories) {
      try {
        const rows = await fetchCsvFromUrl(syncUrl);
        if (rows.length < 2) continue;

        const headers = rows[0].map(h => h.toLowerCase().trim());
        const nameIdx = headers.findIndex(h => h.includes("nome vino") || h.includes("nome") || h.includes("name"));
        const yearIdx = headers.findIndex(h => h.includes("anno") || h.includes("year") || h.includes("annata"));
        const producerIdx = headers.findIndex(h => h.includes("produttore") || h.includes("producer"));
        const regionIdx = headers.findIndex(h => h.includes("provenienza") || h.includes("regione") || h.includes("region"));
        const glassIdx = headers.findIndex(h => h.includes("calice") || h.includes("glass"));
        const bottleIdx = headers.findIndex(h => h.includes("bottiglia") || h.includes("bottle"));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const wineName = nameIdx >= 0 ? (row[nameIdx] || "").trim() : "";
          
          if (!wineName) continue;

          const glassPrice = glassIdx >= 0 ? (row[glassIdx] || "").replace(/[€\s]/g, "").trim() : "";
          const bottlePrice = bottleIdx >= 0 ? (row[bottleIdx] || "").replace(/[€\s]/g, "").trim() : "";
          
          const producer = producerIdx >= 0 ? (row[producerIdx] || "").trim() : "";
          const region = regionIdx >= 0 ? (row[regionIdx] || "").trim() : "";
          const descLine = [producer, region].filter(Boolean).join(" · ");

          globalSortOrder++;
          allWines.push({
            category,
            nameIt: wineName,
            nameEn: wineName,
            region: region || null,
            year: yearIdx >= 0 ? (row[yearIdx] || null) : null,
            price: bottlePrice || null,
            priceGlass: glassPrice || null,
            descriptionIt: descLine || null,
            descriptionEn: descLine || null,
            sortOrder: globalSortOrder,
            sheetRowIndex: i,
            isAvailable: true,
          });
        }
      } catch (err) {
        console.error(`[sheets-sync] Error fetching wine category ${category}:`, err);
      }
    }

    await client.deleteAll('wines');
    await client.insertMany('wines', allWines);

    console.log(`[sheets-sync] Wines synced: ${allWines.length} items`);
    return { count: allWines.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[sheets-sync] Wines sync error:", message);
    return { count: 0, error: message };
  }
}

export async function syncCocktailsFromSheets(): Promise<{ count: number; error?: string }> {
  try {
    const config = await getGoogleSheetsConfig();
    const client = await getDbClient();
    const rows = await fetchCsvFromUrl(config.cocktails.syncUrl);
    if (rows.length < 2) {
      return { count: 0, error: "No data rows found" };
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const categoryIdx = headers.findIndex(h => h.includes("categoria") || h.includes("category"));
    const nameIdx = headers.findIndex(h => h.includes("titolo") || h === "nome" || h.includes("name"));
    const descItIdx = headers.findIndex(h => h.includes("ingredienti it") || h.includes("descrizione_it") || h.includes("desc_it"));
    const descEnIdx = headers.findIndex(h => h.includes("ingredienti en") || h.includes("ingredienti eng") || h.includes("descrizione_en") || h.includes("desc_en"));
    const priceIdx = headers.findIndex(h => h.includes("prezzo") || h.includes("price"));

    const items: InsertCocktail[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const category = categoryIdx >= 0 ? (row[categoryIdx] || "").trim() : "";
      const name = nameIdx >= 0 ? (row[nameIdx] || "").trim() : "";
      
      if (!category || !name) continue;

      items.push({
        category,
        nameIt: name,
        nameEn: name,
        descriptionIt: descItIdx >= 0 ? (row[descItIdx] || null) : null,
        descriptionEn: descEnIdx >= 0 ? (row[descEnIdx] || null) : null,
        price: priceIdx >= 0 ? (row[priceIdx] || null) : null,
        sortOrder: i,
        sheetRowIndex: i,
        isAvailable: true,
      });
    }

    await client.deleteAll('cocktails');
    await client.insertMany('cocktails', items);

    console.log(`[sheets-sync] Cocktails synced: ${items.length} items`);
    return { count: items.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[sheets-sync] Cocktails sync error:", message);
    return { count: 0, error: message };
  }
}

export async function syncAllFromSheets(): Promise<{
  menu: { count: number; error?: string };
  wines: { count: number; error?: string };
  cocktails: { count: number; error?: string };
}> {
  const [menu, winesResult, cocktailsResult] = await Promise.all([
    syncMenuFromSheets(),
    syncWinesFromSheets(),
    syncCocktailsFromSheets(),
  ]);
  return { menu, wines: winesResult, cocktails: cocktailsResult };
}
