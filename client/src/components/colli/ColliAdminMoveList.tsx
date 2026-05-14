import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const DEFAULT_SECONDARY_COLOR = "#7A6A5A";

export interface MoveProps {
  onUp: () => void;
  onDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function MoveList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (ids: string[]) => Promise<void> | void;
  renderItem: (item: T, move: MoveProps, index: number) => ReactNode;
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

export function MoveButtons({
  onUp,
  onDown,
  isFirst,
  isLast,
  color = DEFAULT_SECONDARY_COLOR,
}: MoveProps & { color?: string }) {
  return (
    <div className="flex w-8 shrink-0 flex-col items-center justify-center">
      <button
        type="button"
        onClick={onUp}
        disabled={isFirst}
        className="p-0.5 disabled:opacity-20"
        aria-label="Sposta su"
      >
        <ChevronUp className="h-4 w-4" style={{ color }} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={isLast}
        className="p-0.5 disabled:opacity-20"
        aria-label="Sposta giu"
      >
        <ChevronDown className="h-4 w-4" style={{ color }} aria-hidden="true" />
      </button>
    </div>
  );
}
