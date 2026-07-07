import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useRef, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { DEFAULT_OPERATION_LOG_TEST_DATA } from './test-data';
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
    getData: () => OperationLogItem[];
  };
}

const defaultData = DEFAULT_OPERATION_LOG_TEST_DATA as OperationLogItem[];

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

const resolveCssSize = (value: unknown, fallback: number) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === '') {
      return fallback;
    }

    const numeric = Number(trimmed);

    return Number.isFinite(numeric) && numeric > 0 ? numeric : trimmed;
  }

  return fallback;
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
  const itemsRef = useRef<OperationLogItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  const resolvedWidth = resolveCssSize(width, 400);
  const resolvedHeight = resolveCssSize(height, 200);
  const mountedRef = useRef(false);

  useEffect(() => {
    setItems(data);
  }, [data]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: OperationLogItem[]) => {
          if (!Array.isArray(nextData)) {
            return;
          }

          itemsRef.current = nextData;

          if (!mountedRef.current) {
            return;
          }

          setItems(nextData);
        },
        getData: () => itemsRef.current,
      },
    };

    const initFrame = requestAnimationFrame(() => {
      init(props, bizRef, bc);
    });

    return () => {
      cancelAnimationFrame(initFrame);
      destroy(props, bc);
    };
  }, []);

  const renderRows = (source: OperationLogItem[]) => (
    <div className="bizpack-operation-log-group">
      {source.map((item, index) => (
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
            title={`操作人：${resolveFieldValue(item, nameField)}`}
          >
            {`操作人：${resolveFieldValue(item, nameField)}`}
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
  );

  const rootStyle = {
    width: resolvedWidth,
    height: resolvedHeight,
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'column',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
    minHeight: 0,
    overflow: 'hidden',
    ...style,
  } as React.CSSProperties;

  return (
    <div
      className={`bizpack-operation-log ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      <div className="bizpack-operation-log-list">
        {renderRows(items)}
      </div>
    </div>
  );
};

OperationLog.displayName = 'OperationLog';
export default OperationLog;
