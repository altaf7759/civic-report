import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import AddIssuePage from "@/pages/add-issue-page";
import MyReportsPage from "@/pages/my-reports-page";
import IssueDetailPage from "@/pages/issue-detail-page";
import AnalyticsPage from "@/pages/analytics-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/add-issue" component={AddIssuePage} />
      <ProtectedRoute path="/my-reports" component={MyReportsPage} />
      <ProtectedRoute path="/issue/:id" component={IssueDetailPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
