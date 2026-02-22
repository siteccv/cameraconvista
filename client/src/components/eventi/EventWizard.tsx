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
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { EventType, ExclusiveSubOption, EventRequestData } from "./types";
import { EVENT_TYPE_LABELS, EXCLUSIVE_SUB_LABELS } from "./types";

interface EventWizardProps {
  eventType: EventType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TOTAL_STEPS = 7;

function getStepLabel(step: number, t: (it: string, en: string) => string): string {
  const labels: Record<number, [string, string]> = {
    1: ["Tipo evento", "Event Type"],
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

  const [step, setStep] = useState(eventType === "esclusivo" ? 1 : 2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [subOption, setSubOption] = useState<ExclusiveSubOption | undefined>(undefined);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("20:00");
  const [timeApproximate, setTimeApproximate] = useState(false);
  const [guests, setGuests] = useState(10);
  const [guestsApproximate, setGuestsApproximate] = useState(false);
  const [notes, setNotes] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [calendarOpen, setCalendarOpen] = useState(false);

  const resetForm = useCallback(() => {
    setStep(eventType === "esclusivo" ? 1 : 2);
    setSubOption(undefined);
    setDate(undefined);
    setTime("20:00");
    setTimeApproximate(false);
    setGuests(10);
    setGuestsApproximate(false);
    setNotes("");
    setFirstName("");
    setLastName("");
    setPhone("");
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
               phone.trim().length > 0 && termsAccepted;
      case 7:
        return true;
      default:
        return false;
    }
  }, [step, eventType, subOption, date, time, guests, firstName, lastName, email, phone, termsAccepted]);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    const minStep = eventType === "esclusivo" ? 1 : 2;
    if (step > minStep) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (honeypot) return;
    setIsSubmitting(true);
    try {
      const payload: EventRequestData & { honeypot?: string } = {
        eventType,
        subOption,
        date: date ? format(date, "yyyy-MM-dd") : "",
        time,
        timeApproximate,
        guests,
        guestsApproximate,
        notes,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
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

  const progress = Math.round(((eventType === "esclusivo" ? step : (step === 1 ? 1 : step)) / TOTAL_STEPS) * 100);

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg" data-testid="wizard-success">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="font-display text-2xl mb-2">
              {t("Richiesta inviata!", "Request sent!")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t(
                "Ti risponderemo entro 48 ore all'indirizzo email fornito.",
                "We'll get back to you within 48 hours at the email address provided."
              )}
            </p>
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
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <p className="text-muted-foreground">
                    {t(
                      `Stai richiedendo un preventivo per: ${eventLabel}`,
                      `You are requesting a quote for: ${eventLabel}`
                    )}
                  </p>
                </div>
              )}
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
              <Label htmlFor="event-time">{t("Orario desiderato", "Preferred time")}</Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full"
                data-testid="input-time"
              />
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
                <PhoneInput
                  international
                  defaultCountry="IT"
                  value={phone}
                  onChange={(val) => setPhone(val || "")}
                  numberInputProps={{
                    id: "phone",
                    "data-testid": "input-phone",
                  }}
                  className="phone-input-wizard"
                />
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
                <SummaryRow label={t("Telefono", "Phone")} value={phone} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2 border-t">
          <Button
            variant="ghost"
            onClick={step <= (eventType === "esclusivo" ? 1 : 2) ? () => handleOpenChange(false) : handlePrev}
            disabled={isSubmitting}
            data-testid="button-wizard-prev"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step <= (eventType === "esclusivo" ? 1 : 2) ? t("Annulla", "Cancel") : t("Indietro", "Back")}
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
