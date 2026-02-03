import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("Descrizione", "About")}</CardTitle>
              <CardDescription>
                {t("Testo descrittivo del locale nel footer", "Venue description text in the footer")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("Italiano", "Italian")}</Label>
              <Textarea
                value={formData.about.it}
                onChange={(e) => updateAbout("it", e.target.value)}
                rows={3}
                data-testid="input-about-it"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="flex-1">{t("Inglese", "English")}</Label>
                <TranslateButton
                  textIt={formData.about.it}
                  onTranslated={(text) => updateAbout("en", text)}
                  context="restaurant description for website footer"
                />
              </div>
              <Textarea
                value={formData.about.en}
                onChange={(e) => updateAbout("en", e.target.value)}
                rows={3}
                data-testid="input-about-en"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("Contatti", "Contacts")}</CardTitle>
              <CardDescription>
                {t("Indirizzo, telefono e email", "Address, phone and email")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("Indirizzo", "Address")}</Label>
            <Textarea
              value={formData.contacts.address}
              onChange={(e) => updateContacts("address", e.target.value)}
              rows={2}
              data-testid="input-address"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("Telefono", "Phone")}</Label>
              <Input
                type="tel"
                value={formData.contacts.phone}
                onChange={(e) => updateContacts("phone", e.target.value)}
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.contacts.email}
                onChange={(e) => updateContacts("email", e.target.value)}
                data-testid="input-email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{t("Orari", "Hours")}</CardTitle>
                <CardDescription>
                  {t("Giorni e orari di apertura", "Opening days and hours")}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addHoursEntry} data-testid="button-add-hours">
              <Plus className="h-4 w-4 mr-1" />
              {t("Aggiungi", "Add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.hours.map((entry, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 items-end p-3 border rounded-md">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("Giorno (IT)", "Day (IT)")}</Label>
                <Input
                  value={entry.dayKeyIt}
                  onChange={(e) => updateHours(index, "dayKeyIt", e.target.value)}
                  placeholder={t("es. Lunedì", "e.g. Monday")}
                  data-testid={`input-hours-day-it-${index}`}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground flex-1">{t("Giorno (EN)", "Day (EN)")}</Label>
                  <TranslateButton
                    textIt={entry.dayKeyIt}
                    onTranslated={(text) => updateHours(index, "dayKeyEn", text)}
                    context="day of week for restaurant opening hours"
                    size="icon"
                    className="h-6 w-6"
                  />
                </div>
                <Input
                  value={entry.dayKeyEn}
                  onChange={(e) => updateHours(index, "dayKeyEn", e.target.value)}
                  placeholder={t("es. Monday", "e.g. Monday")}
                  data-testid={`input-hours-day-en-${index}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("Orario", "Hours")}</Label>
                <Input
                  value={entry.hours}
                  onChange={(e) => updateHours(index, "hours", e.target.value)}
                  placeholder="18:00 - 02:00"
                  disabled={entry.isClosed}
                  data-testid={`input-hours-time-${index}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={entry.isClosed}
                  onCheckedChange={(checked) => updateHours(index, "isClosed", checked)}
                  data-testid={`switch-hours-closed-${index}`}
                />
                <Label className="text-xs">{t("Chiuso", "Closed")}</Label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeHoursEntry(index)}
                disabled={formData.hours.length <= 1}
                data-testid={`button-remove-hours-${index}`}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{t("Social", "Social")}</CardTitle>
                <CardDescription>
                  {t("Link ai profili social", "Social profile links")}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addSocialLink} data-testid="button-add-social">
              <Plus className="h-4 w-4 mr-1" />
              {t("Aggiungi", "Add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.social.map((link, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("Piattaforma", "Platform")}</Label>
                <Select
                  value={link.type}
                  onValueChange={(value) => updateSocial(index, "type", value)}
                >
                  <SelectTrigger data-testid={`select-social-type-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {socialTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateSocial(index, "url", e.target.value)}
                  placeholder="https://"
                  data-testid={`input-social-url-${index}`}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSocialLink(index)}
                data-testid={`button-remove-social-${index}`}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{t("Link Rapidi", "Quick Links")}</CardTitle>
                <CardDescription>
                  {t("Link utili nel footer", "Useful links in the footer")}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addQuickLink} data-testid="button-add-quicklink">
              <Plus className="h-4 w-4 mr-1" />
              {t("Aggiungi", "Add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.quickLinks.map((link, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("Etichetta (IT)", "Label (IT)")}</Label>
                <Input
                  value={link.labelIt}
                  onChange={(e) => updateQuickLink(index, "labelIt", e.target.value)}
                  data-testid={`input-quicklink-label-it-${index}`}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground flex-1">{t("Etichetta (EN)", "Label (EN)")}</Label>
                  <TranslateButton
                    textIt={link.labelIt}
                    onTranslated={(text) => updateQuickLink(index, "labelEn", text)}
                    context="navigation link label for restaurant website"
                    size="icon"
                    className="h-6 w-6"
                  />
                </div>
                <Input
                  value={link.labelEn}
                  onChange={(e) => updateQuickLink(index, "labelEn", e.target.value)}
                  data-testid={`input-quicklink-label-en-${index}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input
                  value={link.url}
                  onChange={(e) => updateQuickLink(index, "url", e.target.value)}
                  placeholder="/pagina"
                  data-testid={`input-quicklink-url-${index}`}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeQuickLink(index)}
                data-testid={`button-remove-quicklink-${index}`}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("Link Legali", "Legal Links")}</CardTitle>
              <CardDescription>
                {t("Privacy Policy e Cookie Policy", "Privacy Policy and Cookie Policy")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("Etichetta Privacy (IT)", "Privacy Label (IT)")}</Label>
              <Input
                value={formData.legalLinks.privacyLabelIt}
                onChange={(e) => updateLegalLinks("privacyLabelIt", e.target.value)}
                data-testid="input-privacy-label-it"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Etichetta Privacy (EN)", "Privacy Label (EN)")}</Label>
              <Input
                value={formData.legalLinks.privacyLabelEn}
                onChange={(e) => updateLegalLinks("privacyLabelEn", e.target.value)}
                data-testid="input-privacy-label-en"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Privacy</Label>
              <Input
                value={formData.legalLinks.privacyUrl}
                onChange={(e) => updateLegalLinks("privacyUrl", e.target.value)}
                placeholder="/privacy"
                data-testid="input-privacy-url"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("Etichetta Cookie (IT)", "Cookie Label (IT)")}</Label>
              <Input
                value={formData.legalLinks.cookieLabelIt}
                onChange={(e) => updateLegalLinks("cookieLabelIt", e.target.value)}
                data-testid="input-cookie-label-it"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Etichetta Cookie (EN)", "Cookie Label (EN)")}</Label>
              <Input
                value={formData.legalLinks.cookieLabelEn}
                onChange={(e) => updateLegalLinks("cookieLabelEn", e.target.value)}
                data-testid="input-cookie-label-en"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Cookie</Label>
              <Input
                value={formData.legalLinks.cookieUrl}
                onChange={(e) => updateLegalLinks("cookieUrl", e.target.value)}
                placeholder="/cookie"
                data-testid="input-cookie-url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          size="lg"
          data-testid="button-save-footer"
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t("Salva Impostazioni Footer", "Save Footer Settings")}
        </Button>
      </div>
    </div>
  );
}
