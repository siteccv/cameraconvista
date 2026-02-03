import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import EventiPrivati from "@/pages/eventi-privati";
import Galleria from "@/pages/galleria";
import Contatti from "@/pages/contatti";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSettings from "@/pages/admin/settings";
import AdminPages from "@/pages/admin/pages";
import AdminEvents from "@/pages/admin/events";
import AdminMedia from "@/pages/admin/media";
import AdminSeo from "@/pages/admin/seo";
import AdminPreview from "@/pages/admin/preview";

function ProtectedAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdmin();
  
  if (!isAuthenticated) {
    return <Redirect to="/admina/login" />;
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
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/menu" component={Menu} />
      <Route path="/carta-vini" component={CartaVini} />
      <Route path="/cocktail-bar" component={CocktailBar} />
      <Route path="/eventi" component={Eventi} />
      <Route path="/eventi-privati" component={EventiPrivati} />
      <Route path="/galleria" component={Galleria} />
      <Route path="/contatti" component={Contatti} />
      <Route path="/admina/login" component={AdminLoginRoute} />
      <Route path="/admina/settings">
        {() => <ProtectedAdminRoute component={AdminSettings} />}
      </Route>
      <Route path="/admina/pages">
        {() => <ProtectedAdminRoute component={AdminPages} />}
      </Route>
      <Route path="/admina/events">
        {() => <ProtectedAdminRoute component={AdminEvents} />}
      </Route>
      <Route path="/admina/media">
        {() => <ProtectedAdminRoute component={AdminMedia} />}
      </Route>
      <Route path="/admina/seo">
        {() => <ProtectedAdminRoute component={AdminSeo} />}
      </Route>
      <Route path="/admina/preview">
        {() => <ProtectedAdminRoute component={AdminPreview} />}
      </Route>
      <Route path="/admina">
        {() => <ProtectedAdminRoute component={AdminDashboard} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
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
