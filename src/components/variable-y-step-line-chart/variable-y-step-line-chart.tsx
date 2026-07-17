import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { destroy, init } from '../../common/iot';
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
  /** y 轴对数底数（兼容旧配置，当前固定使用等距分段刻度 0 / 0.5 / 1 / 5000 / 10000） */
  logBase?: number;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 图例位置 */
  legendPosition?: 'left' | 'right' | 'top' | 'bottom';
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

/** y 轴 5 个等距刻度；虚线仅画在 0.5 / 1 / 5000 / 10000 */
const Y_AXIS_TICKS = [0, 0.5, 1, 5000, 10000];
const Y_AXIS_GRID_DISPLAY_VALUES = [1, 2, 3, 4];
const Y_AXIS_DISPLAY_MAX = Y_AXIS_TICKS.length - 1;

const formatAxisTickValue = (value: number): string => {
  if (value >= 1000) {
    return String(Math.round(value));
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return parseFloat(value.toPrecision(3)).toString();
};

/** 真实值 → 等距显示坐标（0~4） */
export const valueToAxis = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return null;
  }

  const num = Number(value);

  if (num <= Y_AXIS_TICKS[0]) {
    return 0;
  }

  if (num >= Y_AXIS_TICKS[Y_AXIS_TICKS.length - 1]) {
    return Y_AXIS_DISPLAY_MAX;
  }

  for (let index = 0; index < Y_AXIS_TICKS.length - 1; index += 1) {
    const start = Y_AXIS_TICKS[index];
    const end = Y_AXIS_TICKS[index + 1];

    if (num >= start && num <= end) {
      const ratio = (num - start) / (end - start);

      return index + ratio;
    }
  }

  return Y_AXIS_DISPLAY_MAX;
};

/** 等距显示坐标 → 真实值 */
export const axisToValue = (axisValue: number): number => {
  if (!Number.isFinite(axisValue)) {
    return 0;
  }

  if (axisValue <= 0) {
    return Y_AXIS_TICKS[0];
  }

  if (axisValue >= Y_AXIS_DISPLAY_MAX) {
    return Y_AXIS_TICKS[Y_AXIS_TICKS.length - 1];
  }

  const index = Math.floor(axisValue);
  const ratio = axisValue - index;
  const start = Y_AXIS_TICKS[index];
  const end = Y_AXIS_TICKS[index + 1];

  return start + (end - start) * ratio;
};

const DEFAULT_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];
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

      return `${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
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
  if (value === null || value === undefined || value === '-') {
    return '-';
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    return String(value);
  }

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

const buildAxisTooltipConfig = () => ({
  trigger: 'axis',
  confine: true,
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
    const items = Array.isArray(params) ? params : [params];

    if (!items.length) {
      return '';
    }

    const axisLabel = items[0].axisValue ?? items[0].name ?? '';
    const rows = items
      .map((item: any) => {
        const dataItem = item.data;
        const rawValue = Array.isArray(item.value) ? item.value[item.value.length - 1] : item.value;
        // 优先用系列里保存的原始值，避免坐标映射往返误差
        const realValue =
          dataItem && typeof dataItem === 'object' && dataItem.realValue != null
            ? dataItem.realValue
            : typeof rawValue === 'number' && Number.isFinite(rawValue)
              ? axisToValue(rawValue)
              : rawValue;

        return (
          `<div class="${TOOLTIP_CLASS_NAME}__row">`
          + `<span class="${TOOLTIP_CLASS_NAME}__name">${item.seriesName ?? ''}</span>`
          + `<span class="${TOOLTIP_CLASS_NAME}__value">${formatTooltipValue(realValue)}</span>`
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

/** 按 topic / data / init_data 取出系列数值数组 */
const pickSeriesValues = (
  item: VariableYStepSeriesItem | undefined,
  topic?: string,
): Array<number | null> => {
  if (!item || typeof item !== 'object') {
    return [];
  }

  const candidates: unknown[] = [];

  if (topic && typeof topic === 'string' && topic.trim() !== '') {
    candidates.push(item[topic]);
  }

  candidates.push(item.data, item.init_data);

  // 兜底：取系列对象里第一个数组字段（排除非数值结构）
  Object.keys(item).forEach((key) => {
    if (key === 'name' || key === 'color') {
      return;
    }

    candidates.push(item[key]);
  });

  const matched = candidates.find((value) => Array.isArray(value));

  return Array.isArray(matched) ? matched as Array<number | null> : [];
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
      if (value === null || value === undefined || value === '') {
        return null as unknown as number;
      }

      const num = Number(value);

      return Number.isFinite(num) ? num : (null as unknown as number);
    })
  );

  // 图例取 series[].name（设备1/2/3…）；数值取 topic 指定字段（如 init_data）
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
    const used = new Set(fromLegend.map((item) => item.name));
    const rest = yAxisData.filter((item) => !used.has(item.name));
    orderedSeries = [...fromLegend, ...rest];
  }

  return {
    xAxisData: xAxis.map((label) => String(label ?? '')),
    yAxisData: orderedSeries,
    legend: Array.isArray(legend) && legend.length > 0
      ? legend.map((item) => String(item))
      : orderedSeries.map((item) => item.name),
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

const buildSeriesOption = (yAxisData: YAxisSeriesConfig[]) =>
  yAxisData.map((seriesItem, index) => {
    const seriesColor = seriesItem.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

    return {
      name: seriesItem.name,
      type: 'line',
      smooth: true,
      // 保留 realValue，tooltip/点击回调直接用原始值，避免坐标往返误差
      data: seriesItem.data.map((value) => {
        const axisValue = valueToAxis(value);

        if (axisValue === null) {
          return null;
        }

        return {
          value: axisValue,
          realValue: value,
        };
      }),
      connectNulls: false,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 6,
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
        itemStyle: {
          color: '#ffffff',
          borderColor: seriesColor,
          borderWidth: 2,
        },
      },
    };
  });

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
    onPointClick,
    ...otherProps
  } = props;

  const chartRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);
  const bizRef = useRef<BizRef | null>(null);
  const onPointClickRef = useRef(onPointClick);
  const bcRef = useRef<BroadcastChannel | null>(null);
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
    const fromIotPayload = normalizeApiPayload(iotData);

    if (fromIotPayload) {
      return fromIotPayload;
    }

    if (Array.isArray(iotData) && iotData.length > 0) {
      return transformFlatData(iotData, xField, seriesField, yField, timeField);
    }

    const fromDataPayload = normalizeApiPayload(data);

    if (fromDataPayload) {
      return fromDataPayload;
    }

    const structured = normalizeStructuredSource(propXAxisData, propYAxisData);

    if (structured) {
      return structured;
    }

    if (Array.isArray(data) && data.length > 0) {
      return transformFlatData(data, xField, seriesField, yField, timeField);
    }

    return DEFAULT_SOURCE;
  }, [iotData, data, propXAxisData, propYAxisData, xField, seriesField, yField, timeField]);

  const buildOption = useMemo(() => {
    const legendData = sourceData.legend ?? sourceData.yAxisData.map((item) => item.name);
    const option: any = {
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
      tooltip: buildAxisTooltipConfig(),
      legend: {
        show: showLegend,
        left: legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center',
        top: legendPosition === 'top' ? 'top' : undefined,
        bottom: legendPosition === 'bottom' ? 'bottom' : undefined,
        data: legendData,
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
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: Y_AXIS_DISPLAY_MAX,
        interval: 1,
        axisTick: {
          show: true,
          customValues: [0, 1, 2, 3, 4],
        },
        axisLabel: {
          customValues: [0, 1, 2, 3, 4],
          color: 'rgba(218, 230, 235, 0.68)',
          fontSize: 12,
          formatter: (value: number) => {
            const tickIndex = Math.round(value);

            if (tickIndex < 0 || tickIndex >= Y_AXIS_TICKS.length) {
              return '';
            }

            return formatAxisTickValue(Y_AXIS_TICKS[tickIndex]);
          },
        },
        // 0 刻度不画横线，虚线由 markLine 画在 0.5/1/5000/10000
        splitLine: {
          show: false,
        },
        minorSplitLine: {
          show: false,
        },
      },
      series: [
        ...buildSeriesOption(sourceData.yAxisData),
        {
          type: 'line',
          name: '__y-grid__',
          data: [],
          silent: true,
          tooltip: { show: false },
          legendHoverLink: false,
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
        },
      ],
    };

    return option;
  }, [title, sourceData, showLegend, legendPosition]);

  useEffect(() => {
    if (!chartRef.current) {
      return undefined;
    }

    const instance = echarts.init(chartRef.current);
    echartsRef.current = instance;
    instance.setOption(buildOption);

    instance.on('click', (params: any) => {
      if (params.componentType === 'series' && params.seriesName !== '__y-grid__' && onPointClickRef.current) {
        const raw = params.data;
        const realValue =
          raw && typeof raw === 'object' && raw.realValue != null
            ? raw.realValue
            : typeof raw === 'number' && Number.isFinite(raw)
              ? axisToValue(raw)
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
      instance.dispose();
      echartsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (bizRef.current) {
      bizRef.current.chart.getData = () => iotData ?? (data as VariableYStepChartPayload | any[]) ?? [];
    }
  }, [iotData, data]);

  useEffect(() => {
    if (echartsRef.current) {
      echartsRef.current.setOption(buildOption, true);
    }
  }, [buildOption]);

  useEffect(() => {
    init(props, bizRef, bcRef.current as BroadcastChannel);

    return () => {
      destroy(props, bcRef.current as BroadcastChannel);
    };
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
export default VariableYStepLineChart;
