import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-display text-8xl md:text-9xl text-primary mb-4" data-testid="text-404">
            404
          </h1>
          <h2 className="font-display text-2xl md:text-3xl mb-4" data-testid="text-not-found-title">
            {t("Pagina non trovata", "Page Not Found")}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto" data-testid="text-not-found-message">
            {t(
              "La pagina che stai cercando non esiste o è stata spostata.",
              "The page you are looking for does not exist or has been moved."
            )}
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">
              <Home className="mr-2 h-4 w-4" />
              {t("Torna alla Home", "Back to Home")}
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
