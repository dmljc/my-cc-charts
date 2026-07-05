// 流出物
import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export type EffluentTrend = 'up' | 'down' | 'flat' | string;

export interface EffluentItem {
  id?: string | number;
  label: string;
  value?: number | string;
  trend?: EffluentTrend;
}

export interface EffluentProps {
  title?: string;
  data?: EffluentItem[];
  /** 名称对应的数据字段名，默认 'label' */
  labelField?: string;
  /** 数值对应的数据字段名，默认 'value' */
  valueField?: string;
  /** 趋势对应的数据字段名，默认 'trend'，取值 up/down/flat */
  trendField?: string;
  /** 数值单位后缀 */
  unit?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: EffluentItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: EffluentItem[]) => void;
  };
}

const ArrowIcon: React.FC = function ArrowIcon() {
  return (
    <svg
      className="bizpack-effluent-arrow-icon"
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 10.5V1.5M2 5.5L6 1.5L10 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const defaultData: EffluentItem[] = [
  { id: 1, label: '全排', value: 1.2, trend: 'up' },
  { id: 2, label: '特排', value: 1.2, trend: 'flat' },
  { id: 3, label: '局排', value: 1.2, trend: 'down' },
  { id: 4, label: '特排', value: 1.2, trend: 'flat' },
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

const Effluent: React.FC<EffluentProps> = function Effluent(props) {
  const {
    data = defaultData,
    labelField = 'label',
    valueField = 'value',
    trendField = 'trend',
    unit = '',
    width = 400,
    height = 60,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<EffluentItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: EffluentItem[]) => {
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
      className={`bizpack-effluent ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      {items.map((item, index) => {
        const label = (item as any)[labelField] ?? '-';
        const value = (item as any)[valueField];
        const trend = ((item as any)[trendField] || 'flat') as EffluentTrend;

        return (
          <button
            type="button"
            key={item.id != null ? String(item.id) : index}
            className="bizpack-effluent-item"
            onClick={() => {
              if (onItemClick) {
                onItemClick(item, index);
              }
            }}
          >
            <span className="bizpack-effluent-box">
              <span className="bizpack-effluent-value">
                {value ?? '-'}
                {unit ? <span className="bizpack-effluent-unit">{unit}</span> : null}
              </span>
              <span className={`bizpack-effluent-arrow bizpack-effluent-arrow-${trend}`}>
                <ArrowIcon />
              </span>
            </span>
            <span className="bizpack-effluent-label" title={label}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

Effluent.displayName = 'Effluent';
export default Effluent;
