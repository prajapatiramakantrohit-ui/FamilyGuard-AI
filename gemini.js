// modules/gemini.js
// Handles all Gemini API interactions for lab extraction and narrative generation

const GeminiAPI = (() => {
  let _apiKey = null;
  const MODEL = 'gemini-1.5-flash';
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  function setApiKey(key) {
    _apiKey = key ? key.trim() : null;
  }

  function hasApiKey() {
    return !!_apiKey && _apiKey.length > 10;
  }

  function extractFirstJsonObject(rawText) {
    const cleaned = String(rawText || '').replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    if (start === -1) {
      throw new Error('PARSE_ERROR: No JSON object found in model response');
    }

    let depth = 0;
    let end = -1;
    for (let i = start; i < cleaned.length; i += 1) {
      const ch = cleaned[i];
      if (ch === '{') depth += 1;
      if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) {
      throw new Error('PARSE_ERROR: Incomplete JSON object in model response');
    }

    return JSON.parse(cleaned.slice(start, end + 1));
  }

  function normalizeNumericOrNull(val) {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeLabPayload(parsed) {
    const keys = [
      'glucose_fasting', 'hba1c', 'cholesterol_total', 'cholesterol_ldl',
      'cholesterol_hdl', 'triglycerides', 'vitaminD', 'vitaminB12',
      'tsh', 'hemoglobin', 'creatinine', 'uric_acid'
    ];

    const normalized = {};
    for (const key of keys) {
      normalized[key] = normalizeNumericOrNull(parsed?.[key]);
    }
    return normalized;
  }

  function isValidNarrativePayload(parsed) {
    if (!parsed || typeof parsed !== 'object') return false;
    if (typeof parsed.summary !== 'string' || typeof parsed.critical_insight !== 'string') return false;
    if (!Array.isArray(parsed.missed_signals) || !parsed.timeline_risk || !Array.isArray(parsed.interventions)) return false;
    return true;
  }

  async function callGemini(prompt, imageBase64 = null, mimeType = null) {
    if (!hasApiKey()) {
      throw new Error('NO_API_KEY');
    }

    const parts = [];

    if (imageBase64 && mimeType) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageBase64
        }
      });
    }

    parts.push({ text: prompt });

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        topP: 0.8
      }
    };

    const response = await fetch(
      `${BASE_URL}/${MODEL}:generateContent?key=${_apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(`GEMINI_ERROR: ${msg}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      throw new Error('GEMINI_ERROR: No response candidates');
    }

    return data.candidates[0].content.parts[0].text;
  }

  async function extractLabValues(base64Data, mimeType) {
    const prompt = `You are a medical lab report parser. Analyze this lab report image and extract all blood test values.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "glucose_fasting": <number or null>,
  "hba1c": <number or null>,
  "cholesterol_total": <number or null>,
  "cholesterol_ldl": <number or null>,
  "cholesterol_hdl": <number or null>,
  "triglycerides": <number or null>,
  "vitaminD": <number or null>,
  "vitaminB12": <number or null>,
  "tsh": <number or null>,
  "hemoglobin": <number or null>,
  "creatinine": <number or null>,
  "uric_acid": <number or null>
}

Rules:
- Extract ONLY numeric values, no units
- If a test is not found, use null
- For HbA1c, convert to percentage (e.g., 5.7 not 57)
- For TSH, preserve decimal precision
- Return ONLY the JSON object, nothing else`;

    try {
      const raw = await callGemini(prompt, base64Data, mimeType);
      const parsed = extractFirstJsonObject(raw);
      return normalizeLabPayload(parsed);
    } catch (err) {
      if (err.message === 'NO_API_KEY') throw err;
      console.error('Lab extraction error:', err);
      throw new Error('PARSE_ERROR: Could not parse lab values from response');
    }
  }

  async function generateNarrative(profile, labValues, riskResult) {
    const prompt = `You are FamilyGuard AI, a preventive health intelligence system. Analyze this patient data and generate a compelling health risk narrative.

Patient Profile:
${JSON.stringify(profile, null, 2)}

Lab Values:
${JSON.stringify(labValues, null, 2)}

Risk Assessment:
- Overall Score: ${riskResult.overallScore}/100
- Risk Level: ${riskResult.riskLevel}
- Category Scores: ${JSON.stringify(riskResult.categoryScores)}

Return ONLY a valid JSON object (no markdown) with this structure:
{
  "summary": "<2-sentence compelling summary of the patient's health trajectory>",
  "critical_insight": "<1 paragraph connecting the dots between lab values and future disease risk>",
  "missed_signals": [
    {
      "signal": "<name of borderline condition>",
      "value": "<lab value with unit>",
      "implication": "<clinical implication in plain language>"
    }
  ],
  "timeline_risk": {
    "1_year": <risk percentage 0-100>,
    "3_years": <risk percentage 0-100>,
    "5_years": <risk percentage 0-100>,
    "10_years": <risk percentage 0-100>
  },
  "interventions": [
    {
      "priority": 1,
      "title": "<intervention name>",
      "action": "<specific actionable step>",
      "impact": "<expected outcome>",
      "timeline": "<when to expect results>"
    }
  ]
}

Important: Include max 3 missed_signals and exactly 3 interventions. Be specific and actionable. Reference Indian dietary context where relevant.`;

  const safetyGuard = `
Safety constraints:
- Do NOT provide medication dosages, injection plans, or prescription-like instructions.
- Do NOT suggest starting, stopping, or changing medicines.
- Keep recommendations in awareness and lifestyle language.
- When supplements or treatment may be needed, explicitly say: "consult a qualified physician for individualized treatment."`;

    try {
      const raw = await callGemini(prompt + safetyGuard);
      const parsed = extractFirstJsonObject(raw);
      if (!isValidNarrativePayload(parsed)) {
        throw new Error('PARSE_ERROR: Narrative response schema mismatch');
      }
      return parsed;
    } catch (err) {
      if (err.message === 'NO_API_KEY') throw err;
      console.error('Narrative generation error:', err);
      return null;
    }
  }

  return {
    setApiKey,
    hasApiKey,
    extractLabValues,
    generateNarrative
  };
})();

export default GeminiAPI;
