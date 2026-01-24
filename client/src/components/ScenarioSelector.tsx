import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, AlertTriangle, CheckCircle2, BarChart3, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

type ButtonVariant = "default" | "warning" | "destructive";

const scenarios = [
  {
    id: 1,
    name: "Static Plant Operations",
    description: "Learn the inter-relations between each of the Process Variables (PV) when the acid plant operates in a Static Mode where the Set Points (SP) are always equal to the PVs.",
    difficulty: "Beginner",
    status: "available",
    icon: CheckCircle2,
    iconColor: "text-green-500",
    buttonVariant: "default" as ButtonVariant,
  },
  {
    id: 2,
    name: "Dynamic Operations",
    description: "Transitional operations from one steady-state to another steady-state.",
    difficulty: "Intermediate",
    status: "available",
    icon: BarChart3,
    iconColor: "text-blue-500",
    buttonVariant: "default" as ButtonVariant,
    externalLink: "https://delta-v-controller-faceplate.lovable.app/home-screen",
  },
  {
    id: 3,
    name: "Start-Up Operations",
    description: "Bring a cold plant on-line to normal operations.",
    difficulty: "Intermediate",
    status: "available",
    icon: RotateCcw,
    iconColor: "text-yellow-500",
    buttonVariant: "warning" as ButtonVariant,
  },
  {
    id: 4,
    name: "Emergency",
    subtitle: "Scenarios & Interlocks",
    description: "Learn to navigate un-expected plant scenarios and emergency situations.",
    difficulty: "Advanced",
    status: "available",
    icon: AlertTriangle,
    iconColor: "text-orange-500",
    buttonVariant: "destructive" as ButtonVariant,
  },
];

interface ScenarioSelectorProps {
  onSelectScenario: (id: number) => void;
  selectedScenario?: number | null;
}

export default function ScenarioSelector({ onSelectScenario, selectedScenario }: ScenarioSelectorProps) {
  const [, setLocation] = useLocation();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {scenarios.map((scenario) => (
        <Card 
          key={scenario.id}
          className={cn(
            "p-6 hover-elevate bg-card/50 border-border/50",
            selectedScenario === scenario.id && "ring-2 ring-primary border-primary"
          )}
          data-testid={`card-scenario-${scenario.id}`}
        >
          <div className="flex items-start gap-4">
            <div className={cn("flex-shrink-0 mt-1", scenario.iconColor)}>
              <scenario.icon className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                <div>
                  <h4 className="text-lg font-semibold text-foreground" data-testid={`text-scenario-name-${scenario.id}`}>
                    {scenario.name}
                  </h4>
                  {'subtitle' in scenario && scenario.subtitle && (
                    <h5 className="text-base font-medium text-foreground" data-testid={`text-scenario-subtitle-${scenario.id}`}>
                      {scenario.subtitle}
                    </h5>
                  )}
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs shrink-0",
                    scenario.difficulty === "Beginner" && "bg-green-500/20 text-green-400 border-green-500/30",
                    scenario.difficulty === "Intermediate" && "bg-blue-500/20 text-blue-400 border-blue-500/30",
                    scenario.difficulty === "Advanced" && "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  )}
                  data-testid={`badge-difficulty-${scenario.id}`}
                >
                  {scenario.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4" data-testid={`text-scenario-description-${scenario.id}`}>
                {scenario.description}
              </p>
              <Button 
                size="sm"
                variant={scenario.buttonVariant === "warning" ? "default" : scenario.buttonVariant}
                onClick={() => {
                  if (scenario.id === 1) {
                    // Static Plant Operations - navigate to delta-v home-screen with mode=static
                    setLocation("/delta-v?mode=static");
                  } else if (scenario.id === 2) {
                    // Dynamic Operations - navigate to delta-v home-screen with mode=dynamic
                    setLocation("/delta-v?mode=dynamic");
                  } else if (scenario.id === 3) {
                    // Start-Up Operations - navigate to delta-v home-screen with mode=startup
                    setLocation("/delta-v?mode=startup");
                  } else if (scenario.id === 4) {
                    // Emergency Scenarios - navigate to delta-v home-screen with mode=emergency
                    setLocation("/delta-v?mode=emergency");
                  } else if ('externalLink' in scenario && scenario.externalLink) {
                    window.open(scenario.externalLink, "_blank", "noopener,noreferrer");
                  } else {
                    onSelectScenario(scenario.id);
                  }
                }}
                data-testid={`button-start-scenario-${scenario.id}`}
                className={cn(
                  "gap-2",
                  scenario.buttonVariant === "warning" && "bg-orange-500 hover:bg-orange-600 text-white"
                )}
              >
                <PlayCircle className="w-4 h-4" />
                Start Scenario
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
