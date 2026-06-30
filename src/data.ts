import type { ProductInfo } from "./types";

export const emptyProduct: ProductInfo = {
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
};

export const sampleProducts: Array<ProductInfo & { id: string; label: string }> = [
  {
    id: "niimbot-b21",
    label: "Demo 1: Niimbot B21",
    productName: "Niimbot B21 Label Printer",
    brand: "Niimbot",
    category: "Business Label Printer",
    price: "Public page price",
    currentTitle: "NIIMBOT B21 Portable Label Printer",
    description:
      "Portable thermal label printer for small business, retail labeling, home organization, price tags, barcode labels and warehouse labels.",
    currentSellingPoints:
      "Portable label printer. No ink required. Supports different label types. Good for daily business and home use.",
    channel: "Both",
    targetUser: "All",
    consumable: true,
    relatedProducts: "Series B labels, transparent labels, cable labels, price tag labels",
    reviewSamples:
      "Easy to use for small shop labels. Useful for home storage boxes. Need clearer guidance on compatible label sizes.",
    productUrl: "https://www.takealot.com/seller/black-rhino?sellers=29874627"
  },
  {
    id: "niimbot-labels",
    label: "Demo 2: Niimbot Labels",
    productName: "Niimbot Series B Label Tapes",
    brand: "Niimbot",
    category: "Label Printer Consumables",
    price: "Public page price",
    currentTitle: "NIIMBOT Series B Label Tapes",
    description:
      "Replacement label tapes for compatible Niimbot label printers, suitable for storage labels, cable labels, price tags and daily business labeling.",
    currentSellingPoints:
      "Replacement labels. Multiple scenarios. Suitable for compatible Niimbot devices.",
    channel: "Both",
    targetUser: "All",
    consumable: true,
    relatedProducts: "Niimbot B21 printer, transparent labels, cable labels, multi-size refill packs",
    reviewSamples:
      "Customers care about compatibility, label size and whether the refill works with their printer model.",
    productUrl: "https://www.niimbotonline.co.za/"
  },
  {
    id: "baseus-power",
    label: "Demo 3: Baseus Power Bank",
    productName: "Baseus Portable Power Bank",
    brand: "Baseus",
    category: "Consumer Electronics Accessory",
    price: "Public page price",
    currentTitle: "Baseus Portable Power Bank",
    description:
      "Portable charging accessory for phones, tablets and daily mobile devices, suitable for travel, commuting, students and office users.",
    currentSellingPoints:
      "Portable design. Fast charging support. Useful for phones and tablets. Suitable for travel and office use.",
    channel: "Both",
    targetUser: "All",
    consumable: false,
    relatedProducts: "Fast charging cable, USB-C hub, travel adapter, wall charger",
    reviewSamples:
      "Users compare charging speed, weight, portability and compatibility with common mobile devices.",
    productUrl: "https://www.blackrhinoshop.co.za/"
  }
];

export const promptTemplate = `Important rule:
Do not make unsupported conclusions.

If the provided product information is insufficient, clearly state what cannot be analyzed and what additional data is needed.

Do not infer sales performance, profit margin, inventory risk, advertising ROI or real SKU classification unless backend data is provided.

You must return valid JSON only.

Required JSON shape:
{
  "dataSufficiencyScore": 72,
  "canAnalyze": [],
  "cannotAnalyze": [],
  "missingFields": [],
  "productPositioning": {
    "recommendation": "",
    "evidence": "",
    "confidence": "High | Medium | Low",
    "validationMetric": ""
  },
  "listingDiagnosis": [
    {
      "recommendation": "",
      "evidence": "",
      "confidence": "High | Medium | Low",
      "validationMetric": ""
    }
  ],
  "optimizedTitle": {
    "recommendation": "",
    "evidence": "",
    "confidence": "High | Medium | Low",
    "validationMetric": "CTR"
  },
  "sellingPoints": [],
  "bundleRecommendation": [
    {
      "name": "",
      "items": [],
      "reason": "",
      "evidence": "",
      "confidence": "High | Medium | Low",
      "validationMetric": "Bundle AOV"
    }
  ],
  "seoKeywords": [],
  "contentIdeas": [],
  "dataNeeded": [],
  "dataMetrics": []
}`;
