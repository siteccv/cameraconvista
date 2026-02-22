import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ArrowRight, CalendarIcon, Check, Loader2, Send } from "lucide-react";
import { format } from "date-fns";
import { it as itLocale, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getCountryCallingCode, getCountries, type CountryCode } from "libphonenumber-js";
import flags from "react-phone-number-input/flags";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EventType, ExclusiveSubOption, EventLocation, EventRequestData } from "./types";
import { EVENT_TYPE_LABELS, EXCLUSIVE_SUB_LABELS } from "./types";

const LOCATION_LABELS: Record<EventLocation, { it: string; en: string }> = {
  interno: { it: "Interno", en: "Indoor" },
  dehors: { it: "All'aperto — Dehors", en: "Outdoor — Dehors" },
};

interface EventWizardProps {
  eventType: EventType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TOTAL_STEPS = 7;

const TIME_SLOTS = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30",
];

function getStepLabel(step: number, t: (it: string, en: string) => string): string {
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

export function EventWizard({ eventType, open, onOpenChange }: EventWizardProps) {
  const { t, language } = useLanguage();
  const locale = language === "en" ? enUS : itLocale;

  const hasLocationStep = eventType === "aperitivo" || eventType === "cena";
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [subOption, setSubOption] = useState<ExclusiveSubOption | undefined>(undefined);
  const [location, setLocation] = useState<EventLocation | undefined>(undefined);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("20:00");
  const [timeApproximate, setTimeApproximate] = useState(false);
  const [guests, setGuests] = useState(10);
  const [guestsApproximate, setGuestsApproximate] = useState(false);
  const [notes, setNotes] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("IT");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [calendarOpen, setCalendarOpen] = useState(false);

  const resetForm = useCallback(() => {
    setStep(1);
    setSubOption(undefined);
    setLocation(undefined);
    setDate(undefined);
    setTime("20:00");
    setTimeApproximate(false);
    setGuests(10);
    setGuestsApproximate(false);
    setNotes("");
    setFirstName("");
    setLastName("");
    setPhoneCountry("IT");
    setPhoneLocal("");
    setEmail("");
    setTermsAccepted(false);
    setHoneypot("");
    setIsSubmitting(false);
    setIsSubmitted(false);
  }, [eventType]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, resetForm]);

  const isStepValid = useCallback((): boolean => {
    switch (step) {
      case 1:
        if (eventType === "esclusivo") return !!subOption;
        if (hasLocationStep) return !!location;
        return true;
      case 2:
        return !!date;
      case 3:
        return !!time;
      case 4:
        return guests > 0;
      case 5:
        return true;
      case 6:
        return firstName.trim().length > 0 && lastName.trim().length > 0 &&
               email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
               phoneLocal.trim().length > 0 && termsAccepted;
      case 7:
        return true;
      default:
        return false;
    }
  }, [step, eventType, hasLocationStep, subOption, location, date, time, guests, firstName, lastName, email, phoneLocal, termsAccepted]);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (honeypot) return;
    setIsSubmitting(true);
    try {
      const payload: EventRequestData & { honeypot?: string } = {
        eventType,
        subOption,
        location,
        date: date ? format(date, "yyyy-MM-dd") : "",
        time,
        timeApproximate,
        guests,
        guestsApproximate,
        notes,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: `+${getCountryCallingCode(phoneCountry)} ${phoneLocal.trim()}`,
        email: email.trim(),
        termsAccepted,
        ...(honeypot ? { honeypot } : {}),
      };
      const res = await fetch("/api/event-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      setIsSubmitted(true);
    } catch {
      setIsSubmitting(false);
    }
  };

  const eventLabel = t(EVENT_TYPE_LABELS[eventType].it, EVENT_TYPE_LABELS[eventType].en);

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg" data-testid="wizard-success">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="font-display text-2xl mb-6">
              {t("Richiesta inviata!", "Request sent!")}
            </h2>
            <Button onClick={() => handleOpenChange(false)} data-testid="button-close-success">
              {t("Chiudi", "Close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="wizard-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl" data-testid="wizard-title">
            {t("Richiedi preventivo", "Request Quote")} — {eventLabel}
          </DialogTitle>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{getStepLabel(step, t)}</span>
              <span>{step}/{TOTAL_STEPS}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
                data-testid="wizard-progress"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 min-h-[280px]">
          {step === 1 && (
            <div data-testid="wizard-step-1">
              {eventType === "esclusivo" ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("Seleziona la formula desiderata:", "Select your preferred formula:")}
                  </p>
                  <RadioGroup
                    value={subOption || ""}
                    onValueChange={(v) => setSubOption(v as ExclusiveSubOption)}
                  >
                    {(Object.keys(EXCLUSIVE_SUB_LABELS) as ExclusiveSubOption[]).map((key) => (
                      <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value={key} id={`sub-${key}`} data-testid={`radio-${key}`} />
                        <Label htmlFor={`sub-${key}`} className="cursor-pointer flex-1">
                          {t(EXCLUSIVE_SUB_LABELS[key].it, EXCLUSIVE_SUB_LABELS[key].en)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ) : hasLocationStep ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("Dove preferisci organizzare il tuo evento?", "Where would you prefer to host your event?")}
                  </p>
                  <RadioGroup
                    value={location || ""}
                    onValueChange={(v) => setLocation(v as EventLocation)}
                  >
                    {(Object.keys(LOCATION_LABELS) as EventLocation[]).map((key) => (
                      <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value={key} id={`loc-${key}`} data-testid={`radio-location-${key}`} />
                        <Label htmlFor={`loc-${key}`} className="cursor-pointer flex-1">
                          {t(LOCATION_LABELS[key].it, LOCATION_LABELS[key].en)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ) : null}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4" data-testid="wizard-step-2">
              <Label>{t("Data dell'evento", "Event date")}</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    data-testid="button-date-picker"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale }) : t("Seleziona una data", "Pick a date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { setDate(d); setCalendarOpen(false); }}
                    disabled={(d) => d < new Date()}
                    locale={locale}
                    data-testid="calendar"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4" data-testid="wizard-step-3">
              <Label>{t("Orario desiderato", "Preferred time")}</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[240px] overflow-y-auto pr-1 py-1" data-testid="time-slot-grid">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    data-testid={`time-slot-${slot.replace(":", "")}`}
                    className={cn(
                      "py-3 px-2 rounded-lg border text-center text-sm font-medium transition-colors touch-manipulation",
                      "active:scale-95",
                      time === slot
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="time-approx"
                  checked={timeApproximate}
                  onCheckedChange={(c) => setTimeApproximate(c === true)}
                  data-testid="checkbox-time-approx"
                />
                <Label htmlFor="time-approx" className="text-sm text-muted-foreground cursor-pointer">
                  {t("Orario indicativo (flessibile)", "Approximate time (flexible)")}
                </Label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4" data-testid="wizard-step-4">
              <Label htmlFor="guests">{t("Numero ospiti", "Number of guests")}</Label>
              <Input
                id="guests"
                type="number"
                min={1}
                max={500}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full"
                data-testid="input-guests"
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="guests-approx"
                  checked={guestsApproximate}
                  onCheckedChange={(c) => setGuestsApproximate(c === true)}
                  data-testid="checkbox-guests-approx"
                />
                <Label htmlFor="guests-approx" className="text-sm text-muted-foreground cursor-pointer">
                  {t("Numero indicativo (potrebbe variare)", "Approximate number (may vary)")}
                </Label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4" data-testid="wizard-step-5">
              <Label htmlFor="notes">{t("Note o richieste particolari", "Notes or special requests")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t(
                  "Es. allergie, preferenze musicali, decorazioni...",
                  "E.g. allergies, music preferences, decorations..."
                )}
                rows={5}
                className="resize-none"
                data-testid="textarea-notes"
              />
              <p className="text-xs text-muted-foreground">
                {t("Facoltativo", "Optional")}
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4" data-testid="wizard-step-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">{t("Nome", "First Name")} *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t("Cognome", "Last Name")} *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="phone">{t("Telefono", "Phone")} *</Label>
                <div className="flex items-stretch">
                  <Select value={phoneCountry} onValueChange={(v) => setPhoneCountry(v as CountryCode)}>
                    <SelectTrigger
                      className="w-auto rounded-r-none border-r-0 px-2 gap-1 shrink-0"
                      data-testid="select-phone-country"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {(() => {
                          const FlagComp = flags[phoneCountry];
                          return FlagComp ? <span className="inline-block w-5 h-3.5 [&>svg]:w-full [&>svg]:h-full"><FlagComp title={phoneCountry} /></span> : <span>{phoneCountry}</span>;
                        })()}
                        <span className="text-sm font-medium text-muted-foreground">+{getCountryCallingCode(phoneCountry)}</span>
                      </span>
                    </SelectTrigger>
                    <SelectContent className="max-h-[240px]">
                      {getCountries().sort((a, b) => {
                        if (a === "IT") return -1;
                        if (b === "IT") return 1;
                        return a.localeCompare(b);
                      }).map((c) => {
                        const FlagComp = flags[c];
                        return (
                          <SelectItem key={c} value={c}>
                            <span className="inline-flex items-center gap-2">
                              {FlagComp && <span className="inline-block w-5 h-3.5 [&>svg]:w-full [&>svg]:h-full"><FlagComp title={c} /></span>}
                              <span>{c}</span>
                              <span className="text-muted-foreground">+{getCountryCallingCode(c)}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d\s]/g, ""))}
                    placeholder={t("Numero di telefono", "Phone number")}
                    className="rounded-l-none flex-1"
                    data-testid="input-phone"
                  />
                </div>
              </div>
              <div className="flex items-start space-x-2 mt-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(c) => setTermsAccepted(c === true)}
                  data-testid="checkbox-terms"
                />
                <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-tight">
                  {t(
                    "Acconsento al trattamento dei dati personali ai sensi della normativa vigente sulla privacy.",
                    "I consent to the processing of my personal data in accordance with applicable privacy regulations."
                  )}
                </Label>
              </div>
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3 text-sm" data-testid="wizard-step-7">
              <h3 className="font-display text-lg mb-3">{t("Riepilogo richiesta", "Request Summary")}</h3>
              <div className="space-y-2 divide-y">
                <SummaryRow label={t("Tipo evento", "Event Type")} value={eventLabel} />
                {subOption && (
                  <SummaryRow
                    label={t("Formula", "Formula")}
                    value={t(EXCLUSIVE_SUB_LABELS[subOption].it, EXCLUSIVE_SUB_LABELS[subOption].en)}
                  />
                )}
                {location && (
                  <SummaryRow
                    label={t("Location", "Location")}
                    value={t(LOCATION_LABELS[location].it, LOCATION_LABELS[location].en)}
                  />
                )}
                <SummaryRow
                  label={t("Data", "Date")}
                  value={date ? format(date, "PPP", { locale }) : "—"}
                />
                <SummaryRow
                  label={t("Orario", "Time")}
                  value={`${time}${timeApproximate ? ` (${t("indicativo", "approx.")})` : ""}`}
                />
                <SummaryRow
                  label={t("Ospiti", "Guests")}
                  value={`${guests}${guestsApproximate ? ` (${t("circa", "approx.")})` : ""}`}
                />
                {notes && <SummaryRow label={t("Note", "Notes")} value={notes} />}
                <SummaryRow label={t("Nome", "Name")} value={`${firstName} ${lastName}`} />
                <SummaryRow label="Email" value={email} />
                <SummaryRow label={t("Telefono", "Phone")} value={`+${getCountryCallingCode(phoneCountry)} ${phoneLocal}`} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2 border-t">
          <Button
            variant="ghost"
            onClick={step <= 1 ? () => handleOpenChange(false) : handlePrev}
            disabled={isSubmitting}
            data-testid="button-wizard-prev"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step <= 1 ? t("Annulla", "Cancel") : t("Indietro", "Back")}
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              data-testid="button-wizard-next"
            >
              {t("Avanti", "Next")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-testid="button-wizard-submit"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {t("Invia richiesta", "Send Request")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 first:pt-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
