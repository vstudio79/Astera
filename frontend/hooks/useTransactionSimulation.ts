import { useState, useEffect, useRef } from 'react';
import type { FeeEstimate } from '@/lib/simulateFee';

export type SimulationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface SimulationState {
  status: SimulationStatus;
  feeEstimate: FeeEstimate | null;
  error: string | null;
}

export function useTransactionSimulation(
  simulateFn: () => Promise<FeeEstimate> | null,
  enabled: boolean,
): SimulationState {
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const simulateFnRef = useRef(simulateFn);

  useEffect(() => {
    simulateFnRef.current = simulateFn;
  }, [simulateFn]);

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('idle');
      setFeeEstimate(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setStatus('loading');
      setError(null);

      try {
        const fn = simulateFnRef.current();
        if (!fn) {
          if (!cancelled) setStatus('idle');
          return;
        }
        const result = await fn;
        if (!cancelled) {
          setFeeEstimate(result);
          setStatus('success');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Simulation failed');
          setStatus('error');
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { status, feeEstimate, error };
}
