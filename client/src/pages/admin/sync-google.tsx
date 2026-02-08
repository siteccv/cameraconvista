import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { RefreshCw, Upload, UtensilsCrossed, Wine, GlassWater, ExternalLink } from "lucide-react";

type SyncTarget = "menu" | "wines" | "cocktails";

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

  const { data: publishStatus } = useQuery<PublishStatus>({
    queryKey: ["/api/admin/sync/publish-status"],
  });

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

  const GOOGLE_SHEET_URLS: Record<SyncTarget, string> = {
    menu: "https://docs.google.com/spreadsheets/d/1TVHaO3bM4WALAey-TXNWYJh--RiGUheAaoU00gamJpY/edit#gid=1122482173",
    wines: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pubhtml",
    cocktails: "https://docs.google.com/spreadsheets/d/1kDXAPQ73vXh1RiEICXLneizZm4I0wdNy1WKng0CQ5SQ/edit#gid=1122482173",
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

                    <Button
                      size="sm"
                      className="bg-green-600 border-green-700 text-white"
                      onClick={() => window.open(GOOGLE_SHEET_URLS[target], "_blank")}
                      data-testid={`button-open-sheet-${target}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      GOOGLE SHEET
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <AlertDialog open={confirmPublish !== null} onOpenChange={(open) => { if (!open) setConfirmPublish(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("Conferma pubblicazione", "Confirm publication")}
              </AlertDialogTitle>
              <AlertDialogHeader>
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
