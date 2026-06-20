import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileDown, ClipboardList, Play, Sparkles, BarChart2, X, AlertCircle, Package,
  Plus, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useLang } from './i18n';
import {
  DEMO_PRODUCTS, SKU_CSV_TEMPLATE,
  PRODUCT_TYPES, BUSINESS_SCENARIOS,
  type BatchSkuInput, type SkuScanResult, type RuleKey,
  type ProductType, type BusinessScenarioKey,
} from './types';
import {
  parseCsv, scanSkus, triggerTemplateDownload, batchToProduct,
} from './skuScanner';
import type { ProductInfo } from './types';

// Priority 颜色配置（A=橙红，B=橙，C=灰）
const priorityColor = (p: SkuScanResult['priority']) => {
  switch (p) {
    case 'A': return 'bg-orange-500/15 text-orange-500 border-orange-500/40';
    case 'B': return 'bg-amber-500/10 text-amber-500 border-amber-500/40';
    case 'C': return 'bg-[#2a2a2a] text-[#a3a3a3] border-[#3a3a3a]';
  }
};

interface Props {
  /** 把 "Run full diagnosis" 选中的 SKU 推给上层表单 */
  onSelectForDiagnosis: (p: ProductInfo) => void;
}

/** 结构化表单的初始空记录 */
const EMPTY_FORM: BatchSkuInput = {
  productName: '',
  brand: '',
  category: '',
  productType: 'Hardware',
  businessScenario: undefined,
  price: '',
  description: '',
  currentSellingPoints: '',
  relatedProducts: '',
  reviewSamples: '',
};

export default function SkuScanner({ onSelectForDiagnosis }: Props) {
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 手动添加：当前正在编辑的表单
  const [form, setForm] = useState<BatchSkuInput>(EMPTY_FORM);
  // 已加入扫描器的 SKU 缓冲
  const [pendingSkus, setPendingSkus] = useState<BatchSkuInput[]>([]);
  // 选填区折叠
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Priority Board 规则说明折叠
  const [showPriorityLogic, setShowPriorityLogic] = useState(false);

  // 扫描结果
  const [results, setResults] = useState<SkuScanResult[]>([]);
  // 错误
  const [error, setError] = useState<string | null>(null);
  // 上次扫描的来源
  const [source, setSource] = useState<string>('');

  // ---------- 统一扫描入口 ----------
  const runScan = (skus: BatchSkuInput[], src: string) => {
    if (!skus.length) {
      setError(t('scanner', 'board', 'empty'));
      setResults([]);
      return;
    }
    const scanned = scanSkus(skus, {});
    setResults(scanned);
    setError(null);
    setSource(src);
  };

  const handleUpload = async (file: File) => {
    setError(null);
    const text = await file.text();
    const res = parseCsv(text);
    if (!res.ok) {
      setError(t('scanner', 'uploadCard', 'parseError'));
      return;
    }
    runScan(res.skus, file.name);
  };

  // ---------- 手动添加：Add & Scan ----------
  const handleAddAndScan = () => {
    if (!form.productName.trim() || !form.brand.trim() || !form.category.trim() || !form.productType) {
      setError(t('scanner', 'manualCard', 'requiredMissing'));
      return;
    }
    const next = [...pendingSkus, form];
    setPendingSkus(next);
    setError(null);
    runScan(next, 'manual');
    setForm(EMPTY_FORM);
    setShowAdvanced(false);
  };

  const handleClearManual = () => {
    setForm(EMPTY_FORM);
    setPendingSkus([]);
    setResults([]);
    setError(null);
    setSource('');
    setShowAdvanced(false);
  };

  // ---------- 加载 Demo：直接当作 1 条 SKU 跑规则 ----------
  const handleLoadDemo = (demoKey: string) => {
    const demo = DEMO_PRODUCTS.find(d => d.name === demoKey);
    if (!demo) return;
    const sku: BatchSkuInput = {
      productName: demo.product.productName,
      brand: demo.product.brand,
      category: demo.product.category,
      productType: demo.product.consumable ? 'Consumable' : 'Hardware',
      price: demo.product.price,
      description: demo.product.description,
      currentSellingPoints: demo.product.currentSellingPoints,
      relatedProducts: demo.product.relatedProducts,
      reviewSamples: demo.product.reviewSamples,
    };
    const next = [...pendingSkus, sku];
    setPendingSkus(next);
    runScan(next, demo.name);
  };

  // ---------- Run full diagnosis：把该 SKU 推给上层单 SKU 表单 ----------
  const handleRunDiagnosis = (r: SkuScanResult) => {
    onSelectForDiagnosis(batchToProduct(r.sku));
    setTimeout(() => {
      document.getElementById('single-sku-diagnosis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // ---------- 表单字段渲染 ----------
  const FormField = ({
    fieldKey, k, ph, required = false, span = 1,
  }: { fieldKey: keyof BatchSkuInput; k: string; ph?: string; required?: boolean; span?: 1 | 2 }) => (
    <div className={`space-y-1 ${span === 2 ? 'sm:col-span-2' : ''}`}>
      <label className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-wide">
        {t('scanner', 'manualCard', 'fields', k as any)}{required ? '' : ''}
      </label>
      <input
        type="text"
        value={(form[fieldKey] as string) || ''}
        onChange={(e) => setForm({ ...form, [fieldKey]: e.target.value })}
        placeholder={ph}
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-2.5 py-1.5 text-xs text-[#e5e5e5] placeholder-[#525252] focus:border-orange-500 transition-colors"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ============== 3 个并列入口卡片 ============== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 卡片 1：Load Business Demo */}
        <div className="border border-[#1f1f1f] rounded-xl p-4 bg-[#141414] hover:border-orange-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-orange-500" />
            <div className="text-sm font-medium text-[#e5e5e5]">
              {t('scanner', 'entry', 'demo', 'title')}
            </div>
          </div>
          <p className="text-xs text-[#737373] leading-relaxed mb-3 min-h-[2.5em]">
            {t('scanner', 'entry', 'demo', 'desc')}
          </p>
          <div className="space-y-1.5">
            {DEMO_PRODUCTS.map((demo) => (
              <button
                key={demo.name}
                onClick={() => handleLoadDemo(demo.name)}
                className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-md border border-[#2a2a2a] hover:border-orange-500/50 hover:bg-orange-500/5 text-[#a3a3a3] hover:text-orange-500 flex items-center gap-1.5 transition-colors"
              >
                <Package size={11} className="flex-shrink-0" />
                <span className="truncate">{demo.product.productName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 卡片 2：Upload SKU File */}
        <div className="border border-[#1f1f1f] rounded-xl p-4 bg-[#141414] hover:border-orange-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Upload size={14} className="text-orange-500" />
            <div className="text-sm font-medium text-[#e5e5e5]">
              {t('scanner', 'entry', 'upload', 'title')}
            </div>
          </div>
          <p className="text-xs text-[#737373] leading-relaxed mb-3 min-h-[2.5em]">
            {t('scanner', 'entry', 'upload', 'desc')}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => triggerTemplateDownload(() => SKU_CSV_TEMPLATE)}
              className="text-xs px-3 py-2 rounded-lg border border-[#2a2a2a] hover:border-orange-500/50 text-[#a3a3a3] hover:text-orange-500 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileDown size={13} />
              {t('scanner', 'uploadCard', 'downloadTemplate')}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-2 rounded-lg border border-orange-500/50 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload size={13} />
              {t('scanner', 'uploadCard', 'uploadCsv')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {/* 卡片 3：Paste SKU Manually */}
        <div className="border border-[#1f1f1f] rounded-xl p-4 bg-[#141414] hover:border-orange-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={14} className="text-orange-500" />
            <div className="text-sm font-medium text-[#e5e5e5]">
              {t('scanner', 'entry', 'manual', 'title')}
            </div>
          </div>
          <p className="text-xs text-[#737373] leading-relaxed mb-3 min-h-[2.5em]">
            {t('scanner', 'entry', 'manual', 'desc')}
          </p>
          {/* 默认只显示 4 个必填字段 */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <FormField fieldKey="productName" k="productName" required />
            <FormField fieldKey="brand" k="brand" required />
            <FormField fieldKey="category" k="category" required />
            {/* Product Type：下拉选择（7 选 1） */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-wide">
                {t('scanner', 'manualCard', 'fields', 'productType')}
              </label>
              <select
                value={form.productType}
                onChange={(e) => setForm({ ...form, productType: e.target.value as ProductType })}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-2 py-1.5 text-xs text-[#e5e5e5] focus:border-orange-500 transition-colors"
              >
                {PRODUCT_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {t('scanner', 'manualCard', 'productTypes', v)}
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-[#525252] leading-tight">
                {t('scanner', 'manualCard', 'fields', 'productTypeHint')}
              </p>
            </div>
          </div>

          {/* Advanced fields 折叠 */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-[#737373] hover:text-orange-500 flex items-center gap-1 mb-2 select-none"
          >
            {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {t('scanner', 'manualCard', 'optionalSummary')}
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Business Scenario：选填下拉，默认空 · 自动判断 */}
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-wide">
                  {t('scanner', 'manualCard', 'fields', 'businessScenario')}
                </label>
                <select
                  value={form.businessScenario ?? ''}
                  onChange={(e) => setForm({
                    ...form,
                    businessScenario: (e.target.value || undefined) as BusinessScenarioKey | undefined,
                  })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-2 py-1.5 text-xs text-[#e5e5e5] focus:border-orange-500 transition-colors"
                >
                  <option value="">
                    {t('scanner', 'manualCard', 'fields', 'businessScenarioPlaceholder')}
                  </option>
                  {BUSINESS_SCENARIOS.map((v) => (
                    <option key={v} value={v}>
                      {t('scanner', 'manualCard', 'businessScenarios', v)}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-[#525252] leading-tight">
                  {t('scanner', 'manualCard', 'fields', 'businessScenarioHint')}
                </p>
              </div>
              <FormField fieldKey="price" k="price" />
              <FormField fieldKey="description" k="description" />
              <FormField fieldKey="currentSellingPoints" k="currentSellingPoints" />
              <FormField fieldKey="relatedProducts" k="relatedProducts" />
              <div className="col-span-2">
                <FormField fieldKey="reviewSamples" k="reviewSamples" span={2} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddAndScan}
              className="text-xs px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 transition-colors"
            >
              <Play size={12} />
              {t('scanner', 'manualCard', 'addBtn')}
            </button>
            <button
              onClick={() => {
                setForm(EMPTY_FORM);
                setError(null);
                setShowAdvanced(false);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-[#a3a3a3] hover:border-orange-500/50 hover:text-orange-500 flex items-center gap-1.5 transition-colors"
            >
              <Plus size={12} />
              {t('scanner', 'manualCard', 'addAnother')}
            </button>
            {pendingSkus.length > 0 && (
              <button
                onClick={handleClearManual}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-[#737373] hover:text-red-400 hover:border-red-400/40 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={12} />
                {t('scanner', 'manualCard', 'clearBtn')}
              </button>
            )}
            {pendingSkus.length > 0 && (
              <span className="text-[10px] text-[#737373]">
                · {pendingSkus.length} {t('scanner', 'board', 'cols', 'sku')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/30 rounded-lg px-3 py-2"
          >
            <AlertCircle size={13} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-[#737373] hover:text-[#e5e5e5]">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============== SKU Priority Board ============== */}
      <div className="border border-[#1f1f1f] rounded-xl bg-[#141414] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
          <BarChart2 size={14} className="text-orange-500" />
          <span className="text-sm font-medium text-[#e5e5e5]">
            {t('scanner', 'board', 'title')}
          </span>
          {results.length > 0 && (
            <span className="ml-auto text-xs text-[#737373]">
              {results.length} {t('scanner', 'board', 'cols', 'sku')}{source ? ` · ${source}` : ''}
            </span>
          )}
        </div>
        <div className="px-4 py-2 border-b border-[#1f1f1f] text-[11px] leading-relaxed text-[#737373] bg-[#111111]">
          {t('scanner', 'board', 'boundaryNote')}
        </div>
        <div className="px-4 py-3 border-b border-[#1f1f1f] bg-[#111111] space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3">
            <span className="text-[11px] font-medium text-[#a3a3a3]">
              {t('scanner', 'board', 'priorityLegend', 'title')}
            </span>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center text-[10px] px-2 py-1 rounded border ${priorityColor('A')}`}>
                {t('scanner', 'board', 'priorityLegend', 'a')}
              </span>
              <span className={`inline-flex items-center text-[10px] px-2 py-1 rounded border ${priorityColor('B')}`}>
                {t('scanner', 'board', 'priorityLegend', 'b')}
              </span>
              <span className={`inline-flex items-center text-[10px] px-2 py-1 rounded border ${priorityColor('C')}`}>
                {t('scanner', 'board', 'priorityLegend', 'c')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPriorityLogic(v => !v)}
              className="lg:ml-auto inline-flex items-center gap-1.5 text-[11px] text-orange-500 hover:text-orange-400 transition-colors self-start lg:self-auto"
            >
              {showPriorityLogic ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {t('scanner', 'board', 'logic', showPriorityLogic ? 'hide' : 'show')}
            </button>
          </div>
          <AnimatePresence initial={false}>
            {showPriorityLogic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-3 gap-3 pt-1">
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                    <div className="text-[11px] font-semibold text-orange-500 mb-1">
                      {t('scanner', 'board', 'logic', 'aTitle')}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#a3a3a3]">
                      {t('scanner', 'board', 'logic', 'aDesc')}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="text-[11px] font-semibold text-amber-500 mb-1">
                      {t('scanner', 'board', 'logic', 'bTitle')}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#a3a3a3]">
                      {t('scanner', 'board', 'logic', 'bDesc')}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#3a3a3a] bg-[#181818] p-3">
                    <div className="text-[11px] font-semibold text-[#d4d4d4] mb-1">
                      {t('scanner', 'board', 'logic', 'cTitle')}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#a3a3a3]">
                      {t('scanner', 'board', 'logic', 'cDesc')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {results.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-[#525252]">
            {t('scanner', 'board', 'empty')}
          </div>
        ) : (
          <>
            {/* 桌面端：表格 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#737373] border-b border-[#2a2a2a]">
                    <th className="text-left px-3 py-2 font-medium w-12">{t('scanner', 'board', 'cols', 'priority')}</th>
                    <th className="text-left px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'sku')}</th>
                    <th className="text-left px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'role')}</th>
                    <th className="text-left px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'opportunity')}</th>
                    <th className="text-left px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'risk')}</th>
                    <th className="text-left px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'next')}</th>
                    <th className="text-right px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={`${r.sku.productName}-${i}`}
                      className="border-b border-[#1f1f1f] last:border-0 hover:bg-[#181818] transition-colors"
                    >
                      <td className="px-3 py-2.5 text-center align-top">
                        <span className={`inline-block text-[12px] font-bold px-2.5 py-1 rounded border min-w-[28px] ${priorityColor(r.priority)}`}>
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[#e5e5e5] font-medium align-top">
                        {r.sku.productName}
                        <div className="text-[10px] text-[#525252] mt-0.5">
                          {r.sku.brand} · {r.sku.category} · {r.sku.productType}
                        </div>
                        <div className="text-[10px] text-[#525252] mt-0.5 italic">
                          {t('scanner', 'rule', r.rule as RuleKey)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#a3a3a3] align-top">
                        {t('scanner', 'role', r.role as any)}
                      </td>
                      <td className="px-3 py-2.5 text-[#a3a3a3] align-top">
                        {t('scanner', 'opportunities', r.opportunity as any)}
                      </td>
                      <td className="px-3 py-2.5 text-[#a3a3a3] align-top">
                        {t('scanner', 'issues', r.risk as any)}
                      </td>
                      <td className="px-3 py-2.5 text-[#a3a3a3] align-top">
                        {t('scanner', 'actions', r.nextAction as any)}
                      </td>
                      <td className="px-3 py-2.5 text-right align-top">
                        <button
                          onClick={() => handleRunDiagnosis(r)}
                          className="text-[11px] px-2.5 py-1 rounded border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors whitespace-nowrap"
                        >
                          {t('scanner', 'board', 'runDiagnosis')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 移动端：卡片 */}
            <div className="md:hidden p-3 space-y-3">
              {results.map((r, i) => (
                <div
                  key={`m-${r.sku.productName}-${i}`}
                  className="border border-[#2a2a2a] rounded-lg p-3 bg-[#181818] space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span className={`inline-block text-[12px] font-bold px-2.5 py-1 rounded border flex-shrink-0 ${priorityColor(r.priority)}`}>
                      {r.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#e5e5e5]">
                        {r.sku.productName}
                      </div>
                      <div className="text-[10px] text-[#525252] mt-0.5">
                        {r.sku.brand} · {r.sku.category} · {r.sku.productType}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 pl-1">
                    <div>
                      <span className="text-[#737373]">{t('scanner', 'board', 'cols', 'role')}: </span>
                      <span className="text-[#a3a3a3]">{t('scanner', 'role', r.role as any)}</span>
                    </div>
                    <div>
                      <span className="text-[#737373]">{t('scanner', 'board', 'cols', 'opportunity')}: </span>
                      <span className="text-[#a3a3a3]">{t('scanner', 'opportunities', r.opportunity as any)}</span>
                    </div>
                    <div>
                      <span className="text-[#737373]">{t('scanner', 'board', 'cols', 'risk')}: </span>
                      <span className="text-[#a3a3a3]">{t('scanner', 'issues', r.risk as any)}</span>
                    </div>
                    <div>
                      <span className="text-[#737373]">{t('scanner', 'board', 'cols', 'next')}: </span>
                      <span className="text-[#a3a3a3]">{t('scanner', 'actions', r.nextAction as any)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRunDiagnosis(r)}
                    className="w-full text-[11px] px-2.5 py-1.5 rounded border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors"
                  >
                    {t('scanner', 'board', 'runDiagnosis')}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
