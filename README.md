# 🛡️ FamilyGuard AI — Pre-Disease Interception Engine

> AI-powered health risk awareness tool using Indian-standard clinical thresholds

---

## ⚠️ Medical Disclaimer

**This tool is NOT a medical diagnosis system.** All results are for **awareness and informational purposes only**.
Always consult a qualified physician before making any health decisions.
No medication advice is provided or implied.

---

## 🚀 Quick Start

1. **Open `index.html`** in any modern browser
2. Click **▶ Run Demo** to see a complete analysis (works without API key)
3. To use with your real lab reports, add a Gemini API key in the UI

That's it. No server, no build step, no dependencies to install.

---

## 📁 Project Structure

```
familyguard-ai/
├── index.html              # Main app shell + single inline application controller
├── style.css               # Dark medical aesthetic (Space Mono + Syne fonts)
├── gemini.js               # Gemini 1.5 Flash API (extraction + narrative)
├── riskEngine.js           # Core risk calculator using Indian thresholds
├── interventions.js        # Evidence-based intervention database
├── familyManager.js        # localStorage-based family profile management
├── ui.js                   # Gauge canvas, charts, notifications, rendering
├── indianThresholds.json   # Indian-specific clinical reference ranges
├── demoPatient.json        # Full demo patient with narrative
├── SMOKE_TESTS.md          # Manual smoke test protocol for demo readiness
└── README.md
```

---

## 🧠 Core Features

### 1. Lab Report Upload & AI Extraction
- Drag & drop or click to upload PDF, JPG, or PNG
- Converts file to base64 in-browser (no server upload)
- Calls Gemini 1.5 Flash to extract all blood test values
- Shows extraction confidence score (based on extracted field coverage)
- Requires explicit user verification before analysis
- Graceful fallback to manual entry if AI unavailable

### 2. Lifestyle Input Form
- Name, age, gender, height, weight
- Sleep hours, stress level (1–10), activity level (1–10)
- Diet type (Indian diet options included)
- Real-time BMI calculation with Indian cutoffs

### 3. Risk Engine (Indian Thresholds)
- **Fasting Glucose**: Pre-diabetes at ≥96 mg/dL (vs Western ≥100)
- **HbA1c**: Pre-diabetes at ≥5.7%
- **Total Cholesterol**: Indian normal max 180 mg/dL (vs Western 200)
- **Triglycerides**: High at ≥150 mg/dL
- **Vitamin D**: Deficient at ≤20 ng/mL
- **Vitamin B12**: Deficient at ≤200 pg/mL
- **TSH**: Subclinical hypothyroid at ≥4.1 mIU/L
- **BMI**: Overweight ≥23, Obese ≥27.5 (Indian standards)

Calculates:
- **Overall Health Score** (0–100)
- **4 Category Scores**: Metabolic, Cardiovascular, Thyroid, Nutritional
- **Borderline Detection**: Flags values within 10% of thresholds
- **Risk Level**: LOW / MEDIUM / HIGH / CRITICAL
- **Creatinine + Uric Acid Integration**: Included in risk findings and metabolic scoring

### 4. Results Dashboard
- Animated half-gauge with smooth needle animation
- Animated category risk bars with color coding
- "Missed Early Signals" — borderline values standard reports ignore
- 3 priority interventions with Indian dietary context
- Disease risk trajectory chart (Chart.js)
- Detailed findings table with severity classification

### 5. AI Narrative Generation (Gemini)
- Patient-specific health story connecting lab values to future risk
- Probability-based disease projections
- Falls back gracefully to computed narrative if API unavailable

### 6. Demo Mode
- Complete working demo using `Arjun Sharma` (42y male, urban Indian)
- Demonstrates the "metabolic quartet" pattern common in India
- All features work without any API key

### 7. Family Dashboard
- Save multiple family members' risk profiles
- Color-coded risk badges for quick family health overview
- Persistent localStorage storage
- Remove profiles individually
- Explicit local-storage consent gate before save
- One-click local data wipe (clear all profiles)

### 8. Validation & Export
- Plausibility validation for all supported lab values (with unit-aware warnings)
- One-click report export via print/PDF from the Results view

---

## 🔌 Gemini API Setup

1. Get a free API key at [aistudio.google.com](https://aistudio.google.com)
2. Enter it in the **Home** tab API Key field
3. Key is stored **in memory only** — never in localStorage or cookies

### What the API is used for:
- **Lab Extraction**: Reads your uploaded PDF/image and returns structured JSON of blood test values
- **Narrative Generation**: Creates a personalized health story based on your specific risk profile

---

## 🇮🇳 Why Indian Thresholds Matter

Standard lab reports in India often use Western reference ranges, which consistently miss early disease signals in Indian patients:

| Marker | Western Threshold | Indian Threshold | Gap |
|--------|------------------|-----------------|-----|
| Fasting Glucose (pre-diabetes) | 100 mg/dL | 96 mg/dL | -4 |
| Total Cholesterol (normal max) | 200 mg/dL | 180 mg/dL | -20 |
| BMI (overweight) | 25 kg/m² | 23 kg/m² | -2 |
| BMI (obese) | 30 kg/m² | 27.5 kg/m² | -2.5 |

Indians have higher visceral fat at lower BMI and develop metabolic complications earlier — this tool accounts for that.

### Clinical References (Awareness Context)

- ICMR-INDIAB study publications and summaries for diabetes and prediabetes prevalence in India.
- ICMR-NIN and Indian endocrine guidance for India-specific metabolic risk interpretation.
- ADA Standards of Care (used only as comparative Western baseline where noted).
- WHO BMI guidance and South Asian risk-position statements for lower-risk cutoffs in Indian populations.
- Peer-reviewed reviews on Vitamin D and B12 deficiency prevalence in Indian cohorts.

Threshold file in this project is intended for educational awareness use and should be reviewed/updated periodically before production use.

---

## 🔒 Privacy

- No backend server
- Files never leave your browser (processed client-side)
- API key kept in memory only (gone on page refresh)
- Family profiles stored in your browser's localStorage only
- Family save is gated by explicit consent checkbox
- All locally stored family data can be deleted with one click

---

## ✅ Smoke Testing

Run the checks in `SMOKE_TESTS.md` before demos or submissions.

For quick automated sanity checks (no external dependencies), run:

```bash
npm test
```

---

## 🌐 Browser Support

Works in any modern browser that supports:
- ES6 Modules (Chrome 61+, Firefox 60+, Safari 11+, Edge 79+)
- Canvas API (all modern browsers)
- localStorage (all modern browsers)

---

## 📦 Dependencies (CDN only)

- **Chart.js 4.4.1** — Risk trajectory chart
- **Google Fonts** — Space Mono + Syne (loaded from fonts.googleapis.com)

All other code is vanilla JS with zero npm dependencies.

---

## 🎨 Design System

- **Background**: `#0a0a0f`
- **Surface**: `#12121a`
- **Accent**: `#ff4444`
- **Green (low risk)**: `#00d084`
- **Yellow (medium)**: `#ffb347`
- **Orange (high)**: `#ff6b35`
- **Fonts**: Syne (display) + Space Mono (monospace)

---

*Built for hackathon demo — educational purposes only. Not for clinical use.*
