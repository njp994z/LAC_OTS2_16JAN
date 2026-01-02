import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Radio, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface StatusEntry {
  primaryQuality: "Good" | "Uncertain" | "Bad";
  limitState: string;
  subStatusExamples: string;
  commonTriggers: string;
}

const statusData: StatusEntry[] = [
  {
    primaryQuality: "Good",
    limitState: "Not Limited",
    subStatusExamples: "N/A",
    commonTriggers: "Normal operation, valid sensor signal (e.g., 4-20 mA in range)."
  },
  {
    primaryQuality: "Good",
    limitState: "Constant",
    subStatusExamples: "N/A",
    commonTriggers: "Output held steady (e.g., tracking)."
  },
  {
    primaryQuality: "Good",
    limitState: "Low Limited",
    subStatusExamples: "N/A",
    commonTriggers: "Value at/below low limit but valid."
  },
  {
    primaryQuality: "Good",
    limitState: "High Limited",
    subStatusExamples: "N/A",
    commonTriggers: "Value at/above high limit but valid."
  },
  {
    primaryQuality: "Uncertain",
    limitState: "Not Limited",
    subStatusExamples: "Non-specific; Last Usable Value; Engineering Units Range Violation; Instrument Out of Calibration; Electromotive Force Too Low",
    commonTriggers: "Manual mode (if option set); minor signal issues; uses last good value."
  },
  {
    primaryQuality: "Uncertain",
    limitState: "Constant",
    subStatusExamples: "Last Usable Value (common)",
    commonTriggers: "Held value from prior good reading."
  },
  {
    primaryQuality: "Uncertain",
    limitState: "Low/High Limited",
    subStatusExamples: "Non-specific",
    commonTriggers: "Limited but questionable validity."
  },
  {
    primaryQuality: "Bad",
    limitState: "N/A",
    subStatusExamples: "Non-specific; No Communication; Device Failure; Sensor Failure/I-O Failure; Out of Service; Block Configuration Error; Loop Check",
    commonTriggers: "Open/short circuit, >25 mA/<0 mA, comm loss, OOS mode, hardware fault → displays \"NO DATA\"."
  }
];

function getQualityIcon(quality: string) {
  switch (quality) {
    case "Good":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "Uncertain":
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case "Bad":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
}

function getQualityBadgeVariant(quality: string): "default" | "secondary" | "destructive" | "outline" {
  switch (quality) {
    case "Good":
      return "default";
    case "Uncertain":
      return "secondary";
    case "Bad":
      return "destructive";
    default:
      return "outline";
  }
}

export default function SensorOutputs() {
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
              <Radio className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Delta V Sensor Outputs</h1>
                <p className="text-xs text-muted-foreground">AI Block STATUS parameter reference for process sensors</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instrument Block Sensor Outputs</CardTitle>
              <CardDescription>
                In Emerson DeltaV DCS, instrument blocks (such as Analog Input or AI blocks used for sensors like pressure indicators/PI) provide processed sensor data via key outputs: primarily the OUT parameter (scaled engineering units value) and its associated STATUS parameter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">STATUS Output Structure</h3>
                <p className="text-sm text-muted-foreground">
                  The STATUS output follows the Foundation Fieldbus (FF) model used across DeltaV function blocks, indicating data quality. It combines:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4">
                  <li><span className="font-medium text-foreground">Primary quality:</span> Good, Uncertain, or Bad</li>
                  <li><span className="font-medium text-foreground">Limit state</span> (for Good or Uncertain): Not Limited (default), Constant, Low Limited, or High Limited</li>
                  <li><span className="font-medium text-foreground">Sub-status:</span> Specific reasons, especially for Uncertain/Bad conditions</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Faceplate Visualization</h3>
                <p className="text-sm text-muted-foreground">
                  On faceplates or graphics (like a PI block showing "NO DATA"), statuses are visualized with colors/icons and text:
                </p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Green = Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm">Yellow = Uncertain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm">Red = Bad (e.g., "NO DATA")</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>STATUS Output Reference Table</CardTitle>
              <CardDescription>
                Comprehensive list based on DeltaV/FF standards, AI block behavior, and I/O channel conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Primary Quality</TableHead>
                      <TableHead className="w-[140px]">Limit State</TableHead>
                      <TableHead className="w-[300px]">Sub-Status Examples</TableHead>
                      <TableHead>Common Triggers/Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusData.map((row, index) => (
                      <TableRow key={index} data-testid={`row-status-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getQualityIcon(row.primaryQuality)}
                            <Badge variant={getQualityBadgeVariant(row.primaryQuality)}>
                              {row.primaryQuality}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{row.limitState}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.subStatusExamples}</TableCell>
                        <TableCell className="text-sm">{row.commonTriggers}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Numeric Representation (Internal)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Good: ~128 (0x80)</li>
                    <li>Uncertain: ~64 (0x40)</li>
                    <li>Bad: 0</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">AI Block Behavior</h4>
                  <p className="text-sm text-muted-foreground">
                    AI block propagates channel status (from I/O card) to OUT/STATUS, modified by STATUS_OPTS (e.g., Bad if &gt;110% or &lt; -10%).
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Example: PI Block "NO DATA"</h4>
                <p className="text-sm text-muted-foreground">
                  For a tag like 1540PI5205 (likely AI-backed PI), "NO DATA" + red X indicates Bad status, typically caused by wiring or communication issues.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Documentation Reference</h4>
                <p className="text-sm text-muted-foreground">
                  Full details available in DeltaV Books Online &gt; Function Block Reference (AI block section) or Monitor/Control Software PDS. This covers native I/O, HART, and Fieldbus instruments. For custom blocks, statuses propagate similarly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Delta V Sensor Outputs | AI Block STATUS Reference</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
