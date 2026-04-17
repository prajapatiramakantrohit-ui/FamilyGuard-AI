// modelPerformance.js
// Mock model-quality dashboard derived from a labeled dataset.

const ModelPerformance = (() => {
  async function loadMockDataset() {
    const res = await fetch('./mockLabDataset.json');
    if (!res.ok) throw new Error('Could not load mockLabDataset.json');
    return res.json();
  }

  function calculateMetrics(records = []) {
    const total = records.length || 1;
    let extractedCorrect = 0;
    let extractedTotal = 0;
    let riskTruePositive = 0;
    let riskPredictedPositive = 0;
    let riskActualPositive = 0;

    for (const record of records) {
      const extraction = record.extraction || {};
      const truth = record.truth || {};
      const prediction = record.prediction || {};

      for (const key of Object.keys(truth)) {
        if (truth[key] !== null && truth[key] !== undefined) {
          extractedTotal += 1;
          if (String(truth[key]) === String(extraction[key])) extractedCorrect += 1;
        }
      }

      const actualRisk = truth.riskLevel && truth.riskLevel !== 'LOW';
      const predictedRisk = prediction.riskLevel && prediction.riskLevel !== 'LOW';

      if (actualRisk) riskActualPositive += 1;
      if (predictedRisk) riskPredictedPositive += 1;
      if (actualRisk && predictedRisk) riskTruePositive += 1;
    }

    const extractionAccuracy = extractedTotal ? (extractedCorrect / extractedTotal) * 100 : 0;
    const precision = riskPredictedPositive ? (riskTruePositive / riskPredictedPositive) * 100 : 0;
    const recall = riskActualPositive ? (riskTruePositive / riskActualPositive) * 100 : 0;

    return {
      extractionAccuracy: Number(extractionAccuracy.toFixed(1)),
      riskPrecision: Number(precision.toFixed(1)),
      riskRecall: Number(recall.toFixed(1)),
      sampleSize: total
    };
  }

  function renderMetrics(containerId, metrics) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="dashboard-strip">
        <div class="dashboard-panel dashboard-panel--accent">
          <div class="dashboard-panel-label">Extraction accuracy</div>
          <div class="dashboard-panel-value">${metrics.extractionAccuracy}%</div>
          <div class="dashboard-panel-meta">Calculated from ${metrics.sampleSize} labeled reports</div>
        </div>
        <div class="dashboard-panel">
          <div class="dashboard-panel-label">Risk precision</div>
          <div class="dashboard-panel-value">${metrics.riskPrecision}%</div>
          <div class="dashboard-panel-meta">How often high-risk flags were correct</div>
        </div>
        <div class="dashboard-panel">
          <div class="dashboard-panel-label">Risk recall</div>
          <div class="dashboard-panel-value">${metrics.riskRecall}%</div>
          <div class="dashboard-panel-meta">How many true risk cases were caught</div>
        </div>
      </div>`;
  }

  return {
    loadMockDataset,
    calculateMetrics,
    renderMetrics
  };
})();

export default ModelPerformance;
