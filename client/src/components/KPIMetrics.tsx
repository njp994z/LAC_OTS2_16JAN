import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const trainingRuns = [
  {
    runNumber: 1,
    runDate: "12/2/2025",
    scenario: "Dynamic",
    safetyScore: "98%",
    profitabilityScore: "94%",
    compositeScore: "96%",
  },
  {
    runNumber: 2,
    runDate: "12/2/2025",
    scenario: "Start-Up",
    safetyScore: "99%",
    profitabilityScore: "93%",
    compositeScore: "96%",
  },
];

export default function KPIMetrics() {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#1a4a5c] hover:bg-[#1a4a5c]">
            <TableHead className="text-white font-semibold py-3 text-center">Run Number</TableHead>
            <TableHead className="text-white font-semibold py-3 text-center">Run Date</TableHead>
            <TableHead className="text-white font-semibold py-3 text-center">Scenario</TableHead>
            <TableHead className="text-white font-semibold py-3 text-center">Safety Score</TableHead>
            <TableHead className="text-white font-semibold py-3 text-center">Profitability Score</TableHead>
            <TableHead className="text-white font-semibold py-3 text-center">Composite Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainingRuns.map((run) => (
            <TableRow 
              key={run.runNumber}
              className="hover:bg-muted/50"
              data-testid={`row-training-run-${run.runNumber}`}
            >
              <TableCell className="font-medium text-center" data-testid={`cell-run-number-${run.runNumber}`}>
                {run.runNumber}
              </TableCell>
              <TableCell className="text-center" data-testid={`cell-run-date-${run.runNumber}`}>
                {run.runDate}
              </TableCell>
              <TableCell className="text-center" data-testid={`cell-scenario-${run.runNumber}`}>
                {run.scenario}
              </TableCell>
              <TableCell className="text-center" data-testid={`cell-safety-score-${run.runNumber}`}>
                {run.safetyScore}
              </TableCell>
              <TableCell className="text-center" data-testid={`cell-profitability-score-${run.runNumber}`}>
                {run.profitabilityScore}
              </TableCell>
              <TableCell className="text-center" data-testid={`cell-composite-score-${run.runNumber}`}>
                {run.compositeScore}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
