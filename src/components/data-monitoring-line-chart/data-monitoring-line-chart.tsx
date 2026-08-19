import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { destroy, init } from '../../common/iot';
import { buildNiceAxisRange, buildNiceAxisTicks, formatAxisNumber } from '../../common/chart-axis';
import { sliceWindow } from '../../common/perf';
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
  /** y 轴最小值；不传时按当前窗口数据最小值自动取整 */
  min?: number;
  /** y 轴最大值；不传时按当前窗口数据最大值自动取整 */
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
  /** 时序点滑动窗口上限，默认 900（最近 15 分钟，按 1 秒 1 点） */
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
/** 最近 15 分钟（1 秒 1 点 ≈ 900） */
const DEFAULT_MAX_POINTS = 15 * 60;

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

/** 横轴/提示时间统一展示为时:分:秒（HH:mm:ss） */
const formatDateToHms = (date: Date) => (
  `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}:${padTimePart(date.getSeconds())}`
);

const formatTimeLabel = (value: string | number | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const rawValue = String(value);
  // HH:mm:ss 原样规范；HH:mm 补秒为 00
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

const formatTooltipValue = (value: number | string | undefined) => formatAxisNumber(value);

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
    min,
    max,
    lineColor = DEFAULT_LINE_COLOR,
    areaColor = DEFAULT_AREA_COLOR,
    showXAxisLabels = true,
    xAxisLabelCount = 5,
    xAxisUnitLabel = 't',
    showLatestValue = true,
    maxPoints = DEFAULT_MAX_POINTS,
    width = 400,
    height = 100,
    style = {},
    className = '',
    onPointClick,
    ...otherProps
  } = props;

  const resolvedMaxPoints = Number(maxPoints) > 0 ? Number(maxPoints) : DEFAULT_MAX_POINTS;
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
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const scheduleRafRef = useRef(0);
  const pendingUpdateRef = useRef({ option: false, resize: false, forceResize: false });
  /** 首次全量 setOption 后改为合并更新，避免 ws 冲掉 tooltip */
  const optionInitedRef = useRef(false);
  /** 当前轴悬浮提示位置 */
  const axisTipRef = useRef<{ dataIndex: number } | null>(null);
  /** setOption 引发的 hideTip 忽略，仅用户移出时清空 */
  const ignoreHideTipRef = useRef(false);
  const ignoreHideTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 指针是否仍在图内；用像素坐标 showTip */
  const pointerInsideRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const xAxisLenRef = useRef(0);
  const xAxisDataRef = useRef<Array<string | number>>([]);

  widthRef.current = width;
  heightRef.current = height;

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
    const dataMin = numericValues.length > 0 ? Math.min(...numericValues) : 0;
    const dataMax = numericValues.length > 0 ? Math.max(...numericValues) : 0;
    const autoRange = buildNiceAxisRange(dataMin, dataMax);
    const configuredMin = Number(min);
    const configuredMax = Number(max);
    const hasConfiguredMin = min !== undefined && min !== null && min !== '' && Number.isFinite(configuredMin);
    const hasConfiguredMax = max !== undefined && max !== null && max !== '' && Number.isFinite(configuredMax);
    let axisMin = hasConfiguredMin ? configuredMin : autoRange.min;
    let axisMax = hasConfiguredMax ? configuredMax : autoRange.max;
    if (!(axisMax > axisMin)) {
      axisMax = axisMin + Math.max(autoRange.max - autoRange.min, 1);
    }
    const yAxisTicks = buildNiceAxisTicks(axisMin, axisMax);
    const showUnitLabel = !showXAxisLabels && Boolean(xAxisUnitLabel);
    const lastRawValue = hasData ? (items[items.length - 1] as any)[yField] : undefined;
    const latestText = showLatestValue && lastRawValue !== null && lastRawValue !== undefined
      ? formatTooltipValue(lastRawValue)
      : null;
    const isLargeData = items.length > 500;
    const xAxisLabelIndexSet = buildXAxisLabelIndexSet(xAxisData.length, xAxisLabelCount);
    return {
      // 大屏多实例（监测卡列表）场景关闭动画，降低麒麟机滚动/断网稳态 CPU
      animation: false,
      graphic: [
        ...(latestText !== null ? [
          {
            type: 'text',
            right: 10,
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
            right: 10,
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
        right: 22,
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
          formatter: (value: number) => formatAxisNumber(value),
        },
      },
      series: [
        {
          id: 'monitoring-line',
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
          animation: false,
          animationDurationUpdate: 0,
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
        transitionDuration: 0,
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
  ]);

  useEffect(() => {
    buildOptionRef.current = buildOption;
    const xAxisData = buildOption?.xAxis?.data;
    if (Array.isArray(xAxisData)) {
      xAxisDataRef.current = xAxisData;
    }
  }, [buildOption]);

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
    if (!chart) {
      return;
    }

    const pointerInside = pointerInsideRef.current;
    const lastPointer = lastPointerRef.current;
    const pinnedTip = axisTipRef.current;
    if (!pointerInside && !pinnedTip) {
      return;
    }

    // 优先按鼠标像素坐标恢复（axis tooltip 最稳）
    if (pointerInside && lastPointer) {
      chart.dispatchAction({
        type: 'showTip',
        x: lastPointer.x,
        y: lastPointer.y,
      });
      return;
    }

    if (!pinnedTip || pinnedTip.dataIndex < 0) {
      return;
    }

    const prevLen = xAxisLenRef.current;
    const nextLen = Array.isArray(xAxisDataRef.current) ? xAxisDataRef.current.length : 0;
    if (nextLen <= 0) {
      return;
    }

    let dataIndex = pinnedTip.dataIndex;
    if (prevLen > 0 && pinnedTip.dataIndex >= prevLen - 1) {
      dataIndex = nextLen - 1;
    } else if (prevLen > 0) {
      const offsetFromEnd = prevLen - 1 - pinnedTip.dataIndex;
      dataIndex = Math.max(0, Math.min(nextLen - 1, nextLen - 1 - offsetFromEnd));
    } else {
      dataIndex = Math.min(pinnedTip.dataIndex, nextLen - 1);
    }

    axisTipRef.current = { dataIndex };
    chart.dispatchAction({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex,
    });
  };

  const applyOption = () => {
    const instance = echartsRef.current;
    const option = buildOptionRef.current;
    if (!instance || !option) {
      return;
    }

    const shouldKeepTip = pointerInsideRef.current || !!axisTipRef.current;
    if (shouldKeepTip) {
      beginIgnoreHideTip();
    }

    const nextXLen = Array.isArray(option?.xAxis?.data) ? option.xAxis.data.length : 0;

    if (!optionInitedRef.current) {
      // 首次全量写入
      instance.setOption(option, { notMerge: true, lazyUpdate: false, silent: true });
      optionInitedRef.current = true;
    } else {
      // ws / 数据滑动：按 series.id 合并，禁止 notMerge / replaceMerge（会拆掉 tooltip）
      instance.setOption(
        {
          animation: false,
          graphic: option.graphic,
          xAxis: {
            data: option.xAxis?.data,
            axisLabel: option.xAxis?.axisLabel,
          },
          yAxis: option.yAxis,
          series: [
            {
              id: 'monitoring-line',
              data: option.series?.[0]?.data,
              sampling: option.series?.[0]?.sampling,
              large: option.series?.[0]?.large,
              progressive: option.series?.[0]?.progressive,
              progressiveThreshold: option.series?.[0]?.progressiveThreshold,
              areaStyle: option.series?.[0]?.areaStyle,
              lineStyle: option.series?.[0]?.lineStyle,
            },
          ],
          tooltip: {
            show: option.tooltip?.show,
          },
        },
        { lazyUpdate: false, silent: true },
      );
    }

    if (shouldKeepTip) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreTooltip();
          xAxisLenRef.current = nextXLen;
        });
      });
    } else {
      xAxisLenRef.current = nextXLen;
    }
  };

  const resizeChart = (force = false) => {
    const instance = echartsRef.current;
    const el = chartRef.current;
    if (!instance || !el) {
      return;
    }

    const nextWidth = el.clientWidth || resolveCssSize(widthRef.current, 400);
    const nextHeight = el.clientHeight || resolveCssSize(heightRef.current, 120);

    if (nextWidth < 2 || nextHeight < 2) {
      return;
    }

    if (
      !force
      && nextWidth === lastSizeRef.current.width
      && nextHeight === lastSizeRef.current.height
    ) {
      return;
    }

    lastSizeRef.current = { width: nextWidth, height: nextHeight };
    instance.resize({
      width: nextWidth,
      height: nextHeight,
    });
  };

  /** 合并同一帧内的 option/resize，避免连续触发造成多余重排重绘 */
  const scheduleChartUpdate = (flags: { option?: boolean; resize?: boolean; forceResize?: boolean }) => {
    if (flags.option) {
      pendingUpdateRef.current.option = true;
    }
    if (flags.resize) {
      pendingUpdateRef.current.resize = true;
    }
    if (flags.forceResize) {
      pendingUpdateRef.current.forceResize = true;
    }

    if (scheduleRafRef.current) {
      return;
    }

    scheduleRafRef.current = requestAnimationFrame(() => {
      scheduleRafRef.current = 0;
      const pending = pendingUpdateRef.current;
      pendingUpdateRef.current = { option: false, resize: false, forceResize: false };

      if (pending.option) {
        applyOption();
      }
      if (pending.resize || pending.forceResize) {
        resizeChart(pending.forceResize);
      }
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
      const fallbackWidth = resolveCssSize(widthRef.current, 400);
      const fallbackHeight = resolveCssSize(heightRef.current, 120);
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
      lastSizeRef.current = { width: initWidth, height: initHeight };

      const instance = echarts.init(target, undefined, {
        width: initWidth,
        height: initHeight,
        renderer: 'canvas',
      });
      echartsRef.current = instance;
      optionInitedRef.current = false;

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
          const idx = xAxisDataRef.current.findIndex((item) => String(item) === String(axisInfo.value));
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
          onPointClickRef.current(itemsRef.current[params.dataIndex], params.dataIndex ?? 0);
        }
      });

      applyOption();
      // 初次挂载时容器尺寸可能仍在变化（如父级刚完成布局），补一帧强制 resize 兜底
      requestAnimationFrame(() => {
        if (disposed || !echartsRef.current) {
          return;
        }
        resizeChart(true);
      });
    };

    mountChart();

    const handleWindowResize = () => {
      scheduleChartUpdate({ resize: true });
    };
    window.addEventListener('resize', handleWindowResize);

    let resizeObserver: ResizeObserver | undefined;
    let resizeDebounceTimer: ReturnType<typeof setTimeout> | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (resizeDebounceTimer) {
          clearTimeout(resizeDebounceTimer);
        }
        // 合并短时间多次 RO，避免布局抖动时重复 resize
        resizeDebounceTimer = setTimeout(() => {
          resizeDebounceTimer = undefined;
          scheduleChartUpdate({ resize: true });
        }, 120);
      });
      resizeObserver.observe(el);
      if (rootRef.current) {
        resizeObserver.observe(rootRef.current);
      }
    }

    let intersectionObserver: IntersectionObserver | undefined;
    let intersectionDebounceTimer: ReturnType<typeof setTimeout> | undefined;
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
        // 只认可滚动容器；不把 overflow:hidden 当 scrollRoot，避免误命中外层裁剪盒
        const oy = window.getComputedStyle(scrollRoot).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && (scrollRoot as HTMLElement).scrollHeight > (scrollRoot as HTMLElement).clientHeight) {
          break;
        }
        scrollRoot = scrollRoot.parentElement;
      }

      let wasIntersecting = false;
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const isIntersecting = !!(entry && entry.isIntersecting);
          // 仅在「进入视口」边沿考虑 resize
          if (isIntersecting && !wasIntersecting) {
            if (intersectionDebounceTimer) {
              clearTimeout(intersectionDebounceTimer);
            }
            intersectionDebounceTimer = setTimeout(() => {
              intersectionDebounceTimer = undefined;
              scheduleChartUpdate({ forceResize: true });
            }, 120);
          }
          wasIntersecting = isIntersecting;
        },
        {
          root: scrollRoot,
          // 单阈值，减少列表连续滚动时的回调风暴（麒麟 + 多图实例更敏感）
          threshold: 0.01,
          rootMargin: '24px 0px',
        },
      );
      intersectionObserver.observe(observeTarget);
    }

    return () => {
      disposed = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (scheduleRafRef.current) {
        cancelAnimationFrame(scheduleRafRef.current);
        scheduleRafRef.current = 0;
      }
      if (ignoreHideTipTimerRef.current) {
        clearTimeout(ignoreHideTipTimerRef.current);
        ignoreHideTipTimerRef.current = null;
      }
      if (resizeDebounceTimer) {
        clearTimeout(resizeDebounceTimer);
      }
      if (intersectionDebounceTimer) {
        clearTimeout(intersectionDebounceTimer);
      }
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      echartsRef.current?.dispose();
      echartsRef.current = null;
      optionInitedRef.current = false;
      axisTipRef.current = null;
      pointerInsideRef.current = false;
      lastPointerRef.current = null;
      lastSizeRef.current = { width: 0, height: 0 };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!echartsRef.current) {
      return;
    }

    // 数据/配置变更：更新 option；尺寸未变时 resize 会被跳过
    scheduleChartUpdate({ option: true, resize: true });
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
        ...style,
      }}
      {...rootDomProps}
    >
      <div className="bizpack-data-monitoring-line-chart-chart" ref={chartRef} />
    </div>
  );
};

DataMonitoringLineChart.displayName = 'DataMonitoringLineChart';
// 不用 memo：监测卡列表频繁推送时序，memo 易因引用复用导致折线不刷新
export default DataMonitoringLineChart;
