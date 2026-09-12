// 警告统计
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { destroy, init } from '../../common/iot';
import { DEFAULT_WARNING_STATISTICS_TEST_DATA } from './test-data';
import './index.scss';

export interface WarningStatisticsItem {
  /** 等级名称，如：紧急 / 严重 / 注意 / 一般 */
  levelName?: string;
  /** 该等级告警数量 */
  count?: number | string;
  /** 等级颜色，如 #FA8C16 */
  levelColor?: string;
  [key: string]: unknown;
}

export interface WarningStatisticsStats {
  total?: number | string;
  levels?: WarningStatisticsItem[];
  /** @deprecated 请使用 levels */
  items?: WarningStatisticsItem[];
  [key: string]: unknown;
}

export interface WarningStatisticsData extends WarningStatisticsStats {
  alarmStats?: WarningStatisticsStats;
}

export interface WarningStatisticsProps {
  data?: WarningStatisticsData | WarningStatisticsItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** 等级列表字段名，默认 levels */
  listField?: string;
  /** 分类名称字段名，默认 levelName */
  nameField?: string;
  /** 数量字段名，默认 count */
  valueField?: string;
  /** 颜色字段名，默认 levelColor */
  colorField?: string;
  /** 总计字段名，默认 total；不传则对分类求和 */
  totalField?: string;
  /** 总计文案 */
  totalLabel?: string;
  /** 数量单位 */
  unit?: string;
  onItemClick?: (item: WarningStatisticsItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: WarningStatisticsData | WarningStatisticsItem[]) => void;
  };
}

interface SliceView {
  name: string;
  value: number;
  color: string;
  source: WarningStatisticsItem;
}

const defaultData = DEFAULT_WARNING_STATISTICS_TEST_DATA as WarningStatisticsData;

const DEFAULT_COLORS = [
  '#C65CFF',
  '#FF4B6E',
  '#3B86FF',
  '#2EE6A6',
  '#FFB02E',
  '#7B6CFF',
  '#FF7A3B',
  '#36D6FF',
  '#E14BFF',
  '#6BFF9A',
];

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

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const unwrapPayload = (value: WarningStatisticsData): WarningStatisticsStats => {
  if (value.alarmStats && typeof value.alarmStats === 'object' && !Array.isArray(value.alarmStats)) {
    return value.alarmStats;
  }
  return value;
};

const resolveList = (payload: WarningStatisticsStats, listField: string): WarningStatisticsItem[] => {
  const preferred = payload[listField];
  if (Array.isArray(preferred)) {
    return preferred as WarningStatisticsItem[];
  }
  if (Array.isArray(payload.levels)) {
    return payload.levels;
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  return [];
};

const resolvePayload = (
  value?: WarningStatisticsData | WarningStatisticsItem[] | null,
): WarningStatisticsStats => {
  if (Array.isArray(value)) {
    return { levels: value };
  }
  if (value && typeof value === 'object') {
    return unwrapPayload(value);
  }
  return defaultData;
};

const buildSlices = (
  payload: WarningStatisticsStats,
  listField: string,
  nameField: string,
  valueField: string,
  colorField: string,
  totalField: string,
): { total: number; slices: SliceView[] } => {
  const items = resolveList(payload, listField);
  const slices = items.map((item, index) => {
    const name = item[nameField] != null && item[nameField] !== ''
      ? String(item[nameField])
      : `分类${index + 1}`;
    const value = Math.max(0, toNumber(item[valueField], 0));
    const color = typeof item[colorField] === 'string' && item[colorField]
      ? String(item[colorField])
      : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    return { name, value, color, source: item };
  });
  const sum = slices.reduce((acc, item) => acc + item.value, 0);
  const totalRaw = payload[totalField];
  const total = totalRaw == null || totalRaw === '' ? sum : toNumber(totalRaw, sum);
  return { total, slices };
};

/** 按分类数量收紧图例与环图，适配 3~5 档警告等级 */
const resolveLayoutByCount = (count: number) => {
  if (count >= 5) {
    return {
      legendTop: '28%',
      itemGap: 4,
      itemSize: 6,
      nameFontSize: 12,
      valueFontSize: 14,
      unitFontSize: 12,
      lineHeight: 18,
      valueWidth: 22,
      radius: ['30%', '52%'] as [string, string],
      center: ['34%', '58%'] as [string, string],
      labelFontSize: 12,
      labelLineLength: 6,
      labelLineLength2: 4,
    };
  }
  if (count === 4) {
    return {
      legendTop: '32%',
      itemGap: 6,
      itemSize: 7,
      nameFontSize: 13,
      valueFontSize: 15,
      unitFontSize: 13,
      lineHeight: 19,
      valueWidth: 24,
      radius: ['32%', '54%'] as [string, string],
      center: ['35%', '56%'] as [string, string],
      labelFontSize: 13,
      labelLineLength: 7,
      labelLineLength2: 5,
    };
  }
  return {
    legendTop: '36%',
    itemGap: 8,
    itemSize: 8,
    nameFontSize: 14,
    valueFontSize: 16,
    unitFontSize: 14,
    lineHeight: 20,
    valueWidth: 24,
    radius: ['34%', '56%'] as [string, string],
    center: ['36%', '55%'] as [string, string],
    labelFontSize: 14,
    labelLineLength: 8,
    labelLineLength2: 6,
  };
};

/**
 * 直接使用官网基础饼图 demo 的 option。
 * 仅将静态 data 替换为接口动态分类。
 */
const buildPieOption = (
  slices: SliceView[],
  options: {
    unit: string;
  },
) => {
  const layout = resolveLayoutByCount(slices.length);
  return {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      right: '3%',
      top: layout.legendTop,
      icon: 'circle',
      itemWidth: layout.itemSize,
      itemHeight: layout.itemSize,
      itemGap: layout.itemGap,
      textStyle: {
        color: '#FFFFFF',
        fontSize: layout.nameFontSize,
        rich: {
          name: {
            color: '#FFFFFF',
            fontSize: layout.nameFontSize,
            fontWeight: 400,
            fontFamily: 'PingFangSC, PingFang SC',
            lineHeight: layout.lineHeight,
            fontStyle: 'normal',
            padding: [0, 6, 0, 0],
          },
          value: {
            width: layout.valueWidth,
            height: layout.lineHeight,
            color: '#FFFFFF',
            fontSize: layout.valueFontSize,
            fontWeight: 'bold',
            fontFamily: 'DINAlternate, DIN Alternate, DIN, sans-serif',
            lineHeight: layout.lineHeight,
            align: 'right',
            fontStyle: 'normal',
          },
          unit: {
            width: 14,
            height: layout.lineHeight,
            color: '#FFFFFF',
            fontSize: layout.unitFontSize,
            fontFamily: 'PingFangSC, PingFang SC',
            fontWeight: 400,
            lineHeight: layout.lineHeight,
            align: 'right',
            fontStyle: 'normal',
            padding: [0, 0, 0, 2],
          },
        },
      },
      formatter: (name: string) => {
        const item = slices.find((slice) => slice.name === name);
        if (!item) {
          return name;
        }
        return `{name|${name}}{value|${item.value}}{unit|${options.unit}}`;
      },
    },
    series: [
      {
        type: 'pie',
        radius: layout.radius,
        center: layout.center,
        avoidLabelOverlap: true,
        label: {
          show: true,
          color: '#FFFFFF',
          fontSize: layout.labelFontSize,
          fontWeight: 400,
          fontFamily: 'PingFangSC, PingFang SC',
          lineHeight: layout.lineHeight,
          fontStyle: 'normal',
          overflow: 'none',
          formatter: '{b}',
        },
        labelLine: {
          show: true,
          length: layout.labelLineLength,
          length2: layout.labelLineLength2,
          lineStyle: {
            width: 1,
          },
        },
        data: slices.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color,
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
};

const WarningStatistics: React.FC<WarningStatisticsProps> = function WarningStatistics(props) {
  const {
    data = defaultData,
    width = 376,
    height = 130,
    style = {},
    className = '',
    listField = 'levels',
    nameField = 'levelName',
    valueField = 'count',
    colorField = 'levelColor',
    totalField = 'total',
    totalLabel = '总计',
    unit = '个',
    onItemClick,
    ...otherProps
  } = props;
  const [source, setSource] = useState<WarningStatisticsStats>(() => resolvePayload(data));
  const chartRef = useRef<HTMLDivElement | null>(null);
  const echartsRef = useRef<echarts.ECharts | null>(null);
  const bizRef = useRef<BizRef | null>(null);
  const onItemClickRef = useRef(onItemClick);
  const slicesRef = useRef<SliceView[]>([]);
  const viewRef = useRef({ unit });
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;
  const rootDomProps = pickRootDomProps(otherProps);
  const safeListField = listField || 'levels';
  const safeNameField = nameField || 'levelName';
  const safeValueField = valueField || 'count';
  const safeColorField = colorField || 'levelColor';
  const safeTotalField = totalField || 'total';

  const view = useMemo(
    () => buildSlices(
      source,
      safeListField,
      safeNameField,
      safeValueField,
      safeColorField,
      safeTotalField,
    ),
    [source, safeListField, safeNameField, safeValueField, safeColorField, safeTotalField],
  );
  slicesRef.current = view.slices;
  viewRef.current = { unit };
  onItemClickRef.current = onItemClick;

  useEffect(() => {
    if (!props.dataType || props.dataType === 'data') {
      setSource(resolvePayload(data));
    }
  }, [data, props.dataType]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData) => {
          setSource(resolvePayload(nextData));
        },
      },
    };
    init(props, bizRef, bc);
    return () => {
      destroy(props, bc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const host = chartRef.current;
    if (!host) {
      return undefined;
    }

    const myChart = echarts.init(host, undefined, {
      renderer: 'canvas',
      devicePixelRatio: window.devicePixelRatio || 1,
    });
    echartsRef.current = myChart;

    const applyOption = () => {
      myChart.setOption(
        buildPieOption(slicesRef.current, {
          unit: viewRef.current.unit,
        }),
        { notMerge: true },
      );
    };
    applyOption();

    myChart.on('click', (params: any) => {
      if (!onItemClickRef.current || typeof params.dataIndex !== 'number') {
        return;
      }
      const item = slicesRef.current[params.dataIndex];
      if (item) {
        onItemClickRef.current(item.source, params.dataIndex);
      }
    });

    const resize = () => {
      myChart.resize();
    };
    window.addEventListener('resize', resize);
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(resize);
    if (observer) {
      observer.observe(host);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (observer) {
        observer.disconnect();
      }
      myChart.dispose();
      echartsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const myChart = echartsRef.current;
    if (!myChart) {
      return;
    }
    myChart.setOption(
      buildPieOption(view.slices, {
        unit,
      }),
      { notMerge: true },
    );
  }, [view.slices, unit]);

  return (
    <div
      className={`bizpack-warning-statistics ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-warning-statistics-total">
        <span className="bizpack-warning-statistics-total-label">{totalLabel}</span>
        <span className="bizpack-warning-statistics-total-value">{view.total}</span>
        <span className="bizpack-warning-statistics-total-unit">{unit}</span>
      </div>
      <div className="bizpack-warning-statistics-chart" ref={chartRef} />
    </div>
  );
};

WarningStatistics.displayName = 'WarningStatistics';
export default React.memo(WarningStatistics);
