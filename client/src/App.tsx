import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AdminProvider } from "@/contexts/AdminContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import CartaVini from "@/pages/carta-vini";
import CocktailBar from "@/pages/cocktail-bar";
import Eventi from "@/pages/eventi";
import EventiPrivati from "@/pages/eventi-privati";
import Galleria from "@/pages/galleria";
import Contatti from "@/pages/contatti";
import AdminDashboard from "@/pages/admin/dashboard";

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
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/:rest*" component={AdminDashboard} />
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
