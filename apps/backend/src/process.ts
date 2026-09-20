export type BatchPhase = 'PREP' | 'FERMENTATION' | 'DRYING' | 'FINALIZE';
export type BatchStateName = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'BLOCKED';

export type BatchStateInput = {
  phase: BatchPhase;
  startedAt: string | null;
  completedAt: string | null;
  progressPercent: number;
};

export type BatchStateResult = {
  state: BatchStateName;
  progressPercent: number;
  phase: BatchPhase;
};

export function evaluateBatchState(input: BatchStateInput): BatchStateResult {
  const capped = Math.max(0, Math.min(100, Number(input.progressPercent) || 0));

  if (input.startedAt && input.completedAt && capped >= 100) {
    return { state: 'COMPLETED', progressPercent: 100, phase: input.phase };
  }

  if (input.startedAt && !input.completedAt) {
    return { state: 'RUNNING', progressPercent: capped, phase: input.phase };
  }

  if (!input.startedAt) {
    return { state: 'PENDING', progressPercent: 0, phase: input.phase };
  }

  if (input.completedAt) {
    return { state: 'COMPLETED', progressPercent: capped >= 100 ? 100 : capped, phase: input.phase };
  }

  return { state: 'BLOCKED', progressPercent: capped, phase: input.phase };
}
