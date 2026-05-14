import { Pencil, Trash2 } from "lucide-react";
import { RowButton } from "@/components/colli/ColliAdminControls";
import type { ColliSection } from "@shared/colli";

const DARK_CARD_COLOR = "#6B4423";
const DARK_CARD_BORDER_COLOR = "#5C3A1E";
const LIGHT_TEXT_COLOR = "#F5EFE7";
const MUTED_LIGHT_TEXT_COLOR = "#B8A898";
const DANGER_LIGHT_COLOR = "#E88A8A";

export function MainSectionCard({
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
      style={{ backgroundColor: DARK_CARD_COLOR, borderColor: DARK_CARD_BORDER_COLOR }}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="min-w-0 flex-1">
          <h1
            className="font-display text-xl tracking-[0.04em]"
            style={{ color: LIGHT_TEXT_COLOR }}
          >
            {section.name_it}
          </h1>
          {section.subtitle_it && (
            <p className="mt-1 text-xs" style={{ color: MUTED_LIGHT_TEXT_COLOR }}>
              {section.subtitle_it}
            </p>
          )}
        </div>
        <RowButton label="Modifica sezione" onClick={onEdit} dark>
          <Pencil className="h-4 w-4" style={{ color: LIGHT_TEXT_COLOR }} aria-hidden="true" />
        </RowButton>
        {onDelete && (
          <RowButton label="Elimina sezione" onClick={onDelete} dark>
            <Trash2 className="h-4 w-4" style={{ color: DANGER_LIGHT_COLOR }} aria-hidden="true" />
          </RowButton>
        )}
      </div>
    </div>
  );
}
