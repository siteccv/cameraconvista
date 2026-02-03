import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import logoImg from "@assets/logo_ccv.png";

const navItems = [
  { slug: "/", labelIt: "Home", labelEn: "Home" },
  { slug: "/menu", labelIt: "Menù", labelEn: "Menu" },
  { slug: "/carta-vini", labelIt: "Carta dei Vini", labelEn: "Wine List" },
  { slug: "/cocktail-bar", labelIt: "Cocktail Bar", labelEn: "Cocktail Bar" },
  { slug: "/eventi", labelIt: "Eventi", labelEn: "Events" },
  { slug: "/eventi-privati", labelIt: "Eventi Privati", labelEn: "Private Events" },
  { slug: "/galleria", labelIt: "Galleria", labelEn: "Gallery" },
  { slug: "/contatti", labelIt: "Contatti", labelEn: "Contact" },
];

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { forceMobileLayout } = useAdmin();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isMobile = forceMobileLayout || isMobileView;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-2">
          {isMobile ? (
            <>
              <div className="w-9" />

              <Link href="/" className="absolute left-1/2 -translate-x-1/2" data-testid="link-home-logo">
                <img 
                  src={logoImg} 
                  alt="Camera con Vista" 
                  className="h-[18px] w-auto object-contain"
                />
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
                <img 
                  src={logoImg} 
                  alt="Camera con Vista" 
                  className="h-[18px] w-auto object-contain"
                />
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location === item.slug;
                  return (
                    <Link key={item.slug} href={item.slug}>
                      <span
                        className={`px-3 py-2 text-sm font-medium tracking-wide uppercase transition-colors cursor-pointer ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid={`nav-${item.slug.replace("/", "") || "home"}`}
                      >
                        {t(item.labelIt, item.labelEn)}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setLanguage("it")}
                  className={`px-1.5 py-1 transition-colors ${
                    language === "it"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-lang-it"
                >
                  IT
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-1.5 py-1 transition-colors ${
                    language === "en"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="button-lang-en"
                >
                  EN
                </button>
              </div>
            </>
          )}
        </div>

        {mobileMenuOpen && isMobile && (
          <nav className="py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = location === item.slug;
                return (
                  <Link key={item.slug} href={item.slug}>
                    <span
                      className={`block px-4 py-3 text-sm font-medium tracking-wide uppercase transition-colors cursor-pointer ${
                        isActive
                          ? "text-primary bg-accent"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`nav-mobile-${item.slug.replace("/", "") || "home"}`}
                    >
                      {t(item.labelIt, item.labelEn)}
                    </span>
                  </Link>
                );
              })}

              <div className="mt-4 pt-4 border-t border-border px-4">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{t("Lingua:", "Language:")}</span>
                  <button
                    onClick={() => { setLanguage("it"); setMobileMenuOpen(false); }}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      language === "it"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    data-testid="button-lang-it-mobile"
                  >
                    Italiano
                  </button>
                  <button
                    onClick={() => { setLanguage("en"); setMobileMenuOpen(false); }}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      language === "en"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    data-testid="button-lang-en-mobile"
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
