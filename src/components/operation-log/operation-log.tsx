import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { destroy, init } from '../../common/iot';
import { isEditorEnv } from '../../utils';
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

export type OperationLogScrollMode = 'auto' | 'manual' | 'autoWithManual';

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
  /** @deprecated 请使用 scrollMode */
  autoScroll?: boolean;
  scrollMode?: OperationLogScrollMode;
  scrollDuration?: number;
  /** 手动接管后恢复自动滚动的延迟，单位毫秒，仅 autoWithManual 生效 */
  resumeDelay?: number;
  pauseOnHover?: boolean;
  showScrollbar?: boolean;
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

const resolveNumber = (value: unknown, fallback: number) => {
  const normalized = Number(value);

  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
};

const resolveBoolean = (value: unknown, fallback: boolean) => {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return fallback;
};

const resolveScrollMode = (
  scrollMode: unknown,
  autoScroll: unknown,
): OperationLogScrollMode => {
  if (scrollMode === 'auto' || scrollMode === 'manual' || scrollMode === 'autoWithManual') {
    return scrollMode;
  }

  if (autoScroll === false || autoScroll === 'false') {
    return 'manual';
  }

  if (autoScroll === true || autoScroll === 'true') {
    return 'auto';
  }

  return 'autoWithManual';
};

const SCROLLBAR_VISIBLE_STYLE = `
.bizpack-operation-log-scroll-visible {
  scrollbar-width: thin;
  scrollbar-color: rgba(96, 118, 138, 0.72) transparent;
}
.bizpack-operation-log-scroll-visible::-webkit-scrollbar {
  width: 6px;
}
.bizpack-operation-log-scroll-visible::-webkit-scrollbar-thumb {
  background: rgba(96, 118, 138, 0.72);
  border-radius: 999px;
}
.bizpack-operation-log-scroll-visible::-webkit-scrollbar-track {
  background: transparent;
}`;

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
    autoScroll,
    scrollMode,
    scrollDuration = 60,
    resumeDelay = 1000,
    pauseOnHover = true,
    showScrollbar = true,
    onRowClick,
    ...otherProps
  } = props;

  const [items, setItems] = useState<OperationLogItem[]>(data);
  const itemsRef = useRef<OperationLogItem[]>(data);
  const rootDomProps = pickRootDomProps(otherProps);
  const bizRef = useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;

  const resolvedHeight = resolveNumber(height, 200);
  const resolvedScrollDuration = resolveNumber(scrollDuration, 60);
  const resolvedResumeDelay = resolveNumber(resumeDelay, 1000);
  const resolvedPauseOnHover = resolveBoolean(pauseOnHover, true);
  const resolvedShowScrollbar = resolveBoolean(showScrollbar, true);
  const resolvedScrollMode = resolveScrollMode(scrollMode, autoScroll);
  const isDesignMode = isEditorEnv(props);
  const isListMode = items.length > 1;
  const useCssMarquee = isListMode && resolvedScrollMode === 'auto';
  const useJsAutoScroll = isListMode && resolvedScrollMode === 'autoWithManual';
  const useManualOnly = isListMode && resolvedScrollMode === 'manual';
  const shouldDuplicate = useCssMarquee || useJsAutoScroll;
  const showNativeScrollbar = (useManualOnly || useJsAutoScroll) && resolvedShowScrollbar;

  const [useTransformFallback, setUseTransformFallback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const rafRef = useRef<number>();
  const hoverPausedRef = useRef(false);
  const userControlUntilRef = useRef(0);
  const lastAutoScrollAtRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const transformOffsetRef = useRef(0);
  const noOverflowFrameCountRef = useRef(0);

  const effectiveUseJsAutoScroll = useJsAutoScroll && !useTransformFallback;
  const useJsTransformScroll = useJsAutoScroll && useTransformFallback;

  const normalizeLoopPosition = useCallback((el: HTMLDivElement) => {
    const loopHeight = el.scrollHeight / 2;

    if (loopHeight <= 0) {
      return;
    }

    if (el.scrollTop >= loopHeight) {
      el.scrollTop -= loopHeight;
    } else if (el.scrollTop < 0) {
      el.scrollTop += loopHeight;
    }
  }, []);

  const markUserInteraction = useCallback(() => {
    if ((!effectiveUseJsAutoScroll && !useJsTransformScroll) || isDesignMode) {
      return;
    }

    userControlUntilRef.current = performance.now() + resolvedResumeDelay;
  }, [effectiveUseJsAutoScroll, isDesignMode, resolvedResumeDelay, useJsTransformScroll]);

  const handleUserScroll = useCallback(() => {
    if (!effectiveUseJsAutoScroll || performance.now() - lastAutoScrollAtRef.current < 80) {
      return;
    }

    userControlUntilRef.current = performance.now() + resolvedResumeDelay;

    if (scrollRef.current) {
      normalizeLoopPosition(scrollRef.current);
    }
  }, [effectiveUseJsAutoScroll, normalizeLoopPosition, resolvedResumeDelay]);

  const handleMouseEnter = useCallback(() => {
    if (!resolvedPauseOnHover) {
      return;
    }

    hoverPausedRef.current = true;

    if (useCssMarquee && listRef.current) {
      listRef.current.style.animationPlayState = 'paused';
    }
  }, [resolvedPauseOnHover, useCssMarquee]);

  const handleMouseLeave = useCallback(() => {
    if (!resolvedPauseOnHover) {
      return;
    }

    hoverPausedRef.current = false;

    if (useCssMarquee && listRef.current) {
      listRef.current.style.animationPlayState = 'running';
    }
  }, [resolvedPauseOnHover, useCssMarquee]);

  const enableHoverPause = resolvedPauseOnHover
    && (useCssMarquee || effectiveUseJsAutoScroll || useJsTransformScroll);

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
    setUseTransformFallback(false);
    transformOffsetRef.current = 0;
    noOverflowFrameCountRef.current = 0;
  }, [items, resolvedScrollMode]);

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

  useLayoutEffect(() => {
    if (!useJsAutoScroll) {
      return undefined;
    }

    hoverPausedRef.current = false;
    userControlUntilRef.current = 0;
    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      const el = scrollRef.current;
      const listEl = listRef.current;
      const isUserControlling = now < userControlUntilRef.current;
      const shouldPause = isUserControlling || (resolvedPauseOnHover && hoverPausedRef.current);

      if (useTransformFallback && listEl) {
        const loopHeight = listEl.offsetHeight / 2;

        if (!shouldPause && loopHeight > 0) {
          const delta = Math.max(now - lastFrameTimeRef.current, 0);
          const speed = loopHeight / (resolvedScrollDuration * 1000);

          transformOffsetRef.current += speed * delta;

          if (transformOffsetRef.current >= loopHeight) {
            transformOffsetRef.current -= loopHeight;
          }

          listEl.style.transform = `translateY(-${transformOffsetRef.current}px)`;
          lastAutoScrollAtRef.current = now;
        }
      } else if (el) {
        if (el.scrollHeight <= el.clientHeight + 1) {
          noOverflowFrameCountRef.current += 1;

          if (noOverflowFrameCountRef.current > 8) {
            setUseTransformFallback(true);
          }
        } else {
          noOverflowFrameCountRef.current = 0;
        }

        const loopHeight = el.scrollHeight / 2;

        if (isUserControlling) {
          normalizeLoopPosition(el);
        }

        if (!shouldPause && loopHeight > 0) {
          const delta = Math.max(now - lastFrameTimeRef.current, 0);
          const speed = loopHeight / (resolvedScrollDuration * 1000);
          let nextScrollTop = el.scrollTop + speed * delta;

          if (nextScrollTop >= loopHeight) {
            nextScrollTop -= loopHeight;
          }

          el.scrollTop = nextScrollTop;
          lastAutoScrollAtRef.current = now;
        }
      }

      lastFrameTimeRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    items,
    normalizeLoopPosition,
    resolvedPauseOnHover,
    resolvedResumeDelay,
    resolvedScrollDuration,
    useJsAutoScroll,
    useTransformFallback,
  ]);

  const renderRows = (groupKey: string, source: OperationLogItem[]) => (
    <div className="bizpack-operation-log-group">
      {source.map((item, index) => (
        <button
          key={`${groupKey}-${item.id != null ? String(item.id) : index}`}
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

  const scrollClassName = [
    'bizpack-operation-log-scroll',
    useCssMarquee || useJsTransformScroll ? 'bizpack-operation-log-scroll-auto' : '',
    showNativeScrollbar && !useTransformFallback ? 'bizpack-operation-log-scroll-visible' : '',
    useCssMarquee || useTransformFallback || ((useManualOnly || useJsAutoScroll) && !resolvedShowScrollbar)
      ? 'bizpack-operation-log-scroll-hidden'
      : '',
  ].filter(Boolean).join(' ');

  const listClassName = [
    'bizpack-operation-log-list',
    useCssMarquee ? 'bizpack-operation-log-list-marquee' : '',
    useCssMarquee && resolvedPauseOnHover ? 'bizpack-operation-log-list-pause' : '',
  ].filter(Boolean).join(' ');

  const rootStyle = {
    width,
    height: resolvedHeight,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
    '--bizpack-operation-log-scroll-duration': `${resolvedScrollDuration}s`,
    ...style,
  } as React.CSSProperties;

  const scrollStyle: React.CSSProperties = {
    flex: '1 1 0',
    width: '100%',
    height: 0,
    minHeight: 0,
    boxSizing: 'border-box',
    overflowX: 'hidden',
    ...(useCssMarquee || useTransformFallback
      ? { overflowY: 'hidden' }
      : showNativeScrollbar
        ? { overflowY: 'scroll' }
        : { overflowY: 'auto' }),
  };

  const showScrollbarStyles = showNativeScrollbar && !useTransformFallback;

  return (
    <div
      className={`bizpack-operation-log ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      {useCssMarquee ? (
        <style>
          {`@keyframes bizpack-operation-log-scroll-inline {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}
.bizpack-operation-log-list-marquee {
  animation: bizpack-operation-log-scroll-inline var(--bizpack-operation-log-scroll-duration, 60s) linear infinite;
}
.bizpack-operation-log-list-pause:hover {
  animation-play-state: paused;
}`}
        </style>
      ) : null}
      {showScrollbarStyles ? (
        <style>{SCROLLBAR_VISIBLE_STYLE}</style>
      ) : null}
      <div
        ref={isListMode ? scrollRef : undefined}
        className={scrollClassName}
        style={scrollStyle}
        onScroll={effectiveUseJsAutoScroll ? handleUserScroll : undefined}
        onWheel={(effectiveUseJsAutoScroll || useJsTransformScroll) ? markUserInteraction : undefined}
        onTouchStart={(effectiveUseJsAutoScroll || useJsTransformScroll) ? markUserInteraction : undefined}
        onPointerDown={effectiveUseJsAutoScroll && !isDesignMode ? markUserInteraction : undefined}
        onMouseEnter={enableHoverPause ? handleMouseEnter : undefined}
        onMouseLeave={enableHoverPause ? handleMouseLeave : undefined}
      >
        <div ref={isListMode ? listRef : undefined} className={listClassName}>
          {renderRows('primary', items)}
          {shouldDuplicate ? renderRows('duplicate', items) : null}
        </div>
      </div>
    </div>
  );
};

OperationLog.displayName = 'OperationLog';
export default OperationLog;
