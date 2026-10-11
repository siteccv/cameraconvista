// Valori predefiniti usati anche dal codice del browser. Questo file importa solo
// tipi (cancellati in compilazione): niente zod ne drizzle nel bundle del sito.
import type { BookingSettings, FooterSettings } from "./schema";

export const defaultFooterSettings: FooterSettings = {
  about: {
    it: "Uno dei cocktail bar più rinomati di Bologna. La nostra filosofia si basa sulla qualità degli ingredienti, l'innovazione nelle tecniche e la passione per l'ospitalità.",
    en: "One of the most renowned cocktail bars in Bologna. Our philosophy is based on the quality of ingredients, innovation in techniques, and passion for hospitality.",
  },
  contacts: {
    address: "Via del Pratello, 42\n40122 Bologna, Italia",
    phone: "+39 051 234 5678",
    email: "info@cameraconvista.it",
  },
  hours: [
    { selectedDays: [1, 2, 3, 4, 5, 6], hours: "18:00 - 02:00", isClosed: false }, // Tue-Sun
    { selectedDays: [0], hours: "", isClosed: true }, // Monday closed
  ],
  social: [
    { type: "instagram", url: "https://instagram.com" },
    { type: "facebook", url: "https://facebook.com" },
  ],
  legalLinks: {
    privacyUrl: "/privacy",
    privacyLabelIt: "Privacy Policy",
    privacyLabelEn: "Privacy Policy",
    cookieUrl: "/cookie",
    cookieLabelIt: "Cookie Policy",
    cookieLabelEn: "Cookie Policy",
  },
};

export const defaultBookingSettings: BookingSettings = {
  bookingUrl: "https://rsvp-p91d.onrender.com",
};
