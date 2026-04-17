// modules/ui.js
// UI rendering helpers and component builders

const UI = (() => {
  // ── Gauge ──────────────────────────────────────────────────────────────────
  function drawGauge(canvasId, score, riskLevel) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H * 0.62;
    const radius = Math.min(W, H) * 0.38;

    ctx.clearRect(0, 0, W, H);

    // Gradient arc background
    const startAngle = Math.PI;
    const endAngle = 0;
    const segments = [
      { color: '#ff4444', from: 0, to: 0.25 },
      { color: '#ff6b35', from: 0.25, to: 0.50 },
      { color: '#ffb347', from: 0.50, to: 0.75 },
      { color: '#00d084', from: 0.75, to: 1.0 }
    ];

    // Draw background track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 0, false);
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#1a1a2e';
    ctx.stroke();

    // Draw colored segments
    for (const seg of segments) {
      const a1 = Math.PI + seg.from * Math.PI;
      const a2 = Math.PI + seg.to * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, a1, a2, false);
      ctx.lineWidth = 18;
      ctx.strokeStyle = seg.color;
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Animated needle
    const angle = Math.PI + (score / 100) * Math.PI;
    const fillColor = getRiskColor(riskLevel);

    // Draw filled arc up to score
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, angle, false);
    ctx.lineWidth = 18;
    ctx.strokeStyle = fillColor;
    ctx.shadowColor = fillColor;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Needle
    const needleLen = radius * 0.85;
    const nx = cx + needleLen * Math.cos(angle);
    const ny = cy + needleLen * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Score text
    ctx.fillStyle = fillColor;
    ctx.font = `bold ${W * 0.13}px 'Space Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score, cx, cy - radius * 0.28);

    // Label
    ctx.fillStyle = '#888';
    ctx.font = `${W * 0.055}px 'Space Mono', monospace`;
    ctx.fillText('HEALTH SCORE', cx, cy - radius * 0.28 + W * 0.095);

    // Labels
    ctx.fillStyle = '#555';
    ctx.font = `${W * 0.04}px monospace`;
    ctx.fillText('CRITICAL', cx - radius * 0.92, cy + 20);
    ctx.fillText('OPTIMAL', cx + radius * 0.72, cy + 20);
  }

  function getRiskColor(level) {
    const map = { LOW: '#00d084', MEDIUM: '#ffb347', HIGH: '#ff6b35', CRITICAL: '#ff4444' };
    return map[level] || '#888';
  }

  // ── Timeline Chart ─────────────────────────────────────────────────────────
  let timelineChart = null;

  function drawTimelineChart(canvasId, timelineData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;

    if (timelineChart) {
      timelineChart.destroy();
      timelineChart = null;
    }

    const labels = ['Now', '1 Year', '3 Years', '5 Years', '10 Years'];
    const currentRisk = 100 - (timelineData.current || 70);
    const data = [
      currentRisk,
      timelineData['1_year'] || Math.min(95, currentRisk + 5),
      timelineData['3_years'] || Math.min(95, currentRisk + 15),
      timelineData['5_years'] || Math.min(95, currentRisk + 25),
      timelineData['10_years'] || Math.min(95, currentRisk + 40)
    ];

    const gradient = canvas.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(255, 68, 68, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 68, 68, 0.0)');

    timelineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Disease Risk %',
          data,
          borderColor: '#ff4444',
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointBackgroundColor: '#ff4444',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#12121a',
            borderColor: '#ff4444',
            borderWidth: 1,
            titleColor: '#ff4444',
            bodyColor: '#ccc',
            callbacks: {
              label: (ctx) => ` Disease Risk: ${ctx.parsed.y.toFixed(0)}%`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#666', font: { family: 'Space Mono', size: 10 } }
          },
          y: {
            min: 0, max: 100,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#666',
              font: { family: 'Space Mono', size: 10 },
              callback: v => `${v}%`
            }
          }
        }
      }
    });
  }

  // ── Category Bars ──────────────────────────────────────────────────────────
  function renderCategoryBars(containerId, categoryScores) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const categories = [
      { key: 'metabolic', label: 'Metabolic', icon: '🩸' },
      { key: 'cardiovascular', label: 'Cardiovascular', icon: '❤️' },
      { key: 'thyroid', label: 'Thyroid', icon: '🦋' },
      { key: 'nutritional', label: 'Nutritional', icon: '🌿' },
      { key: 'lifestyle', label: 'Lifestyle', icon: '⚡' }
    ];

    container.innerHTML = categories.map(cat => {
      const raw = categoryScores[cat.key] || 0;
      const pct = Math.min(100, raw);
      const color = pct >= 70 ? '#ff4444' : pct >= 40 ? '#ffb347' : '#00d084';
      const label = pct >= 70 ? 'HIGH' : pct >= 40 ? 'ELEVATED' : 'NORMAL';
      return `
        <div class="category-bar-item">
          <div class="cat-header">
            <span class="cat-icon">${cat.icon}</span>
            <span class="cat-label">${cat.label}</span>
            <span class="cat-status" style="color:${color}">${label}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:0%;background:${color}" data-target="${pct}"></div>
          </div>
        </div>`;
    }).join('');

    // Animate bars
    requestAnimationFrame(() => {
      container.querySelectorAll('.bar-fill').forEach(bar => {
        const target = bar.dataset.target;
        setTimeout(() => {
          bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
          bar.style.width = target + '%';
        }, 100);
      });
    });
  }

  // ── Family Grid ────────────────────────────────────────────────────────────
  function renderFamilyGrid(containerId, profiles, onRemove) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!profiles.length) {
      container.innerHTML = `
        <div class="family-empty">
          <div class="family-empty-icon">👨‍👩‍👧‍👦</div>
          <p>No family members added yet.<br>Complete an analysis and save the profile.</p>
        </div>`;
      return;
    }

    container.innerHTML = profiles.map(p => {
      const color = getRiskColor(p.riskLevel);
      const date = new Date(p.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
      const initials = (p.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      const history = Array.isArray(p.history) ? p.history : [];
      const trend = history.length >= 2 ? history[history.length - 1].overallScore - history[history.length - 2].overallScore : null;
      const trendLabel = trend === null ? '' : trend === 0 ? 'No change' : `${trend > 0 ? '+' : ''}${trend} vs last`; 
      const trendColor = trend === null ? '#666' : trend > 0 ? '#00d084' : trend < 0 ? '#ff6b35' : '#888';
      return `
        <div class="family-card" style="--accent:${color}">
          <div class="family-avatar" style="background:${color}22;border-color:${color}44">${initials}</div>
          <div class="family-info">
            <div class="family-name">${escapeHtml(p.name)}</div>
            <div class="family-meta">${p.age}y · ${p.gender || '—'} · ${date}</div>
            <div class="family-score">
              <span class="score-badge" style="color:${color};border-color:${color}44">${p.overallScore}/100</span>
              <span class="risk-badge" style="background:${color}22;color:${color}">${p.riskLevel}</span>
            </div>
            ${trendLabel ? `<div class="family-bmi" style="color:${trendColor}">Trend: ${trendLabel}</div>` : ''}
            ${p.bmi ? `<div class="family-bmi">BMI ${p.bmi}</div>` : ''}
          </div>
          <button class="family-remove" onclick="window._removeFamilyMember('${p.id}')" title="Remove">✕</button>
        </div>`;
    }).join('');

    window._removeFamilyMember = onRemove;
  }

  // ── Notification ───────────────────────────────────────────────────────────
  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.fg-notification');
    if (existing) existing.remove();

    const n = document.createElement('div');
    n.className = `fg-notification fg-notification--${type}`;
    n.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">✕</button>`;
    document.body.appendChild(n);

    setTimeout(() => {
      if (n.parentElement) n.style.opacity = '0';
      setTimeout(() => n.remove(), 400);
    }, 4000);
  }

  // ── Loader ─────────────────────────────────────────────────────────────────
  function showLoader(message = 'Analyzing...') {
    const el = document.getElementById('loader-overlay');
    if (el) {
      el.querySelector('.loader-message').textContent = message;
      el.style.display = 'flex';
    }
  }

  function hideLoader() {
    const el = document.getElementById('loader-overlay');
    if (el) el.style.display = 'none';
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function animateNumber(el, target, duration = 1200) {
    const start = parseInt(el.textContent) || 0;
    const startTime = performance.now();
    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function setSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return {
    drawGauge,
    drawTimelineChart,
    renderCategoryBars,
    renderFamilyGrid,
    showNotification,
    showLoader,
    hideLoader,
    animateNumber,
    setSection,
    getRiskColor,
    escapeHtml
  };
})();

export default UI;
