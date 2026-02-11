import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
}

export function getConsentState(): ConsentState {
  const raw = localStorage.getItem("ccv_cookie_consent");
  if (!raw) return { analytics: false, marketing: false };
  if (raw === "all") return { analytics: true, marketing: true };
  if (raw === "essential") return { analytics: false, marketing: false };
  try {
    const parsed = JSON.parse(raw);
    return {
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return { analytics: false, marketing: false };
  }
}

export function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const openBanner = useCallback(() => {
    const current = getConsentState();
    setAnalytics(current.analytics);
    setMarketing(current.marketing);
    setShowPreferences(false);
    setVisible(true);
  }, []);

  useEffect(() => {
    const consent = localStorage.getItem("ccv_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handler = () => openBanner();
    window.addEventListener("ccv_consent_reset", handler);
    return () => window.removeEventListener("ccv_consent_reset", handler);
  }, [openBanner]);

  const saveConsent = (state: ConsentState) => {
    localStorage.setItem("ccv_cookie_consent", JSON.stringify(state));
    setVisible(false);
    setShowPreferences(false);
    window.dispatchEvent(new CustomEvent("ccv_consent_update", { detail: state }));
  };

  const handleAcceptAll = () => {
    saveConsent({ analytics: true, marketing: true });
  };

  const handleEssentialOnly = () => {
    saveConsent({ analytics: false, marketing: false });
  };

  const handleSavePreferences = () => {
    saveConsent({ analytics, marketing });
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
                  "Utilizziamo cookie tecnici necessari al funzionamento del sito e, previo tuo consenso, cookie di analytics e marketing. Puoi accettare tutti i cookie, rifiutare quelli non essenziali o personalizzare le tue preferenze.",
                  "We use technical cookies necessary for the site to function and, with your consent, analytics and marketing cookies. You can accept all cookies, reject non-essential ones or customize your preferences."
                )}
              </p>
            </div>
            <button
              onClick={handleEssentialOnly}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-cookie-close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {showPreferences && (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("Cookie essenziali", "Essential cookies")}</p>
                  <p className="text-xs text-muted-foreground">{t("Sempre attivi – necessari per il funzionamento", "Always active – necessary for operation")}</p>
                </div>
                <div className="text-xs text-muted-foreground italic">{t("Sempre attivi", "Always on")}</div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("Statistiche", "Statistics")}</p>
                  <p className="text-xs text-muted-foreground">Google Analytics</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" data-testid="toggle-analytics">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Marketing</p>
                  <p className="text-xs text-muted-foreground">Meta (Facebook) Pixel</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" data-testid="toggle-marketing">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <Button onClick={handleAcceptAll} data-testid="button-cookie-accept">
              {t("Accetta tutti", "Accept All")}
            </Button>
            <Button variant="outline" onClick={handleEssentialOnly} data-testid="button-cookie-decline">
              {t("Solo essenziali", "Essential Only")}
            </Button>
            {showPreferences ? (
              <Button variant="outline" onClick={handleSavePreferences} data-testid="button-cookie-save-preferences">
                {t("Salva preferenze", "Save preferences")}
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => setShowPreferences(true)}
                data-testid="button-cookie-settings"
              >
                {t("Preferenze", "Preferences")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
