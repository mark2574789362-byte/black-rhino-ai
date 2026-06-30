import { ChangeEvent, useState } from "react";
import { emptyProduct, promptTemplate, sampleProducts } from "./data";
import { generateMockOutput } from "./analysis";
import { parseProductText } from "./parser";
import { validateAIOutput } from "./validator";
import type { AIOutput, BundleRecommendation, Channel, ProductInfo, Recommendation, TargetUser, ValidationResult } from "./types";
import type { ParsedProductCandidate } from "./parser";

type TextFieldKey =
  | "productName"
  | "brand"
  | "category"
  | "price"
  | "currentTitle"
  | "relatedProducts"
  | "productUrl";

const textFields: Array<[TextFieldKey, string, string]> = [
  ["productName", "Product Name", "例如 Niimbot B21 Label Printer"],
  ["brand", "Brand", "例如 Niimbot"],
  ["category", "Category", "例如 Business Label Printer"],
  ["price", "Price", "真实公开价格；未知时留空"],
  ["currentTitle", "Current Title", "当前商品标题"],
  ["relatedProducts", "Related Products", "可搭配商品或耗材"],
  ["productUrl", "Product URL", "公开商品页面链接"]
];

const channelOptions: Channel[] = ["Takealot", "Independent Store", "Both"];
const targetUserOptions: TargetUser[] = ["Home User", "Small Business", "Warehouse/Retail", "All"];

function App() {
  const [product, setProduct] = useState<ProductInfo>(sampleProducts[0]);
  const [selectedId, setSelectedId] = useState(sampleProducts[0].id);
  const [output, setOutput] = useState<AIOutput>(() => generateMockOutput(sampleProducts[0]));
  const [validation, setValidation] = useState<ValidationResult>(() =>
    validateAIOutput(generateMockOutput(sampleProducts[0]), sampleProducts[0])
  );
  const [rawProductText, setRawProductText] = useState("");
  const [parsedCandidates, setParsedCandidates] = useState<ParsedProductCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof ProductInfo>(key: K, value: ProductInfo[K]) {
    setProduct((current) => ({ ...current, [key]: value }));
  }

  function selectSample(id: string) {
    if (id === "custom") {
      setSelectedId("custom");
      setProduct(emptyProduct);
      const nextOutput = generateMockOutput(emptyProduct);
      setOutput(nextOutput);
      setValidation(validateAIOutput(nextOutput, emptyProduct));
      return;
    }

    const next = sampleProducts.find((item) => item.id === id);
    if (!next) return;
    setSelectedId(id);
    setProduct(next);
    const nextOutput = generateMockOutput(next);
    setOutput(nextOutput);
    setValidation(validateAIOutput(nextOutput, next));
  }

  function selectParsedCandidate(candidate: ParsedProductCandidate) {
    setSelectedId(candidate.id);
    setProduct(candidate.product);
    const nextOutput = generateMockOutput(candidate.product);
    setOutput(nextOutput);
    setValidation(validateAIOutput(nextOutput, candidate.product));
  }

  function handleParseRawText() {
    const candidates = parseProductText(rawProductText);
    setParsedCandidates(candidates);

    if (!candidates.length) return;
    selectParsedCandidate(candidates[0]);
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(product)
      });

      if (response.ok) {
        const data = await response.json();
        const nextOutput = data.output as AIOutput;
        setOutput(nextOutput);
        setValidation(data.validation ?? validateAIOutput(nextOutput, product));
        return;
      }

      if (response.status === 422) {
        const data = await response.json();
        if (data.validation) {
          setValidation(data.validation);
          return;
        }
      }
    } catch (error) {
      console.info("API analyze unavailable, using local rule-based workflow.", error);
    } finally {
      setLoading(false);
    }

    const fallbackOutput = generateMockOutput(product);
    setOutput(fallbackOutput);
    setValidation(validateAIOutput(fallbackOutput, product));
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Black Rhino AI</p>
          <h1>Product Operations Assistant</h1>
          <p className="subhead">
            A lightweight AI operations demo for SKU diagnosis, listing optimization, bundle opportunities and SEO content ideas under clear data boundaries.
          </p>
        </div>
        <div className="status-strip" aria-label="Demo scope">
          <span>SKU Diagnosis</span>
          <span>Data Boundary</span>
          <span>Bundle</span>
          <span>SEO</span>
        </div>
      </section>

      <section className="workspace">
        <aside className="input-panel" aria-label="商品信息输入区">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Input</p>
              <h2>Product Card</h2>
            </div>
            <button className="ghost-button" type="button" onClick={() => selectSample("custom")}>
              清空
            </button>
          </div>

          <section className="quick-import" aria-label="Quick import">
            <div className="quick-import-heading">
              <div>
                <p className="eyebrow">Quick Import</p>
                <h3>粘贴整页/多商品文本</h3>
              </div>
              <span>支持 --- 分隔</span>
            </div>
            <textarea
              className="raw-textarea"
              value={rawProductText}
              placeholder={"把商品页标题、价格、描述、卖点、评论或多个商品块粘到这里。多个商品建议用 --- 分隔。"}
              rows={5}
              onChange={(event) => setRawProductText(event.target.value)}
            />
            <div className="quick-actions">
              <button className="secondary-button" type="button" onClick={handleParseRawText}>
                Parse Product Text
              </button>
              <button
                className="ghost-button compact"
                type="button"
                onClick={() => {
                  setRawProductText("");
                  setParsedCandidates([]);
                }}
              >
                清空文本
              </button>
            </div>
            {parsedCandidates.length > 0 && (
              <div className="parsed-list" aria-label="Parsed product candidates">
                <p>已解析 {parsedCandidates.length} 个候选商品：</p>
                {parsedCandidates.map((candidate) => (
                  <button
                    className={selectedId === candidate.id ? "parsed-item active" : "parsed-item"}
                    key={candidate.id}
                    type="button"
                    onClick={() => selectParsedCandidate(candidate)}
                  >
                    <strong>{candidate.label}</strong>
                    <span>{candidate.product.brand || "Unknown brand"} · {candidate.product.category || "Unknown category"}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="demo-buttons" aria-label="Demo products">
            {sampleProducts.map((item) => (
              <button
                className={selectedId === item.id ? "demo-button active" : "demo-button"}
                key={item.id}
                type="button"
                onClick={() => selectSample(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="field">
            <span>内置示例</span>
            <select value={selectedId} onChange={(event) => selectSample(event.target.value)}>
              {sampleProducts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
              <option value="custom">自定义商品</option>
            </select>
          </label>

          <div className="field-grid">
            {textFields.map(([key, label, placeholder]) => (
              <label className="field" key={key}>
                <span>{label}</span>
                <input
                  value={product[key]}
                  placeholder={placeholder}
                  onChange={(event) => updateField(key, event.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="split-fields">
            <label className="field">
              <span>Target Channel</span>
              <select
                value={product.channel}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("channel", event.target.value as Channel)}
              >
                {channelOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Target User</span>
              <select
                value={product.targetUser}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("targetUser", event.target.value as TargetUser)}
              >
                {targetUserOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="toggle-field">
            <input
              checked={product.consumable}
              type="checkbox"
              onChange={(event) => updateField("consumable", event.target.checked)}
            />
            <span>Consumable / has repeat-purchase potential</span>
          </label>

          <label className="field">
            <span>Original Product Description</span>
            <textarea
              value={product.description}
              placeholder="输入商品描述、使用场景或页面信息"
              rows={5}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Current Selling Points</span>
            <textarea
              value={product.currentSellingPoints}
              placeholder="输入当前卖点，便于判断卖点是否清晰"
              rows={4}
              onChange={(event) => updateField("currentSellingPoints", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Review Samples</span>
            <textarea
              value={product.reviewSamples}
              placeholder="输入公开评论样本；没有评论时可以留空"
              rows={4}
              onChange={(event) => updateField("reviewSamples", event.target.value)}
            />
          </label>

          <button className="primary-button" type="button" disabled={loading} onClick={handleGenerate}>
            {loading ? "Analyzing..." : "Run SKU Diagnosis"}
          </button>
        </aside>

        <section className="output-panel" aria-label="AI 诊断结果展示区">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Output</p>
              <h2>Operations Diagnosis</h2>
            </div>
            <span className="badge ready">Rule-based Mock</span>
          </div>

          <div className="notice">
            当前版本不接入 Black Rhino 后台数据，只基于公开信息或手动输入信息做诊断；不会判断真实销量、毛利、库存周转、广告 ROI 或真实 SKU ABC 分类。
          </div>

          <ValidationNotice validation={validation} />

          <DiagnosisView output={output} />

          <details className="prompt-box">
            <summary>Prompt Guardrails</summary>
            <pre>{promptTemplate}</pre>
          </details>

          <footer className="footer-note">Powered by AI Workflow · No backend sales data accessed</footer>
        </section>
      </section>
    </main>
  );
}

function ValidationNotice({ validation }: { validation: ValidationResult }) {
  if (validation.ok && validation.warnings.length === 0) {
    return (
      <div className="validation-notice ok">
        Validator passed: every recommendation includes evidence, confidence and validation metric.
      </div>
    );
  }

  return (
    <div className={validation.ok ? "validation-notice warn" : "validation-notice blocked"}>
      <strong>{validation.ok ? "Validator warnings" : "Validator blocked output"}</strong>
      {[...validation.errors, ...validation.warnings].map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function DiagnosisView({ output }: { output: AIOutput }) {
  const isInsufficient = output.dataSufficiencyScore < 55;

  return (
    <div className="diagnosis-list">
      <article className={isInsufficient ? "score-card weak" : "score-card"}>
        <div className="score-main">
          <p className="eyebrow">1. Data Sufficiency Score</p>
          <h3>{output.dataSufficiencyScore} / 100</h3>
          <div className="score-track" aria-hidden="true">
            <span style={{ width: `${output.dataSufficiencyScore}%` }} />
          </div>
        </div>
        <p>
          {isInsufficient
            ? "当前信息不足，不能生成完整运营诊断。"
            : "当前信息可以支持初步运营诊断，但仍不能替代后台数据分析。"}
        </p>
      </article>

      <article className="diagnosis-card">
        <h3>2. What Can Be Analyzed</h3>
        <TagList items={output.canAnalyze} emptyText="No reliable analysis scope yet." />
      </article>

      <article className="diagnosis-card">
        <h3>3. What Cannot Be Analyzed</h3>
        <TagList items={output.cannotAnalyze} />
      </article>

      {output.missingFields.length > 0 && (
        <article className="diagnosis-card warning">
          <h3>Missing Information</h3>
          <ol>
            {output.missingFields.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      )}

      <article className="diagnosis-card">
        <h3>4. Product Positioning</h3>
        <RecommendationBox item={output.productPositioning} />
      </article>

      <article className="diagnosis-card">
        <h3>5. Listing Suggestions</h3>
        <div className="recommendation-list">
          {output.listingDiagnosis.map((item) => (
            <RecommendationBox item={item} key={item.recommendation} />
          ))}
        </div>
      </article>

      {!isInsufficient && (
        <>
          {output.optimizedTitle && (
            <article className="diagnosis-card strong">
              <h3>Optimized Title Direction</h3>
              <RecommendationBox item={output.optimizedTitle} />
            </article>
          )}

          {output.sellingPoints.length > 0 && (
            <article className="diagnosis-card">
              <h3>Selling Point Direction</h3>
              <div className="recommendation-list">
                {output.sellingPoints.map((item) => (
                  <RecommendationBox item={item} key={item.recommendation} />
                ))}
              </div>
            </article>
          )}

          <article className="diagnosis-card">
            <h3>6. Bundle Opportunity</h3>
            <div className="bundle-grid">
              {output.bundleRecommendation.map((bundle) => (
                <section className="bundle-box" key={bundle.name}>
                  <h4>{bundle.name}</h4>
                  <p>{bundle.items.join(" + ")}</p>
                  <span>{bundle.reason}</span>
                  <EvidenceMeta item={bundle} />
                </section>
              ))}
            </div>
          </article>

          <article className="diagnosis-card">
            <h3>7. SEO Ideas</h3>
            <div className="keyword-list">
              {output.seoKeywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>
            <ol>
              {output.contentIdeas.map((idea) => (
                <li key={idea.recommendation}>
                  <RecommendationBox item={idea} />
                </li>
              ))}
            </ol>
          </article>
        </>
      )}

      <article className="diagnosis-card">
        <h3>8. Metrics to Validate</h3>
        <div className="metric-list">
          {output.dataMetrics.map((item) => (
            <div className="metric-row" key={item.metric}>
              <strong>{item.metric}</strong>
              <span>{item.purpose}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="diagnosis-card">
        <h3>9. Data Needed for Further Analysis</h3>
        <TagList items={output.dataNeeded} />
      </article>
    </div>
  );
}

function RecommendationBox({ item }: { item: Recommendation }) {
  return (
    <section className="recommendation-box">
      <p className="recommendation-text">{item.recommendation}</p>
      <EvidenceMeta item={item} />
    </section>
  );
}

function EvidenceMeta({ item }: { item: Recommendation | BundleRecommendation }) {
  return (
    <div className="evidence-meta">
      <span>
        <strong>Evidence</strong>
        {item.evidence}
      </span>
      <span>
        <strong>Confidence</strong>
        {item.confidence}
      </span>
      <span>
        <strong>Metric</strong>
        {item.validationMetric}
      </span>
    </div>
  );
}

function TagList({ items, emptyText = "No items." }: { items: string[]; emptyText?: string }) {
  if (!items.length) {
    return <p className="muted">{emptyText}</p>;
  }

  return (
    <div className="keyword-list">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

export default App;
