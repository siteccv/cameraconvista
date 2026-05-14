import { describe, expect, it } from "vitest";
import {
  getStepLabel,
  isEventWizardStepValid,
  TIME_SLOTS,
  type EventWizardValidationState,
} from "@/components/eventi/eventWizardUtils";

describe("event wizard utils", () => {
  it("exposes the existing half-hour time slots", () => {
    expect(TIME_SLOTS).toHaveLength(20);
    expect(TIME_SLOTS[0]).toBe("12:00");
    expect(TIME_SLOTS.at(-1)).toBe("21:30");
  });

  it("returns localized step labels", () => {
    const italian = (it: string) => it;
    const english = (_it: string, en: string) => en;

    expect(getStepLabel(1, italian)).toBe("Preferenze");
    expect(getStepLabel(6, english)).toBe("Contact Info");
    expect(getStepLabel(99, italian)).toBe("");
  });

  it("validates exclusive option and required contact fields", () => {
    const validBase: EventWizardValidationState = {
      step: 6,
      eventType: "esclusivo",
      subOption: "convivialis",
      date: new Date("2026-06-01"),
      time: "20:00",
      guests: 10,
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phoneLocal: "3331234567",
      termsAccepted: true,
    };

    expect(isEventWizardStepValid({ ...validBase, step: 1, subOption: undefined })).toBe(false);
    expect(isEventWizardStepValid({ ...validBase, step: 1 })).toBe(true);
    expect(isEventWizardStepValid(validBase)).toBe(true);
    expect(isEventWizardStepValid({ ...validBase, email: "ada" })).toBe(false);
    expect(isEventWizardStepValid({ ...validBase, termsAccepted: false })).toBe(false);
  });
});
