/**
 * useL1StaticSimulation
 * =====================
 * Triggers the full-plant static simulation (plant_orchestrator.py) via
 * RTK Query mutation and returns typed results.
 *
 * Usage:
 *   const { run, isRunning, results, error } = useL1StaticSimulation();
 *   run({ compressor_rpm_pct: 85, sulfur_flow_sp_gpm: 75 });
 *
 * Types come from plantSimulationService.ts (PlantSimulationInput / PlantSimulationResult).
 */

import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  useRunPlantSimulationMutation,
  type PlantSimulationInput,
  type PlantSimulationResult,
} from '@/rtkServices/plantSimulationService';

// Re-export the input/result types so callers can import from one place
export type { PlantSimulationInput, PlantSimulationResult };

// ----- Hook -----------------------------------------------------------------------

export interface UseL1StaticSimulationReturn {
  /** Trigger the full-plant simulation */
  run: (inputs?: PlantSimulationInput) => Promise<PlantSimulationResult | null>;
  /** True while the simulation request is in flight */
  isRunning: boolean;
  /** Last successful simulation results (null before first run) */
  results: PlantSimulationResult | null;
  /** Last error message, if any */
  error: string | null;
}

export function useL1StaticSimulation(): UseL1StaticSimulationReturn {
  const { toast } = useToast();
  const [results, setResults] = useState<PlantSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // RTK Query mutation — provides isLoading, isError, etc. internally
  const [runSimulation, { isLoading: isRunning }] = useRunPlantSimulationMutation();

  const run = useCallback(
    async (inputs: PlantSimulationInput = {}): Promise<PlantSimulationResult | null> => {
      if (isRunning) return null;
      setError(null);

      try {
        console.log('[L1 Static Sim] Starting full-plant simulation with inputs:', inputs);

        const data = await runSimulation(inputs).unwrap();

        console.log('[L1 Static Sim] Simulation complete:', data.summary);

        if (!data.success) {
          throw new Error('Simulation returned success=false');
        }

        setResults(data);

        // Show a concise summary toast
        const s = data.summary;
        toast({
          title: '✅ Static Simulation Complete',
          description: [
            `Compressor: ${s.compressor_rpm?.toFixed(0) ?? 'N/A'} RPM (${s.compressor_rpm_pct?.toFixed(1) ?? 'N/A'}%)`,
            `SO₂: ${s.so2_pct_furnace_outlet?.toFixed(2) ?? 'N/A'}%`,
            `Conv: ${s.overall_conv_pct?.toFixed(1) ?? 'N/A'}%`,
            `Acid: ${s.acid_production_mtpd?.toFixed(1) ?? 'N/A'} MTPD`,
          ].join(' | '),
        });

        return data;
      } catch (err) {
        const msg =
          (err as any)?.data?.message ??
          (err instanceof Error ? err.message : 'Failed to run plant simulation');
        console.error('[L1 Static Sim] Error:', err);
        setError(msg);
        toast({
          title: 'Simulation Error',
          description: msg,
          variant: 'destructive',
        });
        return null;
      }
    },
    [isRunning, runSimulation, toast],
  );

  return { run, isRunning, results, error };
}
