import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
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
import NotFound from "./pages/NotFound";
import { OperatorLayout } from "./layouts/OperatorLayout";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import AssetsPage from "./pages/dashboard/AssetsPage";
import BrandHubPage from "./pages/dashboard/BrandHubPage";
import BrandIntakePage from "./pages/dashboard/BrandIntakePage";
import CommandCenterPage from "./pages/dashboard/CommandCenterPage";
import ProductsPage from "./pages/dashboard/ProductsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";

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
              <Route index element={<CommandCenterPage />} />
              <Route path="brand" element={<BrandHubPage />} />
              <Route path="brand/intake" element={<BrandIntakePage />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
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
