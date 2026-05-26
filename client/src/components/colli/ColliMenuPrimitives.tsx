import type { ReactNode } from "react";
import { IoLeafSharp } from "react-icons/io5";
import { LuWheatOff } from "react-icons/lu";

const COLORS = {
  maroon: "#722F37",
  secondary: "#7A6A5A",
  separator: "#E2D9CF",
  green: "#5B7A4E",
  gold: "#B8860B",
};

export function CategoryBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-9 mb-2">
      <h2
        className="px-6 pb-6 text-center font-display text-[32px] leading-tight"
        style={{ color: COLORS.maroon }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function FilledLeafIcon({ className }: { className: string }) {
  return (
    <IoLeafSharp
      className={className}
      style={{ color: COLORS.green }}
      aria-hidden="true"
      focusable={false}
    />
  );
}

export function GlutenFreeIcon({ className }: { className: string }) {
  return (
    <LuWheatOff
      className={className}
      style={{ color: COLORS.gold }}
      aria-hidden="true"
      focusable={false}
    />
  );
}

export function DialogSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mb-5 border-t pt-5" style={{ borderColor: COLORS.separator }}>
      <h3 className="mb-3 text-[11px] uppercase" style={{ color: COLORS.secondary }}>
        {label}
      </h3>
      {children}
    </section>
  );
}

export function Separator() {
  return <div className="mx-6 h-px" style={{ backgroundColor: "rgba(226, 217, 207, 0.70)" }} />;
}
