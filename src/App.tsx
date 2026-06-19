import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Package, Search, BarChart2, ShoppingCart, FileText,
  Loader2, Copy, CheckCheck, Languages,
  AlertCircle, CheckCircle2, Info, Briefcase
} from 'lucide-react';
import type { ProductInfo, AIOutput, ProductType, BusinessScenarioKey } from './types';
import { PRODUCT_TYPES, BUSINESS_SCENARIOS } from './types';
import { useLang, I18N, type Lang } from './i18n';
import SkuScanner from './SkuScanner';

const CHANNELS: Array<ProductInfo['channel']> = ['Takealot', 'Independent Store', 'Both'];
const TARGET_USERS: Array<ProductInfo['targetUser']> = ['Home User', 'Small Business', 'Warehouse/Retail', 'All'];

const getConsumableFromProductType = (productType: ProductType) => productType === 'Consumable';

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
      {copied ? t('output', 'copied') : t('output', 'copy')}
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
        <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'dataSufficiency')}</span>
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
            <div className="text-xs text-[#737373] mb-2">{t('output', 'dataSufficiencyNote')}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-[#a3a3a3]">{t('output', 'canBeAnalyzed')}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-[#a3a3a3]">{t('output', 'cannotBeAnalyzed')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-green-500 mb-1.5">{t('output', 'canAnalyze')}</p>
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
            <p className="text-xs font-medium text-red-500 mb-1.5">{t('output', 'cannotAnalyze')}</p>
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

function BusinessValueCard() {
  const { tr } = useLang();
  const items = [
    { key: 'reduce' as const, icon: '⚙️' },
    { key: 'standardize' as const, icon: '📋' },
    { key: 'bundle' as const, icon: '🧩' },
    { key: 'metric' as const, icon: '📊' },
    { key: 'upgrade' as const, icon: '🚀' },
  ];
  return (
    <div className="border border-orange-500/30 rounded-xl p-4 bg-gradient-to-br from-orange-500/5 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase size={15} className="text-orange-500" />
        <span className="text-sm font-semibold text-[#e5e5e5]">{tr(I18N.businessValue.title)}</span>
      </div>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li key={it.key} className="flex items-start gap-2.5 text-sm text-[#a3a3a3] leading-relaxed">
            <span className="text-orange-500 mt-0.5 flex-shrink-0 font-medium min-w-[1.25rem]">{i + 1}.</span>
            <span>{tr(I18N.businessValue.items[it.key])}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function OutputSection({ output }: { output: AIOutput }) {
  const { t, tr } = useLang();
  // 信息不足报告：只渲染提示卡片，不渲染后续模块
  if (output.status === 'insufficient') {
    return (
      <div className="space-y-3">
        <div className="border border-amber-500/40 rounded-xl p-5 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-500">{tr(I18N.error.infoInsufficient)}</span>
          </div>
          <p className="text-sm text-[#a3a3a3] mb-3 leading-relaxed">{tr(I18N.input.minFieldsHint)}</p>
          <div className="text-xs font-medium text-[#737373] uppercase tracking-wide mb-2">{tr(I18N.input.missingFieldsTitle)}</div>
          <ul className="space-y-1.5">
            {output.cannotAnalyze.map((field, i) => {
              const labelMap: Record<string, { zh: string; en: string }> = {
                brand: { zh: '品牌', en: 'Brand' },
                category: { zh: '类目', en: 'Category' },
                price: { zh: '价格', en: 'Price' },
                description: { zh: '商品描述', en: 'Description' },
                currentSellingPoints: { zh: '当前卖点', en: 'Current Selling Points' },
                reviewSamples: { zh: '评价样例', en: 'Review Samples' },
              };
              const label = labelMap[field];
              return (
                <li key={i} className="flex items-center gap-2 text-sm text-amber-500/90">
                  <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                  {label ? tr(label) : field}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 pt-4 border-t border-amber-500/20">
            <div className="text-xs font-medium text-[#737373] uppercase tracking-wide mb-2">
              {tr(I18N.output.dataNeeded)}
            </div>
            <ul className="space-y-1">
              {output.dataNeeded.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#a3a3a3]">
                  <span className="text-amber-500/70 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
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
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'productPositioning')}</span>
          </div>
          <p className="text-sm text-[#a3a3a3] leading-relaxed">{output.productPositioning}</p>
        </div>
      )}

      {output.skuStrategy && (
        <div className="border border-orange-500/30 rounded-xl p-4 bg-[#141414]">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'skuStrategy')}</span>
          </div>
          <p className="text-sm text-[#a3a3a3] leading-relaxed whitespace-pre-wrap">{output.skuStrategy}</p>
        </div>
      )}

      {output.listingDiagnosis.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <FileText size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'listingDiagnosis')}</span>
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


      {output.bundleRecommendation.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <ShoppingCart size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'bundle')}</span>
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

      {output.dataMetrics.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <BarChart2 size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'dataMetrics')}</span>
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

      {output.dataNeeded.length > 0 && (
        <div className="border border-orange-500/30 rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <AlertCircle size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'dataNeeded')}</span>
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

      {output.optimizedTitle && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <Zap size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'optimizedTitle')}</span>
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
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'sellingPoints')}</span>
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

      {output.seoKeywords.length > 0 && (
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden bg-[#141414]">
          <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
            <Search size={14} className="text-orange-500" />
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'seoKeywords')}</span>
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
            <span className="text-sm font-medium text-[#e5e5e5]">{t('output', 'contentIdeas')}</span>
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
    </div>
  );
}

function InputPanel({
  product,
  onChange,
  onAnalyze,
  loading,
  lang,
}: {
  product: ProductInfo;
  onChange: (p: ProductInfo) => void;
  onAnalyze: () => void;
  lang: Lang;
  loading: boolean;
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
        setUrlFetchError(data.error || t('error', 'fetchFailed'));
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
      <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input', 'fields', labelKey)}</label>
      {type === 'textarea' ? (
        <textarea
          value={product[key] as string}
          onChange={(e) => onChange({ ...product, [key]: e.target.value })}
          placeholder={placeholderKey ? t('input', 'fields', placeholderKey) : ''}
          rows={2}
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#525252] resize-none focus:border-orange-500 transition-colors"
        />
      ) : (
        <input
          type="text"
          value={product[key] as string}
          onChange={(e) => onChange({ ...product, [key]: e.target.value })}
          placeholder={placeholderKey ? t('input', 'fields', placeholderKey) : ''}
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-orange-500 transition-colors"
        />
      )}
    </div>
  );

  const filledCount = [
    product.productName,
    product.brand,
    product.category,
    product.description,
    product.targetUser,
  ].filter(Boolean).length;

  const progress = Math.round((filledCount / 5) * 100);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Package size={18} className="text-orange-500" />
        <h2 className="text-sm font-semibold text-[#e5e5e5]">{t('input', 'panelTitle')}</h2>
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
        {field('description', 'description', 'descriptionPh', 'textarea')}
        {field('sellingPoints', 'currentSellingPoints', 'sellingPointsPh', 'textarea')}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide flex items-center gap-1.5">
            <span>{t('input', 'fields', 'productUrl')}</span>
            <span className="text-[10px] text-amber-500/80 normal-case tracking-normal">· Experimental</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={fetchUrl}
              onChange={(e) => setFetchUrl(e.target.value)}
              placeholder={t('input', 'fields', 'productUrlPh')}
              className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-orange-500 transition-colors"
            />
            <button
              onClick={handleUrlFetch}
              disabled={!fetchUrl || urlLoading}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-sm font-medium flex items-center gap-2 transition-colors"
            >
              {urlLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {urlLoading ? t('input', 'fetching') : t('input', 'fetch')}
            </button>
          </div>
          <p className="text-[10px] text-[#525252] leading-relaxed">
            {lang === 'zh'
              ? '抓取结果仅供参考，请人工核对后再诊断。'
              : 'Crawled results are for reference only — please verify before diagnosis.'}
          </p>
          {urlFetchError && <p className="text-xs text-red-500">{urlFetchError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input', 'fields', 'targetChannel')}</label>
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
                  {t('input', 'channel', labelMap[ch])}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input', 'fields', 'targetUser')}</label>
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
                  {t('input', 'targetUser', labelMap[tu])}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input', 'fields', 'productType')}</label>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCT_TYPES.map((pt) => (
              <button
                key={pt}
                onClick={() => onChange({
                  ...product,
                  productType: pt,
                  consumable: getConsumableFromProductType(pt),
                })}
                className={`text-xs py-2 rounded-lg border transition-colors ${
                  product.productType === pt
                    ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                    : 'border-[#2a2a2a] text-[#737373] hover:border-[#3a3a3a]'
                }`}
              >
                {t('scanner', 'manualCard', 'productTypes', pt)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wide">{t('input', 'fields', 'businessScenario')}</label>
          <select
            value={product.businessScenario || ''}
            onChange={(e) => onChange({
              ...product,
              businessScenario: (e.target.value || undefined) as BusinessScenarioKey | undefined,
            })}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-orange-500 transition-colors"
          >
            <option value="">{t('scanner', 'manualCard', 'businessScenarioPlaceholder')}</option>
            {BUSINESS_SCENARIOS.map((scenario) => (
              <option key={scenario} value={scenario}>
                {t('scanner', 'manualCard', 'businessScenarios', scenario)}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-[#525252] leading-relaxed">
            {t('scanner', 'manualCard', 'businessScenarioHint')}
          </p>
        </div>

        {field('relatedProducts', 'relatedProducts', 'relatedProductsPh', 'textarea')}
        {field('reviewSamples', 'reviewSamples', 'reviewSamplesPh', 'textarea')}

        <div className="pt-2 space-y-2">
          <button
            onClick={onAnalyze}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {t('input', 'analyzing')}
              </>
            ) : (
              <>
                <Zap size={15} />
                {t('input', 'runBtn')}
              </>
            )}
          </button>
          <p className="text-[10px] text-[#525252] text-center leading-relaxed px-2">
            {t('input', 'minFieldsHint')}
          </p>
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
  const { t, tr, lang } = useLang();
  const EMPTY_PRODUCT = (): ProductInfo => ({
    productName: '', brand: '', category: '', price: '',
    description: '', currentSellingPoints: '',
    channel: 'Both', targetUser: 'All', productType: 'Hardware', businessScenario: undefined, consumable: false,
    relatedProducts: '', reviewSamples: '', productUrl: '',
  });

  const [product, setProduct] = useState<ProductInfo>(EMPTY_PRODUCT());
  const [output, setOutput] = useState<AIOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!product.productName) return;
    setLoading(true);
    setError(null);

    // 检查必填字段。产品名称是必要项；为获得完整诊断，建议补全品牌、类目、描述、当前卖点。
    // 实际可填项 6 个（不含 productName）：brand / category / price / description / currentSellingPoints / reviewSamples
    // 低于 3 个填项，输出信息不足报告
    const fillableFields: Array<keyof ProductInfo> = [
      'brand', 'category', 'price',
      'description', 'currentSellingPoints', 'reviewSamples',
    ];
    const filledFields = fillableFields.filter(f => (product[f] as string)?.trim().length);
    const missingFields = fillableFields.filter(f => !(product[f] as string)?.trim().length);

    if (filledFields.length < 3) {
      // 前端生成“信息不足报告” 不调后端 AI 避免误差
      const insufficient: AIOutput = {
        status: 'insufficient',
        dataSufficiencyScore: Math.max(15, filledFields.length * 12),
        canAnalyze: [],
        cannotAnalyze: missingFields,
        productPositioning: '',
        skuStrategy: '',
        listingDiagnosis: [],
        optimizedTitle: '',
        sellingPoints: [],
        bundleRecommendation: [],
        seoKeywords: [],
        contentIdeas: [],
        dataNeeded: [
          'Monthly sales velocity per SKU',
          'Gross margin per product line',
          'Inventory turnover days',
          'Customer repurchase rate',
          'Category sales rank vs competitors',
        ],
        dataMetrics: [],
      };
      setOutput(insufficient);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, lang }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || t('error', 'analyzeFailed'));
        return;
      }

      setOutput(data as AIOutput);
    } catch (err: any) {
      setError(err.message || t('error', 'networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
      {/* Hero Header */}
      <header className="border-b border-[#1a1a1a] bg-gradient-to-b from-[#141414] to-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6 pt-5 pb-4">
          {/* Top bar: logo + lang switcher + prompt toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">BR</span>
              </div>
              <h1 className="text-base font-semibold text-[#e5e5e5] leading-tight">
                {tr(I18N.page.title)}
              </h1>
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

          {/* Hero pitch */}
          <p className="text-sm text-[#a3a3a3] leading-relaxed max-w-3xl mb-3">
            {tr(I18N.page.hero.pitch)}
          </p>

          {/* 3 能力标签 */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              {tr(I18N.page.hero.chips.csv)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {tr(I18N.page.hero.chips.ruleScan)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#1f1f1f] border border-[#2a2a2a] text-[#e5e5e5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a3a3a3]" />
              {tr(I18N.page.hero.chips.aiDiagnosis)}
            </span>
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

Context:
- The user first scans SKUs in the SKU Priority Board.
- When the user clicks Run Full Diagnosis on one SKU, provide a deeper AI-powered diagnosis for that selected SKU.
- Treat Product Type and Business Scenario as business context, not as final truth if supporting data is missing.

Important rules:
- Do NOT make conclusions about sales performance, profit margin, inventory turnover, ad ROI, or real SKU classification unless backend data is provided.
- Do NOT invent sales, margin, inventory, CRM, or advertising data.
- If the provided product information is insufficient, clearly state what cannot be analyzed.
- Focus on listing improvement, positioning, bundle opportunities, SEO/content ideas, and what data should be collected next.
- Return valid JSON only. No markdown.

[Product fields sent:
productName, brand, category, price, description, currentSellingPoints,
channel, targetUser, consumable, relatedProducts, reviewSamples, productUrl,
productType, businessScenario]

Output JSON includes:
dataSufficiencyScore,
canAnalyze[],
cannotAnalyze[],
productPositioning,
listingDiagnosis[],
optimizedTitle,
sellingPoints[],
bundleRecommendation[],
seoKeywords[],
contentIdeas[],
dataNeeded[],
dataMetrics[],
skuStrategy`}
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
        <div className="max-w-7xl mx-auto h-full px-6 py-5 space-y-5">
          {/* 上部：SKU Priority Scanner（含上传 / 粘贴 / 场景 Demo / Board） */}
          <SkuScanner
            onSelectForDiagnosis={(p) => {
              setProduct(p);
              setOutput(null);
              setError(null);
            }}
          />

          {/* 下部：Selected SKU Diagnosis（原单 SKU 诊断框架） */}
          <div id="single-sku-diagnosis" className="border-t border-[#1a1a1a] pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-orange-500" />
              <h2 className="text-sm font-semibold text-[#e5e5e5]">
                {t('scanner', 'diagnosis', 'title')}
              </h2>
              <span className="text-xs text-[#737373]">
                {t('scanner', 'diagnosis', 'hint')}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-5">
              {/* Input Panel */}
              <div className="col-span-12 lg:col-span-4 xl:col-span-3">
                <div className="border border-[#1a1a1a] rounded-2xl p-5 bg-[#111111] flex flex-col max-h-[calc(100vh-180px)] overflow-y-auto">
                  <InputPanel
                    product={product}
                    onChange={setProduct}
                    onAnalyze={handleAnalyze}
                    loading={loading}
                    lang={lang}
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
                      <span>
                        {lang === 'zh'
                          ? 'AI 诊断输出 · 跟随界面语言输出内容（演示数据为英文，真实 AI 调用跟随当前语言）'
                          : 'AI Diagnostic Output · Content follows the current UI language (demo data shown in English; real AI calls follow the active language).'}
                      </span>
                    </div>
                    <OutputSection output={output} />
                  </>
                ) : (
                  <div className="space-y-3">
                    <BusinessValueCard />
                    <div className="border border-dashed border-[#2a2a2a] rounded-2xl p-8 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4 mx-auto">
                        <BarChart2 size={24} className="text-[#525252]" />
                      </div>
                      <h3 className="text-sm font-medium text-[#525252] mb-1">{tr(I18N.empty.title)}</h3>
                      <p className="text-xs text-[#3a3a3a] max-w-xs mx-auto">
                        {tr(I18N.empty.desc)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
