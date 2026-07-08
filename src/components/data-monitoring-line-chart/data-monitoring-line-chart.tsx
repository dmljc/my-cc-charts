import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { destroy, init } from '../../common/iot';
import { DEFAULT_DATA_MONITORING_LINE_CHART_TEST_DATA } from './test-data';
import './index.scss';

export interface DataMonitoringLineChartPoint {
  label?: string | number;
  value?: number;
  [key: string]: unknown;
}

export interface DataMonitoringLineChartProps {
  /** 图表数据 */
  data?: DataMonitoringLineChartPoint[];
  /** x 轴映射字段名，默认 label */
  xField?: string;
  /** y 轴数值映射字段名，默认 value */
  yField?: string;
  /** y 轴最小值，默认 0 */
  min?: number;
  /** y 轴最大值，默认 5 */
  max?: number;
  /** 曲线颜色，默认浅蓝色 */
  lineColor?: string;
  /** 面积渐变起止颜色 */
  areaColor?: [string, string];
  /** 是否显示横轴时间标签，默认 true */
  showXAxisLabels?: boolean;
  /** 横轴最多展示几个标签，默认 5 */
  xAxisLabelCount?: number;
  /** 横轴末尾单位标注，仅在 showXAxisLabels 为 false 时显示，默认 't' */
  xAxisUnitLabel?: string;
  /** 是否在曲线末端展示最新数值标注，默认 true */
  showLatestValue?: boolean;
  /** 是否开启鼠标/触控缩放，默认 true */
  enableDataZoom?: boolean;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onPointClick?: (item: DataMonitoringLineChartPoint, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DataMonitoringLineChartPoint[]) => void;
    getData: () => DataMonitoringLineChartPoint[];
  };
}

const DEFAULT_DATA = DEFAULT_DATA_MONITORING_LINE_CHART_TEST_DATA as DataMonitoringLineChartPoint[];

const DEFAULT_LINE_COLOR = '#5bc8ff';
const DEFAULT_AREA_COLOR: [string, string] = ['rgba(30, 110, 220, 0.85)', 'rgba(20, 60, 140, 0.15)'];

const padTimePart = (value: number) => String(value).padStart(2, '0');

const formatDateToTime = (date: Date) => (
  `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}:${padTimePart(date.getSeconds())}`
);

const formatTimeLabel = (value: string | number | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const rawValue = String(value);
  const timeMatch = rawValue.match(/(?:^|\s|T)(\d{1,2}):(\d{2})(?::(\d{2}))?/);

  if (timeMatch) {
    return `${padTimePart(Number(timeMatch[1]))}:${timeMatch[2]}:${timeMatch[3] ?? '00'}`;
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
      return formatDateToTime(date);
    }
  }

  const parsedDate = new Date(rawValue.replace(/-/g, '/'));

  if (!Number.isNaN(parsedDate.getTime())) {
    return formatDateToTime(parsedDate);
  }

  return rawValue;
};

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

const formatTooltipValue = (value: number | string | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const num = Number(value);

  return Number.isNaN(num) ? String(value) : String(parseFloat(num.toFixed(2)));
};

const DataMonitoringLineChart: React.FC<DataMonitoringLineChartProps> = function DataMonitoringLineChart(props) {
  const {
    data = DEFAULT_DATA,
    xField = 'label',
    yField = 'value',
    min = 0,
    max = 5,
    lineColor = DEFAULT_LINE_COLOR,
    areaColor = DEFAULT_AREA_COLOR,
    showXAxisLabels = true,
    xAxisLabelCount = 5,
    xAxisUnitLabel = 't',
    showLatestValue = true,
    enableDataZoom = true,
    width = 400,
    height = 100,
    style = {},
    className = '',
    onPointClick,
    ...otherProps
  } = props;

  const chartRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);
  const bizRef = useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;
  const rootDomProps = pickRootDomProps(otherProps);
  const [items, setItems] = useState<DataMonitoringLineChartPoint[]>(data);
  const itemsRef = useRef<DataMonitoringLineChartPoint[]>(data);
  const onPointClickRef = useRef(onPointClick);

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    onPointClickRef.current = onPointClick;
  }, [onPointClick]);

  const buildOption = useMemo(() => {
    const xAxisData = items.map((item) => (item as any)[xField]);
    const showUnitLabel = !showXAxisLabels && Boolean(xAxisUnitLabel);
    const seriesData = items.map((item) => (item as any)[yField]);
    const lastRawValue = items.length > 0 ? (items[items.length - 1] as any)[yField] : undefined;
    const latestText = showLatestValue && lastRawValue !== null && lastRawValue !== undefined
      ? formatTooltipValue(lastRawValue)
      : null;
    const isLargeData = items.length > 500;
    const labelStep = Math.max(1, Math.ceil(items.length / Math.max(xAxisLabelCount, 1)));
    const splitNumber = Math.max(1, Math.round(max - min));

    return {
      animation: !isLargeData,
      dataZoom: enableDataZoom
        ? [
          {
            type: 'inside',
            xAxisIndex: 0,
            filterMode: 'none',
            zoomOnMouseWheel: true,
            moveOnMouseMove: true,
            moveOnMouseWheel: false,
          },
        ]
        : undefined,
      graphic: [
        ...(latestText !== null ? [
          {
            type: 'text',
            right: 4,
            top: 20,
            z: 100,
            style: {
              text: latestText,
              fill: 'rgba(234, 247, 255, 0.95)',
              fontSize: 12,
              fontWeight: 'bold',
              fontFamily: 'DIN Alternate, Arial, sans-serif',
              textAlign: 'right',
              textVerticalAlign: 'middle',
            },
          },
        ] : []),
        ...(showUnitLabel && xAxisUnitLabel ? [
          {
            type: 'text',
            right: 4,
            bottom: 4,
            z: 100,
            style: {
              text: xAxisUnitLabel,
              fill: 'rgba(218, 230, 235, 0.75)',
              fontSize: 12,
              fontFamily: 'PingFang SC, Microsoft YaHei, Arial, sans-serif',
              textAlign: 'right',
              textVerticalAlign: 'bottom',
            },
          },
        ] : []),
      ],
      grid: {
        top: latestText !== null ? 30 : 12,
        left: 8,
        right: 16,
        bottom: showXAxisLabels ? 8 : (showUnitLabel ? 18 : 2),
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        show: showXAxisLabels,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          show: showXAxisLabels,
          interval: (index: number) => (
            index === 0 || index === items.length - 1 || index % labelStep === 0
          ),
          color: 'rgba(218, 230, 235, 0.58)',
          formatter: (value: string | number) => formatTimeLabel(value),
          fontSize: 10,
          margin: 2,
          hideOverlap: true,
        },
      },
      yAxis: {
        type: 'value',
        min,
        max,
        splitNumber,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(176, 208, 220, 0.28)',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: 'rgba(218, 230, 235, 0.75)',
          fontSize: 12,
        },
      },
      series: [
        {
          type: 'line',
          data: seriesData,
          smooth: true,
          symbol: 'none',
          sampling: 'lttb',
          large: isLargeData,
          largeThreshold: 800,
          progressive: isLargeData ? 800 : 0,
          progressiveThreshold: 1000,
          lineStyle: {
            color: lineColor,
            width: 3,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: areaColor[0] },
              { offset: 1, color: areaColor[1] },
            ]),
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        confine: true,
        transitionDuration: isLargeData ? 0 : 0.2,
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: 'rgba(150, 200, 230, 0.45)',
            type: 'dashed',
            width: 1,
          },
        },
        backgroundColor: 'rgba(8, 24, 46, 0.92)',
        borderColor: 'rgba(80, 160, 220, 0.4)',
        borderWidth: 1,
        textStyle: {
          color: '#eaf7ff',
          fontSize: 12,
        },
        formatter: (params: any) => {
          const item = Array.isArray(params) ? params[0] : params;
          const value = Array.isArray(item?.value) ? item.value[item.value.length - 1] : item?.value;
          const timeText = formatTimeLabel(item?.axisValue ?? item?.name);

          return `数值：${formatTooltipValue(value)}<br />时间：${timeText}`;
        },
      },
    };
  }, [
    items,
    xField,
    yField,
    min,
    max,
    lineColor,
    areaColor,
    showXAxisLabels,
    xAxisLabelCount,
    xAxisUnitLabel,
    showLatestValue,
    enableDataZoom,
  ]);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    const instance = echarts.init(chartRef.current);
    echartsRef.current = instance;
    instance.setOption(buildOption);

    instance.on('click', (params: any) => {
      if (params.componentType === 'series' && onPointClickRef.current) {
        onPointClickRef.current(itemsRef.current[params.dataIndex], params.dataIndex ?? 0);
      }
    });

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
    if (echartsRef.current) {
      echartsRef.current.setOption(buildOption, true);
    }
  }, [buildOption]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DataMonitoringLineChartPoint[]) => {
          if (Array.isArray(nextData)) {
            setItems(nextData);
          }
        },
        getData: () => itemsRef.current,
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  return (
    <div
      className={`bizpack-data-monitoring-line-chart ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-data-monitoring-line-chart-chart" ref={chartRef} />
    </div>
  );
};

DataMonitoringLineChart.displayName = 'DataMonitoringLineChart';
export default DataMonitoringLineChart;
