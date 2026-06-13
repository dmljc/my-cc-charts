import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface OperationAlarmItem {
  id?: string | number;
  name: string;
  status?: 'alarm' | 'normal' | string;
}

export interface OperationAlarmProps {
  title?: string;
  data?: OperationAlarmItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onItemClick?: (item: OperationAlarmItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: OperationAlarmItem[]) => void;
  };
}

const defaultData: OperationAlarmItem[] = [
  { id: 1, name: '取取样泵01-停止故障', status: 'alarm' },
  { id: 2, name: '取取样泵01-停止故障', status: 'alarm' },
  { id: 3, name: '取取样泵01-停止故障', status: 'alarm' },
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

const OperationAlarm: React.FC<OperationAlarmProps> = function OperationAlarm(props) {
  const {
    data = defaultData,
    width = 400,
    height = 171,
    style = {},
    className = '',
    onItemClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<OperationAlarmItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: OperationAlarmItem[]) => {
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
      className={`bizpack-operation-alarm ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-operation-alarm-panel">
        <div className="bizpack-operation-alarm-list">
          {items.map((item, index) => (
            <button
              key={item.id || index}
              type="button"
              className="bizpack-operation-alarm-row"
              onClick={() => {
                if (onItemClick) {
                  onItemClick(item, index);
                }
              }}
            >
              <span className="bizpack-operation-alarm-dot" />
              <span className="bizpack-operation-alarm-name" title={item.name}>{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

OperationAlarm.displayName = 'OperationAlarm';
export default OperationAlarm;
