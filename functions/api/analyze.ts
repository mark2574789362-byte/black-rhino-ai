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

    // Validate required fields
    if (!parsed.dataSufficiencyScore || !parsed.canAnalyze || !parsed.cannotAnalyze) {
      return new Response(
        JSON.stringify({ error: 'Invalid AI response structure', parsed }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
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
Current Title: ${info.currentTitle || 'N/A'}
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
