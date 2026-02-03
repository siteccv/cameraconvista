import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(30,25,20,0.5), rgba(30,25,20,0.7)), url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl mb-4 drop-shadow-lg" data-testid="text-hero-title">
            Camera con Vista
          </h1>
          <p className="font-serif text-xl md:text-2xl lg:text-3xl italic mb-8 drop-shadow-md max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            {t(
              "Ristorante & Cocktail Bar",
              "Restaurant & Cocktail Bar"
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/menu">
              <Button size="lg" className="bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20" data-testid="button-cta-menu">
                {t("Scopri il Menù", "Discover the Menu")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/eventi-privati">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur" data-testid="button-cta-events">
                {t("Prenota un Evento", "Book an Event")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-3xl md:text-4xl mb-4" data-testid="text-concept-title">
              {t("Il nostro concept", "Our Concept")}
            </h2>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-concept-body">
              {t(
                "Camera con Vista è riconosciuto come uno dei cocktail bar più rinomati di Bologna. La nostra filosofia si basa sulla qualità degli ingredienti, l'innovazione nelle tecniche e la passione per l'ospitalità.",
                "Camera con Vista is recognized as one of the most renowned cocktail bars in Bologna. Our philosophy is based on the quality of ingredients, innovation in techniques, and passion for hospitality."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <TeaserCard
              imageUrl="https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
              titleIt="Cocktail Bar"
              titleEn="Cocktail Bar"
              descriptionIt="Cocktail creativi preparati con ingredienti di prima qualità"
              descriptionEn="Creative cocktails prepared with premium ingredients"
              href="/cocktail-bar"
              testId="card-cocktail"
            />
            <TeaserCard
              imageUrl="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
              titleIt="Ristorante"
              titleEn="Restaurant"
              descriptionIt="Cucina raffinata con prodotti locali e stagionali"
              descriptionEn="Refined cuisine with local and seasonal products"
              href="/menu"
              testId="card-restaurant"
            />
            <TeaserCard
              imageUrl="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
              titleIt="Eventi Privati"
              titleEn="Private Events"
              descriptionIt="Spazi esclusivi per le tue occasioni speciali"
              descriptionEn="Exclusive spaces for your special occasions"
              href="/eventi-privati"
              testId="card-events"
            />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl mb-4" data-testid="text-philosophy-title">
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
            <div className="aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt={t("Il nostro bar", "Our bar") || "Bar interior"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

interface TeaserCardProps {
  imageUrl: string;
  titleIt: string;
  titleEn: string;
  descriptionIt: string;
  descriptionEn: string;
  href: string;
  testId: string;
}

function TeaserCard({ imageUrl, titleIt, titleEn, descriptionIt, descriptionEn, href, testId }: TeaserCardProps) {
  const { t } = useLanguage();

  return (
    <Link href={href}>
      <div className="group cursor-pointer" data-testid={testId}>
        <div className="aspect-[4/5] rounded-lg overflow-hidden mb-4">
          <img
            src={imageUrl}
            alt={t(titleIt, titleEn) || titleIt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <h3 className="font-display text-xl mb-2 group-hover:text-primary transition-colors">
          {t(titleIt, titleEn)}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(descriptionIt, descriptionEn)}
        </p>
      </div>
    </Link>
  );
}
