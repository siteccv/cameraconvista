import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  collectColliCountMismatches,
  EXPECTED_COLLI_MENU_COUNTS,
  getColliMenuCounts,
  validateColliMenuPayload,
  type ColliMenuCounts,
  type ColliMenuPayload,
} from "../shared/colli";

const DEFAULT_COLLI_SOURCE_URL = "https://ccvcolli-ghxg.onrender.com/api/menu/draft";

interface DryRunPlan {
  mode: "dry-run";
  writesPerformed: false;
  source: string;
  checksum: string;
  counts: ColliMenuCounts;
  expectedCounts: ColliMenuCounts;
  countWarnings: string[];
  relationIssues: string[];
  duplicateIssues: string[];
  plannedTables: Record<string, number>;
}

async function main() {
  const source = await resolveSource();
  const raw = await readSource(source);
  const payload = JSON.parse(raw);
  const menu = validateColliMenuPayload(extractMenuPayload(payload));
  const plan = buildDryRunPlan(menu, source, raw);

  console.log(JSON.stringify(plan, null, 2));

  if (plan.relationIssues.length > 0 || plan.duplicateIssues.length > 0) {
    process.exitCode = 1;
  }
}

function extractMenuPayload(payload: unknown): unknown {
  if (payload && typeof payload === "object" && "menu" in payload) {
    return (payload as { menu: unknown }).menu;
  }

  return payload;
}

export function buildDryRunPlan(menu: ColliMenuPayload, source: string, raw: string): DryRunPlan {
  const counts = getColliMenuCounts(menu);
  const relationIssues = collectRelationIssues(menu);
  const duplicateIssues = [
    ...collectDuplicateSourceIds("sections", menu.sections),
    ...collectDuplicateSourceIds("categories", menu.categories),
    ...collectDuplicateSourceIds("dishes", menu.dishes),
    ...collectDuplicateSourceIds("wineCategories", menu.wineCategories),
    ...collectDuplicateSourceIds("wines", menu.wines),
    ...collectDuplicateSourceIds("allergens", menu.allergens),
  ];

  return {
    mode: "dry-run",
    writesPerformed: false,
    source,
    checksum: createHash("sha256").update(raw).digest("hex"),
    counts,
    expectedCounts: EXPECTED_COLLI_MENU_COUNTS,
    countWarnings: collectCountWarnings(counts),
    relationIssues,
    duplicateIssues,
    plannedTables: {
      colli_sections: menu.sections.length,
      colli_categories: menu.categories.length,
      colli_items: menu.dishes.length,
      colli_wine_categories: menu.wineCategories.length,
      colli_wines: menu.wines.length,
      colli_allergens: menu.allergens.length,
      colli_item_allergens: menu.dishes.reduce(
        (total, dish) => total + (dish.allergens?.length ?? 0),
        0,
      ),
      colli_menu_snapshots: 1,
    },
  };
}

async function resolveSource(): Promise<string> {
  const cliSource = getCliValue("--source");
  if (cliSource) return cliSource;

  if (process.env.COLLI_IMPORT_SOURCE) {
    return process.env.COLLI_IMPORT_SOURCE;
  }

  const latestBackup = await findLatestFreezeBackup();
  return latestBackup || DEFAULT_COLLI_SOURCE_URL;
}

function getCliValue(name: string): string | undefined {
  const equalsArg = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (equalsArg) return equalsArg.slice(name.length + 1);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];

  return undefined;
}

async function findLatestFreezeBackup(): Promise<string | null> {
  const backupDir = path.join(process.cwd(), "BACKUP");

  try {
    const files = await readdir(backupDir);
    const backups = files
      .filter((file) => /^colli_menu_freeze_.*\.json$/.test(file))
      .sort((a, b) => a.localeCompare(b));

    const latest = backups.at(-1);
    return latest ? path.join(backupDir, latest) : null;
  } catch {
    return null;
  }
}

async function readSource(source: string): Promise<string> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Colli source returned ${response.status}`);
    }
    return response.text();
  }

  return readFile(source, "utf8");
}

function collectCountWarnings(counts: ColliMenuCounts): string[] {
  return collectColliCountMismatches(counts, EXPECTED_COLLI_MENU_COUNTS);
}

function collectRelationIssues(menu: ColliMenuPayload): string[] {
  const sectionIds = new Set(menu.sections.map((section) => section.id));
  const categoryIds = new Set(menu.categories.map((category) => category.id));
  const allergenIds = new Set(menu.allergens.map((allergen) => allergen.id));
  const wineCategoryIds = new Set(menu.wineCategories.map((category) => category.id));
  const issues: string[] = [];

  for (const category of menu.categories) {
    if (!sectionIds.has(category.section_id)) {
      issues.push(`category ${category.id} references missing section ${category.section_id}`);
    }
  }

  for (const dish of menu.dishes) {
    if (!categoryIds.has(dish.category_id)) {
      issues.push(`dish ${dish.id} references missing category ${dish.category_id}`);
    }

    for (const allergenId of dish.allergens ?? []) {
      if (!allergenIds.has(allergenId)) {
        issues.push(`dish ${dish.id} references missing allergen ${allergenId}`);
      }
    }
  }

  for (const wine of menu.wines) {
    if (!wineCategoryIds.has(wine.wine_category_id)) {
      issues.push(`wine ${wine.id} references missing wine category ${wine.wine_category_id}`);
    }
  }

  return issues;
}

function collectDuplicateSourceIds(label: string, items: { id: string }[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates.add(item.id);
    } else {
      seen.add(item.id);
    }
  }

  return [...duplicates].map((id) => `${label}: duplicate source id ${id}`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
