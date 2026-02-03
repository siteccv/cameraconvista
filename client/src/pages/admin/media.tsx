import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image } from "lucide-react";

export default function AdminMedia() {
  const { t } = useLanguage();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl" data-testid="text-media-title">
              {t("Libreria Media", "Media Library")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("Gestisci immagini e file del sito", "Manage site images and files")}
            </p>
          </div>
          <Button data-testid="button-upload-media">
            <Upload className="h-4 w-4 mr-2" />
            {t("Carica File", "Upload File")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {t("File Caricati", "Uploaded Files")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              {t("Nessun file caricato. Clicca su 'Carica File' per iniziare.", "No files uploaded. Click 'Upload File' to get started.")}
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
