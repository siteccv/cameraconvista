import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, ExternalLink } from "lucide-react";
import Home from "@/pages/home";

export default function AdminPreview() {
  const { t, language, setLanguage } = useLanguage();
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl" data-testid="text-preview-title">
              {t("Anteprima", "Preview")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("Visualizza il sito come lo vedranno i visitatori", "View the site as visitors will see it")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4">
              <button
                onClick={() => setLanguage("it")}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  language === "it"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="button-preview-lang-it"
              >
                IT
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  language === "en"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="button-preview-lang-en"
              >
                EN
              </button>
            </div>
            <Button
              variant={deviceView === "desktop" ? "default" : "outline"}
              size="icon"
              onClick={() => setDeviceView("desktop")}
              data-testid="button-preview-desktop"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === "mobile" ? "default" : "outline"}
              size="icon"
              onClick={() => setDeviceView("mobile")}
              data-testid="button-preview-mobile"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open("/", "_blank")}
              data-testid="button-open-site"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("Apri Sito", "Open Site")}
            </Button>
          </div>
        </div>

        <div 
          className="border border-border rounded-md bg-background overflow-hidden"
          data-testid="preview-frame"
        >
          <div 
            className={`mx-auto transition-all duration-300 overflow-auto ${
              deviceView === "mobile" 
                ? "max-w-[375px] h-[667px]" 
                : "w-full h-[calc(100vh-240px)] min-h-[500px]"
            }`}
            style={{
              boxShadow: deviceView === "mobile" ? "0 0 20px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Home />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
