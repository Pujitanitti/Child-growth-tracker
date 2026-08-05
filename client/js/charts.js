// charts.js — Thin wrapper around Chart.js. Centralizes theme-aware colors
// and chart configs so every page renders charts consistently.

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function baseOptions(extra = {}) {
  const gridColor = cssVar('--color-border');
  const textColor = cssVar('--color-muted');
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: cssVar('--color-surface'),
        titleColor: cssVar('--color-ink'),
        bodyColor: cssVar('--color-ink-soft'),
        borderColor: cssVar('--color-border'),
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        boxPadding: 4,
      },
    },
    scales: {
      x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { size: 11 } } },
      y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { size: 11 } } },
    },
    animation: { duration: 700, easing: 'easeOutQuart' },
    ...extra,
  };
}

function lineDataset(label, data, color, extra = {}) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: `${color}22`,
    pointBackgroundColor: color,
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6,
    tension: 0.35,
    fill: true,
    borderWidth: 2.5,
    ...extra,
  };
}

const chartInstances = new Map();

function renderChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  // Destroy any prior instance on this canvas so re-renders (e.g. child switch) don't leak.
  chartInstances.get(canvasId)?.destroy();
  // eslint-disable-next-line no-undef
  const chart = new Chart(canvas, config);
  chartInstances.set(canvasId, chart);
  return chart;
}

export function renderHeightChart(canvasId, records) {
  return renderChart(canvasId, {
    type: 'line',
    data: {
      labels: records.map((r) => new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [lineDataset('Height (cm)', records.map((r) => r.heightCm), cssVar('--chart-height'))],
    },
    options: baseOptions(),
  });
}

export function renderWeightChart(canvasId, records) {
  return renderChart(canvasId, {
    type: 'line',
    data: {
      labels: records.map((r) => new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [lineDataset('Weight (kg)', records.map((r) => r.weightKg), cssVar('--chart-weight'))],
    },
    options: baseOptions(),
  });
}

export function renderBmiTrendChart(canvasId, records) {
  return renderChart(canvasId, {
    type: 'line',
    data: {
      labels: records.map((r) => new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [lineDataset('BMI', records.map((r) => r.bmi), cssVar('--chart-bmi'))],
    },
    options: baseOptions(),
  });
}

export function renderHeadCircumferenceChart(canvasId, records) {
  return renderChart(canvasId, {
    type: 'line',
    data: {
      labels: records.map((r) => new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [lineDataset('Head Circumference (cm)', records.map((r) => r.headCircumferenceCm), cssVar('--chart-head'))],
    },
    options: baseOptions(),
  });
}

export function renderPercentileChart(canvasId, records) {
  return renderChart(canvasId, {
    type: 'line',
    data: {
      labels: records.map((r) => new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [lineDataset('Height Percentile', records.map((r) => r.percentile), cssVar('--chart-percentile'), { fill: false })],
    },
    options: baseOptions({ scales: { y: { min: 0, max: 100, grid: { color: cssVar('--color-border') }, ticks: { color: cssVar('--color-muted') } }, x: { grid: { display: false }, ticks: { color: cssVar('--color-muted') } } } }),
  });
}

export function renderVelocityChart(canvasId, velocityHistory) {
  return renderChart(canvasId, {
    type: 'bar',
    data: {
      labels: velocityHistory.map((v) => v.label),
      datasets: [{
        label: 'Height velocity (cm/month)',
        data: velocityHistory.map((v) => v.heightCmPerMonth),
        backgroundColor: cssVar('--chart-velocity'),
        borderRadius: 6,
        maxBarThickness: 36,
      }],
    },
    options: baseOptions(),
  });
}

/** Small donut used for BMI/growth-score rings on dashboard cards. */
export function renderScoreDonut(canvasId, score) {
  return renderChart(canvasId, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: [cssVar('--color-primary'), cssVar('--color-primary-softer')],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '78%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 800, easing: 'easeOutQuart' },
    },
  });
}

export function destroyAllCharts() {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances.clear();
}
