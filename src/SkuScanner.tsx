import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileDown, ClipboardPaste, Play, Sparkles, BarChart2, X, AlertCircle, Package,
} from 'lucide-react';
import { useLang } from './i18n';
import { DEMO_PRODUCTS, SKU_CSV_TEMPLATE, type BatchSkuInput, type SkuScanResult } from './types';
import {
  parseCsv, parseManual, scanSkus, triggerTemplateDownload, batchToProduct,
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

export default function SkuScanner({ onSelectForDiagnosis }: Props) {
  const { t, lang } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 手动粘贴状态
  const [manualText, setManualText] = useState('');
  // 扫描结果
  const [results, setResults] = useState<SkuScanResult[]>([]);
  // 错误
  const [error, setError] = useState<string | null>(null);
  // 业务场景 demo 点击后的瞬态
  const [loadedDemo, setLoadedDemo] = useState<string | null>(null);

  // ---------- 解析逻辑 ----------
  const runScan = (skus: BatchSkuInput[], source: string) => {
    if (!skus.length) {
      setError(t('scanner', 'board', 'empty'));
      setResults([]);
      return;
    }
    const scanned = scanSkus(skus, { lang });
    setResults(scanned);
    setError(null);
    setLoadedDemo(source);
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

  const handleManualScan = () => {
    if (!manualText.trim()) {
      setError(t('scanner', 'board', 'empty'));
      return;
    }
    const res = parseManual(manualText);
    if (!res.ok) {
      setError(t('scanner', 'manualCard', 'parseError'));
      return;
    }
    runScan(res.skus, 'manual');
  };

  // 加载某个 Demo 场景：直接生成 1 条 SKU 跑规则
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
    setManualText(
      `${sku.productName} | ${sku.brand} | ${sku.category} | ${sku.type} | ${sku.relatedProducts || ''}`
    );
    runScan([sku], demo.name);
  };

  // Run full diagnosis：把该 SKU 推给上层单 SKU 表单
  const handleRunDiagnosis = (r: SkuScanResult) => {
    onSelectForDiagnosis(batchToProduct(r.sku));
    // 平滑滚到单 SKU 诊断区
    setTimeout(() => {
      document.getElementById('single-sku-diagnosis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="space-y-4">
      {/* ============== 顶部：左侧 Scanner + 右侧 Demo Examples ============== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：SKU Priority Scanner（包含上传 + 手动粘贴） */}
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
                  // 允许重复上传同名文件
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* 手动粘贴 卡片 */}
          <div className="border border-[#1f1f1f] rounded-xl p-4 bg-[#141414]">
            <div className="flex items-start gap-2 mb-3">
              <ClipboardPaste size={14} className="text-orange-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#e5e5e5]">
                  {t('scanner', 'manualCard', 'title')}
                </div>
                <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                  {t('scanner', 'manualCard', 'hint')}
                </p>
              </div>
            </div>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={4}
              placeholder={t('scanner', 'manualCard', 'placeholder')}
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-xs text-[#e5e5e5] placeholder-[#525252] resize-y focus:border-orange-500 transition-colors font-mono"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleManualScan}
                className="text-xs px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 transition-colors"
              >
                <Play size={12} />
                {t('scanner', 'manualCard', 'scanBtn')}
              </button>
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
              {results.length} {lang === 'zh' ? '条 SKU' : 'SKUs'}
              {loadedDemo && ` · ${loadedDemo}`}
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
                        {r.sku.brand} · {r.sku.category}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#a3a3a3] align-top">{r.role}</td>
                    <td className="px-3 py-2.5 text-[#a3a3a3] align-top">{r.opportunity}</td>
                    <td className="px-3 py-2.5 text-[#a3a3a3] align-top">{r.risk}</td>
                    <td className="px-3 py-2.5 text-center align-top">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${priorityColor(r.priority)}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#a3a3a3] align-top">{r.nextAction}</td>
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
