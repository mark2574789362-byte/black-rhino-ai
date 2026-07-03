import type { ProductInfo } from "./types";

export interface GoldenSkuCase {
  id: string;
  name: string;
  product: ProductInfo;
  expectedPositioningKeywords: string[];
  expectedListingKeywords: string[];
  expectedBundleKeywords: string[];
  expectedSeoKeywords: string[];
  forbiddenClaims: string[];
}

const baseForbiddenClaims = [
  "high sales",
  "low sales",
  "high margin",
  "low margin",
  "inventory risk",
  "ad roi",
  "roas",
  "a class",
  "b class",
  "c class"
];

export const goldenSkuCases: GoldenSkuCase[] = [
  {
    id: "niimbot-b21-public",
    name: "Niimbot B21 Portable Thermal Label Printer",
    product: {
      productName: "Niimbot B21 Portable Thermal Label Printer",
      brand: "Niimbot",
      category: "Business Label Printer",
      price: "R 1,299.00",
      currentTitle: "Niimbot B21 - Portable Thermal Label Printer With 1 Roll Free Tape (50x30mm label,230pcs)",
      description:
        "Public product page describes a portable thermal label printer with one 50x30mm roll, Android/iOS support, PC support with driver, 20-50mm print width, 60mm/s speed and labels for clothing, jewelry, supermarket, fresh food, medicine, food and cables.",
      currentSellingPoints:
        "No toner or carbon tape, free 50x30mm label roll, Android/iOS compatible, PC driver support, auto-identifies label paper, 4 hours continuous working time, waterproof and tear-resistant labels.",
      channel: "Both",
      targetUser: "All",
      consumable: true,
      relatedProducts: "Niimbot B21/B1/B3S white labels, clear labels, cable labels, extra refill rolls",
      reviewSamples:
        "Public page has no customer review sample. Use only title, features, label compatibility and public product page data.",
      productUrl: "https://www.niimbotonline.co.za/products/niimbot-b21-thermal-label-printer"
    },
    expectedPositioningKeywords: ["repeat-purchase", "device", "ecosystem"],
    expectedListingKeywords: ["compatible", "label sizes", "use cases"],
    expectedBundleKeywords: ["refill", "labels", "starter"],
    expectedSeoKeywords: ["label printer", "small business", "home organization"],
    forbiddenClaims: baseForbiddenClaims
  },
  {
    id: "niimbot-b1-public",
    name: "Niimbot B1 Portable Thermal Label Printer",
    product: {
      productName: "Niimbot B1 Portable Thermal Label Printer",
      brand: "Niimbot",
      category: "Business Label Printer",
      price: "R 719.00",
      currentTitle: "Niimbot B1 - Portable Thermal Label Printer 1 Roll Free Tape (50x30mm label,230pcs)",
      description:
        "Public product listing positions B1 as a portable thermal label printer with one free 50x30mm roll. Niimbot FAQ states B1 supports phone and computer use and 25-50mm consumable width.",
      currentSellingPoints:
        "Portable thermal label printer, free 50x30mm tape, phone and Windows computer workflow, suitable for business and organization labels.",
      channel: "Both",
      targetUser: "Small Business",
      consumable: true,
      relatedProducts: "Niimbot B series labels, white labels, clear labels, cable labels, refill bundles",
      reviewSamples:
        "Public page has no customer review sample. Evaluate compatibility, setup clarity and refill guidance from product data only.",
      productUrl: "https://www.niimbotonline.co.za/products/niimbot-b1-portable-thermal-printer"
    },
    expectedPositioningKeywords: ["repeat-purchase", "device", "ecosystem"],
    expectedListingKeywords: ["compatible", "setup", "label sizes"],
    expectedBundleKeywords: ["refill", "labels", "starter"],
    expectedSeoKeywords: ["label printer", "small business", "thermal label"],
    forbiddenClaims: baseForbiddenClaims
  },
  {
    id: "niimbot-b3s-public",
    name: "Niimbot B3S 3-inch Wireless Portable Label Printer",
    product: {
      productName: "Niimbot B3S 3-inch Wireless Portable Label Printer",
      brand: "Niimbot",
      category: "Business Label Printer",
      price: "R 2,499.00",
      currentTitle: "Niimbot B3S - 3 inch-Wireless Portable Label Printer With 1 Roll of Tape (70x40mm)",
      description:
        "Public product page lists a 3-inch wireless portable label printer with one 70x40mm tape roll. Niimbot FAQ describes B3S use cases such as asset labeling, office item labeling, switch labeling, warehouse or cabinet partition labeling, data center cable labeling, serial numbers and index tags.",
      currentSellingPoints:
        "3-inch wireless label printer, 70x40mm starter roll, office and warehouse scenarios, Windows USB workflow with driver, supports 25-75mm label width.",
      channel: "Both",
      targetUser: "Warehouse/Retail",
      consumable: true,
      relatedProducts: "70x40mm labels, B21/B1/B3S white labels, clear labels, cable labels, barcode label rolls",
      reviewSamples:
        "Public page has no customer review sample. Evaluate use-case clarity, label-width clarity and B2B workflow fit.",
      productUrl: "https://www.niimbotonline.co.za/products/b3s-3-inch-label-printer"
    },
    expectedPositioningKeywords: ["B2B", "warehouse", "workflow"],
    expectedListingKeywords: ["asset", "label width", "setup"],
    expectedBundleKeywords: ["70x40", "labels", "refill"],
    expectedSeoKeywords: ["warehouse", "label printer", "asset labels"],
    forbiddenClaims: baseForbiddenClaims
  },
  {
    id: "niimbot-white-labels-public",
    name: "Niimbot White Series Thermal Label for B21/B1/B3S",
    product: {
      productName: "Niimbot White Series Thermal Label for B21, B1, B3S",
      brand: "Niimbot",
      category: "Label Printer Consumables",
      price: "R 169.00",
      currentTitle: "Niimbot White Series Thermal Label for B21, B1, B3S",
      description:
        "Public listing identifies white thermal label tape for B21, B1 and B3S printers. It is a refill consumable SKU tied to the B-series printer ecosystem.",
      currentSellingPoints:
        "White thermal labels, compatible with B21/B1/B3S, refill product for business, home and office label printing.",
      channel: "Both",
      targetUser: "All",
      consumable: true,
      relatedProducts: "Niimbot B21, Niimbot B1, Niimbot B3S, clear label tape set, cable labels",
      reviewSamples:
        "Public page has no customer review sample. Evaluate compatibility clarity, size guidance and refill bundle opportunity.",
      productUrl: "https://www.niimbotonline.co.za/products/white-label-for-b21-b1-b3s"
    },
    expectedPositioningKeywords: ["repeat-purchase", "consumable", "refill"],
    expectedListingKeywords: ["compatible", "label sizes", "refill"],
    expectedBundleKeywords: ["printer", "multi-size", "refill"],
    expectedSeoKeywords: ["Niimbot", "label tape", "refill"],
    forbiddenClaims: baseForbiddenClaims
  },
  {
    id: "niimbot-clear-labels-public",
    name: "Niimbot Clear Label Tape Set for B21/B1/B3S",
    product: {
      productName: "Niimbot Clear Label Tape Set for B21, B1, B3S",
      brand: "Niimbot",
      category: "Label Printer Consumables",
      price: "R 807.00",
      currentTitle: "Niimbot Clear Label Tape Set for B21, B1, B3S",
      description:
        "Public product page describes a three-roll clear refill label set compatible with NIIMBOT B1/B21/B3S/K3 label printers, with 40x30 and 50x50 round size options, multipurpose use and waterproof, oil-proof, abrasion-resistant labels.",
      currentSellingPoints:
        "Three-roll clear refill set, compatible with B1/B21/B3S/K3, suitable for business, office, home, travel jars, mailing, logo, file and food bottle labels.",
      channel: "Both",
      targetUser: "All",
      consumable: true,
      relatedProducts: "Niimbot B21, Niimbot B1, Niimbot B3S, white label tape, cable labels",
      reviewSamples:
        "Public page has no customer review sample. Evaluate size clarity, compatible model clarity and use-case grouping.",
      productUrl: "https://www.niimbotonline.co.za/products/clear-label-tape-set-for-b21-b1-b3s"
    },
    expectedPositioningKeywords: ["repeat-purchase", "consumable", "refill"],
    expectedListingKeywords: ["compatible", "40x30", "50x50"],
    expectedBundleKeywords: ["printer", "white labels", "multi-size"],
    expectedSeoKeywords: ["clear labels", "Niimbot", "label tape"],
    forbiddenClaims: baseForbiddenClaims
  },
  {
    id: "baseus-bipow-15w-public",
    name: "Baseus Bipow Series Digital Display Power Bank 15W",
    product: {
      productName: "Baseus Bipow Series Digital Display Power Bank 15W",
      brand: "Baseus",
      category: "Consumer Electronics Accessory",
      price: "R 399.00",
      currentTitle: "Baseus Bipow Series Digital Display Power Bank 15W - Black",
      description:
        "Public Black Rhino Shop product page lists a Baseus Bipow 15W black power bank with digital display and 10000mAh, 20000mAh and 30000mAh battery capacity variants.",
      currentSellingPoints:
        "15W power bank, digital display, black color, capacity options for 10000mAh, 20000mAh and 30000mAh, mobile charging category.",
      channel: "Independent Store",
      targetUser: "All",
      consumable: false,
      relatedProducts: "Baseus Type-C cable, charger, wireless charging accessory, travel adapter",
      reviewSamples:
        "Public page has no customer review sample. Evaluate scenario clarity around travel, commuting, student and office charging needs.",
      productUrl: "https://www.blackrhinoshop.co.za/products/baseus-bipow-series-digital-display-power-bank-15w-black"
    },
    expectedPositioningKeywords: ["consumer electronics", "scenario", "comparison"],
    expectedListingKeywords: ["capacity", "15W", "digital display"],
    expectedBundleKeywords: ["Type-C", "charger", "travel adapter"],
    expectedSeoKeywords: ["power bank", "portable charger", "travel"],
    forbiddenClaims: baseForbiddenClaims
  },
  {
    id: "baseus-hub-6in1-public",
    name: "Baseus 6-in-1 Ultrajoy Type-C Hub",
    product: {
      productName: "Baseus 6-in-1 Ultrajoy Series 6 Port Hub Type-C Docking Station",
      brand: "Baseus",
      category: "Consumer Electronics Accessory",
      price: "R 999.00",
      currentTitle: "Baseus 6-in-1 Ultrajoy Series 6 Port Hub Type-C Docking Station",
      description:
        "Public Black Rhino Shop product page lists a Baseus 6-in-1 Ultrajoy Type-C hub/docking station in Space Grey under the Hubs & Docks category.",
      currentSellingPoints:
        "6-in-1 Type-C docking station, Space Grey, hub and dock accessory for laptop and work desk scenarios.",
      channel: "Independent Store",
      targetUser: "All",
      consumable: false,
      relatedProducts: "Baseus power bank, Type-C cable, laptop stand, wall charger, Ethernet adapter",
      reviewSamples:
        "Public page has no customer review sample. Evaluate whether listing should clarify ports, laptop compatibility and office/travel scenarios.",
      productUrl: "https://www.blackrhinoshop.co.za/products/baseus-lite-series-5-port-type-c-hub-docking-station-space-grey"
    },
    expectedPositioningKeywords: ["consumer electronics", "office", "scenario"],
    expectedListingKeywords: ["ports", "compatibility", "laptop"],
    expectedBundleKeywords: ["Type-C", "charger", "power bank"],
    expectedSeoKeywords: ["USB-C hub", "docking station", "laptop"],
    forbiddenClaims: baseForbiddenClaims
  },
  {
    id: "idprt-id4s-public",
    name: "iDPRT iD4S Desktop Direct Thermal Barcode Printer",
    product: {
      productName: "iDPRT iD4S Desktop Direct Thermal Barcode Printer",
      brand: "iDPRT",
      category: "Warehouse/Retail Equipment",
      price: "R 2,750.00",
      currentTitle: "iDPRT iD4S Desktop Direct Thermal Barcode Printer,USB+Ethernet port",
      description:
        "Public Black Rhino Shop page describes a desktop direct thermal barcode printer with USB+Ethernet, modular printer head, 203/300dpi detection, BarTender label editing software, direct thermal print method, ZPL-II/EPL2/DPL protocol compatibility and 1D/2D barcode support.",
      currentSellingPoints:
        "Desktop barcode printer, USB and Ethernet, 203/300dpi, external roll holder option, 108mm max print width, Windows/Linux/MacOS driver support, BarTender software.",
      channel: "Independent Store",
      targetUser: "Warehouse/Retail",
      consumable: true,
      relatedProducts: "direct thermal labels, blank labels on rolls, barcode scanner, external label roll holder",
      reviewSamples:
        "Public page has no customer review sample. Evaluate setup clarity, barcode protocol clarity and label compatibility guidance.",
      productUrl: "https://www.blackrhinoshop.co.za/products/hprt-id4s-label-printer"
    },
    expectedPositioningKeywords: ["B2B", "warehouse", "workflow"],
    expectedListingKeywords: ["barcode", "compatibility", "setup"],
    expectedBundleKeywords: ["labels", "scanner", "roll holder"],
    expectedSeoKeywords: ["barcode printer", "warehouse", "shipping labels"],
    forbiddenClaims: baseForbiddenClaims
  },
  {
    id: "hprt-t20-public",
    name: "HPRT T20 Bluetooth Thermal Label Printer",
    product: {
      productName: "HPRT T20 Bluetooth Thermal Label Printer",
      brand: "HPRT",
      category: "Business Label Printer",
      price: "",
      currentTitle: "HPRT T20 - Bluetooth Thermal Label Printer -Office/Home/School Use",
      description:
        "Public Black Rhino Shop navigation lists HPRT T20 under business label printers and the product title positions it for office, home and school use.",
      currentSellingPoints:
        "Bluetooth thermal label printer for office, home and school labeling scenarios.",
      channel: "Independent Store",
      targetUser: "All",
      consumable: true,
      relatedProducts: "HPRT thermal labels for T20, label refill rolls, storage labels, school labels",
      reviewSamples:
        "Public page data is lighter than Niimbot pages. Treat price and detailed specification as missing unless manually collected.",
      productUrl: "https://www.blackrhinoshop.co.za/products/hprt-t20-bluetooth-thermal-label-printer"
    },
    expectedPositioningKeywords: ["device", "ecosystem", "repeat-purchase"],
    expectedListingKeywords: ["Bluetooth", "office", "school"],
    expectedBundleKeywords: ["HPRT labels", "refill", "starter"],
    expectedSeoKeywords: ["thermal label printer", "office labels", "school labels"],
    forbiddenClaims: baseForbiddenClaims
  },
  {
    id: "incomplete-product-boundary",
    name: "Incomplete Product Name Only",
    product: {
      productName: "Niimbot B21",
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
    },
    expectedPositioningKeywords: ["信息不足", "补充", "诊断"],
    expectedListingKeywords: ["not enough", "missing", "should not generate"],
    expectedBundleKeywords: [],
    expectedSeoKeywords: [],
    forbiddenClaims: [...baseForbiddenClaims, "bundle aov", "best label printers"]
  }
];
