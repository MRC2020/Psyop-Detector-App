export interface ScoringCriteria {
  id: number;
  category: string;
  question: string;
  example: string;
}

export interface AnalysisResult {
  scores: Record<number, number>;
  reasoning: Record<number, string>;
}

export enum RiskLevel {
  LOW = "Low likelihood of a PSYOP",
  MODERATE = "Moderate likelihood—look deeper",
  HIGH = "Strong likelihood—manipulation likely",
  EXTREME = "Overwhelming signs of a PSYOP",
}

export interface ScoreRange {
  min: number;
  max: number;
  level: RiskLevel;
  color: string;
}