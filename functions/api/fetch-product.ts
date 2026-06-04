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

  // Extract product name from URL slug for search query
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
    // Search Tavily for product info
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

    // Combine all search snippets for LLM to extract structured info
    const combinedContent = results.map((r: any) => `${r.title}: ${r.content}`).join('\n');

    // Use MiniMax to extract structured product info
    const minimaxKey = env.MINIMAX_API_KEY;
    if (!minimaxKey) {
      // Fallback: manually parse from snippets
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
          content: `Extract product information from the following search results about an online product. Return ONLY valid JSON with no markdown or extra text.\n\nSearch results:\n${combinedContent}\n\nReturn JSON like this:\n{\n  "productName": "full product name",\n  "brand": "brand name or N/A",\n  "category": "product category or N/A",\n  "price": "price in ZAR format like R 299 ZAR or empty string\",\n  "currentTitle": "product title as shown online",\n  "description": "brief product description or empty string\",\n  "currentSellingPoints": "key features separated by commas or empty string",\n  "productUrl": "${url}"\n}\n\nIf a field cannot be determined from the search results, use empty string. Price should be in format "R XXX ZAR".`,
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

    // Try to parse JSON
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

    // Ensure productUrl is set
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
  // Fallback parsing when API calls fail
  const lines = content.split('\n').filter(Boolean);

  // Extract price
  const priceMatch = content.match(/R\s*([\d,\.]+)\s*(ZAR|rand|price)?/i);
  const price = priceMatch ? `R ${priceMatch[1].replace(',', '')} ZAR` : '';

  // Extract brand (often at start of title)
  const brandMatch = content.match(/^([A-Z][a-zA-Z0-9\s&]+)\s+(Yoga|Mat|Printer|Power|Barcode|Label)/);
  const brand = brandMatch ? brandMatch[1].trim() : '';

  // First line as title
  const title = lines[0] || '';

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