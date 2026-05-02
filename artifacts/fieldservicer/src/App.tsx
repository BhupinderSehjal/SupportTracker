import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Tickets from "@/pages/tickets";
import TicketNew from "@/pages/ticket-new";
import TicketDetail from "@/pages/ticket-detail";
import Clients from "@/pages/clients";
import Sites from "@/pages/sites";
import Jobs from "@/pages/jobs";
import Employees from "@/pages/employees";
import Vendors from "@/pages/vendors";
import Contacts from "@/pages/contacts";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/tickets/new" component={TicketNew} />
        <Route path="/tickets/:id" component={TicketDetail} />
        <Route path="/tickets" component={Tickets} />
        <Route path="/clients/:id" component={Clients} />
        <Route path="/clients" component={Clients} />
        <Route path="/sites" component={Sites} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/employees" component={Employees} />
        <Route path="/vendors" component={Vendors} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
