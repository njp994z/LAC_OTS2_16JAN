import { Link } from "wouter";
import expLogo from "@/assets/exp-logo.png";

export default function StartUpBurner() {
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
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold text-foreground mb-4">Start-Up Burner Simulator</h1>
          <p className="text-muted-foreground">Coming Soon</p>
        </div>
      </main>
    </div>
  );
}
