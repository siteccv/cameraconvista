import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { MenuItem } from "@shared/schema";

export default function Menu() {
  const { t } = useLanguage();

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  const categorizedItems = menuItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>) ?? {};

  return (
    <PublicLayout>
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(30,25,20,0.5), rgba(30,25,20,0.7)), url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl drop-shadow-lg" data-testid="text-menu-hero">
            {t("Menù", "Menu")}
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-menu-intro">
              {t(
                "La nostra cucina celebra i sapori autentici della tradizione italiana, reinterpretati con creatività e ingredienti di stagione.",
                "Our cuisine celebrates the authentic flavors of Italian tradition, reinterpreted with creativity and seasonal ingredients."
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-8 w-48 mx-auto mb-6" />
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(categorizedItems).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-menu-empty">
                {t("Il menù sarà disponibile a breve.", "The menu will be available soon.")}
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(categorizedItems).map(([category, items]) => (
                <div key={category}>
                  <h2 className="font-display text-2xl md:text-3xl text-center mb-8" data-testid={`text-category-${category}`}>
                    {category}
                  </h2>
                  <div className="space-y-6">
                    {items.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}

function MenuItemCard({ item }: { item: MenuItem }) {
  const { t } = useLanguage();

  return (
    <div className="flex justify-between items-start gap-4 pb-4 border-b border-border last:border-0" data-testid={`menu-item-${item.id}`}>
      <div className="flex-1">
        <h3 className="font-medium text-lg">{t(item.nameIt, item.nameEn)}</h3>
        {(item.descriptionIt || item.descriptionEn) && (
          <p className="text-sm text-muted-foreground mt-1">
            {t(item.descriptionIt, item.descriptionEn)}
          </p>
        )}
      </div>
      {item.price && (
        <span className="text-primary font-medium shrink-0">{item.price}</span>
      )}
    </div>
  );
}
