import { Suspense, lazy, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import CartaVini from "@/pages/carta-vini";
import CocktailBar from "@/pages/cocktail-bar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PRIVATE_DINNER_ENABLED } from "@/lib/private-events-config";
import type { Page } from "@shared/schema";

const Eventi = lazy(() => import("@/pages/eventi"));
const EventDetail = lazy(() => import("@/pages/event-detail"));
const EventiPrivati = lazy(() => import("@/pages/eventi-privati"));
const AperitivoPage = lazy(() => import("@/pages/eventi-privati/aperitivo"));
const CenaPage = lazy(() => import("@/pages/eventi-privati/cena"));
const EsclusivoPage = lazy(() => import("@/pages/eventi-privati/esclusivo"));
const Galleria = lazy(() => import("@/pages/galleria"));
const DoveSiamo = lazy(() => import("@/pages/dove-siamo"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const CookiePolicy = lazy(() => import("@/pages/cookie-policy"));
const Colli = lazy(() => import("@/pages/colli"));
const ColliMenu = lazy(() => import("@/pages/colli-menu"));
const ColliAdminLogin = lazy(() => import("@/pages/colli-admin-login"));
const ColliAdminPanel = lazy(() => import("@/pages/colli-admin-panel"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminSyncGoogle = lazy(() => import("@/pages/admin/sync-google"));
const AdminPages = lazy(() => import("@/pages/admin/pages"));
const AdminEvents = lazy(() => import("@/pages/admin/events"));
const AdminMedia = lazy(() => import("@/pages/admin/media"));
const AdminGallery = lazy(() => import("@/pages/admin/gallery"));
const AdminSeo = lazy(() => import("@/pages/admin/seo"));
const AdminPreview = lazy(() => import("@/pages/admin/preview"));

type RoutableComponent = React.ComponentType | React.LazyExoticComponent<React.ComponentType<any>>;

function RouteFallback() {
  return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;
}

function ProtectedAdminRoute({ component: Component }: { component: RoutableComponent }) {
  const { isAuthenticated } = useAdmin();

  if (!isAuthenticated) {
    return <Redirect to="/admina/login" />;
  }

  return <Component />;
}

const PAGE_TITLES: Record<string, { it: string; en: string }> = {
  home: {
    it: "Camera con Vista - Tapas Bar e Cocktail Bar Bologna",
    en: "Camera con Vista - Tapas & Cocktail Bar Bologna",
  },
  menu: {
    it: "Tapas e Aperitivo - Camera con Vista Bologna",
    en: "Tapas & Aperitivo - Camera con Vista Bologna",
  },
  "carta-vini": {
    it: "Carta Vini per Tapas e Aperitivo - Camera con Vista",
    en: "Wine List for Tapas and Aperitivo - Camera con Vista",
  },
  "cocktail-bar": {
    it: "Cocktail Bar a Bologna - Camera con Vista",
    en: "Cocktail Bar in Bologna - Camera con Vista",
  },
  eventi: {
    it: "Eventi - Camera con Vista | Events Bologna",
    en: "Events - Camera con Vista | Bologna",
  },
  "eventi-privati": {
    it: "Eventi Privati e Aperitivi a Bologna - Camera con Vista",
    en: "Private Events and Aperitivo in Bologna - Camera con Vista",
  },
  "eventi-privati-aperitivo": {
    it: "Aperitivo Privato a Bologna - Camera con Vista",
    en: "Private Aperitivo in Bologna - Camera con Vista",
  },
  "eventi-privati-cena": {
    it: "Cena Privata - Camera con Vista | Bologna",
    en: "Private Dinner - Camera con Vista | Bologna",
  },
  "eventi-privati-esclusivo": {
    it: "Evento Privato Esclusivo a Bologna - Camera con Vista",
    en: "Exclusive Private Event in Bologna - Camera con Vista",
  },
  galleria: {
    it: "Galleria - Camera con Vista | Gallery Bologna",
    en: "Gallery - Camera con Vista | Bologna",
  },
  "dove-siamo": {
    it: "Tapas e Cocktail Bar in Centro a Bologna - Dove Siamo",
    en: "Tapas and Cocktail Bar in Central Bologna - Where We Are",
  },
  privacy: { it: "Privacy Policy - Camera con Vista", en: "Privacy Policy - Camera con Vista" },
  cookie: { it: "Cookie Policy - Camera con Vista", en: "Cookie Policy - Camera con Vista" },
  colli: {
    it: "Camera con Vista Colli",
    en: "Camera con Vista Colli",
  },
  "colli-menu": {
    it: "Menu Colli - Camera con Vista",
    en: "Colli Menu - Camera con Vista",
  },
};

function PublicPageRoute({
  component: Component,
  slug,
}: {
  component: RoutableComponent;
  slug: string;
}) {
  const { language } = useLanguage();
  const { data: visiblePages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/pages"],
  });

  const page = visiblePages.find((p) => p.slug === slug);
  const titles = PAGE_TITLES[slug];

  useEffect(() => {
    if (!titles) return;
    const langKey = language === "en" ? "en" : "it";
    const customTitle = langKey === "it" ? page?.metaTitleIt : page?.metaTitleEn;
    document.title = customTitle || titles[langKey];
  }, [slug, language, page?.metaTitleIt, page?.metaTitleEn, titles]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Caricamento...</div>;
  }

  const isPageVisible = visiblePages.some((p) => p.slug === slug);

  if (!isPageVisible && visiblePages.length > 0) {
    return <NotFound />;
  }

  return <Component />;
}

function StaticPageRoute({
  component: Component,
  slug,
}: {
  component: RoutableComponent;
  slug: string;
}) {
  const { language } = useLanguage();
  const titles = PAGE_TITLES[slug];

  useEffect(() => {
    if (!titles) return;
    document.title = titles[language === "en" ? "en" : "it"];
  }, [slug, language, titles]);

  return <Component />;
}

function AdminLoginRoute() {
  const { isAuthenticated } = useAdmin();

  if (isAuthenticated) {
    return <Redirect to="/admina" />;
  }

  return <AdminLogin />;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path="/">{() => <PublicPageRoute component={Home} slug="home" />}</Route>
          <Route path="/home">{() => <Redirect to="/" />}</Route>
          <Route path="/menu">{() => <PublicPageRoute component={Menu} slug="menu" />}</Route>
          <Route path="/lista-vini">
            {() => <PublicPageRoute component={CartaVini} slug="carta-vini" />}
          </Route>
          <Route path="/carta-vini">
            {() => {
              window.location.replace("/lista-vini");
              return null;
            }}
          </Route>
          <Route path="/cocktail-bar">
            {() => <PublicPageRoute component={CocktailBar} slug="cocktail-bar" />}
          </Route>
          <Route path="/eventi">{() => <PublicPageRoute component={Eventi} slug="eventi" />}</Route>
          <Route path="/eventi/:id" component={EventDetail} />
          <Route path="/eventi-privati">
            {() => <PublicPageRoute component={EventiPrivati} slug="eventi-privati" />}
          </Route>
          <Route path="/eventi-privati/aperitivo">
            {() => <PublicPageRoute component={AperitivoPage} slug="eventi-privati-aperitivo" />}
          </Route>
          <Route path="/eventi-privati/cena">
            {() =>
              PRIVATE_DINNER_ENABLED ? (
                <PublicPageRoute component={CenaPage} slug="eventi-privati-cena" />
              ) : (
                <Redirect to="/eventi-privati" />
              )
            }
          </Route>
          <Route path="/eventi-privati/esclusivo">
            {() => <PublicPageRoute component={EsclusivoPage} slug="eventi-privati-esclusivo" />}
          </Route>
          <Route path="/galleria">
            {() => <PublicPageRoute component={Galleria} slug="galleria" />}
          </Route>
          <Route path="/dove-siamo">
            {() => <PublicPageRoute component={DoveSiamo} slug="dove-siamo" />}
          </Route>
          <Route path="/privacy">
            {() => <StaticPageRoute component={PrivacyPolicy} slug="privacy" />}
          </Route>
          <Route path="/cookie">
            {() => <StaticPageRoute component={CookiePolicy} slug="cookie" />}
          </Route>
          <Route path="/colli">{() => <PublicPageRoute component={Colli} slug="colli" />}</Route>
          <Route path="/colli/menu">
            {() => <StaticPageRoute component={ColliMenu} slug="colli-menu" />}
          </Route>
          <Route path="/colli/admin">{() => <Redirect to="/colli/admina" />}</Route>
          <Route path="/colli/admin/login">{() => <Redirect to="/colli/admina" />}</Route>
          <Route path="/colli/admin/panel">{() => <Redirect to="/colli/admina/panel" />}</Route>
          <Route path="/colli/admina/login">{() => <Redirect to="/colli/admina" />}</Route>
          <Route path="/colli/admina" component={ColliAdminLogin} />
          <Route path="/colli/admina/panel" component={ColliAdminPanel} />
          <Route path="/contatti">
            {() => {
              window.location.replace("/dove-siamo");
              return null;
            }}
          </Route>
          <Route path="/admina/login" component={AdminLoginRoute} />
          <Route path="/admina/settings">
            {() => <ProtectedAdminRoute component={AdminSettings} />}
          </Route>
          <Route path="/admina/sync-google">
            {() => <ProtectedAdminRoute component={AdminSyncGoogle} />}
          </Route>
          <Route path="/admina/events">
            {() => <ProtectedAdminRoute component={AdminEvents} />}
          </Route>
          <Route path="/admina/media">{() => <ProtectedAdminRoute component={AdminMedia} />}</Route>
          <Route path="/admina/gallery">
            {() => <ProtectedAdminRoute component={AdminGallery} />}
          </Route>
          <Route path="/admina/seo">{() => <ProtectedAdminRoute component={AdminSeo} />}</Route>
          <Route path="/admina/preview">
            {() => <ProtectedAdminRoute component={AdminPreview} />}
          </Route>
          <Route path="/admina">{() => <ProtectedAdminRoute component={AdminPages} />}</Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AdminProvider>
            <Toaster />
            <Router />
          </AdminProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
