export type PlatformStatusLevel = 'GREEN' | 'YELLOW' | 'RED';

export type PlatformStatusInput = {
  totalDevices: number;
  onlineDevices: number;
  criticalAlerts: number;
  androidSyncHealthy: boolean;
  releaseVersion: string;
};

export type PlatformStatusResult = {
  status: PlatformStatusLevel;
  deploymentReady: boolean;
  onlineRatio: number;
  releaseVersion: string;
  reason: string;
};

export type ReleaseReadinessInput = {
  webVersion: string;
  androidVersion: string;
  androidSyncHealthy: boolean;
  criticalAlerts: number;
  onlineDevices: number;
  totalDevices: number;
};

export type ReleaseReadinessResult = {
  ready: boolean;
  reason: string;
  webVersion: string;
  androidVersion: string;
};

export function evaluatePlatformStatus(input: PlatformStatusInput): PlatformStatusResult {
  const onlineRatio = input.totalDevices > 0 ? input.onlineDevices / input.totalDevices : 0;
  const criticalAlerts = Math.max(0, Number(input.criticalAlerts) || 0);
  const hasCoreHealth = onlineRatio >= 0.9 && criticalAlerts <= 1 && input.androidSyncHealthy;
  const status: PlatformStatusLevel = hasCoreHealth ? 'GREEN' : criticalAlerts > 2 || onlineRatio < 0.75 ? 'RED' : 'YELLOW';

  return {
    status,
    deploymentReady: hasCoreHealth,
    onlineRatio: Number(onlineRatio.toFixed(2)),
    releaseVersion: input.releaseVersion,
    reason: hasCoreHealth ? 'All core services are in a healthy state.' : 'Platform health needs attention before rollout.',
  };
}

export function evaluateReleaseReadiness(input: ReleaseReadinessInput): ReleaseReadinessResult {
  const onlineRatio = input.totalDevices > 0 ? input.onlineDevices / input.totalDevices : 0;

  if (!input.androidSyncHealthy) {
    return {
      ready: false,
      reason: 'Android sync is unhealthy; device release cannot proceed.',
      webVersion: input.webVersion,
      androidVersion: input.androidVersion,
    };
  }

  if (input.criticalAlerts > 0) {
    return {
      ready: false,
      reason: 'Critical alerts remain active; resolve them before release.',
      webVersion: input.webVersion,
      androidVersion: input.androidVersion,
    };
  }

  if (onlineRatio < 0.8) {
    return {
      ready: false,
      reason: 'Fleet connectivity is below the deployment threshold.',
      webVersion: input.webVersion,
      androidVersion: input.androidVersion,
    };
  }

  return {
    ready: true,
    reason: 'Release ready for web and Android rollout.',
    webVersion: input.webVersion,
    androidVersion: input.androidVersion,
  };
}
