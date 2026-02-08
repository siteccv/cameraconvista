import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw, Upload, UtensilsCrossed, Wine, GlassWater, Settings, Save, Plus, Trash2, Check } from "lucide-react";

type SyncTarget = "menu" | "wines" | "cocktails";

interface GoogleSheetsConfig {
  menu: {
    syncUrl: string;
  };
  wines: {
    categories: { category: string; syncUrl: string }[];
  };
  cocktails: {
    syncUrl: string;
  };
}

interface PublishStatus {
  menu: { publishedAt: string; count: number } | null;
  wines: { publishedAt: string; count: number } | null;
  cocktails: { publishedAt: string; count: number } | null;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminSyncGoogle() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [syncingTarget, setSyncingTarget] = useState<SyncTarget | null>(null);
  const [publishingTarget, setPublishingTarget] = useState<SyncTarget | null>(null);
  const [confirmPublish, setConfirmPublish] = useState<SyncTarget | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [editConfig, setEditConfig] = useState<GoogleSheetsConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configDirty, setConfigDirty] = useState(false);

  const { data: publishStatus } = useQuery<PublishStatus>({
    queryKey: ["/api/admin/sync/publish-status"],
  });

  const { data: sheetsConfig } = useQuery<GoogleSheetsConfig>({
    queryKey: ["/api/admin/sync/sheets-config"],
  });

  useEffect(() => {
    if (sheetsConfig && !editConfig) {
      setEditConfig(JSON.parse(JSON.stringify(sheetsConfig)));
    }
  }, [sheetsConfig]);

  const handleSync = async (target: SyncTarget) => {
    setSyncingTarget(target);
    try {
      const response = await apiRequest("POST", `/api/admin/sync/${target}`);
      const data = await response.json();

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/menu-items`] });
        queryClient.invalidateQueries({ queryKey: [`/api/admin/wines`] });
        queryClient.invalidateQueries({ queryKey: [`/api/admin/cocktails`] });
        const labels: Record<SyncTarget, string> = {
          menu: t("Menù", "Menu"),
          wines: t("Vini", "Wines"),
          cocktails: t("Cocktail", "Cocktails"),
        };
        toast({
          title: t("Sincronizzazione completata", "Sync completed"),
          description: `${labels[target]}: ${data.count} ${t("elementi aggiornati", "items updated")}`,
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
      setSyncingTarget(null);
    }
  };

  const handlePublish = async (target: SyncTarget) => {
    setConfirmPublish(null);
    setPublishingTarget(target);
    try {
      const response = await apiRequest("POST", `/api/admin/sync/publish-${target}`);
      const data = await response.json();

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cocktails"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sync/publish-status"] });
        const labels: Record<SyncTarget, string> = {
          menu: t("Menù", "Menu"),
          wines: t("Vini", "Wines"),
          cocktails: t("Cocktail", "Cocktails"),
        };
        toast({
          title: t("Pubblicazione completata", "Publication completed"),
          description: `${labels[target]}: ${data.count} ${t("elementi pubblicati online", "items published online")}`,
        });
      } else {
        throw new Error(data.error || "Publish failed");
      }
    } catch (error) {
      toast({
        title: t("Errore", "Error"),
        description: t("Errore durante la pubblicazione", "Error during publication"),
        variant: "destructive",
      });
    } finally {
      setPublishingTarget(null);
    }
  };

  const handleSaveConfig = async () => {
    if (!editConfig) return;
    if (!editConfig.menu.syncUrl.trim()) {
      toast({ title: t("Errore", "Error"), description: t("Il link di sincronizzazione Menù è obbligatorio", "Menu sync link is required"), variant: "destructive" });
      return;
    }
    if (editConfig.wines.categories.length === 0) {
      toast({ title: t("Errore", "Error"), description: t("Aggiungi almeno una categoria vini", "Add at least one wine category"), variant: "destructive" });
      return;
    }
    const invalidCat = editConfig.wines.categories.find(c => !c.syncUrl.trim() || !c.category.trim());
    if (invalidCat) {
      toast({ title: t("Errore", "Error"), description: t("Ogni categoria vino deve avere nome e link", "Each wine category needs name and link"), variant: "destructive" });
      return;
    }
    if (!editConfig.cocktails.syncUrl.trim()) {
      toast({ title: t("Errore", "Error"), description: t("Il link di sincronizzazione Cocktail è obbligatorio", "Cocktails sync link is required"), variant: "destructive" });
      return;
    }
    setSavingConfig(true);
    try {
      await apiRequest("PUT", "/api/admin/sync/sheets-config", editConfig);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sync/sheets-config"] });
      setConfigDirty(false);
      toast({
        title: t("Configurazione salvata", "Configuration saved"),
        description: t("I link di sincronizzazione sono stati aggiornati", "Sync links have been updated"),
      });
    } catch (error) {
      toast({
        title: t("Errore", "Error"),
        description: t("Errore durante il salvataggio", "Error saving configuration"),
        variant: "destructive",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const updateConfig = (updater: (config: GoogleSheetsConfig) => void) => {
    if (!editConfig) return;
    const newConfig = JSON.parse(JSON.stringify(editConfig));
    updater(newConfig);
    setEditConfig(newConfig);
    setConfigDirty(true);
  };

  const addWineCategory = () => {
    updateConfig((c) => {
      c.wines.categories.push({ syncUrl: "", category: "" });
    });
  };

  const removeWineCategory = (index: number) => {
    updateConfig((c) => {
      c.wines.categories.splice(index, 1);
    });
  };

  const sections: { target: SyncTarget; icon: any; label: string; desc: string }[] = [
    {
      target: "menu",
      icon: UtensilsCrossed,
      label: t("Menù", "Menu"),
      desc: t("Piatti e portate dal foglio Google", "Dishes and courses from Google Sheet"),
    },
    {
      target: "wines",
      icon: Wine,
      label: t("Vini", "Wines"),
      desc: t("Carta dei vini dal foglio Google", "Wine list from Google Sheet"),
    },
    {
      target: "cocktails",
      icon: GlassWater,
      label: t("Cocktail", "Cocktails"),
      desc: t("Cocktail bar dal foglio Google", "Cocktail bar from Google Sheet"),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl" data-testid="text-sync-google-title">
            {t("Sync Google", "Sync Google")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(
              "Sincronizza i dati dai fogli Google e pubblica online quando sei pronto",
              "Sync data from Google Sheets and publish online when ready"
            )}
          </p>
        </div>

        <div className="space-y-4">
          {sections.map(({ target, icon: Icon, label, desc }) => {
            const status = publishStatus?.[target];
            const isSyncing = syncingTarget === target;
            const isPublishing = publishingTarget === target;

            return (
              <Card key={target} data-testid={`card-sheets-${target}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{label}</CardTitle>
                      <CardDescription className="text-sm">{desc}</CardDescription>
                    </div>
                  </div>

                  {status && (
                    <p className="text-xs text-muted-foreground pl-[52px]">
                      {t("Ultimo aggiornamento online", "Last published")}: {formatDate(status.publishedAt)} ({status.count} {t("elementi", "items")})
                    </p>
                  )}

                  <div className="flex items-center gap-2 pl-[52px] flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSyncing || isPublishing}
                      onClick={() => handleSync(target)}
                      data-testid={`button-sync-${target}`}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
                      {isSyncing
                        ? t("Sincronizzando...", "Syncing...")
                        : t("Sincronizza da Google", "Sync from Google")}
                    </Button>

                    <Button
                      size="sm"
                      disabled={isSyncing || isPublishing}
                      onClick={() => setConfirmPublish(target)}
                      data-testid={`button-publish-${target}`}
                    >
                      <Upload className={`h-4 w-4 mr-1.5 ${isPublishing ? "animate-spin" : ""}`} />
                      {isPublishing
                        ? t("Pubblicando...", "Publishing...")
                        : t("Pubblica online", "Publish online")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 mb-4">
          <Button
            variant="outline"
            onClick={() => {
              if (!showConfig && sheetsConfig) {
                setEditConfig(JSON.parse(JSON.stringify(sheetsConfig)));
                setConfigDirty(false);
              }
              setShowConfig(!showConfig);
            }}
            data-testid="button-toggle-config"
          >
            <Settings className="h-4 w-4 mr-2" />
            {t("Link di sincronizzazione", "Sync links")}
          </Button>
        </div>

        {showConfig && editConfig && (
          <div className="space-y-4" data-testid="section-sheets-config">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{t("Menù", "Menu")}</CardTitle>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t("Link CSV sincronizzazione", "CSV sync link")}</label>
                  <Input
                    value={editConfig.menu.syncUrl}
                    onChange={(e) => updateConfig((c) => { c.menu.syncUrl = e.target.value; })}
                    placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..."
                    data-testid="input-menu-sync-url"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wine className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{t("Vini", "Wines")}</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addWineCategory}
                    data-testid="button-add-wine-category"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    {t("Aggiungi", "Add")}
                  </Button>
                </div>

                <div className="space-y-3">
                  {editConfig.wines.categories.map((cat, idx) => (
                    <div key={idx} className="space-y-1.5 border-b pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <Input
                          className="flex-1"
                          placeholder={t("Nome categoria (es. Bollicine Italiane)", "Category name (e.g. Italian Sparkling)")}
                          value={cat.category}
                          onChange={(e) => updateConfig((c) => { c.wines.categories[idx].category = e.target.value; })}
                          data-testid={`input-wine-cat-name-${idx}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWineCategory(idx)}
                          data-testid={`button-remove-wine-cat-${idx}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Input
                        placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&single=true&output=csv"
                        value={cat.syncUrl}
                        onChange={(e) => updateConfig((c) => { c.wines.categories[idx].syncUrl = e.target.value; })}
                        data-testid={`input-wine-cat-url-${idx}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <GlassWater className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{t("Cocktail", "Cocktails")}</CardTitle>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t("Link CSV sincronizzazione", "CSV sync link")}</label>
                  <Input
                    value={editConfig.cocktails.syncUrl}
                    onChange={(e) => updateConfig((c) => { c.cocktails.syncUrl = e.target.value; })}
                    placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..."
                    data-testid="input-cocktails-sync-url"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveConfig}
                disabled={savingConfig || !configDirty}
                className="bg-green-600 border-green-700 text-white"
                data-testid="button-save-config"
              >
                {savingConfig ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : configDirty ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {savingConfig
                  ? t("Salvando...", "Saving...")
                  : configDirty
                    ? t("Salva configurazione", "Save configuration")
                    : t("Salvato", "Saved")}
              </Button>
            </div>
          </div>
        )}

        <AlertDialog open={confirmPublish !== null} onOpenChange={(open) => { if (!open) setConfirmPublish(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("Conferma pubblicazione", "Confirm publication")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmPublish === "menu" && t(
                  "Il Menù attuale verrà pubblicato online e sarà visibile ai clienti. Vuoi procedere?",
                  "The current Menu will be published online and visible to customers. Do you want to proceed?"
                )}
                {confirmPublish === "wines" && t(
                  "La Carta dei Vini attuale verrà pubblicata online e sarà visibile ai clienti. Vuoi procedere?",
                  "The current Wine List will be published online and visible to customers. Do you want to proceed?"
                )}
                {confirmPublish === "cocktails" && t(
                  "La lista Cocktail attuale verrà pubblicata online e sarà visibile ai clienti. Vuoi procedere?",
                  "The current Cocktail list will be published online and visible to customers. Do you want to proceed?"
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-publish">
                {t("Annulla", "Cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmPublish && handlePublish(confirmPublish)}
                data-testid="button-confirm-publish"
              >
                {t("Pubblica", "Publish")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
