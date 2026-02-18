import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FashionPhotography from "./pages/FashionPhotography";
import EcommercePhotography from "./pages/EcommercePhotography";
import ClothingPhotography from "./pages/ClothingPhotography";
import AmazonPhotography from "./pages/AmazonPhotography";
import LocationPhotography from "./pages/LocationPhotography";
import JewelleryPhotography from "./pages/JewelleryPhotography";
import InstagramCampaigns from "./pages/InstagramCampaigns";
import VideoProduction from "./pages/VideoProduction";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services/fashion-photography" element={<FashionPhotography />} />
          <Route path="/services/ecommerce-photography" element={<EcommercePhotography />} />
          <Route path="/services/clothing" element={<ClothingPhotography />} />
          <Route path="/services/amazon" element={<AmazonPhotography />} />
          <Route path="/services/location" element={<LocationPhotography />} />
          <Route path="/services/jewellery" element={<JewelleryPhotography />} />
          <Route path="/services/instagram" element={<InstagramCampaigns />} />
          <Route path="/services/video" element={<VideoProduction />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
