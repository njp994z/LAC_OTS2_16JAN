import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Database, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PythonCodeViewer } from "@/components/PythonCodeViewer";
import type { CatalystParameter } from "@shared/schema";
import expLogo from "@/assets/exp-logo.png";

const catalystPythonCode = `# Catalyst Parameter Database - Python Variables
# Physical properties and reverse-engineered activity parameters for SO2 oxidation catalysts

from typing import Dict, Any
from dataclasses import dataclass

# ============================================================================
# CATALYST DATA STRUCTURE
# ============================================================================

@dataclass
class CatalystProperties:
    """Data class representing catalyst physical and kinetic properties."""
    name: str                    # Catalyst trade name
    cesium_promoted: bool        # Whether catalyst contains cesium promoter
    shape: str                   # Pellet geometry (Daisy, Ribbed Ring, Hexalobe)
    void_fraction: float         # Bed void fraction (epsilon) - dimensionless
    activity_fresh: float        # Fresh catalyst activity coefficient
    ignition_temp_c: float       # Published ignition temperature (Celsius)
    operating_temp_c: float      # Published operating temperature (Celsius)
    diameter_mm: float           # Equivalent pellet diameter (mm)
    sphericity: float            # Shape factor phi - dimensionless (0-1)
    bulk_density_kg_m3: float    # Bulk density rho_b (kg/m³)


# ============================================================================
# CATALYST DATABASE - Dictionary of all catalyst types
# ============================================================================

CATALYST_DATABASE: Dict[str, CatalystProperties] = {
    "Topsoe VK69": CatalystProperties(
        name="Topsoe VK69",
        cesium_promoted=True,
        shape="Daisy",
        void_fraction=0.60,
        activity_fresh=3.51,
        ignition_temp_c=350.0,
        operating_temp_c=400.0,
        diameter_mm=9.0,
        sphericity=0.75,
        bulk_density_kg_m3=800.0
    ),
    "MECS Super Gear XLP-310": CatalystProperties(
        name="MECS Super Gear XLP-310",
        cesium_promoted=True,
        shape="Ribbed Ring",
        void_fraction=0.50,
        activity_fresh=3.35,
        ignition_temp_c=390.0,
        operating_temp_c=400.0,
        diameter_mm=12.5,
        sphericity=0.65,
        bulk_density_kg_m3=815.0
    ),
    "MECS GR330": CatalystProperties(
        name="MECS GR330",
        cesium_promoted=False,
        shape="Hexalobe",
        void_fraction=0.55,
        activity_fresh=1.4,
        ignition_temp_c=360.0,
        operating_temp_c=370.0,
        diameter_mm=11.0,
        sphericity=0.70,
        bulk_density_kg_m3=865.0
    ),
}


# ============================================================================
# HELPER FUNCTIONS FOR CATALYST CALCULATIONS
# ============================================================================

def get_catalyst(name: str) -> CatalystProperties:
    """Retrieve catalyst properties by name."""
    if name not in CATALYST_DATABASE:
        raise ValueError(f"Unknown catalyst: {name}")
    return CATALYST_DATABASE[name]


def calculate_bed_porosity(void_fraction: float) -> float:
    """
    Calculate bed porosity (same as void fraction).
    
    Args:
        void_fraction: Catalyst bed void fraction (epsilon)
    
    Returns:
        Bed porosity as decimal (0-1)
    """
    return void_fraction


def calculate_particle_density(bulk_density: float, void_fraction: float) -> float:
    """
    Calculate particle density from bulk density and void fraction.
    
    Formula: rho_p = rho_b / (1 - epsilon)
    
    Args:
        bulk_density: Bulk density in kg/m³
        void_fraction: Bed void fraction (epsilon)
    
    Returns:
        Particle density in kg/m³
    """
    return bulk_density / (1 - void_fraction)


def calculate_superficial_velocity(
    volumetric_flow_m3_s: float,
    bed_diameter_m: float
) -> float:
    """
    Calculate superficial gas velocity through catalyst bed.
    
    Formula: u_s = Q / A = Q / (pi * D² / 4)
    
    Args:
        volumetric_flow_m3_s: Volumetric flow rate (m³/s)
        bed_diameter_m: Converter bed diameter (m)
    
    Returns:
        Superficial velocity in m/s
    """
    import math
    area = math.pi * (bed_diameter_m ** 2) / 4
    return volumetric_flow_m3_s / area


def calculate_pressure_drop_ergun(
    catalyst: CatalystProperties,
    bed_height_m: float,
    superficial_velocity_m_s: float,
    gas_density_kg_m3: float,
    gas_viscosity_pa_s: float
) -> float:
    """
    Calculate pressure drop across catalyst bed using Ergun equation.
    
    Ergun equation:
    dP/L = 150 * mu * u_s * (1-e)² / (phi² * d_p² * e³)
         + 1.75 * rho * u_s² * (1-e) / (phi * d_p * e³)
    
    Args:
        catalyst: CatalystProperties object
        bed_height_m: Catalyst bed height (m)
        superficial_velocity_m_s: Superficial velocity (m/s)
        gas_density_kg_m3: Gas density (kg/m³)
        gas_viscosity_pa_s: Gas dynamic viscosity (Pa·s)
    
    Returns:
        Pressure drop in Pa
    """
    epsilon = catalyst.void_fraction
    phi = catalyst.sphericity
    d_p = catalyst.diameter_mm / 1000  # Convert mm to m
    
    # Viscous term (laminar)
    term1 = (150 * gas_viscosity_pa_s * superficial_velocity_m_s * 
             (1 - epsilon)**2) / (phi**2 * d_p**2 * epsilon**3)
    
    # Inertial term (turbulent)
    term2 = (1.75 * gas_density_kg_m3 * superficial_velocity_m_s**2 * 
             (1 - epsilon)) / (phi * d_p * epsilon**3)
    
    dP_per_L = term1 + term2
    return dP_per_L * bed_height_m


def adjust_activity_for_age(
    fresh_activity: float,
    years_in_service: float,
    deactivation_rate: float = 0.05
) -> float:
    """
    Adjust catalyst activity based on time in service.
    
    Simple exponential decay model:
    a(t) = a_0 * exp(-k * t)
    
    Args:
        fresh_activity: Fresh catalyst activity coefficient
        years_in_service: Time catalyst has been in operation
        deactivation_rate: Deactivation rate constant (1/year)
    
    Returns:
        Adjusted activity coefficient
    """
    import math
    return fresh_activity * math.exp(-deactivation_rate * years_in_service)


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Get Topsoe VK69 catalyst properties
    vk69 = get_catalyst("Topsoe VK69")
    
    print(f"Catalyst: {vk69.name}")
    print(f"  Cesium Promoted: {vk69.cesium_promoted}")
    print(f"  Shape: {vk69.shape}")
    print(f"  Void Fraction: {vk69.void_fraction}")
    print(f"  Fresh Activity: {vk69.activity_fresh}")
    print(f"  Ignition Temp: {vk69.ignition_temp_c} °C")
    print(f"  Operating Temp: {vk69.operating_temp_c} °C")
    print(f"  Diameter: {vk69.diameter_mm} mm")
    print(f"  Sphericity: {vk69.sphericity}")
    print(f"  Bulk Density: {vk69.bulk_density_kg_m3} kg/m³")
    
    # Calculate particle density
    rho_p = calculate_particle_density(
        vk69.bulk_density_kg_m3, 
        vk69.void_fraction
    )
    print(f"  Particle Density: {rho_p:.1f} kg/m³")
    
    # Estimate activity after 3 years
    aged_activity = adjust_activity_for_age(vk69.activity_fresh, 3.0)
    print(f"  Activity after 3 years: {aged_activity:.2f}")
`;

export default function CatalystParameterDatabase() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/catalyst-parameters", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/catalyst-parameters'] });
      toast({
        title: "Saved Successfully",
        description: "Catalyst parameters have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save catalyst parameters.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validate all numeric fields before saving
    const validateNumeric = (value: string, fieldName: string): number | null => {
      const num = parseFloat(value);
      if (isNaN(num) || value.trim() === "") {
        toast({
          title: "Validation Error",
          description: `${fieldName} must be a valid number`,
          variant: "destructive",
        });
        return null;
      }
      return num;
    };

    // Validate VK69 fields
    const vk69VoidFractionNum = validateNumeric(vk69VoidFraction, "Topsoe VK69 Void Fraction");
    const vk69ActivityNum = validateNumeric(vk69Activity, "Topsoe VK69 Activity");
    const vk69IgnitionTempNum = validateNumeric(vk69IgnitionTemp, "Topsoe VK69 Ignition Temp");
    const vk69OperatingTempNum = validateNumeric(vk69OperatingTemp, "Topsoe VK69 Operating Temp");
    const vk69DiameterNum = validateNumeric(vk69Diameter, "Topsoe VK69 Diameter");
    const vk69SphericityNum = validateNumeric(vk69Sphericity, "Topsoe VK69 Sphericity");
    const vk69BulkDensityNum = validateNumeric(vk69BulkDensity, "Topsoe VK69 Bulk Density");

    // Validate XLP-310 fields
    const xlp310VoidFractionNum = validateNumeric(xlp310VoidFraction, "MECS XLP-310 Void Fraction");
    const xlp310ActivityNum = validateNumeric(xlp310Activity, "MECS XLP-310 Activity");
    const xlp310IgnitionTempNum = validateNumeric(xlp310IgnitionTemp, "MECS XLP-310 Ignition Temp");
    const xlp310OperatingTempNum = validateNumeric(xlp310OperatingTemp, "MECS XLP-310 Operating Temp");
    const xlp310DiameterNum = validateNumeric(xlp310Diameter, "MECS XLP-310 Diameter");
    const xlp310SphericityNum = validateNumeric(xlp310Sphericity, "MECS XLP-310 Sphericity");
    const xlp310BulkDensityNum = validateNumeric(xlp310BulkDensity, "MECS XLP-310 Bulk Density");

    // Validate GR330 fields
    const gr330VoidFractionNum = validateNumeric(gr330VoidFraction, "MECS GR330 Void Fraction");
    const gr330ActivityNum = validateNumeric(gr330Activity, "MECS GR330 Activity");
    const gr330IgnitionTempNum = validateNumeric(gr330IgnitionTemp, "MECS GR330 Ignition Temp");
    const gr330OperatingTempNum = validateNumeric(gr330OperatingTemp, "MECS GR330 Operating Temp");
    const gr330DiameterNum = validateNumeric(gr330Diameter, "MECS GR330 Diameter");
    const gr330SphericityNum = validateNumeric(gr330Sphericity, "MECS GR330 Sphericity");
    const gr330BulkDensityNum = validateNumeric(gr330BulkDensity, "MECS GR330 Bulk Density");

    // Check if any validation failed
    if (
      vk69VoidFractionNum === null || vk69ActivityNum === null || vk69IgnitionTempNum === null ||
      vk69OperatingTempNum === null || vk69DiameterNum === null || vk69SphericityNum === null ||
      vk69BulkDensityNum === null ||
      xlp310VoidFractionNum === null || xlp310ActivityNum === null || xlp310IgnitionTempNum === null ||
      xlp310OperatingTempNum === null || xlp310DiameterNum === null || xlp310SphericityNum === null ||
      xlp310BulkDensityNum === null ||
      gr330VoidFractionNum === null || gr330ActivityNum === null || gr330IgnitionTempNum === null ||
      gr330OperatingTempNum === null || gr330DiameterNum === null || gr330SphericityNum === null ||
      gr330BulkDensityNum === null
    ) {
      return;
    }

    const catalystData = {
      "Topsoe VK69": {
        cesiumPromoted: vk69CesiumPromoted === "Yes",
        shape: vk69Shape,
        voidFraction: vk69VoidFractionNum,
        activityFresh: vk69ActivityNum,
        ignitionTempC: vk69IgnitionTempNum,
        operatingTempC: vk69OperatingTempNum,
        diameterMm: vk69DiameterNum,
        sphericity: vk69SphericityNum,
        bulkDensityKgM3: vk69BulkDensityNum,
      },
      "MECS Super Gear XLP-310": {
        cesiumPromoted: xlp310CesiumPromoted === "Yes",
        shape: xlp310Shape,
        voidFraction: xlp310VoidFractionNum,
        activityFresh: xlp310ActivityNum,
        ignitionTempC: xlp310IgnitionTempNum,
        operatingTempC: xlp310OperatingTempNum,
        diameterMm: xlp310DiameterNum,
        sphericity: xlp310SphericityNum,
        bulkDensityKgM3: xlp310BulkDensityNum,
      },
      "MECS GR330": {
        cesiumPromoted: gr330CesiumPromoted === "Yes",
        shape: gr330Shape,
        voidFraction: gr330VoidFractionNum,
        activityFresh: gr330ActivityNum,
        ignitionTempC: gr330IgnitionTempNum,
        operatingTempC: gr330OperatingTempNum,
        diameterMm: gr330DiameterNum,
        sphericity: gr330SphericityNum,
        bulkDensityKgM3: gr330BulkDensityNum,
      },
    };
    saveMutation.mutate(catalystData);
  };

  // Topsoe VK69
  const [vk69CesiumPromoted, setVk69CesiumPromoted] = useState("Yes");
  const [vk69Shape, setVk69Shape] = useState("Daisy");
  const [vk69VoidFraction, setVk69VoidFraction] = useState("0.60");
  const [vk69Activity, setVk69Activity] = useState("3.51");
  const [vk69IgnitionTemp, setVk69IgnitionTemp] = useState("350");
  const [vk69OperatingTemp, setVk69OperatingTemp] = useState("400");
  const [vk69Diameter, setVk69Diameter] = useState("9.0");
  const [vk69Sphericity, setVk69Sphericity] = useState("0.75");
  const [vk69BulkDensity, setVk69BulkDensity] = useState("800");
  
  // MECS Super Gear XLP-310
  const [xlp310CesiumPromoted, setXlp310CesiumPromoted] = useState("Yes");
  const [xlp310Shape, setXlp310Shape] = useState("Ribbed Ring");
  const [xlp310VoidFraction, setXlp310VoidFraction] = useState("0.50");
  const [xlp310Activity, setXlp310Activity] = useState("3.35");
  const [xlp310IgnitionTemp, setXlp310IgnitionTemp] = useState("390");
  const [xlp310OperatingTemp, setXlp310OperatingTemp] = useState("400");
  const [xlp310Diameter, setXlp310Diameter] = useState("12.5");
  const [xlp310Sphericity, setXlp310Sphericity] = useState("0.65");
  const [xlp310BulkDensity, setXlp310BulkDensity] = useState("815");
  
  // MECS GR330
  const [gr330CesiumPromoted, setGr330CesiumPromoted] = useState("No");
  const [gr330Shape, setGr330Shape] = useState("Hexalobe");
  const [gr330VoidFraction, setGr330VoidFraction] = useState("0.55");
  const [gr330Activity, setGr330Activity] = useState("1.4");
  const [gr330IgnitionTemp, setGr330IgnitionTemp] = useState("360");
  const [gr330OperatingTemp, setGr330OperatingTemp] = useState("370");
  const [gr330Diameter, setGr330Diameter] = useState("11.0");
  const [gr330Sphericity, setGr330Sphericity] = useState("0.70");
  const [gr330BulkDensity, setGr330BulkDensity] = useState("865");

  // Fetch saved catalyst parameters from database
  const { data: savedParams } = useQuery<CatalystParameter[]>({
    queryKey: ['/api/catalyst-parameters'],
  });

  // Update state when saved parameters are loaded
  useEffect(() => {
    if (savedParams && savedParams.length > 0) {
      savedParams.forEach((param) => {
        if (param.name === "Topsoe VK69") {
          setVk69CesiumPromoted(param.cesiumPromoted);
          setVk69Shape(param.shape);
          setVk69VoidFraction(param.voidFraction);
          setVk69Activity(param.activityFresh);
          setVk69IgnitionTemp(param.ignitionTempC);
          setVk69OperatingTemp(param.operatingTempC);
          setVk69Diameter(param.diameterMm);
          setVk69Sphericity(param.sphericity);
          setVk69BulkDensity(param.bulkDensityKgM3);
        } else if (param.name === "MECS Super Gear XLP-310") {
          setXlp310CesiumPromoted(param.cesiumPromoted);
          setXlp310Shape(param.shape);
          setXlp310VoidFraction(param.voidFraction);
          setXlp310Activity(param.activityFresh);
          setXlp310IgnitionTemp(param.ignitionTempC);
          setXlp310OperatingTemp(param.operatingTempC);
          setXlp310Diameter(param.diameterMm);
          setXlp310Sphericity(param.sphericity);
          setXlp310BulkDensity(param.bulkDensityKgM3);
        } else if (param.name === "MECS GR330") {
          setGr330CesiumPromoted(param.cesiumPromoted);
          setGr330Shape(param.shape);
          setGr330VoidFraction(param.voidFraction);
          setGr330Activity(param.activityFresh);
          setGr330IgnitionTemp(param.ignitionTempC);
          setGr330OperatingTemp(param.operatingTempC);
          setGr330Diameter(param.diameterMm);
          setGr330Sphericity(param.sphericity);
          setGr330BulkDensity(param.bulkDensityKgM3);
        }
      });
    }
  }, [savedParams]);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/converter-settings")}
              data-testid="button-back-converter"
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Database className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Catalyst Parameter Database</h1>
              <PythonCodeViewer
                title="Catalyst Parameter Database - Python Variables"
                description="Python data structures and helper functions for catalyst physical properties, including data classes, database dictionaries, and calculation functions for pressure drop and activity adjustment."
                code={catalystPythonCode}
              />
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-catalyst-params"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              This page is a database from known physical properties and reverse-engineered catalyst 
              activity parameters from available operating data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Topsoe VK69 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center" data-testid="title-topsoe-vk69">Topsoe VK69</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Cesium Promoted:</Label>
                  <Select value={vk69CesiumPromoted} onValueChange={setVk69CesiumPromoted}>
                    <SelectTrigger data-testid="select-vk69-cesium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Shape:</Label>
                  <Select value={vk69Shape} onValueChange={setVk69Shape}>
                    <SelectTrigger data-testid="select-vk69-shape">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daisy">Daisy</SelectItem>
                      <SelectItem value="Ribbed Ring">Ribbed Ring</SelectItem>
                      <SelectItem value="Hexalobe">Hexalobe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Void Fraction:</Label>
                  <Input
                    value={vk69VoidFraction}
                    onChange={(e) => setVk69VoidFraction(e.target.value)}
                    data-testid="input-vk69-void-fraction"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Activity (Fresh):</Label>
                  <Input
                    value={vk69Activity}
                    onChange={(e) => setVk69Activity(e.target.value)}
                    data-testid="input-vk69-activity"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Published Ignition Temperature (C):</Label>
                  <Input
                    value={vk69IgnitionTemp}
                    onChange={(e) => setVk69IgnitionTemp(e.target.value)}
                    data-testid="input-vk69-ignition-temp"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Published Operating Temp (C):</Label>
                  <Input
                    value={vk69OperatingTemp}
                    onChange={(e) => setVk69OperatingTemp(e.target.value)}
                    data-testid="input-vk69-operating-temp"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Diameter (mm):</Label>
                  <Input
                    value={vk69Diameter}
                    onChange={(e) => setVk69Diameter(e.target.value)}
                    data-testid="input-vk69-diameter"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Sphericity (φ):</Label>
                  <Input
                    value={vk69Sphericity}
                    onChange={(e) => setVk69Sphericity(e.target.value)}
                    data-testid="input-vk69-sphericity"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Bulk Density ρ<sub>b</sub> (Kg/m³):</Label>
                  <Input
                    value={vk69BulkDensity}
                    onChange={(e) => setVk69BulkDensity(e.target.value)}
                    data-testid="input-vk69-bulk-density"
                  />
                </div>
              </CardContent>
            </Card>

            {/* MECS Super Gear XLP-310 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center" data-testid="title-mecs-xlp310">MECS Super Gear XLP-310</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Cesium Promoted:</Label>
                  <Select value={xlp310CesiumPromoted} onValueChange={setXlp310CesiumPromoted}>
                    <SelectTrigger data-testid="select-xlp310-cesium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Shape:</Label>
                  <Select value={xlp310Shape} onValueChange={setXlp310Shape}>
                    <SelectTrigger data-testid="select-xlp310-shape">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daisy">Daisy</SelectItem>
                      <SelectItem value="Ribbed Ring">Ribbed Ring</SelectItem>
                      <SelectItem value="Hexalobe">Hexalobe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Void Fraction:</Label>
                  <Input
                    value={xlp310VoidFraction}
                    onChange={(e) => setXlp310VoidFraction(e.target.value)}
                    data-testid="input-xlp310-void-fraction"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Activity (Fresh):</Label>
                  <Input
                    value={xlp310Activity}
                    onChange={(e) => setXlp310Activity(e.target.value)}
                    data-testid="input-xlp310-activity"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Published Ignition Temperature (C):</Label>
                  <Input
                    value={xlp310IgnitionTemp}
                    onChange={(e) => setXlp310IgnitionTemp(e.target.value)}
                    data-testid="input-xlp310-ignition-temp"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Published Operating Temp (C):</Label>
                  <Input
                    value={xlp310OperatingTemp}
                    onChange={(e) => setXlp310OperatingTemp(e.target.value)}
                    data-testid="input-xlp310-operating-temp"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Diameter (mm):</Label>
                  <Input
                    value={xlp310Diameter}
                    onChange={(e) => setXlp310Diameter(e.target.value)}
                    data-testid="input-xlp310-diameter"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Sphericity (φ):</Label>
                  <Input
                    value={xlp310Sphericity}
                    onChange={(e) => setXlp310Sphericity(e.target.value)}
                    data-testid="input-xlp310-sphericity"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Bulk Density ρ<sub>b</sub> (Kg/m³):</Label>
                  <Input
                    value={xlp310BulkDensity}
                    onChange={(e) => setXlp310BulkDensity(e.target.value)}
                    data-testid="input-xlp310-bulk-density"
                  />
                </div>
              </CardContent>
            </Card>

            {/* MECS GR330 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center" data-testid="title-mecs-gr330">MECS GR330</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Cesium Promoted:</Label>
                  <Select value={gr330CesiumPromoted} onValueChange={setGr330CesiumPromoted}>
                    <SelectTrigger data-testid="select-gr330-cesium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Shape:</Label>
                  <Select value={gr330Shape} onValueChange={setGr330Shape}>
                    <SelectTrigger data-testid="select-gr330-shape">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daisy">Daisy</SelectItem>
                      <SelectItem value="Ribbed Ring">Ribbed Ring</SelectItem>
                      <SelectItem value="Hexalobe">Hexalobe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Void Fraction:</Label>
                  <Input
                    value={gr330VoidFraction}
                    onChange={(e) => setGr330VoidFraction(e.target.value)}
                    data-testid="input-gr330-void-fraction"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Activity (Fresh):</Label>
                  <Input
                    value={gr330Activity}
                    onChange={(e) => setGr330Activity(e.target.value)}
                    data-testid="input-gr330-activity"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Published Ignition Temperature (C):</Label>
                  <Input
                    value={gr330IgnitionTemp}
                    onChange={(e) => setGr330IgnitionTemp(e.target.value)}
                    data-testid="input-gr330-ignition-temp"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Published Operating Temp (C):</Label>
                  <Input
                    value={gr330OperatingTemp}
                    onChange={(e) => setGr330OperatingTemp(e.target.value)}
                    data-testid="input-gr330-operating-temp"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Catalyst Diameter (mm):</Label>
                  <Input
                    value={gr330Diameter}
                    onChange={(e) => setGr330Diameter(e.target.value)}
                    data-testid="input-gr330-diameter"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Sphericity (φ):</Label>
                  <Input
                    value={gr330Sphericity}
                    onChange={(e) => setGr330Sphericity(e.target.value)}
                    data-testid="input-gr330-sphericity"
                  />
                </div>
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm">Bulk Density ρ<sub>b</sub> (Kg/m³):</Label>
                  <Input
                    value={gr330BulkDensity}
                    onChange={(e) => setGr330BulkDensity(e.target.value)}
                    data-testid="input-gr330-bulk-density"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
