import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Lock,
  Save,
  Eye,
  EyeOff,
  FileText,
  ChevronLeft,
  Link2,
  ShieldCheck,
  Globe,
  MessageCircle,
  CalendarCheck,
} from "lucide-react";
import { FooterSettingsForm } from "@/components/admin/FooterSettingsForm";
import { DEFAULT_COLLI_BOOKING_SETTINGS, type ColliBookingSettings } from "@shared/colli";
import { defaultBookingSettings, type BookingSettings } from "@shared/schema";

type SettingsSection = "main" | "password" | "footer" | "site-links" | "colli-booking" | "booking";

interface SiteLinks {
  adminSiteUrl: string;
  publicSiteUrl: string;
}

export default function AdminSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>("main");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: t("Errore", "Error"),
        description: t("Le password non coincidono", "Passwords do not match"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 10) {
      toast({
        title: t("Errore", "Error"),
        description: t(
          "La password deve essere di almeno 10 caratteri",
          "Password must be at least 10 characters",
        ),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/admin/change-password", {
        currentPassword,
        newPassword,
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: t("Successo", "Success"),
          description: t("Password modificata con successo", "Password changed successfully"),
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setActiveSection("main");
      } else {
        toast({
          title: t("Errore", "Error"),
          description: t("Password attuale non corretta", "Current password is incorrect"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("Errore", "Error"),
        description: t("Si è verificato un errore", "An error occurred"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (activeSection === "password") {
    return (
      <AdminLayout>
        <div className="p-4 md:p-6 max-w-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection("main")}
            className="mb-4 -ml-2"
            data-testid="button-back-to-settings"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("Indietro", "Back")}
          </Button>

          <div className="mb-6">
            <h1 className="font-display text-2xl" data-testid="text-password-title">
              {t("Cambia Password", "Change Password")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t(
                "Modifica la password di accesso all'area admin",
                "Change the admin area access password",
              )}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    {t("Password Attuale", "Current Password")}
                  </Label>
                  <Input
                    id="currentPassword"
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    data-testid="input-current-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("Nuova Password", "New Password")}</Label>
                  <Input
                    id="newPassword"
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t("Conferma Nuova Password", "Confirm New Password")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPasswords ? t("Nascondi", "Hide") : t("Mostra", "Show")}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full"
                  data-testid="button-save-password"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading
                    ? t("Salvataggio...", "Saving...")
                    : t("Salva Password", "Save Password")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (activeSection === "footer") {
    return (
      <AdminLayout>
        <div className="p-4 md:p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection("main")}
            className="mb-4 -ml-2"
            data-testid="button-back-to-settings"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("Indietro", "Back")}
          </Button>

          <div className="mb-6">
            <h1 className="font-display text-2xl" data-testid="text-footer-settings-title">
              {t("Impostazioni Footer", "Footer Settings")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t(
                "Gestisci i contenuti del footer del sito pubblico",
                "Manage the public site footer content",
              )}
            </p>
          </div>

          <FooterSettingsForm />
        </div>
      </AdminLayout>
    );
  }

  if (activeSection === "site-links") {
    return <SiteLinksSection onBack={() => setActiveSection("main")} />;
  }

  if (activeSection === "colli-booking") {
    return <ColliBookingSection onBack={() => setActiveSection("main")} />;
  }

  if (activeSection === "booking") {
    return <BookingSection onBack={() => setActiveSection("main")} />;
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl" data-testid="text-settings-title">
            {t("Impostazioni", "Settings")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("Gestisci le impostazioni del pannello admin", "Manage admin panel settings")}
          </p>
        </div>

        <div className="space-y-3">
          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setActiveSection("password")}
            data-testid="card-password-section"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-0.5">
                  {t("Password Admin", "Admin Password")}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t("Modifica la password di accesso", "Change the access password")}
                </CardDescription>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 flex-shrink-0" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setActiveSection("footer")}
            data-testid="card-footer-section"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-0.5">
                  {t("Impostazioni Footer", "Footer Settings")}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t(
                    "Descrizione, contatti, orari, social e link",
                    "Description, contacts, hours, social and links",
                  )}
                </CardDescription>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 flex-shrink-0" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setActiveSection("booking")}
            data-testid="card-booking-section"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-0.5">
                  {t("Prenota un Tavolo", "Book a Table")}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t(
                    "Link del pulsante Prenota un tavolo del sito",
                    "Link for the site's Book a table button",
                  )}
                </CardDescription>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 flex-shrink-0" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setActiveSection("site-links")}
            data-testid="card-site-links-section"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-0.5">{t("Link Sito", "Site Links")}</CardTitle>
                <CardDescription className="text-sm">
                  {t("URL del sito admin e sito pubblico", "Admin site and public site URLs")}
                </CardDescription>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 flex-shrink-0" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover-elevate transition-all"
            onClick={() => setActiveSection("colli-booking")}
            data-testid="card-colli-booking-section"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-0.5">
                  {t("Prenotazione Colli", "Colli Booking")}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t("Numero WhatsApp del pulsante Prenota", "WhatsApp number for the Book button")}
                </CardDescription>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 flex-shrink-0" />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function SiteLinksSection({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [adminUrl, setAdminUrl] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: siteLinks, isLoading } = useQuery<SiteLinks>({
    queryKey: ["/api/admin/site-links"],
  });

  useEffect(() => {
    if (siteLinks) {
      setAdminUrl(siteLinks.adminSiteUrl || "");
      setPublicUrl(siteLinks.publicSiteUrl || "");
    }
  }, [siteLinks]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await apiRequest("PUT", "/api/admin/site-links", {
        adminSiteUrl: adminUrl.trim(),
        publicSiteUrl: publicUrl.trim(),
      });
      const data = await response.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/site-links"] });
        toast({
          title: t("Salvato", "Saved"),
          description: t("Link del sito aggiornati", "Site links updated"),
        });
      }
    } catch {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile salvare i link", "Failed to save links"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 -ml-2"
          data-testid="button-back-to-settings"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("Indietro", "Back")}
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-2xl" data-testid="text-site-links-title">
            {t("Link Sito", "Site Links")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(
              "Configura gli URL per i pulsanti nella barra laterale",
              "Configure URLs for the sidebar buttons",
            )}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="adminSiteUrl" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {t("URL Sito Admin", "Admin Site URL")}
                </Label>
                <Input
                  id="adminSiteUrl"
                  type="url"
                  placeholder="https://admin.example.com"
                  value={adminUrl}
                  onChange={(e) => setAdminUrl(e.target.value)}
                  data-testid="input-admin-site-url"
                />
                <p className="text-xs text-muted-foreground">
                  {t(
                    "URL del pannello admin sul sito di produzione",
                    "URL of the admin panel on the production site",
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicSiteUrl" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  {t("URL Sito Pubblico", "Public Site URL")}
                </Label>
                <Input
                  id="publicSiteUrl"
                  type="url"
                  placeholder="https://www.example.com"
                  value={publicUrl}
                  onChange={(e) => setPublicUrl(e.target.value)}
                  data-testid="input-public-site-url"
                />
                <p className="text-xs text-muted-foreground">
                  {t(
                    "URL del sito pubblico visibile ai clienti",
                    "URL of the public site visible to customers",
                  )}
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSaving || isLoading}
                className="w-full"
                data-testid="button-save-site-links"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? t("Salvataggio...", "Saving...") : t("Salva Link", "Save Links")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function ColliBookingSection({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(DEFAULT_COLLI_BOOKING_SETTINGS.phoneNumber);
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings, isLoading } = useQuery<ColliBookingSettings>({
    queryKey: ["/api/admin/colli-booking-settings"],
  });

  useEffect(() => {
    if (settings) {
      setPhoneNumber(settings.phoneNumber || DEFAULT_COLLI_BOOKING_SETTINGS.phoneNumber);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await apiRequest("PUT", "/api/admin/colli-booking-settings", {
        phoneNumber: phoneNumber.trim(),
      });
      const data = await response.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/colli-booking-settings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/colli-booking-settings"] });
        setPhoneNumber(data.data.phoneNumber);
        toast({
          title: t("Salvato", "Saved"),
          description: t("Numero prenotazioni Colli aggiornato", "Colli booking number updated"),
        });
      }
    } catch {
      toast({
        title: t("Errore", "Error"),
        description: t(
          "Inserisci un numero WhatsApp valido, ad esempio +393335345751",
          "Enter a valid WhatsApp number, for example +393335345751",
        ),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 -ml-2"
          data-testid="button-back-to-settings"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("Indietro", "Back")}
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-2xl" data-testid="text-colli-booking-title">
            {t("Prenotazione Colli", "Colli Booking")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(
              "Configura il numero WhatsApp usato dal pulsante Prenota nella pagina Colli",
              "Configure the WhatsApp number used by the Book button on the Colli page",
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Numero WhatsApp", "WhatsApp Number")}</CardTitle>
            <CardDescription>
              {t(
                "Questa impostazione modifica solo la vetrina /colli. Non cambia il menu digitale o l'admin Colli.",
                "This setting only changes the /colli showcase. It does not change the digital menu or Colli admin.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="colliBookingPhone" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {t("Telefono prenotazioni", "Booking phone")}
                </Label>
                <Input
                  id="colliBookingPhone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+393335345751"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  data-testid="input-colli-booking-phone"
                />
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Il link WhatsApp viene generato automaticamente dal numero salvato.",
                    "The WhatsApp link is generated automatically from the saved number.",
                  )}
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSaving || isLoading || !phoneNumber.trim()}
                className="w-full"
                data-testid="button-save-colli-booking"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? t("Salvataggio...", "Saving...") : t("Salva Numero", "Save Number")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function BookingSection({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bookingUrl, setBookingUrl] = useState(defaultBookingSettings.bookingUrl);
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings, isLoading } = useQuery<BookingSettings>({
    queryKey: ["/api/admin/booking-settings"],
  });

  useEffect(() => {
    if (settings) {
      setBookingUrl(settings.bookingUrl || defaultBookingSettings.bookingUrl);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await apiRequest("PUT", "/api/admin/booking-settings", {
        bookingUrl: bookingUrl.trim(),
      });
      const data = await response.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/booking-settings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/booking-settings"] });
        setBookingUrl(data.data.bookingUrl);
        toast({
          title: t("Salvato", "Saved"),
          description: t("Link prenotazione aggiornato", "Booking link updated"),
        });
      }
    } catch {
      toast({
        title: t("Errore", "Error"),
        description: t(
          "Inserisci un URL valido, ad esempio https://rsvp-p91d.onrender.com",
          "Enter a valid URL, for example https://rsvp-p91d.onrender.com",
        ),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 -ml-2"
          data-testid="button-back-to-settings"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("Indietro", "Back")}
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-2xl" data-testid="text-booking-title">
            {t("Prenota un Tavolo", "Book a Table")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(
              "Configura il link aperto dal pulsante Prenota un tavolo in tutto il sito",
              "Configure the link opened by the Book a table button across the site",
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Link prenotazione", "Booking link")}</CardTitle>
            <CardDescription>
              {t(
                "Questo link vale per tutto il sito Camera con Vista. Non riguarda la sezione Colli, che ha la sua impostazione dedicata.",
                "This link applies to the whole Camera con Vista site. It does not affect the Colli section, which has its own dedicated setting.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="bookingUrl" className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  {t("URL Prenotazione", "Booking URL")}
                </Label>
                <Input
                  id="bookingUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://rsvp-p91d.onrender.com"
                  value={bookingUrl}
                  onChange={(e) => setBookingUrl(e.target.value)}
                  data-testid="input-booking-url"
                />
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Il pulsante Prenota un tavolo aprirà questo indirizzo in una nuova scheda.",
                    "The Book a table button will open this address in a new tab.",
                  )}
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSaving || isLoading || !bookingUrl.trim()}
                className="w-full"
                data-testid="button-save-booking"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? t("Salvataggio...", "Saving...") : t("Salva Link", "Save Link")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
