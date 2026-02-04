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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Save, Plus, Trash2, Globe, MapPin, Clock, Share2, Link as LinkIcon, FileText, Loader2 } from "lucide-react";
import { TranslateButton } from "./TranslateButton";
import type { FooterSettings, FooterHoursEntry, FooterSocialLink, FooterQuickLink } from "@shared/schema";
import { defaultFooterSettings } from "@shared/schema";

const socialTypes = ["instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok"] as const;

export function FooterSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: footerSettings, isLoading } = useQuery<FooterSettings>({
    queryKey: ["/api/admin/footer-settings"],
  });

  const [formData, setFormData] = useState<FooterSettings>(defaultFooterSettings);

  useEffect(() => {
    if (footerSettings) {
      setFormData(footerSettings);
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

  const updateHours = (index: number, field: keyof FooterHoursEntry, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      hours: prev.hours.map((h, i) => i === index ? { ...h, [field]: value } : h)
    }));
  };

  const addHoursEntry = () => {
    setFormData(prev => ({
      ...prev,
      hours: [...prev.hours, { dayKeyIt: "", dayKeyEn: "", hours: "", isClosed: false }]
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

  const updateQuickLink = (index: number, field: keyof FooterQuickLink, value: string) => {
    setFormData(prev => ({
      ...prev,
      quickLinks: prev.quickLinks.map((l, i) => i === index ? { ...l, [field]: value } : l)
    }));
  };

  const addQuickLink = () => {
    setFormData(prev => ({
      ...prev,
      quickLinks: [...prev.quickLinks, { labelIt: "", labelEn: "", url: "" }]
    }));
  };

  const removeQuickLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_, i) => i !== index)
    }));
  };

  const updateLegalLinks = (field: keyof typeof formData.legalLinks, value: string) => {
    setFormData(prev => ({
      ...prev,
      legalLinks: { ...prev.legalLinks, [field]: value }
    }));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Accordion type="multiple" defaultValue={["about", "contacts"]} className="space-y-2">
        <AccordionItem value="about" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">{t("Descrizione", "About")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("Italiano", "Italian")}</Label>
                <Textarea
                  value={formData.about.it}
                  onChange={(e) => updateAbout("it", e.target.value)}
                  rows={2}
                  className="text-sm"
                  data-testid="input-about-it"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-xs flex-1">{t("Inglese", "English")}</Label>
                  <TranslateButton
                    textIt={formData.about.it}
                    onTranslated={(text) => updateAbout("en", text)}
                    context="restaurant description for website footer"
                  />
                </div>
                <Textarea
                  value={formData.about.en}
                  onChange={(e) => updateAbout("en", e.target.value)}
                  rows={2}
                  className="text-sm"
                  data-testid="input-about-en"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="contacts" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">{t("Contatti", "Contacts")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t("Indirizzo", "Address")}</Label>
              <Textarea
                value={formData.contacts.address}
                onChange={(e) => updateContacts("address", e.target.value)}
                rows={2}
                className="text-sm"
                data-testid="input-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("Telefono", "Phone")}</Label>
                <Input
                  type="tel"
                  value={formData.contacts.phone}
                  onChange={(e) => updateContacts("phone", e.target.value)}
                  className="text-sm"
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
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
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">{t("Orari", "Hours")}</span>
              <span className="text-xs text-muted-foreground">({formData.hours.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-2">
            {formData.hours.map((entry, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 p-2 border rounded bg-muted/30">
                <Input
                  value={entry.dayKeyIt}
                  onChange={(e) => updateHours(index, "dayKeyIt", e.target.value)}
                  placeholder="IT"
                  className="w-24 text-xs h-8"
                  data-testid={`input-hours-day-it-${index}`}
                />
                <Input
                  value={entry.dayKeyEn}
                  onChange={(e) => updateHours(index, "dayKeyEn", e.target.value)}
                  placeholder="EN"
                  className="w-24 text-xs h-8"
                  data-testid={`input-hours-day-en-${index}`}
                />
                <TranslateButton
                  textIt={entry.dayKeyIt}
                  onTranslated={(text) => updateHours(index, "dayKeyEn", text)}
                  context="day of week"
                  size="icon"
                  className="h-8 w-8"
                />
                <Input
                  value={entry.hours}
                  onChange={(e) => updateHours(index, "hours", e.target.value)}
                  placeholder="18:00 - 02:00"
                  disabled={entry.isClosed}
                  className="w-28 text-xs h-8"
                  data-testid={`input-hours-time-${index}`}
                />
                <div className="flex items-center gap-1">
                  <Switch
                    checked={entry.isClosed}
                    onCheckedChange={(checked) => updateHours(index, "isClosed", checked)}
                    data-testid={`switch-hours-closed-${index}`}
                  />
                  <span className="text-xs">{t("Chiuso", "Closed")}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHoursEntry(index)}
                  disabled={formData.hours.length <= 1}
                  className="h-8 w-8 ml-auto"
                  data-testid={`button-remove-hours-${index}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addHoursEntry} className="w-full" data-testid="button-add-hours">
              <Plus className="h-3 w-3 mr-1" />
              {t("Aggiungi orario", "Add hours")}
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="social" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">Social</span>
              <span className="text-xs text-muted-foreground">({formData.social.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-2">
            {formData.social.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={link.type}
                  onValueChange={(value) => updateSocial(index, "type", value)}
                >
                  <SelectTrigger className="w-28 h-8 text-xs" data-testid={`select-social-type-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {socialTypes.map(type => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateSocial(index, "url", e.target.value)}
                  placeholder="https://"
                  className="flex-1 text-xs h-8"
                  data-testid={`input-social-url-${index}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSocialLink(index)}
                  className="h-8 w-8"
                  data-testid={`button-remove-social-${index}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addSocialLink} className="w-full" data-testid="button-add-social">
              <Plus className="h-3 w-3 mr-1" />
              {t("Aggiungi social", "Add social")}
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="quicklinks" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <LinkIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">{t("Link Rapidi", "Quick Links")}</span>
              <span className="text-xs text-muted-foreground">({formData.quickLinks.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-2">
            {formData.quickLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2 flex-wrap">
                <Input
                  value={link.labelIt}
                  onChange={(e) => updateQuickLink(index, "labelIt", e.target.value)}
                  placeholder="IT"
                  className="w-28 text-xs h-8"
                  data-testid={`input-quicklink-label-it-${index}`}
                />
                <Input
                  value={link.labelEn}
                  onChange={(e) => updateQuickLink(index, "labelEn", e.target.value)}
                  placeholder="EN"
                  className="w-28 text-xs h-8"
                  data-testid={`input-quicklink-label-en-${index}`}
                />
                <TranslateButton
                  textIt={link.labelIt}
                  onTranslated={(text) => updateQuickLink(index, "labelEn", text)}
                  context="navigation link label"
                  size="icon"
                  className="h-8 w-8"
                />
                <Input
                  value={link.url}
                  onChange={(e) => updateQuickLink(index, "url", e.target.value)}
                  placeholder="/url"
                  className="flex-1 min-w-20 text-xs h-8"
                  data-testid={`input-quicklink-url-${index}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuickLink(index)}
                  className="h-8 w-8"
                  data-testid={`button-remove-quicklink-${index}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addQuickLink} className="w-full" data-testid="button-add-quicklink">
              <Plus className="h-3 w-3 mr-1" />
              {t("Aggiungi link", "Add link")}
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="legal" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">{t("Link Legali", "Legal Links")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Privacy IT</Label>
                <Input
                  value={formData.legalLinks.privacyLabelIt}
                  onChange={(e) => updateLegalLinks("privacyLabelIt", e.target.value)}
                  className="text-xs h-8"
                  data-testid="input-privacy-label-it"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Privacy EN</Label>
                <Input
                  value={formData.legalLinks.privacyLabelEn}
                  onChange={(e) => updateLegalLinks("privacyLabelEn", e.target.value)}
                  className="text-xs h-8"
                  data-testid="input-privacy-label-en"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">URL</Label>
                <Input
                  value={formData.legalLinks.privacyUrl}
                  onChange={(e) => updateLegalLinks("privacyUrl", e.target.value)}
                  placeholder="/privacy"
                  className="text-xs h-8"
                  data-testid="input-privacy-url"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Cookie IT</Label>
                <Input
                  value={formData.legalLinks.cookieLabelIt}
                  onChange={(e) => updateLegalLinks("cookieLabelIt", e.target.value)}
                  className="text-xs h-8"
                  data-testid="input-cookie-label-it"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cookie EN</Label>
                <Input
                  value={formData.legalLinks.cookieLabelEn}
                  onChange={(e) => updateLegalLinks("cookieLabelEn", e.target.value)}
                  className="text-xs h-8"
                  data-testid="input-cookie-label-en"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">URL</Label>
                <Input
                  value={formData.legalLinks.cookieUrl}
                  onChange={(e) => updateLegalLinks("cookieUrl", e.target.value)}
                  placeholder="/cookie"
                  className="text-xs h-8"
                  data-testid="input-cookie-url"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="sticky bottom-0 py-4 bg-background border-t mt-4">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="w-full"
          data-testid="button-save-footer"
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t("Salva Impostazioni", "Save Settings")}
        </Button>
      </div>
    </div>
  );
}
