# Black Rhino AI Product Operations Assistant

A lightweight AI operations demo built after the Buffalo / Black Rhino interview.

This tool is designed to simulate how AI can support e-commerce operators in:

- product positioning
- listing diagnosis
- title and selling point optimization
- bundle opportunity discovery
- SEO content ideas
- data validation planning

## Important Note

This demo does not access Black Rhino backend data.

It only works with public product information or manually entered product cards.

It does not make conclusions about:

- real sales performance
- profit margin
- inventory turnover
- advertising ROI
- real SKU ABC classification

Those modules require internal data and can be upgraded after backend access.

## Current Demo Logic

The current version uses a rule-based mock workflow instead of a live model API.

It first checks data sufficiency, then decides what can and cannot be analyzed.

If the product information is insufficient, the tool will not generate a complete listing diagnosis, title, bundle plan or SEO plan. It will show missing information and data needed for further analysis.

This means the current version is best understood as a structured product operations prototype, not a production AI system.

Every recommendation now includes:

- evidence
- confidence
- validation metric

The API route also validates model output before returning it to the frontend. If the model makes unsupported backend-data claims or omits required evidence fields, the output is blocked instead of shown as a valid diagnosis.

## API Validation

Cloudflare Pages Function:

```text
functions/api/analyze.ts
```

The API accepts a product card, optionally calls an external AI endpoint configured through environment variables, then runs the output through a validator.

Required environment variables for external AI mode:

```text
AI_API_URL
AI_API_KEY
AI_MODEL
```

If those variables are not present, the API falls back to the local rule-based workflow.

## Built-in Demo Products

- Niimbot B21 Label Printer
- Niimbot Series B Label Tapes
- Baseus Portable Power Bank

These examples show different operating logic across device + consumables, repeat-purchase consumables and competitive 3C accessories.

## Tech Stack

- Vite
- React
- TypeScript
- Prompt Workflow Demo

## Local Development

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
```

## Golden SKU Evaluation

The repository includes 10 Golden SKU cases for repeatable output-quality checks.

Run:

```bash
npm run eval:golden
```

The evaluator scores each SKU on a 100-point rubric:

- data boundary compliance: 30
- product positioning: 20
- listing specificity: 20
- bundle executability: 15
- SEO scenario fit: 10
- professional tone: 5

Cases below 80 points fail the evaluation.

## Future Upgrade

After backend access, this demo can be upgraded into a real SKU operations decision system with:

- SKU classification
- inventory warning
- review mining
- ad ROI analysis
- repeat purchase prediction
- SEO content automation
