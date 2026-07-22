import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { destroy, init } from '../../common/iot';
import { getNiceAxisMax } from '../../common/chart-axis';
import {
  CHART_SYMBOL_POINT_THRESHOLD,
} from '../../common/perf';
import './index.scss';

export interface YAxisSeriesConfig {
  /** 系列名称，显示在图例和 tooltip 中 */
  name: string;
  /** 系列数据值 */
  data: number[];
  /** 系列颜色 */
  color?: string;
}

/** 接口返回的系列项（series[]） */
export interface VariableYStepSeriesItem {
  /** 系列名称，同时作为图例项 */
  name?: string;
  /** 数值数组（字段名可能是 data / init_data，由 topic 指定） */
  data?: Array<number | null>;
  init_data?: Array<number | null>;
  color?: string;
  [key: string]: unknown;
}

/**
 * 接口数据结构（如 qtcData / res.data.data）
 * - xAxis: 横轴标签
 * - series: 折线系列，name 用于 legend
 * - topic: 系列数值字段名，如 "init_data" / "data"；不传则自动探测
 * - legend: 可选，显式指定图例顺序；不传则取 series[].name
 */
export interface VariableYStepChartPayload {
  xAxis?: string[];
  series?: VariableYStepSeriesItem[];
  topic?: string;
  legend?: string[];
  [key: string]: unknown;
}

export interface VariableYStepLineChartProps {
  title?: string;
  /** @deprecated 请使用 data.xAxis */
  xAxisData?: string[];
  /** @deprecated 请使用 data.series */
  yAxisData?: YAxisSeriesConfig[];
  /**
   * 图表数据（接口对象）：
   * { xAxis, series: [{ name, data|init_data }], topic?, legend? }
   */
  data?: VariableYStepChartPayload | any[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** @deprecated flat 模式保留 */
  xField?: string;
  /** @deprecated flat 模式保留 */
  seriesField?: string;
  /** @deprecated flat 模式保留 */
  yField?: string;
  /** @deprecated flat 模式保留 */
  timeField?: string;
  /** y 轴对数底数（兼容旧配置；当前按数据最大值动态生成等距分段刻度） */
  logBase?: number;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 图例位置 */
  legendPosition?: 'left' | 'right' | 'top' | 'bottom';
  /** 时序点滑动窗口上限，默认 15 分钟（1 秒 1 点 ≈ 900） */
  maxPoints?: number;
  onPointClick?: (item: any, seriesIndex: number, dataIndex: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: VariableYStepChartPayload | any[]) => void;
    getData: () => VariableYStepChartPayload | any[];
  };
}

interface ChartSourceData {
  xAxisData: string[];
  yAxisData: YAxisSeriesConfig[];
  /** 图例名称列表 */
  legend?: string[];
  /** 与 xAxisData 对齐的时间戳（毫秒），可选 */
  timestamps?: number[];
}

/** y 轴固定 5 档等距显示坐标（0~4）；真实刻度值按数据最大值动态生成 */
const Y_AXIS_TICK_COUNT = 5;
const Y_AXIS_GRID_DISPLAY_VALUES = [1, 2, 3, 4];
const Y_AXIS_DISPLAY_MAX = Y_AXIS_TICK_COUNT - 1;
const Y_AXIS_DISPLAY_TICKS = [0, 1, 2, 3, 4];
/** 无数据或外部兜底时使用的默认真实刻度 */
const FALLBACK_Y_AXIS_TICKS = [0, 0.5, 1, 5000, 10000];

const formatAxisTickValue = (value: number): string => {
  if (value >= 1000) {
    return String(Math.round(value));
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return parseFloat(value.toPrecision(3)).toString();
};

/** 从当前窗口系列数据中取最大值 */
const getSeriesDataMax = (source: ChartSourceData): number => {
  let max = 0;

  source.yAxisData.forEach((seriesItem) => {
    if (!Array.isArray(seriesItem.data)) {
      return;
    }

    seriesItem.data.forEach((value) => {
      const num = Number(value);

      if (Number.isFinite(num) && num > max) {
        max = num;
      }
    });
  });

  return max;
};

/**
 * 根据数据最大值生成 5 档真实刻度：
 * - ≤10：等距五档（如 3→上限 4，刻度为 0/1/2/3/4）
 * - >10：保留 0 / 0.5 / 1 低端分辨率，中高档随 max 动态变化
 */
export const buildYAxisTicks = (dataMax: number): number[] => {
  const niceMax = getNiceAxisMax(Number.isFinite(dataMax) && dataMax > 0 ? dataMax : 0);
  const clean = (value: number) => parseFloat(value.toPrecision(12));

  if (niceMax <= 10) {
    return [0, clean(niceMax * 0.25), clean(niceMax * 0.5), clean(niceMax * 0.75), niceMax];
  }

  return [0, 0.5, 1, niceMax / 2, niceMax];
};

const padTimePart = (value: number) => String(value).padStart(2, '0');

/** 横轴/提示时间统一展示为时:分:秒（HH:mm:ss） */
const formatDateToHms = (date: Date) => (
  `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}:${padTimePart(date.getSeconds())}`
);

const formatTimeLabel = (value: string | number | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const rawValue = String(value);
  const timeMatch = rawValue.match(/(?:^|\s|T)(\d{1,2}):(\d{2})(?::(\d{2}))?/);

  if (timeMatch) {
    const hours = padTimePart(Number(timeMatch[1]));
    const minutes = timeMatch[2];
    const seconds = timeMatch[3] != null ? timeMatch[3] : '00';

    return `${hours}:${minutes}:${seconds}`;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    if (numericValue >= 0 && numericValue < 24 * 60 * 60) {
      const hours = Math.floor(numericValue / 3600);
      const minutes = Math.floor((numericValue % 3600) / 60);
      const seconds = Math.floor(numericValue % 60);

      return `${padTimePart(hours)}:${padTimePart(minutes)}:${padTimePart(seconds)}`;
    }

    const timestamp = numericValue > 1e12 ? numericValue : numericValue * 1000;
    const date = new Date(timestamp);

    if (!Number.isNaN(date.getTime())) {
      return formatDateToHms(date);
    }
  }

  const parsedDate = new Date(rawValue.replace(/-/g, '/'));

  if (!Number.isNaN(parsedDate.getTime())) {
    return formatDateToHms(parsedDate);
  }

  return rawValue;
};

/** 真实值 → 等距显示坐标（0~4） */
export const valueToAxis = (
  value: number | null | undefined,
  ticks: number[] = FALLBACK_Y_AXIS_TICKS,
): number | null => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return null;
  }

  const safeTicks = ticks.length >= 2 ? ticks : FALLBACK_Y_AXIS_TICKS;
  const displayMax = safeTicks.length - 1;
  const num = Number(value);

  if (num <= safeTicks[0]) {
    return 0;
  }

  if (num >= safeTicks[displayMax]) {
    return displayMax;
  }

  for (let index = 0; index < displayMax; index += 1) {
    const start = safeTicks[index];
    const end = safeTicks[index + 1];

    if (num >= start && num <= end) {
      const span = end - start;

      if (span <= 0) {
        return index;
      }

      return index + (num - start) / span;
    }
  }

  return displayMax;
};

/** 等距显示坐标 → 真实值 */
export const axisToValue = (
  axisValue: number,
  ticks: number[] = FALLBACK_Y_AXIS_TICKS,
): number => {
  if (!Number.isFinite(axisValue)) {
    return 0;
  }

  const safeTicks = ticks.length >= 2 ? ticks : FALLBACK_Y_AXIS_TICKS;
  const displayMax = safeTicks.length - 1;

  if (axisValue <= 0) {
    return safeTicks[0];
  }

  if (axisValue >= displayMax) {
    return safeTicks[displayMax];
  }

  const index = Math.floor(axisValue);
  const ratio = axisValue - index;
  const start = safeTicks[index];
  const end = safeTicks[index + 1];

  return start + (end - start) * ratio;
};

const DEFAULT_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];

/** 滑动窗口默认 15 分钟（1 秒 1 点 ≈ 900） */
const DEFAULT_MAX_POINTS = 15 * 60;
const TOOLTIP_CLASS_NAME = 'bizpack-variable-y-step-line-chart-tooltip';

/** 按「升→降」循环 4 次生成演示数据；图例名与接口 series[].name 一致（设备1…） */
const createDefaultSourceData = (): ChartSourceData => {
  const now = Date.now();
  const intervalMs = 60 * 1000;
  const cycles = 4;
  const pointsPerCycle = 5;
  const pointCount = cycles * pointsPerCycle;
  const xAxisData = Array.from(
    { length: pointCount },
    (_, index) => {
      const date = new Date(now - (pointCount - 1 - index) * intervalMs);

      return formatDateToHms(date);
    },
  );
  const timestamps = Array.from(
    { length: pointCount },
    (_, index) => now - (pointCount - 1 - index) * intervalMs,
  );

  // 每个周期：低 → 升 → 峰 → 降 → 低，共 4 次循环
  const cycleRatios = [0, 0.5, 1, 0.5, 0];

  const buildWave = (low: number, high: number, digits = 3) => {
    const data: number[] = [];

    for (let cycle = 0; cycle < cycles; cycle += 1) {
      cycleRatios.forEach((ratio) => {
        const value = low + (high - low) * ratio;
        data.push(Number(value.toFixed(digits)));
      });
    }

    return data;
  };

  const seriesNames = ['设备1', '设备2', '设备3', '设备4'];

  return {
    xAxisData,
    timestamps,
    yAxisData: [
      { name: seriesNames[0], data: buildWave(0.015, 0.105, 3) },
      { name: seriesNames[1], data: buildWave(0.03, 0.12, 3) },
      { name: seriesNames[2], data: buildWave(0.02, 0.09, 3) },
      { name: seriesNames[3], data: buildWave(0.05, 0.15, 3) },
    ],
    legend: seriesNames,
  };
};

const DEFAULT_SOURCE = createDefaultSourceData();

const formatTooltipValue = (value: number | string | null | undefined): string => {
  // 接口返回 0 必须显示为 "0"；仅 null/undefined/空串显示为占位
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (value === '-') {
    return '-';
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    return String(value);
  }

  // 0 / -0 都显示为 0
  if (num === 0) {
    return '0';
  }

  const abs = Math.abs(num);

  // 仅对极小值使用科学计数法，避免 2800 显示成 2.80e+3
  if (abs > 0 && abs < 0.001) {
    return num.toExponential(2);
  }

  if (Number.isInteger(num) || Math.abs(num - Math.round(num)) < 1e-9) {
    return String(Math.round(num));
  }

  return parseFloat(num.toPrecision(6)).toString();
};

/** 从数据点解析接口原始值；0 是合法值，不能用 != null / 真值判断 */
const resolveTooltipRawValue = (
  item: any,
  ticks: number[] = FALLBACK_Y_AXIS_TICKS,
): number | string | null | undefined => {
  const dataItem = item?.data;

  if (dataItem && typeof dataItem === 'object' && !Array.isArray(dataItem)) {
    if (Object.prototype.hasOwnProperty.call(dataItem, 'realValue')) {
      return dataItem.realValue as number | string | null | undefined;
    }
  }

  if (typeof dataItem === 'number' || typeof dataItem === 'string') {
    return dataItem;
  }

  const rawValue = Array.isArray(item?.value) ? item.value[item.value.length - 1] : item?.value;

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    // 无 realValue 时，轴坐标反推（兜底）；0 仍应得到 0
    return axisToValue(rawValue, ticks);
  }

  return rawValue;
};

type TooltipContext = {
  getSource: () => ChartSourceData;
  getLegendSelected: () => Record<string, boolean>;
  getTicks: () => number[];
};

const buildAxisTooltipConfig = (ctx: TooltipContext) => ({
  trigger: 'axis',
  confine: true,
  // 不过滤 0 / 空点，保证接口返回的 0 也会进 formatter
  filterMode: 'none',
  className: TOOLTIP_CLASS_NAME,
  backgroundColor: 'rgba(8, 24, 46, 0.92)',
  borderColor: 'rgba(80, 160, 220, 0.4)',
  borderWidth: 1,
  padding: [14, 16],
  extraCssText:
    'border-radius: 8px; box-shadow: 0 0 24px rgba(20, 130, 220, 0.35), inset 0 0 30px rgba(30, 120, 200, 0.12); backdrop-filter: blur(6px);',
  axisPointer: {
    type: 'line',
    lineStyle: {
      color: 'rgba(150, 200, 230, 0.5)',
      type: 'dashed',
      width: 1,
    },
  },
  formatter: (params: any) => {
    const items = (Array.isArray(params) ? params : [params]).filter(
      (item: any) => item && item.seriesName !== '__y-grid__',
    );

    if (!items.length) {
      return '';
    }

    const dataIndex = typeof items[0].dataIndex === 'number' ? items[0].dataIndex : -1;
    const source = ctx.getSource();
    const selected = ctx.getLegendSelected();
    const axisLabel = formatTimeLabel(
      (dataIndex >= 0 ? source.xAxisData[dataIndex] : undefined)
        ?? items[0].axisValue
        ?? items[0].name
        ?? '',
    );

    // 优先按后端 series 原值渲染（含 0）；ECharts params 仅作颜色/缺省兜底
    const paramByName = new Map<string, any>();
    items.forEach((item: any) => {
      if (item?.seriesName) {
        paramByName.set(String(item.seriesName), item);
      }
    });

    const seriesList = source.yAxisData.length > 0
      ? source.yAxisData
      : items.map((item: any) => ({
        name: String(item.seriesName ?? ''),
        data: [] as number[],
      }));

    const rows = seriesList
      .filter((seriesItem) => {
        if (!seriesItem?.name || seriesItem.name === '__y-grid__') {
          return false;
        }
        // 尊重用户手动关闭的 legend；未记录时默认显示
        if (Object.prototype.hasOwnProperty.call(selected, seriesItem.name)) {
          return selected[seriesItem.name] !== false;
        }
        return true;
      })
      .map((seriesItem) => {
        const param = paramByName.get(seriesItem.name);
        let raw: number | string | null | undefined;

        if (dataIndex >= 0 && Array.isArray(seriesItem.data) && dataIndex < seriesItem.data.length) {
          // 直接取接口窗口内原值，0 也会原样进入格式化
          raw = seriesItem.data[dataIndex] as number | null | undefined;
        } else if (param) {
          raw = resolveTooltipRawValue(param, ctx.getTicks());
        } else {
          raw = null;
        }

        return (
          `<div class="${TOOLTIP_CLASS_NAME}__row">`
          + `<span class="${TOOLTIP_CLASS_NAME}__name">${seriesItem.name}</span>`
          + `<span class="${TOOLTIP_CLASS_NAME}__value">${formatTooltipValue(raw)}</span>`
          + '</div>'
        );
      })
      .join('');

    return (
      `<div class="${TOOLTIP_CLASS_NAME}__content">`
      + `<div class="${TOOLTIP_CLASS_NAME}__title">${axisLabel}</div>`
      + rows
      + '</div>'
    );
  },
});

const pickRootDomProps = (props: Record<string, unknown>) => {
  const domProps: Record<string, unknown> = {};

  Object.keys(props).forEach((key) => {
    if (
      key === 'id' ||
      key === 'role' ||
      key === 'tabIndex' ||
      key.indexOf('data-') === 0 ||
      key.indexOf('aria-') === 0
    ) {
      domProps[key] = props[key];
    }
  });

  return domProps;
};

const parseTimestamp = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const asNumber = Number(value);

    if (Number.isFinite(asNumber)) {
      return asNumber < 1e12 ? asNumber * 1000 : asNumber;
    }

    const parsed = Date.parse(value);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

/** 将 flat 数据按 x 轴标签对齐转换为 series 格式 */
export const transformFlatData = (
  data: any[],
  xField: string,
  seriesField: string,
  yField: string,
  timeField = 'time',
): ChartSourceData => {
  const xLabels: string[] = [];
  const timestamps: number[] = [];
  const seriesNames: string[] = [];
  const valueMap: Record<string, Record<string, number>> = {};

  data.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const label = String(item[xField] ?? '');
    const seriesKey = String(item[seriesField] ?? 'default');
    const rawValue = item[yField];
    const value = Number(rawValue);
    const ts = parseTimestamp(item[timeField]) ?? parseTimestamp(item[xField]);

    if (!xLabels.includes(label)) {
      xLabels.push(label);
      timestamps.push(ts ?? Number.NaN);
    } else if (ts != null) {
      const labelIndex = xLabels.indexOf(label);

      if (labelIndex >= 0 && Number.isNaN(timestamps[labelIndex])) {
        timestamps[labelIndex] = ts;
      }
    }

    if (!seriesNames.includes(seriesKey)) {
      seriesNames.push(seriesKey);
    }

    if (!valueMap[seriesKey]) {
      valueMap[seriesKey] = {};
    }

    valueMap[seriesKey][label] = Number.isFinite(value) ? value : 0;
  });

  const hasValidTimestamp = timestamps.some((item) => Number.isFinite(item));

  return {
    xAxisData: xLabels,
    timestamps: hasValidTimestamp ? timestamps : undefined,
    yAxisData: seriesNames.map((name) => ({
      name,
      data: xLabels.map((label) => {
        const value = valueMap[name]?.[label];

        return value == null || !Number.isFinite(value) ? null : value;
      }) as unknown as number[],
    })),
    legend: seriesNames,
  };
};

/** 按 topic / data / init_data 取出系列数值数组；两字段都有时取更长的（实时追加后的完整序列） */
const pickSeriesValues = (
  item: VariableYStepSeriesItem | undefined,
  topic?: string,
): Array<number | null> => {
  if (!item || typeof item !== 'object') {
    return [];
  }

  const dataArr = Array.isArray(item.data) ? (item.data as Array<number | null>) : null;
  const initArr = Array.isArray(item.init_data)
    ? (item.init_data as Array<number | null>)
    : null;

  if (topic && typeof topic === 'string' && topic.trim() !== '') {
    const byTopic = item[topic.trim()];
    if (Array.isArray(byTopic)) {
      const topicArr = byTopic as Array<number | null>;
      // topic=init_data 但 data 已追加更长时，优先 data，避免停在初始窗口
      if (dataArr && dataArr.length > topicArr.length) {
        return dataArr;
      }
      if (initArr && initArr.length > topicArr.length) {
        return initArr;
      }
      return topicArr;
    }
  }

  if (dataArr && initArr) {
    return dataArr.length >= initArr.length ? dataArr : initArr;
  }
  if (dataArr) {
    return dataArr;
  }
  if (initArr) {
    return initArr;
  }

  const matched = Object.keys(item)
    .filter((key) => key !== 'name' && key !== 'color')
    .map((key) => item[key])
    .find((value) => Array.isArray(value));

  return Array.isArray(matched) ? (matched as Array<number | null>) : [];
};

/** 将接口对象 { xAxis, series, topic?, legend? } 转为内部渲染结构 */
export const normalizeApiPayload = (payload: unknown): ChartSourceData | null => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const root = payload as VariableYStepChartPayload & { data?: unknown };
  // 兼容 res.data.data 再包一层，或直接传入 { xAxis, series, topic }
  const candidate = (
    Array.isArray(root.series) && Array.isArray(root.xAxis)
      ? root
      : root.data && typeof root.data === 'object' && !Array.isArray(root.data)
        ? root.data as VariableYStepChartPayload
        : root
  );

  const { xAxis, series, legend, topic } = candidate;

  if (!Array.isArray(xAxis) || !Array.isArray(series) || series.length === 0) {
    return null;
  }

  const topicField = typeof topic === 'string' && topic.trim() !== '' ? topic.trim() : undefined;

  const normalizeSeriesData = (raw: Array<number | null>): number[] => (
    raw.map((value) => {
      if (value === null || value === undefined) {
        return null as unknown as number;
      }

      const num = Number(value);

      return Number.isFinite(num) ? num : (null as unknown as number);
    })
  );

  // 图例以 series[].name 为准；legend 仅在名称能匹配到系列时用于排序
  const yAxisData: YAxisSeriesConfig[] = series.map((item, index) => {
    const legendName = Array.isArray(legend) ? legend[index] : undefined;

    return {
      name: String(item?.name ?? legendName ?? `设备${index + 1}`),
      data: normalizeSeriesData(pickSeriesValues(item, topicField)),
      color: typeof item?.color === 'string' ? item.color : undefined,
    };
  });

  let orderedSeries = yAxisData;

  if (Array.isArray(legend) && legend.length > 0) {
    const byName = new Map(yAxisData.map((item) => [item.name, item]));
    const fromLegend = legend
      .map((name) => byName.get(String(name)))
      .filter(Boolean) as YAxisSeriesConfig[];
    // 名称对得上才按 legend 排序；对不上说明是陈旧占位文案（如 曲线A），忽略
    if (fromLegend.length > 0) {
      const used = new Set(fromLegend.map((item) => item.name));
      const rest = yAxisData.filter((item) => !used.has(item.name));
      orderedSeries = [...fromLegend, ...rest];
    }
  }

  // 若同时存在占位名（曲线A…）与真实业务名，丢掉占位系列，避免图例重复
  const PLACEHOLDER_NAMES = new Set(['曲线A', '曲线B', '曲线C', '高值曲线']);
  const hasPlaceholder = orderedSeries.some((item) => PLACEHOLDER_NAMES.has(item.name));
  const hasBusiness = orderedSeries.some((item) => !PLACEHOLDER_NAMES.has(item.name));
  if (hasPlaceholder && hasBusiness) {
    orderedSeries = orderedSeries.filter((item) => !PLACEHOLDER_NAMES.has(item.name));
  }

  return {
    xAxisData: xAxis.map((label) => String(label ?? '')),
    yAxisData: orderedSeries,
    // 必须用实际系列名，避免接口 legend 与 series.name 不一致时图例出现多余项
    legend: orderedSeries.map((item) => item.name),
  };
};

/** 从 changeData / props.data 中解析可用载荷 */
const resolveIncomingData = (nextData: unknown): VariableYStepChartPayload | any[] | null => {
  if (nextData == null) {
    return null;
  }

  if (Array.isArray(nextData)) {
    return nextData;
  }

  if (typeof nextData === 'object') {
    const payload = nextData as VariableYStepChartPayload & { data?: unknown };

    if (Array.isArray(payload.series) && Array.isArray(payload.xAxis)) {
      return payload;
    }

    if (payload.data && typeof payload.data === 'object') {
      const nested = payload.data as VariableYStepChartPayload;

      if (Array.isArray(nested.series) && Array.isArray(nested.xAxis)) {
        return nested;
      }

      if (Array.isArray(payload.data)) {
        return payload.data;
      }
    }
  }

  return null;
};

const normalizeStructuredSource = (
  xAxisData?: string[],
  yAxisData?: YAxisSeriesConfig[],
): ChartSourceData | null => {
  if (!xAxisData || !yAxisData) {
    return null;
  }

  return {
    xAxisData,
    yAxisData,
    legend: yAxisData.map((item) => item.name),
  };
};

const windowChartSource = (source: ChartSourceData, maxPoints: number): ChartSourceData => {
  const total = source.xAxisData.length;

  if (total <= maxPoints) {
    return source;
  }

  const start = total - maxPoints;

  return {
    ...source,
    xAxisData: source.xAxisData.slice(start),
    yAxisData: source.yAxisData.map((seriesItem) => ({
      ...seriesItem,
      data: Array.isArray(seriesItem.data) ? seriesItem.data.slice(start) : [],
    })),
    timestamps: source.timestamps ? source.timestamps.slice(start) : source.timestamps,
  };
};

const buildSeriesOption = (yAxisData: YAxisSeriesConfig[], ticks: number[]) =>
  yAxisData.map((seriesItem, index) => {
    const seriesColor = seriesItem.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    const pointCount = Array.isArray(seriesItem.data) ? seriesItem.data.length : 0;
    const showSymbol = pointCount <= CHART_SYMBOL_POINT_THRESHOLD;
    const seriesId = seriesItem.name != null ? `s:${String(seriesItem.name)}` : `s:${index}`;

    return {
      id: seriesId,
      name: seriesItem.name,
      type: 'line',
      smooth: true,
      // 保留 realValue，tooltip/点击回调直接用原始值，避免坐标往返误差
      data: seriesItem.data.map((value) => {
        const axisValue = valueToAxis(value, ticks);

        if (axisValue === null) {
          return null;
        }

        return {
          value: axisValue,
          realValue: value,
        };
      }),
      connectNulls: false,
      showSymbol,
      symbol: 'circle',
      symbolSize: 6,
      sampling: pointCount > 500 ? 'lttb' : undefined,
      animation: false,
      animationDurationUpdate: 0,
      lineStyle: {
        color: seriesColor,
        width: 2,
      },
      itemStyle: {
        color: '#ffffff',
        borderColor: seriesColor,
        borderWidth: 1.5,
      },
      emphasis: {
        scale: true,
        focus: 'series',
        itemStyle: {
          color: '#ffffff',
          borderColor: seriesColor,
          borderWidth: 2,
        },
      },
    };
  });

const buildYAxisOption = (ticks: number[]) => ({
  type: 'value',
  min: 0,
  max: Y_AXIS_DISPLAY_MAX,
  interval: 1,
  axisTick: {
    show: true,
    customValues: Y_AXIS_DISPLAY_TICKS,
  },
  axisLabel: {
    customValues: Y_AXIS_DISPLAY_TICKS,
    color: 'rgba(218, 230, 235, 0.68)',
    fontSize: 12,
    formatter: (value: number) => {
      const tickIndex = Math.round(value);

      if (tickIndex < 0 || tickIndex >= ticks.length) {
        return '';
      }

      return formatAxisTickValue(ticks[tickIndex]);
    },
  },
  // 0 刻度不画横线，虚线由 markLine 画在显示坐标 1/2/3/4
  splitLine: {
    show: false,
  },
  minorSplitLine: {
    show: false,
  },
});

const buildYGridSeries = () => ({
  id: '__y-grid__',
  type: 'line',
  name: '__y-grid__',
  data: [],
  silent: true,
  tooltip: { show: false },
  legendHoverLink: false,
  animation: false,
  markLine: {
    silent: true,
    symbol: 'none',
    label: { show: false },
    lineStyle: {
      color: 'rgba(176, 208, 220, 0.24)',
      type: 'dashed',
      width: 1,
    },
    data: Y_AXIS_GRID_DISPLAY_VALUES.map((value) => ({ yAxis: value })),
  },
});

/** 系列名签名：变化才重绘 legend；仅数据推送时保持 legend/tooltip 不动 */
const getSeriesStructureKey = (source: ChartSourceData) =>
  (source.legend ?? source.yAxisData.map((item) => item.name)).join('\u0001');

const VariableYStepLineChart: React.FC<VariableYStepLineChartProps> = function VariableYStepLineChart(props) {
  const {
    title = '',
    data = [],
    xAxisData: propXAxisData,
    yAxisData: propYAxisData,
    width = 400,
    height = 300,
    style = {},
    className = '',
    xField = 'label',
    seriesField = 'type',
    yField = 'value',
    timeField = 'time',
    logBase = 10,
    showLegend = true,
    legendPosition = 'top',
    maxPoints = DEFAULT_MAX_POINTS,
    onPointClick,
    ...otherProps
  } = props;

  const resolvedMaxPoints = Number(maxPoints) > 0 ? Number(maxPoints) : DEFAULT_MAX_POINTS;
  const chartRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);
  const bizRef = useRef<BizRef | null>(null);
  const onPointClickRef = useRef(onPointClick);
  const bcRef = useRef<BroadcastChannel | null>(null);
  /** 用户手动点选 legend 后的选中态，数据推送时原样保留 */
  const legendSelectedRef = useRef<Record<string, boolean>>({});
  /** 系列结构签名；仅名称/布局变化时全量重绘 */
  const structureKeyRef = useRef<string>('');
  /** 当前轴悬浮提示位置；数据推送后恢复，避免 tooltip 被 ws 冲掉 */
  const axisTipRef = useRef<{ dataIndex: number } | null>(null);
  /** setOption 引发的 hideTip 忽略，仅用户移出/手动关闭时清空 */
  const ignoreHideTipRef = useRef(false);
  const ignoreHideTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 指针是否仍在图内；用像素坐标 showTip，不依赖 dataIndex */
  const pointerInsideRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  /** 上一帧横轴长度，用于滑动窗口时换算悬停下标 */
  const xAxisLenRef = useRef(0);
  const sourceDataRef = useRef<ChartSourceData>(DEFAULT_SOURCE);
  const rootDomProps = pickRootDomProps(otherProps);

  const [iotData, setIotData] = useState<VariableYStepChartPayload | any[] | null>(null);

  useEffect(() => {
    onPointClickRef.current = onPointClick;
  }, [onPointClick]);

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setIotData(null);
    }
  }, [data, propXAxisData, propYAxisData, props.dataType]);

  const sourceData = useMemo(() => {
    let resolved: ChartSourceData = DEFAULT_SOURCE;
    const fromIotPayload = normalizeApiPayload(iotData);

    if (fromIotPayload) {
      resolved = fromIotPayload;
    } else if (Array.isArray(iotData) && iotData.length > 0) {
      resolved = transformFlatData(iotData, xField, seriesField, yField, timeField);
    } else {
      const fromDataPayload = normalizeApiPayload(data);

      if (fromDataPayload) {
        resolved = fromDataPayload;
      } else {
        const structured = normalizeStructuredSource(propXAxisData, propYAxisData);

        if (structured) {
          resolved = structured;
        } else if (Array.isArray(data) && data.length > 0) {
          resolved = transformFlatData(data, xField, seriesField, yField, timeField);
        }
      }
    }

    return windowChartSource(resolved, resolvedMaxPoints);
  }, [
    iotData,
    data,
    propXAxisData,
    propYAxisData,
    xField,
    seriesField,
    yField,
    timeField,
    resolvedMaxPoints,
  ]);

  const dataMax = useMemo(() => getSeriesDataMax(sourceData), [sourceData]);
  const yAxisTicks = useMemo(() => buildYAxisTicks(dataMax), [dataMax]);

  sourceDataRef.current = sourceData;

  const yAxisTicksRef = useRef(yAxisTicks);
  yAxisTicksRef.current = yAxisTicks;

  const tooltipCtxRef = useRef<TooltipContext>({
    getSource: () => sourceDataRef.current,
    getLegendSelected: () => legendSelectedRef.current,
    getTicks: () => yAxisTicksRef.current,
  });
  tooltipCtxRef.current = {
    getSource: () => sourceDataRef.current,
    getLegendSelected: () => legendSelectedRef.current,
    getTicks: () => yAxisTicksRef.current,
  };

  const buildOption = useMemo(() => {
    const legendData = sourceData.legend ?? sourceData.yAxisData.map((item) => item.name);
    const option: any = {
      animation: false,
      animationDurationUpdate: 0,
      title: title
        ? {
          text: title,
          left: 'center',
          textStyle: {
            color: '#eaf7ff',
            fontSize: 14,
            fontWeight: 'normal',
          },
        }
        : undefined,
      tooltip: buildAxisTooltipConfig({
        getSource: () => tooltipCtxRef.current.getSource(),
        getLegendSelected: () => tooltipCtxRef.current.getLegendSelected(),
        getTicks: () => tooltipCtxRef.current.getTicks(),
      }),
      legend: {
        show: showLegend,
        left: legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center',
        top: legendPosition === 'top' ? 'top' : undefined,
        bottom: legendPosition === 'bottom' ? 'bottom' : undefined,
        data: legendData,
        selected: legendSelectedRef.current,
        textStyle: {
          color: 'rgba(218, 230, 235, 0.8)',
          fontSize: 12,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: sourceData.xAxisData,
        boundaryGap: false,
        splitLine: { show: false },
        axisLine: {
          lineStyle: {
            color: 'rgba(176, 208, 220, 0.3)',
          },
        },
        axisLabel: {
          color: 'rgba(218, 230, 235, 0.68)',
          fontSize: 12,
          formatter: (value: string | number) => formatTimeLabel(value),
        },
      },
      yAxis: buildYAxisOption(yAxisTicks),
      series: [
        ...buildSeriesOption(sourceData.yAxisData, yAxisTicks),
        buildYGridSeries(),
      ],
    };

    return option;
  }, [title, sourceData, yAxisTicks, showLegend, legendPosition]);

  /** 仅数据面：不带 tooltip/legend，避免 ws 推送时悬浮框与图例被重置；同步刷新 y 轴刻度 */
  const buildDataOption = useMemo(
    () => ({
      animation: false,
      animationDurationUpdate: 0,
      xAxis: {
        data: sourceData.xAxisData,
      },
      yAxis: buildYAxisOption(yAxisTicks),
      series: [
        ...buildSeriesOption(sourceData.yAxisData, yAxisTicks),
        buildYGridSeries(),
      ],
    }),
    [sourceData, yAxisTicks],
  );

  const structureKey = useMemo(
    () =>
      [
        getSeriesStructureKey(sourceData),
        title,
        String(showLegend),
        legendPosition,
      ].join('\u0001'),
    [sourceData, title, showLegend, legendPosition],
  );

  useEffect(() => {
    if (!chartRef.current) {
      return undefined;
    }

    const instance = echarts.init(chartRef.current);
    echartsRef.current = instance;
    structureKeyRef.current = structureKey;
    xAxisLenRef.current = sourceDataRef.current.xAxisData.length;
    instance.setOption(buildOption, { notMerge: true, lazyUpdate: false });

    instance.on('legendselectchanged', (params: any) => {
      if (params && params.selected && typeof params.selected === 'object') {
        legendSelectedRef.current = { ...params.selected };
      }
    });

    const resolveAxisDataIndex = (axisInfo: any): number => {
      if (!axisInfo) {
        return -1;
      }
      if (typeof axisInfo.dataIndex === 'number' && axisInfo.dataIndex >= 0) {
        return axisInfo.dataIndex;
      }
      if (typeof axisInfo.value === 'number' && axisInfo.value >= 0) {
        return axisInfo.value;
      }
      if (axisInfo.value != null && axisInfo.value !== '') {
        const idx = sourceDataRef.current.xAxisData.indexOf(String(axisInfo.value));
        if (idx >= 0) {
          return idx;
        }
      }
      return -1;
    };

    instance.on('updateAxisPointer', (event: any) => {
      const axisInfo = event && Array.isArray(event.axesInfo) ? event.axesInfo[0] : null;
      const dataIndex = resolveAxisDataIndex(axisInfo);
      if (dataIndex >= 0) {
        axisTipRef.current = { dataIndex };
      }
    });

    instance.on('showTip', (event: any) => {
      if (event && typeof event.dataIndex === 'number' && event.dataIndex >= 0) {
        axisTipRef.current = { dataIndex: event.dataIndex };
      }
    });

    // setOption 会触发 hideTip；忽略程序化关闭，仅用户移出图表时真正关闭
    instance.on('hideTip', () => {
      if (ignoreHideTipRef.current) {
        return;
      }
      // 指针仍在图内：视为 ws 冲刷，保留钉住状态
      if (pointerInsideRef.current) {
        return;
      }
      axisTipRef.current = null;
    });

    const zr = instance.getZr();
    zr.on('mousemove', (e: any) => {
      pointerInsideRef.current = true;
      if (e && typeof e.offsetX === 'number' && typeof e.offsetY === 'number') {
        lastPointerRef.current = { x: e.offsetX, y: e.offsetY };
      }
    });
    zr.on('globalout', () => {
      pointerInsideRef.current = false;
      lastPointerRef.current = null;
      ignoreHideTipRef.current = false;
      axisTipRef.current = null;
      if (ignoreHideTipTimerRef.current) {
        clearTimeout(ignoreHideTipTimerRef.current);
        ignoreHideTipTimerRef.current = null;
      }
    });

    instance.on('click', (params: any) => {
      if (params.componentType === 'series' && params.seriesName !== '__y-grid__' && onPointClickRef.current) {
        const raw = params.data;
        const realValue =
          raw && typeof raw === 'object' && raw.realValue != null
            ? raw.realValue
            : typeof raw === 'number' && Number.isFinite(raw)
              ? axisToValue(raw, yAxisTicksRef.current)
              : raw;
        onPointClickRef.current(realValue, params.seriesIndex ?? 0, params.dataIndex ?? 0);
      }
    });

    bizRef.current = {
      chart: {
        changeData: (nextData) => {
          const resolved = resolveIncomingData(nextData);

          if (resolved != null) {
            setIotData(resolved);
          }
        },
        getData: () => iotData ?? (data as VariableYStepChartPayload | any[]) ?? [],
      },
    };

    const handleResize = () => {
      instance.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ignoreHideTipTimerRef.current) {
        clearTimeout(ignoreHideTipTimerRef.current);
        ignoreHideTipTimerRef.current = null;
      }
      instance.dispose();
      echartsRef.current = null;
      structureKeyRef.current = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (bizRef.current) {
      bizRef.current.chart.getData = () => iotData ?? (data as VariableYStepChartPayload | any[]) ?? [];
    }
  }, [iotData, data]);

  useEffect(() => {
    const instance = echartsRef.current;
    if (!instance) {
      return;
    }

    const structureChanged = structureKeyRef.current !== structureKey;
    const pinnedTip = axisTipRef.current;
    const pointerInside = pointerInsideRef.current;
    const lastPointer = lastPointerRef.current;
    const shouldKeepTip = pointerInside || !!pinnedTip;
    const prevLen = xAxisLenRef.current;
    const nextLen = sourceData.xAxisData.length;

    const resolvePinnedDataIndex = () => {
      if (!pinnedTip || pinnedTip.dataIndex < 0 || nextLen <= 0) {
        return -1;
      }
      if (prevLen > 0 && pinnedTip.dataIndex >= prevLen - 1) {
        return nextLen - 1;
      }
      if (prevLen > 0) {
        const offsetFromEnd = prevLen - 1 - pinnedTip.dataIndex;
        return Math.max(0, Math.min(nextLen - 1, nextLen - 1 - offsetFromEnd));
      }
      return Math.min(pinnedTip.dataIndex, nextLen - 1);
    };

    const beginIgnoreHideTip = () => {
      ignoreHideTipRef.current = true;
      if (ignoreHideTipTimerRef.current) {
        clearTimeout(ignoreHideTipTimerRef.current);
      }
      // ws 可能连续推送，窗口略长于单次渲染
      ignoreHideTipTimerRef.current = setTimeout(() => {
        ignoreHideTipRef.current = false;
        ignoreHideTipTimerRef.current = null;
      }, 200);
    };

    const restoreTooltip = () => {
      const chart = echartsRef.current;
      if (!chart || !shouldKeepTip) {
        return;
      }

      // 优先按鼠标像素坐标恢复（axis tooltip 最稳，不依赖 seriesIndex）
      if (pointerInside && lastPointer) {
        chart.dispatchAction({
          type: 'showTip',
          x: lastPointer.x,
          y: lastPointer.y,
        });
        return;
      }

      const dataIndex = resolvePinnedDataIndex();
      if (dataIndex < 0) {
        return;
      }
      axisTipRef.current = { dataIndex };
      // 跳过网格线系列，落到第一条业务线
      const seriesCount = Array.isArray(sourceData.yAxisData) ? sourceData.yAxisData.length : 0;
      const seriesIndex = seriesCount > 0 ? 0 : 0;
      chart.dispatchAction({
        type: 'showTip',
        seriesIndex,
        dataIndex,
      });
    };

    if (shouldKeepTip) {
      beginIgnoreHideTip();
    }

    if (structureChanged) {
      structureKeyRef.current = structureKey;
      const nextOption = {
        ...buildOption,
        legend: {
          ...buildOption.legend,
          selected: legendSelectedRef.current,
        },
      };
      // 结构变化才全量替换；同步渲染便于立刻 showTip
      instance.setOption(nextOption, { notMerge: true, lazyUpdate: false });
    } else {
      // 仅数据滑动：按 series.id 合并，禁止 replaceMerge（会拆掉 tooltip 内部状态）
      instance.setOption(buildDataOption, {
        lazyUpdate: false,
        silent: true,
      });
    }

    xAxisLenRef.current = nextLen;

    if (shouldKeepTip) {
      // 双 rAF：等 setOption 完成布局后再钉回 tip
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreTooltip);
      });
    }
  }, [buildOption, buildDataOption, structureKey, sourceData.xAxisData.length, sourceData.yAxisData.length]);

  useEffect(() => {
    init(props, bizRef, bcRef as unknown as BroadcastChannel);

    return () => {
      destroy(props, bcRef as unknown as BroadcastChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`bizpack-variable-y-step-line-chart ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-variable-y-step-line-chart-chart" ref={chartRef} />
    </div>
  );
};

VariableYStepLineChart.displayName = 'VariableYStepLineChart';
export default React.memo(VariableYStepLineChart);
