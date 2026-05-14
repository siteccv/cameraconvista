export type ColliAdminEditTargetType =
  | "section"
  | "category"
  | "item"
  | "wine_category"
  | "wine"
  | "allergen";

export interface ColliAdminEditTargetLike {
  type: ColliAdminEditTargetType;
  item?: { id: string | number } | null;
}

export function getSaveRequest(target: ColliAdminEditTargetLike): {
  endpoint: string;
  method: "POST" | "PUT";
} {
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

export function getDialogTitle(
  target: Pick<ColliAdminEditTargetLike, "type">,
  isEdit: boolean,
): string {
  const action = isEdit ? "Modifica" : "Aggiungi";
  if (target.type === "section") return `${action} Sezione`;
  if (target.type === "category") return `${action} Categoria`;
  if (target.type === "item") return `${action} Voce`;
  if (target.type === "wine_category") return `${action} Categoria Vino`;
  if (target.type === "wine") return `${action} Vino`;
  return `${action} Allergene`;
}

export function sortByOrder<T extends { order?: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function formatPrice(value: number): string {
  return value % 1 === 0 ? String(Math.round(value)) : value.toFixed(1).replace(".", ",");
}

export function formatInputPrice(value: number | null | undefined): string {
  if (value == null) return "";
  return formatPrice(value);
}

export function sanitizePrice(text: string): string {
  let sanitized = text.replace(".", ",").replace(/[^0-9,]/g, "");
  const parts = sanitized.split(",");
  if (parts.length > 2) sanitized = `${parts[0]},${parts.slice(1).join("")}`;
  const nextParts = sanitized.split(",");
  if (nextParts.length === 2 && nextParts[1].length > 1) {
    sanitized = `${nextParts[0]},${nextParts[1].slice(0, 1)}`;
  }
  return sanitized;
}

export function parsePrice(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}
