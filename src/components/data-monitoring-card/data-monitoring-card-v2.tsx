import * as React from 'react';
import '../jsx-shim';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataMonitoringHeader from '../data-monitoring-header';
import type { DataMonitoringHeaderData } from '../data-monitoring-header/data-monitoring-header';
import DataMonitoringInfo from '../data-monitoring-info';
import type { DataMonitoringInfoItem } from '../data-monitoring-info';
import DataMonitoringLineChart from '../data-monitoring-line-chart';
import type { DataMonitoringLineChartPoint } from '../data-monitoring-line-chart';
import { destroy, init } from '../../common/iot';
import './index.scss';

export interface DataMonitoringCardData {
  id?: string | number;
  baseInfo?: DataMonitoringHeaderData;
  runtimeParameters?: DataMonitoringInfoItem[];
  tritiumConcentration?: DataMonitoringLineChartPoint[];
  /** @deprecated 请使用 baseInfo */
  header?: DataMonitoringHeaderData;
  /** @deprecated 请使用 runtimeParameters */
  info?: DataMonitoringInfoItem[];
  /** @deprecated 请使用 tritiumConcentration */
  chart?: DataMonitoringLineChartPoint[];
  [key: string]: unknown;
}

interface BizRef {
  chart: {
    changeData: (nextData: DataMonitoringCardData | DataMonitoringCardData[]) => void;
    getData: () => DataMonitoringCardData | DataMonitoringCardData[] | undefined;
  };
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
  resumeDelay?: number;
  pauseOnHover?: boolean;
  showScrollbar?: boolean;
  showLatestValue?: boolean;
  /** 单卡模式是否挂载完整 ECharts；列表模式仅对虚拟窗口内卡片挂载。 */
  mountChart?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

type TickerCallback = (time: number) => void;
const tickerCallbacks = new Set<TickerCallback>();
let tickerId = 0;

const runSharedTicker = (time: number) => {
  tickerId = 0;
  tickerCallbacks.forEach((callback) => callback(time));
  if (tickerCallbacks.size > 0) {
    tickerId = requestAnimationFrame(runSharedTicker);
  }
};

const addSharedTicker = (callback: TickerCallback) => {
  tickerCallbacks.add(callback);
  if (!tickerId) {
    tickerId = requestAnimationFrame(runSharedTicker);
  }
  return () => {
    tickerCallbacks.delete(callback);
    if (tickerCallbacks.size === 0 && tickerId) {
      cancelAnimationFrame(tickerId);
      tickerId = 0;
    }
  };
};

const DEFAULT_LIST_HEIGHT = 650;
const LIST_CHART_MAX_POINTS = 160;
const WINDOW_PAD_PX = 240;
const WINDOW_SYNC_MS = 80;

const resolveNumber = (value: unknown, fallback: number) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
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

const resolveScrollMode = (scrollMode: unknown, autoScroll: unknown): DataMonitoringScrollMode => {
  if (scrollMode === 'auto' || scrollMode === 'manual' || scrollMode === 'autoWithManual') {
    return scrollMode;
  }
  return autoScroll === false || autoScroll === 'false' ? 'manual' : 'auto';
};

const normalizeCardData = (card?: DataMonitoringCardData): DataMonitoringCardData | undefined => {
  if (!card) {
    return card;
  }
  const baseInfo = card.baseInfo ?? card.header;
  const runtimeParameters = card.runtimeParameters ?? card.info;
  const tritiumConcentration = card.tritiumConcentration ?? card.chart;
  if (
    baseInfo === card.baseInfo
    && runtimeParameters === card.runtimeParameters
    && tritiumConcentration === card.tritiumConcentration
  ) {
    return card;
  }
  return { ...card, baseInfo, runtimeParameters, tritiumConcentration };
};

const pickRootDomProps = (props: Record<string, unknown>) => {
  const domProps: Record<string, unknown> = {};
  Object.keys(props).forEach((key) => {
    if (key === 'id' || key === 'role' || key === 'tabIndex' || key.indexOf('data-') === 0 || key.indexOf('aria-') === 0) {
      domProps[key] = props[key];
    }
  });
  return domProps;
};

const getChartData = (card?: DataMonitoringCardData) => {
  const points = card?.tritiumConcentration ?? card?.chart;
  if (!Array.isArray(points)) {
    return [];
  }
  return points.length > LIST_CHART_MAX_POINTS ? points.slice(-LIST_CHART_MAX_POINTS) : points;
};

const hasInfo = (card?: DataMonitoringCardData) => {
  const info = card?.runtimeParameters ?? card?.info;
  return Array.isArray(info) && info.length > 0;
};

const getCardHeight = (
  card: DataMonitoringCardData | undefined,
  headerHeight: number,
  infoHeight: number,
  chartHeight: number,
) => {
  const chartData = getChartData(card);
  return headerHeight
    + (hasInfo(card) ? infoHeight + 12 : 0)
    + (chartData.length > 0 ? chartHeight + 12 : 0);
};

/** 在一轮循环高度内，按真实偏移定位卡片下标（兼容高低不一的卡片）。 */
const findItemIndexByOffset = (offsets: number[], heights: number[], offsetInCycle: number) => {
  if (offsets.length === 0) {
    return 0;
  }
  let low = 0;
  let high = offsets.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const top = offsets[mid];
    const bottom = top + heights[mid];
    if (offsetInCycle < top) {
      high = mid - 1;
    } else if (offsetInCycle >= bottom) {
      low = mid + 1;
    } else {
      return mid;
    }
  }
  return Math.max(0, Math.min(offsets.length - 1, low));
};

interface CardContentProps {
  data?: DataMonitoringCardData;
  headerHeight: number;
  infoHeight: number;
  chartHeight: number;
  showLatestValue: boolean;
  mountChart: boolean;
}

const CardContent: React.FC<CardContentProps> = function CardContent({
  data,
  headerHeight,
  infoHeight,
  chartHeight,
  showLatestValue,
  mountChart,
}) {
  const card = normalizeCardData(data);
  const info = card?.runtimeParameters ?? card?.info;
  const chartData = getChartData(card);
  const hasChartData = chartData.length > 0;

  return (
    <React.Fragment>
      <DataMonitoringHeader
        width="100%"
        height={headerHeight}
        data={card?.baseInfo}
        className="bizpack-data-monitoring-card-header"
      />
      {Array.isArray(info) && info.length > 0 ? (
        <DataMonitoringInfo
          width="100%"
          height={infoHeight}
          data={info}
          className="bizpack-data-monitoring-card-info"
        />
      ) : null}
      {hasChartData && mountChart ? (
        <DataMonitoringLineChart
          width="100%"
          height={chartHeight}
          data={chartData}
          maxPoints={LIST_CHART_MAX_POINTS}
          showXAxisLabels={false}
          showLatestValue={showLatestValue}
          className="bizpack-data-monitoring-card-chart"
        />
      ) : hasChartData ? (
        <div
          className="bizpack-data-monitoring-card-chart bizpack-data-monitoring-card-chart-placeholder"
          style={{ height: chartHeight }}
          aria-hidden="true"
        />
      ) : null}
    </React.Fragment>
  );
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
    showLatestValue = true,
    mountChart = true,
    className = '',
    style = {},
    ...otherProps
  } = props;
  const [sourceData, setSourceData] = useState(data);
  const sourceDataRef = useRef(sourceData);
  const bizRef = useRef<BizRef | null>(null);
  const bc: BroadcastChannel = null as unknown as BroadcastChannel;
  const items = Array.isArray(sourceData) ? sourceData : null;
  const isListMode = !!items && items.length > 1;
  const singleData = Array.isArray(sourceData)
    ? (sourceData.length === 1 ? sourceData[0] : undefined)
    : sourceData;
  const resolvedHeaderHeight = resolveNumber(headerHeight, 78);
  const resolvedInfoHeight = resolveNumber(infoHeight, 60);
  const resolvedChartHeight = resolveNumber(chartHeight, 120);
  const resolvedGap = resolveNumber(cardGap, 16);
  const resolvedHeight = resolveNumber(height, DEFAULT_LIST_HEIGHT);
  const resolvedDuration = resolveNumber(scrollDuration, 50);
  const resolvedResumeDelay = resolveNumber(resumeDelay, 1000);
  const resolvedShowScrollbar = resolveBoolean(showScrollbar, true);
  const resolvedPauseOnHover = resolveBoolean(pauseOnHover, true);
  const resolvedShowLatestValue = resolveBoolean(showLatestValue, true);
  const resolvedMountChart = resolveBoolean(mountChart, true);
  const resolvedMode = resolveScrollMode(scrollMode, autoScroll);
  const canAutoScroll = isListMode && resolvedMode !== 'manual';
  const canManualControl = isListMode && resolvedMode !== 'auto';
  const rootDomProps = pickRootDomProps(otherProps);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const lastTickRef = useRef(0);
  const manualUntilRef = useRef(0);
  const hoverPausedRef = useRef(false);
  const lastWindowSyncRef = useRef(0);
  const touchYRef = useRef<number | null>(null);
  const [viewportHeight, setViewportHeight] = useState(resolvedHeight);
  const [windowRange, setWindowRange] = useState({ start: 0, end: 0 });

  useEffect(() => {
    setSourceData(data);
  }, [data]);

  useEffect(() => {
    sourceDataRef.current = sourceData;
  }, [sourceData]);

  useEffect(() => {
    bizRef.current = {
      chart: {
        changeData: (nextData) => {
          setSourceData(nextData);
        },
        getData: () => sourceDataRef.current,
      },
    };
    init(props, bizRef, bc);
    return () => {
      destroy(props, bc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = useMemo(() => {
    const list = items || [];
    const heights = list.map((item) => getCardHeight(
      item,
      resolvedHeaderHeight,
      resolvedInfoHeight,
      resolvedChartHeight,
    ));
    const offsets: number[] = [];
    let cursor = 0;
    heights.forEach((itemHeight, index) => {
      offsets.push(cursor);
      cursor += itemHeight;
      if (index < heights.length - 1) {
        cursor += resolvedGap;
      }
    });
    // 循环缝合处补一个间距，保证末卡与首卡视觉间距一致
    const cycleHeight = list.length > 0 ? cursor + resolvedGap : 0;
    return { heights, offsets, cycleHeight };
  }, [items, resolvedChartHeight, resolvedGap, resolvedHeaderHeight, resolvedInfoHeight]);

  const syncAutoScrollingAttr = useCallback((scrolling: boolean) => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }
    element.setAttribute('data-bizpack-auto-scrolling', scrolling ? '1' : '0');
  }, []);

  const syncTrack = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(0, ${-offsetRef.current}px, 0)`;
    }
  }, []);

  const syncScrollbar = useCallback(() => {
    const thumb = scrollbarThumbRef.current;
    if (!thumb || metrics.cycleHeight <= viewportHeight) {
      return;
    }
    const thumbHeight = Math.max(24, Math.min(viewportHeight, (viewportHeight * viewportHeight) / metrics.cycleHeight));
    const trackHeight = Math.max(viewportHeight - thumbHeight, 0);
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translate3d(0, ${trackHeight * (offsetRef.current / metrics.cycleHeight)}px, 0)`;
  }, [metrics.cycleHeight, viewportHeight]);

  const syncVirtualWindow = useCallback((force = false) => {
    if (!items || items.length === 0 || metrics.cycleHeight <= 0) {
      return;
    }
    const now = Date.now();
    if (!force && now - lastWindowSyncRef.current < WINDOW_SYNC_MS) {
      return;
    }
    lastWindowSyncRef.current = now;

    const viewTop = offsetRef.current - WINDOW_PAD_PX;
    const viewBottom = offsetRef.current + viewportHeight + WINDOW_PAD_PX;
    const startCycle = Math.floor(viewTop / metrics.cycleHeight);
    const endCycle = Math.floor(Math.max(viewBottom - 0.1, viewTop) / metrics.cycleHeight);

    let startIndexInCycle = 0;
    let endIndexInCycle = items.length - 1;
    if (startCycle === endCycle) {
      const localTop = ((viewTop % metrics.cycleHeight) + metrics.cycleHeight) % metrics.cycleHeight;
      const localBottom = ((viewBottom % metrics.cycleHeight) + metrics.cycleHeight) % metrics.cycleHeight;
      startIndexInCycle = findItemIndexByOffset(metrics.offsets, metrics.heights, localTop);
      endIndexInCycle = findItemIndexByOffset(metrics.offsets, metrics.heights, Math.max(localBottom - 0.1, localTop));
      const start = startCycle * items.length + startIndexInCycle;
      const end = startCycle * items.length + endIndexInCycle;
      setWindowRange((current) => (current.start === start && current.end === end ? current : { start, end }));
      return;
    }

    // 跨越循环边界：从 startCycle 的命中卡一直铺到 endCycle 的命中卡
    startIndexInCycle = findItemIndexByOffset(
      metrics.offsets,
      metrics.heights,
      ((viewTop % metrics.cycleHeight) + metrics.cycleHeight) % metrics.cycleHeight,
    );
    endIndexInCycle = findItemIndexByOffset(
      metrics.offsets,
      metrics.heights,
      ((viewBottom % metrics.cycleHeight) + metrics.cycleHeight) % metrics.cycleHeight,
    );
    const start = startCycle * items.length + startIndexInCycle;
    const end = endCycle * items.length + endIndexInCycle;
    setWindowRange((current) => (current.start === start && current.end === end ? current : { start, end }));
  }, [items, metrics, viewportHeight]);

  const setOffset = useCallback((nextOffset: number, forceWindowSync = false) => {
    if (metrics.cycleHeight <= 0) {
      return;
    }
    const normalized = ((nextOffset % metrics.cycleHeight) + metrics.cycleHeight) % metrics.cycleHeight;
    offsetRef.current = normalized;
    syncTrack();
    syncScrollbar();
    syncVirtualWindow(forceWindowSync);
  }, [metrics.cycleHeight, syncScrollbar, syncTrack, syncVirtualWindow]);

  useEffect(() => {
    offsetRef.current = 0;
    syncTrack();
    syncScrollbar();
    syncVirtualWindow(true);
    syncAutoScrollingAttr(canAutoScroll && !hoverPausedRef.current);
  }, [canAutoScroll, metrics.cycleHeight, syncAutoScrollingAttr, syncScrollbar, syncTrack, syncVirtualWindow]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element || !isListMode) {
      return undefined;
    }
    const updateHeight = () => {
      const nextHeight = element.clientHeight || resolvedHeight;
      setViewportHeight((current) => (current === nextHeight ? current : nextHeight));
    };
    updateHeight();
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateHeight);
      observer.observe(element);
    }
    window.addEventListener('resize', updateHeight);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [isListMode, resolvedHeight]);

  useEffect(() => {
    syncScrollbar();
  }, [syncScrollbar]);

  const takeManualControl = useCallback((delta: number) => {
    if (!canManualControl) {
      return;
    }
    manualUntilRef.current = performance.now() + resolvedResumeDelay;
    setOffset(offsetRef.current + delta, true);
  }, [canManualControl, resolvedResumeDelay, setOffset]);

  // React 的 onWheel/onTouchMove 是 passive，不能 preventDefault；改用原生非被动监听。
  useEffect(() => {
    const element = viewportRef.current;
    if (!element || !canManualControl) {
      return undefined;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      takeManualControl(event.deltaY);
    };

    const onTouchStart = (event: TouchEvent) => {
      touchYRef.current = event.touches[0] ? event.touches[0].clientY : null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || touchYRef.current === null) {
        return;
      }
      event.preventDefault();
      takeManualControl(touchYRef.current - touch.clientY);
      touchYRef.current = touch.clientY;
    };

    const onTouchEnd = () => {
      touchYRef.current = null;
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd, { passive: true });
    element.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [canManualControl, takeManualControl]);

  useEffect(() => {
    if (!canAutoScroll || metrics.cycleHeight <= viewportHeight) {
      return undefined;
    }
    const removeTicker = addSharedTicker((now) => {
      if (!lastTickRef.current) {
        lastTickRef.current = now;
        return;
      }
      const elapsed = Math.min(now - lastTickRef.current, 100);
      lastTickRef.current = now;
      if (hoverPausedRef.current || now < manualUntilRef.current) {
        return;
      }
      setOffset(offsetRef.current + (metrics.cycleHeight / (resolvedDuration * 1000)) * elapsed);
    });
    return () => {
      lastTickRef.current = 0;
      removeTicker();
    };
  }, [canAutoScroll, metrics.cycleHeight, resolvedDuration, setOffset, viewportHeight]);

  const slots = useMemo(() => {
    if (!items || items.length === 0 || metrics.cycleHeight <= 0) {
      return [];
    }
    const count = items.length;
    const slotsInWindow: Array<{ virtualIndex: number; itemIndex: number; top: number }> = [];
    const start = windowRange.start;
    const end = Math.max(windowRange.end, windowRange.start);
    for (let virtualIndex = start; virtualIndex <= end; virtualIndex += 1) {
      const itemIndex = ((virtualIndex % count) + count) % count;
      const cycle = Math.floor(virtualIndex / count);
      const top = cycle * metrics.cycleHeight + metrics.offsets[itemIndex];
      slotsInWindow.push({ virtualIndex, itemIndex, top });
    }
    return slotsInWindow;
  }, [items, metrics, windowRange]);

  const rootStyle: React.CSSProperties = {
    width,
    ...(isListMode ? { height: resolvedHeight } : height !== undefined ? { height } : {}),
    ...style,
  };

  if (!isListMode) {
    return (
      <div className={`bizpack-data-monitoring-card ${className}`} style={rootStyle} {...rootDomProps}>
        <CardContent
          data={singleData}
          headerHeight={resolvedHeaderHeight}
          infoHeight={resolvedInfoHeight}
          chartHeight={resolvedChartHeight}
          showLatestValue={resolvedShowLatestValue}
          mountChart={resolvedMountChart}
        />
      </div>
    );
  }

  return (
    <div className={`bizpack-data-monitoring-card ${className}`} style={rootStyle} {...rootDomProps}>
      <div
        ref={viewportRef}
        className="bizpack-data-monitoring-card-scroll bizpack-data-monitoring-card-virtual-scroll"
        data-bizpack-auto-scrolling={canAutoScroll ? '1' : '0'}
        onMouseEnter={resolvedPauseOnHover && canAutoScroll ? () => {
          hoverPausedRef.current = true;
          syncAutoScrollingAttr(false);
        } : undefined}
        onMouseLeave={resolvedPauseOnHover && canAutoScroll ? () => {
          hoverPausedRef.current = false;
          syncAutoScrollingAttr(true);
        } : undefined}
      >
        <div ref={trackRef} className="bizpack-data-monitoring-card-list bizpack-data-monitoring-card-virtual-track">
          {slots.map((slot) => (
            <div
              key={slot.virtualIndex}
              className="bizpack-data-monitoring-card-item bizpack-data-monitoring-card-virtual-item"
              style={{ top: slot.top, height: metrics.heights[slot.itemIndex] }}
            >
              <CardContent
                data={items[slot.itemIndex]}
                headerHeight={resolvedHeaderHeight}
                infoHeight={resolvedInfoHeight}
                chartHeight={resolvedChartHeight}
                showLatestValue={resolvedShowLatestValue}
                mountChart={resolvedMountChart}
              />
            </div>
          ))}
        </div>
        {resolvedShowScrollbar && resolvedMode !== 'auto' && metrics.cycleHeight > viewportHeight ? (
          <div className="bizpack-data-monitoring-card-virtual-scrollbar" aria-hidden="true">
            <div ref={scrollbarThumbRef} className="bizpack-data-monitoring-card-virtual-scrollbar-thumb" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

DataMonitoringCard.displayName = 'DataMonitoringCard';
export default DataMonitoringCard;
