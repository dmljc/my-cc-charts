import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface SamplingPumpStatusItem {
  id?: string | number;
  name: string;
  running?: boolean;
  selected?: boolean;
  status?: 'normal' | 'error';
}

export interface SamplingPumpStatusProps {
  title?: string;
  data?: SamplingPumpStatusItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onSelect?: (item: SamplingPumpStatusItem, index: number) => void;
  onToggle?: (item: SamplingPumpStatusItem, nextRunning: boolean, index: number) => void;
  onLocate?: (item: SamplingPumpStatusItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: SamplingPumpStatusItem[]) => void;
  };
}

const defaultData: SamplingPumpStatusItem[] = [
  { id: 1, name: '取样泵1', running: false, selected: true, status: 'normal' },
  { id: 2, name: '取样泵1', running: true, status: 'normal' },
  { id: 3, name: '取样泵1', running: true, status: 'error' },
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

const SamplingPumpStatus: React.FC<SamplingPumpStatusProps> = function SamplingPumpStatus(props) {
  const {
    data = defaultData,
    width = 400,
    height = 200,
    style = {},
    className = '',
    onSelect,
    onToggle,
    onLocate,
    ...otherProps
  } = props;
  const [items, setItems] = useState<SamplingPumpStatusItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    const hasSelected = data.some((item) => item.selected);
    setItems(
      data.map((item, index) => ({
        ...item,
        selected: hasSelected ? !!item.selected : index === 0,
      })),
    );
  }, [data]);

  const handleSelect = (item: SamplingPumpStatusItem, index: number) => {
    const nextItems = items.map((current, currentIndex) => ({
      ...current,
      selected: currentIndex === index,
    }));

    setItems(nextItems);
    if (onSelect) {
      onSelect(item, index);
    }
  };

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: SamplingPumpStatusItem[]) => {
          if (Array.isArray(nextData)) {
            const hasSelected = nextData.some((item) => item.selected);
            setItems(
              nextData.map((item, index) => ({
                ...item,
                selected: hasSelected ? !!item.selected : index === 0,
              })),
            );
          }
        },
      },
    };

    init(props, bizRef, bc);

    return () => {
      destroy(props, bc);
    };
  }, []);

  const handleToggle = (item: SamplingPumpStatusItem, index: number) => {
    console.log('---取样泵组件开关切换--item-index', item, index);
    const nextRunning = !item.running;
    const nextItems = items.map((current, currentIndex) =>
      currentIndex === index ? { ...current, running: nextRunning } : current,
    );

    setItems(nextItems);
    if (onToggle) {
      onToggle(item, nextRunning, index);
    }
  };

  return (
    <div
      className={`bizpack-sampling-pump-status ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div
        className={`bizpack-sampling-pump-status-list ${
          items.length > 3 ? 'bizpack-sampling-pump-status-list-scrollable' : ''
        }`}
      >
        {items.map((item, index) => {
          const running = !!item.running;
          const isSelected = !!item.selected;
          const isError = item.status === 'error';

          return (
            <div
              key={item.id || index}
              className={`bizpack-sampling-pump-status-row ${
                isSelected ? 'bizpack-sampling-pump-status-row-active' : ''
              }`}
              onClick={() => handleSelect(item, index)}
            >
              <div className="bizpack-sampling-pump-status-name" title={item.name}>
                <span
                  className={`bizpack-sampling-pump-status-dot ${
                    isError ? 'bizpack-sampling-pump-status-dot-error' : ''
                  }`}
                />
                <span className="bizpack-sampling-pump-status-name-text">{item.name}</span>
              </div>

              <button
                type="button"
                className={`bizpack-sampling-pump-status-switch ${
                  running ? 'bizpack-sampling-pump-status-switch-on' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(item, index);
                }}
              >
                <span />
              </button>

              <span className="bizpack-sampling-pump-status-state">
                {running ? '启动' : '未启动'}
              </span>

              <span className="bizpack-sampling-pump-status-divider" />

              <button
                type="button"
                className="bizpack-sampling-pump-status-location"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onLocate) {
                    onLocate(item, index);
                  }
                }}
              >
                <span className="bizpack-sampling-pump-status-location-icon" />
                <span>定位</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

SamplingPumpStatus.displayName = 'SamplingPumpStatus';
export default SamplingPumpStatus;
