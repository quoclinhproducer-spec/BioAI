export type EnvironmentalImpactInput = {
  co2eKgPerTon: number;
  renewableSharePercent: number;
  waterIntensity: number;
  wasteDiversionRate: number;
};

export type ComplianceInput = {
  co2eKgPerTon: number;
  renewableSharePercent: number;
  waterIntensity: number;
  wasteDiversionRate: number;
  safetyIncidents: number;
};

export type EnvironmentalImpactResult = {
  status: 'COMPLIANT' | 'WATCH' | 'HIGH_RISK';
  score: number;
  carbonIntensity: number;
  renewableSharePercent: number;
  waterIntensity: number;
  wasteDiversionRate: number;
};

export type ComplianceResult = {
  status: 'COMPLIANT' | 'WATCH' | 'HIGH_RISK';
  score: number;
  reason: string;
};

export function evaluateEnvironmentalImpact(input: EnvironmentalImpactInput): EnvironmentalImpactResult {
  const carbonIntensity = Number(input.co2eKgPerTon) || 0;
  const renewableShare = Math.max(0, Math.min(100, Number(input.renewableSharePercent) || 0));
  const waterIntensity = Number(input.waterIntensity) || 0;
  const diversion = Math.max(0, Math.min(100, Number(input.wasteDiversionRate) || 0));

  const score = Math.max(0, Math.min(100,
    60 + (renewableShare - 50) * 0.75 + (80 - carbonIntensity / 6) * 0.3 + (diversion - 50) * 0.4 - (waterIntensity - 150) * 0.08,
  ));

  let status: EnvironmentalImpactResult['status'] = 'COMPLIANT';
  if (carbonIntensity > 350 || renewableShare < 35 || diversion < 50 || waterIntensity > 220) {
    status = 'HIGH_RISK';
  } else if (score < 70 || renewableShare < 60) {
    status = 'WATCH';
  }

  return {
    status,
    score: Number(score.toFixed(1)),
    carbonIntensity,
    renewableSharePercent: Number(renewableShare.toFixed(1)),
    waterIntensity: Number(waterIntensity.toFixed(1)),
    wasteDiversionRate: Number(diversion.toFixed(1)),
  };
}

export function evaluateCompliance(input: ComplianceInput): ComplianceResult {
  const environmental = evaluateEnvironmentalImpact({
    co2eKgPerTon: input.co2eKgPerTon,
    renewableSharePercent: input.renewableSharePercent,
    waterIntensity: input.waterIntensity,
    wasteDiversionRate: input.wasteDiversionRate,
  });
  const safetyIncidentPenalty = input.safetyIncidents * 12;
  const score = Math.max(0, Math.min(100, environmental.score - safetyIncidentPenalty));

  let status: ComplianceResult['status'] = 'COMPLIANT';
  let reason = 'ESG performance is within compliance thresholds for the active operating window.';

  if (score < 60 || environmental.status === 'HIGH_RISK' || input.safetyIncidents > 2) {
    status = 'HIGH_RISK';
    reason = 'Environmental and safety controls are outside compliance targets; immediate corrective action is required.';
  } else if (score < 75 || environmental.status === 'WATCH') {
    status = 'WATCH';
    reason = 'ESG metrics require attention to maintain regulatory compliance during the next cycle.';
  }

  return {
    status,
    score: Number(score.toFixed(1)),
    reason,
  };
}
