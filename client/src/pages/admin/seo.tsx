import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Save } from "lucide-react";

export default function AdminSeo() {
  const { t } = useLanguage();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl" data-testid="text-seo-title">
              {t("SEO & Metadata", "SEO & Metadata")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("Ottimizza il sito per i motori di ricerca", "Optimize the site for search engines")}
            </p>
          </div>
          <Button data-testid="button-save-seo">
            <Save className="h-4 w-4 mr-2" />
            {t("Salva Modifiche", "Save Changes")}
          </Button>
        </div>

        <Tabs defaultValue="it">
          <TabsList>
            <TabsTrigger value="it">Italiano</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>

          <TabsContent value="it" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {t("Metadata Italiano", "Italian Metadata")}
                </CardTitle>
                <CardDescription>
                  {t("Configura i metadata per la versione italiana del sito", "Configure metadata for the Italian version of the site")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title-it">{t("Titolo Sito", "Site Title")}</Label>
                  <Input 
                    id="title-it" 
                    placeholder="Camera con Vista - Ristorante Bologna"
                    data-testid="input-seo-title-it"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc-it">{t("Descrizione", "Description")}</Label>
                  <Textarea 
                    id="desc-it" 
                    placeholder="Ristorante raffinato nel cuore di Bologna..."
                    rows={3}
                    data-testid="input-seo-desc-it"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords-it">{t("Parole Chiave", "Keywords")}</Label>
                  <Input 
                    id="keywords-it" 
                    placeholder="ristorante bologna, cucina italiana, cocktail bar"
                    data-testid="input-seo-keywords-it"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="en" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  {t("Metadata Inglese", "English Metadata")}
                </CardTitle>
                <CardDescription>
                  {t("Configura i metadata per la versione inglese del sito", "Configure metadata for the English version of the site")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title-en">{t("Titolo Sito", "Site Title")}</Label>
                  <Input 
                    id="title-en" 
                    placeholder="Camera con Vista - Bologna Restaurant"
                    data-testid="input-seo-title-en"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc-en">{t("Descrizione", "Description")}</Label>
                  <Textarea 
                    id="desc-en" 
                    placeholder="Refined restaurant in the heart of Bologna..."
                    rows={3}
                    data-testid="input-seo-desc-en"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords-en">{t("Parole Chiave", "Keywords")}</Label>
                  <Input 
                    id="keywords-en" 
                    placeholder="bologna restaurant, italian cuisine, cocktail bar"
                    data-testid="input-seo-keywords-en"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
