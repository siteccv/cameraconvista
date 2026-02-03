import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoImg from "@assets/Logo_ccv_2_optimized_1770126702818.png";

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

  const isMobile = forceMobileLayout;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
            <img 
              src={logoImg} 
              alt="Camera con Vista" 
              className="h-6 w-auto"
            />
          </Link>

          <nav className={`items-center gap-1 ${isMobile ? "hidden" : "hidden lg:flex"}`}>
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

          <div className="flex items-center gap-2">
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

            <Button
              variant="ghost"
              size="icon"
              className={isMobile ? "" : "lg:hidden"}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className={`py-4 border-t border-border ${isMobile ? "" : "lg:hidden"}`}>
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
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
