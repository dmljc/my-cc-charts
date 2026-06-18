import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface InoutValveItem {
  id?: string | number;
  name?: string;
  label?: string;
  open?: boolean;
  status?: 'open' | 'close' | 'on' | 'off' | boolean | number | string;
  statusText?: string;
}

export interface InoutValveGroupProps {
  title?: string;
  data?: { inletData?: InoutValveItem[]; outletData?: InoutValveItem[] };
  inletData?: InoutValveItem[];
  outletData?: InoutValveItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onToggle?: (item: InoutValveItem, nextOpen: boolean, index: number, type: 'inlet' | 'outlet') => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: { inletData?: InoutValveItem[]; outletData?: InoutValveItem[] }) => void;
  };
}

const defaultInletData: InoutValveItem[] = [
  { id: 'D01', name: 'D01', open: true },
  { id: 'D02', name: 'D02', open: false },
];

const defaultOutletData: InoutValveItem[] = [
  { id: 'D01', name: 'D01', open: true },
  { id: 'D02', name: 'D02', open: false },
];

const truthyStatusValues = ['open', 'on', 'true', '1', '开启', '开', '运行'];
const falsyStatusValues = ['close', 'off', 'false', '0', '关闭', '关', '停止'];

const isValveOpen = (item: InoutValveItem) => {
  if (typeof item.open === 'boolean') {
    return item.open;
  }

  if (typeof item.status === 'boolean') {
    return item.status;
  }

  if (typeof item.status === 'number') {
    return item.status === 1;
  }

  if (typeof item.status === 'string') {
    const normalized = item.status.toLowerCase();
    if (truthyStatusValues.indexOf(normalized) > -1) {
      return true;
    }
    if (falsyStatusValues.indexOf(normalized) > -1) {
      return false;
    }
  }

  return false;
};

const getStatusText = (item: InoutValveItem, open: boolean) => {
  if (item.statusText) {
    return item.statusText;
  }

  if (typeof item.status === 'string') {
    const normalized = item.status.toLowerCase();
    if (truthyStatusValues.indexOf(normalized) === -1 && falsyStatusValues.indexOf(normalized) === -1) {
      return item.status;
    }
  }

  return open ? '运行' : '停止';
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

const InoutValveGroup: React.FC<InoutValveGroupProps> = function InoutValveGroup(props) {
  const {
    data,
    inletData = defaultInletData,
    outletData = defaultOutletData,
    width = 400,
    height = 90,
    style = {},
    className = '',
    onToggle,
    ...otherProps
  } = props;
  const [inletItems, setInletItems] = useState<InoutValveItem[]>(inletData);
  const [outletItems, setOutletItems] = useState<InoutValveItem[]>(outletData);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setInletItems(inletData);
    setOutletItems(outletData);
  }, [inletData, outletData]);

  useEffect(() => {
    if (data) {
      if (Array.isArray(data.inletData)) {
        setInletItems(data.inletData);
      }
      if (Array.isArray(data.outletData)) {
        setOutletItems(data.outletData);
      }
    }
  }, [data]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: { inletData?: InoutValveItem[]; outletData?: InoutValveItem[] }) => {
          if (nextData) {
            if (Array.isArray(nextData.inletData)) {
              setInletItems(nextData.inletData);
            }
            if (Array.isArray(nextData.outletData)) {
              setOutletItems(nextData.outletData);
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

  const handleToggle = (item: InoutValveItem, index: number, type: 'inlet' | 'outlet') => {
    const nextOpen = !isValveOpen(item);
    const targetItems = type === 'inlet' ? inletItems : outletItems;
    const setItems = type === 'inlet' ? setInletItems : setOutletItems;

    const nextItems = targetItems.map((current, currentIndex) =>
      currentIndex === index
        ? {
            ...current,
            open: nextOpen,
            status: nextOpen ? 'open' : 'close',
          }
        : current,
    );

    setItems(nextItems);
    if (onToggle) {
      onToggle(nextItems[index], nextOpen, index, type);
    }
  };

  const renderRows = (items: InoutValveItem[], type: 'inlet' | 'outlet') =>
    items.map((item, index) => {
      const open = isValveOpen(item);
      const name = item.label || item.name || `D0${index + 1}`;
      const statusText = getStatusText(item, open);

      return (
        <button
          key={item.id || index}
          type="button"
          className="bizpack-inout-valve-group-row"
          onClick={() => handleToggle(item, index, type)}
        >
          <span className="bizpack-inout-valve-group-row-name">{name}</span>
          <span
            className={`bizpack-inout-valve-group-row-status ${
              open
                ? 'bizpack-inout-valve-group-row-status-run'
                : 'bizpack-inout-valve-group-row-status-stop'
            }`}
          >
            {statusText}
          </span>
        </button>
      );
    });

  return (
    <div
      className={`bizpack-inout-valve-group ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-inout-valve-group-body">
        <div className="bizpack-inout-valve-group-panel bizpack-inout-valve-group-panel-in">
          <div className="bizpack-inout-valve-group-panel-header">
            <span className="bizpack-inout-valve-group-panel-dot bizpack-inout-valve-group-panel-dot-in" />
            <span className="bizpack-inout-valve-group-panel-title">入口阀</span>
          </div>
          <div className="bizpack-inout-valve-group-panel-list">
            {renderRows(inletItems, 'inlet')}
          </div>
        </div>

        <div className="bizpack-inout-valve-group-divider" />

        <div className="bizpack-inout-valve-group-panel bizpack-inout-valve-group-panel-out">
          <div className="bizpack-inout-valve-group-panel-header">
            <span className="bizpack-inout-valve-group-panel-dot bizpack-inout-valve-group-panel-dot-out" />
            <span className="bizpack-inout-valve-group-panel-title">出口阀</span>
          </div>
          <div className="bizpack-inout-valve-group-panel-list">
            {renderRows(outletItems, 'outlet')}
          </div>
        </div>
      </div>
    </div>
  );
};

InoutValveGroup.displayName = 'InoutValveGroup';
export default InoutValveGroup;
