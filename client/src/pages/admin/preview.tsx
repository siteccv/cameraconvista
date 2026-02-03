import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, ExternalLink } from "lucide-react";
import { IPhoneFrame } from "@/components/admin/IPhoneFrame";
import Home from "@/pages/home";

export default function AdminPreview() {
  const { t, language, setLanguage } = useLanguage();
  const { setForceMobileLayout, setDeviceView: setContextDeviceView } = useAdmin();
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    setForceMobileLayout(deviceView === "mobile");
    setContextDeviceView(deviceView);
    return () => {
      setForceMobileLayout(false);
      setContextDeviceView("desktop");
    };
  }, [deviceView, setForceMobileLayout, setContextDeviceView]);

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
          className="border border-border rounded-lg bg-muted/30 overflow-hidden flex items-start justify-center p-8"
          style={{ minHeight: deviceView === "mobile" ? "1000px" : "auto" }}
          data-testid="preview-frame"
        >
          {deviceView === "mobile" ? (
            <IPhoneFrame>
              <Home />
            </IPhoneFrame>
          ) : (
            <div className="w-full h-[calc(100vh-240px)] min-h-[500px] overflow-auto bg-background rounded-lg border border-border">
              <Home />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
