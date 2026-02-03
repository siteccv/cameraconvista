import { useLanguage } from "@/contexts/LanguageContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Image, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { t } = useLanguage();

  const stats = [
    {
      icon: FileText,
      labelIt: "Sezioni",
      labelEn: "Sections",
      value: "8",
      descriptionIt: "Pagine gestite",
      descriptionEn: "Managed pages",
    },
    {
      icon: Calendar,
      labelIt: "Eventi",
      labelEn: "Events",
      value: "0",
      descriptionIt: "Pubblicati",
      descriptionEn: "Published",
    },
    {
      icon: Image,
      labelIt: "Media",
      labelEn: "Media",
      value: "0",
      descriptionIt: "File caricati",
      descriptionEn: "Files uploaded",
    },
    {
      icon: Settings,
      labelIt: "Ultimo aggiornamento",
      labelEn: "Last update",
      value: "-",
      descriptionIt: "Sito non ancora pubblicato",
      descriptionEn: "Site not yet published",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Benvenuto nel pannello di amministrazione di Camera con Vista", "Welcome to the Camera con Vista admin panel")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} data-testid={`card-stat-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(stat.labelIt, stat.labelEn)}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {t(stat.descriptionIt, stat.descriptionEn)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("Attività Recenti", "Recent Activity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {t("Nessuna attività recente", "No recent activity")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("Azioni Rapide", "Quick Actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm">
                {t(
                  "Usa la barra laterale per gestire le sezioni del sito, gli eventi e i media.",
                  "Use the sidebar to manage site sections, events, and media."
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
