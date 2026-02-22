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
  const gallery3Block = getBlock("gallery-3");
  const ctaBlock = getBlock("cta");

  const heroDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "hero")!;
  const introDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "intro")!;
  const convDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "option-convivialis")!;
  const ccvDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "option-riserva-ccv")!;
  const jazzDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "option-riserva-jazz")!;
  const gallery1Def = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "gallery-1")!;
  const gallery2Def = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "gallery-2")!;
  const gallery3Def = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "gallery-3")!;
  const ctaDef = ESCLUSIVO_PAGE_DEFAULTS.find(d => d.blockType === "cta")!;

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
      <section className="pt-10 pb-6 md:pt-16 md:pb-8 px-4 md:px-8">
        <div className="mx-auto max-w-[1560px] text-center">
          <EditableText
            textIt={heroBlock?.titleIt || heroDef.titleIt || ""}
            textEn={heroBlock?.titleEn || heroDef.titleEn || ""}
            fontSizeDesktop={heroBlock?.titleFontSize || heroDef.titleFontSize || 72}
            fontSizeMobile={heroBlock?.titleFontSizeMobile || heroDef.titleFontSizeMobile || 40}
            as="h1"
            className="font-display text-foreground"
            applyFontSize
            onSave={makeTextSave(heroBlock, "title")}
          />
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

      {[
        { opt: options[0], imgBlock: gallery1Block, imgDef: gallery1Def, idx: 0 },
        { opt: options[1], imgBlock: gallery2Block, imgDef: gallery2Def, idx: 1 },
        { opt: options[2], imgBlock: gallery3Block, imgDef: gallery3Def, idx: 2 },
      ].map(({ opt, imgBlock, imgDef, idx }) => (
        <section key={idx} className="py-6 md:py-10">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
              <Card className="hover-elevate flex" data-testid={`card-${opt.testId}`}>
                <CardContent className="p-6 flex flex-col items-center text-center flex-1">
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
              <div data-testid={`esclusivo-gallery-${idx + 1}`}>
                <ImageContainer
                  src={imgBlock?.imageUrl || imgDef.imageUrl || ""}
                  zoom={imgBlock?.imageScaleDesktop || imgDef.imageScaleDesktop || 100}
                  panX={imgBlock?.imageOffsetX ?? imgDef.imageOffsetX ?? 0}
                  panY={imgBlock?.imageOffsetY ?? imgDef.imageOffsetY ?? 0}
                  overlay={(imgBlock?.metadata as Record<string, unknown>)?.overlay as number ?? 0}
                  zoomMobile={imgBlock?.imageScaleMobile || imgDef.imageScaleMobile || 100}
                  panXMobile={imgBlock?.imageOffsetXMobile ?? imgDef.imageOffsetXMobile ?? 0}
                  panYMobile={imgBlock?.imageOffsetYMobile ?? imgDef.imageOffsetYMobile ?? 0}
                  overlayMobile={(imgBlock?.metadata as Record<string, unknown>)?.overlayMobile as number ?? 0}
                  containerClassName="rounded-placeholder"
                  aspectRatio="4/3"
                  testIdPrefix={`esclusivo-gallery-${idx + 1}`}
                  onSave={makeImageSave(imgBlock)}
                />
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="py-10 md:py-16 bg-card">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <EditableText
            textIt={ctaBlock?.titleIt || ctaDef.titleIt || ""}
            textEn={ctaBlock?.titleEn || ctaDef.titleEn || ""}
            fontSizeDesktop={ctaBlock?.titleFontSize || ctaDef.titleFontSize || 28}
            fontSizeMobile={ctaBlock?.titleFontSizeMobile || ctaDef.titleFontSizeMobile || 24}
            as="h2"
            className="font-display mb-4"
            applyFontSize
            onSave={makeTextSave(ctaBlock, "title")}
          />
          <EditableText
            textIt={ctaBlock?.bodyIt || ctaDef.bodyIt || ""}
            textEn={ctaBlock?.bodyEn || ctaDef.bodyEn || ""}
            fontSizeDesktop={ctaBlock?.bodyFontSize || ctaDef.bodyFontSize || 18}
            fontSizeMobile={ctaBlock?.bodyFontSizeMobile || ctaDef.bodyFontSizeMobile || 14}
            as="p"
            className="text-muted-foreground mb-8"
            applyFontSize
            onSave={makeTextSave(ctaBlock, "body")}
          />
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
