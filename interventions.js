// modules/interventions.js
// Generates evidence-based interventions based on risk profile

const Interventions = (() => {
  const interventionDB = {
    high_glucose: {
      priority: 1,
      title: 'Blood Sugar Stabilization Protocol',
      icon: '🩸',
      action: 'Replace white rice/maida with millets (bajra, jowar, ragi) for main meals. Walk 15–20 minutes after each meal. Avoid fruit juices — eat whole fruits instead.',
      impact: 'Can reduce fasting glucose by 10–20 mg/dL within 4–6 weeks',
      timeline: 'Visible improvement in 6 weeks',
      category: 'metabolic'
    },
    high_hba1c: {
      priority: 1,
      title: '3-Month Glycemic Reset',
      icon: '📊',
      action: 'Track your plate: fill half with non-starchy vegetables, one quarter protein, one quarter complex carbs. Eliminate all sugary drinks and packaged snacks. Consult a diabetologist to monitor.',
      impact: 'HbA1c reduction of 0.5–1.5% achievable through diet alone',
      timeline: 'HbA1c reflects 3-month average — retest in 90 days',
      category: 'metabolic'
    },
    low_hdl: {
      priority: 2,
      title: 'HDL Elevation Plan',
      icon: '❤️',
      action: 'Add 2 tablespoons of cold-pressed coconut or olive oil daily. 30-minute brisk walk or cycling 5x/week. Add 1 serving of nuts (almonds/walnuts) daily. Stop smoking if applicable.',
      impact: 'HDL increase of 5–10 mg/dL within 8–12 weeks',
      timeline: '2–3 months for measurable change',
      category: 'cardiovascular'
    },
    high_triglycerides: {
      priority: 2,
      title: 'Triglyceride Reduction Protocol',
      icon: '🫀',
      action: 'Reduce alcohol, sugary foods, and refined carbohydrates for 8 weeks. Add omega-3 rich foods such as fatty fish. Discuss whether supplementation is appropriate with your physician.',
      impact: 'Triglycerides can drop 20–50% with dietary changes alone',
      timeline: '4–8 weeks for significant reduction',
      category: 'cardiovascular'
    },
    high_cholesterol: {
      priority: 2,
      title: 'Lipid Profile Improvement',
      icon: '🫁',
      action: 'Increase soluble fiber: 1 cup oats daily, 2 servings of beans/lentils. Replace saturated fats with unsaturated fats. Limit red meat to once weekly. Follow up with physician for statin evaluation if >200 mg/dL.',
      impact: 'LDL reduction of 10–15% achievable without medication',
      timeline: '6–8 weeks to see lipid panel changes',
      category: 'cardiovascular'
    },
    low_vitaminD: {
      priority: 1,
      title: 'Vitamin D Emergency Correction',
      icon: '☀️',
      action: 'Consult your doctor promptly for an individualized Vitamin D correction plan. Include safe morning sunlight exposure and Vitamin D-rich foods such as egg yolk, fatty fish, and fortified milk.',
      impact: 'Improves insulin sensitivity, immunity, mood, and thyroid function',
      timeline: 'Levels correctable in 8–12 weeks with proper supplementation',
      category: 'nutritional'
    },
    low_vitaminB12: {
      priority: 1,
      title: 'Vitamin B12 Neurological Protection',
      icon: '🧠',
      action: 'Consult your doctor for an individualized B12 correction strategy. Dietary support includes dairy, eggs, and meat/fish where applicable. Strict vegetarians/vegans typically need supervised supplementation.',
      impact: 'Prevents permanent neurological damage, improves energy and cognitive function',
      timeline: 'Serum levels improve in 4–6 weeks; neurological symptoms in 3–6 months',
      category: 'nutritional'
    },
    high_tsh: {
      priority: 2,
      title: 'Thyroid Function Optimization',
      icon: '🦋',
      action: 'Consult an endocrinologist — subclinical hypothyroidism often requires monitoring or treatment. Ensure adequate iodine (iodized salt). Reduce goitrogenic foods: raw cabbage, cauliflower. Selenium-rich foods: 2 Brazil nuts daily.',
      impact: 'Treating subclinical hypothyroidism improves energy, metabolism, and cholesterol',
      timeline: 'TSH monitoring needed every 3–6 months',
      category: 'thyroid'
    },
    poor_sleep: {
      priority: 2,
      title: 'Sleep Architecture Repair',
      icon: '😴',
      action: 'Set a fixed sleep time (10:30pm). No screens 1 hour before bed. Keep room at 18–21°C. Avoid caffeine after 2pm. If sleep disorder suspected, request a sleep study.',
      impact: 'Each additional hour of sleep reduces cortisol, blood sugar, and cardiovascular risk',
      timeline: 'Metabolic benefits measurable in 2–3 weeks',
      category: 'lifestyle'
    },
    high_stress: {
      priority: 2,
      title: 'Cortisol Regulation Protocol',
      icon: '🧘',
      action: 'Daily 10-minute diaphragmatic breathing (4-7-8 technique). 20-minute walk in nature. Weekly social connection. Consider professional counseling if stress score remains >7.',
      impact: 'Chronic stress adds 15–20 points to cardiovascular risk independently',
      timeline: 'Cortisol reduction measurable in 4–6 weeks',
      category: 'lifestyle'
    },
    sedentary: {
      priority: 2,
      title: 'Movement Integration Plan',
      icon: '🏃',
      action: 'Start with 7,000 steps/day using a pedometer. Add 2x/week resistance training (bodyweight is sufficient). Post-meal 15-minute walks are the single highest-impact intervention for glucose control.',
      impact: 'Exercise equivalent to 1.5 points of HbA1c reduction and 10% cardiovascular risk reduction',
      timeline: 'Glucose improvements in 2 weeks; lipid changes in 8 weeks',
      category: 'lifestyle'
    },
    anemia: {
      priority: 1,
      title: 'Anemia Correction Plan',
      icon: '💉',
      action: 'Consult doctor for complete iron studies (serum ferritin, TIBC). Iron-rich foods: spinach, lentils, jaggery, meat. Combine with Vitamin C for absorption. Avoid tea/coffee within 1 hour of iron-rich meals.',
      impact: 'Correcting anemia improves energy, cognitive function, and exercise tolerance',
      timeline: 'Hemoglobin improvement in 6–8 weeks with treatment',
      category: 'nutritional'
    }
  };

  function selectInterventions(riskResult, profile) {
    const selected = [];
    const { categoryScores, labScores, lifestyleFlags, findings } = riskResult;

    // Map findings to interventions
    const mapping = {
      glucose: 'high_glucose',
      hba1c: 'high_hba1c',
      hdl: 'low_hdl',
      triglycerides: 'high_triglycerides',
      cholTotal: 'high_cholesterol',
      vitaminD: 'low_vitaminD',
      vitaminB12: 'low_vitaminB12',
      tsh: 'high_tsh',
      hemoglobin: 'anemia'
    };

    // Add interventions for abnormal findings (sorted by severity)
    const sortedFindings = [...(findings || [])].sort((a, b) => b.score - a.score);
    for (const finding of sortedFindings) {
      const intKey = mapping[finding.key];
      if (intKey && interventionDB[intKey] && !selected.find(s => s.key === intKey)) {
        selected.push({ key: intKey, ...interventionDB[intKey], score: finding.score });
      }
    }

    // Add lifestyle interventions
    const sleep = parseFloat(profile.sleep);
    const stress = parseInt(profile.stress);
    const activity = parseInt(profile.activity);

    if (sleep < 7 && !selected.find(s => s.key === 'poor_sleep')) {
      selected.push({ key: 'poor_sleep', ...interventionDB.poor_sleep, score: (7 - sleep) * 15 });
    }
    if (stress >= 7 && !selected.find(s => s.key === 'high_stress')) {
      selected.push({ key: 'high_stress', ...interventionDB.high_stress, score: stress * 8 });
    }
    if (activity <= 4 && !selected.find(s => s.key === 'sedentary')) {
      selected.push({ key: 'sedentary', ...interventionDB.sedentary, score: (5 - activity) * 12 });
    }

    // Sort by score and return top 3
    selected.sort((a, b) => (b.score || 0) - (a.score || 0));
    return selected.slice(0, 3).map((item, idx) => ({
      ...item,
      priority: idx + 1
    }));
  }

  function getDefaultInterventions() {
    return [
      { priority: 1, ...interventionDB.high_glucose },
      { priority: 2, ...interventionDB.low_vitaminD },
      { priority: 3, ...interventionDB.sedentary }
    ];
  }

  return {
    selectInterventions,
    getDefaultInterventions
  };
})();

export default Interventions;
