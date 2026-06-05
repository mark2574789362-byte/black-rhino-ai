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
  skuStrategy: string;
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
  nextAction: string;
}

export const DEMO_PRODUCTS: { name: string; product: ProductInfo }[] = [
  {
    name: '设备 + 耗材复购模型',
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
    name: '高复购耗材模型',
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
    name: '3C 同质化竞争模型',
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


// Demo 输出（4 个场景：barcode / consumable / baseus / default）
export const DEMO_OUTPUTS_EN: AIOutput[] = [
  {
    status: 'partial',
    dataSufficiencyScore: 68,
    canAnalyze: ['Product positioning and target user segments', 'Listing optimization direction', 'Bundle opportunity for B2B buyers'],
    cannotAnalyze: ['Real sales velocity and turnover rate', 'Profit margin per SKU', 'Customer repurchase rate'],
    productPositioning: 'Professional-grade equipment targeting warehouse, retail and logistics operations in South Africa, where barcode adoption is growing with e-commerce expansion.',
    listingDiagnosis: [
      'Title lacks B2B-specific keywords like "warehouse", "logistics", "retail"',
      'Selling points do not emphasize durability and high-volume throughput',
      'Missing compatibility matrix (which POS/warehouse systems work with this device)',
    ],
    optimizedTitle: 'Industrial Barcode Printer for Warehouse, Retail & Logistics | High-Speed Thermal Transfer',
    sellingPoints: [
      'Prints 4x6 shipping labels at up to 6ips — ideal for high-volume fulfillment centers',
      'Direct thermal and thermal transfer modes for different label materials',
      'Compatible with most major shipping platforms and warehouse management systems',
      'Heavy-duty metal frame built for continuous operation in demanding environments',
      'USB, Serial, and Ethernet connectivity for flexible system integration',
    ],
    bundleRecommendation: [{
      name: 'Warehouse Starter Bundle',
      items: ['Industrial Barcode Printer', '4x6 Thermal Labels (1000 rolls)', 'Premium Wax Ribbon', 'Label Design Software'],
      purpose: 'Reduce first-purchase friction for B2B buyers; software adds perceived value and reduces returns',
    }],
    seoKeywords: [
      'barcode printer south africa',
      'warehouse label printer',
      'industrial thermal printer',
      'shipping label printer',
      'retail barcode scanner',
      'logistics labeling solution',
      '4x6 label printer',
      'thermal transfer printer',
    ],
    contentIdeas: [
      'How to Choose the Right Barcode Printer for Your South African Warehouse',
      'Barcode Labeling 101: A Guide for South African Small Businesses',
      'Top 5 Warehouse Efficiency Upgrades for Under R5,000',
    ],
    dataNeeded: ['Monthly sales velocity per SKU', 'Gross margin per product line', 'Return and defect rate by category'],
    dataMetrics: [
      { metric: 'B2B Quote Request Rate', reason: 'Tracks B2B channel demand', nextAction: 'If quote requests are high but conversions low, review pricing for B2B segment' },
      { metric: 'Label Volume per Customer', reason: 'Indicates consumable repurchase potential', nextAction: 'If volume drops, trigger repurchase reminder email sequence' },
      { metric: 'Return Rate by Product', reason: 'High return rate signals listing vs reality mismatch', nextAction: 'If return rate is high, review listing description accuracy and photo fidelity' },
    ],
    skuStrategy: 'This hardware SKU should serve as an entry point to drive label repurchase. Priority: (1) Optimize listing conversion for first order, (2) Add consumable bundle to raise AOV, (3) Track label attach rate per order, (4) Build 60-day repurchase email sequence for consumables.',
  },
  {
    status: 'full',
    dataSufficiencyScore: 82,
    canAnalyze: ['Repeat purchase potential and LTV', 'Bundle opportunity with compatible hardware', 'SEO keyword and content direction'],
    cannotAnalyze: ['Actual repurchase rate from CRM data', 'Inventory turnover days', 'Customer acquisition cost per channel'],
    productPositioning: 'High-utility consumable driving recurring revenue through repeat purchase, targeting small businesses and home users with label printer hardware.',
    listingDiagnosis: [
      'Product title does not emphasize compatibility with specific printer models',
      'No "buy in bulk" or subscription option mentioned',
      'Missing use-case language for specific industries (e-commerce sellers, retailers)',
    ],
    optimizedTitle: 'Niimbot Series B Label Rolls 50x30mm — Compatible with B21/B1/B3S | High-Quality Thermal Labels (White)',
    sellingPoints: [
      'Compatible with Niimbot B21, B1, and B3S — no guesswork on which labels to buy',
      'Premium thermal paper stock — crisp prints, no smudging or fading',
      'Permanent adhesive holds firmly on most surfaces in South African climate conditions',
      'Easy-peel backing for fast application in high-volume labeling tasks',
      'Available in white, transparent, and colored — suit different labeling needs',
    ],
    bundleRecommendation: [
      {
        name: 'Small Business Label Value Pack',
        items: ['Niimbot Series B Labels (5 rolls)', 'Cable Labels (1 roll)', 'Transparent Labels (1 roll)'],
        purpose: 'Test whether multi-roll bundle improves AOV compared with single-roll purchase',
      },
      {
        name: 'Auto-Replenishment Plan',
        items: ['Monthly label subscription', '10% off recurring orders', 'Free shipping on all subscriptions'],
        purpose: 'Lock in recurring revenue and reduce churn — labels are a natural subscription product',
      },
    ],
    seoKeywords: [
      'niimbot labels south africa',
      'thermal label rolls 50x30mm',
      'label printer consumables',
      'buy labels online south africa',
      'small business labeling supplies',
      'label printer paper',
      'ecommerce shipping labels',
      'storage organization labels',
    ],
    contentIdeas: [
      'How to Organize Your Small Business Inventory with Thermal Labels',
      'Top 10 Labeling Mistakes E-commerce Sellers Make (and How to Fix Them)',
      'Home Organization Hacks: How South African Homeowners Use Label Printers',
    ],
    dataNeeded: ['Current monthly reorder rate by customer', 'Average order frequency for consumables', 'Churn rate of customers who only bought consumables once'],
    dataMetrics: [
      { metric: 'Repeat Purchase Rate', reason: 'Core health metric for consumable SKUs', nextAction: 'Track repeat purchase within 60-90 days to validate consumable retention' },
      { metric: 'Consumable/Hardware Ratio', reason: 'High ratio signals strong consumables ecosystem', nextAction: 'If ratio is low, investigate why hardware buyers are not converting to consumables' },
      { metric: 'Customer LTV', reason: 'Track LTV by acquisition channel to optimize ad spend', nextAction: 'Use LTV data to decide where to increase or decrease ad spend' },
    ],
    skuStrategy: 'This consumable SKU is the LTV core of the category. Priority: (1) Drive first-time trial with value-pack bundle, (2) Convert to subscription or auto-replenishment, (3) Track reorder rate per customer segment, (4) Monitor consumable attach rate from hardware buyers.',
  },
  {
    status: 'partial',
    dataSufficiencyScore: 65,
    canAnalyze: ['Product positioning vs competitors', 'Scene-based selling point opportunities', 'Cross-sell and upsell potential'],
    cannotAnalyze: ['Real market share vs Anker and other competitors', 'Actual conversion rate by traffic source', 'Customer demographic breakdown'],
    productPositioning: 'Price-competitive 3C accessory targeting value-conscious South African consumers who want reliable performance without paying premium brand prices.',
    listingDiagnosis: [
      'Title is purely specs-driven — no emotional hook or use-case scenario',
      'Selling points compete directly with Anker, Samsung, and other established brands on specs alone',
      'Missing social proof elements: use context, "ideal for students", "perfect for load-shedding charging needs"',
    ],
    optimizedTitle: 'Baseus 20000mAh Power Bank 65W — Fast Charge Laptop & Phone | Portable Charger for South Africa',
    sellingPoints: [
      '65W output charges most laptops via USB-C — work from anywhere in South Africa',
      '20000mAh real capacity — charges iPhone 14 Pro over 4 times or Samsung S23 Ultra over 3 times',
      'Dual output (USB-C + USB-A) — charge two devices simultaneously',
      'Built-in LED display shows remaining battery percentage at a glance',
      'Certified safe — over-charge, over-current, and short-circuit protection',
    ],
    bundleRecommendation: [{
      name: 'Student & Remote Worker Bundle',
      items: ['Baseus 20000mAh Power Bank', 'USB-C to USB-C Cable (1m)', 'Compact Travel Pouch'],
      purpose: 'Potentially improve AOV if customers accept accessory bundles',
    }],
    seoKeywords: [
      'power bank south africa',
      '20000mah power bank',
      'fast charging power bank',
      'usb c power bank',
      'laptop charger portable',
      'load shedding power bank',
      'south africa electronics',
      'portable charger travel',
    ],
    contentIdeas: [
      'Best Portable Power Banks for South African Load-Shedding (2025 Guide)',
      'How to Choose the Right Power Bank for Your Phone, Tablet or Laptop',
      'Travel Essentials: The Only Power Bank You Need for South African Road Trips',
    ],
    dataNeeded: ['Sales rank by category on Takealot', 'Customer review sentiment by feature', 'Traffic source breakdown (organic vs paid vs Takealot internal)'],
    dataMetrics: [
      { metric: 'Category Sales Rank', reason: 'Tracks competitive position against Anker and other brands', nextAction: 'If rank drops, review competitor pricing and adjust bundle offers' },
      { metric: 'Review Sentiment Score', reason: 'Aggregate sentiment from reviews tells you which features resonate', nextAction: 'Use sentiment breakdown to prioritize next listing improvement' },
      { metric: 'Add-to-Cart vs Purchase Rate', reason: 'High add-to-cart but low purchase = price or reviews issue', nextAction: 'If ATC is high but purchase is low, optimize price or address review concerns' },
    ],
    skuStrategy: 'This 3C SKU operates in a crowded competitive space. Priority: (1) Differentiate via use-case scenarios, not raw specs, (2) Build bundle offers to raise AOV, (3) Monitor category rank and review sentiment, (4) Test price elasticity before discounting.',
  },
  {
    status: 'partial',
    dataSufficiencyScore: 72,
    canAnalyze: ['Product positioning for small business and home users', 'Listing optimization direction (title, bullet points)', 'Bundle and accessory cross-sell opportunity'],
    cannotAnalyze: ['Real click-through rate and conversion rate', 'Customer purchase journey and drop-off points', 'Inventory turnover and stockout frequency'],
    productPositioning: 'Versatile portable label printer for South African small businesses, home organizers, and retailers — differentiating on portability, ease of use, and no-ink convenience.',
    listingDiagnosis: [
      'Title focuses on specs ("portable") but misses the use-case ("small business labeling", "home organization")',
      'Selling points are generic thermal printer benefits, not South African-specific use cases',
      'Missing social proof — number of happy customers, compatible label range, print speed benchmarks',
    ],
    optimizedTitle: 'Niimbot B21 Portable Label Printer — Perfect for Small Business, Home & Retail Labeling | Bluetooth, No Ink Required',
    sellingPoints: [
      'Prints professional-quality labels at home, in-store, or in-warehouse — no ink or toner needed',
      'Bluetooth connectivity — set up in 3 minutes, works directly from your phone or laptop',
      'Compatible with Niimbot B-series labels in multiple sizes — 40x30mm, 50x30mm, and custom sizes',
      'Lightweight (190g) and portable — take it to markets, pop-up shops, or around the warehouse',
      'Free Niimbot app with 100+ label templates — designed for South African small business owners',
    ],
    bundleRecommendation: [
      {
        name: 'Small Business Starter Kit',
        items: ['Niimbot B21 Printer', 'Series B Labels (2 rolls: 50x30mm)', 'Transparent Labels (1 roll)', 'Cable Labels (1 roll)'],
        purpose: 'Potentially improve AOV if customers accept accessory bundles',
      },
    ],
    seoKeywords: [
      'label printer south africa',
      'portable label printer',
      'thermal label printer small business',
      'bluetooth label printer',
      'home organization labels',
      'price tag printer',
      'retail labeling solution',
      'niimbot south africa',
    ],
    contentIdeas: [
      'How to Organize Your Small Business Inventory with a Label Printer (Step-by-Step)',
      '10 Ways South African Small Business Owners Use Label Printers to Save Time',
      'Niimbot B21 Review: The Best Budget Label Printer for South African Small Businesses in 2025',
    ],
    dataNeeded: ['Weekly click-through rate by listing variant', 'Add-to-cart rate and abandoned cart reasons', 'Inventory turnover by SKU size/color variant'],
    dataMetrics: [
      { metric: 'CTR (Click-Through Rate)', reason: 'Measures title and main image effectiveness vs category average', nextAction: 'If CTR is low, test alternative titles and main images' },
      { metric: 'Add-to-Cart Rate', reason: 'High CTR but low ATC = listing photos or reviews issue', nextAction: 'If add-to-cart is low despite good CTR, review listing photos and review scores' },
      { metric: 'Bundle Attach Rate', reason: 'What % of hardware buyers add labels to cart — measures cross-sell effectiveness', nextAction: 'If attach rate is low, test bundle discount or auto-bundle at checkout' },
      { metric: 'Label Repurchase Rate', reason: 'Critical metric for consumable business model — repeat purchase within 60 days', nextAction: 'If repurchase rate is low, set up automated replenishment reminder for lapsed customers' },
    ],
    skuStrategy: 'This versatile hardware SKU attracts multiple buyer segments. Priority: (1) Capture first-order conversion with clear use-case messaging, (2) Push bundle and accessory cross-sell, (3) Track add-to-cart and conversion rate per segment, (4) Convert hardware buyers to label consumable repurchase.',
  },
];
