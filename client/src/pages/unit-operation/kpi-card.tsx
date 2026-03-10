import { useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const MW_S      = 32.065;
const MW_SO2    = 64.064;
const MW_H2SO4  = 98.079;
const HR_PER_DAY = 24;
const MIN_PER_HR = 60;
const LB_PER_ST  = 2000;
const STEAM_T_ST = 1.3;
const KW_PER_STPH = 243.0;

// ppmv conversion factor:  (lb SO2/day) → ppmv  (approximate for typical tail-gas volume)
// Using: 1 lb-mol/hr ≈ 379.48 SCF/hr, N2 vol ≈ dominant carrier gas
// ppmv = (molSO2TailHr * 1e6) / totalMolTailHr
function calculateKPI(
  sulfurLbPerMin: number,
  molSO2TailHr: number,
  molSO3TailHr: number,
  molN2TailHr: number
) {
  const molSMin    = sulfurLbPerMin / MW_S;
  const molSHr     = molSMin * MIN_PER_HR;

  const molAcidHr  = molSHr - molSO2TailHr - molSO3TailHr;
  const lbAcidDay  = molAcidHr * MW_H2SO4 * HR_PER_DAY;
  const plantRate  = lbAcidDay / LB_PER_ST;                      // STPD

  const conversion = molSHr > 0 ? (molAcidHr / molSHr) * 100 : 0;  // %

  const dryAirMolHr  = molN2TailHr / 0.7905;
  const pass1Strength = dryAirMolHr > 0 ? (molSHr / dryAirMolHr) * 100 : 0; // % SO2

  const lbSO2Day   = molSO2TailHr * MW_SO2 * HR_PER_DAY;
  const emissions  = plantRate > 0 ? lbSO2Day / plantRate : 0;   // lb/STPD

  // Scrubber emissions in ppmv
  const totalMolTailHr = molSO2TailHr + molSO3TailHr + molN2TailHr;
  const scrubberPpmv   = totalMolTailHr > 0
    ? (molSO2TailHr / totalMolTailHr) * 1e6
    : 0;

  const steamGen = STEAM_T_ST * plantRate;                         // ST/day → displayed as ST/ST (per STPD acid)

  const acidStph   = plantRate / 24.0;
  const steamStph  = STEAM_T_ST * acidStph;
  const grossPowerMW = (KW_PER_STPH * steamStph) / 1000.0;        // MW

  return {
    plantRate:      Math.round(plantRate),
    pass1Strength:  Math.round(pass1Strength * 10) / 10,
    conversion:     Math.round(conversion * 10) / 10,
    emissions:      Math.round(emissions * 10) / 10,
    scrubberPpmv:   Math.round(scrubberPpmv),
    steamPerST:     Math.round(STEAM_T_ST * 100) / 100,           // ST steam / ST acid (constant ratio)
    grossPowerMW:   Math.round(grossPowerMW * 100) / 100,
  };
}

// ─── KPI Row ─────────────────────────────────────────────────────────────────
function KPIRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ lineHeight: "1.55", fontSize: "0.78rem", color: "#0a0a0a" }}>
      <span style={{ fontWeight: 700 }}>{label}:</span>{" "}
      <span style={{
        textDecoration: "underline",
        fontWeight: 600,
        letterSpacing: "0.01em",
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface KPICardProps {
  /** Sulfur feed flow in lb/min. Defaults to 1128. */
  sulfurFlowLbMin?: number;
  /** SO₂ in tail gas, lb-mol/hr. Defaults to 3.01. */
  molSO2TailHr?: number;
  /** SO₃ in tail gas, lb-mol/hr. Defaults to 0. */
  molSO3TailHr?: number;
  /** N₂ in tail gas, lb-mol/hr. Defaults to 14506.68. */
  molN2TailHr?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function KPICard({
  sulfurFlowLbMin = 1128,
  molSO2TailHr    = 3.01,
  molSO3TailHr    = 0,
  molN2TailHr     = 14506.68,
}: KPICardProps) {
  const kpi = useMemo(
    () => calculateKPI(sulfurFlowLbMin, molSO2TailHr, molSO3TailHr, molN2TailHr),
    [sulfurFlowLbMin, molSO2TailHr, molSO3TailHr, molN2TailHr]
  );

  return (
    <div
      style={{
        display: "inline-block",
        minWidth: 230,
        background: "#ffffff",          // green background matching image
        border: "2.5px solid #6dbf6d",  // dark outer border
        borderRadius: 3,
        boxShadow: "inset 0 0 0 1.5px #6dbf6d", // inner border effect
        padding: 0,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: "0.82rem",
          padding: "5px 10px 4px",
          borderBottom: "2px solid #2b2b2b",
          color: "#0a0a0a",
          background: "rgba(0,0,0,0.06)",
          letterSpacing: "0.01em",
        }}
      >
        Key Performance Parameters
      </div>

      {/* KPI rows */}
      <div style={{ padding: "7px 11px 9px" }}>
        <KPIRow label="Plant Rate"         value={`${kpi.plantRate.toLocaleString()} STPD`} />
        <KPIRow label="Pass 1 Strength"    value={`${kpi.pass1Strength.toFixed(1)}% SO2`} />
        <KPIRow label="SO2 Conversion"     value={`${kpi.conversion.toFixed(1)}%`} />
        <KPIRow label="Emissions"          value={`${kpi.emissions.toFixed(1)} lb / STPD`} />
        <KPIRow label="Scrubber Emissions" value={`${kpi.scrubberPpmv} ppmv`} />
        <KPIRow label="Steam Gen."         value={`${kpi.steamPerST.toFixed(2)} ST/ST`} />
        <KPIRow label="Gross Power Gen."   value={`${kpi.grossPowerMW.toFixed(2)} MW`} />
      </div>
    </div>
  );
}
