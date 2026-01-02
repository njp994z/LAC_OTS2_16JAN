import { Button } from "@/components/ui/button";
import { Activity, TrendingUp } from "lucide-react";

interface HeroSectionProps {
  onViewDemo: () => void;
}

const BellCurveIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 20h18M3 20V8M21 20V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 18V14M8 18V11M11 18V7M14 18V11M17 18V14M20 18V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 12C3 12 5 4 12 4C19 4 21 12 21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function HeroSection({ onViewDemo }: HeroSectionProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-card">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Activity className="w-8 h-8 text-primary" />
          <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Industry-Leading Technology</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-foreground mb-6 leading-tight">
          Custom Sulfuric Acid Process Simulator for<br />
          <span className="text-primary">Operator Training</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
          High-fidelity dynamic Operator Training Simulator (OTS) with dynamic simulations customized for Lithium America's new sulfuric acid plant.      
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Button 
            size="lg" 
            onClick={onViewDemo}
            data-testid="button-view-demo"
            className="min-w-[160px]"
          >
            View Demo
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-2 p-6 rounded-md bg-card border border-card-border">
            <TrendingUp className="w-6 h-6 text-chart-2" />
            <span className="text-sm font-medium text-foreground">Operator Training Simulator</span>
            <span className="text-xs text-muted-foreground">Increase Operational Effectiveness</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-6 rounded-md bg-card border border-card-border">
            <BellCurveIcon className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-foreground">Dynamic Simulations</span>
            <span className="text-xs text-muted-foreground">Dynamics Tuned to Actual Plant Operations</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-6 rounded-md bg-card border border-card-border">
            <Activity className="w-6 h-6 text-chart-3" />
            <span className="text-sm font-medium text-foreground">Process Digital Twin Models</span>
            <span className="text-xs text-muted-foreground">High-fidelity process modeling</span>
          </div>
        </div>
      </div>
      
      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
}
