import type { AIOutput, BundleRecommendation, ProductInfo, Recommendation, ValidationResult } from "./types";

const unsupportedClaimPatterns = [
  /\b(high|strong|good|poor|low)\s+sales\b/i,
  /\bsales\s+(are|is|will be|should be)\b/i,
  /\bprofit\s+(margin|is|will be|should be)\b/i,
  /\b(high|low)\s+margin\b/i,
  /\binventory\s+(risk|turnover|pressure|shortage|overstock)\b/i,
  /\bstock\s+(risk|turnover|shortage|overstock)\b/i,
  /\b(ad|advertising)\s+(roi|roas|performance)\b/i,
  /\b(real\s+)?sku\s+abc\s+classification\b/i,
  /\bthis\s+sku\s+is\s+(a|an)\s+(a|b|c)\s+class\b/i
];

const metadataFields = ["evidence", "confidence", "validationMetric"] as const;

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function collectRecommendationText(item: Recommendation | BundleRecommendation) {
  if ("recommendation" in item) {
    return [item.recommendation, item.evidence, item.validationMetric].join(" ");
  }

  return [item.name, item.items.join(" "), item.reason, item.evidence, item.validationMetric].join(" ");
}

function validateMetadata(
  label: string,
  item: Recommendation | BundleRecommendation,
  errors: string[],
  warnings: string[]
) {
  for (const field of metadataFields) {
    if (!hasText(item[field])) {
      errors.push(`${label} is missing ${field}.`);
    }
  }

  if (item.confidence === "High" && /not provided|missing|unknown/i.test(item.evidence)) {
    warnings.push(`${label} has High confidence but weak evidence.`);
  }
}

function validateUnsupportedClaims(label: string, text: string, errors: string[]) {
  for (const pattern of unsupportedClaimPatterns) {
    if (pattern.test(text)) {
      errors.push(`${label} contains unsupported backend-data claim: "${text.slice(0, 140)}".`);
      return;
    }
  }
}

function validateRecommendationList(
  label: string,
  items: Recommendation[],
  errors: string[],
  warnings: string[]
) {
  items.forEach((item, index) => {
    const itemLabel = `${label}[${index}]`;
    validateMetadata(itemLabel, item, errors, warnings);
    validateUnsupportedClaims(itemLabel, collectRecommendationText(item), errors);
  });
}

export function validateAIOutput(output: AIOutput, product: ProductInfo): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Number.isFinite(output.dataSufficiencyScore)) {
    errors.push("dataSufficiencyScore must be a finite number.");
  }

  validateMetadata("productPositioning", output.productPositioning, errors, warnings);
  validateUnsupportedClaims("productPositioning", collectRecommendationText(output.productPositioning), errors);

  validateRecommendationList("listingDiagnosis", output.listingDiagnosis, errors, warnings);
  validateRecommendationList("sellingPoints", output.sellingPoints, errors, warnings);
  validateRecommendationList("contentIdeas", output.contentIdeas, errors, warnings);

  if (output.optimizedTitle) {
    validateMetadata("optimizedTitle", output.optimizedTitle, errors, warnings);
    validateUnsupportedClaims("optimizedTitle", collectRecommendationText(output.optimizedTitle), errors);
  }

  output.bundleRecommendation.forEach((item, index) => {
    const label = `bundleRecommendation[${index}]`;
    validateMetadata(label, item, errors, warnings);
    validateUnsupportedClaims(label, collectRecommendationText(item), errors);

    if (!hasText(product.relatedProducts) && item.confidence !== "Low") {
      warnings.push(`${label} should be Low confidence because relatedProducts is empty.`);
    }
  });

  const allText = [
    output.productPositioning.evidence,
    ...output.listingDiagnosis.map((item) => item.evidence),
    ...output.sellingPoints.map((item) => item.evidence),
    ...output.contentIdeas.map((item) => item.evidence)
  ].join(" ");

  if (!hasText(product.reviewSamples) && /\breview|customer says|customers say|feedback\b/i.test(allText)) {
    warnings.push("Output references reviews or customer feedback, but reviewSamples is empty.");
  }

  if (output.dataSufficiencyScore < 55) {
    if (output.bundleRecommendation.length > 0) {
      errors.push("Low sufficiency output must not include bundleRecommendation.");
    }

    if (output.seoKeywords.length > 0 || output.contentIdeas.length > 0) {
      errors.push("Low sufficiency output must not include full SEO recommendations.");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}
