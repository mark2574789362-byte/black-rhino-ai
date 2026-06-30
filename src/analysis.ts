import type { AIOutput, BundleRecommendation, Confidence, DataMetric, ProductInfo, Recommendation } from "./types";

const baseCannotAnalyze = [
  "Sales performance",
  "Profit margin",
  "Inventory turnover",
  "Ad ROI",
  "Real SKU classification"
];

const furtherData = [
  "Sales by SKU",
  "Gross margin",
  "Current inventory",
  "Stock turnover",
  "Ad spend and ROAS",
  "Conversion rate",
  "Repeat purchase records"
];

const fieldLabels: Record<keyof ProductInfo, string> = {
  productName: "Product name",
  brand: "Brand",
  category: "Category",
  price: "Price",
  currentTitle: "Current product title",
  description: "Product description",
  currentSellingPoints: "Current selling points",
  channel: "Target channel",
  targetUser: "Target user",
  consumable: "Consumable flag",
  relatedProducts: "Related products",
  reviewSamples: "Review samples",
  productUrl: "Public product URL"
};

const scoreWeights: Array<[keyof ProductInfo, number]> = [
  ["productName", 12],
  ["brand", 8],
  ["category", 12],
  ["price", 5],
  ["currentTitle", 10],
  ["description", 16],
  ["currentSellingPoints", 10],
  ["channel", 5],
  ["targetUser", 6],
  ["relatedProducts", 8],
  ["reviewSamples", 4],
  ["productUrl", 4]
];

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasMeaningfulField(product: ProductInfo, field: keyof ProductInfo) {
  const value = product[field];

  if (!hasText(value)) return false;

  if (field === "price") {
    return !String(value).toLowerCase().includes("public page price");
  }

  return true;
}

function getMissingFields(product: ProductInfo) {
  return scoreWeights
    .filter(([field]) => !hasMeaningfulField(product, field))
    .map(([field]) => fieldLabels[field]);
}

export function calculateDataSufficiencyScore(product: ProductInfo) {
  return scoreWeights.reduce((score, [field, weight]) => {
    return hasMeaningfulField(product, field) ? score + weight : score;
  }, 0);
}

function productNameWithBrand(product: ProductInfo) {
  const name = product.productName.trim();
  const brand = product.brand.trim();

  if (!brand) return name;
  if (name.toLowerCase().startsWith(brand.toLowerCase())) return name;
  return `${brand} ${name}`.trim();
}

function rec(
  recommendation: string,
  evidence: string,
  validationMetric: string,
  confidence: Confidence = "Medium"
): Recommendation {
  return {
    recommendation,
    evidence,
    confidence,
    validationMetric
  };
}

function bundle(
  name: string,
  items: string[],
  reason: string,
  evidence: string,
  validationMetric: string,
  confidence: Confidence = "Medium"
): BundleRecommendation {
  return {
    name,
    items,
    reason,
    evidence,
    confidence,
    validationMetric
  };
}

function buildCanAnalyze(product: ProductInfo, score: number) {
  const items = [];

  if (hasText(product.productName) && hasText(product.category)) {
    items.push("Product positioning");
    items.push("Initial listing direction");
  }

  if (hasText(product.description) || hasText(product.currentSellingPoints)) {
    items.push("Listing improvement direction");
  }

  if (product.consumable || hasText(product.relatedProducts)) {
    items.push("Bundle opportunity direction");
  }

  if (hasText(product.category) && hasText(product.description)) {
    items.push("SEO keyword direction");
  }

  if (hasText(product.reviewSamples)) {
    items.push("Initial review insight direction");
  }

  if (items.length === 0 && score > 0) {
    items.push("Only basic product identification");
  }

  return items;
}

function buildMetrics(product: ProductInfo): DataMetric[] {
  const metrics: DataMetric[] = [
    {
      metric: "CTR",
      purpose: "Validate whether title and main image changes improve product page traffic."
    },
    {
      metric: "Conversion Rate",
      purpose: "Validate whether listing changes improve purchase decisions."
    },
    {
      metric: "Add-to-cart Rate",
      purpose: "Validate whether the page makes the product easier to consider."
    },
    {
      metric: "Bundle AOV",
      purpose: "Validate whether bundle design increases average order value."
    }
  ];

  metrics.push(
    product.consumable
      ? {
          metric: "Repeat Purchase Rate",
          purpose: "Validate whether consumable or refill demand is being captured."
        }
      : {
          metric: "Product Page Engagement",
          purpose: "Validate whether scenario content keeps users engaged before purchase."
        }
  );

  return metrics;
}

function insufficientOutput(product: ProductInfo, score: number): AIOutput {
  return {
    dataSufficiencyScore: score,
    canAnalyze: buildCanAnalyze(product, score),
    cannotAnalyze: [
      "Complete listing diagnosis",
      "Optimized title with confidence",
      "Specific bundle recommendation",
      "SEO content plan with confidence",
      ...baseCannotAnalyze
    ],
    missingFields: getMissingFields(product),
    productPositioning: rec(
      "当前信息不足以生成完整运营诊断。请先补充商品标题、商品描述、目标渠道、目标用户、是否为耗材、关联产品和评论样本。",
      "Only limited product information was provided, so a complete SKU diagnosis would be unsupported.",
      "Data Sufficiency Score",
      "High"
    ),
    listingDiagnosis: [
      rec(
        "Only a product name is not enough to judge whether the current title, selling points or conversion message are strong.",
        "Current title, description and selling points are missing or incomplete.",
        "Data Sufficiency Score",
        "High"
      ),
      rec(
        "Without current title and description, the tool should not generate a full replacement listing.",
        "Listing diagnosis requires currentTitle and description fields.",
        "Data Sufficiency Score",
        "High"
      ),
      rec(
        "Without related products or review samples, bundle and review insight should stay as a direction, not a conclusion.",
        "relatedProducts and reviewSamples are missing or incomplete.",
        "Data Sufficiency Score",
        "High"
      )
    ],
    optimizedTitle: null,
    sellingPoints: [],
    bundleRecommendation: [],
    seoKeywords: [],
    contentIdeas: [],
    dataNeeded: [
      "Current product title",
      "Product description",
      "Target channel",
      "Target user",
      "Consumable or not",
      "Related products",
      "Review samples"
    ],
    dataMetrics: buildMetrics(product)
  };
}

function consumableOutput(product: ProductInfo, score: number): AIOutput {
  const isLabel = `${product.productName} ${product.category}`.toLowerCase().includes("label");

  return {
    dataSufficiencyScore: score,
    canAnalyze: buildCanAnalyze(product, score),
    cannotAnalyze: baseCannotAnalyze,
    missingFields: getMissingFields(product),
    productPositioning: rec(
      `${product.productName} should be treated as a repeat-purchase or device-ecosystem SKU. The operational focus is not only first conversion, but also compatibility clarity, refill frequency and long-term customer value.`,
      `The product is marked consumable=${product.consumable} and related products include: ${product.relatedProducts || "not provided"}.`,
      "Repeat Purchase Rate",
      product.consumable ? "High" : "Medium"
    ),
    listingDiagnosis: [
      rec(
        "Make compatible models and label sizes easier to scan.",
        "The category and related products indicate labels, refills or printer compatibility.",
        "Conversion Rate",
        "High"
      ),
      rec(
        "Move from generic product wording to concrete use cases such as small shop, home organization, cable labeling or warehouse labels.",
        `The description mentions: ${product.description || "no description provided"}.`,
        "Add-to-cart Rate",
        "Medium"
      ),
      rec(
        "Explain refill logic clearly so users understand what to buy after the first device purchase.",
        "Consumable or label-related SKUs need compatibility and refill clarity to reduce hesitation.",
        "Repeat Purchase Rate",
        "High"
      )
    ],
    optimizedTitle: rec(
      `${productNameWithBrand(product)} for Small Business, Home Organization and Compatible Refill Use`,
      `Built from productName="${product.productName}", brand="${product.brand}", category="${product.category}", and targetUser="${product.targetUser}".`,
      "CTR",
      "Medium"
    ),
    sellingPoints: [
      rec(
        "Designed for users who need repeatable labeling or refill usage in daily operations.",
        "The SKU is treated as consumable or part of a device-consumable ecosystem.",
        "Repeat Purchase Rate",
        "High"
      ),
      rec(
        "Suitable for small businesses, home organization, retail labels and warehouse workflows.",
        `Target user is ${product.targetUser}; description contains labeling or operational usage context.`,
        "Conversion Rate",
        "Medium"
      ),
      rec(
        "Clear compatibility information can reduce purchase hesitation.",
        "Related products and review context point to compatible labels or refill choices.",
        "Add-to-cart Rate",
        "High"
      ),
      rec(
        "Works well as part of a printer plus consumables ecosystem.",
        "Consumable/refill products naturally connect with compatible devices.",
        "Bundle AOV",
        "High"
      ),
      rec(
        "Supports bundle strategies that can improve AOV and repeat purchase value.",
        `relatedProducts="${product.relatedProducts || "not provided"}".`,
        "Bundle AOV",
        product.relatedProducts ? "High" : "Low"
      )
    ],
    bundleRecommendation: [
      bundle(
        isLabel ? "Printer Refill Pack" : "Consumable Refill Pack",
        ["Core refill SKU", "Multi-size refill option", "Scenario-specific consumable", "Compatible device"],
        "This bundle targets users who already entered the device ecosystem and can increase repeat purchase value.",
        "The product is consumable or label-related, so refill packaging is relevant.",
        "Repeat Purchase Rate",
        "High"
      ),
      bundle(
        "Starter + Refill Kit",
        [product.productName, product.relatedProducts || "Compatible refills"],
        "This combination lowers first-purchase friction and makes future refill demand visible from the beginning.",
        `Related products provided: ${product.relatedProducts || "not provided"}.`,
        "Bundle AOV",
        product.relatedProducts ? "High" : "Low"
      )
    ],
    seoKeywords: [
      "label printer south africa",
      "label tape refill",
      "Niimbot labels",
      "small business labels",
      "home organization labels",
      "barcode label printer",
      "thermal label refill",
      "retail price labels"
    ],
    contentIdeas: [
      rec(
        "How to Choose the Right Label Refill for Your Niimbot Printer",
        "Compatibility is a key risk for label/refill SKUs.",
        "SEO Organic Traffic",
        "High"
      ),
      rec(
        "Best Labeling Setups for Small Businesses in South Africa",
        "Small business labeling is a clear product scenario in the provided description.",
        "SEO Organic Traffic",
        "Medium"
      ),
      rec(
        "Home Organization Label Ideas Using a Portable Label Printer",
        "Home organization appears in the product usage context.",
        "SEO Organic Traffic",
        "Medium"
      )
    ],
    dataNeeded: furtherData,
    dataMetrics: buildMetrics(product)
  };
}

function electronicsOutput(product: ProductInfo, score: number): AIOutput {
  return {
    dataSufficiencyScore: score,
    canAnalyze: buildCanAnalyze(product, score),
    cannotAnalyze: baseCannotAnalyze,
    missingFields: getMissingFields(product),
    productPositioning: rec(
      `${product.productName} is a competitive consumer electronics SKU. The key is to reduce comparison friction and shift the listing from parameter-heavy wording to clear usage scenarios.`,
      `The brand/category text includes electronics signals: brand="${product.brand}", category="${product.category}".`,
      "Conversion Rate",
      "High"
    ),
    listingDiagnosis: [
      rec(
        "The listing should make target scenarios more visible: students, office users, commuters and travellers.",
        `The description/target user context includes: ${product.description || product.targetUser}.`,
        "Conversion Rate",
        "Medium"
      ),
      rec(
        "Selling points should explain the daily problem solved, not only product specifications.",
        `Current selling points: ${product.currentSellingPoints || "not provided"}.`,
        "Add-to-cart Rate",
        "Medium"
      ),
      rec(
        "Bundle logic should focus on practical accessory combinations that make purchase decisions easier.",
        `Related products: ${product.relatedProducts || "not provided"}.`,
        "Bundle AOV",
        product.relatedProducts ? "High" : "Low"
      )
    ],
    optimizedTitle: rec(
      `${productNameWithBrand(product)} for Travel, Office, Students and Daily Mobile Charging`,
      `Built from productName="${product.productName}", brand="${product.brand}", and electronics/travel usage context.`,
      "CTR",
      "Medium"
    ),
    sellingPoints: [
      rec(
        "Portable charging support for commuting, travel, campus and office use.",
        "The product description mentions mobile devices, travel, commuting, students or office users.",
        "Conversion Rate",
        "Medium"
      ),
      rec(
        "Designed for users who need backup power during busy daily routines.",
        "Power bank/accessory category implies backup charging use cases.",
        "Add-to-cart Rate",
        "Medium"
      ),
      rec(
        "Pairs naturally with fast charging cables, travel adapters and USB-C accessories.",
        `Related products: ${product.relatedProducts || "not provided"}.`,
        "Bundle AOV",
        product.relatedProducts ? "High" : "Low"
      ),
      rec(
        "Scenario-based selling points help reduce choice difficulty in a crowded 3C category.",
        "3C accessories often compete on similar specifications, so scenario clarity is needed.",
        "Conversion Rate",
        "Medium"
      ),
      rec(
        "Suitable for Takealot conversion and independent store content education.",
        `Target channel is ${product.channel}.`,
        "Product Page Engagement",
        "Medium"
      )
    ],
    bundleRecommendation: [
      bundle(
        "Mobile Work Kit",
        ["Power bank", "Fast charging cable", "USB-C hub", "Travel adapter"],
        "This bundle links the product to office, student and mobile work scenarios while increasing AOV.",
        `Related products provided: ${product.relatedProducts || "not provided"}.`,
        "Bundle AOV",
        product.relatedProducts ? "High" : "Low"
      ),
      bundle(
        "Travel Charging Set",
        ["Power bank", "Wall charger", "USB-C cable"],
        "This set is simple to understand and fits travel, commute and backup charging needs.",
        "Travel/commute scenarios appear in the product description or category context.",
        "Bundle AOV",
        "Medium"
      )
    ],
    seoKeywords: [
      "power bank south africa",
      "portable charger",
      "travel charger",
      "student tech accessories",
      "office charging accessories",
      "fast charging cable",
      "mobile work kit",
      "Baseus power bank"
    ],
    contentIdeas: [
      rec(
        "Best Mobile Charging Accessories for Students in South Africa",
        "Student/mobile accessory use cases are present in the target scenario.",
        "SEO Organic Traffic",
        "Medium"
      ),
      rec(
        "How to Build a Simple Travel Charging Kit",
        "Travel charging is a clear scenario for this SKU.",
        "SEO Organic Traffic",
        "Medium"
      ),
      rec(
        "Power Bank vs Wall Charger: What Should You Carry Daily?",
        "This content helps users compare accessory choices before buying.",
        "Product Page Engagement",
        "Medium"
      )
    ],
    dataNeeded: furtherData,
    dataMetrics: buildMetrics(product)
  };
}

function generalOutput(product: ProductInfo, score: number): AIOutput {
  const isWarehouse = `${product.category} ${product.targetUser} ${product.description}`
    .toLowerCase()
    .includes("warehouse");

  return {
    dataSufficiencyScore: score,
    canAnalyze: buildCanAnalyze(product, score),
    cannotAnalyze: baseCannotAnalyze,
    missingFields: getMissingFields(product),
    productPositioning: rec(
      isWarehouse
        ? `${product.productName} looks closer to a B2B or warehouse operations SKU. The listing should explain business use cases, workflow value and implementation context.`
        : `${product.productName} can be analyzed as a general commerce SKU. The current information supports initial positioning, listing direction, bundle direction and SEO direction only.`,
      `The positioning is based on category="${product.category}", targetUser="${product.targetUser}", and description context.`,
      "Conversion Rate",
      "Medium"
    ),
    listingDiagnosis: [
      rec(
        "Clarify who the product is for before rewriting the title or selling points.",
        `Target user is ${product.targetUser}.`,
        "Conversion Rate",
        "Medium"
      ),
      rec(
        "Translate product features into buyer scenarios and operational benefits.",
        `Description provided: ${product.description || "not provided"}.`,
        "Add-to-cart Rate",
        "Medium"
      ),
      rec(
        "Avoid making sales, margin, inventory or ROI claims without backend data.",
        "No backend sales, margin, inventory or advertising data is available in the current product card.",
        "Data Sufficiency Score",
        "High"
      )
    ],
    optimizedTitle: rec(
      `${productNameWithBrand(product)} for ${product.targetUser} Users`,
      `Built from productName="${product.productName}", brand="${product.brand}", and targetUser="${product.targetUser}".`,
      "CTR",
      "Medium"
    ),
    sellingPoints: [
      rec(
        "Clear product positioning based on target user and use scenario.",
        `Target user is ${product.targetUser}.`,
        "Conversion Rate",
        "Medium"
      ),
      rec(
        "Listing copy should connect product function with a real purchase reason.",
        `Description provided: ${product.description || "not provided"}.`,
        "Add-to-cart Rate",
        "Medium"
      ),
      rec(
        "Bundle opportunities should be based on related products and actual buyer workflow.",
        `Related products: ${product.relatedProducts || "not provided"}.`,
        "Bundle AOV",
        product.relatedProducts ? "Medium" : "Low"
      ),
      rec(
        "SEO content should focus on user questions, not only product keywords.",
        `Category is ${product.category}.`,
        "SEO Organic Traffic",
        "Medium"
      ),
      rec(
        "Further analysis requires backend sales, inventory, margin and ad data.",
        "The current product card does not include backend operating metrics.",
        "Data Sufficiency Score",
        "High"
      )
    ],
    bundleRecommendation: [
      bundle(
        "Scenario Starter Bundle",
        [product.productName, product.relatedProducts || "Related accessory"],
        "A scenario-based bundle can reduce decision cost when related products are clearly connected.",
        `Related products: ${product.relatedProducts || "not provided"}.`,
        "Bundle AOV",
        product.relatedProducts ? "Medium" : "Low"
      )
    ],
    seoKeywords: [
      `${product.category.toLowerCase()} south africa`,
      `${product.brand.toLowerCase()} ${product.category.toLowerCase()}`,
      "business equipment south africa",
      "online store product guide",
      "Takealot product comparison",
      "office product solution",
      "warehouse product solution",
      "Black Rhino product guide"
    ],
    contentIdeas: [
      rec(
        `How to Choose ${product.category} for ${product.targetUser} Users`,
        "The title is based on provided category and target user fields.",
        "SEO Organic Traffic",
        "Medium"
      ),
      rec(
        `Best Use Cases for ${product.productName}`,
        "The product name is available, but detailed use cases should be refined with more description or reviews.",
        "Product Page Engagement",
        "Low"
      ),
      rec(
        `What to Check Before Buying ${product.category} Online`,
        "Category-based education content can support independent-store SEO.",
        "SEO Organic Traffic",
        "Medium"
      )
    ],
    dataNeeded: furtherData,
    dataMetrics: buildMetrics(product)
  };
}

export function generateMockOutput(product: ProductInfo): AIOutput {
  const score = calculateDataSufficiencyScore(product);

  if (score < 55 || !hasText(product.description) || !hasText(product.category)) {
    return insufficientOutput(product, score);
  }

  const text = `${product.productName} ${product.brand} ${product.category}`.toLowerCase();

  if (product.consumable || (hasText(product.relatedProducts) && text.includes("label"))) {
    return consumableOutput(product, score);
  }

  if (text.includes("power") || text.includes("charger") || text.includes("baseus") || text.includes("electronics")) {
    return electronicsOutput(product, score);
  }

  return generalOutput(product, score);
}
