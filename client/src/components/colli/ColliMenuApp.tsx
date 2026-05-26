import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, Menu as MenuIcon, Settings, X } from "lucide-react";
import colliLogo from "@assets/logo_ccv_colli.png";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CategoryBlock,
  DialogSection,
  FilledLeafIcon,
  GlutenFreeIcon,
  Separator,
} from "@/components/colli/ColliMenuPrimitives";
import { formatDecimal, formatPrice, formatProducer } from "@/lib/colli-menu-format";
import {
  localizedColliText,
  sortColliByOrder,
  type ColliAllergen,
  type ColliDish,
  type ColliLanguage,
  type ColliMenuPayload,
  type ColliSection,
  type ColliWine,
} from "@shared/colli";

const COLORS = {
  cream: "#EFE8D8",
  header: "#F5EFE7",
  panel: "#FAF8F5",
  maroon: "#722F37",
  warmBrown: "#2C1F14",
  secondary: "#7A6A5A",
  separator: "#E2D9CF",
  gold: "#B8860B",
  green: "#5B7A4E",
  beige: "#E8DDD0",
};

const HEADER_HEIGHT = 73;
const COLLI_INTRO_DURATION_MS = 4500;
const COLLI_INTRO_SESSION_KEY = "ccv_colli_intro_seen";

export function ColliMenuApp() {
  const { language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<ColliDish | null>(null);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(COLLI_INTRO_SESSION_KEY) !== "1";
  });

  const { data, isLoading, isError, refetch } = useQuery<ColliMenuPayload>({
    queryKey: ["/api/colli/menu"],
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const englishEnabled = data?.metadata?.englishEnabled !== false;
  const sections = useMemo(() => sortColliByOrder(data?.sections ?? []), [data?.sections]);
  const activeSection = sections.find((section) => section.id === activeSectionId) ?? null;
  const isWineSection = activeSection?.type === "wine";

  useEffect(() => {
    if (!englishEnabled && language === "en") {
      setLanguage("it");
    }
  }, [englishEnabled, language, setLanguage]);

  useEffect(() => {
    if (!activeSectionId || sections.some((section) => section.id === activeSectionId)) return;
    setActiveSectionId(null);
  }, [activeSectionId, sections]);

  useEffect(() => {
    if (!showIntro || typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(COLLI_INTRO_SESSION_KEY, "1");
      setShowIntro(false);
    }, COLLI_INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [showIntro]);

  const selectSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setMenuOpen(false);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const showSectionList = () => {
    setActiveSectionId(null);
    setMenuOpen(false);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const openColliAdmin = () => {
    setMenuOpen(false);
    setLocation("/colli/admina");
  };

  if (showIntro) {
    return <ColliIntroScreen />;
  }

  if (isLoading) {
    return <ColliStatus message="Caricamento menu..." />;
  }

  if (isError || !data) {
    return (
      <ColliStatus
        message={language === "en" ? "Menu currently unavailable." : "Menu non disponibile."}
        actionLabel={language === "en" ? "Retry" : "Riprova"}
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div
      className="min-h-[100svh]"
      style={{ backgroundColor: COLORS.cream, color: COLORS.warmBrown }}
    >
      <ColliHeader
        activeSection={activeSection}
        menuOpen={menuOpen}
        onBack={showSectionList}
        onToggleMenu={() => setMenuOpen((open) => !open)}
      />

      {menuOpen && (
        <ColliDropdown
          language={language}
          activeSectionId={activeSectionId}
          sections={sections}
          englishEnabled={englishEnabled}
          onClose={() => setMenuOpen(false)}
          onHome={showSectionList}
          onSectionChange={selectSection}
          onLanguageChange={setLanguage}
          onAdmin={openColliAdmin}
        />
      )}

      {activeSection ? (
        <ColliSectionView
          data={data}
          language={language}
          section={activeSection}
          isWineSection={isWineSection}
          onDishSelect={setSelectedDish}
        />
      ) : (
        <ColliSectionLanding
          language={language}
          sections={sections}
          onSectionSelect={selectSection}
        />
      )}

      {selectedDish && (
        <ColliDishDialog
          dish={selectedDish}
          allergens={data.allergens}
          language={language}
          onClose={() => setSelectedDish(null)}
        />
      )}
    </div>
  );
}

function ColliIntroScreen() {
  return (
    <div
      className="colli-intro-screen"
      style={{ backgroundColor: COLORS.cream, color: COLORS.warmBrown }}
      aria-label="Camera con Vista Colli"
    >
      <img
        src={colliLogo}
        alt="Camera con Vista Colli"
        className="colli-intro-logo"
        fetchPriority="high"
      />
      <h1 className="sr-only">Camera con Vista Colli</h1>
    </div>
  );
}

function ColliStatus({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className="min-h-[100svh] flex flex-col items-center justify-center px-8 text-center"
      style={{ backgroundColor: COLORS.cream, color: COLORS.warmBrown }}
    >
      <img src={colliLogo} alt="Camera con Vista Colli" className="h-20 w-auto object-contain" />
      <p className="mt-8 text-sm font-sans" style={{ color: COLORS.secondary }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-md px-5 py-3 text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: COLORS.maroon }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ColliHeader({
  activeSection,
  menuOpen,
  onBack,
  onToggleMenu,
}: {
  activeSection: ColliSection | null;
  menuOpen: boolean;
  onBack: () => void;
  onToggleMenu: () => void;
}) {
  return (
    <header
      className="fixed left-0 right-0 top-0 z-40"
      style={{
        backgroundColor: COLORS.header,
        height: `calc(env(safe-area-inset-top) + ${HEADER_HEIGHT}px)`,
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="flex h-[73px] items-center justify-between px-[18px] pb-2">
        <div className="flex w-11 justify-start">
          {activeSection && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-start"
              aria-label="Torna alle sezioni Colli"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex h-14 flex-1 items-center justify-center">
          <img
            src={colliLogo}
            alt="Camera con Vista Colli"
            className="h-14 w-auto max-w-[245px] object-contain"
          />
          <h1 className="sr-only">Camera con Vista Colli</h1>
        </div>

        <div className="flex w-11 justify-end">
          <button
            type="button"
            onClick={onToggleMenu}
            className="flex h-11 w-11 items-center justify-end"
            aria-label={menuOpen ? "Chiudi navigazione Colli" : "Apri navigazione Colli"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <div className="mx-5 h-px" style={{ backgroundColor: COLORS.separator }} />
    </header>
  );
}

function ColliDropdown({
  language,
  activeSectionId,
  sections,
  englishEnabled,
  onClose,
  onHome,
  onSectionChange,
  onLanguageChange,
  onAdmin,
}: {
  language: ColliLanguage;
  activeSectionId: string | null;
  sections: ColliSection[];
  englishEnabled: boolean;
  onClose: () => void;
  onHome: () => void;
  onSectionChange: (sectionId: string) => void;
  onLanguageChange: (language: ColliLanguage) => void;
  onAdmin: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute left-4 right-4 overflow-hidden rounded-lg shadow-[0_6px_20px_rgba(114,47,55,0.10)]"
        style={{
          top: `calc(env(safe-area-inset-top) + ${HEADER_HEIGHT + 8}px)`,
          backgroundColor: COLORS.panel,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onHome}
          className="flex w-full items-center justify-between px-5 py-4 text-left font-display text-[17px]"
          style={{ color: activeSectionId ? COLORS.warmBrown : COLORS.maroon }}
        >
          Home
          {!activeSectionId && (
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.maroon }} />
          )}
        </button>

        <div className="h-px" style={{ backgroundColor: COLORS.separator }} />

        {sections.map((section) => {
          const isActive = section.id === activeSectionId;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left font-display text-[17px]"
              style={{ color: isActive ? COLORS.maroon : COLORS.warmBrown }}
            >
              {localizedColliText(language, section.name_it, section.name_en)}
              {isActive && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: COLORS.maroon }}
                />
              )}
            </button>
          );
        })}

        <div className="h-px" style={{ backgroundColor: COLORS.separator }} />

        <div className="flex items-center gap-5 p-4">
          {englishEnabled && (
            <>
              <LanguageButton active={language === "it"} onClick={() => onLanguageChange("it")}>
                Italiano
              </LanguageButton>
              <LanguageButton active={language === "en"} onClick={() => onLanguageChange("en")}>
                English
              </LanguageButton>
            </>
          )}
          <button
            type="button"
            onClick={onAdmin}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-black/5"
            style={{ color: COLORS.warmBrown }}
            aria-label="Admin Colli"
            data-testid="button-colli-admin-gear"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LanguageButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-3 py-2 font-display text-base"
      style={{
        backgroundColor: active ? COLORS.maroon : "transparent",
        color: active ? "#FFFFFF" : COLORS.secondary,
      }}
    >
      {children}
    </button>
  );
}

function ColliSectionLanding({
  language,
  sections,
  onSectionSelect,
}: {
  language: ColliLanguage;
  sections: ColliSection[];
  onSectionSelect: (sectionId: string) => void;
}) {
  return (
    <main
      className="flex min-h-[100svh] flex-col px-6"
      style={{
        paddingTop: `calc(env(safe-area-inset-top) + ${HEADER_HEIGHT}px)`,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
      }}
    >
      <div className="flex-[0.64]" />

      <nav
        className="w-full border-y"
        aria-label={language === "en" ? "Colli menu sections" : "Sezioni menu Colli"}
        style={{ borderColor: "rgba(44, 31, 20, 0.15)" }}
      >
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSectionSelect(section.id)}
            className="block w-full border-b px-1 py-[22px] text-center font-display text-[28px] leading-tight last:border-b-0"
            style={{ color: COLORS.maroon, borderColor: "rgba(44, 31, 20, 0.15)" }}
          >
            {localizedColliText(language, section.name_it, section.name_en)}
          </button>
        ))}
      </nav>

      <div className="flex-[0.96]" />

      <footer className="text-center font-sans" style={{ color: COLORS.green }}>
        <p className="text-[11px]">in collaborazione con</p>
        <p className="text-[13px]">CA&apos;SHIN</p>
      </footer>
    </main>
  );
}

function ColliSectionView({
  data,
  language,
  section,
  isWineSection,
  onDishSelect,
}: {
  data: ColliMenuPayload;
  language: ColliLanguage;
  section: ColliSection;
  isWineSection: boolean;
  onDishSelect: (dish: ColliDish) => void;
}) {
  return (
    <main
      className="min-h-[100svh]"
      style={{
        paddingTop: `calc(env(safe-area-inset-top) + ${HEADER_HEIGHT}px)`,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 64px)",
      }}
      aria-label={localizedColliText(language, section.name_it, section.name_en)}
    >
      <div className="mx-auto w-full max-w-3xl">
        {isWineSection ? (
          <ColliWinesContent data={data} language={language} />
        ) : (
          <ColliFoodContent
            data={data}
            language={language}
            sectionId={section.id}
            onDishSelect={onDishSelect}
          />
        )}
      </div>
    </main>
  );
}

function ColliFoodContent({
  data,
  language,
  sectionId,
  onDishSelect,
}: {
  data: ColliMenuPayload;
  language: ColliLanguage;
  sectionId: string;
  onDishSelect: (dish: ColliDish) => void;
}) {
  const categories = sortColliByOrder(
    data.categories.filter((category) => category.section_id === sectionId),
  );

  return (
    <>
      {categories.map((category) => {
        const dishes = sortColliByOrder(
          data.dishes.filter((dish) => dish.category_id === category.id),
        );
        if (dishes.length === 0) return null;

        return (
          <CategoryBlock
            key={category.id}
            title={localizedColliText(language, category.name_it, category.name_en)}
          >
            {dishes.map((dish, index) => (
              <div key={dish.id}>
                <DishRow dish={dish} language={language} onDishSelect={onDishSelect} />
                {index < dishes.length - 1 && <Separator />}
              </div>
            ))}
          </CategoryBlock>
        );
      })}
    </>
  );
}

function ColliWinesContent({
  data,
  language,
}: {
  data: ColliMenuPayload;
  language: ColliLanguage;
}) {
  const categories = sortColliByOrder(data.wineCategories);

  return (
    <>
      {categories.map((category) => {
        const wines = sortColliByOrder(
          data.wines.filter((wine) => wine.wine_category_id === category.id),
        );
        if (wines.length === 0) return null;

        return (
          <CategoryBlock
            key={category.id}
            title={localizedColliText(language, category.name_it, category.name_en)}
          >
            {wines.map((wine, index) => (
              <div key={wine.id}>
                <WineRow wine={wine} language={language} />
                {index < wines.length - 1 && <Separator />}
              </div>
            ))}
          </CategoryBlock>
        );
      })}
    </>
  );
}

function DishRow({
  dish,
  language,
  onDishSelect,
}: {
  dish: ColliDish;
  language: ColliLanguage;
  onDishSelect: (dish: ColliDish) => void;
}) {
  const hasDetail = Boolean(
    localizedColliText(language, dish.description_it, dish.description_en) ||
    dish.extra_info ||
    (dish.allergens?.length ?? 0) > 0,
  );

  const content = (
    <>
      <div className="mb-1 text-[18px] leading-[26px]" style={{ color: COLORS.warmBrown }}>
        {dish.vegetarian && (
          <FilledLeafIcon
            className={`${dish.gluten_free ? "mr-1.5" : "mr-2"} inline h-3.5 w-3.5 align-[-0.08em]`}
          />
        )}
        {dish.gluten_free && <GlutenFreeIcon className="mr-2 inline h-3.5 w-3.5 align-[-0.08em]" />}
        <span>{localizedColliText(language, dish.name_it, dish.name_en)}</span>
      </div>

      {localizedColliText(language, dish.subtitle_it, dish.subtitle_en) && (
        <p className="mb-1 text-sm" style={{ color: COLORS.secondary }}>
          {localizedColliText(language, dish.subtitle_it, dish.subtitle_en)}
        </p>
      )}

      {dish.price != null && (
        <p className="price-text text-[19px] font-bold" style={{ color: COLORS.gold }}>
          {formatPrice(dish.price)}
        </p>
      )}
    </>
  );

  if (!hasDetail) {
    return <div className="px-6 py-3.5 text-left font-sans">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onDishSelect(dish)}
      className="block w-full px-6 py-3.5 text-left font-sans transition-opacity hover:opacity-80"
      aria-label={localizedColliText(language, dish.name_it, dish.name_en)}
    >
      {content}
    </button>
  );
}

function WineRow({ wine, language }: { wine: ColliWine; language: ColliLanguage }) {
  const details = [
    formatProducer(wine.producer),
    wine.origin?.toUpperCase(),
    wine.abv != null ? `${formatDecimal(wine.abv)}°` : null,
  ].filter(Boolean);

  return (
    <div className="px-6 py-4 font-sans">
      <h3 className="text-base uppercase leading-snug" style={{ color: COLORS.warmBrown }}>
        {localizedColliText(language, wine.name_it, wine.name_en)}
      </h3>
      {details.length > 0 && (
        <p className="mt-1 text-sm" style={{ color: COLORS.secondary }}>
          {details.join(" - ")}
        </p>
      )}
      <div className="mt-1 flex gap-6">
        {wine.price_glass != null && (
          <p className="price-text text-[17px] font-bold" style={{ color: COLORS.gold }}>
            {formatPrice(wine.price_glass)}
          </p>
        )}
        {wine.price_bottle != null && (
          <p className="price-text text-[17px] font-bold" style={{ color: COLORS.gold }}>
            {formatPrice(wine.price_bottle)}
          </p>
        )}
      </div>
    </div>
  );
}

function ColliDishDialog({
  dish,
  allergens,
  language,
  onClose,
}: {
  dish: ColliDish;
  allergens: ColliAllergen[];
  language: ColliLanguage;
  onClose: () => void;
}) {
  const dishAllergens = allergens.filter((allergen) => dish.allergens?.includes(allergen.id));
  const description = localizedColliText(language, dish.description_it, dish.description_en);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end bg-black/25 md:items-center md:justify-center"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={localizedColliText(language, dish.name_it, dish.name_en)}
        className="max-h-[88svh] w-full overflow-y-auto rounded-t-lg px-6 pb-8 pt-4 shadow-2xl md:max-w-xl md:rounded-lg"
        style={{
          backgroundColor: COLORS.cream,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)",
        }}
      >
        <div
          className="mx-auto mb-4 h-1 w-9 rounded-full"
          style={{ backgroundColor: COLORS.separator }}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: COLORS.beige, color: COLORS.warmBrown }}
            aria-label={language === "en" ? "Close" : "Chiudi"}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="pb-6">
          {(dish.vegetarian || dish.gluten_free) && (
            <div
              className="mb-2 flex flex-wrap items-center gap-3 text-[11px] uppercase"
              style={{ color: COLORS.green }}
            >
              {dish.vegetarian && (
                <div className="flex items-center gap-1">
                  <FilledLeafIcon className="h-3 w-3 shrink-0" />
                  {language === "en" ? "Vegetarian" : "Vegetariano"}
                </div>
              )}
              {dish.gluten_free && (
                <div className="flex items-center gap-1">
                  <GlutenFreeIcon className="h-3 w-3 shrink-0" />
                  {language === "en" ? "Gluten free" : "Senza glutine"}
                </div>
              )}
            </div>
          )}

          <h2 className="font-display text-[28px] leading-9" style={{ color: COLORS.warmBrown }}>
            {localizedColliText(language, dish.name_it, dish.name_en)}
          </h2>

          {dish.price != null && (
            <p className="price-text mt-2 text-[22px] font-bold" style={{ color: COLORS.gold }}>
              {formatPrice(dish.price)}
            </p>
          )}
        </div>

        {description && (
          <DialogSection label={language === "en" ? "Description" : "Descrizione"}>
            <p className="text-[15px] leading-6" style={{ color: COLORS.secondary }}>
              {description}
            </p>
          </DialogSection>
        )}

        {dish.extra_info && (
          <div
            className="mb-5 rounded-lg p-3.5 text-sm leading-5"
            style={{ backgroundColor: COLORS.beige }}
          >
            {dish.extra_info}
          </div>
        )}

        {dishAllergens.length > 0 && (
          <DialogSection label={language === "en" ? "Allergens" : "Allergeni"}>
            <div className="space-y-2">
              {dishAllergens.map((allergen) => (
                <div
                  key={allergen.id}
                  className="flex items-center gap-2.5 text-sm"
                  style={{ color: COLORS.secondary }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: COLORS.secondary }}
                  />
                  {localizedColliText(language, allergen.name_it, allergen.name_en)}
                </div>
              ))}
            </div>
          </DialogSection>
        )}
      </div>
    </div>
  );
}
