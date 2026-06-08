/**
 * SKU Priority Scanner 规则引擎
 * ------------------------------------------------------------
 * 设计原则：
 *  - 不调 AI，完全在前端用规则跑（第一阶段）
 *  - 5 类规则：耗材 / 设备+耗材 / 3C / B2B / 信息不足
 *  - 输出统一的 SkuScanResult，所有文案都是 i18n key，由 UI 层翻译
 *  - 不依赖外部 lang 参数，避免之前 lang 三元表达式的判断错误
 * ------------------------------------------------------------
 */

import type {
  BatchSkuInput, SkuScanResult, ProductInfo,
  RuleKey, IssueKey, OpportunityKey, ActionKey,
} from './types';

// 字段匹配工具：大小写不敏感 + 包含关系
const contains = (haystack: string | undefined, needle: string) =>
  !!haystack && haystack.toLowerCase().includes(needle.toLowerCase());

// 关联商品是否命中某关键词组
const relatedHasAny = (related: string | undefined, keywords: string[]) => {
  if (!related) return false;
  const lower = related.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
};

export interface ScanRulesOptions {
  // 留作未来扩展，目前规则引擎不依赖 lang（返回 key）
  lang?: 'zh' | 'en';
}

/**
 * 单条 SKU 扫描：按优先级匹配规则，命中后立即返回
 * 规则按业务重要度排序：耗材复购 > 设备+耗材 > 3C > B2B > 兜底
 */
export function scanSku(sku: BatchSkuInput, _opts: ScanRulesOptions = {}): SkuScanResult {
  const type = (sku.type || '').toLowerCase();
  const category = sku.category || '';
  const related = sku.relatedProducts || '';

  // 信息不足检测：关键字段缺失时打风险标
  const missing: string[] = [];
  if (!category) missing.push('category');
  if (!sku.description) missing.push('description');
  if (!related) missing.push('relatedProducts');
  if (!sku.currentSellingPoints) missing.push('currentSellingPoints');

  // ---- 规则 1：耗材类（标签/碳带/卷纸等）----
  // 注意：设备型打印机类目可能含 "label"（如 Business Label Printer），
  // 需要排除这类设备型业务。判定逻辑：type=consumable，或者类目词表达“耗材”本身。
  const isConsumableCategory =
    contains(category, 'consumable') ||
    contains(category, 'roll') ||
    contains(category, 'tape') ||
    contains(category, 'ribbon') ||
    // 包含 "label" 但后面跟 roll/paper/sticker 等才是耗材
    (contains(category, 'label') && (contains(category, 'roll') || contains(category, 'paper') || contains(category, 'sticker')));

  if (type === 'consumable' || isConsumableCategory) {
    return {
      sku,
      role: 'repeatPurchase',
      opportunity: 'ltvGrowth' as OpportunityKey,
      risk: missing.length
        ? ('compatibilityScope' as IssueKey)
        : ('bundlePricePressure' as IssueKey),
      priority: 'A',
      nextAction: 'buildBundlePlan' as ActionKey,
      rule: 'consumable' as RuleKey,
    };
  }

  // ---- 规则 2：设备 + 耗材（硬件入口 SKU）----
  if (
    (type === 'hardware' || type === '') &&
    relatedHasAny(related, ['label', 'tape', 'consumable', 'ink', 'ribbon', 'roll', 'cartridge'])
  ) {
    return {
      sku,
      role: 'hardwareEntry',
      opportunity: 'consumableAttach' as OpportunityKey,
      risk: missing.length
        ? ('informationIncomplete' as IssueKey)
        : ('useCaseMessagingWeak' as IssueKey),
      priority: 'A',
      nextAction: 'runFullDiagnosis' as ActionKey,
      rule: 'hardwareAttach' as RuleKey,
    };
  }

  // ---- 规则 3：3C 同质化竞争（Baseus / 充电宝 / 数据线 / HUB）----
  if (
    contains(sku.brand, 'baseus') ||
    contains(category, 'power bank') ||
    contains(category, 'charger') ||
    contains(category, 'cable') ||
    contains(category, 'hub') ||
    contains(category, 'earphone') ||
    contains(category, 'earbud')
  ) {
    return {
      sku,
      role: 'competitiveElectronics',
      opportunity: 'scenarioDifferentiation' as OpportunityKey,
      risk: 'priceCompetition' as IssueKey,
      priority: 'B',
      nextAction: 'improveSellingPoints' as ActionKey,
      rule: 'competitive3C' as RuleKey,
    };
  }

  // ---- 规则 4：B2B 仓储设备（条码 / 扫描枪 / 仓库 / 工业打印机）----
  if (
    contains(category, 'barcode') ||
    contains(category, 'scanner') ||
    contains(category, 'warehouse') ||
    contains(category, 'industrial') ||
    (contains(category, 'printer') && !contains(category, 'label printer'))
  ) {
    return {
      sku,
      role: 'b2bEquipment',
      opportunity: 'b2bScenario' as OpportunityKey,
      risk: missing.length
        ? ('compatibilityUnclear' as IssueKey)
        : ('longSalesCycle' as IssueKey),
      priority: 'B',
      nextAction: 'runFullDiagnosis' as ActionKey,
      rule: 'b2b' as RuleKey,
    };
  }

  // ---- 兜底：信息不足 / 通用 SKU ----
  return {
    sku,
    role: 'generic',
    opportunity: 'toBeConfirmed' as OpportunityKey,
    risk: missing.length
      ? ('informationIncomplete' as IssueKey)
      : ('noRoleDetected' as IssueKey),
    priority: 'C',
    nextAction: missing.length
      ? ('completeProductCard' as ActionKey)
      : ('runFullDiagnosis' as ActionKey),
    rule: 'generic' as RuleKey,
  };
}

/** 批量扫描 */
export function scanSkus(skus: BatchSkuInput[], opts?: ScanRulesOptions): SkuScanResult[] {
  return skus.map(s => scanSku(s, opts));
}

// =============================================================================
// CSV 解析（极简实现，足够覆盖 demo 数据；不支持引号内换行、嵌套引号、转义）
// =============================================================================

/** 拆分一行 CSV（支持双引号包裹字段） */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

export interface CsvParseResult {
  ok: boolean;
  skus: BatchSkuInput[];
  error?: string;
}

/** 解析 CSV 文本 → SKU 数组 */
export function parseCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    return { ok: false, skus: [], error: 'empty' };
  }

  const header = parseCsvLine(lines[0]).map(s => s.toLowerCase());
  const required = ['product name', 'brand', 'category', 'type'];
  const missing = required.filter(r => !header.includes(r));
  if (missing.length) {
    return { ok: false, skus: [], error: 'header-missing' };
  }

  const idx = {
    productName: header.indexOf('product name'),
    brand: header.indexOf('brand'),
    category: header.indexOf('category'),
    type: header.indexOf('type'),
    price: header.indexOf('price'),
    description: header.indexOf('description'),
    currentSellingPoints: header.indexOf('current selling points'),
    relatedProducts: header.indexOf('related products'),
    reviewSamples: header.indexOf('review samples'),
  };

  const skus: BatchSkuInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const productName = cells[idx.productName];
    if (!productName) continue;
    skus.push({
      productName,
      brand: cells[idx.brand] ?? '',
      category: cells[idx.category] ?? '',
      type: cells[idx.type] ?? '',
      price: idx.price >= 0 ? cells[idx.price] : '',
      description: idx.description >= 0 ? cells[idx.description] : '',
      currentSellingPoints: idx.currentSellingPoints >= 0 ? cells[idx.currentSellingPoints] : '',
      relatedProducts: idx.relatedProducts >= 0 ? cells[idx.relatedProducts] : '',
      reviewSamples: idx.reviewSamples >= 0 ? cells[idx.reviewSamples] : '',
    });
  }

  return { ok: true, skus };
}

// =============================================================================
// 下载 CSV 模板（接受模板字符串，避免在浏览器里 require）
// =============================================================================

export function triggerTemplateDownload(getTemplate: () => string) {
  const blob = new Blob([getTemplate()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'black-rhino-sku-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =============================================================================
// 辅助：把 BatchSkuInput → ProductInfo（用于 "Run full diagnosis" 填表）
// =============================================================================

export function batchToProduct(sku: BatchSkuInput): ProductInfo {
  return {
    productName: sku.productName,
    brand: sku.brand,
    category: sku.category,
    price: sku.price ?? '',
    description: sku.description ?? '',
    currentSellingPoints: sku.currentSellingPoints ?? '',
    channel: 'Both',
    targetUser: 'All',
    consumable: (sku.type || '').toLowerCase() === 'consumable',
    relatedProducts: sku.relatedProducts ?? '',
    reviewSamples: sku.reviewSamples ?? '',
    productUrl: '',
  };
}
