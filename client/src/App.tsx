import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import TeamWorkflow from "@/pages/team-workflow";
import SwimmersManagement from "@/pages/swimmers-management";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/team/:id/workflow" component={TeamWorkflow} />
      <Route path="/swimmers" component={SwimmersManagement} />
      <Route component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
