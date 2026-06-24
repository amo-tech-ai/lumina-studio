import "./marketing.css";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

// (marketing) group layout — public header/footer only. NO CopilotKit, NO
// OperatorPanel, NO ThreadsDrawer. The `.marketing` class scopes the iPix brand
// tokens (marketing.css) so the operator theme is untouched.
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="marketing">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
