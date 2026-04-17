// explainability.js
// Plain-language risk explanations and recommendation context.

const Explainability = (() => {
  function explainRisk(labValue, threshold, condition) {
    const value = Number(labValue);
    const limit = Number(threshold);
    const delta = Number.isFinite(value) && Number.isFinite(limit) ? value - limit : null;
    const pct = Number.isFinite(value) && Number.isFinite(limit) && limit !== 0 ? Math.round((Math.abs(delta) / limit) * 100) : null;

    let whyThisMatters = '';
    let whyRecommendation = '';

    switch (String(condition || '').toLowerCase()) {
      case 'prediabetes':
      case 'glucose':
      case 'hba1c':
        whyThisMatters = 'Blood sugar that stays near the threshold often rises quietly for years before symptoms appear.';
        whyRecommendation = 'A low-glycaemic diet, post-meal walking, and repeat testing help catch the pattern before it becomes diabetes.';
        break;
      case 'cholesterol':
      case 'ldl':
      case 'triglycerides':
        whyThisMatters = 'Cholesterol and triglyceride trends are strongly linked to long-term heart and vessel risk.';
        whyRecommendation = 'Dietary fat quality, fiber, and activity changes can improve the lipid pattern without overpromising medication changes.';
        break;
      case 'vitamind':
      case 'b12':
      case 'nutrition':
        whyThisMatters = 'Low vitamin levels can affect energy, immunity, and how other metabolic risks develop.';
        whyRecommendation = 'Targeted correction and retesting are recommended because these deficiencies are common and reversible.';
        break;
      case 'thyroid':
      case 'tsh':
        whyThisMatters = 'Thyroid changes can quietly worsen fatigue, weight, and cholesterol balance.';
        whyRecommendation = 'Follow-up testing is advised because early thyroid drift is often manageable if found before symptoms escalate.';
        break;
      default:
        whyThisMatters = 'This marker is close enough to a clinical threshold that the pattern should not be ignored.';
        whyRecommendation = 'The recommendation exists to reduce uncertainty, improve follow-up, and prevent silent progression.';
    }

    return {
      condition,
      threshold: limit,
      value,
      delta,
      percentFromThreshold: pct,
      whyThisMatters,
      whyRecommendation
    };
  }

  function explainFinding(finding, threshold, condition) {
    return explainRisk(finding?.value ?? finding?.score ?? null, threshold, condition);
  }

  return {
    explainRisk,
    explainFinding
  };
})();

export default Explainability;
