import { describe, expect, it } from 'vitest';
import { evaluateEnvironmentalImpact, evaluateCompliance } from './esg.js';

describe('esg and compliance layer', () => {
  it('marks strong environmental performance as compliant', () => {
    const result = evaluateEnvironmentalImpact({
      co2eKgPerTon: 220,
      renewableSharePercent: 78,
      waterIntensity: 170,
      wasteDiversionRate: 82,
    });

    expect(result.status).toBe('COMPLIANT');
    expect(result.score).toBeGreaterThan(70);
  });

  it('flags high-risk compliance when emissions and diversion underperform', () => {
    const result = evaluateCompliance({
      co2eKgPerTon: 420,
      renewableSharePercent: 25,
      waterIntensity: 260,
      wasteDiversionRate: 34,
      safetyIncidents: 3,
    });

    expect(result.status).toBe('HIGH_RISK');
    expect(result.reason).toMatch(/compliance|risk|esg/i);
  });
});
