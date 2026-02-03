import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Save, Eye, EyeOff } from "lucide-react";

export default function AdminSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
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

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl" data-testid="text-settings-title">
            {t("Impostazioni", "Settings")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Gestisci le impostazioni del pannello admin", "Manage admin panel settings")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{t("Cambia Password", "Change Password")}</CardTitle>
                <CardDescription>
                  {t("Modifica la password di accesso all'area admin", "Change the admin area access password")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  {t("Password Attuale", "Current Password")}
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    data-testid="input-current-password"
                  />
                </div>
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
                  {showPasswords ? t("Nascondi password", "Hide passwords") : t("Mostra password", "Show passwords")}
                </button>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
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
