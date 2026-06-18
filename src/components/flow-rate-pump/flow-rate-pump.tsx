import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface FlowRatePumpItem {
  id?: string | number;
  name: string;
  value: number | string;
}

export interface FlowRatePumpProps {
  title?: string;
  data?: FlowRatePumpItem[];
  pageSize?: number;
  /** 标签对应的数据字段名，默认 'name' */
  labelField?: string;
  /** 数值对应的数据字段名，默认 'value' */
  valueField?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onPrev?: (pageIndex: number) => void;
  onNext?: (pageIndex: number) => void;
  onPumpClick?: (item: FlowRatePumpItem, index: number) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: FlowRatePumpItem[]) => void;
  };
}

const defaultData: FlowRatePumpItem[] = [
  { id: 1, name: '取样泵1', value: 192.1 },
  { id: 2, name: '取样泵2', value: 0.0 },
  { id: 3, name: '取样泵3', value: 0.0 },
  { id: 4, name: '取样泵4', value: 156.8 },
  { id: 5, name: '取样泵5', value: 88.2 },
  { id: 6, name: '取样泵6', value: 0.0 },
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

const FlowRatePump: React.FC<FlowRatePumpProps> = function FlowRatePump(props) {
  const {
    data = defaultData,
    pageSize = 3,
    labelField = 'name',
    valueField = 'value',
    width = 400,
    height = 92,
    style = {},
    className = '',
    onPrev,
    onNext,
    onPumpClick,
    ...otherProps
  } = props;
  const [items, setItems] = useState<FlowRatePumpItem[]>(data);
  const [pageIndex, setPageIndex] = useState(0);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = React.useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null;
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPageIndex = Math.min(pageIndex, totalPages - 1);
  const visibleItems = items.slice(
    currentPageIndex * safePageSize,
    currentPageIndex * safePageSize + safePageSize,
  );
  const canGoPrev = currentPageIndex > 0;
  const canGoNext = currentPageIndex < totalPages - 1;

  useEffect(() => {
    setItems(data);
    setPageIndex(0);
  }, [data]);

  useEffect(() => {
    if (pageIndex > totalPages - 1) {
      setPageIndex(Math.max(totalPages - 1, 0));
    }
  }, [pageIndex, totalPages]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData: FlowRatePumpItem[]) => {
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
      className={`bizpack-flow-rate-pump ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-flow-rate-pump-content">
        <button
          type="button"
          className={`bizpack-flow-rate-pump-page bizpack-flow-rate-pump-page-prev ${
            canGoPrev ? '' : 'bizpack-flow-rate-pump-page-disabled'
          }`}
          disabled={!canGoPrev}
          onClick={() => {
            if (!canGoPrev) {
              return;
            }
            const nextPageIndex = currentPageIndex - 1;
            setPageIndex(nextPageIndex);
            if (onPrev) {
              onPrev(nextPageIndex);
            }
          }}
        />
        <button
          type="button"
          className={`bizpack-flow-rate-pump-page bizpack-flow-rate-pump-page-next ${
            canGoNext ? '' : 'bizpack-flow-rate-pump-page-disabled'
          }`}
          disabled={!canGoNext}
          onClick={() => {
            if (!canGoNext) {
              return;
            }
            const nextPageIndex = currentPageIndex + 1;
            setPageIndex(nextPageIndex);
            if (onNext) {
              onNext(nextPageIndex);
            }
          }}
        />

        <div className="bizpack-flow-rate-pump-list">
          {visibleItems.map((item, index) => {
            const absoluteIndex = currentPageIndex * safePageSize + index;

            return (
              <button
                key={item.id || absoluteIndex}
                type="button"
                className="bizpack-flow-rate-pump-item"
                onClick={() => {
                  if (onPumpClick) {
                    onPumpClick(item, absoluteIndex);
                  }
                }}
              >
                <span className="bizpack-flow-rate-pump-value">
                  {formatValue((item as any)[valueField])}
                </span>
                <span className="bizpack-flow-rate-pump-name">{(item as any)[labelField]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

FlowRatePump.displayName = 'FlowRatePump';
export default FlowRatePump;
