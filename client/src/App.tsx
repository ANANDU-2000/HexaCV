import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./shared/layout/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import ResumeBuilder from "./pages/ResumeBuilder";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import CookiePolicy from "./pages/Cookie";
import Pricing from "./pages/Pricing";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund" component={Refund} />
      <Route path="/cookies" component={CookiePolicy} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/builder/upload" component={ResumeBuilder} />
      <Route path="/builder/scratch" component={ResumeBuilder} />
      <Route path="/builder/ai" component={ResumeBuilder} />
      <Route path="/builder/linkedin" component={ResumeBuilder} />
      <Route path="/builder" component={ResumeBuilder} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/:sub*" component={Dashboard} />
      <Route path="/admin" component={Dashboard} />
      <Route path="/url" component={Dashboard} />

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
