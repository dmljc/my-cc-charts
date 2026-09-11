import type { DeviceMetric } from './interface';

/** 变化趋势默认可见时长：1 小时 */
export const TREND_AXIS_RANGE_MS = 60 * 60 * 1000;

export type MetricIconKey =
  | 'concentration'
  | 'flow'
  | 'pressure'
  | 'temperature'
  | 'velocity';

const ICON_RULES: Array<{ key: MetricIconKey; keywords: string[] }> = [
  { key: 'concentration', keywords: ['浓度', 'concentration', 'ppm', '气体'] },
  { key: 'flow', keywords: ['流量', 'flow'] },
  { key: 'pressure', keywords: ['压力', 'pressure', '压强'] },
  { key: 'temperature', keywords: ['温度', 'temperature', '温'] },
  { key: 'velocity', keywords: ['流速', '速度', 'velocity', '风速'] },
];

/**
 * 根据指标名称匹配图标 key。
 */
export function getMetricIconKey(label: string): MetricIconKey {
  const text = String(label || '').toLowerCase();
  for (let i = 0; i < ICON_RULES.length; i += 1) {
    const rule = ICON_RULES[i];
    if (rule.keywords.some((word) => text.indexOf(word.toLowerCase()) >= 0)) {
      return rule.key;
    }
  }
  return 'concentration';
}

/**
 * 格式化指标展示值。
 */
export function formatMetric(metric: DeviceMetric): string {
  const raw = metric?.value;
  if (raw === null || raw === undefined || raw === '') {
    return '--';
  }
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      return '--';
    }
    if (Math.abs(raw) >= 100) {
      return String(Math.round(raw));
    }
    return String(Math.round(raw * 100) / 100);
  }
  return String(raw);
}
