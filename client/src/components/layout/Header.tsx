import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import logoImg from "@assets/logo_ccv.png";
import type { Page } from "@shared/schema";

const allNavItems = [
  { slug: "home", path: "/", labelIt: "Home", labelEn: "Home" },
  { slug: "menu", path: "/menu", labelIt: "Menù", labelEn: "Menu" },
  { slug: "carta-vini", path: "/lista-vini", labelIt: "Carta dei Vini", labelEn: "Wine List" },
  { slug: "cocktail-bar", path: "/cocktail-bar", labelIt: "Cocktail Bar", labelEn: "Cocktail Bar" },
  { slug: "eventi", path: "/eventi", labelIt: "Eventi", labelEn: "Events" },
  { slug: "eventi-privati", path: "/eventi-privati", labelIt: "Eventi Privati", labelEn: "Private Events" },
  { slug: "galleria", path: "/galleria", labelIt: "Galleria", labelEn: "Gallery" },
  { slug: "dove-siamo", path: "/dove-siamo", labelIt: "Dove Siamo", labelEn: "Where We Are" },
];

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { forceMobileLayout, adminPreview } = useAdmin();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const { data: visiblePages = [] } = useQuery<Page[]>({
    queryKey: ["/api/pages"],
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1280);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isMobile = forceMobileLayout || isMobileView;

  const navItems = allNavItems.filter(item => {
    const dbPage = visiblePages.find(p => p.slug === item.slug);
    return dbPage !== undefined || visiblePages.length === 0;
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-2">
          {isMobile ? (
            <>
              <div className="w-9" />

              {adminPreview ? (
                <div className="absolute left-1/2 -translate-x-1/2">
                  <img 
                    src={logoImg} 
                    alt="Camera con Vista" 
                    className="h-[18px] w-auto object-contain"
                  />
                </div>
              ) : (
                <Link href="/" className="absolute left-1/2 -translate-x-1/2" data-testid="link-home-logo">
                  <img 
                    src={logoImg} 
                    alt="Camera con Vista" 
                    className="h-[18px] w-auto object-contain"
                  />
                </Link>
              )}

              {adminPreview ? (
                <div className="w-9" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  data-testid="button-mobile-menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              )}
            </>
          ) : (
            <>
              {adminPreview ? (
                <div className="flex items-center gap-2">
                  <img 
                    src={logoImg} 
                    alt="Camera con Vista" 
                    className="h-[18px] w-auto object-contain"
                  />
                </div>
              ) : (
                <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
                  <img 
                    src={logoImg} 
                    alt="Camera con Vista" 
                    className="h-[18px] w-auto object-contain"
                  />
                </Link>
              )}

              <nav className="hidden xl:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location === item.path;
                  const navClassName = `px-3 py-2 text-sm font-medium tracking-wide uppercase transition-colors whitespace-nowrap ${
                    isActive
                      ? "text-[#722f37] underline underline-offset-4"
                      : "text-muted-foreground"
                  } ${adminPreview ? "cursor-default pointer-events-none" : "cursor-pointer hover:text-foreground"}`;
                  
                  if (adminPreview) {
                    return (
                      <span
                        key={item.slug}
                        className={navClassName}
                        data-testid={`nav-${item.slug || "home"}`}
                      >
                        {t(item.labelIt, item.labelEn)}
                      </span>
                    );
                  }
                  
                  return (
                    <Link key={item.slug} href={item.path}>
                      <span
                        className={navClassName}
                        data-testid={`nav-${item.slug || "home"}`}
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

        {mobileMenuOpen && isMobile && !adminPreview && (
          <nav className="absolute left-0 right-0 top-14 z-40 bg-background border-b border-border shadow-lg py-6">
            <div className="container mx-auto px-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.slug} href={item.path}>
                    <span
                      className={`block px-4 py-3 font-display text-lg tracking-wide transition-colors cursor-pointer ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`nav-mobile-${item.slug || "home"}`}
                    >
                      {t(item.labelIt, item.labelEn)}
                    </span>
                  </Link>
                );
              })}

              <div className="mt-4 pt-4 border-t border-border px-4">
                <div className="flex items-center gap-3 font-display text-base">
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
