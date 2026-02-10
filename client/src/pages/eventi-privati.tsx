import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Users, Utensils, Music, Star, ArrowRight } from "lucide-react";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, EVENTI_PRIVATI_DEFAULTS } from "@/lib/page-defaults";

export default function EventiPrivati() {
  const { t } = useLanguage();
  const { deviceView } = useAdmin();

  const { getBlock, updateBlock, isLoading: blocksLoading } = usePageBlocks({
    pageId: PAGE_IDS["eventi-privati"],
    defaults: EVENTI_PRIVATI_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");
  const sectionTitleBlock = getBlock("section-title");
  const spaces1Block = getBlock("spaces-1");
  const spaces2Block = getBlock("spaces-2");
  const spaces3Block = getBlock("spaces-3");

  const heroDef = EVENTI_PRIVATI_DEFAULTS[0];
  const introDef = EVENTI_PRIVATI_DEFAULTS[1];
  const sectionTitleDef = EVENTI_PRIVATI_DEFAULTS[2];
  const spaces1Def = EVENTI_PRIVATI_DEFAULTS[3];
  const spaces2Def = EVENTI_PRIVATI_DEFAULTS[4];
  const spaces3Def = EVENTI_PRIVATI_DEFAULTS[5];

  const handleHeroTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

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
    updateBlock(heroBlock.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoomDesktop,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.offsetXDesktop,
      imageOffsetY: data.offsetYDesktop,
      imageOffsetXMobile: data.offsetXMobile,
      imageOffsetYMobile: data.offsetYMobile,
    });
  };

  const handleIntroSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!introBlock) return;
    updateBlock(introBlock.id, {
      bodyIt: data.textIt,
      bodyEn: data.textEn,
      bodyFontSize: data.fontSizeDesktop,
      bodyFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleSectionTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!sectionTitleBlock) return;
    updateBlock(sectionTitleBlock.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

  const makeSpacesImageSave = (block: ReturnType<typeof getBlock>) => (data: {
    src: string;
    zoomDesktop: number;
    zoomMobile: number;
    offsetXDesktop: number;
    offsetYDesktop: number;
    offsetXMobile: number;
    offsetYMobile: number;
  }) => {
    if (!block) return;
    updateBlock(block.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoomDesktop,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.offsetXDesktop,
      imageOffsetY: data.offsetYDesktop,
      imageOffsetXMobile: data.offsetXMobile,
      imageOffsetYMobile: data.offsetYMobile,
    });
  };

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

  if (blocksLoading) {
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
      <div className="min-h-[calc(100vh-80px)] flex flex-col">
        <section className="relative h-[60vh] shrink-0 flex items-center justify-center">
          <div className="absolute inset-y-0 left-4 right-4 md:left-0 md:right-0 rounded-xl md:rounded-none overflow-hidden">
            <EditableImage
              src={heroBlock?.imageUrl || heroDef.imageUrl || ""}
              zoomDesktop={heroBlock?.imageScaleDesktop || heroDef.imageScaleDesktop || 100}
              zoomMobile={heroBlock?.imageScaleMobile || heroDef.imageScaleMobile || 100}
              offsetXDesktop={heroBlock?.imageOffsetX || heroDef.imageOffsetX || 0}
              offsetYDesktop={heroBlock?.imageOffsetY || heroDef.imageOffsetY || 0}
              offsetXMobile={heroBlock?.imageOffsetXMobile || heroDef.imageOffsetXMobile || 0}
              offsetYMobile={heroBlock?.imageOffsetYMobile || heroDef.imageOffsetYMobile || 0}
              deviceView={deviceView}
              containerClassName="absolute inset-0"
              className="w-full h-full object-cover"
              onSave={handleHeroImageSave}
            />
            <div className="absolute inset-0 bg-black/35 pointer-events-none" />
          </div>
          <div className="relative z-10 text-center text-white">
            <EditableText
              textIt={heroBlock?.titleIt || heroDef.titleIt || ""}
              textEn={heroBlock?.titleEn || heroDef.titleEn || ""}
              fontSizeDesktop={heroBlock?.titleFontSize || heroDef.titleFontSize || 72}
              fontSizeMobile={heroBlock?.titleFontSizeMobile || heroDef.titleFontSizeMobile || 40}
              as="h1"
              className="font-display drop-shadow-lg"
              applyFontSize
              onSave={handleHeroTitleSave}
            />
          </div>
        </section>

        <section className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 max-w-2xl text-center py-6">
            <EditableText
              textIt={introBlock?.bodyIt || introDef.bodyIt || ""}
              textEn={introBlock?.bodyEn || introDef.bodyEn || ""}
              fontSizeDesktop={introBlock?.bodyFontSize || introDef.bodyFontSize || 20}
              fontSizeMobile={introBlock?.bodyFontSizeMobile || introDef.bodyFontSizeMobile || 14}
              as="p"
              className="text-muted-foreground"
              multiline
              applyFontSize
              onSave={handleIntroSave}
            />
          </div>
        </section>
      </div>

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 max-w-3xl mx-auto">
            <EditableText
              textIt={sectionTitleBlock?.titleIt || sectionTitleDef.titleIt || ""}
              textEn={sectionTitleBlock?.titleEn || sectionTitleDef.titleEn || ""}
              fontSizeDesktop={sectionTitleBlock?.titleFontSize || sectionTitleDef.titleFontSize || 36}
              fontSizeMobile={sectionTitleBlock?.titleFontSizeMobile || sectionTitleDef.titleFontSizeMobile || 28}
              as="h2"
              className="font-display mb-4"
              applyFontSize
              onSave={handleSectionTitleSave}
            />
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

      <section className="py-10 md:py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-4xl mb-4" data-testid="text-request-quote">
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

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-4xl text-center mb-8" data-testid="text-gallery-title">
            {t("I nostri spazi", "Our Spaces")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { block: spaces1Block, def: spaces1Def, idx: 1 },
              { block: spaces2Block, def: spaces2Def, idx: 2 },
              { block: spaces3Block, def: spaces3Def, idx: 3 },
            ].map(({ block, def, idx }) => (
              <div key={idx} data-testid={`spaces-image-${idx}`}>
                <EditableImage
                  src={block?.imageUrl || def.imageUrl || ""}
                  zoomDesktop={block?.imageScaleDesktop || def.imageScaleDesktop || 100}
                  zoomMobile={block?.imageScaleMobile || def.imageScaleMobile || 100}
                  offsetXDesktop={block?.imageOffsetX || def.imageOffsetX || 0}
                  offsetYDesktop={block?.imageOffsetY || def.imageOffsetY || 0}
                  offsetXMobile={block?.imageOffsetXMobile || def.imageOffsetXMobile || 0}
                  offsetYMobile={block?.imageOffsetYMobile || def.imageOffsetYMobile || 0}
                  deviceView={deviceView}
                  containerClassName="aspect-[4/3] rounded-placeholder overflow-hidden relative"
                  className="w-full h-full object-cover"
                  onSave={makeSpacesImageSave(block)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
