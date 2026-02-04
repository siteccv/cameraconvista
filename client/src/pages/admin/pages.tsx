import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone, Upload, EyeOff, Eye, Check, AlertTriangle } from "lucide-react";
import { IPhoneFrame } from "@/components/admin/IPhoneFrame";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Page } from "@shared/schema";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import CartaVini from "@/pages/carta-vini";
import CocktailBar from "@/pages/cocktail-bar";
import Eventi from "@/pages/eventi";
import EventiPrivati from "@/pages/eventi-privati";
import Galleria from "@/pages/galleria";
import Contatti from "@/pages/contatti";

const pageComponents = [
  { slug: "home", labelIt: "Home", labelEn: "Home", component: Home },
  { slug: "menu", labelIt: "Menu", labelEn: "Menu", component: Menu },
  { slug: "carta-vini", labelIt: "Carta dei Vini", labelEn: "Wine List", component: CartaVini },
  { slug: "cocktail-bar", labelIt: "Cocktail Bar", labelEn: "Cocktail Bar", component: CocktailBar },
  { slug: "eventi", labelIt: "Eventi", labelEn: "Events", component: Eventi },
  { slug: "eventi-privati", labelIt: "Eventi Privati", labelEn: "Private Events", component: EventiPrivati },
  { slug: "galleria", labelIt: "Galleria", labelEn: "Gallery", component: Galleria },
  { slug: "contatti", labelIt: "Contatti", labelEn: "Contacts", component: Contatti },
];

export default function AdminPages() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { setAdminPreview, deviceView, setDeviceView, setForceMobileLayout } = useAdmin();
  const [activePage, setActivePage] = useState("home");

  const { data: dbPages = [] } = useQuery<Page[]>({
    queryKey: ["/api/admin/pages"],
  });

  const publishPageMutation = useMutation({
    mutationFn: async (pageId: number) => {
      return apiRequest("POST", `/api/admin/pages/${pageId}/publish`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: t("Pubblicato", "Published"), description: t("La pagina è stata pubblicata.", "The page has been published.") });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile pubblicare la pagina.", "Failed to publish page."), variant: "destructive" });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (pageId: number) => {
      return apiRequest("POST", `/api/admin/pages/${pageId}/toggle-visibility`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: t("Aggiornato", "Updated"), description: t("Visibilità aggiornata.", "Visibility updated.") });
    },
    onError: () => {
      toast({ title: t("Errore", "Error"), description: t("Impossibile aggiornare la visibilità.", "Failed to update visibility."), variant: "destructive" });
    },
  });

  useEffect(() => {
    setAdminPreview(true);
    return () => setAdminPreview(false);
  }, [setAdminPreview]);

  // Sincronizza forceMobileLayout con deviceView per forzare il layout mobile
  useEffect(() => {
    setForceMobileLayout(deviceView === "mobile");
    return () => setForceMobileLayout(false);
  }, [deviceView, setForceMobileLayout]);

  const activePageData = dbPages.find(p => p.slug === activePage);
  const ActivePageComponent = pageComponents.find(p => p.slug === activePage)?.component || Home;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl" data-testid="text-pages-title">
            {t("Sezioni Pagine", "Page Sections")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Gestisci blocchi e item di ogni pagina", "Manage blocks and items for each page")}
          </p>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <Tabs value={activePage} onValueChange={setActivePage}>
            <TabsList className="flex-wrap h-auto gap-1">
              {pageComponents.map((page) => {
                const dbPage = dbPages.find(p => p.slug === page.slug);
                return (
                  <TabsTrigger 
                    key={page.slug} 
                    value={page.slug}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative flex items-center gap-1"
                    data-testid={`tab-page-${page.slug}`}
                  >
                    {t(page.labelIt, page.labelEn)}
                    {dbPage && !dbPage.isVisible && (
                      <span title={t("Nascosto", "Hidden")}>
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      </span>
                    )}
                    {dbPage && dbPage.isDraft && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" title={t("Bozza", "Draft")} />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={deviceView === "desktop" ? "default" : "outline"}
                size="icon"
                onClick={() => setDeviceView("desktop")}
                data-testid="button-view-desktop"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={deviceView === "mobile" ? "default" : "outline"}
                size="icon"
                onClick={() => setDeviceView("mobile")}
                data-testid="button-view-mobile"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              {activePageData && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleVisibilityMutation.mutate(activePageData.id)}
                    disabled={toggleVisibilityMutation.isPending}
                    data-testid="button-toggle-visibility"
                  >
                    {activePageData.isVisible ? (
                      <><EyeOff className="h-4 w-4 mr-2" />{t("Nascondi", "Hide")}</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" />{t("Mostra", "Show")}</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => publishPageMutation.mutate(activePageData.id)}
                    disabled={publishPageMutation.isPending || !activePageData.isDraft}
                    data-testid="button-publish-page"
                  >
                    {activePageData.isDraft ? (
                      <><Upload className="h-4 w-4 mr-2" />{t("Pubblica", "Publish")}</>
                    ) : (
                      <><Check className="h-4 w-4 mr-2" />{t("Pubblicato", "Published")}</>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div 
          className="border border-border rounded-lg bg-muted/30 overflow-hidden flex items-start justify-center p-8"
          style={{ minHeight: deviceView === "mobile" ? "1000px" : "auto" }}
          data-testid="preview-container"
        >
          {deviceView === "mobile" ? (
            <IPhoneFrame>
              <ActivePageComponent />
            </IPhoneFrame>
          ) : (
            <div className="w-full h-[calc(100vh-280px)] min-h-[500px] overflow-auto bg-background rounded-lg border border-border">
              <ActivePageComponent />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
