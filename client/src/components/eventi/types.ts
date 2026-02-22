export type EventType = "aperitivo" | "cena" | "esclusivo";

export type ExclusiveSubOption = "convivialis" | "riserva-ccv" | "riserva-jazz";

export type EventLocation = "interno" | "dehors";

export interface EventRequestData {
  eventType: EventType;
  subOption?: ExclusiveSubOption;
  location?: EventLocation;
  date: string;
  time: string;
  timeApproximate: boolean;
  guests: number;
  guestsApproximate: boolean;
  notes: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  termsAccepted: boolean;
}

export const EVENT_TYPE_LABELS = {
  aperitivo: { it: "Aperitivo", en: "Aperitivo" },
  cena: { it: "Cena", en: "Dinner" },
  esclusivo: { it: "Evento Privato Esclusivo", en: "Exclusive Private Event" },
} as const;

export const EXCLUSIVE_SUB_LABELS = {
  convivialis: { it: "Tavolo Convivialis", en: "Convivialis Table" },
  "riserva-ccv": { it: "Riserva Camera con Vista", en: "Reserve Camera con Vista" },
  "riserva-jazz": { it: "Riserva Camera Jazz Club", en: "Reserve Camera Jazz Club" },
} as const;
