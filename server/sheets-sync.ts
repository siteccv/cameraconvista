import { db } from "./db";
import { menuItems, wines, cocktails, type InsertMenuItem, type InsertWine, type InsertCocktail } from "@shared/schema";

const SHEET_IDS = {
  menu: "1TVHaO3bM4WALAey-TXNWYJh--RiGUheAaoU00gamJpY",
  wines: "1slvYCYuQ78Yf9fsRL1yR5xkW2kshOcQVe8E2HsvGZ8Y",
  cocktails: "1kDXAPQ73vXh1RiEICXLneizZm4I0wdNy1WKng0CQ5SQ",
};

const SHEET_GIDS = {
  menu: "1122482173",
  wines: "294419425",
  cocktails: "1122482173",
};

function getCsvUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
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

async function fetchSheetData(sheetId: string, gid: string): Promise<string[][]> {
  const url = getCsvUrl(sheetId, gid);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.statusText}`);
  }
  const csvText = await response.text();
  return parseCSV(csvText);
}

export async function syncMenuFromSheets(): Promise<{ count: number; error?: string }> {
  try {
    const rows = await fetchSheetData(SHEET_IDS.menu, SHEET_GIDS.menu);
    if (rows.length < 2) {
      return { count: 0, error: "No data rows found" };
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const categoryIdx = headers.findIndex(h => h.includes("categoria") || h.includes("category"));
    const nameItIdx = headers.findIndex(h => h === "nome_it" || h === "nome" || h.includes("name_it"));
    const nameEnIdx = headers.findIndex(h => h === "nome_en" || h.includes("name_en"));
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
        nameIt,
        nameEn,
        descriptionIt: descItIdx >= 0 ? row[descItIdx] : null,
        descriptionEn: descEnIdx >= 0 ? row[descEnIdx] : null,
        price: priceIdx >= 0 ? row[priceIdx] : null,
        sortOrder: i,
        sheetRowIndex: i,
        isAvailable: true,
      });
    }

    await db.delete(menuItems);
    if (items.length > 0) {
      await db.insert(menuItems).values(items);
    }

    return { count: items.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { count: 0, error: message };
  }
}

export async function syncWinesFromSheets(): Promise<{ count: number; error?: string }> {
  try {
    const rows = await fetchSheetData(SHEET_IDS.wines, SHEET_GIDS.wines);
    if (rows.length < 2) {
      return { count: 0, error: "No data rows found" };
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const categoryIdx = headers.findIndex(h => h.includes("categoria") || h.includes("category"));
    const nameItIdx = headers.findIndex(h => h === "nome_it" || h === "nome" || h.includes("name_it"));
    const nameEnIdx = headers.findIndex(h => h === "nome_en" || h.includes("name_en"));
    const regionIdx = headers.findIndex(h => h.includes("regione") || h.includes("region"));
    const yearIdx = headers.findIndex(h => h.includes("anno") || h.includes("year") || h.includes("annata"));
    const priceIdx = headers.findIndex(h => h.includes("prezzo") || h.includes("price"));
    const descItIdx = headers.findIndex(h => h === "descrizione_it" || h === "descrizione" || h.includes("desc_it"));
    const descEnIdx = headers.findIndex(h => h === "descrizione_en" || h.includes("desc_en"));

    const items: InsertWine[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const category = row[categoryIdx] || "";
      const nameIt = row[nameItIdx] || "";
      const nameEn = nameEnIdx >= 0 ? (row[nameEnIdx] || nameIt) : nameIt;
      
      if (!category || !nameIt) continue;

      items.push({
        category,
        nameIt,
        nameEn,
        region: regionIdx >= 0 ? row[regionIdx] : null,
        year: yearIdx >= 0 ? row[yearIdx] : null,
        price: priceIdx >= 0 ? row[priceIdx] : null,
        descriptionIt: descItIdx >= 0 ? row[descItIdx] : null,
        descriptionEn: descEnIdx >= 0 ? row[descEnIdx] : null,
        sortOrder: i,
        sheetRowIndex: i,
        isAvailable: true,
      });
    }

    await db.delete(wines);
    if (items.length > 0) {
      await db.insert(wines).values(items);
    }

    return { count: items.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { count: 0, error: message };
  }
}

export async function syncCocktailsFromSheets(): Promise<{ count: number; error?: string }> {
  try {
    const rows = await fetchSheetData(SHEET_IDS.cocktails, SHEET_GIDS.cocktails);
    if (rows.length < 2) {
      return { count: 0, error: "No data rows found" };
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const categoryIdx = headers.findIndex(h => h.includes("categoria") || h.includes("category"));
    const nameItIdx = headers.findIndex(h => h === "nome_it" || h === "nome" || h.includes("name_it"));
    const nameEnIdx = headers.findIndex(h => h === "nome_en" || h.includes("name_en"));
    const descItIdx = headers.findIndex(h => h === "descrizione_it" || h === "descrizione" || h.includes("desc_it"));
    const descEnIdx = headers.findIndex(h => h === "descrizione_en" || h.includes("desc_en"));
    const priceIdx = headers.findIndex(h => h.includes("prezzo") || h.includes("price"));

    const items: InsertCocktail[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const category = row[categoryIdx] || "";
      const nameIt = row[nameItIdx] || "";
      const nameEn = nameEnIdx >= 0 ? (row[nameEnIdx] || nameIt) : nameIt;
      
      if (!category || !nameIt) continue;

      items.push({
        category,
        nameIt,
        nameEn,
        descriptionIt: descItIdx >= 0 ? row[descItIdx] : null,
        descriptionEn: descEnIdx >= 0 ? row[descEnIdx] : null,
        price: priceIdx >= 0 ? row[priceIdx] : null,
        sortOrder: i,
        sheetRowIndex: i,
        isAvailable: true,
      });
    }

    await db.delete(cocktails);
    if (items.length > 0) {
      await db.insert(cocktails).values(items);
    }

    return { count: items.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
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
