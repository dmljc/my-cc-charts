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
  /** 系列分组字段名（flat 数据模式） */
  seriesField?: string;
  /** y 轴数值字段名（flat 数据模式），默认 'value' */
  yField?: string;
  /** y 轴对数底数，默认 10，设置为 0 则使用线性轴 */
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

/** 默认 x 轴数据（20 条日期） */
const DEFAULT_X_DATA = [
  '01-01', '01-02', '01-03', '01-04', '01-05',
  '01-06', '01-07', '01-08', '01-09', '01-10',
  '01-11', '01-12', '01-13', '01-14', '01-15',
  '01-16', '01-17', '01-18', '01-19', '01-20',
];

/** 默认系列数据 */
const DEFAULT_SERIES: YAxisSeriesConfig[] = [
  {
    name: '曲线A',
    data: [0.015, 0.03, 0.045, 0.06, 0.075, 0.09, 0.105, 0.12, 0.135, 0.15, 0.165, 0.18, 0.195, 0.21, 0.225, 0.24, 0.255, 0.27, 0.285, 0.3],
  },
  {
    name: '曲线B',
    data: [0.03, 0.015, 0.06, 0.045, 0.09, 0.075, 0.12, 0.105, 0.15, 0.135, 0.18, 0.165, 0.21, 0.195, 0.24, 0.225, 0.27, 0.255, 0.3, 0.285],
  },
  {
    name: '曲线C',
    data: [0.075, 0.06, 0.09, 0.105, 0.045, 0.12, 0.135, 0.09, 0.165, 0.18, 0.12, 0.21, 0.15, 0.24, 0.18, 0.27, 0.21, 0.3, 0.24, 0.285],
  },
  {
    name: '高值曲线',
    data: [1, 1.5, 2, 2.8, 3.2, 3.9, 4.5, 5.1, 5.8, 6.2, 6.9, 7.3, 7.8, 8.2, 8.6, 9, 9.3, 9.5, 9.8, 10],
  },
];

/** 默认系列颜色 */
const DEFAULT_COLORS = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];

/** 默认顶部时间范围筛选选项 */
const DEFAULT_TIME_RANGE_OPTIONS = ['实时', '半小时', '1小时'];

const TOOLTIP_CLASS_NAME = 'bizpack-variable-y-step-line-chart-tooltip';

/** 格式化 tooltip 数值 */
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

/** 构建轴触发 tooltip 配置 */
const buildAxisTooltipConfig = () => ({
  trigger: 'axis',
  confine: true,
  className: TOOLTIP_CLASS_NAME,
  backgroundColor: 'rgba(8, 24, 46, 0.92)',
  borderColor: 'rgba(80, 160, 220, 0.4)',
  borderWidth: 1,
  padding: [14, 16],
  extraCssText: 'border-radius: 8px; box-shadow: 0 0 24px rgba(20, 130, 220, 0.35), inset 0 0 30px rgba(30, 120, 200, 0.12); backdrop-filter: blur(6px);',
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
    const rows = items.map((item: any) => {
      const value = Array.isArray(item.value) ? item.value[item.value.length - 1] : item.value;

      return (
        `<div class="${TOOLTIP_CLASS_NAME}__row">`
        + `<span class="${TOOLTIP_CLASS_NAME}__name">${item.seriesName ?? ''}</span>`
        + `<span class="${TOOLTIP_CLASS_NAME}__value">${formatTooltipValue(value)}</span>`
        + '</div>'
      );
    }).join('');

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

/** 将 flat 数据转换为 series 格式 */
const transformFlatData = (
  data: any[],
  xField: string,
  seriesField: string,
  yField: string,
): { xAxisData: string[]; yAxisData: YAxisSeriesConfig[] } => {
  const xLabels: string[] = [];
  const seriesMap: Record<string, number[]> = {};

  data.forEach((item) => {
    const label = item[xField] ?? '';
    const seriesKey = item[seriesField] ?? 'default';
    const value = item[yField] ?? 0;

    if (!seriesMap[seriesKey]) {
      seriesMap[seriesKey] = [];
    }

    // 去重 x 轴标签
    if (!xLabels.includes(label)) {
      xLabels.push(label);
    }

    seriesMap[seriesKey].push(Number(value));
  });

  return {
    xAxisData: xLabels,
    yAxisData: Object.entries(seriesMap).map(([name, data]) => ({ name, data })),
  };
};

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
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;
  const rootDomProps = pickRootDomProps(otherProps);
  const [internalActiveTimeRange, setInternalActiveTimeRange] = useState<string>(
    activeTimeRangeProp ?? defaultActiveTimeRange ?? timeRangeOptions[0],
  );
  const activeTimeRange = activeTimeRangeProp ?? internalActiveTimeRange;

  useEffect(() => {
    if (activeTimeRangeProp !== undefined) {
      setInternalActiveTimeRange(activeTimeRangeProp);
    }
  }, [activeTimeRangeProp]);

  const handleTimeRangeChange = (value: string, index: number) => {
    if (activeTimeRangeProp === undefined) {
      setInternalActiveTimeRange(value);
    }
    if (onTimeRangeChange) {
      onTimeRangeChange(value, index);
    }
  };

  // 处理数据
  const { xAxisData, yAxisData } = useMemo(() => {
    if (propXAxisData && propYAxisData) {
      return { xAxisData: propXAxisData, yAxisData: propYAxisData };
    }
    if (data.length > 0) {
      return transformFlatData(data, xField, seriesField, yField);
    }
    return { xAxisData: DEFAULT_X_DATA, yAxisData: DEFAULT_SERIES };
  }, [data, propXAxisData, propYAxisData, xField, seriesField, yField]);

  // 构建 ECharts 配置
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
        data: xAxisData,
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
        type: logBase > 0 ? 'log' : 'value',
        ...(logBase > 0 ? { logBase } : {}),
        min: 0,
        max: logBase > 0 ? 10 : undefined,
        minorSplitLine: {
          show: false,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(176, 208, 220, 0.24)',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: 'rgba(218, 230, 235, 0.68)',
          fontSize: 12,
        },
      },
      series: yAxisData.map((seriesItem, index) => {
        const seriesColor = seriesItem.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

        return {
          name: seriesItem.name,
          type: 'line',
          data: seriesItem.data,
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
      }),
    };

    return option;
  }, [title, xAxisData, yAxisData, logBase, showLegend, legendPosition]);

  // 初始化 ECharts 实例
  useEffect(() => {
    if (!chartRef.current) return;

    const instance = echarts.init(chartRef.current);
    echartsRef.current = instance;
    instance.setOption(buildOption);

    // 绑定点击事件
    if (onPointClick) {
      instance.on('click', (params: any) => {
        if (params.componentType === 'series') {
          onPointClick(params.data, params.seriesIndex ?? 0, params.dataIndex ?? 0);
        }
      });
    }

    // 设置 bizRef 供 IoT 数据源使用
    bizRef.current = {
      chart: {
        changeData: (nextData: any[]) => {
          if (Array.isArray(nextData) && nextData.length > 0) {
            // 支持 flat 格式数据更新
            const transformed = transformFlatData(nextData, xField, seriesField, yField);
            instance.setOption({
              xAxis: { data: transformed.xAxisData },
              series: transformed.yAxisData.map((item, idx) => {
                const seriesColor = item.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

                return {
                  name: item.name,
                  type: 'line',
                  data: item.data,
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
                };
              }),
            });
          }
        },
        getData: () => data,
      },
    };

    // 响应式调整
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

  // 数据变化时更新图表
  useEffect(() => {
    if (echartsRef.current) {
      echartsRef.current.setOption(buildOption, true);
    }
  }, [buildOption]);

  // IoT 数据源初始化
  useEffect(() => {
    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
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
