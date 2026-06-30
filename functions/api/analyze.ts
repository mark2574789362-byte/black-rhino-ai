import { generateMockOutput } from "../../src/analysis";
import { validateAIOutput } from "../../src/validator";
import type { AIOutput, ProductInfo } from "../../src/types";

interface Env {
  AI_API_URL?: string;
  AI_API_KEY?: string;
  AI_MODEL?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function buildPrompt(product: ProductInfo) {
  return `You are an AI e-commerce operations assistant for Black Rhino South Africa.

Important rules:
- Do not make unsupported conclusions.
- If information is insufficient, clearly state what cannot be analyzed and what additional data is needed.
- Do not infer sales performance, profit margin, inventory risk, advertising ROI or real SKU classification unless backend data is provided.
- Every recommendation must include evidence, confidence and validationMetric.
- Return valid JSON only. Do not wrap it in markdown.

Product information:
${JSON.stringify(product, null, 2)}

Required JSON shape:
{
  "dataSufficiencyScore": 72,
  "canAnalyze": [],
  "cannotAnalyze": [],
  "missingFields": [],
  "productPositioning": {
    "recommendation": "",
    "evidence": "",
    "confidence": "High | Medium | Low",
    "validationMetric": ""
  },
  "listingDiagnosis": [
    {
      "recommendation": "",
      "evidence": "",
      "confidence": "High | Medium | Low",
      "validationMetric": ""
    }
  ],
  "optimizedTitle": {
    "recommendation": "",
    "evidence": "",
    "confidence": "High | Medium | Low",
    "validationMetric": "CTR"
  },
  "sellingPoints": [],
  "bundleRecommendation": [
    {
      "name": "",
      "items": [],
      "reason": "",
      "evidence": "",
      "confidence": "High | Medium | Low",
      "validationMetric": "Bundle AOV"
    }
  ],
  "seoKeywords": [],
  "contentIdeas": [],
  "dataNeeded": [],
  "dataMetrics": []
}`;
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Model response did not contain JSON.");
  }

  return JSON.parse(match[0]);
}

async function callExternalModel(product: ProductInfo, env: Env): Promise<AIOutput | null> {
  if (!env.AI_API_URL || !env.AI_API_KEY) return null;

  const prompt = buildPrompt(product);
  const response = await fetch(env.AI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.AI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_object"
      },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`AI API request failed with ${response.status}.`);
  }

  const data = await response.json();
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.output_text ??
    data?.text ??
    data?.content;

  if (typeof content !== "string") {
    throw new Error("AI API response did not include text content.");
  }

  return extractJson(content) as AIOutput;
}

export async function onRequestPost(context: PagesContext) {
  let product: ProductInfo;

  try {
    product = (await context.request.json()) as ProductInfo;
  } catch {
    return jsonResponse({ error: "Invalid JSON request body." }, 400);
  }

  try {
    const modelOutput = await callExternalModel(product, context.env);
    const output = modelOutput ?? generateMockOutput(product);
    const validation = validateAIOutput(output, product);

    if (!validation.ok) {
      return jsonResponse(
        {
          blocked: true,
          reason: "Validator blocked unsupported or incomplete diagnosis output.",
          validation
        },
        422
      );
    }

    return jsonResponse({
      source: modelOutput ? "external-ai" : "rule-based-fallback",
      output,
      validation
    });
  } catch (error) {
    const output = generateMockOutput(product);
    const validation = validateAIOutput(output, product);

    if (!validation.ok) {
      return jsonResponse(
        {
          blocked: true,
          reason: "Validator blocked fallback diagnosis output.",
          fallbackReason: error instanceof Error ? error.message : "Unknown AI API error.",
          validation
        },
        422
      );
    }

    return jsonResponse({
      source: "rule-based-fallback",
      fallbackReason: error instanceof Error ? error.message : "Unknown AI API error.",
      output,
      validation
    });
  }
}
