import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useRef, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { normalizeListData } from '../../common/perf';
import { DEFAULT_OPERATION_LOG_TEST_DATA } from './test-data';
import './index.scss';

export interface OperationLogItem {
  id?: string | number;
  /** 操作内容 */
  title?: string;
  /** 操作人 */
  operName?: string;
  /** 操作时间 */
  operTime?: string;
  [key: string]: unknown;
}

export interface OperationLogProps {
  data?: OperationLogItem[];
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  /** 操作内容字段名，默认 title */
  titleField?: string;
  /** 操作人字段名，默认 operName */
  operNameField?: string;
  /** 操作时间字段名，默认 operTime */
  operTimeField?: string;
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
    titleField = 'title',
    operNameField = 'operName',
    operTimeField = 'operTime',
    onRowClick,
    ...otherProps
  } = props;

  const [items, setItems] = useState<OperationLogItem[]>(() => normalizeListData(data));
  const itemsRef = useRef<OperationLogItem[]>(items);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  const resolvedWidth = resolveCssSize(width, 400);
  const resolvedHeight = resolveCssSize(height, 200);
  const mountedRef = useRef(false);

  useEffect(() => {
    setItems(normalizeListData(data));
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

          const limited = normalizeListData(nextData);
          itemsRef.current = limited;

          if (!mountedRef.current) {
            return;
          }

          setItems(limited);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeTitleField = titleField || 'title';
  const safeOperNameField = operNameField || 'operName';
  const safeOperTimeField = operTimeField || 'operTime';

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
            title={resolveFieldValue(item, safeTitleField)}
          >
            {resolveFieldValue(item, safeTitleField)}
          </span>
          <span
            className="bizpack-operation-log-cell bizpack-operation-log-cell-name"
            title={`操作人:${resolveFieldValue(item, safeOperNameField)}`}
          >
            {`操作人:${resolveFieldValue(item, safeOperNameField)}`}
          </span>
          <span
            className="bizpack-operation-log-cell bizpack-operation-log-cell-time"
            title={resolveFieldValue(item, safeOperTimeField)}
          >
            {resolveFieldValue(item, safeOperTimeField)}
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
export default React.memo(OperationLog);
