import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Crown, Building2, Music } from "lucide-react";
import { Link } from "wouter";
import { EventWizard } from "@/components/eventi/EventWizard";
import { EditableText } from "@/components/admin/EditableText";
import { ImageContainer } from "@/components/admin/ImageContainer";
import type { ImageContainerSaveData } from "@/components/admin/ImageContainer";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, ESCLUSIVO_PAGE_DEFAULTS } from "@/lib/page-defaults";

export default function EsclusivoPage() {
  const { t } = useLanguage();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { getBlock, updateBlock, isLoading } = usePageBlocks({
    pageId: PAGE_IDS["eventi-privati-esclusivo"],
    defaults: ESCLUSIVO_PAGE_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");
  const convBlock = getBlock("option-convivialis");
  const ccvBlock = getBlock("option-riserva-ccv");
  const jazzBlock = getBlock("option-riserva-jazz");
  const gallery1Block = getBlock("gallery-1");
  const gallery2Block = getBlock("gallery-2");

  const heroDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "hero")!;
  const introDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "intro")!;
  const convDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "option-convivialis")!;
  const ccvDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "option-riserva-ccv")!;
  const jazzDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "option-riserva-jazz")!;
  const gallery1Def = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "gallery-1")!;
  const gallery2Def = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "gallery-2")!;

  const makeTextSave = (block: ReturnType<typeof getBlock>, field: "title" | "body") =>
    (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
      if (!block) return;
      updateBlock(block.id, field === "title"
        ? { titleIt: data.textIt, titleEn: data.textEn, titleFontSize: data.fontSizeDesktop, titleFontSizeMobile: data.fontSizeMobile }
        : { bodyIt: data.textIt, bodyEn: data.textEn, bodyFontSize: data.fontSizeDesktop, bodyFontSizeMobile: data.fontSizeMobile }
      );
    };

  const makeImageSave = (block: ReturnType<typeof getBlock>) => (data: ImageContainerSaveData) => {
    if (!block) return;
    updateBlock(block.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoom,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.panX,
      imageOffsetY: data.panY,
      imageOffsetXMobile: data.panXMobile,
      imageOffsetYMobile: data.panYMobile,
      metadata: {
        ...(block.metadata as Record<string, unknown> || {}),
        overlay: data.overlay,
        overlayMobile: data.overlayMobile,
      },
    });
  };

  const options = [
    { icon: Crown, block: convBlock, def: convDef, testId: "option-convivialis" },
    { icon: Building2, block: ccvBlock, def: ccvDef, testId: "option-riserva-ccv" },
    { icon: Music, block: jazzBlock, def: jazzDef, testId: "option-riserva-jazz" },
  ];

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Caricamento...</div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="h-[50vh] shrink-0 px-4 md:px-8">
        <div className="mx-auto max-w-[1560px] h-full">
          <ImageContainer
            src={heroBlock?.imageUrl || heroDef.imageUrl || ""}
            zoom={heroBlock?.imageScaleDesktop || heroDef.imageScaleDesktop || 100}
            panX={heroBlock?.imageOffsetX ?? heroDef.imageOffsetX ?? 0}
            panY={heroBlock?.imageOffsetY ?? heroDef.imageOffsetY ?? 0}
            overlay={(heroBlock?.metadata as Record<string, unknown>)?.overlay as number ?? 35}
            zoomMobile={heroBlock?.imageScaleMobile || heroDef.imageScaleMobile || 100}
            panXMobile={heroBlock?.imageOffsetXMobile ?? heroDef.imageOffsetXMobile ?? 0}
            panYMobile={heroBlock?.imageOffsetYMobile ?? heroDef.imageOffsetYMobile ?? 0}
            overlayMobile={(heroBlock?.metadata as Record<string, unknown>)?.overlayMobile as number ?? 35}
            containerClassName="w-full h-full rounded-xl"
            aspectRatio="auto"
            referenceWidth={1560}
            testIdPrefix="esclusivo-hero"
            onSave={makeImageSave(heroBlock)}
          >
            <div className="flex items-center justify-center h-full">
              <EditableText
                textIt={heroBlock?.titleIt || heroDef.titleIt || ""}
                textEn={heroBlock?.titleEn || heroDef.titleEn || ""}
                fontSizeDesktop={heroBlock?.titleFontSize || heroDef.titleFontSize || 72}
                fontSizeMobile={heroBlock?.titleFontSizeMobile || heroDef.titleFontSizeMobile || 40}
                as="h1"
                className="font-display text-white drop-shadow-lg text-center"
                applyFontSize
                onSave={makeTextSave(heroBlock, "title")}
              />
            </div>
          </ImageContainer>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <EditableText
            textIt={introBlock?.bodyIt || introDef.bodyIt || ""}
            textEn={introBlock?.bodyEn || introDef.bodyEn || ""}
            fontSizeDesktop={introBlock?.bodyFontSize || introDef.bodyFontSize || 20}
            fontSizeMobile={introBlock?.bodyFontSizeMobile || introDef.bodyFontSizeMobile || 14}
            as="p"
            className="text-muted-foreground"
            multiline
            applyFontSize
            onSave={makeTextSave(introBlock, "body")}
          />
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {options.map((opt) => (
              <Card key={opt.testId} className="hover-elevate" data-testid={`card-${opt.testId}`}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <opt.icon className="h-7 w-7 text-primary" />
                  </div>
                  <EditableText
                    textIt={opt.block?.titleIt || opt.def.titleIt || ""}
                    textEn={opt.block?.titleEn || opt.def.titleEn || ""}
                    fontSizeDesktop={opt.block?.titleFontSize || opt.def.titleFontSize || 22}
                    fontSizeMobile={opt.block?.titleFontSizeMobile || opt.def.titleFontSizeMobile || 18}
                    as="h3"
                    className="font-display mb-3"
                    applyFontSize
                    onSave={makeTextSave(opt.block, "title")}
                  />
                  <EditableText
                    textIt={opt.block?.bodyIt || opt.def.bodyIt || ""}
                    textEn={opt.block?.bodyEn || opt.def.bodyEn || ""}
                    fontSizeDesktop={opt.block?.bodyFontSize || opt.def.bodyFontSize || 15}
                    fontSizeMobile={opt.block?.bodyFontSizeMobile || opt.def.bodyFontSizeMobile || 13}
                    as="p"
                    className="text-muted-foreground whitespace-pre-line text-sm"
                    multiline
                    applyFontSize
                    onSave={makeTextSave(opt.block, "body")}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { block: gallery1Block, def: gallery1Def, idx: 1 },
              { block: gallery2Block, def: gallery2Def, idx: 2 },
            ].map(({ block, def, idx }) => (
              <div key={idx} data-testid={`esclusivo-gallery-${idx}`}>
                <ImageContainer
                  src={block?.imageUrl || def.imageUrl || ""}
                  zoom={block?.imageScaleDesktop || def.imageScaleDesktop || 100}
                  panX={block?.imageOffsetX ?? def.imageOffsetX ?? 0}
                  panY={block?.imageOffsetY ?? def.imageOffsetY ?? 0}
                  overlay={(block?.metadata as Record<string, unknown>)?.overlay as number ?? 0}
                  zoomMobile={block?.imageScaleMobile || def.imageScaleMobile || 100}
                  panXMobile={block?.imageOffsetXMobile ?? def.imageOffsetXMobile ?? 0}
                  panYMobile={block?.imageOffsetYMobile ?? def.imageOffsetYMobile ?? 0}
                  overlayMobile={(block?.metadata as Record<string, unknown>)?.overlayMobile as number ?? 0}
                  containerClassName="rounded-placeholder"
                  aspectRatio="4/3"
                  testIdPrefix={`esclusivo-gallery-${idx}`}
                  onSave={makeImageSave(block)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16 bg-card">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="font-display text-2xl md:text-3xl mb-4" data-testid="text-cta-title">
            {t("Richiedi un preventivo", "Request a Quote")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t(
              "Contattaci per organizzare il tuo evento esclusivo.",
              "Contact us to organize your exclusive event."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/eventi-privati">
              <Button variant="outline" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("Torna indietro", "Go Back")}
              </Button>
            </Link>
            <Button size="lg" data-testid="button-request-quote" onClick={() => setWizardOpen(true)}>
              {t("Richiedi preventivo", "Request Quote")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <EventWizard eventType="esclusivo" open={wizardOpen} onOpenChange={setWizardOpen} />
    </PublicLayout>
  );
}
