import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { EditableText } from "@/components/admin/EditableText";
import { ImageContainer } from "@/components/admin/ImageContainer";
import type { ImageContainerSaveData } from "@/components/admin/ImageContainer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import type { PageBlock } from "@shared/schema";
import type { TeaserBlockDefault } from "./homeDefaults";

interface TeaserSectionProps {
  block: PageBlock | null;
  defaults: TeaserBlockDefault;
  reverse?: boolean;
  alternate?: boolean;
  onUpdateBlock?: (id: number, data: Partial<PageBlock>) => void;
}

export function TeaserSection({ block, defaults, reverse = false, alternate = false, onUpdateBlock }: TeaserSectionProps) {
  const { t } = useLanguage();
  const { forceMobileLayout } = useAdmin();
  const viewportIsMobile = useIsMobile();
  const isMobile = forceMobileLayout || viewportIsMobile;

  const meta = (block?.metadata as Record<string, unknown>) || defaults.metadata;
  const subtitleIt = (meta?.subtitleIt as string) || defaults.metadata.subtitleIt;
  const subtitleEn = (meta?.subtitleEn as string) || defaults.metadata.subtitleEn;
  const testId = (meta?.testId as string) || defaults.metadata.testId;

  const titleIt = block?.titleIt || defaults.titleIt;
  const titleEn = block?.titleEn || defaults.titleEn;
  const titleFontSize = block?.titleFontSize || defaults.titleFontSize;
  const titleFontSizeMobile = block?.titleFontSizeMobile || defaults.titleFontSizeMobile;

  const bodyIt = block?.bodyIt || defaults.bodyIt;
  const bodyEn = block?.bodyEn || defaults.bodyEn;
  const bodyFontSize = block?.bodyFontSize || defaults.bodyFontSize;
  const bodyFontSizeMobile = block?.bodyFontSizeMobile || defaults.bodyFontSizeMobile;

  const ctaLabelIt = block?.ctaTextIt || defaults.ctaTextIt;
  const ctaLabelEn = block?.ctaTextEn || defaults.ctaTextEn;
  const ctaHref = block?.ctaUrl || defaults.ctaUrl;

  const imageSrc = block?.imageUrl || defaults.imageUrl;
  const imageZoom = block?.imageScaleDesktop || defaults.imageScaleDesktop;
  const imageZoomMobile = block?.imageScaleMobile || defaults.imageScaleMobile;
  const imagePanX = block?.imageOffsetX ?? defaults.imageOffsetX;
  const imagePanY = block?.imageOffsetY ?? defaults.imageOffsetY;
  const imagePanXMobile = block?.imageOffsetXMobile ?? defaults.imageOffsetXMobile;
  const imagePanYMobile = block?.imageOffsetYMobile ?? defaults.imageOffsetYMobile;
  const imageOverlay = (meta?.overlay as number) ?? 0;
  const imageOverlayMobile = (meta?.overlayMobile as number) ?? 0;

  const handleSubtitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!block || !onUpdateBlock) return;
    onUpdateBlock(block.id, {
      metadata: { ...meta, subtitleIt: data.textIt, subtitleEn: data.textEn },
    });
  };

  const handleTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!block || !onUpdateBlock) return;
    onUpdateBlock(block.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleBodySave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!block || !onUpdateBlock) return;
    onUpdateBlock(block.id, {
      bodyIt: data.textIt,
      bodyEn: data.textEn,
      bodyFontSize: data.fontSizeDesktop,
      bodyFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleCtaSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!block || !onUpdateBlock) return;
    onUpdateBlock(block.id, {
      ctaTextIt: data.textIt,
      ctaTextEn: data.textEn,
    });
  };

  const handleImageSave = (data: ImageContainerSaveData) => {
    if (!block || !onUpdateBlock) return;
    onUpdateBlock(block.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoom,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.panX,
      imageOffsetY: data.panY,
      imageOffsetXMobile: data.panXMobile,
      imageOffsetYMobile: data.panYMobile,
      metadata: {
        ...meta,
        overlay: data.overlay,
        overlayMobile: data.overlayMobile,
      },
    });
  };

  const textOrderClass = reverse ? "order-1 md:order-2" : "order-1";
  const imageOrderClass = reverse ? "order-2 md:order-1" : "order-2";

  return (
    <section
      className={`${isMobile ? "py-10" : "py-16 md:py-24 lg:py-32"}`}
      style={alternate ? { backgroundColor: 'hsl(34 60% 94.5%)' } : undefined}
      data-testid={`section-${testId}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className={`grid ${isMobile ? "grid-cols-1 gap-8" : "md:grid-cols-2 gap-12"} items-center`}>
          <div className={isMobile ? "" : textOrderClass}>
            <EditableText
              textIt={subtitleIt}
              textEn={subtitleEn}
              as="p"
              className={`uppercase tracking-widest font-medium mb-3 ${isMobile ? "text-[11px]" : "text-[11px] md:text-base"}`}
              style={{ color: '#c7902f' }}
              onSave={handleSubtitleSave}
              data-testid={`text-subtitle-${testId}`}
            />

            <EditableText
              textIt={titleIt}
              textEn={titleEn}
              fontSizeDesktop={titleFontSize}
              fontSizeMobile={titleFontSizeMobile}
              as="h2"
              className="font-display font-light"
              style={{ color: '#2f2b2a' }}
              applyFontSize
              onSave={handleTitleSave}
              data-testid={`text-title-${testId}`}
            />

            <div className="mt-6 h-px max-w-24" style={{ backgroundColor: 'rgba(199, 144, 47, 0.3)' }} />

            <EditableText
              textIt={bodyIt}
              textEn={bodyEn}
              fontSizeDesktop={bodyFontSize}
              fontSizeMobile={bodyFontSizeMobile}
              as="p"
              className="text-muted-foreground mb-8 mt-6 leading-relaxed"
              applyFontSize
              multiline
              onSave={handleBodySave}
              data-testid={`text-body-${testId}`}
            />

            <Link href={ctaHref}>
              <Button
                variant="outline"
                className="group rounded-full px-6"
                data-testid={`button-cta-${testId}`}
              >
                <EditableText
                  textIt={ctaLabelIt}
                  textEn={ctaLabelEn}
                  as="span"
                  onSave={handleCtaSave}
                  data-testid={`text-cta-${testId}`}
                />
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className={isMobile ? "" : imageOrderClass}>
            <ImageContainer
              src={imageSrc}
              zoom={imageZoom}
              panX={imagePanX}
              panY={imagePanY}
              overlay={imageOverlay}
              zoomMobile={imageZoomMobile}
              panXMobile={imagePanXMobile}
              panYMobile={imagePanYMobile}
              overlayMobile={imageOverlayMobile}
              containerClassName="rounded-2xl"
              aspectRatio="4/3"
              testIdPrefix={`teaser-img-${testId}`}
              onSave={handleImageSave}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
