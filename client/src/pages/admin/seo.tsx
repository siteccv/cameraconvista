import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Save, Loader2, Globe, Check } from "lucide-react";
import type { Page } from "@shared/schema";

const PAGE_LABELS: Record<string, { it: string; en: string }> = {
  home: { it: "Home", en: "Home" },
  menu: { it: "Menu", en: "Menu" },
  "carta-vini": { it: "Lista Vini", en: "Wine List" },
  "cocktail-bar": { it: "Cocktail Bar", en: "Cocktail Bar" },
  eventi: { it: "Eventi", en: "Events" },
  "eventi-privati": { it: "Eventi Privati", en: "Private Events" },
  galleria: { it: "Galleria", en: "Gallery" },
  "dove-siamo": { it: "Dove Siamo", en: "Where We Are" },
};

export default function AdminSeo() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/admin/pages"],
  });

  const visiblePages = pages.filter(p => PAGE_LABELS[p.slug]);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl" data-testid="text-seo-title">
            {t("SEO & Metadata", "SEO & Metadata")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t(
              "Configura title e description per ogni pagina. Questi dati vengono iniettati nell'HTML per i motori di ricerca.",
              "Configure title and description for each page. This data is injected into HTML for search engines."
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePages.map((page) => (
              <PageSeoCard key={page.id} page={page} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function PageSeoCard({ page }: { page: Page }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const label = PAGE_LABELS[page.slug];

  const [metaTitleIt, setMetaTitleIt] = useState(page.metaTitleIt || "");
  const [metaTitleEn, setMetaTitleEn] = useState(page.metaTitleEn || "");
  const [metaDescIt, setMetaDescIt] = useState(page.metaDescriptionIt || "");
  const [metaDescEn, setMetaDescEn] = useState(page.metaDescriptionEn || "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/admin/pages/${page.id}`, {
        metaTitleIt: metaTitleIt || null,
        metaTitleEn: metaTitleEn || null,
        metaDescriptionIt: metaDescIt || null,
        metaDescriptionEn: metaDescEn || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({
        title: t("Salvato", "Saved"),
        description: t(
          `Metadata SEO per "${label?.it}" aggiornati`,
          `SEO metadata for "${label?.en}" updated`
        ),
      });
    },
    onError: () => {
      toast({
        title: t("Errore", "Error"),
        description: t("Impossibile salvare", "Failed to save"),
        variant: "destructive",
      });
    },
  });

  const hasChanges =
    metaTitleIt !== (page.metaTitleIt || "") ||
    metaTitleEn !== (page.metaTitleEn || "") ||
    metaDescIt !== (page.metaDescriptionIt || "") ||
    metaDescEn !== (page.metaDescriptionEn || "");

  return (
    <Card data-testid={`card-seo-${page.slug}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">
              {t(label?.it || page.slug, label?.en || page.slug)}
            </CardTitle>
          </div>
          <Button
            size="sm"
            disabled={saveMutation.isPending || !hasChanges}
            onClick={() => saveMutation.mutate()}
            data-testid={`button-save-seo-${page.slug}`}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : hasChanges ? (
              <Save className="h-4 w-4 mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            {hasChanges
              ? t("Salva", "Save")
              : t("Salvato", "Saved")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs">
              <Globe className="h-3 w-3" /> Title IT
            </Label>
            <Input
              value={metaTitleIt}
              onChange={(e) => setMetaTitleIt(e.target.value)}
              placeholder={`${label?.it} - Camera con Vista`}
              data-testid={`input-seo-title-it-${page.slug}`}
            />
            <p className="text-xs text-muted-foreground">
              {metaTitleIt.length}/60 {t("caratteri", "chars")}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs">
              <Globe className="h-3 w-3" /> Title EN
            </Label>
            <Input
              value={metaTitleEn}
              onChange={(e) => setMetaTitleEn(e.target.value)}
              placeholder={`${label?.en} - Camera con Vista`}
              data-testid={`input-seo-title-en-${page.slug}`}
            />
            <p className="text-xs text-muted-foreground">
              {metaTitleEn.length}/60 {t("caratteri", "chars")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs">
              <Search className="h-3 w-3" /> Description IT
            </Label>
            <Textarea
              value={metaDescIt}
              onChange={(e) => setMetaDescIt(e.target.value)}
              placeholder={t("Descrizione per i motori di ricerca...", "Description for search engines...")}
              rows={2}
              data-testid={`input-seo-desc-it-${page.slug}`}
            />
            <p className="text-xs text-muted-foreground">
              {metaDescIt.length}/160 {t("caratteri", "chars")}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs">
              <Search className="h-3 w-3" /> Description EN
            </Label>
            <Textarea
              value={metaDescEn}
              onChange={(e) => setMetaDescEn(e.target.value)}
              placeholder={t("Descrizione per i motori di ricerca...", "Description for search engines...")}
              rows={2}
              data-testid={`input-seo-desc-en-${page.slug}`}
            />
            <p className="text-xs text-muted-foreground">
              {metaDescEn.length}/160 {t("caratteri", "chars")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
