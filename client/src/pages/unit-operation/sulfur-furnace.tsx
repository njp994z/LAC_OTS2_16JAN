import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Code, Play, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type SimulationMode = "stand_alone" | "static" | "dynamic";

interface StandAloneInputs {
  sulfurFlow: string;
  gasFlow: string;
  gasPressure: string;
  gasTemp: string;
  barometricPressure: string;
  airHeatTransferCoeff: string;
  outletDiameter: string;
  realtimeBarometric: boolean;
}

interface DynamicInputs {
  brickHeatCapacity: string;
  brickDensity: string;
  brickHeatTransferCoeff: string;
  numberOfPFRSlices: string;
  furnaceLength: string;
  furnaceID: string;
}

interface FeedStreams {
  sulfurInput: string;
  airInput: string;
}

interface OutletParams {
  outletTempF: string;
  outletTempC: string;
  outletDensityF: string;
  outletDensityC: string;
  outletFlowAcfm: string;
  outletFlowAm3hr: string;
  outletFlowLbmolHr: string;
  outletFlowKmolHr: string;
  outletPressureInwc: string;
  outletPressureMmwg: string;
  tempRiseF: string;
  tempRiseC: string;
  pressureRiseInwc: string;
  pressureRiseMmwg: string;
  standardFlowScfm: string;
  standardFlowNm3hr: string;
  massFlowKlbhr: string;
  massFlowMThr: string;
  inletAirFlowAcfm: string;
  inletAirFlowAm3hr: string;
  dpFurnaceInwc: string;
  dpFurnaceMmwg: string;
  outletVelocityAlfm: string;
  outletVelocityMs: string;
  qGrossMMBTU: string;
  qGrossMMKCAL: string;
  qLossesMMBTU: string;
  qLossesMMKCAL: string;
  qNetMMBTU: string;
  qNetMMKCAL: string;
}

interface StaticOutput {
  furnaceStream: string;
  sulfurFCVdP: string;
  sulfurFCVPositioner: string;
  pidOutput: string;
}

interface StreamComposition {
  molFracSO2: { UF0: string; GF0: string; GF1: string };
  molFracSO3: { UF0: string; GF0: string; GF1: string };
  molFracO2: { UF0: string; GF0: string; GF1: string };
  molFracN2: { UF0: string; GF0: string; GF1: string };
  molFracH2O: { UF0: string; GF0: string; GF1: string };
  molFracH2SO4: { UF0: string; GF0: string; GF1: string };
  molFracS: { UF0: string; GF0: string; GF1: string };
  totalFlow: { UF0: string; GF0: string; GF1: string };
  pressure: { UF0: string; GF0: string; GF1: string };
  temp: { UF0: string; GF0: string; GF1: string };
}

const FURNACE_PYTHON_CODE = `"""
Sulfur Furnace Simulation - Matches sulfur-furnace.tsx GUI exactly
=====================================================================
All variable names, units, and output structure align with React state.
"""

from dataclasses import dataclass
from typing import Dict
import math

# ==============================================================================
# CONSTANTS
# ==============================================================================
R_GAS = 10.73159  # ft³·psia/(lbmol·°R)
MW_S = 32.065     # lb/lbmol
MW_SO2 = 64.066
MW_O2 = 32.0
MW_N2 = 28.013
DELTA_H_COMBUSTION = -127300.0  # BTU/lbmol (S + O2 → SO2)

# Standard conditions - changed per your request
T_STD_F = 32.0     # °F for Nm³/hr definition
P_STD_PSIA = 14.696

# Conversions
IN_H2O_TO_PSIA = 0.036127
IN_H2O_TO_MMH2O = 25.4
ACFM_TO_AM3HR = 1.6992
FT_MIN_TO_M_S = 0.00508
BTU_TO_KCAL = 0.252164

# Heat capacity database (dimensionless Cp/R, metric under hood but converted)
GAS_CP_COEFFICIENTS = {
    'O2': {'alpha': 3.78245636, 'beta': -2.99673416e-3, 'gamma': 9.84730201e-6, 'delta': -9.68129509e-9},
    'N2': {'alpha': 3.53100528, 'beta': -1.23660987e-3, 'gamma': 5.02999433e-6, 'delta': -2.43530612e-9},
    'SO2': {'alpha': 3.38215966, 'beta': 10.1057729e-3, 'gamma': -8.97630813e-6, 'delta': 3.49969871e-9},
    'SO3': {'alpha': 4.10181690, 'beta': 15.4492450e-3, 'gamma': -15.3652810e-6, 'delta': 6.91144550e-9},
}

R_BTU = 1.9858775  # BTU/(lbmol·°R)


def calc_cp_btu(species: str, T_R: float) -> float:
    """Cp in BTU/(lbmol·°R) using polynomial"""
    if species not in GAS_CP_COEFFICIENTS:
        return 7.8  # fallback
    c = GAS_CP_COEFFICIENTS[species]
    T_K = T_R * 5 / 9
    T_K = max(200, min(T_K, 1000))
    cp_over_r = c['alpha'] + c['beta'] * T_K + c['gamma'] * T_K**2 + c['delta'] * T_K**3
    return cp_over_r * R_BTU


# ==============================================================================
# INPUT DATACLASSES - Match GUI state exactly
# ==============================================================================
@dataclass
class StandAloneInputs:
    sulfurFlow: float          # gpm
    gasFlow: float             # scfm
    gasPressure: float         # IN WC
    gasTemp: float             # F
    barometricPressure: float  # ATM
    airHeatTransferCoeff: float  # not used yet
    outletDiameter: float      # ft


@dataclass
class DynamicInputs:
    brickHeatCapacity: float   # BTU/(lb·F)
    brickDensity: float        # lb/ft³
    brickHeatTransferCoeff: float
    numberOfPFRSlices: int
    furnaceLength: float       # ft
    furnaceID: float           # ft (inner diameter)


# ==============================================================================
# OUTPUT DATACLASSES - Match GUI state exactly
# ==============================================================================
@dataclass
class OutletParams:
    outletTempF: float
    outletTempC: float
    outletDensityF: float
    outletDensityC: float
    outletFlowAcfm: float
    outletFlowAm3hr: float
    outletFlowLbmolHr: float
    outletFlowKmolHr: float
    outletPressureInwc: float
    outletPressureMmwg: float
    tempRiseF: float
    tempRiseC: float
    pressureRiseInwc: float
    pressureRiseMmwg: float
    standardFlowScfm: float
    standardFlowNm3hr: float
    massFlowKlbhr: float
    massFlowMThr: float
    inletAirFlowAcfm: float
    inletAirFlowAm3hr: float
    dpFurnaceInwc: float
    dpFurnaceMmwg: float
    outletVelocityAlfm: float
    outletVelocityMs: float
    qGrossMMBTU: float
    qGrossMMKCAL: float
    qLossesMMBTU: float
    qLossesMMKCAL: float
    qNetMMBTU: float
    qNetMMKCAL: float


@dataclass
class StreamComposition:
    molFracSO2: Dict[str, float]
    molFracSO3: Dict[str, float]
    molFracO2: Dict[str, float]
    molFracN2: Dict[str, float]
    molFracH2O: Dict[str, float]
    molFracH2SO4: Dict[str, float]
    molFracS: Dict[str, float]
    totalFlow: Dict[str, float]
    pressure: Dict[str, float]
    temp: Dict[str, float]


# ==============================================================================
# MAIN SIMULATION FUNCTION
# ==============================================================================
def run_furnace_simulation(
    inputs: StandAloneInputs,
    dynamic: DynamicInputs
) -> tuple[OutletParams, StreamComposition]:
    """
    Returns (OutletParams, StreamComposition) matching GUI state exactly.
    """
    # -------------------------- Input extraction --------------------------
    sulfur_gpm = inputs.sulfurFlow
    air_scfm = inputs.gasFlow
    gas_pressure_inwc = inputs.gasPressure
    gas_temp_f = inputs.gasTemp
    baro_atm = inputs.barometricPressure
    outlet_dia_ft = inputs.outletDiameter

    # -------------------------- Inlet conditions --------------------------
    inlet_psia = baro_atm * 14.696 + gas_pressure_inwc * IN_H2O_TO_PSIA
    T_in_R = gas_temp_f + 459.67

    # Sulfur flow → lbmol/hr (assume typical liquid sulfur density ~15 lb/gal)
    sulfur_lb_hr = sulfur_gpm * 60 * 15.0
    sulfur_lbmol_hr = sulfur_lb_hr / MW_S

    # Air flow → lbmol/hr at actual conditions
    inlet_acfm = air_scfm * (P_STD_PSIA / inlet_psia) * ((T_in_R) / (T_STD_F + 459.67))
    air_lbmol_hr = (inlet_psia * inlet_acfm) / (R_GAS * T_in_R)

    n_S_in = sulfur_lbmol_hr
    n_O2_in = air_lbmol_hr * 0.21
    n_N2_in = air_lbmol_hr * 0.79

    # -------------------------- Reaction (instantaneous) -------------------
    burned = min(n_S_in, n_O2_in)
    n_SO2_out = burned
    n_O2_out = n_O2_in - burned
    n_N2_out = n_N2_in
    n_SO3_out = 0.03 * n_SO2_out  # ~3% equilibrium placeholder
    n_SO2_out -= n_SO3_out

    total_out_lbmol_hr = n_SO2_out + n_SO3_out + n_O2_out + n_N2_out

    # -------------------------- Energy balance --------------------------
    q_gross_btu_hr = -DELTA_H_COMBUSTION * burned
    q_loss_btu_hr = 0.0  # placeholder - brick loss not active yet
    q_net_btu_hr = q_gross_btu_hr - q_loss_btu_hr

    # Iterative temperature solve
    T_out_R = T_in_R + 1000  # initial guess
    for _ in range(30):
        T_avg_R = (T_in_R + T_out_R) / 2
        cp_mix = (
            (n_SO2_out * calc_cp_btu('SO2', T_avg_R) +
             n_SO3_out * calc_cp_btu('SO3', T_avg_R) +
             n_O2_out * calc_cp_btu('O2', T_avg_R) +
             n_N2_out * calc_cp_btu('N2', T_avg_R)) / total_out_lbmol_hr
        )
        dT_R = q_net_btu_hr / (total_out_lbmol_hr * cp_mix)
        T_out_R_new = T_in_R + dT_R
        if abs(T_out_R_new - T_out_R) < 1.0:
            break
        T_out_R = T_out_R_new

    outlet_temp_f = T_out_R - 459.67
    outlet_temp_c = (outlet_temp_f - 32) * 5 / 9

    # -------------------------- Pressure drop (placeholder) -------------
    dp_furnace_inwc = 8.0
    outlet_pressure_inwc = gas_pressure_inwc - dp_furnace_inwc

    # -------------------------- Volumetric flows ------------------------
    outlet_psia = inlet_psia - dp_furnace_inwc * IN_H2O_TO_PSIA
    T_out_R = outlet_temp_f + 459.67
    outlet_acfm = total_out_lbmol_hr * R_GAS * T_out_R / outlet_psia
    outlet_am3hr = outlet_acfm * ACFM_TO_AM3HR

    # Standard flow at 32°F
    standard_scfm = total_out_lbmol_hr * (outlet_psia / P_STD_PSIA) * ((T_STD_F + 459.67) / T_out_R)
    standard_nm3hr = standard_scfm * 1.6086  # approximate

    # -------------------------- Density & mass flow ---------------------
    avg_mw = (n_SO2_out * MW_SO2 + n_SO3_out * 80.066 + n_O2_out * MW_O2 + n_N2_out * MW_N2) / total_out_lbmol_hr
    mass_lb_hr = total_out_lbmol_hr * avg_mw
    outlet_density_lb_ft3 = mass_lb_hr / outlet_acfm
    outlet_density_kg_m3 = outlet_density_lb_ft3 * 16.0185

    # -------------------------- Velocity --------------------------------
    area_ft2 = math.pi * (outlet_dia_ft / 2) ** 2
    outlet_velocity_ft_min = outlet_acfm / area_ft2 * 60 if area_ft2 > 0 else 0.0
    outlet_velocity_m_s = outlet_velocity_ft_min * FT_MIN_TO_M_S

    # -------------------------- Heat duties ------------------------------
    q_gross_mmbtu = q_gross_btu_hr / 1e6
    q_gross_mmkcal = q_gross_mmbtu * BTU_TO_KCAL
    q_losses_mmbtu = q_loss_btu_hr / 1e6
    q_losses_mmkcal = q_losses_mmbtu * BTU_TO_KCAL
    q_net_mmbtu = q_net_btu_hr / 1e6
    q_net_mmkcal = q_net_mmbtu * BTU_TO_KCAL

    # -------------------------- OutletParams -----------------------------
    outlet_params = OutletParams(
        outletTempF=round(outlet_temp_f, 1),
        outletTempC=round(outlet_temp_c, 1),
        outletDensityF=round(outlet_density_lb_ft3, 4),
        outletDensityC=round(outlet_density_kg_m3, 2),
        outletFlowAcfm=round(outlet_acfm, 0),
        outletFlowAm3hr=round(outlet_am3hr, 0),
        outletFlowLbmolHr=round(total_out_lbmol_hr, 1),
        outletFlowKmolHr=round(total_out_lbmol_hr, 1),
        outletPressureInwc=round(outlet_pressure_inwc, 2),
        outletPressureMmwg=round(outlet_pressure_inwc * IN_H2O_TO_MMH2O, 1),
        tempRiseF=round(outlet_temp_f - gas_temp_f, 1),
        tempRiseC=round((outlet_temp_f - gas_temp_f) * 5/9, 1),
        pressureRiseInwc=round(-dp_furnace_inwc, 2),
        pressureRiseMmwg=round(-dp_furnace_inwc * IN_H2O_TO_MMH2O, 1),
        standardFlowScfm=round(standard_scfm, 0),
        standardFlowNm3hr=round(standard_nm3hr, 0),
        massFlowKlbhr=round(mass_lb_hr / 1000, 1),
        massFlowMThr=round(mass_lb_hr / 2204.62, 2),
        inletAirFlowAcfm=round(inlet_acfm, 0),
        inletAirFlowAm3hr=round(inlet_acfm * ACFM_TO_AM3HR, 0),
        dpFurnaceInwc=round(-dp_furnace_inwc, 2),
        dpFurnaceMmwg=round(-dp_furnace_inwc * IN_H2O_TO_MMH2O, 1),
        outletVelocityAlfm=round(outlet_velocity_ft_min, 0),
        outletVelocityMs=round(outlet_velocity_m_s, 2),
        qGrossMMBTU=round(q_gross_mmbtu, 3),
        qGrossMMKCAL=round(q_gross_mmkcal, 3),
        qLossesMMBTU=round(q_losses_mmbtu, 3),
        qLossesMMKCAL=round(q_losses_mmkcal, 3),
        qNetMMBTU=round(q_net_mmbtu, 3),
        qNetMMKCAL=round(q_net_mmkcal, 3),
    )

    # -------------------------- Stream compositions ----------------------
    def mol_frac(n, total): return round(n / total, 4) if total > 0 else 0.0

    stream_comp = StreamComposition(
        molFracSO2={"UF0": "0.0000", "GF0": "0.0000", "GF1": f"{mol_frac(n_SO2_out, total_out_lbmol_hr):.4f}"},
        molFracSO3={"UF0": "0.0000", "GF0": "0.0000", "GF1": f"{mol_frac(n_SO3_out, total_out_lbmol_hr):.4f}"},
        molFracO2={"UF0": "0.0000", "GF0": "0.2100", "GF1": f"{mol_frac(n_O2_out, total_out_lbmol_hr):.4f}"},
        molFracN2={"UF0": "0.0000", "GF0": "0.7900", "GF1": f"{mol_frac(n_N2_out, total_out_lbmol_hr):.4f}"},
        molFracH2O={"UF0": "0.0000", "GF0": "0.0000", "GF1": "0.0000"},
        molFracH2SO4={"UF0": "0.0000", "GF0": "0.0000", "GF1": "0.0000"},
        molFracS={"UF0": "1.0000", "GF0": "0.0000", "GF1": "0.0000"},
        totalFlow={
            "UF0": f"{round(sulfur_lbmol_hr, 1)}",
            "GF0": f"{round(air_lbmol_hr, 1)}",
            "GF1": f"{round(total_out_lbmol_hr, 1)}"
        },
        pressure={
            "UF0": f"{round(inlet_psia, 2)}",
            "GF0": f"{round(inlet_psia, 2)}",
            "GF1": f"{round(outlet_psia, 2)}"
        },
        temp={
            "UF0": f"{round(gas_temp_f, 1)}",
            "GF0": f"{round(gas_temp_f, 1)}",
            "GF1": f"{round(outlet_temp_f, 1)}"
        },
    )

    return outlet_params, stream_comp


# ==============================================================================
# EXAMPLE USAGE (matches your default GUI values)
# ==============================================================================
if __name__ == "__main__":
    inputs = StandAloneInputs(
        sulfurFlow=15.5,
        gasFlow=180000,
        gasPressure=-12,
        gasTemp=150,
        barometricPressure=0.85,
        airHeatTransferCoeff=0.0,
        outletDiameter=6.0
    )
    dynamic = DynamicInputs(
        brickHeatCapacity=0.22,
        brickDensity=150,
        brickHeatTransferCoeff=0.0,
        numberOfPFRSlices=20,
        furnaceLength=20.0,
        furnaceID=6.0
    )

    outlet_params, stream_comp = run_furnace_simulation(inputs, dynamic)

    print("Outlet Temperature:", outlet_params.outletTempF, "°F")
    print("Gross Heat:", outlet_params.qGrossMMBTU, "MMBTU/hr")
    print("SO2 mole fraction (GF1):", stream_comp.molFracSO2["GF1"])
`;

export default function SulfurFurnace() {
  const { toast } = useToast();
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("stand_alone");
  const [isRunningSimulation, setIsRunningSimulation] = useState(false);
  const [isLoadingBarometric, setIsLoadingBarometric] = useState(false);
  const [isPythonCodeOpen, setIsPythonCodeOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(FURNACE_PYTHON_CODE);
    setHasCopied(true);
    toast({
      title: "Copied!",
      description: "Python code copied to clipboard.",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  const isStandAloneMode = simulationMode === "stand_alone";

  const [standAloneInputs, setStandAloneInputs] = useState<StandAloneInputs>({
    sulfurFlow: "15.5",
    gasFlow: "180000",
    gasPressure: "-12",
    gasTemp: "150",
    barometricPressure: "0.85",
    airHeatTransferCoeff: "XX",
    outletDiameter: "XX",
    realtimeBarometric: false
  });

  const [dynamicInputs, setDynamicInputs] = useState<DynamicInputs>({
    brickHeatCapacity: "0.22",
    brickDensity: "150",
    brickHeatTransferCoeff: "XX",
    numberOfPFRSlices: "XX",
    furnaceLength: "XX",
    furnaceID: "XX"
  });

  const [feedStreams, setFeedStreams] = useState<FeedStreams>({
    sulfurInput: "UF0",
    airInput: "GF0"
  });

  const [outletParams, setOutletParams] = useState<OutletParams>({
    outletTempF: "XXX",
    outletTempC: "XXX",
    outletDensityF: "XXX",
    outletDensityC: "XXX",
    outletFlowAcfm: "XXX",
    outletFlowAm3hr: "XXX",
    outletFlowLbmolHr: "XXX",
    outletFlowKmolHr: "XXX",
    outletPressureInwc: "XXX",
    outletPressureMmwg: "XXX",
    tempRiseF: "XXX",
    tempRiseC: "XXX",
    pressureRiseInwc: "XXX",
    pressureRiseMmwg: "XXX",
    standardFlowScfm: "XXX",
    standardFlowNm3hr: "XXX",
    massFlowKlbhr: "XXX",
    massFlowMThr: "XXX",
    inletAirFlowAcfm: "XXX",
    inletAirFlowAm3hr: "XXX",
    dpFurnaceInwc: "-XX",
    dpFurnaceMmwg: "-XX",
    outletVelocityAlfm: "XXX",
    outletVelocityMs: "XXX",
    qGrossMMBTU: "XXX",
    qGrossMMKCAL: "XXX",
    qLossesMMBTU: "XXX",
    qLossesMMKCAL: "XXX",
    qNetMMBTU: "XXX",
    qNetMMKCAL: "XXX"
  });

  const [staticOutput, setStaticOutput] = useState<StaticOutput>({
    furnaceStream: "GF1",
    sulfurFCVdP: "XX",
    sulfurFCVPositioner: "XX%",
    pidOutput: "XX"
  });

  const [streamComposition, setStreamComposition] = useState<StreamComposition>({
    molFracSO2: { UF0: "XXX", GF0: "XXX", GF1: "XXX" },
    molFracSO3: { UF0: "XXX", GF0: "XXX", GF1: "XXX" },
    molFracO2: { UF0: "XXX", GF0: "XXX", GF1: "XXX" },
    molFracN2: { UF0: "XXX", GF0: "XXX", GF1: "XXX" },
    molFracH2O: { UF0: "XXX", GF0: "XXX", GF1: "XXX" },
    molFracH2SO4: { UF0: "XXX", GF0: "XXX", GF1: "XXX" },
    molFracS: { UF0: "XXX", GF0: "XXX", GF1: "XXX" },
    totalFlow: { UF0: "XXX", GF0: "XXX", GF1: "XXX" },
    pressure: { UF0: "XXX", GF0: "XXX", GF1: "XXX" },
    temp: { UF0: "XXX", GF0: "XXX", GF1: "XXX" }
  });

  const handleStandAloneChange = (field: keyof StandAloneInputs, value: string | boolean) => {
    setStandAloneInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleDynamicChange = (field: keyof DynamicInputs, value: string) => {
    setDynamicInputs(prev => ({ ...prev, [field]: value }));
  };

  const fetchRealtimeBarometric = async () => {
    setIsLoadingBarometric(true);
    try {
      const response = await fetch('/api/psychrometrics/current?zipCode=89414&countryCode=US');
      if (!response.ok) {
        throw new Error('Failed to fetch psychrometric data');
      }
      const data = await response.json();
      const pressureHpa = data.conditions?.pressure;
      if (pressureHpa) {
        const pressureInHg = pressureHpa * 0.02953;
        const pressureAtm = pressureInHg / 29.9213;
        setStandAloneInputs(prev => ({ 
          ...prev, 
          barometricPressure: pressureAtm.toFixed(4) 
        }));
        toast({
          title: "Barometric Pressure Updated",
          description: `Live value: ${pressureAtm.toFixed(4)} ATM (from ${pressureHpa.toFixed(1)} hPa)`,
        });
      } else {
        toast({
          title: "Realtime Enabled",
          description: "Using default barometric pressure. API data unavailable.",
        });
      }
    } catch (error) {
      console.error('Error fetching barometric pressure:', error);
      toast({
        title: "Realtime Enabled",
        description: "Unable to fetch live data. Using current value.",
      });
    } finally {
      setIsLoadingBarometric(false);
    }
  };

  useEffect(() => {
    if (standAloneInputs.realtimeBarometric) {
      fetchRealtimeBarometric();
    }
  }, [standAloneInputs.realtimeBarometric]);

  const runSimulation = async () => {
    setIsRunningSimulation(true);
    try {
      toast({
        title: "Simulation Started",
        description: "Furnace simulation backend coming soon.",
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRunningSimulation(false);
    }
  };

  const InputRow = ({ 
    label, 
    value, 
    unit, 
    onChange, 
    testId,
    disabled = false,
    className = ""
  }: { 
    label: string; 
    value: string; 
    unit: string; 
    onChange?: (val: string) => void;
    testId: string;
    disabled?: boolean;
    className?: string;
  }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <Label className="w-32 text-right text-xs text-foreground whitespace-nowrap">{label}</Label>
      <Input
        type="text"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-20 text-primary font-medium text-center h-7 text-xs"
        disabled={disabled || !onChange}
        data-testid={testId}
      />
      <span className="text-xs text-muted-foreground w-20">{unit}</span>
    </div>
  );

  const OutputRow = ({ 
    label, 
    value1, 
    unit1, 
    value2, 
    unit2,
    testId,
    highlighted = false
  }: { 
    label: string; 
    value1: string; 
    unit1: string; 
    value2?: string;
    unit2?: string;
    testId: string;
    highlighted?: boolean;
  }) => (
    <div className="flex items-center gap-2">
      <Label className="w-28 text-right text-xs text-foreground whitespace-nowrap">{label}</Label>
      <span className={`w-16 text-center font-mono text-xs ${highlighted ? 'text-yellow-500' : 'text-primary'}`} data-testid={`${testId}-1`}>{value1}</span>
      <span className={`text-xs w-14 ${highlighted ? 'text-yellow-500' : 'text-muted-foreground'}`}>{unit1}</span>
      {value2 !== undefined && (
        <>
          <span className={`w-16 text-center font-mono text-xs ${highlighted ? 'text-yellow-500' : 'text-primary'}`} data-testid={`${testId}-2`}>{value2}</span>
          <span className={`text-xs w-14 ${highlighted ? 'text-yellow-500' : 'text-muted-foreground'}`}>{unit2}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/unit-operation-simulator" data-testid="link-back">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span className="font-semibold text-foreground">Lithium Americas</span>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-8 px-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col items-start gap-1">
              <Label className="text-xs text-muted-foreground">Simulation Mode: (Dropdown Menu)</Label>
              <Select value={simulationMode} onValueChange={(v) => setSimulationMode(v as SimulationMode)}>
                <SelectTrigger className="w-56" data-testid="select-simulation-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stand_alone" data-testid="select-item-stand-alone">
                    <span className="underline">Stand Alone</span>
                  </SelectItem>
                  <SelectItem value="static" data-testid="select-item-static">
                    <span className="text-blue-500">Static (Import Data structures)</span>
                  </SelectItem>
                  <SelectItem value="dynamic" data-testid="select-item-dynamic">
                    <span className="text-blue-500">Dynamic</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Furnace Block</h1>

            <div className="flex gap-3">
              <Button className="gap-2" data-testid="button-furnace-datasheet">
                <FileText className="h-4 w-4" />
                Furnace Data Sheet
              </Button>
              <Dialog open={isPythonCodeOpen} onOpenChange={setIsPythonCodeOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2" data-testid="button-python-code-links">
                    <Code className="h-4 w-4" />
                    Python code links
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg">Furnace Simulation Python Code</DialogTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="gap-2"
                      data-testid="button-copy-python-code"
                    >
                      {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {hasCopied ? "Copied!" : "Copy Code"}
                    </Button>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto rounded-lg border border-border">
                    <SyntaxHighlighter
                      language="python"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.75rem',
                        lineHeight: '1.5',
                      }}
                      showLineNumbers
                      data-testid="code-python-furnace"
                    >
                      {FURNACE_PYTHON_CODE}
                    </SyntaxHighlighter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <Card className="border-2 border-dashed border-border rounded-3xl">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xs underline text-center" data-testid="text-stand-alone-title">
                    Furnace Stand Alone Input Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <InputRow 
                    label="Sulfur Flow:" 
                    value={standAloneInputs.sulfurFlow}
                    unit="gpm"
                    onChange={(v) => handleStandAloneChange("sulfurFlow", v)}
                    testId="input-sulfur-flow"
                  />
                  <InputRow 
                    label="Gas Flow:" 
                    value={standAloneInputs.gasFlow}
                    unit="scfm"
                    onChange={(v) => handleStandAloneChange("gasFlow", v)}
                    testId="input-gas-flow"
                  />
                  <InputRow 
                    label="Gas Pressure:" 
                    value={standAloneInputs.gasPressure}
                    unit="IN WC"
                    onChange={(v) => handleStandAloneChange("gasPressure", v)}
                    testId="input-gas-pressure"
                  />
                  <InputRow 
                    label="Gas Temp:" 
                    value={standAloneInputs.gasTemp}
                    unit="F"
                    onChange={(v) => handleStandAloneChange("gasTemp", v)}
                    testId="input-gas-temp"
                  />
                  
                  <div className="flex items-center gap-2 pt-1">
                    <Label className="w-32 text-right text-xs text-foreground">Barometric Pressure:</Label>
                    <Input
                      type="text"
                      value={standAloneInputs.barometricPressure}
                      onChange={(e) => handleStandAloneChange("barometricPressure", e.target.value)}
                      className="w-20 text-primary font-medium text-center h-7 text-xs"
                      disabled={standAloneInputs.realtimeBarometric}
                      data-testid="input-barometric-pressure"
                    />
                    <span className="text-xs text-muted-foreground">ATM</span>
                  </div>
                  
                  <div className="flex items-center gap-2 pl-8" data-testid="toggle-realtime-barometric">
                    <Label className="text-xs text-muted-foreground">Realtime Barometric Pressure:</Label>
                    <div className="flex gap-2 items-center">
                      <Button
                        variant={standAloneInputs.realtimeBarometric ? "default" : "ghost"}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleStandAloneChange("realtimeBarometric", true)}
                        disabled={isLoadingBarometric}
                        data-testid="button-realtime-yes"
                      >
                        Yes
                      </Button>
                      <Button
                        variant={!standAloneInputs.realtimeBarometric ? "default" : "ghost"}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleStandAloneChange("realtimeBarometric", false)}
                        disabled={isLoadingBarometric}
                        data-testid="button-realtime-no"
                      >
                        No
                      </Button>
                      {isLoadingBarometric && <Loader2 className="h-3 w-3 animate-spin" />}
                    </div>
                  </div>

                  <InputRow 
                    label="Air Heat Transfer Coefficient:" 
                    value={standAloneInputs.airHeatTransferCoeff}
                    unit="hr*ft2*F / BTU"
                    onChange={(v) => handleStandAloneChange("airHeatTransferCoeff", v)}
                    testId="input-air-heat-transfer"
                  />
                  <div className="flex items-center gap-2">
                    <Label className="w-32 text-right text-xs text-foreground">Outlet Diameter:</Label>
                    <Input
                      type="text"
                      value={standAloneInputs.outletDiameter}
                      onChange={(e) => handleStandAloneChange("outletDiameter", e.target.value)}
                      className="w-20 text-primary font-medium text-center h-7 text-xs"
                      data-testid="input-outlet-diameter"
                    />
                    <span className="text-xs text-muted-foreground">ft</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="button-gear-outlet">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 border-dashed border-border rounded-3xl transition-opacity ${isStandAloneMode ? 'opacity-40 pointer-events-none' : ''}`}>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xs underline text-center" data-testid="text-feed-streams-title">
                    Furnace Static & Dynamic Feed Streams
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="flex items-center gap-2">
                    <Label className="w-24 text-right text-xs text-foreground">Sulfur Input:</Label>
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs font-mono" data-testid="text-sulfur-input">
                      {feedStreams.sulfurInput}
                    </span>
                    <span className="text-xs text-muted-foreground">Stream</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-24 text-right text-xs text-foreground">Air Input:</Label>
                    <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded text-xs font-mono" data-testid="text-air-input">
                      {feedStreams.airInput}
                    </span>
                    <span className="text-xs text-muted-foreground">Stream</span>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 border-dashed border-border rounded-3xl transition-opacity ${isStandAloneMode ? 'opacity-40 pointer-events-none' : ''}`}>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xs underline text-center" data-testid="text-dynamic-inputs-title">
                    Furnace Dynamic Inputs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="flex items-center gap-2">
                    <Label className="w-32 text-right text-xs text-foreground whitespace-nowrap">Brick heat capacity:</Label>
                    <Input
                      type="text"
                      value={dynamicInputs.brickHeatCapacity}
                      onChange={(e) => handleDynamicChange("brickHeatCapacity", e.target.value)}
                      className="w-16 text-primary font-medium text-center h-7 text-xs"
                      disabled={isStandAloneMode}
                      data-testid="input-brick-heat-cap"
                    />
                    <span className="text-xs text-muted-foreground">BTU/lb*F</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-32 text-right text-xs text-foreground whitespace-nowrap">Brick density:</Label>
                    <Input
                      type="text"
                      value={dynamicInputs.brickDensity}
                      onChange={(e) => handleDynamicChange("brickDensity", e.target.value)}
                      className="w-16 text-primary font-medium text-center h-7 text-xs"
                      disabled={isStandAloneMode}
                      data-testid="input-brick-density"
                    />
                    <span className="text-xs text-muted-foreground">lb/ft3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-32 text-right text-xs text-foreground whitespace-nowrap">Brick Heat Transfer Coefficient:</Label>
                    <Input
                      type="text"
                      value={dynamicInputs.brickHeatTransferCoeff}
                      onChange={(e) => handleDynamicChange("brickHeatTransferCoeff", e.target.value)}
                      className="w-16 text-primary font-medium text-center h-7 text-xs"
                      disabled={isStandAloneMode}
                      data-testid="input-brick-htc"
                    />
                    <span className="text-xs text-muted-foreground">hr*ft2*F / BTU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-32 text-right text-xs text-foreground whitespace-nowrap">Number of PFR Slices:</Label>
                    <Input
                      type="text"
                      value={dynamicInputs.numberOfPFRSlices}
                      onChange={(e) => handleDynamicChange("numberOfPFRSlices", e.target.value)}
                      className="w-16 text-primary font-medium text-center h-7 text-xs"
                      disabled={isStandAloneMode}
                      data-testid="input-pfr-slices"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-32 text-right text-xs text-foreground whitespace-nowrap">Furnace Length:</Label>
                    <Input
                      type="text"
                      value={dynamicInputs.furnaceLength}
                      onChange={(e) => handleDynamicChange("furnaceLength", e.target.value)}
                      className="w-16 text-primary font-medium text-center h-7 text-xs"
                      disabled={isStandAloneMode}
                      data-testid="input-furnace-length"
                    />
                    <span className="text-xs text-muted-foreground">ft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-32 text-right text-xs text-foreground whitespace-nowrap">Furnace ID:</Label>
                    <Input
                      type="text"
                      value={dynamicInputs.furnaceID}
                      onChange={(e) => handleDynamicChange("furnaceID", e.target.value)}
                      className="w-16 text-primary font-medium text-center h-7 text-xs"
                      disabled={isStandAloneMode}
                      data-testid="input-furnace-id"
                    />
                    <span className="text-xs text-muted-foreground">ft</span>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-center">
                <Button 
                  onClick={runSimulation}
                  disabled={isRunningSimulation}
                  className="gap-2 px-6"
                  data-testid="button-run-simulation"
                >
                  {isRunningSimulation ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <Card className="border-2 border-dashed border-border rounded-3xl h-full">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xs underline text-center" data-testid="text-outlet-params-title">
                    Furnace Outlet Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  <OutputRow label="Outlet Temp:" value1={outletParams.outletTempF} unit1="F" value2={outletParams.outletTempC} unit2="C" testId="output-outlet-temp" />
                  <OutputRow label="Outlet Density:" value1={outletParams.outletDensityF} unit1="lb/ft³" value2={outletParams.outletDensityC} unit2="kg/m³" testId="output-outlet-density" />
                  <OutputRow label="Outlet Flow:" value1={outletParams.outletFlowAcfm} unit1="acfm" value2={outletParams.outletFlowAm3hr} unit2="Am3/hr" testId="output-outlet-flow-vol" />
                  <OutputRow label="Outlet Flow:" value1={outletParams.outletFlowLbmolHr} unit1="lbmol/hr" value2={outletParams.outletFlowKmolHr} unit2="Kmol/hr" testId="output-outlet-flow-mol" />
                  <OutputRow label="Outlet Pressure:" value1={outletParams.outletPressureInwc} unit1="IN WC" value2={outletParams.outletPressureMmwg} unit2="mm wg" testId="output-outlet-pressure" highlighted />
                  <OutputRow label="Temp. Rise:" value1={outletParams.tempRiseF} unit1="F" value2={outletParams.tempRiseC} unit2="C" testId="output-temp-rise" />
                  <OutputRow label="Pressure Rise:" value1={outletParams.pressureRiseInwc} unit1="IN WC" value2={outletParams.pressureRiseMmwg} unit2="mm wg" testId="output-pressure-rise" highlighted />
                  <OutputRow label="Standard Flow:" value1={outletParams.standardFlowScfm} unit1="scfm" value2={outletParams.standardFlowNm3hr} unit2="Nm3/hr" testId="output-standard-flow" />
                  <OutputRow label="Mass Flow:" value1={outletParams.massFlowKlbhr} unit1="klb/hr" value2={outletParams.massFlowMThr} unit2="MT/hr" testId="output-mass-flow" />
                  <OutputRow label="Inlet Air Flow:" value1={outletParams.inletAirFlowAcfm} unit1="acfm" value2={outletParams.inletAirFlowAm3hr} unit2="Am3/hr" testId="output-inlet-air-flow" />
                  <OutputRow label="dP Furnace:" value1={outletParams.dpFurnaceInwc} unit1="IN WC" value2={outletParams.dpFurnaceMmwg} unit2="mm wg" testId="output-dp-furnace" highlighted />
                  <OutputRow label="Outlet Velocity:" value1={outletParams.outletVelocityAlfm} unit1="alfm" value2={outletParams.outletVelocityMs} unit2="m/s" testId="output-outlet-velocity" />
                  
                  <div className="border-t border-border pt-2 mt-2">
                    <OutputRow label="Q_Gross:" value1={outletParams.qGrossMMBTU} unit1="MMBTU/hr" value2={outletParams.qGrossMMKCAL} unit2="MMKCAL/hr" testId="output-q-gross" />
                    <OutputRow label="Q_Loses:" value1={outletParams.qLossesMMBTU} unit1="MMBTU/hr" value2={outletParams.qLossesMMKCAL} unit2="MMKCAL/hr" testId="output-q-losses" />
                    <OutputRow label="Q_Net:" value1={outletParams.qNetMMBTU} unit1="MMBTU/hr" value2={outletParams.qNetMMKCAL} unit2="MMKCAL/hr" testId="output-q-net" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <Card className="border-2 border-dashed border-border rounded-3xl">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-xs underline text-center" data-testid="text-static-output-title">
                    Furnace Static Output
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="flex items-center gap-3 justify-center">
                    <Label className="text-xs text-foreground">Furnace:</Label>
                    <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded text-xs font-mono" data-testid="text-furnace-stream">
                      {staticOutput.furnaceStream}
                    </span>
                    <span className="text-xs text-muted-foreground">Stream</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <Label className="text-xs text-foreground">Sulfur FCV dP:</Label>
                    <span className="text-primary font-mono text-xs" data-testid="text-fcv-dp">{staticOutput.sulfurFCVdP}</span>
                    <span className="text-xs text-muted-foreground">psi</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <Label className="text-xs text-foreground">Sulfur FCV Positioner:</Label>
                    <span className="text-primary font-mono text-xs" data-testid="text-fcv-positioner">{staticOutput.sulfurFCVPositioner}</span>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <Label className="text-xs text-foreground">PID Output:</Label>
                    <span className="text-primary font-mono text-xs" data-testid="text-pid-output">{staticOutput.pidOutput}</span>
                    <span className="text-xs text-muted-foreground">mA</span>
                  </div>
                </CardContent>
              </Card>

              <div className="text-xs text-muted-foreground px-2">
                Note: The Static and Dynamic simulations have different values for UF0 and GF0.
              </div>

              <Card className="border border-border rounded-lg">
                <CardContent className="p-0">
                  <table className="w-full text-xs" data-testid="table-stream-composition">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-2 font-medium">Stream</th>
                        <th className="text-center p-2 font-medium">UF0</th>
                        <th className="text-center p-2 font-medium">GF0</th>
                        <th className="text-center p-2 font-medium">GF1</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="p-2">Mol. Frac <span className="text-yellow-500">y_SO2</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-so2-uf0">{streamComposition.molFracSO2.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-so2-gf0">{streamComposition.molFracSO2.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-so2-gf1">{streamComposition.molFracSO2.GF1}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2">Mol. Frac <span className="text-yellow-500">y_SO3</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-so3-uf0">{streamComposition.molFracSO3.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-so3-gf0">{streamComposition.molFracSO3.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-so3-gf1">{streamComposition.molFracSO3.GF1}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2">Mol. Frac <span className="text-yellow-500">y_O2</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-o2-uf0">{streamComposition.molFracO2.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-o2-gf0">{streamComposition.molFracO2.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-o2-gf1">{streamComposition.molFracO2.GF1}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2">Mol. Frac <span className="text-yellow-500">y_N2</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-n2-uf0">{streamComposition.molFracN2.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-n2-gf0">{streamComposition.molFracN2.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-n2-gf1">{streamComposition.molFracN2.GF1}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2">Mol. Frac <span className="text-yellow-500">y_H2O</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-h2o-uf0">{streamComposition.molFracH2O.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-h2o-gf0">{streamComposition.molFracH2O.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-h2o-gf1">{streamComposition.molFracH2O.GF1}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2">Mol. Frac <span className="text-yellow-500">y_H2SO4</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-h2so4-uf0">{streamComposition.molFracH2SO4.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-h2so4-gf0">{streamComposition.molFracH2SO4.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-h2so4-gf1">{streamComposition.molFracH2SO4.GF1}</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2">Mol. Frac <span className="text-yellow-500">y_S</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-s-uf0">{streamComposition.molFracS.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-s-gf0">{streamComposition.molFracS.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-s-gf1">{streamComposition.molFracS.GF1}</td>
                      </tr>
                      <tr className="border-b border-border bg-muted/20">
                        <td className="p-2 font-medium">Total Flow <span className="text-muted-foreground font-normal">lbmol/hr</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-totalflow-uf0">{streamComposition.totalFlow.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-totalflow-gf0">{streamComposition.totalFlow.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-totalflow-gf1">{streamComposition.totalFlow.GF1}</td>
                      </tr>
                      <tr className="border-b border-border bg-muted/20">
                        <td className="p-2 font-medium">Pressure <span className="text-muted-foreground font-normal">psia</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-pressure-uf0">{streamComposition.pressure.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-pressure-gf0">{streamComposition.pressure.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-pressure-gf1">{streamComposition.pressure.GF1}</td>
                      </tr>
                      <tr className="bg-muted/20">
                        <td className="p-2 font-medium">Temp. <span className="text-muted-foreground font-normal">F</span></td>
                        <td className="text-center p-2 text-primary" data-testid="cell-temp-uf0">{streamComposition.temp.UF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-temp-gf0">{streamComposition.temp.GF0}</td>
                        <td className="text-center p-2 text-primary" data-testid="cell-temp-gf1">{streamComposition.temp.GF1}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
