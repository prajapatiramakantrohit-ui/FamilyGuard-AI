// modules/riskEngine.js
// Core risk calculation engine using Indian-specific thresholds

const RiskEngine = (() => {
  let thresholds = null;

  async function loadThresholds() {
    if (thresholds) return thresholds;
    try {
      const res = await fetch('./indianThresholds.json');
      thresholds = await res.json();
    } catch (e) {
      // Inline fallback thresholds
      thresholds = {
        glucose_fasting: { prediabetes_start: 96, diabetes_start: 126, normal_max: 95 },
        hba1c: { prediabetes_start: 5.7, diabetes_start: 6.5, normal_max: 5.6 },
        cholesterol_total: { indian_normal_max: 180, high_start: 200 },
        cholesterol_ldl: { borderline_start: 130, high_start: 160 },
        cholesterol_hdl: { low_max: 40 },
        triglycerides: { high_start: 150, very_high_start: 200 },
        vitaminD: { deficient_max: 20, insufficient_max: 29 },
        vitaminB12: { deficient_max: 200, low_max: 300 },
        tsh: { normal_min: 0.4, normal_max: 4.0, subclinical_hypo_start: 4.1, overt_hypo_start: 10.0 },
        hemoglobin: { anemia_male_max: 12.9, anemia_female_max: 11.9 },
        creatinine: { normal_male_max: 1.2, normal_female_max: 1.1 },
        uric_acid: { normal_male_max: 7.0, normal_female_max: 6.0 }
      };
    }
    return thresholds;
  }

  function calcBMI(weight, height) {
    if (!weight || !height) return null;
    const hm = height / 100;
    return weight / (hm * hm);
  }

  // Returns { score: 0-100, severity: 'normal'|'borderline'|'high'|'critical', label }
  function scoreGlucose(val) {
    if (!val) return null;
    const t = thresholds.glucose_fasting;
    if (val < t.prediabetes_start) return { score: 0, severity: 'normal', label: `${val} mg/dL — Normal` };
    if (val < t.diabetes_start) {
      const s = Math.min(100, ((val - t.prediabetes_start) / (t.diabetes_start - t.prediabetes_start)) * 60 + 30);
      const borderline = val <= t.prediabetes_start * 1.1;
      return { score: s, severity: borderline ? 'borderline' : 'high', label: `${val} mg/dL — Pre-diabetic` };
    }
    return { score: 95, severity: 'critical', label: `${val} mg/dL — Diabetic Range` };
  }

  function scoreHba1c(val) {
    if (!val) return null;
    const t = thresholds.hba1c;
    if (val <= t.normal_max) return { score: 0, severity: 'normal', label: `${val}% — Normal` };
    if (val < t.diabetes_start) {
      const s = Math.min(100, ((val - t.prediabetes_start) / (t.diabetes_start - t.prediabetes_start)) * 55 + 30);
      return { score: s, severity: val <= 5.9 ? 'borderline' : 'high', label: `${val}% — Pre-diabetic` };
    }
    return { score: 92, severity: 'critical', label: `${val}% — Diabetic Range` };
  }

  function scoreCholesterolTotal(val) {
    if (!val) return null;
    const t = thresholds.cholesterol_total;
    if (val <= t.indian_normal_max) return { score: 0, severity: 'normal', label: `${val} mg/dL — Normal (Indian std)` };
    if (val <= t.high_start) {
      const s = ((val - t.indian_normal_max) / (t.high_start - t.indian_normal_max)) * 50 + 20;
      return { score: s, severity: 'borderline', label: `${val} mg/dL — Borderline High` };
    }
    return { score: 75, severity: 'high', label: `${val} mg/dL — High` };
  }

  function scoreLDL(val) {
    if (!val) return null;
    const t = thresholds.cholesterol_ldl;
    if (val < t.borderline_start) return { score: 0, severity: 'normal', label: `${val} mg/dL — Optimal` };
    if (val < t.high_start) {
      const s = ((val - t.borderline_start) / (t.high_start - t.borderline_start)) * 45 + 25;
      return { score: s, severity: 'borderline', label: `${val} mg/dL — Borderline High` };
    }
    return { score: 72, severity: 'high', label: `${val} mg/dL — High` };
  }

  function scoreHDL(val, gender) {
    if (!val) return null;
    const t = thresholds.cholesterol_hdl;
    if (val <= t.low_max) return { score: 60, severity: 'high', label: `${val} mg/dL — Low (Risk Factor)` };
    if (val <= 50) return { score: 25, severity: 'borderline', label: `${val} mg/dL — Below Optimal` };
    return { score: 0, severity: 'normal', label: `${val} mg/dL — Protective` };
  }

  function scoreTriglycerides(val) {
    if (!val) return null;
    const t = thresholds.triglycerides;
    if (val < t.high_start) return { score: val > 130 ? 15 : 0, severity: 'normal', label: `${val} mg/dL — Normal` };
    if (val < t.very_high_start) {
      const s = ((val - t.high_start) / (t.very_high_start - t.high_start)) * 45 + 30;
      return { score: s, severity: 'high', label: `${val} mg/dL — High` };
    }
    return { score: 82, severity: 'critical', label: `${val} mg/dL — Very High` };
  }

  function scoreVitaminD(val) {
    if (!val) return null;
    const t = thresholds.vitaminD;
    if (val <= t.deficient_max) return { score: 65, severity: 'critical', label: `${val} ng/mL — Deficient` };
    if (val <= t.insufficient_max) return { score: 35, severity: 'high', label: `${val} ng/mL — Insufficient` };
    return { score: 0, severity: 'normal', label: `${val} ng/mL — Sufficient` };
  }

  function scoreVitaminB12(val) {
    if (!val) return null;
    const t = thresholds.vitaminB12;
    if (val <= t.deficient_max) return { score: 60, severity: 'critical', label: `${val} pg/mL — Deficient` };
    if (val <= t.low_max) return { score: 30, severity: 'borderline', label: `${val} pg/mL — Low` };
    return { score: 0, severity: 'normal', label: `${val} pg/mL — Normal` };
  }

  function scoreTSH(val) {
    if (!val) return null;
    const t = thresholds.tsh;
    if (val >= t.normal_min && val <= t.normal_max) return { score: 0, severity: 'normal', label: `${val} mIU/L — Normal` };
    if (val < t.normal_min) return { score: 40, severity: 'high', label: `${val} mIU/L — Low (Hyperthyroid)` };
    if (val < t.overt_hypo_start) {
      const s = ((val - t.subclinical_hypo_start) / (t.overt_hypo_start - t.subclinical_hypo_start)) * 40 + 35;
      return { score: s, severity: 'borderline', label: `${val} mIU/L — Subclinical Hypothyroid` };
    }
    return { score: 80, severity: 'critical', label: `${val} mIU/L — Overt Hypothyroid` };
  }

  function scoreHemoglobin(val, gender) {
    if (!val) return null;
    const t = thresholds.hemoglobin;
    const cutoff = gender === 'female' ? t.anemia_female_max : t.anemia_male_max;
    if (val <= cutoff) return { score: 55, severity: 'high', label: `${val} g/dL — Anemia` };
    if (val <= cutoff + 1.5) return { score: 20, severity: 'borderline', label: `${val} g/dL — Low-Normal` };
    return { score: 0, severity: 'normal', label: `${val} g/dL — Normal` };
  }

  function scoreCreatinine(val, gender) {
    if (!val) return null;
    const t = thresholds.creatinine;
    const normalMax = gender === 'female' ? t.normal_female_max : t.normal_male_max;
    const highStart = gender === 'female' ? (t.high_start_female ?? normalMax + 0.1) : (t.high_start_male ?? normalMax + 0.1);

    if (val <= normalMax) return { score: 0, severity: 'normal', label: `${val} mg/dL — Normal` };
    if (val < highStart) return { score: 35, severity: 'borderline', label: `${val} mg/dL — Borderline High` };
    if (val <= highStart + 0.4) return { score: 60, severity: 'high', label: `${val} mg/dL — High` };
    return { score: 85, severity: 'critical', label: `${val} mg/dL — Very High` };
  }

  function scoreUricAcid(val, gender) {
    if (!val) return null;
    const t = thresholds.uric_acid;
    const normalMax = gender === 'female' ? t.normal_female_max : t.normal_male_max;
    const highStart = gender === 'female' ? (t.high_start_female ?? normalMax + 0.1) : (t.high_start_male ?? normalMax + 0.1);

    if (val <= normalMax) return { score: 0, severity: 'normal', label: `${val} mg/dL — Normal` };
    if (val < highStart + 0.7) return { score: 30, severity: 'borderline', label: `${val} mg/dL — Borderline High` };
    if (val < highStart + 1.5) return { score: 55, severity: 'high', label: `${val} mg/dL — High` };
    return { score: 78, severity: 'critical', label: `${val} mg/dL — Very High` };
  }

  function scoreLifestyle(profile) {
    let score = 0;
    const flags = [];

    // BMI risk (Indian BMI cutoffs are lower: 23 = overweight, 27.5 = obese)
    const bmi = calcBMI(profile.weight, profile.height);
    if (bmi) {
      if (bmi >= 27.5) { score += 20; flags.push(`High BMI ${bmi.toFixed(1)} (Indian threshold: 27.5)`); }
      else if (bmi >= 23) { score += 10; flags.push(`Overweight BMI ${bmi.toFixed(1)} (Indian threshold: 23)`); }
    }

    // Sleep
    const sleep = parseFloat(profile.sleep);
    if (sleep < 5) { score += 18; flags.push('Severely sleep deprived (<5h)'); }
    else if (sleep < 7) { score += 10; flags.push('Insufficient sleep (<7h)'); }

    // Stress
    const stress = parseInt(profile.stress);
    if (stress >= 8) { score += 18; flags.push('Chronic high stress (8-10/10)'); }
    else if (stress >= 6) { score += 10; flags.push('Elevated stress (6-7/10)'); }

    // Activity
    const activity = parseInt(profile.activity);
    if (activity <= 2) { score += 18; flags.push('Sedentary lifestyle (1-2/10)'); }
    else if (activity <= 4) { score += 10; flags.push('Low physical activity (3-4/10)'); }

    // Age
    const age = parseInt(profile.age);
    if (age >= 50) score += 10;
    else if (age >= 40) score += 5;

    return { score: Math.min(100, score), flags };
  }

  function detectBorderlineValues(labValues, gender) {
    const borderlines = [];
    const t = thresholds;

    const checks = [
      {
        key: 'glucose_fasting', val: labValues.glucose_fasting, label: 'Fasting Glucose',
        check: (v) => v >= t.glucose_fasting.prediabetes_start && v <= t.glucose_fasting.prediabetes_start * 1.1,
        message: 'Glucose borderline — within 10% of pre-diabetic threshold'
      },
      {
        key: 'hba1c', val: labValues.hba1c, label: 'HbA1c',
        check: (v) => v >= t.hba1c.prediabetes_start && v <= t.hba1c.prediabetes_start * 1.1,
        message: 'HbA1c borderline — early glycemic dysregulation'
      },
      {
        key: 'cholesterol_total', val: labValues.cholesterol_total, label: 'Total Cholesterol',
        check: (v) => v >= t.cholesterol_total.indian_normal_max && v <= t.cholesterol_total.indian_normal_max * 1.1,
        message: 'Cholesterol marginally above Indian normal — trending high'
      },
      {
        key: 'triglycerides', val: labValues.triglycerides, label: 'Triglycerides',
        check: (v) => v >= t.triglycerides.high_start && v <= t.triglycerides.high_start * 1.1,
        message: 'Triglycerides borderline — metabolic stress indicator'
      },
      {
        key: 'tsh', val: labValues.tsh, label: 'TSH',
        check: (v) => v >= t.tsh.subclinical_hypo_start && v <= t.tsh.subclinical_hypo_start * 1.15,
        message: 'TSH slightly elevated — subclinical hypothyroidism'
      },
      {
        key: 'vitaminD', val: labValues.vitaminD, label: 'Vitamin D',
        check: (v) => v <= t.vitaminD.deficient_max * 1.1 && v > t.vitaminD.deficient_max,
        message: 'Vitamin D borderline deficient'
      }
    ];

    for (const c of checks) {
      if (c.val !== null && c.val !== undefined && c.check(c.val)) {
        borderlines.push({ key: c.key, label: c.label, value: c.val, message: c.message });
      }
    }

    return borderlines;
  }

  async function calculateRisk(profile, labValues) {
    await loadThresholds();

    const gender = profile.gender || 'male';

    // Score each lab value
    const labScores = {
      glucose: scoreGlucose(labValues.glucose_fasting),
      hba1c: scoreHba1c(labValues.hba1c),
      cholTotal: scoreCholesterolTotal(labValues.cholesterol_total),
      ldl: scoreLDL(labValues.cholesterol_ldl),
      hdl: scoreHDL(labValues.cholesterol_hdl, gender),
      triglycerides: scoreTriglycerides(labValues.triglycerides),
      vitaminD: scoreVitaminD(labValues.vitaminD),
      vitaminB12: scoreVitaminB12(labValues.vitaminB12),
      tsh: scoreTSH(labValues.tsh),
      hemoglobin: scoreHemoglobin(labValues.hemoglobin, gender),
      creatinine: scoreCreatinine(labValues.creatinine, gender),
      uricAcid: scoreUricAcid(labValues.uric_acid, gender)
    };

    // Category scores (0-100, higher = worse)
    const metabolic = weightedAvg([
      { score: labScores.glucose, w: 25 },
      { score: labScores.hba1c, w: 20 },
      { score: labScores.triglycerides, w: 20 },
      { score: labScores.hdl, w: 15 },
      { score: labScores.creatinine, w: 10 },
      { score: labScores.uricAcid, w: 10 }
    ]);

    const cardiovascular = weightedAvg([
      { score: labScores.cholTotal, w: 35 },
      { score: labScores.ldl, w: 35 },
      { score: labScores.hdl, w: 20 },
      { score: labScores.triglycerides, w: 10 }
    ]);

    const thyroid = weightedAvg([
      { score: labScores.tsh, w: 100 }
    ]);

    const nutritional = weightedAvg([
      { score: labScores.vitaminD, w: 50 },
      { score: labScores.vitaminB12, w: 30 },
      { score: labScores.hemoglobin, w: 20 }
    ]);

    const lifestyle = scoreLifestyle(profile);

    // Overall score (inverted — higher = worse → convert to 0-100 health score where 100 is best)
    const rawRisk = (metabolic * 0.30) + (cardiovascular * 0.25) + (thyroid * 0.15) + (nutritional * 0.20) + (lifestyle.score * 0.10);
    const overallScore = Math.max(0, Math.min(100, Math.round(100 - rawRisk)));

    // Risk level
    let riskLevel;
    if (overallScore >= 75) riskLevel = 'LOW';
    else if (overallScore >= 50) riskLevel = 'MEDIUM';
    else if (overallScore >= 30) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    // Borderline detection
    const borderlineValues = detectBorderlineValues(labValues, gender);

    // Build detailed findings
    const findings = [];
    for (const [key, scored] of Object.entries(labScores)) {
      if (scored && scored.severity !== 'normal') {
        findings.push({ key, ...scored });
      }
    }
    findings.sort((a, b) => b.score - a.score);

    return {
      overallScore,
      riskLevel,
      categoryScores: {
        metabolic: Math.round(metabolic),
        cardiovascular: Math.round(cardiovascular),
        thyroid: Math.round(thyroid),
        nutritional: Math.round(nutritional),
        lifestyle: Math.round(lifestyle.score)
      },
      findings,
      borderlineValues,
      lifestyleFlags: lifestyle.flags,
      labScores,
      bmi: calcBMI(profile.weight, profile.height)
    };
  }

  function weightedAvg(items) {
    let total = 0, weightSum = 0;
    for (const item of items) {
      if (item.score !== null && item.score !== undefined) {
        total += item.score.score * item.w;
        weightSum += item.w;
      }
    }
    return weightSum > 0 ? total / weightSum : 0;
  }

  return {
    calculateRisk,
    calcBMI,
    loadThresholds
  };
})();

export default RiskEngine;
