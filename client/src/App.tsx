import { useEffect } from "react";
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
import Eventi from "@/pages/eventi";
import EventDetail from "@/pages/event-detail";
import EventiPrivati from "@/pages/eventi-privati";
import Galleria from "@/pages/galleria";
import Contatti from "@/pages/contatti";
import AdminLogin from "@/pages/admin/login";
import AdminSettings from "@/pages/admin/settings";
import AdminSyncGoogle from "@/pages/admin/sync-google";
import AdminPages from "@/pages/admin/pages";
import AdminEvents from "@/pages/admin/events";
import AdminMedia from "@/pages/admin/media";
import AdminGallery from "@/pages/admin/gallery";
import AdminSeo from "@/pages/admin/seo";
import AdminPreview from "@/pages/admin/preview";
import { ScrollToTop } from "@/components/ScrollToTop";
import type { Page } from "@shared/schema";

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdmin();
  
  if (!isAuthenticated) {
    return <Redirect to="/admina/login" />;
  }
  
  return <Component />;
}

const PAGE_TITLES: Record<string, { it: string; en: string }> = {
  home: { it: "Camera con Vista - Ristorante & Cocktail Bar Bologna", en: "Camera con Vista - Restaurant & Cocktail Bar Bologna" },
  menu: { it: "Menu - Camera con Vista | Ristorante Bologna", en: "Menu - Camera con Vista | Restaurant Bologna" },
  "carta-vini": { it: "Lista Vini - Camera con Vista | Wine List Bologna", en: "Wine List - Camera con Vista | Bologna" },
  "cocktail-bar": { it: "Cocktail Bar - Camera con Vista | Bologna", en: "Cocktail Bar - Camera con Vista | Bologna" },
  eventi: { it: "Eventi - Camera con Vista | Events Bologna", en: "Events - Camera con Vista | Bologna" },
  "eventi-privati": { it: "Eventi Privati - Camera con Vista | Bologna", en: "Private Events - Camera con Vista | Bologna" },
  galleria: { it: "Galleria - Camera con Vista | Gallery Bologna", en: "Gallery - Camera con Vista | Bologna" },
  contatti: { it: "Contatti - Camera con Vista | Contact Bologna", en: "Contact - Camera con Vista | Bologna" },
};

function PublicPageRoute({ component: Component, slug }: { component: React.ComponentType; slug: string }) {
  const { language } = useLanguage();
  const { data: visiblePages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/pages"],
  });

  const page = visiblePages.find(p => p.slug === slug);
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
  
  const isPageVisible = visiblePages.some(p => p.slug === slug);
  
  if (!isPageVisible && visiblePages.length > 0) {
    return <NotFound />;
  }
  
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
      <Switch>
      <Route path="/">{() => <PublicPageRoute component={Home} slug="home" />}</Route>
      <Route path="/menu">{() => <PublicPageRoute component={Menu} slug="menu" />}</Route>
      <Route path="/lista-vini">{() => <PublicPageRoute component={CartaVini} slug="carta-vini" />}</Route>
      <Route path="/carta-vini">{() => { window.location.replace("/lista-vini"); return null; }}</Route>
      <Route path="/cocktail-bar">{() => <PublicPageRoute component={CocktailBar} slug="cocktail-bar" />}</Route>
      <Route path="/eventi">{() => <PublicPageRoute component={Eventi} slug="eventi" />}</Route>
      <Route path="/eventi/:id" component={EventDetail} />
      <Route path="/eventi-privati">{() => <PublicPageRoute component={EventiPrivati} slug="eventi-privati" />}</Route>
      <Route path="/galleria">{() => <PublicPageRoute component={Galleria} slug="galleria" />}</Route>
      <Route path="/contatti">{() => <PublicPageRoute component={Contatti} slug="contatti" />}</Route>
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
      <Route path="/admina/media">
        {() => <ProtectedAdminRoute component={AdminMedia} />}
      </Route>
      <Route path="/admina/gallery">
        {() => <ProtectedAdminRoute component={AdminGallery} />}
      </Route>
      <Route path="/admina/seo">
        {() => <ProtectedAdminRoute component={AdminSeo} />}
      </Route>
      <Route path="/admina/preview">
        {() => <ProtectedAdminRoute component={AdminPreview} />}
      </Route>
      <Route path="/admina">
        {() => <ProtectedAdminRoute component={AdminPages} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
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
