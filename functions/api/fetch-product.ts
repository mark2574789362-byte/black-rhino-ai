interface FetchResult {
  productName: string;
  brand: string;
  category: string;
  price: string;
  description: string;
  currentSellingPoints: string;
  productUrl: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Record<string, string | undefined>;
}): Promise<Response> {
  const { request, env } = context;

  let body: { url: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { url } = body;
  if (!url) {
    return new Response(JSON.stringify({ error: 'URL required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slug = url.replace(/^https?:\/\//, '').replace(/\/PLID.+$/, '').replace(/\//g, ' ').replace(/-/g, ' ');
  const searchQuery = slug.length > 10 ? slug : 'product ' + slug;

  const tavilyKey = env.TAVILY_API_KEY;
  if (!tavilyKey) {
    return new Response(JSON.stringify({ error: 'Tavily API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: searchQuery,
        search_depth: 'basic',
        max_results: 3,
      }),
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      return new Response(JSON.stringify({ error: `Tavily search failed: ${err}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const searchData = await searchRes.json();
    const results = searchData.results || [];
    const combinedContent = results.map((r: any) => `${r.title}: ${r.content}`).join('\n');

    const minimaxKey = env.MINIMAX_API_KEY;
    if (!minimaxKey) {
      const fallback = manualParse(combinedContent, url);
      return new Response(JSON.stringify(fallback), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const extractRes = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${minimaxKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'system',
          content: 'You are a precise product information extractor. Always return valid JSON only, no markdown, no explanation. Never invent prices — if not found, return empty string.',
        }, {
          role: 'user',
          content: `Extract product information from the following search results about an online product page.\n\nRules:\n- productName: the FULL product title as displayed on the listing page, verbatim. Include brand, model, key specs and any subtitle/separator. Do NOT strip punctuation or marketing copy.\n- brand: brand only (e.g. "DELI").\n- category: product category (e.g. "Yoga Mat").\n- price: full price with currency, e.g. "R 279.00 ZAR". Use the largest numeric ZAR value you find, ignore "from R X" or per-unit pricing. If truly not present, return "".\n- description: 1-2 sentence summary, or "" if not available.\n- currentSellingPoints: comma-separated key specs/features, or "" if not available.\n- productUrl: "${url}"\n\nOutput schema (return this exact shape):\n{"productName":"","brand":"","category":"","price":"","description":"","currentSellingPoints":"","productUrl":""}\n\nSearch results:\n${combinedContent}`,
        }],
        temperature: 0.1,
        max_tokens: 600,
      }),
    });

    if (!extractRes.ok) {
      const fallback = manualParse(combinedContent, url);
      return new Response(JSON.stringify(fallback), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const extractData = await extractRes.json();
    const raw = extractData.choices?.[0]?.message?.content || '';

    let parsed: FetchResult;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      const fallback = manualParse(combinedContent, url);
      return new Response(JSON.stringify(fallback), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!parsed.productUrl) {
      parsed.productUrl = url;
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

function manualParse(content: string, url: string): FetchResult {
  // Pick the largest ZAR price to avoid picking "from R X" or unit prices
  const priceMatches = [...content.matchAll(/R\s*([\d]+(?:[,\.]\d+)?)/gi)];
  let price = '';
  if (priceMatches.length > 0) {
    const nums = priceMatches
      .map(m => parseFloat(m[1].replace(/,/g, '')))
      .filter(n => !isNaN(n) && n > 1);
    if (nums.length > 0) {
      const max = Math.max(...nums);
      price = `R ${max.toFixed(2).replace(/\.00$/, '')} ZAR`;
    }
  }

  const firstLine = content.split('\n').find(l => l.trim().length > 5) || '';
  // Try to split brand from generic "BRAND ProductType" pattern
  const brandMatch = firstLine.match(/^([A-Z][A-Za-z0-9]{2,}(?:\s+[A-Z][A-Za-z0-9]{2,})?)\s+([A-Z][a-z]+)/);
  const brand = brandMatch ? brandMatch[1] : '';

  return {
    productName: firstLine.trim(),
    brand,
    category: '',
    price,
    description: '',
    currentSellingPoints: '',
    productUrl: url,
  };
}