import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, RotateCcw, Settings } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface SimulationResults {
  [key: string]: number;
}

const systemParameters = [
  { label: "Jug Valve Diameter (Inches)", value: "36.0", editable: false },
  { label: "Furnace Outlet Diameter (ft)", value: "9.0", editable: false },
  { label: "WHB HT Area (ft²)", value: "9800", editable: false },
  { label: "Barometric P (psia)", value: "14.3", editable: false },
  { label: "Weather ZIP Code", value: "89801", editable: true, key: "zipCode" },
  { label: "WHB Outlet Duct Dia. (ft)", value: "7.5", editable: false },
  { label: "Jug Valve Cv_max", value: "12500", editable: false },
  { label: "WHB Uo (ft²·°F·hr / BTU)", value: "16.0", editable: false },
  { label: "WHB Steam Pressure (psig)", value: "915.0", editable: false },
];

const streams = [
  { id: "GF1", header: "Stream #5\nFurnace Outlet\n1540-TI-42220ABC\nGF1" },
  { id: "GB0", header: "Stream #6\nWaste Heat\nBoiler In\nGB0" },
  { id: "GJV0", header: "Stream #7\nJug Valve Inlet\nGJV0" },
  { id: "GB1", header: "Stream #8A\nWaste Heat\nBoiler Out\nGB1" },
  { id: "GPV1", header: "Stream #8B\nPositioner\nOutlet\nGPV1" },
  { id: "GP10", header: "Stream #9\nGas Pass\n1 Inlet\nGP10" },
];

const rowItems = [
  { param: "SO2", unit: "scfm" },
  { param: "SO3", unit: "scfm" },
  { param: "O2", unit: "scfm" },
  { param: "N2", unit: "scfm" },
  { param: "H2O", unit: "scfm" },
  { param: "H2SO4", unit: "scfm" },
  { param: "TOTAL", unit: "scfm" },
  { param: "PRESSURE", unit: "in. wc." },
  { param: "TEMPERATURE", unit: "F" },
];

export default function JugValveWHB() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<SimulationResults | null>(null);

  const [inputs, setInputs] = useState({
    jugValveOpening: "10",
    positionerOpening: "100",
    zipCode: "89801",
  });

  const handleInputChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const runCalculation = async () => {
    const jugOpen = parseFloat(inputs.jugValveOpening);
    const posOpen = parseFloat(inputs.positionerOpening);

    if (isNaN(jugOpen) || isNaN(posOpen)) {
      toast({
        title: "Input Error",
        description: "Please enter valid numbers for valve percentages.",
        variant: "destructive",
      });
      return;
    }

    if (jugOpen < 0 || jugOpen > 100 || posOpen < 0 || posOpen > 100) {
      toast({
        title: "Input Error",
        description: "Valve percentages must be between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      const response = await fetch("/api/jug-valve-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          furnace_outlet_scfm_dry: 109697,
          furnace_outlet_so2: 12401,
          furnace_outlet_so3: 227,
          furnace_outlet_o2: 10261,
          furnace_outlet_n2: 86808,
          furnace_outlet_temp_f: 2080,
          furnace_outlet_press_inwc: 196,
          jug_open_pct: jugOpen,
          positioner_open_pct: posOpen,
          cv_max: 12500,
          u_value: 16.0,
          whb_area: 9800,
          baro_psia: 14.3,
        }),
      });

      if (!response.ok) {
        throw new Error("Simulation failed");
      }

      const data = await response.json();
      setResults(data);

      toast({
        title: "Calculation Complete",
        description: "Jug valve simulation results updated.",
      });
    } catch (error) {
      toast({
        title: "Calculation Error",
        description: "Failed to run simulation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const resetCalculation = () => {
    setInputs({
      jugValveOpening: "10",
      positionerOpening: "100",
      zipCode: "89801",
    });
    setResults(null);
  };

  const getValue = (param: string, streamId: string): string => {
    if (!results) return "---";
    const key = `${param}_${streamId}`;
    const val = results[key];
    if (val === undefined) return "---";
    if (param === "PRESSURE") return val.toFixed(1);
    return Math.round(val).toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/unit-operation-simulator")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold" data-testid="text-page-title">
                Jug Valve, WHB Hot-side, Positioner
              </h1>
            </div>
            <Link href="/settings/controller-outputs/faceplates/valve-blocks/hand-control/1540-hcv-4282/3e">
              <Button variant="outline" className="gap-2" data-testid="button-configure-3e">
                <Settings className="h-4 w-4" />
                Configure (3E)
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" data-testid="text-system-params-title">
              System Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemParameters.map((param, idx) => (
                <div key={idx} className="flex items-center gap-3" data-testid={`param-row-${idx}`}>
                  <Label 
                    className="text-sm text-muted-foreground min-w-[180px]"
                    data-testid={`label-param-${idx}`}
                  >
                    {param.label}
                  </Label>
                  {param.editable ? (
                    <Input
                      value={inputs[param.key as keyof typeof inputs] || param.value}
                      onChange={(e) =>
                        handleInputChange(param.key!, e.target.value)
                      }
                      className="w-24 h-8 text-sm"
                      data-testid={`input-${param.key}`}
                    />
                  ) : (
                    <div
                      className="w-24 h-8 px-2 flex items-center bg-muted rounded text-sm"
                      data-testid={`value-param-${idx}`}
                    >
                      {param.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" data-testid="text-system-inputs-title">
              System Inputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3" data-testid="input-row-jug-valve">
                <Label 
                  className="text-sm text-muted-foreground"
                  data-testid="label-jug-valve-opening"
                >
                  Jug Valve Opening Percentage
                </Label>
                <Input
                  value={inputs.jugValveOpening}
                  onChange={(e) =>
                    handleInputChange("jugValveOpening", e.target.value)
                  }
                  className="w-20 h-8 text-sm"
                  data-testid="input-jug-valve-opening"
                />
                <span className="text-sm text-muted-foreground" data-testid="unit-jug-valve">%</span>
              </div>
              <div className="flex items-center gap-3" data-testid="input-row-positioner">
                <Label 
                  className="text-sm text-muted-foreground"
                  data-testid="label-positioner-opening"
                >
                  Positioner Valve Opening
                </Label>
                <Input
                  value={inputs.positionerOpening}
                  onChange={(e) =>
                    handleInputChange("positionerOpening", e.target.value)
                  }
                  className="w-20 h-8 text-sm"
                  data-testid="input-positioner-opening"
                />
                <span className="text-sm text-muted-foreground" data-testid="unit-positioner">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base" data-testid="text-outputs-title">
              Simulation Outputs - Static Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-simulation-outputs">
                <thead>
                  <tr className="border-b" data-testid="row-header">
                    <th 
                      className="text-left py-2 px-2 font-semibold"
                      data-testid="header-parameter"
                    >
                      Parameter
                    </th>
                    <th 
                      className="text-left py-2 px-2 font-semibold"
                      data-testid="header-units"
                    >
                      Units
                    </th>
                    {streams.map((stream) => (
                      <th
                        key={stream.id}
                        className="text-center py-2 px-2 font-semibold whitespace-pre-line"
                        data-testid={`header-stream-${stream.id}`}
                      >
                        {stream.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowItems.map((row) => (
                    <tr key={row.param} className="border-b" data-testid={`row-${row.param}`}>
                      <td 
                        className="py-2 px-2 font-medium"
                        data-testid={`label-row-${row.param}`}
                      >
                        {row.param}
                      </td>
                      <td 
                        className="py-2 px-2 text-muted-foreground"
                        data-testid={`unit-row-${row.param}`}
                      >
                        {row.unit}
                      </td>
                      {streams.map((stream) => (
                        <td
                          key={`${row.param}_${stream.id}`}
                          className="py-2 px-2 text-center"
                          data-testid={`cell-${row.param}-${stream.id}`}
                        >
                          <div 
                            className="bg-muted rounded px-2 py-1 min-w-[60px]"
                            data-testid={`output-${row.param}-${stream.id}`}
                          >
                            {getValue(row.param, stream.id)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            onClick={runCalculation}
            disabled={isCalculating}
            className="min-w-[140px]"
            data-testid="button-calculate"
          >
            <Play className="w-4 h-4 mr-2" />
            {isCalculating ? "Calculating..." : "Calculate"}
          </Button>
          <Button
            variant="outline"
            onClick={resetCalculation}
            className="min-w-[140px]"
            data-testid="button-reset"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
