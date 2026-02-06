import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PageBlock } from "@shared/schema";
import logoImg from "@assets/Logo_ccv_nobistrot.png";
import { Button } from "@/components/ui/button";
import { 
  BookingDialog, 
  TeaserSection,
  HOME_PAGE_ID, 
  DEFAULT_BLOCKS, 
  TEASER_BLOCK_DEFAULTS,
  TEASER_BLOCK_TYPES,
} from "@/components/home";

export default function Home() {
  const { t } = useLanguage();
  const { adminPreview, deviceView, forceMobileLayout } = useAdmin();
  const { toast } = useToast();
  const viewportIsMobile = useIsMobile();

  const isMobile = forceMobileLayout || viewportIsMobile;

  const [hasInitialized, setHasInitialized] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  const blocksQueryKey = adminPreview
    ? ["/api/admin/page-blocks", HOME_PAGE_ID, "blocks"]
    : ["/api", "pages", HOME_PAGE_ID, "blocks"];

  const { data: blocks = [], isLoading } = useQuery<PageBlock[]>({
    queryKey: blocksQueryKey,
    queryFn: adminPreview
      ? async () => {
          const res = await fetch(`/api/admin/page-blocks/${HOME_PAGE_ID}/blocks`, { credentials: "include" });
          if (!res.ok) throw new Error("Failed to fetch blocks");
          return res.json();
        }
      : undefined,
  });

  const heroBlock = blocks.find(b => b.blockType === "hero");
  const brandingBlock = blocks.find(b => b.blockType === "branding");
  const teaserBlocks = TEASER_BLOCK_TYPES.map(type => blocks.find(b => b.blockType === type) || null);

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PageBlock> }) => {
      return apiRequest("PATCH", `/api/admin/page-blocks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blocksQueryKey });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
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

  useEffect(() => {
    if (isLoading || hasInitialized) return;

    const missingBlocks: Partial<PageBlock>[] = [];

    if (!heroBlock) missingBlocks.push(DEFAULT_BLOCKS.hero as Partial<PageBlock>);
    if (!brandingBlock) missingBlocks.push(DEFAULT_BLOCKS.branding as Partial<PageBlock>);

    TEASER_BLOCK_DEFAULTS.forEach((def) => {
      const existing = blocks.find(b => b.blockType === def.blockType);
      if (!existing) missingBlocks.push(def as unknown as Partial<PageBlock>);
    });

    if (missingBlocks.length > 0) {
      setHasInitialized(true);
      const createSequentially = async () => {
        for (const blockData of missingBlocks) {
          try {
            await apiRequest("POST", "/api/admin/page-blocks", {
              ...blockData,
              pageId: HOME_PAGE_ID,
            });
          } catch {
            // continue with remaining blocks
          }
        }
        queryClient.invalidateQueries({ queryKey: blocksQueryKey });
      };
      createSequentially();
    }
  }, [isLoading, blocks, hasInitialized]);

  const handleUpdateBlock = useCallback((id: number, data: Partial<PageBlock>) => {
    updateBlockMutation.mutate({ id, data });
  }, [updateBlockMutation]);

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
    handleUpdateBlock(heroBlock.id, {
      imageUrl: data.src,
      imageScaleDesktop: data.zoomDesktop,
      imageScaleMobile: data.zoomMobile,
      imageOffsetX: data.offsetXDesktop,
      imageOffsetY: data.offsetYDesktop,
      imageOffsetXMobile: data.offsetXMobile,
      imageOffsetYMobile: data.offsetYMobile,
    });
  };

  const handleBrandingTitleSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!brandingBlock) return;
    handleUpdateBlock(brandingBlock.id, {
      titleIt: data.textIt,
      titleEn: data.textEn,
      titleFontSize: data.fontSizeDesktop,
      titleFontSizeMobile: data.fontSizeMobile,
    });
  };

  const handleBrandingTaglineSave = (data: { textIt: string; textEn: string; fontSizeDesktop: number; fontSizeMobile: number }) => {
    if (!brandingBlock) return;
    handleUpdateBlock(brandingBlock.id, {
      bodyIt: data.textIt,
      bodyEn: data.textEn,
      bodyFontSize: data.fontSizeDesktop,
      bodyFontSizeMobile: data.fontSizeMobile,
    });
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

  const heroHeight = "h-[60vh]";
  const logoHeight = isMobile ? "h-5" : "h-11";

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
      <div className="min-h-[calc(100vh-80px)] flex flex-col">
        <section className={`relative ${heroHeight} shrink-0`}>
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

        <section className="flex-1 flex flex-col text-center" data-testid="section-branding">
          <div className="flex-1" />
          
          <div className="container mx-auto px-4">
            <div className={isMobile ? "mb-2 py-1" : "mb-4 py-2"}>
              <EditableText
                textIt={brandingTitle.it}
                textEn={brandingTitle.en}
                fontSizeDesktop={brandingTitle.fontSizeDesktop}
                fontSizeMobile={brandingTitle.fontSizeMobile}
                as="p"
                className={`${isMobile ? "tracking-[0.1em]" : "tracking-[0.2em]"} font-medium uppercase`}
                style={{ 
                  color: '#c9a048',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                applyFontSize
                onSave={handleBrandingTitleSave}
                data-testid="text-restaurant-bar"
              />
            </div>
            
            <div className={`flex justify-center ${isMobile ? "mb-2" : "mb-4"}`}>
              <img 
                src={logoImg} 
                alt="Camera con Vista" 
                className={`${logoHeight} w-auto`}
                data-testid="img-logo"
              />
            </div>
            
            <div className={isMobile ? "mt-4" : "mt-6"}>
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
          </div>
          
          <div className="flex-1 flex items-end justify-center pb-6">
            <Button 
              onClick={() => setBookingDialogOpen(true)}
              className={`${isMobile ? "px-6 py-4 text-[10px] tracking-[0.08em]" : "px-10 py-5 text-xs tracking-[0.1em]"} font-medium text-white rounded-full shadow-lg`}
              style={{ 
                backgroundColor: '#722f37',
                fontFamily: 'Montserrat, sans-serif'
              }}
              data-testid="button-book-table"
            >
              {t("PRENOTA UN TAVOLO", "BOOK A TABLE")}
            </Button>
          </div>
        </section>
      </div>

      <BookingDialog 
        open={bookingDialogOpen} 
        onOpenChange={setBookingDialogOpen} 
        isMobile={isMobile} 
      />

      {TEASER_BLOCK_DEFAULTS.map((def, idx) => (
        <TeaserSection
          key={def.blockType}
          block={teaserBlocks[idx]}
          defaults={def}
          reverse={idx % 2 !== 0}
          alternate={idx % 2 !== 0}
          onUpdateBlock={handleUpdateBlock}
        />
      ))}
    </PublicLayout>
  );
}
