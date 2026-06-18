import { PlaceholderScreen } from "@/components/operator/PlaceholderScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const proofCards = [
  { label: "Commerce proofs", value: "5/5", detail: "Mercur + Stripe paid order" },
  { label: "Brand intelligence", value: "Edge ✓", detail: "UI-002 adds operator form" },
  { label: "DNA scoring", value: "Pending", detail: "Proof #7 — DNA-001" },
  { label: "Product links", value: "Pending", detail: "Proof #8 — UI-004" },
];

export default function CommandCenterPage() {
  return (
    <PlaceholderScreen
      title="Command Center"
      description="Overview of MVP proof status and operator queue. KPIs and proactive alerts ship in DASH-002."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {proofCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="font-sans">
              <p className="text-2xl font-medium text-primary">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PlaceholderScreen>
  );
}
