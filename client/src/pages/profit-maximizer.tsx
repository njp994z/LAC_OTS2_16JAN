import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type DistributionType = "Normal" | "Left-Skew" | "Right-Skew";
type PriceTypeOption = "Variable" | "Fixed";

interface ProcessInputRange {
  min: string;
  max: string;
}

interface PriceCommodity {
  name: string;
  unit: string;
  rangeMin: string;
  rangeMax: string;
  distribution: DistributionType;
}

interface MonteCarloResults {
  numberOfSamples: number;
  profit: {
    mean: number;
    stdDev: number;
    conf5: number;
    conf95: number;
    distribution: Array<{ x: number; y: number }>;
  };
  acidProduction: {
    mean: number;
    stdDev: number;
    conf5: number;
    conf95: number;
  };
  powerGeneration: {
    mean: number;
    stdDev: number;
    conf5: number;
    conf95: number;
  };
}

export default function ProfitMaximizer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Process Input Ranges (stored as strings to prevent NaN issues)
  const [sulfurFlow, setSulfurFlow] = useState<ProcessInputRange>({ min: "70", max: "105" });
  const [blowerRPM, setBlowerRPM] = useState<ProcessInputRange>({ min: "3500", max: "6000" });
  const [pass1Temp, setPass1Temp] = useState<ProcessInputRange>({ min: "700", max: "820" });
  const [pass2Temp, setPass2Temp] = useState<ProcessInputRange>({ min: "750", max: "860" });
  const [pass3Temp, setPass3Temp] = useState<ProcessInputRange>({ min: "750", max: "860" });
  const [pass4Temp, setPass4Temp] = useState<ProcessInputRange>({ min: "700", max: "820" });

  // Configuration
  const [numberOfSamples, setNumberOfSamples] = useState<string>("10000");
  const [priceType, setPriceType] = useState<PriceTypeOption>("Variable");
  const [productionType, setProductionType] = useState<PriceTypeOption>("Variable");

  // Price Commodities (for Variable pricing)
  const [commodities, setCommodities] = useState<PriceCommodity[]>([
    { name: "Sulfuric", unit: "STon", rangeMin: "100", rangeMax: "150", distribution: "Normal" },
    { name: "Sulfur", unit: "STon", rangeMin: "50", rangeMax: "100", distribution: "Left-Skew" },
    { name: "Power", unit: "MWh", rangeMin: "30", rangeMax: "60", distribution: "Right-Skew" },
    { name: "Caustic Usage", unit: "STon", rangeMin: "200", rangeMax: "300", distribution: "Normal" },
    { name: "LP Steam", unit: "STon", rangeMin: "10", rangeMax: "20", distribution: "Normal" },
    { name: "Make-Up Water", unit: "kgal", rangeMin: "5", rangeMax: "15", distribution: "Normal" },
  ]);

  // Results state
  const [results, setResults] = useState<MonteCarloResults | null>(null);

  const updateCommodity = (index: number, field: keyof PriceCommodity, value: any) => {
    const updated = [...commodities];
    updated[index] = { ...updated[index], [field]: value };
    setCommodities(updated);
  };

  // Monte Carlo Mutation
  const monteCarloMutation = useMutation({
    mutationFn: async (): Promise<MonteCarloResults> => {
      // Prepare payload with all inputs
      const payload = {
        sulfurFlow,
        blowerRPM,
        pass1Temp,
        pass2Temp,
        pass3Temp,
        pass4Temp,
        numberOfSamples,
        priceType,
        productionType,
        commodities,
      };

      const response = await apiRequest("POST", "/api/monte-carlo", payload);
      return await response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Simulation Complete",
        description: `Successfully ran ${data.numberOfSamples.toLocaleString()} Monte Carlo iterations.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Simulation Failed",
        description: error.message || "Failed to run Monte Carlo simulation",
        variant: "destructive",
      });
    },
  });

  const handleRunSimulation = () => {
    monteCarloMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/demo")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Profit Maximizer & Operations Optimizer (Monte Carlo)</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Harness Monte Carlo simulations to run thousands of scenarios, pinpointing the exact parameters that unlock peak profitability. Delivers data-driven, meta-optimal operating setpoints.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Process Inputs Ranges */}
            <Card>
              <CardHeader>
                <CardTitle>Process Controller Ranges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Column Headers */}
                <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 pb-2 border-b">
                  <div className="col-span-3 text-sm font-semibold">Process Input Ranges</div>
                  <div className="text-sm font-semibold text-center">Outputs (95% Confidence Interval)</div>
                </div>

                {/* Sulfur Flow */}
                <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 items-center">
                  <div>
                    <Label className="text-xs">Sulfur Flow, gpm:</Label>
                    <Input
                      type="number"
                      value={sulfurFlow.min}
                      onChange={(e) => setSulfurFlow({ ...sulfurFlow, min: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-sulfur-flow-min"
                    />
                  </div>
                  <div className="text-sm pt-5">to</div>
                  <div>
                    <Label className="text-xs">&nbsp;</Label>
                    <Input
                      type="number"
                      value={sulfurFlow.max}
                      onChange={(e) => setSulfurFlow({ ...sulfurFlow, max: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-sulfur-flow-max"
                    />
                  </div>
                  <div className="text-sm text-foreground pt-5 text-center">XXX</div>
                </div>

                {/* Blower RPM */}
                <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 items-center">
                  <div>
                    <Label className="text-xs">Blower RPM:</Label>
                    <Input
                      type="number"
                      value={blowerRPM.min}
                      onChange={(e) => setBlowerRPM({ ...blowerRPM, min: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-blower-rpm-min"
                    />
                  </div>
                  <div className="text-sm pt-5">to</div>
                  <div>
                    <Label className="text-xs">&nbsp;</Label>
                    <Input
                      type="number"
                      value={blowerRPM.max}
                      onChange={(e) => setBlowerRPM({ ...blowerRPM, max: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-blower-rpm-max"
                    />
                  </div>
                  <div className="text-sm text-foreground pt-5 text-center">XXX</div>
                </div>

                {/* Pass 1 Inlet Temp */}
                <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 items-center">
                  <div>
                    <Label className="text-xs">Pass 1 Inlet Temp. F:</Label>
                    <Input
                      type="number"
                      value={pass1Temp.min}
                      onChange={(e) => setPass1Temp({ ...pass1Temp, min: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-pass1-temp-min"
                    />
                  </div>
                  <div className="text-sm pt-5">to</div>
                  <div>
                    <Label className="text-xs">&nbsp;</Label>
                    <Input
                      type="number"
                      value={pass1Temp.max}
                      onChange={(e) => setPass1Temp({ ...pass1Temp, max: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-pass1-temp-max"
                    />
                  </div>
                  <div className="text-sm text-foreground pt-5 text-center">XXX</div>
                </div>

                {/* Pass 2 Inlet Temp */}
                <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 items-center">
                  <div>
                    <Label className="text-xs">Pass 2 Inlet Temp. F:</Label>
                    <Input
                      type="number"
                      value={pass2Temp.min}
                      onChange={(e) => setPass2Temp({ ...pass2Temp, min: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-pass2-temp-min"
                    />
                  </div>
                  <div className="text-sm pt-5">to</div>
                  <div>
                    <Label className="text-xs">&nbsp;</Label>
                    <Input
                      type="number"
                      value={pass2Temp.max}
                      onChange={(e) => setPass2Temp({ ...pass2Temp, max: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-pass2-temp-max"
                    />
                  </div>
                  <div className="text-sm text-foreground pt-5 text-center">XXX</div>
                </div>

                {/* Pass 3 Inlet Temp */}
                <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 items-center">
                  <div>
                    <Label className="text-xs">Pass 3 Inlet Temp. F:</Label>
                    <Input
                      type="number"
                      value={pass3Temp.min}
                      onChange={(e) => setPass3Temp({ ...pass3Temp, min: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-pass3-temp-min"
                    />
                  </div>
                  <div className="text-sm pt-5">to</div>
                  <div>
                    <Label className="text-xs">&nbsp;</Label>
                    <Input
                      type="number"
                      value={pass3Temp.max}
                      onChange={(e) => setPass3Temp({ ...pass3Temp, max: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-pass3-temp-max"
                    />
                  </div>
                  <div className="text-sm text-foreground pt-5 text-center">XXX</div>
                </div>

                {/* Pass 4 Inlet Temp */}
                <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 items-center">
                  <div>
                    <Label className="text-xs">Pass 4 Inlet Temp. F:</Label>
                    <Input
                      type="number"
                      value={pass4Temp.min}
                      onChange={(e) => setPass4Temp({ ...pass4Temp, min: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-pass4-temp-min"
                    />
                  </div>
                  <div className="text-sm pt-5">to</div>
                  <div>
                    <Label className="text-xs">&nbsp;</Label>
                    <Input
                      type="number"
                      value={pass4Temp.max}
                      onChange={(e) => setPass4Temp({ ...pass4Temp, max: e.target.value })}
                      className="text-primary font-semibold"
                      data-testid="input-pass4-temp-max"
                    />
                  </div>
                  <div className="text-sm text-foreground pt-5 text-center">XXX</div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-sm">Number of Random Samples:</Label>
                  <Input
                    type="number"
                    value={numberOfSamples}
                    onChange={(e) => setNumberOfSamples(e.target.value)}
                    className="text-primary font-semibold"
                    data-testid="input-random-samples"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Price Type:</Label>
                    <Select value={priceType} onValueChange={(v) => setPriceType(v as PriceTypeOption)}>
                      <SelectTrigger data-testid="select-price-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Variable">Variable</SelectItem>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Production Type:</Label>
                    <Select value={productionType} onValueChange={(v) => setProductionType(v as PriceTypeOption)}>
                      <SelectTrigger data-testid="select-production-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Variable">Variable</SelectItem>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Process Revenues */}
            <Card>
              <CardHeader>
                <CardTitle>Process Revenues (95% Conf. Interval)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm font-semibold border-b pb-2">
                    <div></div>
                    <div className="text-center">Production</div>
                    <div className="text-center">95% Conf. Interval</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>Acid Production:</div>
                    <div className="text-center" data-testid="text-acid-prod-volume">
                      {results ? `${results.acidProduction.mean.toFixed(1)} STPD` : 'X,XXX STPD'}
                    </div>
                    <div className="text-center text-muted-foreground" data-testid="text-acid-prod-conf-interval">
                      {results ? `${results.acidProduction.conf5.toFixed(1)} - ${results.acidProduction.conf95.toFixed(1)} STPD` : 'XXX - XXX STPD'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>Gross Power Gen.:</div>
                    <div className="text-center" data-testid="text-power-gen-volume">
                      {results ? `${results.powerGeneration.mean.toFixed(2)} MWh/Day` : 'X,XX MWh/Day'}
                    </div>
                    <div className="text-center text-muted-foreground" data-testid="text-power-gen-conf-interval">
                      {results ? `${results.powerGeneration.conf5.toFixed(2)} - ${results.powerGeneration.conf95.toFixed(2)} MWh/Day` : 'XX - XX MWh/Day'}
                    </div>
                  </div>
                  {results && (
                    <div className="text-xs text-muted-foreground italic pt-2">
                      Note: Revenue values require commodity pricing data. Run simulation to see production statistics.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Process Consumption / Costs */}
            <Card>
              <CardHeader>
                <CardTitle>Process Consumption / Costs (95% Conf. Interval)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground text-center py-8">
                    {results 
                      ? "Detailed cost breakdown requires additional modeling (coming soon)"
                      : "Run simulation to see results"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Run Simulation Button */}
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleRunSimulation}
              disabled={monteCarloMutation.isPending}
              data-testid="button-run-simulation"
            >
              {monteCarloMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {monteCarloMutation.isPending ? "Running Simulation..." : "Run Monte Carlo Simulation"}
            </Button>

            {/* Process Profit Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Process Profit Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chart */}
                  {results ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.profit.distribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="x" 
                            label={{ value: 'Profit ($/Day)', position: 'insideBottom', offset: -5 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
                          />
                          <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                          <Tooltip 
                            formatter={(value: any) => [`${value} samples`, 'Frequency']}
                            labelFormatter={(label) => `Profit: $${(label / 1000).toFixed(2)}K/Day`}
                          />
                          <Legend />
                          <Bar 
                            dataKey="y" 
                            fill="hsl(var(--primary))" 
                            name="Profit Distribution"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 border-2 border-dashed border-muted-foreground/25 rounded-md flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Run simulation to generate distribution chart</p>
                    </div>
                  )}
                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">5% Conf. Interval</p>
                      <p className="text-muted-foreground" data-testid="text-profit-5-conf">
                        {results ? `$${(results.profit.conf5 / 1000).toFixed(1)}K/Day` : '$XXK/Day'}
                      </p>
                      <p className="text-muted-foreground" data-testid="text-profit-5-conf-year">
                        {results ? `$${(results.profit.conf5 * 365 / 1000000).toFixed(2)}MM/Yr` : '$XXMM/Yr'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">95% Conf. Interval</p>
                      <p className="text-muted-foreground" data-testid="text-profit-95-conf">
                        {results ? `$${(results.profit.conf95 / 1000).toFixed(1)}K/Day` : '$XXK/Day'}
                      </p>
                      <p className="text-muted-foreground" data-testid="text-profit-95-conf-year">
                        {results ? `$${(results.profit.conf95 * 365 / 1000000).toFixed(2)}MM/Yr` : '$XXMM/Yr'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Profits Mean:</p>
                      <p className="text-muted-foreground" data-testid="text-profit-mean">
                        {results ? `$${(results.profit.mean / 1000).toFixed(1)}K/Day` : '$XXK/Day'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Std-dev:</p>
                      <p className="text-muted-foreground" data-testid="text-profit-std-dev">
                        {results ? `$${(results.profit.stdDev / 1000).toFixed(1)}K/Day` : '$XXK/Day'}
                      </p>
                      <p className="text-muted-foreground" data-testid="text-profit-std-dev-year">
                        {results ? `$${(results.profit.stdDev * 365 / 1000000).toFixed(2)}MM/Yr` : '$XXMM/Yr'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Type: Variable */}
            <Card>
              <CardHeader>
                <CardTitle>Price Type: Variable - Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Headers */}
                  <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1.5fr] gap-2 text-xs font-semibold border-b pb-2">
                    <div></div>
                    <div className="text-center">Range</div>
                    <div className="text-center">Mean</div>
                    <div className="text-center">Std Dev</div>
                    <div className="text-center">Distribution</div>
                  </div>

                  {/* Commodities */}
                  {commodities.map((commodity, index) => (
                    <div key={commodity.name} className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1.5fr] gap-2 items-center">
                      <div className="text-sm font-medium">{commodity.name}:</div>
                      
                      {/* Range Inputs */}
                      <div className="flex items-center gap-1">
                        <div className="text-xs text-muted-foreground">$</div>
                        <Input
                          type="number"
                          value={commodity.rangeMin}
                          onChange={(e) => updateCommodity(index, "rangeMin", e.target.value)}
                          className="text-primary font-semibold h-8"
                          data-testid={`input-${commodity.name.toLowerCase().replace(/\s/g, '-')}-range-min`}
                        />
                        <span className="text-xs">-</span>
                        <Input
                          type="number"
                          value={commodity.rangeMax}
                          onChange={(e) => updateCommodity(index, "rangeMax", e.target.value)}
                          className="text-primary font-semibold h-8"
                          data-testid={`input-${commodity.name.toLowerCase().replace(/\s/g, '-')}-range-max`}
                        />
                        <div className="text-xs text-muted-foreground">/ {commodity.unit}</div>
                      </div>

                      {/* Mean (Backend) */}
                      <div className="text-center text-sm text-muted-foreground" data-testid={`text-${commodity.name.toLowerCase().replace(/\s/g, '-')}-mean`}>
                        $XXX / {commodity.unit}
                      </div>

                      {/* Std Dev (Backend) */}
                      <div className="text-center text-sm text-muted-foreground" data-testid={`text-${commodity.name.toLowerCase().replace(/\s/g, '-')}-std-dev`}>
                        $XXX / {commodity.unit}
                      </div>

                      {/* Distribution Dropdown */}
                      <Select
                        value={commodity.distribution}
                        onValueChange={(v) => updateCommodity(index, "distribution", v as DistributionType)}
                      >
                        <SelectTrigger className="h-8 text-primary" data-testid={`select-${commodity.name.toLowerCase().replace(/\s/g, '-')}-distribution`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Left-Skew">Left-Skew</SelectItem>
                          <SelectItem value="Right-Skew">Right-Skew</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
