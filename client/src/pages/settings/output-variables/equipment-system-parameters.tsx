import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Settings2 } from "lucide-react";
import expLogo from "@/assets/exp-logo.png";

export default function EquipmentSystemParameters() {
  const [, setLocation] = useLocation();

  const [pitLevel, setPitLevel] = useState("7.0");
  const [pipeDiameter, setPipeDiameter] = useState("4.0");
  const [lineLength, setLineLength] = useState("80.0");
  const [nozzleDeltaP, setNozzleDeltaP] = useState("150.0");
  const [furnacePressure, setFurnacePressure] = useState("7.0");
  const [frictionFactor, setFrictionFactor] = useState("0.018");
  const [kMinorLosses, setKMinorLosses] = useState("7.5");
  const [sulfurSG, setSulfurSG] = useState("1.79");
  const [cvMax, setCvMax] = useState("548.0");
  const [valveProfile, setValveProfile] = useState("equal-percentage");
  const [rangeability, setRangeability] = useState("85");

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/output-variables")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings2 className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Equipment System Parameters</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              Configure equipment-specific parameters including design specifications, operating limits, performance curves, and physical dimensions for all major process equipment.
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Sulfur Hydraulic System Parameters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pit-level" className="text-xs text-muted-foreground">Pit Level (ft)</Label>
                  <Input
                    id="pit-level"
                    type="text"
                    value={pitLevel}
                    onChange={(e) => setPitLevel(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-pit-level"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pipe-diameter" className="text-xs text-muted-foreground">Pipe Diameter (in)</Label>
                  <Input
                    id="pipe-diameter"
                    type="text"
                    value={pipeDiameter}
                    onChange={(e) => setPipeDiameter(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-pipe-diameter"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="line-length" className="text-xs text-muted-foreground">Line Length (ft)</Label>
                  <Input
                    id="line-length"
                    type="text"
                    value={lineLength}
                    onChange={(e) => setLineLength(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-line-length"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nozzle-delta-p" className="text-xs text-muted-foreground">Nozzle ΔP (psi)</Label>
                  <Input
                    id="nozzle-delta-p"
                    type="text"
                    value={nozzleDeltaP}
                    onChange={(e) => setNozzleDeltaP(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-nozzle-delta-p"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="furnace-pressure" className="text-xs text-muted-foreground">Furnace Pressure (psig)</Label>
                  <Input
                    id="furnace-pressure"
                    type="text"
                    value={furnacePressure}
                    onChange={(e) => setFurnacePressure(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-furnace-pressure"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="friction-factor" className="text-xs text-muted-foreground">Friction Factor</Label>
                  <Input
                    id="friction-factor"
                    type="text"
                    value={frictionFactor}
                    onChange={(e) => setFrictionFactor(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-friction-factor"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="k-minor-losses" className="text-xs text-muted-foreground">K Minor Losses</Label>
                  <Input
                    id="k-minor-losses"
                    type="text"
                    value={kMinorLosses}
                    onChange={(e) => setKMinorLosses(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-k-minor-losses"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sulfur-sg" className="text-xs text-muted-foreground">Sulfur SG</Label>
                  <Input
                    id="sulfur-sg"
                    type="text"
                    value={sulfurSG}
                    onChange={(e) => setSulfurSG(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-sulfur-sg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cv-max" className="text-xs text-muted-foreground">Cv Max</Label>
                  <Input
                    id="cv-max"
                    type="text"
                    value={cvMax}
                    onChange={(e) => setCvMax(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-cv-max"
                  />
                </div>
                <div className="space-y-1">
                  <Select value={valveProfile} onValueChange={setValveProfile}>
                    <SelectTrigger className="h-8 text-sm" data-testid="select-valve-profile">
                      <SelectValue placeholder="Select valve profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal-percentage" data-testid="option-equal-percentage">Equal Percentage</SelectItem>
                      <SelectItem value="linear" data-testid="option-linear">Linear</SelectItem>
                      <SelectItem value="quick-opening" data-testid="option-quick-opening">Quick Opening</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Cv(p) = (Cv_max / R) * R^(p/100)
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rangeability" className="text-xs text-muted-foreground">Rangeability (R)</Label>
                  <Input
                    id="rangeability"
                    type="text"
                    value={rangeability}
                    onChange={(e) => setRangeability(e.target.value)}
                    className="bg-muted/50 h-8 text-sm"
                    data-testid="input-rangeability"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Typical: 50-200 (default 124 based on Cv=25.039 at p=30.6%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
