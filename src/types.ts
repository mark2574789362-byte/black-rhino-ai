export type Channel = "Takealot" | "Independent Store" | "Both";

export type TargetUser = "Home User" | "Small Business" | "Warehouse/Retail" | "All";

export type Confidence = "High" | "Medium" | "Low";

export interface ProductInfo {
  productName: string;
  brand: string;
  category: string;
  price: string;
  currentTitle: string;
  description: string;
  currentSellingPoints: string;
  channel: Channel;
  targetUser: TargetUser;
  consumable: boolean;
  relatedProducts: string;
  reviewSamples: string;
  productUrl: string;
}

export interface BundleRecommendation {
  name: string;
  items: string[];
  reason: string;
  evidence: string;
  confidence: Confidence;
  validationMetric: string;
}

export interface DataMetric {
  metric: string;
  purpose: string;
}

export interface Recommendation {
  recommendation: string;
  evidence: string;
  confidence: Confidence;
  validationMetric: string;
}

export interface AIOutput {
  dataSufficiencyScore: number;
  canAnalyze: string[];
  cannotAnalyze: string[];
  missingFields: string[];
  productPositioning: Recommendation;
  listingDiagnosis: Recommendation[];
  optimizedTitle: Recommendation | null;
  sellingPoints: Recommendation[];
  bundleRecommendation: BundleRecommendation[];
  seoKeywords: string[];
  contentIdeas: Recommendation[];
  dataNeeded: string[];
  dataMetrics: DataMetric[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
