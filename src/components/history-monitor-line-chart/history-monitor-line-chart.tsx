import * as React from 'react';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useState } from 'react';
import {
  Area,
  Axis,
  Chart,
  Legend,
  Line,
  Point,
  Tooltip,
} from 'bizcharts';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface HistoryMonitorLinePoint {
  label: string;
  pumpCount: number;
  alarmCount: number;
}

export interface HistoryMonitorLineChartProps {
  title?: string;
  data?: HistoryMonitorLinePoint[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  maxValue?: number;
  onPointClick?: (item: HistoryMonitorLinePoint, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: HistoryMonitorLinePoint[]) => void;
  };
}

const defaultData: HistoryMonitorLinePoint[] = [
  { label: '周一', pumpCount: 21, alarmCount: 33 },
  { label: '周二', pumpCount: 30, alarmCount: 24 },
  { label: '周三', pumpCount: 21, alarmCount: 33 },
  { label: '周四', pumpCount: 26, alarmCount: 20 },
  { label: '周五', pumpCount: 40, alarmCount: 28 },
  { label: '周六', pumpCount: 31, alarmCount: 25 },
  { label: '周日', pumpCount: 25, alarmCount: 33 },
];

const seriesNames = {
  pumpCount: '泵启停次数',
  alarmCount: '告警总次数',
};

const seriesColors = ['#3d9bff', '#f2a93c'];
const blueAreaColor = 'l(90) 0:rgba(26,90,170,1) 1:rgba(45,140,245,1)';
const orangeAreaColor = 'l(90) 0:rgba(120,92,52,1) 1:rgba(166,124,66,1)';

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

const HistoryMonitorLineChart: React.FC<HistoryMonitorLineChartProps> = function HistoryMonitorLineChart(props) {
  const {
    data = defaultData,
    width = 400,
    height = 225,
    maxValue = 50,
    style = {},
    className = '',
    onPointClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<HistoryMonitorLinePoint[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  const chartData = useMemo(() => (
    items.reduce<Array<{
      label: string;
      type: string;
      value: number;
      source: HistoryMonitorLinePoint;
    }>>((result, item) => ([
      ...result,
      {
        label: item.label,
        type: seriesNames.pumpCount,
        value: item.pumpCount,
        source: item,
      },
      {
        label: item.label,
        type: seriesNames.alarmCount,
        value: item.alarmCount,
        source: item,
      },
    ]), [])
  ), [items]);

  const scale = useMemo(() => ({
    label: {
      range: [0, 1],
    },
    value: {
      min: 0,
      max: maxValue,
      tickInterval: 10,
      nice: false,
    },
  }), [maxValue]);

  useEffect(() => {
    setItems(data);
  }, [data]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: HistoryMonitorLinePoint[]) => {
          if (Array.isArray(nextData)) {
            setItems(nextData);
          }
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  return (
    <div
      className={`bizpack-history-monitor-line-chart ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <Chart
        autoFit
        data={chartData}
        height={Number(height)}
        padding={[16, 20, 36, 34]}
        scale={scale}
        onGetG2Instance={(chart: any) => {
          bizRef.current = {
            chart: {
              changeData: (nextData: HistoryMonitorLinePoint[]) => {
                if (Array.isArray(nextData)) {
                  setItems(nextData);
                }
              },
            },
          };
          if (chart && chart.on) {
            chart.on('point:click', (event: any) => {
              const source = event && event.data && event.data.data && event.data.data.source;
              const index = items.findIndex((item) => item.label === source.label);

              if (source && onPointClick) {
                onPointClick(source, index);
              }
            });
          }
        }}
      >
        <Area
          position="label*value"
          color={['type', (type: string) => (
            type === seriesNames.pumpCount ? blueAreaColor : orangeAreaColor
          )]}
        />
        <Line
          position="label*value"
          color={['type', seriesColors]}
          size={2.5}
        />
        <Point
          position="label*value"
          color={['type', seriesColors]}
          shape="circle"
          size={4.5}
          style={{
            lineWidth: 2,
            stroke: '#ffffff',
          }}
        />
        <Axis
          name="value"
          line={false}
          tickLine={false}
          grid={{
            line: {
              style: {
                stroke: 'rgba(176, 208, 220, 0.24)',
                lineDash: [3, 4],
                lineWidth: 1,
              },
            },
          }}
          label={{
            style: {
              fill: 'rgba(218, 230, 235, 0.68)',
              fontSize: 12,
            },
          }}
        />
        <Axis
          name="label"
          tickLine={false}
          line={{
            style: {
              stroke: 'rgba(176, 208, 220, 0.3)',
              lineWidth: 1,
            },
          }}
          label={{
            style: {
              fill: 'rgba(218, 230, 235, 0.68)',
              fontSize: 12,
            },
          }}
        />
        <Tooltip shared showCrosshairs={false} />
        <Legend visible={false} />
      </Chart>
    </div>
  );
};

HistoryMonitorLineChart.displayName = 'HistoryMonitorLineChart';
export default HistoryMonitorLineChart;
