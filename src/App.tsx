import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Vendas = lazy(() => import("./pages/Vendas.tsx"));
const Produtos = lazy(() => import("./pages/Produtos.tsx"));
const Relatorios = lazy(() => import("./pages/Relatorios.tsx"));
const Clientes = lazy(() => import("./pages/Clientes.tsx"));

const PageFallback = () => (
  <div className="min-h-screen bg-background text-muted-foreground flex items-center justify-center">
    Carregando...
  </div>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner theme="dark" position="top-right" richColors />
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
          <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
