import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";

const competitors = [
  { name: "Elessent (MECS)", cost: "$500k-$800k" },
  { name: "Honeywell UniSim", cost: "High" },
  { name: "Siemens Plant Sim", cost: "High" },
  { name: "AVEVA", cost: "Moderate" }
];

const features = [
  { name: "Performance Visualization", ours: true, competitors: [false, false, false, false] },
  { name: "Monte Carlo Simulations", ours: true, competitors: [false, false, false, false] },
  { name: "Projected Probabilities", ours: true, competitors: [false, false, false, false] },
  { name: "Dynamic Simulation", ours: true, competitors: [true, true, false, true] },
  { name: "Custom Integration", ours: true, competitors: [true, true, false, true] },
  { name: "Cost Efficiency", ours: true, competitors: [false, false, false, false] },
];

export default function CompetitiveAdvantages() {
  return (
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            Competitive Advantages
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how our simulator outperforms industry alternatives
          </p>
        </div>
        
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="table-comparison">
              <thead>
                <tr className="border-b border-card-border bg-muted/50">
                  <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center p-4 font-semibold text-primary">Our Simulator</th>
                  {competitors.map((comp, idx) => (
                    <th key={idx} className="text-center p-4 font-medium text-muted-foreground text-sm">
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr key={idx} className="border-b border-card-border hover-elevate">
                    <td className="p-4 font-medium text-foreground">{feature.name}</td>
                    <td className="p-4 text-center">
                      {feature.ours ? (
                        <Check className="w-5 h-5 text-chart-2 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    {feature.competitors.map((has, compIdx) => (
                      <td key={compIdx} className="p-4 text-center">
                        {has ? (
                          <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="p-4 font-semibold text-foreground">Cost</td>
                  <td className="p-4 text-center font-mono text-sm text-chart-2">Cost Efficient</td>
                  {competitors.map((comp, idx) => (
                    <td key={idx} className="p-4 text-center font-mono text-sm text-muted-foreground">
                      {comp.cost}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}
