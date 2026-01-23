import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import expLogo from "@/assets/exp-logo.png";

interface ExperiencePageProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export default function ExperiencePage({ title = "Experience", description = "Coming soon", children }: ExperiencePageProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setLocation("/demo")}
              data-testid="button-back-to-demo"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            {!isAuthenticated && (
              <Button 
                onClick={() => setLocation("/login")}
                data-testid="button-login-header"
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold text-foreground mb-3" data-testid="page-title">
              {title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto" data-testid="page-description">
              {description}
            </p>
          </div>

          {children || (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Activity className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Coming Soon
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                This feature is currently under development. Check back soon for updates.
              </p>
              <Button
                onClick={() => setLocation("/demo")}
                data-testid="button-return-to-demo"
              >
                Return to Demo
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                Custom Process Operator Training Simulator for Lithium Americas
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
