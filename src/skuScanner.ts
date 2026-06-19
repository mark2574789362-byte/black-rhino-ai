/**
 * SKU Priority Scanner 规则引擎
 * ------------------------------------------------------------
 * 设计原则：
 *  - 不调 AI，完全在前端用规则跑（第一阶段）
 *  - 7 类商品类型（productType）+ 6 类经营场景（businessScenario）
 *  - 规则按业务重要度排序：businessScenario 显式 > productType + 关键词推断
 *  - 输出统一的 SkuScanResult，所有文案都是 i18n key，由 UI 层翻译
 *  - 不依赖外部 lang 参数，避免之前 lang 三元表达式的判断错误
 * ------------------------------------------------------------
 */

import type {
  BatchSkuInput, SkuScanResult, ProductInfo,
  RuleKey, IssueKey, OpportunityKey, ActionKey,
  ProductType, BusinessScenarioKey, Priority,
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
 * 显式经营场景映射（如果用户在 businessScenario 里选了，直接采纳）
 * risk：信息完整时使用场景默认 risk；信息不完整时降级为 informationIncomplete
 * 仅在 productType 与关键词推断不一致时作为辅助
 */
const EXPLICIT_SCENARIO_TO_RESULT: Record<BusinessScenarioKey, Partial<SkuScanResult>> = {
  hardwareEntry:          { role: 'hardwareEntry',          opportunity: 'consumableAttach',        priority: 'A', nextAction: 'runFullDiagnosis',     risk: 'useCaseMessagingWeak',     rule: 'hardwareAttach' },
  repeatPurchase:         { role: 'repeatPurchase',         opportunity: 'ltvGrowth',               priority: 'A', nextAction: 'buildBundlePlan',      risk: 'compatibilityScope',       rule: 'consumable' },
  competitiveElectronics: { role: 'competitiveElectronics', opportunity: 'scenarioDifferentiation', priority: 'B', nextAction: 'improveSellingPoints', risk: 'priceCompetition',         rule: 'competitive3C' },
  b2bSolution:            { role: 'b2bEquipment',           opportunity: 'b2bScenario',             priority: 'B', nextAction: 'runFullDiagnosis',     risk: 'compatibilityUnclear',     rule: 'b2b' },
  highTicketDurable:      { role: 'highTicketDurable',      opportunity: 'trustServiceAssurance',   priority: 'B', nextAction: 'runFullDiagnosis',     risk: 'warrantyDeliveryUnclear',  rule: 'appliance' },
  generic:                { role: 'generic',                opportunity: 'toBeConfirmed',           priority: 'C', nextAction: 'completeProductCard',  risk: 'noRoleDetected',           rule: 'generic' },
};

/**
 * 单条 SKU 扫描：按优先级匹配规则
 * 优先级：显式 businessScenario > productType + 关键词 > 兜底
 */
export function scanSku(sku: BatchSkuInput, _opts: ScanRulesOptions = {}): SkuScanResult {
  const productType: ProductType = sku.productType;
  const category = sku.category || '';
  const related = sku.relatedProducts || '';

  // 信息不足检测：关键字段缺失时打风险标
  const missing: string[] = [];
  if (!category) missing.push('category');
  if (!sku.description) missing.push('description');
  if (!related) missing.push('relatedProducts');
  if (!sku.currentSellingPoints) missing.push('currentSellingPoints');

  // ---- 优先级 0：显式 businessScenario（用户主动选填）----
  if (sku.businessScenario) {
    const explicit = EXPLICIT_SCENARIO_TO_RESULT[sku.businessScenario];
    if (explicit) {
      return {
        sku,
        role: explicit.role!,
        opportunity: explicit.opportunity!,
        // 信息完整时采用场景默认 risk；缺失时降级为 informationIncomplete
        // （用户选了 scenario 不代表 Listing 信息齐全）
        risk: (missing.length
          ? ('informationIncomplete' as IssueKey)
          : explicit.risk!) as IssueKey,
        priority: explicit.priority!,
        nextAction: explicit.nextAction!,
        rule: explicit.rule!,
      };
    }
  }

  // ---- 规则 1：耗材类（type=Consumable 或类目含耗材关键词）----
  // 注意：设备型打印机类目可能含 "label"（如 Business Label Printer），
  // 需要排除这类设备型业务。
  const isConsumableCategory =
    contains(category, 'consumable') ||
    contains(category, 'roll') ||
    contains(category, 'tape') ||
    contains(category, 'ribbon') ||
    (contains(category, 'label') && (contains(category, 'roll') || contains(category, 'paper') || contains(category, 'sticker')));

  if (productType === 'Consumable' || isConsumableCategory) {
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
    (productType === 'Hardware' || productType === 'B2B Equipment') &&
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

  // ---- 规则 3：3C 同质化竞争（Baseus / 充电宝 / 数据线 / HUB / 配件）----
  if (
    contains(sku.brand, 'baseus') ||
    contains(category, 'power bank') ||
    contains(category, 'charger') ||
    contains(category, 'cable') ||
    contains(category, 'hub') ||
    contains(category, 'earphone') ||
    contains(category, 'earbud') ||
    productType === 'Accessory'
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

  // ---- 规则 4：B2B 仓储设备 ----
  if (
    productType === 'B2B Equipment' ||
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

  // ---- 规则 5：家具 / 家居（新增）----
  if (
    productType === 'Furniture' ||
    contains(category, 'furniture') ||
    contains(category, 'chair') ||
    contains(category, 'desk') ||
    contains(category, 'living') ||
    contains(category, 'sofa') ||
    contains(category, 'bed')
  ) {
    return {
      sku,
      role: 'homeOfficeLiving',
      opportunity: 'scenarioSelling' as OpportunityKey,
      risk: missing.length
        ? ('deliveryAssemblyUnclear' as IssueKey)
        : ('deliveryAssemblyUnclear' as IssueKey),
      priority: 'B',
      nextAction: 'improveListingDetails' as ActionKey,
      rule: 'furniture' as RuleKey,
    };
  }

  // ---- 规则 6：大家电（新增）----
  if (
    productType === 'Appliance' ||
    contains(category, 'fridge') ||
    contains(category, 'refrigerator') ||
    contains(category, 'washing machine') ||
    contains(category, 'tv') ||
    contains(category, 'appliance')
  ) {
    return {
      sku,
      role: 'highTicketDurable',
      opportunity: 'trustServiceAssurance' as OpportunityKey,
      risk: missing.length
        ? ('warrantyDeliveryUnclear' as IssueKey)
        : ('warrantyDeliveryUnclear' as IssueKey),
      priority: 'B',
      nextAction: 'runFullDiagnosis' as ActionKey,
      rule: 'appliance' as RuleKey,
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

/** 批量扫描 · 按 Priority A > B > C 排序，提升优先级面板的“优先”感 */
const PRIORITY_ORDER: Record<Priority, number> = { A: 0, B: 1, C: 2 };

export function scanSkus(skus: BatchSkuInput[], opts?: ScanRulesOptions): SkuScanResult[] {
  return skus
    .map(s => scanSku(s, opts))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
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

/** 把 CSV 字符串里的 type 列值映射为合法 ProductType，非法则归一为 'Hardware' */
function normalizeProductType(raw: string): ProductType {
  const v = (raw || '').trim();
  const valid: ProductType[] = [
    'Hardware', 'Consumable', 'Accessory', 'Bundle',
    'Furniture', 'Appliance', 'B2B Equipment',
  ];
  return valid.includes(v as ProductType) ? (v as ProductType) : 'Hardware';
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
      productType: normalizeProductType(cells[idx.type] ?? ''),
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
  // 转入单 SKU 诊断时，把 productType + businessScenario 拼进 description，
  // 避免 AI 只从 category / description 猜不到完整业务类型。
  const typeTag = `[Product Type: ${sku.productType}; Scenario: ${sku.businessScenario || 'auto'}]`;
  const baseDesc = sku.description ?? '';
  return {
    productName: sku.productName,
    brand: sku.brand,
    category: sku.category,
    price: sku.price ?? '',
    description: baseDesc ? `${typeTag} ${baseDesc}` : typeTag,
    currentSellingPoints: sku.currentSellingPoints ?? '',
    channel: 'Both',
    targetUser: 'All',
    productType: sku.productType,
    businessScenario: sku.businessScenario,
    consumable: sku.productType === 'Consumable',
    relatedProducts: sku.relatedProducts ?? '',
    reviewSamples: sku.reviewSamples ?? '',
    productUrl: '',
  };
}
