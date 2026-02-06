import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import type { PageBlock } from "@shared/schema";

export interface BlockDefault {
  blockType: string;
  titleIt?: string;
  titleEn?: string;
  titleFontSize?: number;
  titleFontSizeMobile?: number;
  bodyIt?: string;
  bodyEn?: string;
  bodyFontSize?: number;
  bodyFontSizeMobile?: number;
  imageUrl?: string;
  imageScaleDesktop?: number;
  imageScaleMobile?: number;
  imageOffsetX?: number;
  imageOffsetY?: number;
  imageOffsetXMobile?: number;
  imageOffsetYMobile?: number;
  ctaTextIt?: string;
  ctaTextEn?: string;
  ctaUrl?: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

interface UsePageBlocksOptions {
  pageId: number;
  defaults: BlockDefault[];
}

export function usePageBlocks({ pageId, defaults }: UsePageBlocksOptions) {
  const { adminPreview } = useAdmin();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [hasInitialized, setHasInitialized] = useState(false);

  const blocksQueryKey = adminPreview
    ? ["/api/admin/page-blocks", pageId, "blocks"]
    : ["/api", "pages", pageId, "blocks"];

  const adminQueryFn = async () => {
    const res = await fetch(`/api/admin/page-blocks/${pageId}/blocks`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch blocks");
    return res.json();
  };

  const { data: blocks = [], isLoading } = useQuery<PageBlock[]>({
    queryKey: blocksQueryKey,
    ...(adminPreview ? { queryFn: adminQueryFn } : {}),
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PageBlock> }) => {
      return apiRequest("PATCH", `/api/admin/page-blocks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blocksQueryKey });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({
        title: t("Salvato", "Saved"),
        description: t("Le modifiche sono state salvate.", "Changes have been saved."),
      });
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile salvare le modifiche.", "Failed to save changes."),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!adminPreview || isLoading || hasInitialized || blocks.length > 0) return;
    setHasInitialized(true);

    const createSequentially = async () => {
      for (const blockData of defaults) {
        try {
          await apiRequest("POST", "/api/admin/page-blocks", {
            ...blockData,
            pageId,
          });
        } catch {
          // continue
        }
      }
      queryClient.invalidateQueries({ queryKey: blocksQueryKey });
    };
    createSequentially();
  }, [adminPreview, isLoading, blocks.length, hasInitialized, pageId, defaults, blocksQueryKey]);

  const updateBlock = useCallback(
    (id: number, data: Partial<PageBlock>) => {
      updateBlockMutation.mutate({ id, data });
    },
    [updateBlockMutation]
  );

  const getBlock = useCallback(
    (blockType: string) => blocks.find((b) => b.blockType === blockType) || null,
    [blocks]
  );

  const getBlockValue = useCallback(
    <K extends keyof PageBlock>(blockType: string, field: K, fallback: PageBlock[K]): PageBlock[K] => {
      const block = blocks.find((b) => b.blockType === blockType);
      return block?.[field] ?? fallback;
    },
    [blocks]
  );

  return {
    blocks,
    isLoading,
    updateBlock,
    getBlock,
    getBlockValue,
    blocksQueryKey,
  };
}
