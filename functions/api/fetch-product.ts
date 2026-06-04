interface FetchResult {
  productName: string;
  brand: string;
  category: string;
  price: string;
  currentTitle: string;
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

    const extractRes = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${minimaxKey}`,
      },
      body: JSON.stringify({
        model: 'abab6.5s',
        messages: [{
          role: 'user',
          content: `Extract product information from search results about an online product. Return ONLY valid JSON with no markdown, no explanation.\n\nSearch results:\n${combinedContent}\n\nReturn EXACTLY this JSON:\n{\n  "productName": "short product name only, no seller tagline (e.g. DELI Yoga Mat 8mm TPE - 183cm Long Non-Slip Exercise & Fitness Mat)",\n  "brand": "brand name only (e.g. DELI)",\n  "category": "product category (e.g. Yoga Mat)",\n  "price": "correct price in ZAR (e.g. R 279 ZAR). If search shows R 279, the price is R 279 ZAR not R 30. Do not invent prices.",\n  "currentTitle": "product title as shown online, no domain suffixes",\n  "description": "brief 1-2 sentence description or empty string",\n  "currentSellingPoints": "key features/specs separated by commas or empty string",\n  "productUrl": "${url}"\n}`,
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
  const priceMatch = content.match(/R\s*([\d,\.]+)\s*(ZAR|rand|price)?/i);
  const price = priceMatch ? `R ${priceMatch[1].replace(',', '')} ZAR` : '';
  const brandMatch = content.match(/^([A-Z][a-zA-Z0-9\s&]+)\s+(Yoga|Mat|Printer|Power|Barcode|Label)/);
  const brand = brandMatch ? brandMatch[1].trim() : '';
  const title = content.split('\n')[0] || '';

  return {
    productName: title,
    brand,
    category: '',
    price,
    currentTitle: title,
    description: '',
    currentSellingPoints: '',
    productUrl: url,
  };
}