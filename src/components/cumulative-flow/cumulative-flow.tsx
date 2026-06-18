// 累计流量
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface CumulativeFlowData {
  label?: string;
  value?: number | string;
}

export interface CumulativeFlowProps {
  instantLabel?: string;
  cumulativeLabel?: string;
  instantValue?: number | string;
  value?: number | string;
  data?: CumulativeFlowData;
  /** 标签对应的数据字段名，默认 'label' */
  labelField?: string;
  /** 数值对应的数据字段名，默认 'value' */
  valueField?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: CumulativeFlowData) => void;
  };
}

const formatValue = (value: number | string | undefined | null): string => {
  if (value === '' || value == null) {
    return '-';
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  if (Number.isInteger(numericValue)) {
    return String(numericValue);
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

const CumulativeFlow: React.FC<CumulativeFlowProps> = function CumulativeFlow(props) {
  const {
    instantLabel = '瞬时流量',
    value: valueProp,
    data,
    labelField = 'label',
    valueField = 'value',
    width = 400,
    height = 42,
    style = {},
    className = '',
    ...otherProps
  } = props;

  const dataLabel = instantLabel ?? (data as any)?.[labelField] ?? '瞬时流量';
  const dataValue = (valueProp ?? (data as any)?.[valueField]) as number | string | undefined;

  const [value, setValue] = useState<number | string | undefined>(dataValue);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setValue(valueProp ?? (data as any)?.[valueField]);
  }, [data, valueProp, valueField]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: CumulativeFlowData) => {
          if (nextData) {
            if (nextData.value != null) {
              setValue(nextData.value);
            }
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
      className={`bizpack-cumulative-flow ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >

      <div className="bizpack-cumulative-flow-item bizpack-cumulative-flow-item-instant">
        <div className="bizpack-cumulative-flow-item-row">
          <span className="bizpack-cumulative-flow-dot" />
          <span className="bizpack-cumulative-flow-item-label">{dataLabel}</span>
        </div>
      </div>

      <div className="bizpack-cumulative-flow-item bizpack-cumulative-flow-item-cumulative">
        <span className="bizpack-cumulative-flow-item-value">{formatValue(value)}</span>
      </div>
    </div>
  );
};

CumulativeFlow.displayName = 'CumulativeFlow';
export default CumulativeFlow;
