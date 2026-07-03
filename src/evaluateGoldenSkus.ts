import { generateMockOutput } from "./analysis";
import { goldenSkuCases } from "./golden-skus";
import { validateAIOutput } from "./validator";
import type { AIOutput } from "./types";

interface DimensionScore {
  name: string;
  score: number;
  max: number;
  notes: string[];
}

function flattenOutput(output: AIOutput) {
  return [
    output.productPositioning.recommendation,
    output.productPositioning.evidence,
    ...output.listingDiagnosis.flatMap((item) => [item.recommendation, item.evidence, item.validationMetric]),
    output.optimizedTitle?.recommendation || "",
    output.optimizedTitle?.evidence || "",
    ...output.sellingPoints.flatMap((item) => [item.recommendation, item.evidence, item.validationMetric]),
    ...output.bundleRecommendation.flatMap((item) => [
      item.name,
      item.items.join(" "),
      item.reason,
      item.evidence,
      item.validationMetric
    ]),
    ...output.seoKeywords,
    ...output.contentIdeas.flatMap((item) => [item.recommendation, item.evidence, item.validationMetric]),
    ...output.cannotAnalyze,
    ...output.dataNeeded,
    ...output.dataMetrics.flatMap((item) => [item.metric, item.purpose])
  ]
    .join(" ")
    .toLowerCase();
}

function flattenActionableOutput(output: AIOutput) {
  return [
    output.productPositioning.recommendation,
    output.productPositioning.evidence,
    ...output.listingDiagnosis.flatMap((item) => [item.recommendation, item.evidence, item.validationMetric]),
    output.optimizedTitle?.recommendation || "",
    output.optimizedTitle?.evidence || "",
    ...output.sellingPoints.flatMap((item) => [item.recommendation, item.evidence, item.validationMetric]),
    ...output.bundleRecommendation.flatMap((item) => [
      item.name,
      item.items.join(" "),
      item.reason,
      item.evidence,
      item.validationMetric
    ]),
    ...output.contentIdeas.flatMap((item) => [item.recommendation, item.evidence, item.validationMetric])
  ]
    .join(" ")
    .toLowerCase();
}

function countKeywordHits(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
}

function proportionalScore(max: number, hits: number, total: number) {
  if (total === 0) return max;
  return Math.round((max * hits) / total);
}

function scoreDataBoundary(output: AIOutput, text: string, forbiddenClaims: string[]): DimensionScore {
  const validation = validateAIOutput(output, {
    productName: "",
    brand: "",
    category: "",
    price: "",
    currentTitle: "",
    description: "",
    currentSellingPoints: "",
    channel: "Both",
    targetUser: "All",
    consumable: false,
    relatedProducts: "",
    reviewSamples: "",
    productUrl: ""
  });

  const forbiddenHits = forbiddenClaims.filter((claim) => text.includes(claim.toLowerCase()));
  const notes: string[] = [];
  let score = 30;

  if (!output.cannotAnalyze.includes("Sales performance")) {
    score -= 5;
    notes.push("Missing Sales performance in cannotAnalyze.");
  }

  if (!output.cannotAnalyze.includes("Profit margin")) {
    score -= 5;
    notes.push("Missing Profit margin in cannotAnalyze.");
  }

  if (!output.cannotAnalyze.includes("Inventory turnover")) {
    score -= 5;
    notes.push("Missing Inventory turnover in cannotAnalyze.");
  }

  if (!output.cannotAnalyze.includes("Ad ROI")) {
    score -= 5;
    notes.push("Missing Ad ROI in cannotAnalyze.");
  }

  if (forbiddenHits.length > 0) {
    score -= Math.min(10, forbiddenHits.length * 5);
    notes.push(`Forbidden claims found: ${forbiddenHits.join(", ")}.`);
  }

  if (!validation.ok) {
    score -= 10;
    notes.push(`Validator errors: ${validation.errors.join("; ")}`);
  }

  return {
    name: "Data boundary",
    score: Math.max(0, score),
    max: 30,
    notes
  };
}

function scoreKeywordDimension(name: string, max: number, text: string, keywords: string[]): DimensionScore {
  const hits = countKeywordHits(text, keywords);
  const score = proportionalScore(max, hits, keywords.length);

  return {
    name,
    score,
    max,
    notes:
      score === max
        ? []
        : [`Expected keywords hit ${hits}/${keywords.length}: ${keywords.join(", ")}.`]
  };
}

function scoreLanguage(output: AIOutput, text: string): DimensionScore {
  const overclaimWords = ["guarantee", "definitely", "must increase", "will increase sales"];
  const hits = overclaimWords.filter((word) => text.includes(word));
  const hasMetrics = output.dataMetrics.length >= 4;
  const score = Math.max(0, 5 - hits.length * 2 - (hasMetrics ? 0 : 1));

  return {
    name: "Professional tone",
    score,
    max: 5,
    notes: [
      ...hits.map((word) => `Overclaim wording found: ${word}.`),
      ...(hasMetrics ? [] : ["Expected at least 4 validation metrics."])
    ]
  };
}

function evaluateCase(goldenCase: (typeof goldenSkuCases)[number]) {
  const output = generateMockOutput(goldenCase.product);
  const text = flattenOutput(output);
  const actionableText = flattenActionableOutput(output);

  const dimensions = [
    scoreDataBoundary(output, actionableText, goldenCase.forbiddenClaims),
    scoreKeywordDimension("Product positioning", 20, text, goldenCase.expectedPositioningKeywords),
    scoreKeywordDimension("Listing specificity", 20, text, goldenCase.expectedListingKeywords),
    scoreKeywordDimension("Bundle executability", 15, text, goldenCase.expectedBundleKeywords),
    scoreKeywordDimension("SEO scenario fit", 10, text, goldenCase.expectedSeoKeywords),
    scoreLanguage(output, text)
  ];

  const total = dimensions.reduce((sum, item) => sum + item.score, 0);

  return {
    id: goldenCase.id,
    name: goldenCase.name,
    total,
    dimensions,
    output
  };
}

const results = goldenSkuCases.map(evaluateCase);
const average = Math.round(results.reduce((sum, item) => sum + item.total, 0) / results.length);
const failing = results.filter((item) => item.total < 80);

for (const result of results) {
  const status = result.total >= 80 ? "PASS" : "FAIL";
  console.log(`\n[${status}] ${result.name}: ${result.total}/100`);

  for (const dimension of result.dimensions) {
    console.log(`  - ${dimension.name}: ${dimension.score}/${dimension.max}`);
    for (const note of dimension.notes) {
      console.log(`    * ${note}`);
    }
  }
}

console.log(`\nAverage score: ${average}/100`);

if (failing.length > 0) {
  console.error(`Failing cases: ${failing.map((item) => `${item.name} (${item.total})`).join(", ")}`);
  process.exit(1);
}

console.log("All Golden SKU cases passed.");
