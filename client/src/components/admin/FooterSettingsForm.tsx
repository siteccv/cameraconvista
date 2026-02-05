import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Save, Plus, Trash2, Globe, MapPin, Clock, Share2, FileText, Loader2 } from "lucide-react";
import { TranslateButton } from "./TranslateButton";
import type { FooterSettings, FooterHoursEntry, FooterSocialLink } from "@shared/schema";
import { defaultFooterSettings } from "@shared/schema";

const socialTypes = ["instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok"] as const;

const daysOfWeek = [
  { it: "Lunedì", en: "Monday", index: 0 },
  { it: "Martedì", en: "Tuesday", index: 1 },
  { it: "Mercoledì", en: "Wednesday", index: 2 },
  { it: "Giovedì", en: "Thursday", index: 3 },
  { it: "Venerdì", en: "Friday", index: 4 },
  { it: "Sabato", en: "Saturday", index: 5 },
  { it: "Domenica", en: "Sunday", index: 6 },
];

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
  
  // Couldn't parse - return empty (will show as empty selection)
  return [];
}

const timeSlots = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
  "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
];

export function FooterSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: footerSettings, isLoading } = useQuery<FooterSettings>({
    queryKey: ["/api/admin/footer-settings"],
  });

  const [formData, setFormData] = useState<FooterSettings>(defaultFooterSettings);

  useEffect(() => {
    if (footerSettings) {
      // Migrate old format to new format if needed
      const migratedHours = footerSettings.hours.map(entry => {
        // Check if it's old format (has dayKeyIt/dayKeyEn)
        if ('dayKeyIt' in entry && !('selectedDays' in entry)) {
          const oldEntry = entry as unknown as { dayKeyIt: string; dayKeyEn: string; hours: string; isClosed: boolean };
          // Parse old day string (single day or range) into index array
          const selectedDays = parseLegacyDayString(oldEntry.dayKeyIt);
          return {
            selectedDays,
            hours: oldEntry.hours,
            isClosed: oldEntry.isClosed
          };
        }
        return entry;
      });
      setFormData({ ...footerSettings, hours: migratedHours });
    }
  }, [footerSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: FooterSettings) => {
      const response = await apiRequest("PUT", "/api/admin/footer-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/footer-settings"] });
      toast({
        title: t("Salvato", "Saved"),
        description: t("Le impostazioni del footer sono state salvate.", "Footer settings have been saved."),
      });
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile salvare le impostazioni.", "Failed to save settings."),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const updateAbout = (lang: "it" | "en", value: string) => {
    setFormData(prev => ({
      ...prev,
      about: { ...prev.about, [lang]: value }
    }));
  };

  const updateContacts = (field: keyof typeof formData.contacts, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: { ...prev.contacts, [field]: value }
    }));
  };

  const toggleDaySelection = (entryIndex: number, dayIndex: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      hours: prev.hours.map((h, i) => {
        if (i !== entryIndex) return h;
        const currentDays = h.selectedDays || [];
        const newDays = checked 
          ? [...currentDays, dayIndex].sort((a, b) => a - b)
          : currentDays.filter(d => d !== dayIndex);
        return { ...h, selectedDays: newDays };
      })
    }));
  };

  const updateHoursEntry = (index: number, field: keyof FooterHoursEntry, value: string | boolean | number[]) => {
    setFormData(prev => ({
      ...prev,
      hours: prev.hours.map((h, i) => i === index ? { ...h, [field]: value } : h)
    }));
  };

  const updateTimeRange = (index: number, openTime: string, closeTime: string) => {
    const hoursValue = `${openTime} - ${closeTime}`;
    setFormData(prev => ({
      ...prev,
      hours: prev.hours.map((h, i) => i === index ? { ...h, hours: hoursValue } : h)
    }));
  };

  const parseTimeRange = (hours: string): { open: string; close: string; isValid: boolean } => {
    const parts = hours.split(" - ");
    const open = parts[0]?.trim() || "";
    const close = parts[1]?.trim() || "";
    const isValid = timeSlots.includes(open) && timeSlots.includes(close);
    return { open: open || "18:00", close: close || "02:00", isValid };
  };

  const addHoursEntry = () => {
    setFormData(prev => ({
      ...prev,
      hours: [...prev.hours, { selectedDays: [], hours: "18:00 - 02:00", isClosed: false }]
    }));
  };

  const removeHoursEntry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hours: prev.hours.filter((_, i) => i !== index)
    }));
  };

  const updateSocial = (index: number, field: keyof FooterSocialLink, value: string) => {
    setFormData(prev => ({
      ...prev,
      social: prev.social.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      social: [...prev.social, { type: "instagram", url: "" }]
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social: prev.social.filter((_, i) => i !== index)
    }));
  };

  const updateLegalLinks = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      legalLinks: { ...prev.legalLinks, [field]: value }
    }));
  };

  const handleTranslateAbout = (translation: string) => {
    updateAbout("en", translation);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getSelectedDaysLabel = (selectedDays: number[]) => {
    if (selectedDays.length === 0) return t("Nessun giorno", "No days");
    if (selectedDays.length === 7) return t("Tutti i giorni", "Every day");
    return selectedDays.map(i => daysOfWeek[i]?.it.substring(0, 3)).join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("Impostazioni Footer", "Footer Settings")}</h2>
        <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-footer">
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t("Salva", "Save")}
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["about", "contacts", "hours", "social", "legal"]} className="space-y-2">
        <AccordionItem value="about" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t("Chi Siamo", "About Us")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label className="text-sm">{t("Italiano", "Italian")}</Label>
              <Textarea 
                value={formData.about.it}
                onChange={(e) => updateAbout("it", e.target.value)}
                rows={3}
                className="text-sm"
                data-testid="textarea-about-it"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t("Inglese", "English")}</Label>
                <TranslateButton 
                  textIt={formData.about.it} 
                  onTranslated={handleTranslateAbout}
                />
              </div>
              <Textarea 
                value={formData.about.en}
                onChange={(e) => updateAbout("en", e.target.value)}
                rows={3}
                className="text-sm"
                data-testid="textarea-about-en"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contacts" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t("Contatti", "Contacts")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label className="text-sm">{t("Indirizzo", "Address")}</Label>
              <Textarea 
                value={formData.contacts.address}
                onChange={(e) => updateContacts("address", e.target.value)}
                rows={2}
                className="text-sm"
                data-testid="textarea-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{t("Telefono", "Phone")}</Label>
                <Input 
                  value={formData.contacts.phone}
                  onChange={(e) => updateContacts("phone", e.target.value)}
                  className="text-sm"
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input 
                  value={formData.contacts.email}
                  onChange={(e) => updateContacts("email", e.target.value)}
                  className="text-sm"
                  data-testid="input-email"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="hours" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t("Orari", "Hours")} ({formData.hours.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {formData.hours.map((entry, index) => {
              const timeRange = parseTimeRange(entry.hours);
              const selectedDays = entry.selectedDays || [];
              return (
                <div key={index} className="p-3 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {getSelectedDaysLabel(selectedDays)}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeHoursEntry(index)}
                      className="h-7 w-7 bg-white text-primary border-primary/20 hover:bg-primary/5"
                      data-testid={`button-remove-hours-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <label 
                        key={day.index} 
                        className="flex items-center gap-1.5 text-xs cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedDays.includes(day.index)}
                          onCheckedChange={(checked) => toggleDaySelection(index, day.index, !!checked)}
                          data-testid={`checkbox-day-${index}-${day.index}`}
                        />
                        <span>{day.it.substring(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!entry.isClosed && (
                      timeRange.isValid ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Select
                            value={timeRange.open}
                            onValueChange={(val) => updateTimeRange(index, val, timeRange.close)}
                          >
                            <SelectTrigger className="w-24 h-9 text-sm" data-testid={`select-hours-open-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time} className="text-sm">{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-muted-foreground text-sm">-</span>
                          <Select
                            value={timeRange.close}
                            onValueChange={(val) => updateTimeRange(index, timeRange.open, val)}
                          >
                            <SelectTrigger className="w-24 h-9 text-sm" data-testid={`select-hours-close-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time} className="text-sm">{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <Input
                          value={entry.hours}
                          onChange={(e) => updateHoursEntry(index, "hours", e.target.value)}
                          placeholder="18:00 - 02:00"
                          className="flex-1 h-9 text-sm"
                          data-testid={`input-hours-custom-${index}`}
                        />
                      )
                    )}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <Switch
                        checked={entry.isClosed}
                        onCheckedChange={(checked) => updateHoursEntry(index, "isClosed", checked)}
                        data-testid={`switch-hours-closed-${index}`}
                      />
                      <span className="text-sm text-muted-foreground">{t("Chiuso", "Closed")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={addHoursEntry} className="w-full" data-testid="button-add-hours">
              <Plus className="h-3 w-3 mr-1" />
              {t("Aggiungi orario", "Add hours")}
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="social" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t("Social", "Social")} ({formData.social.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {formData.social.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={link.type}
                  onValueChange={(val) => updateSocial(index, "type", val)}
                >
                  <SelectTrigger className="w-32 h-9 text-sm" data-testid={`select-social-type-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {socialTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize text-sm">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={link.url}
                  onChange={(e) => updateSocial(index, "url", e.target.value)}
                  placeholder="https://..."
                  className="flex-1 h-9 text-sm"
                  data-testid={`input-social-url-${index}`}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeSocialLink(index)}
                  className="h-9 w-9 bg-white text-primary border-primary/20 hover:bg-primary/5"
                  data-testid={`button-remove-social-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSocialLink} className="w-full" data-testid="button-add-social">
              <Plus className="h-3 w-3 mr-1" />
              {t("Aggiungi social", "Add social")}
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="legal" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t("Link Legali", "Legal Links")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">URL Privacy</Label>
                <Input 
                  value={formData.legalLinks.privacyUrl}
                  onChange={(e) => updateLegalLinks("privacyUrl", e.target.value)}
                  className="text-sm"
                  data-testid="input-privacy-url"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("Label IT", "Label IT")}</Label>
                <Input 
                  value={formData.legalLinks.privacyLabelIt}
                  onChange={(e) => updateLegalLinks("privacyLabelIt", e.target.value)}
                  className="text-sm"
                  data-testid="input-privacy-label-it"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("Label EN", "Label EN")}</Label>
                <Input 
                  value={formData.legalLinks.privacyLabelEn}
                  onChange={(e) => updateLegalLinks("privacyLabelEn", e.target.value)}
                  className="text-sm"
                  data-testid="input-privacy-label-en"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">URL Cookie</Label>
                <Input 
                  value={formData.legalLinks.cookieUrl}
                  onChange={(e) => updateLegalLinks("cookieUrl", e.target.value)}
                  className="text-sm"
                  data-testid="input-cookie-url"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("Label IT", "Label IT")}</Label>
                <Input 
                  value={formData.legalLinks.cookieLabelIt}
                  onChange={(e) => updateLegalLinks("cookieLabelIt", e.target.value)}
                  className="text-sm"
                  data-testid="input-cookie-label-it"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t("Label EN", "Label EN")}</Label>
                <Input 
                  value={formData.legalLinks.cookieLabelEn}
                  onChange={(e) => updateLegalLinks("cookieLabelEn", e.target.value)}
                  className="text-sm"
                  data-testid="input-cookie-label-en"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
