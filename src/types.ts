export interface ProductInfo {
  productName: string;
  brand: string;
  category: string;
  price: string;
  description: string;
  channel: 'Takealot' | 'Independent Store' | 'Both';
  targetUser: 'Home User' | 'Small Business' | 'Warehouse/Retail' | 'All';
  consumable: boolean;
  relatedProducts: string;
}

export interface AIOutput {
  listingDiagnosis: string[];
  optimizedTitle: string;
  sellingPoints: string[];
  bundleRecommendation: BundleItem[];
  seoKeywords: string[];
  dataMetrics: MetricItem[];
}

export interface BundleItem {
  name: string;
  items: string[];
  purpose: string;
}

export interface MetricItem {
  metric: string;
  reason: string;
}

export const DEFAULT_PRODUCT: ProductInfo = {
  productName: 'Niimbot B21 Label Printer',
  brand: 'Niimbot',
  category: 'Business Label Printer',
  price: '',
  description: '',
  channel: 'Both',
  targetUser: 'Small Business',
  consumable: true,
  relatedProducts: 'Series B Labels, Transparent Labels, Cable Labels',
};

export const DEMO_OUTPUT: AIOutput = {
  listingDiagnosis: [
    'Title focuses on product parameters but lacks user scenario words',
    'Selling points do not highlight small business / home organization / warehouse labeling use cases',
    'Missing compatible consumables info to reduce user purchase decision friction',
  ],
  optimizedTitle: 'NIIMBOT B21 Portable Label Printer for Small Business, Home Organization and Retail Labeling',
  sellingPoints: [
    'Portable thermal label printer designed for small businesses and home users',
    'Ideal for price tags, storage labels, barcode labels and home organization',
    'No ink or toner required — reduces long-term operating cost',
    'Compatible with multiple label sizes (40x30mm, 50x30mm, etc.)',
    'Suitable for retail stores, online sellers and warehouse labeling needs',
  ],
  bundleRecommendation: [
    {
      name: 'Small Business Starter Kit',
      items: ['NIIMBOT B21 Printer', '50x30mm Labels (2 rolls)', 'Transparent Labels (1 roll)', 'Cable Labels (1 roll)'],
      purpose: 'Increase average order value and reduce first-time buyer decision friction',
    },
  ],
  seoKeywords: [
    'label printer south africa',
    'thermal label printer',
    'small business label printer',
    'barcode label printer',
    'home organization labels',
    'price tag printer',
    'warehouse labeling solution',
    'retail label maker',
  ],
  dataMetrics: [
    { metric: 'CTR (Click-Through Rate)', reason: '衡量标题和主图吸引点击的能力' },
    { metric: 'Conversion Rate', reason: '验证卖点是否有效转化为购买' },
    { metric: 'Add-to-Cart Rate', reason: '判断Bundle套餐吸引力' },
    { metric: 'Bundle AOV', reason: '追踪套餐对客单价的提升效果' },
    { metric: 'Label Repeat Purchase Rate', reason: '监控耗材复购，复购率高是核心盈利点' },
  ],
};
