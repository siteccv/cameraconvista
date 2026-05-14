import { describe, expect, it } from "vitest";
import {
  DAYS_OF_WEEK,
  TIME_SLOTS,
  getSelectedDaysLabel,
  parseLegacyDayString,
  parseTimeRange,
} from "@/components/admin/footerSettingsUtils";

describe("footer settings utils", () => {
  it("exposes the expected weekday and half-hour time slots", () => {
    expect(DAYS_OF_WEEK.map((day) => day.it)).toEqual([
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
      "Domenica",
    ]);
    expect(TIME_SLOTS).toHaveLength(48);
    expect(TIME_SLOTS[0]).toBe("00:00");
    expect(TIME_SLOTS.at(-1)).toBe("23:30");
  });

  it("parses legacy single days, full week labels and wrapping ranges", () => {
    expect(parseLegacyDayString("Lunedì")).toEqual([0]);
    expect(parseLegacyDayString("Tutti i giorni")).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(parseLegacyDayString("Venerdì - Domenica")).toEqual([4, 5, 6]);
    expect(parseLegacyDayString("Sabato - Martedì")).toEqual([5, 6, 0, 1]);
    expect(parseLegacyDayString("Non valido")).toEqual([]);
  });

  it("parses standard time ranges and falls back for custom text", () => {
    expect(parseTimeRange("18:00 - 02:00")).toEqual({
      open: "18:00",
      close: "02:00",
      isValid: true,
    });
    expect(parseTimeRange("Sempre aperto")).toEqual({
      open: "Sempre aperto",
      close: "02:00",
      isValid: false,
    });
  });

  it("formats selected day labels for the admin summary", () => {
    const labels = { noDays: "Nessun giorno", everyDay: "Tutti i giorni" };
    expect(getSelectedDaysLabel([], labels)).toBe("Nessun giorno");
    expect(getSelectedDaysLabel([0, 1, 2, 3, 4, 5, 6], labels)).toBe("Tutti i giorni");
    expect(getSelectedDaysLabel([0, 2, 4], labels)).toBe("Lun, Mer, Ven");
  });
});
