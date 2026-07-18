import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { destroy, init } from '../../common/iot';
import { MAX_CHART_POINTS, sliceWindow } from '../../common/perf';
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
  /** y 轴最大值，默认 10000 */
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
  /** 时序点滑动窗口上限，默认 1000 */
  maxPoints?: number;
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
const EMPTY_AXIS_PLACEHOLDER_COUNT = 5;

const DEFAULT_LINE_COLOR = '#5bc8ff';
const DEFAULT_AREA_COLOR: [string, string] = ['rgba(30, 110, 220, 0.85)', 'rgba(20, 60, 140, 0.15)'];

const areaGradientCache = new Map<string, echarts.graphic.LinearGradient>();

const getAreaGradient = (startColor: string, endColor: string) => {
  const cacheKey = `${startColor}__${endColor}`;
  let gradient = areaGradientCache.get(cacheKey);

  if (!gradient) {
    gradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: startColor },
      { offset: 1, color: endColor },
    ]);
    areaGradientCache.set(cacheKey, gradient);
  }

  return gradient;
};

const padTimePart = (value: number) => String(value).padStart(2, '0');

/** 横轴时间统一展示为分:秒（mm:ss） */
const formatDateToMinuteSecond = (date: Date) => (
  `${padTimePart(date.getMinutes())}:${padTimePart(date.getSeconds())}`
);

const formatTimeLabel = (value: string | number | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const rawValue = String(value);
  // HH:mm:ss → mm:ss；HH:mm / mm:ss → 取后两段作为 mm:ss
  const timeMatch = rawValue.match(/(?:^|\s|T)(\d{1,2}):(\d{2})(?::(\d{2}))?/);

  if (timeMatch) {
    if (timeMatch[3] != null) {
      return `${timeMatch[2]}:${timeMatch[3]}`;
    }

    return `${padTimePart(Number(timeMatch[1]))}:${timeMatch[2]}`;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    if (numericValue >= 0 && numericValue < 24 * 60 * 60) {
      const minutes = Math.floor((numericValue % 3600) / 60);
      const seconds = Math.floor(numericValue % 60);

      return `${padTimePart(minutes)}:${padTimePart(seconds)}`;
    }

    const timestamp = numericValue > 1e12 ? numericValue : numericValue * 1000;
    const date = new Date(timestamp);

    if (!Number.isNaN(date.getTime())) {
      return formatDateToMinuteSecond(date);
    }
  }

  const parsedDate = new Date(rawValue.replace(/-/g, '/'));

  if (!Number.isNaN(parsedDate.getTime())) {
    return formatDateToMinuteSecond(parsedDate);
  }

  return rawValue;
};

/**
 * 在类目轴上均匀选取固定数量标签（含首尾）。
 * 使用 floor 并把余量留在最后一段，避免 round 导致中间某一档明显偏大。
 */
const buildXAxisLabelIndexSet = (length: number, labelCount: number): Set<number> => {
  const indices = new Set<number>();

  if (length <= 0) {
    return indices;
  }

  if (length === 1) {
    indices.add(0);
    return indices;
  }

  const count = Math.min(Math.max(Math.floor(labelCount), 2), length);
  const lastIndex = length - 1;

  for (let i = 0; i < count; i++) {
    if (i === count - 1) {
      indices.add(lastIndex);
      continue;
    }

    indices.add(Math.floor((i * lastIndex) / (count - 1)));
  }

  return indices;
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

const normalizePoints = (
  nextData: DataMonitoringLineChartPoint[] | undefined | null,
  maxPoints: number,
) => {
  if (!Array.isArray(nextData)) {
    return [];
  }

  return sliceWindow(nextData, maxPoints);
};

const resolveCssSize = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
};

const DataMonitoringLineChart: React.FC<DataMonitoringLineChartProps> = function DataMonitoringLineChart(props) {
  const {
    data,
    xField = 'label',
    yField = 'value',
    min = 0,
    max = 10000,
    lineColor = DEFAULT_LINE_COLOR,
    areaColor = DEFAULT_AREA_COLOR,
    showXAxisLabels = true,
    xAxisLabelCount = 5,
    xAxisUnitLabel = 't',
    showLatestValue = true,
    enableDataZoom = true,
    maxPoints = MAX_CHART_POINTS,
    width = 400,
    height = 100,
    style = {},
    className = '',
    onPointClick,
    ...otherProps
  } = props;

  const resolvedMaxPoints = Number(maxPoints) > 0 ? Number(maxPoints) : MAX_CHART_POINTS;
  // 未传 data 时用演示数据；显式空数组则走空图架（仍显示坐标系）
  const sourceData = data === undefined ? DEFAULT_DATA : data;
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);
  const bizRef = useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;
  const rootDomProps = pickRootDomProps(otherProps);
  const [items, setItems] = useState<DataMonitoringLineChartPoint[]>(
    () => normalizePoints(sourceData, resolvedMaxPoints),
  );
  const itemsRef = useRef<DataMonitoringLineChartPoint[]>(items);
  const onPointClickRef = useRef(onPointClick);
  const buildOptionRef = useRef<any>(null);

  useEffect(() => {
    setItems(normalizePoints(sourceData, resolvedMaxPoints));
  }, [sourceData, resolvedMaxPoints]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    onPointClickRef.current = onPointClick;
  }, [onPointClick]);

  const buildOption = useMemo(() => {
    const hasData = items.length > 0;
    // 无数据时用占位类目轴，保证坐标系 / 网格始终可见，不“隐藏”图表
    const xAxisData = hasData
      ? items.map((item) => (item as any)[xField])
      : Array.from({ length: EMPTY_AXIS_PLACEHOLDER_COUNT }, () => '');
    const seriesData = hasData
      ? items.map((item) => (item as any)[yField])
      : Array.from({ length: EMPTY_AXIS_PLACEHOLDER_COUNT }, () => null);
    const numericValues = hasData
      ? seriesData.map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : [];
    const dataMax = numericValues.length > 0 ? Math.max(...numericValues) : 0;
    // 真实数据远小于默认 max(10000) 时自适应刻度，避免曲线贴底看起来像“没数据”
    let axisMin = min;
    let axisMax = max;
    if (hasData && dataMax > 0 && dataMax < max * 0.1) {
      if (dataMax <= 1) {
        axisMax = 1;
      } else if (dataMax <= 5) {
        axisMax = 5;
      } else if (dataMax <= 10) {
        axisMax = 10;
      } else {
        axisMax = Math.ceil(dataMax * 1.2);
      }
      axisMin = 0;
    }
    const showUnitLabel = !showXAxisLabels && Boolean(xAxisUnitLabel);
    const lastRawValue = hasData ? (items[items.length - 1] as any)[yField] : undefined;
    const latestText = showLatestValue && lastRawValue !== null && lastRawValue !== undefined
      ? formatTooltipValue(lastRawValue)
      : null;
    const isLargeData = items.length > 500;
    const xAxisLabelIndexSet = buildXAxisLabelIndexSet(xAxisData.length, xAxisLabelCount);
    const yAxisTicks = [axisMin, (axisMin + axisMax) / 2, axisMax];

    return {
      animation: hasData && !isLargeData,
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
          interval: (index: number) => xAxisLabelIndexSet.has(index),
          color: 'rgba(218, 230, 235, 0.58)',
          formatter: (value: string | number) => formatTimeLabel(value),
          fontSize: 10,
          margin: 2,
          hideOverlap: true,
          alignMinLabel: 'left',
          alignMaxLabel: 'right',
        },
      },
      yAxis: {
        type: 'value',
        min: axisMin,
        max: axisMax,
        interval: (axisMax - axisMin) / 2,
        show: true,
        axisLine: { show: false },
        axisTick: {
          show: false,
          customValues: yAxisTicks,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(176, 208, 220, 0.28)',
            type: 'dashed',
          },
        },
        axisLabel: {
          show: true,
          customValues: yAxisTicks,
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
          connectNulls: false,
          sampling: hasData ? 'lttb' : undefined,
          large: isLargeData,
          largeThreshold: 800,
          progressive: isLargeData ? 800 : 0,
          progressiveThreshold: 1000,
          lineStyle: {
            color: lineColor,
            width: 3,
          },
          areaStyle: hasData
            ? {
              color: getAreaGradient(areaColor[0], areaColor[1]),
            }
            : undefined,
        },
      ],
      tooltip: {
        show: hasData,
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
    buildOptionRef.current = buildOption;
  }, [buildOption]);

  const flushChart = () => {
    const instance = echartsRef.current;
    const el = chartRef.current;
    if (!instance || !el) {
      return;
    }

    const option = buildOptionRef.current;
    if (option) {
      instance.setOption(option, { notMerge: true, lazyUpdate: false, silent: true });
    }

    const nextWidth = el.clientWidth || resolveCssSize(width, 400);
    const nextHeight = el.clientHeight || resolveCssSize(height, 120);
    instance.resize({
      width: nextWidth,
      height: nextHeight,
    });
  };

  useEffect(() => {
    const el = chartRef.current;
    if (!el) {
      return undefined;
    }

    let disposed = false;
    let rafId = 0;
    let tries = 0;

    const mountChart = () => {
      if (disposed || !chartRef.current) {
        return;
      }

      const target = chartRef.current;
      const fallbackWidth = resolveCssSize(width, 400);
      const fallbackHeight = resolveCssSize(height, 120);
      const clientWidth = target.clientWidth;
      const clientHeight = target.clientHeight;

      // 容器尚未完成布局时延迟初始化，避免 0 宽高导致永久空白
      if ((clientWidth < 2 || clientHeight < 2) && tries < 30) {
        tries += 1;
        rafId = requestAnimationFrame(mountChart);
        return;
      }

      const initWidth = clientWidth > 1 ? clientWidth : fallbackWidth;
      const initHeight = clientHeight > 1 ? clientHeight : fallbackHeight;

      const instance = echarts.init(target, undefined, {
        width: initWidth,
        height: initHeight,
        renderer: 'canvas',
      });
      echartsRef.current = instance;

      instance.on('click', (params: any) => {
        if (params.componentType === 'series' && onPointClickRef.current) {
          onPointClickRef.current(itemsRef.current[params.dataIndex], params.dataIndex ?? 0);
        }
      });

      flushChart();
      // 再刷一帧，覆盖低代码画布 / 跑马灯 transform 首帧未就绪
      rafId = requestAnimationFrame(() => {
        if (!disposed) {
          flushChart();
        }
      });
    };

    mountChart();

    const handleResize = () => {
      flushChart();
    };
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        flushChart();
      });
      resizeObserver.observe(el);
      if (rootRef.current) {
        resizeObserver.observe(rootRef.current);
      }
    }

    let intersectionObserver: IntersectionObserver | undefined;
    const observeTarget = rootRef.current || el;
    if (typeof IntersectionObserver !== 'undefined' && observeTarget) {
      let scrollRoot: Element | null = observeTarget.parentElement;
      while (scrollRoot) {
        const className = (scrollRoot as HTMLElement).className || '';
        if (
          className.indexOf('bizpack-data-monitoring-card-scroll') >= 0
          || className.indexOf('bizpack-data-monitoring-panel-scroll') >= 0
        ) {
          break;
        }
        const oy = window.getComputedStyle(scrollRoot).overflowY;
        if ((oy === 'auto' || oy === 'scroll' || oy === 'hidden') && (scrollRoot as HTMLElement).clientHeight > 0) {
          break;
        }
        scrollRoot = scrollRoot.parentElement;
      }

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            requestAnimationFrame(() => {
              flushChart();
            });
          }
        },
        {
          root: scrollRoot,
          threshold: [0, 0.01, 0.1],
          rootMargin: '16px 0px',
        },
      );
      intersectionObserver.observe(observeTarget);
    }

    return () => {
      disposed = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      echartsRef.current?.dispose();
      echartsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!echartsRef.current) {
      return;
    }

    flushChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildOption]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: DataMonitoringLineChartPoint[]) => {
          if (Array.isArray(nextData)) {
            setItems(normalizePoints(nextData, resolvedMaxPoints));
          }
        },
        getData: () => itemsRef.current,
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      className={`bizpack-data-monitoring-line-chart ${className}`}
      style={{
        width,
        height,
        // 促进合成层稳定，减轻父级 transform 跑马灯导致的 canvas 空白
        transform: 'translateZ(0)',
        ...style,
      }}
      {...rootDomProps}
    >
      <div className="bizpack-data-monitoring-line-chart-chart" ref={chartRef} />
    </div>
  );
};

DataMonitoringLineChart.displayName = 'DataMonitoringLineChart';
export default React.memo(DataMonitoringLineChart);
