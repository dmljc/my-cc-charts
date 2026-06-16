import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface VacuumPumpStatusItem {
  id?: string | number;
  name: string;
  running?: boolean;
  selected?: boolean;
  status?: 'normal' | 'error';
}

export interface VacuumPumpStatusProps {
  title?: string;
  data?: VacuumPumpStatusItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onSelect?: (item: VacuumPumpStatusItem, index: number) => void;
  onLocate?: (item: VacuumPumpStatusItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: VacuumPumpStatusItem[]) => void;
  };
}

const defaultData: VacuumPumpStatusItem[] = [
  { id: 1, name: '真空泵1', running: true, selected: true, status: 'normal' },
  { id: 2, name: '真空泵1', running: true, status: 'normal' },
  { id: 3, name: '真空泵1', running: false, status: 'error' },
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

const VacuumPumpStatus: React.FC<VacuumPumpStatusProps> = function VacuumPumpStatus(props) {
  const {
    data = defaultData,
    width = 400,
    height = 200,
    style = {},
    className = '',
    onSelect,
    onLocate,
    ...otherProps
  } = props;
  const [items, setItems] = useState<VacuumPumpStatusItem[]>(data);
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

  const handleSelect = (item: VacuumPumpStatusItem, index: number) => {
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
        changeData: (nextData: VacuumPumpStatusItem[]) => {
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

  return (
    <div
      className={`bizpack-vacuum-pump-status ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div
        className={`bizpack-vacuum-pump-status-list ${
          items.length > 3 ? 'bizpack-vacuum-pump-status-list-scrollable' : ''
        }`}
      >
        {items.map((item, index) => {
          const running = !!item.running;
          const isSelected = !!item.selected;
          const isError = item.status === 'error';

          return (
            <div
              key={item.id || index}
              className={`bizpack-vacuum-pump-status-row ${
                isSelected ? 'bizpack-vacuum-pump-status-row-active' : ''
              }`}
              onClick={() => handleSelect(item, index)}
            >
              <div className="bizpack-vacuum-pump-status-name" title={item.name}>
                <span
                  className={`bizpack-vacuum-pump-status-dot ${
                    isError ? 'bizpack-vacuum-pump-status-dot-error' : ''
                  }`}
                />
                <span className="bizpack-vacuum-pump-status-name-text">{item.name}</span>
              </div>

              <div className="bizpack-vacuum-pump-status-state">
                <span
                  className={`bizpack-vacuum-pump-status-state-dot ${
                    running ? '' : 'bizpack-vacuum-pump-status-state-dot-fault'
                  }`}
                />
                <span
                  className={`bizpack-vacuum-pump-status-state-text ${
                    running ? '' : 'bizpack-vacuum-pump-status-state-text-fault'
                  }`}
                >
                  {running ? '正常' : '故障'}
                </span>
              </div>

              <span className="bizpack-vacuum-pump-status-divider" />

              <button
                type="button"
                className="bizpack-vacuum-pump-status-location"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onLocate) {
                    onLocate(item, index);
                  }
                }}
              >
                <span className="bizpack-vacuum-pump-status-location-icon" />
                <span>定位</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

VacuumPumpStatus.displayName = 'VacuumPumpStatus';
export default VacuumPumpStatus;
