"""
Full Plant Static Simulation Orchestrator
==========================================
Chains all unit operations from air inlet to stack in the correct
process sequence for a double-contact double-absorption (DCDA) sulfuric acid plant.

Sequence:
  1. Inlet Air Filter        (streams 1 → 2)
  2. Main Compressor         (streams 2/3 → 4)
  3. Sulfur Spray Hydraulics (valve position, sulfur mass flow)
  4. Sulfur Furnace          (streams 4 + S → 5, 6)
  5. Jug Valve / WHB         (stream 5 → 6, 7, 8A, 8B, 9/GP10)
  6. Converter Pass 1        (stream 9/11 → 12)
  7. Converter Pass 2        (stream 13 → 14)  [cooled via inter-bed HX]
  8. Converter Pass 3        (stream 15 → 16)  [cooled via inter-bed HX]
  9. IPAT                    (stream 16 → 17)  [SO3 removed, gas cooled]
 10. Converter Pass 4        (stream 19 → 20)  [reheated via gas-gas HX]
 11. FAT                     (stream 20 → stack)

Returns:
  sensor_tags : flat dict keyed by DCS instrument tag (e.g. "1540-TI-4031")
  streams     : numbered stream dict (1-20)
  unit_operations : individual module result dicts
  summary     : key KPIs for L1 overview display
"""

import json
import sys
import math
from dataclasses import asdict

from inlet_air_filter_calc import (
    calculate_inlet_air_filter,
    OperatingConditions,
    stream_to_dict,
)
from compressor_calculator import (
    calculate_compressor_performance,
    CompressorInput,
    MAX_RPM,
)
from sulfur_static_solver import StaticSulfurSprayHydraulics, CONFIG as SULFUR_CONFIG
from sulfur_furnace_calc import calculate_static as furnace_calc_static
from jug_valve_calc import calculate_jug_valve_flows
from pass_solver import simulate_pass
from ipat_calc import calculate_tower as ipat_calc
from fat_calc import calculate_tower as fat_calc


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _f_to_c(f: float) -> float:
    return (f - 32.0) * 5.0 / 9.0


def _c_to_f(c: float) -> float:
    return c * 9.0 / 5.0 + 32.0


def _pct(scfm: float, total: float) -> float:
    return 100.0 * scfm / total if total > 0 else 0.0


# Inter-bed cooling targets (°C) — standard DCDA operating targets
_PASS2_INLET_T_C = 440.0
_PASS3_INLET_T_C = 440.0
_PASS4_INLET_T_C = 420.0   # after IPAT + gas-gas reheat

# Sulfur physical properties (for fallback mass-flow calculation)
_SG_SULF  = 1.803357
_LBPERGAL = 8.34


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

def run_plant(inp: dict) -> dict:
    """
    Run the full static plant simulation.

    Args:
        inp: dict with operator inputs (see defaults below).

    Returns:
        dict with 'sensor_tags', 'streams', 'unit_operations', 'summary'.
    """

    # ── Unpack operator inputs (with defaults) ─────────────────────────────
    compressor_rpm_pct  = float(inp.get("compressor_rpm_pct",  87.0))
    sulfur_flow_sp_gpm  = float(inp.get("sulfur_flow_sp_gpm",  79.0))
    sulfur_temp_F       = float(inp.get("sulfur_temp_F",       275.0))
    inlet_temp_F        = float(inp.get("inlet_temp_F",         70.0))
    filter_dp_inwc      = float(inp.get("filter_dp_inwc",        3.0))
    humidity_gr_lb      = float(inp.get("humidity_gr_lb",       50.0))
    barometric_atm      = float(inp.get("barometric_atm",        0.972))
    plant_condition     = inp.get("plant_condition",           "clean")
    jug_open_pct        = float(inp.get("jug_open_pct",         10.0))
    positioner_open_pct = float(inp.get("positioner_open_pct", 100.0))
    pit_level_ft        = float(inp.get("pit_level_ft",          7.0))
    sulfur_valve_R      = float(inp.get("sulfur_valve_R",       85.0))

    catalyst_name        = inp.get("catalyst_name",            "MECS GR330")
    catalyst_vol_liters  = float(inp.get("catalyst_volume_liters", 89200.0))
    converter_diam_ft    = float(inp.get("converter_diameter_ft",  42.0))
    barometric_psia      = barometric_atm * 14.696

    ipat_acid_x_h2so4   = float(inp.get("ipat_x_H2SO4",  0.985))
    ipat_acid_flow_gpm   = float(inp.get("ipat_flow_gpm", 500.0))
    fat_acid_x_h2so4    = float(inp.get("fat_x_H2SO4",   0.985))
    fat_acid_flow_gpm   = float(inp.get("fat_flow_gpm",  500.0))

    # ── Step 1: Inlet Air Filter ───────────────────────────────────────────
    # Approximate dry-air SCFM from compressor RPM for filter input.
    # Will be refined from actual compressor SCFM below.
    approx_dry_scfm = 109811.0 * (compressor_rpm_pct / 87.0)

    filter_cond = OperatingConditions(
        dry_air_flow_scfm=approx_dry_scfm,
        humidity_gr_lb=humidity_gr_lb,
        inlet_temp_F=inlet_temp_F,
        filter_dp_inwc=filter_dp_inwc,
        barometric_atm=barometric_atm,
    )
    filter_inlet_raw, filter_outlet_raw = calculate_inlet_air_filter(filter_cond)
    stream1 = stream_to_dict(filter_inlet_raw)   # Stream 1: Ambient
    stream2 = stream_to_dict(filter_outlet_raw)  # Stream 2: Filter outlet

    # ── Step 2: Main Compressor ────────────────────────────────────────────
    rpms = (compressor_rpm_pct / 100.0) * MAX_RPM
    comp_input = CompressorInput(
        rpms=rpms,
        inlet_temp_F=inlet_temp_F,
        inlet_pressure_inwc=stream2["pressure"],   # Filter outlet gauge pressure
        barometric_atm=barometric_atm,
        plant_condition=plant_condition,
    )
    comp_result = calculate_compressor_performance(comp_input)
    comp_dict   = asdict(comp_result)

    # Refine air-filter flow now that we have the actual compressor SCFM
    filter_cond.dry_air_flow_scfm = comp_result.standard_flow_scfm
    filter_inlet_raw, filter_outlet_raw = calculate_inlet_air_filter(filter_cond)
    stream1 = stream_to_dict(filter_inlet_raw)
    stream2 = stream_to_dict(filter_outlet_raw)

    # Stream 4: Compressor outlet (air, dry basis)
    air_scfm = comp_result.standard_flow_scfm
    stream4 = {
        "SO2": 0.0,
        "SO3": 0.0,
        "O2":  round(air_scfm * 0.21, 0),
        "N2":  round(air_scfm * 0.79, 0),
        "H2O": 0.0,
        "H2SO4": 0.0,
        "TOTAL": round(air_scfm, 0),
        "PRESSURE": round(comp_result.outlet_pressure_inwc, 1),
        "TEMPERATURE_F": round(comp_result.outlet_temp_F, 1),
    }

    # ── Step 3: Sulfur Spray Hydraulics ───────────────────────────────────
    SULFUR_CONFIG["R_equal_percent"] = sulfur_valve_R
    sulfur_solver = StaticSulfurSprayHydraulics()
    sulfur_result = sulfur_solver.calculate(
        flow_gpm=sulfur_flow_sp_gpm,
        pit_level_ft=pit_level_ft,
    )

    # Sulfur mass flow in klb/hr (try solver output first, fall back to formula)
    sulfur_mass_klb_hr = sulfur_result.get(
        "m_Total_klb_hr",
        (sulfur_flow_sp_gpm * _SG_SULF * _LBPERGAL * 60.0) / 1000.0,
    )

    # ── Step 4: Sulfur Furnace ─────────────────────────────────────────────
    furnace_result = furnace_calc_static(
        air_scfm=air_scfm,
        sulfur_klb_hr=sulfur_mass_klb_hr,
        sulfur_temp_f=sulfur_temp_F,
    )
    stream5 = furnace_result["stream5"]   # Furnace outlet
    stream6 = furnace_result["stream6"]   # Downstream point

    # ── Step 5: Jug Valve / WHB ────────────────────────────────────────────
    jug_result = calculate_jug_valve_flows(
        furnace_outlet_scfm_dry=stream5["scfm_dry_total"],
        furnace_outlet_so2=stream5["scfm_so2"],
        furnace_outlet_so3=stream5["scfm_so3"],
        furnace_outlet_o2=stream5["scfm_o2"],
        furnace_outlet_n2=stream5["scfm_n2"],
        furnace_outlet_temp_f=stream5["T_f"],
        furnace_outlet_press_inwc=stream5["P_inwc"],
        jug_open_pct=jug_open_pct,
        positioner_open_pct=positioner_open_pct,
        baro_psia=barometric_psia,
    )

    # Stream 9 (GP10) = Pass 1 inlet (WHB outlet + positioner-controlled bypass)
    s9_total  = jug_result["TOTAL_GP10"]
    s9_so2    = jug_result["SO2_GP10"]
    s9_so3    = jug_result["SO3_GP10"]
    s9_o2     = jug_result["O2_GP10"]
    s9_n2     = jug_result["N2_GP10"]
    s9_temp_f = jug_result["TEMPERATURE_GP10"]
    s9_press  = jug_result["PRESSURE_GP10"]

    stream9 = {
        "SO2": s9_so2,  "SO3": s9_so3,
        "O2":  s9_o2,   "N2":  s9_n2,
        "TOTAL": s9_total,
        "PRESSURE": s9_press,
        "TEMPERATURE_F": s9_temp_f,
    }

    # ── Step 6: Converter Pass 1 ───────────────────────────────────────────
    p1_result = simulate_pass(
        inlet_T_C=_f_to_c(s9_temp_f),
        inlet_P_inwc=s9_press,
        inlet_so2_pct=_pct(s9_so2, s9_total),
        inlet_o2_pct =_pct(s9_o2,  s9_total),
        inlet_so3_pct=_pct(s9_so3, s9_total),
        inlet_n2_pct =_pct(s9_n2,  s9_total),
        inlet_total_scfm=s9_total,
        diameter_ft=converter_diam_ft,
        catalyst_volume_liters=catalyst_vol_liters,
        catalyst_name=catalyst_name,
        barometric_psia=barometric_psia,
    )
    p1_out = p1_result["outlet"]

    # ── Step 7: Converter Pass 2 (after inter-bed cooling) ────────────────
    p2_total = p1_out["TOTAL"]
    p2_result = simulate_pass(
        inlet_T_C=_PASS2_INLET_T_C,
        inlet_P_inwc=p1_out["PRESSURE"],
        inlet_so2_pct=_pct(p1_out["SO2"], p2_total),
        inlet_o2_pct =_pct(p1_out["O2"],  p2_total),
        inlet_so3_pct=_pct(p1_out["SO3"], p2_total),
        inlet_n2_pct =_pct(p1_out["N2"],  p2_total),
        inlet_total_scfm=p2_total,
        diameter_ft=converter_diam_ft,
        catalyst_volume_liters=catalyst_vol_liters,
        catalyst_name=catalyst_name,
        barometric_psia=barometric_psia,
    )
    p2_out = p2_result["outlet"]

    # ── Step 8: Converter Pass 3 (after inter-bed cooling) ────────────────
    p3_total = p2_out["TOTAL"]
    p3_result = simulate_pass(
        inlet_T_C=_PASS3_INLET_T_C,
        inlet_P_inwc=p2_out["PRESSURE"],
        inlet_so2_pct=_pct(p2_out["SO2"], p3_total),
        inlet_o2_pct =_pct(p2_out["O2"],  p3_total),
        inlet_so3_pct=_pct(p2_out["SO3"], p3_total),
        inlet_n2_pct =_pct(p2_out["N2"],  p3_total),
        inlet_total_scfm=p3_total,
        diameter_ft=converter_diam_ft,
        catalyst_volume_liters=catalyst_vol_liters,
        catalyst_name=catalyst_name,
        barometric_psia=barometric_psia,
    )
    p3_out = p3_result["outlet"]

    # ── Step 9: IPAT — removes SO3, cools gas to ~75 °F ───────────────────
    ipat_result = ipat_calc({
        "x_H2SO4_AI0": ipat_acid_x_h2so4,
        "x_H2O_AI0":   1.0 - ipat_acid_x_h2so4,
        "Flow_AI0":    ipat_acid_flow_gpm,
        "Temp_AI0":    180.0,
        "SO2_GI0":    p3_out["SO2"],
        "SO3_GI0":    p3_out["SO3"],
        "O2_GI0":     p3_out["O2"],
        "N2_GI0":     p3_out["N2"],
        "H2O_GI0":    p3_out.get("H2O", 0.0),
        "H2SO4_GI0":  p3_out.get("H2SO4", 0.0),
        "TOTAL_GI0":  p3_out["TOTAL"],
        "PRESSURE_GI0":    p3_out["PRESSURE"],
        "TEMPERATURE_GI0": _c_to_f(p3_out["TEMPERATURE_C"]),
        "Tower_Diameter_ft": 28.0,
        "Packing_Depth_ft":  12.0,
        "dP_BME_inWC":        6.0,
        "Barometric_P_psia": barometric_psia,
    })

    # Gas after IPAT (SO3 absorbed, cooled to 75 °F)
    ipat_so2   = ipat_result.get("SO2_GI1",   p3_out["SO2"])
    ipat_so3   = ipat_result.get("SO3_GI1",   0.0)
    ipat_o2    = ipat_result.get("O2_GI1",    p3_out["O2"])
    ipat_n2    = ipat_result.get("N2_GI1",    p3_out["N2"])
    ipat_total = ipat_result.get("TOTAL_GI1", p3_out["TOTAL"])
    ipat_press = ipat_result.get("PRESSURE_GI1", p3_out["PRESSURE"] - 6.0)

    stream17 = {
        "SO2": ipat_so2, "SO3": ipat_so3,
        "O2":  ipat_o2,  "N2":  ipat_n2,
        "TOTAL": ipat_total,
        "PRESSURE": ipat_press,
        "TEMPERATURE_F": 75.0,
    }

    # ── Step 10: Converter Pass 4 (gas reheated to ~420 °C) ───────────────
    p4_total = ipat_total
    p4_result = simulate_pass(
        inlet_T_C=_PASS4_INLET_T_C,
        inlet_P_inwc=ipat_press,
        inlet_so2_pct=_pct(ipat_so2,   p4_total),
        inlet_o2_pct =_pct(ipat_o2,    p4_total),
        inlet_so3_pct=_pct(ipat_so3,   p4_total),
        inlet_n2_pct =_pct(ipat_n2,    p4_total),
        inlet_total_scfm=p4_total,
        diameter_ft=converter_diam_ft,
        catalyst_volume_liters=catalyst_vol_liters,
        catalyst_name=catalyst_name,
        barometric_psia=barometric_psia,
    )
    p4_out = p4_result["outlet"]

    # ── Step 11: FAT ───────────────────────────────────────────────────────
    fat_result = fat_calc({
        "x_H2SO4_AF0": fat_acid_x_h2so4,
        "x_H2O_AF0":   1.0 - fat_acid_x_h2so4,
        "Flow_AF0":    fat_acid_flow_gpm,
        "Temp_AF0":    180.0,
        "SO2_GF0":    p4_out["SO2"],
        "SO3_GF0":    p4_out["SO3"],
        "O2_GF0":     p4_out["O2"],
        "N2_GF0":     p4_out["N2"],
        "H2O_GF0":    p4_out.get("H2O", 0.0),
        "H2SO4_GF0":  p4_out.get("H2SO4", 0.0),
        "TOTAL_GF0":  p4_out["TOTAL"],
        "PRESSURE_GF0":    p4_out["PRESSURE"],
        "TEMPERATURE_GF0": _c_to_f(p4_out["TEMPERATURE_C"]),
        "Tower_Diameter_ft": 28.0,
        "Packing_Depth_ft":  12.0,
        "dP_BME_inWC":        6.0,
        "Barometric_P_psia": barometric_psia,
    })

    # ── KPIs ───────────────────────────────────────────────────────────────
    original_so2 = stream5["scfm_so2"]
    stack_so2    = fat_result.get("SO2_GF1", 0.0)
    overall_conv_pct = (
        100.0 * (1.0 - stack_so2 / original_so2) if original_so2 > 0 else 0.0
    )

    ipat_h2so4_lbhr = ipat_result.get("mass_h2so4_formed_lbhr", 0.0)
    fat_h2so4_lbhr  = fat_result.get("mass_h2so4_formed_lbhr",  0.0)
    acid_mtpd = ((ipat_h2so4_lbhr + fat_h2so4_lbhr) * 24.0) / 2204.62

    # Cumulative conversion through each pass (overall_conv_pct[-1] = exit)
    p1_conv = p1_result["overall_conv_pct"][-1]
    p2_conv = p2_result["overall_conv_pct"][-1]
    p3_conv = p3_result["overall_conv_pct"][-1]
    p4_conv = p4_result["overall_conv_pct"][-1]

    # ── Sensor Tags ────────────────────────────────────────────────────────
    # Keyed by full ISA/DCS tag number so the React front-end can read them
    # directly: sensorTags["1540-TI-4031"]
    sensor_tags: dict = {}

    # Ambient / Inlet Air Filter
    sensor_tags["1540-TI-5800"] = round(inlet_temp_F,                          1)
    sensor_tags["1540-PI-5801"] = round(stream2["pressure"],                   1)
    sensor_tags["1540-PDI-5801"] = round(filter_dp_inwc,                       1)

    # Main Compressor
    sensor_tags["1540-SIC-4030"] = round(compressor_rpm_pct,                   1)
    sensor_tags["1540-TI-4031"]  = round(comp_result.outlet_temp_F,            1)
    sensor_tags["1540-PI-4031"]  = round(comp_result.outlet_pressure_inwc,     1)
    sensor_tags["1540-FI-4030"]  = round(comp_result.standard_flow_scfm,       0)
    sensor_tags["1540-XI-4031"]  = round(comp_result.motor_power_MW,           3)

    # Sulfur System
    sensor_tags["1530-FIC-2602"] = round(sulfur_flow_sp_gpm,                   1)
    sensor_tags["1530-TI-2601"]  = round(sulfur_temp_F,                        1)
    sensor_tags["1530-ZIC-2602"] = round(
        sulfur_result.get("valve_position_pct",
            sulfur_result.get("valve_position_percent", 0.0)),                  1)

    # Sulfur Furnace
    sensor_tags["1540-TI-3001"]  = round(stream5["T_f"],                       1)
    sensor_tags["1540-PI-3001"]  = round(stream5["P_inwc"],                    1)
    sensor_tags["1540-AI-3001"]  = round(stream5["pct_so2"],                   2)
    sensor_tags["1540-QI-3001"]  = round(
        furnace_result["heat_release_btu_hr"] / 1e6,                           2)

    # WHB / Jug Valve
    sensor_tags["1540-TI-3050"]  = round(jug_result["TEMPERATURE_GB1"],        1)
    sensor_tags["1540-ZIC-3051"] = round(jug_open_pct,                         1)
    sensor_tags["1540-TI-4001"]  = round(jug_result["TEMPERATURE_GP10"],       1)

    # Converter Passes — outlet temperatures
    sensor_tags["1540-TI-4010"]  = round(_c_to_f(p1_result["temps_C"][-1]),    1)
    sensor_tags["1540-TI-4020"]  = round(_c_to_f(p2_result["temps_C"][-1]),    1)
    sensor_tags["1540-TI-4030"]  = round(_c_to_f(p3_result["temps_C"][-1]),    1)
    sensor_tags["1540-TI-4040"]  = round(_c_to_f(p4_result["temps_C"][-1]),    1)

    # Converter Passes — cumulative SO2 conversion (%)
    sensor_tags["1540-AI-4001"]  = round(p1_conv,                              2)
    sensor_tags["1540-AI-4002"]  = round(p2_conv,                              2)
    sensor_tags["1540-AI-4003"]  = round(p3_conv,                              2)
    sensor_tags["1540-AI-4004"]  = round(p4_conv,                              2)

    # IPAT
    sensor_tags["1540-TI-5001"]  = round(ipat_result.get("Temp_AI1",  0.0),   1)
    sensor_tags["1540-FI-5001"]  = round(ipat_result.get("Flow_AI1",  0.0),   1)

    # FAT
    sensor_tags["1540-TI-5101"]  = round(fat_result.get("Temp_AF1",  0.0),    1)
    sensor_tags["1540-FI-5101"]  = round(fat_result.get("Flow_AF1",  0.0),    1)

    # ── KPI tags (readable by name on L1 overview) ─────────────────────────
    sensor_tags["KPI_SO2_PCT"]              = round(stream5["pct_so2"],         2)
    sensor_tags["KPI_OVERALL_CONV_PCT"]     = round(overall_conv_pct,           2)
    sensor_tags["KPI_ACID_PRODUCTION_MTPD"] = round(acid_mtpd,                  1)
    sensor_tags["KPI_FURNACE_TEMP_F"]       = round(stream5["T_f"],             1)
    sensor_tags["KPI_COMPRESSOR_POWER_MW"]  = round(comp_result.motor_power_MW, 3)
    sensor_tags["KPI_SULFUR_FLOW_GPM"]      = round(sulfur_flow_sp_gpm,         1)
    sensor_tags["KPI_PASS1_CONV_PCT"]       = round(p1_conv,                    2)
    sensor_tags["KPI_PASS2_CONV_PCT"]       = round(p2_conv,                    2)
    sensor_tags["KPI_PASS3_CONV_PCT"]       = round(p3_conv,                    2)
    sensor_tags["KPI_PASS4_CONV_PCT"]       = round(p4_conv,                    2)

    # ── Numbered streams dict ──────────────────────────────────────────────
    streams = {
        "1":  stream1,                   # Ambient
        "2":  stream2,                   # Filter outlet
        "4":  stream4,                   # Compressor outlet
        "5":  stream5,                   # Furnace outlet
        "6":  stream6,                   # Downstream of furnace
        "9":  stream9,                   # Pass 1 inlet (GP10)
        "11": p1_result["inlet"],        # Pass 1 inlet (by stream number)
        "12": p1_result["outlet"],       # Pass 1 outlet
        "13": p2_result["inlet"],        # Pass 2 inlet
        "14": p2_result["outlet"],       # Pass 2 outlet
        "15": p3_result["inlet"],        # Pass 3 inlet
        "16": p3_result["outlet"],       # Pass 3 outlet
        "17": stream17,                  # IPAT gas outlet
        "19": p4_result["inlet"],        # Pass 4 inlet
        "20": p4_result["outlet"],       # Pass 4 outlet
    }

    # ── Assemble result ────────────────────────────────────────────────────
    return {
        "success": True,
        "sensor_tags": sensor_tags,
        "streams": streams,
        "unit_operations": {
            "inlet_air_filter": {
                "inlet":  stream1,
                "outlet": stream2,
                "filter_dp_inwc": filter_dp_inwc,
            },
            "compressor":     comp_dict,
            "sulfur_system":  sulfur_result,
            "furnace":        furnace_result,
            "jug_valve_whb":  jug_result,
            "pass1":          p1_result,
            "pass2":          p2_result,
            "pass3":          p3_result,
            "ipat":           ipat_result,
            "pass4":          p4_result,
            "fat":            fat_result,
        },
        "summary": {
            "compressor_rpm_pct":           round(compressor_rpm_pct, 1),
            "compressor_rpm":               round(rpms, 0),
            "sulfur_flow_sp_gpm":           round(sulfur_flow_sp_gpm, 1),
            "sulfur_flow_achieved_gpm":     round(
                sulfur_result.get("flow_gpm",
                    sulfur_result.get("Flow_gpm", sulfur_flow_sp_gpm)), 1),
            "air_scfm":                     round(air_scfm, 0),
            "so2_pct_furnace_outlet":       round(stream5["pct_so2"], 2),
            "furnace_outlet_temp_F":        round(stream5["T_f"], 1),
            "pass1_conv_pct":               round(p1_conv, 2),
            "pass2_conv_pct":               round(p2_conv, 2),
            "pass3_conv_pct":               round(p3_conv, 2),
            "pass4_conv_pct":               round(p4_conv, 2),
            "overall_conv_pct":             round(overall_conv_pct, 2),
            "acid_production_mtpd":         round(acid_mtpd, 1),
            "compressor_power_MW":          round(comp_result.motor_power_MW, 3),
            # KPICard inputs — molar flows for stack gas and sulfur lb/min
            "sulfur_flow_lb_min":           round(sulfur_mass_klb_hr * 1000.0 / 60.0, 1),
            "stack_mol_so2_hr":             round(fat_result.get("SO2_GF1", 0.0) * 60.0 / 379.48, 3),
            "stack_mol_so3_hr":             round(fat_result.get("SO3_GF1", 0.0) * 60.0 / 379.48, 3),
            "stack_mol_n2_hr":              round(fat_result.get("N2_GF1",  0.0) * 60.0 / 379.48, 1),
        },
    }


# ---------------------------------------------------------------------------
# Entry point — reads JSON from stdin, writes JSON to stdout
# ---------------------------------------------------------------------------

def main():
    try:
        raw = sys.stdin.read().strip()
        inp = json.loads(raw) if raw else {}
        result = run_plant(inp)
        print(json.dumps(result, indent=2, default=str))
    except Exception as exc:
        import traceback
        print(json.dumps({
            "success": False,
            "error":   str(exc),
            "traceback": traceback.format_exc(),
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
