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
  pageSize?: number;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onToggle?: (item: MiniValveItem, nextOpen: boolean, index: number) => void;
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

const isValveOpen = (item: MiniValveItem) => {
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
    return truthyStatusValues.indexOf(item.status.toLowerCase()) > -1;
  }

  return false;
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

const MiniElectromagneticValveGroup: React.FC<MiniElectromagneticValveGroupProps> = function MiniElectromagneticValveGroup(props) {
  const {
    data = defaultData,
    pageSize = 4,
    width = 400,
    height = 112,
    style = {},
    className = '',
    onToggle,
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

  const handleToggle = (item: MiniValveItem, index: number) => {
    const globalIndex = currentPageIndex * safePageSize + index;
    const nextOpen = !isValveOpen(item);
    const nextItems = items.map((current, currentIndex) =>
      currentIndex === globalIndex
        ? {
            ...current,
            open: nextOpen,
            status: nextOpen ? 'open' : 'close',
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
            setPageIndex(currentPageIndex - 1);
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
            setPageIndex(currentPageIndex + 1);
          }}
        />

        <div className="bizpack-mini-electromagnetic-valve-group-list">
          {visibleItems.map((item, index) => {
            const open = isValveOpen(item);
            const label = item.label || item.name || `#${currentPageIndex * safePageSize + index + 1}`;

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
