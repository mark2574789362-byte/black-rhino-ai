import { emptyProduct } from "./data";
import type { Channel, ProductInfo, TargetUser } from "./types";

export interface ParsedProductCandidate {
  id: string;
  label: string;
  product: ProductInfo;
}

const knownBrands = ["Niimbot", "Baseus", "Hisense", "Deli", "Black Rhino"];

const noisePatterns = [
  /^add to cart$/i,
  /^buy now$/i,
  /^in stock$/i,
  /^out of stock$/i,
  /^home$/i,
  /^search$/i,
  /^reviews?$/i,
  /^description$/i,
  /^specifications?$/i,
  /^related products?$/i,
  /^you may also like$/i
];

function normalizeLines(rawText: string) {
  return rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !noisePatterns.some((pattern) => pattern.test(line)));
}

function splitProductBlocks(rawText: string) {
  const normalized = rawText.replace(/\r/g, "").trim();
  if (!normalized) return [];

  const manualBlocks = normalized
    .split(/\n\s*-{3,}\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  if (manualBlocks.length > 1) return manualBlocks;

  const lines = normalizeLines(normalized);
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const startsNewUrlBlock = /^https?:\/\//i.test(line) && current.length > 0;
    if (startsNewUrlBlock) {
      blocks.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length) blocks.push(current.join("\n"));

  return blocks.length ? blocks : [normalized];
}

function findUrl(lines: string[]) {
  return lines.find((line) => /^https?:\/\//i.test(line)) || "";
}

function findPrice(lines: string[]) {
  const priceLine = lines.find((line) => /\b(R|ZAR)\s?\d[\d\s,.]*/i.test(line));
  if (!priceLine) return "";
  return priceLine.match(/\b(R|ZAR)\s?\d[\d\s,.]*/i)?.[0].trim() || "";
}

function inferBrand(text: string, title: string) {
  const known = knownBrands.find((brand) => new RegExp(`\\b${brand}\\b`, "i").test(text));
  if (known) return known;

  const firstWord = title.match(/[A-Za-z][A-Za-z0-9-]+/)?.[0];
  return firstWord || "";
}

function inferCategory(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("label tape") || lower.includes("label tapes") || lower.includes("label refill")) {
    return "Label Printer Consumables";
  }

  if (lower.includes("label printer") || lower.includes("thermal printer") || lower.includes("barcode printer")) {
    return "Business Label Printer";
  }

  if (lower.includes("power bank") || lower.includes("charger") || lower.includes("usb-c") || lower.includes("hub")) {
    return "Consumer Electronics Accessory";
  }

  if (lower.includes("warehouse") || lower.includes("barcode") || lower.includes("rfid")) {
    return "Warehouse/Retail Equipment";
  }

  if (lower.includes("office") || lower.includes("desk") || lower.includes("chair")) {
    return "Office Product";
  }

  return "";
}

function inferChannel(text: string): Channel {
  const lower = text.toLowerCase();
  const hasTakealot = lower.includes("takealot");
  const hasIndependent = lower.includes("blackrhinoshop") || lower.includes("niimbotonline") || lower.includes("shopify");

  if (hasTakealot && hasIndependent) return "Both";
  if (hasTakealot) return "Takealot";
  if (hasIndependent) return "Independent Store";
  return "Both";
}

function inferTargetUser(text: string): TargetUser {
  const lower = text.toLowerCase();

  if (lower.includes("warehouse") || lower.includes("retail") || lower.includes("barcode")) return "Warehouse/Retail";
  if (lower.includes("small business") || lower.includes("seller") || lower.includes("shop")) return "Small Business";
  if (lower.includes("home") || lower.includes("organize") || lower.includes("storage")) return "Home User";
  return "All";
}

function inferConsumable(text: string) {
  return /label tapes?|refills?|consumables?|thermal labels?|sticker labels?/i.test(text);
}

function inferRelatedProducts(text: string) {
  const related = [];
  const lower = text.toLowerCase();

  if (lower.includes("label")) related.push("label tapes", "transparent labels", "cable labels");
  if (lower.includes("printer")) related.push("compatible label refills");
  if (lower.includes("power bank") || lower.includes("charger")) related.push("fast charging cable", "travel adapter", "USB-C hub");
  if (lower.includes("warehouse") || lower.includes("barcode")) related.push("barcode labels", "scanners", "RFID accessories");

  return Array.from(new Set(related)).join(", ");
}

function inferTitle(lines: string[]) {
  const nonUrlLines = lines.filter((line) => !/^https?:\/\//i.test(line));
  const likelyTitle = nonUrlLines.find((line) => {
    const wordCount = line.split(/\s+/).length;
    return line.length >= 8 && line.length <= 120 && wordCount >= 2 && !/\b(R|ZAR)\s?\d/i.test(line);
  });

  return likelyTitle || nonUrlLines[0] || "";
}

function buildDescription(lines: string[], title: string) {
  return lines
    .filter((line) => line !== title)
    .filter((line) => !/^https?:\/\//i.test(line))
    .filter((line) => !/\b(R|ZAR)\s?\d/i.test(line))
    .slice(0, 6)
    .join(" ");
}

function buildSellingPoints(lines: string[]) {
  const bulletLines = lines.filter((line) => /^[-*•]/.test(line) || /\b(no ink|portable|compatible|fast charging|thermal|barcode|wireless)\b/i.test(line));
  return bulletLines
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .slice(0, 6)
    .join(". ");
}

function makeCandidateLabel(product: ProductInfo, index: number) {
  if (product.productName) return `${index + 1}. ${product.productName}`;
  if (product.brand || product.category) return `${index + 1}. ${[product.brand, product.category].filter(Boolean).join(" ")}`;
  return `${index + 1}. Parsed Product`;
}

export function parseProductText(rawText: string): ParsedProductCandidate[] {
  return splitProductBlocks(rawText).map((block, index) => {
    const lines = normalizeLines(block);
    const fullText = lines.join("\n");
    const title = inferTitle(lines);
    const product: ProductInfo = {
      ...emptyProduct,
      productName: title,
      brand: inferBrand(fullText, title),
      category: inferCategory(fullText),
      price: findPrice(lines),
      currentTitle: title,
      description: buildDescription(lines, title),
      currentSellingPoints: buildSellingPoints(lines),
      channel: inferChannel(fullText),
      targetUser: inferTargetUser(fullText),
      consumable: inferConsumable(fullText),
      relatedProducts: inferRelatedProducts(fullText),
      reviewSamples: lines.filter((line) => /\b(review|customer|easy|good|bad|love|problem|issue|works)\b/i.test(line)).slice(0, 4).join(" "),
      productUrl: findUrl(lines)
    };

    return {
      id: `parsed-${index}`,
      label: makeCandidateLabel(product, index),
      product
    };
  });
}
