import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Package, Search, BarChart2, ShoppingCart, FileText,
  ChevronRight, Loader2, CheckCheck, Copy, Target, TrendingUp, RotateCw
} from 'lucide-react';
import type { ProductInfo, AIOutput } from './types';
import { DEFAULT_PRODUCT, DEMO_OUTPUT } from './types';
import { buildPrompt } from './prompts';

const CHANNELS = ['Takealot', 'Independent Store', 'Both'] as const;
const TARGET_USERS = ['Home User', 'Small Business', 'Warehouse/Retail', 'All'] as const;

function SectionCard({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-[#1a1a1a] transition-colors"
      >
        <span className="text-orange-500">{icon}</span>
        <span className="text-sm font-medium text-[#e5e5e5]">{title}</span>
        <ChevronRight
          size={14}
          className={`ml-auto text-[#737373] transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-[#2a2a2a]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-[#737373] hover:text-orange-500 transition-colors"
    >
      {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function OutputSection({ output }: { output: AIOutput }) {
  return (
    <div className="space-y-3">
      {/* Listing Diagnosis */}
      <SectionCard title="Listing Diagnosis" icon={<FileText size={16} />} defaultOpen>
        <ul className="space-y-2">
          {output.listingDiagnosis.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#a3a3a3]">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Optimized Title */}
      <SectionCard title="Optimized Product Title" icon={<Zap size={16} />} defaultOpen>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-[#e5e5e5] leading-relaxed">{output.optimizedTitle}</p>
          <CopyButton text={output.optimizedTitle} />
        </div>
      </SectionCard>

      {/* Selling Points */}
      <SectionCard title="Five Key Selling Points" icon={<Target size={16} />} defaultOpen>
        <ul className="space-y-2">
          {output.sellingPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#a3a3a3]">
              <span className="text-orange-500 font-medium min-w-[18px]">{i + 1}.</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Bundle */}
      <SectionCard title="Bundle Recommendation" icon={<ShoppingCart size={16} />}>
        <div className="space-y-4">
          {output.bundleRecommendation.map((bundle, i) => (
            <div key={i} className="border border-[#2a2a2a] rounded-lg p-3 bg-[#1a1a1a]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-orange-500">{bundle.name}</h4>
              </div>
              <ul className="space-y-1 mb-2">
                {bundle.items.map((item, j) => (
                  <li key={j} className="text-xs text-[#a3a3a3] flex items-center gap-1.5">
                    <span className="text-[#525252]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#737373] italic">{bundle.purpose}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* SEO Keywords */}
      <SectionCard title="SEO Keywords" icon={<Search size={16} />}>
        <div className="flex flex-wrap gap-2">
          {output.seoKeywords.map((kw, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[#1f1f1f] border border-[#2a2a2a] text-[#a3a3a3]">
              {kw}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* Data Metrics */}
      <SectionCard title="Data Validation Metrics" icon={<BarChart2 size={16} />}>
        <div className="space-y-2">
          {output.dataMetrics.map((m, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
              <span className="text-[#e5e5e5] font-medium">{m.metric}</span>
              <span className="text-[#737373] text-xs">— {m.reason}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function InputPanel({
  product,
  onChange,
  onGenerate,
  onDemo,
  loading,
}: {
  product: ProductInfo;
  onChange: (p: ProductInfo) => void;
  onGenerate: () => void;
  onDemo: () => void;
  loading: boolean;
}) {
  const field = (label: string, key: keyof ProductInfo, placeholder = '', type = 'text') => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={product[key] as string}
          onChange={(e) => onChange({ ...product, [key]: e.target.value })}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#525252] resize-none focus:border-orange-500 transition-colors"
        />
      ) : (
        <input
          type="text"
          value={product[key] as string}
          onChange={(e) => onChange({ ...product, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-orange-500 transition-colors"
        />
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <Package size={18} className="text-orange-500" />
        <h2 className="text-sm font-semibold text-[#e5e5e5]">Product Information</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {field('Product Name', 'productName', 'e.g. Niimbot B21 Label Printer')}
        {field('Brand', 'brand', 'e.g. Niimbot')}
        {field('Category', 'category', 'e.g. Business Label Printer')}
        {field('Price (ZAR)', 'price', 'e.g. 899')}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">Target Channel</label>
          <div className="flex gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                onClick={() => onChange({ ...product, channel: ch })}
                className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
                  product.channel === ch
                    ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                    : 'border-[#2a2a2a] text-[#737373] hover:border-[#3a3a3a]'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">Target User</label>
          <div className="flex gap-2">
            {TARGET_USERS.map((tu) => (
              <button
                key={tu}
                onClick={() => onChange({ ...product, targetUser: tu })}
                className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
                  product.targetUser === tu
                    ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                    : 'border-[#2a2a2a] text-[#737373] hover:border-[#3a3a3a]'
                }`}
              >
                {tu}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">Consumable</label>
          <div className="flex gap-2">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                onClick={() => onChange({ ...product, consumable: val })}
                className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
                  product.consumable === val
                    ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                    : 'border-[#2a2a2a] text-[#737373] hover:border-[#3a3a3a]'
                }`}
              >
                {val ? 'Yes (Consumable)' : 'No (Hardware)'}
              </button>
            ))}
          </div>
        </div>

        {field('Related Products', 'relatedProducts', 'e.g. Series B Labels, Transparent Labels', 'textarea')}

        <div className="pt-2 space-y-2">
          <button
            onClick={onGenerate}
            disabled={loading || !product.productName}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={15} />
                Generate AI Diagnosis
              </>
            )}
          </button>
          <button
            onClick={onDemo}
            className="w-full py-2.5 rounded-xl border border-[#2a2a2a] hover:border-orange-500/50 text-[#a3a3a3] hover:text-orange-500 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCw size={14} />
            Load Demo (Niimbot B21)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [product, setProduct] = useState<ProductInfo>(DEFAULT_PRODUCT);
  const [output, setOutput] = useState<AIOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleGenerate = () => {
    if (!product.productName) return;
    setLoading(true);
    // Simulate AI call — replace with real API in production
    setTimeout(() => {
      // In a real scenario, this would call an AI API
      // For demo purposes, we show the prompt that would be sent
      const prompt = buildPrompt(product);
      console.log('Generated prompt:', prompt);
      setLoading(false);
      // For now, show demo output as placeholder
      setOutput(DEMO_OUTPUT);
    }, 1800);
  };

  const handleDemo = () => {
    setProduct(DEFAULT_PRODUCT);
    setOutput(DEMO_OUTPUT);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">BR</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#e5e5e5]">Black Rhino AI</h1>
              <p className="text-xs text-[#737373]">Product Operations Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="text-xs text-[#737373] hover:text-orange-500 transition-colors flex items-center gap-1.5"
          >
            <FileText size={13} />
            {showPrompt ? 'Hide' : 'Show'} Prompt Template
          </button>
        </div>
      </header>

      {/* Prompt Preview */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[#1a1a1a] overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-3">
              <p className="text-xs text-[#737373] mb-2 font-medium">Standardized Prompt Template</p>
              <pre className="text-xs text-[#a3a3a3] bg-[#141414] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {buildPrompt(product)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full px-6 py-5">
          <div className="grid grid-cols-12 gap-5 h-full">
            {/* Input Panel */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3 h-full">
              <div className="h-full border border-[#1a1a1a] rounded-2xl p-5 bg-[#111111] overflow-hidden flex flex-col">
                <InputPanel
                  product={product}
                  onChange={setProduct}
                  onGenerate={handleGenerate}
                  onDemo={handleDemo}
                  loading={loading}
                />
              </div>
            </div>

            {/* Output Panel */}
            <div className="col-span-12 lg:col-span-8 xl:col-span-9 h-full overflow-y-auto pr-1">
              {output ? (
                <OutputSection output={output} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center border border-dashed border-[#2a2a2a] rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4">
                    <TrendingUp size={24} className="text-[#525252]" />
                  </div>
                  <h3 className="text-sm font-medium text-[#525252] mb-1">No output yet</h3>
                  <p className="text-xs text-[#3a3a3a] max-w-xs">
                    Enter product information and click <span className="text-orange-500">Generate AI Diagnosis</span>, or load the demo to see a sample output.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-[#1a1a1a] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#525252]">
          <span>Black Rhino AI 商品运营诊断助手 · Demo v0.1</span>
          <span>Powered by Prompt Workflow (No API bound)</span>
        </div>
      </footer>
    </div>
  );
}
