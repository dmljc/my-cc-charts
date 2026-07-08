import * as React from 'react';
import '../jsx-shim';
// createElement is required by tsconfig jsxFactory
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useCallback, useEffect, useRef } from 'react';
import DataMonitoringHeader from '../data-monitoring-header';
import type { DataMonitoringHeaderData } from '../data-monitoring-header/data-monitoring-header';
import DataMonitoringInfo from '../data-monitoring-info';
import type { DataMonitoringInfoItem } from '../data-monitoring-info';
import DataMonitoringLineChart from '../data-monitoring-line-chart';
import type { DataMonitoringLineChartPoint } from '../data-monitoring-line-chart';
import './index.scss';

export interface DataMonitoringCardData {
  id?: string | number;
  header?: DataMonitoringHeaderData;
  info?: DataMonitoringInfoItem[];
  chart?: DataMonitoringLineChartPoint[];
  [key: string]: unknown;
}

export type DataMonitoringScrollMode = 'auto' | 'manual' | 'autoWithManual';

export interface DataMonitoringCardProps {
  data?: DataMonitoringCardData | DataMonitoringCardData[];
  width?: number | string;
  height?: number | string;
  headerHeight?: number;
  infoHeight?: number;
  chartHeight?: number;
  cardGap?: number;
  /** @deprecated 请使用 scrollMode */
  autoScroll?: boolean;
  scrollMode?: DataMonitoringScrollMode;
  scrollDuration?: number;
  /** 手动接管后恢复自动滚动的延迟，单位毫秒，仅 autoWithManual 生效 */
  resumeDelay?: number;
  pauseOnHover?: boolean;
  showScrollbar?: boolean;
  showXAxisLabels?: boolean;
  /** 折线图末端是否展示最新数值标注，默认 true */
  showLatestValue?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const DEFAULT_LIST_HEIGHT = 650;

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

const renderCardContent = (
  data: DataMonitoringCardData | undefined,
  headerHeight: number,
  infoHeight: number,
  chartHeight: number,
  showXAxisLabels: boolean,
  showLatestValue: boolean,
) => (
  <React.Fragment>
    <DataMonitoringHeader
      width="100%"
      height={headerHeight}
      data={data?.header}
      className="bizpack-data-monitoring-card-header"
    />
    <DataMonitoringInfo
      width="100%"
      height={infoHeight}
      data={data?.info}
      className="bizpack-data-monitoring-card-info"
    />
    <DataMonitoringLineChart
      width="100%"
      height={chartHeight}
      data={data?.chart}
      showXAxisLabels={showXAxisLabels}
      showLatestValue={showLatestValue}
      className="bizpack-data-monitoring-card-chart"
    />
  </React.Fragment>
);

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
): DataMonitoringScrollMode => {
  if (scrollMode === 'auto' || scrollMode === 'manual' || scrollMode === 'autoWithManual') {
    return scrollMode;
  }

  if (autoScroll === false || autoScroll === 'false') {
    return 'manual';
  }

  return 'auto';
};

const DataMonitoringCard: React.FC<DataMonitoringCardProps> = function DataMonitoringCard(props) {
  const {
    data,
    width = '100%',
    height,
    headerHeight = 78,
    infoHeight = 60,
    chartHeight = 120,
    cardGap = 16,
    autoScroll,
    scrollMode,
    scrollDuration = 50,
    resumeDelay = 1000,
    pauseOnHover = true,
    showScrollbar = true,
    showXAxisLabels = true,
    showLatestValue = true,
    className = '',
    style = {},
    ...otherProps
  } = props;

  const items = Array.isArray(data) ? data : null;
  const singleData = Array.isArray(data) ? undefined : data;
  const resolvedHeaderHeight = resolveNumber(headerHeight, 78);
  const resolvedInfoHeight = resolveNumber(infoHeight, 60);
  const resolvedChartHeight = resolveNumber(chartHeight, 120);
  const resolvedCardGap = resolveNumber(cardGap, 16);
  const resolvedScrollDuration = resolveNumber(scrollDuration, 50);
  const resolvedResumeDelay = resolveNumber(resumeDelay, 1000);
  const resolvedPauseOnHover = resolveBoolean(pauseOnHover, true);
  const resolvedShowScrollbar = resolveBoolean(showScrollbar, true);
  const resolvedScrollMode = resolveScrollMode(scrollMode, autoScroll);
  const resolvedHeight = resolveNumber(height, DEFAULT_LIST_HEIGHT);
  const isListMode = !!items && items.length > 1;
  const useCssMarquee = isListMode && resolvedScrollMode === 'auto';
  const useJsAutoScroll = isListMode && resolvedScrollMode === 'autoWithManual';
  const useManualOnly = isListMode && resolvedScrollMode === 'manual';
  const shouldDuplicate = useCssMarquee || useJsAutoScroll;
  const showNativeScrollbar = (useManualOnly || useJsAutoScroll) && resolvedShowScrollbar;

  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const hoverPausedRef = useRef(false);
  const userControlUntilRef = useRef(0);
  const lastAutoScrollAtRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

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
    if (!useJsAutoScroll) {
      return;
    }

    userControlUntilRef.current = performance.now() + resolvedResumeDelay;
  }, [resolvedResumeDelay, useJsAutoScroll]);

  const handleUserScroll = useCallback(() => {
    if (!useJsAutoScroll || performance.now() - lastAutoScrollAtRef.current < 80) {
      return;
    }

    userControlUntilRef.current = performance.now() + resolvedResumeDelay;

    if (scrollRef.current) {
      normalizeLoopPosition(scrollRef.current);
    }
  }, [normalizeLoopPosition, resolvedResumeDelay, useJsAutoScroll]);

  useEffect(() => {
    if (!useJsAutoScroll) {
      return undefined;
    }

    hoverPausedRef.current = false;
    userControlUntilRef.current = 0;
    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      const el = scrollRef.current;

      if (el) {
        const loopHeight = el.scrollHeight / 2;
        const isUserControlling = now < userControlUntilRef.current;
        const shouldPause = isUserControlling || (resolvedPauseOnHover && hoverPausedRef.current);

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
  ]);

  const rootDomProps = pickRootDomProps(otherProps);
  const rootStyle: React.CSSProperties = {
    width,
    ...(items ? { height: resolvedHeight } : height !== undefined ? { height } : {}),
    ...(items
      ? {
        '--bizpack-data-monitoring-card-gap': `${resolvedCardGap}px`,
        '--bizpack-data-monitoring-card-scroll-duration': `${resolvedScrollDuration}s`,
      }
      : {}),
    ...style,
  };

  const renderItems = (groupKey: string) => items?.map((item, index) => (
    <div
      key={`${groupKey}-${item.id != null ? String(item.id) : index}`}
      className="bizpack-data-monitoring-card-item"
    >
      {renderCardContent(
        item,
        resolvedHeaderHeight,
        resolvedInfoHeight,
        resolvedChartHeight,
        showXAxisLabels,
        showLatestValue,
      )}
    </div>
  ));

  const scrollClassName = [
    'bizpack-data-monitoring-card-scroll',
    useCssMarquee ? 'bizpack-data-monitoring-card-scroll-auto' : '',
    showNativeScrollbar ? 'bizpack-data-monitoring-card-scroll-visible' : '',
    useCssMarquee || ((useManualOnly || useJsAutoScroll) && !resolvedShowScrollbar)
      ? 'bizpack-data-monitoring-card-scroll-hidden'
      : '',
  ].filter(Boolean).join(' ');

  const listClassName = [
    'bizpack-data-monitoring-card-list',
    useCssMarquee ? 'bizpack-data-monitoring-card-list-marquee' : '',
    useCssMarquee && resolvedPauseOnHover ? 'bizpack-data-monitoring-card-list-pause' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`bizpack-data-monitoring-card ${className}`}
      style={rootStyle}
      {...rootDomProps}
    >
      {items
        ? (
          <div
            ref={useJsAutoScroll ? scrollRef : undefined}
            className={scrollClassName}
            style={showNativeScrollbar ? { overflowY: 'scroll' } : undefined}
            onScroll={useJsAutoScroll ? handleUserScroll : undefined}
            onWheel={useJsAutoScroll ? markUserInteraction : undefined}
            onTouchStart={useJsAutoScroll ? markUserInteraction : undefined}
            onPointerDown={useJsAutoScroll ? markUserInteraction : undefined}
            onMouseEnter={useJsAutoScroll && resolvedPauseOnHover
              ? () => { hoverPausedRef.current = true; }
              : undefined}
            onMouseLeave={useJsAutoScroll && resolvedPauseOnHover
              ? () => { hoverPausedRef.current = false; }
              : undefined}
          >
            <div className={listClassName}>
              {renderItems('primary')}
              {shouldDuplicate ? renderItems('duplicate') : null}
            </div>
          </div>
        )
        : renderCardContent(
          singleData,
          resolvedHeaderHeight,
          resolvedInfoHeight,
          resolvedChartHeight,
          showXAxisLabels,
          showLatestValue,
        )}
    </div>
  );
};

DataMonitoringCard.displayName = 'DataMonitoringCard';
export default DataMonitoringCard;
