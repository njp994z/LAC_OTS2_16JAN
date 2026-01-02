const PIDControlLoopDiagram = () => {
  return (
    <svg
      viewBox="0 0 800 500"
      className="w-full h-auto"
      style={{ maxHeight: '500px' }}
    >
      <defs>
        {/* Arrow marker for signal lines */}
        <marker
          id="arrowCyan"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--faceplate-border))" />
        </marker>
        <marker
          id="arrowWhite"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="white" />
        </marker>
        <marker
          id="arrowOrange"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#F59E0B" />
        </marker>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="800" height="500" fill="hsl(222 47% 11%)" rx="8" />

      {/* Title */}
      <text x="400" y="30" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="14" fontFamily="monospace" fontWeight="bold">
        Single-Loop Temperature Control with HX Bypass + Positioner + Dead Time
      </text>

      {/* === TOP ROW: Control Elements === */}
      
      {/* Tsp label */}
      <text x="45" y="85" textAnchor="middle" fill="white" fontSize="12" fontFamily="monospace">
        T<tspan baselineShift="sub" fontSize="9">sp</tspan>
      </text>
      <line x1="60" y1="80" x2="85" y2="80" stroke="white" strokeWidth="2" markerEnd="url(#arrowWhite)" />

      {/* Summing Junction (circle with Σ) */}
      <circle cx="105" cy="80" r="18" fill="hsl(222 47% 18%)" stroke="hsl(var(--faceplate-border))" strokeWidth="2" />
      <text x="105" y="85" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="16" fontFamily="monospace">Σ</text>
      
      {/* e (error) signal */}
      <line x1="123" y1="80" x2="165" y2="80" stroke="white" strokeWidth="2" markerEnd="url(#arrowWhite)" />
      <text x="145" y="72" textAnchor="middle" fill="white" fontSize="11" fontFamily="monospace">e</text>

      {/* PID Block */}
      <rect x="170" y="60" width="70" height="40" fill="hsl(222 47% 18%)" stroke="hsl(var(--faceplate-border))" strokeWidth="2" rx="4" />
      <text x="205" y="85" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="13" fontFamily="monospace" fontWeight="bold">PID</text>

      {/* u (control signal) */}
      <line x1="240" y1="80" x2="285" y2="80" stroke="hsl(var(--faceplate-border))" strokeWidth="2" markerEnd="url(#arrowCyan)" />
      <text x="263" y="72" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="11" fontFamily="monospace">u</text>

      {/* Positioner Block Gpos(s) */}
      <rect x="290" y="60" width="90" height="40" fill="hsl(222 47% 18%)" stroke="hsl(var(--faceplate-border))" strokeWidth="2" rx="4" />
      <text x="335" y="85" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="12" fontFamily="monospace">G<tspan baselineShift="sub" fontSize="9">pos</tspan>(s)</text>

      {/* Connection to Valve */}
      <line x1="380" y1="80" x2="425" y2="80" stroke="hsl(var(--faceplate-border))" strokeWidth="2" markerEnd="url(#arrowCyan)" />

      {/* Valve Block Gv(s) */}
      <rect x="430" y="60" width="80" height="40" fill="hsl(222 47% 18%)" stroke="hsl(var(--faceplate-border))" strokeWidth="2" rx="4" />
      <text x="470" y="85" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="12" fontFamily="monospace">G<tspan baselineShift="sub" fontSize="9">v</tspan>(s)</text>

      {/* x (valve position) output */}
      <line x1="510" y1="80" x2="570" y2="80" stroke="hsl(var(--faceplate-border))" strokeWidth="2" markerEnd="url(#arrowCyan)" />
      <text x="540" y="72" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="11" fontFamily="monospace">x</text>

      {/* === SPLIT JUNCTION === */}
      <rect x="575" y="60" width="100" height="40" fill="hsl(222 47% 18%)" stroke="#F59E0B" strokeWidth="2" rx="4" />
      <text x="625" y="77" textAnchor="middle" fill="#F59E0B" fontSize="10" fontFamily="monospace">Split</text>
      <text x="625" y="90" textAnchor="middle" fill="#F59E0B" fontSize="10" fontFamily="monospace">Junction</text>

      {/* Branch down to HX (1-x flow) */}
      <line x1="600" y1="100" x2="600" y2="160" stroke="#F59E0B" strokeWidth="2" markerEnd="url(#arrowOrange)" />
      <text x="570" y="135" textAnchor="middle" fill="#F59E0B" fontSize="10" fontFamily="monospace">(1-x)</text>

      {/* Branch down to bypass (x flow) */}
      <line x1="650" y1="100" x2="650" y2="310" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5,3" />
      <text x="680" y="135" textAnchor="start" fill="#F59E0B" fontSize="10" fontFamily="monospace">x</text>
      <text x="680" y="148" textAnchor="start" fill="#F59E0B" fontSize="9" fontFamily="monospace">(bypass)</text>

      {/* === HEAT EXCHANGER === */}
      <rect x="530" y="165" width="140" height="70" fill="hsl(222 47% 18%)" stroke="#F59E0B" strokeWidth="2" rx="4" />
      <text x="600" y="190" textAnchor="middle" fill="#F59E0B" fontSize="12" fontFamily="monospace" fontWeight="bold">Heat Exchanger</text>
      <text x="600" y="205" textAnchor="middle" fill="#F59E0B" fontSize="11" fontFamily="monospace">(HX)</text>
      <text x="600" y="225" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="monospace">process + θ (dead time)</text>

      {/* Tin input to HX */}
      <line x1="450" y1="200" x2="525" y2="200" stroke="#F59E0B" strokeWidth="2" markerEnd="url(#arrowOrange)" />
      <text x="460" y="193" textAnchor="start" fill="#F59E0B" fontSize="11" fontFamily="monospace">T<tspan baselineShift="sub" fontSize="8">in</tspan></text>

      {/* Thx output from HX */}
      <line x1="600" y1="235" x2="600" y2="290" stroke="#F59E0B" strokeWidth="2" markerEnd="url(#arrowOrange)" />
      <text x="615" y="265" textAnchor="start" fill="#F59E0B" fontSize="11" fontFamily="monospace">T<tspan baselineShift="sub" fontSize="8">hx</tspan></text>

      {/* Bypass label - Tin goes through */}
      <text x="680" y="250" textAnchor="start" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="monospace">T<tspan baselineShift="sub" fontSize="7">bypass</tspan>=T<tspan baselineShift="sub" fontSize="7">in</tspan></text>

      {/* === MIXING JUNCTION === */}
      <rect x="530" y="295" width="140" height="55" fill="hsl(222 47% 18%)" stroke="#F59E0B" strokeWidth="2" rx="4" />
      <text x="600" y="315" textAnchor="middle" fill="#F59E0B" fontSize="11" fontFamily="monospace" fontWeight="bold">Mixing Junction</text>
      <text x="600" y="340" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="monospace">T<tspan baselineShift="sub" fontSize="8">out</tspan> = x·T<tspan baselineShift="sub" fontSize="8">in</tspan> + (1-x)·T<tspan baselineShift="sub" fontSize="8">hx</tspan></text>

      {/* Bypass line connects to mixing junction */}
      <line x1="650" y1="310" x2="650" y2="322" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5,3" />
      <circle cx="650" cy="322" r="4" fill="#F59E0B" />

      {/* Tout output - horizontal then down to sensor */}
      <line x1="670" y1="322" x2="720" y2="322" stroke="#F59E0B" strokeWidth="2" />
      <text x="695" y="312" textAnchor="middle" fill="#F59E0B" fontSize="11" fontFamily="monospace">T<tspan baselineShift="sub" fontSize="8">out</tspan></text>
      
      {/* Vertical line down from Tout to sensor */}
      <line x1="720" y1="322" x2="720" y2="385" stroke="#F59E0B" strokeWidth="2" markerEnd="url(#arrowOrange)" />

      {/* === SENSOR/TRANSMITTER (positioned under Tout stream) === */}
      <rect x="665" y="390" width="110" height="40" fill="hsl(222 47% 18%)" stroke="hsl(var(--faceplate-border))" strokeWidth="2" rx="4" />
      <text x="720" y="415" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="11" fontFamily="monospace">Sensor / T<tspan baselineShift="sub" fontSize="8">x</tspan></text>

      {/* === FEEDBACK PATH === */}
      {/* Down from sensor */}
      <line x1="720" y1="430" x2="720" y2="465" stroke="hsl(var(--faceplate-border))" strokeWidth="2" strokeDasharray="6,3" />
      
      {/* Left along bottom */}
      <line x1="720" y1="465" x2="105" y2="465" stroke="hsl(var(--faceplate-border))" strokeWidth="2" strokeDasharray="6,3" />
      
      {/* Up to summing junction */}
      <line x1="105" y1="465" x2="105" y2="103" stroke="hsl(var(--faceplate-border))" strokeWidth="2" strokeDasharray="6,3" markerEnd="url(#arrowCyan)" />

      {/* Tmeas label on feedback */}
      <text x="400" y="458" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="11" fontFamily="monospace">T<tspan baselineShift="sub" fontSize="8">meas</tspan></text>

      {/* Negative sign at summing junction */}
      <text x="88" y="108" textAnchor="middle" fill="white" fontSize="14" fontFamily="monospace">−</text>

      {/* === LEGEND === */}
      <rect x="20" y="420" width="150" height="70" fill="hsl(222 47% 15%)" stroke="hsl(var(--border))" strokeWidth="1" rx="4" />
      <text x="95" y="438" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="monospace">Legend</text>
      
      <line x1="30" y1="452" x2="55" y2="452" stroke="hsl(var(--faceplate-border))" strokeWidth="2" />
      <text x="60" y="456" textAnchor="start" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="monospace">Control Signal</text>
      
      <line x1="30" y1="467" x2="55" y2="467" stroke="#F59E0B" strokeWidth="2" />
      <text x="60" y="471" textAnchor="start" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="monospace">Process Flow</text>
      
      <line x1="30" y1="482" x2="55" y2="482" stroke="hsl(var(--faceplate-border))" strokeWidth="2" strokeDasharray="6,3" />
      <text x="60" y="486" textAnchor="start" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="monospace">Feedback</text>
    </svg>
  );
};

export default PIDControlLoopDiagram;
