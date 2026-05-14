export const DAYS_OF_WEEK = [
  { it: "Lunedì", en: "Monday", index: 0 },
  { it: "Martedì", en: "Tuesday", index: 1 },
  { it: "Mercoledì", en: "Wednesday", index: 2 },
  { it: "Giovedì", en: "Thursday", index: 3 },
  { it: "Venerdì", en: "Friday", index: 4 },
  { it: "Sabato", en: "Saturday", index: 5 },
  { it: "Domenica", en: "Sunday", index: 6 },
] as const;

export const TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
    .toString()
    .padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

export function parseLegacyDayString(dayKeyIt: string): number[] {
  const singleDayIndex = DAYS_OF_WEEK.findIndex((day) => day.it === dayKeyIt);
  if (singleDayIndex >= 0) return [singleDayIndex];

  if (dayKeyIt.toLowerCase().includes("tutti")) {
    return DAYS_OF_WEEK.map((day) => day.index);
  }

  const rangeParts = dayKeyIt.split(" - ");
  if (rangeParts.length === 2) {
    const startIndex = DAYS_OF_WEEK.findIndex((day) => day.it === rangeParts[0].trim());
    const endIndex = DAYS_OF_WEEK.findIndex((day) => day.it === rangeParts[1].trim());
    if (startIndex >= 0 && endIndex >= 0) {
      const result: number[] = [];
      if (startIndex <= endIndex) {
        for (let index = startIndex; index <= endIndex; index++) result.push(index);
      } else {
        for (let index = startIndex; index <= 6; index++) result.push(index);
        for (let index = 0; index <= endIndex; index++) result.push(index);
      }
      return result;
    }
  }

  return [];
}

export function parseTimeRange(hours: string): { open: string; close: string; isValid: boolean } {
  const parts = hours.split(" - ");
  const open = parts[0]?.trim() || "";
  const close = parts[1]?.trim() || "";
  const isValid = TIME_SLOTS.includes(open) && TIME_SLOTS.includes(close);
  return { open: open || "18:00", close: close || "02:00", isValid };
}

export function getSelectedDaysLabel(
  selectedDays: number[],
  labels: { noDays: string; everyDay: string },
) {
  if (selectedDays.length === 0) return labels.noDays;
  if (selectedDays.length === DAYS_OF_WEEK.length) return labels.everyDay;
  return selectedDays.map((index) => DAYS_OF_WEEK[index]?.it.substring(0, 3)).join(", ");
}
