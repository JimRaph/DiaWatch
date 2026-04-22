import { CheckupEntry } from "../types/index";

interface FeatureStats {
  feature: string;
  avgImpact: number;
  maxImpact: number;
  minImpact: number;
  occurrenceCount: number;
  trend: "improving" | "worsening" | "stable";
  recentAvg: number;
  olderAvg: number;
}

export function analyzeShapFeatures(history: CheckupEntry[]): FeatureStats[] {
  const featureMap = new Map<
    string,
    {
      impacts: number[];
      recentImpacts: number[]; 
      olderImpacts: number[]; 
    }
  >();

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const splitIndex = Math.floor(sortedHistory.length * 0.7);

  sortedHistory.forEach((entry, index) => {
    entry.top_risk_factors?.forEach((factor) => {
      if (!featureMap.has(factor.feature)) {
        featureMap.set(factor.feature, {
          impacts: [],
          recentImpacts: [],
          olderImpacts: [],
        });
      }

      const stats = featureMap.get(factor.feature)!;
      stats.impacts.push(factor.impact);

      if (index >= splitIndex) {
        stats.recentImpacts.push(factor.impact);
      } else {
        stats.olderImpacts.push(factor.impact);
      }
    });
  });

  return Array.from(featureMap.entries())
    .map(([feature, stats]) => {
      const avg = (arr: number[]) =>
        arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
      const recentAvg = avg(stats.recentImpacts);
      const olderAvg = avg(stats.olderImpacts);

      const diff = recentAvg - olderAvg;
      const trend: "improving" | "worsening" | "stable" =
        Math.abs(diff) < 0.1 ? "stable" : diff > 0 ? "worsening" : "improving";

      return {
        feature,
        avgImpact: avg(stats.impacts),
        maxImpact: Math.max(...stats.impacts),
        minImpact: Math.min(...stats.impacts),
        occurrenceCount: stats.impacts.length,
        trend,
        recentAvg,
        olderAvg,
      };
    })
    .sort((a, b) => Math.abs(b.avgImpact) - Math.abs(a.avgImpact)); 
}

export function getTopRiskFactors(entry: CheckupEntry, limit: number = 3) {
  if (!entry.top_risk_factors) return [];
  return [...entry.top_risk_factors]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, limit);
}
