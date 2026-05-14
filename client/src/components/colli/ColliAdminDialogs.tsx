import { useState } from "react";
import { DialogShell, Field } from "@/components/colli/ColliAdminControls";
import type { EditTarget } from "@/components/colli/colli-admin-types";
import {
  formatInputPrice,
  getDialogTitle,
  parsePrice,
  sanitizePrice,
} from "@/lib/colli-admin-utils";
import type { ColliMenuPayload } from "@shared/colli";

const COLORS = {
  cream: "#EFE8D8",
  card: "#FAF8F5",
  border: "#E2D9CF",
  maroon: "#722F37",
  secondary: "#7A6A5A",
  green: "#5B7A4E",
  danger: "#C0392B",
};

export function EditDialog({
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

export function PinConfirmDialog({
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
