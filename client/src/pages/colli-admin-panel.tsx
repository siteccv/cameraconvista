import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Home, Info, Leaf, Pencil, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { IconButton, RowButton } from "@/components/colli/ColliAdminControls";
import { EditDialog, PinConfirmDialog } from "@/components/colli/ColliAdminDialogs";
import { MoveButtons, MoveList } from "@/components/colli/ColliAdminMoveList";
import { MainSectionCard } from "@/components/colli/ColliAdminSectionCard";
import { SectionManagerDialog } from "@/components/colli/ColliAdminSectionManagerDialog";
import type { ColliAdminSession, EditTarget } from "@/components/colli/colli-admin-types";
import { formatPrice, getSaveRequest, sortByOrder } from "@/lib/colli-admin-utils";
import type { ColliAdminSettings, ColliMenuPayload, ColliSection } from "@shared/colli";

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
