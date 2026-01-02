import { Card } from "@/components/ui/card";
import { BarChart3, Cpu, Zap, Shield, Clock } from "lucide-react";

const MonteCarloIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 20h18M3 20V8M21 20V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 18V14M8 18V11M11 18V7M14 18V11M17 18V14M20 18V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 12C3 12 5 4 12 4C19 4 21 12 21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const features = [
  {
    icon: MonteCarloIcon,
    title: "Dynamic Simulations",
    description: "Models that replicate the dynamic movements of flows, temperatures, pressures, and production rates inside chemical plants.",
    color: "text-primary"
  },
  {
    icon: BarChart3,
    title: "Performance Visualization",
    description: "Project plant performance versus control variable adjustments, enabling real-time performance optimization.",
    color: "text-chart-2"
  },
  {
    icon: Cpu,
    title: "Projected Probabilities & Outcomes",
    description: "Advanced modeling identifies optimal plant set-points for maximum efficiency and throughput.",
    color: "text-chart-3"
  },
  {
    icon: Zap,
    title: "Interlock Training",
    description: "Teaches operators and engineers how to manage emergency shutdown scenarios, plant interlocks, and upset conditions.",
    color: "text-chart-1"
  },
  {
    icon: Shield,
    title: "Profit Maximization",
    description: "Predictive modeling identifies operating conditions that maximize asset generation while mitigating maintenance and safety risks.",
    color: "text-chart-4"
  },
  {
    icon: Clock,
    title: "Accelerated Training",
    description: "Simulation speeds up to 10x real-time for rapid operator competency development.",
    color: "text-chart-5"
  }
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            Comprehensive Training Features
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Industry-leading capabilities that set our simulator apart from competitors
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover-elevate transition-all"
              data-testid={`card-feature-${index}`}
            >
              <feature.icon className={`w-8 h-8 mb-4 ${feature.color}`} />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
