import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Page } from "@shared/schema";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Image,
  Images,
  Eye,
  Settings,
  Search,
  Upload,
  Globe,
  LogOut,
  Loader2,
  Check,
} from "lucide-react";

const adminNavItems = [
  { slug: "/admina", icon: FileText, labelIt: "Sezioni Pagine", labelEn: "Page Sections" },
  { slug: "/admina/events", icon: Calendar, labelIt: "Eventi", labelEn: "Events" },
  { slug: "/admina/gallery", icon: Images, labelIt: "Galleria Album", labelEn: "Album Gallery" },
  { slug: "/admina/media", icon: Image, labelIt: "Libreria Media", labelEn: "Media Library" },
  { slug: "/admina/preview", icon: Eye, labelIt: "Anteprima", labelEn: "Preview" },
  { slug: "/admina/seo", icon: Search, labelIt: "SEO & Metadata", labelEn: "SEO & Metadata" },
  { slug: "/admina/settings", icon: Settings, labelIt: "Impostazioni", labelEn: "Settings" },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useLanguage();
  const { logout } = useAdmin();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const { data: dbPages = [], isLoading: pagesLoading } = useQuery<Page[]>({
    queryKey: ["/api/admin/pages"],
    refetchInterval: 5000,
  });

  const hasPendingChanges = dbPages.some(p => p.isDraft);

  const publishAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/publish-all", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ 
        title: t("Sito Pubblicato", "Site Published"),
        description: t("Tutte le pagine sono state pubblicate.", "All pages have been published.")
      });
    },
    onError: () => {
      toast({ 
        title: t("Errore", "Error"),
        description: t("Impossibile pubblicare il sito.", "Failed to publish site."),
        variant: "destructive"
      });
    },
  });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-lg text-sidebar-foreground">CCV Admin</h1>
              <p className="text-xs text-sidebar-foreground/60">Camera con Vista</p>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => {
                    const isActive = location === item.slug || 
                      (item.slug !== "/admina" && location.startsWith(item.slug));
                    return (
                      <SidebarMenuItem key={item.slug}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.slug}>
                            <item.icon className="h-4 w-4" />
                            <span>{t(item.labelIt, item.labelEn)}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupLabel>{t("Azioni", "Actions")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="p-2 space-y-2">
                  {pagesLoading ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start gap-2"
                      disabled
                      data-testid="button-publish-site"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("Caricamento...", "Loading...")}
                    </Button>
                  ) : hasPendingChanges ? (
                    <Button
                      size="sm"
                      className="w-full justify-start gap-2 no-default-hover-elevate no-default-active-elevate"
                      style={{ backgroundColor: '#dc2626', color: '#fff', borderColor: '#dc2626' }}
                      onClick={() => publishAllMutation.mutate()}
                      disabled={publishAllMutation.isPending}
                      data-testid="button-publish-site"
                    >
                      {publishAllMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {t("Pubblica Sito", "Publish Site")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start gap-2"
                      style={{ backgroundColor: 'rgba(34, 139, 34, 0.12)', borderColor: 'rgba(34, 139, 34, 0.3)', color: '#16a34a' }}
                      disabled
                      data-testid="button-publish-site"
                    >
                      <Check className="h-4 w-4" />
                      {t("Tutto aggiornato", "All up to date")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open("/", "_blank")}
                    data-testid="button-view-site"
                  >
                    <Globe className="h-4 w-4" />
                    {t("Vedi Sito", "View Site")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground"
                    onClick={async () => {
                      await logout();
                      setLocation("/admina/login");
                    }}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("Esci", "Logout")}
                  </Button>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-14 border-b border-border bg-background flex items-center px-4 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
