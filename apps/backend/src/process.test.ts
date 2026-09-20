import { describe, expect, it } from 'vitest';
import { evaluateBatchState, type BatchStateInput } from './process.js';

describe('batch state engine', () => {
  it('marks a batch as running when the phase has started', () => {
    const input: BatchStateInput = {
      phase: 'PREP',
      startedAt: new Date(Date.now() - 60000).toISOString(),
      completedAt: null,
      progressPercent: 35,
    };

    const result = evaluateBatchState(input);
    expect(result.state).toBe('RUNNING');
  });

  it('marks a completed batch as finished', () => {
    const input: BatchStateInput = {
      phase: 'FINALIZE',
      startedAt: new Date(Date.now() - 120000).toISOString(),
      completedAt: new Date().toISOString(),
      progressPercent: 100,
    };

    const result = evaluateBatchState(input);
    expect(result.state).toBe('COMPLETED');
  });
});
