import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
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

function PublicPageRoute({ component: Component, slug }: { component: React.ComponentType; slug: string }) {
  const { data: visiblePages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/pages"],
  });
  
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
      <Route path="/carta-vini">{() => <PublicPageRoute component={CartaVini} slug="carta-vini" />}</Route>
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
