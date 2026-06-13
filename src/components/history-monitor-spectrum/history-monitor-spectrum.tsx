import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface HistoryMonitorSpectrumItem {
  id?: string | number;
  name: string;
  value: number | string;
}

export interface HistoryMonitorSpectrumProps {
  title?: string;
  data?: HistoryMonitorSpectrumItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: HistoryMonitorSpectrumItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: HistoryMonitorSpectrumItem[]) => void;
  };
}

const defaultData: HistoryMonitorSpectrumItem[] = [
  { id: 1, name: '泵启停次数', value: 321.5 },
  { id: 2, name: '告警总次数', value: 321.5 },
];

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

const HistoryMonitorSpectrum: React.FC<HistoryMonitorSpectrumProps> = function HistoryMonitorSpectrum(props) {
  const {
    data = defaultData,
    width = 400,
    height = 170,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<HistoryMonitorSpectrumItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: HistoryMonitorSpectrumItem[]) => {
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
      className={`bizpack-history-monitor-spectrum ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-history-monitor-spectrum-list">
        {items.slice(0, 2).map((item, index) => (
          <button
            key={item.id || index}
            type="button"
            className="bizpack-history-monitor-spectrum-item"
            onClick={() => {
              if (onItemClick) {
                onItemClick(item, index);
              }
            }}
          >
            <span className="bizpack-history-monitor-spectrum-visual">
              <span className="bizpack-history-monitor-spectrum-light" />
              <span className="bizpack-history-monitor-spectrum-value">
                {formatValue(item.value)}
              </span>
            </span>
            <span className="bizpack-history-monitor-spectrum-label">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

HistoryMonitorSpectrum.displayName = 'HistoryMonitorSpectrum';
export default HistoryMonitorSpectrum;
