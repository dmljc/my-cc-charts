import type { DeviceDetailsData, DeviceMetric, RoomTrendSeriesItem } from './interface';

const SERIES_COLORS = ['#3BA7FF'];

const DEVICE_NAMES = ['设备A'];

export interface MetricTrendPreset {
  propertyId: string;
  unit: string;
  bases: number[];
  amps: number[];
}

/** 指标假数据（顺序与蓝湖：流量/压力/浓度/流速/温度） */
export const DEFAULT_DEVICE_DETAILS_METRICS: DeviceMetric[] = [
  {
    key: 'flow',
    label: '流量',
    value: 32.3,
    unit: 'm³/s',
    propertyId: 'flow',
  },
  {
    key: 'pressure',
    label: '压力',
    value: 32.3,
    unit: 'pa',
    propertyId: 'pressure',
  },
  {
    key: 'concentration',
    label: '浓度',
    value: 32.3,
    unit: 'mol/L',
    propertyId: 'concentration',
  },
  {
    key: 'velocity',
    label: '流速',
    value: 32.3,
    unit: 'm/s',
    propertyId: 'velocity',
  },
  {
    key: 'temperature',
    label: '温度',
    value: 32.3,
    unit: '℃',
    propertyId: 'temperature',
  },
];

const TREND_PRESETS: Record<string, MetricTrendPreset> = {
  flow: {
    propertyId: 'flow',
    unit: 'm³/s',
    bases: [3.2],
    amps: [1.6],
  },
  pressure: {
    propertyId: 'pressure',
    unit: 'pa',
    bases: [32],
    amps: [4],
  },
  concentration: {
    propertyId: 'concentration',
    unit: 'mol/L',
    bases: [32],
    amps: [4],
  },
  velocity: {
    propertyId: 'velocity',
    unit: 'm/s',
    bases: [3.2],
    amps: [0.6],
  },
  temperature: {
    propertyId: 'temperature',
    unit: '℃',
    bases: [28],
    amps: [2.2],
  },
};

/**
 * 生成近 N 天假趋势点（默认 7 天，10 分钟一点，覆盖滑块全轨道）。
 */
export function createMockTrendSeries(
  propertyId: string,
  days = 7,
): RoomTrendSeriesItem[] {
  const preset = TREND_PRESETS[propertyId] || TREND_PRESETS.flow;
  const now = Date.now();
  const stepMinutes = 10;
  const totalMinutes = Math.max(days, 1) * 24 * 60;
  return DEVICE_NAMES.map((name, index) => {
    const base = preset.bases[index] ?? preset.bases[0];
    const amp = preset.amps[index] ?? preset.amps[0];
    const data = [];
    for (let i = totalMinutes; i >= 0; i -= stepMinutes) {
      const wave = Math.sin(i / 40 + index) * amp;
      const dayWave = Math.sin(i / (24 * 60) + index * 0.7) * amp * 0.35;
      const noise = ((i * (index + 3)) % 7) * amp * 0.04;
      data.push({
        time: now - i * 60 * 1000,
        value: Number((base + wave + dayWave + noise).toFixed(2)),
      });
    }
    return {
      name,
      color: SERIES_COLORS[index % SERIES_COLORS.length],
      data,
    };
  });
}

export function getTrendUnit(propertyId: string): string {
  return (TREND_PRESETS[propertyId] || TREND_PRESETS.flow).unit;
}

export function createDeviceDetailsTestData(propertyId = 'flow'): DeviceDetailsData {
  const trendSeries = createMockTrendSeries(propertyId);
  return {
    deviceName: 'X12-202',
    deviceCode: 'SSBH-20260801',
    monitorArea: '房间202',
    pipeCode: 'X12-01',
    configFlow: '9.81m/s',
    metrics: DEFAULT_DEVICE_DETAILS_METRICS,
    deviceDisabled: false,
    trendPropertyId: propertyId,
    trendUnit: getTrendUnit(propertyId),
    legendSeries: trendSeries.map((item) => ({
      name: item.name,
      color: item.color,
      data: [],
    })),
    trendSeries,
    chartKey: `device-details-${propertyId}`,
  };
}

export const DEFAULT_DEVICE_DETAILS_TEST_DATA = createDeviceDetailsTestData('flow');
