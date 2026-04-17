// outcomeSimulator.js
// Simple 30-day simulation for demo and hackathon storytelling.

const OutcomeSimulator = (() => {
  function simulateOutcome(currentValues, interventionPlan = []) {
    const values = { ...currentValues };
    const plan = Array.isArray(interventionPlan) ? interventionPlan : [];
    const planText = plan.map(item => String(item?.title || item?.action || item)).join(' ').toLowerCase();

    const copy = { ...values };
    let riskDelta = 0;

    if (/glucose|glycaemic|diet|walk|exercise|millet|post-meal/.test(planText)) {
      copy.glucose_fasting = adjust(copy.glucose_fasting, -6, -14);
      copy.hba1c = adjust(copy.hba1c, -0.2, -0.5);
      riskDelta += 8;
    }

    if (/cholesterol|lipid|fiber|oats|nuts|omega-3|walk/.test(planText)) {
      copy.cholesterol_total = adjust(copy.cholesterol_total, -8, -18);
      copy.triglycerides = adjust(copy.triglycerides, -12, -28);
      copy.cholesterol_hdl = adjust(copy.cholesterol_hdl, 2, 5);
      riskDelta += 6;
    }

    if (/vitamin d|sunlight|supplement/.test(planText)) {
      copy.vitaminD = adjust(copy.vitaminD, 6, 14);
      riskDelta += 4;
    }

    if (/b12|b-12|supplement/.test(planText)) {
      copy.vitaminB12 = adjust(copy.vitaminB12, 40, 120);
      riskDelta += 3;
    }

    if (/sleep/.test(planText)) {
      riskDelta += 2;
    }

    const currentRiskScore = estimateRiskFromValues(values);
    const projectedRiskScore = Math.max(0, Math.min(100, currentRiskScore - riskDelta));

    return {
      before: {
        riskScore: currentRiskScore,
        values
      },
      after: {
        riskScore: projectedRiskScore,
        values: copy
      },
      deltas: buildDeltas(values, copy),
      summary: 'Projected changes are directional and intended for demo use. They show the likely effect of following the recommended plan for 30 days.'
    };
  }

  function adjust(value, minDelta, maxDelta) {
    const num = Number(value);
    if (!Number.isFinite(num)) return value;
    const delta = (minDelta + maxDelta) / 2;
    const result = num + delta;
    return Number.isFinite(result) ? Number(result.toFixed(1)) : value;
  }

  function estimateRiskFromValues(values) {
    let score = 15;
    const g = Number(values.glucose_fasting);
    const a = Number(values.hba1c);
    const c = Number(values.cholesterol_total);
    const t = Number(values.triglycerides);
    const d = Number(values.vitaminD);

    if (Number.isFinite(g) && g >= 96) score += 12;
    if (Number.isFinite(a) && a >= 5.7) score += 15;
    if (Number.isFinite(c) && c >= 180) score += 8;
    if (Number.isFinite(t) && t >= 150) score += 10;
    if (Number.isFinite(d) && d <= 20) score += 8;

    return Math.min(100, score);
  }

  function buildDeltas(before, after) {
    const keys = ['glucose_fasting', 'hba1c', 'cholesterol_total', 'triglycerides', 'vitaminD', 'vitaminB12', 'tsh'];
    return keys.map(key => {
      const prev = before[key];
      const next = after[key];
      if (prev === undefined || prev === null || next === undefined || next === null) return null;
      return { key, before: prev, after: next, delta: Number((next - prev).toFixed(1)) };
    }).filter(Boolean);
  }

  return { simulateOutcome };
})();

export default OutcomeSimulator;
