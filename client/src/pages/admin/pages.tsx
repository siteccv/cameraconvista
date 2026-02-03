import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone } from "lucide-react";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import CartaVini from "@/pages/carta-vini";
import CocktailBar from "@/pages/cocktail-bar";
import Eventi from "@/pages/eventi";
import EventiPrivati from "@/pages/eventi-privati";
import Galleria from "@/pages/galleria";
import Contatti from "@/pages/contatti";

const pages = [
  { id: "home", labelIt: "Home", labelEn: "Home", component: Home },
  { id: "menu", labelIt: "Menu", labelEn: "Menu", component: Menu },
  { id: "carta-vini", labelIt: "Carta dei Vini", labelEn: "Wine List", component: CartaVini },
  { id: "cocktail-bar", labelIt: "Cocktail Bar", labelEn: "Cocktail Bar", component: CocktailBar },
  { id: "eventi", labelIt: "Eventi", labelEn: "Events", component: Eventi },
  { id: "eventi-privati", labelIt: "Eventi Privati", labelEn: "Private Events", component: EventiPrivati },
  { id: "galleria", labelIt: "Galleria", labelEn: "Gallery", component: Galleria },
  { id: "contatti", labelIt: "Contatti", labelEn: "Contacts", component: Contatti },
];

export default function AdminPages() {
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState("home");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");

  const ActivePageComponent = pages.find(p => p.id === activePage)?.component || Home;

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
              {pages.map((page) => (
                <TabsTrigger 
                  key={page.id} 
                  value={page.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid={`tab-page-${page.id}`}
                >
                  {t(page.labelIt, page.labelEn)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

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
        </div>

        <div 
          className="border border-border rounded-md bg-background overflow-hidden"
          data-testid="preview-container"
        >
          <div 
            className={`mx-auto transition-all duration-300 overflow-auto ${
              deviceView === "mobile" 
                ? "max-w-[375px] h-[667px]" 
                : "w-full h-[calc(100vh-280px)] min-h-[500px]"
            }`}
            style={{
              boxShadow: deviceView === "mobile" ? "0 0 20px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <div className="admin-preview-wrapper">
              <ActivePageComponent />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
