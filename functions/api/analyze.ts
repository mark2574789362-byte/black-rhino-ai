export async function onRequestPost(context: {
  request: Request;
  env: { MINIMAX_API_KEY?: string; MINIMAX_MODEL?: string };
}): Promise<Response> {
  const { request, env } = context;

  if (!env.MINIMAX_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let product: Record<string, string | boolean | string[]>;
  try {
    product = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const lang = (product.lang === 'zh' || product.lang === 'en') ? product.lang : 'en';
  const prompt = buildPrompt(product as any, lang);
  const model = env.MINIMAX_MODEL || 'abab6.5s-chat';

  try {
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1800,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: `API error: ${response.status}`, detail: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';

    // Try to extract JSON from response
    let parsed: any;
    try {
      // Try direct parse first
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON from markdown code blocks
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        try {
          parsed = JSON.parse(match[1].trim());
        } catch {
          // Try to find any JSON object in the text
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch {
              return new Response(
                JSON.stringify({ error: 'Failed to parse AI response as JSON', raw: raw.substring(0, 200) }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'No JSON found in AI response', raw: raw.substring(0, 200) }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Normalize: ensure all required fields exist with safe defaults so frontend never crashes
    const normalized = normalizeOutput(parsed);
    if (!normalized) {
      return new Response(
        JSON.stringify({ error: 'AI response missing all required fields' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(normalized), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 补齐所有可能缺失的字段，让前端永远不会拿到 NaN/null/undefined 导致的 crash
function normalizeOutput(raw: any): any | null {
  if (!raw || typeof raw !== 'object') return null;

  // 关键字段：必须至少有 1 个，否则认为该返回不可用
  const hasAny = raw.dataSufficiencyScore != null
    || raw.productPositioning
    || raw.optimizedTitle
    || (Array.isArray(raw.sellingPoints) && raw.sellingPoints.length);
  if (!hasAny) return null;

  const safeArr = (v: any, max = 10): string[] => {
    if (!Array.isArray(v)) return [];
    return v.filter((x: any) => typeof x === 'string' && x.trim().length).slice(0, max);
  };
  const safeStr = (v: any, fallback = ''): string => {
    return typeof v === 'string' ? v : fallback;
  };
  const safeScore = (v: any): number => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  };
  const safeBundles = (v: any): any[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((b: any) => b && typeof b === 'object')
      .slice(0, 5)
      .map((b: any) => ({
        name: safeStr(b.name, 'Bundle'),
        items: safeArr(b.items, 10),
        purpose: safeStr(b.purpose),
      }));
  };
  const safeMetrics = (v: any): any[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((m: any) => m && typeof m === 'object')
      .slice(0, 8)
      .map((m: any) => ({
        metric: safeStr(m.metric, ''),
        reason: safeStr(m.reason, ''),
        nextAction: safeStr(m.nextAction, ''),
      }));
  };

  return {
    status: ['insufficient', 'partial', 'full'].includes(raw.status) ? raw.status : 'partial',
    dataSufficiencyScore: safeScore(raw.dataSufficiencyScore),
    canAnalyze: safeArr(raw.canAnalyze, 5),
    cannotAnalyze: safeArr(raw.cannotAnalyze, 5),
    productPositioning: safeStr(raw.productPositioning),
    skuStrategy: safeStr(raw.skuStrategy),
    listingDiagnosis: safeArr(raw.listingDiagnosis, 10),
    optimizedTitle: safeStr(raw.optimizedTitle),
    sellingPoints: safeArr(raw.sellingPoints, 10),
    bundleRecommendation: safeBundles(raw.bundleRecommendation),
    seoKeywords: safeArr(raw.seoKeywords, 12),
    contentIdeas: safeArr(raw.contentIdeas, 6),
    dataNeeded: safeArr(raw.dataNeeded, 8),
    dataMetrics: safeMetrics(raw.dataMetrics),
  };
}

function buildPrompt(info: Record<string, string | boolean | string[]>, lang: 'zh' | 'en'): string {
  const isZh = lang === 'zh';
  const outputLang = isZh ? 'Simplified Chinese (简体中文)' : 'English';
  const context = isZh
    ? 'Black Rhino 在南非经营电商和品牌本地化业务，主要商品包括标签机、条码机、耗材、3C 配件、办公及仓储相关产品，主营渠道 Takealot 和独立 Shopify 站，目标市场为南非消费者（含个人用户、小型商家、仓储/零售运营）。'
    : 'Black Rhino operates e-commerce and brand localization business in South Africa. Product categories include label printers, barcode printers, consumables, electronics, office and warehouse-related products. Main sales channels: Takealot and independent Shopify store. Target market: South African consumers including home users, small businesses, and warehouse/retail operations.';

  return `You are an AI e-commerce operations assistant for Black Rhino South Africa.

CRITICAL LANGUAGE RULE:
- All human-readable text in the JSON output MUST be in ${outputLang}.
- This includes: productPositioning, skuStrategy, optimizedTitle, sellingPoints[], bundleRecommendation[].name, bundleRecommendation[].items[], bundleRecommendation[].purpose, seoKeywords[], contentIdeas[], dataNeeded[], dataMetrics[].metric, dataMetrics[].reason, dataMetrics[].nextAction, canAnalyze[], cannotAnalyze[].
- JSON keys and English enum values stay in English.

Important rules:
- Do NOT make conclusions about sales performance, profit margin, inventory turnover, ad ROI, or real SKU classification unless backend data is provided.
- If the provided product information is insufficient, clearly state what cannot be analyzed and what additional data is needed.
- Return valid JSON only. No markdown, no extra text.

Business context:
${context}

Product Information:
Product Name: ${info.productName || 'N/A'}
Brand: ${info.brand || 'N/A'}
Category: ${info.category || 'N/A'}
Price: ${info.price || 'N/A'}
Description: ${info.description || 'N/A'}
Current Selling Points: ${info.currentSellingPoints || 'N/A'}
Target Channel: ${info.channel || 'N/A'}
Target User: ${info.targetUser || 'N/A'}
Consumable: ${info.consumable ? 'Yes' : 'No'}
Related Products: ${info.relatedProducts || 'N/A'}
Review Samples: ${info.reviewSamples || 'N/A'}
Product URL: ${info.productUrl || 'N/A'}

Please analyze the product and return a JSON object with the following structure:
{
  "dataSufficiencyScore": <number 0-100, estimate how much can be analyzed with this data>,
  "canAnalyze": [<array of 3-5 things that CAN be analyzed with current data>],
  "cannotAnalyze": [<array of 3-5 things that CANNOT be analyzed without backend data>],
  "productPositioning": "<1-2 sentence positioning for South African market>",
  "skuStrategy": "<1-2 sentence SKU role + 4 priority actions>",
  "optimizedTitle": "<improved title suitable for South African e-commerce, clear and search-friendly>",
  "sellingPoints": [<array of 5 bullet points, practical and localized for South African users>],
  "bundleRecommendation": [
    {
      "name": "<bundle name>",
      "items": ["<item 1>", "<item 2>", "..."],
      "purpose": "<why this bundle improves AOV or repeat purchase>"
    }
  ],
  "seoKeywords": [<array of 8 English keywords focused on South African search intent>],
  "contentIdeas": [<array of 3 blog/content topic ideas for SEO>],
  "dataNeeded": [<array of 3-5 additional data points needed for deeper analysis>],
  "dataMetrics": [
    { "metric": "<metric name>", "reason": "<why this metric matters>", "nextAction": "<what to do if metric underperforms>" }
  ]
}

Output in ${outputLang}. Be specific and practical. Return JSON only.`;
}
