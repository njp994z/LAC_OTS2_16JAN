import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import expLogo from "@/assets/exp-logo.png";

export default function HipShellGeometry() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-hip-shell-geometry">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/unit-operation/gas-gas-heat-exchanger">
              <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <div>
              <h1 className="text-lg font-bold leading-tight font-mono" data-testid="text-page-title">HIP Heat Exchanger — Interactive Crossflow Model</h1>
              <p className="text-xs text-muted-foreground italic">Shell geometry visualization — coming soon</p>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-[1400px] mx-auto">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">HIP Shell Geometry</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground">HIP shell geometry crossflow model will be added here. Provide the HIP-specific dimensions and tube layout to populate this page.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
