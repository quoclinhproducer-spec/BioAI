import { describe, expect, it } from 'vitest';
import { detectAnomaly, generateForecast, generateRecommendation } from './ai.js';

describe('ai decision layer', () => {
  it('flags a critical anomaly when process metrics move out of range', () => {
    const result = detectAnomaly({ temperature: 39.5, moisture: 82, ph: 8.8, oxygen: 16 });

    expect(result.severity).toBe('critical');
    expect(result.metric).toMatch(/temperature|moisture|ph|oxygen/i);
  });

  it('creates a corrective recommendation for a temperature spike', () => {
    const recommendation = generateRecommendation({ temperature: 39.5, moisture: 60, ph: 7.1, oxygen: 20 });

    expect(recommendation).toMatch(/cool|airflow|heating/i);
  });

  it('projects the remaining process time from progress and elapsed hours', () => {
    const forecast = generateForecast({ progressPercent: 60, elapsedHours: 8, temperature: 26, moisture: 58, ph: 7.1 });

    expect(forecast.remainingHours).toBeGreaterThan(0);
    expect(forecast.quality).toMatch(/stable|watch|critical/i);
  });
});
