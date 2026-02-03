import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("ccv_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("ccv_cookie_consent", "all");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("ccv_cookie_consent", "essential");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-foreground mb-2">
                {t("Informativa sui Cookie", "Cookie Notice")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(
                  "Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito. Continuando a navigare, accetti l'uso dei cookie in conformità con la nostra Cookie Policy.",
                  "We use cookies to enhance your experience on our site. By continuing to browse, you consent to our use of cookies in accordance with our Cookie Policy."
                )}
              </p>
            </div>
            <button
              onClick={handleDecline}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-cookie-close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button onClick={handleAccept} data-testid="button-cookie-accept">
              {t("Accetta tutti", "Accept All")}
            </Button>
            <Button variant="outline" onClick={handleDecline} data-testid="button-cookie-decline">
              {t("Solo essenziali", "Essential Only")}
            </Button>
            <Button variant="ghost" className="text-sm" data-testid="button-cookie-settings">
              {t("Preferenze", "Preferences")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
