import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useEffect, useMemo, useState } from 'react';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface MiniValveItem {
  id?: string | number;
  name?: string;
  label?: string;
  open?: boolean;
  status?: 'open' | 'close' | 'on' | 'off' | boolean | number | string;
}

export interface MiniElectromagneticValveGroupProps {
  title?: string;
  data?: MiniValveItem[];
  /** 名称对应的数据字段名，默认 'name' */
  nameField?: string;
  /** 标签对应的数据字段名，默认 'label' */
  labelField?: string;
  /** 开关状态对应的数据字段名，默认 'open' */
  openField?: string;
  /** 状态对应的数据字段名，默认 'status' */
  statusField?: string;
  pageSize?: number;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onToggle?: (item: MiniValveItem, nextOpen: boolean, index: number) => void;
  onPageChange?: (pageIndex: number, pageSize: number, visibleItems: MiniValveItem[]) => void;
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: MiniValveItem[]) => void;
  };
}

const defaultData: MiniValveItem[] = Array.from({ length: 12 }, (_, index) => ({
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

const MiniElectromagneticValveGroup: React.FC<MiniElectromagneticValveGroupProps> = function MiniElectromagneticValveGroup(props) {
  const {
    data = defaultData,
    nameField = 'name',
    labelField = 'label',
    openField = 'open',
    statusField = 'status',
    pageSize = 4,
    width = 400,
    height = 112,
    style = {},
    className = '',
    onToggle,
    onPageChange,
    ...otherProps
  } = props;
  const [items, setItems] = useState<MiniValveItem[]>(data);
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
  const isValveOpen = (item: MiniValveItem) => {
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

  const openCount = useMemo(
    () => items.filter((item) => isValveOpen(item)).length,
    [items],
  );
  const closeCount = items.length - openCount;

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
        changeData: (nextData: MiniValveItem[]) => {
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

  const handlePageChange = (nextPage: number) => {
    setPageIndex(nextPage);
    if (onPageChange) {
      const start = nextPage * safePageSize;
      const pageItems = items.slice(start, start + safePageSize);
      onPageChange(nextPage, safePageSize, pageItems);
    }
  };

  const handleToggle = (item: MiniValveItem, index: number) => {
    const globalIndex = currentPageIndex * safePageSize + index;
    const nextOpen = !isValveOpen(item);
    const nextItems = items.map((current, currentIndex) =>
      currentIndex === globalIndex
        ? {
            ...current,
            [openField]: nextOpen,
            [statusField]: nextOpen ? 'open' : 'close',
          }
        : current,
    );

    setItems(nextItems);
    if (onToggle) {
      onToggle(nextItems[globalIndex], nextOpen, globalIndex);
    }
  };

  return (
    <div
      className={`bizpack-mini-electromagnetic-valve-group ${className}`}
      style={{ width, height, ...style }}
      {...rootDomProps}
    >
      <div className="bizpack-mini-electromagnetic-valve-group-summary">
        <span className="bizpack-mini-electromagnetic-valve-group-summary-label">开关数量:</span>
        <span className="bizpack-mini-electromagnetic-valve-group-summary-open">
          {openCount}
          {' '}
          开
        </span>
        <span className="bizpack-mini-electromagnetic-valve-group-summary-close">
          {closeCount}
          {' '}
          关
        </span>
      </div>

      <div className="bizpack-mini-electromagnetic-valve-group-content">
        <button
          type="button"
          className={`bizpack-mini-electromagnetic-valve-group-page bizpack-mini-electromagnetic-valve-group-page-prev ${
            canGoPrev ? '' : 'bizpack-mini-electromagnetic-valve-group-page-disabled'
          }`}
          disabled={!canGoPrev}
          onClick={() => {
            if (!canGoPrev) {
              return;
            }
            handlePageChange(currentPageIndex - 1);
          }}
        />
        <button
          type="button"
          className={`bizpack-mini-electromagnetic-valve-group-page bizpack-mini-electromagnetic-valve-group-page-next ${
            canGoNext ? '' : 'bizpack-mini-electromagnetic-valve-group-page-disabled'
          }`}
          disabled={!canGoNext}
          onClick={() => {
            if (!canGoNext) {
              return;
            }
            handlePageChange(currentPageIndex + 1);
          }}
        />

        <div className="bizpack-mini-electromagnetic-valve-group-list">
          {visibleItems.map((item, index) => {
            const open = isValveOpen(item);
            const label = (item as any)[labelField] || (item as any)[nameField] || `#${currentPageIndex * safePageSize + index + 1}`;

            return (
              <button
                key={item.id || index}
                type="button"
                className={`bizpack-mini-electromagnetic-valve-group-card ${
                  open
                    ? 'bizpack-mini-electromagnetic-valve-group-card-open'
                    : 'bizpack-mini-electromagnetic-valve-group-card-close'
                }`}
                onClick={() => handleToggle(item, index)}
              >
                <span className="bizpack-mini-electromagnetic-valve-group-card-label">{label}</span>
                <span className="bizpack-mini-electromagnetic-valve-group-card-dot" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

MiniElectromagneticValveGroup.displayName = 'MiniElectromagneticValveGroup';
export default MiniElectromagneticValveGroup;
