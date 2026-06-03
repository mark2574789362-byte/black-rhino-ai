export interface ProductInfo {
  productName: string;
  brand: string;
  category: string;
  price: string;
  currentTitle: string;
  description: string;
  currentSellingPoints: string;
  channel: 'Takealot' | 'Independent Store' | 'Both';
  targetUser: 'Home User' | 'Small Business' | 'Warehouse/Retail' | 'All';
  consumable: boolean;
  relatedProducts: string;
  reviewSamples: string;
  productUrl: string;
}

export interface AIOutput {
  status: 'insufficient' | 'partial' | 'full';
  dataSufficiencyScore: number;
  canAnalyze: string[];
  cannotAnalyze: string[];
  productPositioning: string;
  listingDiagnosis: string[];
  optimizedTitle: string;
  sellingPoints: string[];
  bundleRecommendation: BundleItem[];
  seoKeywords: string[];
  contentIdeas: string[];
  dataNeeded: string[];
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

export const DEMO_PRODUCTS: { name: string; product: ProductInfo }[] = [
  {
    name: 'Niimbot B21 (设备+耗材)',
    product: {
      productName: 'Niimbot B21 Label Printer',
      brand: 'Niimbot',
      category: 'Business Label Printer',
      price: '899 ZAR',
      currentTitle: 'Niimbot B21 Thermal Label Printer Portable',
      description:
        'Portable thermal label printer for small businesses and home use. No ink required. Bluetooth connectivity. Works with Niimbot label rolls.',
      currentSellingPoints: 'Portable, Thermal, Free Tape',
      channel: 'Both',
      targetUser: 'Small Business',
      consumable: true,
      relatedProducts: 'Series B Labels (50x30mm), Transparent Labels, Cable Labels',
      reviewSamples:
        'Good quality printer for the price. Easy setup. Labels peel off easily. Works well for small business inventory. A bit slow for large batches.',
      productUrl: 'https://niimbot.co.za/products/b21',
    },
  },
  {
    name: 'Niimbot Labels (耗材复购型)',
    product: {
      productName: 'Niimbot Series B Label Rolls',
      brand: 'Niimbot',
      category: 'Label Consumables',
      price: '129 ZAR',
      currentTitle: 'Niimbot Series B Label Rolls (50x30mm)',
      description:
        'High-quality thermal labels compatible with Niimbot B21, B1, B3S printers. White paper stock, permanent adhesive.',
      currentSellingPoints: 'Compatible, High Quality, Easy Peel',
      channel: 'Both',
      targetUser: 'Small Business',
      consumable: true,
      relatedProducts: 'Niimbot B21, Niimbot B1, Niimbot B3S',
      reviewSamples:
        'Labels stick well. Good value for money. Arrived quickly. Paper quality is better than expected. Will reorder.',
      productUrl: 'https://niimbot.co.za/collections/labels',
    },
  },
  {
    name: 'Baseus Power Bank (3C同质化)',
    product: {
      productName: 'Baseus 20000mAh Power Bank',
      brand: 'Baseus',
      category: 'Power Bank',
      price: '599 ZAR',
      currentTitle: 'Baseus 20000mAh Power Bank Fast Charging',
      description:
        '20000mAh portable charger with dual USB-C and USB-A ports. Supports 65W fast charging for laptops and phones.',
      currentSellingPoints: '20000mAh, 65W Fast Charging, Dual Port',
      channel: 'Both',
      targetUser: 'Home User',
      consumable: false,
      relatedProducts: 'USB-C Cable, Phone Case',
      reviewSamples:
        'Charges my phone fast. Capacity is real. A bit heavy. Build quality feels cheap compared to Anker. Works as described.',
      productUrl: 'https://blackrhinoshop.com/products/baseus-power-bank',
    },
  },
];

