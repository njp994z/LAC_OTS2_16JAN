import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shapes } from "lucide-react";

const symbolsData = [
  {
    name: "Mode",
    iconType: "mode",
    meaning: "Indicates the mode of the block is not as expected. For PID block: MODE.ACTUAL≠MODE.NORMAL or MODE.TARGET. For DC block: MODE.TARGET or MODE.ACTUAL≠MODE.NORMAL or Permissive is active."
  },
  {
    name: "Not Running",
    iconType: "notRunning",
    meaning: "Icon appears when MSTATUS is: Out of Service, Breakpoint Set, Not Running."
  },
  {
    name: "Bad IO",
    iconType: "badIO",
    meaning: "Visible when BLOCK_ERR has: Out of Service, Readback Failed, Output Failure, Input Failure, Other Error. Bad IO icon is never visible when the Not Running icon is visible."
  },
  {
    name: "Simulate Active",
    iconType: "simulateActive",
    meaning: "Visible when the block is being simulated. Simulate Active icon is never visible when Not Running or Bad IO icons are visible."
  },
  {
    name: "No Permit",
    iconType: "noPermit",
    meaning: "Visible when a permissive condition is active."
  },
  {
    name: "Interlock Bypassed",
    iconType: "interlockBypassed",
    meaning: "Visible when BYPASSED parameter is active."
  },
  {
    name: "Interlocked",
    iconType: "interlocked",
    meaning: "Visible when DC_STATE of the DC block is Shutdown/Interlocked."
  }
];

function ModeIcon() {
  return (
    <div className="w-8 h-8 bg-blue-600 flex items-center justify-center">
      <span className="text-white font-bold text-lg">!</span>
    </div>
  );
}

function NotRunningIcon() {
  return (
    <div className="w-8 h-8 bg-orange-500 flex items-center justify-center gap-0.5">
      <div className="w-1.5 h-4 bg-white" />
      <div className="w-1.5 h-4 bg-white" />
    </div>
  );
}

function BadIOIcon() {
  return (
    <div className="w-8 h-8 bg-red-600 flex items-center justify-center">
      <span className="text-white font-bold text-lg">X</span>
    </div>
  );
}

function SimulateActiveIcon() {
  return (
    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
      <span className="text-white font-bold text-sm">S</span>
    </div>
  );
}

function NoPermitIcon() {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-gray-600 flex items-center justify-center relative">
      <div className="w-6 h-0.5 bg-gray-600 transform rotate-45 absolute" />
    </div>
  );
}

function InterlockBypassedIcon() {
  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-cyan-500 transform rotate-45 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3 h-3 text-cyan-500 transform -rotate-45" fill="currentColor">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
        </svg>
      </div>
    </div>
  );
}

function InterlockedIcon() {
  return (
    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
      <span className="text-white font-bold text-sm">i</span>
    </div>
  );
}

function getIconComponent(iconType: string) {
  switch (iconType) {
    case "mode": return <ModeIcon />;
    case "notRunning": return <NotRunningIcon />;
    case "badIO": return <BadIOIcon />;
    case "simulateActive": return <SimulateActiveIcon />;
    case "noPermit": return <NoPermitIcon />;
    case "interlockBypassed": return <InterlockBypassedIcon />;
    case "interlocked": return <InterlockedIcon />;
    default: return null;
  }
}

export default function Symbols() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/controller-outputs")}
              data-testid="button-back-controller-outputs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Shapes className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Instrument Block Symbols & Descriptions</h1>
                <p className="text-xs text-muted-foreground">Visual symbols and icons used in DeltaV instrument blocks</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shapes className="w-5 h-5 text-primary" />
                DeltaV Faceplate Symbols
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Status indicators and icons that appear in DeltaV instrument blocks and faceplates
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" data-testid="table-symbols">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="text-left py-3 px-4 font-semibold text-foreground w-24">Icon</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbolsData.map((item, idx) => (
                      <tr 
                        key={idx} 
                        className="border-b border-border last:border-b-0 hover-elevate"
                        data-testid={`row-symbol-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground min-w-[100px]">{item.name}</span>
                            {getIconComponent(item.iconType)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-foreground">
                          {item.meaning}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>DeltaV: Controller Outputs | Instrument Block Symbols</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
