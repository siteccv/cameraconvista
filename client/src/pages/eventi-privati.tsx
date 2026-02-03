import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Users, Utensils, Music, Star, ArrowRight } from "lucide-react";

export default function EventiPrivati() {
  const { t } = useLanguage();

  const packages = [
    {
      icon: Users,
      titleIt: "Aperitivo Esclusivo",
      titleEn: "Exclusive Aperitivo",
      descriptionIt: "Cocktail personalizzati e finger food selezionati per i tuoi ospiti. Ideale per 20-50 persone.",
      descriptionEn: "Personalized cocktails and selected finger food for your guests. Ideal for 20-50 people.",
    },
    {
      icon: Utensils,
      titleIt: "Cena Privata",
      titleEn: "Private Dinner",
      descriptionIt: "Menu degustazione con abbinamento vini in sala riservata. Ideale per 10-30 persone.",
      descriptionEn: "Tasting menu with wine pairing in a private room. Ideal for 10-30 people.",
    },
    {
      icon: Music,
      titleIt: "Party & Celebrazioni",
      titleEn: "Parties & Celebrations",
      descriptionIt: "Location completa con DJ, cocktail bar dedicato e catering. Ideale per 50-100 persone.",
      descriptionEn: "Complete venue with DJ, dedicated cocktail bar and catering. Ideal for 50-100 people.",
    },
    {
      icon: Star,
      titleIt: "Experience Premium",
      titleEn: "Premium Experience",
      descriptionIt: "Pacchetto su misura con mixology class e menu personalizzato. Per gruppi esclusivi.",
      descriptionEn: "Tailored package with mixology class and personalized menu. For exclusive groups.",
    },
  ];

  return (
    <PublicLayout>
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(30,25,20,0.5), rgba(30,25,20,0.7)), url('https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl drop-shadow-lg" data-testid="text-private-events-hero">
            {t("Eventi Privati", "Private Events")}
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl mb-4" data-testid="text-private-events-title">
              {t("Il tuo evento, la nostra passione", "Your event, our passion")}
            </h2>
            <p className="text-muted-foreground" data-testid="text-private-events-intro">
              {t(
                "Camera con Vista offre spazi esclusivi e servizi personalizzati per rendere ogni occasione indimenticabile. Dal party aziendale alla celebrazione privata, ogni dettaglio è curato con la massima attenzione.",
                "Camera con Vista offers exclusive spaces and personalized services to make every occasion unforgettable. From corporate parties to private celebrations, every detail is curated with the utmost attention."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {packages.map((pkg, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-package-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <pkg.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl mb-2">{t(pkg.titleIt, pkg.titleEn)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(pkg.descriptionIt, pkg.descriptionEn)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl mb-4" data-testid="text-request-quote">
              {t("Richiedi un preventivo", "Request a Quote")}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t(
                "Contattaci per discutere le tue esigenze e creare insieme l'evento perfetto.",
                "Contact us to discuss your needs and create the perfect event together."
              )}
            </p>
            <Link href="/contatti">
              <Button size="lg" data-testid="button-request-quote">
                {t("Contattaci", "Contact Us")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12" data-testid="text-gallery-title">
            {t("I nostri spazi", "Our Spaces")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="aspect-[4/3] rounded-placeholder overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt={t("Sala principale", "Main hall") || "Main hall"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[4/3] rounded-placeholder overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt={t("Sala privata", "Private room") || "Private room"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[4/3] rounded-placeholder overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt={t("Bar", "Bar") || "Bar"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
