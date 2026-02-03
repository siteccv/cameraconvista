import { useLanguage } from "@/contexts/LanguageContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Martini } from "lucide-react";
import type { Cocktail } from "@shared/schema";

export default function CocktailBar() {
  const { t } = useLanguage();

  const { data: cocktails, isLoading } = useQuery<Cocktail[]>({
    queryKey: ["/api/cocktails"],
  });

  const categorizedCocktails = cocktails?.reduce((acc, cocktail) => {
    if (!acc[cocktail.category]) {
      acc[cocktail.category] = [];
    }
    acc[cocktail.category].push(cocktail);
    return acc;
  }, {} as Record<string, Cocktail[]>) ?? {};

  return (
    <PublicLayout>
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(30,25,20,0.5), rgba(30,25,20,0.7)), url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl drop-shadow-lg" data-testid="text-cocktail-hero">
            Cocktail Bar
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Martini className="h-6 w-6" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl mb-4" data-testid="text-cocktails-title">
              Cocktails
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="text-cocktails-intro">
              {t(
                "I nostri cocktail sono creazioni uniche, preparate con ingredienti selezionati e tecniche innovative per offrirvi un'esperienza sensoriale indimenticabile.",
                "Our cocktails are unique creations, prepared with selected ingredients and innovative techniques to offer you an unforgettable sensory experience."
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-12">
              {[1, 2].map((i) => (
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
          ) : Object.keys(categorizedCocktails).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground" data-testid="text-cocktails-empty">
                {t("La lista cocktail sarà disponibile a breve.", "The cocktail list will be available soon.")}
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(categorizedCocktails).map(([category, cocktails]) => (
                <div key={category}>
                  <h3 className="font-display text-2xl md:text-3xl text-center mb-8" data-testid={`text-cocktail-category-${category}`}>
                    {category}
                  </h3>
                  <div className="space-y-6">
                    {cocktails.map((cocktail) => (
                      <CocktailCard key={cocktail.id} cocktail={cocktail} />
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

function CocktailCard({ cocktail }: { cocktail: Cocktail }) {
  const { t } = useLanguage();

  return (
    <div className="flex justify-between items-start gap-4 pb-4 border-b border-border last:border-0" data-testid={`cocktail-item-${cocktail.id}`}>
      <div className="flex-1">
        <h4 className="font-medium text-lg">{t(cocktail.nameIt, cocktail.nameEn)}</h4>
        {(cocktail.descriptionIt || cocktail.descriptionEn) && (
          <p className="text-sm text-muted-foreground mt-1">
            {t(cocktail.descriptionIt, cocktail.descriptionEn)}
          </p>
        )}
      </div>
      {cocktail.price && (
        <span className="text-primary font-medium shrink-0">{cocktail.price}</span>
      )}
    </div>
  );
}
