import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import AddProduct from "@/pages/add-product";
import AppLayout from "@/components/layout/app-layout";
import { useEffect, useState } from "react";

function Router() {
  const [location] = useLocation();
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    const hash = window.location.hash.slice(1) || "dashboard";
    setCurrentPage(hash);
  }, [location]);

  return (
    <AppLayout currentPage={currentPage}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/add-product" component={AddProduct} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
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
