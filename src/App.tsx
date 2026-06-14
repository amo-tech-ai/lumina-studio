import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { OperatorLayout } from "@/layouts/OperatorLayout";
import Index from "./pages/Index";
import FashionPhotography from "./pages/FashionPhotography";
import EcommercePhotography from "./pages/EcommercePhotography";
import ClothingPhotography from "./pages/ClothingPhotography";
import AmazonPhotography from "./pages/AmazonPhotography";
import LocationPhotography from "./pages/LocationPhotography";
import JewelleryPhotography from "./pages/JewelleryPhotography";
import InstagramCampaigns from "./pages/InstagramCampaigns";
import VideoProduction from "./pages/VideoProduction";
import ShopifyPhotography from "./pages/ShopifyPhotography";
import Login from "./pages/Login";
import AssetsPage from "./pages/dashboard/AssetsPage";
import BrandPage from "./pages/dashboard/BrandPage";
import HubPage from "./pages/dashboard/HubPage";
import LinksPage from "./pages/dashboard/LinksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <OperatorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HubPage />} />
              <Route path="brand" element={<BrandPage />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="links" element={<LinksPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="/services/fashion-photography" element={<FashionPhotography />} />
            <Route path="/services/ecommerce-photography" element={<EcommercePhotography />} />
            <Route path="/services/clothing" element={<ClothingPhotography />} />
            <Route path="/services/amazon" element={<AmazonPhotography />} />
            <Route path="/services/location" element={<LocationPhotography />} />
            <Route path="/services/jewellery" element={<JewelleryPhotography />} />
            <Route path="/services/instagram" element={<InstagramCampaigns />} />
            <Route path="/services/video" element={<VideoProduction />} />
            <Route path="/services/shopify" element={<ShopifyPhotography />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
