import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

interface PhilosophySectionProps {
  sectionPadding: string;
  titleSize: string;
  twoColGrid: string;
}

export function PhilosophySection({ sectionPadding, titleSize, twoColGrid }: PhilosophySectionProps) {
  const { t } = useLanguage();

  return (
    <section className={`${sectionPadding} bg-card`}>
      <div className="container mx-auto px-4">
        <div className={twoColGrid}>
          <div>
            <h2 className={`font-display ${titleSize} mb-4`} data-testid="text-philosophy-title">
              {t("La nostra filosofia", "Our Philosophy")}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {t(
                  "Ogni cocktail racconta una storia, ogni piatto è un viaggio sensoriale. In Camera con Vista, crediamo che l'eccellenza nasca dall'attenzione ai dettagli e dalla passione per ciò che facciamo.",
                  "Every cocktail tells a story, every dish is a sensory journey. At Camera con Vista, we believe that excellence comes from attention to detail and passion for what we do."
                )}
              </p>
              <p>
                {t(
                  "I nostri mixologist selezionano personalmente gli ingredienti, creando combinazioni uniche che rispettano la tradizione mentre esplorano nuovi orizzonti del gusto.",
                  "Our mixologists personally select the ingredients, creating unique combinations that respect tradition while exploring new horizons of taste."
                )}
              </p>
            </div>
            <Link href="/contatti">
              <Button className="mt-6" data-testid="button-contact-us">
                {t("Contattaci", "Contact Us")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="aspect-[4/3] rounded-placeholder overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt={t("Il nostro bar", "Our bar") || "Bar interior"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
