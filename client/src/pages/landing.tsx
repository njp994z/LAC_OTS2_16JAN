import { useLocation } from "wouter";
import HeroSection from "@/components/HeroSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import CompetitiveAdvantages from "@/components/CompetitiveAdvantages";
import { Button } from "@/components/ui/button";
import { Activity, LogIn } from "lucide-react";
import expLogo from "@/assets/exp-logo.png";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <span className="font-semibold text-lg text-foreground">Lithium Americas</span>
          </div>
          <Button 
            onClick={() => setLocation("/login")}
            data-testid="button-login-header"
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            Login
          </Button>
        </div>
      </header>
      
      <main>
        <HeroSection />
        
        <div id="features">
          <FeaturesGrid />
        </div>
      </main>
      
      <CompetitiveAdvantages />
      
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                Custom Process Operator Training Simulator for Lithium Americas
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
