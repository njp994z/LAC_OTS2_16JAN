import { SecondaryControllerConfig } from '@/delta-v/types/secondaryController';

export type PythonTemplate = {
  description: string;
  code: string;
  relatedFaceplates: string[];
};

export const getPythonCodeTemplates = (config: SecondaryControllerConfig): Record<string, PythonTemplate> => ({
  'pid_controller.py': {
    description: 'Main PID control algorithm with gain, reset, and rate parameters',
    relatedFaceplates: ['3A', '3B'],
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
    relatedFaceplates: ['3A', '3D'],
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
    relatedFaceplates: ['3C'],
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
    relatedFaceplates: ['3E', '3F'],
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
        Initialize alarm handler with configured limits.
        
        Args:
            limits: Dict with alarm limits from Faceplate 3E
        """
        self.limits = {
            'LL': AlarmLimit('Low-Low', limits.get('LL', ${config.ALM_LL_LIM}), AlarmPriority.CRITICAL, False),
            'L': AlarmLimit('Low', limits.get('L', ${config.ALM_L_LIM}), AlarmPriority.HIGH, False),
            'DL': AlarmLimit('Deviation Low', limits.get('DL', ${config.ALM_DL_LIM}), AlarmPriority.MEDIUM, False, True),
            'DH': AlarmLimit('Deviation High', limits.get('DH', ${config.ALM_DH_LIM}), AlarmPriority.MEDIUM, True, True),
            'H': AlarmLimit('High', limits.get('H', ${config.ALM_H_LIM}), AlarmPriority.HIGH, True),
            'HH': AlarmLimit('High-High', limits.get('HH', ${config.ALM_HH_LIM}), AlarmPriority.CRITICAL, True),
        }
        self.active_alarms = {}
        self.alarm_history = []
        self.callbacks = []
        
    def register_callback(self, callback: Callable[[str, bool, float], None]):
        """Register callback for alarm state changes."""
        self.callbacks.append(callback)
        
    def check_alarms(self, pv: float, sp: float = None) -> dict:
        """
        Check all alarm conditions.
        
        Args:
            pv: Current process value
            sp: Current setpoint (for deviation alarms)
            
        Returns:
            Dict of active alarms
        """
        triggered = {}
        
        for name, limit in self.limits.items():
            if limit.is_deviation and sp is not None:
                # Deviation alarms compare to SP
                deviation = pv - sp
                if limit.is_high:
                    is_triggered = deviation > limit.limit
                else:
                    is_triggered = deviation < -limit.limit
            else:
                # Absolute alarms compare to fixed limits
                if limit.is_high:
                    is_triggered = pv > limit.limit
                else:
                    is_triggered = pv < limit.limit
                    
            if is_triggered:
                triggered[name] = {
                    'priority': limit.priority.name,
                    'value': pv,
                    'limit': limit.limit,
                    'timestamp': time.time()
                }
                
            # Check for state change
            was_active = name in self.active_alarms
            if is_triggered and not was_active:
                self._on_alarm_trigger(name, pv)
            elif not is_triggered and was_active:
                self._on_alarm_clear(name, pv)
                
        self.active_alarms = triggered
        return triggered
    
    def _on_alarm_trigger(self, name: str, pv: float):
        """Handle alarm trigger."""
        entry = {
            'type': name,
            'action': 'TRIGGER',
            'value': pv,
            'timestamp': time.time()
        }
        self.alarm_history.append(entry)
        
        for cb in self.callbacks:
            cb(name, True, pv)
            
    def _on_alarm_clear(self, name: str, pv: float):
        """Handle alarm clear."""
        entry = {
            'type': name,
            'action': 'CLEAR',
            'value': pv,
            'timestamp': time.time()
        }
        self.alarm_history.append(entry)
        
        for cb in self.callbacks:
            cb(name, False, pv)


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    handler = AlarmHandler({
        'LL': ${config.ALM_LL_LIM},
        'L': ${config.ALM_L_LIM},
        'DL': ${config.ALM_DL_LIM},
        'DH': ${config.ALM_DH_LIM},
        'H': ${config.ALM_H_LIM},
        'HH': ${config.ALM_HH_LIM},
    })
    
    def on_alarm(name, active, value):
        status = "ACTIVE" if active else "CLEARED"
        print(f"ALARM: {name} {status} at PV={value:.1f}")
    
    handler.register_callback(on_alarm)
    
    # Simulate PV changes
    for pv in [50, 75, 85, 95, 105, 90, 70]:
        alarms = handler.check_alarms(pv, sp=80)
        print(f"PV={pv}, Active alarms: {list(alarms.keys())}")
`
  },
  'setpoint_ramping.py': {
    description: 'Setpoint ramping and rate limiting implementation',
    relatedFaceplates: ['3A', '3F'],
    code: `"""
Setpoint Ramping - Implements rate-limited setpoint changes
Controller: ${config.TAGNAME} - ${config.DESC}
"""

import time
from enum import Enum

class RampMode(Enum):
    DISABLED = 0
    RATE_LIMITED = 1
    TIMED = 2

class SetpointRamper:
    def __init__(self, 
                 enabled: bool = ${config.SP_RAMP_EN},
                 ramp_rate: float = ${config.SP_RAMP_RATE},
                 sp_limits: tuple = (${config.SP_LIM_LO}, ${config.SP_LIM_HI})):
        """
        Initialize setpoint ramper.
        
        Args:
            enabled: Whether ramping is enabled
            ramp_rate: Rate of change (${config.EU}/second)
            sp_limits: (min, max) setpoint limits
        """
        self.enabled = enabled
        self.ramp_rate = ramp_rate
        self.sp_limits = sp_limits
        
        self._current_sp = sp_limits[0]
        self._target_sp = sp_limits[0]
        self._last_update = time.time()
        
    def set_target(self, target_sp: float):
        """Set new target setpoint."""
        self._target_sp = max(self.sp_limits[0], min(self.sp_limits[1], target_sp))
        
    def update(self) -> float:
        """
        Update current setpoint based on ramping.
        
        Returns:
            Current setpoint value
        """
        now = time.time()
        dt = now - self._last_update
        self._last_update = now
        
        if not self.enabled:
            self._current_sp = self._target_sp
            return self._current_sp
            
        # Calculate max change
        max_change = self.ramp_rate * dt
        
        # Apply ramping
        diff = self._target_sp - self._current_sp
        if abs(diff) <= max_change:
            self._current_sp = self._target_sp
        else:
            direction = 1 if diff > 0 else -1
            self._current_sp += direction * max_change
            
        return self._current_sp
    
    @property
    def current_sp(self) -> float:
        return self._current_sp
    
    @property
    def target_sp(self) -> float:
        return self._target_sp
    
    @property
    def is_ramping(self) -> bool:
        return abs(self._target_sp - self._current_sp) > 0.01


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    ramper = SetpointRamper(
        enabled=${config.SP_RAMP_EN ? 'True' : 'False'},
        ramp_rate=${config.SP_RAMP_RATE},
        sp_limits=(${config.SP_LIM_LO}, ${config.SP_LIM_HI})
    )
    
    # Set target
    ramper.set_target(${config.SP_LIM_HI})
    
    # Simulate ramping
    for _ in range(50):
        sp = ramper.update()
        status = "RAMPING" if ramper.is_ramping else "STEADY"
        print(f"SP={sp:.2f} (Target={ramper.target_sp:.2f}) [{status}]")
        time.sleep(0.1)
`
  },
  'interlocks.py': {
    description: 'Safety interlock logic and emergency shutdown handling',
    relatedFaceplates: ['3E', '3F'],
    code: `"""
Interlocks - Safety interlock logic and ESD handling
Controller: ${config.TAGNAME} - ${config.DESC}
"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Callable, Optional
import time

class InterlockAction(Enum):
    CLOSE = "CLOSE"    # Close valve / set output to 0
    OPEN = "OPEN"      # Open valve / set output to 100
    HOLD = "HOLD"      # Hold current output
    TRANSFER = "TRANSFER"  # Transfer to manual mode

@dataclass
class InterlockCondition:
    name: str
    check_func: Callable[[], bool]
    action: InterlockAction
    priority: int = 1  # Lower = higher priority
    delay_seconds: float = 0  # Delay before action

class InterlockManager:
    def __init__(self,
                 hh_enabled: bool = ${config.INTLK_HH_EN},
                 ll_enabled: bool = ${config.INTLK_LL_EN},
                 action: str = "${config.INTLK_ACTION}"):
        """
        Initialize interlock manager.
        
        Args:
            hh_enabled: Enable HH interlock
            ll_enabled: Enable LL interlock
            action: Default action (CLOSE, OPEN, HOLD)
        """
        self.hh_enabled = hh_enabled
        self.ll_enabled = ll_enabled
        self.default_action = InterlockAction[action]
        
        self.interlocks: List[InterlockCondition] = []
        self.active_interlocks = []
        self.callbacks = []
        
        self._trip_times = {}
        
    def add_interlock(self, interlock: InterlockCondition):
        """Add an interlock condition."""
        self.interlocks.append(interlock)
        self.interlocks.sort(key=lambda x: x.priority)
        
    def register_callback(self, callback: Callable[[str, bool, InterlockAction], None]):
        """Register callback for interlock state changes."""
        self.callbacks.append(callback)
        
    def check_interlocks(self, pv: float, limits: dict) -> Optional[InterlockAction]:
        """
        Check all interlock conditions.
        
        Args:
            pv: Current process value
            limits: Dict with HH and LL limits
            
        Returns:
            Action to take, or None if no interlock active
        """
        now = time.time()
        triggered_action = None
        
        # Check HH interlock
        if self.hh_enabled and pv >= limits.get('HH', 999):
            name = 'HH_INTERLOCK'
            if name not in self._trip_times:
                self._trip_times[name] = now
                self._on_interlock_trigger(name)
            triggered_action = self.default_action
            
        elif 'HH_INTERLOCK' in self._trip_times:
            del self._trip_times['HH_INTERLOCK']
            self._on_interlock_clear('HH_INTERLOCK')
            
        # Check LL interlock
        if self.ll_enabled and pv <= limits.get('LL', -999):
            name = 'LL_INTERLOCK'
            if name not in self._trip_times:
                self._trip_times[name] = now
                self._on_interlock_trigger(name)
            triggered_action = self.default_action
            
        elif 'LL_INTERLOCK' in self._trip_times:
            del self._trip_times['LL_INTERLOCK']
            self._on_interlock_clear('LL_INTERLOCK')
            
        # Check custom interlocks
        for interlock in self.interlocks:
            if interlock.check_func():
                if interlock.name not in self._trip_times:
                    self._trip_times[interlock.name] = now
                    self._on_interlock_trigger(interlock.name)
                    
                # Check delay
                elapsed = now - self._trip_times[interlock.name]
                if elapsed >= interlock.delay_seconds:
                    triggered_action = interlock.action
            else:
                if interlock.name in self._trip_times:
                    del self._trip_times[interlock.name]
                    self._on_interlock_clear(interlock.name)
                    
        self.active_interlocks = list(self._trip_times.keys())
        return triggered_action
    
    def _on_interlock_trigger(self, name: str):
        """Handle interlock trigger."""
        for cb in self.callbacks:
            cb(name, True, self.default_action)
            
    def _on_interlock_clear(self, name: str):
        """Handle interlock clear."""
        for cb in self.callbacks:
            cb(name, False, self.default_action)
            
    def get_output(self, action: InterlockAction, current_output: float) -> float:
        """Get output value based on interlock action."""
        if action == InterlockAction.CLOSE:
            return ${config.OUT_LIM_LO}
        elif action == InterlockAction.OPEN:
            return ${config.OUT_LIM_HI}
        elif action == InterlockAction.HOLD:
            return current_output
        return current_output


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    manager = InterlockManager(
        hh_enabled=${config.INTLK_HH_EN ? 'True' : 'False'},
        ll_enabled=${config.INTLK_LL_EN ? 'True' : 'False'},
        action="${config.INTLK_ACTION}"
    )
    
    def on_interlock(name, active, action):
        status = "TRIPPED" if active else "RESET"
        print(f"INTERLOCK: {name} {status} -> {action.value}")
    
    manager.register_callback(on_interlock)
    
    limits = {'HH': ${config.ALM_HH_LIM}, 'LL': ${config.ALM_LL_LIM}}
    
    # Simulate PV changes
    for pv in [50, 80, 95, 110, 90, 30, 10, 50]:
        action = manager.check_interlocks(pv, limits)
        if action:
            print(f"PV={pv}: INTERLOCK ACTION = {action.value}")
        else:
            print(f"PV={pv}: No interlock")
`
  },
  'trending.py': {
    description: 'Real-time trending and data logging for historian',
    relatedFaceplates: ['3B', '3C'],
    code: `"""
Trending - Real-time data logging and historian interface
Controller: ${config.TAGNAME} - ${config.DESC}
"""

import time
import json
import csv
from collections import deque
from dataclasses import dataclass, asdict
from typing import List, Optional
from datetime import datetime

@dataclass
class TrendPoint:
    timestamp: float
    pv: float
    sp: float
    out: float
    mode: str
    alarm_active: bool = False

class TrendBuffer:
    def __init__(self, 
                 max_points: int = 3600,
                 sample_interval: float = 1.0):
        """
        Initialize trend buffer.
        
        Args:
            max_points: Maximum points to store (default 1 hour @ 1s)
            sample_interval: Seconds between samples
        """
        self.max_points = max_points
        self.sample_interval = sample_interval
        self.buffer: deque = deque(maxlen=max_points)
        self._last_sample = 0
        
    def add_point(self, pv: float, sp: float, out: float, 
                  mode: str = 'AUTO', alarm_active: bool = False) -> bool:
        """
        Add a data point if sample interval elapsed.
        
        Returns:
            True if point was added
        """
        now = time.time()
        if now - self._last_sample >= self.sample_interval:
            point = TrendPoint(
                timestamp=now,
                pv=pv,
                sp=sp,
                out=out,
                mode=mode,
                alarm_active=alarm_active
            )
            self.buffer.append(point)
            self._last_sample = now
            return True
        return False
    
    def get_recent(self, seconds: float = 300) -> List[TrendPoint]:
        """Get points from last N seconds."""
        now = time.time()
        cutoff = now - seconds
        return [p for p in self.buffer if p.timestamp >= cutoff]
    
    def export_csv(self, filename: str):
        """Export buffer to CSV file."""
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Timestamp', 'DateTime', 'PV', 'SP', 'OUT', 'Mode', 'Alarm'])
            for point in self.buffer:
                dt = datetime.fromtimestamp(point.timestamp)
                writer.writerow([
                    point.timestamp,
                    dt.isoformat(),
                    point.pv,
                    point.sp,
                    point.out,
                    point.mode,
                    point.alarm_active
                ])
                
    def export_json(self, filename: str):
        """Export buffer to JSON file."""
        data = {
            'controller': '${config.TAGNAME}',
            'description': '${config.DESC}',
            'units': '${config.EU}',
            'points': [asdict(p) for p in self.buffer]
        }
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
            
    def get_statistics(self, seconds: float = 300) -> dict:
        """Calculate statistics for recent data."""
        points = self.get_recent(seconds)
        if not points:
            return {}
            
        pvs = [p.pv for p in points]
        sps = [p.sp for p in points]
        outs = [p.out for p in points]
        
        return {
            'pv_avg': sum(pvs) / len(pvs),
            'pv_min': min(pvs),
            'pv_max': max(pvs),
            'sp_avg': sum(sps) / len(sps),
            'out_avg': sum(outs) / len(outs),
            'out_min': min(outs),
            'out_max': max(outs),
            'alarm_count': sum(1 for p in points if p.alarm_active),
            'point_count': len(points)
        }


# Example usage for ${config.TAGNAME}
if __name__ == "__main__":
    trend = TrendBuffer(max_points=100, sample_interval=0.5)
    
    # Simulate data collection
    import random
    pv = ${config.PV_INIT_VAL}
    sp = ${config.SP_LIM_HI}
    
    for i in range(50):
        pv += random.uniform(-2, 2)
        pv = max(${config.PV_SCALE_LO}, min(${config.PV_SCALE_HI}, pv))
        out = 50 + (sp - pv) * 2
        out = max(${config.OUT_LIM_LO}, min(${config.OUT_LIM_HI}, out))
        
        if trend.add_point(pv, sp, out):
            print(f"Point {i}: PV={pv:.1f}, SP={sp:.1f}, OUT={out:.1f}")
        
        time.sleep(0.1)
    
    # Get statistics
    stats = trend.get_statistics(seconds=60)
    print(f"\\nStatistics: {stats}")
    
    # Export
    trend.export_csv('${config.TAGNAME}_trend.csv')
    trend.export_json('${config.TAGNAME}_trend.json')
`
  }
});

export const downloadPythonFile = (fileName: string, code: string): void => {
  const blob = new Blob([code], { type: 'text/x-python' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const PYTHON_FILE_FACEPLATE_MAP: Record<string, string[]> = {
  'pid_controller.py': ['3A', '3B'],
  'process_model.py': ['3A', '3D'],
  'data_bridge.py': ['3C'],
  'alarm_handler.py': ['3E', '3F'],
  'setpoint_ramping.py': ['3A', '3F'],
  'interlocks.py': ['3E', '3F'],
  'trending.py': ['3B', '3C'],
};

export const FACEPLATE_PYTHON_MAP: Record<string, string[]> = {
  '3A': ['pid_controller.py', 'process_model.py', 'setpoint_ramping.py'],
  '3B': ['pid_controller.py', 'trending.py'],
  '3C': ['data_bridge.py', 'trending.py'],
  '3D': ['process_model.py'],
  '3E': ['alarm_handler.py', 'interlocks.py'],
  '3F': ['alarm_handler.py', 'setpoint_ramping.py', 'interlocks.py'],
};
