import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PageBlock } from "@shared/schema";
import logoImg from "@assets/logo_ccv.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const HOME_PAGE_ID = 1;

// Default blocks for home page initialization
const DEFAULT_BLOCKS = {
  hero: {
    blockType: "hero",
    sortOrder: 0,
    titleIt: "Camera con Vista",
    titleEn: "Camera con Vista",
    bodyIt: "Ristorante & Cocktail Bar",
    bodyEn: "Restaurant & Cocktail Bar",
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    imageScaleDesktop: 100,
    imageScaleMobile: 100,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageOffsetXMobile: 0,
    imageOffsetYMobile: 0,
    titleFontSize: 72,
    titleFontSizeMobile: 40,
    bodyFontSize: 28,
    bodyFontSizeMobile: 20,
    isDraft: false,
  },
  concept: {
    blockType: "concept",
    sortOrder: 1,
    titleIt: "Il nostro concept",
    titleEn: "Our Concept",
    bodyIt: "Camera con Vista è riconosciuto come uno dei cocktail bar più rinomati di Bologna. La nostra filosofia si basa sulla qualità degli ingredienti, l'innovazione nelle tecniche e la passione per l'ospitalità.",
    bodyEn: "Camera con Vista is recognized as one of the most renowned cocktail bars in Bologna. Our philosophy is based on the quality of ingredients, innovation in techniques, and passion for hospitality.",
    titleFontSize: 36,
    titleFontSizeMobile: 28,
    bodyFontSize: 16,
    bodyFontSizeMobile: 14,
    isDraft: false,
  },
  branding: {
    blockType: "branding",
    sortOrder: 2,
    titleIt: "RESTAURANT & COCKTAIL BAR",
    titleEn: "RESTAURANT & COCKTAIL BAR",
    bodyIt: "French nuance, antique goods",
    bodyEn: "French nuance, antique goods",
    titleFontSize: 14,
    titleFontSizeMobile: 10,
    bodyFontSize: 24,
    bodyFontSizeMobile: 16,
    isDraft: false,
  },
};

export default function Home() {
  const { t } = useLanguage();
  const { adminPreview, deviceView, forceMobileLayout } = useAdmin();
  const { toast } = useToast();
  const viewportIsMobile = useIsMobile();

  // isMobile is true when: admin forces mobile layout OR real viewport is mobile
  const isMobile = forceMobileLayout || viewportIsMobile;

  // Track if we've already tried to initialize blocks
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Booking confirmation dialog state
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Query key for page blocks (array format for proper cache invalidation)
  const blocksQueryKey = ["/api", "pages", HOME_PAGE_ID, "blocks"];

  // Fetch page blocks from database using default fetcher
  const { data: blocks = [], isLoading } = useQuery<PageBlock[]>({
    queryKey: blocksQueryKey,
  });

  // Find specific blocks
  const heroBlock = blocks.find(b => b.blockType === "hero");
  const conceptBlock = blocks.find(b => b.blockType === "concept");
  const brandingBlock = blocks.find(b => b.blockType === "branding");

  // Create block mutation
  const createBlockMutation = useMutation({
    mutationFn: async (blockData: Partial<PageBlock>) => {
      return apiRequest("POST", "/api/admin/page-blocks", {
        ...blockData,
        pageId: HOME_PAGE_ID,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blocksQueryKey });
    },
    onError: () => {
      setHasInitialized(false);
    },
  });

  // Update block mutation
  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PageBlock> }) => {
      return apiRequest("PATCH", `/api/admin/page-blocks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blocksQueryKey });
      toast({ 
        title: t("Salvato", "Saved"), 
        description: t("Le modifiche sono state salvate.", "Changes have been saved.") 
      });
    },
    onError: () => {
      toast({ 
        title: t("Errore", "Error"), 
        description: t("Impossibile salvare le modifiche.", "Failed to save changes."),
        variant: "destructive"
      });
    },
  });

  // Initialize default blocks only once if they don't exist
  useEffect(() => {
    const needsHero = !heroBlock && !isLoading;
    const needsConcept = !conceptBlock && !isLoading;
    const needsBranding = !brandingBlock && !isLoading;
    
    if (needsHero && !hasInitialized && !createBlockMutation.isPending) {
      setHasInitialized(true);
      createBlockMutation.mutate(DEFAULT_BLOCKS.hero, {
        onSuccess: () => {
          if (needsConcept) {
            createBlockMutation.mutate(DEFAULT_BLOCKS.concept, {
              onSuccess: () => {
                if (needsBranding) {
                  createBlockMutation.mutate(DEFAULT_BLOCKS.branding);
                }
              }
            });
          } else if (needsBranding) {
            createBlockMutation.mutate(DEFAULT_BLOCKS.branding);
          }
        }
      });
    } else if (needsConcept && heroBlock && !hasInitialized && !createBlockMutation.isPending) {
      setHasInitialized(true);
      createBlockMutation.mutate(DEFAULT_BLOCKS.concept, {
        onSuccess: () => {
          if (needsBranding) {
            createBlockMutation.mutate(DEFAULT_BLOCKS.branding);
          }
        }
      });
    } else if (needsBranding && heroBlock && conceptBlock && !hasInitialized && !createBlockMutation.isPending) {
      setHasInitialized(true);
      createBlockMutation.mutate(DEFAULT_BLOCKS.branding);
    }
  }, [isLoading, heroBlock, conceptBlock, brandingBlock, hasInitialized, createBlockMutation.isPending]);

  // Handle hero image save
  const handleHeroImageSave = (data: {
    src: string;
    zoomDesktop: number;
    zoomMobile: number;
    offsetXDesktop: number;
    offsetYDesktop: number;
    offsetXMobile: number;
    offsetYMobile: number;
  }) => {
    if (!heroBlock) return;
    
    updateBlockMutation.mutate({
      id: heroBlock.id,
      data: {
        imageUrl: data.src,
        imageScaleDesktop: data.zoomDesktop,
        imageScaleMobile: data.zoomMobile,
        imageOffsetX: data.offsetXDesktop,
        imageOffsetY: data.offsetYDesktop,
        imageOffsetXMobile: data.offsetXMobile,
        imageOffsetYMobile: data.offsetYMobile,
      },
    });
  };

  // Handle hero text save
  const handleHeroTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!heroBlock) return;
    updateBlockMutation.mutate({
      id: heroBlock.id,
      data: {
        titleIt: data.textIt,
        titleEn: data.textEn,
        titleFontSize: data.fontSizeDesktop,
        titleFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  const handleHeroSubtitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!heroBlock) return;
    updateBlockMutation.mutate({
      id: heroBlock.id,
      data: {
        bodyIt: data.textIt,
        bodyEn: data.textEn,
        bodyFontSize: data.fontSizeDesktop,
        bodyFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  // Handle concept text save
  const handleConceptTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!conceptBlock) return;
    updateBlockMutation.mutate({
      id: conceptBlock.id,
      data: {
        titleIt: data.textIt,
        titleEn: data.textEn,
        titleFontSize: data.fontSizeDesktop,
        titleFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  const handleConceptBodySave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!conceptBlock) return;
    updateBlockMutation.mutate({
      id: conceptBlock.id,
      data: {
        bodyIt: data.textIt,
        bodyEn: data.textEn,
        bodyFontSize: data.fontSizeDesktop,
        bodyFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  // Handle branding text save
  const handleBrandingTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!brandingBlock) return;
    updateBlockMutation.mutate({
      id: brandingBlock.id,
      data: {
        titleIt: data.textIt,
        titleEn: data.textEn,
        titleFontSize: data.fontSizeDesktop,
        titleFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  const handleBrandingTaglineSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!brandingBlock) return;
    updateBlockMutation.mutate({
      id: brandingBlock.id,
      data: {
        bodyIt: data.textIt,
        bodyEn: data.textEn,
        bodyFontSize: data.fontSizeDesktop,
        bodyFontSizeMobile: data.fontSizeMobile,
      },
    });
  };

  // Get current values from database or defaults
  const heroTitle = {
    it: heroBlock?.titleIt || DEFAULT_BLOCKS.hero.titleIt,
    en: heroBlock?.titleEn || DEFAULT_BLOCKS.hero.titleEn,
    fontSizeDesktop: heroBlock?.titleFontSize || DEFAULT_BLOCKS.hero.titleFontSize,
    fontSizeMobile: heroBlock?.titleFontSizeMobile || DEFAULT_BLOCKS.hero.titleFontSizeMobile,
  };
  
  const heroSubtitle = {
    it: heroBlock?.bodyIt || DEFAULT_BLOCKS.hero.bodyIt,
    en: heroBlock?.bodyEn || DEFAULT_BLOCKS.hero.bodyEn,
    fontSizeDesktop: heroBlock?.bodyFontSize || DEFAULT_BLOCKS.hero.bodyFontSize,
    fontSizeMobile: heroBlock?.bodyFontSizeMobile || DEFAULT_BLOCKS.hero.bodyFontSizeMobile,
  };

  const heroImage = {
    src: heroBlock?.imageUrl || DEFAULT_BLOCKS.hero.imageUrl,
    zoomDesktop: heroBlock?.imageScaleDesktop || DEFAULT_BLOCKS.hero.imageScaleDesktop,
    zoomMobile: heroBlock?.imageScaleMobile || DEFAULT_BLOCKS.hero.imageScaleMobile,
    offsetXDesktop: heroBlock?.imageOffsetX || DEFAULT_BLOCKS.hero.imageOffsetX,
    offsetYDesktop: heroBlock?.imageOffsetY || DEFAULT_BLOCKS.hero.imageOffsetY,
    offsetXMobile: heroBlock?.imageOffsetXMobile || DEFAULT_BLOCKS.hero.imageOffsetXMobile,
    offsetYMobile: heroBlock?.imageOffsetYMobile || DEFAULT_BLOCKS.hero.imageOffsetYMobile,
  };

  const conceptTitle = {
    it: conceptBlock?.titleIt || DEFAULT_BLOCKS.concept.titleIt,
    en: conceptBlock?.titleEn || DEFAULT_BLOCKS.concept.titleEn,
    fontSizeDesktop: conceptBlock?.titleFontSize || DEFAULT_BLOCKS.concept.titleFontSize,
    fontSizeMobile: conceptBlock?.titleFontSizeMobile || DEFAULT_BLOCKS.concept.titleFontSizeMobile,
  };

  const conceptBody = {
    it: conceptBlock?.bodyIt || DEFAULT_BLOCKS.concept.bodyIt,
    en: conceptBlock?.bodyEn || DEFAULT_BLOCKS.concept.bodyEn,
    fontSizeDesktop: conceptBlock?.bodyFontSize || DEFAULT_BLOCKS.concept.bodyFontSize,
    fontSizeMobile: conceptBlock?.bodyFontSizeMobile || DEFAULT_BLOCKS.concept.bodyFontSizeMobile,
  };

  const brandingTitle = {
    it: brandingBlock?.titleIt || DEFAULT_BLOCKS.branding.titleIt,
    en: brandingBlock?.titleEn || DEFAULT_BLOCKS.branding.titleEn,
    fontSizeDesktop: brandingBlock?.titleFontSize || DEFAULT_BLOCKS.branding.titleFontSize,
    fontSizeMobile: brandingBlock?.titleFontSizeMobile || DEFAULT_BLOCKS.branding.titleFontSizeMobile,
  };

  const brandingTagline = {
    it: brandingBlock?.bodyIt || DEFAULT_BLOCKS.branding.bodyIt,
    en: brandingBlock?.bodyEn || DEFAULT_BLOCKS.branding.bodyEn,
    fontSizeDesktop: brandingBlock?.bodyFontSize || DEFAULT_BLOCKS.branding.bodyFontSize,
    fontSizeMobile: brandingBlock?.bodyFontSizeMobile || DEFAULT_BLOCKS.branding.bodyFontSizeMobile,
  };

  const displayZoom = deviceView === "desktop" ? heroImage.zoomDesktop : heroImage.zoomMobile;
  const displayOffsetX = deviceView === "desktop" ? heroImage.offsetXDesktop : heroImage.offsetXMobile;
  const displayOffsetY = deviceView === "desktop" ? heroImage.offsetYDesktop : heroImage.offsetYMobile;

  // Responsive classes - homepage hero smaller to fit branding section above the fold
  // All classes use isMobile conditional to work correctly in admin preview
  const heroHeight = isMobile ? "h-[45vh]" : "h-[50vh]";
  const sectionPadding = isMobile ? "py-10" : "py-20";
  const titleMargin = isMobile ? "mb-8" : "mb-12";
  const cardGrid = isMobile ? "grid grid-cols-1 gap-6" : "grid grid-cols-3 gap-8";
  const twoColGrid = isMobile ? "grid grid-cols-1 gap-6" : "grid-cols-2 gap-12 items-center";
  const titleSize = isMobile ? "text-3xl" : "text-4xl";
  const logoHeight = isMobile ? "h-8" : "h-16";

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className={`relative ${heroHeight}`}>
        <div className={`absolute inset-y-0 ${isMobile ? "left-4 right-4 rounded-xl" : "left-0 right-0 rounded-none"} overflow-hidden`}>
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
        </div>
      </section>

      {/* Branding Section - optimized for mobile */}
      <section className={`${isMobile ? "py-4" : "py-12"} text-center`} data-testid="section-branding">
        <div className="container mx-auto px-4">
          {/* RESTAURANT & COCKTAIL BAR - Editable */}
          <div className={isMobile ? "mb-2" : "mb-4"}>
            <EditableText
              textIt={brandingTitle.it}
              textEn={brandingTitle.en}
              fontSizeDesktop={brandingTitle.fontSizeDesktop}
              fontSizeMobile={brandingTitle.fontSizeMobile}
              as="p"
              className={`${isMobile ? "tracking-[0.2em]" : "tracking-[0.4em]"} font-medium uppercase`}
              style={{ 
                color: '#c9a048',
                fontFamily: 'Montserrat, sans-serif'
              }}
              applyFontSize
              onSave={handleBrandingTitleSave}
              data-testid="text-restaurant-bar"
            />
          </div>
          
          {/* CAMERA CON VISTA Logo */}
          <div className={`flex justify-center ${isMobile ? "mb-2" : "mb-4"}`}>
            <img 
              src={logoImg} 
              alt="Camera con Vista" 
              className={`${logoHeight} w-auto`}
              data-testid="img-logo"
            />
          </div>
          
          {/* French nuance, antique goods - Editable */}
          <div className={isMobile ? "mb-4" : "mb-8"}>
            <EditableText
              textIt={brandingTagline.it}
              textEn={brandingTagline.en}
              fontSizeDesktop={brandingTagline.fontSizeDesktop}
              fontSizeMobile={brandingTagline.fontSizeMobile}
              as="p"
              className="italic"
              style={{ 
                fontFamily: 'Adelia, cursive',
                color: '#2d2926'
              }}
              applyFontSize
              onSave={handleBrandingTaglineSave}
              data-testid="text-tagline"
            />
          </div>
          
          {/* PRENOTA UN TAVOLO Button */}
          <button 
            onClick={() => setBookingDialogOpen(true)}
            className={`inline-block ${isMobile ? "px-6 py-2.5 text-xs tracking-[0.15em]" : "px-12 py-4 text-base tracking-[0.2em]"} font-medium text-white rounded-full transition-all hover:opacity-90`}
            style={{ 
              backgroundColor: '#722f37',
              fontFamily: 'Montserrat, sans-serif'
            }}
            data-testid="button-book-table"
          >
            {t("PRENOTA UN TAVOLO", "BOOK A TABLE")}
          </button>
        </div>
      </section>

      {/* Booking Confirmation Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-display text-xl">
              {t("Prima di prenotare", "Before you book")}
            </DialogTitle>
            <DialogDescription className="text-center pt-4 space-y-2">
              <p>{t("Accettiamo prenotazioni esclusivamente per la cena.", "We accept reservations exclusively for dinner.")}</p>
              <p>{t("Verrà richiesta una carta di credito a garanzia,", "A credit card will be required as a guarantee,")}</p>
              <p>{t("con addebito della penale SOLO in caso di mancata presentazione,", "and a penalty will be charged ONLY in the event,")}</p>
              <p>{t("senza preventiva comunicazione.", "of a no-show without prior notice.")}</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-3 sm:justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setBookingDialogOpen(false)}
              data-testid="button-cancel-booking"
            >
              {t("Annulla", "Cancel")}
            </Button>
            <Button
              onClick={() => {
                setBookingDialogOpen(false);
                window.open("https://cameraconvista.resos.com/booking", "_blank");
              }}
              style={{ backgroundColor: '#722f37' }}
              className="text-white hover:opacity-90"
              data-testid="button-continue-booking"
            >
              {t("Continua", "Continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className={sectionPadding}>
        <div className="container mx-auto px-4">
          <div className={`text-center max-w-3xl mx-auto ${titleMargin}`}>
            <EditableText
              textIt={conceptTitle.it}
              textEn={conceptTitle.en}
              fontSizeDesktop={conceptTitle.fontSizeDesktop}
              fontSizeMobile={conceptTitle.fontSizeMobile}
              as="h2"
              className="font-display mb-4"
              applyFontSize
              onSave={handleConceptTitleSave}
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
              onSave={handleConceptBodySave}
            />
          </div>

          <div className={cardGrid}>
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
