import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { EventWizard } from "@/components/eventi/EventWizard";
import { EditableText } from "@/components/admin/EditableText";
import { ImageContainer } from "@/components/admin/ImageContainer";
import type { ImageContainerSaveData } from "@/components/admin/ImageContainer";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, CENA_PAGE_DEFAULTS } from "@/lib/page-defaults";

export default function CenaPage() {
  const { t } = useLanguage();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { getBlock, updateBlock, isLoading } = usePageBlocks({
    pageId: PAGE_IDS["eventi-privati-cena"],
    defaults: CENA_PAGE_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");
  const sectionABlock = getBlock("section-a");
  const gallery1Block = getBlock("gallery-1");
  const gallery2Block = getBlock("gallery-2");
  const ctaBlock = getBlock("cta");

  const heroDef = CENA_PAGE_DEFAULTS.find(d => d.blockType === "hero")!;
  const introDef = CENA_PAGE_DEFAULTS.find(d => d.blockType === "intro")!;
  const sectionADef = CENA_PAGE_DEFAULTS.find(d => d.blockType === "section-a")!;
  const gallery1Def = CENA_PAGE_DEFAULTS.find(d => d.blockType === "gallery-1")!;
  const gallery2Def = CENA_PAGE_DEFAULTS.find(d => d.blockType === "gallery-2")!;
  const ctaDef = CENA_PAGE_DEFAULTS.find(d => d.blockType === "cta")!;

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
        { block: sectionABlock, def: sectionADef, imgBlock: gallery1Block, imgDef: gallery1Def, idx: 0 },
      ].map(({ block, def, imgBlock, imgDef, idx }) => (
        <section key={idx} className="py-6 md:py-10">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-stretch">
              <div className="bg-card rounded-xl p-6 md:p-8" data-testid="section-cena">
                <EditableText
                  textIt={block?.titleIt || def.titleIt || ""}
                  textEn={block?.titleEn || def.titleEn || ""}
                  fontSizeDesktop={block?.titleFontSize || def.titleFontSize || 24}
                  fontSizeMobile={block?.titleFontSizeMobile || def.titleFontSizeMobile || 20}
                  as="h3"
                  className="font-display mb-4"
                  applyFontSize
                  onSave={makeTextSave(block, "title")}
                />
                <EditableText
                  textIt={block?.bodyIt || def.bodyIt || ""}
                  textEn={block?.bodyEn || def.bodyEn || ""}
                  fontSizeDesktop={block?.bodyFontSize || def.bodyFontSize || 16}
                  fontSizeMobile={block?.bodyFontSizeMobile || def.bodyFontSizeMobile || 14}
                  as="p"
                  className="text-muted-foreground whitespace-pre-line"
                  multiline
                  applyFontSize
                  onSave={makeTextSave(block, "body")}
                />
              </div>
              <div data-testid={`cena-gallery-${idx + 1}`}>
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
                  testIdPrefix={`cena-gallery-${idx + 1}`}
                  onSave={makeImageSave(imgBlock)}
                />
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="py-6 md:py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div />
            <div data-testid="cena-gallery-2">
              <ImageContainer
                src={gallery2Block?.imageUrl || gallery2Def.imageUrl || ""}
                zoom={gallery2Block?.imageScaleDesktop || gallery2Def.imageScaleDesktop || 100}
                panX={gallery2Block?.imageOffsetX ?? gallery2Def.imageOffsetX ?? 0}
                panY={gallery2Block?.imageOffsetY ?? gallery2Def.imageOffsetY ?? 0}
                overlay={(gallery2Block?.metadata as Record<string, unknown>)?.overlay as number ?? 0}
                zoomMobile={gallery2Block?.imageScaleMobile || gallery2Def.imageScaleMobile || 100}
                panXMobile={gallery2Block?.imageOffsetXMobile ?? gallery2Def.imageOffsetXMobile ?? 0}
                panYMobile={gallery2Block?.imageOffsetYMobile ?? gallery2Def.imageOffsetYMobile ?? 0}
                overlayMobile={(gallery2Block?.metadata as Record<string, unknown>)?.overlayMobile as number ?? 0}
                containerClassName="rounded-placeholder"
                aspectRatio="4/3"
                testIdPrefix="cena-gallery-2"
                onSave={makeImageSave(gallery2Block)}
              />
            </div>
          </div>
        </div>
      </section>

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

      <EventWizard eventType="cena" open={wizardOpen} onOpenChange={setWizardOpen} />
    </PublicLayout>
  );
}
