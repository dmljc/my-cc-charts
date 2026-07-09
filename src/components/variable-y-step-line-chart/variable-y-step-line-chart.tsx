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

export interface VariableYStepLineChartProps {
  title?: string;
  /** x 轴类别数据 */
  xAxisData?: string[];
  /** y 轴系列配置 */
  yAxisData?: YAxisSeriesConfig[];
  /** 图表数据（兼容 flat 格式，配合 xField/seriesField 使用） */
  data?: any[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** x 轴映射字段名（flat 数据模式），默认 'label' */
  xField?: string;
  /** 系列分组字段名（flat 数据模式），默认 'type' */
  seriesField?: string;
  /** y 轴数值字段名（flat 数据模式），默认 'value' */
  yField?: string;
  /** 时间字段名（flat 数据模式），默认 'time'，用于时间范围过滤 */
  timeField?: string;
  /** y 轴对数底数（兼容旧配置，当前固定使用等距分段刻度 0 / 0.5 / 1 / 5000 / 10000） */
  logBase?: number;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 图例位置 */
  legendPosition?: 'left' | 'right' | 'top' | 'bottom';
  /** 是否显示顶部时间范围筛选按钮，默认 true */
  showTimeRangeTabs?: boolean;
  /** 顶部时间范围筛选选项，默认 ['实时', '半小时', '1小时'] */
  timeRangeOptions?: string[];
  /** 当前选中的时间范围（受控），不传则组件内部维护选中态 */
  activeTimeRange?: string;
  /** 默认选中的时间范围，默认取 timeRangeOptions 第一项 */
  defaultActiveTimeRange?: string;
  /** 切换时间范围时触发 */
  onTimeRangeChange?: (value: string, index: number) => void;
  onPointClick?: (item: any, seriesIndex: number, dataIndex: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: any[]) => void;
    getData: () => any[];
  };
}

interface ChartSourceData {
  xAxisData: string[];
  yAxisData: YAxisSeriesConfig[];
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

/** 默认时间范围选项 */
const DEFAULT_TIME_RANGE_OPTIONS = ['实时', '半小时', '1小时'];

/** 时间范围对应的毫秒窗口；实时取最近 5 分钟 */
const TIME_RANGE_MS: Record<string, number> = {
  实时: 5 * 60 * 1000,
  半小时: 30 * 60 * 1000,
  '1小时': 60 * 60 * 1000,
};

/** 无真实时间戳时，按点数回退截取 */
const TIME_RANGE_POINT_COUNT: Record<string, number> = {
  实时: 10,
  半小时: 30,
  '1小时': 60,
};

const DEFAULT_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];
const TOOLTIP_CLASS_NAME = 'bizpack-variable-y-step-line-chart-tooltip';

/** 按「升→降」循环 4 次生成演示数据，覆盖 0-1 与 1-10000 */
const createDefaultSourceData = (): ChartSourceData => {
  const now = Date.now();
  const intervalMs = 60 * 1000;
  const cycles = 4;
  const pointsPerCycle = 5;
  const pointCount = cycles * pointsPerCycle;
  const xAxisData = Array.from(
    { length: pointCount },
    (_, index) => `01-${String(index + 1).padStart(2, '0')}`,
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

  return {
    xAxisData,
    timestamps,
    yAxisData: [
      { name: '曲线A', data: buildWave(0.12, 0.78, 3) },
      { name: '曲线B', data: buildWave(0.05, 0.65, 3) },
      { name: '曲线C', data: buildWave(0.22, 0.88, 3) },
      { name: '高值曲线', data: buildWave(2800, 9600, 2) },
    ],
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

  if (abs >= 1000 || (abs > 0 && abs < 0.001)) {
    return num.toExponential(2);
  }

  if (Number.isInteger(num)) {
    return String(num);
  }

  return parseFloat(num.toPrecision(3)).toString();
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
        const rawValue = Array.isArray(item.value) ? item.value[item.value.length - 1] : item.value;
        // 显示坐标还原为真实值
        const realValue =
          typeof rawValue === 'number' && Number.isFinite(rawValue)
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

const resolveTimeRangeMs = (range: string): number => {
  if (TIME_RANGE_MS[range] != null) {
    return TIME_RANGE_MS[range];
  }

  if (range.indexOf('半小时') >= 0) {
    return TIME_RANGE_MS['半小时'];
  }

  if (range.indexOf('1小时') >= 0 || range.indexOf('一小时') >= 0) {
    return TIME_RANGE_MS['1小时'];
  }

  return TIME_RANGE_MS['实时'];
};

const resolveTimeRangePointCount = (range: string): number => {
  if (TIME_RANGE_POINT_COUNT[range] != null) {
    return TIME_RANGE_POINT_COUNT[range];
  }

  if (range.indexOf('半小时') >= 0) {
    return TIME_RANGE_POINT_COUNT['半小时'];
  }

  if (range.indexOf('1小时') >= 0 || range.indexOf('一小时') >= 0) {
    return TIME_RANGE_POINT_COUNT['1小时'];
  }

  return TIME_RANGE_POINT_COUNT['实时'];
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
  };
};

/** 按时间范围过滤结构化数据 */
export const filterSourceByTimeRange = (
  source: ChartSourceData,
  timeRange: string,
): ChartSourceData => {
  const { xAxisData, yAxisData, timestamps } = source;

  if (!xAxisData.length) {
    return source;
  }

  const hasValidTimestamp =
    Array.isArray(timestamps)
    && timestamps.length === xAxisData.length
    && timestamps.every((item) => Number.isFinite(item));

  let startIndex = 0;

  if (hasValidTimestamp && timestamps) {
    const latest = Math.max(...timestamps);
    const windowMs = resolveTimeRangeMs(timeRange);
    const threshold = latest - windowMs;
    startIndex = timestamps.findIndex((item) => item >= threshold);

    if (startIndex < 0) {
      startIndex = 0;
    }
  } else {
    const keepCount = resolveTimeRangePointCount(timeRange);
    startIndex = Math.max(0, xAxisData.length - keepCount);
  }

  if (startIndex === 0) {
    return source;
  }

  return {
    xAxisData: xAxisData.slice(startIndex),
    timestamps: timestamps ? timestamps.slice(startIndex) : undefined,
    yAxisData: yAxisData.map((seriesItem) => ({
      ...seriesItem,
      data: seriesItem.data.slice(startIndex),
    })),
  };
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
  };
};

const buildSeriesOption = (yAxisData: YAxisSeriesConfig[]) =>
  yAxisData.map((seriesItem, index) => {
    const seriesColor = seriesItem.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

    return {
      name: seriesItem.name,
      type: 'line',
      smooth: true,
      data: seriesItem.data.map((value) => valueToAxis(value)),
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
    showTimeRangeTabs = true,
    timeRangeOptions = DEFAULT_TIME_RANGE_OPTIONS,
    activeTimeRange: activeTimeRangeProp,
    defaultActiveTimeRange,
    onTimeRangeChange,
    onPointClick,
    ...otherProps
  } = props;

  const chartRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);
  const bizRef = useRef<BizRef | null>(null);
  const onPointClickRef = useRef(onPointClick);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const rootDomProps = pickRootDomProps(otherProps);

  const [internalActiveTimeRange, setInternalActiveTimeRange] = useState<string>(
    activeTimeRangeProp ?? defaultActiveTimeRange ?? timeRangeOptions[0],
  );
  const activeTimeRange = activeTimeRangeProp ?? internalActiveTimeRange;

  const [iotFlatData, setIotFlatData] = useState<any[] | null>(null);

  useEffect(() => {
    onPointClickRef.current = onPointClick;
  }, [onPointClick]);

  useEffect(() => {
    if (activeTimeRangeProp !== undefined) {
      setInternalActiveTimeRange(activeTimeRangeProp);
    }
  }, [activeTimeRangeProp]);

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setIotFlatData(null);
    }
  }, [data, propXAxisData, propYAxisData, props.dataType]);

  const handleTimeRangeChange = (value: string, index: number) => {
    if (activeTimeRangeProp === undefined) {
      setInternalActiveTimeRange(value);
    }

    if (onTimeRangeChange) {
      onTimeRangeChange(value, index);
    }
  };

  const sourceData = useMemo(() => {
    if (iotFlatData && iotFlatData.length > 0) {
      return transformFlatData(iotFlatData, xField, seriesField, yField, timeField);
    }

    const structured = normalizeStructuredSource(propXAxisData, propYAxisData);

    if (structured) {
      return structured;
    }

    if (Array.isArray(data) && data.length > 0) {
      return transformFlatData(data, xField, seriesField, yField, timeField);
    }

    return DEFAULT_SOURCE;
  }, [iotFlatData, data, propXAxisData, propYAxisData, xField, seriesField, yField, timeField]);

  const filteredData = useMemo(
    () => filterSourceByTimeRange(sourceData, activeTimeRange),
    [sourceData, activeTimeRange],
  );

  const buildOption = useMemo(() => {
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
        data: filteredData.yAxisData.map((item) => item.name),
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
        data: filteredData.xAxisData,
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
        ...buildSeriesOption(filteredData.yAxisData),
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
  }, [title, filteredData, showLegend, legendPosition]);

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
          typeof raw === 'number' && Number.isFinite(raw) ? axisToValue(raw) : raw;
        onPointClickRef.current(realValue, params.seriesIndex ?? 0, params.dataIndex ?? 0);
      }
    });

    bizRef.current = {
      chart: {
        changeData: (nextData: any[]) => {
          if (Array.isArray(nextData)) {
            setIotFlatData(nextData);
          }
        },
        getData: () => iotFlatData ?? (Array.isArray(data) ? data : []),
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
      bizRef.current.chart.getData = () => iotFlatData ?? (Array.isArray(data) ? data : []);
    }
  }, [iotFlatData, data]);

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
      {showTimeRangeTabs && timeRangeOptions.length > 0 ? (
        <div className="bizpack-variable-y-step-line-chart-tabs">
          {timeRangeOptions.map((option, index) => (
            <button
              key={option}
              type="button"
              className={`bizpack-variable-y-step-line-chart-tab ${
                option === activeTimeRange ? 'bizpack-variable-y-step-line-chart-tab-active' : ''
              }`}
              onClick={() => handleTimeRangeChange(option, index)}
            >
              <span className="bizpack-variable-y-step-line-chart-tab-text">{option}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="bizpack-variable-y-step-line-chart-chart" ref={chartRef} />
    </div>
  );
};

VariableYStepLineChart.displayName = 'VariableYStepLineChart';
export default VariableYStepLineChart;
