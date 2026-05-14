import type { EventType, ExclusiveSubOption } from "./types";

export const TIME_SLOTS = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
];

export function getStepLabel(step: number, t: (it: string, en: string) => string): string {
  const labels: Record<number, [string, string]> = {
    1: ["Preferenze", "Preferences"],
    2: ["Data", "Date"],
    3: ["Orario", "Time"],
    4: ["Ospiti", "Guests"],
    5: ["Note", "Notes"],
    6: ["Contatti", "Contact Info"],
    7: ["Riepilogo", "Summary"],
  };
  const pair = labels[step];
  return pair ? t(pair[0], pair[1]) : "";
}

export interface EventWizardValidationState {
  step: number;
  eventType: EventType;
  subOption: ExclusiveSubOption | undefined;
  date: Date | undefined;
  time: string;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneLocal: string;
  termsAccepted: boolean;
}

export function isEventWizardStepValid(state: EventWizardValidationState): boolean {
  switch (state.step) {
    case 1:
      if (state.eventType === "esclusivo") return !!state.subOption;
      return true;
    case 2:
      return !!state.date;
    case 3:
      return !!state.time;
    case 4:
      return state.guests > 0;
    case 5:
      return true;
    case 6:
      return (
        state.firstName.trim().length > 0 &&
        state.lastName.trim().length > 0 &&
        state.email.trim().length > 0 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email) &&
        state.phoneLocal.trim().length > 0 &&
        state.termsAccepted
      );
    case 7:
      return true;
    default:
      return false;
  }
}
