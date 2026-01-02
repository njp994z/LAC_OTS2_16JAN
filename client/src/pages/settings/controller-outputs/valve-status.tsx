import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gauge, AlertTriangle, Info, Wrench, ShieldAlert, Check, XCircle, Bell, Lock, HelpCircle } from "lucide-react";

const valveTagIdentifiers = [
  { tag: "XV-101", note: "XV = on/off valve" },
  { tag: "FV-204", note: "FV = flow valve" },
  { tag: "PV-33A", note: "PV = pressure valve" },
  { tag: "HV-10", note: "HV = hand valve" },
  { tag: "LV-045", note: "LV = level valve" },
  { tag: "CV-552", note: "CV = control valve" }
];

const valveTypeAction = [
  "DA – Direct Acting",
  "RA – Reverse Acting",
  "FO – Fail Open",
  "FC – Fail Close",
  "FL – Fail Locked",
  "NO – Normally Open",
  "NC – Normally Closed"
];

const valveModeIndicators = [
  "AUTO",
  "MAN",
  "CAS (Cascade)",
  "RCAS (Remote Cascade)",
  "REM (Remote)",
  "LOC (Local/Panel)",
  "FCS (Field Control Station mode)",
  "OPR (Operator)"
];

const valveFeedbackSignals = [
  "PV (Position Value)",
  "SP (Setpoint)",
  "OP (Output %)",
  "POS (Valve Position %)",
  "CMD (Commanded Position)",
  "ISH (In Seat High)",
  "ISL (In Seat Low)"
];

const deviceStatusMessages = [
  "OPEN",
  "CLOSED",
  "MOVING",
  "TRAVELING",
  "STOPPED",
  "FAILED",
  "NO SIG",
  "ALM",
  "FLT (Fault)",
  "TRIP",
  "BLOCKED",
  "MAINT",
  "BYPASS",
  "SIM (Simulation Active)"
];

const interlockPermissiveInfo = [
  "ILK (Interlocked)",
  "PMS (Permissive)",
  "NOT READY",
  "READY",
  "SIS (Safety System Active)",
  "ESD (Emergency Shutdown)",
  "SDV (Shutdown Valve)",
  "PSV (Pressure Safety Valve, though usually drawn, not text)"
];

const controllerInformation = [
  "PID",
  "LIC, FIC, PIC, TIC (loop identifier for Level/Flow/Pressure/Temp)",
  "BBL (Backlash/Deadband Compensation)",
  "FF (Feedforward)",
  "PID MODE: AUTO/MAN/CAS"
];

const diagnosticInstrumentInfo = [
  "HART",
  "FOUNDATION FBP",
  "AO",
  "AI",
  "DI",
  "DO",
  "CAL (Calibration Mode)",
  "TEST",
  "SIMULATED / SIM"
];

const safetyOverrideNotes = [
  "OVR (Override)",
  "FRC (Force Applied)",
  "ISO (Isolated)",
  "LOCKOUT",
  "TAGGED OUT",
  "OUT OF SERVICE"
];

const miscellaneousVendor = [
  "CMD → (Direction of command flow)",
  "ILK ← (Direction of interlock flow)",
  "ZSO/ZSC (Zero Signal Open/Close)",
  "HSO/HSC (Hard Stop Open/Close)",
  "SPOLL (Status Polling)",
  "BKCAL (Back Calculation / Feedback)"
];

const alarmCommonTriggers = [
  { trigger: "Travel Deviation", description: "Actual stem position differs significantly from setpoint (e.g., >5-10% deviation for too long) → often causes Failed or Maintenance alert → crossed circle / DA." },
  { trigger: "Stuck Valve / High Friction", description: "Common in sulfur service due to buildup/sticking → Advisory (yellow ✓) or Maintenance alert if trend exceeds limits." },
  { trigger: "Supply Pressure Issues", description: "Low/high instrument air → Failed alert." },
  { trigger: "Travel Sensor Fault", description: "Position feedback failure → Failed (serious, often requires immediate bypass or shutdown)." },
  { trigger: "Relay/I/P Integrity", description: "Degrading actuator components → Maintenance or Advisory." },
  { trigger: "Cycle Counter / Travel Accumulation", description: "Predictive maintenance (e.g., packing wear) → Advisory (yellow ✓)." },
  { trigger: "Communication/Configuration Fault", description: "Loss of HART/FF signal → Failed." },
  { trigger: "Other", description: "Over/under travel, excessive cycling, or partial stroke test failure (if in SIS service)." }
];

const alarmPriorityLevels = [
  { priority: "Failed", color: "red", description: "(highest priority, red) → immediate operator action." },
  { priority: "Maintenance", color: "orange/yellow", description: "(medium, orange/yellow) → plan intervention." },
  { priority: "Advisory", color: "yellow", description: "(lowest, yellow) → monitor or schedule." }
];

const controllerAlarmDifferences = [
  { type: "Valve/Positioner Alarms", focus: "Focus on device health and mechanical performance (e.g., \"Travel Deviation High\", \"Supply Pressure Low\")." },
  { type: "Controller Loop Alarms", focus: "Focus on process (e.g., Flow HI/LO, Deviation, Bad PV)." },
  { note: "Both can flood the alarm list if not rationalized (use DeltaV Alarm Help, AgileOps, or rationalization per ISA-18.2 to prioritize)." }
];

const troubleshootingTips = [
  "Open faceplate → Status/Conditions or Alerts tab for exact message (e.g., \"Travel Deviation > 8% for 5 min\").",
  "Check Event Chronicle or Alarm List for source (usually valve tag or DVC block).",
  "For sulfur service: Inspect stem packing, actuator leaks, clean air supply, retune positioner gains, or run ValveLink diagnostics (friction test, step response).",
  "If recurring: Enable more advanced diagnostics (e.g., PD/AD level in DVC) or schedule partial stroke tests."
];

const faceplateIndicators = [
  { indicator: "Yellow checkmark (✓)", meaning: "Advisory/Maintenance alert (non-critical, e.g., preventive maintenance recommendation, calibration due, or minor diagnostic like high friction trend)." },
  { indicator: "Crossed circle (⊘ or similar X/NO symbol)", meaning: "Failed or Abnormal condition (serious issue requiring immediate attention, e.g., positioner fault, travel deviation beyond limits, or hardware failure)." },
  { indicator: "DA → Device Alert", meaning: "General indicator that the positioner has one or more active PlantWeb/NE-107-style alerts enabled." },
  { indicator: "Lock symbol", meaning: "Valve is locked (e.g., output locked by operator, interlock active, manual override, or device in protected/local mode)." },
  { indicator: "Other icons (e.g., ⓘ for info/help, speaker for unacknowledged alarm)", meaning: "Provide quick access to details or acknowledgement." }
];

interface ListSectionProps {
  title: string;
  items: string[];
}

function ListSection({ title, items }: ListSectionProps) {
  return (
    <div>
      {title && <h3 className="font-semibold text-foreground mb-3">{title}</h3>}
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

export default function ValveStatus() {
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
              <Gauge className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Valve Output Status Messages</h1>
                <p className="text-xs text-muted-foreground">Comprehensive guide for valve status indicators and diagnostics</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  1. Valve Tag / Identifier
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Whatever your plant's tag standard uses
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {valveTagIdentifiers.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{item.tag}</code>
                        <span className="text-muted-foreground ml-2 text-xs">{item.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  2. Valve Type / Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListSection title="" items={valveTypeAction} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  3. Valve Mode Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListSection title="" items={valveModeIndicators} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  4. Valve Feedback Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListSection title="" items={valveFeedbackSignals} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  5. Device Status Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListSection title="" items={deviceStatusMessages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  6. Interlock / Permissive Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListSection title="" items={interlockPermissiveInfo} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  7. Controller Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListSection title="" items={controllerInformation} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  8. Diagnostic / Instrument Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListSection title="" items={diagnosticInstrumentInfo} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  9. Safety or Override Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ListSection title="" items={safetyOverrideNotes} />
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="w-5 h-5 text-primary" />
                  10. Miscellaneous (depending on vendor graphics)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-8">
                  <ul className="space-y-1.5">
                    {miscellaneousVendor.slice(0, 2).map((msg, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{msg}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1.5">
                    {miscellaneousVendor.slice(2, 4).map((msg, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{msg}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-1.5">
                    {miscellaneousVendor.slice(4).map((msg, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{msg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alarms Section */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              Alarms
            </h2>
            
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground mb-3">
                In DeltaV, the <strong>Sulfur Feed Valve (1540-FCV-2602)</strong> generates alarms primarily from the <strong>digital valve controller/positioner</strong> (e.g., FIELDVUE DVC6200/DVC7K series), not just from the connected flow controller loop. These are <strong>device-level alerts</strong> (PlantWeb alerts categorized as <strong>Failed, Maintenance, Advisory</strong>) that appear on the valve faceplate, in the alarm list/banner (if enabled), and in diagnostics tools like ValveLink or AMS Device Manager.
              </p>
              <p className="text-sm text-muted-foreground">
                Alarms are <strong>independent</strong> of the upstream PID controller (which alarms on process variables like flow deviation, PV bad quality, or mode changes). However, they can be indirectly related — e.g., a stuck valve causes both positioner deviation alerts and controller deviation alarms.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* When the Valve Shows an Alarm */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    When the Valve Shows an Alarm
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    The valve faceplate updates in real time when the positioner reports a condition via diagnostics (enabled in DeltaV channel properties or positioner config). Common triggers include:
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alarmCommonTriggers.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-destructive mt-1">•</span>
                        <span>
                          <strong>{item.trigger}</strong> — {item.description}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    These alerts are configurable (thresholds, enable/disable) in the positioner setup.
                  </p>
                </CardContent>
              </Card>

              {/* Alarm Priority Levels */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldAlert className="w-5 h-5 text-destructive" />
                    Alarm Priority Levels
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    In DeltaV, alarms appear as:
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {alarmPriorityLevels.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className={`mt-1 ${item.priority === 'Failed' ? 'text-red-500' : item.priority === 'Maintenance' ? 'text-orange-500' : 'text-yellow-500'}`}>•</span>
                        <span>
                          <strong className={item.priority === 'Failed' ? 'text-red-500' : item.priority === 'Maintenance' ? 'text-orange-500' : 'text-yellow-500'}>{item.priority}</strong> {item.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Key Differences from Controller Alarms */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="w-5 h-5 text-primary" />
                    Key Differences from Controller Alarms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {controllerAlarmDifferences.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span>
                          {item.type ? (
                            <>
                              <strong>{item.type}</strong> → {item.focus}
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">{item.note}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Troubleshooting Tips */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="w-5 h-5 text-primary" />
                    Troubleshooting Tips for This Valve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {troubleshootingTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Visible Indicators on the Faceplate */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gauge className="w-5 h-5 text-primary" />
                    Visible Indicators on the Faceplate
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    The faceplate shows real-time status, control mode, position feedback, and diagnostic indicators from the smart positioner (usually a Fisher FIELDVUE DVC series communicating via HART or FOUNDATION Fieldbus).
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {faceplateIndicators.map((item, idx) => {
                      const getIcon = () => {
                        if (item.indicator.includes('checkmark')) return <Check className="w-5 h-5 text-yellow-500" />;
                        if (item.indicator.includes('Crossed circle')) return <XCircle className="w-5 h-5 text-destructive" />;
                        if (item.indicator.includes('DA')) return <Bell className="w-5 h-5 text-primary" />;
                        if (item.indicator.includes('Lock')) return <Lock className="w-5 h-5 text-muted-foreground" />;
                        return <HelpCircle className="w-5 h-5 text-muted-foreground" />;
                      };
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          {getIcon()}
                          <div>
                            <strong className="text-sm">{item.indicator}</strong>
                            <p className="text-xs text-muted-foreground mt-1">{item.meaning}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Delta V: Controller Outputs | Valve Output Status</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
