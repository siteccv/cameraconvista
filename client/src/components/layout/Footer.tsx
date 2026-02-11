import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import type { FooterSettings, FooterHoursEntry } from "@shared/schema";
import { defaultFooterSettings } from "@shared/schema";

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: SiTiktok,
};

const daysOfWeek = [
  { it: "Lunedì", en: "Monday", index: 0 },
  { it: "Martedì", en: "Tuesday", index: 1 },
  { it: "Mercoledì", en: "Wednesday", index: 2 },
  { it: "Giovedì", en: "Thursday", index: 3 },
  { it: "Venerdì", en: "Friday", index: 4 },
  { it: "Sabato", en: "Saturday", index: 5 },
  { it: "Domenica", en: "Sunday", index: 6 },
];

function formatTimeToAmPm(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function formatHoursRange(hoursStr: string, language: "it" | "en"): string {
  if (language === "it") return hoursStr;
  
  const parts = hoursStr.split(" - ");
  if (parts.length === 2) {
    return `${formatTimeToAmPm(parts[0].trim())} - ${formatTimeToAmPm(parts[1].trim())}`;
  }
  return hoursStr;
}

// Helper to parse legacy day strings (single days or ranges) into index arrays
function parseLegacyDayString(dayKeyIt: string): number[] {
  // Check for exact single day match
  const singleDayIndex = daysOfWeek.findIndex(d => d.it === dayKeyIt);
  if (singleDayIndex >= 0) return [singleDayIndex];
  
  // Check for "Tutti i giorni" (every day)
  if (dayKeyIt.toLowerCase().includes("tutti")) return [0, 1, 2, 3, 4, 5, 6];
  
  // Check for range format "DayA - DayB"
  const rangeParts = dayKeyIt.split(" - ");
  if (rangeParts.length === 2) {
    const startIndex = daysOfWeek.findIndex(d => d.it === rangeParts[0].trim());
    const endIndex = daysOfWeek.findIndex(d => d.it === rangeParts[1].trim());
    if (startIndex >= 0 && endIndex >= 0) {
      const result: number[] = [];
      if (startIndex <= endIndex) {
        for (let i = startIndex; i <= endIndex; i++) result.push(i);
      } else {
        // Wrap around (e.g., "Venerdì - Domenica" = Fri, Sat, Sun)
        for (let i = startIndex; i <= 6; i++) result.push(i);
        for (let i = 0; i <= endIndex; i++) result.push(i);
      }
      return result;
    }
  }
  
  return [];
}

function formatDaysLabel(selectedDays: number[], language: "it" | "en"): string {
  if (selectedDays.length === 0) return "";
  if (selectedDays.length === 7) return language === "it" ? "Tutti i giorni" : "Every day";
  
  const sorted = [...selectedDays].sort((a, b) => a - b);
  
  // Check for consecutive days to form ranges
  const ranges: { start: number; end: number }[] = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === rangeEnd + 1) {
      rangeEnd = sorted[i];
    } else {
      ranges.push({ start: rangeStart, end: rangeEnd });
      rangeStart = sorted[i];
      rangeEnd = sorted[i];
    }
  }
  ranges.push({ start: rangeStart, end: rangeEnd });
  
  // Format ranges
  const parts = ranges.map(range => {
    const startDay = daysOfWeek[range.start];
    const endDay = daysOfWeek[range.end];
    
    if (range.start === range.end) {
      return language === "it" ? startDay.it : startDay.en;
    } else {
      const startName = language === "it" ? startDay.it : startDay.en;
      const endName = language === "it" ? endDay.it : endDay.en;
      return `${startName} - ${endName}`;
    }
  });
  
  return parts.join(", ");
}

// Group hours entries by their hours value and isClosed status
function groupHoursEntries(hours: FooterHoursEntry[]): { selectedDays: number[]; hours: string; isClosed: boolean }[] {
  const groups = new Map<string, { selectedDays: number[]; hours: string; isClosed: boolean }>();
  
  for (const entry of hours) {
    let selectedDays = entry.selectedDays ? [...entry.selectedDays] : [];
    // Handle old format migration - parse legacy day strings including ranges
    if (!selectedDays.length && 'dayKeyIt' in entry) {
      const oldEntry = entry as unknown as { dayKeyIt: string; hours: string; isClosed: boolean };
      selectedDays = parseLegacyDayString(oldEntry.dayKeyIt);
    }
    
    const key = entry.isClosed ? "closed" : entry.hours;
    
    if (groups.has(key)) {
      const existing = groups.get(key)!;
      existing.selectedDays = Array.from(new Set([...existing.selectedDays, ...selectedDays])).sort((a, b) => a - b);
    } else {
      groups.set(key, { 
        selectedDays: [...selectedDays], 
        hours: entry.hours, 
        isClosed: entry.isClosed 
      });
    }
  }
  
  return Array.from(groups.values());
}

export function Footer() {
  const { t, language } = useLanguage();
  const { forceMobileLayout } = useAdmin();
  const viewportIsMobile = useIsMobile();

  const { data: settings } = useQuery<FooterSettings>({
    queryKey: ["/api/footer-settings"],
    staleTime: 1000 * 60 * 5,
  });

  const footer = settings || defaultFooterSettings;
  // isMobile is true when: admin forces mobile layout OR real viewport is mobile
  const isMobile = forceMobileLayout || viewportIsMobile;

  // Quando forceMobileLayout è true, forza layout mobile senza media queries
  const gridClass = isMobile 
    ? "grid grid-cols-1 gap-6" 
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12";
  
  const containerPadding = isMobile ? "py-6" : "py-8 md:py-12";
  
  // Group hours entries by same hours/closed status
  const groupedHours = groupHoursEntries(footer.hours);

  return (
    <footer className="bg-foreground text-background">
      <div className={`container mx-auto px-4 ${containerPadding}`}>
        <div className={gridClass}>
          <div>
            <h3 className="font-display text-2xl mb-4">Camera con Vista</h3>
            <p className="text-background/70 text-sm leading-relaxed">
              {language === "it" ? footer.about.it : footer.about.en}
            </p>
          </div>

          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">
              {t("Dove Siamo", "Where We Are")}
            </h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span style={{ whiteSpace: "pre-line" }}>{footer.contacts.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${footer.contacts.phone.replace(/\s/g, "")}`} className="hover:text-background transition-colors">
                  {footer.contacts.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${footer.contacts.email}`} className="hover:text-background transition-colors">
                  {footer.contacts.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">
              {t("Orari", "Hours")}
            </h4>
            <ul className="space-y-2 text-sm text-background/70">
              {groupedHours.map((entry, index) => {
                const daysLabel = formatDaysLabel(entry.selectedDays, language);
                return (
                  <li key={index} className={index === 0 ? "flex items-start gap-3" : "ml-7"}>
                    {index === 0 && <Clock className="h-4 w-4 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-medium text-background">{daysLabel}</p>
                      <p>{entry.isClosed ? t("Chiuso", "Closed") : formatHoursRange(entry.hours, language)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="font-medium uppercase tracking-wider text-sm mb-4">
              {t("Seguici", "Follow Us")}
            </h4>
            <div className="flex gap-4">
              {footer.social.map((link, index) => {
                const IconComponent = socialIcons[link.type];
                return IconComponent ? (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                    data-testid={`link-${link.type}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                ) : null;
              })}
            </div>

          </div>
        </div>

        <div className={`mt-8 pt-6 border-t border-background/10 text-xs text-background/50 ${isMobile ? "flex flex-col items-center gap-3 text-center" : "flex flex-col md:flex-row items-center md:justify-between gap-3"}`}>
          <div className="text-center md:text-left space-y-1">
            <p>© {new Date().getFullYear()} Camera con Vista. {t("Tutti i diritti riservati.", "All rights reserved.")}</p>
            <p>CAMERA CON VISTA S.A.S. di Matteo Bonetti Camera Roda &amp; C.</p>
            <p>Via Santo Stefano 14/2A – 40125 Bologna (BO) | P.IVA / C.F.: 03488971205</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={footer.legalLinks.privacyUrl} className="hover:text-background transition-colors">
              {language === "it" ? footer.legalLinks.privacyLabelIt : footer.legalLinks.privacyLabelEn}
            </Link>
            <Link href={footer.legalLinks.cookieUrl} className="hover:text-background transition-colors">
              {language === "it" ? footer.legalLinks.cookieLabelIt : footer.legalLinks.cookieLabelEn}
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("ccv_cookie_consent");
                window.dispatchEvent(new Event("ccv_consent_reset"));
              }}
              className="hover:text-background transition-colors"
              data-testid="button-cookie-preferences-footer"
            >
              {t("Preferenze cookie", "Cookie preferences")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
