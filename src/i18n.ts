import { createContext, createElement, useContext, useState, useEffect, type ReactNode } from 'react';

export type Lang = 'zh' | 'en';

export const LANG_STORAGE_KEY = 'black-rhino-lang';

// 中英对照表：除了 API/URL/CRUD/JSON/SKU/SEO/ZAR/USB-C/Bluetooth 等专有名词外，
// 所有用户可见文案统一用中文（zh 为默认）
export const I18N = {
  // ============ Header ============
  header: {
    title: { zh: 'Black Rhino AI 商品运营诊断助手', en: 'Black Rhino AI Product Operations Assistant' },
    subtitle: { zh: '商品运营诊断助手 · 基于 AI 工作流', en: 'Product Operations Assistant · Powered by AI Workflow' },
    showPrompt: { zh: '查看提示词模板', en: 'Show Prompt Template' },
    hidePrompt: { zh: '隐藏提示词模板', en: 'Hide Prompt Template' },
  },

  // ============ Disclaimer Banner ============
  banner: {
    prefix: { zh: '数据边界：', en: 'Data Boundary:' },
    text: { zh: '本工具不访问 Black Rhino 后端数据，无法判断实际销售额、毛利、库存或广告 ROI，需要内部数据支持。', en: 'This tool does not access Black Rhino backend data. It cannot determine real sales, margin, inventory, or ad ROI. Those require internal data access.' },
  },

  // ============ Input Panel ============
  input: {
    panelTitle: { zh: '商品信息', en: 'Product Information' },
    fields: {
      productName: { zh: '商品名称 *', en: 'Product Name *' },
      productNamePh: { zh: '例如：Niimbot B21 标签打印机', en: 'e.g. Niimbot B21 Label Printer' },
      brand: { zh: '品牌', en: 'Brand' },
      brandPh: { zh: '例如：Niimbot', en: 'e.g. Niimbot' },
      category: { zh: '类目', en: 'Category' },
      categoryPh: { zh: '例如：商用标签打印机', en: 'e.g. Business Label Printer' },
      price: { zh: '价格（ZAR）', en: 'Price (ZAR)' },
      pricePh: { zh: '例如：899 ZAR', en: 'e.g. 899 ZAR' },
      currentTitle: { zh: '当前商品标题', en: 'Current Title' },
      currentTitlePh: { zh: '粘贴当前商品标题', en: 'Paste current product title here' },
      description: { zh: '商品描述', en: 'Description' },
      descriptionPh: { zh: '商品描述...', en: 'Product description...' },
      sellingPoints: { zh: '当前卖点', en: 'Current Selling Points' },
      sellingPointsPh: { zh: '例如：便携、热敏、赠贴纸', en: 'e.g. Portable, Thermal, Free Tape' },
      productUrl: { zh: '商品链接', en: 'Product URL' },
      productUrlPh: { zh: '粘贴商品链接以自动填充...', en: 'Paste product URL to auto-fill...' },
      targetChannel: { zh: '目标渠道', en: 'Target Channel' },
      targetUser: { zh: '目标用户', en: 'Target User' },
      productType: { zh: '商品类型', en: 'Product Type' },
      consumable: { zh: '耗材类（标签、墨盒等）', en: 'Consumable (labels, ink...)' },
      hardware: { zh: '硬件类（设备、器材）', en: 'Hardware (device, equipment)' },
      relatedProducts: { zh: '关联商品', en: 'Related Products' },
      relatedProductsPh: { zh: '例如：B 系列标签、透明标签', en: 'e.g. Series B Labels, Transparent Labels' },
      reviewSamples: { zh: '评价样例', en: 'Review Samples' },
      reviewSamplesPh: { zh: '粘贴用户评价原文...', en: 'Paste customer reviews here...' },
    },
    channel: {
      Takealot: { zh: 'Takealot', en: 'Takealot' },
      Independent: { zh: '独立站', en: 'Independent Store' },
      Both: { zh: '全渠道', en: 'Both' },
    },
    targetUser: {
      HomeUser: { zh: '个人用户', en: 'Home User' },
      SmallBusiness: { zh: '小型商家', en: 'Small Business' },
      Warehouse: { zh: '仓储/零售', en: 'Warehouse/Retail' },
      All: { zh: '全部人群', en: 'All' },
    },
    scenarios: { zh: '业务场景', en: 'Business Scenarios' },
    runBtn: { zh: '开始诊断', en: 'Run SKU Diagnosis' },
    analyzing: { zh: '诊断中...', en: 'Analyzing...' },
    fetching: { zh: '抓取中...', en: 'Fetching...' },
    fetch: { zh: '抓取', en: 'Fetch' },
    progressLabel: { zh: '完成度', en: 'Progress' },
    minFieldsHint: {
      zh: '建议至少填完 4 个字段以获得完整诊断',
      en: 'Fill at least 4 fields for a complete diagnosis',
    },
    missingFieldsTitle: {
      zh: '为获得更准确的诊断，请补全以下字段',
      en: 'For a more accurate diagnosis, please fill in:',
    },
  },

  // ============ Output Section ============
  output: {
    dataSufficiency: { zh: '数据充足度评分', en: 'Data Sufficiency Score' },
    dataSufficiencyNote: { zh: '此评估仅基于公开商品信息，未访问后端数据（销量、库存、毛利）。', en: 'This assessment is based only on public product information. Backend data (sales, inventory, margin) is not accessed.' },
    canBeAnalyzed: { zh: '可分析', en: 'Can be analyzed' },
    cannotBeAnalyzed: { zh: '暂不可分析', en: 'Cannot be analyzed' },
    canAnalyze: { zh: '可分析维度', en: 'Can Analyze' },
    cannotAnalyze: { zh: '暂不可分析维度', en: 'Cannot Analyze' },
    productPositioning: { zh: '商品定位', en: 'Product Positioning' },
    skuStrategy: { zh: 'SKU 运营策略', en: 'SKU Operation Strategy' },
    listingDiagnosis: { zh: '链接诊断', en: 'Listing Diagnosis' },
    optimizedTitle: { zh: '优化后的商品标题', en: 'Optimized Product Title' },
    sellingPoints: { zh: '五大核心卖点', en: 'Five Key Selling Points' },
    bundle: { zh: '捆绑销售建议', en: 'Bundle Recommendation' },
    seoKeywords: { zh: 'SEO 关键词', en: 'SEO Keywords' },
    contentIdeas: { zh: '内容选题', en: 'Content Ideas' },
    dataNeeded: { zh: '如能获取内部数据', en: 'If Internal Data Is Available' },
    dataMetrics: { zh: '数据验证指标', en: 'Data Validation Metrics' },
    copy: { zh: '复制', en: 'Copy' },
    copied: { zh: '已复制', en: 'Copied' },
  },

  // ============ Empty / Error ============
  empty: {
    title: { zh: '准备开始诊断', en: 'Ready to diagnose' },
    desc: { zh: '填写商品信息并点击【开始诊断】，或加载上方 3 个演示商品之一。', en: 'Fill in product information and click Run SKU Diagnosis, or load one of the 3 demo products above.' },
  },
  error: {
    title: { zh: '出错啦', en: 'Error' },
    fetchFailed: { zh: '抓取失败', en: 'Failed to fetch' },
    networkError: { zh: '网络错误，请检查连接。', en: 'Network error. Please check your connection.' },
    analyzeFailed: { zh: '诊断失败，请重试。', en: 'Analysis failed. Please try again.' },
    infoInsufficient: {
      zh: '信息不足报告 — 请补全更多字段以获得完整诊断。',
      en: 'Insufficient data report — please fill in more fields for a complete diagnosis.',
    },
  },

  // ============ Demo products ============
  demo: {
    '设备 + 耗材复购模型': { zh: '设备 + 耗材复购模型', en: 'Hardware + Consumable Repurchase Model' },
    '高复购耗材模型': { zh: '高复购耗材模型', en: 'High-Repurchase Consumable Model' },
    '3C 同质化竞争模型': { zh: '3C 同质化竞争模型', en: '3C Commoditized Competition Model' },
  },

  // ============ Prompt preview ============
  promptPreview: {
    title: { zh: '标准化 AI 提示词 — 每次诊断时发送给 MiniMax API', en: 'Standardized AI Prompt — sent to MiniMax API on each diagnosis' },
  },

  // ============ Business Value Card (业务领导视角) ============
  businessValue: {
    title: { zh: '本工具如何赋能 Black Rhino 业务', en: 'How this helps Black Rhino operations' },
    items: {
      reduce: {
        zh: '减少重复的 SKU 诊断工作',
        en: 'Reduce repetitive SKU diagnosis work',
      },
      standardize: {
        zh: '将 Listing 评审流程标准化',
        en: 'Standardize listing review process',
      },
      bundle: {
        zh: '识别套餐与复购机会',
        en: 'Identify bundle and repeat purchase opportunities',
      },
      metric: {
        zh: '建立基于指标的数据验证工作流',
        en: 'Create a metric-based validation workflow',
      },
      upgrade: {
        zh: '接入内部数据后可升级为 SKU 分级与诊断的流水线',
        en: 'Upgrade to SKU classification pipeline after internal data access',
      },
    },
  },

  // ============ Footer ============
  footer: {
    product: { zh: 'Black Rhino AI 商品运营诊断助手 · Demo v0.2', en: 'Black Rhino AI Product Operations Assistant · Demo v0.2' },
    powered: { zh: '由 MiniMax API 驱动 · 未访问后端销售数据', en: 'Powered by MiniMax API · No backend sales data accessed' },
  },

  // ============ Language switcher ============
  lang: {
    zh: { zh: '中文', en: 'Chinese' },
    en: { zh: '英文', en: 'English' },
  },
} as const;

// ============ Context ============
interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (...args: any[]) => any;
  tr: (s: { zh: string; en: string }) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'zh';
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    return (saved === 'en' || saved === 'zh') ? saved : 'zh';
  });

  useEffect(() => {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (...args: any[]): any => {
    // 接受任意路径参数：t('input', 'fields', 'productName') 或 t('output', 'copy') 等
    let cur: any = I18N;
    for (const k of args) {
      if (cur == null) break;
      cur = cur[k];
    }
    // 命中叶子（zh/en）返回当前语言文本
    if (cur && typeof cur === 'object' && 'zh' in cur && 'en' in cur) {
      return cur[lang];
    }
    // 否则返回节点（可能是子树对象，调用方可以继续访问）
    return cur ?? String(args[args.length - 1] ?? '');
  };

  const tr = (s: { zh: string; en: string }) => s[lang];

  return createElement(
    LangContext.Provider,
    { value: { lang, setLang, t, tr } },
    children
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
