import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, DollarSign, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DistributionType = "Normal" | "Left-Skew" | "Right-Skew";

interface CommodityData {
  id: string;
  name: string;
  unit: string;
  rangeMin: string;
  rangeMax: string;
  mean: string;
  stdDev: string;
  initialValue: string;
  distribution: DistributionType;
}

const initialCommodities: CommodityData[] = [
  { id: "sulfuric", name: "Sulfuric", unit: "STon", rangeMin: "50", rangeMax: "150", mean: "90", stdDev: "10", initialValue: "90", distribution: "Normal" },
  { id: "sulfur", name: "Sulfur", unit: "STon", rangeMin: "80", rangeMax: "200", mean: "100", stdDev: "15", initialValue: "100", distribution: "Left-Skew" },
  { id: "power", name: "Power", unit: "MWh", rangeMin: "20", rangeMax: "50", mean: "30", stdDev: "5", initialValue: "30", distribution: "Right-Skew" },
  { id: "caustic", name: "Caustic Usage", unit: "STon", rangeMin: "300", rangeMax: "800", mean: "600", stdDev: "80", initialValue: "600", distribution: "Normal" },
  { id: "lpsteam", name: "LP Steam", unit: "STon", rangeMin: "15", rangeMax: "30", mean: "22", stdDev: "5", initialValue: "22", distribution: "Normal" },
  { id: "water", name: "Make-Up Water", unit: "Kgal", rangeMin: "2", rangeMax: "5", mean: "3", stdDev: "0.5", initialValue: "3", distribution: "Normal" },
];

const percentiles = [2.5, 5, 10, 20, 33, 50, 66, 80, 90, 95, 97.5];

function NormalCurveSVG() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" className="flex-shrink-0">
      <path
        d="M2 22 Q10 22 15 18 Q20 8 20 4 Q20 8 25 18 Q30 22 38 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-orange-500"
      />
    </svg>
  );
}

function LeftSkewCurveSVG() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" className="flex-shrink-0">
      <path
        d="M2 22 Q6 22 10 16 Q14 8 16 4 Q18 8 24 14 Q32 20 38 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-blue-500"
      />
    </svg>
  );
}

function RightSkewCurveSVG() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" className="flex-shrink-0">
      <path
        d="M2 22 Q8 20 16 14 Q22 8 24 4 Q26 8 30 16 Q34 22 38 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-blue-500"
      />
    </svg>
  );
}

function getDistributionCurve(distribution: DistributionType) {
  switch (distribution) {
    case "Left-Skew":
      return <LeftSkewCurveSVG />;
    case "Right-Skew":
      return <RightSkewCurveSVG />;
    default:
      return <NormalCurveSVG />;
  }
}

function calculatePercentile(mean: number, stdDev: number, percentile: number, distribution: DistributionType): number {
  const zScores: Record<number, number> = {
    2.5: -1.96,
    5: -1.645,
    10: -1.28,
    20: -0.84,
    33: -0.44,
    50: 0,
    66: 0.44,
    80: 0.84,
    90: 1.28,
    95: 1.645,
    97.5: 1.96,
  };

  const z = zScores[percentile] || 0;
  let value = mean + z * stdDev;

  if (distribution === "Left-Skew") {
    value = mean + z * stdDev * (percentile < 50 ? 1.3 : 0.7);
  } else if (distribution === "Right-Skew") {
    value = mean + z * stdDev * (percentile < 50 ? 0.7 : 1.3);
  }

  return Math.max(0, value);
}

export default function EconomicsCosts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [commodities, setCommodities] = useState<CommodityData[]>(initialCommodities);

  const updateCommodity = (id: string, field: keyof CommodityData, value: string) => {
    setCommodities(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = () => {
    toast({
      title: "Changes Saved",
      description: "Price and cost input data has been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/simulation-settings")}
              data-testid="button-back-settings"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <Button onClick={handleSave} data-testid="button-save-changes">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Price and Cost Input Data</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              Configure commodity prices and cost parameters for economic analysis. Set price ranges, statistical
              distributions, and initial values for Monte Carlo simulations and profit optimization calculations.
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Price Type: Variable</span>
                  <span className="mx-4">|</span>
                  <span>Prices for Products, Feedstocks, and Utilities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground sticky left-0 bg-card min-w-[160px]">Commodity</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[140px]">Range</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[100px]">Mean</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[100px]">Std Dev</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[120px]">Initial Value<br/><span className="text-xs">in Simulation</span></th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[120px]">Distribution</th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[60px]">Distribution<br/>Curve</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commodities.map((commodity) => (
                        <tr key={commodity.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-2 sticky left-0 bg-card font-medium">
                            {commodity.name} / {commodity.unit}:
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                type="text"
                                value={commodity.rangeMin}
                                onChange={(e) => updateCommodity(commodity.id, "rangeMin", e.target.value)}
                                className="w-16 h-8 text-center text-sm text-blue-500"
                                data-testid={`input-range-min-${commodity.id}`}
                              />
                              <span className="text-muted-foreground">-</span>
                              <Input
                                type="text"
                                value={commodity.rangeMax}
                                onChange={(e) => updateCommodity(commodity.id, "rangeMax", e.target.value)}
                                className="w-16 h-8 text-center text-sm text-blue-500"
                                data-testid={`input-range-max-${commodity.id}`}
                              />
                              <span className="text-muted-foreground text-xs">/ {commodity.unit}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                type="text"
                                value={commodity.mean}
                                onChange={(e) => updateCommodity(commodity.id, "mean", e.target.value)}
                                className="w-16 h-8 text-center text-sm text-blue-500"
                                data-testid={`input-mean-${commodity.id}`}
                              />
                              <span className="text-muted-foreground text-xs">/ {commodity.unit}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                type="text"
                                value={commodity.stdDev}
                                onChange={(e) => updateCommodity(commodity.id, "stdDev", e.target.value)}
                                className="w-16 h-8 text-center text-sm text-blue-500"
                                data-testid={`input-stddev-${commodity.id}`}
                              />
                              <span className="text-muted-foreground text-xs">/ {commodity.unit}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                type="text"
                                value={commodity.initialValue}
                                onChange={(e) => updateCommodity(commodity.id, "initialValue", e.target.value)}
                                className="w-16 h-8 text-center text-sm text-blue-500"
                                data-testid={`input-initial-${commodity.id}`}
                              />
                              <span className="text-muted-foreground text-xs">/ {commodity.unit}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex justify-center">
                              <Select
                                value={commodity.distribution}
                                onValueChange={(value) => updateCommodity(commodity.id, "distribution", value)}
                              >
                                <SelectTrigger className="w-[110px] h-8 text-sm" data-testid={`select-distribution-${commodity.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Normal">Normal</SelectItem>
                                  <SelectItem value="Left-Skew">Left-Skew</SelectItem>
                                  <SelectItem value="Right-Skew">Right-Skew</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex justify-center">
                              {getDistributionCurve(commodity.distribution)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Percentiles Based on Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground sticky left-0 bg-card min-w-[160px]">Commodity</th>
                        {percentiles.map((p) => (
                          <th key={p} className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[70px]">
                            <span className="text-blue-500 underline">{p}%</span>
                          </th>
                        ))}
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[60px]">Curve</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commodities.map((commodity) => {
                        const mean = parseFloat(commodity.mean) || 0;
                        const stdDev = parseFloat(commodity.stdDev) || 0;

                        return (
                          <tr key={commodity.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3 px-2 sticky left-0 bg-card font-medium">
                              {commodity.name} / {commodity.unit}:
                            </td>
                            {percentiles.map((p) => {
                              const value = calculatePercentile(mean, stdDev, p, commodity.distribution);
                              return (
                                <td key={p} className="py-3 px-2 text-center">
                                  <span className="text-white">${value.toFixed(0)}</span>
                                </td>
                              );
                            })}
                            <td className="py-3 px-2">
                              <div className="flex justify-center">
                                {getDistributionCurve(commodity.distribution)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
