export interface DataMonitoringLineChartTestPoint {
  label: string;
  value: number;
  [key: string]: unknown;
}

const padTimePart = (value: number) => String(value).padStart(2, '0');

const formatSecondsToTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${padTimePart(hours)}:${padTimePart(minutes)}:${padTimePart(seconds)}`;
};

export const createDataMonitoringLineChartTestData = (
  count = 10,
  options?: {
    startSeconds?: number;
    stepSeconds?: number;
  },
): DataMonitoringLineChartTestPoint[] => {
  const startSeconds = options?.startSeconds ?? 0;
  const stepSeconds = options?.stepSeconds ?? 1;

  return Array.from({ length: count }, (_, index) => {
    const labelSeconds = startSeconds + index * stepSeconds;
    const wave = Math.sin(index / 18) * 1.1 + Math.cos(index / 47) * 0.35;
    const trend = (index / Math.max(count - 1, 1)) * 1.2;
    const value = Number(Math.min(5, Math.max(0.5, 2.6 + wave + trend)).toFixed(2));

    return {
      label: formatSecondsToTime(labelSeconds),
      value,
    };
  });
};

export const DEFAULT_DATA_MONITORING_LINE_CHART_TEST_DATA = createDataMonitoringLineChartTestData(10);
