import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Activity, CheckSquare } from "lucide-react";

const pvStatusMessages = [
  "PV OK",
  "Bad PV / Bad Input / Faulted PV",
  "PV Out of Range",
  "PV Failed / Sensor Fault",
  "PV Override Active",
  "Tracking PV",
  "PV Simulated / Simulation Active",
  "Manual Input PV",
  "Open Loop PV",
  "Interlock PV Hold",
  "Bad Quality",
  "PV High / PV Low",
  "Rate of Change High"
];

const pvModeMessages = [
  "Normal PV",
  "Remote PV",
  "Feedforward Active (if FF modifies PV)",
  "PV Freeze (Interlock)",
  "Hold PV (OTS / Training)"
];

const outputStatusMessages = [
  "Output OK / Normal Output",
  "Output Limited (Hi/Lo Limit)",
  "Output Saturated",
  "Output Disabled",
  "Output Tracking",
  "Output Overridden",
  "Output Frozen",
  "Output Held (Hold Mode)",
  "Output Forced (Forced Value)",
  "Output Simulated / Simulation Active"
];

const interlockSafetyMessages = [
  "Interlock Active",
  "Trip Active / Shutdown",
  "Output Blocked by Interlock",
  "Fail-Safe Output",
  "Output to 0% (Interlock)",
  "Output to Predefined Value"
];

const outputModeMessages = [
  { message: "Auto", note: "(normally inside a box, but may appear near output if small)" },
  { message: "Manual", note: null },
  { message: "Cascade", note: null },
  { message: "Remote Output", note: null },
  { message: "Tracking Mode", note: null },
  { message: "Bias Only / No Control", note: null }
];

interface ListSectionProps {
  title: string;
  items: string[];
}

function ListSection({ title, items }: ListSectionProps) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-3">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((msg, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground mt-1">•</span>
            <span>{msg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PvOutputMessages() {
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
              <Activity className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Controller Process Value (PV) & Output Status Messages</h1>
                <p className="text-xs text-muted-foreground">PV side and Output side controller message reference</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  PV SIDE (Process Variable) — possible messages
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  These always describe what the controller is <em>reading</em>, <em>perceiving</em>, or <em>being driven by</em>.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ListSection title="PV Status / Source Messages" items={pvStatusMessages} />
                <ListSection title="PV Mode / State Messages" items={pvModeMessages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  OUTPUT SIDE — possible messages
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  These describe what the controller is <em>doing</em> with its output or whether something is <em>blocking</em> that output.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ListSection title="Output Status Messages" items={outputStatusMessages} />
                <ListSection title="Interlock / Safety Messages" items={interlockSafetyMessages} />
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Output Mode Messages</h3>
                  <ul className="space-y-1.5">
                    {outputModeMessages.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>
                          {item.message}
                          {item.note && (
                            <span className="text-muted-foreground ml-1">{item.note}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Delta V: Controller Outputs | PV & Output Status Messages</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
