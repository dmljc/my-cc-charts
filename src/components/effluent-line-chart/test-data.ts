export interface EffluentLineChartTestSeriesItem {
  name: string;
  color?: string;
  init_data?: Array<number | null>;
  data?: Array<number | null>;
  [key: string]: unknown;
}

export interface EffluentLineChartTestPayload {
  topic?: string;
  xAxis: string[];
  series: EffluentLineChartTestSeriesItem[];
  legend?: string[];
  [key: string]: unknown;
}

const padTimePart = (value: number) => String(value).padStart(2, '0');

const formatDateToHms = (date: Date) => (
  `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}:${padTimePart(date.getSeconds())}`
);

/** 生成与截图接近的慢波 + 微抖动 */
const buildWave = (pointCount: number, base: number, amp: number, phase: number) => (
  Array.from({ length: pointCount }, (_, index) => {
    const t = pointCount <= 1 ? 0 : index / (pointCount - 1);
    const wave = -Math.cos(t * Math.PI * 2.3 + phase) * amp;
    const noise = Math.sin(index * 0.85 + phase * 2) * 0.008 + Math.cos(index * 1.65 + phase) * 0.004;

    return Number((base + wave + noise).toFixed(3));
  })
);

export const createEffluentLineChartTestData = (
  pointCount = 60,
  options?: {
    startHours?: number;
    startMinutes?: number;
    startSeconds?: number;
    stepMs?: number;
  },
): EffluentLineChartTestPayload => {
  const startHours = options?.startHours ?? 15;
  const startMinutes = options?.startMinutes ?? 40;
  const startSeconds = options?.startSeconds ?? 42;
  const stepMs = options?.stepMs ?? 60 * 1000;
  const start = new Date();
  start.setHours(startHours, startMinutes, startSeconds, 0);

  const xAxis = Array.from({ length: pointCount }, (_, index) => {
    const date = new Date(start.getTime() + index * stepMs);

    return formatDateToHms(date);
  });

  const seriesNames = ['全排', '特排', '局排', '特排'];
  const seriesColors = ['#EE8C45', '#6BC7A6', '#7492DB', '#E06C75'];

  return {
    topic: 'init_data',
    xAxis,
    legend: seriesNames,
    series: [
      { name: seriesNames[0], color: seriesColors[0], init_data: buildWave(pointCount, 1.99, 0.055, 0) },
      { name: seriesNames[1], color: seriesColors[1], init_data: buildWave(pointCount, 2.00, 0.055, 0.12) },
      { name: seriesNames[2], color: seriesColors[2], init_data: buildWave(pointCount, 2.01, 0.055, 0.24) },
      { name: seriesNames[3], color: seriesColors[3], init_data: buildWave(pointCount, 2.02, 0.055, 0.36) },
    ],
  };
};

/** 默认 mock：与可变 Y 轴折线图相同的 { xAxis, series, topic } 结构 */
export const DEFAULT_EFFLUENT_LINE_CHART_TEST_DATA = createEffluentLineChartTestData();
