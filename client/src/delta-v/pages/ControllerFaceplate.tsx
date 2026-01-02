import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ControllerFaceplate } from '@/delta-v/components/faceplate/ControllerFaceplate';
import { SecondaryControllerFaceplate } from '@/delta-v/components/faceplate/SecondaryControllerFaceplate';
import { defaultControllerData, type ControllerData } from '@/delta-v/types/controller';
import { 
  defaultSecondaryConfig, 
  defaultSecondaryData, 
  type SecondaryControllerData,
  type SecondaryControllerConfig 
} from '@/delta-v/types/secondaryController';
import { cn } from '@/lib/utils';
import { ArrowLeft, Code, FileCode, Copy, Check, ChevronDown } from 'lucide-react';
import { useControllerSync } from '@/delta-v/contexts/ControllerSyncContext';
import { useControllerConfig } from '@/delta-v/contexts/ControllerConfigContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Python code templates - dynamic function that injects configuration values
const getPythonCodeTemplates = (config: SecondaryControllerConfig): Record<string, { description: string; code: string }> => ({
  'pid_controller.py': {
    description: 'Main PID control algorithm with gain, reset, and rate parameters',
    code: `"""
PID Controller - Main Control Algorithm
Implements a standard PID controller with anti-windup
Controller: ${config.TAGNAME}
"""

class PIDController:
    def __init__(self, kp=1.0, ki=0.1, kd=0.05, output_limits=(${config.OUT_LIM_LO}, ${config.OUT_LIM_HI})):
        self.kp = kp  # Proportional gain
        self.ki = ki  # Integral gain (1/reset time)
        self.kd = kd  # Derivative gain (rate time)
        self.output_limits = output_limits
        
        self._integral = 0.0
        self._last_error = 0.0
        self._last_pv = None
        
    def compute(self, setpoint: float, process_value: float, dt: float) -> float:
        """
        Compute PID output.
        
        Args:
            setpoint: Target value (SP)
            process_value: Current measured value (PV)
            dt: Time step in seconds
            
        Returns:
            Output percentage (${config.OUT_LIM_LO}-${config.OUT_LIM_HI}%)
        """
        error = setpoint - process_value
        
        # Proportional term
        p_term = self.kp * error
        
        # Integral term with anti-windup
        self._integral += error * dt
        i_term = self.ki * self._integral
        
        # Derivative term (on PV to avoid derivative kick)
        if self._last_pv is not None:
            d_term = -self.kd * (process_value - self._last_pv) / dt
        else:
            d_term = 0.0
        self._last_pv = process_value
        
        # Calculate output
        output = p_term + i_term + d_term
        
        # Clamp output and apply anti-windup
        output = max(self.output_limits[0], min(self.output_limits[1], output))
        
        return output
    
    def reset(self):
        """Reset controller state."""
        self._integral = 0.0
        self._last_error = 0.0
        self._last_pv = None


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    pid = PIDController(kp=2.0, ki=0.5, kd=0.1, output_limits=(${config.OUT_LIM_LO}, ${config.OUT_LIM_HI}))
    
    # Simulation loop
    sp = ${config.SP_LIM_HI}  # Setpoint (${config.EU})
    pv = ${config.PV_INIT_VAL}  # Initial process value (${config.EU})
    dt = 0.1   # 100ms time step
    
    for _ in range(100):
        output = pid.compute(sp, pv, dt)
        print(f"SP={sp:.1f}, PV={pv:.1f}, OUT={output:.1f}%")
        
        # Simulate process response (simplified)
        pv += (output - 50) * 0.05
`
  },
  'process_model.py': {
    description: 'Heat transfer and process dynamics simulation model',
    code: `"""
Process Model - Simulates thermal process dynamics
First-order plus dead-time (FOPDT) model
Controller: ${config.TAGNAME} - ${config.DESC}
"""

import math
from collections import deque

class ProcessModel:
    def __init__(self, 
                 gain=1.0, 
                 time_constant=30.0, 
                 dead_time=5.0,
                 noise_amplitude=0.1,
                 pv_range=(${config.PV_SCALE_LO}, ${config.PV_SCALE_HI})):
        """
        Initialize process model.
        
        Args:
            gain: Process gain (output change per input change)
            time_constant: Time constant in seconds (tau)
            dead_time: Dead time/delay in seconds
            noise_amplitude: Random noise amplitude
            pv_range: (min, max) for process value in ${config.EU}
        """
        self.gain = gain
        self.time_constant = time_constant
        self.dead_time = dead_time
        self.noise_amplitude = noise_amplitude
        self.pv_range = pv_range
        
        self._pv = ${config.PV_INIT_VAL}  # Initial process value (${config.EU})
        self._delay_buffer = deque()
        
    def update(self, controller_output: float, dt: float) -> float:
        """
        Update process model with controller output.
        
        Args:
            controller_output: Controller output (${config.OUT_LIM_LO}-${config.OUT_LIM_HI}%)
            dt: Time step in seconds
            
        Returns:
            New process value (${config.EU})
        """
        import random
        
        # Add to delay buffer
        self._delay_buffer.append((controller_output, dt))
        
        # Calculate total time in buffer
        total_time = sum(item[1] for item in self._delay_buffer)
        
        # Get delayed output
        if total_time >= self.dead_time:
            delayed_output, _ = self._delay_buffer.popleft()
        else:
            delayed_output = 50.0  # Default steady state
        
        # First-order response
        # dPV/dt = (K * u - PV) / tau
        target = self.gain * delayed_output
        dpv = (target - self._pv) / self.time_constant * dt
        
        self._pv += dpv
        
        # Clamp to range
        self._pv = max(self.pv_range[0], min(self.pv_range[1], self._pv))
        
        # Add noise
        noise = random.uniform(-self.noise_amplitude, self.noise_amplitude)
        
        return self._pv + noise
    
    @property
    def pv(self) -> float:
        return self._pv


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    process = ProcessModel(
        gain=1.5, 
        time_constant=20.0, 
        dead_time=3.0,
        pv_range=(${config.PV_SCALE_LO}, ${config.PV_SCALE_HI})
    )
    
    for t in range(100):
        output = 60.0  # Fixed controller output
        pv = process.update(output, dt=0.5)
        print(f"t={t*0.5:.1f}s, OUT={output:.1f}%, PV={pv:.2f} ${config.EU}")
`
  },
  'data_bridge.py': {
    description: 'WebSocket/HTTP bridge to update the UI via window.updateControllerData()',
    code: `"""
Data Bridge - Sends controller data to the web UI
Uses Selenium/PyAutoGUI or HTTP to update window.updateControllerData()
Controller: ${config.TAGNAME} - ${config.DESC}
"""

import json
import time
from typing import Optional

class DataBridge:
    def __init__(self, mode='selenium'):
        """
        Initialize data bridge.
        
        Args:
            mode: 'selenium' for browser automation, 'http' for REST API
        """
        self.mode = mode
        self._driver = None
        
    def connect_selenium(self, browser_url='http://localhost:5173'):
        """Connect to browser using Selenium."""
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        options = Options()
        options.add_argument('--headless')  # Run headless if needed
        
        self._driver = webdriver.Chrome(options=options)
        self._driver.get(browser_url)
        time.sleep(2)  # Wait for page load
        
    def update_controller(self, 
                          pv: float,
                          sp: float,
                          out: float,
                          mode: str = 'AUTO',
                          alarm_active: bool = False,
                          alarm_type: Optional[str] = None):
        """
        Send controller data to the UI.
        
        Args:
            pv: Process value (${config.PV_SCALE_LO}-${config.PV_SCALE_HI} ${config.EU})
            sp: Setpoint (${config.SP_LIM_LO}-${config.SP_LIM_HI} ${config.EU})
            out: Output percentage (${config.OUT_LIM_LO}-${config.OUT_LIM_HI}%)
            mode: Controller mode ('AUTO' or 'MAN')
            alarm_active: Whether alarm is active
            alarm_type: Alarm type if active
        """
        data = {
            'pv': round(pv, 2),
            'sp': round(sp, 2),
            'out': round(out, 2),
            'mode': mode,
            'alarmActive': alarm_active,
            'alarmType': alarm_type
        }
        
        if self.mode == 'selenium' and self._driver:
            script = f"window.updateControllerData({json.dumps(data)})"
            self._driver.execute_script(script)
        else:
            # HTTP mode - send to backend API
            import requests
            requests.post('http://localhost:8000/api/controller', json=data)
            
    def update_secondary(self,
                         pv: float,
                         sp: float,
                         tsp: float,
                         out_pct: float,
                         mode_auto: str = 'AUTO',
                         alarms: Optional[dict] = None):
        """Send secondary controller data to UI for ${config.TAGNAME}."""
        data = {
            'PV': round(pv, 2),
            'SP': round(sp, 2),
            'TSP': round(tsp, 2),
            'OUT_PCT': round(out_pct, 2),
            'MODE_AUTOMAN': mode_auto,
            **(alarms or {})
        }
        
        if self.mode == 'selenium' and self._driver:
            script = f"window.updateSecondaryControllerData({json.dumps(data)})"
            self._driver.execute_script(script)
            
    def disconnect(self):
        """Close browser connection."""
        if self._driver:
            self._driver.quit()
            self._driver = None


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    bridge = DataBridge(mode='selenium')
    bridge.connect_selenium()
    
    try:
        for i in range(50):
            pv = ${config.PV_SCALE_LO} + i * ((${config.PV_SCALE_HI} - ${config.PV_SCALE_LO}) / 50)
            bridge.update_controller(pv=pv, sp=${config.SP_LIM_HI}, out=65.0)
            time.sleep(0.2)
    finally:
        bridge.disconnect()
`
  },
  'alarm_handler.py': {
    description: 'Alarm detection, priority handling, and state management',
    code: `"""
Alarm Handler - Manages alarm states and priorities
Supports 6-tier alarm system (LL, L, DL, DH, H, HH)
Controller: ${config.TAGNAME} - ${config.DESC}
"""

from dataclasses import dataclass
from enum import Enum
from typing import Callable, Optional
import time

class AlarmPriority(Enum):
    CRITICAL = 1  # HH, LL
    HIGH = 2      # H, L
    MEDIUM = 3    # DH, DL
    LOW = 4       # Informational

@dataclass
class AlarmLimit:
    name: str
    limit: float
    priority: AlarmPriority
    is_high: bool  # True for high alarms, False for low alarms
    is_deviation: bool = False  # True for deviation alarms (DL, DH)

class AlarmHandler:
    def __init__(self, limits: dict):
        """
        Initialize alarm handler.
        
        Args:
            limits: Dict with alarm limits {LL, L, DL, DH, H, HH}
        """
        self.limits = {
            'LL': AlarmLimit('LL', limits.get('LL', ${config.ALM_LL_LIM}), AlarmPriority.CRITICAL, False),
            'L': AlarmLimit('L', limits.get('L', ${config.ALM_L_LIM}), AlarmPriority.HIGH, False),
            'DL': AlarmLimit('DL', limits.get('DL', ${config.ALM_DL_LIM}), AlarmPriority.MEDIUM, False, True),
            'DH': AlarmLimit('DH', limits.get('DH', ${config.ALM_DH_LIM}), AlarmPriority.MEDIUM, True, True),
            'H': AlarmLimit('H', limits.get('H', ${config.ALM_H_LIM}), AlarmPriority.HIGH, True),
            'HH': AlarmLimit('HH', limits.get('HH', ${config.ALM_HH_LIM}), AlarmPriority.CRITICAL, True),
        }
        
        self._active_alarms: dict[str, float] = {}  # alarm_name -> activation_time
        self._acknowledged: set[str] = set()
        self._callbacks: list[Callable] = []
        
    def check_alarms(self, pv: float, sp: float) -> dict[str, bool]:
        """
        Check all alarm conditions.
        
        Args:
            pv: Process value (${config.EU})
            sp: Setpoint (for deviation alarms)
            
        Returns:
            Dict of alarm states {alarm_name: is_active}
        """
        deviation = pv - sp
        results = {}
        
        for name, limit in self.limits.items():
            if limit.is_deviation:
                # Deviation alarm
                if limit.is_high:
                    active = deviation >= limit.limit
                else:
                    active = deviation <= limit.limit
            else:
                # Absolute alarm
                if limit.is_high:
                    active = pv >= limit.limit
                else:
                    active = pv <= limit.limit
                    
            results[f'ALM_{name}_ACT'] = active
            
            # Track activation time
            if active and name not in self._active_alarms:
                self._active_alarms[name] = time.time()
                self._trigger_callbacks(name, True)
            elif not active and name in self._active_alarms:
                del self._active_alarms[name]
                self._acknowledged.discard(name)
                self._trigger_callbacks(name, False)
                
        return results
    
    def acknowledge(self, alarm_name: str):
        """Acknowledge an active alarm."""
        if alarm_name in self._active_alarms:
            self._acknowledged.add(alarm_name)
            
    def acknowledge_all(self):
        """Acknowledge all active alarms."""
        self._acknowledged.update(self._active_alarms.keys())
        
    def get_highest_priority(self) -> Optional[str]:
        """Get the highest priority active alarm."""
        active = [(name, self.limits[name].priority.value) 
                  for name in self._active_alarms.keys()]
        if not active:
            return None
        return min(active, key=lambda x: x[1])[0]
    
    def on_alarm_change(self, callback: Callable[[str, bool], None]):
        """Register callback for alarm state changes."""
        self._callbacks.append(callback)
        
    def _trigger_callbacks(self, name: str, active: bool):
        for cb in self._callbacks:
            cb(name, active)


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    handler = AlarmHandler({
        'LL': ${config.ALM_LL_LIM}, 'L': ${config.ALM_L_LIM}, 'DL': ${config.ALM_DL_LIM}, 
        'DH': ${config.ALM_DH_LIM}, 'H': ${config.ALM_H_LIM}, 'HH': ${config.ALM_HH_LIM}
    })
    
    handler.on_alarm_change(lambda n, a: print(f"Alarm {n}: {'ACTIVE' if a else 'CLEAR'}"))
    
    # Simulate PV changes for ${config.TAGNAME}
    for pv in [${config.PV_INIT_VAL}, ${config.ALM_H_LIM}, ${config.ALM_HH_LIM}, ${config.PV_INIT_VAL}, ${config.ALM_L_LIM}, ${config.ALM_LL_LIM}]:
        states = handler.check_alarms(pv, sp=${config.SP_LIM_HI})
        print(f"PV={pv} ${config.EU}, Highest={handler.get_highest_priority()}")
`
  },
  'sp_ramping.py': {
    description: 'Setpoint ramping with rate limiting and TSP tracking',
    code: `"""
Setpoint Ramping - Target SP ramping with rate limits
Implements smooth setpoint transitions
Controller: ${config.TAGNAME} - ${config.DESC}
"""

from dataclasses import dataclass
from typing import Optional

@dataclass
class RampConfig:
    ramp_rate: float = ${config.SP_RAMP_RATE}  # ${config.EU} per second
    ramp_enabled: bool = ${config.SP_RAMP_EN ? 'True' : 'False'}
    min_sp: float = ${config.SP_LIM_LO}
    max_sp: float = ${config.SP_LIM_HI}

class SetpointRamper:
    def __init__(self, config: Optional[RampConfig] = None):
        """
        Initialize setpoint ramper.
        
        Args:
            config: Ramp configuration
        """
        self.config = config or RampConfig()
        self._current_sp = ${config.PV_INIT_VAL}
        self._target_sp = ${config.PV_INIT_VAL}
        self._is_ramping = False
        
    @property
    def sp(self) -> float:
        """Current setpoint value (${config.EU})."""
        return self._current_sp
    
    @property
    def tsp(self) -> float:
        """Target setpoint value (${config.EU})."""
        return self._target_sp
    
    @property
    def is_ramping(self) -> bool:
        """Whether currently ramping to target."""
        return self._is_ramping
        
    def set_target(self, target: float):
        """
        Set new target setpoint.
        
        Args:
            target: New target setpoint value (${config.EU})
        """
        # Clamp to limits
        self._target_sp = max(self.config.min_sp, 
                              min(self.config.max_sp, target))
        
        if not self.config.ramp_enabled:
            self._current_sp = self._target_sp
            self._is_ramping = False
        else:
            self._is_ramping = abs(self._target_sp - self._current_sp) > 0.01
            
    def update(self, dt: float) -> float:
        """
        Update ramping calculation.
        
        Args:
            dt: Time step in seconds
            
        Returns:
            Current setpoint value (${config.EU})
        """
        if not self._is_ramping or not self.config.ramp_enabled:
            return self._current_sp
            
        max_change = self.config.ramp_rate * dt
        diff = self._target_sp - self._current_sp
        
        if abs(diff) <= max_change:
            self._current_sp = self._target_sp
            self._is_ramping = False
        elif diff > 0:
            self._current_sp += max_change
        else:
            self._current_sp -= max_change
            
        return self._current_sp
    
    def cancel_ramp(self):
        """Cancel current ramp and hold at current SP."""
        self._target_sp = self._current_sp
        self._is_ramping = False
        
    def jump_to_target(self):
        """Immediately jump to target SP (bypass ramping)."""
        self._current_sp = self._target_sp
        self._is_ramping = False


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    ramper = SetpointRamper(RampConfig(
        ramp_rate=${config.SP_RAMP_RATE},
        ramp_enabled=${config.SP_RAMP_EN ? 'True' : 'False'},
        min_sp=${config.SP_LIM_LO},
        max_sp=${config.SP_LIM_HI}
    ))
    ramper._current_sp = ${config.PV_INIT_VAL}
    ramper.set_target(${config.SP_LIM_HI})
    
    print(f"Ramping from {ramper.sp:.1f} to {ramper.tsp:.1f} ${config.EU}")
    
    t = 0
    while ramper.is_ramping:
        sp = ramper.update(dt=0.5)
        t += 0.5
        print(f"t={t:.1f}s: SP={sp:.2f} ${config.EU}, TSP={ramper.tsp:.1f} ${config.EU}")
`
  },
  'interlock_logic.py': {
    description: 'Safety interlock trigger and reset logic',
    code: `"""
Interlock Logic - Safety interlock handling
Triggers protective actions on critical alarms
Controller: ${config.TAGNAME} - ${config.DESC}
"""

from enum import Enum
from typing import Callable, Optional
from dataclasses import dataclass

class InterlockAction(Enum):
    CLOSE = "CLOSE"   # Close valve/output to ${config.OUT_LIM_LO}%
    OPEN = "OPEN"     # Open valve/output to ${config.OUT_LIM_HI}%
    HOLD = "HOLD"     # Hold current output

class InterlockTrigger(Enum):
    HH = "HH"  # High-High alarm (>= ${config.ALM_HH_LIM} ${config.EU})
    LL = "LL"  # Low-Low alarm (<= ${config.ALM_LL_LIM} ${config.EU})

@dataclass
class InterlockConfig:
    hh_enabled: bool = ${config.INTLK_HH_EN ? 'True' : 'False'}
    ll_enabled: bool = ${config.INTLK_LL_EN ? 'True' : 'False'}
    action: InterlockAction = InterlockAction.${config.INTLK_ACTION}
    requires_manual_reset: bool = True

class InterlockHandler:
    def __init__(self, config: Optional[InterlockConfig] = None):
        """
        Initialize interlock handler.
        
        Args:
            config: Interlock configuration
        """
        self.config = config or InterlockConfig()
        self._triggered = False
        self._trigger_source: Optional[InterlockTrigger] = None
        self._held_output: Optional[float] = None
        self._callbacks: list[Callable] = []
        
    @property
    def is_triggered(self) -> bool:
        return self._triggered
    
    @property
    def trigger_source(self) -> Optional[str]:
        return self._trigger_source.value if self._trigger_source else None
    
    def check_and_trigger(self, 
                          alm_hh: bool, 
                          alm_ll: bool,
                          current_output: float) -> Optional[float]:
        """
        Check interlock conditions and trigger if needed.
        
        Args:
            alm_hh: HH alarm state (PV >= ${config.ALM_HH_LIM} ${config.EU})
            alm_ll: LL alarm state (PV <= ${config.ALM_LL_LIM} ${config.EU})
            current_output: Current controller output (%)
            
        Returns:
            New output value if interlock triggered, None otherwise
        """
        if self._triggered:
            return self._get_interlock_output(current_output)
            
        # Check HH trigger
        if self.config.hh_enabled and alm_hh:
            self._trigger(InterlockTrigger.HH, current_output)
            return self._get_interlock_output(current_output)
            
        # Check LL trigger
        if self.config.ll_enabled and alm_ll:
            self._trigger(InterlockTrigger.LL, current_output)
            return self._get_interlock_output(current_output)
            
        return None
    
    def _trigger(self, source: InterlockTrigger, output: float):
        """Trigger the interlock."""
        self._triggered = True
        self._trigger_source = source
        self._held_output = output
        
        for cb in self._callbacks:
            cb(True, source.value)
            
        print(f"INTERLOCK TRIGGERED: {source.value}")
    
    def _get_interlock_output(self, current: float) -> float:
        """Get output value based on interlock action."""
        if self.config.action == InterlockAction.CLOSE:
            return ${config.OUT_LIM_LO}
        elif self.config.action == InterlockAction.OPEN:
            return ${config.OUT_LIM_HI}
        else:  # HOLD
            return self._held_output or current
            
    def reset(self, alm_hh: bool = False, alm_ll: bool = False) -> bool:
        """
        Attempt to reset the interlock.
        
        Args:
            alm_hh: Current HH alarm state
            alm_ll: Current LL alarm state
            
        Returns:
            True if reset successful, False if conditions prevent reset
        """
        if not self._triggered:
            return True
            
        # Check if triggering condition still exists
        if self._trigger_source == InterlockTrigger.HH and alm_hh:
            print("Cannot reset: HH condition still active")
            return False
        if self._trigger_source == InterlockTrigger.LL and alm_ll:
            print("Cannot reset: LL condition still active")
            return False
            
        self._triggered = False
        self._trigger_source = None
        self._held_output = None
        
        for cb in self._callbacks:
            cb(False, None)
            
        print("INTERLOCK RESET")
        return True
    
    def on_interlock_change(self, callback: Callable[[bool, Optional[str]], None]):
        """Register callback for interlock state changes."""
        self._callbacks.append(callback)


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    handler = InterlockHandler(InterlockConfig(
        hh_enabled=${config.INTLK_HH_EN ? 'True' : 'False'},
        ll_enabled=${config.INTLK_LL_EN ? 'True' : 'False'},
        action=InterlockAction.${config.INTLK_ACTION}
    ))
    
    # Simulate alarm conditions
    output = handler.check_and_trigger(alm_hh=False, alm_ll=False, current_output=50.0)
    print(f"Normal: output={output}")
    
    output = handler.check_and_trigger(alm_hh=True, alm_ll=False, current_output=50.0)
    print(f"HH Alarm (>= ${config.ALM_HH_LIM} ${config.EU}): output={output}")
    
    # Try reset while condition active
    handler.reset(alm_hh=True)
    
    # Reset after condition clears
    handler.reset(alm_hh=False)
`
  },
  'config_manager.py': {
    description: 'Load and save controller configuration to JSON files',
    code: `"""
Config Manager - Controller configuration persistence
Saves and loads controller parameters from JSON files
Controller: ${config.TAGNAME} - ${config.DESC}
"""

import json
import os
from dataclasses import dataclass, asdict, field
from typing import Optional
from pathlib import Path

@dataclass
class ControllerConfig:
    # Identification
    tag: str = "${config.TAGNAME}"
    description: str = "${config.DESC}"
    unit: str = "${config.EU}"
    
    # PID Tuning
    kp: float = 2.0
    ki: float = 0.5
    kd: float = 0.1
    
    # Limits
    pv_low: float = ${config.PV_SCALE_LO}
    pv_high: float = ${config.PV_SCALE_HI}
    sp_low: float = ${config.SP_LIM_LO}
    sp_high: float = ${config.SP_LIM_HI}
    out_low: float = ${config.OUT_LIM_LO}
    out_high: float = ${config.OUT_LIM_HI}
    
    # Alarm Limits
    alm_ll: float = ${config.ALM_LL_LIM}
    alm_l: float = ${config.ALM_L_LIM}
    alm_dl: float = ${config.ALM_DL_LIM}
    alm_dh: float = ${config.ALM_DH_LIM}
    alm_h: float = ${config.ALM_H_LIM}
    alm_hh: float = ${config.ALM_HH_LIM}
    
    # Ramping
    ramp_enabled: bool = ${config.SP_RAMP_EN ? 'True' : 'False'}
    ramp_rate: float = ${config.SP_RAMP_RATE}
    
    # Interlock
    interlock_hh_enabled: bool = ${config.INTLK_HH_EN ? 'True' : 'False'}
    interlock_ll_enabled: bool = ${config.INTLK_LL_EN ? 'True' : 'False'}
    interlock_action: str = "${config.INTLK_ACTION}"
    
    # Initial values
    initial_pv: float = ${config.PV_INIT_VAL}
    initial_sp: float = ${config.SP_LIM_HI}
    initial_out: float = 50.0
    initial_mode: str = "AUTO"

class ConfigManager:
    def __init__(self, config_dir: str = "./configs"):
        """
        Initialize config manager.
        
        Args:
            config_dir: Directory to store config files
        """
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
    def _get_path(self, controller_id: str) -> Path:
        """Get config file path for a controller."""
        return self.config_dir / f"{controller_id}.json"
    
    def save(self, controller_id: str, config: ControllerConfig) -> bool:
        """
        Save controller configuration.
        
        Args:
            controller_id: Unique controller identifier
            config: Configuration to save
            
        Returns:
            True if successful
        """
        try:
            path = self._get_path(controller_id)
            with open(path, 'w') as f:
                json.dump(asdict(config), f, indent=2)
            print(f"Config saved: {path}")
            return True
        except Exception as e:
            print(f"Error saving config: {e}")
            return False
            
    def load(self, controller_id: str) -> Optional[ControllerConfig]:
        """
        Load controller configuration.
        
        Args:
            controller_id: Unique controller identifier
            
        Returns:
            Configuration if found, None otherwise
        """
        try:
            path = self._get_path(controller_id)
            if not path.exists():
                return None
            with open(path, 'r') as f:
                data = json.load(f)
            return ControllerConfig(**data)
        except Exception as e:
            print(f"Error loading config: {e}")
            return None
            
    def load_or_create(self, controller_id: str) -> ControllerConfig:
        """Load config or create new with defaults."""
        config = self.load(controller_id)
        if config is None:
            config = ControllerConfig(tag=controller_id)
            self.save(controller_id, config)
        return config
        
    def list_controllers(self) -> list[str]:
        """List all saved controller IDs."""
        return [p.stem for p in self.config_dir.glob("*.json")]
        
    def delete(self, controller_id: str) -> bool:
        """Delete a controller configuration."""
        try:
            path = self._get_path(controller_id)
            if path.exists():
                path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Error deleting config: {e}")
            return False


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    manager = ConfigManager()
    
    # Create and save config with current values
    config = ControllerConfig(
        tag="${config.TAGNAME}",
        description="${config.DESC}",
        alm_hh=${config.ALM_HH_LIM},
        alm_ll=${config.ALM_LL_LIM}
    )
    manager.save("${config.TAGNAME.replace(/-/g, '_')}", config)
    
    # Load config
    loaded = manager.load("${config.TAGNAME.replace(/-/g, '_')}")
    print(f"Loaded: {loaded}")
    
    # List all controllers
    print(f"Controllers: {manager.list_controllers()}")
`
  }
});

const ControllerFaceplatePage = () => {
  const activeControllerId = '1520-T-6622';
  const { state: syncState, updateSyncedSP, updateSyncedOUT, updateSyncedMode } = useControllerSync(activeControllerId);
  const { getControllerConfig, getControllerData } = useControllerConfig();
  const { toast } = useToast();
  
  // Python code dialog state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Load saved configuration from context
  const savedConfig = getControllerConfig(activeControllerId);
  
  // Primary Controller state
  const [controllerData, setControllerData] = useState<ControllerData>({
    ...defaultControllerData,
    instrumentTag: savedConfig.TAGNAME || defaultControllerData.instrumentTag,
    description: savedConfig.DESC || defaultControllerData.description,
    pvUnits: savedConfig.EU || defaultControllerData.pvUnits,
    pvRangeMin: savedConfig.PV_SCALE_LO ?? defaultControllerData.pvRangeMin,
    pvRangeMax: savedConfig.PV_SCALE_HI ?? defaultControllerData.pvRangeMax,
    pv: syncState.syncedPV,
    sp: syncState.syncedSP,
    out: syncState.syncedOUT,
  });
  
  // Secondary Controller state
  const [config, setConfig] = useState<SecondaryControllerConfig>(savedConfig);
  const [secondaryData, setSecondaryData] = useState<SecondaryControllerData>({
    ...defaultSecondaryData,
    PV: syncState.syncedPV,
    SP: syncState.syncedSP,
    OUT_PCT: syncState.syncedOUT,
  });
  
  // Sync config changes from Faceplate3F
  useEffect(() => {
    const savedConfig = getControllerConfig(activeControllerId);
    setConfig(savedConfig);
    setControllerData(prev => ({
      ...prev,
      instrumentTag: savedConfig.TAGNAME || defaultControllerData.instrumentTag,
      description: savedConfig.DESC || defaultControllerData.description,
      pvUnits: savedConfig.EU || defaultControllerData.pvUnits,
      pvRangeMin: savedConfig.PV_SCALE_LO ?? defaultControllerData.pvRangeMin,
      pvRangeMax: savedConfig.PV_SCALE_HI ?? defaultControllerData.pvRangeMax,
    }));
  }, [getControllerConfig]);
  
  // Derive alarm state from secondary controller alarms
  const hasRedAlarm = !secondaryData.PV_OK || secondaryData.ALM_LL_ACT || secondaryData.ALM_HH_ACT;
  const hasYellowAlarm = secondaryData.ALM_L_ACT || secondaryData.ALM_DL_ACT || 
                          secondaryData.ALM_DH_ACT || secondaryData.ALM_H_ACT;
  const primaryAlarmActive = hasRedAlarm || hasYellowAlarm;
  const primaryAlarmColor: 'red' | 'yellow' = hasRedAlarm ? 'red' : 'yellow';

  // Sync Primary Controller values from context and alarm state
  useEffect(() => {
    const interlockIsActive = secondaryData.ALM_HH_ACT || secondaryData.ALM_LL_ACT;
    setControllerData(prev => ({
      ...prev,
      pv: syncState.syncedPV,
      sp: syncState.syncedSP,
      out: syncState.syncedOUT,
      alarmActive: primaryAlarmActive,
      alarmColor: primaryAlarmColor,
      alarmType: hasRedAlarm ? 'HIHI' : (hasYellowAlarm ? 'HI' : undefined),
      mode: syncState.syncedMode,
      // Activate interlock when HH or LL alarm is active
      interlockActive: interlockIsActive,
      // Lock comes on when Interlock is active
      deviceLocked: interlockIsActive,
      // Hold state from config toggle
      holdActive: config.HOLD_ACTIVE ?? false,
      // Alarm limits for range bar coloring
      alarmLL: config.ALM_LL_LIM,
      alarmL: config.ALM_L_LIM,
      alarmH: config.ALM_H_LIM,
      alarmHH: config.ALM_HH_LIM,
      // Indicator visibility from config
      showHoldIndicator: config.SHOW_HOLD_INDICATOR,
      showOutputPathIndicator: config.SHOW_OUTPUT_PATH_INDICATOR,
      showInterlockIndicator: config.SHOW_INTERLOCK_INDICATOR,
      showInterlockDiamond: config.SHOW_INTERLOCK_DIAMOND_INDICATOR,
      showLockIndicator: config.SHOW_LOCK_INDICATOR,
    }));
  }, [syncState.syncedPV, syncState.syncedSP, syncState.syncedOUT, syncState.syncedMode, primaryAlarmActive, primaryAlarmColor, hasRedAlarm, hasYellowAlarm, config, secondaryData.ALM_HH_ACT, secondaryData.ALM_LL_ACT]);
  
  // Sync Secondary Controller values from context
  useEffect(() => {
    setSecondaryData(prev => {
      const newPV = syncState.syncedPV;
      const dev = newPV - syncState.syncedSP;
      
      return {
        ...prev,
        PV: newPV,
        SP: syncState.syncedSP,
        OUT_PCT: syncState.syncedOUT,
        ALM_LL_ACT: newPV <= config.ALM_LL_LIM,
        ALM_L_ACT: newPV <= config.ALM_L_LIM,
        ALM_DL_ACT: dev <= config.ALM_DL_LIM,
        ALM_DH_ACT: dev >= config.ALM_DH_LIM,
        ALM_H_ACT: newPV >= config.ALM_H_LIM,
        ALM_HH_ACT: newPV >= config.ALM_HH_LIM,
        PV_OK: !(newPV <= config.ALM_LL_LIM || newPV >= config.ALM_HH_LIM),
      };
    });
  }, [syncState.syncedPV, syncState.syncedSP, syncState.syncedOUT, config]);

  // Expose update functions for Python integration
  useEffect(() => {
    (window as any).updateControllerData = (newData: Partial<ControllerData>) => {
      setControllerData(prev => ({ ...prev, ...newData }));
    };
    (window as any).updateSecondaryControllerData = (newData: Partial<SecondaryControllerData>) => {
      setSecondaryData(prev => ({ ...prev, ...newData }));
    };
    
    return () => {
      delete (window as any).updateControllerData;
      delete (window as any).updateSecondaryControllerData;
    };
  }, []);

  // Secondary Controller handlers
  const handleModeChange = (mode: 'AUTO' | 'MAN') => {
    setSecondaryData(prev => ({ ...prev, MODE_AUTOMAN: mode }));
    updateSyncedMode(mode);
  };

  const handleRoutRcasChange = (mode: 'DA' | 'ROUT' | 'RCAS') => {
    setSecondaryData(prev => ({ ...prev, MODE_ROUTRCAS: mode }));
    // Sync RCAS/ROUT to Primary Controller for display
    if (mode === 'RCAS') {
      updateSyncedMode('RCAS');
    } else if (mode === 'ROUT') {
      updateSyncedMode('ROUT');
    }
  };

  const handleSpChange = (value: number) => {
    setSecondaryData(prev => ({ ...prev, TSP: value, SP: value }));
    updateSyncedSP(value);
  };

  const handleOutChange = (value: number) => {
    setSecondaryData(prev => ({ ...prev, OUT_PCT: value }));
    updateSyncedOUT(value);
  };

  const handleModelockOverrideChange = (active: boolean) => {
    setSecondaryData(prev => ({ ...prev, MODELOCK_OVERRIDE: active }));
  };

  const handleBypassChange = (active: boolean) => {
    setSecondaryData(prev => {
      // Check MAN mode using functional update to get current state
      const isManMode = prev.MODE_AUTOMAN === 'MAN';
      
      if (active && isManMode) {
        // Only sync BYPASS when activating AND in MAN mode
        updateSyncedMode('BYPASS');
      } else if (!active && isManMode) {
        // Restore MAN mode when deactivating BYPASS
        updateSyncedMode('MAN');
      }
      // If not in MAN mode, don't change synced mode
      
      return { ...prev, BYPASS_ACTIVE: active };
    });
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (!selectedFile) return;
    
    try {
      await navigator.clipboard.writeText(getPythonCodeTemplates(savedConfig)[selectedFile].code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: `${selectedFile} copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Open file in dialog
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    setDialogOpen(true);
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header with Back Button and Python Code Dropdown */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-card/50 active:scale-95"
            )}
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          {/* Python Code Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "gap-2 border-primary/30 hover:border-primary",
                  "bg-card/50 hover:bg-card"
                )}
              >
                <Code size={18} />
                Edit Python Code
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card border-border">
              {Object.entries(getPythonCodeTemplates(savedConfig)).map(([fileName, { description }]) => (
                <DropdownMenuItem
                  key={fileName}
                  onClick={() => handleFileSelect(fileName)}
                  className="flex items-start gap-2 py-2 cursor-pointer"
                >
                  <FileCode size={16} className="mt-0.5 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">{fileName}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-2 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            1520-T-6622 Temperature Controller Faceplate
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Industrial HMI Interface • Python Backend Ready
          </p>
        </header>

        <main className="flex flex-col items-center gap-10">
          {/* Primary Controller Section */}
          <section className="flex flex-col items-center">
            <p className="text-primary font-semibold text-lg mb-4">
              Primary Controller Faceplate
            </p>
            <ControllerFaceplate 
              data={controllerData}
              onSelect={() => console.log('Faceplate selected:', controllerData.instrumentTag)}
              isTransparent={config.TRANSPARENT_BG}
            />
          </section>

          {/* Secondary Controller Section */}
          <section className="flex flex-col items-center">
            <p className="text-primary font-semibold text-lg mb-4">
              Secondary Controller Faceplate
            </p>
            <SecondaryControllerFaceplate 
              data={secondaryData}
              config={config}
              controllerId={activeControllerId}
              onModeChange={handleModeChange}
              onRoutRcasChange={handleRoutRcasChange}
              onSpChange={handleSpChange}
              onOutChange={handleOutChange}
              onModelockOverrideChange={handleModelockOverrideChange}
              onBypassChange={handleBypassChange}
            />
          </section>
        </main>
      </div>

      {/* Python Code Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-primary">
              <FileCode size={20} />
              {selectedFile}
            </DialogTitle>
            <DialogDescription>
              {selectedFile && getPythonCodeTemplates(savedConfig)[selectedFile]?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 gap-1.5 z-10"
              onClick={handleCopyCode}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            
            <div className="rounded-lg overflow-auto max-h-[60vh] border border-slate-700">
              <SyntaxHighlighter
                language="python"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.5rem',
                }}
                showLineNumbers
              >
                {selectedFile ? getPythonCodeTemplates(savedConfig)[selectedFile]?.code : ''}
              </SyntaxHighlighter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ControllerFaceplatePage;
