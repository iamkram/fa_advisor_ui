import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import ClientPortal from "./pages/portal/ClientPortal";
import Compliance from "./pages/Compliance";
import Clients from "./pages/Clients";
import Holdings from "./pages/Holdings";
import Reports from "./pages/Reports";
import Tasks from "./pages/Tasks";
import Documents from "./pages/Documents";
import AIInsights from "./pages/AIInsights";
import ClientDetail from "./pages/client/ClientDetail";
import ReportGenerator from "./pages/ReportGenerator";
import BatchRuns from "./pages/admin/BatchRuns";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/portal" component={ClientPortal} />
      <Route path="/compliance" component={Compliance} />
      <Route path={"/clients"} component={Clients} />
      <Route path={"/client/:id"} component={ClientDetail} />
      <Route path={"/holdings"} component={Holdings} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/report/generate"} component={ReportGenerator} />
      <Route path={"/tasks"} component={Tasks} />
      <Route path={"/documents"} component={Documents} />
      <Route path={"/ai-insights"} component={AIInsights} />
      <Route path={"/admin/batch-runs"} component={BatchRuns} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
