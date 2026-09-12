import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { destroy, init } from '../../common/iot';
import {
  normalizeApiPayload,
  transformFlatData,
} from '../variable-y-step-line-chart';
import type {
  VariableYStepChartPayload,
  YAxisSeriesConfig,
} from '../variable-y-step-line-chart';
import { mergeRealtimePayload, resolveIncomingData } from './realtime-payload';
import { DEFAULT_EFFLUENT_LINE_CHART_TEST_DATA } from './test-data';
import './index.scss';

export interface EffluentLineChartProps {
  title?: string;
  /** @deprecated 请使用 data.xAxis */
  xAxisData?: string[];
  /** @deprecated 请使用 data.series */
  yAxisData?: YAxisSeriesConfig[];
  /**
   * 图表数据（接口对象），字段与可变 Y 轴折线图一致：
   * { xAxis, series: [{ name, data|init_data, color? }], topic?, legend? }
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
  /** 是否显示图例，默认关闭（与截图一致） */
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
  legend?: string[];
}

/** 与 LineChartsByRoom 截图接近的默认色板：橙 / 薄荷绿 / 蓝紫 / 玫红 */
const DEFAULT_COLORS = ['#EE8C45', '#6BC7A6', '#7492DB', '#E06C75', '#73c0de', '#9a60b4'];
const DEFAULT_MAX_POINTS = 15 * 60;
const TOOLTIP_CLASS_NAME = 'bizpack-effluent-line-chart-tooltip';
const GRID_LEFT = 40;
const GRID_RIGHT = 12;
/** 容器已有 1px padding，这里只留轴文字高度 */
const GRID_TOP = 12;
const GRID_BOTTOM = 22;
const GRID_GAP = 24;
const AXIS_LABEL_COLOR = 'rgba(218, 230, 235, 0.68)';
const AXIS_LINE_COLOR = 'rgba(176, 208, 220, 0.3)';

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

const padTimePart = (value: number) => String(value).padStart(2, '0');

const formatDateToHms = (date: Date) => (
  `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}:${padTimePart(date.getSeconds())}`
);

/** 横轴：有秒且非 00 时显示 HH:mm:ss，否则 HH:mm（与 LineChartsByRoom 截图一致） */
const formatTimeLabel = (value: string | number | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const rawValue = String(value);
  const timeMatch = rawValue.match(/(?:^|\s|T)(\d{1,2}):(\d{2})(?::(\d{2}))?/);

  if (timeMatch) {
    const hours = padTimePart(Number(timeMatch[1]));
    const minutes = timeMatch[2];
    const seconds = timeMatch[3];

    if (seconds && seconds !== '00') {
      return `${hours}:${minutes}:${seconds}`;
    }

    return `${hours}:${minutes}`;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    if (numericValue >= 0 && numericValue < 24 * 60 * 60) {
      const hours = Math.floor(numericValue / 3600);
      const minutes = Math.floor((numericValue % 3600) / 60);
      const seconds = Math.floor(numericValue % 60);

      if (seconds !== 0) {
        return `${padTimePart(hours)}:${padTimePart(minutes)}:${padTimePart(seconds)}`;
      }

      return `${padTimePart(hours)}:${padTimePart(minutes)}`;
    }

    const timestamp = numericValue > 1e12 ? numericValue : numericValue * 1000;
    const date = new Date(timestamp);

    if (!Number.isNaN(date.getTime())) {
      const seconds = date.getSeconds();

      if (seconds !== 0) {
        return formatDateToHms(date);
      }

      return `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}`;
    }
  }

  const parsedDate = new Date(rawValue.replace(/-/g, '/'));

  if (!Number.isNaN(parsedDate.getTime())) {
    const seconds = parsedDate.getSeconds();

    if (seconds !== 0) {
      return formatDateToHms(parsedDate);
    }

    return `${padTimePart(parsedDate.getHours())}:${padTimePart(parsedDate.getMinutes())}`;
  }

  return rawValue;
};

const trimDecimal = (text: string): string => {
  if (!text.includes('.')) {
    return text;
  }

  return text.replace(/0+$/, '').replace(/\.$/, '');
};

/** 与 LineChartsByRoom 一致的 Y 轴刻度文案 */
const formatYAxisValue = (value: number, span?: number): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const abs = Math.abs(value);
  const unit = abs >= 10000 ? 10000 : abs >= 1000 ? 1000 : 0;

  if (unit) {
    const relativeSpan =
      span != null && Number.isFinite(span) && span > 0 ? Math.abs(span) / unit : 1;
    const digits = Math.min(4, Math.max(0, Math.ceil(-Math.log10(relativeSpan))));
    const suffix = unit === 10000 ? 'w' : 'k';

    return `${trimDecimal((value / unit).toFixed(digits))}${suffix}`;
  }

  if (Math.abs(value - Math.round(value)) < 1e-8) {
    return String(Math.round(value));
  }

  if (abs >= 100) {
    return trimDecimal(value.toFixed(1));
  }

  if (abs >= 1) {
    return trimDecimal(value.toFixed(2));
  }

  return trimDecimal(value.toFixed(4));
};

const isYAxisEndpoint = (value: number, min: number, max: number): boolean => {
  const span = Math.abs(max - min);
  const eps = Math.max(span * 1e-4, 1e-8);

  return Math.abs(value - min) <= eps || Math.abs(value - max) <= eps;
};

const normalizeYExtent = (min: number, max: number): { min: number; max: number } => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }

  if (max < min) {
    return { min: max, max: min };
  }

  if (max === min) {
    if (min === 0) {
      return { min: 0, max: 1 };
    }

    const padding = Math.max(Math.abs(min) * 0.05, 0.01);

    return { min: min - padding, max: max + padding };
  }

  return { min, max };
};

/** 按当前窗口该系列数据计算 Y 轴最小 / 最大值 */
const getSeriesYExtent = (data?: Array<number | null | undefined>): { min: number; max: number } => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  if (Array.isArray(data)) {
    data.forEach((value) => {
      const num = Number(value);

      if (Number.isFinite(num)) {
        if (num < min) {
          min = num;
        }

        if (num > max) {
          max = num;
        }
      }
    });
  }

  return normalizeYExtent(min, max);
};

const formatTooltipValue = (value: number | string | null | undefined): string => {
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

  if (num === 0) {
    return '0';
  }

  const abs = Math.abs(num);

  if (abs > 0 && abs < 0.001) {
    return num.toExponential(2);
  }

  if (Number.isInteger(num) || Math.abs(num - Math.round(num)) < 1e-9) {
    return String(Math.round(num));
  }

  return parseFloat(num.toPrecision(6)).toString();
};

const DEFAULT_SOURCE: ChartSourceData = (() => {
  const payload = normalizeApiPayload(DEFAULT_EFFLUENT_LINE_CHART_TEST_DATA);

  return payload ?? { xAxisData: [], yAxisData: [] };
})();

type TooltipContext = {
  getSource: () => ChartSourceData;
  getLegendSelected: () => Record<string, boolean>;
};

const buildAxisTooltipConfig = (ctx: TooltipContext) => ({
  trigger: 'axis',
  confine: true,
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
    snap: true,
    lineStyle: {
      color: 'rgba(150, 200, 230, 0.5)',
      width: 1,
    },
    label: { show: false },
  },
  formatter: (params: any) => {
    const items = (Array.isArray(params) ? params : [params]).filter(Boolean);

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

    const seriesList = source.yAxisData.length > 0
      ? source.yAxisData
      : items.map((item: any) => ({
        name: String(item.seriesName ?? ''),
        data: [] as number[],
      }));

    const rows = seriesList
      .filter((seriesItem) => {
        if (!seriesItem?.name) {
          return false;
        }

        if (Object.prototype.hasOwnProperty.call(selected, seriesItem.name)) {
          return selected[seriesItem.name] !== false;
        }

        return true;
      })
      .map((seriesItem) => {
        let raw: number | string | null | undefined = null;

        if (dataIndex >= 0 && Array.isArray(seriesItem.data) && dataIndex < seriesItem.data.length) {
          raw = seriesItem.data[dataIndex] as number | null | undefined;
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
  };
};

const getSeriesStructureKey = (source: ChartSourceData) =>
  (source.legend ?? source.yAxisData.map((item) => item.name)).join('\u0001');

const buildGridOption = (count: number, height: number) => {
  const n = Math.max(count, 1);
  const safeHeight = height > 8 ? height : 600;
  const remain = Math.max(safeHeight - GRID_TOP - GRID_BOTTOM - GRID_GAP * (n - 1), 0);
  const gridHeight = remain / n;

  return Array.from({ length: n }, (_, index) => ({
    left: GRID_LEFT,
    right: GRID_RIGHT,
    top: GRID_TOP + index * (gridHeight + GRID_GAP),
    height: Math.max(gridHeight, 0),
    outerBoundsMode: 'none' as const,
  }));
};

const buildYAxisOption = (series: YAxisSeriesConfig[], index: number) => {
  const item = series[index];
  const color = item?.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  const hasData = Boolean(item?.data?.some((value) => Number.isFinite(Number(value))));
  const extent = getSeriesYExtent(item?.data);
  const span = extent.max - extent.min;

  return {
    type: 'value' as const,
    gridIndex: index,
    min: extent.min,
    max: extent.max,
    splitNumber: 1,
    scale: false,
    show: true,
    axisLine: {
      show: true,
      lineStyle: { color, width: 1.5 },
    },
    axisTick: {
      show: true,
      inside: true,
      length: 4,
      lineStyle: { color, width: 1 },
      customValues: [extent.min, extent.max],
    },
    axisLabel: {
      show: hasData,
      showMinLabel: true,
      showMaxLabel: true,
      hideOverlap: false,
      color,
      fontSize: 12,
      margin: 8,
      align: 'right' as const,
      customValues: [extent.min, extent.max],
      formatter: (value: number) => {
        if (!isYAxisEndpoint(value, extent.min, extent.max)) {
          return '';
        }

        return formatYAxisValue(value, span);
      },
    },
    splitLine: { show: false },
  };
};

const buildXAxisOption = (xAxisData: string[], count: number) => (
  Array.from({ length: count }, (_, index) => {
    const isLast = index === count - 1;

    return {
      type: 'category' as const,
      gridIndex: index,
      data: xAxisData,
      boundaryGap: false,
      show: true,
      axisTick: {
        show: isLast,
        length: 4,
        lineStyle: { color: AXIS_LINE_COLOR },
      },
      axisLine: {
        show: isLast,
        lineStyle: { color: AXIS_LINE_COLOR },
      },
      axisLabel: {
        show: isLast,
        showMinLabel: true,
        showMaxLabel: true,
        color: AXIS_LABEL_COLOR,
        fontSize: 12,
        hideOverlap: true,
        margin: 8,
        formatter: (value: string | number) => formatTimeLabel(value),
      },
      splitLine: { show: false },
    };
  })
);

const buildSeriesOption = (source: ChartSourceData) => (
  source.yAxisData.map((seriesItem, index) => {
    const seriesColor = seriesItem.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    const seriesId = `s:${index}`;
    const pointCount = Array.isArray(seriesItem.data) ? seriesItem.data.length : 0;

    return {
      id: seriesId,
      name: seriesItem.name,
      type: 'line',
      xAxisIndex: index,
      yAxisIndex: index,
      data: Array.isArray(seriesItem.data)
        ? seriesItem.data.map((value) => {
          if (value === null || value === undefined || !Number.isFinite(Number(value))) {
            return null;
          }

          return Number(value);
        })
        : [],
      connectNulls: false,
      showSymbol: false,
      smooth: false,
      sampling: pointCount > 500 ? 'lttb' : undefined,
      animation: false,
      animationDurationUpdate: 0,
      lineStyle: {
        color: seriesColor,
        width: 1.5,
      },
      itemStyle: {
        color: seriesColor,
      },
      emphasis: {
        scale: false,
        lineStyle: { width: 1.5 },
      },
    };
  })
);

const EffluentLineChart: React.FC<EffluentLineChartProps> = function EffluentLineChart(props) {
  const {
    title = '',
    data = DEFAULT_EFFLUENT_LINE_CHART_TEST_DATA,
    xAxisData: propXAxisData,
    yAxisData: propYAxisData,
    width = 400,
    height = 600,
    style = {},
    className = '',
    xField = 'label',
    seriesField = 'type',
    yField = 'value',
    timeField = 'time',
    showLegend = false,
    legendPosition = 'top',
    maxPoints = DEFAULT_MAX_POINTS,
    onPointClick,
    ...otherProps
  } = props;

  const resolvedMaxPoints = Number(maxPoints) > 0 ? Number(maxPoints) : DEFAULT_MAX_POINTS;
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);
  const bizRef = useRef<BizRef | null>(null);
  const onPointClickRef = useRef(onPointClick);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const legendSelectedRef = useRef<Record<string, boolean>>({});
  const structureKeyRef = useRef<string>('');
  const axisTipRef = useRef<{ dataIndex: number } | null>(null);
  const ignoreHideTipRef = useRef(false);
  const ignoreHideTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerInsideRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const xAxisLenRef = useRef(0);
  const sourceDataRef = useRef<ChartSourceData>(DEFAULT_SOURCE);
  const rootDomProps = pickRootDomProps(otherProps);
  const [box, setBox] = useState({ width: 0, height: 0 });

  const [iotData, setIotData] = useState<VariableYStepChartPayload | any[] | null>(null);
  const accumulatedPayloadRef = useRef<VariableYStepChartPayload | null>(null);
  const ingestIncomingRef = useRef<(incoming: unknown) => void>(() => undefined);
  const previousDataPropRef = useRef<unknown>(undefined);

  ingestIncomingRef.current = (incoming: unknown) => {
    const resolved = resolveIncomingData(incoming);
    if (resolved == null) {
      return;
    }

    if (Array.isArray(resolved)) {
      if (!resolved.length) {
        return;
      }
      accumulatedPayloadRef.current = null;
      setIotData(resolved);
      return;
    }

    const merged = mergeRealtimePayload(
      accumulatedPayloadRef.current,
      resolved,
      resolvedMaxPoints,
    );
    accumulatedPayloadRef.current = merged;
    setIotData(merged);
  };

  if (
    (!props.dataType || props.dataType === 'data')
    && data !== previousDataPropRef.current
  ) {
    previousDataPropRef.current = data;
    ingestIncomingRef.current(data);
  }

  useEffect(() => {
    onPointClickRef.current = onPointClick;
  }, [onPointClick]);

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

  sourceDataRef.current = sourceData;

  const tooltipCtxRef = useRef<TooltipContext>({
    getSource: () => sourceDataRef.current,
    getLegendSelected: () => legendSelectedRef.current,
  });
  tooltipCtxRef.current = {
    getSource: () => sourceDataRef.current,
    getLegendSelected: () => legendSelectedRef.current,
  };

  const seriesCount = Math.max(sourceData.yAxisData.length, 1);
  const chartHeight = box.height > 8 ? box.height : Number(height) || 600;

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
      }),
      legend: {
        show: showLegend,
        left: legendPosition === 'left' ? 'left' : legendPosition === 'right' ? 'right' : 'center',
        top: legendPosition === 'top' ? 'top' : undefined,
        bottom: legendPosition === 'bottom' ? 'bottom' : undefined,
        padding: 1,
        itemGap: 2,
        data: legendData,
        selected: legendSelectedRef.current,
        textStyle: {
          color: 'rgba(218, 230, 235, 0.8)',
          fontSize: 12,
        },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
      },
      grid: buildGridOption(seriesCount, chartHeight),
      xAxis: buildXAxisOption(sourceData.xAxisData, seriesCount),
      yAxis: Array.from({ length: seriesCount }, (_, index) => buildYAxisOption(sourceData.yAxisData, index)),
      series: buildSeriesOption(sourceData),
    };

    return option;
  }, [title, sourceData, showLegend, legendPosition, seriesCount, chartHeight]);

  const buildDataOption = useMemo(
    () => ({
      animation: false,
      animationDurationUpdate: 0,
      grid: buildGridOption(seriesCount, chartHeight),
      xAxis: buildXAxisOption(sourceData.xAxisData, seriesCount),
      yAxis: Array.from({ length: seriesCount }, (_, index) => buildYAxisOption(sourceData.yAxisData, index)),
      series: buildSeriesOption(sourceData),
    }),
    [sourceData, seriesCount, chartHeight],
  );

  const structureKey = useMemo(
    () =>
      [
        getSeriesStructureKey(sourceData),
        title,
        String(showLegend),
        legendPosition,
        String(seriesCount),
      ].join('\u0001'),
    [sourceData, title, showLegend, legendPosition, seriesCount],
  );

  useEffect(() => {
    const el = wrapRef.current;

    if (!el) {
      return undefined;
    }

    const update = () => {
      setBox({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

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

    instance.on('hideTip', () => {
      if (ignoreHideTipRef.current) {
        return;
      }
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
      if (params.componentType === 'series' && onPointClickRef.current) {
        const raw = params.data;
        const realValue =
          typeof raw === 'number' && Number.isFinite(raw)
            ? raw
            : raw && typeof raw === 'object' && raw.value != null
              ? raw.value
              : raw;
        onPointClickRef.current(realValue, params.seriesIndex ?? 0, params.dataIndex ?? 0);
      }
    });

    bizRef.current = {
      chart: {
        changeData: (nextData) => {
          ingestIncomingRef.current(nextData);
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
      chart.dispatchAction({
        type: 'showTip',
        seriesIndex: 0,
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
      instance.setOption(nextOption, { notMerge: true, lazyUpdate: false });
    } else {
      instance.setOption(buildDataOption, {
        lazyUpdate: false,
        silent: true,
      });
    }

    instance.resize();
    xAxisLenRef.current = nextLen;

    if (shouldKeepTip) {
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreTooltip);
      });
    }
  }, [buildOption, buildDataOption, structureKey, sourceData.xAxisData.length, sourceData.yAxisData.length, box.width, box.height]);

  useEffect(() => {
    init(props, bizRef, bcRef as unknown as BroadcastChannel);

    return () => {
      destroy(props, bcRef as unknown as BroadcastChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`bizpack-effluent-line-chart ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-effluent-line-chart-chart" ref={chartRef} />
    </div>
  );
};

EffluentLineChart.displayName = 'EffluentLineChart';
export default React.memo(EffluentLineChart);
