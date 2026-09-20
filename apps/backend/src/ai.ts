export type AnomalyMetric = 'temperature' | 'moisture' | 'ph' | 'oxygen';

export type AnomalyInput = {
  temperature?: number;
  moisture?: number;
  ph?: number;
  oxygen?: number;
};

export type AnomalyResult = {
  severity: 'ok' | 'warning' | 'critical';
  metric: AnomalyMetric | 'system';
  message: string;
  score: number;
};

export type ForecastInput = {
  progressPercent: number;
  elapsedHours: number;
  temperature?: number;
  moisture?: number;
  ph?: number;
  oxygen?: number;
};

export type ForecastResult = {
  remainingHours: number;
  projectedYield: number;
  quality: 'stable' | 'watch' | 'critical';
  recommendation: string;
};

export function detectAnomaly(input: AnomalyInput): AnomalyResult {
  if (typeof input.temperature === 'number' && input.temperature > 35) {
    return {
      severity: 'critical',
      metric: 'temperature',
      message: 'Temperature above safe operating range.',
      score: 100,
    };
  }

  if (typeof input.temperature === 'number' && input.temperature > 30) {
    return {
      severity: 'warning',
      metric: 'temperature',
      message: 'Temperature trending above target band.',
      score: 70,
    };
  }

  if (typeof input.moisture === 'number' && (input.moisture > 80 || input.moisture < 20)) {
    return {
      severity: 'critical',
      metric: 'moisture',
      message: 'Moisture level outside safe process band.',
      score: 94,
    };
  }

  if (typeof input.ph === 'number' && (input.ph < 5.8 || input.ph > 8.5)) {
    return {
      severity: 'critical',
      metric: 'ph',
      message: 'pH is outside the recommended operating range.',
      score: 96,
    };
  }

  if (typeof input.oxygen === 'number' && input.oxygen < 18) {
    return {
      severity: 'critical',
      metric: 'oxygen',
      message: 'Oxygen is below the aeration threshold.',
      score: 92,
    };
  }

  return {
    severity: 'ok',
    metric: 'system',
    message: 'System is stable and no anomaly was detected.',
    score: 8,
  };
}

export function generateRecommendation(input: AnomalyInput): string {
  const anomaly = detectAnomaly(input);

  if (anomaly.metric === 'temperature') {
    return 'Reduce heating and increase airflow to cool the batch before the process drifts further.';
  }

  if (anomaly.metric === 'moisture') {
    return 'Adjust hydration or activate drying to bring moisture back inside the control band.';
  }

  if (anomaly.metric === 'ph') {
    return 'Balance the pH toward the neutral operating band and recheck the nutrient mix.';
  }

  if (anomaly.metric === 'oxygen') {
    return 'Increase aeration and inspect the oxygen delivery loop to restore stable respiration.';
  }

  return 'Maintain the current operating setpoint and continue the standard monitoring cadence.';
}

export function generateForecast(input: ForecastInput): ForecastResult {
  const progress = Math.max(0, Math.min(100, Number(input.progressPercent) || 0));
  const elapsedHours = Math.max(0.1, Number(input.elapsedHours) || 1);
  const remainingPercent = Math.max(0, 100 - progress);
  const remainingHours = (remainingPercent / Math.max(1, progress || 1)) * elapsedHours;

  const anomaly = detectAnomaly({
    temperature: input.temperature,
    moisture: input.moisture,
    ph: input.ph,
    oxygen: input.oxygen,
  });

  const quality: ForecastResult['quality'] = anomaly.severity === 'critical' ? 'critical' : anomaly.severity === 'warning' ? 'watch' : 'stable';
  const projectedYield = Math.max(55, Math.min(98, 92 - remainingPercent * 0.12 + (anomaly.severity === 'ok' ? 4 : anomaly.severity === 'warning' ? 1 : -5)));

  return {
    remainingHours: Number(remainingHours.toFixed(1)),
    projectedYield: Number(projectedYield.toFixed(1)),
    quality,
    recommendation: generateRecommendation({
      temperature: input.temperature,
      moisture: input.moisture,
      ph: input.ph,
      oxygen: input.oxygen,
    }),
  };
}
