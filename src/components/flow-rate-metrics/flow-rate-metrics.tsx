import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface FlowRateMetricsProps {
  title?: string;
  data?: {
    averageSpeed?: number | string;
    maxSpeed?: number | string;
  };
  averageSpeed?: number | string;
  maxSpeed?: number | string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: { averageSpeed?: number | string; maxSpeed?: number | string }) => void;
  };
}

const formatValue = (value: number | string) => {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return value;
  }

  return numericValue.toFixed(1);
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

const FlowRateMetrics: React.FC<FlowRateMetricsProps> = function FlowRateMetrics(props) {
  const {
    data,
    averageSpeed: averageSpeedProp,
    maxSpeed: maxSpeedProp,
    width = 400,
    height = 108,
    style = {},
    className = '',
    ...otherProps
  } = props;

  const [metrics, setMetrics] = useState<{
    averageSpeed: number | string;
    maxSpeed: number | string;
  }>({
    averageSpeed: averageSpeedProp ?? data?.averageSpeed ?? 187.3,
    maxSpeed: maxSpeedProp ?? data?.maxSpeed ?? 321.5,
  });

  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setMetrics({
      averageSpeed: averageSpeedProp ?? data?.averageSpeed ?? 187.3,
      maxSpeed: maxSpeedProp ?? data?.maxSpeed ?? 321.5,
    });
  }, [data, averageSpeedProp, maxSpeedProp]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: { averageSpeed?: number | string; maxSpeed?: number | string }) => {
          if (nextData) {
            setMetrics({
              averageSpeed: nextData.averageSpeed ?? 187.3,
              maxSpeed: nextData.maxSpeed ?? 321.5,
            });
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
      className={`bizpack-flow-rate-metrics ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-flow-rate-metrics-item">
        <div className="bizpack-flow-rate-metrics-visual">
          <div className="bizpack-flow-rate-metrics-orbit" />
          <div className="bizpack-flow-rate-metrics-value">
            {formatValue(metrics.averageSpeed)}
          </div>
        </div>
        <div className="bizpack-flow-rate-metrics-label">平均流速</div>
      </div>
      <div className="bizpack-flow-rate-metrics-item">
        <div className="bizpack-flow-rate-metrics-visual">
          <div className="bizpack-flow-rate-metrics-orbit" />
          <div className="bizpack-flow-rate-metrics-value">
            {formatValue(metrics.maxSpeed)}
          </div>
        </div>
        <div className="bizpack-flow-rate-metrics-label">最大流速</div>
      </div>
    </div>
  );
};

FlowRateMetrics.displayName = 'FlowRateMetrics';
export default FlowRateMetrics;
