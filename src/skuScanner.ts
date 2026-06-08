/**
 * SKU Priority Scanner 规则引擎
 * ------------------------------------------------------------
 * 设计原则：
 *  - 不调 AI，完全在前端用规则跑（第一阶段）
 *  - 5 类规则：耗材 / 设备+耗材 / 3C / B2B / 信息不足
 *  - 输出统一的 SkuScanResult，可直接喂给 Priority Board 表格
 *  - 中英字段都保留，UI 层根据 lang 切换显示
 * ------------------------------------------------------------
 */

import type { BatchSkuInput, SkuScanResult, ProductInfo } from './types';

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
  /** 中英输出（用于展示在表格里） */
  lang: 'zh' | 'en';
}

/**
 * 单条 SKU 扫描：按优先级匹配规则，命中后立即返回
 * 规则按业务重要度排序：耗材复购 > 设备+耗材 > 3C > B2B > 兜底
 */
export function scanSku(sku: BatchSkuInput, opts: ScanRulesOptions): SkuScanResult {
  const { lang } = opts;
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
  if (
    type === 'consumable' ||
    contains(category, 'label') ||
    contains(category, 'consumable') ||
    contains(category, 'roll') ||
    contains(category, 'tape') ||
    contains(category, 'ribbon')
  ) {
    return {
      sku,
      role: 'Repeat Purchase SKU',
      opportunity: lang
        ? 'LTV growth · Reorder opportunity'
        : 'LTV 增长 · 复购机会',
      risk: missing.length
        ? (lang ? 'Compatibility scope unclear' : '兼容范围不清晰')
        : (lang ? 'Pricing pressure vs bundles' : '套餐内价格压力'),
      priority: 'A',
      nextAction: lang ? 'Build bundle plan' : '建立组合包计划',
      reasons: [lang ? 'Rule: Consumable category' : '规则：耗材品类'],
    };
  }

  // ---- 规则 2：设备 + 耗材（硬件入口 SKU）----
  if (
    (type === 'hardware' || type === '') &&
    relatedHasAny(related, ['label', 'tape', 'consumable', 'ink', 'ribbon', 'roll', 'cartridge'])
  ) {
    return {
      sku,
      role: 'Hardware Entry SKU',
      opportunity: lang ? 'Consumable attach' : '耗材连带',
      risk: missing.length
        ? (lang ? 'Information incomplete' : '信息不完整')
        : (lang ? 'Use-case messaging weak' : '使用场景描述弱'),
      priority: 'A',
      nextAction: lang ? 'Run full diagnosis' : '运行详细诊断',
      reasons: [lang ? 'Rule: Hardware + consumable attach' : '规则：设备 + 耗材连带'],
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
      role: 'Competitive Electronics SKU',
      opportunity: lang ? 'Scenario differentiation' : '场景差异化',
      risk: lang
        ? 'Price competition · Spec homogeneity'
        : '价格竞争 · 参数同质化',
      priority: 'B',
      nextAction: lang ? 'Improve selling points' : '优化场景化卖点',
      reasons: [lang ? 'Rule: 3C competitive' : '规则：3C 同质化'],
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
      role: 'B2B Equipment SKU',
      opportunity: lang ? 'Enterprise / warehouse scenario' : 'B2B / 仓库场景',
      risk: missing.length
        ? (lang ? 'Compatibility unclear' : '兼容性未知')
        : (lang ? 'Long sales cycle' : '销售周期长'),
      priority: 'B',
      nextAction: lang ? 'Run full diagnosis' : '运行详细诊断',
      reasons: [lang ? 'Rule: B2B equipment' : '规则：B2B 设备'],
    };
  }

  // ---- 兜底：信息不足 / 通用 SKU ----
  return {
    sku,
    role: 'Generic SKU',
    opportunity: lang ? 'To be confirmed' : '待定',
    risk: missing.length
      ? (lang ? 'Information incomplete' : '信息不完整')
      : (lang ? 'No clear role detected' : '未识别出明确经营角色'),
    priority: 'C',
    nextAction: missing.length
      ? (lang ? 'Complete product card first' : '先补全商品信息')
      : (lang ? 'Run full diagnosis' : '运行详细诊断'),
    reasons: [lang ? 'Rule: Default' : '规则：默认 / 兜底'],
  };
}

/** 批量扫描 */
export function scanSkus(skus: BatchSkuInput[], opts: ScanRulesOptions): SkuScanResult[] {
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
      // 跳过紧跟的下一个引号（"" 表示一个引号）
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
  // 必填列名
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
    if (!productName) continue; // 跳过空行
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
// 手动粘贴（| 分隔）解析
// =============================================================================

export function parseManual(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  const skus: BatchSkuInput[] = [];
  for (const line of lines) {
    const parts = line.split('|').map(s => s.trim());
    if (parts.length < 4) {
      return { ok: false, skus: [], error: 'format' };
    }
    skus.push({
      productName: parts[0],
      brand: parts[1] ?? '',
      category: parts[2] ?? '',
      type: parts[3] ?? '',
      relatedProducts: parts[4] ?? '',
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
