import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface OperationLogItem {
  id?: string | number;
  /** 操作内容 */
  action?: string;
  /** 操作人 */
  name?: string;
  /** 操作时间 */
  time?: string;
  [key: string]: unknown;
}

export interface OperationLogProps {
  data?: OperationLogItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** 操作内容字段名，默认 action */
  actionField?: string;
  /** 操作人字段名，默认 name */
  nameField?: string;
  /** 操作时间字段名，默认 time */
  timeField?: string;
  onRowClick?: (item: OperationLogItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: OperationLogItem[]) => void;
  };
}

const defaultData: OperationLogItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  action: '电磁阀0101开启',
  name: '张三',
  time: '12:12:12',
}));

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

const resolveFieldValue = (item: OperationLogItem, field: string) => {
  const value = item[field];

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
};

const OperationLog: React.FC<OperationLogProps> = function OperationLog(props) {
  const {
    data = defaultData,
    width = 400,
    height = 200,
    style = {},
    className = '',
    actionField = 'action',
    nameField = 'name',
    timeField = 'time',
    onRowClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<OperationLogItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: OperationLogItem[]) => {
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
      className={`bizpack-operation-log ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-operation-log-body">
        {items.map((item, index) => (
          <button
            key={item.id != null ? String(item.id) : index}
            type="button"
            className="bizpack-operation-log-row"
            onClick={() => {
              if (onRowClick) {
                onRowClick(item, index);
              }
            }}
          >
            <span
              className="bizpack-operation-log-cell bizpack-operation-log-cell-action"
              title={resolveFieldValue(item, actionField)}
            >
              {resolveFieldValue(item, actionField)}
            </span>
            <span
              className="bizpack-operation-log-cell bizpack-operation-log-cell-name"
              title={resolveFieldValue(item, nameField)}
            >
              {resolveFieldValue(item, nameField)}
            </span>
            <span
              className="bizpack-operation-log-cell bizpack-operation-log-cell-time"
              title={resolveFieldValue(item, timeField)}
            >
              {resolveFieldValue(item, timeField)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

OperationLog.displayName = 'OperationLog';
export default OperationLog;
