# 09 - Convenzioni del Codice

## TypeScript

### Regole Generali
- **ESM modules** (`"type": "module"` in package.json)
- **Strict mode** via tsconfig.json
- Import senza estensione file: `import { storage } from "./storage"`
- Path aliases: `@/*`, `@shared/*`, `@assets/*`

### Naming
- **Variabili e funzioni**: camelCase (`isAuthenticated`, `getPageBlocks`)
- **Componenti React**: PascalCase (`EditableText`, `MediaPickerModal`)
- **Tipi e interfacce**: PascalCase (`InsertPage`, `PageBlock`)
- **Costanti**: UPPER_SNAKE_CASE (`SESSION_COOKIE_NAME`, `DEFAULT_PASSWORD`)
- **File componenti**: PascalCase (`EditableText.tsx`, `AdminLayout.tsx`)
- **File utility/hook**: kebab-case (`use-page-blocks.ts`, `queryClient.ts`)
- **Colonne DB nel codice**: camelCase (`titleIt`, `sortOrder`)
- **Colonne DB nel PostgreSQL**: snake_case (`title_it`, `sort_order`)

### Pattern Import
```typescript
// React/librerie
import { useState, useCallback, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

// Componenti UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Icone
import { FileText, Calendar, Image } from "lucide-react";

// Contexts e hooks
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";

// Tipi condivisi
import type { Page, PageBlock } from "@shared/schema";

// Utility
import { apiRequest, queryClient } from "@/lib/queryClient";
```

## React

### Componenti
- Funzionali con hooks (no class components)
- Export named (no default export tranne pages)
- Props interface definita inline o nel file
- `data-testid` su tutti gli elementi interattivi

### Pattern TanStack Query
```typescript
// Query
const { data: items = [], isLoading } = useQuery<Item[]>({
  queryKey: ["/api/items"],
});

// Query con parametro
const { data: item } = useQuery<Item>({
  queryKey: ["/api/items", id],
});

// Mutation
const mutation = useMutation({
  mutationFn: async (data: InsertItem) => {
    return apiRequest("POST", "/api/admin/items", data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    toast({ title: t("Salvato", "Saved") });
  },
});
```

**Regole Query**:
- Non definire `queryFn` per GET (usa il default fetcher)
- Query key come array per invalidazione gerarchica: `["/api/items", id]`
- Definire `queryFn` custom solo per endpoint admin (autenticati)
- Usare `apiRequest()` per POST/PATCH/DELETE nelle mutations
- Invalidare sempre il cache dopo mutation

### Pattern Bilingue
```typescript
const { t } = useLanguage();

// Testo semplice
<h1>{t("Benvenuto", "Welcome")}</h1>

// Dati dal database
<p>{t(item.descriptionIt, item.descriptionEn)}</p>

// Condizionale
{language === "it" ? "Italiano" : "English"}
```

### Pattern Admin Preview
```typescript
const { adminPreview } = useAdmin();

// Rendering condizionale
{adminPreview ? (
  <EditableText
    value={t(block?.titleIt, block?.titleEn) || ""}
    onSave={(value) => updateBlock(block.id, { 
      [language === "it" ? "titleIt" : "titleEn"]: value 
    })}
  />
) : (
  <h1>{t(block?.titleIt, block?.titleEn)}</h1>
)}
```

## Express Routes

### Pattern Route
```typescript
const router = Router();

// GET con error handling
router.get("/", async (req, res) => {
  try {
    const items = await storage.getItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// POST con validazione Zod
router.post("/", requireAuth, async (req, res) => {
  try {
    const parsed = insertItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const item = await storage.createItem(parsed.data);
    res.status(201).json(item);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
});
```

### Separazione Public/Admin
- Route pubbliche: nessun middleware auth
- Route admin: `requireAuth` middleware
- Router separati esportati (es. `publicEventsRouter`, `adminEventsRouter`)
- Montati su path diversi in `routes/index.ts`

## Tailwind CSS

### Design Tokens
- `--radius-placeholder`: 0.75rem (12px) → classe `rounded-placeholder`
- Colore oro/ocra: `#c7902f` (prezzi, icone vino)
- Colore divider: `#e5d6b6` (beige caldo)
- Background: `#2f2b2a` (marrone scuro per titoli)

### Classi Custom
- `.price-text` — Typography per prezzi
- `.animate-subtle-pulse` — Animazione pulsante per publish button
- `.publish-done` — Stato "tutto aggiornato"
- `font-display` — Playfair Display per titoli

### Responsive
```css
/* Mobile first */
py-10                /* Mobile */
md:py-20             /* Tablet+ */
text-xl              /* Mobile */
md:text-2xl          /* Desktop */
```

## Drizzle Schema

### Pattern Tabella
```typescript
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  nameIt: text("name_it").notNull(),
  nameEn: text("name_en").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
```

### Regole
- `id` sempre `serial("id").primaryKey()`
- Campi auto-generati (id, createdAt, updatedAt) sempre omessi da insertSchema
- Relazioni definite con `relations()` separatamente
- Array: usare `text().array()` non `array(text())`
- JSONB per dati flessibili: `jsonb("column_name")`

## Storage Interface

### Pattern CRUD
```typescript
export interface IStorage {
  getItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
}
```

Ogni implementazione (DatabaseStorage, SupabaseStorage) deve rispettare questa interfaccia.

## Git & Backup

### Commit
- I commit vengono creati automaticamente da Replit Agent
- Non modificare la storia git manualmente

### Backup
- Comando: "esegui nuovo backup"
- Formato: `BACKUP/backup_replit_DD_Mon_HH-MM.tar.gz`
- Esclude: node_modules, .git, BACKUP

### GitHub Sync
- Repo: https://github.com/siteccv/cameraconvista.git
- Comando: "esegui commit in github"
- Branch: main
