import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import expLogo from "@/assets/exp-logo.png";

const PT = 3.125;
const Do = 2.5;
const s_row = 0.8660 * PT;
const R_shell = 91.0;
const R_disk = 79.0;
const R_donutID = 50.775;

interface TubePoint {
  x: number;
  y: number;
  k: number;
  n: number;
}

function generateTubes(): TubePoint[] {
  const tubes: TubePoint[] = [];
  const R_outer_limit = 88.0;
  const R_inner_limit = 50.0;
  for (let k = -40; k <= 40; k++) {
    const y = k * s_row;
    const xOffset = Math.abs(k) % 2 === 0 ? 0 : PT / 2;
    for (let n = -40; n <= 40; n++) {
      const x = n * PT + xOffset;
      const r = Math.sqrt(x * x + y * y);
      if (r >= R_inner_limit && r <= R_outer_limit) tubes.push({ x, y, k, n });
    }
  }
  return tubes;
}

const TUBES = generateTubes();
const SC = 95 / R_shell;

function computeRowStats(k: number, passType: "disk" | "donut") {
  const y = k * s_row;
  let L = 0;
  if (passType === "disk") {
    const outer = Math.sqrt(Math.max(R_shell ** 2 - y ** 2, 0));
    const inner = Math.sqrt(Math.max(R_disk ** 2 - y ** 2, 0));
    L = 2 * (outer - inner);
  } else {
    L = 2 * Math.sqrt(Math.max(R_donutID ** 2 - y ** 2, 0));
  }
  const N = Math.max(Math.floor(L / PT), 0);
  const W = L - N * Do;
  return { y, L, N, W };
}

function CrossSectionSVG({ activeK, passType }: { activeK: number; passType: "disk" | "donut" }) {
  const color = passType === "disk" ? "#f97316" : "#38bdf8";

  return (
    <svg viewBox="-100 -100 200 200" className="w-full rounded-md" style={{ background: "#000" }}>
      <circle cx={0} cy={0} r={R_shell * SC} fill="none" stroke="#a78bfa" strokeWidth={1} />
      {passType === "disk" && (
        <circle cx={0} cy={0} r={R_disk * SC} fill="#1e2530" stroke={color} strokeOpacity={0.5} />
      )}
      {passType === "donut" && (
        <circle cx={0} cy={0} r={R_donutID * SC} fill="none" stroke={color} strokeDasharray="4,2" />
      )}
      {TUBES.map((t, i) => {
        const r = Math.sqrt(t.x * t.x + t.y * t.y);
        const isActive = t.k === activeK;
        let participating = false;
        if (passType === "disk") participating = r >= R_disk - 1 && isActive;
        if (passType === "donut") participating = r <= R_donutID + 1 && isActive;

        return (
          <circle
            key={i}
            cx={t.x * SC}
            cy={t.y * SC}
            r={(Do / 2) * SC}
            fill={participating ? color : "#1a1f2a"}
            stroke={participating ? "#fff" : "#374151"}
            strokeWidth={participating ? 0.5 : 0.2}
            opacity={participating ? 1 : 0.3}
          />
        );
      })}
    </svg>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background border border-border rounded-md p-2">
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div className="text-xs font-semibold font-mono">{value}</div>
    </div>
  );
}

export default function CipShellGeometry() {
  const [diskK, setDiskK] = useState(27);
  const [donutK, setDonutK] = useState(3);
  const [manualLy, setManualLy] = useState("43.002");
  const [manualKN, setManualKN] = useState("14");
  const [manualB, setManualB] = useState("128");

  const diskStats = computeRowStats(diskK, "disk");
  const donutStats = computeRowStats(donutK, "donut");

  const L = parseFloat(manualLy) || 0;
  const N = parseFloat(manualKN) || 0;
  const B = parseFloat(manualB) || 0;
  const wgap = L - N * Do;
  const a1 = wgap * B;

  return (
    <div className="min-h-screen bg-background" data-testid="page-cip-shell-geometry">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/unit-operation/gas-gas-heat-exchanger">
              <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <div>
              <h1 className="text-lg font-bold leading-tight font-mono" data-testid="text-page-title">CIP Heat Exchanger — Interactive Crossflow Model</h1>
              <p className="text-xs text-muted-foreground italic">Shell ID 182" | Disk 158" | Donut Hole 101.55" | Tube OD 2.5"</p>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-[1400px] mx-auto space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-orange-400">Disk Pass — Flow to Shell Wall</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <CrossSectionSVG activeK={diskK} passType="disk" />
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">Table Row k:</span>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    step={1}
                    value={diskK}
                    onChange={(e) => setDiskK(parseInt(e.target.value))}
                    className="flex-1 accent-amber-400"
                    data-testid="slider-disk-k"
                  />
                  <span className="text-xs font-mono font-semibold text-amber-400 min-w-[50px]" data-testid="label-disk-k">k = {diskK}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="Dist y_k" value={`${diskStats.y.toFixed(2)}"`} />
                  <StatCard label="Chord L(y)" value={`${diskStats.L.toFixed(2)}"`} />
                  <StatCard label="kN (Est)" value={`${diskStats.N}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-sky-400">Donut Pass — Flow to Center</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <CrossSectionSVG activeK={donutK} passType="donut" />
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">Table Row k:</span>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    step={1}
                    value={donutK}
                    onChange={(e) => setDonutK(parseInt(e.target.value))}
                    className="flex-1 accent-amber-400"
                    data-testid="slider-donut-k"
                  />
                  <span className="text-xs font-mono font-semibold text-amber-400 min-w-[50px]" data-testid="label-donut-k">k = {donutK}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="Dist y_k" value={`${donutStats.y.toFixed(2)}"`} />
                  <StatCard label="Chord L(y)" value={`${donutStats.L.toFixed(2)}"`} />
                  <StatCard label="kN (Est)" value={`${donutStats.N}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-green-400">Manual Verification Tool (Verify Printed Table Rows)</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-xs font-mono whitespace-nowrap">Chord Length L(y) from Table:</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={manualLy}
                      onChange={(e) => setManualLy(e.target.value)}
                      className="w-24 text-xs font-mono text-right"
                      data-testid="input-manual-ly"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-xs font-mono whitespace-nowrap">Number of Tubes (kN) in Row:</Label>
                    <Input
                      type="number"
                      value={manualKN}
                      onChange={(e) => setManualKN(e.target.value)}
                      className="w-24 text-xs font-mono text-right"
                      data-testid="input-manual-kn"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-xs font-mono whitespace-nowrap">Baffle Spacing (B):</Label>
                    <Input
                      type="number"
                      value={manualB}
                      onChange={(e) => setManualB(e.target.value)}
                      className="w-24 text-xs font-mono text-right"
                      data-testid="input-manual-b"
                    />
                  </div>
                </div>
                <div className="min-w-[280px] border border-green-500/30 bg-green-500/5 rounded-md p-4">
                  <div className="text-[10px] text-muted-foreground font-mono mb-3">CALCULATED RESULTS</div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono">Gap Width (Wgap):</span>
                    <span className="text-xs font-mono font-bold text-green-400" data-testid="value-wgap">{wgap.toFixed(3)}"</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono">Net Flow Area (A1):</span>
                    <span className="text-sm font-mono font-bold text-amber-400" data-testid="value-a1">{a1.toFixed(2)} sq in</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-3">Formula: A1 = (L(y) - (kN * 2.5)) * B</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
