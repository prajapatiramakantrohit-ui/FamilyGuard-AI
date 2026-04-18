# FamilyGuard AI: Pre-Disease Interception Engine

AI-powered health risk awareness platform that detects early patterns in lab reports using India-relevant thresholds and converts them into actionable next steps.

## Why this exists

Most lab reports are value-by-value summaries. Families often miss risk because borderline markers are not interpreted together.

FamilyGuard AI closes that gap by combining:

1. Multi-marker risk interpretation
2. Plain-language explainability
3. Action planning and doctor-ready handoff

## Demo-first quick start

1. Open [index.html](index.html) in a browser.
2. Click Run Demo.
3. Explore Arun, Priya, and Rajan profiles from the left panel.

No backend setup is required for the base demo flow.

## What the product delivers

### Input and extraction

1. Upload PDF/JPG/PNG lab reports or use manual entry.
2. Optional Gemini-powered extraction and narrative generation.
3. Confidence display and explicit verification gate before analysis.

### Risk modeling

1. Category scores: metabolic, cardiovascular, thyroid, nutritional.
2. Overall score and risk band: LOW / MEDIUM / HIGH / CRITICAL.
3. Borderline detector for near-threshold values.
4. India-specific thresholds (glucose, BMI, lipids, thyroid, vitamins).

### Output for action

1. Explainability cards (why it matters, why recommendation appears).
2. Priority interventions with follow-up timing.
3. 30-day outcome simulation and weekly autopilot plan.
4. Doctor-ready summary and export/share options.

### Family workflow

1. Multi-member tracking in local browser storage.
2. Consent gate before save.
3. One-click local data wipe.

## Tech profile

1. Frontend: Vanilla HTML/CSS/JavaScript modules.
2. Visualization: Chart.js via CDN.
3. Storage: localStorage for family state.
4. No mandatory server dependency for demo mode.

## Repository structure

```text
familyguard-ai/
|- index.html
|- style.css
|- riskEngine.js
|- gemini.js
|- interventions.js
|- explainability.js
|- outcomeSimulator.js
|- localizedRecommendations.js
|- familyManager.js
|- ui.js
|- clinicalAdvisor.js
|- clinicalValidation.js
|- modelPerformance.js
|- securityAudit.js
|- indianThresholds.json
|- demoPatient.json
|- mockLabDataset.json
|- SMOKE_TESTS.md
|- tests/
|- scripts/push-to-notion.ts
`- SETUP_NOTION.md
```

## Validation and testing

Run smoke checks before any demo/submission:

```bash
npm test
```

## Notion sync workflow

This repo includes one-command documentation sync.

```bash
npm run push:notion
```

Behavior:

1. Reads [README.md](README.md) first.
2. Appends `docs/*.md` in alphabetical order when present.
3. Upserts a Notion page by exact title.
4. Prints final URL as: `Notion page: <URL>`

Setup details are in [SETUP_NOTION.md](SETUP_NOTION.md).

## Responsible use and disclaimer

FamilyGuard AI is an awareness and early-intervention support tool.

1. It is not a medical diagnosis engine.
2. It does not prescribe medications.
3. Clinical decisions must be made with a qualified physician.

## Current scope and roadmap

Current scope:

1. Hackathon-grade frontend product demo.
2. Explainable risk interpretation for common preventive markers.
3. Family and doctor handoff workflow in browser.

Next roadmap:

1. Secure backend and identity.
2. Production OCR pipeline and richer lab schemas.
3. Clinical validation and governance workflows.
4. Longitudinal trend tracking beyond point-in-time reports.
