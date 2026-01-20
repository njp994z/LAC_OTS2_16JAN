import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Droplets, BookOpen, Settings, Play, Loader2, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InputParams {
  x_H2SO4_AD0: string;
  x_H2O_AD0: string;
  Temp_AD0: string;
  Pressure_AD0: string;
  Flow_AD0: string;
  dP_BME: string;
  Packing_Depth_ft: string;
}

interface OutputParams {
  x_H2SO4_AD1: string;
  x_H2O_AD1: string;
  m_Total_AD0: string;
  m_Total_AD1: string;
  Temp_AD1: string;
  Pressure_AD1: string;
  Flow_AD1: string;
  SO2_GD0: string;
  SO3_GD0: string;
  O2_GD0: string;
  N2_GD0: string;
  H2O_GD0: string;
  TOTAL_GD0: string;
  SO3_GD1: string;
  TOTAL_GD1: string;
  PRESSURE_GD1: string;
  efficiency: string;
  mass_so3_absorbed_lbhr: string;
  mass_h2so4_formed_lbhr: string;
}

export default function DryingTower() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);

  const [inputParams, setInputParams] = useState<InputParams>({
    x_H2SO4_AD0: "0.95",
    x_H2O_AD0: "0.05",
    Temp_AD0: "275",
    Pressure_AD0: "0",
    Flow_AD0: "1000",
    dP_BME: "5.0",
    Packing_Depth_ft: "8.0"
  });

  const [outputParams, setOutputParams] = useState<OutputParams>({
    x_H2SO4_AD1: "---",
    x_H2O_AD1: "---",
    m_Total_AD0: "---",
    m_Total_AD1: "---",
    Temp_AD1: "---",
    Pressure_AD1: "---",
    Flow_AD1: "---",
    SO2_GD0: "---",
    SO3_GD0: "---",
    O2_GD0: "---",
    N2_GD0: "---",
    H2O_GD0: "---",
    TOTAL_GD0: "---",
    SO3_GD1: "---",
    TOTAL_GD1: "---",
    PRESSURE_GD1: "---",
    efficiency: "---",
    mass_so3_absorbed_lbhr: "---",
    mass_h2so4_formed_lbhr: "---"
  });

  const handleInputChange = (field: keyof InputParams, value: string) => {
    setInputParams(prev => ({ ...prev, [field]: value }));
  };

  const formatValue = (value: number | string | null | undefined, decimals: number = 1): string => {
    if (value === null || value === undefined || value === "---") return "---";
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numVal)) return "---";
    if (Math.abs(numVal) >= 10000) return numVal.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return numVal.toFixed(decimals);
  };

  const runSimulation = async () => {
    setIsRunningSimulation(true);
    try {
      const response = await apiRequest('POST', '/api/drying-tower-calc', {
        x_H2SO4_AD0: parseFloat(inputParams.x_H2SO4_AD0),
        x_H2O_AD0: parseFloat(inputParams.x_H2O_AD0),
        Temp_AD0: parseFloat(inputParams.Temp_AD0),
        Pressure_AD0: parseFloat(inputParams.Pressure_AD0),
        Flow_AD0: parseFloat(inputParams.Flow_AD0),
        dP_BME: parseFloat(inputParams.dP_BME),
        Packing_Depth_ft: parseFloat(inputParams.Packing_Depth_ft)
      });
      
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Simulation Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      setOutputParams({
        x_H2SO4_AD1: formatValue(data.x_H2SO4_AD1, 3),
        x_H2O_AD1: formatValue(data.x_H2O_AD1, 4),
        m_Total_AD0: formatValue(data.m_Total_AD0, 1),
        m_Total_AD1: formatValue(data.m_Total_AD1, 1),
        Temp_AD1: formatValue(data.Temp_AD1, 0),
        Pressure_AD1: formatValue(data.Pressure_AD1, 2),
        Flow_AD1: formatValue(data.Flow_AD1, 1),
        SO2_GD0: formatValue(data.SO2_GD0, 0),
        SO3_GD0: formatValue(data.SO3_GD0, 0),
        O2_GD0: formatValue(data.O2_GD0, 0),
        N2_GD0: formatValue(data.N2_GD0, 0),
        H2O_GD0: formatValue(data.H2O_GD0, 0),
        TOTAL_GD0: formatValue(data.TOTAL_GD0, 0),
        SO3_GD1: formatValue(data.SO3_GD1, 0),
        TOTAL_GD1: formatValue(data.TOTAL_GD1, 0),
        PRESSURE_GD1: formatValue(data.PRESSURE_GD1, 1),
        efficiency: formatValue(data.efficiency, 1),
        mass_so3_absorbed_lbhr: formatValue(data.mass_so3_absorbed_lbhr, 1),
        mass_h2so4_formed_lbhr: formatValue(data.mass_h2so4_formed_lbhr, 1)
      });

      toast({
        title: "Simulation Complete",
        description: `Efficiency: ${formatValue(data.efficiency, 1)}%`
      });
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        title: "Simulation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunningSimulation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/unit-operation-simulator")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/unit-operation/drying-tower/python-code" data-testid="link-python-code">
              <Button variant="outline" size="sm">
                <Code className="h-4 w-4 mr-2" />
                View Python Code
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Droplets className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground" data-testid="text-page-title">Drying Tower (DT)</h1>
              <p className="text-muted-foreground mt-1" data-testid="text-page-description">
                Remove moisture from process gas streams before sulfur combustion
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The Drying Tower is a critical unit operation that removes water vapor from ambient air 
                  before it enters the sulfur furnace. Proper drying prevents corrosion, ensures consistent 
                  SO₂ production, and protects downstream catalyst beds from moisture damage.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Key Functions</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Remove water vapor from inlet air</li>
                      <li>Maintain acid concentration (93-98% H₂SO₄)</li>
                      <li>Protect catalyst from moisture damage</li>
                      <li>Ensure consistent combustion conditions</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Operating Parameters</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Inlet air temperature: 25-40°C</li>
                      <li>Outlet dew point: {"<"} -40°C</li>
                      <li>Acid circulation rate: 500-2000 gpm</li>
                      <li>Tower pressure drop: 2-6 in WC</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Simulation Controls
                </CardTitle>
                <CardDescription>
                  Configure drying tower parameters and run mass balance simulation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Acid Inlet Parameters</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">H₂SO₄ Fraction</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={inputParams.x_H2SO4_AD0}
                            onChange={(e) => handleInputChange('x_H2SO4_AD0', e.target.value)}
                            data-testid="input-h2so4-fraction"
                          />
                          <span className="text-xs text-muted-foreground">mass fraction</span>
                        </div>
                        <div>
                          <label className="text-sm font-medium">H₂O Fraction</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={inputParams.x_H2O_AD0}
                            onChange={(e) => handleInputChange('x_H2O_AD0', e.target.value)}
                            data-testid="input-h2o-fraction"
                          />
                          <span className="text-xs text-muted-foreground">mass fraction</span>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Temperature</label>
                          <Input
                            type="number"
                            step="1"
                            value={inputParams.Temp_AD0}
                            onChange={(e) => handleInputChange('Temp_AD0', e.target.value)}
                            data-testid="input-temp"
                          />
                          <span className="text-xs text-muted-foreground">°F</span>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Flow Rate</label>
                          <Input
                            type="number"
                            step="10"
                            value={inputParams.Flow_AD0}
                            onChange={(e) => handleInputChange('Flow_AD0', e.target.value)}
                            data-testid="input-flow"
                          />
                          <span className="text-xs text-muted-foreground">gpm</span>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Inlet Pressure</label>
                          <Input
                            type="number"
                            step="0.5"
                            value={inputParams.Pressure_AD0}
                            onChange={(e) => handleInputChange('Pressure_AD0', e.target.value)}
                            data-testid="input-pressure"
                          />
                          <span className="text-xs text-muted-foreground">psig</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">System Parameters</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Pressure Drop</label>
                          <Input
                            type="number"
                            step="0.5"
                            value={inputParams.dP_BME}
                            onChange={(e) => handleInputChange('dP_BME', e.target.value)}
                            data-testid="input-dp"
                          />
                          <span className="text-xs text-muted-foreground">in WC</span>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Packing Depth</label>
                          <Input
                            type="number"
                            step="0.5"
                            value={inputParams.Packing_Depth_ft}
                            onChange={(e) => handleInputChange('Packing_Depth_ft', e.target.value)}
                            data-testid="input-packing-depth"
                          />
                          <span className="text-xs text-muted-foreground">ft</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={runSimulation} 
                      disabled={isRunningSimulation}
                      className="w-full"
                      data-testid="button-run-simulation"
                    >
                      {isRunningSimulation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Running Simulation...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run Simulation
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Acid Outlet Results</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">H₂SO₄ Outlet</span>
                          <p className="text-lg font-mono" data-testid="output-h2so4-out">{outputParams.x_H2SO4_AD1}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">H₂O Outlet</span>
                          <p className="text-lg font-mono" data-testid="output-h2o-out">{outputParams.x_H2O_AD1}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">Mass In (klb/hr)</span>
                          <p className="text-lg font-mono" data-testid="output-mass-in">{outputParams.m_Total_AD0}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">Mass Out (klb/hr)</span>
                          <p className="text-lg font-mono" data-testid="output-mass-out">{outputParams.m_Total_AD1}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">Outlet Flow (gpm)</span>
                          <p className="text-lg font-mono" data-testid="output-flow-out">{outputParams.Flow_AD1}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">Pressure Out (psig)</span>
                          <p className="text-lg font-mono" data-testid="output-pressure-out">{outputParams.Pressure_AD1}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Gas Stream Results</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">SO₃ In (scfm)</span>
                          <p className="text-lg font-mono" data-testid="output-so3-in">{outputParams.SO3_GD0}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">SO₃ Out (scfm)</span>
                          <p className="text-lg font-mono" data-testid="output-so3-out">{outputParams.SO3_GD1}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">ΔP Gas (in WC)</span>
                          <p className="text-lg font-mono" data-testid="output-dp-gas">{outputParams.PRESSURE_GD1}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">Total In (scfm)</span>
                          <p className="text-lg font-mono" data-testid="output-total-in">{outputParams.TOTAL_GD0}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">Total Out (scfm)</span>
                          <p className="text-lg font-mono" data-testid="output-total-out">{outputParams.TOTAL_GD1}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <span className="text-xs text-muted-foreground">Efficiency (%)</span>
                          <p className="text-lg font-mono" data-testid="output-efficiency">{outputParams.efficiency}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Mass Balance</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <span className="text-xs text-muted-foreground">SO₃ Absorbed (lb/hr)</span>
                          <p className="text-lg font-mono text-green-600 dark:text-green-400" data-testid="output-so3-absorbed">{outputParams.mass_so3_absorbed_lbhr}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <span className="text-xs text-muted-foreground">H₂SO₄ Formed (lb/hr)</span>
                          <p className="text-lg font-mono text-blue-600 dark:text-blue-400" data-testid="output-h2so4-formed">{outputParams.mass_h2so4_formed_lbhr}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
