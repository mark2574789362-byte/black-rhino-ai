import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Package, Search, BarChart2, ShoppingCart, FileText,
  Loader2, Copy, CheckCheck, RotateCw, Languages,
  AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import type { ProductInfo, AIOutput } from './types';
import { DEMO_PRODUCTS } from './types';
import { useLang, I18N, type Lang } from './i18n';

const CHANNELS: Array<ProductInfo['channel']> = ['Takealot', 'Independent Store', 'Both'];
const TARGET_USERS: Array<ProductInfo['targetUser']> = ['Home User', 'Small Business', 'Warehouse/Retail', 'All'];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLang();
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
      {copied ? t('output')('copied') : t('output')('copy')}
    </button>
  );
}

function DataSufficiencyCard({ score, canAnalyze, cannotAnalyze }: {
  score: number;
  canAnalyze: string[];
  cannotAnalyze: string[];
}) {
  const { t } = useLang();
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  return (
    <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
        <Info size={16} className="text-orange-500" />
        <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('dataSufficiency')}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#2a2a2a" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeDasharray={`${(score / 100) * 163.4} 163.4`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: scoreColor }}>
              {score}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-[#737373] mb-2">{t('output')('dataSufficiencyNote')}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-[#a3a3a3]">{t('output')('canBeAnalyzed')}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-[#a3a3a3]">{t('output')('cannotBeAnalyzed')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-green-500 mb-1.5">{t('output')('canAnalyze')}</p>
            <ul className="space-y-1">
              {canAnalyze.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-[#a3a3a3]">
                  <span className="text-green-500 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-red-500 mb-1.5">{t('output')('cannotAnalyze')}</p>
            <ul className="space-y-1">
              {cannotAnalyze.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-[#a3a3a3]">
                  <span className="text-red-500 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputSection({ output }: { output: AIOutput }) {
  const { t } = useLang();
  return (
    <div className="space-y-3">
      <DataSufficiencyCard
        score={output.dataSufficiencyScore}
        canAnalyze={output.canAnalyze}
        cannotAnalyze={output.cannotAnalyze}
      />

      {output.productPositioning && (
        <div className="border border-[#2a2a2a] rounded-xl p-4 bg-[#141414]">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('productPositioning')}</span>
          </div>
          <p className="text-sm text-[#a3a3a3] leading-relaxed">{output.productPositioning}</p>
        </div>
      )}

      {output.skuStrategy && (
        <div className="border border-orange-500/30 rounded-xl p-4 bg-[#141414]">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('skuStrategy')}</span>
          </div>
          <p className="text-sm text-[#a3a3a3] leading-relaxed whitespace-pre-wrap">{output.skuStrategy}</p>
        </div>
      )}

      {output.listingDiagnosis.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <FileText size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('listingDiagnosis')}</span>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {output.listingDiagnosis.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#a3a3a3]">
                  <span className="text-orange-500 mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {output.optimizedTitle && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <Zap size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('optimizedTitle')}</span>
          </div>
          <div className="p-4 flex items-start justify-between gap-3">
            <p className="text-sm text-[#e5e5e5] leading-relaxed flex-1">{output.optimizedTitle}</p>
            <CopyButton text={output.optimizedTitle} />
          </div>
        </div>
      )}

      {output.sellingPoints.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <FileText size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('sellingPoints')}</span>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {output.sellingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#a3a3a3]">
                  <span className="text-orange-500 mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {output.bundleRecommendation.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <ShoppingCart size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('bundle')}</span>
          </div>
          <div className="p-4 space-y-3">
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
        </div>
      )}

      {output.seoKeywords.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <Search size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('seoKeywords')}</span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {output.seoKeywords.map((kw, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[#1f1f1f] border border-[#2a2a2a] text-[#a3a3a3]">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {output.contentIdeas.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <FileText size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('contentIdeas')}</span>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {output.contentIdeas.map((idea, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#a3a3a3]">
                  <span className="text-orange-500 mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {output.dataNeeded.length > 0 && (
        <div className="border border-orange-500/30 rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <AlertCircle size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('dataNeeded')}</span>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {output.dataNeeded.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#a3a3a3]">
                  <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {output.dataMetrics.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <BarChart2 size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output')('dataMetrics')}</span>
          </div>
          <div className="p-4 space-y-3">
            {output.dataMetrics.map((m, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                <div className="flex-1">
                  <div>
                    <span className="text-[#e5e5e5] font-medium">{m.metric}</span>
                    <span className="text-[#737373] text-xs ml-2">— {m.reason}</span>
                  </div>
                  {m.nextAction && (
                    <p className="text-xs text-orange-500/80 mt-0.5">→ {m.nextAction}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InputPanel({
  product,
  onChange,
  onAnalyze,
  onDemo,
  loading,
  demoLoading,
}: {
  product: ProductInfo;
  onChange: (p: ProductInfo) => void;
  onAnalyze: () => void;
  onDemo: (demo: ProductInfo) => void;
  loading: boolean;
  demoLoading: string;
}) {
  const { t } = useLang();
  const [fetchUrl, setFetchUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlFetchError, setUrlFetchError] = useState<string | null>(null);

  const handleUrlFetch = async () => {
    if (!fetchUrl) return;
    setUrlLoading(true);
    setUrlFetchError(null);
    try {
      const res = await fetch('/api/fetch-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fetchUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setUrlFetchError(data.error || t('error')('fetchFailed'));
        return;
      }
      onChange({ ...product, ...data });
    } catch (err: any) {
      setUrlFetchError(err.message);
    } finally {
      setUrlLoading(false);
    }
  };

  const field = (
    labelKey: keyof typeof I18N.input.fields,
    key: keyof ProductInfo,
    placeholderKey?: keyof typeof I18N.input.fields,
    type: 'text' | 'textarea' = 'text'
  ) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input')('fields')(labelKey)}</label>
      {type === 'textarea' ? (
        <textarea
          value={product[key] as string}
          onChange={(e) => onChange({ ...product, [key]: e.target.value })}
          placeholder={placeholderKey ? t('input')('fields')(placeholderKey) : ''}
          rows={2}
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#525252] resize-none focus:border-orange-500 transition-colors"
        />
      ) : (
        <input
          type="text"
          value={product[key] as string}
          onChange={(e) => onChange({ ...product, [key]: e.target.value })}
          placeholder={placeholderKey ? t('input')('fields')(placeholderKey) : ''}
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-orange-500 transition-colors"
        />
      )}
    </div>
  );

  const filledCount = [
    product.productName,
    product.brand,
    product.category,
    product.currentTitle,
    product.description,
    product.targetUser,
  ].filter(Boolean).length;

  const progress = Math.round((filledCount / 6) * 100);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Package size={18} className="text-orange-500" />
        <h2 className="text-sm font-semibold text-[#e5e5e5]">{t('input')('panelTitle')}</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-20 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-[#737373]">{progress}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {field('productName', 'productName', 'productNamePh')}
        {field('brand', 'brand', 'brandPh')}
        {field('category', 'category', 'categoryPh')}
        {field('price', 'price', 'pricePh')}
        {field('currentTitle', 'currentTitle', 'currentTitlePh')}
        {field('description', 'description', 'descriptionPh', 'textarea')}
        {field('sellingPoints', 'currentSellingPoints', 'sellingPointsPh', 'textarea')}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input')('fields')('productUrl')}</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={fetchUrl}
              onChange={(e) => setFetchUrl(e.target.value)}
              placeholder={t('input')('fields')('productUrlPh')}
              className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-orange-500 transition-colors"
            />
            <button
              onClick={handleUrlFetch}
              disabled={!fetchUrl || urlLoading}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {urlLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {urlLoading ? t('input')('fetching') : t('input')('fetch')}
            </button>
          </div>
          {urlFetchError && <p className="text-xs text-red-500">{urlFetchError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input')('fields')('targetChannel')}</label>
          <div className="grid grid-cols-3 gap-2">
            {CHANNELS.map((ch) => {
              const labelMap: Record<ProductInfo['channel'], keyof typeof I18N.input.channel> = {
                'Takealot': 'Takealot',
                'Independent Store': 'Independent',
                'Both': 'Both',
              };
              return (
                <button
                  key={ch}
                  onClick={() => onChange({ ...product, channel: ch })}
                  className={`text-xs py-2 rounded-lg border transition-colors ${
                    product.channel === ch
                      ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                      : 'border-[#2a2a2a] text-[#737373] hover:border-[#3a3a3a]'
                  }`}
                >
                  {t('input')('channel')(labelMap[ch])}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input')('fields')('targetUser')}</label>
          <div className="grid grid-cols-2 gap-2">
            {TARGET_USERS.map((tu) => {
              const labelMap: Record<ProductInfo['targetUser'], keyof typeof I18N.input.targetUser> = {
                'Home User': 'HomeUser',
                'Small Business': 'SmallBusiness',
                'Warehouse/Retail': 'Warehouse',
                'All': 'All',
              };
              return (
                <button
                  key={tu}
                  onClick={() => onChange({ ...product, targetUser: tu })}
                  className={`text-xs py-2 rounded-lg border transition-colors ${
                    product.targetUser === tu
                      ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                      : 'border-[#2a2a2a] text-[#737373] hover:border-[#3a3a3a]'
                  }`}
                >
                  {t('input')('targetUser')(labelMap[tu])}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input')('fields')('productType')}</label>
          <div className="grid grid-cols-2 gap-2">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                onClick={() => onChange({ ...product, consumable: val })}
                className={`text-xs py-2 rounded-lg border transition-colors ${
                  product.consumable === val
                    ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                    : 'border-[#2a2a2a] text-[#737373] hover:border-[#3a3a3a]'
                }`}
              >
                {val ? t('input')('fields')('consumable') : t('input')('fields')('hardware')}
              </button>
            ))}
          </div>
        </div>

        {field('relatedProducts', 'relatedProducts', 'relatedProductsPh', 'textarea')}
        {field('reviewSamples', 'reviewSamples', 'reviewSamplesPh', 'textarea')}

        <div className="pt-2 border-t border-[#2a2a2a] space-y-2">
          <p className="text-xs font-medium text-[#737373] uppercase tracking-wide">{t('input')('scenarios')}</p>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_PRODUCTS.map((demo) => (
              <button
                key={demo.name}
                onClick={() => onDemo(demo.product)}
                disabled={demoLoading !== ''}
                className="text-left text-xs py-2 px-3 rounded-lg border border-[#2a2a2a] hover:border-orange-500/50 text-[#a3a3a3] hover:text-orange-500 transition-colors flex items-center gap-2 disabled:opacity-40"
              >
                {demoLoading === demo.name ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RotateCw size={12} />
                )}
                {t('demo')(demo.name as any)}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <button
            onClick={onAnalyze}
            disabled={loading || !product.productName}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {t('input')('analyzing')}
              </>
            ) : (
              <>
                <Zap size={15} />
                {t('input')('runBtn')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useLang();
  const next: Lang = lang === 'zh' ? 'en' : 'zh';
  return (
    <button
      onClick={() => setLang(next)}
      className="text-xs text-[#737373] hover:text-orange-500 transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#2a2a2a] hover:border-orange-500/50"
      title={lang === 'zh' ? '切换到英文' : 'Switch to Chinese'}
    >
      <Languages size={13} />
      <span className="font-medium">{lang === 'zh' ? '中文' : 'EN'}</span>
    </button>
  );
}

export default function App() {
  const { t, tr } = useLang();
  const EMPTY_PRODUCT = (): ProductInfo => ({
    productName: '', brand: '', category: '', price: '',
    currentTitle: '', description: '', currentSellingPoints: '',
    channel: 'Both', targetUser: 'All', consumable: false,
    relatedProducts: '', reviewSamples: '', productUrl: '',
  });

  const [product, setProduct] = useState<ProductInfo>(EMPTY_PRODUCT());
  const [output, setOutput] = useState<AIOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemo = useCallback(async (demoProduct: ProductInfo) => {
    setDemoLoading(demoProduct.productName);
    setProduct(demoProduct);

    await new Promise(r => setTimeout(r, 800));

    const isConsumable = demoProduct.consumable;
    const isLabelPrinter = demoProduct.category.toLowerCase().includes('label printer') || demoProduct.category.toLowerCase().includes('printer');
    const isBaseus = demoProduct.brand.toLowerCase().includes('baseus');
    const isBarcode = demoProduct.category.toLowerCase().includes('barcode') || demoProduct.category.toLowerCase().includes('warehouse');

    let demoOutput: AIOutput;

    if (isBarcode) {
      demoOutput = {
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
      };
    } else if (isConsumable && !isLabelPrinter) {
      demoOutput = {
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
      };
    } else if (isBaseus) {
      demoOutput = {
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
      };
    } else {
      demoOutput = {
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
      };
    }

    setOutput(demoOutput);
    setDemoLoading('');
  }, []);

  const handleAnalyze = async () => {
    if (!product.productName) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || t('error')('analyzeFailed'));
        return;
      }

      setOutput(data as AIOutput);
    } catch (err: any) {
      setError(err.message || t('error')('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">BR</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#e5e5e5]">{tr(I18N.header.title)}</h1>
              <p className="text-xs text-[#737373]">{tr(I18N.header.subtitle)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="text-xs text-[#737373] hover:text-orange-500 transition-colors flex items-center gap-1.5"
            >
              <FileText size={13} />
              {showPrompt ? tr(I18N.header.hidePrompt) : tr(I18N.header.showPrompt)}
            </button>
          </div>
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
              <p className="text-xs text-[#737373] mb-2 font-medium">{tr(I18N.promptPreview.title)}</p>
              <pre className="text-xs text-[#a3a3a3] bg-[#141414] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
{`You are an AI e-commerce operations assistant for Black Rhino South Africa.

Important rules:
- Do NOT make conclusions about sales performance, profit margin, inventory turnover, ad ROI, or real SKU classification unless backend data is provided.
- If the provided product information is insufficient, clearly state what cannot be analyzed.
- Return valid JSON only. No markdown.

[Product fields sent: productName, brand, category, price, currentTitle, description, currentSellingPoints, channel, targetUser, consumable, relatedProducts, reviewSamples, productUrl]

Output JSON includes: dataSufficiencyScore, canAnalyze[], cannotAnalyze[], productPositioning, listingDiagnosis[], optimizedTitle, sellingPoints[], bundleRecommendation[], seoKeywords[], contentIdeas[], dataNeeded[], dataMetrics[]`}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer Banner */}
      <div className="bg-orange-500/5 border-b border-orange-500/20 px-6 py-2">
        <p className="max-w-7xl mx-auto text-xs text-[#a3a3a3] text-center">
          <span className="text-orange-500 font-medium">{tr(I18N.banner.prefix)}</span> {tr(I18N.banner.text)}
        </p>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto h-full px-6 py-5">
          <div className="grid grid-cols-12 gap-5">
            {/* Input Panel */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3">
              <div className="border border-[#1a1a1a] rounded-2xl p-5 bg-[#111111] flex flex-col max-h-[calc(100vh-180px)] overflow-y-auto">
                <InputPanel
                  product={product}
                  onChange={setProduct}
                  onAnalyze={handleAnalyze}
                  onDemo={handleDemo}
                  loading={loading}
                  demoLoading={demoLoading}
                />
              </div>
            </div>

            {/* Output Panel */}
            <div className="col-span-12 lg:col-span-8 xl:col-span-9 overflow-y-auto pr-1">
              {error ? (
                <div className="border border-red-500/30 rounded-xl p-4 bg-[#141414]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-red-500">{tr(I18N.error.title)}</span>
                  </div>
                  <p className="text-sm text-[#a3a3a3]">{error}</p>
                </div>
              ) : output ? (
                <>
                  <div className="mb-3 flex items-center gap-2 text-xs text-[#737373]">
                    <Info size={13} className="text-orange-500" />
                    <span>AI 诊断输出原文（English） · 切换中英文仅影响界面语言，AI 输出内容保持英文不变</span>
                  </div>
                  <OutputSection output={output} />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center border border-dashed border-[#2a2a2a] rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4">
                    <BarChart2 size={24} className="text-[#525252]" />
                  </div>
                  <h3 className="text-sm font-medium text-[#525252] mb-1">{tr(I18N.empty.title)}</h3>
                  <p className="text-xs text-[#3a3a3a] max-w-xs">
                    {tr(I18N.empty.desc)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#525252]">
          <span>{tr(I18N.footer.product)}</span>
          <span>{tr(I18N.footer.powered)}</span>
        </div>
      </footer>
    </div>
  );
}
