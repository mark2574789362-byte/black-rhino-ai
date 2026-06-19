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
    showPrompt: { zh: '查看 AI 诊断规则', en: 'View AI Guardrails' },
    hidePrompt: { zh: '隐藏 AI 诊断规则', en: 'Hide AI Guardrails' },
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
      productNamePh: { zh: '粘贴 URL 自动抓取 / 或手动输入', en: 'Paste URL to auto-fetch / or type manually' },
      brand: { zh: '品牌', en: 'Brand' },
      brandPh: { zh: '例如：Niimbot', en: 'e.g. Niimbot' },
      category: { zh: '类目', en: 'Category' },
      categoryPh: { zh: '例如：商用标签打印机', en: 'e.g. Business Label Printer' },
      price: { zh: '价格（ZAR）', en: 'Price (ZAR)' },
      pricePh: { zh: '例如：899 ZAR', en: 'e.g. 899 ZAR' },
      description: { zh: '商品描述', en: 'Description' },
      descriptionPh: { zh: '商品描述...', en: 'Product description...' },
      sellingPoints: { zh: '当前卖点', en: 'Current Selling Points' },
      sellingPointsPh: { zh: '例如：便携、热敏、赠贴纸', en: 'e.g. Portable, Thermal, Free Tape' },
      productUrl: { zh: '商品链接', en: 'Product URL' },
      productUrlPh: { zh: '粘贴商品链接以自动填充...', en: 'Paste product URL to auto-fill...' },
      targetChannel: { zh: '目标渠道', en: 'Target Channel' },
      targetUser: { zh: '目标用户', en: 'Target User' },
      productType: { zh: '商品类型', en: 'Product Type' },
      businessScenario: { zh: '经营场景', en: 'Business Scenario' },
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
    title: { zh: 'AI 诊断规则 — 约束 AI 只基于可用信息做判断', en: 'AI Guardrails — constrain diagnosis to available product data' },
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
    powered: { zh: '由 AI Workflow 驱动 · 未访问后端销售数据', en: 'Powered by AI Workflow · No backend sales data accessed' },
  },

  // ============ Page-level title & subtitle ============
  page: {
    title: {
      zh: 'Black Rhino 多 SKU 运营效率提升 Demo',
      en: 'Black Rhino Multi-SKU Operations Workflow Demo',
    },
    subtitle: {
      zh: '基于公开商品信息，模拟 AI 如何帮助运营人员完成 SKU 初筛、单品诊断、Bundle 机会识别与上线后数据验证。',
      en: 'A lightweight workflow showing how AI can support SKU prioritization, product diagnosis, bundle opportunity discovery and post-launch metric validation.',
    },
    hero: {
      pitch: {
        zh: '先批量筛选 SKU 优先级，再对重点 SKU 做 AI 深度诊断。适用于多品牌、多 SKU、多渠道运营场景。',
        en: 'Filter SKU priorities in batch first, then run AI deep-diagnosis on the SKUs that matter. Built for multi-brand, multi-SKU, multi-channel operations.',
      },
      chips: {
        csv: { zh: 'CSV 导入', en: 'CSV Import' },
        ruleScan: { zh: '规则优先级扫描', en: 'Rule-based Priority Scan' },
        aiDiagnosis: { zh: 'AI 单品诊断', en: 'AI Single-SKU Diagnosis' },
      },
    },
  },

  // ============ Batch SKU Scanner ============
  scanner: {
    sectionTitle: {
      zh: 'SKU 运营优先级扫描器',
      en: 'SKU Priority Scanner',
    },
    entry: {
      demo: {
        title: { zh: '载入优先级看板', en: 'Load into Priority Board' },
        desc: {
          zh: '先加载业务场景到 Priority Board，查看优先级后可点击 Run Full Diagnosis 进入 AI 深度诊断。',
          en: 'Load a business scenario into the Priority Board first, then click Run Full Diagnosis for AI-powered deep analysis.',
        },
      },
      upload: {
        title: { zh: '上传 SKU 文件', en: 'Upload SKU File' },
        desc: {
          zh: '当前版本支持 CSV 上传，Excel 文件请另存为 CSV 后导入。',
          en: 'Currently supports CSV. Excel files should be saved as CSV before upload.',
        },
      },
      manual: {
        title: { zh: '手动添加 SKU', en: 'Paste SKU Manually' },
        desc: {
          zh: '补全 4 个必填字段，点击「添加并扫描」逐条输入。',
          en: 'Fill 4 required fields and click Add & Scan to enter row by row.',
        },
      },
    },
    uploadCard: {
      title: { zh: '上传 SKU 文件', en: 'Upload SKU File' },
      hint: {
        zh: '当前版本支持 CSV 上传，Excel 文件请另存为 CSV 后导入。',
        en: 'Currently supports CSV. Excel files should be saved as CSV before upload.',
      },
      downloadTemplate: { zh: '下载模板', en: 'Download Template' },
      uploadCsv: { zh: '上传 CSV', en: 'Upload CSV' },
      parseError: {
        zh: 'CSV 解析失败：请检查文件是否包含表头 Product Name, Brand, Category, Type。',
        en: 'CSV parse failed: please check the file contains the header Product Name, Brand, Category, Type.',
      },
    },
    manualCard: {
      title: { zh: '或手动添加 SKU 记录', en: 'Or add SKU records manually' },
      hint: {
        zh: '默认只显示 4 个必填字段，展开「Advanced fields」填选填字段。',
        en: 'Only 4 required fields shown by default. Expand "Advanced fields" for optional ones.',
      },
      fields: {
        productName: { zh: '商品名称 *', en: 'Product Name *' },
        brand: { zh: '品牌 *', en: 'Brand *' },
        category: { zh: '类目 *', en: 'Category *' },
        productType: { zh: '商品类型 *', en: 'Product Type *' },
        productTypeHint: {
          zh: '用于规则扫描 SKU 经营角色和优先级。',
          en: 'Used for rule-based SKU priority scanning.',
        },
        productTypePlaceholder: { zh: '请选择商品类型', en: 'Select product type' },
        businessScenario: { zh: '经营场景 (选填)', en: 'Business Scenario (optional)' },
        businessScenarioHint: {
          zh: '不选时，系统根据 Brand / Category / Related Products 自动判断。',
          en: 'If left empty, the system infers from Brand / Category / Related Products.',
        },
        businessScenarioPlaceholder: { zh: '自动判断 (留空)', en: 'Auto-detect (leave empty)' },
        price: { zh: '价格 (选填)', en: 'Price (optional)' },
        description: { zh: '商品描述 (选填)', en: 'Description (optional)' },
        currentSellingPoints: { zh: '当前卖点 (选填)', en: 'Current Selling Points (optional)' },
        relatedProducts: { zh: '关联商品 (选填)', en: 'Related Products (optional)' },
        reviewSamples: { zh: '评价样本 (选填)', en: 'Review Samples (optional)' },
      },
      productTypes: {
        Hardware: { zh: '硬件设备', en: 'Hardware / Device' },
        Consumable: { zh: '耗材', en: 'Consumable' },
        Accessory: { zh: '配件', en: 'Accessory' },
        Bundle: { zh: '套餐 / 组合包', en: 'Bundle / Kit' },
        Furniture: { zh: '家具 / 家居', en: 'Furniture / Home Living' },
        Appliance: { zh: '大家电', en: 'Appliance' },
        'B2B Equipment': { zh: 'B2B 仓储设备', en: 'B2B Equipment' },
      },
      businessScenarios: {
        hardwareEntry: { zh: '设备入口款', en: 'Hardware Entry SKU' },
        repeatPurchase: { zh: '复购耗材款', en: 'Repeat Purchase SKU' },
        competitiveElectronics: { zh: '3C 竞争款', en: 'Competitive Electronics SKU' },
        b2bSolution: { zh: 'B2B 方案款', en: 'B2B Solution SKU' },
        highTicketDurable: { zh: '高客单耐用品', en: 'High-ticket Durable SKU' },
        generic: { zh: '普通 SKU', en: 'Generic SKU' },
      },
      addBtn: { zh: '添加并扫描', en: 'Add & Scan' },
      addAnother: { zh: '再添加一条', en: 'Add another row' },
      clearBtn: { zh: '清空已添加', en: 'Clear added' },
      optionalSummary: { zh: 'Advanced fields（5 个选填）', en: 'Advanced fields (5 optional)' },
      requiredMissing: {
        zh: '请至少补全商品名称 / 品牌 / 类目 / 商品类型 4 个必填字段。',
        en: 'Please fill in at least the 4 required fields: Name / Brand / Category / Product Type.',
      },
    },

    // Role / Rule / Issue / Action 枚举文案，UI 层只调 key
    role: {
      hardwareEntry: { zh: '设备入口型 SKU', en: 'Hardware Entry SKU' },
      repeatPurchase: { zh: '高复购耗材型 SKU', en: 'Repeat Purchase SKU' },
      competitiveElectronics: { zh: '3C 同质化竞争型 SKU', en: 'Competitive Electronics SKU' },
      b2bEquipment: { zh: 'B2B 仓储设备型 SKU', en: 'B2B Equipment SKU' },
      homeOfficeLiving: { zh: '家居 / 办公生活型 SKU', en: 'Home / Office Living SKU' },
      highTicketDurable: { zh: '高客单耐用品型 SKU', en: 'High-ticket Durable SKU' },
      generic: { zh: '通用 SKU', en: 'Generic SKU' },
    },
    rule: {
      consumable: { zh: '规则：耗材品类', en: 'Rule: Consumable category' },
      hardwareAttach: { zh: '规则：设备 + 耗材连带', en: 'Rule: Hardware + consumable attach' },
      competitive3C: { zh: '规则：3C 同质化', en: 'Rule: 3C competitive' },
      b2b: { zh: '规则：B2B 设备', en: 'Rule: B2B equipment' },
      furniture: { zh: '规则：家具 / 家居', en: 'Rule: Furniture / Home Living' },
      appliance: { zh: '规则：大家电', en: 'Rule: Appliance' },
      generic: { zh: '规则：默认 / 兑底', en: 'Rule: Default' },
    },
    issues: {
      compatibilityScope: { zh: '兼容范围不清晰', en: 'Compatibility scope unclear' },
      bundlePricePressure: { zh: '套餐内价格压力', en: 'Pricing pressure vs bundles' },
      informationIncomplete: { zh: '信息不完整', en: 'Information incomplete' },
      useCaseMessagingWeak: { zh: '使用场景描述弱', en: 'Use-case messaging weak' },
      priceCompetition: { zh: '价格竞争 · 参数同质化', en: 'Price competition · Spec homogeneity' },
      longSalesCycle: { zh: '销售周期长', en: 'Long sales cycle' },
      compatibilityUnclear: { zh: '兼容性未知', en: 'Compatibility unclear' },
      noRoleDetected: { zh: '未识别出明确经营角色', en: 'No clear role detected' },
      deliveryAssemblyUnclear: { zh: '送货 / 安装 / 尺寸信息不清晰', en: 'Delivery / assembly / size information unclear' },
      warrantyDeliveryUnclear: { zh: '售后 / 送货 / 安装不清晰', en: 'Warranty / delivery / installation unclear' },
    },
    opportunities: {
      ltvGrowth: { zh: 'LTV 增长 · 复购机会', en: 'LTV growth · Reorder opportunity' },
      consumableAttach: { zh: '耗材连带', en: 'Consumable attach' },
      scenarioDifferentiation: { zh: '场景差异化', en: 'Scenario differentiation' },
      b2bScenario: { zh: 'B2B / 仓库场景', en: 'Enterprise / warehouse scenario' },
      scenarioSelling: { zh: '场景化销售', en: 'Scenario-based selling' },
      trustServiceAssurance: { zh: '信任与服务保障', en: 'Trust building and service assurance' },
      toBeConfirmed: { zh: '待定', en: 'To be confirmed' },
    },
    actions: {
      buildBundlePlan: { zh: '建立组合包计划', en: 'Build bundle plan' },
      runFullDiagnosis: { zh: '运行详细诊断', en: 'Run full diagnosis' },
      improveSellingPoints: { zh: '优化场景化卖点', en: 'Improve selling points' },
      improveListingDetails: { zh: '完善商品详情', en: 'Improve listing details' },
      completeProductCard: { zh: '先补全商品信息', en: 'Complete product card first' },
    },
    demoCard: {
      title: { zh: '业务场景快速体验', en: 'Business Scenario Examples' },
      hint: {
        zh: '点击下方任意场景，载入到扫描器中查看批量分析结果。',
        en: 'Click any scenario to load it into the scanner and see batch analysis.',
      },
      loadBtn: { zh: '加载到扫描器', en: 'Load into Scanner' },
    },
    board: {
      title: { zh: 'SKU 优先级面板', en: 'SKU Priority Board' },
      empty: {
        zh: '尚未扫描。请上传 CSV、粘贴记录或加载一个业务场景。',
        en: 'No SKUs scanned yet. Upload a CSV, paste records, or load a scenario.',
      },
      cols: {
        sku: { zh: 'SKU', en: 'SKU' },
        role: { zh: '经营角色', en: 'Role' },
        opportunity: { zh: '最大机会', en: 'Opportunity' },
        risk: { zh: '最大风险', en: 'Risk' },
        priority: { zh: '优先级', en: 'Priority' },
        next: { zh: '下一步动作', en: 'Next Action' },
      },
      runDiagnosis: { zh: 'Run full diagnosis', en: 'Run full diagnosis' },
    },
    diagnosis: {
      title: { zh: '重点 SKU 详细诊断', en: 'Selected SKU Diagnosis' },
      hint: {
        zh: '补充商品描述 / 评价样本 / 卖点后点击「开始诊断」。',
        en: 'Fill in Description / Review Samples / Selling Points, then click Run SKU Diagnosis.',
      },
    },
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
