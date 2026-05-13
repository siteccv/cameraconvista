import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronDown, ChevronUp, Home, Info, Leaf, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  ColliAdminSettings,
  ColliAllergen,
  ColliCategory,
  ColliDish,
  ColliMenuPayload,
  ColliSection,
  ColliWine,
  ColliWineCategory,
} from "@shared/colli";

const COLORS = {
  cream: "#EFE8D8",
  card: "#FAF8F5",
  beige: "#E8DDD0",
  border: "#E2D9CF",
  maroon: "#722F37",
  warmBrown: "#2C1F14",
  secondary: "#7A6A5A",
  green: "#5B7A4E",
  darkCard: "#6B4423",
  darkCardBorder: "#5C3A1E",
  danger: "#C0392B",
};

const ADMIN_MENU_QUERY = ["/api/colli/admin/menu"] as const;
const ADMIN_SETTINGS_QUERY = ["/api/colli/admin/settings"] as const;

interface ColliAdminSession {
  authenticated: boolean;
}

type EditTarget =
  | { type: "section"; item?: ColliSection }
  | { type: "category"; sectionId: string; item?: ColliCategory }
  | {
      type: "item";
      categoryId: string;
      item?: ColliDish;
      sectionType?: string | null;
      sectionNameEn?: string | null;
    }
  | { type: "wine_category"; item?: ColliWineCategory }
  | { type: "wine"; wineCategoryId: string; item?: ColliWine }
  | { type: "allergen"; item?: ColliAllergen };

export default function ColliAdminPanel() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [sectionManagerOpen, setSectionManagerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    label: string;
    endpoint: string;
    afterDelete?: () => void;
  } | null>(null);
  const [englishEnabled, setEnglishEnabled] = useState(true);

  const { data: session, isLoading: sessionLoading } = useQuery<ColliAdminSession>({
    queryKey: ["/api/colli/admin/check-session"],
    retry: false,
  });
  const { data, isLoading: menuLoading } = useQuery<ColliMenuPayload>({
    queryKey: ADMIN_MENU_QUERY,
    enabled: !!session?.authenticated,
    retry: false,
  });
  const { data: adminSettings } = useQuery<ColliAdminSettings>({
    queryKey: ADMIN_SETTINGS_QUERY,
    enabled: !!session?.authenticated,
    retry: false,
  });

  const sections = useMemo(() => sortByOrder(data?.sections ?? []), [data?.sections]);
  const activeSection = sections.find((section) => section.id === activeTab) ?? null;
  const isWineTab = activeSection?.type === "wine";
  const isAllergenTab = activeTab === "allergeni";

  useEffect(() => {
    if (!sessionLoading && session && !session.authenticated) {
      setLocation("/colli/admina");
    }
  }, [session, sessionLoading, setLocation]);

  useEffect(() => {
    if (!data || activeTab !== null) return;
    setActiveTab(sections[0]?.id ?? "allergeni");
  }, [activeTab, data, sections]);

  useEffect(() => {
    if (adminSettings) setEnglishEnabled(adminSettings.englishEnabled);
  }, [adminSettings]);

  async function updateMenuFromResponse(response: Response) {
    const nextMenu = (await response.json()) as ColliMenuPayload;
    queryClient.setQueryData(ADMIN_MENU_QUERY, nextMenu);
    queryClient.invalidateQueries({ queryKey: ["/api/colli/menu"] });
    return nextMenu;
  }

  async function reorder(endpoint: string, ids: string[]) {
    const response = await apiRequest("PUT", endpoint, { ids });
    await updateMenuFromResponse(response);
  }

  async function updateEnglishEnabled(nextValue: boolean) {
    const previousValue = englishEnabled;
    setEnglishEnabled(nextValue);

    try {
      const response = await apiRequest("PUT", "/api/colli/admin/settings", {
        englishEnabled: nextValue,
      });
      const settings = (await response.json()) as ColliAdminSettings;
      setEnglishEnabled(settings.englishEnabled);
      queryClient.setQueryData(ADMIN_SETTINGS_QUERY, settings);
      queryClient.invalidateQueries({ queryKey: ["/api/colli/menu"] });
    } catch (error) {
      setEnglishEnabled(previousValue);
      console.error("Failed to update Colli English setting:", error);
    }
  }

  async function saveEdit(target: EditTarget, body: Record<string, unknown>) {
    const { endpoint, method } = getSaveRequest(target);
    const response = await apiRequest(method, endpoint, body);
    const nextMenu = await updateMenuFromResponse(response);

    if (target.type === "section" && !target.item) {
      const previousIds = new Set(data?.sections.map((section) => section.id) ?? []);
      const newSection = nextMenu.sections.find((section) => !previousIds.has(section.id));
      if (newSection) setActiveTab(newSection.id);
    }

    setEditTarget(null);
  }

  async function deleteItem(pin: string) {
    if (!deleteConfirm) return;
    const response = await apiRequest("DELETE", deleteConfirm.endpoint, { pin });
    await updateMenuFromResponse(response);
    deleteConfirm.afterDelete?.();
    setDeleteConfirm(null);
  }

  if (sessionLoading || !session?.authenticated || menuLoading || !data) {
    return (
      <main
        className="flex min-h-[100svh] items-center justify-center"
        style={{ backgroundColor: COLORS.cream, color: COLORS.secondary }}
      >
        Caricamento...
      </main>
    );
  }

  return (
    <main
      className="min-h-[100svh]"
      style={{
        backgroundColor: COLORS.cream,
        color: COLORS.warmBrown,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <header
        className="sticky top-0 z-30 border-b px-4"
        style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
      >
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-3">
          <IconButton label="Torna al menu Colli" onClick={() => setLocation("/colli/menu")}>
            <Home className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          <div className="flex-1" />
          <label
            className="flex items-center gap-3 text-xs font-semibold"
            style={{ color: "#BDB2A7" }}
          >
            EN
            <button
              type="button"
              role="switch"
              aria-checked={englishEnabled}
              onClick={() => void updateEnglishEnabled(!englishEnabled)}
              className="relative h-5 w-10 rounded-full transition-colors"
              style={{ backgroundColor: englishEnabled ? COLORS.green : COLORS.border }}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                style={{
                  left: "2px",
                  transform: englishEnabled ? "translateX(20px)" : "translateX(0)",
                }}
              />
            </button>
          </label>
          <IconButton
            label={isAllergenTab ? "Torna alle sezioni" : "Gestisci allergeni"}
            onClick={() => setActiveTab(isAllergenTab ? (sections[0]?.id ?? null) : "allergeni")}
          >
            <span className="font-display text-xl" style={{ color: "#BDB2A7" }}>
              A
            </span>
          </IconButton>
        </div>

        <div className="-mx-4 h-px" style={{ backgroundColor: COLORS.border }} />

        <div className="mx-auto flex max-w-5xl items-center py-1">
          <IconButton label="Gestisci sezioni" onClick={() => setSectionManagerOpen(true)}>
            <Plus className="h-5 w-5" style={{ color: COLORS.maroon }} aria-hidden="true" />
          </IconButton>
          <div className="flex flex-1 overflow-x-auto">
            {sections.map((section) => {
              const active = section.id === activeTab;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveTab(section.id)}
                  className="shrink-0 border-b-2 px-4 py-3 text-sm"
                  style={{
                    borderColor: active ? COLORS.maroon : "transparent",
                    color: active ? COLORS.maroon : COLORS.secondary,
                  }}
                >
                  {section.name_it}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-5">
        {activeSection && !isWineTab && (
          <>
            <MainSectionCard
              section={activeSection}
              onEdit={() => setEditTarget({ type: "section", item: activeSection })}
              onDelete={() =>
                setDeleteConfirm({
                  label: activeSection.name_it,
                  endpoint: `/api/colli/admin/sections/${activeSection.id}`,
                  afterDelete: () => {
                    const nextSection = sections.find((section) => section.id !== activeSection.id);
                    setActiveTab(nextSection?.id ?? null);
                  },
                })
              }
            />
            <SectionBlock
              section={activeSection}
              data={data}
              onReorder={reorder}
              onEdit={setEditTarget}
              onDelete={(label, endpoint) => setDeleteConfirm({ label, endpoint })}
            />
          </>
        )}

        {activeSection && isWineTab && (
          <WineBlock
            section={activeSection}
            data={data}
            onReorder={reorder}
            onEdit={setEditTarget}
            onDelete={(label, endpoint) => setDeleteConfirm({ label, endpoint })}
          />
        )}

        {isAllergenTab && (
          <AllergenBlock
            data={data}
            onEdit={setEditTarget}
            onDelete={(label, endpoint) => setDeleteConfirm({ label, endpoint })}
          />
        )}
      </section>

      {editTarget && (
        <EditDialog
          target={editTarget}
          data={data}
          englishEnabled={englishEnabled}
          onClose={() => setEditTarget(null)}
          onSave={saveEdit}
        />
      )}

      {sectionManagerOpen && (
        <SectionManagerDialog
          sections={sections}
          onClose={() => setSectionManagerOpen(false)}
          onReorder={(ids) => reorder("/api/colli/admin/sections/reorder", ids)}
          onAdd={async (body) => {
            const response = await apiRequest("POST", "/api/colli/admin/sections", body);
            const nextMenu = await updateMenuFromResponse(response);
            const previousIds = new Set(data.sections.map((section) => section.id));
            const newSection = nextMenu.sections.find((section) => !previousIds.has(section.id));
            if (newSection) setActiveTab(newSection.id);
          }}
        />
      )}

      {deleteConfirm && (
        <PinConfirmDialog
          label={deleteConfirm.label}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={deleteItem}
        />
      )}
    </main>
  );
}

function SectionBlock({
  section,
  data,
  onReorder,
  onEdit,
  onDelete,
}: {
  section: ColliSection;
  data: ColliMenuPayload;
  onReorder: (endpoint: string, ids: string[]) => Promise<void>;
  onEdit: (target: EditTarget) => void;
  onDelete: (label: string, endpoint: string) => void;
}) {
  const categories = sortByOrder(
    data.categories.filter((category) => category.section_id === section.id),
  );

  return (
    <>
      <MoveList
        items={categories}
        onReorder={(ids) => onReorder("/api/colli/admin/categories/reorder", ids)}
        renderItem={(category, move) => {
          const items = sortByOrder(data.dishes.filter((dish) => dish.category_id === category.id));
          return (
            <div
              className="mb-3 overflow-hidden rounded-xl border"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <div
                className="flex items-center gap-2 border-b px-3 py-3"
                style={{ backgroundColor: `${COLORS.beige}80`, borderColor: COLORS.border }}
              >
                <MoveButtons {...move} />
                <p className="flex-1 font-display text-lg tracking-[0.02em]">{category.name_it}</p>
                <RowButton
                  label="Modifica categoria"
                  onClick={() =>
                    onEdit({ type: "category", sectionId: section.id, item: category })
                  }
                >
                  <Pencil className="h-4 w-4" style={{ color: COLORS.green }} aria-hidden="true" />
                </RowButton>
                <RowButton
                  label="Elimina categoria"
                  onClick={() =>
                    onDelete(category.name_it, `/api/colli/admin/categories/${category.id}`)
                  }
                >
                  <Trash2 className="h-4 w-4" style={{ color: COLORS.danger }} aria-hidden="true" />
                </RowButton>
              </div>

              <MoveList
                items={items}
                onReorder={(ids) => onReorder("/api/colli/admin/items/reorder", ids)}
                renderItem={(dish, dishMove) => (
                  <div
                    className="flex items-center gap-2 border-t px-3 py-2.5"
                    style={{ borderColor: "rgba(226,217,207,0.45)" }}
                  >
                    <MoveButtons {...dishMove} />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1">
                        {dish.vegetarian && (
                          <Leaf
                            className="h-3 w-3 shrink-0"
                            style={{ color: COLORS.green }}
                            aria-hidden="true"
                          />
                        )}
                        <p className="truncate text-sm">{dish.name_it}</p>
                      </div>
                      {dish.subtitle_it && (
                        <p className="truncate text-xs" style={{ color: COLORS.secondary }}>
                          {dish.subtitle_it}
                        </p>
                      )}
                      {dish.price != null && (
                        <p className="text-xs" style={{ color: COLORS.secondary }}>
                          EUR {formatPrice(dish.price)}
                        </p>
                      )}
                    </div>
                    <RowButton
                      label="Modifica voce"
                      onClick={() =>
                        onEdit({
                          type: "item",
                          categoryId: category.id,
                          item: dish,
                          sectionType: section.type,
                          sectionNameEn: section.name_en,
                        })
                      }
                    >
                      <Pencil
                        className="h-4 w-4"
                        style={{ color: COLORS.green }}
                        aria-hidden="true"
                      />
                    </RowButton>
                    <RowButton
                      label="Elimina voce"
                      onClick={() => onDelete(dish.name_it, `/api/colli/admin/items/${dish.id}`)}
                    >
                      <Trash2
                        className="h-4 w-4"
                        style={{ color: COLORS.danger }}
                        aria-hidden="true"
                      />
                    </RowButton>
                  </div>
                )}
              />

              <button
                type="button"
                onClick={() =>
                  onEdit({
                    type: "item",
                    categoryId: category.id,
                    sectionType: section.type,
                    sectionNameEn: section.name_en,
                  })
                }
                className="flex w-full items-center gap-2 border-t px-4 py-3 text-sm"
                style={{ borderColor: "rgba(226,217,207,0.45)", color: COLORS.green }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Aggiungi voce
              </button>
            </div>
          );
        }}
      />

      <button
        type="button"
        onClick={() => onEdit({ type: "category", sectionId: section.id })}
        className="flex items-center gap-2 px-4 py-3 text-sm"
        style={{ color: COLORS.secondary }}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Aggiungi categoria
      </button>
    </>
  );
}

function WineBlock({
  section,
  data,
  onReorder,
  onEdit,
  onDelete,
}: {
  section: ColliSection;
  data: ColliMenuPayload;
  onReorder: (endpoint: string, ids: string[]) => Promise<void>;
  onEdit: (target: EditTarget) => void;
  onDelete: (label: string, endpoint: string) => void;
}) {
  const wineCategories = sortByOrder(data.wineCategories).filter(
    (category) => category.name_it.toUpperCase() !== "VINI",
  );

  return (
    <>
      <MainSectionCard
        section={section}
        onEdit={() => onEdit({ type: "section", item: section })}
      />

      <MoveList
        items={wineCategories}
        onReorder={(ids) => onReorder("/api/colli/admin/wine-categories/reorder", ids)}
        renderItem={(category, move) => {
          const wines = sortByOrder(
            data.wines.filter((wine) => wine.wine_category_id === category.id),
          );
          return (
            <div
              className="mb-3 overflow-hidden rounded-xl border"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <div
                className="flex items-center gap-2 border-b px-3 py-3"
                style={{ backgroundColor: `${COLORS.beige}80`, borderColor: COLORS.border }}
              >
                <MoveButtons {...move} />
                <p className="flex-1 font-display text-lg tracking-[0.02em]">{category.name_it}</p>
                <RowButton
                  label="Modifica categoria vino"
                  onClick={() => onEdit({ type: "wine_category", item: category })}
                >
                  <Pencil className="h-4 w-4" style={{ color: COLORS.green }} aria-hidden="true" />
                </RowButton>
                <RowButton
                  label="Elimina categoria vino"
                  onClick={() =>
                    onDelete(category.name_it, `/api/colli/admin/wine-categories/${category.id}`)
                  }
                >
                  <Trash2 className="h-4 w-4" style={{ color: COLORS.danger }} aria-hidden="true" />
                </RowButton>
              </div>

              <MoveList
                items={wines}
                onReorder={(ids) => onReorder("/api/colli/admin/wines/reorder", ids)}
                renderItem={(wine, wineMove) => (
                  <div
                    className="flex items-center gap-2 border-t px-3 py-2.5"
                    style={{ borderColor: "rgba(226,217,207,0.45)" }}
                  >
                    <MoveButtons {...wineMove} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{wine.name_it}</p>
                      <p className="text-xs" style={{ color: COLORS.secondary }}>
                        {[
                          wine.price_glass != null
                            ? `Calice EUR ${formatPrice(wine.price_glass)}`
                            : null,
                          wine.price_bottle != null
                            ? `Bottiglia EUR ${formatPrice(wine.price_bottle)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <RowButton
                      label="Modifica vino"
                      onClick={() =>
                        onEdit({ type: "wine", wineCategoryId: category.id, item: wine })
                      }
                    >
                      <Pencil
                        className="h-4 w-4"
                        style={{ color: COLORS.green }}
                        aria-hidden="true"
                      />
                    </RowButton>
                    <RowButton
                      label="Elimina vino"
                      onClick={() => onDelete(wine.name_it, `/api/colli/admin/wines/${wine.id}`)}
                    >
                      <Trash2
                        className="h-4 w-4"
                        style={{ color: COLORS.danger }}
                        aria-hidden="true"
                      />
                    </RowButton>
                  </div>
                )}
              />

              <button
                type="button"
                onClick={() => onEdit({ type: "wine", wineCategoryId: category.id })}
                className="flex w-full items-center gap-2 border-t px-4 py-3 text-sm"
                style={{ borderColor: "rgba(226,217,207,0.45)", color: COLORS.green }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Aggiungi vino
              </button>
            </div>
          );
        }}
      />

      <button
        type="button"
        onClick={() => onEdit({ type: "wine_category" })}
        className="flex items-center gap-2 px-4 py-3 text-sm"
        style={{ color: COLORS.secondary }}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Aggiungi categoria vino
      </button>
    </>
  );
}

function AllergenBlock({
  data,
  onEdit,
  onDelete,
}: {
  data: ColliMenuPayload;
  onEdit: (target: EditTarget) => void;
  onDelete: (label: string, endpoint: string) => void;
}) {
  return (
    <>
      <div
        className="mb-3 flex items-start gap-2 rounded-lg p-3 text-sm"
        style={{ backgroundColor: `${COLORS.beige}80`, color: COLORS.secondary }}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          14 allergeni EU precaricati. Puoi aggiungere, modificare o eliminare allergeni dalla
          lista.
        </p>
      </div>

      {data.allergens.map((allergen) => (
        <div
          key={allergen.id}
          className="mb-2 flex items-center gap-2 rounded-lg border px-4 py-3"
          style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
        >
          <p className="flex-1 text-sm">{allergen.name_it}</p>
          <RowButton
            label="Modifica allergene"
            onClick={() => onEdit({ type: "allergen", item: allergen })}
          >
            <Pencil className="h-4 w-4" style={{ color: COLORS.green }} aria-hidden="true" />
          </RowButton>
          <RowButton
            label="Elimina allergene"
            onClick={() => onDelete(allergen.name_it, `/api/colli/admin/allergens/${allergen.id}`)}
          >
            <Trash2 className="h-4 w-4" style={{ color: COLORS.danger }} aria-hidden="true" />
          </RowButton>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onEdit({ type: "allergen" })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-sm"
        style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, color: COLORS.green }}
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        Aggiungi allergene
      </button>
    </>
  );
}

function MainSectionCard({
  section,
  onEdit,
  onDelete,
}: {
  section: ColliSection;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className="mb-4 rounded-xl border"
      style={{ backgroundColor: COLORS.darkCard, borderColor: COLORS.darkCardBorder }}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl tracking-[0.04em]" style={{ color: "#F5EFE7" }}>
            {section.name_it}
          </h1>
          {section.subtitle_it && (
            <p className="mt-1 text-xs" style={{ color: "#B8A898" }}>
              {section.subtitle_it}
            </p>
          )}
        </div>
        <RowButton label="Modifica sezione" onClick={onEdit} dark>
          <Pencil className="h-4 w-4" style={{ color: "#F5EFE7" }} aria-hidden="true" />
        </RowButton>
        {onDelete && (
          <RowButton label="Elimina sezione" onClick={onDelete} dark>
            <Trash2 className="h-4 w-4" style={{ color: "#E88A8A" }} aria-hidden="true" />
          </RowButton>
        )}
      </div>
    </div>
  );
}

function EditDialog({
  target,
  data,
  englishEnabled,
  onClose,
  onSave,
}: {
  target: EditTarget;
  data: ColliMenuPayload;
  englishEnabled: boolean;
  onClose: () => void;
  onSave: (target: EditTarget, body: Record<string, unknown>) => Promise<void>;
}) {
  const item = "item" in target ? target.item : undefined;
  const sectionItem = target.type === "section" ? target.item : undefined;
  const dishItem = target.type === "item" ? target.item : undefined;
  const wineItem = target.type === "wine" ? target.item : undefined;
  const [nameIt, setNameIt] = useState(item?.name_it ?? "");
  const [nameEn, setNameEn] = useState(item?.name_en ?? "");
  const [subtitleIt, setSubtitleIt] = useState(
    sectionItem?.subtitle_it ?? dishItem?.subtitle_it ?? "",
  );
  const [subtitleEn, setSubtitleEn] = useState(
    sectionItem?.subtitle_en ?? dishItem?.subtitle_en ?? "",
  );
  const [descriptionIt, setDescriptionIt] = useState(dishItem?.description_it ?? "");
  const [descriptionEn, setDescriptionEn] = useState(dishItem?.description_en ?? "");
  const [price, setPrice] = useState(formatInputPrice(dishItem?.price));
  const [vegetarian, setVegetarian] = useState(!!dishItem?.vegetarian);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(dishItem?.allergens ?? []);
  const [producer, setProducer] = useState(wineItem?.producer ?? "");
  const [origin, setOrigin] = useState(wineItem?.origin ?? "");
  const [abv, setAbv] = useState(formatInputPrice(wineItem?.abv));
  const [priceGlass, setPriceGlass] = useState(formatInputPrice(wineItem?.price_glass));
  const [priceBottle, setPriceBottle] = useState(formatInputPrice(wineItem?.price_bottle));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = !!item;
  const isItem = target.type === "item";
  const isWine = target.type === "wine";
  const isAllergen = target.type === "allergen";
  const isDrink =
    target.type === "item" &&
    (target.sectionType === "drink" ||
      target.sectionNameEn?.toLowerCase().includes("drink") ||
      target.sectionNameEn?.toLowerCase().includes("drinks"));

  async function handleSave() {
    if (!nameIt.trim()) {
      setError("Inserisci il nome.");
      return;
    }

    const body: Record<string, unknown> = { name_it: nameIt.trim() };
    if (!isWine) body.name_en = nameEn.trim() || nameIt.trim();

    if (target.type === "section") {
      body.name_en = nameEn.trim() || nameIt.trim();
      body.subtitle_it = subtitleIt.trim();
      body.subtitle_en = subtitleEn.trim();
      if (target.item?.type) body.type = target.item.type;
    }

    if (target.type === "category") {
      body.section_id = target.sectionId;
    }

    if (target.type === "item") {
      body.category_id = target.categoryId;
      body.subtitle_it = subtitleIt.trim();
      body.subtitle_en = subtitleEn.trim();
      body.description_it = descriptionIt.trim();
      body.description_en = descriptionEn.trim();
      body.price = parsePrice(price);
      body.vegetarian = vegetarian;
      body.allergens = selectedAllergens;
    }

    if (target.type === "wine") {
      body.name_en = nameIt.trim();
      body.wine_category_id = target.wineCategoryId;
      body.producer = producer.trim();
      body.origin = origin.trim();
      body.abv = parsePrice(abv);
      body.price_glass = parsePrice(priceGlass);
      body.price_bottle = parsePrice(priceBottle);
    }

    setSaving(true);
    setError("");
    try {
      await onSave(target, body);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell title={getDialogTitle(target, isEdit)} onClose={onClose}>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <Field label={isWine ? "Nome" : "Nome italiano"}>
          <input
            value={nameIt}
            onChange={(event) => setNameIt(event.target.value)}
            className="colli-admin-input"
          />
        </Field>

        {!isWine && (englishEnabled || isAllergen) && (
          <Field label="Nome inglese">
            <input
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              className="colli-admin-input"
            />
          </Field>
        )}

        {target.type === "section" && (
          <>
            <Field label="Sottotitolo italiano">
              <input
                value={subtitleIt}
                onChange={(event) => setSubtitleIt(event.target.value)}
                className="colli-admin-input"
              />
            </Field>
            {englishEnabled && (
              <Field label="Sottotitolo inglese">
                <input
                  value={subtitleEn}
                  onChange={(event) => setSubtitleEn(event.target.value)}
                  className="colli-admin-input"
                />
              </Field>
            )}
          </>
        )}

        {isWine && (
          <>
            <Field label="Produttore">
              <input
                value={producer}
                onChange={(event) => setProducer(event.target.value)}
                className="colli-admin-input"
              />
            </Field>
            <Field label="Provenienza">
              <input
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                className="colli-admin-input"
              />
            </Field>
            <Field label="Gradazione (%)">
              <input
                value={abv}
                onChange={(event) => setAbv(sanitizePrice(event.target.value))}
                className="colli-admin-input"
                inputMode="decimal"
              />
            </Field>
            <Field label="Prezzo al calice (EUR)">
              <input
                value={priceGlass}
                onChange={(event) => setPriceGlass(sanitizePrice(event.target.value))}
                className="colli-admin-input"
                inputMode="decimal"
              />
            </Field>
            <Field label="Prezzo bottiglia (EUR)">
              <input
                value={priceBottle}
                onChange={(event) => setPriceBottle(sanitizePrice(event.target.value))}
                className="colli-admin-input"
                inputMode="decimal"
              />
            </Field>
          </>
        )}

        {isItem && (
          <>
            <Field label="Sottotitolo italiano">
              <input
                value={subtitleIt}
                onChange={(event) => setSubtitleIt(event.target.value)}
                className="colli-admin-input"
              />
            </Field>
            {englishEnabled && (
              <Field label="Sottotitolo inglese">
                <input
                  value={subtitleEn}
                  onChange={(event) => setSubtitleEn(event.target.value)}
                  className="colli-admin-input"
                />
              </Field>
            )}
            <Field label="Descrizione italiano">
              <textarea
                value={descriptionIt}
                onChange={(event) => setDescriptionIt(event.target.value)}
                className="colli-admin-input min-h-[76px]"
              />
            </Field>
            {englishEnabled && (
              <Field label="Descrizione inglese">
                <textarea
                  value={descriptionEn}
                  onChange={(event) => setDescriptionEn(event.target.value)}
                  className="colli-admin-input min-h-[76px]"
                />
              </Field>
            )}
            <Field label="Prezzo (EUR)">
              <input
                value={price}
                onChange={(event) => setPrice(sanitizePrice(event.target.value))}
                className="colli-admin-input"
                inputMode="decimal"
              />
            </Field>
            {!isDrink && (
              <Field label="Vegetariano">
                <button
                  type="button"
                  role="switch"
                  aria-checked={vegetarian}
                  onClick={() => setVegetarian((value) => !value)}
                  className="flex items-center gap-3 text-sm"
                >
                  <span
                    className="relative h-6 w-11 rounded-full"
                    style={{ backgroundColor: vegetarian ? COLORS.green : COLORS.border }}
                  >
                    <span
                      className="absolute top-1 h-4 w-4 rounded-full bg-white transition-transform"
                      style={{
                        left: "4px",
                        transform: vegetarian ? "translateX(20px)" : "translateX(0)",
                      }}
                    />
                  </span>
                  {vegetarian ? "Si" : "No"}
                </button>
              </Field>
            )}
            {!isDrink && (
              <Field label="Allergeni">
                <div className="flex flex-wrap gap-2">
                  {data.allergens.map((allergen) => {
                    const active = selectedAllergens.includes(allergen.id);
                    return (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() =>
                          setSelectedAllergens((current) =>
                            active
                              ? current.filter((id) => id !== allergen.id)
                              : [...current, allergen.id],
                          )
                        }
                        className="rounded-full border px-3 py-1.5 text-xs"
                        style={{
                          borderColor: active ? COLORS.green : COLORS.border,
                          backgroundColor: active ? "#E8F0E2" : COLORS.card,
                          color: active ? COLORS.green : COLORS.secondary,
                        }}
                      >
                        {allergen.name_it}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
          </>
        )}

        {error && (
          <p className="mt-2 text-sm" style={{ color: COLORS.danger }}>
            {error}
          </p>
        )}
      </div>

      <div
        className="flex gap-3 border-t p-4"
        style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: COLORS.border, color: COLORS.secondary }}
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-[2] rounded-lg px-4 py-3 text-sm text-white disabled:opacity-70"
          style={{ backgroundColor: COLORS.maroon }}
        >
          {saving ? "Salvataggio..." : "Salva"}
        </button>
      </div>
    </DialogShell>
  );
}

function SectionManagerDialog({
  sections,
  onClose,
  onReorder,
  onAdd,
}: {
  sections: ColliSection[];
  onClose: () => void;
  onReorder: (ids: string[]) => Promise<void>;
  onAdd: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [nameIt, setNameIt] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!nameIt.trim()) return;
    setSaving(true);
    try {
      await onAdd({ name_it: nameIt.trim(), name_en: nameEn.trim() || nameIt.trim() });
      setNameIt("");
      setNameEn("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell title="Gestisci Sezioni" onClose={onClose}>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <MoveList
          items={sections}
          onReorder={onReorder}
          renderItem={(section, move, index) => (
            <div
              className="mb-2 flex h-12 items-center gap-3 rounded-lg border px-3"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                style={{ backgroundColor: COLORS.beige, color: COLORS.secondary }}
              >
                {index + 1}
              </span>
              <p className="min-w-0 flex-1 truncate font-display text-base">{section.name_it}</p>
              <MoveButtons {...move} />
            </div>
          )}
        />

        <div className="my-5 h-px" style={{ backgroundColor: COLORS.border }} />
        <p className="mb-4 font-display text-lg">Aggiungi nuova sezione</p>
        <Field label="Nome italiano">
          <input
            value={nameIt}
            onChange={(event) => setNameIt(event.target.value)}
            className="colli-admin-input"
          />
        </Field>
        <Field label="Nome inglese">
          <input
            value={nameEn}
            onChange={(event) => setNameEn(event.target.value)}
            className="colli-admin-input"
          />
        </Field>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!nameIt.trim() || saving}
          className="mt-2 w-full rounded-lg px-4 py-3 text-sm text-white disabled:opacity-60"
          style={{ backgroundColor: COLORS.maroon }}
        >
          {saving ? "Aggiunta..." : "Aggiungi sezione"}
        </button>
      </div>
    </DialogShell>
  );
}

function PinConfirmDialog({
  label,
  onCancel,
  onConfirm,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: (pin: string) => Promise<void>;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      await onConfirm(pin);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "PIN non corretto");
      setPin("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: COLORS.cream }}>
        <h2 className="font-display text-xl" style={{ color: COLORS.maroon }}>
          Conferma eliminazione
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: COLORS.secondary }}>
          Stai per eliminare "{label}". Questa azione e irreversibile. Inserisci il PIN admin per
          confermare.
        </p>
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="colli-admin-input mt-5"
          type="password"
          inputMode="numeric"
          autoFocus
        />
        {error && (
          <p className="mt-2 text-xs" style={{ color: COLORS.danger }}>
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: COLORS.border, color: COLORS.secondary }}
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!pin || saving}
            className="flex-1 rounded-lg px-4 py-3 text-sm text-white disabled:opacity-60"
            style={{ backgroundColor: COLORS.danger }}
          >
            {saving ? "Elimino..." : "Elimina"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DialogShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/30 sm:items-center sm:px-4">
      <div
        className="flex h-full w-full max-w-xl flex-col overflow-hidden sm:h-[min(760px,92vh)] sm:rounded-2xl"
        style={{ backgroundColor: COLORS.cream }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
        >
          <h2 className="font-display text-xl">{title}</h2>
          <IconButton label="Chiudi" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

function MoveList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (ids: string[]) => Promise<void> | void;
  renderItem: (item: T, move: MoveProps, index: number) => React.ReactNode;
}) {
  async function move(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    await onReorder(next.map((item) => item.id));
  }

  return (
    <>
      {items.map((item, index) =>
        renderItem(
          item,
          {
            onUp: () => move(index, "up"),
            onDown: () => move(index, "down"),
            isFirst: index === 0,
            isLast: index === items.length - 1,
          },
          index,
        ),
      )}
    </>
  );
}

interface MoveProps {
  onUp: () => void;
  onDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function MoveButtons({ onUp, onDown, isFirst, isLast }: MoveProps) {
  return (
    <div className="flex w-8 shrink-0 flex-col items-center justify-center">
      <button
        type="button"
        onClick={onUp}
        disabled={isFirst}
        className="p-0.5 disabled:opacity-20"
        aria-label="Sposta su"
      >
        <ChevronUp className="h-4 w-4" style={{ color: COLORS.secondary }} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={isLast}
        className="p-0.5 disabled:opacity-20"
        aria-label="Sposta giu"
      >
        <ChevronDown className="h-4 w-4" style={{ color: COLORS.secondary }} aria-hidden="true" />
      </button>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function RowButton({
  label,
  onClick,
  dark = false,
  children,
}: {
  label: string;
  onClick: () => void;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: dark ? "rgba(255,255,255,0.08)" : "transparent" }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span
        className="mb-1.5 block text-[11px] uppercase tracking-[0.08em]"
        style={{ color: COLORS.secondary }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function getSaveRequest(target: EditTarget): { endpoint: string; method: string } {
  if (target.type === "section") {
    return target.item
      ? { method: "PUT", endpoint: `/api/colli/admin/sections/${target.item.id}` }
      : { method: "POST", endpoint: "/api/colli/admin/sections" };
  }
  if (target.type === "category") {
    return target.item
      ? { method: "PUT", endpoint: `/api/colli/admin/categories/${target.item.id}` }
      : { method: "POST", endpoint: "/api/colli/admin/categories" };
  }
  if (target.type === "item") {
    return target.item
      ? { method: "PUT", endpoint: `/api/colli/admin/items/${target.item.id}` }
      : { method: "POST", endpoint: "/api/colli/admin/items" };
  }
  if (target.type === "wine_category") {
    return target.item
      ? { method: "PUT", endpoint: `/api/colli/admin/wine-categories/${target.item.id}` }
      : { method: "POST", endpoint: "/api/colli/admin/wine-categories" };
  }
  if (target.type === "wine") {
    return target.item
      ? { method: "PUT", endpoint: `/api/colli/admin/wines/${target.item.id}` }
      : { method: "POST", endpoint: "/api/colli/admin/wines" };
  }
  return target.item
    ? { method: "PUT", endpoint: `/api/colli/admin/allergens/${target.item.id}` }
    : { method: "POST", endpoint: "/api/colli/admin/allergens" };
}

function getDialogTitle(target: EditTarget, isEdit: boolean): string {
  const action = isEdit ? "Modifica" : "Aggiungi";
  if (target.type === "section") return `${action} Sezione`;
  if (target.type === "category") return `${action} Categoria`;
  if (target.type === "item") return `${action} Voce`;
  if (target.type === "wine_category") return `${action} Categoria Vino`;
  if (target.type === "wine") return `${action} Vino`;
  return `${action} Allergene`;
}

function sortByOrder<T extends { order?: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function formatPrice(value: number): string {
  return value % 1 === 0 ? String(Math.round(value)) : value.toFixed(1).replace(".", ",");
}

function formatInputPrice(value: number | null | undefined): string {
  if (value == null) return "";
  return formatPrice(value);
}

function sanitizePrice(text: string): string {
  let sanitized = text.replace(".", ",").replace(/[^0-9,]/g, "");
  const parts = sanitized.split(",");
  if (parts.length > 2) sanitized = `${parts[0]},${parts.slice(1).join("")}`;
  const nextParts = sanitized.split(",");
  if (nextParts.length === 2 && nextParts[1].length > 1) {
    sanitized = `${nextParts[0]},${nextParts[1].slice(0, 1)}`;
  }
  return sanitized;
}

function parsePrice(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}
