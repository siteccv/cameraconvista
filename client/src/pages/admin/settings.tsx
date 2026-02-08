import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lock, Save, Eye, EyeOff, FileText, ChevronLeft, RefreshCw } from "lucide-react";
import { FooterSettingsForm } from "@/components/admin/FooterSettingsForm";

type SettingsSection = "main" | "password" | "footer";

export default function AdminSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>("main");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const response = await apiRequest("POST", "/api/admin/sync/all");
      const data = await response.json();
      
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/menu-items"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/wines"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/cocktails"] });
        toast({
          title: t("Successo", "Success"),
          description: t("Sincronizzazione completata con successo", "Synchronization completed successfully"),
        });
      } else {
        throw new Error(data.error || "Sync failed");
      }
    } catch (error) {
      toast({
        title: t("Errore", "Error"),
        description: t("Errore durante la sincronizzazione", "Error during synchronization"),
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

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

    if (newPassword.length < 4) {
      toast({
        title: t("Errore", "Error"),
        description: t("La password deve essere di almeno 4 caratteri", "Password must be at least 4 characters"),
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
              {t("Modifica la password di accesso all'area admin", "Change the admin area access password")}
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
                  <Label htmlFor="newPassword">
                    {t("Nuova Password", "New Password")}
                  </Label>
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
                  {isLoading ? t("Salvataggio...", "Saving...") : t("Salva Password", "Save Password")}
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
              {t("Gestisci i contenuti del footer del sito pubblico", "Manage the public site footer content")}
            </p>
          </div>

          <FooterSettingsForm />
        </div>
      </AdminLayout>
    );
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
                <CardTitle className="text-base mb-0.5">{t("Password Admin", "Admin Password")}</CardTitle>
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
                <CardTitle className="text-base mb-0.5">{t("Impostazioni Footer", "Footer Settings")}</CardTitle>
                <CardDescription className="text-sm">
                  {t("Descrizione, contatti, orari, social e link", "Description, contacts, hours, social and links")}
                </CardDescription>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground rotate-180 flex-shrink-0" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate transition-all"
            onClick={handleSyncAll}
            data-testid="card-sync-section"
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw className={`h-6 w-6 text-primary ${isSyncing ? "animate-spin" : ""}`} />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base mb-0.5">{t("Sincronizzazione Google Sheets", "Google Sheets Sync")}</CardTitle>
                <CardDescription className="text-sm">
                  {t("Aggiorna Menu, Vini e Cocktail dai fogli Google", "Update Menu, Wines and Cocktails from Google Sheets")}
                </CardDescription>
              </div>
              <div className="text-xs font-medium text-primary uppercase flex-shrink-0">
                {isSyncing ? t("Sincronizzando...", "Syncing...") : t("Sincronizza", "Sync Now")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
