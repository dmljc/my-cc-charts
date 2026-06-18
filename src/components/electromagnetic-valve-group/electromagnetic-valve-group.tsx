import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface ElectromagneticValveItem {
  id?: string | number;
  name?: string;
  label?: string;
  open?: boolean;
  status?: 'open' | 'close' | 'on' | 'off' | boolean | number | string;
}

export interface ElectromagneticValveGroupProps {
  title?: string;
  data?: ElectromagneticValveItem[];
  /** 名称对应的数据字段名，默认 'name' */
  nameField?: string;
  /** 标签对应的数据字段名，默认 'label' */
  labelField?: string;
  /** 开关状态对应的数据字段名，默认 'open' */
  openField?: string;
  /** 状态对应的数据字段名，默认 'status' */
  statusField?: string;
  width?: number | string;
  height?: number | string;
  columns?: number;
  style?: React.CSSProperties;
  className?: string;
  onToggle?: (item: ElectromagneticValveItem, nextOpen: boolean, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: ElectromagneticValveItem[]) => void;
  };
}

const defaultData: ElectromagneticValveItem[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `#${index + 1}`,
  open: index !== 1,
}));

const truthyStatusValues = ['open', 'on', 'true', '1', '开启', '开'];

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

const ElectromagneticValveGroup: React.FC<ElectromagneticValveGroupProps> = function ElectromagneticValveGroup(props) {
  const {
    data = defaultData,
    nameField = 'name',
    labelField = 'label',
    openField = 'open',
    statusField = 'status',
    width = 400,
    height = 431,
    columns = 4,
    style = {},
    className = '',
    onToggle,
    ...otherProps
  } = props;
  const [items, setItems] = useState<ElectromagneticValveItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;
  const safeColumns = Math.max(1, columns);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const isValveOpen = (item: ElectromagneticValveItem) => {
    const open = (item as any)[openField];
    const status = (item as any)[statusField];

    if (typeof open === 'boolean') {
      return open;
    }

    if (typeof status === 'boolean') {
      return status;
    }

    if (typeof status === 'number') {
      return status === 1;
    }

    if (typeof status === 'string') {
      return truthyStatusValues.indexOf(status.toLowerCase()) > -1;
    }

    return false;
  };

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: ElectromagneticValveItem[]) => {
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

  const openCount = useMemo(
    () => items.filter((item) => isValveOpen(item)).length,
    [items],
  );
  const closeCount = items.length - openCount;

  const handleToggle = (item: ElectromagneticValveItem, index: number) => {
    console.log('电池阀组-开关切换--item-index', item, index);
    const nextOpen = !isValveOpen(item);
    const nextItems = items.map((current, currentIndex) => (
      currentIndex === index
        ? {
          ...current,
          [openField]: nextOpen,
          [statusField]: nextOpen ? 'open' : 'close',
        }
        : current
    ));

    setItems(nextItems);
    if (onToggle) {
      onToggle(nextItems[index], nextOpen, index);
    }
  };

  return (
    <div
      className={`bizpack-electromagnetic-valve-group ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-electromagnetic-valve-group-summary">
        <span className="bizpack-electromagnetic-valve-group-summary-label">开关数量:</span>
        <span className="bizpack-electromagnetic-valve-group-summary-open">
          {openCount}
          {' '}
          开
        </span>
        <span className="bizpack-electromagnetic-valve-group-summary-close">
          {closeCount}
          {' '}
          关
        </span>
      </div>

      <div
        className="bizpack-electromagnetic-valve-group-grid"
        style={{ gridTemplateColumns: `repeat(${safeColumns}, 1fr)` }}
      >
        {items.map((item, index) => {
          const open = isValveOpen(item);
          const label = (item as any)[labelField] || (item as any)[nameField] || `#${index + 1}`;

          return (
            <button
              key={item.id || index}
              type="button"
              className={`bizpack-electromagnetic-valve-group-card ${
                open ? 'bizpack-electromagnetic-valve-group-card-open' : 'bizpack-electromagnetic-valve-group-card-close'
              }`}
              onClick={() => handleToggle(item, index)}
            >
              <span className="bizpack-electromagnetic-valve-group-card-label">{label}</span>
              <span className="bizpack-electromagnetic-valve-group-card-dot" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

ElectromagneticValveGroup.displayName = 'ElectromagneticValveGroup';
export default ElectromagneticValveGroup;
