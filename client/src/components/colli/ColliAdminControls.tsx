import type { ReactNode } from "react";
import { X } from "lucide-react";

const DEFAULT_SECONDARY_COLOR = "#7A6A5A";
const DEFAULT_CREAM_COLOR = "#EFE8D8";
const DEFAULT_CARD_COLOR = "#FAF8F5";
const DEFAULT_BORDER_COLOR = "#E2D9CF";

export function DialogShell({
  title,
  children,
  onClose,
  creamColor = DEFAULT_CREAM_COLOR,
  cardColor = DEFAULT_CARD_COLOR,
  borderColor = DEFAULT_BORDER_COLOR,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  creamColor?: string;
  cardColor?: string;
  borderColor?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/30 sm:items-center sm:px-4">
      <div
        className="flex h-full w-full max-w-xl flex-col overflow-hidden sm:h-[min(760px,92vh)] sm:rounded-2xl"
        style={{ backgroundColor: creamColor }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor, backgroundColor: cardColor }}
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

export function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
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

export function RowButton({
  label,
  onClick,
  dark = false,
  children,
}: {
  label: string;
  onClick: () => void;
  dark?: boolean;
  children: ReactNode;
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

export function Field({
  label,
  children,
  color = DEFAULT_SECONDARY_COLOR,
}: {
  label: string;
  children: ReactNode;
  color?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.08em]" style={{ color }}>
        {label}
      </span>
      {children}
    </label>
  );
}
