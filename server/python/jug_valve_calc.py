# jug_valve_calc.py
# Calculation logic for Jug Valve (WHB hot-side bypass) simulation

def calculate_jug_valve_flows(
    furnace_outlet_scfm_dry: float,
    furnace_outlet_so2: float,
    furnace_outlet_so3: float,
    furnace_outlet_o2: float,
    furnace_outlet_n2: float,
    furnace_outlet_temp_f: float,
    furnace_outlet_press_inwc: float,
    jug_open_pct: float,
    positioner_open_pct: float,
    cv_max: float = 12500,
    u_value: float = 16.0,
    whb_area: float = 9800,
    baro_psia: float = 14.3
) -> dict:
    """
    Simplified static calculation for jug valve bypass around WHB.
    Returns dictionary with flow/pressure/temperature for each stream.
    """

    # Convert percentages to fractions
    jug_frac = jug_open_pct / 100.0
    pos_frac = positioner_open_pct / 100.0   # currently not heavily used

    # Total furnace outlet flow (dry basis from HMB stream 9)
    total_dry_scfm = furnace_outlet_scfm_dry

    # Flow split:
    # WHB In (GB0) = WHB Out (GB1) = the fraction of total that passes THROUGH the WHB
    # Jug Valve Inlet (GJV0) = Stream #5 – Stream #8A = total minus WHB flow (bypass)
    # When jug is more open → more bypasses WHB → less through WHB
    whb_flow_scfm = total_dry_scfm * (1.0 - jug_frac * 0.92)  # portion going through WHB
    jug_flow_scfm = total_dry_scfm - whb_flow_scfm             # bypass through jug valve

    # Pressure drop estimation (very approximate)
    # Less drop when jug valve is more open (lower resistance path)
    delta_p_inwc = 16.0 * (1 - jug_frac * 0.5)
    inlet_press_inwc = furnace_outlet_press_inwc
    whb_out_press_inwc = inlet_press_inwc - delta_p_inwc
    jug_out_press_inwc = whb_out_press_inwc   # same downstream header pressure

    # Temperature
    # WHB cools gas; jug bypass stays at furnace temp
    whb_out_temp_f = 705.0   # from HMB (WHB outlet temperature)
    jug_out_temp_f = furnace_outlet_temp_f
    # Positioner outlet (GPV1) carries the positioner-controlled portion of jug flow
    positioner_flow_scfm = jug_flow_scfm * pos_frac
    # Mixed downstream temperature (GP10 = WHB out + positioner outlet)
    mixed_flow_scfm = whb_flow_scfm + positioner_flow_scfm
    if mixed_flow_scfm > 0:
        mixed_temp_f = (whb_flow_scfm * whb_out_temp_f + positioner_flow_scfm * jug_out_temp_f) / mixed_flow_scfm
    else:
        mixed_temp_f = whb_out_temp_f

    # Composition scaling fractions
    so2_scfm = furnace_outlet_so2
    so3_scfm = furnace_outlet_so3
    o2_scfm  = furnace_outlet_o2
    n2_scfm  = furnace_outlet_n2
    h2o_scfm = 0.0   # dry basis

    # Build results dictionary matching GUI labels
    results = {}

    # Stream #5 – Furnace Outlet (GF1) – inlet to the system
    results["TOTAL_GF1"] = round(total_dry_scfm)
    results["SO2_GF1"]   = round(so2_scfm)
    results["SO3_GF1"]   = round(so3_scfm)
    results["O2_GF1"]    = round(o2_scfm)
    results["N2_GF1"]    = round(n2_scfm)
    results["H2O_GF1"]   = round(h2o_scfm)
    results["H2SO4_GF1"] = 0
    results["PRESSURE_GF1"] = round(inlet_press_inwc, 1)
    results["TEMPERATURE_GF1"] = round(furnace_outlet_temp_f)

    # Stream #6 – WHB Boiler In (GB0) = Stream #8A (same flow that enters and exits WHB)
    # GB0 carries only the WHB portion (not the full furnace outlet)
    whb_frac = whb_flow_scfm / total_dry_scfm if total_dry_scfm > 0 else 0
    results["TOTAL_GB0"] = round(whb_flow_scfm)
    results["SO2_GB0"]   = round(so2_scfm * whb_frac)
    results["SO3_GB0"]   = round(so3_scfm * whb_frac)
    results["O2_GB0"]    = round(o2_scfm  * whb_frac)
    results["N2_GB0"]    = round(n2_scfm  * whb_frac)
    results["H2O_GB0"]   = 0
    results["H2SO4_GB0"] = 0
    results["PRESSURE_GB0"] = round(inlet_press_inwc, 1)
    results["TEMPERATURE_GB0"] = round(furnace_outlet_temp_f)

    # Stream #7 – Jug Valve Inlet (GJV0) = Stream #5 – Stream #8A (bypass fraction)
    jug_frac_of_total = jug_flow_scfm / total_dry_scfm if total_dry_scfm > 0 else 0
    results["TOTAL_GJV0"] = round(jug_flow_scfm)
    results["SO2_GJV0"]   = round(so2_scfm * jug_frac_of_total)
    results["SO3_GJV0"]   = round(so3_scfm * jug_frac_of_total)
    results["O2_GJV0"]    = round(o2_scfm  * jug_frac_of_total)
    results["N2_GJV0"]    = round(n2_scfm  * jug_frac_of_total)
    results["H2O_GJV0"]   = 0
    results["H2SO4_GJV0"] = 0
    results["PRESSURE_GJV0"] = round(inlet_press_inwc, 1)
    results["TEMPERATURE_GJV0"] = round(furnace_outlet_temp_f)

    # Stream #8A – WHB Boiler Out (GB1) = Stream #6 (GB0) after heat exchange
    results["TOTAL_GB1"] = round(whb_flow_scfm)
    results["SO2_GB1"]   = round(so2_scfm * whb_frac)
    results["SO3_GB1"]   = round(so3_scfm * whb_frac)
    results["O2_GB1"]    = round(o2_scfm  * whb_frac)
    results["N2_GB1"]    = round(n2_scfm  * whb_frac)
    results["H2O_GB1"]   = 0
    results["H2SO4_GB1"] = 0
    results["PRESSURE_GB1"] = round(whb_out_press_inwc, 1)
    results["TEMPERATURE_GB1"] = round(whb_out_temp_f)

    # Stream #8B – Positioner Outlet (GPV1) = positioner-controlled portion of jug bypass
    pos_frac_of_total = positioner_flow_scfm / total_dry_scfm if total_dry_scfm > 0 else 0
    results["TOTAL_GPV1"] = round(positioner_flow_scfm)
    results["SO2_GPV1"]   = round(so2_scfm * pos_frac_of_total)
    results["SO3_GPV1"]   = round(so3_scfm * pos_frac_of_total)
    results["O2_GPV1"]    = round(o2_scfm  * pos_frac_of_total)
    results["N2_GPV1"]    = round(n2_scfm  * pos_frac_of_total)
    results["H2O_GPV1"]   = 0
    results["H2SO4_GPV1"] = 0
    results["PRESSURE_GPV1"] = round(jug_out_press_inwc, 1)
    results["TEMPERATURE_GPV1"] = round(jug_out_temp_f)

    # Stream #9 – Gas Pass 1 Inlet (GP10) = WHB Out (GB1) + Positioner Outlet (GPV1)
    gp10_flow = whb_flow_scfm + positioner_flow_scfm
    gp10_frac = gp10_flow / total_dry_scfm if total_dry_scfm > 0 else 0
    results["TOTAL_GP10"] = round(gp10_flow)
    results["SO2_GP10"]   = round(so2_scfm * gp10_frac)
    results["SO3_GP10"]   = round(so3_scfm * gp10_frac)
    results["O2_GP10"]    = round(o2_scfm  * gp10_frac)
    results["N2_GP10"]    = round(n2_scfm  * gp10_frac)
    results["H2O_GP10"]   = 0
    results["H2SO4_GP10"] = 0
    results["PRESSURE_GP10"] = round(whb_out_press_inwc, 1)
    results["TEMPERATURE_GP10"] = round(mixed_temp_f)

    return results


if __name__ == "__main__":
    import sys
    import json

    # Read input from stdin
    input_data = json.loads(sys.stdin.read())

    result = calculate_jug_valve_flows(
        furnace_outlet_scfm_dry=input_data.get("furnace_outlet_scfm_dry", 109697),
        furnace_outlet_so2=input_data.get("furnace_outlet_so2", 12401),
        furnace_outlet_so3=input_data.get("furnace_outlet_so3", 227),
        furnace_outlet_o2=input_data.get("furnace_outlet_o2", 10261),
        furnace_outlet_n2=input_data.get("furnace_outlet_n2", 86808),
        furnace_outlet_temp_f=input_data.get("furnace_outlet_temp_f", 2080),
        furnace_outlet_press_inwc=input_data.get("furnace_outlet_press_inwc", 196),
        jug_open_pct=input_data.get("jug_open_pct", 10),
        positioner_open_pct=input_data.get("positioner_open_pct", 100),
        cv_max=input_data.get("cv_max", 12500),
        u_value=input_data.get("u_value", 16.0),
        whb_area=input_data.get("whb_area", 9800),
        baro_psia=input_data.get("baro_psia", 14.3)
    )

    print(json.dumps(result))
