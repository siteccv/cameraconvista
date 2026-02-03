import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { t } = useLanguage();
  const { adminPreview, deviceView } = useAdmin();
  const { toast } = useToast();

  const [heroTitle, setHeroTitle] = useState({ 
    it: "Camera con Vista", en: "Camera con Vista",
    fontSizeDesktop: 72, fontSizeMobile: 40
  });
  const [heroSubtitle, setHeroSubtitle] = useState({ 
    it: "Ristorante & Cocktail Bar", en: "Restaurant & Cocktail Bar",
    fontSizeDesktop: 28, fontSizeMobile: 20
  });
  const [heroImage, setHeroImage] = useState({
    src: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    zoomDesktop: 100, zoomMobile: 100,
    offsetXDesktop: 0, offsetYDesktop: 0,
    offsetXMobile: 0, offsetYMobile: 0,
  });
  const [conceptTitle, setConceptTitle] = useState({ 
    it: "Il nostro concept", en: "Our Concept",
    fontSizeDesktop: 36, fontSizeMobile: 28
  });
  const [conceptBody, setConceptBody] = useState({
    it: "Camera con Vista è riconosciuto come uno dei cocktail bar più rinomati di Bologna. La nostra filosofia si basa sulla qualità degli ingredienti, l'innovazione nelle tecniche e la passione per l'ospitalità.",
    en: "Camera con Vista is recognized as one of the most renowned cocktail bars in Bologna. Our philosophy is based on the quality of ingredients, innovation in techniques, and passion for hospitality.",
    fontSizeDesktop: 16, fontSizeMobile: 14
  });

  const handleTextSave = (field: string, data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    switch (field) {
      case "heroTitle":
        setHeroTitle({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
      case "heroSubtitle":
        setHeroSubtitle({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
      case "conceptTitle":
        setConceptTitle({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
      case "conceptBody":
        setConceptBody({ it: data.textIt, en: data.textEn, fontSizeDesktop: data.fontSizeDesktop, fontSizeMobile: data.fontSizeMobile });
        break;
    }
    toast({ title: t("Salvato", "Saved"), description: t("Le modifiche sono state salvate.", "Changes have been saved.") });
  };

  const handleHeroImageSave = (data: typeof heroImage) => {
    setHeroImage(data);
    toast({ title: t("Salvato", "Saved"), description: t("Immagine aggiornata.", "Image updated.") });
  };

  const displayZoom = deviceView === "desktop" ? heroImage.zoomDesktop : heroImage.zoomMobile;
  const displayOffsetX = deviceView === "desktop" ? heroImage.offsetXDesktop : heroImage.offsetXMobile;
  const displayOffsetY = deviceView === "desktop" ? heroImage.offsetYDesktop : heroImage.offsetYMobile;

  return (
    <PublicLayout>
      <section className="relative min-h-[60vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <EditableImage
          src={heroImage.src}
          zoomDesktop={heroImage.zoomDesktop}
          zoomMobile={heroImage.zoomMobile}
          offsetXDesktop={heroImage.offsetXDesktop}
          offsetYDesktop={heroImage.offsetYDesktop}
          offsetXMobile={heroImage.offsetXMobile}
          offsetYMobile={heroImage.offsetYMobile}
          deviceView={deviceView}
          containerClassName="absolute inset-0"
          className="w-full h-full object-cover"
          onSave={handleHeroImageSave}
        />
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 pointer-events-none"
        />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <EditableText
            textIt={heroTitle.it}
            textEn={heroTitle.en}
            fontSizeDesktop={heroTitle.fontSizeDesktop}
            fontSizeMobile={heroTitle.fontSizeMobile}
            as="h1"
            className="font-display mb-4 drop-shadow-lg"
            applyFontSize
            onSave={(data) => handleTextSave("heroTitle", data)}
          />
          <EditableText
            textIt={heroSubtitle.it}
            textEn={heroSubtitle.en}
            fontSizeDesktop={heroSubtitle.fontSizeDesktop}
            fontSizeMobile={heroSubtitle.fontSizeMobile}
            as="p"
            className="font-serif italic mb-8 drop-shadow-md max-w-2xl mx-auto"
            applyFontSize
            onSave={(data) => handleTextSave("heroSubtitle", data)}
          />
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

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
            <EditableText
              textIt={conceptTitle.it}
              textEn={conceptTitle.en}
              fontSizeDesktop={conceptTitle.fontSizeDesktop}
              fontSizeMobile={conceptTitle.fontSizeMobile}
              as="h2"
              className="font-display mb-4"
              applyFontSize
              onSave={(data) => handleTextSave("conceptTitle", data)}
            />
            <EditableText
              textIt={conceptBody.it}
              textEn={conceptBody.en}
              fontSizeDesktop={conceptBody.fontSizeDesktop}
              fontSizeMobile={conceptBody.fontSizeMobile}
              as="p"
              className="text-muted-foreground leading-relaxed"
              applyFontSize
              multiline
              onSave={(data) => handleTextSave("conceptBody", data)}
            />
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

      <section className="py-10 md:py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
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
    <div className="group" data-testid={testId}>
      <div className="aspect-[4/5] rounded-placeholder overflow-hidden mb-4">
        <img
          src={imageUrl}
          alt={t(titleIt, titleEn) || titleIt}
          className="w-full h-full object-cover"
        />
      </div>
      <Link href={href}>
        <h3 className="font-display text-xl mb-2 hover:text-primary transition-colors cursor-pointer">
          {t(titleIt, titleEn)}
        </h3>
      </Link>
      <p className="text-sm text-muted-foreground">
        {t(descriptionIt, descriptionEn)}
      </p>
    </div>
  );
}
