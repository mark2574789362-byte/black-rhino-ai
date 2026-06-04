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

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch: ${res.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = await res.text();
    const result = parseProductPage(html, url);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Request timeout (8s)' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function parseProductPage(html: string, url: string): FetchResult {
  // Try JSON-LD structured data first
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const ld = JSON.parse(jsonLdMatch[1]);
      const product = extractFromJsonLd(ld);
      if (product) return product;
    } catch {}
  }

  // Generic meta tag extraction
  const getMeta = (name: string, pattern = 'name'): string => {
    const regex = pattern === 'name'
      ? new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
      : new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
    const m = html.match(regex);
    if (m) return m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();

    // Also try reverse order
    const regex2 = pattern === 'name'
      ? new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i')
      : new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i');
    const m2 = html.match(regex2);
    if (m2) return m2[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
    return '';
  };

  const getTitle = (): string => {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return m ? m[1].replace(/&amp;/g, '&').trim() : '';
  };

  // Extract price
  const priceMatch = html.match(/R\s*([\d\s,]+\.?\d*)|ZAR\s*([\d\s,]+\.?\d*)|R\s*([\d,]+)/i);
  const price = priceMatch
    ? `R ${(priceMatch[1] || priceMatch[2] || priceMatch[3]).replace(/\s/g, '')} ZAR`
    : '';

  // Extract description
  let description = getMeta('description');
  if (!description) {
    const descMatch = html.match(/<meta[^>]+name="description"[^>]*>/i);
    if (descMatch) {
      const contentMatch = descMatch[0].match(/content=["']([^"']+)["']/);
      if (contentMatch) description = contentMatch[1];
    }
  }

  // Extract brand
  let brand = getMeta('brand') || getMeta('og:brand') || getMeta('product:brand');
  if (!brand) {
    const brandMatch = html.match(/Brand[:\s]*<[^>]+>([^<]+)/i);
    if (brandMatch) brand = brandMatch[1].trim();
  }

  // Extract category
  let category = getMeta('product:category') || getMeta('category');
  if (!category) {
    const catMatch = html.match(/"category"\s*:\s*"([^"]+)"/);
    if (catMatch) category = catMatch[1];
  }

  // Extract currentTitle from page title
  const title = getTitle();
  const cleanTitle = title
    .replace(/\s*[-|–]\s*[^-|–]+$/, '')
    .replace(/\s*\|[^|]+$/, '')
    .replace(/Buy\s+/i, '')
    .trim();

  // Extract selling points from structured data or features
  const sellingPoints: string[] = [];
  const featureMatch = html.match(/"features"\s*:\s*\[([^\]]+)\]/);
  if (featureMatch) {
    try {
      const features = JSON.parse(`[${featureMatch[1]}]`);
      features.slice(0, 5).forEach((f: string) => {
        const clean = f.replace(/^["']|["']$/g, '').trim();
        if (clean && clean.length > 10) sellingPoints.push(clean);
      });
    } catch {}
  }
  if (sellingPoints.length === 0) {
    const bulletMatches = html.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
    bulletMatches.slice(0, 5).forEach(m => {
      const clean = m.replace(/<[^>]+>/g, '').trim();
      if (clean && clean.length > 10 && clean.length < 200) sellingPoints.push(clean);
    });
  }

  return {
    productName: getMeta('og:title') || title.split('|')[0].split('-')[0].trim() || cleanTitle,
    brand,
    category,
    price,
    currentTitle: cleanTitle,
    description,
    currentSellingPoints: sellingPoints.join(', '),
    productUrl: url,
  };
}

function extractFromJsonLd(ld: any): FetchResult | null {
  const product = ld['@type'] === 'Product' ? ld
    : Array.isArray(ld) ? ld.find((i: any) => i['@type'] === 'Product')
    : ld['@graph']?.find((i: any) => i['@type'] === 'Product');

  if (!product) return null;

  const getName = () =>
    product.name || '';
  const getBrand = () =>
    (product.brand?.name || product.brand?.['@value'] || '') as string;
  const getCategory = () =>
    product.category || '';
  const getPrice = () => {
    const offers = product.offers;
    if (!offers) return '';
    const price = Array.isArray(offers) ? offers[0]?.price : offers?.price;
    return price ? `R ${price} ZAR` : '';
  };
  const getDescription = () =>
    product.description || '';
  const getTitle = () =>
    getName();

  return {
    productName: getName(),
    brand: getBrand(),
    category: getCategory(),
    price: getPrice(),
    currentTitle: getTitle(),
    description: getDescription(),
    currentSellingPoints: '',
    productUrl: '',
  };
}