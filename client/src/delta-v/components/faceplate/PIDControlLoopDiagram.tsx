const PIDControlLoopDiagram = () => {
  return (
    <svg
      viewBox="0 0 1100 340"
      className="w-full h-auto"
      style={{ maxHeight: '340px' }}
    >
      <defs>
        <marker
          id="arrowBlack"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="#374151" />
        </marker>
        <marker
          id="arrowCyan"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="hsl(var(--faceplate-border))" />
        </marker>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="1100" height="340" fill="hsl(222 47% 98%)" rx="4" />

      {/* === LEFT SIDE: Controller Block === */}
      <rect x="20" y="70" width="100" height="55" fill="white" stroke="#374151" strokeWidth="1.5" rx="2" />
      <text x="70" y="90" textAnchor="middle" fill="#374151" fontSize="9" fontFamily="sans-serif" fontWeight="500">Control Loop</text>
      <text x="70" y="103" textAnchor="middle" fill="#374151" fontSize="9" fontFamily="sans-serif" fontWeight="500">Sulfur Flow Controller</text>

      {/* SP: (gpm) label */}
      <text x="25" y="145" textAnchor="start" fill="#374151" fontSize="9" fontFamily="sans-serif">SP: (gpm)</text>

      {/* Summing junction for SP-PV */}
      <text x="70" y="165" textAnchor="middle" fill="#374151" fontSize="10" fontFamily="sans-serif">Σ: +/-</text>

      {/* e(t) signal from controller to PID */}
      <line x1="120" y1="97" x2="155" y2="97" stroke="#374151" strokeWidth="1" markerEnd="url(#arrowBlack)" />
      <text x="138" y="90" textAnchor="middle" fill="#374151" fontSize="8" fontFamily="sans-serif">e(t)</text>

      {/* === PID CONTROLLER SECTION === */}
      <rect x="160" y="35" width="155" height="145" fill="none" stroke="#374151" strokeWidth="1" strokeDasharray="4,2" rx="2" />
      <text x="237" y="28" textAnchor="middle" fill="#374151" fontSize="9" fontFamily="sans-serif" fontStyle="italic">PID Controller</text>

      {/* Kp block (top path) */}
      <rect x="175" y="50" width="35" height="25" fill="white" stroke="#374151" strokeWidth="1" rx="1" />
      <text x="192" y="67" textAnchor="middle" fill="#374151" fontSize="10" fontFamily="sans-serif">K<tspan fontSize="7" baselineShift="sub">p</tspan></text>

      {/* Triangle amplifier after Kp */}
      <polygon points="225,50 225,75 250,62.5" fill="white" stroke="#374151" strokeWidth="1" />
      <text x="252" y="48" textAnchor="start" fill="#374151" fontSize="8" fontFamily="sans-serif">e(t)</text>

      {/* Kp output line */}
      <line x1="210" y1="62" x2="225" y2="62" stroke="#374151" strokeWidth="1" />
      <line x1="250" y1="62" x2="270" y2="62" stroke="#374151" strokeWidth="1" />

      {/* Ki block (middle path) */}
      <rect x="175" y="85" width="35" height="25" fill="white" stroke="#374151" strokeWidth="1" rx="1" />
      <text x="192" y="102" textAnchor="middle" fill="#374151" fontSize="10" fontFamily="sans-serif">K<tspan fontSize="7" baselineShift="sub">i</tspan></text>

      {/* Triangle integrator after Ki */}
      <polygon points="225,85 225,110 250,97.5" fill="white" stroke="#374151" strokeWidth="1" />
      <text x="235" y="100" textAnchor="middle" fill="#374151" fontSize="7" fontFamily="sans-serif">∫e(t) dt</text>

      {/* Ki output line */}
      <line x1="210" y1="97" x2="225" y2="97" stroke="#374151" strokeWidth="1" />
      <line x1="250" y1="97" x2="270" y2="97" stroke="#374151" strokeWidth="1" />

      {/* Kd block (bottom path) */}
      <rect x="175" y="120" width="35" height="25" fill="white" stroke="#374151" strokeWidth="1" rx="1" />
      <text x="192" y="137" textAnchor="middle" fill="#374151" fontSize="10" fontFamily="sans-serif">K<tspan fontSize="7" baselineShift="sub">D</tspan></text>

      {/* Triangle differentiator after Kd */}
      <polygon points="225,120 225,145 250,132.5" fill="white" stroke="#374151" strokeWidth="1" />
      <text x="235" y="135" textAnchor="middle" fill="#374151" fontSize="6" fontFamily="sans-serif">de(t)/dt</text>

      {/* Kd output line */}
      <line x1="210" y1="132" x2="225" y2="132" stroke="#374151" strokeWidth="1" />
      <line x1="250" y1="132" x2="270" y2="132" stroke="#374151" strokeWidth="1" />

      {/* Vertical connections to summing junction */}
      <line x1="270" y1="62" x2="270" y2="132" stroke="#374151" strokeWidth="1" />
      
      {/* Plus signs at junctions */}
      <text x="275" y="65" textAnchor="start" fill="#374151" fontSize="8" fontFamily="sans-serif">+</text>
      <text x="275" y="100" textAnchor="start" fill="#374151" fontSize="8" fontFamily="sans-serif">+</text>

      {/* PID Summing block */}
      <circle cx="290" cy="97" r="12" fill="white" stroke="#374151" strokeWidth="1" />
      <text x="290" y="101" textAnchor="middle" fill="#374151" fontSize="12" fontFamily="sans-serif">Σ</text>

      {/* Low-Pass Filter (under derivative) */}
      <rect x="175" y="155" width="80" height="18" fill="white" stroke="#374151" strokeWidth="1" rx="1" />
      <text x="215" y="167" textAnchor="middle" fill="#374151" fontSize="7" fontFamily="sans-serif">1 / (1 + τ<tspan fontSize="5" baselineShift="sub">LPF</tspan>(s))</text>
      <text x="215" y="185" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif" fontStyle="italic">Low-Pass Filter</text>
      <text x="215" y="195" textAnchor="middle" fill="#6B7280" fontSize="6" fontFamily="sans-serif" fontStyle="italic">(Removes Chatter, for the Derivative Function)</text>

      {/* u(t) output from PID */}
      <line x1="302" y1="97" x2="335" y2="97" stroke="#374151" strokeWidth="1" markerEnd="url(#arrowBlack)" />
      <text x="318" y="90" textAnchor="middle" fill="#374151" fontSize="8" fontFamily="sans-serif">u(t)</text>
      <text x="318" y="112" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif">4-20 mA</text>

      {/* === POSITIONER FUNCTION === */}
      <rect x="340" y="60" width="80" height="75" fill="none" stroke="#374151" strokeWidth="1" strokeDasharray="4,2" rx="2" />
      <text x="380" y="53" textAnchor="middle" fill="#374151" fontSize="8" fontFamily="sans-serif" fontStyle="italic">Positioner</text>
      <text x="380" y="62" textAnchor="middle" fill="#374151" fontSize="8" fontFamily="sans-serif" fontStyle="italic">Function</text>

      {/* Positioner transfer function block */}
      <rect x="350" y="75" width="60" height="30" fill="white" stroke="#374151" strokeWidth="1" rx="1" />
      <text x="380" y="88" textAnchor="middle" fill="#374151" fontSize="8" fontFamily="sans-serif">K<tspan fontSize="6" baselineShift="sub">POS</tspan></text>
      <line x1="355" y1="95" x2="405" y2="95" stroke="#374151" strokeWidth="0.5" />
      <text x="380" y="103" textAnchor="middle" fill="#374151" fontSize="7" fontFamily="sans-serif">1 + τ<tspan fontSize="5" baselineShift="sub">POS</tspan>(s)</text>

      {/* x(t) output */}
      <line x1="420" y1="97" x2="460" y2="97" stroke="#374151" strokeWidth="1" markerEnd="url(#arrowBlack)" />
      <text x="440" y="90" textAnchor="middle" fill="#374151" fontSize="8" fontFamily="sans-serif">x(t)</text>
      <text x="440" y="112" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif">0.0 - 1.0</text>

      {/* === OVERALL TRANSFER FUNCTION SECTION === */}
      <rect x="465" y="35" width="540" height="175" fill="none" stroke="hsl(var(--faceplate-border))" strokeWidth="1" strokeDasharray="4,2" rx="2" />
      <text x="735" y="28" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="9" fontFamily="sans-serif" fontStyle="italic">Overall Transfer Function</text>

      {/* Cv Calculation label */}
      <text x="530" y="53" textAnchor="middle" fill="#374151" fontSize="8" fontFamily="sans-serif" fontStyle="italic">C<tspan fontSize="6" baselineShift="sub">v</tspan> Calculation</text>

      {/* Cv block */}
      <rect x="480" y="60" width="100" height="35" fill="white" stroke="hsl(var(--faceplate-border))" strokeWidth="1" rx="1" />
      <text x="530" y="82" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="9" fontFamily="sans-serif">Cv = f(x, R, Cv<tspan fontSize="6" baselineShift="sub">max</tspan>)</text>

      {/* Connection from Cv to process */}
      <line x1="580" y1="77" x2="615" y2="77" stroke="hsl(var(--faceplate-border))" strokeWidth="1" />
      <line x1="615" y1="77" x2="615" y2="140" stroke="hsl(var(--faceplate-border))" strokeWidth="1" />

      {/* Qsulfur label */}
      <text x="478" y="145" textAnchor="end" fill="hsl(var(--faceplate-border))" fontSize="8" fontFamily="sans-serif">Q<tspan fontSize="6" baselineShift="sub">Sulfur</tspan></text>

      {/* Static Head block */}
      <rect x="490" y="130" width="55" height="30" fill="white" stroke="hsl(var(--faceplate-border))" strokeWidth="1" rx="1" />
      <text x="517" y="148" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="8" fontFamily="sans-serif">dP = f(Q)</text>
      <text x="517" y="175" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif">Static</text>
      <text x="517" y="185" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif">Head</text>

      {/* Arrow to Sulfur Pump */}
      <line x1="545" y1="145" x2="570" y2="145" stroke="hsl(var(--faceplate-border))" strokeWidth="1" markerEnd="url(#arrowCyan)" />

      {/* Sulfur Pump block */}
      <rect x="575" y="130" width="55" height="30" fill="white" stroke="hsl(var(--faceplate-border))" strokeWidth="1" rx="1" />
      <text x="602" y="148" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="8" fontFamily="sans-serif">dP = f(Q)</text>
      <text x="602" y="175" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif">Sulfur Pump</text>

      {/* Arrow to dP Line Losses */}
      <line x1="630" y1="145" x2="655" y2="145" stroke="hsl(var(--faceplate-border))" strokeWidth="1" markerEnd="url(#arrowCyan)" />

      {/* dP Line Losses block */}
      <rect x="660" y="130" width="70" height="30" fill="white" stroke="hsl(var(--faceplate-border))" strokeWidth="1" rx="1" />
      <text x="695" y="148" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="8" fontFamily="sans-serif">dP = f(Cv, Q)</text>
      <text x="695" y="175" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif">Sulfur FCV</text>

      {/* Arrow to Sulfur FCV */}
      <line x1="730" y1="145" x2="755" y2="145" stroke="hsl(var(--faceplate-border))" strokeWidth="1" markerEnd="url(#arrowCyan)" />

      {/* dP Line Losses block 2 */}
      <rect x="760" y="130" width="55" height="30" fill="white" stroke="hsl(var(--faceplate-border))" strokeWidth="1" rx="1" />
      <text x="787" y="148" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="8" fontFamily="sans-serif">dP = f(Q)</text>
      <text x="787" y="175" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif">dP Line Losses</text>

      {/* Arrow to Spray Nozzles */}
      <line x1="815" y1="145" x2="840" y2="145" stroke="hsl(var(--faceplate-border))" strokeWidth="1" markerEnd="url(#arrowCyan)" />

      {/* Spray Nozzles block */}
      <rect x="845" y="130" width="55" height="30" fill="white" stroke="hsl(var(--faceplate-border))" strokeWidth="1" rx="1" />
      <text x="872" y="148" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="8" fontFamily="sans-serif">dP = f(Q)</text>
      <text x="872" y="175" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif">Spray Nozzles</text>

      {/* Arrow to Dead Time Lag */}
      <line x1="900" y1="145" x2="930" y2="145" stroke="hsl(var(--faceplate-border))" strokeWidth="1" markerEnd="url(#arrowCyan)" />

      {/* Dead Time Lag section */}
      <rect x="935" y="115" width="60" height="60" fill="none" stroke="#374151" strokeWidth="1" strokeDasharray="4,2" rx="2" />
      <text x="965" y="108" textAnchor="middle" fill="#374151" fontSize="8" fontFamily="sans-serif" fontStyle="italic">Dead Time Lag</text>

      {/* Dead time block */}
      <rect x="945" y="130" width="40" height="30" fill="white" stroke="#374151" strokeWidth="1" rx="1" />
      <text x="965" y="140" textAnchor="middle" fill="#374151" fontSize="9" fontFamily="sans-serif">e</text>
      <text x="980" y="140" textAnchor="start" fill="#374151" fontSize="7" fontFamily="sans-serif">-θ(s)</text>

      {/* PV(t) output */}
      <line x1="985" y1="145" x2="1020" y2="145" stroke="#374151" strokeWidth="1" markerEnd="url(#arrowBlack)" />
      <text x="1040" y="140" textAnchor="start" fill="#374151" fontSize="9" fontFamily="sans-serif">PV(t)</text>
      <text x="1055" y="153" textAnchor="start" fill="#374151" fontSize="8" fontFamily="sans-serif">Q<tspan fontSize="6" baselineShift="sub">Sulfur</tspan></text>
      <text x="1055" y="165" textAnchor="start" fill="#6B7280" fontSize="7" fontFamily="sans-serif">(gpm)</text>

      {/* === FEEDBACK PATH === */}
      {/* Horizontal feedback line at bottom */}
      <line x1="1020" y1="145" x2="1020" y2="230" stroke="hsl(var(--faceplate-border))" strokeWidth="1" />
      <line x1="1020" y1="230" x2="70" y2="230" stroke="hsl(var(--faceplate-border))" strokeWidth="1" />
      <line x1="70" y1="230" x2="70" y2="130" stroke="hsl(var(--faceplate-border))" strokeWidth="1" markerEnd="url(#arrowCyan)" />

      {/* Measured PV(t) label */}
      <text x="545" y="245" textAnchor="middle" fill="hsl(var(--faceplate-border))" fontSize="8" fontFamily="sans-serif">Measured PV(t)</text>
      <text x="545" y="257" textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="sans-serif">(gpm)</text>
    </svg>
  );
};

export default PIDControlLoopDiagram;
