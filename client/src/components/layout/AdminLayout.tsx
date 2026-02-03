import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
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
  LayoutDashboard,
  FileText,
  Calendar,
  Image,
  Eye,
  Settings,
  Search,
  Upload,
  Globe,
} from "lucide-react";

const adminNavItems = [
  { slug: "/admin", icon: LayoutDashboard, labelIt: "Dashboard", labelEn: "Dashboard" },
  { slug: "/admin/pages", icon: FileText, labelIt: "Sezioni Pagine", labelEn: "Page Sections" },
  { slug: "/admin/events", icon: Calendar, labelIt: "Eventi", labelEn: "Events" },
  { slug: "/admin/media", icon: Image, labelIt: "Libreria Media", labelEn: "Media Library" },
  { slug: "/admin/preview", icon: Eye, labelIt: "Anteprima", labelEn: "Preview" },
  { slug: "/admin/seo", icon: Search, labelIt: "SEO & Metadata", labelEn: "SEO & Metadata" },
  { slug: "/admin/settings", icon: Settings, labelIt: "Impostazioni Sito", labelEn: "Site Settings" },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t, language, setLanguage } = useLanguage();
  const { setAdminPreview } = useAdmin();
  const [location] = useLocation();

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
                      (item.slug !== "/admin" && location.startsWith(item.slug));
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
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full justify-start gap-2"
                    data-testid="button-publish-site"
                  >
                    <Upload className="h-4 w-4" />
                    {t("Pubblica Sito", "Publish Site")}
                  </Button>
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
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => setLanguage("it")}
                  className={`px-2 py-1 transition-colors ${
                    language === "it"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-admin-lang-it"
                >
                  IT
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-1 transition-colors ${
                    language === "en"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-admin-lang-en"
                >
                  EN
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
