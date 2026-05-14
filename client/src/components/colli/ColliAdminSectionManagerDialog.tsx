import { useState } from "react";
import { DialogShell, Field } from "@/components/colli/ColliAdminControls";
import { MoveButtons, MoveList } from "@/components/colli/ColliAdminMoveList";
import type { ColliSection } from "@shared/colli";

const CARD_COLOR = "#FAF8F5";
const BEIGE_COLOR = "#E8DDD0";
const BORDER_COLOR = "#E2D9CF";
const SECONDARY_COLOR = "#7A6A5A";
const MAROON_COLOR = "#722F37";

export function SectionManagerDialog({
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
              style={{ backgroundColor: CARD_COLOR, borderColor: BORDER_COLOR }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                style={{ backgroundColor: BEIGE_COLOR, color: SECONDARY_COLOR }}
              >
                {index + 1}
              </span>
              <p className="min-w-0 flex-1 truncate font-display text-base">{section.name_it}</p>
              <MoveButtons {...move} />
            </div>
          )}
        />

        <div className="my-5 h-px" style={{ backgroundColor: BORDER_COLOR }} />
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
          style={{ backgroundColor: MAROON_COLOR }}
        >
          {saving ? "Aggiunta..." : "Aggiungi sezione"}
        </button>
      </div>
    </DialogShell>
  );
}
