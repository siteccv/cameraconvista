import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, Image, Settings, RefreshCw, UtensilsCrossed, Wine, Martini } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [syncingMenu, setSyncingMenu] = useState(false);
  const [syncingWines, setSyncingWines] = useState(false);
  const [syncingCocktails, setSyncingCocktails] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  const handleSyncMenu = async () => {
    setSyncingMenu(true);
    try {
      const res = await apiRequest("POST", "/api/admin/sync/menu");
      const data = await res.json();
      if (data.success) {
        toast({ title: t("Sincronizzazione completata", "Sync completed"), description: t(`${data.count} voci del menù sincronizzate`, `${data.count} menu items synced`) });
        queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      } else {
        toast({ title: t("Errore", "Error"), description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: t("Errore", "Error"), description: t("Sincronizzazione fallita", "Sync failed"), variant: "destructive" });
    } finally {
      setSyncingMenu(false);
    }
  };

  const handleSyncWines = async () => {
    setSyncingWines(true);
    try {
      const res = await apiRequest("POST", "/api/admin/sync/wines");
      const data = await res.json();
      if (data.success) {
        toast({ title: t("Sincronizzazione completata", "Sync completed"), description: t(`${data.count} vini sincronizzati`, `${data.count} wines synced`) });
        queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
      } else {
        toast({ title: t("Errore", "Error"), description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: t("Errore", "Error"), description: t("Sincronizzazione fallita", "Sync failed"), variant: "destructive" });
    } finally {
      setSyncingWines(false);
    }
  };

  const handleSyncCocktails = async () => {
    setSyncingCocktails(true);
    try {
      const res = await apiRequest("POST", "/api/admin/sync/cocktails");
      const data = await res.json();
      if (data.success) {
        toast({ title: t("Sincronizzazione completata", "Sync completed"), description: t(`${data.count} cocktail sincronizzati`, `${data.count} cocktails synced`) });
        queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
      } else {
        toast({ title: t("Errore", "Error"), description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: t("Errore", "Error"), description: t("Sincronizzazione fallita", "Sync failed"), variant: "destructive" });
    } finally {
      setSyncingCocktails(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await apiRequest("POST", "/api/admin/sync/all");
      const data = await res.json();
      if (data.success) {
        const totalCount = (data.menu?.count || 0) + (data.wines?.count || 0) + (data.cocktails?.count || 0);
        toast({ title: t("Sincronizzazione completata", "Sync completed"), description: t(`${totalCount} elementi sincronizzati`, `${totalCount} items synced`) });
        queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
      } else {
        toast({ title: t("Errore", "Error"), description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: t("Errore", "Error"), description: t("Sincronizzazione fallita", "Sync failed"), variant: "destructive" });
    } finally {
      setSyncingAll(false);
    }
  };

  const stats = [
    {
      icon: FileText,
      labelIt: "Sezioni",
      labelEn: "Sections",
      value: "8",
      descriptionIt: "Pagine gestite",
      descriptionEn: "Managed pages",
    },
    {
      icon: Calendar,
      labelIt: "Eventi",
      labelEn: "Events",
      value: "0",
      descriptionIt: "Pubblicati",
      descriptionEn: "Published",
    },
    {
      icon: Image,
      labelIt: "Media",
      labelEn: "Media",
      value: "0",
      descriptionIt: "File caricati",
      descriptionEn: "Files uploaded",
    },
    {
      icon: Settings,
      labelIt: "Ultimo aggiornamento",
      labelEn: "Last update",
      value: "-",
      descriptionIt: "Sito non ancora pubblicato",
      descriptionEn: "Site not yet published",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Benvenuto nel pannello di amministrazione di Camera con Vista", "Welcome to the Camera con Vista admin panel")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} data-testid={`card-stat-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(stat.labelIt, stat.labelEn)}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {t(stat.descriptionIt, stat.descriptionEn)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("Attività Recenti", "Recent Activity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {t("Nessuna attività recente", "No recent activity")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("Sincronizzazione Google Sheets", "Google Sheets Sync")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm mb-4">
                {t(
                  "Sincronizza i dati dal foglio Google per aggiornare menù, vini e cocktail.",
                  "Sync data from Google Sheets to update menu, wines, and cocktails."
                )}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncMenu}
                  disabled={syncingMenu || syncingAll}
                  data-testid="button-sync-menu"
                >
                  {syncingMenu ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <UtensilsCrossed className="h-4 w-4 mr-2" />}
                  {t("Menù", "Menu")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncWines}
                  disabled={syncingWines || syncingAll}
                  data-testid="button-sync-wines"
                >
                  {syncingWines ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Wine className="h-4 w-4 mr-2" />}
                  {t("Vini", "Wines")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncCocktails}
                  disabled={syncingCocktails || syncingAll}
                  data-testid="button-sync-cocktails"
                >
                  {syncingCocktails ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Martini className="h-4 w-4 mr-2" />}
                  {t("Cocktail", "Cocktails")}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSyncAll}
                  disabled={syncingMenu || syncingWines || syncingCocktails || syncingAll}
                  data-testid="button-sync-all"
                >
                  {syncingAll ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  {t("Tutto", "All")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
