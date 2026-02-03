import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";

export default function AdminEvents() {
  const { t } = useLanguage();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl" data-testid="text-events-title">
              {t("Eventi", "Events")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("Gestisci gli eventi del ristorante", "Manage restaurant events")}
            </p>
          </div>
          <Button data-testid="button-add-event">
            <Plus className="h-4 w-4 mr-2" />
            {t("Nuovo Evento", "New Event")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("Lista Eventi", "Events List")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              {t("Nessun evento creato. Clicca su 'Nuovo Evento' per iniziare.", "No events created. Click 'New Event' to get started.")}
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
