/** 内联 SVG，避免依赖缺失的切图资源 */

const svg = (body: string, color = '#4E5969') =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">${body.replace(
      /currentColor/g,
      color,
    )}</svg>`,
  )}`;

export const metricConcentrationIcon = svg(
  `<circle cx="24" cy="24" r="10" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="4" fill="currentColor"/><path d="M24 6v4M24 38v4M6 24h4M38 24h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  '#3491FA',
);

export const metricFlowIcon = svg(
  `<path d="M8 24c6-10 10-10 16 0s10 10 16 0" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M8 32c6-10 10-10 16 0s10 10 16 0" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`,
  '#14C9C9',
);

export const metricPressureIcon = svg(
  `<rect x="14" y="8" width="20" height="32" rx="10" stroke="currentColor" stroke-width="2"/><path d="M24 14v12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="30" r="3" fill="currentColor"/>`,
  '#F77234',
);

export const metricTemperatureIcon = svg(
  `<path d="M22 8a2 2 0 0 1 4 0v18.2a6 6 0 1 1-4 0V8z" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="32" r="3.5" fill="currentColor"/>`,
  '#F53F3F',
);

export const metricVelocityIcon = svg(
  `<path d="M10 30l8-12 6 8 8-14 6 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 36h32" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".4"/>`,
  '#722ED1',
);
