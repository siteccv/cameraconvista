import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { EditableText } from "@/components/admin/EditableText";
import { ImageContainer } from "@/components/admin/ImageContainer";
import type { ImageContainerSaveData } from "@/components/admin/ImageContainer";
import { usePageBlocks } from "@/hooks/use-page-blocks";
import { PAGE_IDS, EVENTI_PRIVATI_DEFAULTS } from "@/lib/page-defaults";

interface EventiPrivatiProps {
  onNavigateSubPage?: (href: string) => void;
}

export default function EventiPrivati({ onNavigateSubPage }: EventiPrivatiProps) {
  const { t } = useLanguage();
  const { adminPreview } = useAdmin();

  const { getBlock, updateBlock, isLoading: blocksLoading } = usePageBlocks({
    pageId: PAGE_IDS["eventi-privati"],
    defaults: EVENTI_PRIVATI_DEFAULTS,
  });

  const heroBlock = getBlock("hero");
  const introBlock = getBlock("intro");
  const sectionTitleBlock = getBlock("section-title");
  const pkg1Block = getBlock("package-1");
  const pkg2Block = getBlock("package-2");
  const pkg3Block = getBlock("package-3");
  const pkg4Block = getBlock("package-4");
  const spaces1Block = getBlock("spaces-1");
  const spaces2Block = getBlock("spaces-2");
  const spaces3Block = getBlock("spaces-3");
  const ctaBlock = getBlock("cta");
  const spacesTitleBlock = getBlock("spaces-title");

  const heroDef = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "hero")!;
  const introDef = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "intro")!;
  const sectionTitleDef = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "section-title")!;
  const pkg1Def = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "package-1")!;
  const pkg2Def = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "package-2")!;
  const pkg3Def = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "package-3")!;
  const pkg4Def = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "package-4")!;
  const spaces1Def = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "spaces-1")!;
  const spaces2Def = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "spaces-2")!;
  const spaces3Def = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "spaces-3")!;
  const ctaDef = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "cta")!;
  const spacesTitleDef = EVENTI_PRIVATI_DEFAULTS.find(d => d.blockType === "spaces-title")!;

  const handleHeroTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleHeroImageSave = (data: ImageContainerSaveData) => {
    if (!heroBlock) return;
    updateBlock(heroBlock.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoom,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.panX,
      imageOffsetY: data.panY,
      imageOffsetXMobile: data.panXMobile,
      imageOffsetYMobile: data.panYMobile,
      metadata: {
        ...(heroBlock.metadata as Record<string, unknown> || {}),
        overlay: data.overlay,
        overlayMobile: data.overlayMobile,
      },
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

  const makeSpacesImageSave = (block: ReturnType<typeof getBlock>) => (data: ImageContainerSaveData) => {
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

  const makePackageTitleSave = (block: ReturnType<typeof getBlock>) => (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!block) return;
    updateBlock(block.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

  const makePackageBodySave = (block: ReturnType<typeof getBlock>) => (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!block) return;
    updateBlock(block.id, {
      bodyIt: data.textIt,
      bodyEn: data.textEn,
      bodyFontSize: data.fontSizeDesktop,
      bodyFontSizeMobile: data.fontSizeMobile,
    });
  };

  const makeTextSave = (block: ReturnType<typeof getBlock>, field: "title" | "body") =>
    (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
      if (!block) return;
      updateBlock(block.id, field === "title"
        ? { titleIt: data.textIt, titleEn: data.textEn, titleFontSize: data.fontSizeDesktop, titleFontSizeMobile: data.fontSizeMobile }
        : { bodyIt: data.textIt, bodyEn: data.textEn, bodyFontSize: data.fontSizeDesktop, bodyFontSizeMobile: data.fontSizeMobile }
      );
    };

  const packageItems = [
    { block: pkg1Block, def: pkg1Def, href: "/eventi-privati/aperitivo" },
    { block: pkg2Block, def: pkg2Def, href: "/eventi-privati/cena" },
    { block: pkg4Block, def: pkg4Def, href: "/eventi-privati/esclusivo" },
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
        <section className="h-[60vh] shrink-0 px-4 md:px-8">
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
              testIdPrefix="eventi-privati-hero"
              onSave={handleHeroImageSave}
            >
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
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
              </div>
            </ImageContainer>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {packageItems.map((pkg, index) => {
              const cardContent = (
                <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-package-${index}`}>
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <EditableText
                      textIt={pkg.block?.titleIt || pkg.def.titleIt || ""}
                      textEn={pkg.block?.titleEn || pkg.def.titleEn || ""}
                      fontSizeDesktop={pkg.block?.titleFontSize || pkg.def.titleFontSize || 20}
                      fontSizeMobile={pkg.block?.titleFontSizeMobile || pkg.def.titleFontSizeMobile || 18}
                      as="h3"
                      className="font-display mb-2"
                      applyFontSize
                      onSave={makePackageTitleSave(pkg.block)}
                    />
                    <EditableText
                      textIt={pkg.block?.bodyIt || pkg.def.bodyIt || ""}
                      textEn={pkg.block?.bodyEn || pkg.def.bodyEn || ""}
                      fontSizeDesktop={pkg.block?.bodyFontSize || pkg.def.bodyFontSize || 14}
                      fontSizeMobile={pkg.block?.bodyFontSizeMobile || pkg.def.bodyFontSizeMobile || 13}
                      as="p"
                      className="text-muted-foreground"
                      multiline
                      applyFontSize
                      onSave={makePackageBodySave(pkg.block)}
                    />
                    <div className="mt-4 text-primary flex items-center text-sm font-medium">
                      {adminPreview && onNavigateSubPage
                        ? t("Modifica pagina dedicata", "Edit dedicated page")
                        : t("Scopri di più", "Learn More")}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              );

              if (adminPreview && onNavigateSubPage) {
                return (
                  <div
                    key={index}
                    className="block"
                    onClick={() => onNavigateSubPage(pkg.href)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") onNavigateSubPage(pkg.href); }}
                    data-testid={`admin-card-package-${index}`}
                  >
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link key={index} href={pkg.href} className="block">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <EditableText
              textIt={ctaBlock?.titleIt || ctaDef.titleIt || ""}
              textEn={ctaBlock?.titleEn || ctaDef.titleEn || ""}
              fontSizeDesktop={ctaBlock?.titleFontSize || ctaDef.titleFontSize || 32}
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
            <a href="mailto:info@cameraconvista.it">
              <Button size="lg" data-testid="button-request-quote">
                {t("Contattaci", "Contact Us")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <EditableText
            textIt={spacesTitleBlock?.titleIt || spacesTitleDef.titleIt || ""}
            textEn={spacesTitleBlock?.titleEn || spacesTitleDef.titleEn || ""}
            fontSizeDesktop={spacesTitleBlock?.titleFontSize || spacesTitleDef.titleFontSize || 32}
            fontSizeMobile={spacesTitleBlock?.titleFontSizeMobile || spacesTitleDef.titleFontSizeMobile || 24}
            as="h2"
            className="font-display text-center mb-8"
            applyFontSize
            onSave={makeTextSave(spacesTitleBlock, "title")}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { block: spaces1Block, def: spaces1Def, idx: 1 },
              { block: spaces2Block, def: spaces2Def, idx: 2 },
              { block: spaces3Block, def: spaces3Def, idx: 3 },
            ].map(({ block, def, idx }) => (
              <div key={idx} data-testid={`spaces-image-${idx}`}>
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
                  testIdPrefix={`spaces-${idx}`}
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
