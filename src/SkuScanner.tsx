import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileDown, ClipboardList, Play, Sparkles, BarChart2, X, AlertCircle, Package,
  Plus, Trash2,
} from 'lucide-react';
import { useLang } from './i18n';
import {
  DEMO_PRODUCTS, SKU_CSV_TEMPLATE,
  type BatchSkuInput, type SkuScanResult, type RuleKey,
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
  type: 'Hardware',
  price: '',
  description: '',
  currentSellingPoints: '',
  relatedProducts: '',
  reviewSamples: '',
};

export default function SkuScanner({ onSelectForDiagnosis }: Props) {
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 手动添加：当前正在编辑的表单（单一表单 + "再添加一条"按钮）
  const [form, setForm] = useState<BatchSkuInput>(EMPTY_FORM);
  // 已加入扫描器的 SKU 缓冲（点击 Add & Scan 时 push 进来，再次点击清空表单）
  const [pendingSkus, setPendingSkus] = useState<BatchSkuInput[]>([]);

  // 扫描结果（已运行的）
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
    // 必填校验
    if (!form.productName.trim() || !form.brand.trim() || !form.category.trim() || !form.type.trim()) {
      setError(t('scanner', 'manualCard', 'requiredMissing'));
      return;
    }
    const next = [...pendingSkus, form];
    setPendingSkus(next);
    setError(null);
    // 立即跑扫描：把刚加入的 + 之前所有 pending 一起
    runScan(next, 'manual');
    // 清空表单
    setForm(EMPTY_FORM);
  };

  const handleClearManual = () => {
    setForm(EMPTY_FORM);
    setPendingSkus([]);
    setResults([]);
    setError(null);
    setSource('');
  };

  // ---------- 加载 Demo：直接当作 1 条 SKU 跑规则 ----------
  const handleLoadDemo = (demoKey: string) => {
    const demo = DEMO_PRODUCTS.find(d => d.name === demoKey);
    if (!demo) return;
    const sku: BatchSkuInput = {
      productName: demo.product.productName,
      brand: demo.product.brand,
      category: demo.product.category,
      type: demo.product.consumable ? 'Consumable' : 'Hardware',
      price: demo.product.price,
      description: demo.product.description,
      currentSellingPoints: demo.product.currentSellingPoints,
      relatedProducts: demo.product.relatedProducts,
      reviewSamples: demo.product.reviewSamples,
    };
    // 同时把这个 demo 写入 pending 并跑扫描
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
    fieldKey, k, ph, required = false,
  }: { fieldKey: keyof BatchSkuInput; k: string; ph?: string; required?: boolean }) => (
    <div className="space-y-1">
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
      {/* ============== 顶部：左侧 Scanner + 右侧 Demo Examples ============== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：SKU Priority Scanner（包含上传 + 手动添加） */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-orange-500" />
            <h2 className="text-sm font-semibold text-[#e5e5e5]">
              {t('scanner', 'sectionTitle')}
            </h2>
          </div>

          {/* Upload CSV 卡片 */}
          <div className="border border-[#1f1f1f] rounded-xl p-4 bg-[#141414]">
            <div className="flex items-start gap-2 mb-3">
              <Upload size={14} className="text-orange-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#e5e5e5]">
                  {t('scanner', 'uploadCard', 'title')}
                </div>
                <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                  {t('scanner', 'uploadCard', 'hint')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => triggerTemplateDownload(() => SKU_CSV_TEMPLATE)}
                className="text-xs px-3 py-2 rounded-lg border border-[#2a2a2a] hover:border-orange-500/50 text-[#a3a3a3] hover:text-orange-500 flex items-center gap-1.5 transition-colors"
              >
                <FileDown size={13} />
                {t('scanner', 'uploadCard', 'downloadTemplate')}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-3 py-2 rounded-lg border border-orange-500/50 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 flex items-center gap-1.5 transition-colors"
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

          {/* 手动添加 卡片（结构化表单） */}
          <div className="border border-[#1f1f1f] rounded-xl p-4 bg-[#141414]">
            <div className="flex items-start gap-2 mb-3">
              <ClipboardList size={14} className="text-orange-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#e5e5e5]">
                  {t('scanner', 'manualCard', 'title')}
                </div>
                <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                  {t('scanner', 'manualCard', 'hint')}
                </p>
              </div>
            </div>

            {/* 必填区：4 个字段 2x2 网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
              <FormField fieldKey="productName" k="productName" required />
              <FormField fieldKey="brand" k="brand" required />
              <FormField fieldKey="category" k="category" required />
              {/* Type：固定两个二选一按钮，避免自由输入导致规则匹配不到 */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[#a3a3a3] uppercase tracking-wide">
                  {t('scanner', 'manualCard', 'fields', 'type')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Hardware', 'Consumable'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setForm({ ...form, type: v })}
                      className={`text-xs py-1.5 rounded-md border transition-colors ${
                        form.type === v
                          ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                          : 'border-[#2a2a2a] text-[#737373] hover:border-[#3a3a3a]'
                      }`}
                    >
                      {t('scanner', 'manualCard', 'fields', v === 'Hardware' ? 'typeHardware' : 'typeConsumable')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 选填区：5 个字段，单列布局避免拥挤 */}
            <details className="group">
              <summary className="text-[11px] text-[#737373] hover:text-[#a3a3a3] cursor-pointer list-none flex items-center gap-1 select-none">
                <Plus size={11} className="group-open:rotate-45 transition-transform" />
                {t('scanner', 'manualCard', 'fields', 'price').includes('optional')
                  ? t('scanner', 'manualCard', 'fields', 'price').replace(' (选填)', '').replace(' (optional)', '')
                  : 'Optional fields'}
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                <FormField fieldKey="price" k="price" />
                <FormField fieldKey="description" k="description" />
                <FormField fieldKey="currentSellingPoints" k="currentSellingPoints" />
                <FormField fieldKey="relatedProducts" k="relatedProducts" />
                <div className="sm:col-span-2">
                  <FormField fieldKey="reviewSamples" k="reviewSamples" />
                </div>
              </div>
            </details>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddAndScan}
                className="text-xs px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 transition-colors"
              >
                <Play size={12} />
                {t('scanner', 'manualCard', 'addBtn')}
              </button>
              {pendingSkus.length > 0 && (
                <button
                  onClick={handleClearManual}
                  className="text-xs px-3 py-2 rounded-lg border border-[#2a2a2a] text-[#737373] hover:text-red-400 hover:border-red-400/40 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={12} />
                  {t('scanner', 'manualCard', 'addAnother')}
                </button>
              )}
              {pendingSkus.length > 0 && (
                <span className="text-[10px] text-[#737373]">
                  · {pendingSkus.length} pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：Business Scenario Examples */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-orange-500" />
            <h2 className="text-sm font-semibold text-[#e5e5e5]">
              {t('scanner', 'demoCard', 'title')}
            </h2>
          </div>
          <p className="text-xs text-[#737373] -mt-1">
            {t('scanner', 'demoCard', 'hint')}
          </p>
          <div className="space-y-2">
            {DEMO_PRODUCTS.map((demo) => (
              <div
                key={demo.name}
                className="border border-[#1f1f1f] rounded-xl p-3 bg-[#141414] hover:border-orange-500/40 transition-colors"
              >
                <div className="flex items-start gap-2 mb-2">
                  <Package size={13} className="text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#e5e5e5] truncate">
                      {demo.product.productName}
                    </div>
                    <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                      {t('demo', demo.name as any)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleLoadDemo(demo.name)}
                  className="w-full text-xs py-1.5 rounded-lg border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors"
                >
                  {t('scanner', 'demoCard', 'loadBtn')}
                </button>
              </div>
            ))}
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

        {results.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-[#525252]">
            {t('scanner', 'board', 'empty')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#737373] border-b border-[#2a2a2a]">
                  <th className="text-left px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'sku')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'role')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'opportunity')}</th>
                  <th className="text-left px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'risk')}</th>
                  <th className="text-center px-3 py-2 font-medium">{t('scanner', 'board', 'cols', 'priority')}</th>
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
                    <td className="px-3 py-2.5 text-[#e5e5e5] font-medium align-top">
                      {r.sku.productName}
                      <div className="text-[10px] text-[#525252] mt-0.5">
                        {r.sku.brand} · {r.sku.category} · {r.sku.type}
                      </div>
                      {/* 命中规则作为 tooltip/小字说明 */}
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
                    <td className="px-3 py-2.5 text-center align-top">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${priorityColor(r.priority)}`}>
                        {r.priority}
                      </span>
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
        )}
      </div>
    </div>
  );
}
