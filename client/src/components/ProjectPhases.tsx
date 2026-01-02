import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const phases = [
  {
    number: "01",
    title: "Static Simulation",
    description: "Steady-state model predicting output variables based on equipment sizes and set points with GUI display.",
    status: "completed"
  },
  {
    number: "02",
    title: "Dynamic Simulation & AI",
    description: "Dynamic model with time-step transitions, PID control visualization, AI assistant integration, and neural network optimization.",
    status: "in-progress"
  },
  {
    number: "03",
    title: "Scenario Development",
    description: "Program interlock trips, upset scenarios, gradual escalation, testing with client feedback, and final delivery.",
    status: "upcoming"
  }
];

export default function ProjectPhases() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            Project Phases
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Structured development approach delivering value at each stage
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {phases.map((phase, index) => (
            <Card 
              key={index}
              className="p-8 relative overflow-hidden hover-elevate"
              data-testid={`card-phase-${index}`}
            >
              <div className="absolute top-0 right-0 text-8xl font-bold text-muted/10 -mr-4 -mt-4">
                {phase.number}
              </div>
              
              <div className="relative z-10">
                {phase.status === "completed" && (
                  <CheckCircle2 className="w-6 h-6 text-chart-2 mb-4" />
                )}
                {phase.status === "in-progress" && (
                  <div className="w-6 h-6 mb-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
                
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Phase {phase.number}
                </h3>
                <h4 className="text-lg font-medium text-primary mb-3">
                  {phase.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {phase.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
