"""
Drying Tower Circuit - Hydraulic Solver
=========================================
Backend calculation script for acid cooler loop hydraulics.
Uses scipy.optimize.fsolve for solving the nonlinear system.
"""

import json
import sys
import numpy as np
from scipy.optimize import fsolve


def calc_cv_from_profile(cv_max, position, profile='equal_percentage', params=None):
    """
    Calculate effective Cv based on valve characteristic profile with custom parameters.
    
    Profiles with customizable equations:
    - quick_opening: y = a * x^b (power law, default a=100, b=0.5)
    - linear: y = m*x + b (linear, default m=100, b=0)
    - equal_percentage: y = (100/R) * R^(x/100) (rangeability formula, default R=50)
    
    The result is Cv_max * (y/100) where y is the % of max from the equation.
    """
    if position <= 0:
        return 0.001  # Small value to prevent division by zero
    if position >= 1:
        return cv_max
    
    # Default parameters if none provided
    if params is None:
        params = {}
    
    if profile == 'quick_opening':
        # y = a * x^b
        a = params.get('a', 100)
        b = params.get('b', 0.5)
        y_percent = a * (position ** b)
    elif profile == 'linear':
        # y = m*x + b
        m = params.get('m', 100)
        b = params.get('b', 0)
        y_percent = m * position + b
    elif profile == 'equal_percentage':
        # y = (100/R) * R^(x/100) where x is position as percentage (0-100)
        R = params.get('R', 50)
        x_percent = position * 100  # Convert 0-1 position to 0-100%
        y_percent = (100.0 / R) * (R ** (x_percent / 100.0))
    else:
        # Default to linear if unknown profile
        y_percent = 100 * position
    
    # Clamp y_percent to 0-100 range and calculate Cv
    y_percent = max(0, min(100, y_percent))
    return cv_max * (y_percent / 100.0)


def solve_system(fcv_pos, tcv_pos, acid_flow_final, cooler_k, pump_a, pump_b, pump_c,
                 elevation_diff, pipe_dp, cv_fcv_max, cv_tcv_max, fluid_sg, pump_inlet_head=2.0,
                 fcv_profile='equal_percentage', bypass_profile='equal_percentage',
                 fcv_params=None, bypass_params=None):
    """
    Solve the hydraulic system based on assumptions:
    - Valve Cv calculated based on selected characteristic profile.
    - Flow in m³/h, pressure in bar.
    - Cooler ΔP = cooler_k * flow_cooler**2
    - Pump discharge P = pump_a - pump_b * total_flow - pump_c * total_flow**2
    - dP_FCV calculated from Cv and flow.
    - Elevation converted to pressure: ΔP_elev = elevation_diff * fluid_sg * 0.0981 (bar/m assuming water-like)
    - Assumes P_final (outlet) is 0 or atmospheric for simplicity; adjust if needed.
    """
    if not (0 <= fcv_pos <= 1 and 0 <= tcv_pos <= 1):
        raise ValueError("Valve positions must be between 0 and 1.")

    # Convert elevation to pressure (bar, assuming g=9.81, rho=sg*1000 kg/m³)
    dp_elev = elevation_diff * fluid_sg * 0.0981  # Approximate bar per meter

    # Calculate Cv based on valve profile with custom parameters
    cv_fcv = calc_cv_from_profile(cv_fcv_max, fcv_pos, fcv_profile, fcv_params)
    cv_tcv = calc_cv_from_profile(cv_tcv_max, tcv_pos, bypass_profile, bypass_params)

    # Prevent division by zero
    if cv_fcv <= 0:
        raise ValueError("FCV Cv must be positive (FCV position > 0)")
    if cv_tcv <= 0:
        raise ValueError("TCV Cv must be positive (TCV position > 0)")

    def equations(vars):
        total_flow, dp_common = vars

        if dp_common < 0:
            return [1e6, 1e6]

        # Flow bypass = cv_tcv * sqrt(dp_common / sg)
        flow_bypass = cv_tcv * np.sqrt(dp_common / fluid_sg)

        # Flow cooler = total_flow - flow_bypass
        flow_cooler = total_flow - flow_bypass

        if flow_cooler < 0:
            return [1e6, 1e6]

        # dp_cooler = cooler_k * flow_cooler**2
        dp_cooler = cooler_k * flow_cooler**2

        eq1 = dp_cooler - dp_common  # Must equal

        # dp_fcv = total_flow**2 / cv_fcv**2 * fluid_sg  (standard liquid valve eq)
        dp_fcv = (total_flow / cv_fcv)**2 * fluid_sg

        # Total system dp = dp_common + dp_pipe + dp_elev + dp_fcv
        # Pump discharge pressure = pump curve = pump_a - pump_b*total_flow - pump_c*total_flow**2
        # Assuming P_final = 0, then pump_discharge_press = total_system_dp
        total_dp = dp_common + pipe_dp + dp_elev + dp_fcv

        eq2 = (pump_a - pump_b * total_flow - pump_c * total_flow**2) - total_dp

        return [eq1, eq2]

    # Initial guess
    guess = [acid_flow_final, 1.0]

    solution = fsolve(equations, guess, full_output=True)
    sol = solution[0]
    info = solution[1]

    total_flow, dp_common = sol

    # Ensure positive values
    if total_flow < 0 or dp_common < 0:
        raise ValueError("Solution resulted in negative flow or pressure")

    flow_bypass = cv_tcv * np.sqrt(dp_common / fluid_sg)
    flow_cooler = total_flow - flow_bypass

    dp_fcv = (total_flow / cv_fcv)**2 * fluid_sg

    pump_discharge_press = pump_a - pump_b * total_flow - pump_c * total_flow**2

    # Inlet pressure to bypass & cooler: after pump, before parallel split
    p_inlet_byp_cooler = pump_discharge_press

    # Outlet pressure bypass & cooler: p_out = p_inlet - dp_common
    p_out_byp_cooler = p_inlet_byp_cooler - dp_common

    results = {
        'pump_discharge_press': float(pump_discharge_press),
        'dp_bypass': float(dp_common),
        'dp_fcv': float(dp_fcv),
        'p_inlet_byp_cooler': float(p_inlet_byp_cooler),
        'p_out_byp_cooler': float(p_out_byp_cooler),
        'flow_bypass': float(flow_bypass),
        'flow_cooler': float(flow_cooler),
        'total_flow': float(total_flow),
        'cv_bypass': float(cv_tcv),
        'cv_fcv': float(cv_fcv)
    }

    return results


if __name__ == "__main__":
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())

    try:
        results = solve_system(
            fcv_pos=input_data['fcv_pos'],
            tcv_pos=input_data['tcv_pos'],
            acid_flow_final=input_data['acid_flow_final'],
            cooler_k=input_data['cooler_k'],
            pump_a=input_data['pump_a'],
            pump_b=input_data['pump_b'],
            pump_c=input_data['pump_c'],
            elevation_diff=input_data['elevation_diff'],
            pipe_dp=input_data['pipe_dp'],
            cv_fcv_max=input_data['cv_fcv_max'],
            cv_tcv_max=input_data['cv_tcv_max'],
            fluid_sg=input_data['fluid_sg'],
            pump_inlet_head=input_data.get('pump_inlet_head', 2.0),
            fcv_profile=input_data.get('fcv_profile', 'equal_percentage'),
            bypass_profile=input_data.get('bypass_profile', 'equal_percentage'),
            fcv_params=input_data.get('fcv_params'),
            bypass_params=input_data.get('bypass_params')
        )
        print(json.dumps({'success': True, 'results': results}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
